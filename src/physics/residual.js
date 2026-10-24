/**
 * AQUIFERA Discrete PDE Mass-Balance & Terzaghi Residual Evaluator
 *
 * Implements physics-informed residual evaluation and automated fallback governance
 * aligned with the NIST AI Risk Management Framework 1.0 (MEASURE 2.6, MANAGE 2.4).
 *
 * Governing Equations:
 * 1. Discrete 2D Groundwater Flow Continuity (Laplace + Storage Flux):
 *    R_flow(i, j) = T * Lap(h) - S * (dh/dt)
 *    evaluated on interior cells outside the 2-cell radius of wellhead singularities.
 *
 * 2. 1-D Terzaghi Skeletal Compaction Consistency (USGS CSUB):
 *    R_comp(i, j) = Delta_b_actual(i, j) - Delta_b_constitutive(h_center)
 *    evaluated via the canonical constitutive compaction function.
 *
 * Trust Metric eta in [0.0, 1.0]:
 * - Analytical & MODFLOW 6 Reference Proxy: eta < 0.03 (strictly physical baseline)
 * - Nominal PINO 3D Surrogate Probe: eta ~ 0.03 - 0.06 <= tau = 0.15 (trusted surrogate)
 * - Perturbed / Non-physical Anomalies: eta > 0.15 (triggers automated fallback)
 *
 * Academic Governance & Honesty:
 * - Reference solutions are finite-difference numerical approximations, NOT ground truth.
 * - Benchmarking constitutes numerical verification under ISO/IEC 25010, NOT field validation.
 */
import {
  DOMAIN,
  HYDRO_PARAMS,
  LHS_ENVELOPE,
  computeConstitutiveCompaction
} from './groundwaterPhysics.js';

export const DEFAULT_RESIDUAL_THRESHOLD = 0.15; // tau = 0.15 per Proposal Table 1

/**
 * Computes discrete PDE flow continuity and Terzaghi geomechanical residuals.
 *
 * @param {Object} physicalState Result of evaluate() from any engine
 * @param {Object} [params] Scenario parameters used to generate the state
 * @returns {Object} Comprehensive residual diagnostics and normalized trust metric eta
 */
export function computeResidual(physicalState, params = {}) {
  const {
    displacementGrid,
    headGrid,
    resolution = DOMAIN.gridResolution,
    wells = [],
    pumpingDays = 180
  } = physicalState;

  const res = resolution;
  const dx = DOMAIN.widthMeters / (res - 1); // ~50.79 m
  const dx2 = dx * dx;

  const h0 = HYDRO_PARAMS.initialHead; // 95 m
  const K = params.hydraulicConductivity ?? 15;
  const Ss = params.specificStorage ?? 0.0001;
  const T = Math.max(50, K * 30);
  const S = Math.max(1e-5, Ss * 40);
  const dt = Math.max(1, pumpingDays);

  // Check input parameters against Latin Hypercube experimental envelope bounds
  const pumpingRate = params.pumpingRate ?? physicalState.pumpingRate ?? 12000;
  const isInputOutOfEnvelope = pumpingRate < LHS_ENVELOPE.minPumpingRate || pumpingRate > LHS_ENVELOPE.maxPumpingRate;

  let compDiffSq = 0;
  let compRefSq = 0;
  let flowDiffSq = 0;
  let flowScaleSq = 0;
  let maxAbsFlowResidual = 0;
  let maxAbsCompResidualM = 0;
  let evaluatedCells = 0;

  // Well center coordinates for 2-cell radius exclusion of logarithmic singularities
  const wellCols = wells.map(w => Math.min(res - 1, Math.max(0, Math.round((w.x + DOMAIN.widthMeters / 2) / dx))));
  const wellRows = wells.map(w => Math.min(res - 1, Math.max(0, Math.round((w.y + DOMAIN.widthMeters / 2) / dx))));

  for (let i = 2; i < res - 2; i++) {
    for (let j = 2; j < res - 2; j++) {
      const idx = i * res + j;
      const hCenter = headGrid[idx];
      const dispActual = displacementGrid[idx];

      // 1. Geomechanical 1-D Terzaghi skeletal compaction consistency check
      // Uses the canonical constitutive function shared across the entire codebase
      const comp = computeConstitutiveCompaction(hCenter, null, params);
      const dispExpected = comp.totalCompactionM;

      const rComp = Math.abs(dispActual - dispExpected);
      compDiffSq += rComp * rComp;
      compRefSq += dispExpected * dispExpected;

      if (rComp > maxAbsCompResidualM) {
        maxAbsCompResidualM = rComp;
      }

      // 2. Discrete 2D groundwater flow continuity (Laplace + Storage flux)
      // Exclude cells immediately adjacent to well singularities (r <= 2 cells)
      let isNearWell = false;
      for (let w = 0; w < wellCols.length; w++) {
        const dRow = i - wellRows[w];
        const dCol = j - wellCols[w];
        if (Math.hypot(dRow, dCol) <= 2.0) {
          isNearWell = true;
          break;
        }
      }

      if (!isNearWell) {
        const hNorth = headGrid[(i - 1) * res + j];
        const hSouth = headGrid[(i + 1) * res + j];
        const hWest  = headGrid[i * res + (j - 1)];
        const hEast  = headGrid[i * res + (j + 1)];

        const laplacian = (hNorth + hSouth + hWest + hEast - 4 * hCenter) / dx2;
        const netDrawdown = Math.max(0, h0 - hCenter);
        const storageFlux = (S * netDrawdown) / dt;

        // Flow continuity residual: T*Lap(h) - S*(dh/dt)
        const rFlow = Math.abs(T * laplacian - storageFlux);
        flowDiffSq += rFlow * rFlow;

        // Characteristic flow scale for physically dimensionless normalization
        const charScale = (T * netDrawdown) / (500 * 500) + storageFlux;
        flowScaleSq += Math.max(charScale * charScale, 1e-6);

        if (rFlow > maxAbsFlowResidual) {
          maxAbsFlowResidual = rFlow;
        }
      }

      evaluatedCells++;
    }
  }

  // Normalized relative residual components
  // Compaction residual normalized by expected constitutive norm (M1)
  const etaComp = Math.sqrt(compDiffSq) / (Math.sqrt(compRefSq) + 1e-5);
  // Flow residual normalized by characteristic physical flow flux scale (H3)
  const scaleFlow = (T * Math.max(1.0, physicalState.maxDrawdown || 5.0)) / dx2;
  const etaFlow = Math.min(1.0, (Math.sqrt(flowDiffSq) / (scaleFlow * Math.sqrt(evaluatedCells) * 2.0 + 1e-4)));

  // Composite trust metric eta in [0, 1]
  const rawEta = Math.min(1.0, Math.max(0.0, 0.5 * etaComp + 0.5 * etaFlow));
  const eta = parseFloat(rawEta.toFixed(3));

  return {
    eta,
    rawEta,
    etaFlow: parseFloat(etaFlow.toFixed(3)),
    etaComp: parseFloat(etaComp.toFixed(3)),
    maxAbsFlowResidual: parseFloat(maxAbsFlowResidual.toFixed(4)),
    maxAbsCompResidualM: parseFloat(maxAbsCompResidualM.toFixed(4)),
    evaluatedCells,
    passed: rawEta <= DEFAULT_RESIDUAL_THRESHOLD,
    threshold: DEFAULT_RESIDUAL_THRESHOLD,
    isInputOutOfEnvelope,
    envelopeBounds: LHS_ENVELOPE
  };
}

/**
 * Evaluates the NIST AI RMF 1.0 residual trust gate.
 *
 * @param {number} eta Normalized residual trust metric
 * @param {number} [threshold=0.15] Safety tolerance threshold tau
 * @param {boolean} [isSurrogate=true] Whether the target engine is a neural surrogate
 * @returns {Object} Gate decision record
 */
export function gateResidual(eta, threshold = DEFAULT_RESIDUAL_THRESHOLD, isSurrogate = true) {
  if (!isSurrogate) {
    return {
      status: 'NOT_APPLICABLE',
      eta,
      threshold,
      passed: true,
      reason: 'Physics residual evaluated as reference diagnostic (deterministic baseline solver).'
    };
  }

  const passed = eta <= threshold;
  return {
    status: passed ? 'SURROGATE' : 'FALLBACK',
    eta,
    threshold,
    passed,
    reason: passed
      ? `Surrogate residual trust metric η = ${eta} satisfies physics tolerance (τ = ${threshold}).`
      : `Surrogate residual trust metric η = ${eta} exceeds tolerance threshold (τ = ${threshold}). Automatic fallback triggered.`
  };
}
