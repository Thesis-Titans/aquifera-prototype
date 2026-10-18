import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Layers, Eye, RefreshCw, Maximize2, Compass, Activity } from 'lucide-react';
import { DOMAIN } from '../physics/groundwaterPhysics';

export default function Aquifer3DCanvas({ physicalState, layerVisibilities, setLayerVisibilities }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  // Mesh references for real-time deformation
  const surfaceMeshRef = useRef(null);
  const coneMeshRef = useRef(null);
  const wellMeshGroupRef = useRef(null);
  const clayBlockRef = useRef(null);
  const clippingPlanesRef = useRef([]);

  // Local View Controls
  const [verticalExaggeration, setVerticalExaggeration] = useState(15); // Exaggerates cm to visual scale
  const [isCutaway, setIsCutaway] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [cameraView, setCameraView] = useState('perspective');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x080e18);
    scene.fog = new THREE.FogExp2(0x080e18, 0.015);

    // 2. Camera Setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 18, 26);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't flip under ground
    controls.minDistance = 5;
    controls.maxDistance = 80;
    controls.target.set(0, -3, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xdcf8ff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 35, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const cyanPointLight = new THREE.PointLight(0x00f2fe, 1.5, 40);
    cyanPointLight.position.set(-10, 10, -10);
    scene.add(cyanPointLight);

    // 6. Clipping Plane for Cutaway
    const cutawayPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    clippingPlanesRef.current = [cutawayPlane];

    // 7. Grid & Reference Boundaries
    const gridHelper = new THREE.GridHelper(26, 26, 0x1e3a5f, 0x112233);
    gridHelper.position.y = -12;
    scene.add(gridHelper);

    // 8. Build Stratified 3D Layers
    buildStratigraphy(scene, cutawayPlane);

    // 9. Surface Subsidence Terrain Mesh (64x64)
    const terrainRes = DOMAIN.gridResolution;
    const terrainGeo = new THREE.PlaneGeometry(20, 20, terrainRes - 1, terrainRes - 1);
    terrainGeo.rotateX(-Math.PI / 2);

    // Vertex color setup
    const count = terrainGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.35,
      metalness: 0.2,
      wireframe: false,
      side: THREE.DoubleSide
    });

    const surfaceMesh = new THREE.Mesh(terrainGeo, terrainMat);
    surfaceMesh.position.y = 0;
    surfaceMesh.receiveShadow = true;
    scene.add(surfaceMesh);
    surfaceMeshRef.current = surfaceMesh;

    // 10. Well Borehole Group
    const wellGroup = new THREE.Group();
    scene.add(wellGroup);
    wellMeshGroupRef.current = wellGroup;

    // 11. 3D Cone of Depression (Inverted Translucent Cone)
    const coneGeo = new THREE.ConeGeometry(8, 6, 32, 1, true);
    coneGeo.rotateX(Math.PI); // Invert
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      transparent: true,
      opacity: 0.3,
      wireframe: true,
      side: THREE.DoubleSide
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, -6, 0);
    scene.add(coneMesh);
    coneMeshRef.current = coneMesh;

    // 12. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle pulse on well intake
      if (wellMeshGroupRef.current) {
        const ring = wellMeshGroupRef.current.getObjectByName('pulseRing');
        if (ring) {
          const s = 1 + Math.sin(elapsedTime * 4) * 0.15;
          ring.scale.set(s, s, 1);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 13. Window Resize Handler
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

  // Helper to build geological strata blocks
  function buildStratigraphy(scene, cutawayPlane) {
    const boxSize = 20;

    // Strata 1: Upper Unconfined Sand (0 to 30m depth -> visually 0 to -3 units)
    const sand1Geo = new THREE.BoxGeometry(boxSize, 3, boxSize);
    const sand1Mat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.7,
      transparent: true,
      opacity: 0.65,
      clippingPlanes: [cutawayPlane],
      clipShadows: true
    });
    const sand1Mesh = new THREE.Mesh(sand1Geo, sand1Mat);
    sand1Mesh.position.y = -1.5;
    sand1Mesh.name = 'layer1';
    scene.add(sand1Mesh);

    // Strata 2: Clay Aquitard (30 to 60m depth -> visually -3 to -6 units)
    const clayGeo = new THREE.BoxGeometry(boxSize, 3, boxSize);
    const clayMat = new THREE.MeshStandardMaterial({
      color: 0xa0522d,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
      clippingPlanes: [cutawayPlane],
      clipShadows: true
    });
    const clayMesh = new THREE.Mesh(clayGeo, clayMat);
    clayMesh.position.y = -4.5;
    clayMesh.name = 'layer2';
    scene.add(clayMesh);
    clayBlockRef.current = clayMesh;

    // Strata 3: Lower Confined Sand (60 to 120m depth -> visually -6 to -12 units)
    const sand2Geo = new THREE.BoxGeometry(boxSize, 6, boxSize);
    const sand2Mat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.5,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
      clippingPlanes: [cutawayPlane],
      clipShadows: true
    });
    const sand2Mesh = new THREE.Mesh(sand2Geo, sand2Mat);
    sand2Mesh.position.y = -9.0;
    sand2Mesh.name = 'layer3';
    scene.add(sand2Mesh);
  }

  // Update 3D Surface Displacement Mesh dynamically whenever physicalState changes (< 250ms feedback)
  useEffect(() => {
    if (!surfaceMeshRef.current || !physicalState) return;

    const surface = surfaceMeshRef.current;
    const geo = surface.geometry;
    const posAttr = geo.attributes.position;
    const colorAttr = geo.attributes.color;
    const res = physicalState.resolution;
    const grid = physicalState.displacementGrid;

    // Color interpolation helper
    const colorZero = new THREE.Color(0x00f2fe);   // Safe Cyan
    const colorMid = new THREE.Color(0xfacc15);    // Warning Yellow
    const colorCritical = new THREE.Color(0xef4444); // Collapse Red
    const tempColor = new THREE.Color();

    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const idx = i * res + j;
        const subMeters = grid[idx]; // in meters (e.g. 0.05m to 0.35m)
        
        // Deform Y coordinate downwards, multiplied by vertical exaggeration
        const dispY = -subMeters * (verticalExaggeration * 0.25);
        posAttr.setY(idx, dispY);

        // Color based on subsidence severity (0cm = cyan, 10cm = yellow, >25cm = red)
        const subCm = subMeters * 100;
        if (subCm < 8) {
          tempColor.copy(colorZero).lerp(colorMid, subCm / 8);
        } else {
          tempColor.copy(colorMid).lerp(colorCritical, Math.min(1.0, (subCm - 8) / 20));
        }

        colorAttr.setXYZ(idx, tempColor.r, tempColor.g, tempColor.b);
      }
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geo.computeVertexNormals();

    // Update Clay Layer visual pulse if preconsolidation is breached
    if (clayBlockRef.current) {
      if (physicalState.isPreconsolidationBreached) {
        clayBlockRef.current.material.color.setHex(0xb91c1c); // Deep warning crimson
        clayBlockRef.current.material.emissive = new THREE.Color(0x5f1010);
      } else {
        clayBlockRef.current.material.color.setHex(0xa0522d); // Normal terracotta
        clayBlockRef.current.material.emissive = new THREE.Color(0x000000);
      }
    }

    // Update Well Objects
    if (wellMeshGroupRef.current && sceneRef.current) {
      const group = wellMeshGroupRef.current;
      // Clear existing wells
      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }

      const worldScale = 20 / DOMAIN.widthMeters; // Map 3.2km to 20 Three.js units

      physicalState.wells.forEach((w, i) => {
        const wx = w.x * worldScale;
        const wz = w.y * worldScale;

        // Borehole pipe (surface to -10 units)
        const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, 10, 16);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.position.set(wx, -5, wz);
        group.add(pipe);

        // Well Head Derrick structure
        const headGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(wx, 0.4, wz);
        group.add(head);

        // Water intake glowing strainer ring at screen depth (-9 units)
        const ringGeo = new THREE.RingGeometry(0.2, 0.8, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(wx, -9, wz);
        ring.name = i === 0 ? 'pulseRing' : `ring_${i}`;
        group.add(ring);
      });
    }

    // Update Cone of Depression scale and position
    if (coneMeshRef.current) {
      const cone = coneMeshRef.current;
      const primaryWell = physicalState.wells[0];
      const worldScale = 20 / DOMAIN.widthMeters;
      cone.position.set(primaryWell.x * worldScale, -5, primaryWell.y * worldScale);
      
      const coneRadius = Math.max(1.5, Math.min(10, (physicalState.maxDrawdown / 25) * 9));
      const coneHeight = Math.max(1, Math.min(8, (physicalState.maxDrawdown / 20) * 6));
      cone.scale.set(coneRadius, coneHeight, coneRadius);
    }

  }, [physicalState, verticalExaggeration]);

  // Handle Layer Visibility Toggles
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    ['layer1', 'layer2', 'layer3'].forEach(id => {
      const obj = scene.getObjectByName(id);
      if (obj) obj.visible = layerVisibilities[id];
    });
  }, [layerVisibilities]);

  // Handle Cutaway Toggle
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.localClippingEnabled = isCutaway;
  }, [isCutaway]);

  // Handle Wireframe Toggle
  useEffect(() => {
    if (!surfaceMeshRef.current) return;
    surfaceMeshRef.current.material.wireframe = isWireframe;
  }, [isWireframe]);

  // Camera Presets
  const setPresetCamera = (type) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (type === 'isometric') {
      camera.position.set(22, 18, 26);
    } else if (type === 'top') {
      camera.position.set(0, 36, 0.1);
    } else if (type === 'crossSection') {
      camera.position.set(0, -3, 32);
    }
    controls.target.set(0, -3, 0);
    controls.update();
    setCameraView(type);
  };

  return (
    <div className="canvas-wrapper" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 3D Canvas Mount */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating 3D Viewport Toolbar */}
      <div className="glass-panel" style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        zIndex: 10
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Compass size={14} color="var(--color-primary)" /> CAMERA
        </span>

        <button
          className={`btn btn-sm ${cameraView === 'isometric' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPresetCamera('isometric')}
        >
          Perspective
        </button>
        <button
          className={`btn btn-sm ${cameraView === 'crossSection' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPresetCamera('crossSection')}
        >
          Stratum Cut
        </button>
        <button
          className={`btn btn-sm ${cameraView === 'top' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPresetCamera('top')}
        >
          Surface Plan
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)', margin: '0 4px' }} />

        <button
          className={`btn btn-sm ${isCutaway ? 'btn-secondary' : ''}`}
          style={{ borderColor: isCutaway ? 'var(--color-primary)' : 'var(--border-subtle)' }}
          onClick={() => setIsCutaway(!isCutaway)}
          title="Toggle 50% Volumetric Cutaway to inspect internal clay layer"
        >
          <Layers size={13} /> {isCutaway ? 'Cutaway ON' : 'Solid Block'}
        </button>

        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setIsWireframe(!isWireframe)}
          title="Toggle Surface Deformation Wireframe Mesh"
        >
          <Activity size={13} /> {isWireframe ? 'Mesh Solid' : 'Mesh Wire'}
        </button>
      </div>

      {/* Floating Vertical Exaggeration HUD */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        padding: '10px 14px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Vertical Exaggeration:</span>
            <span className="mono-val" style={{ color: 'var(--color-primary)', fontSize: '12px' }}>{verticalExaggeration}×</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={verticalExaggeration}
            onChange={(e) => setVerticalExaggeration(Number(e.target.value))}
            style={{ width: '140px' }}
          />
        </div>
        <span style={{ fontSize: '10px', color: 'var(--text-dim)', maxWidth: '120px', lineHeight: 1.2 }}>
          Scales centimeter subsidence for visual defense clarity
        </span>
      </div>

      {/* Subsidence Colormap Legend */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        padding: '8px 12px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Surface Subsidence (ΔZ)
        </span>
        <div style={{
          width: '180px',
          height: '10px',
          borderRadius: '5px',
          background: 'linear-gradient(to right, #00f2fe, #facc15, #ef4444)'
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>0 cm (Safe)</span>
          <span>10 cm</span>
          <span>≥30 cm (Critical)</span>
        </div>
      </div>
    </div>
  );
}
