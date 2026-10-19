/**
 * Metro Iloilo Hydrogeological & Geospatial Reference Data
 * Target Study Area: Iloilo River Delta Basin, Panay Island, Philippines
 * Coordinates: ~10.68°N - 10.76°N, 122.50°E - 122.62°E
 */

export const METRO_ILOILO_GIS = {
  center: { lat: 10.7202, lng: 122.5621, name: 'Metro Iloilo City' },
  bounds: {
    north: 10.775,
    south: 10.665,
    west: 122.495,
    east: 122.625
  },
  
  // Key Urban & Hydrogeological Districts
  districts: [
    {
      id: 'mandurriao',
      name: 'Mandurriao (IBP/SM)',
      lat: 10.7165,
      lng: 122.5480,
      x: -1.2, // km relative to city center
      y: 0.3,
      baseExtractionM3Day: 18500,
      soilType: 'Thick Holocene Alluvial Clay (35m)',
      vulnerability: 'Critical',
      description: 'Primary commercial & high-rise hub. Center of rapid groundwater overdraft & consolidation.'
    },
    {
      id: 'city_proper',
      name: 'Iloilo City Proper',
      lat: 10.6975,
      lng: 122.5725,
      x: 1.1,
      y: -2.3,
      baseExtractionM3Day: 8200,
      soilType: 'Coastal Sand & Delta Silt',
      vulnerability: 'High',
      description: 'Historical urban core and shipping port bordering the Iloilo Strait.'
    },
    {
      id: 'jaro',
      name: 'Jaro Cathedral Basin',
      lat: 10.7380,
      lng: 122.5560,
      x: -0.4,
      y: 2.1,
      baseExtractionM3Day: 6800,
      soilType: 'Fluvial Gravel & Sandy Clay',
      vulnerability: 'Moderate',
      description: 'Upstream floodplain with moderate natural recharge from Aganan and Tigum rivers.'
    },
    {
      id: 'molo',
      name: 'Molo District',
      lat: 10.7010,
      lng: 122.5390,
      x: -2.4,
      y: -1.8,
      baseExtractionM3Day: 4500,
      soilType: 'Estuarine Clay & Silty Sand',
      vulnerability: 'High',
      description: 'Dense residential district along Batiano River estuary.'
    },
    {
      id: 'la_paz',
      name: 'La Paz & Lapuz Port',
      lat: 10.7120,
      lng: 122.5760,
      x: 1.5,
      y: -0.9,
      baseExtractionM3Day: 5100,
      soilType: 'Reclaimed Estuarine Mudflat',
      vulnerability: 'High',
      description: 'Port operations, market district, and ferry terminal to Guimaras.'
    },
    {
      id: 'leganes',
      name: 'Leganes Coastal Flats',
      lat: 10.7650,
      lng: 122.5920,
      x: 3.2,
      y: 4.8,
      baseExtractionM3Day: 2800,
      soilType: 'Tidal Mangrove & Marine Clay',
      vulnerability: 'Moderate-High',
      description: 'Northern coastal lowlands prone to tidal inundation and saline intrusion.'
    }
  ],

  // Representative River Waterways (relative coordinates in km for rendering)
  rivers: [
    {
      name: 'Iloilo River',
      path: [
        [-4.5, 3.5],
        [-3.2, 2.4],
        [-1.8, 1.2],
        [-1.1, 0.2],
        [-0.5, -0.6],
        [0.4, -1.2],
        [1.2, -1.8],
        [2.2, -2.1],
        [3.5, -2.3]
      ]
    },
    {
      name: 'Batiano River',
      path: [
        [-5.0, 0.5],
        [-3.8, -0.8],
        [-2.7, -1.9],
        [-1.6, -3.2],
        [-0.5, -4.2]
      ]
    }
  ],

  // Key Arterial Roads
  roads: [
    {
      name: 'Sen. Benigno Aquino Jr. Ave (Diversion Rd)',
      path: [
        [-4.0, 4.0],
        [-2.5, 2.2],
        [-1.2, 0.3],
        [0.0, -1.0],
        [1.0, -2.2]
      ]
    },
    {
      name: 'Iloilo Coastal Road',
      path: [
        [1.8, -2.5],
        [2.2, -0.5],
        [2.8, 1.8],
        [3.6, 4.2]
      ]
    }
  ],

  // Subsurface Geological Layers (down to -200m)
  strata: [
    {
      id: 'layer_1',
      name: 'Upper Unconfined Sand & Alluvium',
      depthRange: '0 to -30 m',
      top: 0,
      bottom: -30,
      color: '#eab308',
      kValue: '15 - 25 m/day',
      description: 'Holocene alluvial deposits; high permeability, active rainfall infiltration.'
    },
    {
      id: 'layer_2',
      name: 'Compressible Marine Clay Aquitard',
      depthRange: '-30 to -60 m',
      top: -30,
      bottom: -60,
      color: '#ef4444',
      kValue: '0.001 - 0.05 m/day',
      description: 'High compressibility (Cc = 0.45), low permeability. Primary source of irreversible land subsidence under pore pressure decline.'
    },
    {
      id: 'layer_3',
      name: 'Lower Semi-Confined Gravel Aquifer',
      depthRange: '-60 to -120 m',
      top: -60,
      bottom: -120,
      color: '#06b6d4',
      kValue: '20 - 40 m/day',
      description: 'Major productive extraction zone tapped by commercial deep wells.'
    },
    {
      id: 'layer_4',
      name: 'Basement Siltstone & Bedrock',
      depthRange: '-120 to -200 m',
      top: -120,
      bottom: -200,
      color: '#64748b',
      kValue: '< 0.0001 m/day',
      description: 'Tertiary impermeable basement defining the hydraulic boundary.'
    }
  ]
};
