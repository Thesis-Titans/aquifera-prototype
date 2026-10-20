import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Map, Marker, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { METRO_ILOILO_GIS } from '../../../data/geographic/metroIloiloGIS';
import { Navigation, ZoomIn, ZoomOut, RotateCcw, Layers, Loader2, AlertTriangle } from 'lucide-react';

// Configure MapLibre background worker for Vite environment
if (typeof window !== 'undefined' && setWorkerUrl) {
  const base = import.meta.env.BASE_URL || '/';
  const workerPath = `${base.endsWith('/') ? base : base + '/'}maplibre-gl-worker.mjs`;
  const fullUrl = new URL(workerPath, window.location.origin).href;
  setWorkerUrl(fullUrl);
}

// Robust, high-contrast dark GIS basemap (ESRI World Dark Gray Canvas, no API key required)
const ESRI_DARK_STYLE = {
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
      id: 'esri-dark-background',
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
      maxzoom: 16
    }
  ]
};

export default function MapLibreMap({
  physicalState,
  params,
  visualizationConfig,
  onSelectDistrict
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);

  // Slow-loading watchdog (flags if basemap takes longer than 7 seconds)
  useEffect(() => {
    if (mapLoaded || mapError) {
      setIsSlowLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      if (!mapLoaded && !mapError) {
        setIsSlowLoading(true);
      }
    }, 7000);
    return () => clearTimeout(timer);
  }, [mapLoaded, mapError, retryCount]);

  // Metro Iloilo geographic extent
  const centerLng = METRO_ILOILO_GIS.center.lng; // 122.5621
  const centerLat = METRO_ILOILO_GIS.center.lat; // 10.7202

  // Generate deterministic synthetic GeoJSON grid based on current physicalState
  const geojsonGrid = useMemo(() => {
    const features = [];
    const minLng = 122.505;
    const maxLng = 122.615;
    const minLat = 10.675;
    const maxLat = 10.765;

    const cols = 14;
    const rows = 12;
    const stepLng = (maxLng - minLng) / cols;
    const stepLat = (maxLat - minLat) / rows;

    // Primary overdraft epicenter at Mandurriao
    const mandurriao = METRO_ILOILO_GIS.districts[0];
    const epicLng = mandurriao.lng;
    const epicLat = mandurriao.lat;

    const pRatio = (params.pumpingRate || 20000) / 20000;
    const maxSubCm = (physicalState?.maxSubsidenceCm || 28) * pRatio;
    const maxDrawdownM = (physicalState?.maxDrawdownM || 48) * pRatio;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const cMinLng = minLng + i * stepLng;
        const cMaxLng = cMinLng + stepLng;
        const cMinLat = minLat + j * stepLat;
        const cMaxLat = cMinLat + stepLat;

        const cellCenterLng = (cMinLng + cMaxLng) / 2;
        const cellCenterLat = (cMinLat + cMaxLat) / 2;

        // Approximate distance in km to epicenter
        const dLngKm = (cellCenterLng - epicLng) * 111.32 * Math.cos(epicLat * Math.PI / 180);
        const dLatKm = (cellCenterLat - epicLat) * 110.57;
        const distKm = Math.sqrt(dLngKm * dLngKm + dLatKm * dLatKm);

        // Gaussian attenuation curve (characteristic radius ~ 2.8 km)
        const decay = Math.exp(-(distKm * distKm) / (2 * 2.8 * 2.8));
        const subCm = Math.max(0.2, (maxSubCm * decay)).toFixed(1);
        const drawdownM = Math.max(0.5, (maxDrawdownM * decay)).toFixed(1);

        // Nearest district label
        let nearestDistrict = 'Metro Iloilo Basin';
        let minDist = 999;
        METRO_ILOILO_GIS.districts.forEach(d => {
          const dX = (cellCenterLng - d.lng) * 111;
          const dY = (cellCenterLat - d.lat) * 110;
          const dDist = Math.sqrt(dX * dX + dY * dY);
          if (dDist < minDist) {
            minDist = dDist;
            nearestDistrict = d.name;
          }
        });

        let riskLevel = 'Low (< 5 cm)';
        if (Number(subCm) >= 20) riskLevel = 'Critical (> 20 cm)';
        else if (Number(subCm) >= 10) riskLevel = 'High (10 - 20 cm)';
        else if (Number(subCm) >= 5) riskLevel = 'Moderate (5 - 10 cm)';

        features.push({
          type: 'Feature',
          id: `cell_${i}_${j}`,
          properties: {
            cellId: `CELL-${String(i).padStart(2, '0')}-${String(j).padStart(2, '0')}`,
            district: nearestDistrict,
            subsidence_cm: Number(subCm),
            subsidence_m: (Number(subCm) / 100).toFixed(3),
            drawdown_m: Number(drawdownM),
            risk_level: riskLevel,
            soil_strata: 'Holocene Alluvial Clay (35m)',
            provenance: 'Synthetic scenario output (PINO demonstration grid)'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [cMinLng, cMinLat],
              [cMaxLng, cMinLat],
              [cMaxLng, cMaxLat],
              [cMinLng, cMaxLat],
              [cMinLng, cMinLat]
            ]]
          }
        });
      }
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }, [physicalState, params]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset error and loaded states on (re)initialization
    setMapError(null);
    setMapLoaded(false);

    const map = new Map({
      container: mapContainerRef.current,
      style: ESRI_DARK_STYLE,
      center: [centerLng, centerLat],
      zoom: 12.1,
      minZoom: 10,
      maxZoom: 16,
      pitch: 25,
      bearing: -5,
      attributionControl: true
    });

    mapRef.current = map;
    window.__map = map;

    // Dynamic, measurable container sizing via ResizeObserver with contentRect
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && mapRef.current) {
          mapRef.current.resize();
        }
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Explicit initial resize once browser layout completes first paint
    requestAnimationFrame(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

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
      window.__maplibreError = { message: errMsg, status: e?.status };

      if (errMsg.toLowerCase().includes('worker') || errMsg.toLowerCase().includes('syntaxerror')) {
        setMapError({
          type: 'worker',
          message: 'MapLibre Web Worker failed to initialize. Check browser worker support.'
        });
      } else if (errMsg.toLowerCase().includes('style') || errMsg.toLowerCase().includes('json')) {
        setMapError({
          type: 'style',
          message: 'Basemap style definition or tile source could not be resolved.'
        });
      } else {
        setMapError({
          type: 'general',
          message: errMsg || 'Map rendering encountered an unhandled graphics error.'
        });
      }
    });

    map.on('webglcontextlost', () => {
      console.error('[MapLibre]: WebGL context lost');
      setMapError({
        type: 'webgl',
        message: 'WebGL context lost. Hardware graphics acceleration may be unavailable.'
      });
    });

    let layersSetup = false;
    const setupLayers = () => {
      if (layersSetup || !mapRef.current) return;
      layersSetup = true;
      setMapLoaded(true);
      setMapError(null);
      map.resize();

      // 1. Add GeoJSON Synthetic Subsidence Grid Source
      if (!map.getSource('subsidence-grid')) {
        map.addSource('subsidence-grid', {
          type: 'geojson',
          data: geojsonGrid
        });
      }

      // 2. Add Fill Layer with Color Ramps
      if (!map.getLayer('subsidence-fill')) {
        map.addLayer({
          id: 'subsidence-fill',
          type: 'fill',
          source: 'subsidence-grid',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'subsidence_cm'],
              0, 'rgba(6, 182, 212, 0.08)',
              4, 'rgba(16, 185, 129, 0.35)',
              10, 'rgba(234, 179, 8, 0.55)',
              18, 'rgba(249, 115, 22, 0.75)',
              28, 'rgba(239, 68, 68, 0.90)'
            ],
            'fill-opacity': (visualizationConfig?.opacity || 70) / 100
          }
        });
      }

      // 3. Add Grid Outline Layer
      if (!map.getLayer('subsidence-line')) {
        map.addLayer({
          id: 'subsidence-line',
          type: 'line',
          source: 'subsidence-grid',
          paint: {
            'line-color': 'rgba(34, 211, 238, 0.35)',
            'line-width': 1,
            'line-opacity': 0.8
          }
        });
      }

      // 4. Highlight Layer for Hover/Click
      if (!map.getLayer('subsidence-highlight')) {
        map.addLayer({
          id: 'subsidence-highlight',
          type: 'line',
          source: 'subsidence-grid',
          paint: {
            'line-color': '#00f2fe',
            'line-width': 2.5
          },
          filter: ['==', 'cellId', '']
        });
      }

      // 5. Add Reference Roads and District Names Layer
      if (!map.getLayer('esri-dark-reference-layer')) {
        map.addLayer({
          id: 'esri-dark-reference-layer',
          type: 'raster',
          source: 'esri-dark-reference',
          minzoom: 0,
          maxzoom: 16,
          paint: {
            'raster-opacity': 0.85
          }
        });
      }

      // 6. Add Reference District Markers
      METRO_ILOILO_GIS.districts.forEach(district => {
        const el = document.createElement('div');
        el.className = 'district-marker-pill';
        el.innerHTML = `
          <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(0, 242, 254, 0.5); border-radius: 9999px; padding: 2px 8px; display: flex; align-items: center; gap: 4px; box-shadow: 0 0 10px rgba(0,242,254,0.3); cursor: pointer;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #00f2fe;"></div>
            <span style="font-size: 10px; font-weight: 600; color: #f8fafc; white-space: nowrap;">${district.name}</span>
          </div>
        `;

        el.addEventListener('click', () => {
          if (onSelectDistrict) onSelectDistrict(district);
          map.flyTo({
            center: [district.lng, district.lat],
            zoom: 13.5,
            speed: 1.2
          });
        });

        new Marker({ element: el })
          .setLngLat([district.lng, district.lat])
          .addTo(map);
      });

      // 7. Interactive Cell Hover
      map.on('mousemove', 'subsidence-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          map.setFilter('subsidence-highlight', ['==', 'cellId', feature.properties.cellId]);
        }
      });

      map.on('mouseleave', 'subsidence-fill', () => {
        map.getCanvas().style.cursor = '';
        map.setFilter('subsidence-highlight', ['==', 'cellId', '']);
      });

      // 8. Interactive Cell Click & Popup
      map.on('click', 'subsidence-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const props = feature.properties;
          setSelectedCell(props);

          const popupContent = `
            <div style="background: #060e18; color: #f8fafc; font-family: Inter, sans-serif; padding: 10px; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.4); max-width: 240px; box-shadow: 0 10px 25px rgba(0,0,0,0.8);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 8px;">
                <span style="font-weight: 700; font-size: 12px; color: #00f2fe;">${props.district}</span>
                <span style="font-family: monospace; font-size: 10px; color: #94a3b8;">${props.cellId}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
                <span style="color: #94a3b8;">Subsidence:</span>
                <strong style="color: #ef4444; font-family: monospace;">${props.subsidence_cm} cm</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
                <span style="color: #94a3b8;">Head Drawdown:</span>
                <strong style="color: #38bdf8; font-family: monospace;">-${props.drawdown_m} m</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px;">
                <span style="color: #94a3b8;">Vulnerability:</span>
                <strong style="color: #fbbf24; font-size: 10px;">${props.risk_level}</strong>
              </div>
              <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1); font-size: 9px; color: #64748b; font-style: italic;">
                Synthetic demonstration cell (PINO surrogate demo grid)
              </div>
            </div>
          `;

          if (popupRef.current) popupRef.current.remove();

          popupRef.current = new Popup({ closeButton: true, offset: 12 })
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);
        }
      });
    };

    map.on('style.load', () => {
      console.log('[DEBUG] MapLibre style loaded');
      window.__maplibreStyleLoaded = true;
      setupLayers();
    });

    map.on('load', () => {
      console.log('[DEBUG] MapLibre map loaded');
      window.__maplibreLoaded = true;
      setupLayers();
    });

    if (map.isStyleLoaded()) {
      setupLayers();
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [retryCount]);

  // Genuine retry handler: tears down map and triggers full clean initialization
  const handleRetryBasemap = () => {
    setMapError(null);
    setMapLoaded(false);
    setIsSlowLoading(false);
    setRetryCount(c => c + 1);
  };

  // Update GeoJSON source when physicalState or params change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('subsidence-grid');
    if (source) {
      source.setData(geojsonGrid);
    }
  }, [geojsonGrid, mapLoaded]);

  // Update Opacity reactively
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (mapRef.current.getLayer('subsidence-fill')) {
      const opacity = (visualizationConfig?.opacity || 70) / 100;
      mapRef.current.setPaintProperty('subsidence-fill', 'fill-opacity', opacity);
    }
  }, [visualizationConfig?.opacity, mapLoaded]);

  // Controls Handlers
  const handleZoomIn = () => mapRef.current && mapRef.current.zoomIn();
  const handleZoomOut = () => mapRef.current && mapRef.current.zoomOut();
  const handleResetExtent = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [centerLng, centerLat],
      zoom: 12.1,
      pitch: 25,
      bearing: -5,
      speed: 1.2
    });
  };

  return (
    <div className="relative w-full h-full min-h-[400px] flex-1 bg-[#050e18] overflow-hidden select-none">
      {/* 1. MapLibre GL Canvas Container (Enforced absolute geometry prevents height collapse) */}
      <div
        ref={mapContainerRef}
        className="aquifera-maplibre-container absolute inset-0 w-full h-full"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%'
        }}
      />

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
          <button
            onClick={handleRetryBasemap}
            className="aquifera-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
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
            <span className="text-xs font-mono text-slate-200">Streaming Metro Iloilo GIS Basemap...</span>
          </div>
          {isSlowLoading && (
            <div className="flex flex-col items-center gap-1.5 mt-2 bg-slate-950/90 border border-amber-500/30 px-3 py-2 rounded-xl pointer-events-auto">
              <span className="text-[11px] text-amber-300/90">
                Basemap network stream is taking longer than expected.
              </span>
              <button
                onClick={handleRetryBasemap}
                className="aquifera-btn-secondary text-[11px] px-3 py-1 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Retry Basemap</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Top-Left Extent & Spatial Context Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-white/10 shadow-lg pointer-events-auto flex items-center gap-2">
          <Navigation size={13} className="text-cyan-400 rotate-45" />
          <span className="text-xs font-semibold text-slate-100">Metro Iloilo Basin (PRS92 / WGS84)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
            10.72°N, 122.56°E
          </span>
        </div>
      </div>

      {/* 3. Map Navigation Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          onClick={handleResetExtent}
          className="w-8 h-8 rounded-lg bg-slate-950/85 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 text-slate-200 hover:text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
          title="Reset to Metro Iloilo Extent"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* 4. Bottom-Left Map Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/90 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shadow-xl max-w-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-cyan-400" />
            <span className="text-xs font-bold text-slate-100">Cumulative Subsidence (2025-2050)</span>
          </div>
          <span className="text-[9px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
            SYNTHETIC
          </span>
        </div>
        <div
          className="w-full h-2 rounded mb-1.5 border border-white/10"
          style={{ background: 'linear-gradient(to right, #22d3ee, #34d399, #fbbf24, #e11d48)' }}
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-300">
          <span>&lt; 2 cm</span>
          <span>10 cm</span>
          <span>20 cm</span>
          <span>&gt; 30 cm</span>
        </div>
        <div className="mt-2 text-[9px] text-slate-400 leading-tight border-t border-white/5 pt-1.5">
          Illustrative spatial grid calibrated to Theis drawdown and 1D Terzaghi skeletal compaction. Click any cell to inspect.
        </div>
      </div>

      {/* 5. Floating Selected Cell Inspector Card */}
      {selectedCell && (
        <div className="absolute bottom-4 right-16 z-10 bg-slate-950/92 backdrop-blur-md p-3.5 rounded-xl border border-cyan-400/40 shadow-2xl w-64 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
            <span className="font-bold text-cyan-300">{selectedCell.district}</span>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-white text-[10px] cursor-pointer px-1.5 py-0.5 rounded bg-white/5"
            >
              Close
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Cell Identifier:</span>
              <span className="font-mono text-slate-200">{selectedCell.cellId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Projected Subsidence:</span>
              <span className="font-mono font-bold text-rose-400">{selectedCell.subsidence_cm} cm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Piezometric Drawdown:</span>
              <span className="font-mono text-cyan-300">-{selectedCell.drawdown_m} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Risk Classification:</span>
              <span className="font-semibold text-amber-300 text-[10px]">{selectedCell.risk_level}</span>
            </div>
          </div>
          <div className="mt-2 text-[9px] text-slate-400 italic border-t border-white/5 pt-1">
            Status: Synthetic demonstration cell (PINO demo grid)
          </div>
        </div>
      )}
    </div>
  );
}
