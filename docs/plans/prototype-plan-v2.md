# AQUIFERA Interactive Visualization Prototype: Revised Implementation Plan

Repository: https://github.com/Thesis-Titans/aquifera-prototype  
Supersedes: `AQUIFERA-Prototype-Baseline-Audit-and-Revised-Plan.md`  
Decision: **Reframe and improve the existing implementation; do not rebuild from scratch.**  
Current scope: A convincing, interactive research-demo prototype using deterministic synthetic outputs. This is not yet a validated groundwater model.

## 1. Objective

Build a high-fidelity interactive visualization of the AQUIFERA concept: a groundwater and land-subsidence scenario exploration workspace focused on Metro Iloilo. Users should be able to change illustrative scenario parameters, run a deterministic demonstration, inspect a geographically aligned overlay, explore a conceptual 3D subsurface, scrub the displayed time horizon, inspect locations/cells, and compare scenario outputs across charts and summary panels.

The prototype should look realistic because its geography, map controls, coordinate handling, visual hierarchy, units, legends, and interactions are coherent, not because synthetic scientific values are presented as real observations.

## 2. Non-negotiable integrity rules

- Keep a persistent, legible notice: **RESEARCH PROTOTYPE: OUTPUTS ARE SYNTHETIC DEMONSTRATION DATA; NO VALIDATED PINO OR MODFLOW RUN IS CONNECTED.**
- A real basemap is geographic context, not groundwater or subsidence evidence.
- Do not invent or imply verified district boundaries, well locations, extraction measurements, aquifer properties, geology, or land-subsidence observations.
- Do not display made-up accuracy, RMSE, speedup, significance tests, calibration, or benchmark claims as measured results.
- Use labels such as `Synthetic demonstration`, `Conceptual geometry`, `Illustrative comparison`, and `Not measured` wherever applicable.
- Do not name a demo calculation “PINO” or portray a mock curve as MODFLOW output.
- Each result panel should show the data status, units, selected scenario, time slice, and the source/provenance category.

## 3. User journey the prototype must support

1. Open the workspace with a clear default Metro Iloilo map extent and a visible synthetic-data notice.
2. Select a demonstration scenario preset (e.g., low, medium, or high illustrative pumping) or adjust the exposed parameters.
3. Select a displayed horizon/year using a time control.
4. Click **Run Demonstration**. Show a short, honest state transition (idle → updating demo outputs → updated); do not simulate a numerical solver or imply scientific computation.
5. Observe the same scenario/time selection reflected in the map overlay, 3D conceptual view, charts, metrics, and comparison table.
6. Toggle map layers, adjust overlay opacity, change the displayed variable, zoom/pan, and reset the map.
7. Click an overlay cell to inspect its synthetic value, units, cell identifier, scenario, year, and data-status label.
8. Switch to the conceptual 3D view, orbit/zoom/pan, toggle subsurface layers, adjust vertical exaggeration, select a camera preset, and reset the camera.
9. Compare two illustrative scenarios and see charts/panels update consistently.
10. Reset the entire demonstration to known defaults.

## 4. Recommended frontend stack

Preserve the current Vite + React + Tailwind CSS + Three.js foundation.

- **MapLibre GL JS:** real basemap, geographic pan/zoom, GeoJSON sources, map layers, popups, attribution, and view reset.
- **Existing Three.js + OrbitControls:** interactive conceptual 3D subsurface. Do not migrate to another 3D stack in this pass.
- **Existing chart components / Recharts if already installed:** synchronized time series and comparison plots.
- **TypeScript incrementally (optional but recommended):** define stable scenario/result contracts without requiring a full rewrite.
- **Zod or existing validation approach:** validate scenario parameters at the boundary if the current project lacks a reliable mechanism.
- **Vitest + React Testing Library; Playwright if feasible:** test state logic and critical browser interactions.

Choose a basemap provider only after confirming attribution, terms, quota, API key needs, and acceptable usage. If remote tiles fail, show a clear provider error and keep the rest of the demo usable. Do not hide attribution.

## 5. State and mock-data design

Create a single shared demonstration state rather than allowing each panel to calculate unrelated values.

Suggested conceptual shape:

- `scenarioId`, `scenarioLabel`
- `parameters`: pumping rate and other illustrative parameters with units and allowed ranges
- `selectedYear` and supported year range
- `selectedVariable` (e.g., illustrative subsidence or groundwater-level change)
- `visibleLayers`, `overlayOpacity`, `viewMode`
- `dataStatus: "synthetic_demo"`
- `resultVersion` or deterministic seed
- `mapFeatures` / grid cells
- `timeSeries`
- `summaryMetrics`
- `comparisonRows`
- `provenance`: synthetic-data statement and any actual basemap source metadata

Generate the mock output in one deterministic module. For the same scenario parameters and year, the same outputs should be produced. Avoid unrelated random numbers, hardcoded metric cards, and separately invented chart curves. Use deterministic synthetic spatial cells and derived series so the map, selected-cell popup, charts, and metrics remain internally consistent. Clearly distinguish internal consistency from scientific validity.

Keep the demo model simple and documented. It may illustrate qualitative relationships, but do not claim that its equations reproduce real aquifer behavior unless that claim is separately justified.

## 6. Revised implementation phases

### P0: Establish honest prototype status

- Update README to separate **Implemented**, **Synthetic demo behavior**, and **Future research-engine integration**.
- Remove unsupported claims such as “MODFLOW benchmarked,” measured accuracy, speedup, calibration, or significance results.
- Rename “Run Simulation” to **Run Demonstration**.
- Replace simulated solver-progress/verification UI with a short demo-update state and explicit status text.
- Add a persistent disclaimer on the main workspace and in result exports/screenshots.
- Mark parameter presets as illustrative, not calibrated Metro Iloilo values.

**Acceptance:** no UI or README statement implies a trained PINO or MODFLOW run has happened when it has not.

### P1: Replace the schematic map with a real interactive map

- Replace `MetroIloilo2DMap.jsx`'s fixed 1000×650 canvas as the primary map with MapLibre GL JS.
- Set a useful initial Metro Iloilo viewport without inventing an official study boundary.
- Support mouse/touch pan and zoom, zoom buttons, reset-to-extent, resize, and visible map attribution.
- Use the basemap for actual roads, coastlines, and geographic labels; remove hand-drawn substitutes where the basemap already supplies them.
- Keep synthetic thematic output in its own overlay source and layers.
- Ensure map initialization and teardown work correctly in React development mode and after viewport resizing.

**Acceptance:** geographic navigation behaves like a real map; the overlay stays spatially aligned; attribution is visible.

### P2: Build a coherent synthetic spatial overlay

- Create a modest GeoJSON grid/polygon layer in valid longitude/latitude coordinates, explicitly labeled synthetic.
- Keep geometry within the intended demo extent; do not label it as an official administrative boundary.
- Use discrete cells initially instead of an unexplained radial heatmap.
- Add a clear legend with variable name, units, color order/range, and `Synthetic demonstration` status.
- Implement layer visibility, overlay opacity, variable selection, year/time selection, hover/click highlight, and cell popup.
- Popup should include cell ID, displayed value, unit, scenario, year, and synthetic-data label.
- If the user switches variables, update both legend and popup units correctly.

**Acceptance:** pan/zoom does not detach the overlay; every map control has a visible, working effect; no unsupported local observation is implied.

### P3: Make scenario controls functional and consistent

- Keep one source of truth for parameter values and selected scenario/year.
- Provide clear min/max/step values and units; validate invalid values and show inline feedback.
- Provide a small set of named illustrative presets, with their synthetic status visible.
- Implement **Run Demonstration** as a deterministic update of one result object, not a fake solver run.
- Ensure map, selected-cell popup, time series, cross-section, metric cards, and comparison rows all use the same scenario/result version.
- Add a reset-to-defaults action.
- Use honest status text such as `Demonstration outputs updated (no PINO/MODFLOW computation executed)`.

**Acceptance:** changing scenario or year produces consistent updates in every dependent view; repeated identical inputs reproduce identical outputs.

### P4: Improve the conceptual 3D subsurface view

- Keep the current Three.js scene as a conceptual visualization, not a verified geologic model.
- Add reliable camera presets: isometric, top, north, south, east, west; reset camera; orbit, pan and zoom.
- Wire each visible layer toggle to the corresponding mesh/material.
- Add a depth ruler and layer names that are explicitly illustrative; do not use unverified local geology labels as fact.
- Add cutaway visibility and vertical-exaggeration control with the current value displayed.
- Show orientation/axis cues and ensure canvas resize and pointer interactions work.
- Connect the surface color overlay to the selected synthetic variable and year where feasible; otherwise clearly show that it is an independent illustration.
- If a matching geographic transformation between map and 3D domain is not implemented, do not imply exact spatial registration between them.

**Acceptance:** all 3D controls work as labeled; synthetic geometry and depth values are visibly identified as conceptual.

### P5: Make analytics useful without fake scientific claims

- Keep a land-subsidence-style cross-section, selected-location time series, and scenario comparison panel only if they update from the shared demo result.
- Label axes and units; show selected scenario, year range, and data status.
- Replace fabricated PINO-vs-MODFLOW accuracy/runtime claims with either clearly marked illustrative comparison values or `Not measured yet`.
- Do not show an RMSE, R², relative L2 error, statistical significance, or speedup until it is calculated from actual, retained evaluation artifacts.
- If showing a comparison of two synthetic scenarios, label it `Scenario illustration`, not model verification.
- Make lower analytics panels collapsible/resizable so they do not overwhelm the map.
- Fix screenshot capture so it targets a named view/container rather than whichever canvas appears first; include the prototype disclaimer in captures.

**Acceptance:** every chart and metric has a clear meaning, units and status; no fake validation is presented as evidence.

### P6: Visual polish and responsive behavior

- Match the intended high-fidelity dark research-workstation design: compact top navigation, left scenario controls, large central map, right 3D view, and lower analytics suite.
- Use consistent spacing, typography, icon style, borders, focus states and contrast.
- Prioritize readable map labels, legend, parameter values, and data-status notices over decorative effects.
- Support the target presentation desktop size and reasonable smaller widths; provide a deliberate stacked layout instead of clipping panels.
- Add loading, empty, error and no-basemap states. The demo should remain understandable if the tile provider is unavailable.
- Avoid animation that suggests a physical process was numerically simulated if the animation is only decorative.

**Acceptance:** the interface is legible and navigable at the intended demo resolution and smaller widths; error states are recoverable.

### P7: Tests and delivery

- Unit-test deterministic mock generation, parameter validation, units/status fields, and selected-year behavior.
- Browser-test: map load/error, pan/zoom/reset, overlay opacity, layer toggles, cell popup, variable/year changes, scenario run/reset, chart synchronization, 3D camera/layers, and screenshot capture.
- Run existing lint and production build commands; add tests only within the current project conventions.
- Document tile/data sources and attribution, synthetic-data design, controls, limitations, setup instructions, and unimplemented model integrations.
- Review README screenshots so they do not display unsupported benchmark claims.

**Acceptance:** lint/build pass; critical interactions pass manual or automated checks; limitations are explicit.

## 7. Recommended layout

- **Top navigation:** AQUIFERA identity, workspace navigation, prototype status.
- **Left panel:** study-area selector (only if multiple supported extents exist), scenario preset, parameter controls with units, year range/time selection, run/reset actions, persistent synthetic-data notice.
- **Center panel:** large MapLibre map, view selector, thematic overlay, legend, map tools, click-to-inspect popup.
- **Right panel:** conceptual 3D cutaway, layer visibility, camera presets, depth ruler, exaggeration control.
- **Bottom suite:** cross-section, selected-cell/location time series, scenario-to-scenario comparison, concise illustrative insights.

Do not overcrowd the initial viewport. Let the map remain the visual anchor; allow analytics to collapse and the 3D panel to resize or switch into the main viewport.

## 8. Scope boundaries

### In scope now

- High-fidelity UI and real map navigation.
- Deterministic synthetic scenario interactions.
- Spatially aligned synthetic overlay.
- Conceptual interactive 3D view.
- Synchronized charts and scenario comparisons.
- Honest provenance/status messaging and reproducible demo behavior.

### Out of scope now

- Training PINO or another neural operator.
- Executing MODFLOW 6/FloPy as part of the demo workflow.
- Claiming scientific accuracy, calibrated Metro Iloilo parameters, real groundwater levels, or real subsidence predictions.
- Asserting that the chosen research gap is novel or validated.
- Building a production backend, database, authentication system, or deployment infrastructure without a demonstrated need.

## 9. Definition of done

1. A real Metro Iloilo basemap loads with correct attribution and usable pan/zoom/reset.
2. A separate synthetic GeoJSON overlay is geographically aligned and clearly labeled.
3. Scenario parameters, year, variable, layers, opacity, and reset controls work.
4. A cell popup displays the correct synthetic value, units, scenario and year.
5. Map, time series, cross-section, summary metrics and comparisons use a consistent result state.
6. The 3D conceptual view has functional camera and layer controls and is not misrepresented as verified geology.
7. The prototype visibly distinguishes synthetic demo output from real measurements and future model output.
8. README and screenshots contain no unsupported model, accuracy, or speed claims.
9. Responsive/error states are handled and lint/build/tests pass.

## 10. Implementation order

1. **P0:** correct scientific claims and status labels.
2. **P1:** MapLibre map and attribution.
3. **P2:** synthetic spatial overlay and click inspection.
4. **P3:** shared deterministic scenario/result state.
5. **P4:** coherent 3D interactions.
6. **P5:** synchronized analytics and remove fake metrics.
7. **P6–P7:** visual polish, responsive behavior, tests and documentation.

The recommended first implementation slice is **P0 + P1**, followed by P2 and P3 before spending substantial time on 3D polish. This ensures that the core visual anchor is genuinely geographic and that subsequent interactions have a sound state model.
