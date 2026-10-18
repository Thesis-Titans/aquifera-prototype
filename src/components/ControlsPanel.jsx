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
  RotateCcw,
  X,
  Activity
} from 'lucide-react';
import { DOMAIN, HYDRO_PARAMS } from '../physics/groundwaterPhysics';

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
    <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'} bg-surface/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl`}>
      {/* Header */}
      <div className="p-3.5 px-4.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={17} className="text-primary" />
          <h2 className="text-sm font-bold tracking-tight text-white">
            Parameters
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/15 text-primary border border-primary/30">
            Real-Time
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* Dynamic Critical State Alert */}
        {physicalState.isPreconsolidationBreached ? (
          <div className="bg-danger/15 border border-danger/40 rounded-lg p-3 shadow-lg shadow-rose-950/40">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-danger" />
                <span className="text-[11px] font-bold text-danger tracking-wide">
                  PRECONSOLIDATION BREACHED
                </span>
              </div>
              <span className="font-mono tabular-nums text-[10px] text-danger font-bold">
                {physicalState.inelasticPercent}% Permanent
              </span>
            </div>
            <p className="text-[11px] text-rose-200/90 leading-tight mb-2">
              Head dropped to <strong className="font-mono tabular-nums">{physicalState.minHead} m</strong> (threshold: 88.0 m). Clay matrix collapsed.
            </p>
            <div className="bg-black/30 p-1.5 px-2 rounded text-[10px] text-rose-100">
              <strong>Remedy:</strong> Reduce Q ≤ 1,400 m³/d or increase R ≥ 2.5 mm/d.
            </div>
          </div>
        ) : (
          <div className="bg-success/15 border border-success/30 rounded-lg p-2.5 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success shrink-0" />
            <div>
              <div className="text-[11px] font-semibold text-success">
                Elastic Range Maintained
              </div>
              <div className="text-[10.5px] text-text-muted">
                Head ({physicalState.minHead} m) ≥ 88.0 m. Subsidence is 100% reversible.
              </div>
            </div>
          </div>
        )}

        {/* Primary Readout Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 px-3 rounded-lg bg-surface-elevated/90 border border-white/5">
            <span className="text-[11px] text-text-muted block mb-0.5">
              Max Settlement (Δz)
            </span>
            <span className={`font-mono tabular-nums text-xl font-bold ${
              physicalState.maxSubsidenceCm > 15 ? 'text-danger' : 'text-primary'
            }`}>
              {physicalState.maxSubsidenceCm} <span className="text-xs font-normal">cm</span>
            </span>
          </div>

          <div className="p-2.5 px-3 rounded-lg bg-surface-elevated/90 border border-white/5">
            <span className="text-[11px] text-text-muted block mb-0.5">
              Lowest Aquifer Head (h)
            </span>
            <span className={`font-mono tabular-nums text-xl font-bold ${
              physicalState.isPreconsolidationBreached ? 'text-danger' : 'text-secondary'
            }`}>
              {physicalState.minHead} <span className="text-xs font-normal">m</span>
            </span>
          </div>
        </div>

        {/* Subsidence Severity Risk Gauge */}
        <div className={`p-2.5 rounded-lg border ${riskTier.borderColor} ${riskTier.bgColor} flex flex-col gap-1.5`}>
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold uppercase tracking-wider text-text-dim text-[10px]">
              Subsidence Severity Level
            </span>
            <span className={`font-bold ${riskTier.color}`}>
              Tier {riskTier.level}: {riskTier.label}
            </span>
          </div>
          {/* 4-segment visual gauge bar */}
          <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
            <div className={`rounded-full transition-all ${riskTier.level >= 1 ? 'bg-emerald-400' : 'bg-white/10'}`} />
            <div className={`rounded-full transition-all ${riskTier.level >= 2 ? 'bg-cyan-400' : 'bg-white/10'}`} />
            <div className={`rounded-full transition-all ${riskTier.level >= 3 ? 'bg-amber-400' : 'bg-white/10'}`} />
            <div className={`rounded-full transition-all ${riskTier.level >= 4 ? 'bg-rose-500 animate-pulse' : 'bg-white/10'}`} />
          </div>
          <p className="text-[10.5px] text-text-muted leading-tight">
            {riskTier.desc}
          </p>
        </div>

        {/* Parameter Sliders with Direct Numeric Inputs (NN/g Heuristic #7) */}
        <div className="flex flex-col gap-4">
          
          {/* Pumping Rate Control */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Droplet size={14} className="text-primary" /> Pumping Discharge (Q)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'Q' ? null : 'Q')}
                  className="text-text-dim hover:text-white transition-colors cursor-pointer p-0"
                  title="Click for parameter definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>
              
              {/* Dual Direct Input Box */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="3000"
                  step="50"
                  value={params.pumpingRate}
                  onChange={(e) => updateParam('pumpingRate', e.target.value)}
                  className="w-16 px-1.5 py-0.5 bg-surface-elevated border border-white/10 rounded text-right font-mono tabular-nums text-xs text-primary focus:border-primary focus:outline-none"
                />
                <span className="text-[11px] text-text-dim">m³/d</span>
              </div>
            </div>

            {activeTooltip === 'Q' && (
              <div className="text-[11px] text-text-muted bg-surface-elevated/90 p-2 rounded mb-1.5 border border-white/5 leading-snug">
                Volumetric pumping extraction rate from deep municipal and industrial production wells.
              </div>
            )}

            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={params.pumpingRate}
              onChange={(e) => updateParam('pumpingRate', e.target.value)}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
              <span>0 (Idle)</span>
              <span>1,200 (Municipal)</span>
              <span>2,500 (Heavy)</span>
            </div>
          </div>

          {/* Stress Period Duration Control */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Clock size={14} className="text-secondary" /> Stress Duration (t)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 't' ? null : 't')}
                  className="text-text-dim hover:text-white transition-colors cursor-pointer p-0"
                  title="Click for parameter definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="10"
                  max="730"
                  step="5"
                  value={params.pumpingDays}
                  onChange={(e) => updateParam('pumpingDays', e.target.value)}
                  className="w-16 px-1.5 py-0.5 bg-surface-elevated border border-white/10 rounded text-right font-mono tabular-nums text-xs text-secondary focus:border-secondary focus:outline-none"
                />
                <span className="text-[11px] text-text-dim">days</span>
              </div>
            </div>

            {activeTooltip === 't' && (
              <div className="text-[11px] text-text-muted bg-surface-elevated/90 p-2 rounded mb-1.5 border border-white/5 leading-snug">
                Duration of continuous groundwater withdrawal before seasonal rest or aquifer recovery.
              </div>
            )}

            <input
              type="range"
              min="10"
              max="365"
              step="5"
              value={params.pumpingDays}
              onChange={(e) => updateParam('pumpingDays', e.target.value)}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
              <span>10 days</span>
              <span>180 days (Seasonal)</span>
              <span>365 days (1 yr)</span>
            </div>
          </div>

          {/* Infiltration Recharge Rate Control */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Droplet size={14} className="text-success" /> Surface Recharge (R)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'R' ? null : 'R')}
                  className="text-text-dim hover:text-white transition-colors cursor-pointer p-0"
                  title="Click for parameter definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="10.0"
                  step="0.1"
                  value={params.rechargeRateMmDay}
                  onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
                  className="w-16 px-1.5 py-0.5 bg-surface-elevated border border-white/10 rounded text-right font-mono tabular-nums text-xs text-success focus:border-success focus:outline-none"
                />
                <span className="text-[11px] text-text-dim">mm/d</span>
              </div>
            </div>

            {activeTooltip === 'R' && (
              <div className="text-[11px] text-text-muted bg-surface-elevated/90 p-2 rounded mb-1.5 border border-white/5 leading-snug">
                Net surface precipitation percolation and artificial recharge basins replenishing the water table.
              </div>
            )}

            <input
              type="range"
              min="0"
              max="5.0"
              step="0.1"
              value={params.rechargeRateMmDay}
              onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-dim mt-0.5">
              <span>0 (Drought)</span>
              <span>2.5 (Normal)</span>
              <span>5.0 (Managed)</span>
            </div>
          </div>

          {/* Well Configuration Cluster Toggle */}
          <div className="bg-surface-elevated/90 p-2.5 px-3 rounded-lg border border-white/5 flex items-center justify-between">
            <span className="text-xs text-text-muted">Well Distribution:</span>
            <div className="flex gap-1.5">
              <button
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  params.wellCount === 1 
                    ? 'bg-linear-to-r from-primary to-cyan-400 text-deep font-semibold shadow-sm' 
                    : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5'
                }`}
                onClick={() => updateParam('wellCount', 1)}
              >
                Single Well
              </button>
              <button
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                  params.wellCount === 2 
                    ? 'bg-linear-to-r from-primary to-cyan-400 text-deep font-semibold shadow-sm' 
                    : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5'
                }`}
                onClick={() => updateParam('wellCount', 2)}
              >
                2-Well Cluster
              </button>
            </div>
          </div>

          {/* Transient Consolidation & Hysteresis Curve (Physical Realism) */}
          <div className="bg-surface-elevated/90 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Activity size={13} className="text-primary" /> Transient Subsidence Curve
              </span>
              <span className="text-[10px] font-mono text-text-dim">
                t = {params.pumpingDays} days
              </span>
            </div>

            {/* SVG Hysteresis & Delayed Drainage Curve */}
            <div className="relative w-full h-22 bg-deep/90 rounded-md border border-white/5 p-1.5 overflow-hidden">
              <svg viewBox="0 0 280 75" className="w-full h-full select-none">
                {/* Preconsolidation threshold line (88.0m / critical settlement boundary) */}
                <line x1="20" y1="42" x2="270" y2="42" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                <text x="24" y="39" fill="#ef4444" fontSize="6.5" fontFamily="monospace" opacity="0.85">Yield Threshold (Head &lt; 88.0m)</text>

                {/* Grid Lines */}
                <line x1="20" y1="10" x2="270" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <line x1="20" y1="65" x2="270" y2="65" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <line x1="20" y1="10" x2="20" y2="65" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                {/* Time tick labels */}
                <text x="20" y="72" fill="#64748b" fontSize="6.5" fontFamily="monospace">0d</text>
                <text x="140" y="72" fill="#64748b" fontSize="6.5" fontFamily="monospace">180d</text>
                <text x="255" y="72" fill="#64748b" fontSize="6.5" fontFamily="monospace">365d</text>

                {/* Simulated Transient Compaction Path */}
                {(() => {
                  const points = [];
                  const maxS = physicalState.maxSubsidenceCm;
                  for (let m = 0; m <= 12; m++) {
                    const x = 20 + (m / 12) * 245;
                    const tFrac = m / 12;
                    const sRatio = 1 - Math.exp(-tFrac * 3.2);
                    const yVal = 10 + Math.min(52, sRatio * (maxS / 28) * 52);
                    points.push(`${x.toFixed(1)},${yVal.toFixed(1)}`);
                  }
                  const pathStr = `M ${points.join(' L ')}`;
                  const activeX = 20 + Math.min(1, params.pumpingDays / 365) * 245;
                  const activeRatio = 1 - Math.exp(-(params.pumpingDays / 365) * 3.2);
                  const activeY = 10 + Math.min(52, activeRatio * (maxS / 28) * 52);

                  return (
                    <>
                      <path d={pathStr} fill="none" stroke={physicalState.isPreconsolidationBreached ? '#f43f5e' : '#38bdf8'} strokeWidth="2" strokeLinecap="round" />
                      <circle cx={activeX} cy={activeY} r="3.5" fill={physicalState.isPreconsolidationBreached ? '#f43f5e' : '#38bdf8'} stroke="#ffffff" strokeWidth="1.5" />
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-text-dim">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${physicalState.isPreconsolidationBreached ? 'bg-danger animate-pulse' : 'bg-primary'}`} />
                Cumulative Δz: <strong className="text-white font-mono">{physicalState.maxSubsidenceCm} cm</strong>
              </span>
              <span className="font-mono text-[9px] text-text-muted">
                {physicalState.inelasticPercent}% Plastic Strain
              </span>
            </div>
          </div>

        </div>

        {/* Stratigraphy Layer Inspector (Compact 3-Pill Toggle) */}
        <div className="border-t border-white/10 pt-2.5">
          <span className="text-[10.5px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Layers size={13} /> Geological Strata Visibility
          </span>

          <div className="grid grid-cols-3 gap-1.5">
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
                  className={`p-1.5 py-2 rounded-lg flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                    isVis 
                      ? 'bg-surface-elevated/90 border-primary/50 opacity-100 shadow-sm' 
                      : 'bg-transparent border-white/5 opacity-40 hover:opacity-70'
                  }`}
                  title={`${layer.name} (${layer.thickness} m)`}
                >
                  <div className="w-2 h-2 rounded-xs" style={{ background: layer.color }} />
                  <span className={`text-[10px] font-semibold ${isVis ? 'text-white' : 'text-text-dim'}`}>
                    {shortNames[layer.id] || layer.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Verification Action Footer */}
      <div className="p-4 px-4.5 pb-4.5 border-t border-white/10 bg-surface-elevated/90 rounded-b-2xl">
        <button
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 bg-linear-to-r from-primary to-cyan-400 text-deep shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
          onClick={onOpenVerification}
        >
          <Cpu size={16} /> Run USGS MODFLOW 6 Verification
        </button>
      </div>

    </aside>
  );
}
