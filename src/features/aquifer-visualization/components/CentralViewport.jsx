import React, { useState } from 'react';
import { MapLibreMap } from '../../map';
import Aquifer3DCanvas from './Aquifer3DCanvas';
import { DualBenchmarkHUD } from '../../simulation';
import { Map, Box, Compass } from 'lucide-react';

export default function CentralViewport({
  physicalState,
  params,
  visualizationConfig,
  viewMode = '2D',
  setViewMode,
  onSelectDistrict,
  onMoveWell
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
  const is3D = viewMode === '3D';

  return (
    <div className="relative flex-1 h-full w-full min-h-0 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
      
      {/* 1. Viewport Top HUD Toolbar */}
      <div className="h-12 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between gap-3 shrink-0 z-20 select-none">
        
        {/* Left: View Mode Segmented Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-xs">
          <button
            onClick={() => setViewMode('2D')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              !is3D
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Switch to 2D MapLibre Geographic Basemap"
          >
            <Map size={14} className={!is3D ? 'text-cyan-400' : 'text-slate-400'} />
            <span>2D GIS Map (MapLibre)</span>
          </button>

          <button
            onClick={() => setViewMode('3D')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              is3D
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Switch to 3D Stratified Geotechnical Subsurface View"
          >
            <Box size={14} className={is3D ? 'text-cyan-400' : 'text-slate-400'} />
            <span>3D Subsurface Cutaway</span>
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

        {/* Right: Active Spatial Projection Tag & Research Disclaimer */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900 border border-slate-800 text-slate-400 hidden xl:inline-block">
            Analytical Preview (Theis + Terzaghi)
          </span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse" />
          <span className="text-[11px] text-slate-300 font-sans font-medium hidden sm:inline">
            {is3D ? 'WebGL Three.js (Stratified)' : 'EPSG:3124 / EPSG:3857'}
          </span>
        </div>
      </div>

      {/* 2. Interactive Viewport Stage (2D MapLibre or 3D Three.js persistent panes) */}
      <div className="relative flex-1 min-h-0 w-full h-full overflow-hidden">
        <div
          data-viewport-pane="2D"
          aria-hidden={is3D}
          className={`absolute inset-0 ${is3D ? 'hidden' : 'block'}`}
        >
          <MapLibreMap
            physicalState={physicalState}
            params={params}
            visualizationConfig={visualizationConfig}
            onSelectDistrict={onSelectDistrict}
            onMoveWell={onMoveWell}
            onCursorMove={setCursorCoords}
          />
        </div>

        <div
          data-viewport-pane="3D"
          aria-hidden={!is3D}
          className={`absolute inset-0 ${is3D ? 'block' : 'hidden'}`}
        >
          <Aquifer3DCanvas
            physicalState={physicalState}
            visualizationConfig={visualizationConfig}
            layerVisibilities={layerVisibilities}
            setLayerVisibilities={setLayerVisibilities}
            onMoveWell={onMoveWell}
          />
        </div>

        {/* 3. Dual-Engine Benchmark Target HUD Overlay */}
        <DualBenchmarkHUD physicalState={physicalState} />
      </div>

    </div>
  );
}
