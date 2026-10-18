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
  Activity,
  MapPin
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
    let val = Number(value);
    if (isNaN(val)) val = 0;
    if (key === 'pumpingRate') val = Math.max(0, Math.min(3000, val));
    if (key === 'pumpingDays') val = Math.max(10, Math.min(730, val));
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
    <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'} bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden`}>
      {/* Header */}
      <div className="p-3.5 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <Sliders size={16} className="text-primary" />
          <h2 className="text-sm font-bold tracking-tight text-white">
            Simulation Parameters
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/15 text-primary border border-primary/30 shadow-xs">
            Real-Time
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer md:hidden"
              title="Close Drawer"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3">
        
        {/* Unified Live Impact & Geotechnical Risk Card */}
        <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 transition-all shadow-lg ${
          physicalState.isPreconsolidationBreached
            ? 'bg-rose-950/25 border-rose-500/35 shadow-[0_4px_24px_rgba(244,63,94,0.12)]'
            : physicalState.isHysteresisRetained
            ? 'bg-amber-950/25 border-amber-500/35 shadow-[0_4px_24px_rgba(245,158,11,0.08)]'
            : 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_4px_24px_rgba(16,185,129,0.08)]'
        }`}>
          {/* Header row: Status Title & Inelastic Yield indicator */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/8">
            <div className="flex items-center gap-2">
              {physicalState.isPreconsolidationBreached ? (
                <>
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-rose-300 tracking-wide uppercase">
                    Tier 4: Critical Yielding
                  </span>
                </>
              ) : physicalState.isHysteresisRetained ? (
                <>
                  <Activity size={16} className="text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300 tracking-wide uppercase">
                    Hysteresis Locked
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
                    Tier 1: Safe Elastic
                  </span>
                </>
              )}
            </div>

            <span className={`font-mono tabular-nums text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-xs ${
              physicalState.isPreconsolidationBreached
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : physicalState.isHysteresisRetained
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {physicalState.isPreconsolidationBreached 
                ? `${physicalState.inelasticPercent}% Permanent` 
                : physicalState.isHysteresisRetained
                ? `${physicalState.permanentInelasticCm} cm Non-Rebound`
                : '100% Reversible'}
            </span>
          </div>

          {/* Metrics Readout Dual Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/8 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Max Settlement (Δz)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`font-mono tabular-nums text-xl font-bold tracking-tight ${
                  physicalState.maxSubsidenceCm > 15 ? 'text-rose-400' : 'text-primary'
                }`}>
                  {physicalState.maxSubsidenceCm}
                </span>
                <span className="text-xs text-slate-400 font-medium">cm</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-white/8 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Aquifer Head (h)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`font-mono tabular-nums text-xl font-bold tracking-tight ${
                  physicalState.isPreconsolidationBreached ? 'text-rose-400' : 'text-cyan-300'
                }`}>
                  {physicalState.minHead}
                </span>
                <span className="text-xs text-slate-400 font-medium">m</span>
              </div>
            </div>
          </div>

          {/* 4-Segment Severity Gauge Bar */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="grid grid-cols-4 gap-1.5 h-2 w-full">
              <div className={`rounded-full transition-all ${riskTier.level >= 1 ? 'bg-emerald-400' : 'bg-white/10'}`} />
              <div className={`rounded-full transition-all ${riskTier.level >= 2 ? 'bg-cyan-400' : 'bg-white/10'}`} />
              <div className={`rounded-full transition-all ${riskTier.level >= 3 ? 'bg-amber-400' : 'bg-white/10'}`} />
              <div className={`rounded-full transition-all ${riskTier.level >= 4 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : 'bg-white/10'}`} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {physicalState.isPreconsolidationBreached
                ? `Yield threshold breached (h < 88.0m). Clay matrix yielded permanently.`
                : riskTier.desc}
            </p>
          </div>
        </div>

        {/* Parameter Sliders with Direct Numeric Inputs */}
        <div className="flex flex-col gap-2.5">
          
          {/* Pumping Rate Control */}
          <div className="aquifera-card p-3.5 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Droplet size={14} className="text-primary" /> Pumping Discharge (Q)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'Q' ? null : 'Q')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Click for definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>
              
              <div className="aquifera-input-box py-1 px-2.5">
                <input
                  type="number"
                  min="0"
                  max="3000"
                  step="50"
                  value={params.pumpingRate}
                  onChange={(e) => updateParam('pumpingRate', e.target.value)}
                  className="w-14 bg-transparent text-right font-mono tabular-nums text-xs font-bold text-primary focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 font-medium">m³/d</span>
              </div>
            </div>

            {activeTooltip === 'Q' && (
              <div className="text-[11px] text-slate-300 bg-slate-950/95 p-2.5 rounded-lg border border-white/12 leading-relaxed shadow-lg">
                Volumetric pumping extraction rate from deep municipal and commercial production wells.
              </div>
            )}

            <div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={params.pumpingRate}
                onChange={(e) => updateParam('pumpingRate', e.target.value)}
                className="w-full accent-primary cursor-pointer my-0.5"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium pt-1 px-0.5 border-t border-white/8">
              <span>0 (Idle)</span>
              <span>1,500</span>
              <span>3,000 (Overpumping)</span>
            </div>
          </div>

          {/* Stress Period Duration Control */}
          <div className="aquifera-card p-3.5 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock size={14} className="text-secondary" /> Stress Duration (t)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 't' ? null : 't')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Click for definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>

              <div className="aquifera-input-box py-1 px-2.5">
                <input
                  type="number"
                  min="10"
                  max="730"
                  step="5"
                  value={params.pumpingDays}
                  onChange={(e) => updateParam('pumpingDays', e.target.value)}
                  className="w-14 bg-transparent text-right font-mono tabular-nums text-xs font-bold text-secondary focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 font-medium">days</span>
              </div>
            </div>

            {activeTooltip === 't' && (
              <div className="text-[11px] text-slate-300 bg-slate-950/95 p-2.5 rounded-lg border border-white/12 leading-relaxed shadow-lg">
                Duration of continuous groundwater withdrawal before seasonal rest or aquifer recovery.
              </div>
            )}

            <div>
              <input
                type="range"
                min="10"
                max="730"
                step="5"
                value={params.pumpingDays}
                onChange={(e) => updateParam('pumpingDays', e.target.value)}
                className="w-full accent-primary cursor-pointer my-0.5"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium pt-1 px-0.5 border-t border-white/8">
              <span>10d</span>
              <span>180d (Seasonal)</span>
              <span>730d (2 yr)</span>
            </div>
          </div>

          {/* Infiltration Recharge Rate Control */}
          <div className="aquifera-card p-3.5 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Droplet size={14} className="text-emerald-400" /> Surface Recharge (R)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'R' ? null : 'R')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Click for definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>

              <div className="aquifera-input-box py-1 px-2.5">
                <input
                  type="number"
                  min="0"
                  max="10.0"
                  step="0.1"
                  value={params.rechargeRateMmDay}
                  onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
                  className="w-14 bg-transparent text-right font-mono tabular-nums text-xs font-bold text-emerald-400 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 font-medium">mm/d</span>
              </div>
            </div>

            {activeTooltip === 'R' && (
              <div className="text-[11px] text-slate-300 bg-slate-950/95 p-2.5 rounded-lg border border-white/12 leading-relaxed shadow-lg">
                Net surface precipitation percolation and artificial recharge basins replenishing the water table.
              </div>
            )}

            <div>
              <input
                type="range"
                min="0"
                max="10.0"
                step="0.1"
                value={params.rechargeRateMmDay}
                onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
                className="w-full accent-primary cursor-pointer my-0.5"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono font-medium pt-1 px-0.5 border-t border-white/8">
              <span>0 (Drought)</span>
              <span>2.5 (Normal)</span>
              <span>10.0 (High)</span>
            </div>
          </div>

          {/* Well Setup & Spatial Placement Controls */}
          <div className="aquifera-card p-3.5 gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                <MapPin size={13} className="text-primary" /> Extraction Wells:
              </span>
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950/60 border border-white/8">
                <button
                  className={params.wellCount === 1 ? 'h-6 px-2.5 rounded-md text-[11px] font-semibold bg-primary/20 text-primary border border-primary/40 shadow-xs' : 'h-6 px-2.5 rounded-md text-[11px] text-slate-400 hover:text-white transition-all'}
                  onClick={() => updateParam('wellCount', 1)}
                >
                  Single Well
                </button>
                <button
                  className={params.wellCount === 2 ? 'h-6 px-2.5 rounded-md text-[11px] font-semibold bg-primary/20 text-primary border border-primary/40 shadow-xs' : 'h-6 px-2.5 rounded-md text-[11px] text-slate-400 hover:text-white transition-all'}
                  onClick={() => updateParam('wellCount', 2)}
                >
                  2-Well Cluster
                </button>
              </div>
            </div>

            {/* Quick Well Location Snaps */}
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/8">
              <span className="text-slate-400">
                Center: <strong className="font-mono text-cyan-300 font-semibold">({params.wellX}m, {params.wellY}m)</strong>
              </span>
              <div className="flex gap-1.5">
                <button
                  className="h-6 px-2 rounded-md text-[10px] font-semibold bg-white/5 hover:bg-white/12 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                  onClick={() => setParams(prev => ({ ...prev, wellX: 0, wellY: 0 }))}
                  title="Snap well to Basin Center (0, 0)"
                >
                  Center
                </button>
                <button
                  className="h-6 px-2 rounded-md text-[10px] font-semibold bg-white/5 hover:bg-white/12 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                  onClick={() => setParams(prev => ({ ...prev, wellX: -150, wellY: 100 }))}
                  title="Snap well to Mandurriao Commercial Corridor (-150m, 100m)"
                >
                  Mandurriao
                </button>
                <button
                  className="h-6 px-2 rounded-md text-[10px] font-semibold bg-white/5 hover:bg-white/12 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                  onClick={() => setParams(prev => ({ ...prev, wellX: 100, wellY: -200 }))}
                  title="Snap well to Molo Coastal Zone (100m, -200m)"
                >
                  Molo
                </button>
              </div>
            </div>
          </div>

          {/* Transient Consolidation Curve */}
          <div className="aquifera-card p-3.5 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Activity size={14} className="text-primary" /> Transient Compaction Curve
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-white/12">
                t = {params.pumpingDays}d
              </span>
            </div>

            {/* SVG Hysteresis & Delayed Drainage Curve */}
            <div className="aquifera-chart-box relative w-full h-16 overflow-hidden">
              <svg viewBox="0 0 280 65" className="w-full h-full select-none">
                {/* Preconsolidation threshold line (88.0m) */}
                <line x1="20" y1="36" x2="270" y2="36" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.85" />
                <text x="24" y="32" fill="#ef4444" fontSize="6.5" fontFamily="monospace" opacity="0.95" fontWeight="bold">Yield Threshold (h &lt; 88.0m)</text>

                {/* Grid Lines */}
                <line x1="20" y1="10" x2="270" y2="10" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <line x1="20" y1="54" x2="270" y2="54" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <line x1="20" y1="10" x2="20" y2="54" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                {/* Time tick labels */}
                <text x="20" y="62" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">0d</text>
                <text x="140" y="62" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">365d</text>
                <text x="255" y="62" fill="#94a3b8" fontSize="6.5" fontFamily="monospace">730d</text>

                {/* Simulated Transient Compaction Path */}
                {(() => {
                  const points = [];
                  const maxS = physicalState.maxSubsidenceCm;
                  for (let m = 0; m <= 12; m++) {
                    const x = 20 + (m / 12) * 245;
                    const tFrac = m / 12;
                    const sRatio = 1 - Math.exp(-tFrac * 3.2);
                    const yVal = 10 + Math.min(42, sRatio * (maxS / 28) * 42);
                    points.push(`${x.toFixed(1)},${yVal.toFixed(1)}`);
                  }
                  const pathStr = `M ${points.join(' L ')}`;
                  const activeX = 20 + Math.min(1, params.pumpingDays / 730) * 245;
                  const activeRatio = 1 - Math.exp(-(params.pumpingDays / 730) * 3.2);
                  const activeY = 10 + Math.min(42, activeRatio * (maxS / 28) * 42);

                  return (
                    <>
                      <path d={pathStr} fill="none" stroke={physicalState.isPreconsolidationBreached ? '#f43f5e' : '#38bdf8'} strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx={activeX} cy={activeY} r="3.5" fill={physicalState.isPreconsolidationBreached ? '#f43f5e' : '#38bdf8'} stroke="#ffffff" strokeWidth="1.5" />
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

        </div>

        {/* Stratigraphy Layer Visibility Toggles */}
        <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} className="text-primary" /> Geological Strata
          </span>

          <div className="grid grid-cols-3 gap-2">
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
                  className={`flex flex-col items-center justify-center gap-1.5 h-13 p-1.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                    isVis 
                      ? 'bg-white/8 border-white/20 text-white shadow-xs font-semibold' 
                      : 'bg-white/2 border-white/6 text-slate-500 opacity-50 line-through font-normal'
                  }`}
                  title={`${layer.name} (${layer.thickness} m)`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: layer.color }} />
                  <span className="text-center leading-tight">
                    {shortNames[layer.id] || layer.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Verification Action Footer */}
      <div className="p-3.5 px-4 border-t border-white/10 bg-slate-950/95 shrink-0">
        <button
          className="w-full h-11 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 bg-linear-to-r from-primary to-cyan-400 text-deep shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
          onClick={onOpenVerification}
        >
          <Cpu size={16} /> Run USGS MODFLOW 6 Verification
        </button>
      </div>

    </aside>
  );
}
