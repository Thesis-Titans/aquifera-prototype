# AQUIFERA Data Provenance and Cartographic Foundation Specification
## Documentation of Basemap Sources, Synthetic Spatial Grids, Geotechnical Strata Parameters, and Empirical Roadmap

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Executive Summary and Academic Integrity Statement

This document formalizes the provenance, coordinate reference frames, mathematical discretization, and physical assumptions underlying all cartographic and geotechnical layers within the **AQUIFERA Interactive Prototype**. 

In strict adherence to CICT Research Policy (`CICT-RESEARCH-THESIS-AND-CAPSTONE-POLICIES-AND-GUIDELINES.md`) and the project Governing Rules (`AGENTS.md`), research claims must be transparently verified. This document delineates:

1. **Real cartographic data**: Live vector/raster basemaps streamed from established global geographical providers.
2. **Deterministic synthetic demonstration data**: Discretized grid cells and drawdown cones generated in the browser via client-side Darcy-Theis analytical physics and Terzaghi skeletal compaction equations.
3. **Official empirical data roadmap**: Authoritative institutional data sources slated for ingestion during Phase 2 model calibration (NWRB, MIWD, DENR-MGB, and Sentinel-1 InSAR).

---

### 2. Cartographic Basemap Foundation

The 2D interactive geographic viewport is powered by MapLibre GL JS, rendering an ultra-fast, high-contrast dark basemap optimized for geospatial analytical overlays.

#### 2.1 Basemap Source and Licensing
* **Provider**: CARTO Dark Matter Raster Tiles.
* **Underlying Spatial Data**: OpenStreetMap (OSM) contributors.
* **Licensing**: Open Database License (ODbL) for OpenStreetMap data; CARTO basemap tiles accessed under creative commons / open web service tier with mandatory visible attribution.
* **Tile Service Endpoints**:
  * `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
  * `https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
  * `https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
* **Performance Characteristic**: Sub-50 millisecond tile delivery cached by global CDN, requiring zero proprietary API keys or external billing.

#### 2.2 Spatial Reference Systems (SRS)
* **Web Client Display Coordinate System**: World Geodetic System 1984 (WGS84, EPSG:4326), reprojected via Web Mercator (EPSG:3857) in MapLibre.
* **Target Regional Reference System for Phase 2 GIS Ingestion**: Philippine Reference System 1992 / UTM Zone 51N (PRS92 / EPSG:3125), the official geodetic coordinate system mandated by the National Mapping and Resource Information Authority (NAMRIA).

#### 2.3 Geographic Extents and Focus Bounding Box
The simulation covers the coastal and riverine floodplain of Metro Iloilo:
* **Southern Latitude**: 10.6500 N
* **Northern Latitude**: 10.8200 N
* **Western Longitude**: 122.4500 E
* **Eastern Longitude**: 122.6500 E
* **Simulation Centerpoint**: Latitude 10.7100 N, Longitude 122.5600 E (Mandurriao / Jaro boundary corridor).

#### 2.4 Metro Iloilo District Centroid Coordinates
Ten reference district centroids are hard-pinned to the cartographic canvas to provide local context:

| District / Municipality | Latitude (N) | Longitude (E) | Approximate Surface Elevation (m AMSL) | Vulnerability Characterization |
| :--- | :--- | :--- | :--- | :--- |
| **Mandurriao Hub** | 10.7135 | 122.5482 | 4.2 m | High risk: Dense commercial pumping, thick compressible clay strata |
| **Iloilo City Proper** | 10.6969 | 122.5644 | 2.5 m | High risk: Low-lying coastal port, historical shallow water table |
| **Jaro Basin** | 10.7285 | 122.5601 | 5.8 m | High risk: Floodplain alluvium, tidal backflow vulnerability |
| **Molo District** | 10.6975 | 122.5435 | 3.8 m | Moderate to high: Residential extraction, estuarine silt layers |
| **La Paz District** | 10.7100 | 122.5700 | 3.2 m | Moderate: Coastal delta sediments, proximity to Iloilo Strait |
| **Lapuz District** | 10.7020 | 122.5800 | 2.1 m | Severe coastal exposure: Industrial port zone and shipping terminals |
| **Arevalo (Villa)** | 10.6850 | 122.5250 | 4.5 m | Moderate: Southwestern residential coastal corridor |
| **Leganes Lowlands** | 10.7850 | 122.5900 | 2.8 m | Severe: Agricultural and aquaculture extraction on tidal mudflats |
| **Pavia Inland** | 10.7760 | 122.5440 | 8.5 m | Moderate: Upstream river alluvium, transitional recharge zone |
| **Oton Coastal** | 10.6960 | 122.4740 | 5.1 m | Moderate: Southwestern peri-urban boundary with mixed sandy alluvium |

---

### 3. Discretized Subsidence Simulation Grid

To demonstrate spatial variation across the study area without requiring a remote supercomputing cluster, the prototype generates a 28 by 28 regular lattice (784 discrete spatial cells).

#### 3.1 Spatial Grid Specification
* **Grid Resolution**: 28 columns (X) by 28 rows (Y) = 784 cells.
* **Cell Footprint**: Approximately 350 meters by 350 meters per cell.
* **Format**: Standard GeoJSON FeatureCollection generated in memory (`src/components/MapLibreMap.jsx`).
* **Attributes per Cell Feature**:
  * `cellId`: Unique spatial identifier (e.g., `CELL-MND-0412`).
  * `district`: Closest administrative district centroid.
  * `distanceToCenter_km`: Euclidean distance from the pumping epicenter.
  * `drawdown_m`: Simulated hydraulic head drop in meters.
  * `subsidence_cm`: Estimated total surface settlement in centimeters.
  * `risk_level`: Multi-tiered vulnerability categorization (`Minimal`, `Moderate`, `High`, `Critical`).

#### 3.2 Synthetic Value Distribution
The subsidence grid values are strictly deterministic demonstration outputs. They reflect the mathematical combination of:
1. Radial drawdown attenuation governed by the Theis (1935) well-function.
2. Heterogeneous soil factor multiplier calibrated to distance from the soft-soil river delta and coastal wetlands.
3. User-adjusted scenario extraction rate (ranging from 12,000 m3/day baseline up to 32,000 m3/day drought shock).

---

### 4. Geotechnical and Subsurface Strata Assumptions

The 3D interactive subsurface model (`src/components/Aquifer3DCanvas.jsx`) renders a 3-layer hydrostratigraphic profile representing the unconsolidated Quaternary alluvium of the Iloilo Plain.

#### 4.1 Layer 1: Upper Unconfined Alluvial Sand (0 to 30 m Depth)
* **Lithology**: Fine to coarse alluvial sand with intercalated river gravels.
* **Hydraulic Conductivity ($K$)**: 10 to 25 m/day (baseline: 15 m/day).
* **Specific Yield ($S_y$)**: 0.15 (dimensionless).
* **Geotechnical Behavior**: Elastic, immediate drainage with negligible long-term consolidation.
* **3D Visual Shader**: Muted sand gold (`#c89666`), rendered with a dynamic cutaway plane.

#### 4.2 Layer 2: Intermediate Marine Clay / Silt Aquitard (30 to 45 m Depth)
* **Lithology**: Normally to slightly overconsolidated plastic marine clay, organic silts, and mudflat deposits.
* **Layer Thickness ($b_0$)**: 15 to 35 meters across the urban core.
* **Virgin Compression Index ($C_c$)**: 0.35 to 0.55 (governs irreversible compaction).
* **Recompression / Swelling Index ($C_r$)**: 0.04 to 0.08 (governs reversible elastic bounce).
* **Preconsolidation Head Threshold ($h_{\text{pre}}$)**: -15.0 meters below ground surface.
* **Geotechnical Behavior**: Highly compressible. When hydraulic head drops below $h_{\text{pre}}$, pore water pressure dissipates into the aquifer, transferring overburden stress to the clay skeleton and inducing permanent plastic compaction.
* **3D Visual Shader**: Dense terra cotta clay (`#8b4513`), displaying vertex-color stress contours.

#### 4.3 Layer 3: Lower Confined Gravel/Sand Aquifer (45 to 100 m Depth)
* **Lithology**: Dense semi-cemented fluvial gravel, basaltic sand, and sandstone conglomerate.
* **Transmissivity ($T$)**: 450 to 900 m2/day ($T = K \times b$).
* **Elastic Storage Coefficient ($S$)**: $1.0 \times 10^{-4}$ to $5.0 \times 10^{-4}$ ($S = S_s \times b$).
* **Pumping Epicenter**: Deep municipal and commercial production wells penetrating into this confined unit.
* **3D Visual Shader**: Aquifer marine cyan (`#1e40af` to `#0284c7`), displaying animated particle vectors representing groundwater seepage flux toward the well screen.

---

### 5. Roadmap to Official Empirical Phase 2 Data Integration

The interactive prototype successfully demonstrates user experience, sub-second visualization, and dual-benchmark telemetry. During Capstone Phase 2 (Implementation and Validation), synthetic parameters will be substituted with calibrated field data:

```
[Phase 1 Prototype: Calibrated Synthetic Grid]
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│            Official Empirical Data Ingestion           │
├─────────────────────────┬──────────────────────────────┤
│ Institutional Authority │ Datasets & Physical Records  │
├─────────────────────────┼──────────────────────────────┤
│ NWRB & MIWD             │ Well Registry & Meter Logs   │
│ DENR-MGB Region VI      │ Borehole Stratigraphy & SPT  │
│ ESA / Copernicus        │ Sentinel-1 InSAR PS/SBAS     │
│ DOST-PAGASA             │ Meteorological Precipitation │
└─────────────────────────┴──────────────────────────────┘
                       │
                       ▼
[Phase 2 Production Pipeline: PINO + MODFLOW 6 Calibrated Engine]
```

#### Detailed Authority Ingestion Table

| Data Dimension | Institutional Authority | Source Format / Tool | Calibration Function in AQUIFERA |
| :--- | :--- | :--- | :--- |
| **Municipal Well Registry** | National Water Resources Board (NWRB) & Metro Iloilo Water District (MIWD) | Tabular extraction logs, well coordinates, casing depths | Replaces single idealized well with multi-well distributed extraction field |
| **Borehole Lithology & Stratigraphy** | Department of Environment and Natural Resources, Mines and Geosciences Bureau (DENR-MGB VI) | Geological cross-sections, Standard Penetration Test (SPT) boring logs | Defines 3D spatial thickness variations for the intermediate compressible clay layer |
| **Historical Ground Settlement** | European Space Agency (ESA) Copernicus Sentinel-1A/B | Synthetic Aperture Radar (SAR) Single Look Complex (SLC) interferograms | Processed via InSAR Persistent Scatterer (PS) and Small Baseline Subset (SBAS) algorithms to serve as real-world target labels |
| **Meteorological Recharge** | Department of Science and Technology, PAGASA | Daily precipitation and pan evaporation records (Iloilo Synoptic Station) | Calibrates seasonal recharge boundary condition ($R$) across dry and wet monsoon cycles |

---

### 6. Defense Panel Talking Points: Data Provenance

When evaluating data provenance during proposal defense, researchers should convey the following key answers:

1. **"Are the subsidence numbers displayed on the map measured in the field today?"**  
   *Response*: "No. As clearly stated in our system disclaimer and data provenance specification, the current prototype displays deterministic synthetic demonstration data. The spatial patterns are calculated using real physical laws: Darcy's Law, Theis unsteady-state radial drawdown, and Terzaghi skeletal compaction: applied over an accurate 350-meter grid of Metro Iloilo. In Phase 2, this synthetic grid will be replaced by calibrated Copernicus Sentinel-1 InSAR measurements and MIWD well telemetry."

2. **"Why use synthetic data for the prototype instead of waiting for real InSAR processing?"**  
   *Response*: "Raw InSAR interferogram processing and regional borehole harmonization require months of specialized data acquisition and institutional MOA clearances with MIWD and DENR-MGB. In accordance with CICT capstone methodology and Design Science Research guidelines, the prototype validates the software architecture, user interaction model, and real-time visualization pipeline early. This ensures the IT artifact is completely functional before ingesting large-scale empirical datasets."

3. **"How does the basemap coordinate system align with Philippine GIS standards?"**  
   *Response*: "The web prototype uses WGS84 (EPSG:4326) web tiles for high-speed browser rendering. All spatial centroids and boundary polygons are mathematically transformable to Philippine Reference System 1992 (PRS92 / UTM Zone 51N, EPSG:3125), which is the official standard mandated by NAMRIA and used by the Iloilo City Planning and Development Office (CPDO)."
