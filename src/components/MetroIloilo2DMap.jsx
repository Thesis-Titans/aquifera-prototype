import React, { useRef, useEffect, useState } from 'react';
import { METRO_ILOILO_GIS } from '../data/metroIloiloGIS';
import { MapPin, Navigation, Info } from 'lucide-react';

export default function MetroIloilo2DMap({
  physicalState,
  layers,
  visualizationConfig,
  onSelectDistrict
}) {
  const canvasRef = useRef(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Render 2D GIS Map on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Coordinate mapping helper: domain bounds (-6km to +6km in X, -5km to +5km in Y)
    const mapX = (kmX) => width * 0.5 + kmX * (width / 12);
    const mapY = (kmY) => height * 0.5 - kmY * (height / 10);

    // 1. Base Dark Ocean / Strait Background (Iloilo Strait)
    ctx.fillStyle = '#060d17';
    ctx.fillRect(0, 0, width, height);

    // Subtle water wave pattern
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.3, y - 4, width * 0.7, y + 4, width, y);
      ctx.stroke();
    }

    // 2. Metro Iloilo Delta Landmass Boundary Polygon
    ctx.beginPath();
    // West inland border
    ctx.moveTo(mapX(-5.5), mapY(-4.5));
    ctx.lineTo(mapX(-5.5), mapY(4.8));
    // North Leganes border
    ctx.lineTo(mapX(4.5), mapY(4.8));
    // Coastal shoreline trending southwest towards City Proper & Molo
    ctx.bezierCurveTo(mapX(4.0), mapY(3.0), mapX(2.5), mapY(0.5), mapX(2.2), mapY(-1.2));
    ctx.bezierCurveTo(mapX(1.8), mapY(-2.5), mapX(0.5), mapY(-3.8), mapX(-1.5), mapY(-4.5));
    ctx.closePath();

    // Satellite terrain land gradient
    const landGradient = ctx.createLinearGradient(0, 0, width, height);
    landGradient.addColorStop(0, '#111e2e');
    landGradient.addColorStop(0.5, '#0e2333');
    landGradient.addColorStop(1, '#091522');
    ctx.fillStyle = landGradient;
    ctx.fill();

    // Land border stroke
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Subsidence Heatmap Overlay
    if (layers.subsidence) {
      const opacity = (visualizationConfig?.opacity || 75) / 100;
      const mandurriao = METRO_ILOILO_GIS.districts[0];
      const cx = mapX(mandurriao.x);
      const cy = mapY(mandurriao.y);

      const maxSub = physicalState.maxSubsidenceCm;
      const heatRadius = Math.min(width * 0.45, (width * 0.18) + (maxSub * 4.5));

      const heatGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, heatRadius);
      heatGrad.addColorStop(0, `rgba(239, 68, 68, ${0.85 * opacity})`); // Deep red > 0.30m
      heatGrad.addColorStop(0.25, `rgba(249, 115, 22, ${0.75 * opacity})`); // Orange 0.20m
      heatGrad.addColorStop(0.5, `rgba(234, 179, 8, ${0.55 * opacity})`); // Yellow 0.12m
      heatGrad.addColorStop(0.75, `rgba(16, 185, 129, ${0.35 * opacity})`); // Green 0.05m
      heatGrad.addColorStop(0.92, `rgba(6, 182, 212, ${0.15 * opacity})`); // Cyan 0.02m
      heatGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, heatRadius, 0, Math.PI * 2);
      ctx.fillStyle = heatGrad;
      ctx.fill();
      ctx.restore();

      // Draw Subsidence Contour Rings
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 * opacity})`;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      [0.3, 0.55, 0.8].forEach(factor => {
        ctx.beginPath();
        ctx.arc(cx, cy, heatRadius * factor, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    // 4. Rivers & Water Bodies
    if (layers.rivers) {
      METRO_ILOILO_GIS.rivers.forEach(river => {
        ctx.save();
        ctx.beginPath();
        const pts = river.path;
        ctx.moveTo(mapX(pts[0][0]), mapY(pts[0][1]));
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(mapX(pts[i][0]), mapY(pts[i][1]));
        }
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = river.name === 'Iloilo River' ? 5 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // River glow
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = river.name === 'Iloilo River' ? 8 : 5;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 5. Roads & Boundaries
    if (layers.roads) {
      METRO_ILOILO_GIS.roads.forEach(road => {
        ctx.save();
        ctx.beginPath();
        const pts = road.path;
        ctx.moveTo(mapX(pts[0][0]), mapY(pts[0][1]));
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(mapX(pts[i][0]), mapY(pts[i][1]));
        }
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.restore();
      });
    }

    // 6. District Pins & Callouts
    METRO_ILOILO_GIS.districts.forEach(d => {
      const px = mapX(d.x);
      const py = mapY(d.y);

      // District node
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = d.vulnerability === 'Critical' ? '#ef4444' : '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Glow effect for critical Mandurriao
      if (d.id === 'mandurriao') {
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // District label pill
      ctx.font = 'bold 10px Inter, sans-serif';
      const textWidth = ctx.measureText(d.name).width;
      
      ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
      ctx.fillRect(px + 8, py - 9, textWidth + 10, 16);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeRect(px + 8, py - 9, textWidth + 10, 16);

      ctx.fillStyle = d.vulnerability === 'Critical' ? '#fca5a5' : '#cbd5e1';
      ctx.fillText(d.name, px + 13, py + 3);
      ctx.restore();
    });

    // 7. Waterway labels
    ctx.save();
    ctx.font = 'italic 10px sans-serif';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.fillText('Iloilo Strait (Guimaras Channel)', mapX(2.0), mapY(-3.5));
    ctx.fillText('Panay Gulf', mapX(-4.0), mapY(-4.0));
    ctx.restore();

  }, [physicalState, layers, visualizationConfig]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={650}
        className="w-full h-full object-cover cursor-crosshair"
      />

      {/* Map Scale Bar & Compass Reticle (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg">
        {/* Scale Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[9px] font-mono text-slate-400">
            <span>0</span>
            <span>2.5</span>
            <span>5.0</span>
            <span>7.5</span>
            <span>10 km</span>
          </div>
          <div className="flex w-36 h-1.5 border border-white/20 rounded-xs overflow-hidden">
            <div className="w-1/4 bg-white" />
            <div className="w-1/4 bg-slate-900" />
            <div className="w-1/4 bg-white" />
            <div className="w-1/4 bg-slate-900" />
          </div>
        </div>

        {/* North Arrow Reticle */}
        <div className="flex items-center gap-1.5 pl-3 border-l border-white/10">
          <div className="w-6 h-6 rounded-full border border-primary/40 flex items-center justify-center bg-primary/10">
            <Navigation size={12} className="text-primary -rotate-45" />
          </div>
          <span className="text-[10px] font-bold text-slate-300 font-mono">N</span>
        </div>
      </div>

      {/* Floating Mandurriao Callout Badge */}
      <div className="absolute top-16 left-4 z-10 max-w-xs bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-rose-500/30 shadow-xl">
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 pb-1 border-b border-white/5">
          <MapPin size={13} />
          <span>Focal Overdraft Area: Mandurriao</span>
        </div>
        <p className="text-[11px] text-slate-300 pt-1.5 leading-relaxed">
          Dense commercial high-rise pumping taps the semi-confined aquifer at -60m to -120m depth, driving irreversible vertical consolidation of the overlying 35m marine clay aquitard.
        </p>
      </div>
    </div>
  );
}
