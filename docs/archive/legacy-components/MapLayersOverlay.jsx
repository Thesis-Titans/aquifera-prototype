import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export default function MapLayersOverlay({
  layers,
  setLayers,
  is3D
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLayer = (key) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-64 bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden transition-all">
      {/* Header */}
      <div 
        onClick={() => setIsCollapsed(prev => !prev)}
        className="flex items-center justify-between p-3 border-b border-white/5 bg-slate-900/60 cursor-pointer select-none hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-primary" />
          <span className="text-xs font-bold text-white tracking-wide">Layers</span>
        </div>
        {isCollapsed ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
      </div>

      {!isCollapsed && (
        <div className="p-3 flex flex-col gap-2.5 text-xs">
          
          {/* Layer 1: Land Subsidence */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={layers.subsidence}
                onChange={() => toggleLayer('subsidence')}
                className="rounded accent-cyan-400 cursor-pointer"
              />
              <span className="font-semibold text-slate-200">Land Subsidence</span>
            </label>

            {/* Subsidence Heatmap Legend */}
            {layers.subsidence && (
              <div className="pl-6 flex flex-col gap-1">
                <div className="w-full h-2 rounded-sm bg-linear-to-r from-blue-500 via-emerald-400 via-amber-400 to-rose-600 border border-white/10 shadow-xs" />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>&lt; 0.02m</span>
                  <span>0.15m</span>
                  <span>&gt; 0.30m</span>
                </div>
              </div>
            )}
          </div>

          {/* Layer 2: Groundwater Level */}
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
            <input
              type="checkbox"
              checked={layers.groundwater}
              onChange={() => toggleLayer('groundwater')}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span className="font-medium text-slate-300">Groundwater Level (Head)</span>
          </label>

          {/* Layer 3: 3D Terrain */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={layers.terrain3D}
              onChange={() => toggleLayer('terrain3D')}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span className="font-medium text-slate-300">
              3D Terrain Elevation (2×)
            </span>
          </label>

          {/* Layer 4: Roads & Boundaries */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={layers.roads}
              onChange={() => toggleLayer('roads')}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span className="font-medium text-slate-300">Roads & Boundaries</span>
          </label>

          {/* Layer 5: Rivers & Water Bodies */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={layers.rivers}
              onChange={() => toggleLayer('rivers')}
              className="rounded accent-cyan-400 cursor-pointer"
            />
            <span className="font-medium text-slate-300">Rivers & Estuary (Iloilo)</span>
          </label>

          {/* Layer 6: Subsurface Strata (in 3D) */}
          {is3D && (
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1 border-t border-white/5">
              <input
                type="checkbox"
                checked={layers.subsurface}
                onChange={() => toggleLayer('subsurface')}
                className="rounded accent-cyan-400 cursor-pointer"
              />
              <span className="font-medium text-cyan-300">Subterranean Strata (-200m)</span>
            </label>
          )}

        </div>
      )}
    </div>
  );
}
