/**
 * AQUIFERA Analytical Physics Engine
 *
 * Implements the in-browser closed-form Theis (1935) Cooper-Jacob drawdown
 * and Terzaghi (1925) 1D skeletal consolidation model.
 *
 * Execution Profile:
 * - Runtime: ~1-4 ms (deterministic in-browser evaluation)
 * - Memory: Zero allocation outside TypedArrays
 * - Provenance: Closed-form analytical equations
 */
import {
  computeGroundwaterState,
  HYDRO_PARAMS,
  DOMAIN
} from '../physics/groundwaterPhysics.js';

export const ENGINE_ID = 'analytical';
export const ENGINE_NAME = 'Theis + Terzaghi (Analytical)';
export const ENGINE_VERSION = '1.0.0';

/**
 * Evaluates the analytical groundwater and land subsidence state.
 *
 * @param {Object} params Scenario parameters (pumpingRate, pumpingDays, etc.)
 * @param {Object} [options] Execution options (historyBuffer, etc.)
 * @returns {Object} Physical state conforming to the multi-engine contract
 */
export function evaluate(params, options = {}) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const state = computeGroundwaterState(params, options);
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const runtimeMs = Math.max(0.1, parseFloat((t1 - t0).toFixed(2)));

  return {
    ...state,
    meta: {
      engineId: ENGINE_ID,
      engineName: ENGINE_NAME,
      version: ENGINE_VERSION,
      runtimeMs,
      provenance: 'Theis (1935) Cooper-Jacob unsteady drawdown + Terzaghi (1925) 1-D skeletal consolidation',
      isReference: false,
      isSurrogate: false,
      fallbackEngaged: false
    }
  };
}

export default {
  id: ENGINE_ID,
  name: ENGINE_NAME,
  version: ENGINE_VERSION,
  evaluate
};
