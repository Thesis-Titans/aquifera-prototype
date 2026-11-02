# AQUIFERA Data Provenance and Cartographic Foundation Specification
## Documentation of Basemap Sources, Synthetic Spatial Grids, Geotechnical Strata Parameters, and Empirical Roadmap

**West Visayas State University | College of Information and Communications Technology (CICT)**  
*Bachelor of Science in Information Technology (BSIT) | Course: CC 208 (Methods of Research in Computing)*  
*Academic Year 2026-2027 | Research Group 2*

---

### 1. Executive Summary and Academic Integrity Statement

This document formalizes the provenance, coordinate reference frames, mathematical discretization, and physical assumptions underlying all cartographic, administrative, and geotechnical layers within the **AQUIFERA Interactive Prototype**. 

To establish a transparent and defensible empirical baseline, this document delineates:

1. **Authentic Administrative Cartography (Ingested)**: Official Philippine Statistics Authority (PSA) and NAMRIA administrative boundaries covering **all 180 barangays of Iloilo City** (`iloilo_city_barangays.geojson`) and the overall city boundary (`iloilo_city_boundary.geojson`), projected in WGS84 (EPSG:4326) and aligned with PRS92 Zone 4 (EPSG:3124).
2. **Official Municipal Planning & Zoning Context (Ingested)**: City Government of Iloilo Comprehensive Land Use Plan (`CLUP 2021–2029`) zoning classifications and surface imperviousness fractions (`iloilo_clup_zoning_imperviousness.json`), defining surface runoff fractions $\alpha \in [0.10, 0.90]$ and recharge retention factors.
3. **Authentic Hydrographic Waterways (Ingested)**: OpenStreetMap (OSM) official river geometries (`iloilo_surface_waterways.geojson`) comprising 22 distinct LineString segments for the Iloilo River, Batiano River, and Jaro River systems, parameterized with stage elevations and riverbed conductances for boundary condition specification.
4. **Empirical Geodetic & InSAR Reference Baseline (Ingested)**: Published spaceborne Sentinel-1 InSAR measurements from **Sulapas et al. (2024)** (`insar_subsidence_benchmarks_iloilo.geojson`) documenting measured settlement rates up to **-9.0 mm/year** concentrated along the Mandurriao commercial corridor, coupled with surface elevations from the Copernicus GLO-30m Digital Elevation Model (DEM), geodetically anchored to NAMRIA PageNET Continuous GNSS Station PILC (La Paz) and the Fort San Pedro tide gauge.
5. **Historical Climatological Infiltration Baseline (Ingested)**: DOST-PAGASA 30-year climatological normals (1991–2020) for Iloilo Synoptic Station 614 (`pagasa_iloilo_climatological_normals.json`), providing monthly mean rainfall ($P$) and pan evaporation ($PET$) for surface recharge partitioning.
6. **Groundwater Monitoring Well Registry (Ingested)**: National Water Resources Board (NWRB) and local commercial well records (`known_groundwater_wells_iloilo.geojson`), identifying extraction clusters and monitoring points.
7. **Discretized Finite Difference Grid & Bilinear Heatmap**: A regular $64 \times 64$ finite difference lattice (4,096 cells, 50.8 m cell width over a $3,200 \times 3,200\text{ m}$ domain) matching the USGS MODFLOW 6 pilot numerical testbed, rasterized continuously via bilinear interpolation.
8. **Geotechnical Testbed Strata**: Five-layer deltaic aquifer-aquitard parameterization in PRS92 Zone 4 (`deltaic_aquifer_parameters_prs92.json`), providing the reference mechanical framework for skeletal compaction calculations.

---

### 2. Cartographic Basemap Foundation

The 2D interactive geographic viewport is powered by MapLibre GL JS, rendering an ultra-fast, high-contrast dark basemap optimized for geospatial analytical overlays.

#### 2.1 Basemap Source and Licensing
* **Provider**: Environmental Systems Research Institute (ESRI) World Dark Gray Canvas and ESRI World Imagery (Satellite).
* **Reference Tiles**: ESRI Dark Neutral Reference tile layer superimposed above the simulation raster to preserve place-name legibility.
* **Licensing**: ESRI Open Web Tile Services accessed under open educational and scientific terms with visible attribution.
* **Tile Service Endpoints**:
  * Dark Base: `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`
  * Dark Reference: `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`
  * Satellite Imagery: `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
* **Performance Characteristic**: Sub-50 millisecond tile delivery cached by global CDN, requiring zero proprietary API keys or external billing.

#### 2.2 Spatial Reference Systems (SRS)
* **Web Client Display Coordinate System**: World Geodetic System 1984 (WGS84, EPSG:4326), reprojected via Web Mercator (EPSG:3857) in MapLibre.
* **Target Regional Reference System for Spatial Datasets**: Philippine Reference System 1992 / Philippines Zone 4 (PRS92 / EPSG:3124), the official geodetic coordinate system mandated by the National Mapping and Resource Information Authority (NAMRIA). All local simulation meters are bidirectionally convertible to PRS92 via the domain anchor at $451,800\text{ m E}, 1,187,000\text{ m N}$.

#### 2.3 Geographic Extents and Focus Bounding Box
The simulation covers the coastal and riverine floodplain of Metro Iloilo:
* **Southern Latitude**: 10.6500 N
* **Northern Latitude**: 10.8200 N
* **Western Longitude**: 122.4500 E
* **Eastern Longitude**: 122.6500 E
* **Simulation Centerpoint**: Latitude 10.7100 N, Longitude 122.5600 E (Mandurriao / Jaro boundary corridor).

---

### 3. Discretized Subsidence Simulation Grid

To ensure spatial consistency with the offline USGS MODFLOW 6 pilot model, the prototype operates on a $64 \times 64$ finite difference discretization.

#### 3.1 Spatial Grid Specification
* **Grid Resolution**: 64 columns ($N_x$) by 64 rows ($N_y$) = 4,096 discrete cells.
* **Domain Dimensions**: $3,200\text{ m} \times 3,200\text{ m}$ ($10.24\text{ km}^2$).
* **Cell Footprint**: Exactly $50.0\text{ m} \times 50.0\text{ m}$ per finite difference node.
* **Rendering Pipeline**: Offscreen HTML5 canvas rasterization (`rasterizeFieldToImageData` in `src/physics/heatmap.js`) producing a continuous 256x256 bilinearly resampled raster texture updated on MapLibre via `source.updateImage()`.
* **Optional Wireframe Mesh**: A vector GeoJSON grid mesh representing the 4,096 cell boundaries (`src/physics/fields.js`), toggleable in the GIS layer controls.

#### 3.2 Authentic Administrative Ingestion: Official 180-Barangay Dataset
To ground the prototype in local administrative geography, the repository houses authentic administrative boundary polygons sourced from the **Philippine Statistics Authority (PSA)** and the **National Mapping and Resource Information Authority (NAMRIA)**:
* `public/data/spatial/iloilo_city_barangays.geojson` (166 KB, exactly **180 official barangays** of Iloilo City).
* `public/data/spatial/iloilo_city_boundary.geojson` (3.0 KB, municipal boundary outline).
* **Attribute Schema**: Barangay Name (`adm4_en`), City Name (`adm3_en`), Province Name (`adm2_en`), and standard PSA Philippine Standard Geographic Code (`adm4_pcode`).

#### 3.3 Authentic Surface Waterways: OpenStreetMap Hydrologic Geometry
To parameterize river boundary conditions for USGS MODFLOW 6 (RIV package) and provide spatial hydrographic context:
* `public/data/spatial/iloilo_surface_waterways.geojson` (22 LineString features).
* **River Systems**: Iloilo River (tidal estuary), Batiano River, and Jaro River channel segments.
* **Attributes**: `river_name`, `segment_name`, `river_type`, `stage_m_msl`, `bed_conductance_m2_day`, and OpenStreetMap `osm_id`.

#### 3.4 Authentic Geodetic and InSAR Ground Deformation Benchmarks
To ground visual verification against published peer-reviewed geodetic observations:
* `public/data/spatial/insar_subsidence_benchmarks_iloilo.geojson` (8 geodetic features).
* **Published Source**: Sulapas et al. (2024), *International Journal of Applied Earth Observation and Geoinformation*, 133, 104107.
* **Sensor & Timeline**: Sentinel-1 C-band SAR multi-temporal PS/SBAS analysis (2014–2020).
* **Elevation Source**: Copernicus Digital Elevation Model (DEM) GLO-30m.
* **Geodetic Anchors**:
  * 6 InSAR deformation benchmarks across Mandurriao, Molo, City Proper, Jaro, and Lapuz (mean velocities between $-0.5$ and $-8.5\text{ mm/year}$).
  * NAMRIA PageNET Continuous GNSS Reference Station PILC (La Paz, $122.5620^\circ\text{ E}, 10.7120^\circ\text{ N}$).
  * NAMRIA Hydrography / PSMSL Station 177 Tide Gauge at Fort San Pedro ($0.0\text{ m MSL}$ datum anchor).

#### 3.5 Statutory Zoning and Surface Imperviousness Parameters
To model infiltration modulation and shallow domestic abstraction under statutory urban planning:
* `public/data/spatial/iloilo_clup_zoning_imperviousness.json`.
* **Source**: City Government of Iloilo Comprehensive Land Use Plan (`CLUP 2021–2029`) & City Zoning Ordinance.
* **Parameters**: 10 land-use zones specifying impervious surface fraction $\alpha \in [0.10, 0.90]$, recharge retention factors, and domestic shallow sink intensities.

---

### 4. Geotechnical and Subsurface Strata Assumptions

The 3D interactive subsurface model (`src/features/aquifer-visualization/components/Aquifer3DCanvas.jsx`) renders the five hydrostratigraphic units of the proposal's reference domain (CICT-UGR-F001, Fig. 6). This is a synthetic numerical testbed based on deltaic sedimentary sequences, not uncalibrated site-specific borehole logs:

| Layer | Depth (m) | Unit | Parameters (Fig. 6) | Role in the prototype |
| :-: | :-: | :--- | :--- | :--- |
| 1 | 0–20 | Upper unconfined alluvial sand | $K_{xx} = 1.5 \times 10^{-4}$ m/s; $S_y = 0.18$; $S_{ske} = 1.0 \times 10^{-5}$ m⁻¹ | Ground surface; shows the subsidence surface |
| 2 | 20–40 | Upper confining clay aquitard | $K_{zz} = 1.2 \times 10^{-8}$ m/s; $S_{ske} = 2.0 \times 10^{-5}$ m⁻¹; $S_{skv} = 1.5 \times 10^{-3}$ m⁻¹ | Low-permeability barrier; prevents rapid shallow recharge |
| 3 | 40–70 | Middle semi-confined aquifer | $K_{xx} = 2.0 \times 10^{-4}$ m/s; $S_{ske} = 1.2 \times 10^{-5}$ m⁻¹ | Secondary production aquifer |
| 4 | 70–95 | Lower compressible clay interbeds | $K_{zz} = 8.0 \times 10^{-9}$ m/s; $S_{ske} = 3.0 \times 10^{-5}$ m⁻¹; $S_{skv} = 2.8 \times 10^{-3}$ m⁻¹ | Primary compacting unit ($b_0 = 25$ m); turns red when preconsolidation head is breached |
| 5 | 95–120 | Basal deep semi-confined gravel aquifer | $K_{xx} = 3.5 \times 10^{-4}$ m/s; $S_{ske} = 1.0 \times 10^{-5}$ m⁻¹ | Primary production aquifer; well screens are placed here |

---

### 5. Roadmap to Official Empirical Phase 2 Data Integration

The interactive prototype demonstrates user experience, sub-second visualization, and dual-benchmark telemetry. In subsequent thesis phases, synthetic parameters will be calibrated against local physical datasets:

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
| **Empirical Ground Subsidence Baseline** | Sentinel-1 InSAR (Sulapas et al., 2024) | Multi-temporal Sentinel-1 InSAR / GNSS deformation rates (2014–2020) | Serves as published empirical reference rate documenting up to **-9.0 mm/year** subsidence in Mandurriao and Molo |
| **Meteorological Recharge** | DOST-PAGASA (Iloilo Synoptic Station 614) | 30-year climatological normals (1991–2020) and monthly precipitation | Constrains seasonal aquifer recharge ($R$) across wet and dry monsoon cycles |

---

### 6. Defense Panel Talking Points: Data Provenance

When evaluating data provenance during proposal defense, researchers should convey the following key answers:

1. **"Are the subsidence numbers displayed on the map measured in the field today?"**  
   *Response*: "No. As clearly stated in our system disclaimer and data provenance specification, the current prototype displays deterministic synthetic demonstration data. The spatial patterns are calculated using real physical laws—Darcy's Law, Theis unsteady-state radial drawdown, and Terzaghi skeletal compaction—applied over the official geography of Iloilo City. The magnitude is informed by published satellite InSAR measurements from **Sulapas et al. (2024)**, which documented an empirical settlement rate of up to **-9.0 mm/year** in Mandurriao and Molo."

2. **"Does the prototype use real Iloilo City boundaries or generic mockups?"**  
   *Response*: "The prototype integrates authentic **PSA and NAMRIA administrative boundaries covering all 180 official barangays of Iloilo City** (`iloilo_city_barangays.geojson`), authentic **OpenStreetMap river channel geometries for the Iloilo, Batiano, and Jaro Rivers** (`iloilo_surface_waterways.geojson`), and **published InSAR / GNSS geodetic benchmarks** (`insar_subsidence_benchmarks_iloilo.geojson`)."

3. **"Why use synthetic simulation data for the prototype instead of waiting for full production calibration?"**  
   *Response*: "Multi-agency telemetry harmonization and comprehensive borehole inversion require formal data-sharing agreements and extensive preprocessing scheduled for subsequent thesis phases. Prototype development validates the software architecture, the sub-250 ms user experience, and the real-time WebGL rendering pipeline early to ensure technical viability before ingesting massive agency datasets."
