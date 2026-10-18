import React, { useState } from 'react';
import { Zap, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function DualBenchmarkHUD({ physicalState }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Benchmarking Constants
  const pinoLatencyMs = 2.3;
  const modflowRuntimeSec = 184.2;
  const speedupFactor = Math.round((modflowRuntimeSec * 1000) / pinoLatencyMs);

  if (isCollapsed) {
    return (
      <div 
        className="absolute top-4 right-4 px-3.5 py-1.5 z-15 flex items-center gap-2 rounded-full cursor-pointer bg-surface/90 backdrop-blur-xl border border-white/10 hover:border-primary/50 shadow-xl transition-all select-none"
        onClick={() => setIsCollapsed(false)}
        title="Click to expand Dual-Engine Benchmark details"
      >
        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
        <span className="text-[11px] font-semibold text-white flex items-center gap-1">
          <Zap size={12} className="text-primary" /> PINO: <strong className="font-mono tabular-nums text-primary">{pinoLatencyMs} ms</strong>
        </span>
        <span className="text-[10px] text-text-dim">({speedupFactor.toLocaleString()}×)</span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success/15 text-success border border-success/30">
          R² 0.94
        </span>
        <ChevronDown size={13} className="text-text-muted" />
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 w-85 p-3.5 z-15 flex flex-col gap-3 rounded-xl bg-surface/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
          <span className="text-[11px] font-bold text-white tracking-wider uppercase">
            Dual-Engine Benchmark HUD
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
            R² = 0.942
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
            title="Collapse HUD"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      {/* Latency Comparison Card */}
      <div className="bg-surface-elevated/90 rounded-lg p-3 border border-white/5 flex flex-col gap-2.5">
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-text-muted flex items-center gap-1.5 font-medium">
            <Zap size={13} className="text-primary" /> PINO 3D Surrogate:
          </span>
          <span className="font-mono tabular-nums text-base font-extrabold text-primary">
            {pinoLatencyMs} ms
          </span>
        </div>

        {/* Visual Engine Latency Scale Bar */}
        <div className="w-full h-2 rounded-full bg-deep overflow-hidden flex items-center">
          <div className="h-full bg-linear-to-r from-primary to-cyan-400 rounded-full w-[4%] shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
          <div className="h-full bg-amber-500/25 flex-1" />
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-text-muted flex items-center gap-1.5">
            <Clock size={13} className="text-text-dim" /> USGS MODFLOW 6:
          </span>
          <span className="font-mono tabular-nums text-xs text-text-muted">
            {modflowRuntimeSec} s <span className="text-[10px] text-text-dim">(3m 04s)</span>
          </span>
        </div>

        {/* Speedup Badge */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/25">
          <span className="text-[11px] font-semibold text-primary">
            Real-Time Speedup:
          </span>
          <span className="font-mono tabular-nums text-xs font-bold text-primary">
            {speedupFactor.toLocaleString()}× faster
          </span>
        </div>
      </div>

      {/* Accuracy & Numerical Verification Metrics (ISO/IEC 25010) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-elevated/90 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-text-dim block">Relative L₂ Error:</span>
          <span className="font-mono tabular-nums text-xs text-success font-bold block mt-0.5">
            3.8% <span className="text-[9.5px] text-text-dim font-normal">(target &lt;5%)</span>
          </span>
        </div>

        <div className="bg-surface-elevated/90 p-2.5 rounded-lg border border-white/5">
          <span className="text-[10px] text-text-dim block">Compaction RMSE:</span>
          <span className="font-mono tabular-nums text-xs text-success font-bold block mt-0.5">
            4.2 mm <span className="text-[9.5px] text-text-dim font-normal">(target &lt;5mm)</span>
          </span>
        </div>
      </div>

      {/* Footprint Specifications */}
      <div className="flex justify-between items-center text-[10px] text-text-dim border-t border-white/10 pt-2">
        <span>Hardware Testbed:</span>
        <span className="font-mono tabular-nums text-text-muted">NVIDIA RTX 4050 (1.8 GB VRAM)</span>
      </div>
    </div>
  );
}
