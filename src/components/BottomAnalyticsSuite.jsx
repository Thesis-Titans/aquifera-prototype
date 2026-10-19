import React, { useState, useEffect, useRef } from 'react';
import { 
  Droplet, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RotateCcw, 
  Layers, 
  ChevronDown,
  Sliders,
  TrendingDown
} from 'lucide-react';

export default function BottomAnalyticsSuite({
  physicalState,
  params,
  onOpenVerification,
  onResetView,
  visualizationConfig,
  setVisualizationConfig
}) {
  const [activeResultsTab, setActiveResultsTab] = useState('subsidence'); // 'subsidence' | 'head' | 'compaction'
  const canvasRef = useRef(null);

  // Derive dynamic metrics based on simulation state
  const maxSubsidenceM = (physicalState.maxSubsidenceCm / 100).toFixed(2);
  const minHeadM = `-${Math.abs(physicalState.maxDrawdown).toFixed(1)}`;
  const pinoRuntimeS = 12.4;
  const modflowRuntimeMin = 45.2;
  const accuracyPct = 92.4;

  // Render 2D Vertical Subsurface Cross-Section Heatmap (Depth vs Distance)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Strata Backgrounds (Depth: 0 to -200m)
    // 0 to -30m: Sand/Alluvium
    const y30 = height * (30 / 200);
    // -30 to -60m: Compressible Marine Clay
    const y60 = height * (60 / 200);
    // -60 to -120m: Lower Semi-Confined Aquifer
    const y120 = height * (120 / 200);

    // Background gradient for strata
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Clay Layer Outline (-30m to -60m)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(0, y30, width, y60 - y30);

    // Aquifer Layer Outline (-60m to -120m)
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fillRect(0, y60, width, y120 - y60);

    // Generate dynamic compaction / subsidence plume
    // Peak extraction centered at distance ~4.5 km (Mandurriao well field)
    const centerX = width * 0.45;
    const centerY = (y30 + y60) / 2; // Center inside clay layer

    const intensity = Math.min(1.0, physicalState.maxSubsidenceCm / 30);
    const radiusX = width * 0.35;
    const radiusY = (y120 - y30) * 0.9;

    const gradient = ctx.createRadialGradient(
      centerX, centerY, 5,
      centerX, centerY, radiusX
    );

    if (activeResultsTab === 'subsidence') {
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.9 * intensity})`);
      gradient.addColorStop(0.3, `rgba(249, 115, 22, ${0.75 * intensity})`);
      gradient.addColorStop(0.6, `rgba(234, 179, 8, ${0.5 * intensity})`);
      gradient.addColorStop(0.85, `rgba(6, 182, 212, ${0.25 * intensity})`);
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else if (activeResultsTab === 'head') {
      gradient.addColorStop(0, `rgba(6, 182, 212, ${0.95 * intensity})`);
      gradient.addColorStop(0.4, `rgba(59, 130, 246, ${0.7 * intensity})`);
      gradient.addColorStop(0.8, `rgba(99, 102, 241, ${0.3 * intensity})`);
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else {
      gradient.addColorStop(0, `rgba(244, 63, 94, ${0.9 * intensity})`);
      gradient.addColorStop(0.5, `rgba(168, 85, 247, ${0.6 * intensity})`);
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    // Strata boundary dashed dividing lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;

    // -30m line
    ctx.beginPath();
    ctx.moveTo(0, y30);
    ctx.lineTo(width, y30);
    ctx.stroke();

    // -60m line
    ctx.beginPath();
    ctx.moveTo(0, y60);
    ctx.lineTo(width, y60);
    ctx.stroke();

    // -120m line
    ctx.beginPath();
    ctx.moveTo(0, y120);
    ctx.lineTo(width, y120);
    ctx.stroke();

    ctx.setLineDash([]);

    // Well extraction indicator vector
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, y120);
    ctx.stroke();

    // Well head screen
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(centerX, 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Strata labels inside the canvas
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('Sand (0 to -30m)', 10, y30 - 4);
    ctx.fillText('Compressible Clay Aquitard (-30 to -60m)', 10, y60 - 4);
    ctx.fillText('Lower Semi-Confined Aquifer (-60 to -120m)', 10, y120 - 4);
    ctx.fillText('Bedrock (-120 to -200m)', 10, height - 6);
  }, [activeResultsTab, physicalState]);

  return (
    <section className="h-68 bg-slate-950/95 backdrop-blur-2xl border-t border-white/10 px-4 py-3 shrink-0 z-20">
      <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[1920px] mx-auto">
        
        {/* CARD 1: Simulation Results (2D Subsurface Cross-Section Heatmap) */}
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-3 flex flex-col justify-between shadow-lg overflow-hidden">
          {/* Header & Sub-Tabs */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-white tracking-wide">
              Simulation Results
            </span>
            <div className="flex items-center gap-1 text-[10px] font-medium bg-slate-950/80 p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setActiveResultsTab('subsidence')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activeResultsTab === 'subsidence' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Subsidence
              </button>
              <button
                onClick={() => setActiveResultsTab('head')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activeResultsTab === 'head' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Head
              </button>
              <button
                onClick={() => setActiveResultsTab('compaction')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activeResultsTab === 'compaction' 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Compaction
              </button>
            </div>
          </div>

          {/* Canvas with Axis Frame */}
          <div className="relative flex-1 flex items-center my-1">
            {/* Y-Axis (Depth in meters) */}
            <div className="h-full flex flex-col justify-between text-[9px] font-mono text-slate-500 pr-1.5 py-0.5 shrink-0 text-right w-8">
              <span>0m</span>
              <span>-50m</span>
              <span>-100m</span>
              <span>-150m</span>
              <span>-200m</span>
            </div>

            {/* In-Memory HTML5 Canvas Heatmap */}
            <div className="relative flex-1 h-full rounded-lg overflow-hidden border border-white/10 bg-slate-950">
              <canvas
                ref={canvasRef}
                width={360}
                height={120}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* X-Axis (Distance in km) & Colormap Legend */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1">
            <div className="flex items-center gap-4 pl-9">
              <span>0km</span>
              <span>2km</span>
              <span>4km</span>
              <span>6km</span>
              <span>8km</span>
              <span>10km</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-slate-500">0.00m</span>
              <div className="w-14 h-2 rounded-sm bg-linear-to-r from-blue-500 via-yellow-400 to-red-500 border border-white/10" />
              <span className="text-[9px] text-slate-500">0.30m</span>
            </div>
          </div>
        </div>

        {/* CARD 2: Key Insights */}
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-white tracking-wide">
              Key Insights
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Real-Time
            </span>
          </div>

          <div className="flex flex-col gap-2 my-auto">
            {/* Metric 1: Max Land Subsidence */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <TrendingDown size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Max Land Subsidence</div>
                  <div className="text-[10px] text-slate-400">Mandurriao Commercial Hub</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-extrabold text-rose-400">
                  {maxSubsidenceM} m
                </span>
              </div>
            </div>

            {/* Metric 2: Groundwater Depletion */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Droplet size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Groundwater Depletion</div>
                  <div className="text-[10px] text-slate-400">Piezometric head drawdown</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-extrabold text-cyan-300">
                  {minHeadM} m
                </span>
              </div>
            </div>

            {/* Metric 3: Simulation Runtime */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Clock size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Simulation Runtime</div>
                  <div className="text-[10px] text-slate-400">PINO vs 45 min numerical</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-extrabold text-blue-300">
                  ~{pinoRuntimeS} s
                </span>
              </div>
            </div>

            {/* Metric 4: Model Accuracy */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Model Accuracy</div>
                  <div className="text-[10px] text-slate-400">vs MODFLOW-6 benchmark</div>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-extrabold text-emerald-400">
                  ~{accuracyPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Scenario Comparison */}
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-white tracking-wide">
              Scenario Comparison
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Parity Audit
            </span>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto my-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-1.5">Metric</th>
                  <th className="pb-1.5">PINO</th>
                  <th className="pb-1.5">MODFLOW 6</th>
                  <th className="pb-1.5 text-right">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[11px] font-mono">
                <tr>
                  <td className="py-2 text-slate-300 font-sans font-medium">Max Subsidence</td>
                  <td className="py-2 text-cyan-300">{maxSubsidenceM} m</td>
                  <td className="py-2 text-slate-400">0.29 m</td>
                  <td className="py-2 text-right">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                      -3.4%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300 font-sans font-medium">Min Head</td>
                  <td className="py-2 text-cyan-300">{minHeadM} m</td>
                  <td className="py-2 text-slate-400">-47.8 m</td>
                  <td className="py-2 text-right">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                      +0.8%
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-300 font-sans font-medium">Compaction Area</td>
                  <td className="py-2 text-cyan-300">18.4 km²</td>
                  <td className="py-2 text-slate-400">18.9 km²</td>
                  <td className="py-2 text-right">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                      -2.6%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Full Report Action Button */}
          <button
            onClick={onOpenVerification}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <FileText size={13} />
            <span>View Full Verification Report</span>
          </button>
        </div>

        {/* CARD 4: Visualization Controls */}
        <div className="bg-slate-900/60 rounded-xl border border-white/10 p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-white tracking-wide">
              Visualization Controls
            </span>
            <Sliders size={13} className="text-slate-400" />
          </div>

          <div className="flex flex-col gap-2.5 my-auto">
            {/* Data Type */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-medium">Data Type</span>
              <select
                value={visualizationConfig.dataType}
                onChange={(e) => setVisualizationConfig(prev => ({ ...prev, dataType: e.target.value }))}
                className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-white/10 px-2 py-1 focus:outline-none focus:border-cyan-400"
              >
                <option value="subsidence">Subsidence (m)</option>
                <option value="head">Drawdown Head (m)</option>
                <option value="compaction_rate">Compaction Rate (cm/yr)</option>
              </select>
            </div>

            {/* Time Slice */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-medium">Time Slice</span>
              <select
                value={visualizationConfig.timeSlice}
                onChange={(e) => setVisualizationConfig(prev => ({ ...prev, timeSlice: e.target.value }))}
                className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-white/10 px-2 py-1 focus:outline-none focus:border-cyan-400"
              >
                <option value="2050">2050 (End of Run)</option>
                <option value="2040">2040 (Mid-term)</option>
                <option value="2030">2030 (Early Projection)</option>
              </select>
            </div>

            {/* Heatmap Opacity */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Heatmap Opacity</span>
                <span className="font-mono text-cyan-300">{visualizationConfig.opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={visualizationConfig.opacity}
                onChange={(e) => setVisualizationConfig(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                className="aquifera-slider w-full accent-cyan-400"
              />
            </div>

            {/* Color Scale */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-300 font-medium">Color Scale</span>
              <select
                value={visualizationConfig.colorScale}
                onChange={(e) => setVisualizationConfig(prev => ({ ...prev, colorScale: e.target.value }))}
                className="bg-slate-950 text-slate-200 text-xs rounded-lg border border-white/10 px-2 py-1 focus:outline-none focus:border-cyan-400"
              >
                <option value="jet">Jet / Turbo (Scientific)</option>
                <option value="viridis">Viridis (Perceptual)</option>
                <option value="magma">Magma (Thermal)</option>
              </select>
            </div>
          </div>

          {/* Reset View Button */}
          <button
            onClick={onResetView}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-white/5 border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <RotateCcw size={13} />
            <span>Reset View</span>
          </button>
        </div>

      </div>
    </section>
  );
}
