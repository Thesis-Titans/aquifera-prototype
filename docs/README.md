# AQUIFERA Prototype Documentation Suite
## Web-Based Simulation Platform and Automated Pipeline for Subsurface Compaction Modeling Using Physics-Informed Neural Operator Surrogates

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Overview and Purpose

This directory houses the technical, architectural, and design specifications for the **Aquifera Interactive Web Prototype**. The prototype serves as the working empirical artifact for the **BSIT Thesis Proposal Defense** (Form `CICT-UGR-F001`, BSIT Category 4: Pure Scientific Research and Simulation in IT, Layer 3: Application and Infrastructure Layer).

Standard finite-difference numerical groundwater solvers, such as USGS MODFLOW 6 with the Skeletal Storage, Compaction, and Subsidence (CSUB) package, require 4.5 to 96 s per forward simulation (median 22.5 s) on the study's synthetic 5-layer test grid ($64 \times 64 \times 5 = 20,480$ cells). Evaluating multi-scenario sweeps multiplies this computational cost, rendering interactive "what-if" scenario evaluation impractical during metropolitan land-use planning sessions.

The Aquifera platform demonstrates an accessible computing intervention: coupling an offline-trained Physics-Informed Neural Operator (PINO) surrogate engine with a containerized web dashboard. Informed by statutory planning frameworks (Iloilo City CLUP 2021–2029, P.D. 1067), the system delivers sub-second ($< 250\text{ ms}$) 3D hydraulic head and land subsidence simulations on standard workstation hardware (NVIDIA RTX 4050 6 GB GPU) for interactive planning deliberations, while enabling on-demand numerical verification against benchmark USGS MODFLOW 6 CSUB physics.

---

### 2. Feature & Architecture Status Matrix

To maintain strict academic and scientific integrity, platform capabilities are classified across three distinct stages:

| Architectural Component | Implementation Status | Technical Mechanism | Verification Anchor |
| :--- | :---: | :--- | :--- |
| **Client UI Shell (Tier 1)** | **Implemented** | React 19, TailwindCSS 4, TopNav, ScenarioSetupPanel, BottomAnalyticsSuite | `src/app/App.jsx` |
| **Interactive 3D Cutaway** | **Implemented** | Three.js (r182), stratified 5-layer geometry, well cylinders, cutaway clipping | `src/features/aquifer-visualization/` |
| **2D GIS Map (MapLibre)** | **Implemented** | MapLibre GL 5, ESRI basemap, authentic PSA PSGC Barangay & City GeoJSON | `src/features/map/` |
| **Client-Side Analytical Model** | **Implemented (Illustrative)** | Fast Theis (1935) radial drawdown + Terzaghi plastic compaction preview | `src/physics/groundwaterPhysics.js` |
| **Dual Export (GeoJSON/CSV)** | **Implemented** | RFC 7946 GeoJSON + cross-section profile CSV with research disclaimers | `src/physics/fields.js` |
| **USGS MODFLOW 6 CSUB Pipeline** | **Feasibility Benchmarked** | Automated FloPy script running headless MODFLOW 6.8.1 (22.5 s median runtime) | `05-artifacts/pilot/PILOT-RESULTS-2026-10-23.md` |
| **PINO Surrogate Model** | **Feasibility Benchmarked** | 3D FNO PyTorch CUDA forward pass (38.6 ms latency, 2.14 GB VRAM on RTX 4050) | `05-artifacts/scripts/gpu_fno_check.py` |
| **Live Backend API (Tier 2–4)** | **Proposed (Thesis Target)** | FastAPI gateway, Redis caching, Celery async verification queue | Proposal Form F001 §Methodology 5 |
| **Live Residual Fallback (η)** | **Sprint Simulated** | Real-time PDE conservation residual gauge with automated fallback warning | `docs/plans/SPRINT-PLAN.md` (Sprint 3) |

---

### 3. Documentation Directory Structure

```text
docs/
├── README.md                      # Master index, status matrix, and governance rules
├── ARCHITECTURE.md                # 4-Tier container architecture, Three.js 3D cutaway & FloPy verification
├── DATA-PROVENANCE.md             # Basemap sources, PSA PSGC GeoJSON, WGS84/PRS92, 5-layer stratigraphy
├── SCIENTIFIC-VALIDATION.md       # Validation hierarchy, Theis/Cooper-Jacob, Terzaghi hysteresis & defense FAQ
├── DESIGN-SYSTEM.md               # Scientific workstation design tokens, WCAG 2.2 AA accessibility contract
├── SPECIFICATIONS.md              # Software Requirements Specification (SRS), ISO/IEC 25010 & integrity rules
├── plans/
│   └── SPRINT-PLAN.md             # Active 4-sprint engineering and hardening roadmap
├── archive/
│   └── plans/                     # Historical planning documents (superseded)
└── screenshots/                   # Dashboard captures and UI references
```

---

### 4. Running the Interactive Prototype Locally

```bash
# 1. Navigate to the prototype directory
cd "01-concepts/01-aquifera/05-artifacts/aquifera-prototype"

# 2. Install dependencies
npm install

# 3. Start the local Vite development server
npm run dev

# 4. Run test suite
npm test
```

Open your browser to `http://localhost:5173/` to interact with the 3D cutaway, adjust well extraction rates, and evaluate dual-engine HUD telemetry.
