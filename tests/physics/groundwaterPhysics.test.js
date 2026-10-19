import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  wellFunctionW,
  computeGroundwaterState,
  createHysteresisBuffer,
  resetHysteresisState,
  HYDRO_PARAMS,
  DOMAIN
} from '../../src/physics/groundwaterPhysics.js';

describe('AQUIFERA Physics Engine: Well Function W(u) Tests', () => {
  test('returns 0 for non-positive or out-of-range u', () => {
    assert.equal(wellFunctionW(0), 0);
    assert.equal(wellFunctionW(-1), 0);
    assert.equal(wellFunctionW(10), 0);
    assert.equal(wellFunctionW(15), 0);
  });

  test('accurately evaluates Abramowitz-Stegun Cooper-Jacob for small u (0.01)', () => {
    // Reference E1(0.01) ~ 4.03793
    const val = wellFunctionW(0.01);
    assert.ok(Math.abs(val - 4.03793) < 0.005, `Expected ~4.038, got ${val}`);
  });

  test('accurately evaluates polynomial Abramowitz-Stegun for 0.05 <= u <= 1.0', () => {
    // Reference values from Abramowitz & Stegun Table 5.1
    const val01 = wellFunctionW(0.1); // ~1.82292
    assert.ok(Math.abs(val01 - 1.82292) < 0.001, `u=0.1: Expected ~1.82292, got ${val01}`);

    const val05 = wellFunctionW(0.5); // ~0.55977
    assert.ok(Math.abs(val05 - 0.55977) < 0.001, `u=0.5: Expected ~0.55977, got ${val05}`);

    const val10 = wellFunctionW(1.0); // ~0.21938
    assert.ok(Math.abs(val10 - 0.21938) < 0.001, `u=1.0: Expected ~0.21938, got ${val10}`);
  });

  test('accurately evaluates rational continued fraction for 1.0 < u < 10.0', () => {
    const val20 = wellFunctionW(2.0); // ~0.04890
    assert.ok(Math.abs(val20 - 0.04890) < 0.0005, `u=2.0: Expected ~0.04890, got ${val20}`);

    const val50 = wellFunctionW(5.0); // ~0.001148
    assert.ok(Math.abs(val50 - 0.001148) < 0.0001, `u=5.0: Expected ~0.001148, got ${val50}`);
  });
});

describe('AQUIFERA Physics Engine: Simulation Determinism and State Isolation', () => {
  const baseParams = {
    pumpingRate: 15000,
    pumpingDays: 180,
    hydraulicConductivity: 15,
    specificStorage: 0.0001,
    rechargeRateMmYear: 150,
    wellCount: 1,
    wellX: 0,
    wellY: 0
  };

  test('is completely deterministic across sequential stateless runs', () => {
    const run1 = computeGroundwaterState(baseParams);
    const run2 = computeGroundwaterState(baseParams);

    assert.equal(run1.minHead, run2.minHead);
    assert.equal(run1.maxDrawdown, run2.maxDrawdown);
    assert.equal(run1.maxSubsidenceCm, run2.maxSubsidenceCm);
    assert.equal(run1.isPreconsolidationBreached, run2.isPreconsolidationBreached);
  });

  test('exhibits expected physical sensitivity to pumping rate increments', () => {
    const lowPumping = computeGroundwaterState({ ...baseParams, pumpingRate: 5000 });
    const highPumping = computeGroundwaterState({ ...baseParams, pumpingRate: 28000 });

    assert.ok(highPumping.maxDrawdown > lowPumping.maxDrawdown, 'Higher extraction must increase drawdown');
    assert.ok(highPumping.maxSubsidenceCm > lowPumping.maxSubsidenceCm, 'Higher extraction must increase compaction');
    assert.ok(highPumping.minHead < lowPumping.minHead, 'Higher extraction must decrease minimum hydraulic head');
  });

  test('maintains non-NaN physical fields bounded by domain constraints', () => {
    const res = computeGroundwaterState(baseParams);

    assert.equal(res.resolution, DOMAIN.gridResolution);
    assert.equal(res.displacementGrid.length, DOMAIN.gridResolution * DOMAIN.gridResolution);
    assert.ok(res.minHead <= HYDRO_PARAMS.initialHead, 'Min head cannot exceed initial head');
    assert.ok(res.maxDrawdown >= 0, 'Drawdown must be non-negative');
    assert.ok(res.maxSubsidenceCm >= 0, 'Compaction must be non-negative');

    for (let i = 0; i < 100; i++) {
      assert.ok(!Number.isNaN(res.displacementGrid[i]), `NaN detected in displacementGrid at index ${i}`);
      assert.ok(!Number.isNaN(res.headGrid[i]), `NaN detected in headGrid at index ${i}`);
    }
  });

  test('isolates custom hysteresis buffers without cross-contamination', () => {
    const bufA = createHysteresisBuffer();
    const bufB = createHysteresisBuffer();

    // Run severe overdraft on buffer A
    computeGroundwaterState({ ...baseParams, pumpingRate: 35000 }, { historyBuffer: bufA });

    // Buffer B should remain uncompacted at initial head
    assert.equal(bufB[0], HYDRO_PARAMS.initialHead);

    // Buffer A center should have recorded significant head reduction
    const centerIdx = Math.floor(DOMAIN.gridResolution / 2) * DOMAIN.gridResolution + Math.floor(DOMAIN.gridResolution / 2);
    assert.ok(bufA[centerIdx] < HYDRO_PARAMS.initialHead, 'Buffer A must record drawdown');
  });

  test('resetHysteresisState clears session tracking', () => {
    computeGroundwaterState({ ...baseParams, pumpingRate: 30000 }, { trackHysteresis: true });
    resetHysteresisState();

    // After reset, a sustainable run should not retain plastic compaction from previous run
    const freshRun = computeGroundwaterState({ ...baseParams, pumpingRate: 5000 });
    assert.equal(freshRun.isHysteresisRetained, false);
  });
});
