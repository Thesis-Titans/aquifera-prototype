import React from 'react';
import { X, BookOpen } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-160 max-w-full max-h-[85vh] rounded-2xl bg-surface/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Aquifera Technical & Hydrogeological Guide
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs text-text-muted leading-relaxed">
          
          <div>
            <h4 className="text-primary font-bold mb-1 text-sm">
              1. The Hydrogeological Problem
            </h4>
            <p>
              When municipal and industrial wells extract groundwater faster than natural recharge, piezometric heads drop. In multi-layer coastal deltas, this transfers the overburden weight from pore water onto the mineral soil skeleton.
            </p>
          </div>

          <div>
            <h4 className="text-amber-400 font-bold mb-1 text-sm">
              2. Elastic vs. Inelastic Clay Compaction (Terzaghi Theory)
            </h4>
            <p>
              • <strong>Elastic Range (h ≥ 88.0 m):</strong> Soil skeleton acts like a stiff spring governed by S<sub>ske</sub> = 2.5 × 10⁻⁵ m⁻¹. Ground surface recovers elastically when pumping stops.<br />
              • <strong>Inelastic Collapse (h &lt; 88.0 m):</strong> Once drawdown breaches historical preconsolidation head (h<sub>pre</sub>), clay pores collapse permanently (S<sub>skv</sub> = 2.8 × 10⁻³ m⁻¹). Structural subsidence is irreversible.
            </p>
          </div>

          <div>
            <h4 className="text-secondary font-bold mb-1 text-sm">
              3. The Computing Breakthrough (PINO Surrogate)
            </h4>
            <p>
              Traditional numerical simulators (USGS MODFLOW 6) take 3 to 5 minutes per run, blocking real-time planning meetings. Aquifera trains a <strong>Physics-Informed Neural Operator (PINO)</strong> offline to approximate the governing flow and Terzaghi consolidation PDEs in <strong>under 250 milliseconds (~80,000× speedup)</strong>.
            </p>
          </div>

          <div>
            <h4 className="text-success font-bold mb-1 text-sm">
              4. Verification Architecture (Tier 4 Fallback)
            </h4>
            <p>
              Every fast neural prediction can be cross-checked on-demand against headless USGS MODFLOW 6 via automated Python FloPy workers, ensuring that fast machine learning never sacrifices scientific rigor.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-white/10 bg-surface-elevated/70 flex justify-end">
          <button 
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-linear-to-r from-primary to-cyan-400 text-deep shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            onClick={onClose}
          >
            Got it, Return to Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
