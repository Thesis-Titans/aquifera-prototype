/**
 * Output fields derived from computeGroundwaterState, shared by the 2D map, the profile chart,
 * the summary cards, and the GeoJSON export, so that every view shows the same model.
 *
 * Grid convention (same as the 3D view): node (i, j) sits at x = -1600 + j * step (east),
 * y = -1600 + i * step (south positive), with step = 3200 / 63 m.
 */
import { DOMAIN, HYDRO_PARAMS } from './groundwaterPhysics.js';

// Display placement of the synthetic 3.2 km test domain on the Iloilo City basemap.
// This places the generic domain for context only; it is not a model of Iloilo City's stratigraphy.
export const DOMAIN_ANCHOR = { lng: 122.5621, lat: 10.7202 };

const M_PER_DEG_LAT = 110574;
const M_PER_DEG_LNG = 111320 * Math.cos((DOMAIN_ANCHOR.lat * Math.PI) / 180);

export function metersToLngLat(x, y) {
  return [DOMAIN_ANCHOR.lng + x / M_PER_DEG_LNG, DOMAIN_ANCHOR.lat - y / M_PER_DEG_LAT];
}

export function lngLatToMeters(lng, lat) {
  return [(lng - DOMAIN_ANCHOR.lng) * M_PER_DEG_LNG, (DOMAIN_ANCHOR.lat - lat) * M_PER_DEG_LAT];
}

export const DOMAIN_BOUNDS = (() => {
  const half = DOMAIN.widthMeters / 2;
  const [west, north] = metersToLngLat(-half, -half);
  const [east, south] = metersToLngLat(half, half);
  return { west, east, south, north };
})();

// Quantities shown in the views. Fixed display ranges keep colors comparable across scenarios.
export const QUANTITIES = {
  subsidence: {
    label: 'Land subsidence',
    unit: 'cm',
    max: 50,
    decimals: 1,
    value: (state, idx) => state.displacementGrid[idx] * 100
  },
  drawdown: {
    label: 'Head drawdown',
    unit: 'm',
    max: 100,
    decimals: 1,
    value: (state, idx) => Math.max(0, HYDRO_PARAMS.initialHead - state.headGrid[idx])
  },
  inelastic: {
    label: 'Permanent (inelastic) compaction',
    unit: 'cm',
    max: 50,
    decimals: 1,
    value: (state, idx) => state.inelasticGrid[idx] * 100
  }
};

export const COLOR_SCALES = {
  standard: { label: 'Standard (cyan to crimson)', colors: ['#0e7490', '#10b981', '#eab308', '#f97316', '#dc2626'] },
  viridis: { label: 'Viridis (color-blind safe)', colors: ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725'] },
  turbo: { label: 'Turbo', colors: ['#30123b', '#4686fb', '#1ae4b6', '#faba39', '#7a0403'] }
};

export function quantityAt(state, key, idx) {
  return QUANTITIES[key].value(state, idx);
}

/** Largest value of a quantity over the grid. */
export function quantityMax(state, key) {
  const n = state.resolution * state.resolution;
  let max = 0;
  for (let idx = 0; idx < n; idx++) max = Math.max(max, quantityAt(state, key, idx));
  return max;
}

/** MapLibre fill-color expression for a normalized 0..1 property `v`. */
export function fillColorExpression(scaleKey) {
  const { colors } = COLOR_SCALES[scaleKey] || COLOR_SCALES.standard;
  const expr = ['interpolate', ['linear'], ['get', 'v']];
  colors.forEach((c, k) => expr.push(k / (colors.length - 1), c));
  return expr;
}

export function cssGradient(scaleKey) {
  const { colors } = COLOR_SCALES[scaleKey] || COLOR_SCALES.standard;
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/**
 * GeoJSON cells for the map. stride = 2 aggregates the 64 x 64 node grid into 32 x 32 cells
 * of about 100 m so the map stays responsive; each cell takes the value of its first node.
 */
export function buildGridGeoJSON(state, key, stride = 2) {
  const res = state.resolution;
  const step = DOMAIN.widthMeters / (res - 1);
  const half = DOMAIN.widthMeters / 2;
  const q = QUANTITIES[key];
  const features = [];
  for (let i = 0; i < res; i += stride) {
    for (let j = 0; j < res; j += stride) {
      const idx = i * res + j;
      const x0 = -half + j * step - step / 2;
      const y0 = -half + i * step - step / 2;
      const x1 = x0 + stride * step;
      const y1 = y0 + stride * step;
      const value = q.value(state, idx);
      features.push({
        type: 'Feature',
        id: idx,
        properties: { idx, v: Math.min(1, value / q.max) },
        geometry: {
          type: 'Polygon',
          coordinates: [[metersToLngLat(x0, y0), metersToLngLat(x1, y0), metersToLngLat(x1, y1), metersToLngLat(x0, y1), metersToLngLat(x0, y0)]]
        }
      });
    }
  }
  return { type: 'FeatureCollection', features };
}

export function domainOutlineGeoJSON() {
  const h = DOMAIN.widthMeters / 2;
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [metersToLngLat(-h, -h), metersToLngLat(h, -h), metersToLngLat(h, h), metersToLngLat(-h, h), metersToLngLat(-h, -h)]
    }
  };
}

/** Values at one node, with its offset from the domain centre. */
export function describeNode(state, idx) {
  const res = state.resolution;
  const step = DOMAIN.widthMeters / (res - 1);
  const half = DOMAIN.widthMeters / 2;
  const i = Math.floor(idx / res);
  const j = idx % res;
  return {
    idx,
    x: Math.round(-half + j * step),
    y: Math.round(-half + i * step),
    subsidence: quantityAt(state, 'subsidence', idx),
    drawdown: quantityAt(state, 'drawdown', idx),
    inelastic: quantityAt(state, 'inelastic', idx)
  };
}

/** Nearest grid node to a domain position in metres, or null outside the domain. */
export function nodeAtMeters(state, x, y) {
  const res = state.resolution;
  const half = DOMAIN.widthMeters / 2;
  if (Math.abs(x) > half || Math.abs(y) > half) return null;
  const step = DOMAIN.widthMeters / (res - 1);
  const j = Math.round((x + half) / step);
  const i = Math.round((y + half) / step);
  return i * res + j;
}

/** West–east profile through the primary well: [{ xKm, value }]. */
export function profileThroughWell(state, key) {
  const res = state.resolution;
  const step = DOMAIN.widthMeters / (res - 1);
  const half = DOMAIN.widthMeters / 2;
  const wellY = state.wells?.[0]?.y ?? 0;
  const i = Math.max(0, Math.min(res - 1, Math.round((wellY + half) / step)));
  const points = [];
  for (let j = 0; j < res; j++) {
    points.push({ xKm: (-half + j * step) / 1000, value: quantityAt(state, key, i * res + j) });
  }
  return points;
}

/** Full-resolution GeoJSON export with the synthetic-data disclaimer. */
export function exportGeoJSON(state, params) {
  const res = state.resolution;
  const step = DOMAIN.widthMeters / (res - 1);
  const half = DOMAIN.widthMeters / 2;
  const features = [];
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const idx = i * res + j;
      const x0 = -half + j * step - step / 2;
      const y0 = -half + i * step - step / 2;
      const x1 = x0 + step;
      const y1 = y0 + step;
      const n = describeNode(state, idx);
      features.push({
        type: 'Feature',
        properties: {
          grid_i: i,
          grid_j: j,
          subsidence_cm: +n.subsidence.toFixed(3),
          drawdown_m: +n.drawdown.toFixed(3),
          inelastic_cm: +n.inelastic.toFixed(3),
          data_type: 'SYNTHETIC_DEMONSTRATION'
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[metersToLngLat(x0, y0), metersToLngLat(x1, y0), metersToLngLat(x1, y1), metersToLngLat(x0, y1), metersToLngLat(x0, y0)]]
        }
      });
    }
  }
  return {
    type: 'FeatureCollection',
    metadata: {
      generator: 'Aquifera prototype (in-browser simplified analytical model)',
      disclaimer: 'Synthetic demonstration output on a generic 3.2 km test domain placed over Iloilo City for context. Not a subsidence forecast for Iloilo City; not MODFLOW 6 or PINO output.',
      coordinate_system: 'WGS 84 (EPSG:4326). The study uses PRS92 Zone 4 (EPSG:3123) for GIS work.',
      scenario: params
    },
    features
  };
}
