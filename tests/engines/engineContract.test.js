import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENGINES,
  listEngines,
  getEngine,
  evaluateWithEngine,
  DEFAULT_ENGINE
} from '../../src/engines/index.js';
import { DEFAULT_PARAMS } from '../../src/domain/scenario/scenarioDefaults.js';
import { LHS_ENVELOPE } from '../../src/physics/groundwaterPhysics.js';

describe('AQUIFERA Multi-Engine Contract & Conformance', () => {
  const engineIds = Object.keys(ENGINES);

  test('all registered engines implement the unified evaluate() contract', () => {
    assert.deepEqual(engineIds.sort(), ['analytical', 'pino', 'reference'].sort());

    for (const id of engineIds) {
      const engine = ENGINES[id];
      assert.ok(typeof engine.evaluate === 'function', `Engine ${id} must export evaluate function`);
      assert.ok(engine.id === id, `Engine id must match key ${id}`);
      assert.ok(typeof engine.name === 'string', `Engine ${id} must have a name`);
      assert.ok(typeof engine.version === 'string', `Engine ${id} must have a version`);
    }
  });

  test('listEngines() returns descriptive metadata for all engines', () => {
    const list = listEngines();
    assert.equal(list.length, 3);
    const ids = list.map(e => e.id);
    assert.ok(ids.includes('analytical'));
    assert.ok(ids.includes('reference'));
    assert.ok(ids.includes('pino'));
  });

  test('getEngine() returns requested engine or defaults to analytical', () => {
    assert.equal(getEngine('reference').id, 'reference');
    assert.equal(getEngine('pino').id, 'pino');
    assert.equal(getEngine('nonexistent').id, DEFAULT_ENGINE);
  });

  for (const id of engineIds) {
    test(`engine '${id}' produces valid, finite 64x64 spatial grids on baseline`, () => {
      const engine = ENGINES[id];
      const result = engine.evaluate(DEFAULT_PARAMS);

      assert.ok(result.displacementGrid instanceof Float32Array, `${id}: displacementGrid must be Float32Array`);
      assert.ok(result.headGrid instanceof Float32Array, `${id}: headGrid must be Float32Array`);
      assert.ok(result.strainGrid instanceof Float32Array, `${id}: strainGrid must be Float32Array`);
      assert.ok(result.inelasticGrid instanceof Float32Array, `${id}: inelasticGrid must be Float32Array`);

      assert.equal(result.displacementGrid.length, 4096);
      assert.equal(result.headGrid.length, 4096);
      assert.equal(result.strainGrid.length, 4096);
      assert.equal(result.inelasticGrid.length, 4096);

      // Verify no NaN or infinite values across ALL 4 grids
      for (let i = 0; i < 4096; i++) {
        assert.ok(Number.isFinite(result.displacementGrid[i]), `${id}: displacement at ${i} must be finite`);
        assert.ok(Number.isFinite(result.headGrid[i]), `${id}: head at ${i} must be finite`);
        assert.ok(Number.isFinite(result.strainGrid[i]), `${id}: strain at ${i} must be finite`);
        assert.ok(Number.isFinite(result.inelasticGrid[i]), `${id}: inelastic at ${i} must be finite`);
      }

      // Validate metadata schema
      assert.ok(result.meta, `${id}: result must include meta object`);
      assert.equal(result.meta.engineId, id);
      assert.ok(typeof result.meta.runtimeMs === 'number' && result.meta.runtimeMs > 0);
      assert.ok(typeof result.meta.provenance === 'string');
    });
  }

  test('all engines remain finite across LHS parameter envelope corners', () => {
    const testCases = [
      { pumpingRate: LHS_ENVELOPE.minPumpingRate, pumpingDays: LHS_ENVELOPE.minPumpingDays },
      { pumpingRate: LHS_ENVELOPE.maxPumpingRate, pumpingDays: LHS_ENVELOPE.maxPumpingDays },
      { hydraulicConductivity: LHS_ENVELOPE.minHydraulicConductivity, specificStorage: LHS_ENVELOPE.minSpecificStorage },
      { hydraulicConductivity: LHS_ENVELOPE.maxHydraulicConductivity, specificStorage: LHS_ENVELOPE.maxSpecificStorage }
    ];

    for (const id of engineIds) {
      const engine = ENGINES[id];
      for (const tc of testCases) {
        const params = { ...DEFAULT_PARAMS, ...tc };
        const result = engine.evaluate(params);
        assert.ok(Number.isFinite(result.maxSubsidenceCm), `${id} maxSubsidenceCm must be finite`);
        assert.ok(Number.isFinite(result.maxDrawdown), `${id} maxDrawdown must be finite`);
      }
    }
  });

  test('referenceEngine reports verified MODFLOW 6 pilot characteristics as a proxy', () => {
    const ref = ENGINES.reference.evaluate(DEFAULT_PARAMS);
    assert.equal(ref.meta.isReference, true);
    assert.equal(ref.meta.isSurrogate, false);
    assert.equal(ref.meta.isProxy, true);
    assert.equal(ref.meta.runtimeMs, 22500); // 22.5 s pilot median record
    assert.ok(ref.meta.measuredRuntimeRangeMs.length === 2);
  });

  test('pinoEngine reports FNO-3D surrogate probe characteristics deterministically', () => {
    const pino1 = ENGINES.pino.evaluate(DEFAULT_PARAMS);
    const pino2 = ENGINES.pino.evaluate(DEFAULT_PARAMS);
    assert.equal(pino1.meta.isReference, false);
    assert.equal(pino1.meta.isSurrogate, true);
    assert.equal(pino1.meta.isProbe, true);
    assert.equal(pino1.meta.targetLatencyMs, '< 250');
    assert.equal(pino1.meta.targetVRAM_MB, 4200);
    // Strict determinism check: runtimes and fields must match identically
    assert.equal(pino1.meta.runtimeMs, pino2.meta.runtimeMs);
    assert.equal(pino1.maxSubsidenceCm, pino2.maxSubsidenceCm);
  });
});
