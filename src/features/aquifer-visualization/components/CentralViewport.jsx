import React, { useState } from 'react';
import { MapLibreMap } from '../../map';
import Aquifer3DCanvas from './Aquifer3DCanvas';
import { DualBenchmarkHUD } from '../../simulation';
import { Map, Box, AlertCircle } from 'lucide-react';

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

  const is3D = viewMode === '3D';

  return (
    <div className="relative flex-1 h-full w-full min-h-115 bg-[#050e18] rounded-xl border border-[#122336] overflow-hidden flex flex-col shadow-2xl">
      
      {/* 1. Viewport Top HUD Toolbar */}
      <div className="h-12 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        
        {/* Left: View Mode Segmented Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setViewMode('2D')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              !is3D
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Switch to 2D MapLibre Geographic Basemap"
          >
            <Map size={14} className={!is3D ? 'text-cyan-400' : 'text-slate-400'} />
            <span>2D GIS Map (MapLibre)</span>
          </button>

          <button
            onClick={() => setViewMode('3D')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              is3D
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title="Switch to 3D Stratified Geotechnical Subsurface View"
          >
            <Box size={14} className={is3D ? 'text-cyan-400' : 'text-slate-400'} />
            <span>3D Subsurface Cutaway</span>
          </button>
        </div>

        {/* Center: Persistent Research Prototype Disclaimer */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
          <AlertCircle size={13} className="text-amber-400 shrink-0" />
          <span>RESEARCH PROTOTYPE: Outputs are synthetic demonstration data (no validated live PINO / MODFLOW solver connected).</span>
        </div>

        {/* Right: Active Spatial Mode Status Tag */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] text-slate-300 font-sans font-semibold">
            {is3D ? 'Three.js WebGL (Stratified)' : 'MapLibre GL: WGS84 Web Mercator (Exports to PRS92 Zone 4)'}
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
