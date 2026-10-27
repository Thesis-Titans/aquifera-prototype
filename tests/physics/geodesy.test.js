import test, { describe } from 'node:test';
import assert from 'node:assert';
import {
  PRS92_ANCHOR,
  metersToPRS92,
  prs92ToMeters,
  metersToLngLat,
  lngLatToMeters,
  insarBaselineGeoJSON
} from '../../src/physics/fields.js';

describe('AQUIFERA Geodesy & PRS92 Zone 4 (EPSG:3124) Spatial Contracts', () => {

  test('anchor matches USGS MODFLOW 6 pilot domain center (451800 m E, 1187000 m N)', () => {
    assert.strictEqual(PRS92_ANCHOR.easting, 451800);
    assert.strictEqual(PRS92_ANCHOR.northing, 1187000);
  });

  test('metersToPRS92 converts origin (0, 0) to exact PRS92 domain centerpoint', () => {
    const prs = metersToPRS92(0, 0);
    assert.strictEqual(prs.easting, 451800);
    assert.strictEqual(prs.northing, 1187000);
  });

  test('metersToPRS92 maps domain boundaries correctly against smoke_test_mf6_prs92 SW corner', () => {
    // Domain extent is 3200m x 3200m; southwest corner is at x = -1600, y = +1600 (south positive)
    const sw = metersToPRS92(-1600, 1600);
    assert.strictEqual(sw.easting, 450200);
    assert.strictEqual(sw.northing, 1185400);

    // Northeast corner is at x = +1600, y = -1600 (north)
    const ne = metersToPRS92(1600, -1600);
    assert.strictEqual(ne.easting, 453400);
    assert.strictEqual(ne.northing, 1188600);
  });

  test('prs92ToMeters is the exact mathematical inverse of metersToPRS92', () => {
    const testCases = [
      { x: 0, y: 0 },
      { x: -1600, y: 1600 },
      { x: 1200, y: -800 },
      { x: -450, y: 320 }
    ];

    for (const { x, y } of testCases) {
      const prs = metersToPRS92(x, y);
      const recovered = prs92ToMeters(prs.easting, prs.northing);
      assert.strictEqual(recovered.x, x);
      assert.strictEqual(recovered.y, y);
    }
  });

  test('metersToLngLat and lngLatToMeters invert roundtrip within sub-millimeter precision', () => {
    const [x, y] = [350, -620];
    const [lng, lat] = metersToLngLat(x, y);
    const [rx, ry] = lngLatToMeters(lng, lat);
    assert.ok(Math.abs(rx - x) < 1e-4, `Expected rx ~ ${x}, got ${rx}`);
    assert.ok(Math.abs(ry - y) < 1e-4, `Expected ry ~ ${y}, got ${ry}`);
  });

  test('insarBaselineGeoJSON produces valid GeoJSON polygons matching Sulapas 2024 bounds', () => {
    const insar = insarBaselineGeoJSON();
    assert.strictEqual(insar.type, 'FeatureCollection');
    assert.strictEqual(insar.metadata.source, 'Sulapas et al. (2024)');
    assert.strictEqual(insar.metadata.maxVelocityMmYear, -9.0);
    assert.strictEqual(insar.features.length, 2);

    for (const f of insar.features) {
      assert.strictEqual(f.type, 'Feature');
      assert.strictEqual(f.geometry.type, 'Polygon');
      assert.ok(f.geometry.coordinates[0].length >= 4);
      assert.ok(f.properties.rate.includes('mm/yr'));
    }
  });
});
