import React, { useState } from 'react';
import {
  Sliders,
  MapPin,
  ChevronDown,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Camera
} from 'lucide-react';
import { HYDRO_PARAMS } from '../../../physics/groundwaterPhysics';

export default function ScenarioSetupPanel({
  params,
  setParams,
  onRunSimulation,
  onCaptureScenario,
  hasUncapturedChanges = false,
  capturedScenario = null,
  activePreset: controlledPreset,
  onSelectPreset
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [internalPreset, setInternalPreset] = useState('baseline');
  const activePreset = controlledPreset !== undefined ? controlledPreset : internalPreset;

  // Clay parameters of the simplified model (Layer 4); defaults from HYDRO_PARAMS
  const clayThickness = params.clayThickness ?? HYDRO_PARAMS.clayThickness;
  const preconsolidationDrawdown = params.preconsolidationDrawdown ?? (HYDRO_PARAMS.initialHead - HYDRO_PARAMS.preconsolidationHead);
  const claySkv = params.claySkv ?? HYDRO_PARAMS.claySkv;

  const applyPreset = (presetKey) => {
    setInternalPreset(presetKey);
    if (onSelectPreset) {
      onSelectPreset(presetKey);
      return;
    }
    if (presetKey === 'baseline') {
      setParams(prev => ({
        ...prev,
        pumpingRate: 12000,
        hydraulicConductivity: 15,
        specificStorage: 0.0001,
        rechargeRateMmYear: 200
      }));
    } else if (presetKey === 'overdraft') {
      setParams(prev => ({
        ...prev,
        pumpingRate: 26000,
        hydraulicConductivity: 12,
        specificStorage: 0.0001,
        rechargeRateMmYear: 100
      }));
    } else if (presetKey === 'mar') {
      setParams(prev => ({
        ...prev,
        pumpingRate: 15000,
        hydraulicConductivity: 18,
        specificStorage: 0.00012,
        rechargeRateMmYear: 320
      }));
    } else if (presetKey === 'drought') {
      setParams(prev => ({
        ...prev,
        pumpingRate: 32000,
        hydraulicConductivity: 10,
        specificStorage: 0.00008,
        rechargeRateMmYear: 30
      }));
    }
  };

  const handleSliderChange = (updater) => {
    setInternalPreset('custom');
    if (onSelectPreset) onSelectPreset('custom');
    setParams(updater);
  };

  return (
    <aside 
      id="scenario-setup-panel" 
      className="w-80 lg:w-88 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 lg:p-5 flex flex-col justify-between overflow-y-auto shrink-0 custom-scrollbar shadow-2xl space-y-4"
    >
      <div className="flex flex-col gap-4">
        
        {/* Header Block */}
        <div className="flex flex-col gap-1 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="text-cyan-400 p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 shadow-xs">
              <Sliders size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Scenario Configuration
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 font-medium">Hydrogeological Testbed</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-normal pt-1">
            Simplified in-browser preview model (Theis drawdown + Terzaghi Layer 4 compaction). Numerical verification baseline is USGS MODFLOW 6 CSUB.
          </p>
        </div>

        {/* Group 1: Demonstration Presets Card */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3.5 flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Bookmark size={13} className="text-cyan-400" />
              <span>Stress Scenarios</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">Deterministic</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('baseline')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                activePreset === 'baseline'
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50 shadow-xs'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold">1. Baseline</span>
              <span className="text-[10px] font-mono text-slate-400">12,000 m³/d</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('overdraft')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                activePreset === 'overdraft'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-400/50 shadow-xs'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold">2. Overdraft</span>
              <span className="text-[10px] font-mono text-slate-400">26,000 m³/d</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('mar')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                activePreset === 'mar'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/50 shadow-xs'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold">3. Managed Recharge</span>
              <span className="text-[10px] font-mono text-slate-400">15k m³/d + 320mm</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('drought')}
              className={`py-2 px-2.5 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                activePreset === 'drought'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-400/50 shadow-xs'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold">4. Drought Shock</span>
              <span className="text-[10px] font-mono text-slate-400">32,000 m³/d</span>
            </button>
          </div>
        </div>

        {/* Group 2: Compact Domain & Well Coordinates Status Pill */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 px-3 py-2 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-cyan-400 shrink-0" />
            <span className="text-slate-400">Domain:</span>
            <span className="font-mono text-slate-200 font-semibold">3.2 × 3.2 km (5L)</span>
          </div>
          <div className="font-mono text-cyan-300 text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800" title="Primary well offset from domain center (East, North)">
            Well: {params.wellX >= 0 ? '+' : ''}{params.wellX || 0}m E, {-params.wellY >= 0 ? '+' : ''}{-params.wellY || 0}m N
          </div>
        </div>

        {/* Group 3: Hydrological Input Variables Card */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3.5 flex flex-col gap-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">
              Hydrological Variables
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 font-medium">Theis + Terzaghi (Analytical)</span>
          </div>

          {/* 1. Pumping Rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Extraction Rate (Q)</span>
              <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{params.pumpingRate.toLocaleString()} m³/d</span>
            </div>
            <input
              type="range"
              min="0"
              max="40000"
              step="500"
              value={params.pumpingRate}
              onChange={(e) => {
                handleSliderChange(prev => ({ ...prev, pumpingRate: Number(e.target.value) }));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 2. Hydraulic Conductivity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Conductivity (K)</span>
              <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{params.hydraulicConductivity || 15} m/d</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={params.hydraulicConductivity || 15}
              onChange={(e) => {
                handleSliderChange(prev => ({ ...prev, hydraulicConductivity: Number(e.target.value) }));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 3. Specific Storage */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Elastic Storage (S<sub>s</sub>)</span>
              <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{(params.specificStorage || 0.0001).toFixed(5)} m⁻¹</span>
            </div>
            <input
              type="range"
              min="0.00001"
              max="0.0005"
              step="0.00001"
              value={params.specificStorage || 0.0001}
              onChange={(e) => {
                handleSliderChange(prev => ({ ...prev, specificStorage: Number(e.target.value) }));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 4. Recharge Rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-300">Natural Recharge (R)</span>
              <span className="font-mono text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{params.rechargeRateMmYear || 150} mm/yr</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={params.rechargeRateMmYear || 150}
              onChange={(e) => {
                handleSliderChange(prev => ({ ...prev, rechargeRateMmYear: Number(e.target.value) }));
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Group 4: Collapsible Advanced Geotechnical Options Card */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3.5 shadow-xs">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(prev => !prev)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isAdvancedOpen ? <ChevronDown size={14} className="text-cyan-400" /> : <ChevronRight size={14} className="text-cyan-400" />}
              <span>Geotechnical Strata Options</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">1D Consolidation</span>
          </button>

          {isAdvancedOpen && (
            <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col gap-3 mt-3 text-xs">
              <label className="flex flex-col gap-1.5">
                <span className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Clay thickness (Layer 4)</span>
                  <span className="font-mono text-cyan-300 font-bold">{clayThickness.toFixed(1)} m</span>
                </span>
                <input
                  type="range"
                  min="12.5"
                  max="37.5"
                  step="0.5"
                  value={clayThickness}
                  onChange={(e) => handleSliderChange(prev => ({ ...prev, clayThickness: Number(e.target.value) }))}
                  className="w-full cursor-pointer accent-cyan-400"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Preconsolidation threshold</span>
                  <span className="font-mono text-cyan-300 font-bold">{preconsolidationDrawdown} m</span>
                </span>
                <input
                  type="range"
                  min="2"
                  max="20"
                  step="1"
                  value={preconsolidationDrawdown}
                  onChange={(e) => handleSliderChange(prev => ({ ...prev, preconsolidationDrawdown: Number(e.target.value) }))}
                  className="w-full cursor-pointer accent-cyan-400"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Inelastic storage (S<sub>skv</sub>)</span>
                  <span className="font-mono text-cyan-300 font-bold">{claySkv.toExponential(1)} m⁻¹</span>
                </span>
                <input
                  type="range"
                  min="-4"
                  max="-2"
                  step="0.1"
                  value={Math.log10(claySkv)}
                  onChange={(e) => handleSliderChange(prev => ({ ...prev, claySkv: Number(Math.pow(10, Number(e.target.value)).toPrecision(2)) }))}
                  aria-valuetext={`${claySkv.toExponential(1)} per metre`}
                  className="w-full cursor-pointer accent-cyan-400"
                />
              </label>
            </div>
          )}
        </div>

        {/* Primary Action Button: Capture Scenario for Comparison */}
        <button
          onClick={onCaptureScenario || onRunSimulation}
          className={`w-full h-11 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-1 shadow-md ${
            hasUncapturedChanges
              ? 'text-slate-950 bg-linear-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-emerald-300 bg-slate-950/80 border border-emerald-500/40 hover:bg-slate-900 shadow-xs'
          }`}
        >
          {hasUncapturedChanges ? (
            <>
              <Camera size={15} className="text-slate-950" />
              <span>Capture Scenario for Comparison</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>Scenario Captured for Comparison</span>
            </>
          )}
        </button>

        {/* Live Preview vs Captured Status */}
        <div className="flex flex-col gap-1 pt-1 pb-2">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${hasUncapturedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className="text-xs">{hasUncapturedChanges ? 'Live Preview Active' : 'Scenario Synced'}</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300">
              {capturedScenario?.capturedAt || 'Initial'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 pl-4 font-normal">
            {hasUncapturedChanges 
              ? 'Sliders update live preview. Click above to freeze for comparison.'
              : `Captured preset: ${capturedScenario?.preset || 'Baseline'}`}
          </span>
        </div>

      </div>
    </aside>
  );
}
