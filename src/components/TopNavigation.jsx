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
    <header className="h-16 bg-[#070d18]/95 backdrop-blur-2xl border-b border-white/15 flex items-center justify-between px-6 z-30 shrink-0">
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/70 shadow-[0_0_14px_rgba(34,211,238,0.35)] bg-[#040d1a] flex items-center justify-center shrink-0">
          <img 
            src="/aquifera-logo.png" 
            alt="Aquifera Brandmark" 
            className="w-[130%] h-[130%] object-cover object-[center_18%]"
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-white">
              AQUIFERA
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/40 shadow-xs">
              SIMULATION
            </span>
          </div>
          <p className="nav-brand-subtitle text-[10px] text-slate-400 tracking-widest font-semibold">
            SIMULATE • VERIFY • SUSTAIN
          </p>
        </div>
      </div>

      {/* Preset Scenarios for Presentation Defense (Horizontally scrollable on tablets) */}
      <div className="presets-scroll-container flex items-center gap-2 overflow-x-auto max-w-[48vw] p-1.5 rounded-2xl border border-white/20 bg-[#070e1b] shadow-inner">
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
              className={isActive ? 'aquifera-preset-btn-active' : 'aquifera-preset-btn'}
              onClick={() => onSelectPreset(preset)}
              title={`${preset.name}\n${preset.description}`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Action Tools (Guide, Screenshot, Reset, Controls Toggle, Fullscreen) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          className="aquifera-tool-btn"
          onClick={onOpenGuide}
          title="Open Hydrogeology & Architecture Guide"
        >
          <BookOpen size={16} className="text-primary" />
          <span className="hidden lg:inline">Guide</span>
        </button>

        <button
          className="aquifera-tool-btn"
          onClick={onCaptureScreenshot}
          title="Capture clean PNG snapshot of the 3D scene for your presentation slides"
        >
          <Camera size={16} className="text-primary" />
          <span className="hidden lg:inline">Snapshot</span>
        </button>

        <button
          className="aquifera-tool-btn"
          onClick={onResetParams}
          title="Reset simulation parameters to default baseline"
        >
          <RotateCcw size={16} />
          <span className="hidden lg:inline">Reset</span>
        </button>

        {/* Sidebar Drawer Toggle (Responsive Controls button for Desktop & Tablet) */}
        <button
          id="controls-toggle-btn"
          className={isSidebarOpen ? 'aquifera-tool-btn-active' : 'aquifera-tool-btn'}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Collapse Parameters Panel" : "Expand Parameters Panel"}
        >
          <Sliders size={16} />
          <span>Controls</span>
        </button>

        <button
          className="aquifera-tool-btn p-2.5"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Presentation Mode"
        >
          <Maximize size={16} />
        </button>
      </div>
    </header>
  );
}
