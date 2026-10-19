import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import { METRO_ILOILO_GIS } from '../data/metroIloiloGIS';
import { Navigation, ZoomIn, ZoomOut, RotateCcw, Info, AlertTriangle, Layers } from 'lucide-react';

// Free, fast, reliable Dark Matter basemap (OpenStreetMap & CARTO data, no API key required)
const CARTO_DARK_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'
    }
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19
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
  const [selectedCell, setSelectedCell] = useState(null);

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

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: CARTO_DARK_STYLE,
      center: [centerLng, centerLat],
      zoom: 12.1,
      minZoom: 10,
      maxZoom: 16,
      pitch: 25,
      bearing: -5,
      attributionControl: true
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);

      // 1. Add GeoJSON Synthetic Subsidence Grid Source
      map.addSource('subsidence-grid', {
        type: 'geojson',
        data: geojsonGrid
      });

      // 2. Add Fill Layer with Color Ramps
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

      // 3. Add Grid Outline Layer
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

      // 4. Highlight Layer for Hover/Click
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

      // 5. Add Reference District Markers
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

        new maplibregl.Marker({ element: el })
          .setLngLat([district.lng, district.lat])
          .addTo(map);
      });

      // 6. Interactive Cell Hover
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

      // 7. Interactive Cell Click & Popup
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

          popupRef.current = new maplibregl.Popup({ closeButton: true, offset: 12 })
            .setLngLat(e.lngLat)
            .setHTML(popupContent)
            .addTo(map);
        }
      });
    });

    return () => {
      map.remove();
    };
  }, []);

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
    <div className="relative w-full h-full min-h-[460px] bg-[#050e18] overflow-hidden select-none">
      {/* 1. MapLibre GL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 2. Top-Left Extent & Spatial Context Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg pointer-events-auto flex items-center gap-2">
          <Navigation size={13} className="text-cyan-400 rotate-45" />
          <span className="text-xs font-semibold text-slate-100">Metro Iloilo Basin (PRS92 / WGS84)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
            10.72°N, 122.56°E
          </span>
        </div>
      </div>

      {/* 3. Map Navigation Controls (Top-Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
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
      <div className="absolute bottom-4 left-3 z-10 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-xl max-w-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-cyan-400" />
            <span className="text-xs font-bold text-slate-100">Cumulative Subsidence (2025–2050)</span>
          </div>
          <span className="text-[9px] font-mono text-cyan-400 font-semibold">SYNTHETIC</span>
        </div>
        <div className="w-full h-2 rounded bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-600 mb-1 border border-white/10" />
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
        <div className="absolute bottom-4 right-14 z-10 bg-slate-950/92 backdrop-blur-md p-3 rounded-xl border border-cyan-400/40 shadow-2xl w-64 text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
            <span className="font-bold text-cyan-300">{selectedCell.district}</span>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-white text-[10px] cursor-pointer px-1.5 py-0.5 rounded bg-white/5"
            >
              Close
            </button>
          </div>
          <div className="space-y-1 text-[11px]">
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
