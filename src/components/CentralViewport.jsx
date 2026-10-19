import React, { useState } from 'react';
import { Map, Box, Plus, Minus, RotateCcw, Compass } from 'lucide-react';
import MetroIloilo2DMap from './MetroIloilo2DMap';
import Aquifer3DCanvas from './Aquifer3DCanvas';
import MapLayersOverlay from './MapLayersOverlay';

export default function CentralViewport({
  physicalState,
  onMoveWell,
  visualizationConfig,
  viewMode = '2D',
  setViewMode
}) {
  // Layer visibility state for MapLayersOverlay
  const [layers, setLayers] = useState({
    subsidence: true,
    groundwater: true,
    terrain3D: true,
    roads: true,
    rivers: true,
    subsurface: true
  });

  // Layer visibilities format for Aquifer3DCanvas compatibility
  const aquiferLayerVisibilities = {
    layer1: layers.subsurface,
    layer2: layers.subsurface,
    layer3: layers.subsurface
  };

  const handleSetAquiferLayers = (updater) => {
    // Keep in sync
  };

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Top Floating Viewport Control Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {/* Location & View Mode Status Badge */}
        <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">
            {viewMode === '2D' ? 'Metro Iloilo – 2D Map View' : 'Metro Iloilo – 3D View'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            10.72°N, 122.56°E
          </span>
        </div>

        {/* 2D Map ⇄ 3D View Toggle Pill */}
        <div className="flex items-center bg-slate-950/90 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
          <button
            onClick={() => setViewMode('2D')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === '2D'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Map size={13} />
            <span>2D Map</span>
          </button>

          <button
            onClick={() => setViewMode('3D')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === '3D'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            <Box size={13} />
            <span>3D View</span>
          </button>
        </div>
      </div>

      {/* Floating Layers Overlay (Top Right) */}
      <MapLayersOverlay
        layers={layers}
        setLayers={setLayers}
        is3D={viewMode === '3D'}
      />

      {/* Primary Display: 2D GIS Map or 3D Three.js Stratigraphic Scene */}
      <div className="relative flex-1 h-full w-full overflow-hidden">
        {viewMode === '2D' ? (
          <MetroIloilo2DMap
            physicalState={physicalState}
            layers={layers}
            visualizationConfig={visualizationConfig}
          />
        ) : (
          <Aquifer3DCanvas
            physicalState={physicalState}
            layerVisibilities={aquiferLayerVisibilities}
            setLayerVisibilities={handleSetAquiferLayers}
            onMoveWell={onMoveWell}
          />
        )}
      </div>
    </div>
  );
}
