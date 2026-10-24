import React, { useState } from 'react';
import { TopNavigation } from '../components/layout';
import { ScenarioSetupPanel, useScenarioState } from '../features/scenarios';
import { CentralViewport } from '../features/aquifer-visualization';
import { BottomAnalyticsSuite } from '../features/analytics';
import { VerificationModal } from '../features/verification';
import { GuideModal } from '../components/ui';

export default function App() {
  // Hydrogeological Scenario and Physics Engine State
  const {
    params,
    setParams,
    setParam,
    physicalState,
    capturedScenario,
    hasUncapturedChanges,
    captureScenarioForComparison,
    activePreset,
    applyPreset,
    resetToBaseline
  } = useScenarioState();

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState('Home');
  const [viewMode, setViewMode] = useState('2D'); // '2D' (MapLibre) or '3D' (Three.js)

  // Visualization Controls State
  const DEFAULT_VIZ = { dataType: 'subsidence', opacity: 75, colorScale: 'standard' };
  const [visualizationConfig, setVisualizationConfig] = useState(DEFAULT_VIZ);

  // Modals
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Reset to default baseline
  const handleResetParams = () => {
    resetToBaseline();
    setVisualizationConfig(DEFAULT_VIZ);
  };

  // Screenshot capture for defense slides
  const handleCaptureScreenshot = () => {
    // Select canvas from the currently active visible viewport pane
    const activePane = document.querySelector(`[data-viewport-pane="${viewMode}"]`);
    let targetCanvas = activePane?.querySelector('canvas');

    if (!targetCanvas) {
      const canvases = document.querySelectorAll('canvas');
      if (!canvases || canvases.length === 0) {
        alert('No active WebGL canvas detected for snapshot export.');
        return;
      }
      let maxArea = 0;
      canvases.forEach(c => {
        const area = c.width * c.height;
        if (area > maxArea) {
          maxArea = area;
          targetCanvas = c;
        }
      });
    }

    try {
      const dataUrl = targetCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `aquifera_${viewMode.toLowerCase()}_snapshot_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Screenshot export failed:', e);
    }
  };

  // Navigation tab selection with smooth viewport scrolling
  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'Scenarios') {
      const el = document.getElementById('scenario-setup-panel');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'Results') {
      const el = document.getElementById('bottom-analytics-suite');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tabId === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* 1. Top Header Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
        onOpenVerification={() => setIsVerificationOpen(true)}
      />

      {/* 2. Middle Interactive Stage (Left Sidebar + Central Dual Viewport) */}
      <main className="h-[calc(100dvh-9rem)] min-h-115 flex flex-col md:flex-row gap-4 px-4 pt-3 pb-2 max-w-[1920px] w-full mx-auto">
        
        {/* Left: Scenario Setup Panel Sidebar */}
        <ScenarioSetupPanel
          params={params}
          setParams={setParams}
          onCaptureScenario={captureScenarioForComparison}
          hasUncapturedChanges={hasUncapturedChanges}
          capturedScenario={capturedScenario}
          activePreset={activePreset}
          onSelectPreset={applyPreset}
        />

        {/* Central: Dual-Mode Viewport (2D MapLibre GIS ⇄ 3D Three.js Subsurface) */}
        <CentralViewport
          physicalState={physicalState}
          params={params}
          visualizationConfig={visualizationConfig}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onMoveWell={(x, y) => setParams(prev => ({ ...prev, wellX: Math.round(x), wellY: Math.round(y) }))}
          onOpenVerification={() => setIsVerificationOpen(true)}
        />

      </main>

      {/* 3. Bottom Analytics Suite (4-Card Analytical Grid) */}
      <div className="px-4 pb-2 max-w-[1920px] w-full mx-auto shrink-0">
        <BottomAnalyticsSuite
          physicalState={physicalState}
          params={params}
          capturedScenario={capturedScenario}
          hasUncapturedChanges={hasUncapturedChanges}
          onOpenVerification={() => setIsVerificationOpen(true)}
          onSetParam={setParam}
          onResetScenario={handleResetParams}
          visualizationConfig={visualizationConfig}
          setVisualizationConfig={setVisualizationConfig}
          is3D={viewMode === '3D'}
        />
      </div>

      {/* 4. Footer Bar */}
      <footer className="h-8 bg-slate-950 border-t border-slate-800/80 px-6 flex items-center justify-between text-[11px] text-slate-400 font-normal shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-wider">AQUIFERA</span>
          <span className="text-slate-600">|</span>
          <span>BSIT Thesis Prototype</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-cyan-400">MapLibre GL + Three.js Engine</span>
        </div>
        <div className="text-[11px] text-slate-400 font-normal hidden sm:block">
          Outputs: Analytical preview (Theis + Terzaghi); USGS MODFLOW 6 CSUB pilot run (2026-10-23) is numerical reference only.
        </div>
      </footer>

      {/* Modals */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        physicalState={physicalState}
        params={params}
        capturedScenario={capturedScenario}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
