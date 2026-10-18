import React from 'react';
import { 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Droplet, 
  Clock, 
  ShieldAlert, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';
import { DOMAIN, HYDRO_PARAMS } from '../physics/groundwaterPhysics';

export default function ControlsPanel({ 
  params, 
  setParams, 
  physicalState, 
  layerVisibilities, 
  setLayerVisibilities,
  onOpenVerification
}) {
  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const toggleLayer = (id) => {
    setLayerVisibilities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="glass-panel" style={{
      width: 'var(--sidebar-width)',
      height: 'calc(100vh - var(--nav-height) - 32px)',
      margin: '16px 16px 16px 0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 20
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--color-primary)" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.2px' }}>
            Simulation Controls
          </h2>
        </div>
        <span className="badge badge-primary">Interactive</span>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Dynamic Critical State Alert Box */}
        {physicalState.isPreconsolidationBreached ? (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--border-danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-danger-glow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <AlertTriangle size={18} color="var(--color-danger)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-danger)', letterSpacing: '0.2px' }}>
                PRECONSOLIDATION BREACHED
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(350, 80%, 85%)', lineHeight: 1.4, marginBottom: '8px' }}>
              Head dropped to <strong className="mono-val">{physicalState.minHead} m</strong> (threshold: <strong className="mono-val">85.0 m</strong>). Pore pressure collapsed. Clay compaction is now <strong>irreversible</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingTop: '6px', borderTop: '1px solid hsla(350, 80%, 40%, 0.3)' }}>
              <span style={{ color: 'hsl(350, 70%, 80%)' }}>Inelastic Damage:</span>
              <span className="mono-val" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>
                {physicalState.inelasticPercent}% Permanent
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-success-bg)',
            border: '1px solid hsla(158, 85%, 44%, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle2 size={18} color="var(--color-success)" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-success)' }}>
                Elastic Equilibrium Maintained
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Head ({physicalState.minHead} m) ≥ 85.0 m. Surface rebound is 100% reversible.
              </div>
            </div>
          </div>
        )}

        {/* Real-time Physical Indicators Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div className="glass-panel" style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Max Subsidence (ΔZ)
            </span>
            <span className="mono-val" style={{
              fontSize: '20px',
              fontWeight: 700,
              color: physicalState.maxSubsidenceCm > 15 ? 'var(--color-danger)' : 'var(--color-primary)'
            }}>
              {physicalState.maxSubsidenceCm} <span style={{ fontSize: '12px', fontWeight: 500 }}>cm</span>
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Lowest Aquifer Head
            </span>
            <span className="mono-val" style={{
              fontSize: '20px',
              fontWeight: 700,
              color: physicalState.isPreconsolidationBreached ? 'var(--color-danger)' : 'var(--color-secondary)'
            }}>
              {physicalState.minHead} <span style={{ fontSize: '12px', fontWeight: 500 }}>m</span>
            </span>
          </div>
        </div>

        {/* Input Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Pumping Rate Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplet size={14} color="var(--color-primary)" /> Pumping Discharge (Q)
              </span>
              <span className="mono-val" style={{ color: 'var(--color-primary)', fontSize: '13px' }}>
                {params.pumpingRate} m³/day
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={params.pumpingRate}
              onChange={(e) => updateParam('pumpingRate', Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>
              <span>0 (Idle)</span>
              <span>1,200 (Municipal)</span>
              <span>2,500 (Heavy)</span>
            </div>
          </div>

          {/* Pumping Duration Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--color-secondary)" /> Stress Duration (t)
              </span>
              <span className="mono-val" style={{ color: 'var(--color-secondary)', fontSize: '13px' }}>
                {params.pumpingDays} days
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="365"
              step="5"
              value={params.pumpingDays}
              onChange={(e) => updateParam('pumpingDays', Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>
              <span>10 days</span>
              <span>180 days (Seasonal)</span>
              <span>365 days</span>
            </div>
          </div>

          {/* Infiltration Recharge Rate Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplet size={14} color="var(--color-success)" /> Surface Recharge (R)
              </span>
              <span className="mono-val" style={{ color: 'var(--color-success)', fontSize: '13px' }}>
                {params.rechargeRateMmDay} mm/day
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5.0"
              step="0.1"
              value={params.rechargeRateMmDay}
              onChange={(e) => updateParam('rechargeRateMmDay', Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '3px' }}>
              <span>0 (Drought)</span>
              <span>2.5 (Normal)</span>
              <span>5.0 (Wet / MAR)</span>
            </div>
          </div>

          {/* Well Configuration Selection */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Well Cluster:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn btn-sm ${params.wellCount === 1 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateParam('wellCount', 1)}
              >
                1 Well (Single)
              </button>
              <button
                className={`btn btn-sm ${params.wellCount === 2 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateParam('wellCount', 2)}
              >
                2 Wells (Cluster)
              </button>
            </div>
          </div>

        </div>

        {/* Stratigraphy Layer Inspection Toggles */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
            <Layers size={13} /> Geological Strata (Three.js)
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DOMAIN.layers.map(layer => (
              <div 
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: layerVisibilities[layer.id] ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: '1px solid',
                  borderColor: layerVisibilities[layer.id] ? 'var(--border-subtle)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  opacity: layerVisibilities[layer.id] ? 1 : 0.5,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: layer.color }} />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>{layer.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Depth: {layer.top}m – {layer.bottom}m ({layer.thickness}m)</div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: layerVisibilities[layer.id] ? 'var(--color-primary)' : 'var(--text-dim)' }}>
                  {layerVisibilities[layer.id] ? 'Visible' : 'Hidden'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Verification CTA Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface-elevated)'
      }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '10px' }}
          onClick={onOpenVerification}
        >
          <Cpu size={16} /> Verify with USGS MODFLOW 6
        </button>
      </div>

    </aside>
  );
}
