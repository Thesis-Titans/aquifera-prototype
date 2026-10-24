import React, { useMemo, useState, useRef } from 'react';
import {
  TrendingUp,
  Target,
  FileText,
  SlidersHorizontal,
  ArrowDown,
  Droplet,
  Lock,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Download,
  BarChart3,
  Minimize2
} from 'lucide-react';
import { computeGroundwaterState, HYDRO_PARAMS } from '../../../physics/groundwaterPhysics';
import { QUANTITIES, COLOR_SCALES, profileThroughWell, quantityMax, exportGeoJSON } from '../../../physics/fields';
import { DEFAULT_PARAMS } from '../../scenarios/hooks/useScenarioState';

// Reference run for the comparison table: the baseline preset, computed with the same model.
const BASELINE_STATE = computeGroundwaterState(DEFAULT_PARAMS);

const PANEL = 'bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 lg:p-5 flex flex-col justify-between gap-3.5 shadow-xl min-w-0';
const SELECT = 'w-full bg-slate-950 text-slate-100 text-xs rounded-xl border border-slate-800 px-3 py-2 appearance-none focus:outline-none focus:border-cyan-400 cursor-pointer shadow-xs';

function PanelHeader({ icon: Icon, title, badge, badgeClass = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={16} className="text-cyan-400 shrink-0" />
        <h3 className="text-xs font-bold text-white tracking-wide uppercase truncate">{title}</h3>
      </div>
      {badge && (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${badgeClass}`}>{badge}</span>
      )}
    </div>
  );
}

function niceCeil(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** West–east profile through the primary well, live scenario against the captured scenario. */
function ProfileChart({ live, captured, quantityKey, thresholdDrawdown }) {
  const q = QUANTITIES[quantityKey];
  const W = 340, H = 155, L = 42, R = 15, T = 12, B = 28;
  const yMax = niceCeil(Math.max(...live.map(p => p.value), ...captured.map(p => p.value), q.max * 0.02));
  const sx = xKm => L + ((xKm + 1.6) / 3.2) * (W - L - R);
  const sy = v => T + (1 - v / yMax) * (H - T - B);
  const path = pts => pts.map((p, k) => `${k ? 'L' : 'M'}${sx(p.xKm).toFixed(1)},${sy(p.value).toFixed(1)}`).join(' ');
  const yTicks = [0, yMax / 2, yMax];
  const xTicks = [-1.6, -0.8, 0, 0.8, 1.6];
  const showThreshold = quantityKey === 'drawdown' && thresholdDrawdown < yMax;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
      aria-label={`${q.label} along the west–east line through the well. Maximum ${Math.max(...live.map(p => p.value)).toFixed(1)} ${q.unit}.`}>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="rgba(148,163,184,0.12)" />
          <text x={L - 5} y={sy(t) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="JetBrains Mono, monospace">{+t.toFixed(1)}</text>
        </g>
      ))}
      {xTicks.map(t => (
        <text key={t} x={sx(t)} y={H - 12} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="JetBrains Mono, monospace">{t}</text>
      ))}
      <text x={(L + W - R) / 2} y={H - 1} textAnchor="middle" fontSize="9.5" fill="#64748b">Distance from center, west to east (km)</text>
      {showThreshold && (
        <g>
          <line x1={L} x2={W - R} y1={sy(thresholdDrawdown)} y2={sy(thresholdDrawdown)} stroke="#f59e0b" strokeDasharray="4 3" />
          <text x={W - R - 2} y={sy(thresholdDrawdown) - 3} textAnchor="end" fontSize="9" fill="#f59e0b">Preconsolidation threshold</text>
        </g>
      )}
      <path d={path(captured)} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d={path(live)} fill="none" stroke="#22d3ee" strokeWidth="2.2" />
    </svg>
  );
}

function deltaText(now, ref) {
  if (Math.abs(ref) < 1e-9) return now > 0 ? 'new' : '0%';
  const pct = ((now - ref) / ref) * 100;
  return `${pct > 0 ? '+' : ''}${pct.toFixed(0)}%`;
}

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BottomAnalyticsSuite({
  physicalState,
  params,
  onSetParam,
  capturedScenario,
  hasUncapturedChanges = false,
  onOpenVerification,
  onResetScenario,
  visualizationConfig,
  setVisualizationConfig,
  is3D = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeResultsTab, setActiveResultsTab] = useState('subsidence');
  const sectionRef = useRef(null);
  const captured = capturedScenario?.physicalState || physicalState;

  const handleExpand = () => {
    setIsCollapsed(false);
    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  const liveProfile = useMemo(() => profileThroughWell(physicalState, activeResultsTab), [physicalState, activeResultsTab]);
  const capturedProfile = useMemo(() => profileThroughWell(captured, activeResultsTab), [captured, activeResultsTab]);

  const summary = (state) => ({
    subsidence: quantityMax(state, 'subsidence'),
    drawdown: state.maxDrawdown,
    inelastic: quantityMax(state, 'inelastic')
  });
  const live = useMemo(() => summary(physicalState), [physicalState]);
  const cap = useMemo(() => summary(captured), [captured]);
  const base = useMemo(() => summary(BASELINE_STATE), []);
  const thresholdDrawdown = HYDRO_PARAMS.initialHead - physicalState.preconsolidationHead;

  const months = Math.max(1, Math.round((params.pumpingDays || 180) / 30));

  const comparisonRows = [
    { label: 'Max subsidence', unit: 'cm', now: cap.subsidence, ref: base.subsidence, d: 1 },
    { label: 'Max head drawdown', unit: 'm', now: cap.drawdown, ref: base.drawdown, d: 1 },
    { label: 'Max permanent compaction', unit: 'cm', now: cap.inelastic, ref: base.inelastic, d: 1 },
    { label: 'Total extraction', unit: 'm³/d', now: capturedScenario?.params?.pumpingRate ?? params.pumpingRate, ref: DEFAULT_PARAMS.pumpingRate, d: 0 },
    { label: 'Pumping duration', unit: 'days', now: capturedScenario?.params?.pumpingDays ?? params.pumpingDays, ref: DEFAULT_PARAMS.pumpingDays, d: 0 }
  ];

  // Task S1.3: Dual Export suite - Cross-Section Profile CSV with metadata
  const handleExportProfileCSV = () => {
    const q = QUANTITIES[activeResultsTab];
    let csv = '# AQUIFERA BSIT THESIS RESEARCH PROTOTYPE\n';
    csv += '# Content: West-to-East Cross-Section Subsidence Profile Data\n';
    csv += '# Disclaimer: Synthetic analytical demonstration output (not USGS MODFLOW 6 or PINO output)\n';
    csv += `# Scenario Extraction Rate: ${params.pumpingRate} m3/d\n`;
    csv += `# Pumping Duration: ${params.pumpingDays} days\n`;
    csv += `# Hydraulic Conductivity: ${params.hydraulicConductivity} m/d\n`;
    csv += `# Selected Quantity: ${q.label} (${q.unit})\n`;
    csv += `# Export Timestamp: ${new Date().toISOString()}\n`;
    csv += 'Distance_km,Distance_m,Live_Scenario_Value,Captured_Baseline_Value,Unit\n';
    liveProfile.forEach((p, idx) => {
      const capVal = capturedProfile[idx]?.value ?? 0;
      csv += `${p.xKm},${(p.xKm * 1000).toFixed(0)},${p.value.toFixed(3)},${capVal.toFixed(3)},${q.unit}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquifera_profile_${activeResultsTab}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If dock is minimized, render compact telemetry ribbon
  if (isCollapsed) {
    return (
      <section ref={sectionRef} id="bottom-analytics-suite" className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-5 py-2.5 scroll-mt-16 shadow-xl flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2 font-bold text-white">
            <BarChart3 size={15} className="text-cyan-400" />
            <span>Telemetry Dock</span>
          </div>
          <div className="h-3.5 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400">Subsidence:</span>
            <strong className="text-white font-mono">{live.subsidence.toFixed(1)} cm</strong>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400">Head Drawdown:</span>
            <strong className="text-white font-mono">{live.drawdown.toFixed(1)} m</strong>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400">Permanent Compaction:</span>
            <strong className="text-cyan-300 font-mono">{live.inelastic.toFixed(1)} cm</strong>
          </div>
        </div>

        <button
          onClick={handleExpand}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors cursor-pointer border border-slate-700 shadow-xs"
          title="Expand Analytics Suite"
        >
          <ChevronUp size={14} />
          <span>Expand Analytics</span>
        </button>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="bottom-analytics-suite" className="scroll-mt-16 flex flex-col gap-2">
      {/* Dock Header with Minimize Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <BarChart3 size={15} className="text-cyan-400" />
          <span>Analytical Suite & Cross-Section Telemetry</span>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          title="Minimize Analytics to Ribbon"
        >
          <Minimize2 size={13} />
          <span>Minimize Dock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* CARD 1: Profile chart */}
        <div className={PANEL}>
          <PanelHeader icon={TrendingUp} title="Profile Through Well" badge="LIVE" />
          <div role="tablist" aria-label="Profile quantity" className="flex items-center gap-3 text-xs font-medium border-b border-slate-800/80">
            {Object.entries(QUANTITIES).map(([key, q]) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeResultsTab === key}
                onClick={() => setActiveResultsTab(key)}
                className={`pb-1.5 transition-colors cursor-pointer ${activeResultsTab === key
                  ? 'text-white border-b-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'}`}
              >
                {key === 'inelastic' ? 'Permanent' : q.label.replace('Land ', '').replace('Head ', '')}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-300 font-medium">
            {QUANTITIES[activeResultsTab].label} ({QUANTITIES[activeResultsTab].unit})
          </div>
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <ProfileChart live={liveProfile} captured={capturedProfile} quantityKey={activeResultsTab} thresholdDrawdown={thresholdDrawdown} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-0.5 bg-cyan-400 inline-block" /> Live</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 border-t border-dashed border-slate-400 inline-block" /> Captured</span>
            </div>
            <button
              onClick={handleExportProfileCSV}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[11px] cursor-pointer hover:underline"
              title="Export profile cross-section as CSV"
            >
              <Download size={12} /> CSV
            </button>
          </div>
        </div>

        {/* CARD 2: Live results and proposal targets */}
        <div className={PANEL}>
          <PanelHeader icon={Target} title="Scenario Telemetry" badge="ANALYTICAL PREVIEW" />
          <div className="flex flex-col gap-2.5">
            {[
              { icon: ArrowDown, label: 'Maximum Land Subsidence', value: `${live.subsidence.toFixed(1)} cm` },
              { icon: Droplet, label: 'Maximum Head Drawdown', value: `${live.drawdown.toFixed(1)} m` },
              { icon: Lock, label: 'Permanent Inelastic Compaction', value: `${live.inelastic.toFixed(1)} cm`,
                note: physicalState.isPreconsolidationBreached ? 'Preconsolidation breached' : 'Elastic range' }
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <r.icon size={15} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-slate-400">{r.label}</span>
                  <span className="text-base font-bold text-white leading-tight font-mono">{r.value}</span>
                </div>
                {r.note && (
                  <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border font-mono font-semibold ${
                    physicalState.isPreconsolidationBreached ? 'bg-amber-950/80 text-amber-300 border-amber-500/30' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    {r.note}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto border-t border-slate-800/80 pt-2">
            <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Proposed Acceptance Criteria (Proposal Table 1)</div>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[11px]">
              <dt className="text-slate-400">Surrogate response time</dt><dd className="font-mono text-cyan-300 text-right font-bold">&lt; 250 ms</dd>
              <dt className="text-slate-400">Median speedup vs MODFLOW 6</dt><dd className="font-mono text-cyan-300 text-right font-bold">&ge; 50×</dd>
              <dt className="text-slate-400">Relative L₂ error (head, compaction)</dt><dd className="font-mono text-cyan-300 text-right font-bold">&le; 5%</dd>
            </dl>
          </div>
        </div>

        {/* CARD 3: Scenario Comparison */}
        <div className={PANEL}>
          <PanelHeader
            icon={FileText}
            title="Scenario Delta"
            badge={hasUncapturedChanges ? 'PREVIEW ACTIVE' : 'CAPTURED'}
            badgeClass={hasUncapturedChanges ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}
          />
          <div className="text-xs text-slate-300">
            Preset <strong className="text-cyan-300">{capturedScenario?.preset || 'baseline'}</strong>
            <span className="text-slate-400"> ({capturedScenario?.capturedAt || 'initial'})</span> vs baseline.
          </div>

          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-2 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-medium">
                  <th className="pb-1 font-normal">Metric</th>
                  <th className="pb-1 font-normal text-right">Captured</th>
                  <th className="pb-1 font-normal text-right">Baseline</th>
                  <th className="pb-1 font-normal text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {comparisonRows.map(r => {
                  const better = r.now <= r.ref;
                  return (
                    <tr key={r.label}>
                      <td className="py-1 text-slate-300 font-sans">{r.label} <span className="text-slate-500">({r.unit})</span></td>
                      <td className="py-1 text-white text-right">{Number(r.now).toLocaleString(undefined, { maximumFractionDigits: r.d })}</td>
                      <td className="py-1 text-slate-400 text-right">{Number(r.ref).toLocaleString(undefined, { maximumFractionDigits: r.d })}</td>
                      <td className={`py-1 text-right font-bold ${r.unit === 'cm' || r.unit === 'm' ? (better ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-300'}`}>
                        {deltaText(r.now, r.ref)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={onOpenVerification}
            className="mt-auto w-full h-9 px-3 rounded-xl text-xs font-semibold text-white bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>Planned MODFLOW 6 Verification</span>
          </button>
        </div>

        {/* CARD 4: Visualization Controls */}
        <div className={PANEL}>
          <PanelHeader icon={SlidersHorizontal} title={is3D ? '3D View Controls' : 'Map Controls'} />
          <div className="flex flex-col gap-2.5 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-slate-300 font-medium">Active Layer</span>
              <span className="relative">
                <select
                  value={visualizationConfig.dataType}
                  onChange={(e) => setVisualizationConfig(prev => ({ ...prev, dataType: e.target.value }))}
                  className={SELECT}
                  disabled={is3D}
                >
                  {Object.entries(QUANTITIES).map(([key, q]) => <option key={key} value={key}>{q.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="flex justify-between text-slate-300 font-medium text-[11px]">
                <span>Pumping Duration</span>
                <span className="font-mono text-cyan-300 font-bold">{months} mos ({months * 30} days)</span>
              </span>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={months}
                onChange={(e) => onSetParam('pumpingDays', Number(e.target.value) * 30)}
                aria-valuetext={`${months} months`}
                className="w-full cursor-pointer accent-cyan-400"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="flex justify-between text-slate-300 font-medium text-[11px]">
                <span>Layer Opacity</span>
                <span className="font-mono text-slate-300">{visualizationConfig.opacity}%</span>
              </span>
              <input
                type="range"
                min="10"
                max="100"
                value={visualizationConfig.opacity}
                onChange={(e) => setVisualizationConfig(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                className="w-full cursor-pointer accent-cyan-400"
                disabled={is3D}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-slate-300 font-medium">Colormap</span>
              <span className="relative">
                <select
                  value={visualizationConfig.colorScale}
                  onChange={(e) => setVisualizationConfig(prev => ({ ...prev, colorScale: e.target.value }))}
                  className={SELECT}
                  disabled={is3D}
                >
                  {Object.entries(COLOR_SCALES).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
              </span>
            </label>
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onResetScenario}
                className="h-8.5 px-2 rounded-xl text-xs font-semibold text-white bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw size={13} className="text-cyan-400" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleExportProfileCSV}
                className="h-8.5 px-2 rounded-xl text-xs font-semibold text-white bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="Download cross-section profile data as CSV"
              >
                <Download size={13} className="text-amber-400" />
                <span>Profile CSV</span>
              </button>
            </div>
            <button
              onClick={() => downloadJSON(exportGeoJSON(physicalState, params), 'aquifera_synthetic_demo.geojson')}
              className="h-8.5 px-2 rounded-xl text-xs font-semibold text-white bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs w-full"
              title="Download full 3D simulation result grid as RFC 7946 GeoJSON"
            >
              <Download size={13} className="text-cyan-400" />
              <span>Export Full Field GeoJSON</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
