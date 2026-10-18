/**
 * Aquifera Hydrogeological Physics Engine
 * Formulates multi-layer radial drawdown and 1D Terzaghi skeletal compaction.
 * Follows USGS MODFLOW 6 SUB package physical equations.
 */

// Domain Specifications (Matching CICT-UGR-F001 Aquifera Proposal)
export const DOMAIN = {
  widthMeters: 3200,      // 3.2 km
  lengthMeters: 3200,     // 3.2 km
  totalDepthMeters: 120,  // 120 m
  gridResolution: 64,     // 64x64 surface mesh
  layers: [
    { id: 'layer1', name: 'Upper Unconfined Sand', top: 0, bottom: 30, thickness: 30, type: 'sand', color: '#e0a96d' },
    { id: 'layer2', name: 'Clay Aquitard (Compressible)', top: 30, bottom: 60, thickness: 30, type: 'clay', color: '#a0522d' },
    { id: 'layer3', name: 'Lower Confined Aquifer', top: 60, bottom: 120, thickness: 60, type: 'sand', color: '#3b82f6' }
  ]
};

// Physical Constants
export const HYDRO_PARAMS = {
  initialHead: 95.0,          // h0 in meters above datum
  preconsolidationHead: 88.0, // h_pre in meters (critical threshold: 7.0m drawdown)
  sandTransmissivity: 240.0,  // T in m^2/day (Lower confined aquifer)
  sandStorativity: 0.0004,    // S (confined)
  sandSke: 2.5e-5,            // Elastic skeletal storage (m^-1)
  clayThickness: 30.0,        // b0 in meters
  claySke: 8.0e-5,            // Elastic skeletal storage of clay (m^-1) - up to 2-3 cm elastic
  claySkv: 2.8e-3,            // Inelastic skeletal storage of clay (m^-1) - rapid 15-40 cm collapse!
  clayTimeLagDays: 30.0       // Hydrodynamic lag tau
};

/**
 * Well function W(u) approximation (Theis equation)
 */
function wellFunctionW(u) {
  if (u <= 0) return 0;
  if (u > 10) return 0;
  if (u < 0.05) {
    // Cooper-Jacob approximation
    return -Math.log(u) - 0.5772156649;
  }
  // Polynomial approximation for moderate u
  const a0 = -0.57721566;
  const a1 = 0.99999193;
  const a2 = -0.24991055;
  const a3 = 0.05519968;
  const a4 = -0.00976004;
  const a5 = 0.00107857;
  return -Math.log(u) + a0 + u * (a1 + u * (a2 + u * (a3 + u * (a4 + u * a5))));
}

/**
 * Calculates 3D hydraulic head and 2D surface compaction field
 * @param {Object} params Pumping and environmental parameters
 * @returns {Object} Full physical state for 3D renderer and HUD
 */
export function computeGroundwaterState(params) {
  const {
    pumpingRate = 1200,      // Q in m^3/day
    pumpingDays = 180,       // Duration t in days
    rechargeRateMmDay = 1.5, // Natural recharge R in mm/day
    wellX = 0,               // Well center X (meters)
    wellY = 0,               // Well center Y (meters)
    wellCount = 1            // Secondary industrial well toggle
  } = params;

  const res = DOMAIN.gridResolution;
  const halfW = DOMAIN.widthMeters / 2;
  const step = DOMAIN.widthMeters / (res - 1);

  const T = HYDRO_PARAMS.sandTransmissivity;
  const S = HYDRO_PARAMS.sandStorativity;
  const h0 = HYDRO_PARAMS.initialHead;
  const hPre = HYDRO_PARAMS.preconsolidationHead;
  const bClay = HYDRO_PARAMS.clayThickness;

  // Recharge offset: net recharge replenishes head uniformly
  const rechargeMDay = rechargeRateMmDay / 1000.0;
  const rechargeHeadBoost = Math.min(3.5, (rechargeMDay * pumpingDays * 0.15));

  let minHead = h0;
  let maxDrawdown = 0;
  let maxSubsidenceM = 0;
  let totalInelasticSubsidenceM = 0;
  let totalElasticSubsidenceM = 0;
  let pointsInelastic = 0;

  // 2D displacement grid for Three.js heightfield
  const displacementGrid = new Float32Array(res * res);
  const headGrid = new Float32Array(res * res);
  const strainGrid = new Float32Array(res * res); // Compaction strain in clay

  // Wells array (Primary + optional secondary cluster)
  const wells = [
    { x: wellX, y: wellY, Q: pumpingRate }
  ];
  if (wellCount > 1) {
    wells.push({ x: wellX + 500, y: wellY - 400, Q: pumpingRate * 0.65 });
  }

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

      // Head drop in clay aquitard (incorporating hydrodynamic dissipation lag)
      const lagFactor = 1.0 - Math.exp(-pumpingDays / HYDRO_PARAMS.clayTimeLagDays);
      const headClay = h0 - (netDrawdown * lagFactor);

      // Terzaghi 1D consolidation calculation
      let deltaBElastic = 0;
      let deltaBInelastic = 0;

      if (headClay >= hPre) {
        // Purely elastic regime (reversible spring-like skeleton)
        const deltaH = h0 - headClay;
        deltaBElastic = bClay * HYDRO_PARAMS.claySke * deltaH;
      } else {
        // Inelastic regime: preconsolidation head breached!
        pointsInelastic++;
        const deltaHElastic = h0 - hPre;
        const deltaHInelastic = hPre - headClay;

        deltaBElastic = bClay * HYDRO_PARAMS.claySke * deltaHElastic;
        deltaBInelastic = bClay * HYDRO_PARAMS.claySkv * deltaHInelastic;
      }

      const totalCompactionM = deltaBElastic + deltaBInelastic;
      if (totalCompactionM > maxSubsidenceM) {
        maxSubsidenceM = totalCompactionM;
        totalInelasticSubsidenceM = deltaBInelastic;
        totalElasticSubsidenceM = deltaBElastic;
      }

      displacementGrid[idx] = totalCompactionM; // in meters
      headGrid[idx] = headLower;
      strainGrid[idx] = totalCompactionM / bClay; // Vertical strain
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
    resolution: res,
    minHead: parseFloat(minHead.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxSubsidenceCm: parseFloat(maxSubsidenceCm.toFixed(1)),
    isPreconsolidationBreached,
    inelasticPercent,
    elasticSubsidenceMm: parseFloat((totalElasticSubsidenceM * 1000).toFixed(1)),
    inelasticSubsidenceMm: parseFloat((totalInelasticSubsidenceM * 1000).toFixed(1)),
    pointsInelastic,
    pumpingRate,
    pumpingDays,
    rechargeRateMmDay,
    wells
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

  // Stratigraphic Layer Identification
  let stratum = {
    id: 'layer1',
    name: 'Upper Unconfined Sand',
    depthRange: '0 m to -30 m',
    lithology: 'Fine to coarse alluvial sand',
    kText: 'K_xx = 1.5 × 10⁻⁴ m/s',
    color: '#e0a96d'
  };

  if (depthMeters < -60) {
    stratum = {
      id: 'layer3',
      name: 'Lower Confined Aquifer',
      depthRange: '-60 m to -120 m',
      lithology: 'High-transmissivity production gravel & sand',
      kText: 'K_xx = 2.0 × 10⁻⁴ m/s',
      color: '#3b82f6'
    };
  } else if (depthMeters < -30) {
    stratum = {
      id: 'layer2',
      name: 'Compressible Clay Aquitard',
      depthRange: '-30 m to -60 m',
      lithology: 'Overconsolidated compressible illite/smectite clay',
      kText: 'K_zz = 1.2 × 10⁻⁸ m/s (Low permeability)',
      color: '#a0522d'
    };
  }

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
  const isYielding = localHeadM < HYDRO_PARAMS.preconsolidationHead && stratum.id === 'layer2';

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
