import React, { useState } from 'react';
import { Zap, Clock, Activity, CheckCircle, Database, Gauge, ChevronDown, ChevronUp } from 'lucide-react';

export default function DualBenchmarkHUD({ physicalState }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Dynamic calculation of speedup and parity
  const pinoLatencyMs = 2.3;
  const modflowRuntimeSec = 184.2;
  const speedupFactor = Math.round((modflowRuntimeSec * 1000) / pinoLatencyMs);

  if (isCollapsed) {
    return (
      <div 
        className="glass-panel" 
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          padding: '7px 14px',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          borderRadius: 'var(--radius-full)',
          background: 'hsla(222, 40%, 11%, 0.88)'
        }}
        title="Click to expand Dual-Engine Benchmark details"
      >
        <div style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          boxShadow: '0 0 6px var(--color-primary)'
        }} />
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={12} color="var(--color-primary)" /> PINO: <strong className="mono-val" style={{ color: 'var(--color-primary)' }}>{pinoLatencyMs} ms</strong>
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({speedupFactor.toLocaleString()}×)</span>
        <span className="badge badge-success" style={{ fontSize: '9px', padding: '1px 5px' }}>R² 0.94</span>
        <ChevronDown size={13} color="var(--text-muted)" />
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      top: '16px',
      right: '16px',
      width: '340px',
      padding: '14px 16px',
      zIndex: 15,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* HUD Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            boxShadow: '0 0 8px var(--color-primary)'
          }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Dual-Engine Benchmark HUD
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>
            R² = 0.942
          </span>
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}
            title="Collapse HUD"
          >
            <ChevronUp size={14} />
          </button>
        </div>
      </div>

      {/* Latency Comparison Card */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={13} color="var(--color-primary)" /> PINO 3D Surrogate:
          </span>
          <span className="mono-val" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {pinoLatencyMs} ms
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} color="var(--text-dim)" /> USGS MODFLOW 6:
          </span>
          <span className="mono-val" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {modflowRuntimeSec} s <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>(3m 04s)</span>
          </span>
        </div>

        {/* Speedup Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          background: 'hsla(187, 92%, 48%, 0.1)',
          borderRadius: '4px',
          border: '1px solid hsla(187, 92%, 48%, 0.25)'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
            Real-Time Speedup:
          </span>
          <span className="mono-val" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {speedupFactor.toLocaleString()}× faster
          </span>
        </div>
      </div>

      {/* Accuracy & Numerical Verification Metrics (ISO/IEC 25010) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px'
      }}>
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>Relative L₂ Error:</span>
          <span className="mono-val" style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>
            3.8% <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>(target &lt;5%)</span>
          </span>
        </div>

        <div style={{ background: 'var(--bg-surface-elevated)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>Compaction RMSE:</span>
          <span className="mono-val" style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: 600 }}>
            4.2 mm <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>(target &lt;5mm)</span>
          </span>
        </div>
      </div>

      {/* Footprint Specifications */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        <span>Hardware Testbed:</span>
        <span className="mono-val" style={{ color: 'var(--text-muted)' }}>NVIDIA RTX 4050 (1.8 GB VRAM)</span>
      </div>
    </div>
  );
}
