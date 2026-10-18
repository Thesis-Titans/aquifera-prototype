import React from 'react';
import { Camera, Maximize, RotateCcw, BookOpen, Layers } from 'lucide-react';
import { SCENARIO_PRESETS } from '../data/scenarioPresets';

export default function TopNavigation({
  activePresetId,
  onSelectPreset,
  onResetParams,
  onCaptureScreenshot,
  onOpenGuide
}) {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header style={{
      height: 'var(--nav-height)',
      background: 'var(--bg-surface)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 30
    }}>
      {/* Brand & Project Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1.5px solid var(--color-primary)',
          boxShadow: '0 0 14px var(--color-primary-glow)',
          background: '#040d1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <img 
            src="/aquifera-logo.png" 
            alt="Aquifera Brandmark" 
            style={{ 
              width: '130%', 
              height: '130%', 
              objectFit: 'cover',
              objectPosition: 'center 18%' 
            }} 
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-main)' }}>
              AQUIFERA
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '10px' }}>
              3D SIMULATION PLATFORM
            </span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.4px', fontWeight: 600 }}>
            SIMULATE • VERIFY • SUSTAIN
          </p>
        </div>
      </div>

      {/* Preset Scenarios for Presentation Defense */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.3px' }}>
          PRESETS:
        </span>

        {SCENARIO_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          const labelMap = {
            sustainable: '1. Sustainable',
            overextraction: '2. Crisis Pumping',
            recharge: '3. Managed Recharge',
            catastrophic: '4. Drought Shock'
          };
          const displayName = labelMap[preset.id] || preset.name.split('.')[1].trim();
          return (
            <button
              key={preset.id}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onSelectPreset(preset)}
              title={`${preset.name}\n${preset.description}`}
              style={{
                fontSize: '11.5px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Action Tools (Guide, Screenshot, Reset, Fullscreen) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenGuide}
          title="Open Hydrogeology & Architecture Guide"
        >
          <BookOpen size={14} color="var(--color-primary)" /> Guide
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onCaptureScreenshot}
          title="Capture clean PNG snapshot of the 3D scene for your presentation slides"
        >
          <Camera size={14} color="var(--color-primary)" /> Slide Snapshot
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onResetParams}
          title="Reset simulation parameters to default baseline"
        >
          <RotateCcw size={14} /> Reset
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Presentation Mode"
        >
          <Maximize size={14} />
        </button>
      </div>
    </header>
  );
}
