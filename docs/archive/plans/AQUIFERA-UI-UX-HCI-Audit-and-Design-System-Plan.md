# AQUIFERA UI/UX, HCI, and Visual Consistency Audit

> **Status:** SUPERSEDED by [`../../plans/SPRINT-PLAN.md`](../../plans/SPRINT-PLAN.md) (October 24, 2026). Retained for historical design reference only.

**Repository reviewed:** `Thesis-Titans/aquifera-prototype` (default branch `main`)  
**Review type:** Read-only source audit; no repository files, branches, issues, or pull requests were changed.  
**Decision:** **REFRAME the styling approach and standardize the existing interface before adding more visual features.** Keep React, Vite, Tailwind CSS v4, Lucide React, and Three.js. Do not redesign from scratch or add a new component library by default.

## 1. Executive finding

The visual inconsistency is not just a matter of choosing better padding values. The repository currently mixes several styling systems at once: Tailwind utilities, component-specific inline utility classes, raw hexadecimal colors, CSS custom properties, and a separate `.aquifera-*` component-style system. Components define their own sizes and spacing independently. The result is a UI that can look polished in isolated areas but does not behave as one coherent product across the entire screen and different viewport sizes.

The highest-priority problem is the **layout contract**. `src/App.jsx` uses a full-height, overflow-hidden shell; a fixed-height navigation; a middle row with `min-h-[540px]`; and a bottom analytics region using `h-68`. `src/index.css` also sets `html, body { height: 100%; overflow: hidden; }` and `#root { height: 100vh; }`. Meanwhile, the analytics component switches to a one-column grid on narrow screens, but the enclosing app and fixed-height regions may prevent users from reaching or comfortably using that content. The design is effectively desktop-first and dense, with no reliable responsive behavior established by the reviewed files.

## 2. Specific findings grounded in the current code

### P0: Styling and layout inconsistencies

1. **Multiple sources of truth for colors and surfaces.** `src/index.css` defines Tailwind theme tokens such as `--color-primary`, `--color-surface`, `--color-text-muted`, and `--color-border-subtle`; `:root` repeats a subset under different names (`--bg-deep`, `--text-main`, etc.); components then hardcode values like `#071524`, `#0ea5e9`, `#122336`, and Tailwind slate colors. A theme adjustment therefore requires edits in several places and can create near-matches rather than true consistency.
2. **Spacing, padding, radius, and control dimensions vary by component.** The global CSS declares `.aquifera-card` with 16px padding, `.aquifera-card-compact` with 12px 14px, `.aquifera-metric-card` with 12px 14px, and `.aquifera-chart-box` with 10px; components independently use utilities such as `p-5`, `p-3.5`, `px-5 py-3`, `gap-4`, `rounded-xl`, `rounded-2xl`, and many bespoke pixel dimensions. This is not inherently wrong, but no documented rule says when each size is appropriate, and the custom component classes are not consistently used.
3. **Conflicting layout assumptions.** `App.jsx` uses `min-h-screen`, while `#root` is locked to `100vh` and body overflow is hidden. `main` has `min-h-[540px]`, and analytics has `h-68`; these assumptions can force clipping or cramped panels on shorter displays. The global `.app-sidebar` rules target a different sidebar pattern than the `ScenarioSetupPanel` shown in the reviewed component, suggesting stale or competing layout styles.
4. **Typography is too small in key workflows.** The scenario description is `text-[11px]`; parameter labels are often 11px; many charts use 9px axes; controls are commonly 12px. Dense data labels may be acceptable in a specialized scientific tool, but core instructions, form labels, errors, and control names should not depend on tiny text. Axis labels can remain compact when necessary, with zoom, tooltips, or a larger detailed view.
5. **Interactive states are inconsistent or absent.** Some controls use explicit focus-border classes, while global `input[type="range"]` removes the outline and does not provide a complete keyboard-focus style. Several interactive-looking controls use transparent buttons over a static map image; this is a functional and accessibility concern, not just a styling issue.
6. **Decorative treatments compete with information hierarchy.** Frequent glows, blur, gradients, borders, and different card treatments may make the UI feel futuristic, but they do not by themselves improve comprehension. Use glow sparingly for focus or a meaningful active state, not as a default for every panel or control.

### P0: Interaction and HCI issues that affect visual design

7. **The current viewport is image-backed, not a geographic map.** `CentralViewport.jsx` displays static 2D/3D PNGs and overlays invisible hit targets with opacity-based hover behavior. Users may click what appears to be a map control without receiving a clear visual response. This violates the expectation that an affordance indicates an available action and that an action has visible feedback.
8. **Labels and actions can mislead.** `App.jsx` calls `computeGroundwaterState` for a local illustrative computation, while `handleRunSimulation` only displays a 600 ms timer. The interface should not use visual status states such as a completed solver run or scientific verification unless that operation actually ran. For the current prototype, use “Run demo scenario” and “Illustrative demo complete” rather than implying a real solver execution.
9. **The global `select-none` is over-applied.** It is used on the app shell and several major regions. Preventing selection across ordinary text makes reading, copying labels, and keyboard/mouse interaction less natural. Restrict it to map/3D manipulation surfaces where it prevents accidental text selection.
10. **Navigation affordances exceed their behavior.** In `TopNavigation.jsx`, Home/Scenarios/Results update `activeTab`, but the inspected `App.jsx` does not conditionally render distinct page content based on that tab; Reports triggers screenshot capture, and About opens a guide. Do not style all items as full navigation destinations if some are actions or do not navigate to a separate view. Rename and group them according to their actual behavior.
11. **The screenshot feature assumes the first canvas is the desired output.** `App.jsx` selects `document.querySelector('canvas')`; as the application gains multiple charts, maps, or WebGL surfaces, this may capture the wrong element. The export UI should state whether it captures the full dashboard, map, or 3D viewport.

### P1: Accessibility and responsive use

12. **No complete accessibility contract is visible in the reviewed files.** Every input should have a programmatically associated label; icon-only controls need accessible names; focus must be visible; modal focus should be managed and returned to the opener; color must not be the sole encoding for data; charts need text summaries or an accessible data alternative.
13. **Keyboard and touch need deliberate support.** Sliders need visible focus and a usable keyboard range. Map and 3D navigation should have reset/camera controls that work without dragging. Buttons should have predictable hit areas, ideally around 40–44 CSS px for primary controls and touch-heavy actions, without making every compact desktop toolbar oversized.
14. **Responsive behavior needs defined breakpoints and fallbacks.** The target is a dense scientific dashboard, but the prototype still needs to work at common laptop resolutions and browser zoom. At tablet widths, use a collapsible scenario drawer and tabs for map/3D/analytics rather than squeezing every panel side-by-side. At small widths, stack sections and preserve access to all content; do not simply hide overflow.
15. **Contrast must be checked with actual combinations.** Muted text and tiny labels over translucent/glass surfaces can be difficult to read. Establish contrast targets (WCAG 2.2 AA as the default design target: 4.5:1 for normal text, 3:1 for large text and relevant non-text controls) and test the final color pairs rather than judging colors by appearance alone.

## 3. Design-system direction

### Design principle

Build a **calm scientific workstation**: clear information hierarchy, consistent spacing, strong legibility, direct manipulation where appropriate, and restrained visual effects. The map and 3D scene are the primary visual workspace; controls and analytics support interpretation rather than compete with it.

### Proposed tokens

Use one canonical token layer in `src/index.css` (or a dedicated imported `src/styles/tokens.css`) and reference those tokens from both Tailwind utilities and custom component classes. These values are starting points, not immutable laws; tune them after testing screenshots at target resolutions.

- **Spacing scale (4px base):** `space-1=4px`, `space-2=8px`, `space-3=12px`, `space-4=16px`, `space-5=20px`, `space-6=24px`, `space-8=32px`, `space-10=40px`.
- **Radii:** `radius-sm=6px` for compact controls; `radius-md=8px` for inputs; `radius-lg=12px` for cards; `radius-xl=16px` only for large surfaces/modals. Avoid mixing many near-identical radii.
- **Control heights:** compact toolbar 32–36px; standard inputs/buttons 40px; primary actions 44px; touch-focused actions 44px minimum target area where feasible. A visible 32px control can have a larger transparent hit area only if it remains clear and accessible.
- **Typography:** base UI 14px minimum for ordinary content; core form labels 13–14px; section headings 15–16px; page title 18–22px; secondary metadata 12px minimum when non-critical. Chart ticks may be 10–12px in dense plots but should be paired with tooltips or a larger inspection view. Use a consistent weight scale rather than arbitrary boldness.
- **Borders:** one default subtle border, one stronger interactive/focus border, and one semantic danger border. Do not use multiple border opacities for the same role.
- **Surfaces:** app background, panel surface, elevated surface, and overlay surface. Use opacity/blur only where it does not reduce text contrast or performance.
- **Motion:** short transitions (roughly 120–180ms) for hover/focus/state changes; respect `prefers-reduced-motion`; avoid animated decorative effects that do not communicate state.
- **Color semantics:** primary action, selected state, success, warning, error, neutral, and scientific data palettes must be distinct roles. The scientific heatmap palette must not double as the UI status palette. Include legends, units, and numeric values so interpretation is not color-only.

### Component patterns to standardize

Create a small, consistent set of reusable primitives before introducing a component framework:

- `AppShell` and `TopNavigation`
- `Panel` / `PanelHeader` / `PanelBody`
- `FormField` with label, helper text, units, validation, and error message
- `Button` variants: primary, secondary, ghost, danger; consistent heights and focus/disabled/loading states
- `IconButton` with tooltip and accessible name
- `Select`, `RangeField`, and numeric value input pairs
- `StatusBadge` with text plus icon/shape, not color alone
- `EmptyState`, `ErrorState`, and `LoadingState`
- `Disclosure` for advanced parameters
- `Modal/Dialog` with keyboard and focus behavior
- `ChartPanel` with consistent title, units, legend, data status, and empty/loading states
- `DataProvenanceNotice` for synthetic/demo vs. measured/reference output

Avoid adding a full component library until these requirements have been mapped. Since the app already uses Tailwind v4, a lightweight in-repo component layer and token conventions should be sufficient. Consider Radix primitives or shadcn/ui only if accessible dialog, select, tooltip, and popover behavior is costly to implement correctly; adopt selectively rather than mixing multiple design systems.

## 4. HCI and web-app principles to apply

1. **Visibility of system status:** Every action must show a real, truthful state: idle, validating, running demo, complete, failed. Do not show progress for a task that did not run.
2. **Match between system and real world:** Use familiar hydrogeology terms, units beside values, understandable labels, and clear distinctions between pumping input, groundwater response, compaction, and surface subsidence.
3. **Consistency and standards:** Same input dimensions, label placement, card headers, button hierarchy, spacing, and interaction states across the app.
4. **Recognition rather than recall:** Keep units, ranges, current values, legends, selected scenario, year/time slice, and data provenance visible. Use sensible presets only if their parameter values are documented as demo presets.
5. **User control and freedom:** Provide reset view, reset scenario, undo/cancel for consequential operations, and easy return from 3D to 2D. Do not trap users in a fixed viewport.
6. **Error prevention and recovery:** Validate parameter ranges; explain invalid input inline; preserve user-entered values after recoverable errors; distinguish resetting the camera from resetting scenario parameters.
7. **Progressive disclosure:** Keep primary scenario inputs visible and place advanced geotechnical settings behind a clearly labeled disclosure.
8. **Direct manipulation with feedback:** Map selection, layer toggles, time slider, and 3D camera controls should have visible effects. Avoid invisible hitboxes and controls that look interactive but do nothing.
9. **Information hierarchy and cognitive load:** Give the map/3D viewport most of the available space. Group scenario inputs by task, then show a small set of useful result summaries and secondary charts. Do not show every metric simultaneously if it makes the interface unreadable.
10. **Accessibility and inclusive interaction:** Keyboard operation, visible focus, semantic labels, readable contrast, reduced-motion support, tooltips that do not replace labels, and accessible alternatives for visual-only data.
11. **Scientific integrity and uncertainty:** Every data view must show its variable, unit, scenario, time, and provenance. Mark synthetic outputs persistently. Do not imply calibrated geography, verified outputs, or scientific precision from visual realism alone.
12. **Progressive enhancement and resilience:** If basemap tiles fail or network access is absent, show a useful error/fallback; never leave a blank viewport without explanation. Provide reset controls independent of map gestures.

## 5. Recommended layout behavior

### Desktop (primary target)

- Keep a stable top navigation/header, but let it respond to narrower widths.
- Use a left scenario panel with a controlled width range (roughly 280–340px, not a fixed universal width); its content scrolls independently when necessary.
- Let the central 2D/3D viewport flex to fill the remaining space and keep its controls anchored to that viewport.
- Place analytics below the viewport or in a resizable/collapsible bottom panel. Avoid hard-coded pixel height where it causes chart clipping; use grid/flex constraints and `min-height: 0` for nested scroll containers.
- Keep a persistent but compact “Illustrative demo data” notice.

### Tablet / split screen

- Collapse the scenario panel into a drawer.
- Provide explicit tabs or segmented controls for Map, 3D, and Results.
- Preserve access to run/reset actions and the provenance notice.

### Small screen / browser zoom

- Stack the scenario controls, viewport, and results in a vertical flow.
- Allow normal page scrolling; remove global `overflow: hidden` as a universal rule.
- Keep controls usable at 200% zoom and avoid horizontal scrolling for core workflows.

## 6. Implementation sequence

### Phase A: Define the system before mass restyling

1. Record target viewport sizes (at minimum 1440×900, 1366×768, 1024×768, 768px wide, and a narrow mobile viewport) and browser zoom scenarios.
2. Inventory existing CSS classes and component patterns; identify which `.aquifera-*` classes are actually used before deleting or rewriting them.
3. Create a short design-system reference with tokens, type scale, spacing scale, radii, control heights, semantic colors, and examples.
4. Define a page layout contract with responsive behavior and explicit scroll ownership.

### Phase B: Establish tokens and primitives

1. Consolidate duplicated CSS variables into one canonical token set.
2. Standardize Panel, PanelHeader, FormField, Button, IconButton, StatusBadge, and DataProvenanceNotice.
3. Replace repeated arbitrary hex colors and conflicting card classes in one component at a time.
4. Add consistent hover, focus-visible, active, disabled, loading, error, and selected states.

### Phase C: Fix layout and responsive behavior

1. Remove the global assumption that the entire document must never scroll; allow the page to scroll at narrow sizes.
2. Replace fixed `h-68`/minimum-height interactions with a deliberate grid/flex layout and independently scrollable panels where needed.
3. Establish desktop, tablet, and mobile layouts, including panel collapse and Map/3D/Results navigation.
4. Verify no hidden controls, clipped charts, or unreachable content at target viewport sizes.

### Phase D: Apply HCI to interactive controls

1. Replace invisible map hit targets with visible controls and correct accessible labels.
2. Make control feedback and state transitions truthful.
3. Make navigation destinations match their labels and behavior.
4. Add field validation, helper text, units, keyboard focus, modal focus management, and reduced-motion behavior.
5. Ensure scenario reset, view reset, and layer reset are separate and predictable actions.

### Phase E: Validate and refine

1. Test keyboard-only use for all primary flows.
2. Check text and non-text contrast against WCAG 2.2 AA targets.
3. Test 200% zoom, window resizing, reduced motion, and narrow viewports.
4. Use Playwright for a basic visual regression/smoke-test set; use screenshots at agreed viewport sizes to detect spacing drift.
5. Run `npm run lint` and `npm run build` after each phase.
6. Review every remaining visual metric or status for truthful data provenance.

## 7. Acceptance criteria

- A single documented token system controls color, spacing, typography, radii, borders, shadows, and control sizes.
- No unintentional hardcoded color/spacing values remain in the core components; exceptions are documented for scientific data visualization or map overlays.
- Primary form labels, values, buttons, and panel headings use consistent sizes and alignment.
- Primary buttons and form controls share standardized dimensions and visible focus/disabled/error states.
- The application remains usable at the agreed desktop, tablet, and narrow viewports, with no clipped primary actions or inaccessible results.
- All interactive-looking controls visibly respond, and no transparent hitbox is the only way to discover or activate a feature.
- Keyboard users can reach and operate all primary controls; dialogs manage focus; range sliders have visible focus and labels.
- Color contrast is checked and meets WCAG 2.2 AA targets for applicable text and UI elements.
- Map/3D/chart data is labeled with variable, unit, time/scenario and provenance; synthetic/demo output is persistently disclosed.
- `npm run lint` and `npm run build` pass; automated smoke tests cover the primary scenario flow and responsive layout.

## 8. Priority and decision

**P0:** consolidate tokens; fix global overflow/fixed-height behavior; standardize core typography/spacing; remove misleading or invisible interaction affordances; make demo status truthful.  
**P1:** reusable component primitives; keyboard/focus/contrast/accessibility improvements; responsive tablet/mobile behavior.  
**P2:** subtle visual polish, motion, optional design-system library, and screenshot regression tooling.

**Final recommendation:** keep the current stack, establish the design system and layout contract first, then restyle the interface incrementally. Do not add a component library as a substitute for making design decisions. Visual consistency should be enforced through tokens and shared components, while HCI quality should be validated through observable user tasks and accessibility checks, not judged by appearance alone.
