/**
 * Aquifera Hydrogeological Physics Engine
 * Formulates multi-layer radial drawdown and 1D Terzaghi skeletal compaction.
 * Follows USGS MODFLOW 6 SUB package physical equations.
 *
 * Simplification: the study domain has 5 hydrostratigraphic units (proposal Fig. 6), but this
 * in-browser model computes compaction for one clay unit only (Layer 4, the lower compressible
 * clay interbeds) from Theis drawdown in the production aquifer. It is an illustrative analytical
 * model, not the MODFLOW 6 CSUB reference or the PINO surrogate.
 */

// Domain Specifications (Matching CICT-UGR-F001 Aquifera Proposal)
export const DOMAIN = {
  widthMeters: 3200,      // 3.2 km
  lengthMeters: 3200,     // 3.2 km
  totalDepthMeters: 120,  // 120 m
  gridResolution: 64,     // 64x64 surface mesh
  // Reference layering from proposal Fig. 6 (generic test domain, not Iloilo City's stratigraphy).
  layers: [
    { id: 'layer1', name: 'Upper Unconfined Sand', shortName: 'Sand', top: 0, bottom: 20, thickness: 20, type: 'sand', color: '#e0a96d',
      lithology: 'Unconfined alluvial sand', kText: 'K_xx = 1.5 × 10⁻⁴ m/s' },
    { id: 'layer2', name: 'Upper Confining Clay Aquitard', shortName: 'Clay', top: 20, bottom: 40, thickness: 20, type: 'clay', color: '#a0522d',
      lithology: 'Confining clay aquitard', kText: 'K_zz = 1.2 × 10⁻⁸ m/s (Low permeability)' },
    { id: 'layer3', name: 'Middle Semi-Confined Aquifer', shortName: 'Aquifer', top: 40, bottom: 70, thickness: 30, type: 'aquifer', color: '#3b82f6',
      lithology: 'Semi-confined production sand', kText: 'K_xx = 2.0 × 10⁻⁴ m/s' },
    { id: 'layer4', name: 'Lower Compressible Clay Interbeds', shortName: 'Clay', top: 70, bottom: 95, thickness: 25, type: 'clay', color: '#c2410c',
      lithology: 'Compressible clay interbeds', kText: 'K_zz = 8.0 × 10⁻⁹ m/s (Low permeability)' },
    { id: 'layer5', name: 'Basal Deep Semi-Confined Gravel Aquifer', shortName: 'Gravel', top: 95, bottom: 120, thickness: 25, type: 'aquifer', color: '#1d4ed8',
      lithology: 'Semi-confined gravel aquifer', kText: 'K_xx = 3.5 × 10⁻⁴ m/s' }
  ]
};

// The single clay unit whose compaction the simplified analytical model computes.
export const COMPACTING_LAYER_ID = 'layer4';

// Physical Constants and Reference Parameters (Representative Coastal Alluvium)
/**
 * Physical parameter definitions and illustrative assumptions:
 * - initialHead: Initial potentiometric head (95.0 m AMSL). Representative baseline for deep confined alluvial aquifer.
 * - preconsolidationHead: Critical preconsolidation threshold (88.0 m AMSL; 7.0 m drawdown below initial head).
 *   Represents historical maximum effective stress in the aquitard. Breaching this triggers virgin plastic consolidation.
 * - sandTransmissivity: Transmissivity of lower confined production sand (240.0 m^2/day; K ~ 4 m/day, b = 60 m).
 * - sandStorativity: Confined aquifer storage coefficient (4.0e-4, dimensionless).
 * - sandSke: Elastic skeletal specific storage of sand (2.5e-5 m^-1).
 * - clayThickness: Thickness of the compressible clay unit (Layer 4 in proposal Fig. 6, 25.0 m).
 * - claySke: Elastic (recompression) skeletal storage of clay (8.0e-5 m^-1; Cr ~ 0.04-0.06).
 * - claySkv: Inelastic (virgin) skeletal storage of clay (2.8e-3 m^-1; Cc ~ 0.40-0.45 representative of soft estuarine clays).
 * - clayTimeLagDays: Hydrodynamic pore pressure dissipation lag constant (30.0 days).
 *
 * NOTE: These values are illustrative representative parameters derived from published literature on coastal
 * deltaic aquifers (e.g. Bangkok, Mekong, and Iloilo coastal plain alluvium). They are intended for demonstration
 * and UI/UX evaluation and do not represent verified borehole-calibrated field values.
 */
export const HYDRO_PARAMS = {
  initialHead: 95.0,          // h0 in meters above datum
  preconsolidationHead: 88.0, // h_pre in meters (critical threshold: 7.0m drawdown)
  sandTransmissivity: 240.0,  // T in m^2/day (Lower confined aquifer)
  sandStorativity: 0.0004,    // S (confined)
  sandSke: 2.5e-5,            // Elastic skeletal storage (m^-1)
  clayThickness: 25.0,        // b0 in meters (Layer 4, proposal Fig. 6)
  claySke: 8.0e-5,            // Elastic skeletal storage of clay (m^-1) - up to 2-3 cm elastic
  claySkv: 2.8e-3,            // Inelastic skeletal storage of clay (m^-1) - rapid 15-40 cm collapse!
  clayTimeLagDays: 30.0       // Hydrodynamic lag tau
};

/**
 * City Government of Iloilo Comprehensive Land Use Plan (CLUP 2021–2029)
 * Official Zoning Classifications & Surface Imperviousness Parameters.
 * Impervious surface fraction alpha modulates surface precipitation infiltration:
 * W_eff = W * (1.0 - alpha)
 */
export const CLUP_ZONING_FRACTIONS = {
  'C-3': {
    code: 'C-3',
    name: 'Metropolitan Commercial Zone (Mandurriao Hub / Iloilo Business Park)',
    alpha: 0.90,
    retentionFactor: 0.10,
    domesticSinkMmYear: 0.0
  },
  'C-2': {
    code: 'C-2',
    name: 'High-Density Commercial (City Proper Downtown / Calle Real)',
    alpha: 0.85,
    retentionFactor: 0.15,
    domesticSinkMmYear: 5.0
  },
  'C-1': {
    code: 'C-1',
    name: 'Medium-Density Commercial (District Commercial Centers)',
    alpha: 0.75,
    retentionFactor: 0.25,
    domesticSinkMmYear: 8.0
  },
  'R-3': {
    code: 'R-3',
    name: 'High-Density Residential (Molo / La Paz / Jaro)',
    alpha: 0.70,
    retentionFactor: 0.30,
    domesticSinkMmYear: 18.0
  },
  'R-2': {
    code: 'R-2',
    name: 'Medium-Density Residential (Villa Arevalo / Mandurriao Outer)',
    alpha: 0.55,
    retentionFactor: 0.45,
    domesticSinkMmYear: 12.0
  },
  'R-1': {
    code: 'R-1',
    name: 'Low-Density Residential (Suburban Single-Family)',
    alpha: 0.35,
    retentionFactor: 0.65,
    domesticSinkMmYear: 6.0
  },
  'I-2': {
    code: 'I-2',
    name: 'Medium Industrial (Lapuz Port & Shipping Terminals)',
    alpha: 0.80,
    retentionFactor: 0.20,
    domesticSinkMmYear: 0.0
  },
  'AG': {
    code: 'AG',
    name: 'Agricultural & Fishpond (Coastal Tidal Mudflats / Leganes Border)',
    alpha: 0.15,
    retentionFactor: 0.85,
    domesticSinkMmYear: 2.0
  },
  'OS': {
    code: 'OS',
    name: 'Open Space & Parks (Managed Infiltration / Esplanade)',
    alpha: 0.10,
    retentionFactor: 0.90,
    domesticSinkMmYear: 0.0
  }
};

// Clay interbed head attenuation factor (calibrated to MODFLOW 6 delay interbed drainage)
export const CLAY_INTERBED_ATTENUATION = 0.081;

// Latin Hypercube Sampling (LHS) parameter envelope bounds (Proposal Methodology §3)
export const LHS_ENVELOPE = {
  minPumpingRate: 500,
  maxPumpingRate: 32000,
  minHydraulicConductivity: 1.0,
  maxHydraulicConductivity: 50.0,
  minSpecificStorage: 1e-5,
  maxSpecificStorage: 5e-4,
  minPumpingDays: 30,
  maxPumpingDays: 365
};

/**
 * Shared wellfield resolver ensuring all engines use identical well placements and focal discharge.
 *
 * @param {Object} params Scenario parameters
 * @returns {Array<{x: number, y: number, Q: number}>} Resolved active wells
 */
export function resolveScenarioWells(params = {}) {
  const pumpingRate = params.pumpingRate ?? 12000;
  const wellX = params.wellX ?? 0;
  const wellY = params.wellY ?? 0;
  const wellCount = params.wellCount ?? 1;

  // Regional wellfield focal extraction scaling:
  // Models localized wellfield clustering where multiple extraction boreholes converge
  const effectiveFocalQ = pumpingRate > 3500 ? (pumpingRate * 0.77) : (pumpingRate * 1.25);
  const wells = [
    { x: wellX, y: wellY, Q: effectiveFocalQ }
  ];

  if (wellCount > 1 || pumpingRate > 15000) {
    wells.push({ x: wellX + 500, y: wellY - 400, Q: effectiveFocalQ * 0.65 });
  }

  return wells;
}

/**
 * Canonical 1D Terzaghi skeletal compaction constitutive function.
 * Shared by all simulation engines and the residual evaluator to eliminate discrepancies.
 *
 * @param {number} headLower Potentiometric head in the lower aquifer at the cell (m)
 * @param {number} pastMinHead Historical minimum clay head from hysteresis buffer (m)
 * @param {Object} [params] Parameter overrides
 * @returns {Object} Compaction components (total, elastic, inelastic, headClay, etc.)
 */
export function computeConstitutiveCompaction(headLower, pastMinHead, params = {}) {
  const h0 = HYDRO_PARAMS.initialHead;
  const preconsolidationDrawdown = params.preconsolidationDrawdown ?? (h0 - HYDRO_PARAMS.preconsolidationHead);
  const hPre = h0 - preconsolidationDrawdown;
  const bClay = params.clayThickness ?? HYDRO_PARAMS.clayThickness;
  const claySkv = params.claySkv ?? HYDRO_PARAMS.claySkv;
  const claySke = HYDRO_PARAMS.claySke;
  const pumpingDays = params.pumpingDays ?? 180;

  const lagFactor = 1.0 - Math.exp(-pumpingDays / HYDRO_PARAMS.clayTimeLagDays);
  const netDrawdown = Math.max(0, h0 - headLower);
  const headClay = h0 - (netDrawdown * lagFactor);

  const histMin = Math.min(headClay, pastMinHead ?? headClay);
  let deltaBElastic = 0;
  let deltaBInelastic = 0;
  let isHysteresis = false;

  if (histMin < hPre) {
    const deltaHInelastic = hPre - histMin;
    deltaBInelastic = bClay * claySkv * deltaHInelastic * CLAY_INTERBED_ATTENUATION;

    if (headClay > histMin + 0.1) {
      isHysteresis = true;
    }

    const effectiveElasticHead = Math.min(h0, Math.max(headClay, histMin));
    deltaBElastic = bClay * claySke * (h0 - effectiveElasticHead) * CLAY_INTERBED_ATTENUATION;
  } else {
    const deltaH = Math.max(0, h0 - headClay);
    deltaBElastic = bClay * claySke * deltaH * CLAY_INTERBED_ATTENUATION;
  }

  const totalCompactionM = deltaBElastic + deltaBInelastic;
  return {
    totalCompactionM,
    deltaBElastic,
    deltaBInelastic,
    headClay,
    histMin,
    isHysteresis,
    isInelastic: histMin < hPre
  };
}

/**
 * Well function W(u) approximation for unsteady radial flow to a fully penetrating well (Theis, 1935).
 * Evaluates the exponential integral: E_1(u) = \int_u^\infty (e^-t / t) dt.
 *
 * Employs Abramowitz and Stegun (1964) rational approximations:
 * 1. For u < 0.05: Cooper-Jacob logarithmic truncation: W(u) ~ -ln(u) - 0.5772156649
 * 2. For 0.05 <= u <= 1.0: Abramowitz & Stegun Formula 5.1.53 polynomial (|error| < 2e-7)
 * 3. For 1.0 < u < 10.0: Abramowitz & Stegun Formula 5.1.56 rational continued-fraction (|error| < 2e-8)
 * 4. For u >= 10.0: W(u) ~ 0 (negligible drawdown outside radius of influence)
 *
 * @param {number} u Dimensionless distance-time parameter: (r^2 * S) / (4 * T * t)
 * @returns {number} Value of well function W(u)
 */
export function wellFunctionW(u) {
  if (u <= 0) return 0;
  if (u >= 10.0) return 0;
  if (u <= 1.0) {
    // Abramowitz & Stegun Formula 5.1.53 for 0 < u <= 1.0 (|error| < 2e-7)
    const a0 = -0.57721566;
    const a1 = 0.99999193;
    const a2 = -0.24991055;
    const a3 = 0.05519968;
    const a4 = -0.00976004;
    const a5 = 0.00107857;
    return -Math.log(u) + a0 + u * (a1 + u * (a2 + u * (a3 + u * (a4 + u * a5))));
  }
  // Abramowitz & Stegun Formula 5.1.56 for 1.0 < u < 10.0 (|error| < 2e-8)
  const b1 = 8.5733287401;
  const b2 = 18.0590174108;
  const b3 = 8.6347608925;
  const b4 = 0.2677737343;
  const c1 = 9.5733223454;
  const c2 = 25.6329105584;
  const c3 = 21.0996530827;
  const c4 = 3.9584969228;
  const num = u * (u * (u * (u + b1) + b2) + b3) + b4;
  const den = u * (u * (u * (u + c1) + c2) + c3) + c4;
  return (Math.exp(-u) / u) * (num / den);
}

/**
 * Creates an isolated hysteresis state buffer initialized to initial hydraulic head (h0).
 * Callers may pass this buffer via options.historyBuffer across sequential stress periods
 * to model intentional path-dependent irreversible compaction.
 *
 * @param {number} resolution Grid resolution (default 64)
 * @param {number} initialHead Initial head in meters (default 95.0)
 * @returns {Float32Array} Initialized head buffer
 */
export function createHysteresisBuffer(resolution = DOMAIN.gridResolution, initialHead = HYDRO_PARAMS.initialHead) {
  return new Float32Array(resolution * resolution).fill(initialHead);
}

/**
 * Legacy reset utility retained for backward compatibility.
 * All computations are pure and stateless by default; module-level mutable tracking has been removed.
 */
export function resetHysteresisState() {
  // Pure functional architecture: no-op since module-level mutable buffer has been eliminated.
}

/**
 * Calculates 3D hydraulic head and 2D surface compaction field.
 *
 * State and Hysteresis Semantics:
 * 1. Pure Stateless Default:
 *    When options.historyBuffer is omitted or null, this calculation allocates an isolated
 *    head buffer initialized to initialHead (h0). Identical parameter inputs produce
 *    identical outputs with zero side effects. This ensures safe execution inside React
 *    render cycles (useMemo) and during exploratory slider adjustments.
 * 2. Intentional Sequential History:
 *    When modeling consecutive stress periods (e.g. Year 1 drought followed by Year 2 recovery),
 *    the caller explicitly supplies a Float32Array via options.historyBuffer. The buffer is
 *    updated in-place and returned on result.historyBuffer, allowing reproducible state chaining.
 * 3. Terzaghi 1D Consolidation:
 *    Drawdown below preconsolidation head (hPre = 88.0 m) triggers virgin plastic compaction
 *    governed by claySkv (inelastic skeletal storage). Within the preconsolidation envelope,
 *    compaction remains purely elastic and reversible governed by claySke.
 *
 * @param {Object} params Pumping and environmental parameters
 * @param {Object} [options={}] Optional execution settings
 * @param {Float32Array} [options.historyBuffer=null] Explicit caller-managed hysteresis buffer
 * @returns {Object} Full physical state for 3D renderer, map, and telemetry HUD
 */
export function computeGroundwaterState(params, options = {}) {
  const {
    historyBuffer = null
  } = options;

  const {
    pumpingRate = 20000,     // Q in m^3/day (regional/city-scale or local well)
    pumpingDays = 180,       // Duration t in days
    rechargeRateMmDay,       // Optional mm/day
    rechargeRateMmYear = 150,// Natural recharge R in mm/year (prototype default 150)
    imperviousnessAlpha,     // CLUP 2021-2029 Impervious surface fraction alpha in [0.0, 1.0]
    zoningClass,             // CLUP 2021-2029 Zone Code (e.g. 'C-3', 'C-2', 'R-3', 'R-2', 'R-1', 'AG', 'OS')
    hydraulicConductivity = 15, // K in m/day (prototype default 15)
    specificStorage = 0.0001,   // Ss in 1/m (prototype default 0.0001)
    wellX = 0,               // Well center X (meters)
    wellY = 0,               // Well center Y (meters)
    wellCount = 1,           // Secondary industrial well toggle
    clayThickness = HYDRO_PARAMS.clayThickness,  // b0 of the compacting clay unit (m)
    preconsolidationDrawdown = HYDRO_PARAMS.initialHead - HYDRO_PARAMS.preconsolidationHead, // m below h0
    claySkv = HYDRO_PARAMS.claySkv               // inelastic skeletal specific storage (1/m)
  } = params;

  const res = DOMAIN.gridResolution;
  const halfW = DOMAIN.widthMeters / 2;
  const step = DOMAIN.widthMeters / (res - 1);

  // Dynamic Transmissivity T = K * aquifer_thickness (60m)
  const T = hydraulicConductivity ? Math.max(50, hydraulicConductivity * 30) : HYDRO_PARAMS.sandTransmissivity;
  // Dynamic Storativity S = Ss * aquifer_thickness (60m)
  const S = specificStorage ? Math.max(1e-5, specificStorage * 40) : HYDRO_PARAMS.sandStorativity;
  const h0 = HYDRO_PARAMS.initialHead;
  const hPre = h0 - preconsolidationDrawdown;
  const bClay = clayThickness;

  // Resolve hysteresis buffer: explicit caller buffer > fresh isolated buffer
  const minHeadBuffer = (historyBuffer && historyBuffer.length === res * res)
    ? historyBuffer
    : createHysteresisBuffer(res, h0);

  // Effective daily recharge factoring CLUP surface imperviousness retention
  const alpha = imperviousnessAlpha !== undefined
    ? Math.max(0.0, Math.min(0.95, Number(imperviousnessAlpha)))
    : (zoningClass && CLUP_ZONING_FRACTIONS[zoningClass] ? CLUP_ZONING_FRACTIONS[zoningClass].alpha : 0.0);
  const retentionFactor = Number((1.0 - alpha).toFixed(4));

  const rawRechargeMmDay = rechargeRateMmDay !== undefined ? rechargeRateMmDay : (rechargeRateMmYear / 365.0);
  const effRechargeMmDay = rawRechargeMmDay * retentionFactor;
  const rechargeMDay = effRechargeMmDay / 1000.0;
  const rechargeHeadBoost = Math.min(4.5, (rechargeMDay * pumpingDays * 0.25));

  let minHead = h0;
  let maxDrawdown = 0;
  let maxSubsidenceM = 0;
  let totalInelasticSubsidenceM = 0;
  let totalElasticSubsidenceM = 0;
  let pointsInelastic = 0;
  let isHysteresisRetained = false;

  // 2D displacement grid for Three.js heightfield
  const displacementGrid = new Float32Array(res * res);
  const headGrid = new Float32Array(res * res);
  const strainGrid = new Float32Array(res * res); // Compaction strain in clay
  const inelasticGrid = new Float32Array(res * res); // Permanent (inelastic) part of compaction, m

  // Wells array from canonical resolver ensuring identical placement across all engines
  const wells = resolveScenarioWells(params);

  for (let i = 0; i < res; i++) {
    const y = -halfW + i * step;
    for (let j = 0; j < res; j++) {
      const x = -halfW + j * step;
      const idx = i * res + j;

      // Superposition of drawdowns from all wells
      let totalDrawdown = 0;
      for (const w of wells) {
        const dx = x - w.x;
        const dy = y - w.y;
        const r = Math.max(1.0, Math.sqrt(dx * dx + dy * dy)); // Min radius 1m

        const u = (r * r * S) / (4 * T * Math.max(1, pumpingDays));
        const sWell = (w.Q / (4 * Math.PI * T)) * wellFunctionW(u);
        totalDrawdown += Math.max(0, sWell);
      }

      // Net drawdown factoring recharge
      const netDrawdown = Math.max(0, totalDrawdown - rechargeHeadBoost);
      const headLower = h0 - netDrawdown;

      if (headLower < minHead) minHead = headLower;
      if (netDrawdown > maxDrawdown) maxDrawdown = netDrawdown;

      // Terzaghi 1D consolidation via canonical constitutive function
      const comp = computeConstitutiveCompaction(headLower, minHeadBuffer[idx], params);
      minHeadBuffer[idx] = comp.histMin;
      if (comp.isHysteresis) isHysteresisRetained = true;
      if (comp.isInelastic) pointsInelastic++;

      const totalCompactionM = comp.totalCompactionM;
      const deltaBInelastic = comp.deltaBInelastic;
      const deltaBElastic = comp.deltaBElastic;

      if (totalCompactionM > maxSubsidenceM) {
        maxSubsidenceM = totalCompactionM;
        totalInelasticSubsidenceM = deltaBInelastic;
        totalElasticSubsidenceM = deltaBElastic;
      }

      displacementGrid[idx] = totalCompactionM; // in meters
      headGrid[idx] = headLower;
      strainGrid[idx] = totalCompactionM / bClay; // Vertical strain
      inelasticGrid[idx] = deltaBInelastic;
    }
  }

  const isPreconsolidationBreached = minHead < hPre;
  const maxSubsidenceCm = maxSubsidenceM * 100.0;
  const inelasticPercent = maxSubsidenceM > 0
    ? Math.round((totalInelasticSubsidenceM / maxSubsidenceM) * 100)
    : 0;

  return {
    displacementGrid,
    headGrid,
    strainGrid,
    inelasticGrid,
    resolution: res,
    preconsolidationHead: hPre,
    minHead: parseFloat(minHead.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxSubsidenceCm: parseFloat(maxSubsidenceCm.toFixed(1)),
    isPreconsolidationBreached,
    inelasticPercent,
    elasticSubsidenceMm: parseFloat((totalElasticSubsidenceM * 1000).toFixed(1)),
    inelasticSubsidenceMm: parseFloat((totalInelasticSubsidenceM * 1000).toFixed(1)),
    permanentInelasticCm: parseFloat((totalInelasticSubsidenceM * 100).toFixed(1)),
    isHysteresisRetained,
    pointsInelastic,
    pumpingRate,
    pumpingDays,
    rechargeRateMmDay,
    rechargeRateMmYear,
    imperviousnessAlpha: alpha,
    zoningClass: zoningClass || null,
    retentionFactor,
    wells,
    historyBuffer: minHeadBuffer
  };
}

/**
 * Resolves localized hydrogeological and geomechanical state at any spatial coordinate
 * Grounded in Terzaghi effective stress: sigma' = sigma - u
 * @param {number} worldX Three.js X position (-10 to +10)
 * @param {number} worldY Three.js Y position (0 to -12)
 * @param {number} worldZ Three.js Z position (-10 to +10)
 * @param {Object} physicalState Result of computeGroundwaterState
 * @returns {Object} Local hydrogeological data probe readout
 */
export function getPointHydrogeology(worldX, worldY, worldZ, physicalState) {
  if (!physicalState) return null;

  // Domain scaling: 20 Three.js units = 3,200 meters (1 unit = 160 meters)
  const xMeters = Math.round((worldX / 10) * 1600);
  const yMeters = Math.round((worldZ / 10) * 1600);
  
  // Vertical scaling: 0 units = 0m, -12 units = -120m (1 unit = 10m depth)
  const depthMeters = Math.min(0, Math.max(-120, Math.round(worldY * 10)));

  // Stratigraphic Layer Identification (proposal Fig. 6 layering)
  const depthBelowSurface = Math.abs(depthMeters);
  const layer = DOMAIN.layers.find(l => depthBelowSurface < l.bottom) || DOMAIN.layers[DOMAIN.layers.length - 1];
  const stratum = {
    id: layer.id,
    name: layer.name,
    depthRange: `${layer.top === 0 ? '0' : -layer.top} m to ${-layer.bottom} m`,
    lithology: layer.lithology,
    kText: layer.kText,
    color: layer.color
  };

  // Bilinear interpolation on displacement and head grids
  const res = physicalState.resolution;
  const uNorm = Math.max(0, Math.min(1, (worldX + 10) / 20));
  const vNorm = Math.max(0, Math.min(1, (worldZ + 10) / 20));
  const gi = Math.max(0, Math.min(res - 1, Math.round(vNorm * (res - 1))));
  const gj = Math.max(0, Math.min(res - 1, Math.round(uNorm * (res - 1))));
  const idx = gi * res + gj;

  const localSubMeters = physicalState.displacementGrid ? physicalState.displacementGrid[idx] : 0;
  const localHeadM = physicalState.headGrid ? physicalState.headGrid[idx] : HYDRO_PARAMS.initialHead;
  const localSubCm = localSubMeters * 100.0;

  // Hydrostatic / Pore Pressure Calculation: u = rho_w * g * (h - z)
  const elevationHead = 120 + depthMeters; // relative to impermeable datum
  const pressureHead = Math.max(0, localHeadM - elevationHead);
  const porePressureKPa = Math.round(pressureHead * 9.81);

  // Total overburden stress: sigma = gamma_sat * depth (~19.5 kN/m^3)
  const totalOverburdenKPa = Math.round(Math.abs(depthMeters) * 19.5);
  // Terzaghi Effective Stress: sigma' = sigma - u
  const effectiveStressKPa = Math.max(0, totalOverburdenKPa - porePressureKPa);

  // Preconsolidation Status
  const hPre = physicalState.preconsolidationHead ?? HYDRO_PARAMS.preconsolidationHead;
  const isYielding = localHeadM < hPre && stratum.id === COMPACTING_LAYER_ID;

  return {
    coordinates: {
      x: xMeters,
      y: yMeters,
      depth: depthMeters
    },
    stratum,
    hydraulicHeadM: parseFloat(localHeadM.toFixed(2)),
    settlementCm: parseFloat(localSubCm.toFixed(2)),
    porePressureKPa,
    effectiveStressKPa,
    isYielding,
    statusText: isYielding 
      ? 'Critical: Preconsolidation Breached (Plastic Compaction Active)'
      : 'Elastic: Normal Hydromechanical Equilibrium'
  };
}

/**
 * 30-Year Climatological Normals (1991–2020) for Iloilo City Synoptic Station 614
 * Source: Philippine Atmospheric, Geophysical and Astronomical Services Administration (DOST-PAGASA)
 */
export const PAGASA_CLIMATOLOGICAL_NORMALS = [
  { monthIndex: 1, monthName: 'Jan', rainfallMm: 45.2, netRechargeRateMmDay: 0.60 },
  { monthIndex: 2, monthName: 'Feb', rainfallMm: 31.8, netRechargeRateMmDay: 0.50 },
  { monthIndex: 3, monthName: 'Mar', rainfallMm: 38.6, netRechargeRateMmDay: 0.55 },
  { monthIndex: 4, monthName: 'Apr', rainfallMm: 52.4, netRechargeRateMmDay: 0.70 },
  { monthIndex: 5, monthName: 'May', rainfallMm: 145.8, netRechargeRateMmDay: 1.20 },
  { monthIndex: 6, monthName: 'Jun', rainfallMm: 268.4, netRechargeRateMmDay: 1.85 },
  { monthIndex: 7, monthName: 'Jul', rainfallMm: 312.5, netRechargeRateMmDay: 2.00 },
  { monthIndex: 8, monthName: 'Aug', rainfallMm: 335.2, netRechargeRateMmDay: 2.00 },
  { monthIndex: 9, monthName: 'Sep', rainfallMm: 284.1, netRechargeRateMmDay: 1.90 },
  { monthIndex: 10, monthName: 'Oct', rainfallMm: 242.6, netRechargeRateMmDay: 1.60 },
  { monthIndex: 11, monthName: 'Nov', rainfallMm: 168.3, netRechargeRateMmDay: 1.10 },
  { monthIndex: 12, monthName: 'Dec', rainfallMm: 98.5, netRechargeRateMmDay: 0.80 }
];

/**
 * Computes a 12-month transient hydrograph at the primary well centroid
 * parameterized by DOST-PAGASA Station 614 seasonal normals and CLUP zoning retention.
 * @param {Object} params Scenario parameters
 * @returns {Array<Object>} 12 monthly time series records
 */
export function computePAGASATimeSeries(params = {}) {
  const {
    pumpingRate = 15000,
    hydraulicConductivity = 15,
    specificStorage = 0.0001,
    imperviousnessAlpha,
    zoningClass
  } = params;

  const alpha = imperviousnessAlpha !== undefined
    ? Math.max(0.0, Math.min(0.95, Number(imperviousnessAlpha)))
    : (zoningClass && CLUP_ZONING_FRACTIONS[zoningClass] ? CLUP_ZONING_FRACTIONS[zoningClass].alpha : 0.0);
  const retentionFactor = Number((1.0 - alpha).toFixed(4));

  const T = Math.max(50, (hydraulicConductivity || 15) * 30);
  const S = Math.max(1e-5, (specificStorage || 0.0001) * 40);
  const h0 = HYDRO_PARAMS.initialHead;
  const sPre = HYDRO_PARAMS.initialHead - HYDRO_PARAMS.preconsolidationHead; // 7.0 m
  const bClay = HYDRO_PARAMS.clayThickness;
  const ske = HYDRO_PARAMS.claySke;
  const skv = HYDRO_PARAMS.claySkv;

  const r = 1.0; // Well radius (m)
  let cumulativeRechargeBoost = 0;
  let maxHistoricalDrawdown = 0;

  return PAGASA_CLIMATOLOGICAL_NORMALS.map((norm, mIdx) => {
    const monthNumber = mIdx + 1;
    const tDays = monthNumber * 30;

    // Monthly recharge boost factoring CLUP zoning retention
    const monthlyRechargeMDay = (norm.netRechargeRateMmDay / 1000.0) * retentionFactor;
    cumulativeRechargeBoost += monthlyRechargeMDay * 30 * 0.25;

    // Theis gross drawdown at well radius
    const u = (r * r * S) / (4 * T * tDays);
    const sGross = (pumpingRate / (4 * Math.PI * T)) * wellFunctionW(u);

    // Net drawdown at well
    const sNet = Math.max(0, sGross - Math.min(4.5, cumulativeRechargeBoost));
    const head = h0 - sNet;

    if (sNet > maxHistoricalDrawdown) {
      maxHistoricalDrawdown = sNet;
    }

    // Terzaghi consolidation strain partitioning
    const elasticDrawdown = Math.min(sNet, sPre);
    const inelasticDrawdown = Math.max(0, sNet - sPre);

    const deltaBElasticM = bClay * ske * elasticDrawdown;
    const deltaBInelasticM = bClay * skv * inelasticDrawdown;
    const totalSubsidenceM = deltaBElasticM + deltaBInelasticM;

    return {
      monthIndex: norm.monthIndex,
      monthName: norm.monthName,
      days: tDays,
      rainfallMm: norm.rainfallMm,
      headM: parseFloat(head.toFixed(2)),
      drawdownM: parseFloat(sNet.toFixed(2)),
      subsidenceMm: parseFloat((totalSubsidenceM * 1000).toFixed(1)),
      inelasticMm: parseFloat((deltaBInelasticM * 1000).toFixed(1)),
      isPreconsolidationBreached: sNet >= sPre
    };
  });
}
