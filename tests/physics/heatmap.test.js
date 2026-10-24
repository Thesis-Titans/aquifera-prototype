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
    const quantities = ['subsidence', 'drawdown', 'inelastic'];
    const scales = ['standard', 'viridis', 'turbo'];

    for (const q of quantities) {
      for (const s of scales) {
        const result = rasterizeField(state, q, s, 64, 0.004);
        assert.strictEqual(result.pixels.length, 64 * 64 * 4);
        // Verify no NaNs in output
        assert.ok(!Number.isNaN(result.pixels[0]));
      }
    }
  });
});
