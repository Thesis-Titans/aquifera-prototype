import React, { useState } from 'react';
import { Zap, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function DualBenchmarkHUD({ physicalState }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Targets from the proposal (CICT-UGR-F001 Table 1); baseline from the feasibility pilot
  // (MODFLOW 6 CSUB, synthetic 5-layer grid, 20 sampled scenarios, median 22.5 s).
  const targetPinoLatencyMs = '< 250';
  const baselineModflowSec = '4.5 to 96';
  const targetSpeedup = '≥ 50× (median)';

  if (isCollapsed) {
    return (
      <div 
        className="benchmark-hud-container absolute top-3 right-3 h-8.5 px-3 z-15 flex items-center gap-2 rounded-xl cursor-pointer bg-slate-950/90 backdrop-blur-xl border border-slate-800 hover:border-cyan-400/50 shadow-2xl transition-all select-none"
        onClick={() => setIsCollapsed(false)}
        title="Click to view Dual-Engine Benchmark Target Specifications"
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Zap size={13} className="text-cyan-400" /> Target Spec: <strong className="font-mono tabular-nums text-cyan-300 font-bold">{targetPinoLatencyMs} ms</strong>
        </span>
        <span className="text-xs text-slate-400 font-medium font-mono">({targetSpeedup})</span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          PROPOSAL TARGET
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="benchmark-hud-container absolute top-3 right-3 w-80 sm:w-88 max-w-[calc(100vw-32px)] p-4 z-15 flex flex-col gap-3 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-slate-800 shadow-2xl transition-all">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            Benchmark Targets (Specification)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Rel. L₂ &le; 5%
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Collapse HUD"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </div>

      {/* Latency Comparison Card */}
      <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 flex flex-col gap-3 shadow-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
            <Zap size={14} className="text-cyan-400" /> Target PINO 3D Surrogate:
          </span>
          <span className="font-mono tabular-nums text-base font-black text-cyan-300">
            &lt; 250 ms
          </span>
        </div>

        {/* Visual Engine Latency Scale Bar */}
        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden flex items-center border border-slate-800">
          <div className="h-full bg-cyan-400 rounded-full w-[5%] shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
          <div className="h-full bg-amber-500/25 flex-1" />
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock size={14} className="text-slate-400" /> USGS MODFLOW 6 Baseline:
          </span>
          <span className="font-mono tabular-nums text-xs text-slate-300 font-semibold">
            {baselineModflowSec} s <span className="text-slate-400 font-normal">(pilot: 22.5 s)</span>
          </span>
        </div>

        {/* Speedup Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <span className="text-xs font-bold text-cyan-300">
            Speedup Target:
          </span>
          <span className="font-mono tabular-nums text-xs font-black text-cyan-300">
            {targetSpeedup}
          </span>
        </div>
      </div>

      {/* Accuracy & Numerical Verification Target Metrics (ISO/IEC 25010) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Target Rel. L₂ Error:</span>
          <span className="font-mono tabular-nums text-sm text-emerald-400 font-bold block mt-0.5">
            &le; 5.0%
          </span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">MF6 Pilot Ref (Fig. A1):</span>
          <span className="font-mono tabular-nums text-sm text-cyan-300 font-bold block mt-0.5">
            75.2 mm (Δb)
          </span>
        </div>
      </div>

      {/* Footprint Specifications & Provenance Disclaimer */}
      <div className="flex flex-col gap-1 text-[11px] text-slate-400 border-t border-slate-800 pt-2">
        <div className="flex justify-between items-center">
          <span>Target Hardware:</span>
          <span className="font-mono text-slate-300 font-semibold">NVIDIA RTX 4050 (6 GB)</span>
        </div>
        <div className="text-[10px] text-slate-400 italic">
          Target criteria from Proposal Table 1. Not an empirical measurement.
        </div>
      </div>
    </div>
  );
}
