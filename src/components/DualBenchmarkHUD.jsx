import React, { useState } from 'react';
import { Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function DualBenchmarkHUD({ _physicalState }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Benchmarking Constants
  const pinoLatencyMs = 2.3;
  const modflowRuntimeSec = 184.2;
  const speedupFactor = Math.round((modflowRuntimeSec * 1000) / pinoLatencyMs);

  if (isCollapsed) {
    return (
      <div 
        className="benchmark-hud-container absolute top-4 right-4 h-9 px-3.5 z-15 flex items-center gap-2 rounded-xl cursor-pointer bg-slate-950/85 backdrop-blur-xl border border-white/12 hover:border-primary/50 shadow-2xl transition-all select-none"
        onClick={() => setIsCollapsed(false)}
        title="Click to expand Dual-Engine Benchmark details"
      >
        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Zap size={13} className="text-primary" /> PINO: <strong className="font-mono tabular-nums text-primary font-bold">{pinoLatencyMs} ms</strong>
        </span>
        <span className="text-xs text-slate-400 font-medium">({speedupFactor.toLocaleString()}×)</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          R² 0.94
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="benchmark-hud-container absolute top-4 right-4 w-80 sm:w-90 max-w-[calc(100vw-32px)] p-4 sm:p-5 z-15 flex flex-col gap-3.5 sm:gap-4 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-white/12 shadow-2xl transition-all">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            Dual-Engine Benchmark HUD
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            R² = 0.942
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
            <Zap size={14} className="text-primary" /> PINO 3D Surrogate:
          </span>
          <span className="font-mono tabular-nums text-lg font-black text-primary">
            {pinoLatencyMs} ms
          </span>
        </div>

        {/* Visual Engine Latency Scale Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden flex items-center border border-white/8 shadow-inner">
          <div className="h-full bg-linear-to-r from-primary to-cyan-400 rounded-full w-[4%] shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
          <div className="h-full bg-amber-500/25 flex-1" />
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Clock size={14} className="text-slate-400" /> USGS MODFLOW 6:
          </span>
          <span className="font-mono tabular-nums text-xs text-slate-300 font-semibold">
            {modflowRuntimeSec} s <span className="text-slate-400 font-normal">(3m 04s)</span>
          </span>
        </div>

        {/* Speedup Badge */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-primary/10 border border-primary/30">
          <span className="text-xs font-bold text-primary">
            Real-Time Speedup:
          </span>
          <span className="font-mono tabular-nums text-xs font-black text-primary">
            {speedupFactor.toLocaleString()}× faster
          </span>
        </div>
      </div>

      {/* Accuracy & Numerical Verification Metrics (ISO/IEC 25010) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 shadow-xs">
          <span className="text-xs text-slate-400 block font-medium">Relative L₂ Error:</span>
          <span className="font-mono tabular-nums text-sm text-emerald-400 font-bold block mt-1">
            3.8% <span className="text-xs text-slate-400 font-normal">(&lt;5%)</span>
          </span>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 shadow-xs">
          <span className="text-xs text-slate-400 block font-medium">Compaction RMSE:</span>
          <span className="font-mono tabular-nums text-sm text-emerald-400 font-bold block mt-1">
            4.2 mm <span className="text-xs text-slate-400 font-normal">(&lt;5mm)</span>
          </span>
        </div>
      </div>

      {/* Footprint Specifications */}
      <div className="flex justify-between items-center text-xs text-slate-400 border-t border-white/10 pt-3">
        <span>Hardware Testbed:</span>
        <span className="font-mono tabular-nums text-slate-300 font-semibold">NVIDIA RTX 4050</span>
      </div>
    </div>
  );
}
