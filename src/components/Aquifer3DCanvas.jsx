import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Layers, RefreshCw, Compass, Activity, Info, Eye } from 'lucide-react';
import { DOMAIN, HYDRO_PARAMS } from '../physics/groundwaterPhysics';

export default function Aquifer3DCanvas({ physicalState, layerVisibilities, setLayerVisibilities }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  // Mesh & Object References
  const surfaceMeshRef = useRef(null);
  const coneMeshRef = useRef(null);
  const wellMeshGroupRef = useRef(null);
  const clayBlockRef = useRef(null);
  const waterTablePlaneRef = useRef(null);
  const clippingPlanesRef = useRef([]);

  // Viewport Settings
  const [verticalExaggeration, setVerticalExaggeration] = useState(15);
  const [isCutaway, setIsCutaway] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [showWaterTable, setShowWaterTable] = useState(true);
  const [cameraView, setCameraView] = useState('isometric');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060c16);
    scene.fog = new THREE.FogExp2(0x060c16, 0.014);

    // 2. Camera Setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 18, 26);
    cameraRef.current = camera;

    // 3. Renderer Setup (Clean, no deprecation warnings)
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      preserveDrawingBuffer: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.minDistance = 6;
    controls.maxDistance = 85;
    controls.target.set(0, -4, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xe2f1ff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(25, 40, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const blueRimLight = new THREE.PointLight(0x38bdf8, 1.8, 50);
    blueRimLight.position.set(-15, 12, -15);
    scene.add(blueRimLight);

    // 6. Clipping Plane for Volumetric Cutaway (Front Half)
    const cutawayPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    clippingPlanesRef.current = [cutawayPlane];

    // 7. Base Coordinate Grid & Impermeable Bedrock Slab
    const gridHelper = new THREE.GridHelper(24, 24, 0x1e3a5f, 0x0f1f33);
    gridHelper.position.y = -12.1;
    scene.add(gridHelper);

    // Solid Impermeable Bedrock Slab (Base of Alluvial Basin)
    const bedrockGeo = new THREE.BoxGeometry(20.2, 0.5, 20.2);
    const bedrockMat = new THREE.MeshStandardMaterial({
      color: 0x0a1120,
      roughness: 0.95,
      metalness: 0.1
    });
    const bedrockMesh = new THREE.Mesh(bedrockGeo, bedrockMat);
    bedrockMesh.position.y = -12.35;
    scene.add(bedrockMesh);

    // Build Stratified Hydrogeology Blocks
    buildStratigraphy(scene, cutawayPlane);

    // 8. Ground Surface Terrain Heightfield (64x64)
    const res = DOMAIN.gridResolution;
    const terrainGeo = new THREE.PlaneGeometry(20, 20, res - 1, res - 1);
    terrainGeo.rotateX(-Math.PI / 2);

    const count = terrainGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.45,
      metalness: 0.1,
      wireframe: false,
      clippingPlanes: [cutawayPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });

    const surfaceMesh = new THREE.Mesh(terrainGeo, terrainMat);
    surfaceMesh.position.y = 0;
    surfaceMesh.receiveShadow = true;
    scene.add(surfaceMesh);
    surfaceMeshRef.current = surfaceMesh;

    // 9. Piezometric Water Table Plane (Dynamic head representation)
    const waterTableGeo = new THREE.PlaneGeometry(20, 20);
    waterTableGeo.rotateX(-Math.PI / 2);
    const waterTableMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.8,
      clippingPlanes: [cutawayPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });
    const waterTableMesh = new THREE.Mesh(waterTableGeo, waterTableMat);
    waterTableMesh.position.y = -0.5; // Dynamic head level
    scene.add(waterTableMesh);
    waterTablePlaneRef.current = waterTableMesh;

    // 10. Well Infrastructure Group
    const wellGroup = new THREE.Group();
    scene.add(wellGroup);
    wellMeshGroupRef.current = wellGroup;

    // 11. Animation Loop (Modern timestamp tracking, zero deprecations)
    let animationFrameId;
    let startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedSec = (performance.now() - startTime) * 0.001;

      // Pulse well strainer intake rings
      if (wellMeshGroupRef.current) {
        const ring = wellMeshGroupRef.current.getObjectByName('pulseRing');
        if (ring) {
          const s = 1 + Math.sin(elapsedSec * 3.5) * 0.12;
          ring.scale.set(s, s, 1);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Helper: Build stratified hydrogeology blocks
  function buildStratigraphy(scene, cutawayPlane) {
    const boxSize = 20;

    // Layer 1: Upper Unconfined Sand (0 to 30 m depth -> 0 to -3 units)
    const sand1Geo = new THREE.BoxGeometry(boxSize, 3, boxSize);
    const sand1Mat = new THREE.MeshStandardMaterial({
      color: 0xc89666,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95,
      clippingPlanes: [cutawayPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });
    const sand1Mesh = new THREE.Mesh(sand1Geo, sand1Mat);
    sand1Mesh.position.y = -1.5;
    sand1Mesh.name = 'layer1';
    scene.add(sand1Mesh);

    // Layer 2: Compressible Clay Aquitard (30 to 60 m depth -> -3 to -6 units)
    const clayGeo = new THREE.BoxGeometry(boxSize, 3, boxSize);
    const clayMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      roughness: 0.92,
      metalness: 0.05,
      transparent: true,
      opacity: 0.98,
      clippingPlanes: [cutawayPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });
    const clayMesh = new THREE.Mesh(clayGeo, clayMat);
    clayMesh.position.y = -4.5;
    clayMesh.name = 'layer2';
    scene.add(clayMesh);
    clayBlockRef.current = clayMesh;

    // Layer 3: Lower Confined Aquifer (60 to 120 m depth -> -6 to -12 units)
    const sand2Geo = new THREE.BoxGeometry(boxSize, 6, boxSize);
    const sand2Mat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.65,
      metalness: 0.15,
      transparent: true,
      opacity: 0.95,
      clippingPlanes: [cutawayPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });
    const sand2Mesh = new THREE.Mesh(sand2Geo, sand2Mat);
    sand2Mesh.position.y = -9.0;
    sand2Mesh.name = 'layer3';
    scene.add(sand2Mesh);
  }

  // Reactive Update on Physical State Changes (< 250ms feedback)
  useEffect(() => {
    if (!surfaceMeshRef.current || !physicalState) return;

    const surface = surfaceMeshRef.current;
    const geo = surface.geometry;
    const posAttr = geo.attributes.position;
    const colorAttr = geo.attributes.color;
    const res = physicalState.resolution;
    const grid = physicalState.displacementGrid;

    // Realistic geotechnical subsidence colormap:
    // 0 cm: Natural Earth/Cyan (Safe)
    // 8-15 cm: Warning Amber (Elastic drawdown limit)
    // >20 cm: Deep Red / Crimson (Inelastic matrix failure)
    const colorSafe = new THREE.Color(0x38bdf8);
    const colorMid = new THREE.Color(0xf59e0b);
    const colorDanger = new THREE.Color(0xef4444);
    const tempColor = new THREE.Color();

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * res + j;
        const subMeters = grid[idx];
        
        // Deform Y coordinate downwards
        const dispY = -subMeters * (verticalExaggeration * 0.25);
        posAttr.setY(idx, dispY);

        const subCm = subMeters * 100;
        if (subCm < 6) {
          tempColor.copy(colorSafe).lerp(colorMid, subCm / 6);
        } else {
          tempColor.copy(colorMid).lerp(colorDanger, Math.min(1.0, (subCm - 6) / 18));
        }

        colorAttr.setXYZ(idx, tempColor.r, tempColor.g, tempColor.b);
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geo.computeVertexNormals();

    // Adjust Piezometric Water Table Plane position
    if (waterTablePlaneRef.current) {
      const headDropRatio = (HYDRO_PARAMS.initialHead - physicalState.minHead) / 25;
      const waterLevelY = -0.5 - Math.min(5.5, headDropRatio * 4.5);
      waterTablePlaneRef.current.position.y = waterLevelY;
      waterTablePlaneRef.current.visible = showWaterTable;
    }

    // Update Clay Compaction Visual State
    if (clayBlockRef.current) {
      if (physicalState.isPreconsolidationBreached) {
        clayBlockRef.current.material.color.setHex(0xb91c1c);
        clayBlockRef.current.material.emissive = new THREE.Color(0x450a0a);
      } else {
        clayBlockRef.current.material.color.setHex(0x8c5332);
        clayBlockRef.current.material.emissive = new THREE.Color(0x000000);
      }
    }

    // Reconstruct Well Assemblies
    if (wellMeshGroupRef.current && sceneRef.current) {
      const group = wellMeshGroupRef.current;
      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }

      const worldScale = 20 / DOMAIN.widthMeters;
      const res = physicalState.resolution;
      const grid = physicalState.displacementGrid;

      physicalState.wells.forEach((w, i) => {
        const wx = w.x * worldScale;
        const wz = w.y * worldScale;

        // Calculate surface settlement at exact wellhead location
        const gi = Math.max(0, Math.min(res - 1, Math.round(((wx + 10) / 20) * (res - 1))));
        const gj = Math.max(0, Math.min(res - 1, Math.round(((wz + 10) / 20) * (res - 1))));
        const subMeters = grid ? grid[gi * res + gj] : 0;
        const surfaceY = -subMeters * (verticalExaggeration * 0.25);

        // Well casing runs from surfaceY down to -9.0
        const casingHeight = Math.max(0.5, 9.0 + surfaceY);
        const casingGeo = new THREE.CylinderGeometry(0.18, 0.18, casingHeight, 16);
        const casingMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
        const casing = new THREE.Mesh(casingGeo, casingMat);
        casing.position.set(wx, surfaceY - casingHeight / 2, wz);
        group.add(casing);

        // Surface concrete wellpad resting directly on deformed ground surface
        const padGeo = new THREE.BoxGeometry(1.2, 0.16, 1.2);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(wx, surfaceY + 0.08, wz);
        group.add(pad);

        // Wellhead pump motor housing on top of the pad
        const headGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.65, 14);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(wx, surfaceY + 0.48, wz);
        group.add(head);

        // Slotted intake strainer (screen) in the lower confined aquifer (-9.0 units)
        const screenGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.8, 16);
        const screenMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          metalness: 0.8,
          roughness: 0.2,
          wireframe: true
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(wx, -9.0, wz);
        screen.name = i === 0 ? 'pulseRing' : `screen_${i}`;
        group.add(screen);
      });
    }
  }, [physicalState, verticalExaggeration, showWaterTable]);

  // Handle Visibility and Viewport Toggles
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    ['layer1', 'layer2', 'layer3'].forEach(id => {
      const obj = scene.getObjectByName(id);
      if (obj) obj.visible = layerVisibilities[id];
    });
  }, [layerVisibilities]);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.localClippingEnabled = isCutaway;
  }, [isCutaway]);

  useEffect(() => {
    if (!surfaceMeshRef.current) return;
    surfaceMeshRef.current.material.wireframe = isWireframe;
  }, [isWireframe]);

  const setPresetCamera = (type) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (type === 'isometric') {
      camera.position.set(22, 18, 26);
      controls.target.set(0, -4, 0);
    } else if (type === 'crossSection') {
      camera.position.set(0, -4, 30);
      controls.target.set(0, -4, 0);
    } else if (type === 'top') {
      camera.position.set(0, 34, 0.1);
      controls.target.set(0, 0, 0);
    }
    controls.update();
    setCameraView(type);
  };

  return (
    <div className="canvas-wrapper" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating 3D Navigation Controls (NN/g: Visibility & Control) */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        zIndex: 10
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
          <Compass size={14} color="var(--color-primary)" /> CAMERA
        </span>

        <button
          className={`btn btn-sm ${cameraView === 'isometric' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPresetCamera('isometric')}
        >
          3D Oblique
        </button>
        <button
          className={`btn btn-sm ${cameraView === 'crossSection' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPresetCamera('crossSection')}
        >
          Cross Section
        </button>
        <button
          className={`btn btn-sm ${cameraView === 'top' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPresetCamera('top')}
        >
          Plan View (Top)
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        <button
          className={`btn btn-sm ${isCutaway ? 'btn-secondary' : ''}`}
          style={{ borderColor: isCutaway ? 'var(--color-primary)' : 'var(--border-subtle)' }}
          onClick={() => setIsCutaway(!isCutaway)}
          title="Toggle 50% Volumetric Cutaway to inspect internal clay compaction"
        >
          <Layers size={13} /> {isCutaway ? 'Cutaway View' : 'Solid Block'}
        </button>

        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setShowWaterTable(!showWaterTable)}
          title="Toggle Piezometric Water Table Plane"
        >
          <Eye size={13} /> {showWaterTable ? 'Piezometric Head' : 'Hide Head'}
        </button>

        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setIsWireframe(!isWireframe)}
          title="Toggle Terrain Mesh Wireframe"
        >
          <Activity size={13} /> {isWireframe ? 'Mesh Solid' : 'Mesh Wire'}
        </button>
      </div>

      {/* Consolidated Geological Status & Exaggeration Toolbar (Bottom Dock) */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        right: '16px',
        padding: '8px 16px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Stratum Depth Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '10px' }}>
            STRATA:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#38bdf8' }} />
            <span>0m Surface</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c89666' }} />
            <span>-30m Sand</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#7c2d12' }} />
            <span>-60m Clay</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#1e3a8a' }} />
            <span>-120m Aquifer</span>
          </div>
        </div>

        {/* Subsidence Colormap Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Settlement (Δz):
          </span>
          <div style={{
            width: '120px',
            height: '8px',
            borderRadius: '4px',
            background: 'linear-gradient(to right, #38bdf8, #f59e0b, #ef4444)'
          }} />
          <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            <span>0 cm</span>
            <span>→</span>
            <span>≥25 cm</span>
          </div>
        </div>

        {/* Vertical Exaggeration Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Exaggeration:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={verticalExaggeration}
            onChange={(e) => setVerticalExaggeration(Number(e.target.value))}
            style={{ width: '85px' }}
          />
          <span className="mono-val" style={{ color: 'var(--color-primary)', fontSize: '11px', minWidth: '24px' }}>
            {verticalExaggeration}×
          </span>
        </div>
      </div>
    </div>
  );
}
