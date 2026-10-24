import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Cpu,
  Download,
  AlertTriangle,
  Layers,
  Target,
  Clock,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { evaluate as evaluateReference } from '../../../engines/referenceEngine.js';

export default function VerificationModal({
  isOpen,
  onClose,
  physicalState,
  params,
  capturedScenario,
  selectedEngineId = 'analytical'
}) {
  const [activeTab, setActiveTab] = useState('live');
  const activePumping = params?.pumpingRate ?? 12000;
  const maxS = physicalState?.maxSubsidenceCm ?? 0;
  const scenarioName = capturedScenario?.preset ?? 'baseline';
  const meta = physicalState?.meta ?? {};
  const residual = physicalState?.residual ?? {};
  const fallbackEngaged = meta.fallbackEngaged ?? false;

  // Lazily compute reference proxy solution only when modal is open
  const refState = useMemo(() => {
    if (!isOpen) return null;
    return evaluateReference(params);
  }, [isOpen, params]);

  // Determine which comparison grid to evaluate against the reference baseline
  // On fallback: evaluate original anomalous surrogate output to expose the breach
  const comparedDisplacementGrid = useMemo(() => {
    if (fallbackEngaged && physicalState?.surrogateState?.displacementGrid) {
      return physicalState.surrogateState.displacementGrid;
    }
    return physicalState?.displacementGrid;
  }, [fallbackEngaged, physicalState]);

  const isSelfComparison = meta.activeEngineId === 'reference' && !fallbackEngaged;

  // Dynamically compute verification metrics against USGS MODFLOW 6.8.1 CSUB baseline proxy
  const verificationMetrics = useMemo(() => {
    if (!isOpen || !comparedDisplacementGrid || !refState?.displacementGrid) {
      return { l2RelErrorPercent: 0, rSquared: 1, peakResidualMm: 0, meanResidualMm: 0, passedL2Target: true };
    }

    const res = physicalState?.resolution ?? 64;
    const totalCells = res * res;
    let sumSqDiff = 0;
    let sumSqRef = 0;
    let sumRef = 0;
    let peakResidualM = 0;
    let sumResidualM = 0;

    for (let i = 0; i < totalCells; i++) {
      const actual = comparedDisplacementGrid[i];
      const ref = refState.displacementGrid[i];
      const diff = Math.abs(actual - ref);
      sumSqDiff += diff * diff;
      sumSqRef += ref * ref;
      sumRef += ref;
      sumResidualM += diff;
      if (diff > peakResidualM) peakResidualM = diff;
    }

    const meanRef = sumRef / totalCells;
    let totalVar = 0;
    for (let i = 0; i < totalCells; i++) {
      const dev = refState.displacementGrid[i] - meanRef;
      totalVar += dev * dev;
    }

    const l2RelError = Math.sqrt(sumSqDiff) / (Math.sqrt(sumSqRef) + 1e-6);
    const l2RelErrorPercent = parseFloat((l2RelError * 100).toFixed(2));
    const rSquared = totalVar > 0 ? parseFloat(Math.max(0, 1 - (sumSqDiff / totalVar)).toFixed(4)) : 1.0;
    const peakResidualMm = parseFloat((peakResidualM * 1000).toFixed(2));
    const meanResidualMm = parseFloat(((sumResidualM / totalCells) * 1000).toFixed(3));

    return {
      l2RelErrorPercent,
      rSquared,
      peakResidualMm,
      meanResidualMm,
      passedL2Target: l2RelErrorPercent <= 5.0
    };
  }, [isOpen, comparedDisplacementGrid, refState, physicalState]);

  // Generate 2D cross-section profile comparing live active engine against MODFLOW 6 CSUB baseline proxy
  const profilePoints = useMemo(() => {
    if (!isOpen || !refState) return [];
    const pts = [];
    const res = physicalState?.resolution ?? 64;
    const centerRow = Math.floor(res / 2);
    const stepM = 3200 / (res - 1);

    for (let col = 0; col < res; col += 3) {
      const idx = centerRow * res + col;
      const xDist = Math.round(-1600 + col * stepM);
      const protoValM = comparedDisplacementGrid?.[idx] ?? 0;
      const refValM = refState?.displacementGrid?.[idx] ?? 0;

      pts.push({
        xDist,
        prototype: parseFloat((protoValM * 100).toFixed(2)), // in cm
        reference: parseFloat((refValM * 100).toFixed(2)), // in cm
        residual: parseFloat((Math.abs(protoValM - refValM) * 100).toFixed(3))
      });
    }
    return pts;
  }, [isOpen, physicalState, comparedDisplacementGrid, refState]);

  // CSV Export for Live Cross-Section Verification Profile
  const handleExportProfileCSV = useCallback(() => {
    let csv = '# AQUIFERA BSIT Thesis: Live Numerical Verification Cross-Section\n';
    csv += '# Basis: Active Simulation Engine vs USGS MODFLOW 6.8.1 CSUB Numerical Reference Proxy\n';
    csv += `# Evaluated Engine: ${fallbackEngaged ? 'PINO Surrogate (Breached Output)' : (meta.engineName ?? selectedEngineId)}\n`;
    csv += `# Scenario Preset: ${scenarioName} (Pumping Rate: ${activePumping} m3/day)\n`;
    csv += `# Verification Metrics: Rel L2 Error = ${verificationMetrics.l2RelErrorPercent}%, R2 = ${verificationMetrics.rSquared}, Peak Residual = ${verificationMetrics.peakResidualMm} mm\n`;
    csv += `# Generation Timestamp: ${new Date().toISOString()}\n`;
    csv += 'Distance_m,Evaluated_Settlement_cm,MODFLOW6_Reference_cm,Residual_cm\n';
    profilePoints.forEach(pt => {
      csv += `${pt.xDist},${pt.prototype},${pt.reference},${pt.residual}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aquifera_live_verification_profile_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [scenarioName, activePumping, meta, selectedEngineId, fallbackEngaged, verificationMetrics, profilePoints]);

  // CSV Export for Pilot Benchmark Evidence
  const handleExportPilotCSV = useCallback(() => {
    let csv = '# AQUIFERA BSIT THESIS: NUMERICAL PILOT BENCHMARK EVIDENCE (2026-10-23)\n';
    csv += '# Environment: USGS MODFLOW 6.8.1 / FloPy v3.11 on Synthetic 5-Layer Deltaic Domain\n';
    csv += '# Hardware: NVIDIA GeForce RTX 4050 Laptop GPU (6 GB VRAM) / Intel Core i5-13420H (WSL2)\n';
    csv += '# Reference Grid: 64x64x5 = 20,480 cells (3,200m x 3,200m x 120m)\n';
    csv += 'Metric,USGS_MODFLOW_6_CSUB_Reference,PINO_Surrogate_Specification,Unit,Status_Basis\n';
    csv += 'Median_Runtime,22500,250,ms,MODFLOW 6 Measured (LHS 20 runs) vs Proposal Table 1 Target (<250 ms)\n';
    csv += 'Runtime_Range,4500-96000,10-25,ms,MODFLOW 6 Observed Range vs FNO Forward Probe (gpu_fno_check.py)\n';
    csv += 'Memory_Consumption,120-140,1600-4200,MB,MODFLOW 6 CPU RAM vs FNO Probe Peak VRAM / <= 4.2 GB Target\n';
    csv += 'Peak_Compaction,75.2,Pending,mm,MODFLOW 6 CSUB Reference Solution (Attachment Fig. A1)\n';
    csv += 'Preconsolidation_Breach,True,Pending,boolean,Layer 4 Inelastic Clay Dewatering\n';
    csv += 'Geodetic_Projection,PRS92_Zone_4,PRS92_Zone_4,CRS,EPSG 3124\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aquifera_pilot_benchmark_2026-10-23.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  // Keyboard accessibility: Close dialog on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verif-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl max-h-[min(90dvh,54rem)] flex flex-col overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <Cpu size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 id="verif-title" className="text-base font-bold text-white tracking-tight truncate">
                    Numerical Verification & Multi-Engine Benchmark Suite
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 shrink-0 font-semibold">
                    ISO/IEC 25010 & NIST AI RMF 1.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  MODFLOW 6 CSUB Baseline Proxy, PINO Surrogate Probe & Automated Residual Gating
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Close Dialog (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('live')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'live'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Activity size={14} className="text-cyan-400" />
                <span>Live Verification</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono font-bold">
                  Active
                </span>
              </button>

              <button
                onClick={() => setActiveTab('pilot')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'pilot'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BarChart3 size={14} className="text-cyan-400" />
                <span>Pilot Evidence (Oct 23)</span>
              </button>

              <button
                onClick={() => setActiveTab('protocol')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'protocol'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Target size={14} className="text-amber-400" />
                <span>Verification Protocol</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
              Reference: <span className="text-slate-200 font-semibold">MODFLOW 6.8.1 CSUB Baseline Proxy</span>
            </span>
          </div>
        </div>

        {/* 2. Modal Body */}
        <div className="flex-auto min-h-0 overflow-y-auto overscroll-contain p-6 space-y-5 custom-scrollbar bg-slate-950">

          {activeTab === 'live' && (
            /* ============================================================ */
            /* TAB 1: LIVE NUMERICAL VERIFICATION (ACTIVE SCENARIO)         */
            /* ============================================================ */
            <div className="space-y-5">
              
              {/* Dynamic Verification Telemetry Summary Card */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      Live Error Metrics vs. MODFLOW 6 CSUB Baseline Proxy
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      Evaluated: {fallbackEngaged ? 'PINO Surrogate (Breached Output)' : (meta.engineName ?? selectedEngineId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fallbackEngaged ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                        <ShieldAlert size={13} /> Fallback Active (Breach Inspected)
                      </span>
                    ) : isSelfComparison ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <CheckCircle2 size={13} /> Reference Baseline Self-Consistency
                      </span>
                    ) : verificationMetrics.passedL2Target ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 size={13} /> Target Satisfied (Rel. L₂ &le; 5%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <AlertTriangle size={13} /> Out of Tolerance (Rel. L₂ &gt; 5%)
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Metric Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Relative L₂ Error</span>
                    <span className={`font-mono text-xl font-bold block mt-1 ${verificationMetrics.passedL2Target ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {verificationMetrics.l2RelErrorPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Target Spec: &le; 5.0%</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Determination (R²)</span>
                    <span className="font-mono text-xl font-bold text-cyan-300 block mt-1">
                      {verificationMetrics.rSquared}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Target Spec: &ge; 0.92</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Peak Residual (|Δb|)</span>
                    <span className="font-mono text-xl font-bold text-white block mt-1">
                      {verificationMetrics.peakResidualMm} mm
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Mean: {verificationMetrics.meanResidualMm} mm</span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Residual Trust (η)</span>
                    <span className={`font-mono text-xl font-bold block mt-1 ${(residual.eta ?? 0.02) <= 0.15 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {residual.eta ?? 0.02}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Tolerance τ = 0.15</span>
                  </div>
                </div>
              </div>

              {/* Live Radial Cross-Section Settlement Curve Comparison */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">
                    West-to-East Subsidence Profile Comparison (Centerline)
                  </span>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <div className="w-3.5 h-0.5 bg-cyan-400" />
                      {fallbackEngaged ? 'Breached Surrogate Output' : (meta.engineName ?? selectedEngineId)}
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <div className="w-3.5 h-0.5 border-t border-dashed border-amber-400" />
                      MODFLOW 6 CSUB Baseline Proxy
                    </span>
                  </div>
                </div>

                {/* SVG Visual Chart */}
                <div className="w-full h-40 relative bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <svg width="100%" height="100%" viewBox="0 0 600 130" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="65" x2="600" y2="65" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(255,255,255,0.06)" />
                    <line x1="300" y1="0" x2="300" y2="130" stroke="rgba(56, 189, 248, 0.20)" strokeDasharray="3 3" />

                    {/* Active Scenario Curve */}
                    <path
                      d={profilePoints.reduce((acc, pt, i) => {
                        const px = (i / Math.max(1, profilePoints.length - 1)) * 600;
                        const maxDisp = Math.max(0.1, maxS, refState?.maxSubsidenceCm ?? 0);
                        const py = 20 + (pt.prototype / maxDisp) * 90;
                        return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                      }, '')}
                      fill="none"
                      stroke="hsl(187, 92%, 48%)"
                      strokeWidth="2.5"
                    />

                    {/* MODFLOW 6 Numerical Baseline Curve */}
                    <path
                      d={profilePoints.reduce((acc, pt, i) => {
                        const px = (i / Math.max(1, profilePoints.length - 1)) * 600;
                        const maxDisp = Math.max(0.1, maxS, refState?.maxSubsidenceCm ?? 0);
                        const py = 20 + (pt.reference / maxDisp) * 90;
                        return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                      }, '')}
                      fill="none"
                      stroke="hsl(38, 92%, 50%)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                </div>
                
                <div className="flex justify-between text-xs text-slate-400 font-mono tabular-nums px-1">
                  <span>-1,600 m (West Dirichlet Margin)</span>
                  <span>Domain Center (0 m)</span>
                  <span>+1,600 m (East Dirichlet Margin)</span>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed space-y-1">
                  <div>
                    <strong className="text-white">Profile Evaluation:</strong> Pumping discharge of {activePumping.toLocaleString()} m³/d across {params.pumpingDays ?? 180} days. Max active settlement: <span className="text-cyan-300 font-mono font-semibold">{maxS} cm</span> vs MODFLOW 6 reference: <span className="text-amber-300 font-mono font-semibold">{(refState?.maxSubsidenceCm ?? 0).toFixed(1)} cm</span>.
                  </div>
                  <div className="text-[10px] text-slate-500 italic">
                    Note: Numerical verification benchmarks surrogate calculations against reference numerical solutions on synthetic testbeds. Field validation requires physical borehole monitoring data.
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'pilot' && (
            /* ============================================================ */
            /* TAB 2: NUMERICAL PILOT BENCHMARK EVIDENCE (OCT 23, 2026)     */
            /* ============================================================ */
            <div className="space-y-5">

              {/* Verified Pilot Baseline Badge */}
              <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <CheckCircle2 size={16} />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-cyan-200 text-sm tracking-tight">
                    Numerical Benchmark Feasibility Record (Executed October 23, 2026)
                  </h4>
                  <p className="text-slate-300 leading-relaxed font-normal">
                    Finite-difference simulations were executed on synthetic benchmark domains using FloPy v3.11 and USGS MODFLOW 6.8.1 CSUB (20 LHS scenarios, median 22.5 s, range 4.5–96.0 s). These numerical reference solutions establish the empirical baseline for evaluating PINO surrogate acceleration and GPU memory bounds.
                  </p>
                </div>
              </div>

              {/* Three Benchmark Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Metric 1: MODFLOW 6 CSUB Baseline */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={14} /> MODFLOW 6 CSUB
                    </span>
                    <span className="text-[10px] font-mono bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                      Measured Reference
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                      22.5 s
                    </div>
                    <p className="text-xs text-slate-400">
                      Median solution time (20 LHS runs: 4.5 – 96.0 s)
                    </p>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mesh:</span>
                      <span className="text-white">64×64×5 (20,480)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cell Size:</span>
                      <span className="text-white">dx = dy = 50 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Package:</span>
                      <span className="text-white">CSUB Delay Interbeds</span>
                    </div>
                  </div>
                </div>

                {/* Metric 2: PINO Forward Inference Target Spec */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-cyan-500/30 flex flex-col justify-between gap-3 bg-linear-to-b from-cyan-950/20 to-transparent hover:border-cyan-400/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu size={14} /> PINO 3D Surrogate
                    </span>
                    <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-semibold">
                      Target Spec
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold font-mono text-cyan-300 tabular-nums tracking-tight">
                      &lt; 250 ms
                    </div>
                    <p className="text-xs text-slate-400">
                      Forward inference latency criterion (≥ 50× median speedup)
                    </p>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">FNO Probe:</span>
                      <span className="text-cyan-300 font-bold">10–25 ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Peak VRAM:</span>
                      <span className="text-cyan-300 font-bold">~1.6 GB (≤ 4.2 GB Target)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Speedup:</span>
                      <span className="text-cyan-300 font-bold">90× (median basis)</span>
                    </div>
                  </div>
                </div>

                {/* Metric 3: Break-Even Scenario Count */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={14} /> Break-Even Count
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      Proposed Target
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                      &le; 1,200
                    </div>
                    <p className="text-xs text-slate-400">
                      N_crit threshold (wall-clock basis with 6-worker generation)
                    </p>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gen Throughput:</span>
                      <span className="text-white">332 runs/hr (6 workers)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">1,000-Run Gen:</span>
                      <span className="text-white">~3.0 hours (wall-clock)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Est. N_crit:</span>
                      <span className="text-emerald-400 font-bold">~750 (4h training)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Latency Comparison Scale */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Computational Latency Scale Comparison
                </span>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">USGS MODFLOW 6 CSUB (Numerical Reference Run)</span>
                    <span className="font-mono text-amber-300 font-bold">22,500 ms (Median)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">PINO 3D Surrogate (Target Acceptance Threshold)</span>
                    <span className="font-mono text-cyan-400 font-bold">&lt; 250 ms (&ge; 50× Speedup Criterion)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]" style={{ width: '1.2%' }} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'protocol' && (
            /* ============================================================ */
            /* TAB 3: PROPOSED VERIFICATION PROTOCOL (DSR ARCHITECTURE)     */
            /* ============================================================ */
            <div className="space-y-5">

              {/* Research Methodology Framework */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div className="space-y-1 text-xs text-slate-300 leading-relaxed font-normal">
                  <h4 className="font-bold text-white text-sm tracking-tight">
                    Design Science Research (DSR) Verification Methodology
                  </h4>
                  <p>
                    The proposed research evaluates the containerized simulation platform under the ISO/IEC 25010 systems and software quality model. Quantitative verification focuses on functional accuracy (Rel. L₂ error &le; 5.0%, R² &ge; 0.92) and performance efficiency (T_infer &lt; 250 ms, S_p &ge; 50× median speedup) across held-out Latin Hypercube scenarios.
                  </p>
                </div>
              </div>

              {/* Three-Pillar Planned Methodology Architecture */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Pillar 1 */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Layers size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">1. Spatial Discretization</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    64×64×5 finite-difference mesh (20,480 cells) matching the 5 hydrostratigraphic units of proposal Fig. 6 with constant-head coastal boundary at the Iloilo Strait.
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Target: dx = dy = 50 m
                  </span>
                </div>

                {/* Pillar 2 */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Target size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">2. Verification Metrics</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Candidate evaluation criteria: Relative L₂ error &le; 5.0%, Spatial R² correlation &ge; 0.92, peak residual norm, and non-parametric Wilcoxon signed-rank test for spatial bias.
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Target: Rel. L₂ &le; 5%, R² &ge; 0.92
                  </span>
                </div>

                {/* Pillar 3 */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">3. Latency Protocol</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Automated runtime benchmark measuring PINO forward inference on GPU workstation versus MODFLOW 6 finite-difference iterative solver on identical parameter inputs.
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Target: &lt; 250 ms (vs 22.5 s baseline)
                  </span>
                </div>

              </div>

              {/* NIST AI RMF 1.0 Fallback Architecture Explanation */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-white text-xs block">
                  NIST AI RMF 1.0 Residual-Gated Automated Fallback Architecture
                </span>
                <p className="text-slate-300 leading-relaxed">
                  In high-consequence geospatial engineering applications, neural surrogates may produce unphysical extrapolations outside their training envelope. Aquifera integrates continuous physics-informed residual gating (η). When discrete mass-balance continuity or Terzaghi consolidation consistency exceeds tolerance (τ = 0.15), the system automatically falls back to verified numerical reference baseline solutions (aligned with NIST AI RMF 1.0 MEASURE 2.6 and MANAGE 2.4).
                </p>
              </div>

            </div>
          )}

        </div>

        {/* 3. Modal Footer with Standardized Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-900/60 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            {activeTab === 'live' ? (
              <button 
                className="aquifera-btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer"
                onClick={handleExportProfileCSV}
              >
                <Download size={14} className="text-cyan-400" /> Export Live Verification Profile (.CSV)
              </button>
            ) : (
              <button 
                className="aquifera-btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer"
                onClick={handleExportPilotCSV}
              >
                <Download size={14} className="text-cyan-400" /> Export Pilot Benchmark Evidence (.CSV)
              </button>
            )}
          </div>

          <button 
            className="aquifera-btn-primary py-2 px-5 text-xs font-bold cursor-pointer"
            onClick={onClose}
          >
            Close Dialog
          </button>
        </div>

      </div>
    </div>
  );
}
