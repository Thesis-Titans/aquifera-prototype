import React, { useState } from 'react';
import { 
  Sliders, 
  MapPin, 
  Calendar, 
  Play, 
  ChevronDown, 
  ChevronRight,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function ScenarioSetupPanel({
  params,
  setParams,
  onRunSimulation,
  isSimulating
}) {
  const [selectedLocation, setSelectedLocation] = useState('Metro Iloilo (City)');
  const [simulationPeriod, setSimulationPeriod] = useState('2025 – 2050');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Advanced geotechnical parameters
  const [clayThickness, setClayThickness] = useState(35);
  const [preconsolidationThreshold, setPreconsolidationThreshold] = useState(15);
  const [compressionIndex, setCompressionIndex] = useState(0.45);

  return (
    <aside className="w-80 bg-[#071524] border-r border-[#122336] p-5 flex flex-col justify-between overflow-y-auto select-none shrink-0 custom-scrollbar">
      <div className="flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="text-[#0ea5e9]">
              <Sliders size={18} />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Scenario Setup
            </h2>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
            Adjust the parameters to simulate different groundwater extraction scenarios and observe the potential effects on aquifer compaction and land subsidence.
          </p>
        </div>

        {/* Location Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-200">
            Location
          </label>
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-[#0a1c2e] text-slate-100 text-xs rounded-lg border border-[#18344e] pl-8.5 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
            >
              <option value="Metro Iloilo (City)">Metro Iloilo (City)</option>
              <option value="Mandurriao Hub">Mandurriao Commercial District</option>
              <option value="Iloilo City Proper">Iloilo City Proper & Port</option>
              <option value="Jaro Basin">Jaro Floodplain</option>
              <option value="Leganes Coastal">Leganes Coastal Lowlands</option>
            </select>
            <MapPin size={14} className="absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Simulation Period Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-200">
            Simulation Period
          </label>
          <div className="relative">
            <select
              value={simulationPeriod}
              onChange={(e) => setSimulationPeriod(e.target.value)}
              className="w-full bg-[#0a1c2e] text-slate-100 text-xs rounded-lg border border-[#18344e] pl-8.5 pr-8 py-2.5 appearance-none focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
            >
              <option value="2025 – 2050">2025 – 2050</option>
              <option value="2025 – 2035">2025 – 2035 (10-Year Midterm)</option>
              <option value="2025 – 2060">2025 – 2060 (35-Year Long-Term)</option>
            </select>
            <Calendar size={14} className="absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Key Parameters Group */}
        <div className="flex flex-col gap-3.5 pt-1">
          <h3 className="text-xs font-bold text-white tracking-wide">
            Key Parameters
          </h3>

          {/* 1. Pumping Rate */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-200">Pumping Rate (m³/day)</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="40000"
                step="500"
                value={params.pumpingRate}
                onChange={(e) => setParams(prev => ({ ...prev, pumpingRate: Number(e.target.value) }))}
                className="flex-1 h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]"
              />
              <div className="w-16 h-7 bg-[#0a1c2e] border border-[#18344e] rounded-md flex items-center justify-center text-xs font-mono font-medium text-slate-100">
                {params.pumpingRate.toLocaleString()}
              </div>
            </div>
          </div>

          {/* 2. Hydraulic Conductivity */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-200">Hydraulic Conductivity (m/day)</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={params.hydraulicConductivity || 15}
                onChange={(e) => setParams(prev => ({ ...prev, hydraulicConductivity: Number(e.target.value) }))}
                className="flex-1 h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]"
              />
              <div className="w-16 h-7 bg-[#0a1c2e] border border-[#18344e] rounded-md flex items-center justify-center text-xs font-mono font-medium text-slate-100">
                {params.hydraulicConductivity || 15}
              </div>
            </div>
          </div>

          {/* 3. Specific Storage */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-200">Specific Storage (1/m)</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.00001"
                max="0.0005"
                step="0.00001"
                value={params.specificStorage || 0.0001}
                onChange={(e) => setParams(prev => ({ ...prev, specificStorage: Number(e.target.value) }))}
                className="flex-1 h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]"
              />
              <div className="w-16 h-7 bg-[#0a1c2e] border border-[#18344e] rounded-md flex items-center justify-center text-xs font-mono font-medium text-slate-100">
                {(params.specificStorage || 0.0001).toFixed(4)}
              </div>
            </div>
          </div>

          {/* 4. Recharge Rate */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-200">Recharge Rate (mm/year)</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={params.rechargeRateMmYear || 150}
                onChange={(e) => setParams(prev => ({ ...prev, rechargeRateMmYear: Number(e.target.value) }))}
                className="flex-1 h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]"
              />
              <div className="w-16 h-7 bg-[#0a1c2e] border border-[#18344e] rounded-md flex items-center justify-center text-xs font-mono font-medium text-slate-100">
                {params.rechargeRateMmYear || 150}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Options */}
        <div className="pt-1">
          <button
            onClick={() => setIsAdvancedOpen(prev => !prev)}
            className="flex items-center justify-between w-full text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer py-1"
          >
            <div className="flex items-center gap-1.5">
              {isAdvancedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Advanced Options</span>
            </div>
            <ChevronDown size={14} className={isAdvancedOpen ? 'rotate-180 transition-transform' : ''} />
          </button>

          {isAdvancedOpen && (
            <div className="p-3 bg-[#0a1c2e] rounded-lg border border-[#18344e] flex flex-col gap-2.5 mt-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Clay Thickness (m)</span>
                <span className="font-mono text-[#0ea5e9]">{clayThickness}m</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={clayThickness}
                onChange={(e) => setClayThickness(Number(e.target.value))}
                className="w-full h-1 bg-[#0d243b] rounded accent-[#0ea5e9]"
              />

              <div className="flex justify-between items-center text-slate-300">
                <span>Preconsolidation Head</span>
                <span className="font-mono text-[#0ea5e9]">-{preconsolidationThreshold}m</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={preconsolidationThreshold}
                onChange={(e) => setPreconsolidationThreshold(Number(e.target.value))}
                className="w-full h-1 bg-[#0d243b] rounded accent-[#0ea5e9]"
              />

              <div className="flex justify-between items-center text-slate-300">
                <span>Virgin Compression (Cc)</span>
                <span className="font-mono text-[#0ea5e9]">{compressionIndex}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={compressionIndex}
                onChange={(e) => setCompressionIndex(Number(e.target.value))}
                className="w-full h-1 bg-[#0d243b] rounded accent-[#0ea5e9]"
              />
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="w-full py-2.5 px-4 rounded-lg font-bold text-xs text-white bg-[#0084ff] hover:bg-[#0073e6] shadow-[0_0_16px_rgba(0,132,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-75 mt-2"
        >
          {isSimulating ? (
            <>
              <Activity size={15} className="animate-spin text-white" />
              <span>Solving PINO Fourier Operators...</span>
            </>
          ) : (
            <>
              <Play size={14} className="fill-white" />
              <span>Run Simulation</span>
            </>
          )}
        </button>

        {/* Model Readiness Indicator */}
        <div className="flex flex-col gap-0.5 pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>Model Ready</span>
          </div>
          <span className="text-[11px] text-slate-400 pl-4 font-normal">
            PINO Surrogate (AQUIFERA)
          </span>
        </div>

      </div>
    </aside>
  );
}
