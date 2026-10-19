import React, { useState, useMemo } from 'react';
import TopNavigation from './components/TopNavigation';
import ScenarioSetupPanel from './components/ScenarioSetupPanel';
import CentralViewport from './components/CentralViewport';
import BottomAnalyticsSuite from './components/BottomAnalyticsSuite';
import VerificationModal from './components/VerificationModal';
import GuideModal from './components/GuideModal';
import { computeGroundwaterState, resetHysteresisState } from './physics/groundwaterPhysics';

export default function App() {
  // Primary Hydrogeological Simulation Parameters (matching target prototype defaults)
  const [params, setParams] = useState({
    pumpingRate: 20000,          // Q = 20,000 m3/day
    hydraulicConductivity: 15,   // K = 15 m/day
    specificStorage: 0.0001,     // Ss = 0.0001 1/m
    rechargeRateMmYear: 150,     // R = 150 mm/year
    pumpingDays: 180,
    wellCount: 1,
    wellX: 0,
    wellY: 0
  });

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState('Scenarios');
  const [viewMode, setViewMode] = useState('2D'); // '2D' or '3D'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  // Visualization Controls State (Bottom Card 4)
  const [visualizationConfig, setVisualizationConfig] = useState({
    dataType: 'subsidence',
    timeSlice: '2050',
    opacity: 75,
    colorScale: 'jet'
  });

  // Modals
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Reactive physical state from PINO & Terzaghi solver
  const physicalState = useMemo(() => {
    return computeGroundwaterState(params);
  }, [params]);

  // Interactive Well Movement on 3D Surface
  const handleMoveWell = (wellMetersX, wellMetersY) => {
    setParams(prev => ({
      ...prev,
      wellX: Math.round(Math.max(-1400, Math.min(1400, wellMetersX))),
      wellY: Math.round(Math.max(-1400, Math.min(1400, wellMetersY)))
    }));
  };

  // Run Simulation trigger with subtle solving state
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 600);
  };

  // Reset to default baseline
  const handleResetParams = () => {
    resetHysteresisState();
    setParams({
      pumpingRate: 20000,
      hydraulicConductivity: 15,
      specificStorage: 0.0001,
      rechargeRateMmYear: 150,
      pumpingDays: 180,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    });
    setVisualizationConfig({
      dataType: 'subsidence',
      timeSlice: '2050',
      opacity: 75,
      colorScale: 'jet'
    });
  };

  // Screenshot capture for defense slides
  const handleCaptureScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `aquifera_dashboard_snapshot_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Screenshot capture failed', e);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-deep text-text-main font-sans overflow-hidden">
      {/* 1. Top Header Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
        onResetParams={handleResetParams}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* 2. Middle Interactive Stage (Left Sidebar + Central Viewport) */}
      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Left: Scenario Setup Panel Sidebar */}
        <ScenarioSetupPanel
          params={params}
          setParams={setParams}
          physicalState={physicalState}
          onRunSimulation={handleRunSimulation}
          isSimulating={isSimulating}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Central: Dual-Mode Viewport (2D Satellite GIS Map ⇄ 3D Terrain & Subsurface) */}
        <CentralViewport
          physicalState={physicalState}
          onMoveWell={handleMoveWell}
          visualizationConfig={visualizationConfig}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

      </main>

      {/* 3. Bottom Analytics Suite (4-Card Grid) */}
      <BottomAnalyticsSuite
        physicalState={physicalState}
        params={params}
        onOpenVerification={() => setIsVerificationOpen(true)}
        onResetView={() => {
          setViewMode('2D');
          setVisualizationConfig({
            dataType: 'subsidence',
            timeSlice: '2050',
            opacity: 75,
            colorScale: 'jet'
          });
        }}
        visualizationConfig={visualizationConfig}
        setVisualizationConfig={setVisualizationConfig}
      />

      {/* 4. Footer Bar */}
      <footer className="h-7 bg-slate-950 border-t border-white/5 px-4 flex items-center justify-between text-[10px] text-slate-500 font-medium shrink-0 z-20">
        <div>
          <span>AQUIFERA | Research Prototype v0.1 — Powered by Physics-Informed Neural Operator (PINO) Surrogate Modeling & Terzaghi 1D Consolidation.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400/80">● USGS MODFLOW 6 Benchmarked</span>
          <span>For academic & research planning purposes only</span>
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
