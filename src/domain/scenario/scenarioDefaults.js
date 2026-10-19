/**
 * Pre-configured hydrogeological scenarios for defense presentation
 */
export const SCENARIO_PRESETS = [
  {
    id: 'sustainable',
    name: '1. Sustainable Extraction Baseline',
    tag: 'Safe / Elastic',
    tagColor: 'var(--color-success)',
    description: 'Pumping within sustainable recharge limits. Groundwater head remains above preconsolidation threshold. Surface rebound is 100% reversible.',
    params: {
      pumpingRate: 450,
      pumpingDays: 90,
      rechargeRateMmDay: 3.0,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    }
  },
  {
    id: 'overextraction',
    name: '2. Industrial Over-Extraction Crisis',
    tag: 'Critical Inelastic Collapse',
    tagColor: 'var(--color-danger)',
    description: 'High-volume municipal/industrial pumping exceeds sustainable yield. Head drops below preconsolidation limit (85m), causing permanent clay pore collapse.',
    params: {
      pumpingRate: 2150,
      pumpingDays: 240,
      rechargeRateMmDay: 0.6,
      wellCount: 2,
      wellX: -150,
      wellY: 100
    }
  },
  {
    id: 'recharge',
    name: '3. Managed Aquifer Recharge (MAR)',
    tag: 'Mitigated / Managed',
    tagColor: 'var(--color-primary)',
    description: 'Targeted artificial surface recharge basins maintain hydraulic pressure, arresting subsidence acceleration before irreversible damage occurs.',
    params: {
      pumpingRate: 1100,
      pumpingDays: 180,
      rechargeRateMmDay: 4.5,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    }
  },
  {
    id: 'catastrophic',
    name: '4. Multi-Year Drought Shock',
    tag: 'Catastrophic Subsidence',
    tagColor: 'var(--color-warning)',
    description: 'Severe multi-year dry spell combined with peak agricultural pumping. Rapid clay dewatering leads to > 30 cm ground surface displacement.',
    params: {
      pumpingRate: 2450,
      pumpingDays: 360,
      rechargeRateMmDay: 0.2,
      wellCount: 2,
      wellX: 100,
      wellY: -200
    }
  }
];
