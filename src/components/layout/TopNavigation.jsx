import React from 'react';
import { Home, Sliders, BarChart3, Camera, HelpCircle, ChevronDown } from 'lucide-react';

export default function TopNavigation({
  activeTab = 'Home',
  onSelectTab,
  onOpenGuide,
  onCaptureScreenshot
}) {
  const navTabs = [
    { id: 'Home', label: 'Workspace', icon: Home },
    { id: 'Scenarios', label: 'Scenarios', icon: Sliders },
    { id: 'Results', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <header className="h-16 bg-[#06111e] border-b border-[#122336] flex items-center justify-between px-6 z-30 shrink-0">
      {/* Brand & Slogan */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-cyan-500/30">
          <img 
            src={`${import.meta.env.BASE_URL}aquifera-logo.png`} 
            alt="Aquifera Brandmark" 
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-extrabold tracking-wider text-white">
            AQUIFERA
          </h1>
          <span className="hidden sm:inline text-xs text-slate-300 font-normal tracking-wide">
            Subsurface Compaction & Scenario Exploration
          </span>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <nav className="flex items-center gap-6">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`relative flex items-center gap-2 py-5 text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Action Tools & User Profile */}
      <div className="flex items-center gap-3">
        {/* Export Snapshot Action */}
        <button
          onClick={onCaptureScreenshot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-white transition-all shadow-xs cursor-pointer"
          title="Capture High-Resolution PNG Snapshot of Active Viewport"
        >
          <Camera size={14} className="text-cyan-400" />
          <span className="hidden md:inline">Snapshot</span>
        </button>

        {/* Research Guide Modal Trigger */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-white transition-all shadow-xs cursor-pointer"
          title="Open Capstone Research Guide & Architecture Reference"
        >
          <HelpCircle size={14} className="text-cyan-400" />
          <span className="hidden md:inline">Guide</span>
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 font-semibold text-xs flex items-center justify-center shadow-md">
            CICT
          </div>
        </div>
      </div>
    </header>
  );
}
