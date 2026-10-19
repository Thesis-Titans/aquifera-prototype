# AQUIFERA: Software Requirements Specification (SRS)
## Functional and Non-Functional Requirements Specification for the Web Simulation Platform

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026–2027 | Research Group 2*

---

### 1. Purpose and System Scope

This document specifies the software requirements, behavioral constraints, and verification metrics for the **Aquifera** web simulation platform and automated data pipeline. 

Under the CICT Capstone Governance Framework (CMO No. 25 s. 2015, Category 4: Application and Infrastructure Development), the project engineers a containerized, browser-accessible computing intervention that bridges the gap between complex geomechanical physics and accessible scenario exploration for water resource planners and municipal regulatory authorities.

---

### 2. Non-Negotiable Research Integrity Rules

To preserve scientific rigor and prevent misleading user expectations, the platform enforces the following integrity standards:

1. **Persistent Demonstration Notice:** The client UI displays an unobscured notification stating:  
   `RESEARCH PROTOTYPE: DEMONSTRATION WORKSPACE. LIVE NUMERICAL SIMULATIONS RUN VIA BACKGROUND VERIFICATION PIPELINE.`
2. **Clear Data Provenance:** Every metric, map layer, and cross-section chart explicitly displays its data provenance category: `Synthetic Demonstration`, `Offline Neural Surrogate`, or `Headless MODFLOW 6 Benchmark`.
3. **Transparent Benchmark Labels:** Numerical solver comparisons display verifiable timestamp logs and hardware resource consumption. Mock curves are never labeled as measured ground-truth data.
4. **Physical Law Enforcement:** Output fields are bounded by governing physical equations (Darcy fluid conservation and Terzaghi 1D consolidation), preventing synthetic hallucinations such as unphysical groundwater rebound during extraction.

---

### 3. Functional Requirements (FR)

#### FR-01: Stratified 3D Geotechnical Cutaway View
- The system shall render an interactive 3D WebGL cutaway of the Metro Iloilo deltaic aquifer system comprising three distinct hydrostratigraphic layers:
  - **Layer 1 (0 to 30 m):** Upper unconfined alluvial sand and silt aquifer.
  - **Layer 2 (30 to 60 m):** Low-permeability, compressible marine clay aquitard.
  - **Layer 3 (60 to 120 m):** Lower semi-confined to confined sand/gravel regional production aquifer.
- The user shall have interactive camera controls (orbit, pan, zoom, preset views) and an adjustable clipping plane ($0\%$ to $100\%$) to inspect internal clay compaction.

#### FR-02: Spatial Well Placement and Extraction Schedules
- The platform shall allow users to interactively place and configure multiple deep extraction wells across the spatial domain.
- For each well, the user shall configure:
  - Spatial coordinates $(x, y)$ in PRS92 / UTM Zone 51N (EPSG:3125).
  - Pumping rate $Q$ ranging from $0$ to $5,000\text{ m}^3/\text{day}$.
  - Screened depth interval (selecting either Layer 1 or Layer 3).
  - Extraction schedule (continuous, seasonal rotation, or emergency drought pumping).

#### FR-03: Real-Time Coupled Drawdown and Compaction Inference
- Upon adjusting extraction parameters, the surrogate engine shall compute:
  - 3D hydraulic head field $h(x, y, z, t)$ showing localized cones of depression.
  - Accumulated skeletal consolidation displacement $\Delta b(x, y, t)$ across the compressible clay aquitard.
- The 3D surface ground mesh shall deform dynamically in real time to visualize localized subsidence bowls.

#### FR-04: Terzaghi Preconsolidation Plastic Alert Thresholds
- The platform shall track the running minimum historical hydraulic head $h_{\min}(\mathbf{x}, t)$.
- When the localized head drops below the preconsolidation head threshold ($h < h_{\min}$), the system shall trigger a high-priority UI alert indicating that the clay interbed has transitioned from recoverable elastic compression ($S_{ske} \approx 10^{-5}\text{ m}^{-1}$) to permanent, irreversible inelastic compaction ($S_{skv} \approx 10^{-3}\text{ m}^{-1}$).
- Visual warning badges shall highlight barangays where annual projected subsidence exceeds $5\text{ mm/year}$.

#### FR-05: Dual-Engine Benchmark Heads-Up Display (HUD)
- The user interface shall feature a synchronized benchmark HUD comparing the performance of:
  - **Surrogate Engine (PINO PyTorch CUDA):** Inference runtime ($< 250\text{ ms}$), VRAM usage, and estimated energy consumption.
  - **Numerical Solver (USGS MODFLOW 6 CSUB):** Execution time ($180\text{ s}$ to $2,700\text{ s}$), CPU thread load, and grid convergence iterations.
- The HUD shall display relative accuracy metrics ($L_2$ head error, $L_2$ compaction error, and coefficient of determination $R^2$).

#### FR-06: Asynchronous Numerical Verification Pipeline Trigger
- The user shall have an on-demand verification button: `Verify with MODFLOW 6`.
- Clicking this control packages the current wellfield configuration, dispatches a background Celery task to the Tier 4 FloPy service, executes the finite-difference solver, and overlays the exact benchmark contours over the neural surrogate predictions.

#### FR-07: Geospatial Export Engine
- The system shall provide one-click export endpoints allowing users to download simulation outputs in standard formats:
  - **GeoJSON:** Vector contours of subsidence bowls projected in PRS92 / UTM Zone 51N for immediate ingestion into CPDO and CDRRMO GIS platforms.
  - **GeoTIFF:** Georeferenced raster surfaces of hydraulic drawdown and cumulative compaction.
  - **CSV / Tabular:** Piezometric elevation time series for utility monitoring.

#### FR-08: Multi-Scenario Comparison Mode
- The system shall support split-screen or overlay comparison between two hypothetical water management scenarios (e.g., Scenario A: Status-Quo Commercial Pumping vs. Scenario B: 40% Surface Water Substitution).

---

### 4. Non-Functional Requirements (NFR) Aligned with ISO/IEC 25010:2023

| ISO/IEC 25010 Characteristic | Requirement Identifier | Technical Metric / Acceptance Threshold | Verification Method |
| :--- | :--- | :--- | :--- |
| **Performance Efficiency** | **NFR-01 (Inference Latency)** | Model inference execution time $T_{\text{infer}} < 250\text{ ms}$ on 3D spatial grids ($64 \times 64 \times 16$). | CUDA event timer / API response profiler. |
| **Performance Efficiency** | **NFR-02 (Computational Speedup)** | Minimum speedup factor $S_p \ge 50\times$ compared to headless USGS MODFLOW 6 CSUB solver on identical scenarios. | Benchmark timing across 200 simulation runs. |
| **Performance Efficiency** | **NFR-03 (Hardware Footprint)** | Peak VRAM consumption $\le 4.2\text{ GB}$ during inference on commodity hardware (NVIDIA RTX 4050 6 GB GPU). | `torch.cuda.max_memory_allocated()` profiler. |
| **Functional Suitability** | **NFR-04 (Predictive Accuracy)** | Relative spatial $L_2$ error $\le 5.0\%$ on hydraulic head ($h$) and compaction ($\Delta b$) across 200 held-out Monte Carlo test scenarios. | Automated tensor comparison against MODFLOW 6 arrays. |
| **Functional Suitability** | **NFR-05 (Physical Mass Conservation)** | Volumetric mass balance error reduction $\ge 40\%$ compared to an unconstrained baseline FNO model. | Cell-by-cell Darcy fluid budget calculation. |
| **Reliability & Robustness** | **NFR-06 (Stress Tolerance)** | The surrogate model must remain stable without numerical divergence when evaluated on out-of-distribution pumping stresses ($Q_{\text{test}} = 1.3 \times Q_{\max}$). | Held-out OOD stress evaluation suite. |
| **Reliability & Robustness** | **NFR-07 (Hysteresis Preservation)** | Under complete pumping cessation and water table recovery, the model shall predict zero false rebound of inelastic compaction ($\Delta b_{\text{inelastic}}$). | Physical monotonicity loss verification. |
| **Usability & Accessibility** | **NFR-08 (Accessibility)** | UI color contrast ratios $\ge 4.5:1$ (WCAG 2.1 Level AA) for data readouts, alert badges, and legend text. | Automated Lighthouse / axe accessibility audit. |

---

### 5. Data and Interface Specifications

#### 5.1 Hydrogeological Domain Bounds (Metro Iloilo Alluvial Basin)
- **Spatial Grid Extent:** $10.0\text{ km} \times 10.0\text{ km}$ covering Mandurriao, Molo, City Proper, and Jaro.
- **Vertical Grid Extent:** $120.0\text{ m}$ depth discretized into 3 hydrostratigraphic layers.
- **Vertical Hydraulic Conductivity ($K_{zz}$):** $1.0 \times 10^{-9}$ to $1.0 \times 10^{-7}\text{ m/s}$ (clay aquitard).
- **Elastic Skeletal Specific Storage ($S_{ske}$):** $1.0 \times 10^{-5}\text{ m}^{-1}$.
- **Inelastic Skeletal Specific Storage ($S_{skv}$):** $1.0 \times 10^{-4}$ to $1.0 \times 10^{-2}\text{ m}^{-1}$.
- **Well Pumping Capacity ($Q$):** $0$ to $5,000\text{ m}^3/\text{day}$ per well.
