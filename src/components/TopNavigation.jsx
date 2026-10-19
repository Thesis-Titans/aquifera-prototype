import React from 'react';
import { Camera, Maximize, RotateCcw, BookOpen, Sliders, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function TopNavigation({
  activeTab = 'Scenarios',
  onSelectTab,
  onOpenGuide,
  onCaptureScreenshot,
  onResetParams,
  isSidebarOpen,
  onToggleSidebar
}) {
  const navTabs = ['Home', 'Scenarios', 'Results', 'Reports', 'About'];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <header className="h-16 bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 flex items-center justify-between px-3 sm:px-6 z-30 shrink-0">
      {/* Brand & Slogan */}
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
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/20 text-primary border border-primary/40 shadow-xs">
              RESEARCH PROTOTYPE
            </span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-medium tracking-tight">
            Groundwater Insights for a Sustainable Tomorrow
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/10 backdrop-blur-md">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onSelectTab && onSelectTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Right Tools & User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="aquifera-tool-btn"
          onClick={onOpenGuide}
          title="Open Hydrogeology & Architecture Guide"
        >
          <BookOpen size={14} className="text-primary" />
          <span className="hidden xl:inline">Guide</span>
        </button>

        <button
          className="aquifera-tool-btn"
          onClick={onCaptureScreenshot}
          title="Capture clean PNG snapshot of the simulation"
        >
          <Camera size={14} className="text-primary" />
          <span className="hidden xl:inline">Snapshot</span>
        </button>

        <button
          className="aquifera-tool-btn"
          onClick={onResetParams}
          title="Reset simulation parameters to default baseline"
        >
          <RotateCcw size={14} />
          <span className="hidden xl:inline">Reset</span>
        </button>

        {/* Sidebar Toggle for Tablet / Mobile */}
        <button
          id="controls-toggle-btn"
          className={isSidebarOpen ? 'aquifera-tool-btn-active' : 'aquifera-tool-btn'}
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Collapse Parameters Panel" : "Expand Parameters Panel"}
        >
          <Sliders size={14} />
          <span className="hidden sm:inline">Scenario</span>
        </button>

        <button
          className="aquifera-tool-btn px-2.5!"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize size={14} />
        </button>

        {/* User Profile Avatar (MA - Mark Adrian) */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center shadow-md border border-cyan-300/40">
            MA
          </div>
          <ChevronDown size={14} className="text-slate-400 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
}
