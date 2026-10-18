import React from 'react';
import { X, BookOpen, Layers, Zap, Cpu, ShieldCheck } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(4, 9, 18, 0.82)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110
    }}>
      <div className="glass-panel" style={{
        width: '640px',
        maxWidth: '92vw',
        maxHeight: '85vh',
        background: 'hsl(222, 40%, 11%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Aquifera Technical & Hydrogeological Guide
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          
          <div>
            <h4 style={{ color: 'var(--color-primary)', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
              1. The Hydrogeological Problem
            </h4>
            <p>
              When municipal and industrial wells extract groundwater faster than natural recharge, piezometric heads drop. In multi-layer coastal deltas, this transfers the overburden weight from pore water onto the mineral soil skeleton.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-warning)', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
              2. Elastic vs. Inelastic Clay Compaction (Terzaghi Theory)
            </h4>
            <p>
              • <strong>Elastic Range (h ≥ 88.0 m):</strong> Soil skeleton acts like a stiff spring governed by S<sub>ske</sub> = 2.5 × 10⁻⁵ m⁻¹. Ground surface recovers elastically when pumping stops.<br />
              • <strong>Inelastic Collapse (h &lt; 88.0 m):</strong> Once drawdown breaches historical preconsolidation head (h<sub>pre</sub>), clay pores collapse permanently (S<sub>skv</sub> = 2.8 × 10⁻³ m⁻¹). Structural subsidence is irreversible.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-secondary)', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
              3. The Computing Breakthrough (PINO Surrogate)
            </h4>
            <p>
              Traditional numerical simulators (USGS MODFLOW 6) take 3 to 5 minutes per run, blocking real-time planning meetings. Aquifera trains a <strong>Physics-Informed Neural Operator (PINO)</strong> offline to approximate the governing flow and Terzaghi consolidation PDEs in <strong>under 250 milliseconds (~80,000× speedup)</strong>.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--color-success)', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
              4. Verification Architecture (Tier 4 Fallback)
            </h4>
            <p>
              Every fast neural prediction can be cross-checked on-demand against headless USGS MODFLOW 6 via automated Python FloPy workers, ensuring that fast machine learning never sacrifices scientific rigor.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Got it, Return to Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
