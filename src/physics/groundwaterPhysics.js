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
