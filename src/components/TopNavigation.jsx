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
    <header className="h-16 bg-slate-950/95 backdrop-blur-2xl border-b border-white/15 flex items-center justify-between px-3 sm:px-6 z-30 shrink-0">
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/70 shadow-[0_0_14px_rgba(34,211,238,0.35)] bg-slate-950 flex items-center justify-center shrink-0">
          <img 
            src={`${import.meta.env.BASE_URL}aquifera-logo.png`} 
            alt="Aquifera Brandmark" 
            className="w-[130%] h-[130%] object-cover object-[center_18%]"
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-white shrink-0">
              AQUIFERA
            </h1>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/40 shadow-xs">
              SIMULATION
            </span>
          </div>
          <p className="nav-brand-subtitle text-[10px] text-slate-400 tracking-widest font-semibold">
            SIMULATE • VERIFY • SUSTAIN
          </p>
        </div>
      </div>

      {/* Preset Scenarios for Presentation Defense */}
      <div className="flex items-center justify-center min-w-0 max-w-[55vw]">
        <div className="presets-scroll-container flex items-center gap-1 p-1 rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/10 shadow-inner overflow-x-auto no-scrollbar">
          {SCENARIO_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            const labelMap = {
              sustainable: { num: '1.', short: 'Safe', full: 'Safe (Elastic)' },
              overextraction: { num: '2.', short: 'Crisis', full: 'Crisis (Mandurriao)' },
              recharge: { num: '3.', short: 'Recharge', full: 'Recharge (MAR)' },
              catastrophic: { num: '4.', short: 'Drought', full: 'Drought Shock' }
            };
            const meta = labelMap[preset.id] || { num: '', short: preset.name, full: preset.name };
            return (
              <button
                key={preset.id}
                className={isActive ? 'aquifera-preset-btn-active shrink-0' : 'aquifera-preset-btn shrink-0'}
                onClick={() => onSelectPreset(preset)}
                title={`${preset.name}\n${preset.description}`}
              >
                <span className={`font-mono mr-1.5 font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>{meta.num}</span>
                <span className="inline xl:hidden">{meta.short}</span>
                <span className="hidden xl:inline">{meta.full}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Tools (Guide, Screenshot, Reset, Controls Toggle, Fullscreen) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="aquifera-tool-btn"
          onClick={onOpenGuide}
          title="Open Hydrogeology & Architecture Guide"
        >
          <BookOpen size={15} className="text-primary" />
          <span className="hidden lg:inline">Guide</span>
        </button>

        <button
          className="aquifera-tool-btn"
          onClick={onCaptureScreenshot}
          title="Capture clean PNG snapshot of the 3D scene for your presentation slides"
        >
          <Camera size={15} className="text-primary" />
          <span className="hidden lg:inline">Snapshot</span>
        </button>

        <button
          className="aquifera-tool-btn"
          onClick={onResetParams}
          title="Reset simulation parameters to default baseline"
        >
          <RotateCcw size={15} />
          <span className="hidden lg:inline">Reset</span>
        </button>

        {/* Sidebar Drawer Toggle (Responsive Controls button for Desktop & Tablet) */}
        <button
          id="controls-toggle-btn"
          className={isSidebarOpen ? 'aquifera-tool-btn-active' : 'aquifera-tool-btn'}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Collapse Parameters Panel" : "Expand Parameters Panel"}
        >
          <Sliders size={15} />
          <span>Controls</span>
        </button>

        <button
          className="aquifera-tool-btn px-2.5!"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Presentation Mode"
        >
          <Maximize size={15} />
        </button>
      </div>
    </header>
  );
}
