# AQUIFERA Design System and HCI Specification
## Visual Tokens, Component Contracts, and Ergonomic Guidelines for Scientific Workstations

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Design Philosophy: The Calm Scientific Workstation

The **AQUIFERA** user interface is engineered as an analytical decision-support and deliberation tool for municipal planners (e.g., City Planning and Development Office / CPDO), environmental officers (City-ENRO), and hydrogeologists. Grounded in municipal planning frameworks (CLUP 2021–2029, P.D. 1067), the interface is tailored for high-stakes municipal deliberations—such as evaluating commercial deep-well variance applications or amending the Comprehensive Land Use Plan (CLUP) and Zoning Ordinance. The design philosophy adheres to four foundational tenets:

1. **Information Hierarchy Over Visual Decoration**: The central spatial viewports (MapLibre 2D GIS and Three.js 3D Subsurface) are the primary workspace. Secondary sidebars and analytics cards provide context without visual noise, excessive glows, or distracting animations.
2. **Deterministic Data Provenance**: Every metric, chart, and contour visibly communicates its physical variable, units of measurement, scenario year, and empirical status (e.g., deterministic synthetic demonstration vs. calibrated reference).
3. **Ergonomic Accessibility (WCAG 2.2 AA)**: All text meets a minimum contrast ratio of 4.5:1 against its background. Controls provide explicit visible focus indicators, standard touch targets ($\ge 36\text{px}$), and keyboard navigability.
4. **Predictable Layout Contract**: The layout adapts fluidly across standard desktop (1920x1080), laptop (1440x900 and 1366x768), and tablet viewports without clipping charts or trapping scrollbars.

---

### 2. Canonical Token Architecture (`src/index.css`)

All colors and surfaces are derived from a unified HSL token palette defined in Tailwind CSS v4 `@theme`.

#### 2.1 Surfaces and Elevation
* `--color-deep`: `hsl(222, 47%, 7%)` (#070d17) - Root canvas and background foundation.
* `--color-deep-surface`: `hsl(222, 45%, 9%)` (#09111e) - Sidebar container background.
* `--color-surface`: `hsla(222, 40%, 11%, 0.90)` (#0c1524) - Standard cards and analytical widgets.
* `--color-surface-elevated`: `hsla(222, 36%, 15%, 0.95)` (#131e30) - Floating HUD toolbars, tooltips, and modal surfaces.
* `--color-surface-glass`: `hsla(222, 47%, 10%, 0.75)` - Translucent overlays with `backdrop-blur-md`.

#### 2.2 Structural and Interactive Borders
* `--color-border-subtle`: `hsla(217, 33%, 22%, 0.60)` - Standard card and section dividing lines.
* `--color-border-hover`: `hsla(217, 33%, 35%, 0.80)` - Interactive control hover state.
* `--color-border-active`: `hsla(187, 92%, 48%, 0.65)` - Selected tab, focused input, or active preset boundary.
* `--color-border-danger`: `hsla(350, 89%, 60%, 0.60)` - Overdraft warnings and threshold exceedances.

#### 2.3 Typography and Hierarchy
* `--font-sans`: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` - General UI content.
* `--font-mono`: `'JetBrains Mono', monospace` - Coordinates, numeric values, mathematical symbols, and code.

| Role | Font Size | Line Height | Weight | Tailwind Utility | Intended Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | 18px (1.125rem) | 24px | Bold (700) | `text-lg font-bold` | Top navigation branding and modal titles |
| **Section Heading** | 14px (0.875rem) | 20px | Semibold (600) | `text-sm font-semibold` | Sidebar groups and analytics card headers |
| **Body / Labels** | 13px (0.8125rem) | 18px | Medium (500) | `text-[13px] font-medium` | Form field labels and metric descriptions |
| **Secondary Metadata** | 12px (0.75rem) | 16px | Normal (400) | `text-xs font-normal` | Helper text, units, and timestamps |
| **Compact Chart Ticks** | 10px to 11px | 14px | Mono (500) | `text-[10px] font-mono` | Axis ticks, coordinates, and cell IDs |

#### 2.4 Brand and Scientific Accent Colors
* **Primary (Aquifer Cyan)**: `hsl(187, 92%, 48%)` (`#06b6d4` / `#00f2fe`) - Primary actions, groundwater flows, and active selections.
* **Secondary (Hydraulic Blue)**: `hsl(217, 91%, 60%)` (`#38bdf8`) - Piezometric head contours and river networks.
* **Accent (Deep Geo Purple)**: `hsl(258, 90%, 66%)` (`#a855f7`) - Geotechnical cross-sections and structural markers.

#### 2.5 Semantic State Roles
* **Success / Sustainable**: `hsl(158, 85%, 44%)` (`#10b981`) - Managed recharge, normal hydraulic heads ($h > h_{\text{pre}}$), and verified physics state.
* **Warning / Caution**: `hsl(38, 92%, 50%)` (`#f59e0b`) - Moderate subsidence ($3.0$ to $7.9\text{ mm/yr}$) and seasonal piezometric drawdown.
* **Danger / Critical (Plastic Alarm)**: `hsl(350, 89%, 60%)` (`#ef4444`) - Severe overdraft, empirical InSAR threshold breach ($\ge 8.0\text{ mm/yr}$, calibrated to Sulapas et al. 2024), and irreversible plastic clay compaction.
* **Informational**: `hsl(199, 89%, 48%)` (`#0284c7`) - Research disclaimers, CLUP zoning context, and methodology guidance.

---

### 3. Spacing and Radii Scales

To maintain visual harmony, all padding, gaps, and margins follow a 4px geometric base scale:

* `space-1`: 4px - Tight element gaps inside pills and badges.
* `space-2`: 8px - Icon-to-label gaps and compact form spacing.
* `space-3`: 12px - Default card padding on compact displays and internal widget gaps.
* `space-4`: 16px - Standard card and section padding.
* `space-5`: 20px - Sidebar padding and modal internal margins.
* `space-6`: 24px - Major layout row gaps.

#### Corner Radii
* `radius-sm`: 6px - Dropdowns, small buttons, and indicator badges.
* `radius-md`: 8px - Text inputs, range slider thumbs, and toolbar segments.
* `radius-lg`: 12px - Analytical cards, HUD widgets, and dropdown menus.
* `radius-xl`: 16px - Modal dialogs and central viewport boundaries.

---

### 4. Layout Contract and Responsive Behavior

#### 4.1 Desktop (1920x1080 and 1440x900)
* Fixed top navigation (48px height) with brand, mode indicator, and action triggers (`Reset View`, `Snapshot (PNG)`, and `Export (GeoJSON)` emitting WGS84 and PRS92 / Philippines Zone 4 (EPSG:3124) payloads for CPDO QGIS/ArcGIS).
* Middle stage: Horizontal flex row containing:
  * Left Scenario Setup Panel: Fixed 320px width (`w-80`), independent vertical scrolling via custom scrollbar.
  * Central Viewport: Flex-1 fill, containing MapLibre 2D GIS (rendering official PSA/NAMRIA 180-barangay administrative polygons) or Three.js 3D WebGL subsurface cutaway (5-layer volumetric block, proposal Fig. 6).
* Bottom Suite: 4-card analytical grid (`grid-cols-4`) displaying the 2D cross-section heatmap, time-series hydrograph, risk breakdown, and visualization layer controls.
* Fixed footer (32px height) with disclaimer and versioning.

#### 4.2 Laptop (1366x768)
* Middle stage flexes with `min-h-[420px]`.
* Bottom analytics suite scales gracefully without vertical clipping; the parent document allows gentle page scroll if the total height exceeds available window viewport.
* Text selections are enabled on ordinary body text and disabled only on 3D canvas and interactive map drag surfaces.

#### 4.3 Tablet / Split-Screen (<1024px)
* The Scenario Setup Panel collapses into an accessible slide-over drawer triggered by a persistent toolbar button.
* Central Viewport and Bottom Analytics stack vertically, enabling natural scrolling.
* Touch targets expand to 44px minimum for primary action buttons.

---

### 5. Accessibility and Interaction Guidelines

1. **Focus Rings**: Never suppress browser focus rings without providing a high-contrast replacement. Interactive controls must declare:
   ```css
   focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2
   ```
2. **Text Legibility**: Do not use font sizes below 12px for interactive labels, form titles, or error messages. Reserve 10px font sizes exclusively for axis tick labels or coordinate strings.
3. **Multi-Channel Encodings**: Never communicate status via color alone. Pair color indicators with icons (e.g., checkmark for ready, alert triangle for warning) and explicit text labels.
4. **Motion Preferences**: Honor user accessibility settings:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, ::before, ::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
