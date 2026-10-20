import React, { useState } from 'react';
import { Zap, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function DualBenchmarkHUD({ physicalState }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Target Benchmarking Specifications from ARCHITECTURE.md
  const targetPinoLatencyMs = '< 250';
  const baselineModflowSec = '180 to 300';
  const targetSpeedup = '~80,000×';

  if (isCollapsed) {
    return (
      <div 
        className="benchmark-hud-container absolute top-4 right-4 h-9 px-3.5 z-15 flex items-center gap-2 rounded-xl cursor-pointer bg-slate-950/85 backdrop-blur-xl border border-white/12 hover:border-cyan-400/50 shadow-2xl transition-all select-none"
        onClick={() => setIsCollapsed(false)}
        title="Click to view Dual-Engine Benchmark Target Specifications"
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Zap size={13} className="text-cyan-400" /> Target PINO Latency (Spec): <strong className="font-mono tabular-nums text-cyan-300 font-bold">{targetPinoLatencyMs} ms</strong>
        </span>
        <span className="text-xs text-slate-400 font-medium font-mono">(Target ~80,000×)</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          TARGET SPEC
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="benchmark-hud-container absolute top-4 right-4 w-80 sm:w-90 max-w-[calc(100vw-32px)] p-4 sm:p-5 z-15 flex flex-col gap-3.5 sm:gap-4 rounded-2xl bg-slate-950/92 backdrop-blur-2xl border border-white/12 shadow-2xl transition-all">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            Benchmark Targets (Specification)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Target R² &gt; 0.90
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Collapse HUD"
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </div>

      {/* Latency Comparison Card */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10 flex flex-col gap-3.5 shadow-xs">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
            <Zap size={14} className="text-cyan-400" /> Target PINO 3D Surrogate:
          </span>
          <span className="font-mono tabular-nums text-base font-black text-cyan-300">
            &lt; 250 ms
          </span>
        </div>

        {/* Visual Engine Latency Scale Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden flex items-center border border-white/8 shadow-inner">
          <div className="h-full bg-linear-to-r from-cyan-400 to-cyan-200 rounded-full w-[5%] shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
          <div className="h-full bg-amber-500/25 flex-1" />
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock size={14} className="text-slate-400" /> USGS MODFLOW 6 Baseline:
          </span>
          <span className="font-mono tabular-nums text-xs text-slate-300 font-semibold">
            {baselineModflowSec} s <span className="text-slate-400 font-normal">(3 to 5 min)</span>
          </span>
        </div>

        {/* Speedup Badge */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <span className="text-xs font-bold text-cyan-300">
            Architectural Speedup Target:
          </span>
          <span className="font-mono tabular-nums text-xs font-black text-cyan-300">
            {targetSpeedup}
          </span>
        </div>
      </div>

      {/* Accuracy & Numerical Verification Target Metrics (ISO/IEC 25010) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Target Rel. L₂ Error:</span>
          <span className="font-mono tabular-nums text-sm text-emerald-400 font-bold block mt-1">
            &le; 5.0%
          </span>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Target Compaction RMSE:</span>
          <span className="font-mono tabular-nums text-sm text-emerald-400 font-bold block mt-1">
            &le; 5.0 mm
          </span>
        </div>
      </div>

      {/* Footprint Specifications & Provenance Disclaimer */}
      <div className="flex flex-col gap-1 text-[10px] text-slate-400 border-t border-white/10 pt-2.5">
        <div className="flex justify-between items-center">
          <span>Target Hardware Testbed:</span>
          <span className="font-mono text-slate-300 font-semibold">NVIDIA RTX 4050 6 GB</span>
        </div>
        <div className="mt-1 text-slate-400 text-[10px] italic leading-tight">
          Note: Values indicate target research specifications from proposal docs/ARCHITECTURE.md, not measured field observations.
        </div>
      </div>
    </div>
  );
}
