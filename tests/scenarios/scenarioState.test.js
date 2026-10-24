import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeGroundwaterState,
  createHysteresisBuffer,
  HYDRO_PARAMS
} from '../../src/physics/groundwaterPhysics.js';
import { SCENARIO_PRESETS, DEFAULT_PARAMS } from '../../src/features/scenarios/hooks/useScenarioState.js';

describe('AQUIFERA Scenario Interaction and Capture Contract', () => {
  test('DEFAULT_PARAMS matches baseline preset specifications', () => {
    assert.deepEqual(DEFAULT_PARAMS, SCENARIO_PRESETS.baseline.params);
    assert.equal(DEFAULT_PARAMS.pumpingRate, 12000);
    assert.equal(DEFAULT_PARAMS.hydraulicConductivity, 15);
  });

  test('live exploratory preview updates independently of captured comparison state', () => {
    // Initial baseline state
    const initialParams = { ...DEFAULT_PARAMS };
    const capturedScenario = {
      params: { ...initialParams },
      physicalState: computeGroundwaterState(initialParams),
      preset: 'baseline'
    };

    // User adjusts live slider: pumping increases to 26000 m3/day
    const liveParams = { ...initialParams, pumpingRate: 26000 };
    const livePhysicalState = computeGroundwaterState(liveParams);

    // Live preview must reflect higher drawdown
    assert.ok(livePhysicalState.maxDrawdown > capturedScenario.physicalState.maxDrawdown);
    assert.ok(livePhysicalState.maxSubsidenceCm > capturedScenario.physicalState.maxSubsidenceCm);

    // Captured state must remain completely isolated and intact
    assert.equal(capturedScenario.params.pumpingRate, 12000);
    assert.equal(capturedScenario.physicalState.maxSubsidenceCm, computeGroundwaterState(DEFAULT_PARAMS).maxSubsidenceCm);

    // Check uncaptured difference detection logic
    const hasUncapturedChanges = Object.keys(liveParams).some(k => liveParams[k] !== capturedScenario.params[k]);
    assert.equal(hasUncapturedChanges, true);

    // Simulate explicit capture action
    const newCapturedScenario = {
      params: { ...liveParams },
      physicalState: livePhysicalState,
      preset: 'custom'
    };
    const hasUncapturedAfterCapture = Object.keys(liveParams).some(k => liveParams[k] !== newCapturedScenario.params[k]);
    assert.equal(hasUncapturedAfterCapture, false);
    assert.equal(newCapturedScenario.params.pumpingRate, 26000);
  });

  test('switching presets produces clean isolated states without residual plastic compaction', () => {
    // 1. Evaluate baseline
    const baselineRun = computeGroundwaterState(SCENARIO_PRESETS.baseline.params);

    // 2. Evaluate severe drought/overdraft preset
    const overdraftRun = computeGroundwaterState(SCENARIO_PRESETS.drought.params);
    assert.ok(overdraftRun.maxSubsidenceCm > baselineRun.maxSubsidenceCm);

    // 3. Switch back to baseline preset
    const returnBaselineRun = computeGroundwaterState(SCENARIO_PRESETS.baseline.params);

    // 4. Verify exact numeric reproducibility
    assert.equal(returnBaselineRun.minHead, baselineRun.minHead);
    assert.equal(returnBaselineRun.maxDrawdown, baselineRun.maxDrawdown);
    assert.equal(returnBaselineRun.maxSubsidenceCm, baselineRun.maxSubsidenceCm);
    assert.equal(returnBaselineRun.isHysteresisRetained, false);
  });

  test('intentional multi-period stress simulation accumulates inelastic compaction when historyBuffer is chained', () => {
    const chainBuffer = createHysteresisBuffer();

    // Period 1: Overdraft stress (28,000 m3/day)
    const period1 = computeGroundwaterState(
      { ...DEFAULT_PARAMS, pumpingRate: 28000 },
      { historyBuffer: chainBuffer }
    );
    assert.ok(period1.maxSubsidenceCm > 20);

    // Period 2: Artificial Managed Recharge intervention (pumping reduced to 8,000, recharge elevated)
    const period2 = computeGroundwaterState(
      { ...DEFAULT_PARAMS, pumpingRate: 8000, rechargeRateMmYear: 350 },
      { historyBuffer: chainBuffer }
    );

    // Inelastic matrix collapse from Period 1 must be retained even though Period 2 head recovered
    assert.equal(period2.isHysteresisRetained, true);
    assert.ok(period2.permanentInelasticCm > 0);
  });

  test('corridor preset breaches preconsolidation head and activates clustered wells without fallback', () => {
    const corridorParams = SCENARIO_PRESETS.corridor.params;
    const state = computeGroundwaterState(corridorParams);

    // Mandurriao commercial corridor stress must trigger permanent plastic compaction
    assert.equal(state.isPreconsolidationBreached, true, 'Corridor preset must breach preconsolidation threshold');
    assert.ok(state.inelasticSubsidenceMm > 0, 'Permanent inelastic compaction must be > 0');
    assert.equal(state.wells.length, 2, 'Pumping > 15k m3/d must resolve 2 clustered production wells');
  });
});
