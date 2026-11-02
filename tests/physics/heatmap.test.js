import test from 'node:test';
import assert from 'node:assert/strict';
import { buildColorLUT, rasterizeField } from '../../src/physics/heatmap.js';
import { computeGroundwaterState } from '../../src/physics/groundwaterPhysics.js';
import { DEFAULT_PARAMS } from '../../src/domain/scenario/scenarioDefaults.js';

test('AQUIFERA Heatmap Rasterizer & Bilinear Interpolator', async (t) => {
  await t.test('buildColorLUT constructs valid 256-entry RGB table matching palette bounds', () => {
    const lutStandard = buildColorLUT('standard');
    assert.strictEqual(lutStandard.length, 256 * 3);

    // All entries must be integer values in [0, 255]
    for (let i = 0; i < lutStandard.length; i++) {
      assert.ok(!Number.isNaN(lutStandard[i]));
      assert.ok(lutStandard[i] >= 0 && lutStandard[i] <= 255);
    }

    // Viridis palette check
    const lutViridis = buildColorLUT('viridis');
    assert.strictEqual(lutViridis.length, 256 * 3);
  });

  await t.test('rasterizeField generates expected 256x256 buffer with smooth alpha cutoff', () => {
    const state = computeGroundwaterState(DEFAULT_PARAMS);
    const size = 128; // test on 128x128 for rapid execution
    const raster = rasterizeField(state, 'subsidence', 'standard', size, 0.004);

    assert.strictEqual(raster.width, size);
    assert.strictEqual(raster.height, size);
    assert.strictEqual(raster.pixels.length, size * size * 4);

    // Far corners (py = 0, px = 0) should have negligible subsidence and alpha = 0
    const cornerAlpha = raster.pixels[3];
    assert.strictEqual(cornerAlpha, 0, 'Far corner subsidence below cutoff must have alpha 0');

    // Wellhead center (py = 64, px = 64) should have maximum subsidence and alpha > 0
    const centerOffset = (Math.floor(size / 2) * size + Math.floor(size / 2)) * 4;
    const centerAlpha = raster.pixels[centerOffset + 3];
    assert.ok(centerAlpha > 200, `Center subsidence alpha should be near 255 (got ${centerAlpha})`);
  });

  await t.test('rasterizeField runs across all supported quantities and color scales', () => {
    const state = computeGroundwaterState(DEFAULT_PARAMS);
    const quantities = ['subsidence', 'drawdown', 'inelastic', 'diff_subsidence'];
    const scales = ['standard', 'viridis', 'turbo', 'diverging'];

    for (const q of quantities) {
      for (const s of scales) {
        const result = rasterizeField(state, q, s, 64, 0.004);
        assert.strictEqual(result.pixels.length, 64 * 64 * 4);
        // Verify no NaNs in output
        assert.ok(!Number.isNaN(result.pixels[0]));
      }
    }
  });

  await t.test('diff_subsidence diverging field correctly isolates positive compaction and negative recovery', () => {
    const baseline = computeGroundwaterState(DEFAULT_PARAMS); // 15,000 m3/d
    const stressed = computeGroundwaterState({ ...DEFAULT_PARAMS, pumpingRate: 25000 }); // +10,000 m3/d
    const mitigated = computeGroundwaterState({ ...DEFAULT_PARAMS, pumpingRate: 5000 }); // -10,000 m3/d
    const size = 64;
    const centerOffset = (Math.floor(size / 2) * size + Math.floor(size / 2)) * 4;

    // 1. Identical states (zero difference) must produce transparent raster
    const zeroDiff = rasterizeField(baseline, 'diff_subsidence', 'diverging', size, 0.004, baseline);
    assert.strictEqual(zeroDiff.pixels[centerOffset + 3], 0, 'Zero delta at center must have alpha 0 (transparent)');

    // 2. Stressed live vs baseline captured: positive delta (subsidence increase)
    const positiveDiff = rasterizeField(stressed, 'diff_subsidence', 'diverging', size, 0.004, baseline);
    const posAlpha = positiveDiff.pixels[centerOffset + 3];
    const posRed = positiveDiff.pixels[centerOffset];
    const posBlue = positiveDiff.pixels[centerOffset + 2];
    assert.ok(posAlpha > 200, `Positive delta center alpha should be high (got ${posAlpha})`);
    assert.ok(posRed > posBlue, `Increased compaction must produce warm red/orange hue (R=${posRed} > B=${posBlue})`);

    // 3. Mitigated live vs baseline captured: negative delta (recovery / reduced compaction)
    const negativeDiff = rasterizeField(mitigated, 'diff_subsidence', 'diverging', size, 0.004, baseline);
    const negAlpha = negativeDiff.pixels[centerOffset + 3];
    const negRed = negativeDiff.pixels[centerOffset];
    const negBlue = negativeDiff.pixels[centerOffset + 2];
    assert.ok(negAlpha > 200, `Negative delta center alpha should be high (got ${negAlpha})`);
    assert.ok(negBlue > negRed, `Mitigated compaction must produce cool blue hue (B=${negBlue} > R=${negRed})`);
  });
});
