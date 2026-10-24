import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Map, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Navigation, ZoomIn, ZoomOut, RotateCcw, Layers, Loader2, AlertTriangle, X, Sliders } from 'lucide-react';
import {
  QUANTITIES,
  DOMAIN_BOUNDS,
  buildGridGeoJSON,
  domainOutlineGeoJSON,
  fillColorExpression,
  cssGradient,
  describeNode,
  metersToLngLat
} from '../../../physics/fields';

// Configure MapLibre background worker for Vite environment
if (typeof window !== 'undefined' && setWorkerUrl) {
  const base = import.meta.env.BASE_URL || '/';
  const workerPath = `${base.endsWith('/') ? base : base + '/'}maplibre-gl-worker.mjs`;
  const fullUrl = new URL(workerPath, window.location.origin).href;
  setWorkerUrl(fullUrl);
}

// Dual GIS Basemap Style Definition: ESRI Dark Canvas & ESRI World Imagery (No API key required)
const GIS_BASEMAP_STYLE = {
  version: 8,
  sources: {
    'esri-dark-base': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>, HERE, Garmin, FAO, NOAA, USGS, OpenStreetMap'
    },
    'esri-satellite-base': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.esri.com" target="_blank" rel="noreferrer">Esri</a>, Maxar, Earthstar Geographics'
    },
    'esri-dark-reference': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256
    }
  },
  layers: [
    {
      id: 'gis-background',
      type: 'background',
      paint: {
        'background-color': '#060e18'
      }
    },
    {
      id: 'esri-dark-base-layer',
      type: 'raster',
      source: 'esri-dark-base',
      minzoom: 0,
      maxzoom: 16,
      layout: { visibility: 'visible' }
    },
    {
      id: 'esri-satellite-base-layer',
      type: 'raster',
      source: 'esri-satellite-base',
      minzoom: 0,
      maxzoom: 18,
      layout: { visibility: 'none' }
    }
  ]
};

const DOMAIN_LNGLAT_BOUNDS = [[DOMAIN_BOUNDS.west, DOMAIN_BOUNDS.south], [DOMAIN_BOUNDS.east, DOMAIN_BOUNDS.north]];
const FIT_OPTIONS = { padding: { top: 70, bottom: 40, left: 40, right: 70 }, pitch: 20, bearing: 0 };

function wellsGeoJSON(physicalState) {
  return {
    type: 'FeatureCollection',
    features: (physicalState?.wells || []).map((w, k) => ({
      type: 'Feature',
      properties: { label: `Well ${k + 1}` },
      geometry: { type: 'Point', coordinates: metersToLngLat(w.x, w.y) }
    }))
  };
}

export default function MapLibreMap({
  physicalState,
  visualizationConfig
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);

  // Task S1.2: GIS Layer & Basemap Controller State
  const [basemapType, setBasemapType] = useState('dark'); // 'dark' | 'satellite'
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState({
    barangays: true,
    cityBoundary: true,
    domainOutline: true,
    wells: true
  });
  const [gridOpacity, setGridOpacity] = useState(
    visualizationConfig?.opacity ? visualizationConfig.opacity / 100 : 0.75
  );

  const dataType = QUANTITIES[visualizationConfig?.dataType] ? visualizationConfig.dataType : 'subsidence';
  const colorScale = visualizationConfig?.colorScale || 'standard';
  const quantity = QUANTITIES[dataType];

  // Slow-loading watchdog (flags if basemap takes longer than 7 seconds)
  useEffect(() => {
    if (mapLoaded || mapError) return;
    const timer = setTimeout(() => setIsSlowLoading(true), 7000);
    return () => clearTimeout(timer);
  }, [mapLoaded, mapError, retryCount]);

  // Map cells come from the same physics grid as the 3D view and the charts
  const geojsonGrid = useMemo(() => buildGridGeoJSON(physicalState, dataType), [physicalState, dataType]);
  const wellsData = useMemo(() => wellsGeoJSON(physicalState), [physicalState]);
  const selected = selectedIdx != null && physicalState ? describeNode(physicalState, selectedIdx) : null;

  // Latest data for the one-time layer setup inside the map initialisation effect
  const latestRef = useRef({ geojsonGrid, wellsData, colorScale, gridOpacity });
  useEffect(() => {
    latestRef.current = { geojsonGrid, wellsData, colorScale, gridOpacity };
  }, [geojsonGrid, wellsData, colorScale, gridOpacity]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: GIS_BASEMAP_STYLE,
      bounds: DOMAIN_LNGLAT_BOUNDS,
      fitBoundsOptions: FIT_OPTIONS,
      minZoom: 10,
      maxZoom: 17,
      cooperativeGestures: true,
      attributionControl: true,
      preserveDrawingBuffer: true
    });

    mapRef.current = map;

    // Dynamic, measurable container sizing via ResizeObserver with contentRect
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && mapRef.current) {
          mapRef.current.resize();
        }
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    // Meaningful error handling: distinguish isolated tile failures from fatal errors
    map.on('error', (e) => {
      const errMsg = e?.error?.message || e?.message || String(e?.error || e || '');
      const isTileError = e?.sourceId?.includes('esri') || e?.tile || e?.status === 404 || e?.status === 403;

      if (isTileError) {
        // Non-fatal individual tile error (e.g. transient network glitch) - do not crash map
        console.warn('[MapLibre tile notice]:', errMsg, e?.status);
        return;
      }

      console.error('[MapLibre fatal error]:', e);
      if (errMsg.toLowerCase().includes('worker') || errMsg.toLowerCase().includes('syntaxerror')) {
        setMapError({ type: 'worker', message: 'MapLibre Web Worker failed to initialize. Check browser worker support.' });
      } else if (errMsg.toLowerCase().includes('style') || errMsg.toLowerCase().includes('json')) {
        setMapError({ type: 'style', message: 'Basemap style definition or tile source could not be resolved.' });
      } else {
        setMapError({ type: 'general', message: errMsg || 'Map rendering encountered an unhandled graphics error.' });
      }
    });

    map.on('webglcontextlost', () => {
      setMapError({ type: 'webgl', message: 'WebGL context lost. Hardware graphics acceleration may be unavailable.' });
    });

    let layersSetup = false;
    const setupLayers = () => {
      if (layersSetup || !mapRef.current) return;
      layersSetup = true;
      const latest = latestRef.current;
      setMapLoaded(true);
      setMapError(null);
      map.resize();

      const base = import.meta.env.BASE_URL || '/';
      const dataBase = `${base.endsWith('/') ? base : base + '/'}data/spatial/`;
      map.addSource('iloilo-barangays', { type: 'geojson', data: `${dataBase}iloilo_city_barangays.geojson` });
      map.addSource('iloilo-city-boundary', { type: 'geojson', data: `${dataBase}iloilo_city_boundary.geojson` });
      map.addSource('result-grid', { type: 'geojson', data: latest.geojsonGrid });
      map.addSource('domain-outline', { type: 'geojson', data: domainOutlineGeoJSON() });
      map.addSource('wells', { type: 'geojson', data: latest.wellsData });

      // Barangay outlines and the city boundary give geographic context only
      map.addLayer({
        id: 'iloilo-barangays-line',
        type: 'line',
        source: 'iloilo-barangays',
        paint: { 'line-color': 'rgba(148, 163, 184, 0.45)', 'line-width': 1 }
      });
      map.addLayer({
        id: 'iloilo-city-boundary-line',
        type: 'line',
        source: 'iloilo-city-boundary',
        paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-dasharray': [3, 2], 'line-opacity': 0.8 }
      });

      // Synthetic result grid
      map.addLayer({
        id: 'result-fill',
        type: 'fill',
        source: 'result-grid',
        paint: {
          'fill-color': fillColorExpression(latest.colorScale),
          'fill-opacity': ['case', ['<', ['get', 'v'], 0.004], 0, latest.gridOpacity]
        }
      });
      map.addLayer({
        id: 'result-highlight',
        type: 'line',
        source: 'result-grid',
        paint: { 'line-color': '#ffffff', 'line-width': 2 },
        filter: ['==', ['get', 'idx'], -1]
      });
      map.addLayer({
        id: 'domain-outline-line',
        type: 'line',
        source: 'domain-outline',
        paint: { 'line-color': '#22d3ee', 'line-width': 2, 'line-dasharray': [2, 1.5] }
      });

      // Place-name reference tiles above the result grid
      map.addLayer({
        id: 'esri-dark-reference-layer',
        type: 'raster',
        source: 'esri-dark-reference',
        paint: { 'raster-opacity': 0.85 }
      });

      // Production Wells
      map.addLayer({
        id: 'wells-circle',
        type: 'circle',
        source: 'wells',
        paint: {
          'circle-radius': 7,
          'circle-color': '#0f172a',
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-width': 2.5
        }
      });

      map.on('mousemove', 'result-fill', (e) => {
        if (e.features?.length) {
          map.getCanvas().style.cursor = 'pointer';
          map.setFilter('result-highlight', ['==', ['get', 'idx'], e.features[0].properties.idx]);
        }
      });
      map.on('mouseleave', 'result-fill', () => {
        map.getCanvas().style.cursor = '';
        map.setFilter('result-highlight', ['==', ['get', 'idx'], -1]);
      });
      map.on('click', 'result-fill', (e) => {
        if (e.features?.length) setSelectedIdx(e.features[0].properties.idx);
      });
    };

    map.on('load', setupLayers);
    if (map.isStyleLoaded()) setupLayers();

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [retryCount]);

  // Basemap switcher: toggle raster visibility without style re-fetching
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;
    if (map.getLayer('esri-dark-base-layer')) {
      map.setLayoutProperty('esri-dark-base-layer', 'visibility', basemapType === 'dark' ? 'visible' : 'none');
    }
    if (map.getLayer('esri-satellite-base-layer')) {
      map.setLayoutProperty('esri-satellite-base-layer', 'visibility', basemapType === 'satellite' ? 'visible' : 'none');
    }
  }, [basemapType, mapLoaded]);

  // Vector layer visibility toggles
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;
    if (map.getLayer('iloilo-barangays-line')) {
      map.setLayoutProperty('iloilo-barangays-line', 'visibility', layerVisibility.barangays ? 'visible' : 'none');
    }
    if (map.getLayer('iloilo-city-boundary-line')) {
      map.setLayoutProperty('iloilo-city-boundary-line', 'visibility', layerVisibility.cityBoundary ? 'visible' : 'none');
    }
    if (map.getLayer('domain-outline-line')) {
      map.setLayoutProperty('domain-outline-line', 'visibility', layerVisibility.domainOutline ? 'visible' : 'none');
    }
    if (map.getLayer('wells-circle')) {
      map.setLayoutProperty('wells-circle', 'visibility', layerVisibility.wells ? 'visible' : 'none');
    }
  }, [layerVisibility, mapLoaded]);

  // Simulation grid opacity & color scale sync
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map?.getLayer('result-fill')) return;
    map.setPaintProperty('result-fill', 'fill-color', fillColorExpression(colorScale));
    map.setPaintProperty('result-fill', 'fill-opacity', ['case', ['<', ['get', 'v'], 0.004], 0, gridOpacity]);
  }, [colorScale, gridOpacity, mapLoaded]);

  // Genuine retry handler: tears down map and triggers full clean initialization
  const handleRetryBasemap = () => {
    setMapError(null);
    setMapLoaded(false);
    setIsSlowLoading(false);
    setRetryCount(c => c + 1);
  };

  // Keep sources in sync with physical simulation state
  useEffect(() => {
    if (!mapLoaded) return;
    mapRef.current?.getSource('result-grid')?.setData(geojsonGrid);
  }, [geojsonGrid, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;
    mapRef.current?.getSource('wells')?.setData(wellsData);
  }, [wellsData, mapLoaded]);

  // Navigation Handlers
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetExtent = () => mapRef.current?.fitBounds(DOMAIN_LNGLAT_BOUNDS, { ...FIT_OPTIONS, duration: 800 });

  const fmt = (v, q) => `${v.toFixed(QUANTITIES[q].decimals)} ${QUANTITIES[q].unit}`;

  return (
    <div className="relative w-full h-full flex-1 bg-[#050e18] overflow-hidden select-none">
      {/* 1. MapLibre GL Canvas Container (Enforced absolute geometry prevents height collapse) */}
      <div ref={mapContainerRef} className="aquifera-maplibre-container absolute inset-0 w-full h-full" />

      {/* Fatal Error Overlay */}
      {mapError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050e18]/95 backdrop-blur-sm p-6 text-center select-text">
          <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-3 shadow-lg">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1.5">
            {mapError.type === 'worker' ? 'Web Worker Execution Error' : 'GIS Basemap Initialization Failed'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4 font-mono leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
            {mapError.message}
          </p>
          <button onClick={handleRetryBasemap} className="aquifera-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-lg cursor-pointer">
            <RotateCcw size={13} />
            <span>Retry Basemap</span>
          </button>
        </div>
      )}

      {/* Loading & Slow-Loading Floating Indicator */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050e18]/60 backdrop-blur-xs z-10 gap-2 text-slate-300 p-4 text-center pointer-events-none">
          <div className="bg-slate-950/90 border border-cyan-500/30 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5">
            <Loader2 size={18} className="animate-spin text-cyan-400" />
            <span className="text-xs font-mono text-slate-200">Loading basemap...</span>
          </div>
          {isSlowLoading && (
            <div className="flex flex-col items-center gap-1.5 mt-2 bg-slate-950/90 border border-amber-500/30 px-3 py-2 rounded-xl pointer-events-auto">
              <span className="text-[11px] text-amber-300/90">The basemap is taking longer than expected to load.</span>
              <button onClick={handleRetryBasemap} className="aquifera-btn-secondary text-[11px] px-3 py-1 flex items-center gap-1.5 cursor-pointer">
                <RotateCcw size={11} />
                <span>Retry Basemap</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Top-Left Context Badge */}
      <div className="absolute top-4 left-4 z-10 max-w-sm pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10 shadow-lg">
          <div className="flex items-center gap-2">
            <Navigation size={13} className="text-cyan-400 rotate-45" />
            <span className="text-xs font-semibold text-slate-100">Synthetic 3.2 km test domain</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Shown over Iloilo City for context. Not Iloilo stratigraphy and not a forecast.
          </p>
        </div>
      </div>

      {/* 3. Map Controls (Top-Right): Zoom, Reset, and Layer Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowLayersPanel(p => !p)}
          aria-label="Toggle GIS Layers & Basemap"
          title="GIS Layer Controls & Basemap Switcher"
          className={`w-8 h-8 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 ${
            showLayersPanel
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
              : 'bg-slate-950/85 text-slate-200 border-white/10 hover:border-cyan-400/50 hover:text-white'
          }`}
        >
          <Layers size={15} />
        </button>

        {[
          { onClick: handleZoomIn, label: 'Zoom in', icon: <ZoomIn size={15} /> },
          { onClick: handleZoomOut, label: 'Zoom out', icon: <ZoomOut size={15} /> },
          { onClick: handleResetExtent, label: 'Reset map to the test domain', icon: <RotateCcw size={14} /> }
        ].map(b => (
          <button
            key={b.label}
            onClick={b.onClick}
            aria-label={b.label}
            title={b.label}
            className="w-8 h-8 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            {b.icon}
          </button>
        ))}
      </div>

      {/* 4. Floating Layer Controls Popover (Task S1.2) */}
      {showLayersPanel && (
        <div className="absolute top-4 right-14 z-20 w-68 bg-slate-950/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-3.5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Layers size={14} className="text-cyan-400" />
              <span>GIS Layer Controls</span>
            </div>
            <button
              onClick={() => setShowLayersPanel(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer hover:bg-white/10"
              title="Close panel"
            >
              <X size={14} />
            </button>
          </div>

          {/* Basemap Selection */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-300">Basemap Imagery</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setBasemapType('dark')}
                className={`py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  basemapType === 'dark'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark Canvas
              </button>
              <button
                onClick={() => setBasemapType('satellite')}
                className={`py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  basemapType === 'satellite'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ESRI Satellite
              </button>
            </div>
          </div>

          {/* Vector Overlays */}
          <div className="flex flex-col gap-2 border-t border-white/10 pt-2">
            <span className="text-[11px] font-semibold text-slate-300">Vector Overlays</span>
            
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-0.5 bg-slate-400 rounded-full" />
                Barangays (PSA/NAMRIA)
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.barangays}
                onChange={(e) => setLayerVisibility(v => ({ ...v, barangays: e.target.checked }))}
                className="accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-0.5 border-t border-dashed border-amber-400" />
                Iloilo City Boundary
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.cityBoundary}
                onChange={(e) => setLayerVisibility(v => ({ ...v, cityBoundary: e.target.checked }))}
                className="accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-0.5 border-t border-dashed border-cyan-400" />
                Synthetic 3.2km Domain
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.domainOutline}
                onChange={(e) => setLayerVisibility(v => ({ ...v, domainOutline: e.target.checked }))}
                className="accent-cyan-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full border border-cyan-400 bg-slate-900" />
                Production Wells
              </span>
              <input
                type="checkbox"
                checked={layerVisibility.wells}
                onChange={(e) => setLayerVisibility(v => ({ ...v, wells: e.target.checked }))}
                className="accent-cyan-400 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Simulation Grid Opacity Slider */}
          <div className="flex flex-col gap-1.5 border-t border-white/10 pt-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-300">Grid Opacity</span>
              <span className="font-mono text-cyan-400 font-bold">{Math.round(gridOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={gridOpacity}
              onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 5. Bottom-Left Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl w-72">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-cyan-400" />
            <span className="text-xs font-bold text-slate-100">{quantity.label} ({quantity.unit})</span>
          </div>
          <span className="text-[10px] font-mono text-amber-300 font-semibold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
            SYNTHETIC DEMO
          </span>
        </div>
        <div className="w-full h-2 rounded mb-1 border border-white/10" style={{ background: cssGradient(colorScale) }} />
        <div className="flex justify-between text-[10px] font-mono text-slate-300">
          <span>0</span>
          <span>{quantity.max / 2}</span>
          <span>&ge; {quantity.max}</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 leading-snug border-t border-white/5 pt-1.5">
          After {physicalState?.pumpingDays ?? 0} days of pumping. Simplified analytical model, not MODFLOW 6 or PINO output. Click a cell to inspect it.
        </div>
      </div>

      {/* 6. Selected Cell Inspector */}
      {selected && (
        <div className="absolute bottom-4 right-4 z-10 bg-slate-950/95 backdrop-blur-md p-3.5 rounded-xl border border-cyan-400/40 shadow-2xl w-64 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
            <span className="font-bold text-cyan-300">Grid cell</span>
            <button
              onClick={() => setSelectedIdx(null)}
              aria-label="Close cell inspector"
              className="text-slate-400 hover:text-white cursor-pointer p-0.5 rounded hover:bg-white/10"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Offset from domain centre</span>
              <span className="font-mono text-slate-200">{selected.x} m E, {-selected.y} m N</span>
            </div>
            {Object.keys(QUANTITIES).map(q => (
              <div key={q} className="flex justify-between gap-2">
                <span className={q === dataType ? 'text-white font-semibold' : 'text-slate-400'}>{QUANTITIES[q].label}</span>
                <span className="font-mono text-slate-100 shrink-0">{fmt(selected[q], q)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-white/5 pt-1.5">
            Synthetic demonstration value; not an Iloilo forecast.
          </div>
        </div>
      )}
    </div>
  );
}
