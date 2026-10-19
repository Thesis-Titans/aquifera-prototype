import React from 'react';
import { Home, Sliders, BarChart3, FileText, Info, ChevronDown } from 'lucide-react';

export default function TopNavigation({
  activeTab = 'Home',
  onSelectTab,
  onOpenGuide,
  onCaptureScreenshot
}) {
  const navTabs = [
    { id: 'Home', label: 'Home', icon: Home },
    { id: 'Scenarios', label: 'Scenarios', icon: Sliders },
    { id: 'Results', label: 'Results', icon: BarChart3 },
    { id: 'Reports', label: 'Reports', icon: FileText },
    { id: 'About', label: 'About', icon: Info },
  ];

  return (
    <header className="h-16 bg-[#06111e] border-b border-[#122336] flex items-center justify-between px-6 z-30 shrink-0 select-none">
      {/* Brand & Slogan */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0">
          <img 
            src={`${import.meta.env.BASE_URL}aquifera-logo.png`} 
            alt="Aquifera Brandmark" 
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex items-baseline gap-4">
          <h1 className="text-xl font-extrabold tracking-wider text-white">
            AQUIFERA
          </h1>
          <span className="text-xs text-slate-300 font-normal tracking-wide">
            Groundwater Insights for a Sustainable Tomorrow
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-6">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'Reports') {
                  onCaptureScreenshot && onCaptureScreenshot();
                } else if (tab.id === 'About') {
                  onOpenGuide && onOpenGuide();
                } else {
                  onSelectTab && onSelectTab(tab.id);
                }
              }}
              className={`relative flex items-center gap-2 py-5 text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#0ea5e9]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0ea5e9] shadow-[0_0_8px_#0ea5e9]" />
              )}
            </button>
          );
        })}

        {/* User Profile Avatar */}
        <div className="flex items-center gap-1.5 pl-4 ml-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-[#132d4a] border border-[#224d77] text-white font-semibold text-xs flex items-center justify-center shadow-md">
            MA
          </div>
          <ChevronDown size={14} className="text-slate-400 hover:text-white transition-colors" />
        </div>
      </nav>
    </header>
  );
}
