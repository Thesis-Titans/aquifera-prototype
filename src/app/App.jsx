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
    physicalState,
    isSimulating,
    activePreset,
    applyPreset,
    runDemonstration,
    resetToBaseline
  } = useScenarioState();

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState('Home');
  const [viewMode, setViewMode] = useState('2D'); // '2D' (MapLibre) or '3D' (Three.js)

  // Visualization Controls State
  const [visualizationConfig, setVisualizationConfig] = useState({
    dataType: 'subsidence',
    timeSlice: '2050',
    opacity: 75,
    colorScale: 'Standard'
  });

  // Modals
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Reset to default baseline
  const handleResetParams = () => {
    resetToBaseline();
    setVisualizationConfig({
      dataType: 'subsidence',
      timeSlice: '2050',
      opacity: 75,
      colorScale: 'Standard'
    });
  };

  // Screenshot capture for defense slides
  const handleCaptureScreenshot = () => {
    // Look for canvas inside the active viewport
    const canvases = document.querySelectorAll('canvas');
    if (!canvases || canvases.length === 0) {
      alert('No active WebGL canvas detected for snapshot export.');
      return;
    }
    
    // Choose the largest canvas (main viewport)
    let targetCanvas = canvases[0];
    let maxArea = 0;
    canvases.forEach(c => {
      const area = c.width * c.height;
      if (area > maxArea) {
        maxArea = area;
        targetCanvas = c;
      }
    });

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
    <div className="w-full min-h-screen flex flex-col bg-[#070d17] text-slate-100 font-sans">
      {/* 1. Top Header Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
      />

      {/* 2. Middle Interactive Stage (Left Sidebar + Central Dual Viewport) */}
      <main className="flex-1 flex flex-col md:flex-row gap-4 px-4 pt-3 pb-2 min-h-130 max-w-[1920px] w-full mx-auto">
        
        {/* Left: Scenario Setup Panel Sidebar */}
        <ScenarioSetupPanel
          params={params}
          setParams={setParams}
          onRunSimulation={runDemonstration}
          isSimulating={isSimulating}
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
        />

      </main>

      {/* 3. Bottom Analytics Suite (4-Card Analytical Grid) */}
      <div className="px-4 pb-2 max-w-[1920px] w-full mx-auto shrink-0">
        <BottomAnalyticsSuite
          physicalState={physicalState}
          params={params}
          onOpenVerification={() => setIsVerificationOpen(true)}
          onResetView={handleResetParams}
          visualizationConfig={visualizationConfig}
          setVisualizationConfig={setVisualizationConfig}
          is3D={viewMode === '3D'}
        />
      </div>

      {/* 4. Footer Bar */}
      <footer className="h-8 bg-[#040b13] border-t border-[#0e1d2c] px-6 flex items-center justify-between text-[11px] text-slate-400 font-normal shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-wider">AQUIFERA</span>
          <span className="text-slate-500">|</span>
          <span>Research Prototype v0.2</span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-cyan-400">MapLibre + Three.js Engine</span>
        </div>
        <div className="text-[11px] text-slate-400 font-normal">
          Note: This is a research demonstration prototype. Outputs are synthetic demonstration data for capstone defense.
        </div>
      </footer>

      {/* Modals */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        physicalState={physicalState}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
