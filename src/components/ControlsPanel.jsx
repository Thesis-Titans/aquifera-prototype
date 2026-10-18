import React, { useState } from 'react';
import { 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Droplet, 
  Clock, 
  HelpCircle,
  Cpu, 
  X,
  Activity
} from 'lucide-react';
import { DOMAIN } from '../physics/groundwaterPhysics';

export default function ControlsPanel({ 
  params, 
  setParams, 
  physicalState, 
  layerVisibilities, 
  setLayerVisibilities,
  onOpenVerification,
  isOpen = true,
  onClose
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const updateParam = (key, value) => {
    // Clamp to valid numeric boundaries (NN/g Error Prevention)
    let val = Number(value);
    if (isNaN(val)) val = 0;
    if (key === 'pumpingRate') val = Math.max(0, Math.min(3000, val));
    if (key === 'pumpingDays') val = Math.max(1, Math.min(730, val));
    if (key === 'rechargeRateMmDay') val = Math.max(0, Math.min(10.0, val));
    setParams(prev => ({ ...prev, [key]: val }));
  };

  const toggleLayer = (id) => {
    setLayerVisibilities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute Subsidence Severity Level (Scientific & Defense Metric)
  const maxS = physicalState.maxSubsidenceCm;
  let riskTier = {
    level: 1,
    label: 'Minimal (Elastic)',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    desc: 'Subsurface strains are within elastic preconsolidation bounds; 100% reversible.'
  };

  if (maxS > 25) {
    riskTier = {
      level: 4,
      label: 'Critical Inelastic Yielding',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/40',
      desc: 'Permanent aquitard skeletal collapse. Permanent loss of pore volume storage.'
    };
  } else if (maxS > 15) {
    riskTier = {
      level: 3,
      label: 'Severe Consolidation',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/40',
      desc: 'Aquitard pore pressure depleted; plastic deformation initiated.'
    };
  } else if (maxS > 5) {
    riskTier = {
      level: 2,
      label: 'Moderate Settlement',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/15',
      borderColor: 'border-cyan-500/30',
      desc: 'Noticeable differential settlement; hydraulic head approaching yield envelope.'
    };
  }

  return (
    <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'} bg-[#070d18]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl`}>
      {/* Header */}
      <div className="p-4 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0c1424]/60">
        <div className="flex items-center gap-2.5">
          <Sliders size={18} className="text-primary" />
          <h2 className="text-sm font-bold tracking-tight text-white">
            Simulation Parameters
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/40 shadow-xs">
            Real-Time
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        
        {/* Dynamic Critical State Alert */}
        {physicalState.isPreconsolidationBreached ? (
          <div className="bg-rose-950/60 border border-rose-500/60 rounded-2xl p-4.5 shadow-lg shadow-rose-950/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={19} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-300 tracking-wide uppercase">
                  Preconsolidation Breached
                </span>
              </div>
              <span className="font-mono tabular-nums text-xs text-rose-300 font-bold bg-rose-500/25 px-2.5 py-1 rounded-lg border border-rose-500/40">
                {physicalState.inelasticPercent}% Permanent
              </span>
            </div>
            <p className="text-xs text-rose-100 leading-relaxed">
              Head dropped to <strong className="font-mono tabular-nums text-white font-bold">{physicalState.minHead} m</strong> (critical threshold: 88.0 m). Clay skeleton yielded.
            </p>
            <div className="bg-black/60 p-3 rounded-xl text-xs text-rose-200 border border-rose-500/30">
              <strong className="text-rose-300">Remedy:</strong> Reduce Q ≤ 1,400 m³/d or increase R ≥ 2.5 mm/d.
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-md">
            <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
                Elastic Range Maintained
              </div>
              <div className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Head (<strong className="font-mono text-emerald-200">{physicalState.minHead} m</strong>) ≥ 88.0 m. Subsidence is 100% reversible.
              </div>
            </div>
          </div>
        )}

        {/* Primary Readout Metrics Grid (Semantic Aquifera Metric Cards) */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="aquifera-metric-card">
            <span className="text-xs text-slate-300 font-bold tracking-wide uppercase">
              Max Settlement (Δz)
            </span>
            <span className={`font-mono tabular-nums text-2xl font-black ${
              physicalState.maxSubsidenceCm > 15 ? 'text-rose-400' : 'text-primary'
            }`}>
              {physicalState.maxSubsidenceCm} <span className="text-xs font-normal text-slate-400 ml-0.5">cm</span>
            </span>
          </div>

          <div className="aquifera-metric-card">
            <span className="text-xs text-slate-300 font-bold tracking-wide uppercase">
              Lowest Aquifer Head (h)
            </span>
            <span className={`font-mono tabular-nums text-2xl font-black ${
              physicalState.isPreconsolidationBreached ? 'text-rose-400' : 'text-secondary'
            }`}>
              {physicalState.minHead} <span className="text-xs font-normal text-slate-400 ml-0.5">m</span>
            </span>
          </div>
        </div>

        {/* Subsidence Severity Risk Gauge */}
        <div className={`aquifera-card border ${riskTier.borderColor}`}>
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-300 text-[11px]">
              Subsidence Severity Level
            </span>
            <span className={`font-bold ${riskTier.color}`}>
              Tier {riskTier.level}: {riskTier.label}
            </span>
          </div>
          {/* 4-segment visual gauge bar */}
          <div className="grid grid-cols-4 gap-2 h-2.5 w-full">
            <div className={`rounded-full transition-all ${riskTier.level >= 1 ? 'bg-emerald-400' : 'bg-white/10'}`} />
            <div className={`rounded-full transition-all ${riskTier.level >= 2 ? 'bg-cyan-400' : 'bg-white/10'}`} />
            <div className={`rounded-full transition-all ${riskTier.level >= 3 ? 'bg-amber-400' : 'bg-white/10'}`} />
            <div className={`rounded-full transition-all ${riskTier.level >= 4 ? 'bg-rose-500 animate-pulse' : 'bg-white/10'}`} />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {riskTier.desc}
          </p>
        </div>

        {/* Parameter Sliders with Direct Numeric Inputs (Semantic Aquifera Cards) */}
        <div className="flex flex-col gap-4">
          
          {/* Pumping Rate Control */}
          <div className="aquifera-card">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Droplet size={16} className="text-primary" /> Pumping Discharge (Q)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'Q' ? null : 'Q')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Click for parameter definition"
                >
                  <HelpCircle size={14} />
                </button>
              </span>
              
              {/* Dual Direct Input Box */}
              <div className="aquifera-input-box">
                <input
                  type="number"
                  min="0"
                  max="3000"
                  step="50"
                  value={params.pumpingRate}
                  onChange={(e) => updateParam('pumpingRate', e.target.value)}
                  className="w-16 bg-transparent text-right font-mono tabular-nums text-xs font-bold text-primary focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">m³/d</span>
              </div>
            </div>

            {activeTooltip === 'Q' && (
              <div className="text-xs text-slate-300 bg-[#070e1b] p-3 rounded-xl border border-white/15 leading-relaxed">
                Volumetric pumping extraction rate from deep municipal and industrial production wells.
              </div>
            )}

            <div className="py-1">
              <input
                type="range"
                min="0"
                max="2500"
                step="50"
                value={params.pumpingRate}
                onChange={(e) => updateParam('pumpingRate', e.target.value)}
                className="w-full accent-primary cursor-pointer my-1.5"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono font-medium pt-2 border-t border-white/10">
              <span>0 (Idle)</span>
              <span>1,200 (Municipal)</span>
              <span>2,500 (Heavy)</span>
            </div>
          </div>

          {/* Stress Period Duration Control */}
          <div className="aquifera-card">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Clock size={16} className="text-secondary" /> Stress Duration (t)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 't' ? null : 't')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Click for parameter definition"
                >
                  <HelpCircle size={14} />
                </button>
              </span>

              <div className="aquifera-input-box">
                <input
                  type="number"
                  min="10"
                  max="730"
                  step="5"
                  value={params.pumpingDays}
                  onChange={(e) => updateParam('pumpingDays', e.target.value)}
                  className="w-16 bg-transparent text-right font-mono tabular-nums text-xs font-bold text-secondary focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">days</span>
              </div>
            </div>

            {activeTooltip === 't' && (
              <div className="text-xs text-slate-300 bg-[#070e1b] p-3 rounded-xl border border-white/15 leading-relaxed">
                Duration of continuous groundwater withdrawal before seasonal rest or aquifer recovery.
              </div>
            )}

            <div className="py-1">
              <input
                type="range"
                min="10"
                max="365"
                step="5"
                value={params.pumpingDays}
                onChange={(e) => updateParam('pumpingDays', e.target.value)}
                className="w-full accent-primary cursor-pointer my-1.5"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono font-medium pt-2 border-t border-white/10">
              <span>10 days</span>
              <span>180 days (Seasonal)</span>
              <span>365 days (1 yr)</span>
            </div>
          </div>

          {/* Infiltration Recharge Rate Control */}
          <div className="aquifera-card">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Droplet size={16} className="text-success" /> Surface Recharge (R)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'R' ? null : 'R')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Click for parameter definition"
                >
                  <HelpCircle size={14} />
                </button>
              </span>

              <div className="aquifera-input-box">
                <input
                  type="number"
                  min="0"
                  max="10.0"
                  step="0.1"
                  value={params.rechargeRateMmDay}
                  onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
                  className="w-16 bg-transparent text-right font-mono tabular-nums text-xs font-bold text-success focus:outline-none"
                />
                <span className="text-xs text-slate-400 font-medium">mm/d</span>
              </div>
            </div>

            {activeTooltip === 'R' && (
              <div className="text-xs text-slate-300 bg-[#070e1b] p-3 rounded-xl border border-white/15 leading-relaxed">
                Net surface precipitation percolation and artificial recharge basins replenishing the water table.
              </div>
            )}

            <div className="py-1">
              <input
                type="range"
                min="0"
                max="5.0"
                step="0.1"
                value={params.rechargeRateMmDay}
                onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
                className="w-full accent-primary cursor-pointer my-1.5"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono font-medium pt-2 border-t border-white/10">
              <span>0 (Drought)</span>
              <span>2.5 (Normal)</span>
              <span>5.0 (Managed)</span>
            </div>
          </div>

          {/* Well Configuration Cluster Toggle */}
          <div className="aquifera-card !flex-row items-center justify-between">
            <span className="text-xs text-slate-200 font-bold">Well Distribution:</span>
            <div className="flex gap-2">
              <button
                className={params.wellCount === 1 ? 'aquifera-preset-btn-active' : 'aquifera-preset-btn'}
                onClick={() => updateParam('wellCount', 1)}
              >
                Single Well
              </button>
              <button
                className={params.wellCount === 2 ? 'aquifera-preset-btn-active' : 'aquifera-preset-btn'}
                onClick={() => updateParam('wellCount', 2)}
              >
                2-Well Cluster
              </button>
            </div>
          </div>

          {/* Transient Consolidation & Hysteresis Curve (Physical Realism) */}
          <div className="aquifera-card">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-primary" /> Transient Subsidence Curve
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold bg-[#070e1b] px-2.5 py-1 rounded-lg border border-white/15">
                t = {params.pumpingDays} days
              </span>
            </div>

            {/* SVG Hysteresis & Delayed Drainage Curve */}
            <div className="aquifera-chart-box relative w-full h-24 overflow-hidden">
              <svg viewBox="0 0 280 80" className="w-full h-full select-none">
                {/* Preconsolidation threshold line (88.0m / critical settlement boundary) */}
                <line x1="20" y1="45" x2="270" y2="45" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.85" />
                <text x="24" y="41" fill="#ef4444" fontSize="7.5" fontFamily="monospace" opacity="0.95" fontWeight="bold">Yield Threshold (Head &lt; 88.0m)</text>

                {/* Grid Lines */}
                <line x1="20" y1="12" x2="270" y2="12" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <line x1="20" y1="68" x2="270" y2="68" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="20" y1="12" x2="20" y2="68" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                {/* Time tick labels */}
                <text x="20" y="77" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">0d</text>
                <text x="140" y="77" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">180d</text>
                <text x="255" y="77" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">365d</text>

                {/* Simulated Transient Compaction Path */}
                {(() => {
                  const points = [];
                  const maxS = physicalState.maxSubsidenceCm;
                  for (let m = 0; m <= 12; m++) {
                    const x = 20 + (m / 12) * 245;
                    const tFrac = m / 12;
                    const sRatio = 1 - Math.exp(-tFrac * 3.2);
                    const yVal = 12 + Math.min(54, sRatio * (maxS / 28) * 54);
                    points.push(`${x.toFixed(1)},${yVal.toFixed(1)}`);
                  }
                  const pathStr = `M ${points.join(' L ')}`;
                  const activeX = 20 + Math.min(1, params.pumpingDays / 365) * 245;
                  const activeRatio = 1 - Math.exp(-(params.pumpingDays / 365) * 3.2);
                  const activeY = 12 + Math.min(54, activeRatio * (maxS / 28) * 54);

                  return (
                    <>
                      <path d={pathStr} fill="none" stroke={physicalState.isPreconsolidationBreached ? '#f43f5e' : '#38bdf8'} strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx={activeX} cy={activeY} r="4.5" fill={physicalState.isPreconsolidationBreached ? '#f43f5e' : '#38bdf8'} stroke="#ffffff" strokeWidth="2" />
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/10">
              <span className="flex items-center gap-2 font-medium">
                <span className={`w-2.5 h-2.5 rounded-full ${physicalState.isPreconsolidationBreached ? 'bg-rose-500 animate-pulse' : 'bg-primary'}`} />
                Cumulative Δz: <strong className="text-white font-mono text-sm">{physicalState.maxSubsidenceCm} cm</strong>
              </span>
              <span className="font-mono text-xs text-slate-300 font-bold bg-[#070e1b] px-2 py-0.5 rounded border border-white/15">
                {physicalState.inelasticPercent}% Plastic Strain
              </span>
            </div>
          </div>

        </div>

        {/* Stratigraphy Layer Inspector */}
        <div className="border-t border-white/20 pt-5 flex flex-col gap-3.5">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers size={16} className="text-primary" /> Geological Strata Visibility
          </span>

          <div className="grid grid-cols-3 gap-3">
            {DOMAIN.layers.map(layer => {
              const isVis = layerVisibilities[layer.id];
              const shortNames = {
                layer1: 'Sand (0-30m)',
                layer2: 'Clay (30-60m)',
                layer3: 'Aquifer (60-120m)'
              };
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={isVis ? 'aquifera-strata-btn aquifera-strata-btn-active' : 'aquifera-strata-btn'}
                  title={`${layer.name} (${layer.thickness} m)`}
                >
                  <div className="w-4 h-4 rounded-sm shadow-xs" style={{ background: layer.color }} />
                  <span className={`text-xs font-bold text-center ${isVis ? 'text-white' : 'text-slate-400'}`}>
                    {shortNames[layer.id] || layer.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Verification Action Footer */}
      <div className="p-5 border-t border-white/20 bg-[#0c1629] rounded-b-2xl shrink-0">
        <button
          className="w-full py-4 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 bg-linear-to-r from-primary to-cyan-400 text-deep shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
          onClick={onOpenVerification}
        >
          <Cpu size={19} /> Run USGS MODFLOW 6 Verification
        </button>
      </div>

    </aside>
  );
}
