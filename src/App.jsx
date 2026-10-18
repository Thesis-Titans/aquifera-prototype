import React, { useState, useMemo } from 'react';
import { Sliders } from 'lucide-react';
import TopNavigation from './components/TopNavigation';
import Aquifer3DCanvas from './components/Aquifer3DCanvas';
import ControlsPanel from './components/ControlsPanel';
import DualBenchmarkHUD from './components/DualBenchmarkHUD';
import VerificationModal from './components/VerificationModal';
import GuideModal from './components/GuideModal';
import { computeGroundwaterState } from './physics/groundwaterPhysics';
import { SCENARIO_PRESETS } from './data/scenarioPresets';

export default function App() {
  // Primary Hydrogeological Simulation Parameters
  const [params, setParams] = useState({
    pumpingRate: 1200,
    pumpingDays: 180,
    rechargeRateMmDay: 1.5,
    wellCount: 1,
    wellX: 0,
    wellY: 0
  });

  const [activePresetId, setActivePresetId] = useState('custom');

  // Layer Visibility State
  const [layerVisibilities, setLayerVisibilities] = useState({
    layer1: true,
    layer2: true,
    layer3: true
  });

  // Modal State
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Responsive Sidebar State (for Tablet / iPad 11th Gen)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Compute physical state reactively (< 5ms calculation)
  const physicalState = useMemo(() => {
    return computeGroundwaterState(params);
  }, [params]);

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setParams({ ...preset.params });
  };

  // Reset to default
  const handleResetParams = () => {
    setActivePresetId('custom');
    setParams({
      pumpingRate: 1200,
      pumpingDays: 180,
      rechargeRateMmDay: 1.5,
      wellCount: 1,
      wellX: 0,
      wellY: 0
    });
  };

  // Screenshot capture for defense slides
  const handleCaptureScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `aquifera_3d_defense_slide_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Screenshot capture failed', e);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>
      {/* Top Header Navigation */}
      <TopNavigation
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        onResetParams={handleResetParams}
        onCaptureScreenshot={handleCaptureScreenshot}
        onOpenGuide={() => setIsGuideOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* Main Interactive Stage */}
      <main style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        
        {/* Left/Center: Three.js 3D Stratified Viewport */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <Aquifer3DCanvas
            physicalState={physicalState}
            layerVisibilities={layerVisibilities}
            setLayerVisibilities={setLayerVisibilities}
          />

          {/* Floating Dual-Engine Benchmark HUD */}
          <DualBenchmarkHUD physicalState={physicalState} />

          {/* Floating Tablet Toggle Button when sidebar drawer is closed */}
          {!isSidebarOpen && (
            <button
              className="btn btn-primary btn-sm sidebar-float-toggle"
              onClick={() => setIsSidebarOpen(true)}
              title="Open Parameters Drawer"
            >
              <Sliders size={14} /> Parameters
            </button>
          )}
        </div>

        {/* Backdrop for tablet/mobile when sidebar drawer is open */}
        {isSidebarOpen && (
          <div 
            className="sidebar-backdrop" 
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true" 
          />
        )}

        {/* Right: Hydrogeological Simulation Controls Sidebar */}
        <ControlsPanel
          params={params}
          setParams={(newP) => {
            setActivePresetId('custom');
            setParams(newP);
          }}
          physicalState={physicalState}
          layerVisibilities={layerVisibilities}
          setLayerVisibilities={setLayerVisibilities}
          onOpenVerification={() => setIsVerificationOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </main>

      {/* Asynchronous MODFLOW 6 Numerical Verification Modal */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        physicalState={physicalState}
      />

      {/* Hydrogeology & PINO System Architecture Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
