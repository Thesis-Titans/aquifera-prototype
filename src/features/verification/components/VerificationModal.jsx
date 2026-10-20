import React, { useMemo, useCallback } from 'react';
import { X, Cpu, Download, AlertTriangle, Layers, Target, Clock, ShieldCheck } from 'lucide-react';

export default function VerificationModal({ isOpen, onClose, physicalState, params, capturedScenario }) {
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
      // Simulated illustrative variation for visualization demonstration only
      const syntheticVariation = (Math.sin(i * 1.5) * 0.02) * protoVal;
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

  // Truthful CSV Export with provenance metadata
  const handleExportCSV = useCallback(() => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-185 max-w-[calc(100vw-32px)] h-150 max-h-[92vh] rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Modal Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <Cpu size={20} className="text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Proposed Numerical Verification Workflow
              </h3>
              <span className="text-xs text-slate-400">
                Research Protocol: USGS MODFLOW 6 / CSUB Independent Cross-Validation
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

        {/* 2. Modal Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Research Integrity Notice */}
          <div className="bg-amber-950/30 border border-amber-500/35 p-3.5 rounded-xl flex items-start gap-3 shadow-xs">
            <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-bold text-amber-200">
                Research Integrity Notice: Proposed Verification Workflow (Solver Not Connected)
              </span>
              <span className="text-slate-300 leading-relaxed font-normal">
                This modal presents the planned numerical verification architecture for our capstone research defense.
                No live USGS MODFLOW 6 binary, headless worker, or automated FloPy solver is connected to this client-side prototype.
                The curves, metrics, and workflow stages below represent proposed verification protocols rather than measured experimental findings.
              </span>
            </div>
          </div>

          {/* Three-Pillar Planned Methodology Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Pillar 1 */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-cyan-300">
                <Layers size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">1. Spatial Discretization</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Planned 64×64 finite-difference mesh matching the 3 hydrostratigraphic units (Sand 1, Clay Aquitard, Confined Sand 2) with constant-head coastal boundary at the Iloilo Strait.
              </p>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-white/5">
                Target: dx=50m, dy=50m
              </span>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <Target size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">2. Candidate Metrics</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Candidate evaluation metrics under review: Spatial R² correlation, peak residual norm (|s_surrogate - s_modflow|), and non-parametric Wilcoxon test for spatial bias.
              </p>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-white/5">
                Status: Candidate research criteria
              </span>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/10 flex flex-col justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <Clock size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">3. Latency Protocol</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Proposed comparative runtime benchmark measuring surrogate inference on GPU workstation versus finite-difference iterative solver solution time on identical domains.
              </p>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded border border-white/5">
                Target Spec: &lt; 250 ms vs 180-300 s
              </span>
            </div>

          </div>

          {/* 2D Cross-Section Settlement Comparison Chart (Illustrative Concept) */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/10 shadow-xs flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Radial Subsidence Profile (West to East Cross-Section)
              </span>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <div className="w-3.5 h-0.5 bg-cyan-400" />
                  Prototype Scenario (Live)
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <div className="w-3.5 h-0.5 border-t border-dashed border-amber-400" />
                  Illustrative Reference Target
                </span>
              </div>
            </div>

            {/* SVG Visual Chart */}
            <div className="w-full h-32 relative bg-slate-950/60 rounded-lg p-2 border border-white/5">
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
            
            <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums px-1">
              <span>-1,600 m (West Domain Boundary)</span>
              <span>Extraction Center (0 m)</span>
              <span>+1,600 m (East Domain Boundary)</span>
            </div>

            <div className="text-[10px] text-slate-400 italic pt-1 border-t border-white/5 leading-relaxed">
              *Provenance Note: The dashed reference curve is an illustrative synthetic profile derived from theoretical Theis-Terzaghi equations with simulated discretization variation. It illustrates the planned cross-validation format and does not represent an executed MODFLOW 6 simulation run.
            </div>
          </div>

          {/* Verification Protocol Governance Badge */}
          <div className="bg-slate-900/60 border border-white/10 p-3.5 rounded-xl flex items-center gap-3">
            <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-300 font-normal leading-relaxed">
              <strong>Evaluation Framework Alignment:</strong> The proposed verification protocol will be calibrated against borehole lithological logs and evaluated under ISO/IEC 25010 functional accuracy metrics following CICT research guidelines upon solver integration.
            </span>
          </div>

        </div>

        {/* 3. Modal Footer */}
        <div className="p-4 px-6 border-t border-white/10 flex items-center justify-between gap-4 bg-slate-950/90 shrink-0">
          <button 
            className="aquifera-btn-secondary py-2 px-4 text-xs font-semibold"
            onClick={handleExportCSV}
          >
            <Download size={14} className="text-cyan-400" /> Export Illustrative Profile (.CSV)
          </button>

          <button 
            className="aquifera-btn-primary py-2 px-5 text-xs font-bold"
            onClick={onClose}
          >
            Close Protocol
          </button>
        </div>

      </div>
    </div>
  );
}
