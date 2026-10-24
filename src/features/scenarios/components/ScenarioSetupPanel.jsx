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
      className="w-84 lg:w-88 bg-[#071524] border-r border-[#122336] p-4 lg:p-5 flex flex-col justify-between overflow-y-auto shrink-0 custom-scrollbar shadow-xl"
    >
      <div className="flex flex-col gap-4">
        
        {/* Header Block */}
        <div className="flex flex-col gap-1.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="text-cyan-400 p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Scenario Setup
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 font-medium">Synthetic test domain</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal pt-1">
            Set pumping and aquifer parameters to see the simulated head drawdown and clay compaction. Results come from a simplified in-browser model, not MODFLOW 6 or the PINO surrogate.
          </p>
        </div>

        {/* Group 1: Demonstration Presets Card */}
        <div className="bg-slate-900/60 rounded-xl border border-white/8 p-3.5 flex flex-col gap-2.5 shadow-xs">
          <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Bookmark size={13} className="text-cyan-400" />
              <span>Demonstration Presets</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">Deterministic</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('baseline')}
              className={`py-2 px-2.5 rounded-lg text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'baseline'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs'
                  : 'bg-slate-950/50 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              1. Baseline (12k m³/d)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('overdraft')}
              className={`py-2 px-2.5 rounded-lg text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'overdraft'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs'
                  : 'bg-slate-950/50 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              2. Overdraft (26k m³/d)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('mar')}
              className={`py-2 px-2.5 rounded-lg text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'mar'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                  : 'bg-slate-950/50 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              3. Managed Recharge
            </button>
            <button
              type="button"
              onClick={() => applyPreset('drought')}
              className={`py-2 px-2.5 rounded-lg text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'drought'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-slate-950/50 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              4. Drought Shock
            </button>
          </div>
        </div>

        {/* Group 2: Study domain note */}
        <div className="bg-slate-900/60 rounded-xl border border-white/8 p-3.5 flex gap-2.5 shadow-xs">
          <MapPin size={15} className="text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-100">Study domain:</span> generic 3.2 km × 3.2 km × 120 m test domain with five layers (proposal Fig. 6), shown over Iloilo City for context only.
          </p>
        </div>

        {/* Group 3: Hydrological Input Variables Card */}
        <div className="bg-slate-900/60 rounded-xl border border-white/8 p-3.5 flex flex-col gap-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs font-bold text-white tracking-wide">
              Hydrological Input Variables
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 font-medium">Theis + Terzaghi</span>
          </div>

          {/* 1. Pumping Rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Total Extraction Rate</span>
              <span className="font-mono text-cyan-300 font-bold">{params.pumpingRate.toLocaleString()} m³/d</span>
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
              className="w-full h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 2. Hydraulic Conductivity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Hydraulic Conductivity (K)</span>
              <span className="font-mono text-cyan-300 font-bold">{params.hydraulicConductivity || 15} m/d</span>
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
              className="w-full h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 3. Specific Storage */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Elastic Specific Storage (Ss)</span>
              <span className="font-mono text-cyan-300 font-bold">{(params.specificStorage || 0.0001).toFixed(5)} 1/m</span>
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
              className="w-full h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 4. Recharge Rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Natural Recharge Rate</span>
              <span className="font-mono text-cyan-300 font-bold">{params.rechargeRateMmYear || 150} mm/yr</span>
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
              className="w-full h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Group 4: Collapsible Advanced Geotechnical Options Card */}
        <div className="bg-slate-900/60 rounded-xl border border-white/8 p-3.5 shadow-xs">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(prev => !prev)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {isAdvancedOpen ? <ChevronDown size={14} className="text-cyan-400" /> : <ChevronRight size={14} className="text-cyan-400" />}
              <span>Geotechnical Strata Options</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">1D Consolidation</span>
          </button>

          {isAdvancedOpen && (
            <div className="p-3 bg-[#0a1c2e] rounded-lg border border-[#18344e] flex flex-col gap-3 mt-3 text-xs">
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
                  <span className="font-mono text-cyan-300 font-bold">{preconsolidationDrawdown} m drawdown</span>
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
                  <span className="font-medium">Inelastic specific storage (S<sub>skv</sub>)</span>
                  <span className="font-mono text-cyan-300 font-bold">{claySkv.toExponential(1)} 1/m</span>
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
              <p className="text-[11px] text-slate-400 leading-snug">
                Ranges follow the proposal (thickness ±50% of Fig. 6; S<sub>skv</sub> 10⁻⁴ to 10⁻² 1/m). Only the simplified model uses them; the 3D layers keep their Fig. 6 thicknesses.
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Button: Capture Scenario for Comparison (Height 44px) */}
        <button
          onClick={onCaptureScenario || onRunSimulation}
          className={`w-full h-11 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-1 ${
            hasUncapturedChanges
              ? 'text-white bg-linear-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_24px_rgba(6,182,212,0.6)]'
              : 'text-emerald-300 bg-slate-900/90 border border-emerald-500/40 hover:bg-slate-900 shadow-xs'
          }`}
        >
          {hasUncapturedChanges ? (
            <>
              <Camera size={15} className="text-white" />
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
              <span className={`w-2.5 h-2.5 rounded-full ${hasUncapturedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span>{hasUncapturedChanges ? 'Uncaptured Preview Parameters' : 'Scenario Synced to Analytics'}</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300">
              {capturedScenario?.capturedAt || 'Initial'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 pl-4.5 font-normal">
            {hasUncapturedChanges 
              ? 'Sliders show live preview. Click above to commit to comparison tables.'
              : `Captured preset: ${capturedScenario?.preset || 'Baseline'}`}
          </span>
        </div>

      </div>
    </aside>
  );
}
