import { useState, useMemo, useCallback } from 'react';
import { computeGroundwaterState, resetHysteresisState } from '../../../physics/groundwaterPhysics.js';
import { SCENARIO_PRESETS, DEFAULT_PARAMS } from '../../../domain/scenario/scenarioDefaults.js';

export { SCENARIO_PRESETS, DEFAULT_PARAMS };

/**
 * Custom hook to isolate scenario parameters, physical simulation state,
 * preset switching, live exploratory previews, and explicit comparison capture.
 *
 * Interaction Contract:
 * 1. Live Exploratory Preview:
 *    Editing parameters via sliders or presets immediately recalculates `physicalState`
 *    reactively. The 2D map, 3D cutaway mesh, and key insight gauges display this live state.
 * 2. Explicit Scenario Capture:
 *    Clicking "Capture Scenario for Comparison" creates an explicit snapshot in `capturedScenario`.
 *    Analytical comparison tables and benchmark deltas consume this captured state rather than
 *    fluctuating during transient slider drags.
 * 3. Change Detection:
 *    `hasUncapturedChanges` flags when the live parameter preview has diverged from the captured scenario.
 * 4. Zero Artificial Delays:
 *    Because the deterministic physical model computes in under 4ms, scenario capture is instantaneous
 *    with zero fake loading animations.
 */
export function useScenarioState(initialParams = DEFAULT_PARAMS) {
  const [params, setParamsState] = useState(initialParams);
  const [activePreset, setActivePreset] = useState('baseline');

  // Compute live exploratory physical state via Darcy/Theis and 1D Terzaghi skeletal compaction
  // Pure, side-effect free calculation with zero module-level buffer leaks
  const physicalState = useMemo(() => {
    return computeGroundwaterState(params);
  }, [params]);

  // Captured scenario for formal comparative analysis
  const [capturedScenario, setCapturedScenario] = useState(() => ({
    params: { ...initialParams },
    physicalState: computeGroundwaterState(initialParams),
    preset: 'baseline',
    capturedAt: 'Initial Baseline'
  }));

  // Detect whether live parameters have changed since last capture
  const hasUncapturedChanges = useMemo(() => {
    const capturedParams = capturedScenario.params;
    return Object.keys(params).some(k => params[k] !== capturedParams[k]);
  }, [params, capturedScenario.params]);

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
      capturedAt: timeLabel
    });
  }, [params, physicalState, activePreset]);

  // Reset to default baseline state
  const resetToBaseline = useCallback(() => {
    setActivePreset('baseline');
    setParamsState(DEFAULT_PARAMS);
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
    resetToBaseline
  };
}
