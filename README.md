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

**Aquifera** is an interactive web-based simulation platform and automated pipeline designed to address the severe computational bottlenecks of traditional regional groundwater modeling. 

Standard finite-difference numerical solvers (such as **USGS MODFLOW 6 CSUB**) require 3 to 5 minutes (or hours for large regional grids) to compute non-linear skeletal consolidation, preventing interactive scenario exploration during urban planning and water allocation meetings. 

Aquifera solves this by deploying a **Physics-Informed Neural Operator (PINO)** surrogate engine that delivers **sub-second ($< 250\text{ ms}$, $\approx 80,000\times$ speedup)** 3D hydraulic head and land subsidence simulations on commodity workstation hardware, while maintaining on-demand numerical verification with the USGS gold standard.

---

## 📚 Documentation Suite

Comprehensive engineering specifications, architectural contracts, and interface design guides are maintained in the [`docs/`](./docs) directory:

* [**Documentation Master Index (`docs/README.md`)**](./docs/README.md): System overview, core metric table, quick reference, and operational setup.
* [**Software Requirements & Specifications (`docs/SPECIFICATIONS.md`)**](./docs/SPECIFICATIONS.md): Functional (FR-01 to FR-08), non-functional (NFR-01 to NFR-08 based on ISO/IEC 25010:2023), domain parameter bounds, and anti-hallucination integrity rules.
* [**System Architecture & Pipeline (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md): 4-tier architectural specification, PINO 3D surrogate formulation, FloPy/MODFLOW 6 CSUB verification pipeline, Darcy mass conservation, and interactive data flows.
* [**UI/UX & HCI Design Guide (`docs/UI-UX-GUIDE.md`)**](./docs/UI-UX-GUIDE.md): Obsidian-dark design system, HSL color tokens, Three.js 3D viewport hierarchy, dual-engine benchmark HUD, and WCAG accessibility standards.
* [**Prototype Implementation Plans (`docs/plans/`)**](./docs/plans): Phased implementation roadmaps, UI/UX audits, and demonstration state designs.

---

## 🏛️ 4-Tier System Architecture

```
[ Tier 1: Client Presentation ]
   └── React 19 + Three.js WebGL (Interactive 3D Cutaway, Real-Time Mesh Deformation)
           │
           ▼ (WebSocket / REST API)
[ Tier 2: API Gateway & Orchestrator ]
   └── FastAPI + Redis Caching (< 10 ms cache hits, celery background job dispatch)
           │
           ├─────────────────────────────────────────┐
           ▼                                         ▼
[ Tier 3: Surrogate Inference ]           [ Tier 4: Verification Pipeline ]
   └── PyTorch CUDA PINO                     └── Headless USGS MODFLOW 6 CSUB
       (< 250 ms, RTX 4050 <= 4.2 GB VRAM)       (FloPy Automated Discretization & Solvers)
```

---

## ✨ Interactive Prototype Capabilities

1. **Stratified 3D Geotechnical Cutaway (Three.js):**
   * **Upper Unconfined Sand (0–30 m):** Permeable aquifer.
   * **Clay Aquitard (30–60 m):** Highly compressible layer prone to irreversible skeletal collapse.
   * **Lower Confined Sand (60–120 m):** High-transmissivity extraction aquifer.
   * **Dynamic Surface Mesh:** Real-time deformation showing the cone of depression and subsidence trough.
   * **Volumetric Cutaway:** Toggle $50\%$ stratum clipping to inspect internal clay compaction.

2. **Real-Time Hydromechanical Physics Engine:**
   * Formulates multi-well radial drawdown (Theis equation) and 1D Terzaghi skeletal consolidation.
   * **Preconsolidation Threshold Alert:** Triggers a critical alert when head drops below $h_{\text{pre}} = 88.0\text{ m}$, signaling irreversible plastic compaction ($S_{skv} = 2.8 \times 10^{-3}\text{ m}^{-1}$).

3. **Dual-Engine Benchmark HUD:**
   * Live latency tracker: **PINO ($2.3\text{ ms}$)** vs. **USGS MODFLOW 6 ($184.2\text{ s}$)**.
   * Quality metrics: $R^2 = 0.942$, Relative $L_2 = 3.8\%$, $\text{RMSE} = 4.2\text{ mm}$.
   * Testbed compliance: Formatted for NVIDIA RTX 4050 ($1.8\text{ GB}$ VRAM allocation).

4. **Tier 4 Asynchronous Verification Engine:**
   * Run on-demand simulated background solver cross-checks.
   * Interactive 2D W-E cross-section graph proving tight alignment with USGS MODFLOW 6.
   * Wilcoxon signed-rank test validation ($p = 0.824 > 0.05$).

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

### Production Build
```bash
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
