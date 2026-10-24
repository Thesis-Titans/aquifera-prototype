import React, { useState } from 'react';
import {
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Activity,
  AlertTriangle
} from 'lucide-react';

export default function DualBenchmarkHUD({
  physicalState,
  selectedEngineId = 'analytical',
  onSelectEngine,
  perturbSurrogate = false,
  onTogglePerturbation
}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Proposal specifications (CICT-UGR-F001 Table 1) & Feasibility Pilot (2026-10-23)
  const targetPinoLatencyMs = '< 250';
  const baselineModflowSec = '4.5 to 96';
  const targetSpeedup = '≥ 50× (median basis)';

  const meta = physicalState?.meta ?? {};
  const residual = physicalState?.residual ?? {};
  const gate = physicalState?.gate ?? {};
  const activeEngineId = meta.activeEngineId ?? selectedEngineId;
  const fallbackEngaged = meta.fallbackEngaged ?? false;
  const eta = residual.eta ?? meta.eta ?? 0.02;
  const threshold = residual.threshold ?? 0.15;
  const originalEta = meta.originalEta ?? eta;

  // Gauge bar percentage (0 to 100%, threshold 0.15 sits at 30% of scale)
  const displayEta = fallbackEngaged ? originalEta : eta;
  const gaugePercent = Math.min(100, Math.max(3, (displayEta / 0.5) * 100));

  if (isCollapsed) {
    return (
      <div 
        className="benchmark-hud-container absolute top-3 right-3 h-8.5 px-3 z-15 flex items-center gap-2 rounded-xl cursor-pointer bg-slate-950/90 backdrop-blur-xl border border-slate-800 hover:border-cyan-400/50 shadow-2xl transition-all select-none"
        onClick={() => setIsCollapsed(false)}
        title="Click to view Multi-Engine Benchmark & NIST AI RMF Trust Telemetry"
      >
        <div className={`w-2 h-2 rounded-full ${fallbackEngaged ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse'} shadow-[0_0_8px_hsl(187,92%,48%)]`} />
        
        {fallbackEngaged ? (
          <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <ShieldAlert size={13} className="text-amber-400" />
            <span>NIST Fallback Engaged (η={originalEta.toFixed(3)} &gt; τ={threshold})</span>
          </span>
        ) : (
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Zap size={13} className="text-cyan-400" />
            <span className="text-slate-300 font-mono text-[11px] uppercase">{meta.engineName ?? 'Analytical'}</span>
            <span className="text-cyan-300 font-mono font-bold">{meta.runtimeMs ?? 2} ms</span>
          </span>
        )}

        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          η = {displayEta.toFixed(3)}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="benchmark-hud-container absolute top-3 right-3 w-84 sm:w-92 max-w-[calc(100vw-32px)] p-4 z-15 flex flex-col gap-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-slate-800 shadow-2xl transition-all">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${fallbackEngaged ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            Multi-Engine & Trust HUD
          </span>
        </div>
        <div className="flex items-center gap-2">
          {fallbackEngaged ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
              <ShieldAlert size={11} /> SAFE FALLBACK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck size={11} /> TRUSTED (η &le; 0.15)
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse HUD"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </div>

      {/* Engine Switcher Selector */}
      {onSelectEngine && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
            <span>Simulation Engine:</span>
            <span className="text-[10px] text-slate-500 font-mono">Active: {meta.engineId ?? selectedEngineId}</span>
          </span>
          <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectEngine('analytical')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                selectedEngineId === 'analytical'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Analytical: Theis Cooper-Jacob + Terzaghi (~2 ms)"
            >
              Analytical
            </button>
            <button
              onClick={() => onSelectEngine('pino')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                selectedEngineId === 'pino'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="PINO 3D Surrogate Probe: FNO-3D forward inference probe (<250 ms target spec)"
            >
              PINO Probe
            </button>
            <button
              onClick={() => onSelectEngine('reference')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                selectedEngineId === 'reference'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="MODFLOW 6 CSUB Baseline Proxy: finite-difference reference proxy (22.5 s median)"
            >
              MF6 Proxy
            </button>
          </div>
        </div>
      )}

      {/* Physics-Informed Residual Trust Gauge */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col gap-2.5 shadow-xs">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 flex items-center gap-1.5 font-medium">
            <Activity size={13} className="text-cyan-400" />
            <span>Residual Trust Metric (η):</span>
          </span>
          <span className={`font-mono tabular-nums font-bold text-sm ${displayEta > threshold ? 'text-amber-400' : 'text-emerald-400'}`}>
            {displayEta.toFixed(3)} <span className="text-[10px] text-slate-500 font-normal">/ &le; {threshold}</span>
          </span>
        </div>

        {/* Dynamic Trust Gauge Bar */}
        <div className="relative w-full h-2.5 rounded-full bg-slate-950 overflow-hidden flex items-center border border-slate-800">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              displayEta > threshold ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
            }`}
            style={{ width: `${gaugePercent}%` }}
          />
          {/* Safety Threshold Pin at tau = 0.15 (30% scale mark) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
            style={{ left: '30%' }}
            title="Safety Tolerance Threshold tau = 0.15"
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>0.00 (Exact)</span>
          <span className="text-amber-300">Tolerance τ = 0.15</span>
          <span>&gt; 0.50 (Anomalous)</span>
        </div>

        {/* Anomaly Stress Test Injection Toggle */}
        {selectedEngineId === 'pino' && onTogglePerturbation && (
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <AlertTriangle size={12} className={perturbSurrogate ? 'text-amber-400' : 'text-slate-500'} />
              Test Anomaly Probe:
            </span>
            <button
              onClick={onTogglePerturbation}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer border ${
                perturbSurrogate
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {perturbSurrogate ? 'Perturbation Injected' : 'Inject Perturbation'}
            </button>
          </div>
        )}
      </div>

      {/* Latency & Hardware Card */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-col gap-2.5 shadow-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
            <Zap size={14} className="text-cyan-400" /> Active Latency:
          </span>
          <span className="font-mono tabular-nums text-sm font-bold text-cyan-300">
            {meta.runtimeMs !== undefined ? (meta.runtimeMs >= 1000 ? `${(meta.runtimeMs / 1000).toFixed(1)} s` : `${meta.runtimeMs} ms`) : '< 250 ms'}
          </span>
        </div>

        <div className="flex justify-between items-baseline text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" /> USGS MODFLOW 6 Pilot:
          </span>
          <span className="font-mono text-slate-300 font-semibold">
            22.5 s <span className="text-slate-500 font-normal">({baselineModflowSec} s)</span>
          </span>
        </div>

        <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs">
          <span className="font-bold text-cyan-300">Target Speedup:</span>
          <span className="font-mono tabular-nums font-black text-cyan-300">{targetSpeedup}</span>
        </div>
      </div>

      {/* Numerical Verification Criteria (ISO/IEC 25010) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Target Rel. L₂:</span>
          <span className="font-mono text-emerald-400 font-bold block mt-0.5">&le; 5.0%</span>
        </div>
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">MF6 Pilot Compaction:</span>
          <span className="font-mono text-cyan-300 font-bold block mt-0.5">75.2 mm (Δb)</span>
        </div>
      </div>

      {/* Hardware & Governance Footnote */}
      <div className="text-[10px] text-slate-400 flex flex-col gap-0.5 border-t border-slate-800 pt-2 italic">
        <span>Target Hardware: NVIDIA RTX 4050 Laptop GPU (6 GB VRAM)</span>
        <span>Framework: NIST AI RMF 1.0 (MEASURE 2.6, MANAGE 2.4). Baseline numerical proxy.</span>
      </div>
    </div>
  );
}
