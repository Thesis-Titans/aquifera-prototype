import React from 'react';
import { Camera, Maximize, RotateCcw, BookOpen, Layers } from 'lucide-react';
import { SCENARIO_PRESETS } from '../data/scenarioPresets';

export default function TopNavigation({
  activePresetId,
  onSelectPreset,
  onResetParams,
  onCaptureScreenshot,
  onOpenGuide,
  isSidebarOpen,
  onToggleSidebar
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
      padding: '0 16px',
      zIndex: 30
    }}>
      {/* Brand & Project Metadata */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          width: '36px',
          height: '36px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <h1 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-main)' }}>
              AQUIFERA
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 6px' }}>
              SIMULATION
            </span>
          </div>
          <p className="nav-brand-subtitle" style={{ fontSize: '9.5px', color: 'var(--text-dim)', letterSpacing: '0.4px', fontWeight: 600 }}>
            SIMULATE • VERIFY • SUSTAIN
          </p>
        </div>
      </div>

      {/* Preset Scenarios for Presentation Defense (Horizontally scrollable on tablets) */}
      <div className="presets-scroll-container">
        {SCENARIO_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          const labelMap = {
            sustainable: '1. Sustainable',
            overextraction: '2. Crisis',
            recharge: '3. Recharge',
            catastrophic: '4. Drought'
          };
          const displayName = labelMap[preset.id] || preset.name.split('.')[1].trim();
          return (
            <button
              key={preset.id}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onSelectPreset(preset)}
              title={`${preset.name}\n${preset.description}`}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap'
              }}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Action Tools (Guide, Screenshot, Reset, Controls Toggle, Fullscreen) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenGuide}
          title="Open Hydrogeology & Architecture Guide"
        >
          <BookOpen size={14} color="var(--color-primary)" />
          <span className="btn-label-responsive">Guide</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onCaptureScreenshot}
          title="Capture clean PNG snapshot of the 3D scene for your presentation slides"
        >
          <Camera size={14} color="var(--color-primary)" />
          <span className="btn-label-responsive">Snapshot</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onResetParams}
          title="Reset simulation parameters to default baseline"
        >
          <RotateCcw size={14} />
          <span className="btn-label-responsive">Reset</span>
        </button>

        {/* Sidebar Drawer Toggle for Tablet / Mobile */}
        <button
          className={`btn btn-sm ${isSidebarOpen ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Close Controls Panel" : "Open Controls Panel"}
        >
          <Sliders size={14} />
          <span className="btn-label-responsive">Controls</span>
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
