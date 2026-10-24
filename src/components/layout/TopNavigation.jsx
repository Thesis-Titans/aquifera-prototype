import React from 'react';
import { Home, Sliders, BarChart3, Camera, HelpCircle, ShieldCheck } from 'lucide-react';

export default function TopNavigation({
  activeTab = 'Home',
  onSelectTab,
  onOpenGuide,
  onCaptureScreenshot,
  onOpenVerification
}) {
  const navTabs = [
    { id: 'Home', label: 'Workspace', icon: Home },
    { id: 'Scenarios', label: 'Scenarios', icon: Sliders },
    { id: 'Results', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <header className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 z-30 shrink-0 select-none">
      {/* 1. Brand & Scientific Identity */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-cyan-500/30 bg-slate-900 shadow-sm">
          <img 
            src={`${import.meta.env.BASE_URL}aquifera-logo.png`} 
            alt="Aquifera Brandmark" 
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex items-baseline gap-2.5">
          <h1 className="text-base font-extrabold tracking-wider text-white">
            AQUIFERA
          </h1>
          <span className="hidden xl:inline text-xs text-slate-400 font-normal">
            Subsurface Compaction & Simulation Platform
          </span>
        </div>
      </div>

      {/* 2. Global Research Integrity Status Pill (Consolidated Nielsen Heuristic #1 & #8) */}
      <button
        onClick={onOpenVerification}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 hover:border-cyan-400/50 text-xs text-slate-300 transition-all cursor-pointer shadow-xs group"
        title="View Numerical Verification & Empirical Baseline Benchmarks"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_hsl(187,92%,48%)] group-hover:scale-125 transition-all" />
        <span className="font-semibold text-slate-200">Interactive Prototype</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Analytical Engine</span>
        <span className="text-slate-600">|</span>
        <span className="text-cyan-400 font-mono text-[11px] font-semibold flex items-center gap-1 group-hover:underline">
          <ShieldCheck size={13} /> Verification Benchmarks
        </span>
      </button>

      {/* 3. Navigation View Tabs & Action Tools */}
      <div className="flex items-center gap-3 lg:gap-4">
        <nav className="flex items-center gap-1 sm:gap-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab && onSelectTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-cyan-400' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCaptureScreenshot}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/60 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer"
            title="Capture High-Resolution PNG Snapshot of Active Viewport"
          >
            <Camera size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-700/60 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer"
            title="Open Research Guide & Hydrogeological Reference"
          >
            <HelpCircle size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* User Profile Avatar */}
          <div className="w-7 h-7 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 font-semibold text-[11px] flex items-center justify-center shadow-xs ml-1" title="Aquifera Research Profile">
            AQ
          </div>
        </div>
      </div>
    </header>
  );
}
