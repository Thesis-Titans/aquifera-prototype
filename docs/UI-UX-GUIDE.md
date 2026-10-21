# AQUIFERA: UI/UX Design and Interface Guide
## Design System, Component Hierarchy, HUD Telemetry, and Visual Tokens

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026–2027 | Research Group 2*

---

### 1. Design Philosophy

The Aquifera interface is designed as a **mission-critical geotechnical command center**. It adheres to the cognitive engineering principle of high information density without visual clutter, enabling water resource evaluators, geologists, and urban planners to inspect high-dimensional subsurface dynamics effortlessly.

Key aesthetic and functional principles include:
- **Dark Mode Architecture:** An obsidian and deep navy theme (`#0B0F19` background) optimizes visual contrast, prevents eye strain during extended analytical sessions, and highlights dynamic heatmaps.
- **Glassmorphism with Purpose:** Subtle translucent surfaces (`backdrop-blur-md`, semi-transparent borders) create depth and visual hierarchy between floating parameter controls and the underlying 3D WebGL viewport.
- **Micro-Interactions and Visual Feedback:** Instantaneous mesh response ($< 16\text{ ms}$ render loop) provides immediate tactile feedback when adjusting pumping rates or rotating the subsurface block.

---

### 2. Design System Tokens

#### 2.1 Color Palette

| Token Role | Hex Code | Tailwind Utility | Visual Application |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#0B0F19` | `bg-[#0B0F19]` | Root application container background. |
| **Panel Surface** | `#111827` | `bg-gray-900/80` | Glassmorphic floating panels and cards. |
| **Panel Border** | `#1F2937` | `border-gray-800` | Subtle 1px structural container divider. |
| **Primary Accent (Cyan)** | `#00F2FE` | `text-[#00F2FE]` | Active tab indicators, primary buttons, FNO telemetry. |
| **Secondary Accent (Teal)** | `#06B6D4` | `text-cyan-500` | Hydraulic head contours and water table lines. |
| **Geotechnical Safe (Green)** | `#10B981` | `text-emerald-500` | Elastic consolidation regime ($h \ge h_{\text{pre}}$). |
| **Warning (Amber)** | `#F59E0B` | `text-amber-500` | Moderate subsidence warning ($2.0$ to $5.0\text{ mm/yr}$). |
| **Critical Alarm (Red)** | `#EF4444` | `text-red-500` | Preconsolidation threshold breach ($h < h_{\text{pre}}$, $> 5\text{ mm/yr}$). |
| **Stratum 1 (Sand)** | `#FBBF24` | `bg-amber-400` | Upper unconfined sandy alluvium stratum. |
| **Stratum 2 (Clay)** | `#A855F7` | `bg-purple-500` | Compressible marine clay aquitard. |
| **Stratum 3 (Confined)** | `#3B82F6` | `bg-blue-500` | Deep semi-confined regional production aquifer. |

#### 2.2 Typography
- **Primary Interface Font:** `Inter`, system sans-serif (clean readability for labels, descriptions, and forms).
- **Numerical and Telemetry Font:** `JetBrains Mono`, `Fira Code`, monospace (ensures tabular alignment for latencies, drawdown values, and coordinate readings).

---

### 3. Screen Layout and Component Hierarchy

The desktop interface follows a structured 4-region layout optimized for $1920 \times 1080$ and $1536 \times 864$ workstation displays:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION: Title, Hardware Baseline (RTX 4050), Demonstration Notice, Presets    │
├───────────────────────┬────────────────────────────────────────┬───────────────────────┤
│ LEFT SIDEBAR          │ CENTRAL VIEWPORT                       │ RIGHT SIDEBAR         │
│ (Input Parameters)    │ (Three.js WebGL 3D Canvas / MapLibre)  │ (Dual-Engine HUD)     │
│                       │                                        │                       │
│ • Stratum Thickness   │ • 3D Geotechnical Block Cutaway        │ • Latency Comparison  │
│ • Well Coordinate Map │ • Dynamic Surface Mesh Deformation     │ • Speedup Factor      │
│ • Pumping Sliders (Q) │ • Camera Presets & Stratum Clipping    │ • Preconsolidation Head│
│ • Piezometric Targets │ • 2D / 3D Perspective Toggle           │ • Verification Status │
├───────────────────────┴────────────────────────────────────────┴───────────────────────┤
│ BOTTOM ANALYTICS SUITE: Stratigraphic Cross-Section Heatmap, Piezometric Time Series   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.1 Top Navigation Bar
- Displays project branding, current scenario preset (`Status-Quo Commercial Pumping`, `Dry-Season Crisis`, `Surface Water Substitution`), and the mandatory persistent integrity notice.
- Includes quick-action buttons: `Reset View`, `Snapshot (PNG)`, and `Export (GeoJSON)`. The GeoJSON export generates standard WGS84 and PRS92 / UTM Zone 51N geospatial payloads designed for immediate ingestion into CPDO's QGIS and ArcGIS desktop planning environments.

#### 3.2 Left Sidebar: Scenario & Well Controls
- **Well Configuration Accordion:** Individual controls for up to 6 deep production wells. Adjusting sliders alters continuous pumping rates ($0$ to $5,000\text{ m}^3/\text{day}$).
- **Geotechnical Parameters Panel:** Inspects layer hydraulic conductivities ($K_{zz}$) and storage coefficients ($S_{ske}, S_{skv}$).

#### 3.3 Central Viewport: Dual-Mode Geographic and 3D Subsurface Stage
- **Mode Switching Toolbar:** Segmented pill controls allow instant toggling between `2D GIS Map (MapLibre)` and `3D Subsurface Cutaway (Three.js)`.
- **2D Geographic Map (MapLibre GL JS):**
  - High-performance WebGL basemap centered on Metro Iloilo (`10.72° N, 122.56° E`).
  - **Authentic Administrative Boundary Overlay**: Ingests the official PSA/NAMRIA 180-barangay polygon dataset (`iloilo_city_barangays.geojson`) and city perimeter (`iloilo_city_boundary.geojson`), enabling barangay-level extraction attribution and risk classification.
  - Interactive choropleth and contour overlays showing color-coded cumulative subsidence ($cm$), head drawdown ($m$), and preconsolidation breach flags.
  - Full navigation capabilities: pan, zoom, pitch, bearing reset, and extent recentering.
  - Interactive cell/barangay inspector: hover outlines and popup cards detailing Barangay Name, administrative PSGC code, estimated localized subsidence rate, and active commercial well density.
- **3D Subsurface Cutaway (Three.js WebGL):**
  - Volumetric block cutaway displaying a structured 3-layer stratigraphic volume: Upper Sand Alluvium (0 to 30 m), Compressible Marine Clay Aquitard (30 to 60 m), and Deep Confined Production Sand (60 to 120 m).
  - OrbitControls: left-click to orbit, right-click to pan, scroll wheel to zoom, with camera angle quick-presets (Isometric, Cross-Section Profile, North-South Dip).
  - Stratum clipping slider: horizontally slices into the block from $0\%$ to $100\%$ to expose internal aquitard compaction.
  - Dynamic ground surface and layer deformation driven by 1D Terzaghi consolidation vertex shaders, visualizing the localized cone of depression.
  - Decoupled WebGL rendering pipeline guaranteeing $\le 4.2\text{ GB}$ VRAM consumption and $> 60\text{ FPS}$ frame rates on commodity hardware.

#### 3.4 Benchmark Target HUD Overlay
- **Target Specifications:** Displays target neural operator latency ($< 250\text{ ms}$) versus baseline USGS MODFLOW 6 runtime ($180\text{ s}$ to $300\text{ s}$), validating responsiveness for live, in-person CPDO / Zoning Board meeting deliberations.
- **Collapsible Ergonomics:** Minimizable floating pill in the upper-right viewport corner to maximize map viewing area.
- **Academic Disclosures:** Explicitly labels performance targets as architectural specifications from proposal documentation, maintaining scientific integrity.

#### 3.5 Bottom Analytics Suite
- **Stratigraphic Cross-Section Heatmap:** Visualizes vertical pore-pressure gradients across depth ($0$ to $120\text{ m}$).
- **Piezometric Hydrograph:** Interactive line chart showing multi-year hydraulic head decline versus ground settlement.

---

### 4. Accessibility and Usability Standards

- **Colorblind Safe Palettes:** Critical alerts use both chromatic color tokens (red/amber) and explicit textual badges (`SAFE`, `PRECONSOLIDATION BREACH`, `IRREVERSIBLE`) to ensure accessibility for deuteranopia and protanopia users.
- **Keyboard Navigation:** All sliders and toggle buttons are reachable via standard keyboard `Tab` and arrow key navigation.
- **Minimum Tap Target:** Interactive buttons and toggle pills maintain a minimum dimension of $36\text{ px} \times 36\text{ px}$.
