# AQUIFERA: System Architecture Specification
## Multi-Tier Architecture, Neural Operator Surrogates, and Verification Pipelines

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026–2027 | Research Group 2*

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

---

### 2. Tier-by-Tier Component Specifications

#### Tier 1: Client Presentation Layer
- **Framework:** React 19, Vite 8.3, and Tailwind CSS.
- **3D Subsurface Viewport (Three.js):**
  - Renders a volumetric cutaway model of Metro Iloilo's alluvial aquifer system.
  - Implements custom vertex shaders to deform the upper ground mesh in real time based on computed compaction values $\Delta b(x, y)$.
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
     [ Update React State (Zustand) ]
                 │
                 ├─────────────────────────────────────────┐
                 ▼                                         ▼
   [ Deform Three.js Surface Mesh ]          [ Update 2D MapLibre Iso-Lines ]
   • Real-time vertex displacement           • Dynamic SVG / Canvas overlay
   • Recalculate face normals                • Color code subsidence bowls
                 │                                         │
                 └───────────────────┬─────────────────────┘
                                     ▼
                      [ Update Dual-Engine HUD ]
                      • PINO Latency: 2.3 ms
                      • Preconsolidation Flag: ACTIVE
                      • Status: Stable
```
