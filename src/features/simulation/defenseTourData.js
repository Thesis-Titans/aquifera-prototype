/**
 * AQUIFERA Defense Tour Steps Specification
 * Grounded in BSIT Thesis Category 4 (Simulation & Modeling)
 * Silent Compliance: Strictly aligns with physical domain and verification criteria.
 */

export const DEFENSE_STEPS = [
  {
    step: 1,
    title: 'Baseline Hydrologic State',
    subtitle: 'Nominal Municipal Extraction (Theis + Terzaghi)',
    badge: 'Baseline State',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    narrative:
      "Under baseline municipal pumping stress (Q = 12,000 m³/d across municipal production wells), hydraulic head stabilizes at 77.9 m AMSL, resulting in a baseline ground subsidence of 6.0 cm. The analytical engine evaluates the solution in ~2 ms. The discrete Terzaghi PDE residual evaluator confirms mass continuity compliance (η = 0.021 < τ = 0.15), remaining safely within the numerical trust envelope.",
    stateBadge: 'Q = 12,000 m³/d | s_max = 6.0 cm | η = 0.021',
    preset: 'baseline',
    engineId: 'analytical',
    perturb: false,
    viewMode: 'split'
  },
  {
    step: 2,
    title: 'Commercial Corridor Stress Breach',
    subtitle: 'Preconsolidation Breach & Accelerated Inelastic Compaction',
    badge: 'Inelastic Compaction',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    narrative:
      "Intensive clustered pumping along the Mandurriao commercial corridor (Q = 18,000 m³/d across 2 production wells) triggers an acute piezometric head drop below 73 m AMSL, accelerating skeletal rearrangement in compressible clay interbed Layer 3 (Δb_inelastic > 0.00 mm). Notice the steepened subsidence cone in the 2D heatmap and red plastic compaction highlight on the 3D cutaway face.",
    stateBadge: 'Q = 18,000 m³/d | Δb_inel > 0.0 mm | Preconsolidation Breached',
    preset: 'corridor',
    engineId: 'analytical',
    perturb: false,
    viewMode: 'split'
  },
  {
    step: 3,
    title: 'AI Verification & Safe Fallback',
    subtitle: 'NIST AI RMF 1.0 Residual-Gated Automated Redirection',
    badge: 'NIST AI RMF 1.0 Safe Fallback',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    narrative:
      "Demonstrates real-time PINO surrogate inference (< 5 ms) backed by automated safe fallback. When surrogate predictions incur high numerical discrepancy or out-of-distribution stress, the discrete Terzaghi PDE mass continuity evaluator detects residual violation (η = 0.287 > τ = 0.15). Instantly, the NIST AI RMF 1.0 safe-fallback mechanism triggers, suppressing the unverified neural tensor and falling back directly to the verified USGS MODFLOW 6 CSUB baseline proxy.",
    stateBadge: 'PINO Forward (< 5ms) | η = 0.287 > τ = 0.15 | MODFLOW 6 Fallback',
    preset: 'corridor',
    engineId: 'pino',
    perturb: true,
    viewMode: 'split'
  }
];
