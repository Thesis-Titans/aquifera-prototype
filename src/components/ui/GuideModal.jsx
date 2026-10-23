import React from 'react';
import { X, BookOpen } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-165 max-w-[calc(100vw-32px)] max-h-[88vh] rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-primary" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Aquifera Technical & Hydrogeological Guide
              </h3>
              <span className="text-xs text-slate-400">
                Governing PDEs, PINO Neural Operator & Verification Architecture
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3.5 text-xs text-slate-300 leading-relaxed">
          
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 shadow-xs">
            <h4 className="text-primary font-bold mb-1.5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)]" />
              1. The Hydrogeological Problem
            </h4>
            <p>
              When municipal and industrial wells extract groundwater faster than natural recharge, piezometric heads drop. In multi-layer coastal deltas like Metro Iloilo, this transfers the overburden weight from pore water onto the mineral soil skeleton.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 shadow-xs">
            <h4 className="text-amber-400 font-bold mb-1.5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              2. Elastic vs. Inelastic Clay Compaction (Terzaghi Theory)
            </h4>
            <p>
              • <strong className="text-white">Elastic Range (h ≥ 88.0 m):</strong> Soil skeleton acts like a stiff spring governed by S<sub>ske</sub> = 2.5 × 10⁻⁵ m⁻¹. Ground surface recovers elastically when pumping stops.<br />
              • <strong className="text-rose-400">Inelastic Collapse (h &lt; 88.0 m):</strong> Once drawdown breaches historical preconsolidation head (h<sub>pre</sub>), clay pores collapse permanently (S<sub>skv</sub> = 2.8 × 10⁻³ m⁻¹). Structural subsidence is irreversible.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 shadow-xs">
            <h4 className="text-cyan-300 font-bold mb-1.5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              3. The Computing Breakthrough (PINO Surrogate)
            </h4>
            <p>
              Numerical simulators such as USGS MODFLOW 6 with CSUB took from about 5 to 96 seconds per run on our synthetic test grid, and comparing many pumping scenarios multiplies that cost. Aquifera trains a <strong className="text-white">Physics-Informed Neural Operator (PINO)</strong> offline to approximate the governing flow and Terzaghi consolidation PDEs with a <strong className="text-primary font-mono font-bold">target under 250 milliseconds</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 shadow-xs">
            <h4 className="text-emerald-400 font-bold mb-1.5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              4. Verification Architecture (Tier 4 Fallback)
            </h4>
            <p>
              Every fast neural prediction can be cross-checked on-demand against headless USGS MODFLOW 6 via automated Python FloPy workers, ensuring that fast machine learning never sacrifices scientific rigor.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/10 bg-slate-950/90 flex items-center justify-end shrink-0">
          <button 
            className="aquifera-btn-primary py-2! px-5! text-xs font-bold"
            onClick={onClose}
          >
            Got it, Return to Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
