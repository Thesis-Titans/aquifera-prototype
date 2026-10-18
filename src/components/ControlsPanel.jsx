import React, { useState } from 'react';
import { 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Droplet, 
  Clock, 
  HelpCircle,
  Cpu, 
  RotateCcw
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
  const [activeTooltip, setActiveTooltip] = useState(null);

  const updateParam = (key, value) => {
    // Clamp to valid numeric boundaries (NN/g Error Prevention)
    let val = Number(value);
    if (isNaN(val)) val = 0;
    if (key === 'pumpingRate') val = Math.max(0, Math.min(3000, val));
    if (key === 'pumpingDays') val = Math.max(1, Math.min(730, val));
    if (key === 'rechargeRateMmDay') val = Math.max(0, Math.min(10.0, val));
    setParams(prev => ({ ...prev, [key]: val }));
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
            Scenario Parameters
          </h2>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '10px' }}>
          Real-Time
        </span>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Dynamic Critical State Alert (NN/g: Clear Feedback & Actionable Remedy) */}
        {physicalState.isPreconsolidationBreached ? (
          <div style={{
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--border-danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            boxShadow: 'var(--shadow-danger-glow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} color="var(--color-danger)" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', letterSpacing: '0.2px' }}>
                  PRECONSOLIDATION BREACHED
                </span>
              </div>
              <span className="mono-val" style={{ fontSize: '10px', color: 'var(--color-danger)', fontWeight: 700 }}>
                {physicalState.inelasticPercent}% Permanent
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(350, 80%, 90%)', lineHeight: 1.35, marginBottom: '6px' }}>
              Head dropped to <strong className="mono-val">{physicalState.minHead} m</strong> (threshold: 88.0 m). Clay matrix collapsed.
            </p>
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.3)', 
              padding: '4px 8px', 
              borderRadius: '4px', 
              fontSize: '10px', 
              color: 'hsl(350, 75%, 92%)' 
            }}>
              <strong>Remedy:</strong> Reduce Q ≤ 1,400 m³/d or increase R ≥ 2.5 mm/d.
            </div>
          </div>
        ) : (
          <div style={{
            background: 'var(--color-success-bg)',
            border: '1px solid hsla(158, 85%, 44%, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-success)' }}>
                Elastic Range Maintained
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Head ({physicalState.minHead} m) ≥ 88.0 m. Subsidence is 100% reversible.
              </div>
            </div>
          </div>
        )}

        {/* Primary Readout Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div className="glass-panel" style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Max Settlement (Δz)
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
              Lowest Aquifer Head (h)
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

        {/* Parameter Sliders with Direct Numeric Inputs (NN/g Heuristic #7) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Pumping Rate Control */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplet size={14} color="var(--color-primary)" /> Pumping Discharge (Q)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'Q' ? null : 'Q')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                  title="Click for parameter definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>
              
              {/* Dual Direct Input Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max="3000"
                  step="50"
                  value={params.pumpingRate}
                  onChange={(e) => updateParam('pumpingRate', e.target.value)}
                  className="mono-val"
                  style={{
                    width: '64px',
                    padding: '2px 6px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    textAlign: 'right'
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>m³/d</span>
              </div>
            </div>

            {activeTooltip === 'Q' && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px', lineHeight: 1.35 }}>
                Volumetric pumping extraction rate from deep municipal and industrial production wells.
              </div>
            )}

            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={params.pumpingRate}
              onChange={(e) => updateParam('pumpingRate', e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
              <span>0 (Idle)</span>
              <span>1,200 (Municipal)</span>
              <span>2,500 (Heavy)</span>
            </div>
          </div>

          {/* Stress Period Duration Control */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--color-secondary)" /> Stress Duration (t)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 't' ? null : 't')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                  title="Click for parameter definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="10"
                  max="730"
                  step="5"
                  value={params.pumpingDays}
                  onChange={(e) => updateParam('pumpingDays', e.target.value)}
                  className="mono-val"
                  style={{
                    width: '64px',
                    padding: '2px 6px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--color-secondary)',
                    fontSize: '12px',
                    textAlign: 'right'
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>days</span>
              </div>
            </div>

            {activeTooltip === 't' && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px', lineHeight: 1.35 }}>
                Duration of continuous groundwater withdrawal before seasonal rest or aquifer recovery.
              </div>
            )}

            <input
              type="range"
              min="10"
              max="365"
              step="5"
              value={params.pumpingDays}
              onChange={(e) => updateParam('pumpingDays', e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
              <span>10 days</span>
              <span>180 days (Seasonal)</span>
              <span>365 days (1 yr)</span>
            </div>
          </div>

          {/* Infiltration Recharge Rate Control */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplet size={14} color="var(--color-success)" /> Surface Recharge (R)
                <button 
                  onClick={() => setActiveTooltip(activeTooltip === 'R' ? null : 'R')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                  title="Click for parameter definition"
                >
                  <HelpCircle size={12} />
                </button>
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="0"
                  max="10.0"
                  step="0.1"
                  value={params.rechargeRateMmDay}
                  onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
                  className="mono-val"
                  style={{
                    width: '64px',
                    padding: '2px 6px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--color-success)',
                    fontSize: '12px',
                    textAlign: 'right'
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>mm/d</span>
              </div>
            </div>

            {activeTooltip === 'R' && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px', lineHeight: 1.35 }}>
                Net surface precipitation percolation and artificial recharge basins replenishing the water table.
              </div>
            )}

            <input
              type="range"
              min="0"
              max="5.0"
              step="0.1"
              value={params.rechargeRateMmDay}
              onChange={(e) => updateParam('rechargeRateMmDay', e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
              <span>0 (Drought)</span>
              <span>2.5 (Normal)</span>
              <span>5.0 (Managed)</span>
            </div>
          </div>

          {/* Well Configuration Cluster Toggle */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Well Distribution:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`btn btn-sm ${params.wellCount === 1 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateParam('wellCount', 1)}
              >
                Single Well
              </button>
              <button
                className={`btn btn-sm ${params.wellCount === 2 ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => updateParam('wellCount', 2)}
              >
                2-Well Cluster
              </button>
            </div>
          </div>

        </div>

        {/* Stratigraphy Layer Inspector (Compact 3-Pill Toggle) */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
            <Layers size={13} /> Geological Strata Visibility
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {DOMAIN.layers.map(layer => {
              const isVis = layerVisibilities[layer.id];
              const shortNames = {
                layer1: 'Sand (0-30m)',
                layer2: 'Clay (30-60m)',
                layer3: 'Aquifer (60-120m)'
              };
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`btn btn-sm ${isVis ? 'btn-secondary' : ''}`}
                  style={{
                    padding: '6px 4px',
                    fontSize: '10.5px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    border: '1px solid',
                    borderColor: isVis ? layer.color : 'var(--border-subtle)',
                    opacity: isVis ? 1 : 0.4,
                    background: isVis ? 'var(--bg-surface-elevated)' : 'transparent'
                  }}
                  title={`${layer.name} (${layer.thickness} m)`}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: layer.color }} />
                  <span style={{ fontSize: '10px', fontWeight: 600, color: isVis ? 'var(--text-main)' : 'var(--text-dim)' }}>
                    {shortNames[layer.id] || layer.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Verification Action Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface-elevated)'
      }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '10px', fontWeight: 600 }}
          onClick={onOpenVerification}
        >
          <Cpu size={16} /> Run USGS MODFLOW 6 Verification
        </button>
      </div>

    </aside>
  );
}
