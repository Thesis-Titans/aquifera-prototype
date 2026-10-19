import React, { useState } from 'react';
import { 
  Sliders, 
  MapPin, 
  Calendar, 
  Play, 
  ChevronDown, 
  ChevronRight,
  Activity,
  Bookmark
} from 'lucide-react';

export default function ScenarioSetupPanel({
  params,
  setParams,
  onRunSimulation,
  isSimulating,
  activePreset: controlledPreset,
  onSelectPreset
}) {
  const [selectedLocation, setSelectedLocation] = useState('Metro Iloilo (City)');
  const [simulationPeriod, setSimulationPeriod] = useState('2025 to 2050');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [internalPreset, setInternalPreset] = useState('baseline');
  const activePreset = controlledPreset !== undefined ? controlledPreset : internalPreset;

  // Advanced geotechnical parameters
  const [clayThickness, setClayThickness] = useState(35);
  const [preconsolidationThreshold, setPreconsolidationThreshold] = useState(15);
  const [compressionIndex, setCompressionIndex] = useState(0.45);

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
    <aside id="scenario-setup-panel" className="w-80 bg-[#071524] border-r border-[#122336] p-5 flex flex-col justify-between overflow-y-auto shrink-0 custom-scrollbar">
      <div className="flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="text-cyan-400">
              <Sliders size={18} />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Scenario Setup
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Adjust illustrative extraction parameters to observe simulated groundwater head drawdown and skeletal compaction across Metro Iloilo.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Bookmark size={13} className="text-cyan-400" />
            <span>Demonstration Presets</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('baseline')}
              className={`py-1.5 px-2 rounded text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'baseline'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              1. Baseline (12k m³/d)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('overdraft')}
              className={`py-1.5 px-2 rounded text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'overdraft'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              2. Overdraft (26k m³/d)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('mar')}
              className={`py-1.5 px-2 rounded text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'mar'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              3. Managed Recharge
            </button>
            <button
              type="button"
              onClick={() => applyPreset('drought')}
              className={`py-1.5 px-2 rounded text-[11px] font-medium border text-left transition-all cursor-pointer ${
                activePreset === 'drought'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              4. Drought Shock
            </button>
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200">
            Target Focus Area
          </label>
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-[#0a1c2e] text-slate-100 text-xs rounded-lg border border-[#18344e] pl-8.5 pr-8 py-2.5 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
            >
              <option value="Metro Iloilo (City)">Metro Iloilo Basin (All Sectors)</option>
              <option value="Mandurriao Hub">Mandurriao Commercial Epicenter</option>
              <option value="Iloilo City Proper">Iloilo City Proper & Port</option>
              <option value="Jaro Basin">Jaro Floodplain & Estuary</option>
              <option value="Leganes Coastal">Leganes Coastal Lowlands</option>
            </select>
            <MapPin size={14} className="absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Simulation Period Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-200">
            Scenario Time Horizon
          </label>
          <div className="relative">
            <select
              value={simulationPeriod}
              onChange={(e) => setSimulationPeriod(e.target.value)}
              className="w-full bg-[#0a1c2e] text-slate-100 text-xs rounded-lg border border-[#18344e] pl-8.5 pr-8 py-2.5 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer font-medium"
            >
              <option value="2025 to 2050">2025 to 2050 (25-Year Projection)</option>
              <option value="2025 to 2035">2025 to 2035 (10-Year Midterm)</option>
              <option value="2025 to 2060">2025 to 2060 (35-Year Long-Term)</option>
            </select>
            <Calendar size={14} className="absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Key Parameters Group */}
        <div className="flex flex-col gap-3.5 pt-1">
          <h3 className="text-xs font-bold text-white tracking-wide border-b border-white/5 pb-1">
            Hydrological Input Variables
          </h3>

          {/* 1. Pumping Rate */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Total Extraction Rate</span>
              <span className="font-mono text-cyan-300">{params.pumpingRate.toLocaleString()} m³/d</span>
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
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Hydraulic Conductivity (K)</span>
              <span className="font-mono text-cyan-300">{params.hydraulicConductivity || 15} m/d</span>
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
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Elastic Specific Storage (Ss)</span>
              <span className="font-mono text-cyan-300">{(params.specificStorage || 0.0001).toFixed(5)} 1/m</span>
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
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">Natural Recharge Rate</span>
              <span className="font-mono text-cyan-300">{params.rechargeRateMmYear || 150} mm/yr</span>
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

        {/* Collapsible Advanced Geotechnical Options */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(prev => !prev)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            <div className="flex items-center gap-1.5">
              {isAdvancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Geotechnical Strata Options</span>
            </div>
            <ChevronDown size={14} className={isAdvancedOpen ? 'rotate-180 transition-transform' : ''} />
          </button>

          {isAdvancedOpen && (
            <div className="p-3 bg-[#0a1c2e] rounded-lg border border-[#18344e] flex flex-col gap-2.5 mt-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Clay Layer Thickness</span>
                <span className="font-mono text-cyan-300">{clayThickness} m</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={clayThickness}
                onChange={(e) => setClayThickness(Number(e.target.value))}
                className="w-full h-1 bg-[#0d243b] rounded accent-cyan-400"
              />

              <div className="flex justify-between items-center text-slate-300">
                <span>Preconsolidation Head (h_pre)</span>
                <span className="font-mono text-cyan-300">-{preconsolidationThreshold} m</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={preconsolidationThreshold}
                onChange={(e) => setPreconsolidationThreshold(Number(e.target.value))}
                className="w-full h-1 bg-[#0d243b] rounded accent-cyan-400"
              />

              <div className="flex justify-between items-center text-slate-300">
                <span>Virgin Compression (Cc)</span>
                <span className="font-mono text-cyan-300">{compressionIndex}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={compressionIndex}
                onChange={(e) => setCompressionIndex(Number(e.target.value))}
                className="w-full h-1 bg-[#0d243b] rounded accent-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Primary Action Button: Run Demonstration */}
        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="w-full py-2.5 px-4 rounded-lg font-bold text-xs text-white bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_16px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-75 mt-2"
        >
          {isSimulating ? (
            <>
              <Activity size={15} className="animate-spin text-white" />
              <span>Updating Demonstration Outputs...</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-white" />
              <span>Run Demonstration</span>
            </>
          )}
        </button>

        {/* Model Readiness Indicator */}
        <div className="flex flex-col gap-0.5 pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Demonstration Engine Ready</span>
          </div>
          <span className="text-[11px] text-slate-400 pl-4 font-normal">
            Deterministic Scenario Model (Metro Iloilo)
          </span>
        </div>

      </div>
    </aside>
  );
}
