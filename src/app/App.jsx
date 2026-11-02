import React, { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { TopNavigation } from '../components/layout';
import { ScenarioSetupPanel, useScenarioState } from '../features/scenarios';
import { CentralViewport } from '../features/aquifer-visualization';
import { BottomAnalyticsSuite } from '../features/analytics';
import { VerificationModal } from '../features/verification';
import { GuideModal } from '../components/ui';
import { DefenseTourCard } from '../features/simulation';

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
    resetToBaseline,
    selectedEngineId,
    setSelectedEngineId,
    perturbSurrogate,
    setPerturbSurrogate,
    togglePerturbation
  } = useScenarioState();

  // UI Navigation & View State
  const [activeTab, setActiveTab] = useState('Home');
  const [viewMode, setViewMode] = useState('2D'); // '2D' (MapLibre), '3D' (Three.js), or 'split'
  const [isAnalyticsCollapsed, setIsAnalyticsCollapsed] = useState(true); // Default to zero-scroll collapsed dock

  // Visualization Controls State
  const DEFAULT_VIZ = { dataType: 'subsidence', opacity: 75, colorScale: 'standard' };
  const [visualizationConfig, setVisualizationConfig] = useState(DEFAULT_VIZ);

  // Modals & Guided Walkthroughs
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDefenseTourOpen, setIsDefenseTourOpen] = useState(false);
  const [defenseTourStep, setDefenseTourStep] = useState(0);

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

  // Navigation tab selection with viewport coordination
  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'Results') {
      setIsAnalyticsCollapsed(false);
    } else if (tabId === 'Home') {
      setIsAnalyticsCollapsed(true);
    }
  };

  return (
    <div className="w-full h-dvh max-h-dvh flex flex-col bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* 1. Top Header Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onCaptureScreenshot={handleCaptureScreenshot}
        onOpenVerification={() => setIsVerificationOpen(true)}
        onStartDefenseTour={() => setIsDefenseTourOpen(true)}
      />

      {/* 1.1 Synthetic Numerical Benchmark Disclaimer Banner (CICT-UGR-F001 §2 Line 144) */}
      <aside aria-label="Research Scope Disclaimer" className="h-7 bg-slate-900/90 border-b border-cyan-500/20 px-4 flex items-center justify-between text-xs text-slate-300 shrink-0 z-20 select-none">
        <div className="flex items-center gap-2 max-w-5xl truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
          <span className="text-[11px] leading-tight truncate">
            <strong className="text-cyan-300 font-semibold">Research Benchmark Scope:</strong> Spatial overlays represent a controlled synthetic numerical benchmark (PRS92 Zone 4, EPSG:3124) anchored to Metro Iloilo for scenario planning simulation.
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-3 shrink-0 text-[10px] text-slate-400 font-mono">
          <span>PRS92 Zone 4</span>
          <span className="text-slate-600">•</span>
          <span>Copernicus DEM 30m</span>
          <span className="text-slate-600">•</span>
          <span>MODFLOW 6 CSUB Baseline</span>
        </div>
      </aside>

      {/* 2. Middle Interactive Workstation Core (Zero-Scroll Budgeted Stage + Bottom Dock) */}
      <div className="flex-1 min-h-0 flex flex-col w-full max-w-[1920px] mx-auto px-3.5 py-1.5 gap-2 overflow-hidden">
        
        {/* Main Stage: Left Scenario Sidebar + Center Dual Viewport */}
        <main className="flex-1 min-h-0 flex flex-row gap-3 overflow-hidden">
          <ScenarioSetupPanel
            params={params}
            setParams={setParams}
            onCaptureScenario={captureScenarioForComparison}
            hasUncapturedChanges={hasUncapturedChanges}
            capturedScenario={capturedScenario}
            activePreset={activePreset}
            onSelectPreset={applyPreset}
          />

          <CentralViewport
            physicalState={physicalState}
            capturedScenario={capturedScenario}
            params={params}
            visualizationConfig={visualizationConfig}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onMoveWell={(x, y) => setParams(prev => ({ ...prev, wellX: Math.round(x), wellY: Math.round(y) }))}
            onOpenVerification={() => setIsVerificationOpen(true)}
            selectedEngineId={selectedEngineId}
            onSelectEngine={setSelectedEngineId}
            perturbSurrogate={perturbSurrogate}
            onTogglePerturbation={togglePerturbation}
          />
        </main>

        {/* Bottom Telemetry & Analytics Suite (Dockable Ribbon / Expandable Suite) */}
        <div className="shrink-0 transition-all duration-200">
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
            isCollapsed={isAnalyticsCollapsed}
            onToggleCollapse={setIsAnalyticsCollapsed}
          />
        </div>
      </div>

      {/* 4. Footer Bar */}
      <footer className="h-7 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 font-normal shrink-0 z-20">
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
        selectedEngineId={selectedEngineId}
        onSelectEngine={setSelectedEngineId}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Guided 3-Step Defense Tour Walkthrough Card */}
      <DefenseTourCard
        isOpen={isDefenseTourOpen}
        onClose={() => setIsDefenseTourOpen(false)}
        currentStepIndex={defenseTourStep}
        onSelectStep={setDefenseTourStep}
        applyPreset={applyPreset}
        setSelectedEngineId={setSelectedEngineId}
        setPerturbSurrogate={setPerturbSurrogate}
        setViewMode={setViewMode}
        onOpenVerification={() => setIsVerificationOpen(true)}
        physicalState={physicalState}
      />
    </div>
  );
}
