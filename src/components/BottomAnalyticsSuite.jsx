import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  FileText, 
  SlidersHorizontal,
  ArrowDown, 
  Droplet, 
  Clock, 
  Target, 
  RotateCcw,
  ChevronDown
} from 'lucide-react';

export default function BottomAnalyticsSuite({
  params,
  onOpenVerification,
  onResetView,
  visualizationConfig,
  setVisualizationConfig,
  is3D = false
}) {
  const [activeResultsTab, setActiveResultsTab] = useState('subsidence');
  const canvasRef = useRef(null);

  // Calibrated values matching the target prototype
  // If user adjusts pumping rate, scale slightly from baseline 0.28m / -48m
  const pRatio = (params.pumpingRate || 20000) / 20000;
  const maxSubsidenceVal = (0.28 * Math.pow(pRatio, 0.4)).toFixed(2);
  const minHeadVal = -Math.round(48 * Math.pow(pRatio, 0.3));

  // Render 2D Vertical Subsurface Cross-Section Heatmap matching card1_ref.png
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Continuous colormap mesh
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Peak center of compaction is at distance ~5.0 km (x = width * 0.5) and depth -40m (y = height * 0.20)
    const cx = width * 0.50;
    const cy = height * 0.20;

    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const dx = (px - cx) / (width * 0.32);
        const dy = (py - cy) / (height * 0.22);
        const distSq = dx * dx + dy * dy;

        // Gaussian compaction plume in the clay aquitard
        let val = Math.exp(-distSq * 1.5) * pRatio;
        
        // Surface background warmth
        if (py < height * 0.25) {
          val += Math.max(0, (1.0 - py / (height * 0.25))) * 0.25;
        }

        // Deep strata attenuation below -80m
        if (py > height * 0.4) {
          val *= Math.max(0, 1.0 - (py - height * 0.4) / (height * 0.6));
        }

        // Colormap: 0.0 -> blue, 0.25 -> cyan, 0.5 -> yellow, 0.75 -> orange, 1.0+ -> red/crimson
        let r = 0, g = 0, b = 0;
        const norm = Math.max(0, Math.min(1.0, val));

        if (norm < 0.2) {
          const t = norm / 0.2;
          r = 0;
          g = Math.floor(t * 180);
          b = Math.floor(220 + t * 35);
        } else if (norm < 0.45) {
          const t = (norm - 0.2) / 0.25;
          r = Math.floor(t * 220);
          g = 220;
          b = Math.floor((1 - t) * 220);
        } else if (norm < 0.75) {
          const t = (norm - 0.45) / 0.3;
          r = 255;
          g = Math.floor((1 - t * 0.6) * 220);
          b = 0;
        } else {
          const t = (norm - 0.75) / 0.25;
          r = Math.floor(240 - t * 80);
          g = Math.floor(60 * (1 - t));
          b = Math.floor(40 * t);
        }

        const pIdx = (py * width + px) * 4;
        data[pIdx] = r;
        data[pIdx + 1] = g;
        data[pIdx + 2] = b;
        data[pIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Subtle strata boundary guide lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.25);
    ctx.lineTo(width, height * 0.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, height * 0.50);
    ctx.lineTo(width, height * 0.50);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [activeResultsTab, params.pumpingRate, pRatio]);

  return (
    <section className="h-68 bg-[#06111e] border-t border-[#122336] px-5 py-3 shrink-0 z-20 select-none">
      <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1920px] mx-auto">
        
        {/* CARD 1: Simulation Results */}
        <div className="bg-[#071524] rounded-xl border border-[#13263b] p-3.5 flex flex-col justify-between shadow-lg">
          {/* Header */}
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#0ea5e9]" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              Simulation Results
            </h3>
          </div>

          {/* Sub-Tabs */}
          <div className="flex items-center gap-4 text-xs font-medium border-b border-[#13263b] pt-1">
            <button
              onClick={() => setActiveResultsTab('subsidence')}
              className={`pb-1.5 transition-colors cursor-pointer ${
                activeResultsTab === 'subsidence'
                  ? 'text-white border-b-2 border-[#0ea5e9] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Land Subsidence
            </button>
            <button
              onClick={() => setActiveResultsTab('head')}
              className={`pb-1.5 transition-colors cursor-pointer ${
                activeResultsTab === 'head'
                  ? 'text-white border-b-2 border-[#0ea5e9] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Groundwater Level
            </button>
            <button
              onClick={() => setActiveResultsTab('compaction')}
              className={`pb-1.5 transition-colors cursor-pointer ${
                activeResultsTab === 'compaction'
                  ? 'text-white border-b-2 border-[#0ea5e9] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Aquifer Compaction
            </button>
          </div>

          {/* Subtitle */}
          <div className="text-[11px] font-medium text-slate-300 pt-0.5">
            Land Subsidence (m) – Cross Section
          </div>

          {/* Canvas Plot Frame with Axis & Vertical Colorbar */}
          <div className="relative flex items-center justify-between gap-1 flex-1 my-1">
            {/* Y-Axis (Depth) */}
            <div className="flex items-center gap-1 shrink-0 h-full">
              <span className="text-[9px] text-slate-400 font-medium -rotate-90 origin-center select-none w-3">
                Depth (m)
              </span>
              <div className="flex flex-col justify-between h-full text-[9px] font-mono text-slate-400 pr-1 text-right w-7">
                <span>0</span>
                <span>-50</span>
                <span>-100</span>
                <span>-150</span>
                <span>-200</span>
              </div>
            </div>

            {/* Plot Canvas */}
            <div className="relative flex-1 h-full rounded border border-[#224466] bg-black overflow-hidden">
              <canvas
                ref={canvasRef}
                width={220}
                height={100}
                className="w-full h-full object-fill"
              />
            </div>

            {/* Vertical Colorbar */}
            <div className="flex flex-col items-center justify-between h-full pl-1.5 shrink-0">
              <span className="text-[8.5px] text-slate-300 font-medium whitespace-nowrap">
                Subsidence (m)
              </span>
              <div className="flex items-center gap-1.5 flex-1 py-0.5">
                <div className="w-2.5 h-full rounded-xs bg-linear-to-b from-[#d91e18] via-[#f1c40f] via-[#00c0ef] to-[#0044ff] border border-white/20" />
                <div className="flex flex-col justify-between h-full text-[8.5px] font-mono text-slate-300 text-left">
                  <span>0.30</span>
                  <span>0.20</span>
                  <span>0.10</span>
                  <span>0.05</span>
                  <span>0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* X-Axis (Distance) */}
          <div className="flex flex-col items-center pl-10 pr-12">
            <div className="flex justify-between w-full text-[9px] font-mono text-slate-400 px-1">
              <span>0</span>
              <span>2</span>
              <span>4</span>
              <span>6</span>
              <span>8</span>
              <span>10</span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Distance (km)</span>
          </div>
        </div>

        {/* CARD 2: Key Insights */}
        <div className="bg-[#071524] rounded-xl border border-[#13263b] p-3.5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-[#0ea5e9]" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              Key Insights
            </h3>
          </div>

          <div className="flex flex-col gap-2.5 my-auto">
            {/* Row 1: Maximum Land Subsidence */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0a1e35] border border-[#164373] flex items-center justify-center text-[#38bdf8] shrink-0">
                  <ArrowDown size={15} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10.5px] font-medium text-slate-300">Maximum Land Subsidence</span>
                  <span className="text-base font-bold text-white tracking-tight leading-none mt-0.5">
                    {maxSubsidenceVal} m
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium self-end pb-0.5">
                (by 2050)
              </span>
            </div>

            {/* Row 2: Lowest Groundwater Level */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0a1e35] border border-[#164373] flex items-center justify-center text-[#38bdf8] shrink-0">
                  <Droplet size={15} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10.5px] font-medium text-slate-300">Lowest Groundwater Level</span>
                  <span className="text-base font-bold text-white tracking-tight leading-none mt-0.5">
                    {minHeadVal} m
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium self-end pb-0.5">
                (by 2050)
              </span>
            </div>

            {/* Row 3: Estimated Runtime */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0a1e35] border border-[#164373] flex items-center justify-center text-[#38bdf8] shrink-0">
                  <Clock size={15} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10.5px] font-medium text-slate-300">Estimated Runtime (AI Model)</span>
                  <span className="text-base font-bold text-white tracking-tight leading-none mt-0.5">
                    ~ 12 sec
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium self-end pb-0.5">
                (vs. ~ 45 min with MODFLOW 6)
              </span>
            </div>

            {/* Row 4: Estimated Accuracy */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0a1e35] border border-[#164373] flex items-center justify-center text-[#38bdf8] shrink-0">
                  <Target size={15} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10.5px] font-medium text-slate-300">Estimated Accuracy (vs. MODFLOW 6)</span>
                  <span className="text-base font-bold text-white tracking-tight leading-none mt-0.5">
                    ~ 92%
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium self-end pb-0.5">
                (relative L2 error)
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Scenario Comparison */}
        <div className="bg-[#071524] rounded-xl border border-[#13263b] p-3.5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#0ea5e9]" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              Scenario Comparison
            </h3>
          </div>

          {/* Table */}
          <div className="my-auto overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#18344e] text-[10.5px] font-medium text-slate-300">
                  <th className="pb-2 font-normal">Metric</th>
                  <th className="pb-2 font-normal">AQUIFERA<br/>(PINO)</th>
                  <th className="pb-2 font-normal">MODFLOW 6</th>
                  <th className="pb-2 font-normal text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#13263b] text-[11px] font-mono">
                <tr>
                  <td className="py-1.5 text-slate-300 font-sans font-medium">Max Subsidence (m)</td>
                  <td className="py-1.5 text-white">{maxSubsidenceVal}</td>
                  <td className="py-1.5 text-slate-400">0.30</td>
                  <td className="py-1.5 text-right text-[#10b981] font-semibold">-6.7%</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-300 font-sans font-medium">Avg. Subsidence (m)</td>
                  <td className="py-1.5 text-white">0.12</td>
                  <td className="py-1.5 text-slate-400">0.14</td>
                  <td className="py-1.5 text-right text-[#10b981] font-semibold">-14.3%</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-300 font-sans font-medium">RMSE (m)</td>
                  <td className="py-1.5 text-white">0.015</td>
                  <td className="py-1.5 text-slate-400">N/A</td>
                  <td className="py-1.5 text-right text-slate-500">N/A</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-300 font-sans font-medium">Inference Time (s)</td>
                  <td className="py-1.5 text-white">12</td>
                  <td className="py-1.5 text-slate-400">2,640</td>
                  <td className="py-1.5 text-right text-[#10b981] font-semibold">-99.5%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Full Report Action Button */}
          <button
            onClick={onOpenVerification}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#08182b] hover:bg-[#0c223c] border border-[#164373] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <FileText size={14} className="text-white" />
            <span>View Full Report</span>
          </button>
        </div>

        {/* CARD 4: Visualization Controls / 3D Visualization Controls */}
        <div className="bg-[#071524] rounded-xl border border-[#13263b] p-3.5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#0ea5e9]" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              {is3D ? '3D Visualization Controls' : 'Visualization Controls'}
            </h3>
          </div>

          <div className="flex flex-col gap-2.5 my-auto text-xs">
            {/* Data Type */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-300 font-medium">Data Type</span>
              <div className="relative">
                <select
                  value={visualizationConfig.dataType}
                  onChange={(e) => setVisualizationConfig(prev => ({ ...prev, dataType: e.target.value }))}
                  className="w-full bg-[#0a1c2e] text-slate-100 rounded-lg border border-[#18344e] px-3 py-1.5 appearance-none focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
                >
                  <option value="subsidence">Land Subsidence</option>
                  <option value="head">Groundwater Level</option>
                  <option value="compaction">Aquifer Compaction</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Time Slice */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-300 font-medium">Time Slice</span>
              <div className="relative">
                <select
                  value={visualizationConfig.timeSlice}
                  onChange={(e) => setVisualizationConfig(prev => ({ ...prev, timeSlice: e.target.value }))}
                  className="w-full bg-[#0a1c2e] text-slate-100 rounded-lg border border-[#18344e] px-3 py-1.5 appearance-none focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
                >
                  <option value="2050">2050</option>
                  <option value="2040">2040</option>
                  <option value="2030">2030</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <span className="text-slate-300 font-medium">Opacity</span>
              <input
                type="range"
                min="10"
                max="100"
                value={visualizationConfig.opacity || 70}
                onChange={(e) => setVisualizationConfig(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                className="flex-1 h-1.5 bg-[#0d243b] rounded-lg appearance-none cursor-pointer accent-[#0ea5e9]"
              />
              <span className="font-mono text-slate-300 text-right w-8">
                {visualizationConfig.opacity || 70}%
              </span>
            </div>

            {/* Color Scale */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-300 font-medium">Color Scale</span>
              <div className="relative">
                <select
                  value={visualizationConfig.colorScale}
                  onChange={(e) => setVisualizationConfig(prev => ({ ...prev, colorScale: e.target.value }))}
                  className="w-full bg-[#0a1c2e] text-slate-100 rounded-lg border border-[#18344e] px-3 py-1.5 appearance-none focus:outline-none focus:border-[#0ea5e9] cursor-pointer"
                >
                  <option value="Standard">Standard</option>
                  <option value="Jet">Jet / Turbo</option>
                  <option value="Viridis">Viridis</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Reset View Button */}
          <button
            onClick={onResetView}
            className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#08182b] hover:bg-[#0c223c] border border-[#18344e] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <RotateCcw size={14} />
            <span>Reset View</span>
          </button>
        </div>

      </div>
    </section>
  );
}
