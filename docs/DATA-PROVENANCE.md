# AQUIFERA Data Provenance and Cartographic Foundation Specification
## Documentation of Basemap Sources, Synthetic Spatial Grids, Geotechnical Strata Parameters, and Empirical Roadmap

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Executive Summary and Academic Integrity Statement

This document formalizes the provenance, coordinate reference frames, mathematical discretization, and physical assumptions underlying all cartographic, administrative, and geotechnical layers within the **AQUIFERA Interactive Prototype**. 

To establish a transparent and defensible empirical baseline, this document delineates:

1. **Authentic Administrative Cartography (Ingested)**: Official Philippine Statistics Authority (PSA) and NAMRIA administrative boundaries covering **all 180 barangays of Iloilo City** (`iloilo_city_barangays.geojson`) and the overall city boundary (`iloilo_city_boundary.geojson`), projected in WGS84 (EPSG:4326) and aligned with PRS92.
2. **Official Municipal Planning Context (In Progress)**: Four foundational planning references received from the Iloilo City Planning and Development Office (CPDO: `CDP 2023–2028`, `SEP 2020`, `CLUP 2021–2029 Vol. 1`, and `Sectoral Studies Vol. 3`), coupled with a formal data request for the **CLUP Official Zoning Map Shapefile (`.shp`)**.
3. **Deterministic Synthetic Demonstration Data**: Discretized grid cells and drawdown cones generated in the browser via client-side Darcy-Theis analytical physics and Terzaghi skeletal compaction equations.
4. **Empirical InSAR Reference Baseline**: Published spaceborne InSAR measurements from **Sulapas et al. (2024)** documenting measured settlement rates of up to **9.0 mm/year** concentrated along the Mandurriao-Molo commercial growth corridor.

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
* **Target Regional Reference System for Phase 2 GIS Ingestion**: Philippine Reference System 1992 / Philippines Zone 4 (PRS92 / EPSG:3124; Zone 4 covers Iloilo City, as checked in the feasibility pilot), the official geodetic coordinate system mandated by the National Mapping and Resource Information Authority (NAMRIA).

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

#### 3.3 Authentic Administrative Ingestion: Official 180-Barangay Dataset
To elevate the prototype beyond generic rectangular grids, the repository now houses authentic administrative boundary polygons sourced from the **Philippine Statistics Authority (PSA)** and the **National Mapping and Resource Information Authority (NAMRIA)**:
* **Processed Repository Files**:
  * `public/data/spatial/iloilo_city_barangays.geojson` (166 KB, exactly **180 official barangays** of Iloilo City).
  * `public/data/spatial/iloilo_city_boundary.geojson` (3.0 KB, municipal boundary outline).
* **Attribute Schema per Barangay Feature**:
  * `adm4_en`: Official Barangay Name (e.g., "San Rafael", "Bolilao", "Calumpang").
  * `adm3_en`: City Name ("City of Iloilo").
  * `adm2_en`: Province Name ("Iloilo").
  * `adm4_pcode`: Standard PSA Philippine Standard Geographic Code (PSGC).
* **Operational Value**: Planners can view real barangay borders rather than synthetic cell IDs, enabling direct spatial queries during City Council and Zoning Board deliberations.

---

### 4. Geotechnical and Subsurface Strata Assumptions

The 3D interactive subsurface model (`src/features/aquifer-visualization/components/Aquifer3DCanvas.jsx`) renders the five hydrostratigraphic units of the proposal's reference domain (CICT-UGR-F001, Fig. 6). This is a generic test domain, not Iloilo City's stratigraphy; thicknesses and parameters are working assumptions. The in-browser analytical model computes compaction for Layer 4 only and uses its own illustrative parameters (`HYDRO_PARAMS` in `src/physics/groundwaterPhysics.js`).

| Layer | Depth (m) | Unit | Parameters (Fig. 6) | Role in the prototype |
| :-: | :-: | :--- | :--- | :--- |
| 1 | 0–20 | Upper unconfined alluvial sand | $K_{xx} = 1.5 \times 10^{-4}$ m/s; $S_y = 0.18$; $S_{ske} = 1.0 \times 10^{-5}$ m⁻¹ | Ground surface; shows the subsidence surface |
| 2 | 20–40 | Upper confining clay aquitard | $K_{zz} = 1.2 \times 10^{-8}$ m/s; $S_{ske} = 2.0 \times 10^{-5}$ m⁻¹; $S_{skv} = 1.5 \times 10^{-3}$ m⁻¹ | Drawn; not compacted in the simplified model |
| 3 | 40–70 | Middle semi-confined aquifer | $K_{xx} = 2.0 \times 10^{-4}$ m/s; $S_{ske} = 1.2 \times 10^{-5}$ m⁻¹ | Production aquifer |
| 4 | 70–95 | Lower compressible clay interbeds | $K_{zz} = 8.0 \times 10^{-9}$ m/s; $S_{ske} = 3.0 \times 10^{-5}$ m⁻¹; $S_{skv} = 2.8 \times 10^{-3}$ m⁻¹ | Compacting unit of the simplified model ($b_0 = 25$ m); turns red when the preconsolidation head is breached |
| 5 | 95–120 | Basal deep semi-confined gravel aquifer | $K_{xx} = 3.5 \times 10^{-4}$ m/s; $S_{ske} = 1.0 \times 10^{-5}$ m⁻¹ | Production aquifer; well screens are drawn here |

---

### 5. Roadmap to Official Empirical Phase 2 Data Integration

The interactive prototype successfully demonstrates user experience, sub-second visualization, and dual-benchmark telemetry. In subsequent thesis phases (Implementation and Validation), synthetic parameters will be substituted with calibrated field data:

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
| **Municipal Zoning & Land Use** | Iloilo City Planning and Development Office (CPDO) | CLUP 2021–2029 Official Zoning Map Shapefile (`.shp`), CDP, and Sectoral Studies | Overlays commercial, residential, and industrial parcel zones to identify zoning districts subject to subsidence hazards |
| **Commercial Well Permits & Inventory** | Iloilo City Environment & Natural Resources Office (City-ENRO) / NWRB | Local commercial deep well registry, extraction permits, inspection dockets | Defines active commercial pumping clusters (e.g., commercial laundries, hotels) in Mandurriao and Molo |
| **Metropolitan Production Wells** | Metro Pacific Iloilo Water (MPIW) & Metro Iloilo Water District (MIWD) | Production well telemetry, daily extraction rates ($Q$), static/dynamic water levels | Provides multi-well historical pumping stress time series |
| **Borehole Lithology & Stratigraphy** | DENR Mines and Geosciences Bureau (MGB VI) & DPWH Region VI | Soil exploration bore logs, SPT $N$-values, stratigraphic profiles | Calibrates layer thickness ($b_0$), hydraulic conductivity ($K$), and compressibility ($C_c, C_r$) |
| **Empirical Ground Subsidence Baseline** | Sentinel-1 InSAR (Sulapas et al., 2024) | Multi-temporal Sentinel-1 InSAR / GNSS deformation rates (2014–2020) | Serves as published empirical reference rate documenting up to **9.0 mm/year** subsidence in Mandurriao and Molo |
| **Meteorological Recharge** | DOST-PAGASA (Iloilo Synoptic Station) | Daily precipitation and pan evaporation records | Constrains seasonal aquifer recharge ($R$) across wet and dry monsoon cycles |

---

### 6. Defense Panel Talking Points: Data Provenance

When evaluating data provenance during proposal defense, researchers should convey the following key answers:

1. **"Are the subsidence numbers displayed on the map measured in the field today?"**  
   *Response*: "No. As clearly stated in our system disclaimer and data provenance specification, the current prototype displays deterministic synthetic demonstration data. The spatial patterns are calculated using real physical laws—Darcy's Law, Theis unsteady-state radial drawdown, and Terzaghi skeletal compaction—applied over the official geography of Iloilo City. The magnitude is informed by published satellite InSAR measurements from **Sulapas et al. (2024)**, which documented an empirical settlement rate of up to **9.0 mm/year** in Mandurriao and Molo."

2. **"Does the prototype use real Iloilo City boundaries or generic mockups?"**  
   *Response*: "The prototype integrates authentic **PSA and NAMRIA administrative boundaries covering all 180 official barangays of Iloilo City** (`iloilo_city_barangays.geojson`). Furthermore, our team has initiated formal coordination with the Iloilo City Planning and Development Office (CPDO) to obtain the official CLUP 2021–2029 Zoning Map shapefile."

3. **"Why use synthetic simulation data for the prototype instead of waiting for full production calibration?"**  
   *Response*: "Multi-agency telemetry harmonization and comprehensive borehole inversion require formal data-sharing agreements and extensive preprocessing scheduled for subsequent thesis phases. Prototype development validates the software architecture, the sub-250 ms user experience, and the real-time WebGL rendering pipeline early to ensure technical viability before ingesting massive agency datasets."
