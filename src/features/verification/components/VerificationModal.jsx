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
  BarChart3,
  CheckCircle2,
  Database,
  ExternalLink
} from 'lucide-react';

export default function VerificationModal({
  isOpen,
  onClose,
  physicalState,
  params,
  capturedScenario
}) {
  const [activeTab, setActiveTab] = useState('pilot');
  const activePumping = params?.pumpingRate || 12000;
  const maxS = physicalState?.maxSubsidenceCm || 28;
  const scenarioName = capturedScenario?.preset || 'baseline';

  // Generate illustrative 2D profile points comparing prototype preview vs hypothetical numerical target
  const profilePoints = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const xDist = (i - 10) * 160; // -1600m to +1600m
      const r = Math.abs(xDist) + 10;
      const protoVal = maxS * Math.exp(-(r * r) / (600 * 600));
      const syntheticVariation = Math.sin(i * 1.5) * 0.02 * protoVal;
      const refVal = Math.max(0, protoVal + syntheticVariation);

      pts.push({
        xDist,
        prototype: parseFloat(protoVal.toFixed(2)),
        reference: parseFloat(refVal.toFixed(2)),
        residual: parseFloat(Math.abs(protoVal - refVal).toFixed(3))
      });
    }
    return pts;
  }, [maxS]);

  // CSV Export for Illustrative Profile
  const handleExportProfileCSV = useCallback(() => {
    let csv = '# AQUIFERA Research Demonstration Prototype\n';
    csv += '# Content: Illustrative Cross-Section Verification Profile Data\n';
    csv += '# Status: Synthetic demonstration data for concept defense (Not measured MODFLOW 6 solver output)\n';
    csv += `# Scenario: ${scenarioName} (Pumping Rate: ${activePumping} m3/day)\n`;
    csv += `# Generation Timestamp: ${new Date().toISOString()}\n`;
    csv += 'Distance_m,Prototype_Settlement_cm,Illustrative_Reference_cm,Illustrative_Residual_cm\n';
    profilePoints.forEach(pt => {
      csv += `${pt.xDist},${pt.prototype},${pt.reference},${pt.residual}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `aquifera_illustrative_profile_${Date.now()}.csv`;
    link.click();
  }, [scenarioName, activePumping, profilePoints]);

  // CSV Export for Pilot Benchmark Evidence
  const handleExportPilotCSV = useCallback(() => {
    let csv = '# AQUIFERA BSIT THESIS: NUMERICAL PILOT BENCHMARK EVIDENCE (2026-10-23)\n';
    csv += '# Environment: USGS MODFLOW 6.8.1 / FloPy v3.11 on Synthetic 5-Layer Deltaic Domain\n';
    csv += '# Hardware: NVIDIA GeForce RTX 4050 Laptop GPU (6 GB VRAM) / Intel Core i5-13420H (WSL2)\n';
    csv += '# Reference Grid: 64x64x5 = 20,480 cells (3,200m x 3,200m x 120m)\n';
    csv += 'Metric,USGS_MODFLOW_6_CSUB_Reference,PINO_Surrogate_Specification,Unit,Status_Basis\n';
    csv += 'Median_Runtime,22500,250,ms,MODFLOW 6 Measured (LHS 20 runs) vs Proposal Table 1 Target (<250 ms)\n';
    csv += 'Runtime_Range,4500-96000,3-14,ms,MODFLOW 6 Observed Range vs Untrained FNO Probe (gpu_fno_check.py)\n';
    csv += 'Memory_Consumption,140-380,1600-4200,MB,MODFLOW 6 CPU RAM vs FNO Probe Peak VRAM / <= 4.2 GB Target\n';
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
      <div className="w-full max-w-4xl max-h-[min(90dvh,52rem)] flex flex-col overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 duration-200">
        
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
                    Numerical Verification & Benchmark Suite
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 shrink-0 font-semibold">
                    Tier 4 Verification Engine (Planned)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  USGS MODFLOW 6.8.1 CSUB Reference Solvers & PINO Surrogate Specifications
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
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('pilot')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'pilot'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BarChart3 size={14} className="text-cyan-400" />
                <span>Numerical Pilot Benchmarks</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono font-bold">
                  Oct 23
                </span>
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
                <span>Proposed Verification Protocol</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-block">
              Solver: <span className="text-slate-200">FloPy v3.11 / MODFLOW 6.8.1 CSUB</span>
            </span>
          </div>
        </div>

        {/* 2. Modal Body */}
        <div className="flex-auto min-h-0 overflow-y-auto overscroll-contain p-6 space-y-5 custom-scrollbar bg-slate-950">

          {activeTab === 'pilot' ? (
            /* ============================================================ */
            /* TAB 1: NUMERICAL PILOT BENCHMARK EVIDENCE (OCT 23, 2026)     */
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
                    Finite-difference simulations were executed on synthetic benchmark domains using FloPy v3.11 and USGS MODFLOW 6.8.1 CSUB (20 LHS scenarios, median 22.5 s, range 4.5–96.0 s). These numerical reference solutions establish the baseline for evaluating PINO surrogate acceleration and GPU memory bounds.
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
                    <div className="text-3xl font-bold font-mono text-cyan-400 tabular-nums tracking-tight">
                      &lt; 250 ms
                    </div>
                    <p className="text-xs text-cyan-200/90 font-medium">
                      Target latency (Untrained probe: 3–14 ms)
                    </p>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">VRAM Bound:</span>
                      <span className="text-cyan-300 font-bold">&le; 4.2 GB Target</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hardware:</span>
                      <span className="text-white">NVIDIA RTX 4050</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Speedup Target:</span>
                      <span className="text-white">&ge; 50× (Proposal Table 1)</span>
                    </div>
                  </div>
                </div>

                {/* Metric 3: Geotechnical Compaction Bowl */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Database size={14} /> Peak Compaction
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                      MF6 Fig. A1
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold font-mono text-white tabular-nums tracking-tight">
                      75.2 mm
                    </div>
                    <p className="text-xs text-slate-400">
                      Maximum vertical skeletal compaction (Δb)
                    </p>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confining Unit:</span>
                      <span className="text-white">Layer 4 Clay (75–100 m)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inelastic Ssk:</span>
                      <span className="text-white">1.0 × 10⁻⁴ m⁻¹</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Projection:</span>
                      <span className="text-white">PRS92 Zone 4</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Comparative Latency Telemetry Visual Bar */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">
                    Target Latency Benchmark Comparison
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/30">
                    Target Threshold: &lt; 250 ms
                  </span>
                </div>

                {/* MODFLOW 6 Row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">USGS MODFLOW 6 CSUB (Numerical Reference Run)</span>
                    <span className="font-mono text-amber-300 font-bold">22,500 ms (Median)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* PINO Forward Pass Row */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">PINO 3D Surrogate (Target Acceptance Threshold)</span>
                    <span className="font-mono text-cyan-400 font-bold">&lt; 250 ms (&ge; 50× Speedup Criterion)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]" style={{ width: '1.2%' }} />
                  </div>
                </div>

                <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  <strong className="text-slate-200">Numerical Implication:</strong> Standard finite-difference numerical solvers require ~22.5 s per exploratory scenario—interrupting interactive planning deliberation. The proposed PINO surrogate targets sub-250 ms evaluations, while reserving USGS MODFLOW 6 for on-demand verification.
                </p>
              </div>

              {/* Scientific Boundary Statement */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div className="space-y-1 text-xs text-slate-300 leading-relaxed font-normal">
                  <strong className="text-white text-xs">Scientific Scope & Verification Boundary:</strong>
                  <p>
                    MODFLOW 6 CSUB outputs represent finite-difference numerical reference solutions, not absolute physical truth. Benchmarking the PINO surrogate against MODFLOW 6 constitutes formal numerical verification. Physical field validation requires local borehole extensometers and InSAR geodetic data, which remain outside the current synthetic numerical testbed.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* ============================================================ */
            /* TAB 2: PROPOSED VERIFICATION PROTOCOL (WORKFLOW DESIGN)      */
            /* ============================================================ */
            <div className="space-y-5">

              {/* Research Integrity Notice */}
              <div className="bg-amber-950/20 border border-amber-500/35 p-4 rounded-xl flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <AlertTriangle size={16} />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-amber-200 text-sm tracking-tight">
                    Research Integrity Notice: Proposed Verification Workflow (Solver Not Connected)
                  </h4>
                  <p className="text-slate-300 leading-relaxed font-normal">
                    This view presents the planned numerical verification architecture for our BSIT thesis research defense.
                    No live USGS MODFLOW 6 binary, headless worker, or automated FloPy solver is connected to this client-side prototype.
                    The curves and metrics below demonstrate the intended interface format for on-demand verification.
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
                    Planned 64×64 finite-difference mesh matching the 5 hydrostratigraphic units of proposal Fig. 6 with constant-head coastal boundary at the Iloilo Strait.
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Target: dx = 50 m, dy = 50 m
                  </span>
                </div>

                {/* Pillar 2 */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Target size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">2. Candidate Metrics</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Candidate evaluation metrics: Spatial R² correlation, peak residual norm (|s_surrogate - s_modflow|), and non-parametric Wilcoxon signed-rank test for spatial bias.
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Target: R² &ge; 0.92, L2 error &le; 8%
                  </span>
                </div>

                {/* Pillar 3 */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Clock size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">3. Latency Protocol</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Proposed comparative runtime benchmark measuring surrogate inference on GPU workstation versus finite-difference iterative solver solution time on identical domains.
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Target: &lt; 250 ms (vs 22.5 s baseline)
                  </span>
                </div>

              </div>

              {/* 2D Cross-Section Settlement Comparison Chart (Illustrative Concept) */}
              <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">
                    Radial Subsidence Profile (West to East Cross-Section)
                  </span>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <div className="w-3.5 h-0.5 bg-cyan-400" />
                      Prototype Scenario (Live)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <div className="w-3.5 h-0.5 border-t border-dashed border-amber-400" />
                      Illustrative Numerical Reference
                    </span>
                  </div>
                </div>

                {/* SVG Visual Chart */}
                <div className="w-full h-36 relative bg-slate-950 rounded-xl p-3 border border-slate-800">
                  <svg width="100%" height="100%" viewBox="0 0 600 130" preserveAspectRatio="none">
                    <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="65" x2="600" y2="65" stroke="rgba(255,255,255,0.06)" />
                    <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(255,255,255,0.06)" />
                    <line x1="300" y1="0" x2="300" y2="130" stroke="rgba(56, 189, 248, 0.20)" strokeDasharray="3 3" />

                    {/* Prototype Scenario Curve */}
                    <path
                      d={profilePoints.reduce((acc, pt, i) => {
                        const px = (i / 20) * 600;
                        const py = 20 + (pt.prototype / Math.max(0.1, maxS)) * 90;
                        return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
                      }, '')}
                      fill="none"
                      stroke="hsl(187, 92%, 48%)"
                      strokeWidth="2.5"
                    />

                    {/* Illustrative Reference Curve */}
                    <path
                      d={profilePoints.reduce((acc, pt, i) => {
                        const px = (i / 20) * 600;
                        const py = 20 + (pt.reference / Math.max(0.1, maxS)) * 90;
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
                  <span>-1,600 m (West Boundary)</span>
                  <span>Extraction Center (0 m)</span>
                  <span>+1,600 m (East Boundary)</span>
                </div>

                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800 leading-relaxed">
                  *Provenance Note: The dashed reference curve is an illustrative synthetic profile derived from theoretical Theis-Terzaghi equations with simulated discretization variation. It demonstrates the planned cross-validation interface format and does not represent an executed MODFLOW 6 simulation run.
                </p>
              </div>

              {/* Verification Protocol Governance Badge */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Evaluation Framework Alignment:</strong> The planned verification protocol evaluates functional accuracy and computational efficiency under the ISO/IEC 25010 systems and software quality model upon solver integration.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* 3. Modal Footer with Standardized Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-900/60 shrink-0">
          {activeTab === 'pilot' ? (
            <button 
              className="aquifera-btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer"
              onClick={handleExportPilotCSV}
            >
              <Download size={14} className="text-cyan-400" /> Export Pilot Benchmark Evidence (.CSV)
            </button>
          ) : (
            <button 
              className="aquifera-btn-secondary py-2 px-4 text-xs font-semibold cursor-pointer"
              onClick={handleExportProfileCSV}
            >
              <Download size={14} className="text-cyan-400" /> Export Illustrative Profile (.CSV)
            </button>
          )}

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
