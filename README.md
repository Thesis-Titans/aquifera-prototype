# AQUIFERA: Web-Based Simulation Platform
> **SIMULATE • VERIFY • SUSTAIN**  
> *A Web-Based Simulation Platform and Automated Pipeline for Subsurface Compaction Modeling Using Physics-Informed Neural Operator Surrogates*

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![Standards](https://img.shields.io/badge/ISO%2FIEC%2025010-2023-00f2fe)](https://www.iso.org/standard/78176.html)
[![Organization](https://img.shields.io/badge/Organization-Thesis--Titans-blue)](https://github.com/Thesis-Titans)

---

## 🌊 Overview

**Aquifera** is an interactive web-based simulation platform designed to address the severe computational bottlenecks of traditional regional groundwater modeling. 

Standard finite-difference numerical solvers (such as **USGS MODFLOW 6 CSUB**) require 3 to 45 minutes to compute non-linear skeletal consolidation, preventing interactive scenario exploration during metropolitan urban planning and water allocation meetings. 

The Aquifera capstone research proposes an accessible computing intervention: coupling an offline-trained **Physics-Informed Neural Operator (PINO)** surrogate engine with a modern web dashboard. Ground-truthed during consultations with the **Iloilo City Planning and Development Office (CPDO)**, the system targets sub-second ($< 250\text{ ms}$) 3D hydraulic head and land subsidence simulations on commodity workstation hardware (e.g., NVIDIA RTX 4050 6 GB GPU) for **live meeting-room decision support**, aiding the upcoming **CLUP 2021–2029** update while enabling on-demand numerical verification against benchmark USGS MODFLOW 6 CSUB physics.

> [!NOTE]
> **Prototype Status & Academic Integrity Statement:**  
> This repository contains the **Tier 1 Interactive Web Prototype** created for proposal defense and UI/UX validation. Current in-browser calculations use an illustrative analytical Darcy-Theis and Terzaghi consolidation model (`src/physics/groundwaterPhysics.js`) rendered over authentic **PSA/NAMRIA 180-barangay administrative boundaries**. Backend surrogate inference (Tier 3) and automated FloPy numerical verification (Tier 4) represent the **proposed research architecture** to be developed and evaluated during subsequent project phases. All HUD benchmark figures and verification curves are illustrative demonstration telemetry.

---

## 📊 Implementation Status & Verification Delineation

| System Subsystem | Category | Current Status | Description & Academic Qualification |
| :--- | :--- | :--- | :--- |
| **Interactive Web Dashboard** | Client (Tier 1) | **Implemented** | React 19 SPA, Vite 8.3, Tailwind CSS v4, responsive layout. |
| **3D Subsurface Viewport** | Client (Tier 1) | **Implemented** | Three.js WebGL canvas, 3-layer geotechnical strata cutaway, dynamic surface mesh displacement. |
| **2D Geospatial Basemap** | Client (Tier 1) | **Implemented** | MapLibre GL JS with CARTO Dark basemap, authentic 180-barangay PSA/NAMRIA GeoJSON boundaries, and dynamic subsidence overlays. |
| **Client-Side Physics Engine** | Client (Tier 1) | **Implemented (Illustrative)** | Analytical Darcy-Theis multi-well drawdown and Terzaghi skeletal compaction (`groundwaterPhysics.js`). Evaluated for interactive demonstration; not a substitute for numerical solvers. |
| **Scenario Presets & Reset** | Client (Tier 1) | **Implemented** | Baseline, Overdraft, MAR, Drought Shock presets with isolated state resets. |
| **Dual-Engine Telemetry HUD** | UI Prototype | **Illustrative Demo Telemetry** | Displays target engineering telemetry ($< 250\text{ ms}$, speedup, $R^2$, $L_2$). Clearly identified as demonstration placeholders, NOT measured results from a live model. |
| **Verification Modal Cross-Checks** | UI Prototype | **Illustrative Demo Interface** | Interactive dialog demonstrating the proposed benchmark comparison interface and cross-section charts. |
| **API Gateway & Orchestration** | Backend (Tier 2) | **Proposed Specification** | FastAPI async service, Redis caching, Celery queue. Documented in `docs/ARCHITECTURE.md` as target architecture. |
| **PINO Surrogate Inference Engine**| Backend (Tier 3) | **Proposed Research Goal** | Pre-trained PyTorch 3D Physics-Informed Neural Operator to be trained and benchmarked during capstone methodology. |
| **MODFLOW 6 Verification Pipeline** | Numerical (Tier 4) | **Proposed Benchmark Pipeline** | Automated FloPy / USGS MODFLOW 6 CSUB verification pipeline to be deployed for empirical cross-validation. |

---

## 📚 Documentation Suite

Comprehensive engineering specifications, architectural contracts, and interface design guides are maintained in the [`docs/`](./docs) directory:

* [**Documentation Master Index (`docs/README.md`)**](./docs/README.md): System overview, core metric table, quick reference, and operational setup.
* [**Data Provenance & Spatial Governance (`docs/DATA-PROVENANCE.md`)**](./docs/DATA-PROVENANCE.md): Authentic PSA/NAMRIA 180-barangay administrative boundary dataset, CPDO CLUP planning volumes, City-ENRO commercial well inventory, and defense talking points.
* [**Software Requirements & Specifications (`docs/SPECIFICATIONS.md`)**](./docs/SPECIFICATIONS.md): Functional (FR-01 to FR-08), non-functional (NFR-01 to NFR-08 based on ISO/IEC 25010:2023), domain parameter bounds, and anti-hallucination integrity rules.
* [**System Architecture & Pipeline (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md): 4-tier architectural specification, PINO 3D surrogate formulation, FloPy/MODFLOW 6 CSUB verification pipeline, Darcy mass conservation, and interactive data flows.
* [**Scientific Validation & Benchmark Hierarchy (`docs/SCIENTIFIC-VALIDATION.md`)**](./docs/SCIENTIFIC-VALIDATION.md): 4-tier validation hierarchy, Theis & Cooper-Jacob analytical solutions, Terzaghi plastic compaction hysteresis, PINO loss formulation, and oral defense protocols.
* [**UI/UX & HCI Design Guide (`docs/UI-UX-GUIDE.md`)**](./docs/UI-UX-GUIDE.md): Obsidian-dark design system, HSL color tokens, Three.js 3D viewport hierarchy, dual-engine benchmark HUD, and WCAG accessibility standards.
* [**Design System Specification (`docs/DESIGN-SYSTEM.md`)**](./docs/DESIGN-SYSTEM.md): Canonical HSL token architecture, typography, spacing/radii scales, and multi-device layout contracts.
* [**Prototype Implementation Plans (`docs/plans/`)**](./docs/plans): Phased implementation roadmaps, UI/UX audits, and demonstration state designs.

---

## 🏛️ 4-Tier Target System Architecture

```
[ Tier 1: Client Presentation ] (IMPLEMENTED PROTOTYPE)
   └── React 19 + Three.js WebGL + MapLibre GL JS (Interactive 3D Cutaway, Real-Time Mesh Deformation)
            │
            ▼ (HTTP / WebSocket - Target Specification)
[ Tier 2: API Gateway & Orchestrator ] (PROPOSED BACKEND SPECIFICATION)
   └── FastAPI + Redis Caching (< 10 ms cache hits, Celery background job dispatch)
            │
            ├─────────────────────────────────────────┐
            ▼                                         ▼
[ Tier 3: Surrogate Inference ]           [ Tier 4: Verification Pipeline ]
   └── PyTorch CUDA PINO (PROPOSED GOAL)      └── Headless USGS MODFLOW 6 CSUB (PROPOSED BENCHMARK)
       (Target: < 250 ms, RTX 4050 <= 4.2 GB)     (FloPy Automated Discretization & Verification)
```

---

## ✨ Interactive Prototype Capabilities

1. **Stratified 3D Geotechnical Cutaway (Three.js):**
   * **Upper Unconfined Sand (0 to 30 m):** Permeable aquifer.
   * **Clay Aquitard (30 to 60 m):** Highly compressible layer prone to irreversible skeletal collapse.
   * **Lower Confined Sand (60 to 120 m):** High-transmissivity extraction aquifer.
   * **Dynamic Surface Mesh:** Real-time deformation showing the cone of depression and subsidence trough.
   * **Volumetric Cutaway:** Toggle 50% stratum clipping to inspect internal clay compaction.

2. **Client-Side Analytical Hydromechanical Physics Engine:**
   * Formulates multi-well radial drawdown (Theis equation via Abramowitz-Stegun rational approximation) and 1D Terzaghi skeletal consolidation.
   * **Preconsolidation Threshold Alert:** Triggers an alert when head drops below $h_{\text{pre}} = 88.0\text{ m}$, signaling irreversible plastic compaction ($S_{skv} = 2.8 \times 10^{-3}\text{ m}^{-1}$).
   * **Isolated Scenario State:** Presets and resets operate with clean, independent state memory.

3. **Dual-Engine Benchmark HUD (Illustrative Target Metrics):**
   * Real-time demonstration telemetry displaying target latency comparisons: **PINO ($< 250\text{ ms}$)** vs. **USGS MODFLOW 6 ($180\text{ s}$)**.
   * Illustrative fidelity indicators: $R^2 = 0.942$, Relative $L_2 = 3.8\%$, $\text{RMSE} = 4.2\text{ mm}$ (calibrated as visual design targets, not measured experimental outcomes).
   * Testbed hardware bounds: Formatted for NVIDIA RTX 4050 ($1.8\text{ GB}$ VRAM allocation).

4. **Tier 4 Verification Dialog (Proposed Comparison Interface):**
   * Demonstrates the proposed on-demand background solver cross-check workflow for stakeholders.
   * Interactive 2D W-E cross-section graph illustrating comparative profile inspection.
   * Displays target statistical evaluation concepts (e.g. Wilcoxon signed-rank test).

5. **Defense Presentation Tooling:**
   * **Slide Snapshot:** One-click high-resolution PNG download for presentation decks.
   * **Defense Presets:** Instant switches between *Sustainable Baseline*, *Over-Extraction Crisis*, *Managed Aquifer Recharge (MAR)*, and *Drought Shock*.

---

## 🚀 Quickstart

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [npm](https://www.npmjs.com/)

### Installation & Run
```bash
# 1. Clone the repository
git clone https://github.com/Thesis-Titans/aquifera-prototype.git
cd aquifera-prototype

# 2. Install dependencies
npm install

# 3. Launch the development server
npm run dev
```

Open your browser at `http://localhost:5173/` to view the 3D simulation platform.

### Tests & Quality Validation
```bash
# Run unit tests for physics engine and state isolation
npm test

# Run linter
npm run lint

# Production build
npm run build
npm run preview
```

---

## 👥 Research Team & Academic Context

* **Program:** Bachelor of Science in Information Technology (BSIT 3-A)
* **Course:** CC 208: Methods of Research in Computing
* **Institution:** College of Information and Communications Technology (CICT)
* **Organization:** [Thesis-Titans](https://github.com/Thesis-Titans)
* **Group:** Group 2
  * Cadangin, Mark Alvin C.
  * Acebuche, Nherie C.
  * Ardeña, Justin Ace A.
  * Benjamin, Mae Daniella Faith C.
  * Tamaño, Vincent John A.

---

## 📄 License
This project is developed for academic capstone research under the College of ICT.
