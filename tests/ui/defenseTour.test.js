import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSE_STEPS } from '../../src/features/simulation/defenseTourData.js';
import { SCENARIO_PRESETS } from '../../src/domain/scenario/scenarioDefaults.js';
import { getEngine, evaluateWithEngine } from '../../src/engines/index.js';

test('AQUIFERA 3-Step Defense Tour Walkthrough Contract', async (t) => {
  await t.test('defines exactly 3 sequential defense demonstration steps', () => {
    assert.equal(DEFENSE_STEPS.length, 3, 'Must have exactly 3 defense steps');
    assert.deepEqual(
      DEFENSE_STEPS.map((s) => s.step),
      [1, 2, 3],
      'Steps must be numbered 1, 2, 3'
    );
  });

  await t.test('Step 1 (Baseline Hydrologic State) loads nominal analytical state within trust envelope', () => {
    const s1 = DEFENSE_STEPS[0];
    assert.equal(s1.preset, 'baseline');
    assert.equal(s1.engineId, 'analytical');
    assert.equal(s1.perturb, false);

    const preset = SCENARIO_PRESETS[s1.preset];
    assert.ok(preset, 'Baseline preset must exist');
    const result = evaluateWithEngine(s1.engineId, preset.params);
    assert.equal(result.maxSubsidenceCm, 6.0, 'Baseline max subsidence must match established 6.0 cm benchmark');
    assert.ok(result.residual.eta < 0.03, 'Baseline residual must be within nominal limit (< 0.03)');
    assert.equal(result.meta.activeEngineId, 'analytical');
  });

  await t.test('Step 2 (Commercial Corridor Stress) triggers accelerated plastic compaction in Layer 3', () => {
    const s2 = DEFENSE_STEPS[1];
    assert.equal(s2.preset, 'corridor');
    assert.equal(s2.perturb, false);

    const preset = SCENARIO_PRESETS[s2.preset];
    assert.ok(preset, 'Corridor preset must exist');
    const result = evaluateWithEngine(s2.engineId, preset.params);
    assert.equal(result.isPreconsolidationBreached, true, 'Corridor stress must breach preconsolidation head');
    assert.ok(result.inelasticSubsidenceMm > 0, 'Corridor stress must produce plastic inelastic compaction > 0');
    assert.equal(result.wells.length, 2, 'Corridor stress activates 2 clustered extraction wells');
  });

  await t.test('Step 3 (AI Verification & Safe Fallback) reliably trips NIST AI RMF 1.0 fallback', () => {
    const s3 = DEFENSE_STEPS[2];
    assert.equal(s3.engineId, 'pino');
    assert.equal(s3.perturb, true);

    const preset = SCENARIO_PRESETS[s3.preset];
    assert.ok(preset, 'Step 3 preset must exist');

    // Run evaluation with perturbed PINO surrogate
    const result = evaluateWithEngine('pino', preset.params, {
      perturbSurrogate: true
    });

    assert.equal(result.meta.fallbackEngaged, true, 'NIST AI RMF fallback must be engaged');
    assert.ok(result.meta.originalEta > 0.15, 'Original residual must breach threshold tau = 0.15');
    assert.equal(result.meta.activeEngineId, 'reference', 'Active engine must safely revert to reference MODFLOW 6 proxy');
  });

  await t.test('Academic tone compliance: narrative contains zero banned filler and respects technical lexicon', () => {
    const BANNED_TERMS = [
      'revolutionary',
      'game-changer',
      'seamless',
      'synergy',
      'transformative',
      'cutting-edge',
      'holistic',
      'plethora',
      'beacon',
      'ground truth' // Must be 'reference numerical solution' or 'baseline proxy'
    ];

    DEFENSE_STEPS.forEach((s) => {
      const text = `${s.title} ${s.subtitle} ${s.narrative}`.toLowerCase();
      BANNED_TERMS.forEach((term) => {
        assert.ok(!text.includes(term), `Defense step ${s.step} text must not contain banned term: "${term}"`);
      });
    });
  });
});
