import React, { useState } from 'react';

export default function CentralViewport({
  visualizationConfig,
  viewMode = '2D',
  setViewMode
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const is3D = viewMode === '3D';

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.max(1, Math.min(2.2, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Switch between 2D Subsidence, 2D Insights (with 3D Terrain layer), and 3D Simulation
  const mapImageSrc = is3D
    ? `${import.meta.env.BASE_URL}assets/maps/metro_iloilo_3d_simulation.png`
    : `${import.meta.env.BASE_URL}assets/maps/metro_iloilo_2d_subsidence.png`;

  const opacityFilter = (visualizationConfig?.opacity || 70) / 70;

  return (
    <div className="relative flex-1 h-full w-full bg-[#050e18] overflow-hidden select-none">
      
      {/* Map Graphic with Interactive Zoom & Pan */}
      <div 
        className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <img
          src={mapImageSrc}
          alt={is3D ? "Metro Iloilo 3D Simulation" : "Metro Iloilo 2D Subsidence Map"}
          className="w-full h-full object-cover pointer-events-none"
          style={{
            filter: `brightness(${0.88 + opacityFilter * 0.12}) contrast(${0.92 + opacityFilter * 0.08})`
          }}
        />
      </div>

      {/* Interactive Hit-Targets mapped directly to the visual controls on the map */}
      
      {/* 1. Top-Right Mode Switcher: [ 2D Map ] [ 3D View ] */}
      <div className="absolute top-2.5 right-3 z-30 flex items-center gap-1">
        {/* 2D Map Hitbox */}
        <button
          onClick={() => setViewMode('2D')}
          className="w-20 h-9 rounded-lg cursor-pointer transition-opacity opacity-0 hover:opacity-20 hover:bg-white"
          title="Switch to 2D Map View"
        />
        {/* 3D View Hitbox */}
        <button
          onClick={() => setViewMode('3D')}
          className="w-20 h-9 rounded-lg cursor-pointer transition-opacity opacity-0 hover:opacity-20 hover:bg-white"
          title="Switch to 3D Simulation View"
        />
      </div>

      {/* 2. Top-Left Badge: Click to toggle 2D / 3D */}
      <div 
        onClick={() => setViewMode(is3D ? '2D' : '3D')}
        className="absolute top-2.5 left-3 w-56 h-12 rounded-xl z-30 cursor-pointer opacity-0 hover:opacity-10 hover:bg-white transition-opacity"
        title="Toggle Map Perspective"
      />

      {/* 3. Layers Panel: Click on 3D Terrain row to toggle 3D */}
      <div 
        onClick={() => setViewMode(is3D ? '2D' : '3D')}
        className="absolute top-48 right-3 w-56 h-7 rounded z-30 cursor-pointer opacity-0 hover:opacity-20 hover:bg-white transition-opacity"
        title="Toggle 3D Terrain Layer"
      />

      {/* 4. Zoom Controls on Right Edge */}
      <div className="absolute bottom-16 right-3 z-30 flex flex-col gap-1 w-8">
        {/* Zoom In */}
        <button
          onClick={() => handleZoom(0.2)}
          className="w-8 h-8 rounded-lg cursor-pointer opacity-0 hover:opacity-20 hover:bg-white transition-opacity"
          title="Zoom In"
        />
        {/* Zoom Out */}
        <button
          onClick={() => handleZoom(-0.2)}
          className="w-8 h-8 rounded-lg cursor-pointer opacity-0 hover:opacity-20 hover:bg-white transition-opacity"
          title="Zoom Out"
        />
        {/* Re-center */}
        <button
          onClick={handleResetZoom}
          className="w-8 h-8 rounded-lg cursor-pointer opacity-0 hover:opacity-20 hover:bg-white transition-opacity"
          title="Reset Zoom"
        />
        {/* 2D / 3D toggle */}
        <button
          onClick={() => setViewMode(is3D ? '2D' : '3D')}
          className="w-8 h-8 rounded-lg cursor-pointer opacity-0 hover:opacity-20 hover:bg-white transition-opacity"
          title="Toggle 2D / 3D"
        />
      </div>

    </div>
  );
}
