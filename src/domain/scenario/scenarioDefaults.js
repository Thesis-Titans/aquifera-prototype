/**
 * Authoritative Scenario Presets and Default Parameters
 * Single source of truth for exploratory scenario modeling in AQUIFERA.
 */

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
  },
  corridor: {
    name: '5. Commercial Corridor Stress (18k m³/d)',
    description: 'Concentrated commercial extraction inducing permanent clay compaction (Mandurriao corridor).',
    params: {
      pumpingRate: 18000,
      hydraulicConductivity: 14,
      specificStorage: 0.0001,
      rechargeRateMmYear: 80,
      pumpingDays: 180,
      wellCount: 2,
      wellX: 200,
      wellY: -150
    }
  }
};

export const DEFAULT_PARAMS = SCENARIO_PRESETS.baseline.params;
