import { useState, useMemo, useCallback } from 'react';
import { evaluateWithEngine, DEFAULT_ENGINE, listEngines } from '../../../engines/index.js';
import { SCENARIO_PRESETS, DEFAULT_PARAMS } from '../../../domain/scenario/scenarioDefaults.js';

export { SCENARIO_PRESETS, DEFAULT_PARAMS };

/**
 * Custom hook to isolate scenario parameters, physical simulation state,
 * multi-engine switching ('analytical', 'reference', 'pino'), preset handling,
 * NIST AI RMF 1.0 residual trust metrics, and automated fallback governance.
 *
 * Multi-Engine Contract:
 * - 'analytical': In-browser Theis + Terzaghi closed-form solver (~2 ms)
 * - 'pino': Physics-Informed Neural Operator 3D surrogate probe (<250 ms target spec)
 * - 'reference': USGS MODFLOW 6.8.1 CSUB finite-difference numerical solution (22.5 s median)
 *
 * Automated Fallback Governance (NIST AI RMF 1.0):
 * If 'pino' is active and normalized residual metric eta exceeds safety threshold
 * tau = 0.15, the pipeline automatically falls back to 'reference' and records provenance.
 */
export function useScenarioState(initialParams = DEFAULT_PARAMS, initialEngineId = DEFAULT_ENGINE) {
  const [params, setParamsState] = useState(initialParams);
  const [activePreset, setActivePreset] = useState('baseline');
  const [selectedEngineId, setSelectedEngineId] = useState(initialEngineId);
  const [perturbSurrogate, setPerturbSurrogate] = useState(false);

  // Compute live exploratory physical state through the selected engine with residual gating
  const physicalState = useMemo(() => {
    return evaluateWithEngine(selectedEngineId, params, {
      perturbForTest: perturbSurrogate
    });
  }, [selectedEngineId, params, perturbSurrogate]);

  // Captured scenario for formal comparative analysis
  const [capturedScenario, setCapturedScenario] = useState(() => {
    const initialState = evaluateWithEngine(initialEngineId, initialParams);
    return {
      params: { ...initialParams },
      physicalState: initialState,
      preset: 'baseline',
      capturedAt: 'Initial Baseline',
      engineId: initialEngineId
    };
  });

  // Detect whether live parameters have changed since last capture
  const hasUncapturedChanges = useMemo(() => {
    const capturedParams = capturedScenario.params;
    const paramsChanged = Object.keys(params).some(k => params[k] !== capturedParams[k]);
    const engineChanged = selectedEngineId !== capturedScenario.engineId;
    return paramsChanged || engineChanged;
  }, [params, selectedEngineId, capturedScenario.params, capturedScenario.engineId]);

  // Update a single parameter and mark preset as custom
  const setParam = useCallback((key, value) => {
    setActivePreset('custom');
    setParamsState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple parameters or support function updater
  const setParams = useCallback((updater) => {
    setParamsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);

  // Apply a known demonstration preset
  const applyPreset = useCallback((presetKey) => {
    const targetPreset = SCENARIO_PRESETS[presetKey];
    if (targetPreset) {
      setActivePreset(presetKey);
      setParamsState({
        ...DEFAULT_PARAMS,
        ...targetPreset.params
      });
    }
  }, []);

  // Explicit action: Capture current live scenario into comparison state
  const captureScenarioForComparison = useCallback(() => {
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setCapturedScenario({
      params: { ...params },
      physicalState,
      preset: activePreset,
      capturedAt: timeLabel,
      engineId: selectedEngineId
    });
  }, [params, physicalState, activePreset, selectedEngineId]);

  // Reset to default baseline state
  const resetToBaseline = useCallback(() => {
    setActivePreset('baseline');
    setParamsState(DEFAULT_PARAMS);
    setPerturbSurrogate(false);
  }, []);

  // Toggle surrogate stress perturbation (for evaluating NIST AI RMF fallback)
  const togglePerturbation = useCallback(() => {
    setPerturbSurrogate(prev => !prev);
  }, []);

  return {
    params,
    setParam,
    setParams,
    physicalState,
    capturedScenario,
    hasUncapturedChanges,
    captureScenarioForComparison,
    // Aliased for backward compatibility with existing component signatures
    runDemonstration: captureScenarioForComparison,
    isSimulating: false,
    activePreset,
    setActivePreset,
    applyPreset,
    resetToBaseline,
    // Multi-engine & NIST AI RMF 1.0 Fallback API
    selectedEngineId,
    setSelectedEngineId,
    perturbSurrogate,
    setPerturbSurrogate,
    togglePerturbation,
    availableEngines: listEngines(),
    fallbackEngaged: physicalState?.meta?.fallbackEngaged || false,
    residual: physicalState?.residual,
    gate: physicalState?.gate
  };
}
