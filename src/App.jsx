import React, { useState, useMemo } from 'react';
import { Sliders } from 'lucide-react';
import TopNavigation from './components/TopNavigation';
import Aquifer3DCanvas from './components/Aquifer3DCanvas';
import ControlsPanel from './components/ControlsPanel';
import DualBenchmarkHUD from './components/DualBenchmarkHUD';
import VerificationModal from './components/VerificationModal';
import GuideModal from './components/GuideModal';
import { computeGroundwaterState, resetHysteresisState } from './physics/groundwaterPhysics';

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
    resetHysteresisState();
    setActivePresetId(preset.id);
    setParams({ ...preset.params });
  };

  // Reset to default
  const handleResetParams = () => {
    resetHysteresisState();
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
    <div className="w-screen h-screen flex flex-col bg-deep text-text-main font-sans overflow-hidden">
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
      <main className="flex-1 flex relative overflow-hidden">
        
        {/* Left/Center: Three.js 3D Stratified Viewport */}
        <div className="flex-1 relative h-full">
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
              className="sidebar-float-toggle flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-linear-to-r from-primary to-cyan-400 text-deep shadow-lg hover:shadow-cyan-500/25 transition-all"
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
