/**
 * Heatmap Rasterizer & Bilinear Interpolator for AQUIFERA
 * 
 * Generates continuous smooth scalar field rasters for MapLibre GIS ImageSource
 * and 3D surface texturing directly from the 64x64 discrete physical grid.
 */

import { QUANTITIES, COLOR_SCALES } from './fields.js';

/**
 * Precomputes a 256-entry RGB Lookup Table (LUT) for a given color scale.
 * Performs linear color interpolation across color stops.
 * 
 * @param {string} scaleKey - 'standard' | 'viridis' | 'turbo'
 * @returns {Uint8ClampedArray} 256 * 3 bytes (R, G, B for index 0..255)
 */
export function buildColorLUT(scaleKey = 'standard') {
  const scale = COLOR_SCALES[scaleKey] || COLOR_SCALES.standard;
  const hexColors = scale.colors;
  
  // Parse hex '#rrggbb' to [r, g, b]
  const rgbStops = hexColors.map(hex => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ]);

  const lut = new Uint8ClampedArray(256 * 3);
  const numSegments = rgbStops.length - 1;

  for (let k = 0; k < 256; k++) {
    const norm = k / 255;
    const scaled = norm * numSegments;
    const stopIdx = Math.min(Math.floor(scaled), numSegments - 1);
    const frac = scaled - stopIdx;

    const c1 = rgbStops[stopIdx];
    const c2 = rgbStops[stopIdx + 1];

    const r = Math.round(c1[0] + (c2[0] - c1[0]) * frac);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * frac);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * frac);

    lut[k * 3] = r;
    lut[k * 3 + 1] = g;
    lut[k * 3 + 2] = b;
  }

  return lut;
}

/**
 * Interpolates the 64x64 discrete scalar simulation field onto an offscreen
 * pixel buffer using bilinear interpolation with smooth alpha boundary gating.
 * 
 * @param {Object} physicalState - Simulation state containing physical grids
 * @param {string} dataType - 'subsidence' | 'drawdown' | 'inelastic'
 * @param {string} scaleKey - 'standard' | 'viridis' | 'turbo'
 * @param {number} size - Output pixel resolution (e.g. 256x256)
 * @param {number} cutoff - Lower normalized threshold below which opacity ramps to 0
 * @returns {{ pixels: Uint8ClampedArray, width: number, height: number }}
 */
export function rasterizeField(physicalState, dataType = 'subsidence', scaleKey = 'standard', size = 256, cutoff = 0.004) {
  const res = physicalState.resolution;
  const quantityDef = QUANTITIES[dataType] || QUANTITIES.subsidence;
  const maxVal = quantityDef.max;

  // Pre-normalize the grid nodes to [0, 1]
  const numNodes = res * res;
  const normalized = new Float32Array(numNodes);
  for (let k = 0; k < numNodes; k++) {
    const raw = quantityDef.value(physicalState, k);
    normalized[k] = Math.max(0, Math.min(1.0, raw / maxVal));
  }

  const lut = buildColorLUT(scaleKey);
  const pixels = new Uint8ClampedArray(size * size * 4);

  // Bilinear interpolation loop
  for (let py = 0; py < size; py++) {
    // Row py maps from north (row 0) to south (row size-1)
    const gy = ((py + 0.5) / size) * (res - 1);
    const i = Math.min(Math.floor(gy), res - 2);
    const ty = gy - i;

    const rowOffset = py * size;

    for (let px = 0; px < size; px++) {
      // Col px maps from west (col 0) to east (col size-1)
      const gx = ((px + 0.5) / size) * (res - 1);
      const j = Math.min(Math.floor(gx), res - 2);
      const tx = gx - j;

      // 4 neighboring nodes
      const n00 = normalized[i * res + j];
      const n01 = normalized[i * res + j + 1];
      const n10 = normalized[(i + 1) * res + j];
      const n11 = normalized[(i + 1) * res + j + 1];

      // Bilinear formulation
      const top = n00 * (1 - tx) + n01 * tx;
      const bottom = n10 * (1 - tx) + n11 * tx;
      const val = top * (1 - ty) + bottom * ty;

      const pOffset = (rowOffset + px) * 4;
      const lutIdx = Math.min(255, Math.max(0, Math.round(val * 255))) * 3;

      pixels[pOffset] = lut[lutIdx];
      pixels[pOffset + 1] = lut[lutIdx + 1];
      pixels[pOffset + 2] = lut[lutIdx + 2];

      // Smooth alpha ramp to avoid harsh stair-stepped cutoff boundaries
      if (val <= cutoff) {
        pixels[pOffset + 3] = 0;
      } else {
        const ramp = Math.min(1.0, (val - cutoff) / cutoff);
        pixels[pOffset + 3] = Math.round(ramp * 255);
      }
    }
  }

  return { pixels, width: size, height: size };
}

/**
 * Convenience wrapper returning an ImageData instance when available.
 */
export function rasterizeFieldToImageData(physicalState, dataType, scaleKey, size = 256, cutoff = 0.004) {
  const { pixels, width, height } = rasterizeField(physicalState, dataType, scaleKey, size, cutoff);
  if (typeof ImageData !== 'undefined') {
    return new ImageData(pixels, width, height);
  }
  return { data: pixels, width, height };
}
