import React from 'react';
import { Camera, Maximize, RotateCcw, BookOpen, Sliders } from 'lucide-react';
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
    <header className="h-15 bg-surface/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-30 shrink-0">
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/70 shadow-[0_0_12px_rgba(34,211,238,0.3)] bg-[#040d1a] flex items-center justify-center shrink-0">
          <img 
            src="/aquifera-logo.png" 
            alt="Aquifera Brandmark" 
            className="w-[130%] h-[130%] object-cover object-[center_18%]"
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-extrabold tracking-tight text-white">
              AQUIFERA
            </h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-primary/15 text-primary border border-primary/30">
              SIMULATION
            </span>
          </div>
          <p className="nav-brand-subtitle text-[9.5px] text-text-dim tracking-widest font-semibold">
            SIMULATE • VERIFY • SUSTAIN
          </p>
        </div>
      </div>

      {/* Preset Scenarios for Presentation Defense (Horizontally scrollable on tablets) */}
      <div className="presets-scroll-container flex items-center gap-1.5 overflow-x-auto max-w-[46vw] py-1 px-1 rounded-lg border border-white/5 bg-deep/40">
        {SCENARIO_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          const labelMap = {
            sustainable: '1. Sustainable',
            overextraction: '2. Crisis',
            recharge: '3. Recharge',
            catastrophic: '4. Drought'
          };
          const displayName = labelMap[preset.id] || preset.name.split('.')[1]?.trim() || preset.name;
          return (
            <button
              key={preset.id}
              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive 
                  ? 'bg-linear-to-r from-primary to-cyan-400 text-deep font-semibold shadow-md shadow-cyan-500/25 scale-[1.02]' 
                  : 'bg-white/5 hover:bg-white/10 text-text-muted hover:text-white border border-white/5'
              }`}
              onClick={() => onSelectPreset(preset)}
              title={`${preset.name}\n${preset.description}`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Action Tools (Guide, Screenshot, Reset, Controls Toggle, Fullscreen) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated/80 hover:bg-white/10 text-text-main border border-white/10 hover:border-primary/50 transition-all cursor-pointer active:scale-95"
          onClick={onOpenGuide}
          title="Open Hydrogeology & Architecture Guide"
        >
          <BookOpen size={14} className="text-primary" />
          <span className="hidden lg:inline">Guide</span>
        </button>

        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated/80 hover:bg-white/10 text-text-main border border-white/10 hover:border-primary/50 transition-all cursor-pointer active:scale-95"
          onClick={onCaptureScreenshot}
          title="Capture clean PNG snapshot of the 3D scene for your presentation slides"
        >
          <Camera size={14} className="text-primary" />
          <span className="hidden lg:inline">Snapshot</span>
        </button>

        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-elevated/80 hover:bg-white/10 text-text-main border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95"
          onClick={onResetParams}
          title="Reset simulation parameters to default baseline"
        >
          <RotateCcw size={14} />
          <span className="hidden lg:inline">Reset</span>
        </button>

        {/* Sidebar Drawer Toggle (Responsive Controls button for Desktop & Tablet) */}
        <button
          id="controls-toggle-btn"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-95 ${
            isSidebarOpen 
              ? 'bg-linear-to-r from-primary to-cyan-400 text-deep font-semibold shadow-md shadow-cyan-500/25' 
              : 'bg-surface-elevated/90 hover:bg-white/10 text-text-main border border-white/10 hover:border-primary/50'
          }`}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Collapse Parameters Panel" : "Expand Parameters Panel"}
        >
          <Sliders size={14} />
          <span>Controls</span>
        </button>

        <button
          className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-medium bg-surface-elevated/80 hover:bg-white/10 text-text-main border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Presentation Mode"
        >
          <Maximize size={14} />
        </button>
      </div>
    </header>
  );
}
