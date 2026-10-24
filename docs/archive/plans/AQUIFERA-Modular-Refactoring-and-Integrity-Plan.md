# AQUIFERA: Modular Refactoring, Architecture Boundaries, and Scientific Integrity Plan

> **Status:** SUPERSEDED by [`../../plans/SPRINT-PLAN.md`](../../plans/SPRINT-PLAN.md) (October 24, 2026). Retained for historical design reference only.

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*  
*Plan Status: COMPLETED | Execution Commit: 2698a64 (Branch: main)*

---

## 1. Executive Summary and Problem Statement

Following the successful deployment of the **MapLibre GL JS** 2D GIS basemap and the **Three.js** 3D subsurface cutaway stage, the AQUIFERA prototype has established its core visual foundation. However, an in-depth codebase audit reveals technical and architectural debt that must be addressed before multi-member collaborative development proceeds:

1. **Dead Legacy Code (38.1 KB):** Three large components (`ControlsPanel.jsx`, `MetroIloilo2DMap.jsx`, and `MapLayersOverlay.jsx`) remain in `src/components/` despite having zero active imports, creating confusion for developers and evaluators.
2. **State Entanglement in the App Shell:** `src/App.jsx` directly coordinates scenario parameters, timer states, preset mutations, physics recalculation, and layout rendering. Any team member editing parameters or charts must modify `App.jsx`, risking frequent git merge conflicts.
3. **Missing Defense Documentation Artifacts:** While the UI now displays clear disclaimer badges, the project lacks formal documentation defining dataset origins (`DATA-PROVENANCE.md`) and the operational boundaries between client-side demonstration math and backend verification pipelines (`SCIENTIFIC-VALIDATION.md`).

This plan outlines a controlled, 5-phase refactoring roadmap that resolves architectural debt without breaking working features.

---

## 2. Component Inventory and Hygiene Strategy

### 2.1 Active Component Map
```text
src/
├── App.jsx                        # Layout composer & modal orchestrator
├── main.jsx                       # React 19 root entrypoint
├── index.css                      # Tailwind v4, MapLibre styles & design tokens
├── components/
│   ├── TopNavigation.jsx          # Brand header, view navigation, export actions
│   ├── ScenarioSetupPanel.jsx     # Scenario presets & hydrological sliders
│   ├── CentralViewport.jsx        # Dual-mode container (MapLibre ⇄ Three.js)
│   ├── MapLibreMap.jsx            # 2D GIS map, GeoJSON grid & cell inspector
│   ├── Aquifer3DCanvas.jsx        # 3D Three.js stratified geotechnical mesh
│   ├── DualBenchmarkHUD.jsx       # Benchmark targets telemetry overlay
│   ├── BottomAnalyticsSuite.jsx   # Cross-section heatmap & time-series hydrograph
│   ├── VerificationModal.jsx      # Tier 4 FloPy / MODFLOW 6 demonstration dialog
│   └── GuideModal.jsx             # Research background & architectural guide
├── data/
│   ├── metroIloiloGIS.js          # Geographic coordinates & district metadata
│   └── scenarioPresets.js         # Hydrogeological reference presets
└── physics/
    └── groundwaterPhysics.js      # Theis radial drawdown & Terzaghi 1D consolidation
```

### 2.2 Confirmed Dead Components to Archive
The following files have 0 incoming imports across the entire workspace:

| File Name | File Size | Original Purpose | Current Replacement | Action |
| :--- | :--- | :--- | :--- | :--- |
| **`ControlsPanel.jsx`** | 24,483 B | Early monolithic parameter sidebar | `ScenarioSetupPanel.jsx` | Retire / Archive |
| **`MetroIloilo2DMap.jsx`** | 8,865 B | Hardcoded 2D canvas drawing | `MapLibreMap.jsx` | Retire / Archive |
| **`MapLayersOverlay.jsx`** | 4,808 B | Floating layer toggle checklist | Integrated into MapLibre & Three.js toolbars | Retire / Archive |

**Total Dead Code Elimination:** 38,156 bytes (~38 KB).

---

## 3. State Modularization: The `useScenarioState` Hook

### 3.1 Design Contract
To separate layout composition from scenario mutation logic, extract all reactive hydrological parameters into a dedicated custom hook: `src/hooks/useScenarioState.js`.

```mermaid
flowchart TD
    Hook["useScenarioState Hook<br/>(State, Validation & Physics Execution)"]
    Hook -->|"params & physicalState"| App["App.jsx (Layout Shell)"]
    App -->|"setParam, applyPreset"| Panel["ScenarioSetupPanel.jsx"]
    App -->|"physicalState"| Viewport["CentralViewport.jsx (2D / 3D)"]
    App -->|"physicalState & history"| Analytics["BottomAnalyticsSuite.jsx"]
```

### 3.2 State Interface Specification
```javascript
export function useScenarioState() {
  // 1. Authoritative Parameter State
  // { pumpingRate, hydraulicConductivity, specificStorage, rechargeRateMmYear, ... }
  
  // 2. Deterministic Physical State
  // computeGroundwaterState(params) -> maxDrawdownM, maxSubsidenceCm, isPlastic, ...
  
  // 3. Status and Presets
  // activePreset, isSimulating, lastUpdatedTimestamp
  
  // 4. Action Handlers
  // setParam(key, value), applyPreset(presetId), runDemonstration(), resetToBaseline()
  
  return {
    params,
    physicalState,
    isSimulating,
    activePreset,
    setParam,
    applyPreset,
    runDemonstration,
    resetToBaseline
  };
}
```

---

## 4. Academic Defense Documentation Standards

To protect Group 2 during proposal and defense questioning, two canonical markdown artifacts will be added to `docs/`:

### 4.1 `docs/DATA-PROVENANCE.md`
* **Cartographic Base:** OpenStreetMap and CARTO Dark Matter raster tiles (WGS84 / PRS92 alignment, zero API key requirement, open redistribution terms).
* **Geographic Extent:** Metro Iloilo deltaic plain bounded by 10.665 N to 10.775 N and 122.495 E to 122.625 E.
* **District Centroids:** Document exact geographic coordinates for Mandurriao (`10.7165, 122.5480`), City Proper (`10.6975, 122.5725`), Jaro (`10.7380, 122.5560`), Molo (`10.7010, 122.5390`), La Paz (`10.7120, 122.5760`), and Leganes (`10.7650, 122.5920`).
* **Geotechnical Assumptions:** Stratified layer depths (0 to 30 m sand, 30 to 60 m marine clay, 60 to 120 m confined aquifer) cited against regional hydrogeological literature.
* **Integrity Classification:** Explicitly labels all grid cell values as deterministic synthetic models for demonstration.

### 4.2 `docs/SCIENTIFIC-VALIDATION.md`
* **Validation Hierarchy:** Formally defines the four tiers of computing validation:
  1. *Tier 1 (Browser Demonstration):* Client-side closed-form analytical approximations for interactive exploration.
  2. *Tier 2 (Physical Verification):* Automated mass conservation tests verifying that fluid outflow matches storage depletion without unphysical rebound.
  3. *Tier 3 (Neural Operator Training):* Offline 3D Fourier Neural Operator (PINO) trained on high-performance compute against synthetic MODFLOW 6 datasets.
  4. *Tier 4 (Gold Standard Numerical Ground Truth):* USGS MODFLOW 6 CSUB finite-difference simulation via FloPy.
* **Defense Talking Points:** Provides ready answers for panel questions regarding the difference between client-side demonstration data and backend numerical verification.

---

## 5. Parallel Team Ownership (BSIT Group 2)

To prevent file collision and git merge conflicts among the 5 group members, responsibilities are partitioned along feature boundaries:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MARK ALVIN C. CADANGIN (Lead)                        │
│   • App.jsx, TopNavigation.jsx, useScenarioState.js, CI & Build       │
└──────────────┬──────────────────────────┬──────────────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐ ┌──────────────────────────────────────┐
│     NHERIE C. ACEBUCHE       │ │       JUSTIN ACE A. ARDEÑA           │
│ • ScenarioSetupPanel.jsx     │ │ • MapLibreMap.jsx                    │
│ • Presets & Sliders          │ │ • GeoJSON Subsidence Grids           │
│ • Input Validation           │ │ • Geographic Coordinates & Legends   │
└──────────────────────────────┘ └──────────────────────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐ ┌──────────────────────────────────────┐
│ MAE DANIELLA FAITH BENJAMIN  │ │      VINCENT JOHN A. TAMAÑO          │
│ • Aquifer3DCanvas.jsx        │ │ • BottomAnalyticsSuite.jsx           │
│ • Three.js Strata & Cutaway  │ │ • VerificationModal.jsx              │
│ • Shader Mesh Deformation    │ │ • Scientific Documentation & Tests   │
└──────────────────────────────┘ └──────────────────────────────────────┘
```

---

## 6. Phased Implementation Roadmap (Execution Record)

### Phase 1: Repository Hygiene and Dead Code Retirement [COMPLETED]
- [x] **Action:** Move the 3 confirmed dead components (`ControlsPanel.jsx`, `MetroIloilo2DMap.jsx`, `MapLayersOverlay.jsx`) into archive directory `docs/archive/legacy-components/`.
- [x] **Gate:** Verified `npm run build` succeeds (511 ms) and `npm run lint` reports 0 errors.

### Phase 2: State Modularization (`useScenarioState`) [COMPLETED]
- [x] **Action:** Create `src/hooks/useScenarioState.js` containing authoritative state management, preset definitions, and reactive physics calculations.
- [x] **Action:** Refactor `src/App.jsx` and `src/components/ScenarioSetupPanel.jsx` to consume `useScenarioState`.
- [x] **Gate:** Ensured changing pumping rate or presets updates the 2D map, 3D cutaway, and analytics charts deterministically.

### Phase 3: Defense Documentation Suite [COMPLETED]
- [x] **Action:** Authored `docs/DATA-PROVENANCE.md` detailing coordinates, tile sources, and soil strata parameters.
- [x] **Action:** Authored `docs/SCIENTIFIC-VALIDATION.md` detailing the 4-tier validation hierarchy and defense talking points.
- [x] **Action:** Updated `docs/README.md` to link to these new records and archive structure.
- [x] **Gate:** Verified zero em dashes across all created markdown and codebase files.

### Phase 4: Layout and Ergonomics Validation [COMPLETED]
- [x] **Action:** Tested responsive behavior across desktop and laptop viewport bounds.
- [x] **Action:** Fixed React compiler ref-during-render warnings in `Aquifer3DCanvas.jsx` and removed dead imports.
- [x] **Gate:** Production build passes in 511 ms with zero errors.

### Phase 5: Version Control Sync [COMPLETED]
- [x] **Action:** Staged all changes under conventional commit message:  
  `refactor(prototype): isolate useScenarioState hook, archive legacy components, and add defense docs`
- [x] **Action:** Pushed cleanly to `origin/main` on `Thesis-Titans/aquifera-prototype.git` (Commit: `2698a64`).

---

## 7. Next Execution Milestone: UI/UX, HCI, and Design System Standardization

With state isolated and legacy debt eliminated, the project advances to **Milestone 2**:
* Canonical Plan: [`docs/plans/AQUIFERA-UI-UX-HCI-Audit-and-Design-System-Plan.md`](file:///c:/Users/markc/_Projects/capstone-research/BSIT%20Capstone%20Research/01-concepts/01-aquifera/05-artifacts/aquifera-prototype/docs/plans/AQUIFERA-UI-UX-HCI-Audit-and-Design-System-Plan.md)
* **Phase A & B Objectives**:
  1. Consolidate styling tokens in `src/index.css` (eliminating duplicate `@theme` vs `:root` variables and arbitrary hex colors).
  2. Implement reusable UI primitives (`StatusBadge`, `Button`, `FormField`, `Panel`).
  3. Establish explicit responsive layout behavior across laptop (1366x768), tablet (1024x768), and desktop viewports.
  4. Ensure WCAG 2.2 AA accessibility: visible focus rings, readable typography ($\ge 12\text{px}$), and keyboard-navigable controls.
