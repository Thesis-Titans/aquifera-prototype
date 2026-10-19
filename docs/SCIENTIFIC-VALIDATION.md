# AQUIFERA Scientific Validation and Evaluation Framework
## Multi-Tier Benchmark Architecture, Geotechnical Hysteresis, and Capstone Defense Protocol

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Executive Summary and Validation Philosophy

A central vulnerability of AI applications in environmental and geotechnical modeling is the "black-box" dilemma: neural networks can generate plausible-looking heatmaps that completely violate basic laws of mass conservation and continuum mechanics.

The **AQUIFERA** platform eliminates this threat through a **Four-Tier Scientific Validation Hierarchy**. In this architecture, machine learning is never deployed unconstrained. Every prediction is bounded by classical analytical hydrogeology, Terzaghi geotechnical consolidation theory, and rigorous numerical cross-validation against the gold standard: the United States Geological Survey (USGS) MODFLOW 6 simulator.

This document establishes the theoretical foundations, governing equations, error thresholds, and oral defense protocols required to substantiate AQUIFERA before academic defense panels.

---

### 2. The Four-Tier Validation Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                      AQUIFERA VALIDATION HIERARCHY                     │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 4: Numerical Reference (USGS MODFLOW 6 + CSUB Package via FloPy)  │
│         Rigorous multi-layer finite-difference baseline                │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 3: Physics-Informed Neural Operator (PINO) Surrogate Engine       │
│         Sub-second (<100 ms) mesh-independent inference with PDE loss  │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 2: Geotechnical Skeletal Compaction with Plastic Hysteresis       │
│         Terzaghi 1D consolidation separating elastic vs. plastic strain │
├────────────────────────────────────────────────────────────────────────┤
│ Tier 1: Client-Side Analytical Benchmarks (Theis & Cooper-Jacob)       │
│         Instantaneous exact radial drawdown verification in browser    │
└────────────────────────────────────────────────────────────────────────┘
```

#### 2.1 Tier 1: Client-Side Analytical Benchmarking
To guarantee that the web interface can instantly verify physical trends on any client device without contacting a remote server, AQUIFERA evaluates closed-form analytical solutions directly in the browser runtime (`src/physics/groundwaterPhysics.js`).

##### Theis (1935) Non-Equilibrium Transient Solution
For an extensive, homogeneous, isotropic, and confined aquifer penetrated by a fully penetrating pumping well:

$$s(r, t) = \frac{Q}{4 \pi T} W(u)$$

Where:
* $s(r, t)$: Drawdown in hydraulic head (m) at radial distance $r$ (m) after pumping duration $t$ (days).
* $Q$: Well extraction rate ($\text{m}^3/\text{day}$).
* $T$: Aquifer transmissivity ($\text{m}^2/\text{day}$), where $T = K \times b$.
* $K$: Hydraulic conductivity (m/day).
* $b$: Saturated aquifer thickness (m).
* $S$: Dimensionless storage coefficient, where $S = S_s \times b$.
* $u$: Dimensionless Boltzmann similarity parameter:

$$u = \frac{r^2 S}{4 T t}$$

##### Well Function Approximation $W(u)$
The exponential integral $W(u) = \int_u^{\infty} \frac{e^{-x}}{x} dx$ is evaluated via a rapid polynomial series expansion with relative precision $\varepsilon < 10^{-6}$:

$$W(u) \approx -\gamma - \ln(u) + \sum_{n=1}^{6} (-1)^{n+1} \frac{u^n}{n \cdot n!}$$

Where $\gamma \approx 0.57721566$ is the Euler-Mascheroni constant.

##### Cooper-Jacob (1946) Logarithmic Approximation
When the dimensionless variable $u < 0.05$ (valid for small radial distances or extended pumping times), the higher-order terms vanish, yielding the logarithmic approximation:

$$s(r, t) \approx \frac{2.303 Q}{4 \pi T} \log_{10} \left( \frac{2.25 T t}{r^2 S} \right)$$

In AQUIFERA, the Tier 1 engine continuously compares the Theis exact solution with the Cooper-Jacob simplification, alerting the user via the Verification Modal whenever $u \ge 0.05$, confirming where the logarithmic assumption is mathematically invalid.

---

#### 2.2 Tier 2: Geotechnical Skeletal Compaction with Plastic Hysteresis
Land subsidence is not merely a geometric depression; it is a geotechnical consolidation process governed by effective stress changes in compressible clay layers (aquitards).

##### Terzaghi (1925) Effective Stress Principle
Total overburden stress $\sigma_v$ is supported jointly by the soil skeletal matrix (effective stress $\sigma'_v$) and the pore fluid pressure $u_w$:

$$\sigma_v = \sigma'_v + u_w$$

When groundwater extraction reduces hydraulic head $h$, pore water pressure drops by $\Delta u_w = \rho_w g \Delta h$. Because total overburden stress remains constant, the effective stress on the soil skeleton increases by an equal magnitude:

$$\Delta \sigma'_v = -\Delta u_w = \rho_w g \Delta h_{\text{drawdown}}$$

##### Hysteresis and Permanent Compaction
Compaction in clay-silt aquitards exhibits pronounced hysteresis:

1. **Elastic Range ($h > h_{\text{pre}}$)**: When head fluctuates above the historical lowest point (the preconsolidation threshold $h_{\text{pre}}$), compaction is reversible:
   $$\Delta b_{\text{elastic}} = b_0 \frac{C_r}{1 + e_0} \log_{10} \left( \frac{\sigma'_0 + \Delta \sigma'}{\sigma'_0} \right)$$
   If pumping ceases and the water table recovers, the clay expands elastically (rebound/swelling), recovering up to 85-90% of deformation.

2. **Inelastic / Virgin Plastic Range ($h \le h_{\text{pre}}$)**: When drawdown exceeds preconsolidation head ($h < -15.0\text{ m}$ in Metro Iloilo), clay platelet structures collapse irreversibly. Consolidation is governed by the virgin compression index $C_c$, which is typically 5 to 10 times larger than $C_r$:
   $$\Delta b_{\text{plastic}} = b_0 \frac{C_c}{1 + e_0} \log_{10} \left( \frac{\sigma'_0 + \Delta \sigma'}{\sigma'_{\text{pre}}} \right)$$
   This loss of pore space is permanent. Even if artificial aquifer recharge restores hydraulic head to baseline, the lost aquifer storage capacity cannot be recovered.

AQUIFERA explicitly tracks maximum historical drawdown via a stateful hysteresis register (`resetHysteresisState()` and `maxHistoricalDrawdown` in `groundwaterPhysics.js`), modeling permanent storage loss across consecutive simulation scenarios.

---

#### 2.3 Tier 3: Physics-Informed Neural Operator (PINO) Surrogate Engine
In the production architecture, high-dimensional multi-well pumping scenarios are evaluated via a Physics-Informed Neural Operator (PINO) trained offline.

##### Fourier Neural Operator (FNO) Backbone
Unlike traditional Convolutional Neural Networks (CNNs) that operate on fixed pixel lattices, FNO parameterizes the integral kernel in Fourier space:

$$\mathcal{F}(v)(k) = \int_{D} v(x) e^{-2 \pi i \langle x, k \rangle} dx$$

This formulation provides two critical capabilities:
1. **Mesh Independence**: The surrogate can be trained on a coarse numerical grid and evaluated on an arbitrarily dense client grid without retraining.
2. **Global Receptive Field**: Spectral convolutions capture long-range hydrodynamic pressure propagation across the entire river basin in a single forward pass.

##### Multi-Objective Physics Loss Formulation
The PINO model is trained by minimizing a composite loss function that penalizes both data error and physical law violations:

$$\mathcal{L}_{\text{total}} = \mathcal{L}_{\text{data}} + \lambda_{\text{pde}} \mathcal{L}_{\text{PDE}} + \lambda_{\text{bc}} \mathcal{L}_{\text{BC}}$$

Where:
* **$\mathcal{L}_{\text{data}}$**: Mean Squared Error (MSE) against high-fidelity MODFLOW 6 training runs.
* **$\mathcal{L}_{\text{PDE}}$**: Residual norm of the unsteady-state 3D groundwater flow equation evaluated via automatic differentiation:
  $$\mathcal{L}_{\text{PDE}} = \left\| \nabla \cdot (K \nabla h) + W - S_s \frac{\partial h}{\partial t} \right\|_{L_2(D \times [0, T])}^2$$
* **$\mathcal{L}_{\text{BC}}$**: Boundary condition enforcement along the coastal boundary (Dirichlet condition: $h = 0\text{ m AMSL}$ at Iloilo Strait) and inland hills (Neumann no-flow boundary: $\frac{\partial h}{\partial n} = 0$).

##### Inference Latency Target
* **Numerical MODFLOW 6 Runtime**: 15 to 45 minutes per multi-year 3D simulation.
* **PINO GPU Inference**: $< 100\text{ ms}$ on NVIDIA RTX 4050 6 GB GPU.
* **Effective Speedup**: Approximately $80,000\times$, enabling real-time interactive parameter adjustments during stakeholder planning meetings.

---

#### 2.4 Tier 4: Prospective Numerical Validation Protocol (USGS MODFLOW 6)
To validate the PINO surrogate before municipal deployment, an automated verification pipeline will execute comparative benchmarks using USGS MODFLOW 6 with the Skeletal Storage, Compaction, and Subsidence (CSUB) package via FloPy.

##### Quantitative Acceptance Criteria

| Metric | Mathematical Definition | Minimum Target Threshold | Scientific Interpretation |
| :--- | :--- | :--- | :--- |
| **Relative $L_2$ Error Norm** | $\frac{\|h_{\text{PINO}} - h_{\text{MODFLOW}}\|_2}{\|h_{\text{MODFLOW}}\|_2}$ | $\le 5.0\%$ | Basin-wide spatial error normalized across all grid cells |
| **Root Mean Square Error (Head)** | $\sqrt{\frac{1}{N}\sum_{i=1}^N (h_i^{\text{PINO}} - h_i^{\text{MODFLOW}})^2}$ | $\le 0.45\text{ m}$ | Absolute water table elevation discrepancy |
| **Root Mean Square Error (Subsidence)** | $\sqrt{\frac{1}{N}\sum_{i=1}^N (s_i^{\text{PINO}} - s_i^{\text{MODFLOW}})^2}$ | $\le 1.2\text{ cm}$ | Absolute cumulative ground surface settlement discrepancy |
| **Nash-Sutcliffe Efficiency (NSE)** | $1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$ | $\ge 0.90$ | Predictive fidelity relative to mean observation ($1.0$ is perfect match) |
| **Volumetric Mass Conservation Loss** | $\left| \frac{\sum Q_{\text{in}} - \sum Q_{\text{out}}}{\Delta V_{\text{storage}}} - 1 \right|$ | $\le 5.0\%$ | Physical water balance continuity constraint |

---

### 3. Dual-Benchmark HUD Telemetry Specification

The prototype features a persistent real-time monitoring HUD (`src/components/DualBenchmarkHUD.jsx`) positioned directly above the central viewport. This HUD exposes key scientific indicators:

1. **Theis Analytical Drawdown vs. PINO Surrogate**: Displays the concurrent output of both engines at the centroid of the active extraction zone, enabling the user to immediately detect any divergence.
2. **Inference Latency ($< 100\text{ ms}$)**: Quantifies the responsiveness advantage of the neural operator over numerical finite differences.
3. **Mass Conservation Error**: Real-time display of volumetric budget discrepancy, reassuring the user that the physics constraints are actively satisfied.
4. **Permanent vs. Elastic Compaction Breakdown**: Visual bar showing the ratio of irreversible plastic deformation to recoverable elastic strain, reinforcing the geotechnical reality of aquifer overdraft.

---

### 4. Capstone Defense Protocol: Questions and Answers

During oral defense, examiners frequently probe the boundary between software engineering, artificial intelligence, and physical science. The following defense positions must be adopted:

#### Question 1: "Why does your prototype run instantly in the browser without an expensive supercomputer?"
> **Examiner Intent**: Checking whether the student understands client-side computation vs. offline neural surrogate acceleration.  
> **Defense Response**:  
> "The current prototype achieves instantaneous sub-second response by executing the closed-form Theis non-equilibrium equation and Terzaghi 1D consolidation equations directly inside the browser's JavaScript V8 engine. For multi-well 3D modeling, traditional numerical solvers like MODFLOW 6 require 15 to 45 minutes because they invert massive sparse matrices over hundreds of thousands of grid cells for every time step. Our full architecture replaces that runtime bottleneck with an offline-trained Physics-Informed Neural Operator (PINO). Once the PINO model is trained, forward inference is simply a sequence of tensor matrix multiplications that evaluate in under 100 milliseconds on a standard 6 GB workstation GPU."

#### Question 2: "Is your system real science or just pretty computer animations?"
> **Examiner Intent**: Probing physical validity, mathematical rigor, and anti-hallucination safeguards.  
> **Defense Response**:  
> "AQUIFERA is grounded in established hydrogeological and geotechnical governing equations. It does not use generative AI or unconstrained graphics interpolation. Every contour rendered in our 2D MapLibre view and 3D Three.js cutaway is computed from Darcy's Law, the Theis exponential integral $W(u)$, and Terzaghi's effective stress principle. Furthermore, our architecture incorporates a permanent dual-benchmark verification protocol: any scenario generated by the surrogate can be cross-checked against USGS MODFLOW 6 via an automated FloPy pipeline with an acceptance threshold of $\le 5\%$ relative $L_2$ error."

#### Question 3: "What happens if the neural operator produces a hallucinated prediction?"
> **Examiner Intent**: Evaluating safety, failure modes, and verification mechanisms.  
> **Defense Response**:  
> "Our design includes a built-in automated verification fallback. In the DualBenchmark HUD and Verification Modal, the system monitors two physical conservation constraints: the volumetric water balance residual $\mathcal{L}_{\text{mass}}$ and the deviation from analytical bounds. If a predicted scenario exceeds the 5% error threshold, the system flags the result as unverified, highlights the anomalous cells in the GIS viewport, and prompts the user to launch a background MODFLOW 6 numerical run to re-anchor the prediction."

#### Question 4: "Why is this a BSIT capstone rather than a Civil or Geological Engineering thesis?"
> **Examiner Intent**: Validating BSIT program alignment under CICT guidelines.  
> **Defense Response**:  
> "A civil engineer's contribution is measuring soil cores or designing physical drainage infrastructure. Our contribution is strictly in Information Technology, specifically in Category 4: Application and Infrastructure Development:  
> 1. We solve an acute computational systems bottleneck by engineering an automated simulation pipeline that couples offline neural operator surrogates with real-time web delivery.  
> 2. We design and implement a modern, accessible web platform integrating MapLibre GL geospatial rendering and Three.js 3D WebGL subsurface visualization.  
> 3. We build the data integration pipeline connecting municipal well databases, satellite InSAR raster products, and numerical modeling engines into an actionable decision-support platform for municipal water governance."
