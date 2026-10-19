import React, { useState } from 'react';
import { 
  Sliders, 
  MapPin, 
  Calendar, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  X,
  Droplets,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { METRO_ILOILO_GIS } from '../data/metroIloiloGIS';

export default function ScenarioSetupPanel({
  params,
  setParams,
  physicalState,
  onRunSimulation,
  isSimulating,
  isOpen = true,
  onClose
}) {
  const [selectedLocation, setSelectedLocation] = useState('metro_iloilo');
  const [simulationPeriod, setSimulationPeriod] = useState('2025-2050');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Advanced geotechnical parameter states
  const [clayThickness, setClayThickness] = useState(35); // m
  const [preconsolidationThreshold, setPreconsolidationThreshold] = useState(15); // m
  const [compressionIndex, setCompressionIndex] = useState(0.45); // Cc

  const handleLocationChange = (locId) => {
    setSelectedLocation(locId);
    if (locId === 'mandurriao') {
      setParams(prev => ({
        ...prev,
        pumpingRate: 28000,
        hydraulicConductivity: 12,
        rechargeRateMmYear: 120
      }));
    } else if (locId === 'city_proper') {
      setParams(prev => ({
        ...prev,
        pumpingRate: 14000,
        hydraulicConductivity: 18,
        rechargeRateMmYear: 180
      }));
    } else {
      setParams(prev => ({
        ...prev,
        pumpingRate: 20000,
        hydraulicConductivity: 15,
        rechargeRateMmYear: 150
      }));
    }
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'} bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="p-3.5 px-4.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <Sliders size={16} className="text-primary" />
          <h2 className="text-sm font-bold tracking-tight text-white">
            Scenario Setup
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/15 text-primary border border-primary/30 shadow-xs">
            Interactive
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer md:hidden"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Setup Options */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
        
        {/* Select Location Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin size={13} className="text-primary" />
            Select Location
          </label>
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full bg-slate-900/90 text-slate-200 text-xs font-medium rounded-xl border border-white/10 px-3 py-2.5 appearance-none focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
            >
              <option value="metro_iloilo">Metro Iloilo (City-Wide Delta)</option>
              <option value="mandurriao">Mandurriao (IBP/SM Corridor - High Risk)</option>
              <option value="city_proper">City Proper & Port District</option>
              <option value="jaro">Jaro Cathedral Floodplain</option>
              <option value="molo">Molo & Batiano Estuary</option>
              <option value="la_paz">La Paz & Lapuz Port</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-[10.5px] text-slate-400">
            Target aquifer: Lower quaternary semi-confined gravel ({'< -60m'})
          </span>
        </div>

        {/* Simulation Period Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar size={13} className="text-primary" />
            Simulation Period
          </label>
          <div className="relative">
            <select
              value={simulationPeriod}
              onChange={(e) => setSimulationPeriod(e.target.value)}
              className="w-full bg-slate-900/90 text-slate-200 text-xs font-medium rounded-xl border border-white/10 px-3 py-2.5 appearance-none focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
            >
              <option value="2025-2050">2025 – 2050 (25-Year Projection)</option>
              <option value="2025-2035">2025 – 2035 (10-Year Midterm)</option>
              <option value="2025-2060">2025 – 2060 (35-Year Long-Term)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="w-full h-px bg-white/10 my-0.5" />

        {/* Parameter Sliders Group */}
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Hydrogeological Parameters
            </span>
            <span className="text-[10px] text-primary/80 font-mono">PINO Input Vectors</span>
          </div>

          {/* 1. Pumping Rate (m3/day) */}
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Pumping Rate</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-cyan-300">
                {params.pumpingRate.toLocaleString()} m³/d
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="40000"
              step="500"
              value={params.pumpingRate}
              onChange={(e) => setParams(prev => ({ ...prev, pumpingRate: Number(e.target.value) }))}
              className="aquifera-slider w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 (Natural)</span>
              <span>20,000</span>
              <span>40,000 m³/d</span>
            </div>
          </div>

          {/* 2. Hydraulic Conductivity (m/day) */}
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Hydraulic Conductivity (K)</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-cyan-300">
                {params.hydraulicConductivity || 15} m/d
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={params.hydraulicConductivity || 15}
              onChange={(e) => setParams(prev => ({ ...prev, hydraulicConductivity: Number(e.target.value) }))}
              className="aquifera-slider w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 (Silt/Clay)</span>
              <span>15 (Sand)</span>
              <span>50 (Gravel)</span>
            </div>
          </div>

          {/* 3. Specific Storage (1/m) */}
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Specific Storage (Ss)</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-cyan-300">
                {(params.specificStorage || 0.0001).toFixed(5)} 1/m
              </span>
            </div>
            <input
              type="range"
              min="0.00001"
              max="0.0005"
              step="0.00001"
              value={params.specificStorage || 0.0001}
              onChange={(e) => setParams(prev => ({ ...prev, specificStorage: Number(e.target.value) }))}
              className="aquifera-slider w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.00001</span>
              <span>0.0001</span>
              <span>0.0005 1/m</span>
            </div>
          </div>

          {/* 4. Recharge Rate (mm/year) */}
          <div className="flex flex-col gap-1.5 bg-slate-900/40 p-3 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">Recharge Rate (R)</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-white/10 text-cyan-300">
                {params.rechargeRateMmYear || 150} mm/yr
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={params.rechargeRateMmYear || 150}
              onChange={(e) => setParams(prev => ({ ...prev, rechargeRateMmYear: Number(e.target.value) }))}
              className="aquifera-slider w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0 (Drought)</span>
              <span>150 (Baseline)</span>
              <span>500 mm/yr</span>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Options */}
        <div className="flex flex-col rounded-xl border border-white/10 bg-slate-900/30 overflow-hidden">
          <button
            onClick={() => setIsAdvancedOpen(prev => !prev)}
            className="flex items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span>Advanced Geotechnical Options</span>
            {isAdvancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isAdvancedOpen && (
            <div className="p-3 pt-0 flex flex-col gap-3 border-t border-white/5 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Clay Thickness (b₀)</span>
                <span className="font-mono text-cyan-300">{clayThickness} m</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={clayThickness}
                onChange={(e) => setClayThickness(Number(e.target.value))}
                className="aquifera-slider w-full accent-cyan-400"
              />

              <div className="flex items-center justify-between">
                <span>Preconsolidation Head (σ'p)</span>
                <span className="font-mono text-cyan-300">-{preconsolidationThreshold} m</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={preconsolidationThreshold}
                onChange={(e) => setPreconsolidationThreshold(Number(e.target.value))}
                className="aquifera-slider w-full accent-cyan-400"
              />

              <div className="flex items-center justify-between">
                <span>Virgin Compression Index (Cc)</span>
                <span className="font-mono text-cyan-300">{compressionIndex}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={compressionIndex}
                onChange={(e) => setCompressionIndex(Number(e.target.value))}
                className="aquifera-slider w-full accent-cyan-400"
              />
            </div>
          )}
        </div>

        {/* Primary Run Simulation Action Button */}
        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs tracking-wider uppercase text-slate-950 bg-linear-to-r from-cyan-400 via-teal-300 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-75"
        >
          {isSimulating ? (
            <>
              <Activity size={16} className="animate-spin" />
              <span>Solving PINO Fourier Operators...</span>
            </>
          ) : (
            <>
              <Play size={16} className="fill-slate-950" />
              <span>Run Simulation</span>
            </>
          )}
        </button>

        {/* Model Readiness Status Pill */}
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>Model Ready — PINO Surrogate (AQUIFERA)</span>
        </div>

      </div>
    </aside>
  );
}
