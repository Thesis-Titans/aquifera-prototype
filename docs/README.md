# AQUIFERA Prototype Documentation Suite
## Web-Based Simulation Platform and Automated Pipeline for Subsurface Compaction Modeling Using Physics-Informed Neural Operator Surrogates

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Overview and Purpose

This directory houses the technical, architectural, and design specifications for the **Aquifera Interactive Web Prototype**. The prototype serves as the working empirical artifact for CICT Capstone Proposal Defense (Form `CICT-UGR-F001`, Category 4: Application and Infrastructure Development).

Standard finite-difference numerical groundwater solvers, such as USGS MODFLOW 6 with the Skeletal Storage, Compaction, and Subsidence (CSUB) package, exhibit runtime latencies of 15 to 45 minutes per multi-year regional run. This computational bottleneck prohibits interactive "what-if" scenario evaluation during metropolitan water planning and zoning meetings. 

The Aquifera platform demonstrates an accessible computing intervention: coupling an offline-trained Physics-Informed Neural Operator (PINO) surrogate engine with a modern web dashboard. The system delivers sub-second ($< 250\text{ ms}$, $\approx 80,000\times$ speedup) 3D hydraulic head and land subsidence simulations on standard workstation hardware (NVIDIA RTX 4050 6 GB GPU), with on-demand numerical verification against benchmark USGS MODFLOW 6 CSUB physics.

---

### 2. Documentation Architecture

```text
docs/
├── README.md                      # This master index and overview
├── SPECIFICATIONS.md              # Software Requirements Specification (SRS), ISO/IEC 25010 & integrity rules
├── ARCHITECTURE.md                # 4-Tier system architecture, Three.js 3D cutaway & FloPy verification
├── DATA-PROVENANCE.md             # Cartographic basemap sources, WGS84/PRS92, grid specs & geotechnical strata
├── SCIENTIFIC-VALIDATION.md       # 4-Tier validation hierarchy, Theis/Cooper-Jacob, Terzaghi hysteresis & oral defense FAQ
├── UI-UX-GUIDE.md                 # Design system, HSL tokens, Three.js viewport & HUD layout
├── plans/                         # Project implementation plans and historical revisions
│   ├── AQUIFERA-Modular-Refactoring-and-Integrity-Plan.md  # Comprehensive 5-phase modular refactoring plan
│   └── prototype-plan-v2.md       # Implementation roadmap and demonstration state design
├── archive/                       # Deprecated and retired code artifacts
│   └── legacy-components/         # Retired 2D canvas and overlay components preserved for audit
├── scripts/                       # Asset preprocessing and viewport cropping utilities
│   └── crop_maps.ps1              # Map viewport extraction script
└── screenshots/                   # High-resolution dashboard captures and UI references
    ├── AQUIFERA 2D Subsidence Dashboard.png
    ├── AQUIFERA Groundwater Insights Dashboard.png
    └── AQUIFERA Metro Iloilo Simulation Dashboard.png
```

---

### 3. Quick Reference: Core System Specifications

| Architectural Characteristic | Engineering Standard / Specification Target | Verification Source / Tool |
| :--- | :--- | :--- |
| **Primary Framework** | React 19 + Vite 8.3 + Tailwind CSS | Node.js v20+ / Modern Web Standards |
| **3D Geotechnical Rendering** | Three.js WebGL (Custom Shader & Cutaway Plane) | Hardware-accelerated GPU canvas |
| **Geographic Mapping** | MapLibre GL JS / Geospatial Raster Overlay | WGS84 / PRS92 (EPSG:3125) Alignment |
| **Surrogate Inference Latency** | $< 250\text{ ms}$ per 3D scenario run | PyTorch CUDA / TensorRT Profiler |
| **Predictive Accuracy Target** | Relative $L_2$ error $\le 5.0\%$ vs. MODFLOW 6 CSUB | 200 held-out Monte Carlo test scenarios |
| **Physics Conservation Constraint** | Volumetric fluid mass balance loss $\mathcal{L}_{\text{flow}} \le 5\%$ | Automated FloPy cell-by-cell budget |
| **Hardware Testbed Baseline** | Intel Core i5-13500H, 16 GB RAM, RTX 4050 6 GB VRAM | Peak allocation $\le 4.2\text{ GB}$ VRAM |

---

### 4. Running the Interactive Prototype Locally

To launch the prototype for local testing or stakeholder demonstration:

```bash
# 1. Navigate to the prototype directory
cd "01-concepts/01-aquifera/05-artifacts/aquifera-prototype"

# 2. Install dependencies
npm install

# 3. Start the local Vite development server
npm run dev
```

Open your browser to `http://localhost:5173/` (or the port reported by Vite) to interact with the 3D cutaway, toggle well extraction rates, and evaluate dual-engine HUD telemetry.
