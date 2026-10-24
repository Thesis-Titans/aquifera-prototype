import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeResidual,
  gateResidual,
  DEFAULT_RESIDUAL_THRESHOLD
} from '../../src/physics/residual.js';
import {
  analyticalEngine,
  referenceEngine,
  pinoEngine,
  evaluateWithEngine
} from '../../src/engines/index.js';
import { DEFAULT_PARAMS } from '../../src/domain/scenario/scenarioDefaults.js';

describe('AQUIFERA Discrete PDE Mass-Balance & Residual Trust Metrics', () => {
  test('analytical solution yields low residual metric eta < 0.03 across stress durations', () => {
    for (const days of [30, 90, 180, 365]) {
      const params = { ...DEFAULT_PARAMS, pumpingDays: days };
      const state = analyticalEngine.evaluate(params);
      const residual = computeResidual(state, params);

      assert.ok(residual.eta < 0.03, `Analytical eta (${residual.eta}) at ${days} days must be < 0.03`);
      assert.equal(residual.passed, true);
    }
  });

  test('MODFLOW 6 baseline proxy yields residual eta < 0.03 across stress durations', () => {
    for (const days of [30, 90, 180, 365]) {
      const params = { ...DEFAULT_PARAMS, pumpingDays: days };
      const state = referenceEngine.evaluate(params);
      const residual = computeResidual(state, params);

      assert.ok(residual.eta < 0.03, `Reference proxy eta (${residual.eta}) at ${days} days must be < 0.03`);
      assert.equal(residual.passed, true);
    }
  });

  test('nominal PINO surrogate forward probe stays within tolerance tau = 0.15', () => {
    const state = pinoEngine.evaluate(DEFAULT_PARAMS);
    const residual = computeResidual(state, DEFAULT_PARAMS);

    assert.ok(residual.eta <= DEFAULT_RESIDUAL_THRESHOLD, `Nominal PINO eta (${residual.eta}) must be <= ${DEFAULT_RESIDUAL_THRESHOLD}`);
    assert.equal(residual.passed, true);
  });

  test('perturbed surrogate prediction breaches tolerance tau = 0.15', () => {
    const perturbedState = pinoEngine.evaluate(DEFAULT_PARAMS, { perturbForTest: true });
    const residual = computeResidual(perturbedState, DEFAULT_PARAMS);

    assert.ok(residual.eta > DEFAULT_RESIDUAL_THRESHOLD, `Perturbed eta (${residual.eta}) must exceed ${DEFAULT_RESIDUAL_THRESHOLD}`);
    assert.equal(residual.passed, false);
  });

  test('flow residual sensitivity: an artificial unphysical head bump increases etaFlow', () => {
    const normalState = pinoEngine.evaluate(DEFAULT_PARAMS);
    const normalResidual = computeResidual(normalState, DEFAULT_PARAMS);

    // Create an unphysical synthetic state with a localized 6-meter head anomaly away from wells
    const corruptedHead = new Float32Array(normalState.headGrid);
    const targetIdx = 18 * 64 + 18; // Far from well at (32, 32)
    corruptedHead[targetIdx] += 6.0;

    const corruptedState = {
      ...normalState,
      headGrid: corruptedHead
    };
    const corruptedResidual = computeResidual(corruptedState, DEFAULT_PARAMS);

    assert.ok(
      corruptedResidual.maxAbsFlowResidual > normalResidual.maxAbsFlowResidual,
      'Localized unphysical head perturbation must increase max flow residual'
    );
  });

  test('gateResidual correctly classifies surrogate vs reference baseline', () => {
    // Neural surrogate within tolerance
    const passGate = gateResidual(0.042, 0.15, true);
    assert.equal(passGate.status, 'SURROGATE');
    assert.equal(passGate.passed, true);

    // Neural surrogate exceeding tolerance
    const failGate = gateResidual(0.182, 0.15, true);
    assert.equal(failGate.status, 'FALLBACK');
    assert.equal(failGate.passed, false);
    assert.ok(failGate.reason.includes('exceeds tolerance'));

    // Reference/Analytical deterministic solver (gate not applicable)
    const refGate = gateResidual(0.015, 0.15, false);
    assert.equal(refGate.status, 'NOT_APPLICABLE');
    assert.equal(refGate.passed, true);
  });

  test('evaluateWithEngine triggers automated reference fallback on perturbed surrogate', () => {
    // 1. Evaluate nominal PINO surrogate: should remain SURROGATE
    const nominal = evaluateWithEngine('pino', DEFAULT_PARAMS);
    assert.equal(nominal.meta.fallbackEngaged, false);
    assert.equal(nominal.gate.status, 'SURROGATE');
    assert.equal(nominal.meta.activeEngineId, 'pino');

    // 2. Evaluate perturbed PINO surrogate: must trigger automated FALLBACK
    const perturbed = evaluateWithEngine('pino', DEFAULT_PARAMS, { perturbForTest: true });
    assert.equal(perturbed.meta.fallbackEngaged, true);
    assert.equal(perturbed.gate.status, 'FALLBACK');
    assert.equal(perturbed.meta.activeEngineId, 'reference');
    assert.ok(perturbed.meta.fallbackReason.includes('exceeds tolerance'));
    assert.equal(perturbed.meta.isReference, true);
    assert.ok(perturbed.meta.originalEta > DEFAULT_RESIDUAL_THRESHOLD);
    // Discrepancy inspection: surrogateState must be retained on fallback
    assert.ok(perturbed.surrogateState);
    assert.ok(perturbed.surrogateState.displacementGrid);
  });
});
