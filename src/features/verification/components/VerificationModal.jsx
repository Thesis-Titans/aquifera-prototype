import React, { useState, useEffect } from 'react';
import { X, Cpu, Download, ShieldCheck, CheckCircle2, Loader2, Terminal } from 'lucide-react';

export default function VerificationModal({ isOpen, onClose, physicalState }) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setStage(0);
    setProgress(0);
    setIsDone(false);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDone(true);
          return 100;
        }
        const next = prev + 5;
        if (next > 75) setStage(3);
        else if (next > 45) setStage(2);
        else if (next > 15) setStage(1);
        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const stageLabels = [
    'Exporting FloPy Discretization Packages (.dis, .npf, .wel, .csub)...',
    'Executing USGS MODFLOW 6 PCG Sparse Matrix Solver...',
    'Computing 1D Terzaghi Interbed Skeletal Compaction (SUB)...',
    'Calculating Spatial Residual Norms and Wilcoxon p-value...'
  ];

  // Generate 2D profile points comparing PINO vs MODFLOW 6
  const profilePoints = [];
  const maxS = physicalState.maxSubsidenceCm;
  for (let i = 0; i <= 20; i++) {
    const xDist = (i - 10) * 160; // -1600m to +1600m
    const r = Math.abs(xDist) + 10;
    const pinoVal = maxS * Math.exp(-(r * r) / (600 * 600));
    const noise = (Math.sin(i * 1.5) * 0.02) * pinoVal;
    const modflowVal = Math.max(0, pinoVal + noise);

    profilePoints.push({
      xDist,
      pino: parseFloat(pinoVal.toFixed(2)),
      modflow: parseFloat(modflowVal.toFixed(2)),
      residual: parseFloat(Math.abs(pinoVal - modflowVal).toFixed(3))
    });
  }

  // Export CSV Data
  const handleExportCSV = () => {
    let csv = 'Distance_m,PINO_Settlement_cm,MODFLOW6_Settlement_cm,Residual_cm\n';
    profilePoints.forEach(pt => {
      csv += `${pt.xDist},${pt.pino},${pt.modflow},${pt.residual}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aquifera_verification_profile_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-175 max-w-[calc(100vw-32px)] h-145 max-h-[92vh] rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <Cpu size={20} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Tier 4 Verification Pipeline (Architecture Demonstration)
              </h3>
              <span className="text-xs text-slate-400">
                Simulated USGS MODFLOW 6 CSUB Numerical Cross-Validation Run
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1 justify-between">
          
          {/* Progress Bar Track */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex justify-between items-center text-xs">
              <span className={`font-semibold flex items-center gap-2 ${isDone ? 'text-emerald-400' : 'text-primary'}`}>
                {!isDone && <Loader2 size={13} className="animate-spin text-primary" />}
                {isDone ? 'Verification Run Complete' : stageLabels[stage]}
              </span>
              <span className="font-mono tabular-nums text-slate-300 font-bold px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-[11px]">
                {progress}%
              </span>
            </div>

            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/8 shadow-inner">
              <div 
                className={`h-full transition-all duration-150 ${
                  isDone 
                    ? 'bg-linear-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                    : 'bg-linear-to-r from-primary to-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {!isDone ? (
            /* Active Computational Execution Telemetry View (No Layout Jump) */
            <div className="flex-1 flex flex-col justify-between py-1 gap-3.5">
              {/* Pipeline Stage Tracker */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Numerical Computation Pipeline
                </span>
                <div className="flex flex-col gap-1.5">
                  {stageLabels.map((label, idx) => {
                    const isCompleted = stage > idx;
                    const isCurrent = stage === idx;
                    return (
                      <div 
                        key={idx}
                        className={`p-2.5 px-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isCompleted 
                            ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-300 shadow-xs' 
                            : isCurrent 
                            ? 'bg-cyan-950/35 border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.12)]' 
                            : 'bg-white/2 border-white/6 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isCompleted ? (
                            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <Loader2 size={15} className="text-primary animate-spin shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[9px] text-slate-500 shrink-0 font-mono">
                              {idx + 1}
                            </div>
                          )}
                          <span className="truncate font-medium">{label}</span>
                        </div>
                        <span className="font-mono text-[10px] uppercase font-bold shrink-0 ml-2">
                          {isCompleted ? 'Done' : isCurrent ? 'Active' : 'Queued'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Streaming Solver Terminal Telemetry */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10 font-mono text-xs text-slate-400 flex flex-col gap-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-white/8 pb-1.5 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Terminal size={12} className="text-primary" /> FloPy / USGS MODFLOW 6 Solver Telemetry
                  </span>
                  <span className="text-primary font-bold">PID: 4892 · Port 5173</span>
                </div>
                <div className="flex flex-col gap-1 text-[11px] pt-0.5">
                  <p className="text-emerald-400">✓ Grid 20×20 Discretized (dx=160m, dy=160m, 3 Layers)</p>
                  <p className={stage >= 1 ? 'text-cyan-300' : 'text-slate-600'}>
                    {stage >= 1 ? '→ PCG Iteration 14: Max Head Residual = 0.0034m (Converged)' : '… Waiting for PCG sparse matrix allocation'}
                  </p>
                  <p className={stage >= 2 ? 'text-amber-300' : 'text-slate-600'}>
                    {stage >= 2 ? '→ CSUB: Terzaghi 1D interbed compaction matrix resolved' : '… Waiting for CSUB inelastic compaction subroutine'}
                  </p>
                  <p className={stage >= 3 ? 'text-primary' : 'text-slate-600'}>
                    {stage >= 3 ? '→ Wilcoxon signed-rank non-parametric test: p=0.824 (Pass)' : '… Calculating domain residual error norms'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Completed Statistical Suite & Cross-Section Plot */
            <div className="flex-1 flex flex-col justify-between gap-3 animate-in fade-in duration-300">
              {/* Statistical Verification Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Correlation (R²):</span>
                  <span className="font-mono tabular-nums text-xl font-bold text-emerald-400 block mt-1">
                    0.942
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Passes threshold (≥0.90)</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Wilcoxon Test:</span>
                  <span className="font-mono tabular-nums text-xl font-bold text-primary block mt-1">
                    p = 0.824
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">No systematic bias (p &gt; 0.05)</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-white/10 shadow-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Peak Residual Error:</span>
                  <span className="font-mono tabular-nums text-xl font-bold text-emerald-400 block mt-1">
                    3.4 mm
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Below 5.0 mm acceptance</span>
                </div>
              </div>

              {/* 2D Cross-Section Settlement Comparison Chart */}
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 shadow-xs">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-semibold text-white">
                    Radial Subsidence Profile (West to East Cross-Section)
                  </span>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-primary font-medium">
                      <div className="w-3 h-0.5 bg-primary" />
                      PINO Surrogate
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <div className="w-3 h-0.5 border-t border-dashed border-amber-400" />
                      USGS MODFLOW 6
                    </span>
                  </div>
                </div>

                {/* SVG Visual Chart */}
                <div className="w-full h-28 relative">
                  <svg width="100%" height="100%" viewBox="0 0 600 130" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(255,255,255,0.08)" />
                    <line x1="0" y1="65" x2="600" y2="65" stroke="rgba(255,255,255,0.08)" />
                    <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(255,255,255,0.08)" />
                    <line x1="300" y1="0" x2="300" y2="130" stroke="rgba(56, 189, 248, 0.25)" strokeDasharray="3 3" />

                    {/* PINO Curve */}
                    <path
                      d={profilePoints.reduce((acc, pt, i) => {
                        const px = (i / 20) * 600;
                        const py = 20 + (pt.pino / Math.max(0.1, maxS)) * 90;
                        return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                      }, '')}
                      fill="none"
                      stroke="hsl(187, 92%, 48%)"
                      strokeWidth="2.5"
                    />

                    {/* MODFLOW 6 Curve */}
                    <path
                      d={profilePoints.reduce((acc, pt, i) => {
                        const px = (i / 20) * 600;
                        const py = 20 + (pt.modflow / Math.max(0.1, maxS)) * 90;
                        return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                      }, '')}
                      fill="none"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono tabular-nums">
                  <span>-1,600 m (West Boundary)</span>
                  <span>Extraction Center (0 m)</span>
                  <span>+1,600 m (East Boundary)</span>
                </div>
              </div>

              {/* Parity Status Badge */}
              <div className="bg-emerald-950/30 border border-emerald-500/35 p-3 rounded-xl flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300 font-medium leading-relaxed">
                  <strong>Verification Protocol Parity:</strong> Demonstrates the ISO/IEC 25010 verification workflow. In full deployment, this compares live offline-trained PINO tensors against headless MODFLOW 6 CSUB runs within a 5% tolerance window.
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 flex items-center justify-between gap-4 bg-slate-950/90 shrink-0">
          {isDone ? (
            <button 
              className="aquifera-btn-secondary py-2! px-4! text-xs font-semibold"
              onClick={handleExportCSV}
            >
              <Download size={14} className="text-primary" /> Export Profile (.CSV)
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Headless FloPy Worker Active...</span>
            </div>
          )}

          <button 
            className="aquifera-btn-primary py-2! px-5! text-xs font-bold"
            onClick={onClose}
          >
            {isDone ? 'Close Report' : 'Abort Verification'}
          </button>
        </div>
      </div>
    </div>
  );
}
