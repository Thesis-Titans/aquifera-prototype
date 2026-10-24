import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { MapLibreMap } from '../../map';
import { DualBenchmarkHUD } from '../../simulation';
import { Map, Box, Columns2, Compass, ShieldAlert } from 'lucide-react';

const Aquifer3DCanvas = lazy(() => import('./Aquifer3DCanvas'));

const SPLIT_MIN_PX = 960;

export default function CentralViewport({
  physicalState,
  params,
  visualizationConfig,
  viewMode = '2D',
  setViewMode,
  onSelectDistrict,
  onMoveWell,
  onOpenVerification,
  selectedEngineId = 'analytical',
  onSelectEngine,
  perturbSurrogate = false,
  onTogglePerturbation
}) {
  const [layerVisibilities, setLayerVisibilities] = useState({
    layer1: true,
    layer2: true,
    layer3: true,
    layer4: true,
    layer5: true,
    subsidenceOverlay: true
  });

  const [cursorCoords, setCursorCoords] = useState(null);
  const stageRef = useRef(null);
  const [stageWidth, setStageWidth] = useState(1200);

  // Measure stage width for responsive split screen capability
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setStageWidth(entry.contentRect.width);
      }
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  const canSplit = stageWidth >= SPLIT_MIN_PX;
  const effectiveMode = (viewMode === 'split' && canSplit) ? 'split' : (viewMode === 'split' ? '2D' : viewMode);
  const isSplit = effectiveMode === 'split';
  const is2DOnly = effectiveMode === '2D';
  const is3DOnly = effectiveMode === '3D';
  const isFallbackEngaged = physicalState?.meta?.fallbackEngaged || false;

  return (
    <div className="relative flex-1 h-full w-full min-h-0 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
      
      {/* 1. Viewport Top HUD Toolbar */}
      <div className="h-12 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 z-20 select-none">
        
        {/* Left: View Mode Segmented Controls (2D | 3D | Split) */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-xs">
          <button
            id="view-toggle-2d"
            onClick={() => setViewMode('2D')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              is2DOnly
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Switch to full 2D MapLibre Geographic Basemap"
          >
            <Map size={14} className={is2DOnly ? 'text-cyan-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">2D GIS Map</span>
            <span className="sm:hidden">2D</span>
          </button>

          <button
            id="view-toggle-3d"
            onClick={() => setViewMode('3D')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              is3DOnly
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Switch to full 3D Stratified Geotechnical Subsurface Cutaway"
          >
            <Box size={14} className={is3DOnly ? 'text-cyan-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">3D Cutaway</span>
            <span className="sm:hidden">3D</span>
          </button>

          <button
            id="view-toggle-split"
            onClick={() => canSplit && setViewMode('split')}
            disabled={!canSplit}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              !canSplit
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : isSplit
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs cursor-pointer'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 cursor-pointer'
            }`}
            title={canSplit ? "Side-by-side synchronized 2D GIS Basemap and 3D Geological Cutaway" : `Stage width (${Math.round(stageWidth)}px) < 960px required for split view`}
          >
            <Columns2 size={14} className={isSplit ? 'text-cyan-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">Split View (2D | 3D)</span>
            <span className="sm:hidden">Split</span>
          </button>
        </div>

        {/* Center: Live Geodetic Coordinate Readout (Task S2.3) */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-300 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Compass size={14} />
            <span className="text-[11px] font-semibold text-slate-400">CRS: PRS92 Zone 4</span>
          </div>
          <span className="text-slate-600">|</span>
          {cursorCoords ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span>E: <strong className="text-white font-mono">{cursorCoords.easting.toLocaleString()} m</strong></span>
              <span>N: <strong className="text-white font-mono">{cursorCoords.northing.toLocaleString()} m</strong></span>
              <span className="text-slate-500">({cursorCoords.lat.toFixed(4)}°N, {cursorCoords.lng.toFixed(4)}°E)</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-normal">Hover canvas for geodetic readout</span>
          )}
        </div>

        {/* Right: Active Spatial Projection Tag & Mode Info */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-300 hidden xl:inline-block">
            {physicalState?.meta?.engineName || 'Theis + Terzaghi (Analytical)'}
          </span>
          <span className={`w-2 h-2 rounded-full ${isFallbackEngaged ? 'bg-amber-400 animate-ping' : 'bg-cyan-400 animate-pulse'} shadow-[0_0_8px_hsl(187,92%,48%)]`} />
          <span className="text-[11px] text-slate-300 font-sans font-medium hidden sm:inline">
            {isSplit ? '2D MapLibre + 3D Three.js' : is3DOnly ? 'WebGL Three.js (Stratified)' : 'EPSG:3124 / EPSG:3857'}
          </span>
        </div>
      </div>

      {/* 2. Interactive Viewport Stage (2D MapLibre, 3D Three.js, or Split Synchronized Panes) */}
      <div ref={stageRef} className="relative flex-1 min-h-0 w-full h-full overflow-hidden">
        
        {/* Automated NIST AI RMF 1.0 Fallback Alert Banner */}
        {isFallbackEngaged && (
          <div className="absolute top-3 left-4 z-25 max-w-md bg-amber-950/95 border border-amber-500/50 backdrop-blur-xl px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <ShieldAlert size={18} className="text-amber-400 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <span className="font-bold text-amber-200 block text-xs">NIST AI RMF 1.0 Fallback Engaged</span>
                <span className="text-amber-300/80 text-[10px] truncate block">
                  Surrogate residual trust metric breached tolerance (τ = 0.15). Reverted to USGS MODFLOW 6 CSUB.
                </span>
              </div>
            </div>
            {onOpenVerification && (
              <button
                onClick={onOpenVerification}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-semibold transition-all shrink-0 cursor-pointer"
              >
                Inspect
              </button>
            )}
          </div>
        )}

        {/* 2D MapLibre GIS Basemap Pane */}
        <div
          data-viewport-pane="2D"
          aria-hidden={is3DOnly}
          className={`absolute ${
            isSplit
              ? 'inset-y-0 left-0 w-1/2 border-r border-slate-800 z-10 pointer-events-auto'
              : is2DOnly
              ? 'inset-0 block z-10 pointer-events-auto'
              : 'inset-0 hidden pointer-events-none'
          }`}
        >
          <MapLibreMap
            physicalState={physicalState}
            params={params}
            visualizationConfig={visualizationConfig}
            onSelectDistrict={onSelectDistrict}
            onMoveWell={onMoveWell}
            onCursorMove={setCursorCoords}
            compact={isSplit}
          />
        </div>

        {/* 3D Three.js Subsurface Cutaway Pane (Lazy-Loaded) */}
        <div
          data-viewport-pane="3D"
          aria-hidden={is2DOnly}
          className={`absolute ${
            isSplit
              ? 'inset-y-0 right-0 w-1/2 z-10 pointer-events-auto'
              : is3DOnly
              ? 'inset-0 block z-10 pointer-events-auto'
              : 'inset-0 hidden pointer-events-none'
          }`}
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400 text-xs font-mono">
                <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                <span>Initializing WebGL Stratigraphic Subsurface Engine...</span>
              </div>
            }
          >
            <Aquifer3DCanvas
              physicalState={physicalState}
              visualizationConfig={visualizationConfig}
              layerVisibilities={layerVisibilities}
              setLayerVisibilities={setLayerVisibilities}
              onMoveWell={onMoveWell}
              compact={isSplit}
            />
          </Suspense>
        </div>

        {/* 3. Multi-Engine Benchmark & Residual Trust HUD Overlay */}
        <DualBenchmarkHUD
          physicalState={physicalState}
          selectedEngineId={selectedEngineId}
          onSelectEngine={onSelectEngine}
          perturbSurrogate={perturbSurrogate}
          onTogglePerturbation={onTogglePerturbation}
        />
      </div>

    </div>
  );
}
