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
  const [activeTab, setActiveTab] = useState('Home');
  const [viewMode, setViewMode] = useState('2D'); // '2D' or '3D'
  const [isSimulating, setIsSimulating] = useState(false);

  // Visualization Controls State (Bottom Card 4)
  const [visualizationConfig, setVisualizationConfig] = useState({
    dataType: 'subsidence',
    timeSlice: '2050',
    opacity: 70,
    colorScale: 'Standard'
  });

  // Modals
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Reactive physical state from PINO & Terzaghi solver
  const physicalState = useMemo(() => {
    return computeGroundwaterState(params);
  }, [params]);

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
      opacity: 70,
      colorScale: 'Standard'
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
    <div className="w-full min-h-screen flex flex-col bg-[#050e18] text-slate-100 font-sans overflow-x-hidden select-none">
      {/* 1. Top Header Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
      />

      {/* 2. Middle Interactive Stage (Left Sidebar + Central Viewport) */}
      <main className="flex-1 flex gap-4 px-4 pt-3 pb-2 min-h-[540px] max-w-[1920px] w-full mx-auto overflow-hidden">
        
        {/* Left: Scenario Setup Panel Sidebar */}
        <ScenarioSetupPanel
          params={params}
          setParams={setParams}
          onRunSimulation={handleRunSimulation}
          isSimulating={isSimulating}
        />

        {/* Central: Dual-Mode Viewport (2D Satellite GIS Map ⇄ 3D Terrain & Subsurface) */}
        <CentralViewport
          physicalState={physicalState}
          params={params}
          visualizationConfig={visualizationConfig}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

      </main>

      {/* 3. Bottom Analytics Suite (4-Card Grid) */}
      <div className="px-4 pb-2 max-w-[1920px] w-full mx-auto shrink-0">
        <BottomAnalyticsSuite
          physicalState={physicalState}
          params={params}
          onOpenVerification={() => setIsVerificationOpen(true)}
          onResetView={() => {
            setViewMode('2D');
            setVisualizationConfig({
              dataType: 'subsidence',
              timeSlice: '2050',
              opacity: 70,
              colorScale: 'Standard'
            });
          }}
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
          <span>Research Prototype</span>
          <span className="font-mono text-slate-400">v0.1</span>
        </div>
        <div className="text-[11px] text-slate-400 font-normal">
          Note: This is a research prototype. Results are based on model simulations and are not a substitute for field validation.
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
