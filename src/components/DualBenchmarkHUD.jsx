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
        className="benchmark-hud-container absolute top-4 right-4 px-4 py-2.5 z-15 flex items-center gap-2.5 rounded-xl cursor-pointer bg-[#13223f]/95 backdrop-blur-xl border border-white/20 hover:border-primary/60 shadow-2xl transition-all select-none"
        onClick={() => setIsCollapsed(false)}
        title="Click to expand Dual-Engine Benchmark details"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Zap size={14} className="text-primary" /> PINO: <strong className="font-mono tabular-nums text-primary font-bold">{pinoLatencyMs} ms</strong>
        </span>
        <span className="text-xs text-slate-400 font-medium">({speedupFactor.toLocaleString()}×)</span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          R² 0.94
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </div>
    );
  }

  return (
    <div className="benchmark-hud-container absolute top-4 right-4 w-90 p-5 z-15 flex flex-col gap-4 rounded-2xl bg-[#13223f]/95 backdrop-blur-2xl border border-white/20 shadow-2xl transition-all">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wider uppercase">
            Dual-Engine Benchmark HUD
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            R² = 0.942
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Collapse HUD"
          >
            <ChevronUp size={16} />
          </button>
        </div>
      </div>

      {/* Latency Comparison Card */}
      <div className="bg-[#0c1629] rounded-xl p-4 border border-white/10 flex flex-col gap-3.5 shadow-inner">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
            <Zap size={14} className="text-primary" /> PINO 3D Surrogate:
          </span>
          <span className="font-mono tabular-nums text-lg font-black text-primary">
            {pinoLatencyMs} ms
          </span>
        </div>

        {/* Visual Engine Latency Scale Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#050b14] overflow-hidden flex items-center border border-white/5">
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
        <div className="bg-[#0c1629] p-3.5 rounded-xl border border-white/10 shadow-inner">
          <span className="text-xs text-slate-400 block font-medium">Relative L₂ Error:</span>
          <span className="font-mono tabular-nums text-sm text-emerald-400 font-bold block mt-1">
            3.8% <span className="text-xs text-slate-400 font-normal">(&lt;5%)</span>
          </span>
        </div>

        <div className="bg-[#0c1629] p-3.5 rounded-xl border border-white/10 shadow-inner">
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
