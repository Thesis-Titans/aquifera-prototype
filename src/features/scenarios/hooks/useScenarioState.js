import { useState, useMemo, useCallback } from 'react';
import { computeGroundwaterState, resetHysteresisState } from '../../../physics/groundwaterPhysics';

export const SCENARIO_PRESETS = {
  baseline: {
    name: '1. Baseline (12k m³/d)',
    description: 'Current estimated municipal extraction with normal rainfall recharge.',
    params: {
      pumpingRate: 12000,
      hydraulicConductivity: 15,
      specificStorage: 0.0001,
      rechargeRateMmYear: 200,
      pumpingDays: 180,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    }
  },
  overdraft: {
    name: '2. Overdraft (26k m³/d)',
    description: 'Heavy industrial/commercial extraction exceeding safe sustainable yield.',
    params: {
      pumpingRate: 26000,
      hydraulicConductivity: 12,
      specificStorage: 0.0001,
      rechargeRateMmYear: 100,
      pumpingDays: 180,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    }
  },
  mar: {
    name: '3. Managed Recharge',
    description: 'Managed Aquifer Recharge (MAR) intervention with supplemental surface water injection.',
    params: {
      pumpingRate: 15000,
      hydraulicConductivity: 18,
      specificStorage: 0.00012,
      rechargeRateMmYear: 320,
      pumpingDays: 180,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    }
  },
  drought: {
    name: '4. Drought Shock',
    description: 'Severe meteorological drought (El Niño) with reduced recharge and emergency pumping.',
    params: {
      pumpingRate: 32000,
      hydraulicConductivity: 10,
      specificStorage: 0.00008,
      rechargeRateMmYear: 30,
      pumpingDays: 180,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    }
  }
};

export const DEFAULT_PARAMS = SCENARIO_PRESETS.baseline.params;

/**
 * Custom hook to isolate scenario parameters, physical simulation state,
 * preset switching, and simulation trigger actions.
 */
export function useScenarioState(initialParams = DEFAULT_PARAMS) {
  const [params, setParamsState] = useState(initialParams);
  const [activePreset, setActivePreset] = useState('baseline');
  const [isSimulating, setIsSimulating] = useState(false);

  // Compute reactive physical state via Darcy/Theis and Terzaghi skeletal compaction
  const physicalState = useMemo(() => {
    return computeGroundwaterState(params);
  }, [params]);

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
      setParamsState(prev => ({
        ...prev,
        ...targetPreset.params
      }));
    }
  }, []);

  // Run demonstration simulation with subtle UI feedback
  const runDemonstration = useCallback(() => {
    setIsSimulating(true);
    const timer = setTimeout(() => {
      setIsSimulating(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Reset to default baseline state
  const resetToBaseline = useCallback(() => {
    resetHysteresisState();
    setActivePreset('baseline');
    setParamsState(DEFAULT_PARAMS);
  }, []);

  return {
    params,
    setParam,
    setParams,
    physicalState,
    isSimulating,
    activePreset,
    setActivePreset,
    applyPreset,
    runDemonstration,
    resetToBaseline
  };
}
