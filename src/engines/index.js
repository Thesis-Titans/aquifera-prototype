/**
 * AQUIFERA Multi-Engine Pipeline & NIST AI RMF 1.0 Fallback Manager
 *
 * Central dispatcher providing unified access to:
 * 1. 'analytical': Theis (1935) + Terzaghi (1925) analytical solution
 * 2. 'reference': USGS MODFLOW 6.8.1 CSUB finite-difference numerical baseline proxy
 * 3. 'pino': Physics-Informed Neural Operator (FNO-3D) surrogate probe
 *
 * Automated Fallback Contract (NIST AI RMF 1.0):
 * When running 'pino', if the normalized residual metric eta exceeds safety threshold
 * tau = 0.15, the pipeline automatically substitutes the verified MODFLOW 6 reference
 * proxy, setting fallbackEngaged: true and recording transparent provenance.
 */
import analyticalEngine, { ENGINE_ID as ANALYTICAL_ID } from './analyticalEngine.js';
import referenceEngine, { ENGINE_ID as REFERENCE_ID } from './referenceEngine.js';
import pinoEngine, { ENGINE_ID as PINO_ID } from './pinoEngine.js';
import { computeResidual, gateResidual, DEFAULT_RESIDUAL_THRESHOLD } from '../physics/residual.js';

export const ENGINES = {
  [ANALYTICAL_ID]: analyticalEngine,
  [REFERENCE_ID]: referenceEngine,
  [PINO_ID]: pinoEngine
};

export const DEFAULT_ENGINE = ANALYTICAL_ID;

/**
 * Returns descriptive list of available simulation engines with accurate provenance.
 */
export function listEngines() {
  return [
    {
      id: ANALYTICAL_ID,
      name: 'Theis + Terzaghi (Analytical)',
      shortName: 'Analytical',
      category: 'Closed-Form',
      latency: '~2 ms',
      provenance: 'In-browser analytical solution (Theis, 1935; Terzaghi, 1925)',
      isReference: false,
      isSurrogate: false,
      isProxy: false
    },
    {
      id: PINO_ID,
      name: 'PINO 3D Surrogate Probe',
      shortName: 'PINO Probe',
      category: 'Neural Operator',
      latency: '< 250 ms (spec)',
      provenance: 'PINO 3D surrogate forward probe structured around proposal target criteria',
      isReference: false,
      isSurrogate: true,
      isProbe: true
    },
    {
      id: REFERENCE_ID,
      name: 'MODFLOW 6 CSUB Baseline Proxy',
      shortName: 'MODFLOW 6 Proxy',
      category: 'Finite-Difference',
      latency: '22.5 s (pilot median)',
      provenance: 'Finite-difference numerical baseline proxy calibrated against 20 LHS feasibility runs',
      isReference: true,
      isSurrogate: false,
      isProxy: true
    }
  ];
}

/**
 * Resolves an engine by identifier.
 *
 * @param {string} engineId
 * @returns {Object} Engine module
 */
export function getEngine(engineId) {
  return ENGINES[engineId] || ENGINES[DEFAULT_ENGINE];
}

/**
 * Evaluates the groundwater simulation pipeline with automated residual gating.
 *
 * @param {string} engineId Target engine ('analytical', 'reference', 'pino')
 * @param {Object} params Scenario parameters
 * @param {Object} [options] Execution options
 * @returns {Object} Physical state with attached residual diagnostics and fallback telemetry
 */
export function evaluateWithEngine(engineId, params, options = {}) {
  const targetEngineId = ENGINES[engineId] ? engineId : DEFAULT_ENGINE;
  const targetEngine = ENGINES[targetEngineId];
  const isSurrogate = targetEngineId === PINO_ID;

  // Primary evaluation pass
  const result = targetEngine.evaluate(params, options);

  // Compute discrete PDE flow continuity and Terzaghi geomechanical residuals
  const residual = computeResidual(result, params);
  const threshold = options.residualThreshold ?? DEFAULT_RESIDUAL_THRESHOLD;
  const gate = gateResidual(residual.rawEta, threshold, isSurrogate);

  // NIST AI RMF 1.0 Automated Fallback Logic:
  // If running surrogate and residual tolerance is violated, fallback to verified numerical reference baseline
  if (isSurrogate && gate.status === 'FALLBACK') {
    const fallbackResult = referenceEngine.evaluate(params, options);
    const fallbackResidual = computeResidual(fallbackResult, params);

    return {
      ...fallbackResult,
      // Retain surrogate fields for transparent discrepancy inspection
      surrogateState: {
        displacementGrid: result.displacementGrid,
        headGrid: result.headGrid,
        maxSubsidenceCm: result.maxSubsidenceCm,
        minHead: result.minHead
      },
      residual: fallbackResidual,
      gate: {
        ...gate,
        fallbackEngaged: true,
        originalEngineId: PINO_ID,
        breachingEta: residual.eta,
        threshold
      },
      meta: {
        ...fallbackResult.meta,
        fallbackEngaged: true,
        originalEngineId: PINO_ID,
        fallbackReason: gate.reason,
        activeEngineId: REFERENCE_ID,
        originalEta: residual.eta,
        breachingThreshold: threshold
      }
    };
  }

  return {
    ...result,
    residual,
    gate: {
      ...gate,
      fallbackEngaged: false
    },
    meta: {
      ...result.meta,
      fallbackEngaged: false,
      activeEngineId: targetEngineId,
      eta: residual.eta
    }
  };
}

export {
  analyticalEngine,
  referenceEngine,
  pinoEngine
};
