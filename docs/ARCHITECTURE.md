# AQUIFERA: System Architecture Specification
## Multi-Tier Architecture, Neural Operator Surrogates, and Verification Pipelines

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Architectural Pattern Overview

Aquifera implements a **4-Tier Decoupled Architecture** designed to balance real-time browser interaction ($< 250\text{ ms}$) with rigorous numerical physics verification. 

```
┌────────────────────────────────────────────────────────────────────────┐
│                     TIER 1: CLIENT PRESENTATION                        │
│  • React 19 SPA (Vite 8.3)           • Three.js WebGL 3D Canvas        │
│  • MapLibre GL JS (Geospatial Base)  • Dual-Engine Telemetry HUD       │
│  • Web Workers (Geometry Parsing)    • Responsive Control Panels       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket (< 10 ms)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 TIER 2: API GATEWAY & ORCHESTRATION                    │
│  • FastAPI Service (Async Python 3.11) • Pydantic Schema Validation    │
│  • Redis Caching (< 5 ms cache hit)    • Celery Task Queue             │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│     TIER 3: SURROGATE INFERENCE      │ │ TIER 4: NUMERICAL VERIFICATION│
│ • PyTorch CUDA 12.x Execution        │ │ • Headless USGS MODFLOW 6     │
│ • Pre-Trained 3D PINO Model          │ │ • CSUB (Compaction Package)   │
│ • Latency < 250 ms                   │ │ • FloPy Model Discretization  │
│ • Peak VRAM <= 4.2 GB                │ │ • Runtime: 3 to 45 minutes    │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

#### 1.1 Implementation Status and Research Delineation

To maintain absolute academic and scientific integrity (Form `CICT-UGR-F001` and CICT Capstone Policy):

* **Tier 1 (Client Presentation)** represents the **implemented working prototype** contained within this repository, demonstrating interactive 3D WebGL geotechnical cutaways, 2D MapLibre GIS mapping, analytical Darcy-Theis drawdown, and scenario controls.
* **Tiers 2, 3, and 4 (API Gateway, PINO Inference Engine, and FloPy Verification Pipeline)** represent the **proposed system architecture and research target specification**. These tiers define the engineering roadmap to be executed during model training, surrogate benchmarking, and numerical validation phases.
* **Demonstration Telemetry**: Metrics presented in the Tier 1 client (e.g., 2.3 ms latency, speedup factors, R^2, and Wilcoxon signed-rank comparisons) are illustrative design targets and demonstration placeholders calibrated for user interface walkthroughs. They must not be cited as measured empirical findings of a trained neural operator.

| Architectural Subsystem | Tier | Implementation Status | Technical Realization in Repository |
| :--- | :--- | :--- | :--- |
| **Interactive Dashboard & Shell** | Tier 1 | **Implemented** | React 19 SPA, Vite 8.3, Tailwind CSS v4 (`src/app/App.jsx`). |
| **3D Subsurface Cutaway** | Tier 1 | **Implemented** | Three.js WebGL canvas with custom strata displacement (`src/features/aquifer-visualization/`). |
| **2D GIS Basemap** | Tier 1 | **Implemented** | MapLibre GL JS with CARTO Dark raster tiles and synthetic GeoJSON grid (`src/features/map/`). |
| **Client-Side Physics Engine** | Tier 1 | **Implemented (Illustrative)** | Analytical Darcy-Theis multi-well drawdown and 1D Terzaghi skeletal compaction (`src/physics/groundwaterPhysics.js`). |
| **Scenario State Management** | Tier 1 | **Implemented** | React state with isolated preset resets (`src/features/scenarios/hooks/useScenarioState.js`). |
| **Dual-Engine HUD Telemetry** | Tier 1 | **Illustrative Demo Telemetry** | UI monitors displaying target engineering benchmarks and latency comparisons (`src/features/simulation/`). |
| **Verification Modal** | Tier 1 | **Illustrative Demo Interface** | Interactive dialog demonstrating proposed reference solver cross-checks and cross-section graphs (`src/features/verification/`). |
| **FastAPI Gateway & Orchestration**| Tier 2 | **Proposed Architecture** | Dockerized asynchronous Python service specification documented in Section 2. |
| **3D PINO Surrogate Inference** | Tier 3 | **Proposed Research Goal** | Pre-trained PyTorch CUDA neural operator model to be trained on synthetic LHS datasets. |
| **Automated FloPy / MODFLOW 6** | Tier 4 | **Proposed Benchmark Pipeline** | Headless USGS MODFLOW 6 CSUB numerical solver verification pipeline. |

---

### 2. Tier-by-Tier Component Specifications

#### Tier 1: Client Presentation Layer
- **Framework:** React 19, Vite 8.3, and Tailwind CSS v4.
- **3D Subsurface Viewport (Three.js):**
  - Renders a volumetric cutaway model of Metro Iloilo's alluvial aquifer system.
  - Implements custom vertex displacement to deform the upper ground mesh in real time based on computed compaction values $\Delta b(x, y)$.
  - Uses clipping planes (`clippingPlanes: [plane]`) allowing users to slice into the 3D block to inspect internal aquitard compaction.
- **Geographic Basemap Viewport (MapLibre GL JS):**
  - Displays geospatial overlays aligned with regional barangay boundaries (Mandurriao, Molo, City Proper, Jaro, La Paz, Arevalo).
  - Synchronizes zoom, pan, and coordinate inspection with the 3D cutaway.
- **Dual-Engine Benchmark HUD:**
  - Real-time performance monitors displaying inference duration, speedup factors, memory footprints, and $L_2$ relative errors.

#### Tier 2: API Gateway and Orchestration
- **Framework:** Dockerized FastAPI service exposing asynchronous endpoints.
- **Endpoints:**
  - `POST /api/v1/simulate`: Validates input parameters, checks Redis cache, invokes the Tier 3 PINO surrogate engine, and returns predictions in under 250 milliseconds.
  - `POST /api/v1/verify`: Dispatches an asynchronous verification job to the Tier 4 FloPy service via Celery/RabbitMQ, returning a job tracking UUID.
  - `GET /api/v1/verify/{job_id}`: Polls numerical verification progress and returns benchmark comparison matrices.
  - `GET /api/v1/export/{format}`: Streams simulation outputs in GeoJSON, GeoTIFF, or CSV format.
- **Caching Strategy:** Scenarios with identical pumping configurations and stratigraphy are cached in Redis with a 24-hour TTL, serving repeated queries in under 10 milliseconds.

#### Tier 3: Surrogate Inference Engine (PINO PyTorch)
- **Mathematical Architecture:**
  - **Lifting Layer ($P$):** Projects input parameters $(x, y, z, K_{zz}, S_{skv}, Q)$ from low dimension to high-dimensional latent space ($d_v = 64$).
  - **Fourier Integral Operator Layers:** Four sequential Fourier layers performing discrete Fast Fourier Transforms (3D FFT), multiplying with learnable complex weight tensors $R_\phi$ truncated at maximum frequency modes $(k_{\max, x} = 16, k_{\max, y} = 16, k_{\max, z} = 8)$, and applying inverse FFTs.
  - **Affine Coordinate Transformation:** Implements the physics-scaling layer (Mandl et al., 2023) to eliminate numerical stiffness between large hydraulic head values ($10^1\text{ m}$) and small compaction displacements ($10^{-3}\text{ m}$).
  - **Projection Layer ($Q$):** Projects latent tensors back to target physical fields: hydraulic head $h(x, y, z, t)$ and land settlement $\Delta b(x, y, t)$.

#### Tier 4: Automated Verification Pipeline (FloPy / MODFLOW 6 CSUB)
- **Role:** Generates offline synthetic training datasets via Latin Hypercube Sampling (LHS) and executes on-demand numerical benchmarks for user verification.
- **Configuration:**
  - Fully headless Python service utilizing FloPy to construct MODFLOW 6 simulation packages (`dis`, `npf`, `sto`, `wel`, `csub`, `oc`).
  - Solves the coupled finite-difference equations using the Iterative Model Solver (IMS).

---

### 3. Governing Physical Equations and Loss Residuals

During offline training, the surrogate engine is constrained by the exact differential equations implemented in USGS MODFLOW 6 CSUB:

#### 1. 3D Saturated Flow Mass Conservation ($\mathcal{L}_{\text{flow}}$)
$$\mathcal{R}_{\text{flow}} = \frac{\partial}{\partial x}\left(K_{xx}\frac{\partial h}{\partial x}\right) + \frac{\partial}{\partial y}\left(K_{yy}\frac{\partial h}{\partial y}\right) + \frac{\partial}{\partial z}\left(K_{zz}\frac{\partial h}{\partial z}\right) + W - S_s\frac{\partial h}{\partial t} = 0$$

#### 2. Terzaghi Path-Dependent Clay Compaction ($\mathcal{L}_{\text{comp}}$)
$$\mathcal{R}_{\text{comp}} = \frac{\partial (\Delta b)}{\partial t} + b_0 \left[ H_\epsilon(h_{\min} - h) S_{skv} + \left(1 - H_\epsilon(h_{\min} - h)\right) S_{ske} \right] \frac{\partial h}{\partial t} = 0$$

Where $H_\epsilon(h_{\min} - h)$ is a differentiable sigmoid switching gate:
$$H_\epsilon(h_{\min} - h) = \frac{1}{1 + \exp\left(-\frac{h_{\min} - h}{\epsilon}\right)} \quad (\epsilon = 0.05\text{ m})$$

#### 3. Composite Training Loss
$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{data}}(h, \Delta b) + \lambda_{\text{flow}}\mathcal{L}_{\text{flow}}(h) + \lambda_{\text{comp}}\mathcal{L}_{\text{comp}}(\Delta b, h)$$
Weights $\lambda_{\text{flow}}$ and $\lambda_{\text{comp}}$ are dynamically balanced during training using GradNorm to prevent gradient vanishing.

---

### 4. Interactive Demonstration State Flow

```
[ User Adjusts Well / Pumping Slider ]
                 │
                 ▼
 [ Update React State (useScenarioState Hook) ]
                 │
                 ├─────────────────────────────────────────┐
                 ▼                                         ▼
   [ Deform Three.js Surface Mesh ]          [ Update 2D MapLibre Iso-Lines ]
   • Real-time vertex displacement           • Dynamic GeoJSON fill & lines
   • Recalculate face normals                • Color code subsidence bowls
                 │                                         │
                 └───────────────────┬─────────────────────┘
                                     ▼
                      [ Update Dual-Engine HUD ]
                      • PINO Latency: 2.3 ms
                      • Preconsolidation Flag: ACTIVE
                      • Status: Stable
```

---

### 5. Frontend Feature-Oriented Project Structure and Component Contracts

The client application adopts a **feature-oriented architectural pattern** that separates user-facing functional capabilities from shared presentation primitives, domain schemas, and physics models.

#### 5.1 Directory Layout

```text
src/
├── app/
│   ├── App.jsx                                  # Application shell and feature coordinator
│   └── (App-level providers / routers)
│
├── features/
│   ├── scenarios/                               # Scenario configuration and parameter management
│   │   ├── components/ScenarioSetupPanel.jsx   # Well rate sliders, MAR toggles, preset selectors
│   │   ├── hooks/useScenarioState.js           # Authoritative scenario state hook & reset logic
│   │   └── index.js                            # Public feature export barrel
│   │
│   ├── simulation/                              # Dual-engine telemetry and benchmark monitoring
│   │   ├── components/DualBenchmarkHUD.jsx     # PINO vs MODFLOW 6 latency and error metrics
│   │   └── index.js                            # Public feature export barrel
│   │
│   ├── map/                                     # 2D geospatial map visualization
│   │   ├── components/MapLibreMap.jsx          # MapLibre GL JS basemap, synthetic GeoJSON grid
│   │   └── index.js                            # Public feature export barrel
│   │
│   ├── aquifer-visualization/                  # 3D WebGL subsurface cutaway
│   │   ├── components/CentralViewport.jsx      # Split/Single view container & view mode switcher
│   │   ├── components/Aquifer3DCanvas.jsx      # Three.js scene, strata layers, cutaway clipping
│   │   └── index.js                            # Public feature export barrel
│   │
│   ├── analytics/                               # Subsidence, drawdown, and flood analytics
│   │   ├── components/BottomAnalyticsSuite.jsx # Recharts multi-station drawdown & flood metrics
│   │   └── index.js                            # Public feature export barrel
│   │
│   └── verification/                            # Verification dialog and benchmark cross-checks
│       ├── components/VerificationModal.jsx    # Simulated numerical solver verification dialog
│       └── index.js                            # Public feature export barrel
│
├── components/
│   ├── layout/
│   │   ├── TopNavigation.jsx                   # Primary application header & mode toggles
│   │   └── index.js                            # Layout export barrel
│   └── ui/
│       ├── GuideModal.jsx                      # User onboarding and guidance modal
│       └── index.js                            # UI components export barrel
│
├── domain/
│   └── scenario/
│       ├── scenarioDefaults.js                 # Authoritative scenario presets and domain bounds
│       └── index.js                            # Domain export barrel
│
├── data/
│   └── geographic/
│       ├── metroIloiloGIS.js                   # District coordinates, bounding box, spatial bounds
│       └── index.js                            # Geographic data export barrel
│
├── physics/
│   ├── groundwaterPhysics.js                   # Client-side analytical Darcy-Theis calculations
│   └── README.md                               # Scientific boundary and demonstration integrity notes
│
├── index.css                                   # Tailwind CSS v4 directives & custom utilities
└── main.jsx                                    # Application bootstrapping entrypoint
```

#### 5.2 Responsibility Contracts

| Module / Component | Single Responsibility | Explicit Non-Responsibilities |
| :--- | :--- | :--- |
| **`src/app/App.jsx`** | Composes top-level layout regions, coordinates cross-feature state via `useScenarioState`, and handles modal visibility. | Does not calculate groundwater physics, instantiate Three.js scenes, or configure MapLibre layers directly. |
| **`features/scenarios`** | Manages scenario parameters, well pumping extraction rates, MAR injection, preset switching, and parameter reset behavior. | Does not render 3D meshes or manage map layer styling. |
| **`features/simulation`** | Displays dual-engine HUD telemetry (PINO inference latency, speedup factors, memory footprints, and $L_2$ relative errors). | Does not execute server-side neural operator inference directly; reflects telemetry provided by simulation state. |
| **`features/map`** | Renders 2D MapLibre GL JS basemap, Carto dark raster tiles, synthetic GeoJSON subsidence grid, district markers, and popup inspection. | Does not own scenario parameters or alter global simulation presets. |
| **`features/aquifer-visualization`** | Manages Three.js WebGL scene lifecycle, 3-layer geological strata (sand/clay/sand), real-time mesh deformation, and volumetric cutaway clipping. | Does not define geographic coordinate projections or replace authoritative numerical solvers. |
| **`features/analytics`** | Renders multi-station drawdown time series, Terzaghi consolidation curves, and coastal flood risk meters via Recharts. | Does not re-calculate raw Darcy equations; consumes outputs computed by domain physics. |
| **`features/verification`** | Displays numerical verification dialog with simulated MODFLOW 6 CSUB benchmark cross-checks and Wilcoxon signed-rank results. | Does not present client-side simulated curves as live production solver connections. |
| **`components/layout`** | Renders header branding, mode switches (2D GIS, 3D Subsurface, Split View), and verification launch triggers. | Does not contain scenario state logic. |
| **`components/ui`** | Reusable presentation primitives and informational modals (e.g., `GuideModal.jsx`). | Contains no groundwater domain business logic. |
| **`domain/scenario`** | Centralizes scenario presets (Sustainable Baseline, Over-Extraction Crisis, MAR Injection, Drought Shock) and parameter boundary contracts. | Contains zero React rendering code. |
| **`data/geographic`** | Houses Metro Iloilo geographic district centroids, bounding boxes, and Carto tile endpoint constants. | Free of UI rendering or state logic. |
| **`physics/`** | Implements deterministic Darcy-Theis drawdown and 1D Terzaghi clay compaction for interactive browser demonstration. | Clearly documented in `physics/README.md` as illustrative client-side physics, not a replacement for offline-trained PINO or USGS MODFLOW 6. |

#### 5.3 Barrel Export Pattern

Every feature and shared module encapsulates internal implementation details behind an `index.js` barrel file:
```javascript
// Example: src/features/scenarios/index.js
export { default as ScenarioSetupPanel } from './components/ScenarioSetupPanel.jsx';
export { useScenarioState } from './hooks/useScenarioState.js';
```
This isolates consumer imports in `App.jsx` and across features, preventing deep relative path couplings and enabling team members to refactor internal feature components without breaking other modules.

#### 5.4 State Management and Determinism

The prototype deliberately maintains **one authoritative scenario state** via `useScenarioState`:
- **Deterministic:** Given identical inputs (wells, pumping rates, MAR status), the client-side physics model computes identical drawdown and subsidence outputs.
- **Isolated editing:** Adjusting sliders updates scenario state without triggering unintended side-effects in unrelated features.
- **Lightweight:** Uses React standard hooks (`useState`, `useCallback`, `useMemo`) without introducing extraneous third-party global state libraries like Redux or Zustand.
