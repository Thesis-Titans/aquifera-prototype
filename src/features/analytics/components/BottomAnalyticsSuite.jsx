import React, { useMemo, useState } from 'react';
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
  ShieldCheck,
  Download
} from 'lucide-react';
import { computeGroundwaterState, HYDRO_PARAMS } from '../../../physics/groundwaterPhysics';
import { QUANTITIES, COLOR_SCALES, profileThroughWell, quantityMax, exportGeoJSON } from '../../../physics/fields';
import { DEFAULT_PARAMS } from '../../scenarios/hooks/useScenarioState';

// Reference run for the comparison table: the baseline preset, computed with the same model.
const BASELINE_STATE = computeGroundwaterState(DEFAULT_PARAMS);

const PANEL = 'bg-[#071524] rounded-xl border border-[#13263b] p-4 flex flex-col gap-3 shadow-xl min-w-0';
const SELECT = 'w-full bg-[#0a1c2e] text-slate-100 text-xs rounded-lg border border-[#18344e] px-3 py-2 appearance-none focus:outline-none focus-visible:border-[#0ea5e9] focus-visible:ring-1 focus-visible:ring-[#0ea5e9] cursor-pointer';

function PanelHeader({ icon: Icon, title, badge, badgeClass = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={16} className="text-[#0ea5e9] shrink-0" />
        <h3 className="text-sm font-bold text-white tracking-wide truncate">{title}</h3>
      </div>
      {badge && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${badgeClass}`}>{badge}</span>
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
  const W = 320, H = 150, L = 40, R = 10, T = 10, B = 26;
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
          <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="rgba(148,163,184,0.15)" />
          <text x={L - 5} y={sy(t) + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="JetBrains Mono, monospace">{+t.toFixed(1)}</text>
        </g>
      ))}
      {xTicks.map(t => (
        <text key={t} x={sx(t)} y={H - 12} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="JetBrains Mono, monospace">{t}</text>
      ))}
      <text x={(L + W - R) / 2} y={H - 1} textAnchor="middle" fontSize="10" fill="#94a3b8">Distance from domain centre, west to east (km)</text>
      {showThreshold && (
        <g>
          <line x1={L} x2={W - R} y1={sy(thresholdDrawdown)} y2={sy(thresholdDrawdown)} stroke="#f59e0b" strokeDasharray="4 3" />
          <text x={W - R - 2} y={sy(thresholdDrawdown) - 3} textAnchor="end" fontSize="9.5" fill="#f59e0b">Preconsolidation threshold</text>
        </g>
      )}
      <path d={path(captured)} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
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
  const [activeResultsTab, setActiveResultsTab] = useState('subsidence');
  const captured = capturedScenario?.physicalState || physicalState;

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

  return (
    <section id="bottom-analytics-suite" className="bg-[#06111e] border-t border-[#122336] px-4 lg:px-6 py-4 scroll-mt-16">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-[1920px] mx-auto">

        {/* CARD 1: Profile chart */}
        <div className={PANEL}>
          <PanelHeader icon={TrendingUp} title="Profile Through the Well" badge="LIVE" />
          <div role="tablist" aria-label="Profile quantity" className="flex items-center gap-3 text-xs font-medium border-b border-[#13263b]">
            {Object.entries(QUANTITIES).map(([key, q]) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeResultsTab === key}
                onClick={() => setActiveResultsTab(key)}
                className={`pb-1.5 transition-colors cursor-pointer ${activeResultsTab === key
                  ? 'text-white border-b-2 border-[#0ea5e9] font-semibold'
                  : 'text-slate-400 hover:text-slate-200'}`}
              >
                {key === 'inelastic' ? 'Permanent' : q.label.replace('Land ', '').replace('Head ', '')}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-300">
            {QUANTITIES[activeResultsTab].label} ({QUANTITIES[activeResultsTab].unit})
          </div>
          <ProfileChart live={liveProfile} captured={capturedProfile} quantityKey={activeResultsTab} thresholdDrawdown={thresholdDrawdown} />
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-cyan-400 inline-block" /> Live scenario</span>
              <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-slate-400 inline-block" /> Captured scenario</span>
            </div>
            <button
              onClick={handleExportProfileCSV}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono text-[10px] cursor-pointer hover:underline"
              title="Export profile cross-section as CSV"
            >
              <Download size={11} /> CSV
            </button>
          </div>
        </div>

        {/* CARD 2: Live results and proposal targets */}
        <div className={PANEL}>
          <PanelHeader icon={Target} title="Scenario Results" badge="SIMPLIFIED MODEL" />
          <div className="flex flex-col gap-2.5">
            {[
              { icon: ArrowDown, label: 'Maximum land subsidence', value: `${live.subsidence.toFixed(1)} cm` },
              { icon: Droplet, label: 'Maximum head drawdown', value: `${live.drawdown.toFixed(1)} m` },
              { icon: Lock, label: 'Maximum permanent compaction', value: `${live.inelastic.toFixed(1)} cm`,
                note: physicalState.isPreconsolidationBreached ? 'Preconsolidation head breached' : 'Elastic range only' }
            ].map(r => (
              <div key={r.label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#0a1e35] border border-[#164373] flex items-center justify-center text-[#38bdf8] shrink-0">
                  <r.icon size={15} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-slate-300">{r.label}</span>
                  <span className="text-base font-bold text-white leading-tight font-mono">{r.value}</span>
                </div>
                {r.note && <span className="ml-auto text-[11px] text-slate-400 text-right">{r.note}</span>}
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-2">
            <div className="text-xs font-semibold text-slate-200 mb-1.5">Proposed acceptance criteria (not yet measured)</div>
            <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
              <dt className="text-slate-400">Surrogate response time</dt><dd className="font-mono text-cyan-300 text-right">&lt; 250 ms</dd>
              <dt className="text-slate-400">Median speedup vs MODFLOW 6 CSUB</dt><dd className="font-mono text-cyan-300 text-right">&ge; 50×</dd>
              <dt className="text-slate-400">Relative L₂ error (head, compaction)</dt><dd className="font-mono text-cyan-300 text-right">&le; 5%</dd>
              <dt className="text-slate-400">MODFLOW 6 CSUB run time (pilot)</dt><dd className="font-mono text-slate-200 text-right">4.5–96 s</dd>
            </dl>
          </div>
        </div>

        {/* CARD 3: Scenario Comparison */}
        <div className={PANEL}>
          <PanelHeader
            icon={FileText}
            title="Scenario Comparison"
            badge={hasUncapturedChanges ? 'NOT CAPTURED' : 'CAPTURED'}
            badgeClass={hasUncapturedChanges ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}
          />
          <div className="text-xs text-slate-300">
            Captured scenario <strong className="text-cyan-300">{capturedScenario?.preset || 'baseline'}</strong>
            <span className="text-slate-400"> ({capturedScenario?.capturedAt || 'initial'})</span> against the baseline preset.
            {hasUncapturedChanges && (
              <div className="text-[11px] text-amber-300/90 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/25 mt-1.5">
                The live scenario has changed. Use "Capture Scenario" to compare it.
              </div>
            )}
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#18344e] text-[11px] text-slate-400">
                <th className="pb-1 font-normal">Metric</th>
                <th className="pb-1 font-normal text-right">Captured</th>
                <th className="pb-1 font-normal text-right">Baseline</th>
                <th className="pb-1 font-normal text-right">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13263b] font-mono">
              {comparisonRows.map(r => {
                const better = r.now <= r.ref;
                return (
                  <tr key={r.label}>
                    <td className="py-1 text-slate-300 font-sans">{r.label} <span className="text-slate-500">({r.unit})</span></td>
                    <td className="py-1 text-white text-right">{Number(r.now).toLocaleString(undefined, { maximumFractionDigits: r.d })}</td>
                    <td className="py-1 text-slate-400 text-right">{Number(r.ref).toLocaleString(undefined, { maximumFractionDigits: r.d })}</td>
                    <td className={`py-1 text-right ${r.unit === 'cm' || r.unit === 'm' ? (better ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-300'}`}>
                      {deltaText(r.now, r.ref)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            onClick={onOpenVerification}
            className="mt-auto w-full h-9 px-3 rounded-lg text-xs font-semibold text-white bg-[#08182b] hover:bg-[#0c223c] border border-[#164373] hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>Planned MODFLOW 6 verification (demo)</span>
          </button>
        </div>

        {/* CARD 4: Visualization Controls */}
        <div className={PANEL}>
          <PanelHeader icon={SlidersHorizontal} title={is3D ? '3D View Controls' : 'Map Controls'} />
          <div className="flex flex-col gap-3 text-xs">
            <label className="flex flex-col gap-1">
              <span className="text-slate-300 font-medium">Map layer</span>
              <span className="relative">
                <select
                  value={visualizationConfig.dataType}
                  onChange={(e) => setVisualizationConfig(prev => ({ ...prev, dataType: e.target.value }))}
                  className={SELECT}
                  disabled={is3D}
                >
                  {Object.entries(QUANTITIES).map(([key, q]) => <option key={key} value={key}>{q.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
              </span>
            </label>

            <label className="flex flex-col gap-1">
              <span className="flex justify-between text-slate-300 font-medium">
                <span>Elapsed pumping time</span>
                <span className="font-mono text-cyan-300">{months} {months === 1 ? 'month' : 'months'} ({months * 30} days)</span>
              </span>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={months}
                onChange={(e) => onSetParam('pumpingDays', Number(e.target.value) * 30)}
                aria-valuetext={`${months} months`}
                className="w-full cursor-pointer accent-[#0ea5e9]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="flex justify-between text-slate-300 font-medium">
                <span>Layer opacity</span>
                <span className="font-mono text-slate-300">{visualizationConfig.opacity}%</span>
              </span>
              <input
                type="range"
                min="10"
                max="100"
                value={visualizationConfig.opacity}
                onChange={(e) => setVisualizationConfig(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                className="w-full cursor-pointer accent-[#0ea5e9]"
                disabled={is3D}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-slate-300 font-medium">Color scale</span>
              <span className="relative">
                <select
                  value={visualizationConfig.colorScale}
                  onChange={(e) => setVisualizationConfig(prev => ({ ...prev, colorScale: e.target.value }))}
                  className={SELECT}
                  disabled={is3D}
                >
                  {Object.entries(COLOR_SCALES).map(([key, s]) => <option key={key} value={key}>{s.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
              </span>
            </label>
            {is3D && <p className="text-[11px] text-slate-400">Map layer, opacity and colour scale apply to the 2D map.</p>}
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onResetScenario}
                className="h-9 px-2 rounded-lg text-xs font-semibold text-white bg-[#08182b] hover:bg-[#0c223c] border border-[#18344e] hover:border-cyan-500/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <RotateCcw size={14} className="text-cyan-400" />
                <span>Reset scenario</span>
              </button>
              <button
                onClick={handleExportProfileCSV}
                className="h-9 px-2 rounded-lg text-xs font-semibold text-white bg-[#08182b] hover:bg-[#0c223c] border border-[#18344e] hover:border-cyan-500/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400"
                title="Download cross-section profile data as CSV"
              >
                <Download size={14} className="text-amber-400" />
                <span>Profile CSV</span>
              </button>
            </div>
            <button
              onClick={() => downloadJSON(exportGeoJSON(physicalState, params), 'aquifera_synthetic_demo.geojson')}
              className="h-9 px-2 rounded-lg text-xs font-semibold text-white bg-[#08182b] hover:bg-[#0c223c] border border-[#18344e] hover:border-cyan-500/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-cyan-400 w-full"
              title="Download full 3D simulation result grid as RFC 7946 GeoJSON"
            >
              <Download size={14} className="text-cyan-400" />
              <span>Export Full Field GeoJSON</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
