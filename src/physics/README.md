# AQUIFERA Client-Side Physics Simulation Engine
## Specification of Analytical Formulations, Geotechnical Assumptions, and Operational Boundaries

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Purpose and Architectural Role

The computational logic contained in `groundwaterPhysics.js` provides **instantaneous, deterministic client-side hydrogeological feedback** directly inside the web browser. 

In accordance with CICT research ethics and Section 2 (P0: Scientific Claim Integrity) of the repository review:
* This module is an **illustrative analytical surrogate**, not an offline-trained high-dimensional neural operator or a USGS MODFLOW 6 finite-difference simulator.
* Outputs are deterministic demonstration values designed to exhibit realistic physical sensitivity (Darcy flow, radial Theis cone of depression, and Terzaghi plastic compaction) during interactive capstone defense demonstrations.
* In Phase 2, this module serves as Tier 1 in the 4-tier validation hierarchy, while Tier 3 (PINO surrogate inference) and Tier 4 (MODFLOW 6 FloPy cross-checks) will execute via a dedicated computing pipeline.

---

### 2. Implemented Mathematical Formulations

#### 2.1 Theis (1935) Radial Transient Drawdown
For an extensive, homogeneous, isotropic, and fully confined aquifer subjected to well extraction $Q$:

$$s(r, t) = \frac{Q}{4 \pi T} W(u), \quad u = \frac{r^2 S}{4 T t}$$

Where:
* $s(r, t)$: Hydraulic head drawdown (m) at radial distance $r$ after duration $t$.
* $T = K \times b$: Aquifer transmissivity (m2/day).
* $S = S_s \times b$: Storage coefficient (dimensionless).
* $W(u)$: Well function approximated via an accelerated polynomial series expansion.

#### 2.2 Terzaghi 1D Compaction and Hysteresis
Overburden effective stress increments caused by pore pressure decline $\Delta u_w$:

$$\Delta \sigma'_v = \rho_w g \Delta h_{\text{drawdown}}$$

Plastic compaction is distinguished from elastic rebound using a stateful historical threshold $h_{\text{pre}} = -15.0\text{ m}$:
1. **Elastic Reversible Strain ($h > h_{\text{pre}}$)**: Governed by the recompression index $C_r \approx 0.05$.
2. **Virgin Plastic Permanent Compaction ($h \le h_{\text{pre}}$)**: Governed by the virgin compression index $C_c \approx 0.45$.

---

### 3. Verification and Safety Bounds

* **Function Purity**: All spatial functions (`computeGroundwaterState`, `getPointHydrogeology`) are pure functions with zero network side effects.
* **Hysteresis Register**: Permanent deformation history is tracked via `resetHysteresisState()` and preserved across parameter adjustments.
* **Numerical Bounds**: Inputs are clamped to physically plausible ranges ($Q \in [0, 40000]\text{ m}^3/\text{d}$, $K \in [1, 50]\text{ m}/\text{d}$) to prevent division-by-zero or negative logarithmic arguments.
