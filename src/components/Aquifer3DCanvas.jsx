import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Layers, Compass, Activity, Eye, Crosshair, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DOMAIN, HYDRO_PARAMS, getPointHydrogeology } from '../physics/groundwaterPhysics';

export default function Aquifer3DCanvas({ physicalState, layerVisibilities, setLayerVisibilities, onMoveWell }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  // Mesh & Object References
  const surfaceMeshRef = useRef(null);
  const wellMeshGroupRef = useRef(null);
  const coneMeshRef = useRef(null);
  const clayBlockRef = useRef(null);
  const waterTablePlaneRef = useRef(null);
  const clippingPlanesRef = useRef([]);
  const probeGroupRef = useRef(null);
  const compassNeedleRef = useRef(null);

  // 3D Spatial Orientation Gizmo References & State
  const gizmoXRef = useRef(null);
  const gizmoYRef = useRef(null);
  const gizmoZRef = useRef(null);
  const gizmoXHeadRef = useRef(null);
  const gizmoYHeadRef = useRef(null);
  const gizmoZHeadRef = useRef(null);
  const [isGizmoOpen, setIsGizmoOpen] = useState(true);

  // Viewport Settings
  const [verticalExaggeration, setVerticalExaggeration] = useState(15);
  const [isCutaway, setIsCutaway] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [showWaterTable, setShowWaterTable] = useState(true);
  const [cameraView, setCameraView] = useState('isometric');

  // Interactive 3D Subsurface Data Probe State & Well Movement
  const [probedData, setProbedData] = useState(null);
  const [isProbePinned, setIsProbePinned] = useState(false);
  const [isProbeActive, setIsProbeActive] = useState(true);
  const isProbeActiveRef = useRef(true);
  isProbeActiveRef.current = isProbeActive;
  const onMoveWellRef = useRef(onMoveWell);
  onMoveWellRef.current = onMoveWell;
  const physicalStateRef = useRef(physicalState);
  physicalStateRef.current = physicalState;

  // Helper: Build stratified hydrogeology blocks
  const buildStratigraphy = (scene, cutawayPlane) => {
    const boxSize = 20;

    // Layer 1: Upper Unconfined Sand (0 to 30 m depth -> 0 to -3 units)
    // Note: Top face (+Y, index 2) is invisible so deformed vertex-colored surfaceMesh displays the subsidence depression!
    const sand1Geo = new THREE.BoxGeometry(boxSize, 3, boxSize);
    const sand1SideMat = new THREE.MeshStandardMaterial({
      color: 0xc89666,
      roughness: 0.85,
      metalness: 0.05,
      transparent: true,
      opacity: 0.95,
      clippingPlanes: [cutawayPlane],
      clipShadows: true,
      side: THREE.DoubleSide
    });
    const invisibleTopMat = new THREE.MeshBasicMaterial({ visible: false });
    const sand1Mats = [
      sand1SideMat,    // +X (Right)
      sand1SideMat,    // -X (Left)
      invisibleTopMat, // +Y (Top: Open so surfaceMesh shows depression)
      sand1SideMat,    // -Y (Bottom)
      sand1SideMat,    // +Z (Front)
      sand1SideMat     // -Z (Back)
    ];
    const sand1Mesh = new THREE.Mesh(sand1Geo, sand1Mats);
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
  };

  // Helper: Build 3D Spatial Orientation Gizmo & Basin Metric Rulers
  const buildSpatialGizmo = (scene) => {
    const gizmoGroup = new THREE.Group();
    gizmoGroup.name = 'spatialGizmo';

    // 1. In-Scene 3D Corner Axes at Bedrock SW corner (-10.1, -12.0, 10.1)
    // Red (+X = East: 3.2km), Green (+Y = Up/Depth: 120m), Blue (+Z = South/North)
    const axesHelper = new THREE.AxesHelper(3.5);
    axesHelper.position.set(-10.1, -12.0, 10.1);
    gizmoGroup.add(axesHelper);

    // 2. Vertical Depth Graduation Ruler along front-left cutaway corner (-10, 0 to -12, 0)
    const depthLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-10.05, 0.05, 0.05),
      new THREE.Vector3(-10.05, -12.05, 0.05)
    ]);
    const depthLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8
    });
    const depthLine = new THREE.Line(depthLineGeo, depthLineMat);
    gizmoGroup.add(depthLine);

    // Graduation ticks at 0m, -30m (-3u), -60m (-6u), -120m (-12u)
    const tickDepths = [0, -3, -6, -12];
    tickDepths.forEach(y => {
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-10.05, y, 0.05),
        new THREE.Vector3(-10.5, y, 0.05)
      ]);
      const tickLine = new THREE.Line(tickGeo, depthLineMat);
      gizmoGroup.add(tickLine);
    });

    // 3. Ground Perimeter Scale Lines (3.2 km x 3.2 km basin footprint)
    const perimeterGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-10, 0.02, 10),
      new THREE.Vector3(10, 0.02, 10),
      new THREE.Vector3(10, 0.02, -10),
      new THREE.Vector3(-10, 0.02, -10),
      new THREE.Vector3(-10, 0.02, 10)
    ]);
    const perimeterMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35
    });
    const perimeterLine = new THREE.Line(perimeterGeo, perimeterMat);
    gizmoGroup.add(perimeterLine);

    // 4. North Direction Arrow on ground surface (pointing North: -Z)
    const northArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0.05, 10.5),
      2.4,
      0x22d3ee,
      0.6,
      0.4
    );
    gizmoGroup.add(northArrow);

    // 5. East Direction Arrow on ground surface (pointing East: +X)
    const eastArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(10.5, 0.05, 0),
      2.4,
      0xf43f5e,
      0.6,
      0.4
    );
    gizmoGroup.add(eastArrow);

    scene.add(gizmoGroup);
  };

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

    // Build Stratified Hydrogeology Blocks & Spatial Rulers
    buildStratigraphy(scene, cutawayPlane);
    buildSpatialGizmo(scene);

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

    // 11. 3D Cone of Piezometric Depression (Translucent Inverted Funnel)
    const coneGeo = new THREE.ConeGeometry(8, 6, 32, 1, true);
    coneGeo.rotateX(Math.PI);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      roughness: 0.2,
      metalness: 0.8,
      side: THREE.DoubleSide,
      clippingPlanes: [cutawayPlane],
      clipShadows: true
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(0, -6, 0);
    scene.add(coneMesh);
    coneMeshRef.current = coneMesh;

    // 12. Subsurface Raycast Probe Marker Group (3D Target Indicator)
    const probeGroup = new THREE.Group();
    probeGroup.visible = false;

    // Vertical dashed probe line from surface to bedrock
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, -12.1, 0)
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.35,
      gapSize: 0.2,
      transparent: true,
      opacity: 0.75
    });
    const probeLine = new THREE.Line(lineGeo, lineMat);
    probeLine.computeLineDistances();
    probeGroup.add(probeLine);

    // Glowing cyan horizontal target ring
    const ringGeo = new THREE.RingGeometry(0.35, 0.48, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const probeRing = new THREE.Mesh(ringGeo, ringMat);
    probeRing.name = 'probeRing';
    probeGroup.add(probeRing);

    // Center illuminated target bead
    const beadGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const probeBead = new THREE.Mesh(beadGeo, beadMat);
    probeGroup.add(probeBead);

    scene.add(probeGroup);
    probeGroupRef.current = probeGroup;

    // 12. Animation Loop (Modern timestamp tracking, zero deprecations)
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

      // Pulse probe target ring
      if (probeGroupRef.current && probeGroupRef.current.visible) {
        const pRing = probeGroupRef.current.getObjectByName('probeRing');
        if (pRing) {
          const ps = 1 + Math.sin(elapsedSec * 4.5) * 0.15;
          pRing.scale.set(ps, ps, 1);
        }
      }

      // Update 60 FPS Camera Compass Azimuth
      if (controls && compassNeedleRef.current) {
        const azimuthRad = controls.getAzimuthalAngle();
        const deg = (azimuthRad * 180) / Math.PI;
        compassNeedleRef.current.style.transform = `rotate(${-deg}deg)`;
      }

      // Update 60 FPS 3D Spatial Orientation Gizmo Projections
      if (camera && gizmoXRef.current && gizmoYRef.current && gizmoZRef.current) {
        const qInv = camera.quaternion.clone().invert();
        const vX = new THREE.Vector3(1, 0, 0).applyQuaternion(qInv);
        const vY = new THREE.Vector3(0, 1, 0).applyQuaternion(qInv);
        const vZ = new THREE.Vector3(0, 0, -1).applyQuaternion(qInv);

        const radius = 22;
        const cx = 30;
        const cy = 30;

        const pxX = cx + vX.x * radius;
        const pyX = cy - vX.y * radius;
        const pxY = cx + vY.x * radius;
        const pyY = cy - vY.y * radius;
        const pxZ = cx + vZ.x * radius;
        const pyZ = cy - vZ.y * radius;

        gizmoXRef.current.setAttribute('x2', pxX.toFixed(1));
        gizmoXRef.current.setAttribute('y2', pyX.toFixed(1));
        gizmoYRef.current.setAttribute('x2', pxY.toFixed(1));
        gizmoYRef.current.setAttribute('y2', pyY.toFixed(1));
        gizmoZRef.current.setAttribute('x2', pxZ.toFixed(1));
        gizmoZRef.current.setAttribute('y2', pyZ.toFixed(1));

        if (gizmoXHeadRef.current) {
          gizmoXHeadRef.current.setAttribute('cx', pxX.toFixed(1));
          gizmoXHeadRef.current.setAttribute('cy', pyX.toFixed(1));
        }
        if (gizmoYHeadRef.current) {
          gizmoYHeadRef.current.setAttribute('cx', pxY.toFixed(1));
          gizmoYHeadRef.current.setAttribute('cy', pyY.toFixed(1));
        }
        if (gizmoZHeadRef.current) {
          gizmoZHeadRef.current.setAttribute('cx', pxZ.toFixed(1));
          gizmoZHeadRef.current.setAttribute('cy', pyZ.toFixed(1));
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 13. Interactive 3D Raycasting Probe Listeners
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastHit = (e) => {
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const targets = [];
      if (surfaceMeshRef.current) targets.push(surfaceMeshRef.current);
      ['layer1', 'layer2', 'layer3'].forEach(name => {
        const obj = scene.getObjectByName(name);
        if (obj && obj.visible) targets.push(obj);
      });

      const intersects = raycaster.intersectObjects(targets, false);
      return intersects.length > 0 ? intersects[0] : null;
    };

    const handlePointerMove = (e) => {
      if (!isProbeActiveRef.current) return;
      const hit = getRaycastHit(e);
      if (hit) {
        const hitPoint = hit.point;
        if (probeGroupRef.current) {
          probeGroupRef.current.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
          probeGroupRef.current.visible = true;
        }

        const hydro = getPointHydrogeology(hitPoint.x, hitPoint.y, hitPoint.z, physicalStateRef.current);
        if (hydro) {
          setProbedData(prev => (prev?.isPinned ? prev : hydro));
        }
      }
    };

    const handlePointerDown = (e) => {
      if (e.target.closest('button') || e.target.closest('.camera-controls-bar') || e.target.closest('.bottom-dock-bar') || e.target.closest('.probe-hud-card') || e.target.closest('.spatial-gizmo-widget')) {
        return;
      }

      const hit = getRaycastHit(e);
      if (hit) {
        const hitPoint = hit.point;

        // If Shift is pressed or Probe is disabled, relocate extraction well:
        if (onMoveWellRef.current && (e.shiftKey || !isProbeActiveRef.current)) {
          const domainScale = DOMAIN.widthMeters / 20;
          onMoveWellRef.current(hitPoint.x * domainScale, hitPoint.z * domainScale);
          return;
        }

        if (isProbeActiveRef.current) {
          if (probeGroupRef.current) {
            probeGroupRef.current.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
            probeGroupRef.current.visible = true;
          }

          const hydro = getPointHydrogeology(hitPoint.x, hitPoint.y, hitPoint.z, physicalStateRef.current);
          if (hydro) {
            setProbedData({ ...hydro, isPinned: true });
            setIsProbePinned(true);
          }
        }
      }
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerdown', handlePointerDown);

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
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

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

      // Update Cone of Depression scale and position based on primary well
      if (coneMeshRef.current && physicalState.wells && physicalState.wells.length > 0) {
        const cone = coneMeshRef.current;
        const primaryWell = physicalState.wells[0];
        const worldScale = 20 / DOMAIN.widthMeters;
        cone.position.set(primaryWell.x * worldScale, -5, primaryWell.y * worldScale);
        
        const coneRadius = Math.max(1.5, Math.min(10, (physicalState.maxDrawdown / 25) * 9));
        const coneHeight = Math.max(1, Math.min(8, (physicalState.maxDrawdown / 20) * 6));
        cone.scale.set(coneRadius / 8, coneHeight / 6, coneRadius / 8);
        cone.visible = showWaterTable;
      }
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
    if (surfaceMeshRef.current) {
      surfaceMeshRef.current.visible = layerVisibilities.layer1;
    }
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
    } else if (type === 'north') {
      camera.position.set(0, 16, -30);
      controls.target.set(0, -4, 0);
    } else if (type === 'east') {
      camera.position.set(30, 16, 0);
      controls.target.set(0, -4, 0);
    }
    controls.update();
    setCameraView(type);
  };

  return (
    <div className="canvas-wrapper relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Floating 3D Navigation Controls Toolbar */}
      <div className="camera-controls-bar absolute top-4 left-4 flex items-center gap-2 p-1.5 px-2.5 z-10 overflow-x-auto no-scrollbar max-w-[calc(100%-160px)] rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/12 shadow-2xl">
        {/* Dynamic Compass Azimuth Badge */}
        <div 
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-slate-300 shrink-0 shadow-xs"
          title="Basin Geographic Orientation (Azimuth)"
        >
          <div className="relative w-4 h-4 flex items-center justify-center">
            <div 
              ref={compassNeedleRef} 
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
            >
              <Compass size={14} className="text-primary" />
            </div>
          </div>
          <span className="font-mono font-bold text-primary text-[11px] tracking-wider">NORTH</span>
        </div>

        <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />

        {/* Perspective Snap Segmented Control */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-900/60 border border-white/8 shrink-0">
          <button
            className={`h-7 px-3 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${
              cameraView === 'isometric' 
                ? 'bg-primary/20 text-primary border border-primary/40 font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setPresetCamera('isometric')}
            title="Snap to 3D Oblique Perspective"
          >
            3D Oblique
          </button>
          <button
            className={`h-7 px-3 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${
              cameraView === 'crossSection' 
                ? 'bg-primary/20 text-primary border border-primary/40 font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setPresetCamera('crossSection')}
            title="Snap to Cross Section View"
          >
            Cross-Section
          </button>
          <button
            className={`h-7 px-3 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center ${
              cameraView === 'top' 
                ? 'bg-primary/20 text-primary border border-primary/40 font-semibold shadow-xs' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
            onClick={() => setPresetCamera('top')}
            title="Snap to Plan View (Top)"
          >
            Plan (Top)
          </button>
        </div>

        <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />

        {/* Display Mode Toggles */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
              isCutaway 
                ? 'bg-primary/15 text-primary border-primary/40 shadow-xs font-semibold' 
                : 'bg-white/4 text-slate-400 border-white/10 hover:text-white hover:bg-white/8'
            }`}
            onClick={() => setIsCutaway(!isCutaway)}
            title="Toggle 50% Volumetric Cutaway to inspect internal clay compaction"
          >
            <Layers size={13} /> {isCutaway ? 'Cutaway' : 'Solid'}
          </button>

          <button
            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
              showWaterTable 
                ? 'bg-primary/15 text-primary border-primary/40 shadow-xs font-semibold' 
                : 'bg-white/4 text-slate-400 border-white/10 hover:text-white hover:bg-white/8'
            }`}
            onClick={() => setShowWaterTable(!showWaterTable)}
            title="Toggle Piezometric Water Table Plane"
          >
            <Eye size={13} /> {showWaterTable ? 'Head' : 'Hide Head'}
          </button>

          <button
            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
              isWireframe 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs font-semibold' 
                : 'bg-white/4 text-slate-400 border-white/10 hover:text-white hover:bg-white/8'
            }`}
            onClick={() => setIsWireframe(!isWireframe)}
            title="Toggle Terrain Mesh Wireframe"
          >
            <Activity size={13} /> Wire
          </button>

          <button
            className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
              isProbeActive 
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-xs font-semibold' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-xs font-semibold'
            }`}
            onClick={() => {
              setIsProbeActive(!isProbeActive);
              if (isProbeActive) {
                setProbedData(null);
                setIsProbePinned(false);
                if (probeGroupRef.current) probeGroupRef.current.visible = false;
              }
            }}
            title={isProbeActive ? "Data Probe ON: Hover/click surface to inspect subsurface values (Shift+Click to relocate well)" : "Well Placement Mode: Click anywhere on 3D terrain to relocate extraction well"}
          >
            <Crosshair size={13} /> {isProbeActive ? 'Probe ON' : 'Move Well'}
          </button>
        </div>
      </div>

      {/* Interactive Subsurface Hydrogeological Probe HUD Card */}
      {probedData && isProbeActive && (
        <div className="probe-hud-card absolute bottom-24 left-4 z-20 w-85 max-w-[calc(100vw-32px)] p-4 rounded-2xl bg-slate-950/90 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_hsl(187,92%,48%)] animate-pulse shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Subsurface Telemetry Probe
                </span>
                <span className="text-xs font-mono font-semibold text-white">
                  X: {probedData.coordinates.x > 0 ? `+${probedData.coordinates.x}` : probedData.coordinates.x}m · Y: {probedData.coordinates.y > 0 ? `+${probedData.coordinates.y}` : probedData.coordinates.y}m · Depth: {probedData.coordinates.depth}m
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shadow-xs ${
                isProbePinned 
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35' 
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}>
                {isProbePinned ? 'Pinned' : 'Live'}
              </span>
              <button
                onClick={() => {
                  setProbedData(null);
                  setIsProbePinned(false);
                  if (probeGroupRef.current) probeGroupRef.current.visible = false;
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss Probe"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Stratum Tag Card */}
          <div className="flex items-center gap-2.5 p-2.5 px-3 rounded-xl bg-slate-900/60 border border-white/8 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: probedData.stratum.color }} />
            <div className="flex-1 min-w-0">
              <strong className="text-white block font-semibold truncate">{probedData.stratum.name}</strong>
              <span className="text-[10px] text-slate-400 font-mono">{probedData.stratum.kText}</span>
            </div>
          </div>

          {/* 3-Column Hydrogeological Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/8 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Head (h)</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-sm font-bold text-sky-400">
                  {probedData.hydraulicHeadM}
                </span>
                <span className="text-[10px] text-slate-400">m</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/8 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Settlement</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`font-mono text-sm font-bold ${probedData.settlementCm > 15 ? 'text-rose-400' : 'text-primary'}`}>
                  {probedData.settlementCm}
                </span>
                <span className="text-[10px] text-slate-400">cm</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-white/8 flex flex-col justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Eff. Stress</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-sm font-bold text-amber-400">
                  {probedData.effectiveStressKPa}
                </span>
                <span className="text-[10px] text-slate-400">kPa</span>
              </div>
            </div>
          </div>

          {/* Critical Yield State Indicator */}
          <div className={`p-2.5 px-3 rounded-xl flex items-center gap-2.5 text-xs font-medium border shadow-xs ${
            probedData.isYielding 
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/35' 
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}>
            {probedData.isYielding ? <AlertTriangle size={15} className="shrink-0 text-rose-400" /> : <ShieldCheck size={15} className="shrink-0 text-emerald-400" />}
            <span className="leading-tight">{probedData.statusText}</span>
          </div>
        </div>
      )}

      {/* Interactive 3D Spatial Orientation Gizmo HUD Widget */}
      <div className="spatial-gizmo-widget absolute bottom-24 right-4 z-15 flex flex-col items-end gap-2 select-none">
        {isGizmoOpen ? (
          <div className="p-3.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl flex flex-col gap-2.5 w-60 animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Title and Minimize */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={14} className="text-primary" /> 3D Spatial Gizmo
              </span>
              <button
                onClick={() => setIsGizmoOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-1 rounded-lg cursor-pointer transition-colors"
                title="Collapse Gizmo"
              >
                <X size={13} />
              </button>
            </div>

            {/* Live 3D Vector Tripod SVG & Quick Snaps */}
            <div className="flex items-center gap-3">
              {/* Projected 3D Axis Compass SVG */}
              <div className="relative w-15 h-15 rounded-full bg-slate-950 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
                <svg viewBox="0 0 60 60" className="w-full h-full overflow-visible">
                  {/* Origin Bead */}
                  <circle cx="30" cy="30" r="2.5" fill="#ffffff" opacity="0.6" />

                  {/* +X Axis (East - Red/Coral) */}
                  <line ref={gizmoXRef} x1="30" y1="30" x2="52" y2="30" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                  <circle ref={gizmoXHeadRef} cx="52" cy="30" r="3.5" fill="#f43f5e" />

                  {/* +Y Axis (Elevation/Depth - Sky Blue) */}
                  <line ref={gizmoYRef} x1="30" y1="30" x2="30" y2="8" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                  <circle ref={gizmoYHeadRef} cx="30" cy="8" r="3.5" fill="#38bdf8" />

                  {/* +Z Axis (North - Cyan/Emerald) */}
                  <line ref={gizmoZRef} x1="30" y1="30" x2="14" y2="44" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" />
                  <circle ref={gizmoZHeadRef} cx="14" cy="44" r="3.5" fill="#2dd4bf" />
                </svg>
              </div>

              {/* Axis Legend & Basin Dimensions */}
              <div className="flex-1 flex flex-col gap-1 text-[10.5px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 font-bold text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> East (+X):
                  </span>
                  <span className="font-mono font-semibold text-white">3.2 km</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 font-bold text-teal-300">
                    <span className="w-2 h-2 rounded-full bg-teal-400" /> North (+Z):
                  </span>
                  <span className="font-mono font-semibold text-white">3.2 km</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1 font-bold text-sky-400">
                    <span className="w-2 h-2 rounded-full bg-sky-400" /> Depth (Z):
                  </span>
                  <span className="font-mono font-semibold text-white">120 m</span>
                </div>
              </div>
            </div>

            {/* Quick Perspective Snap Buttons */}
            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-white/10 text-[10px]">
              <button
                className="py-1 px-1.5 rounded-md font-bold bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all text-center cursor-pointer border border-white/10"
                onClick={() => setPresetCamera('top')}
                title="Snap to Plan View (Top)"
              >
                Top
              </button>
              <button
                className="py-1 px-1.5 rounded-md font-bold bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all text-center cursor-pointer border border-white/10"
                onClick={() => setPresetCamera('north')}
                title="Snap looking South from North"
              >
                North
              </button>
              <button
                className="py-1 px-1.5 rounded-md font-bold bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all text-center cursor-pointer border border-white/10"
                onClick={() => setPresetCamera('east')}
                title="Snap looking West from East"
              >
                East
              </button>
              <button
                className="py-1 px-1.5 rounded-md font-bold bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 transition-all text-center cursor-pointer"
                onClick={() => setPresetCamera('isometric')}
                title="Snap to 3D Oblique Perspective"
              >
                3D
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsGizmoOpen(true)}
            className="p-2 px-3 rounded-xl bg-slate-950/90 backdrop-blur-xl border border-white/15 hover:border-primary/50 text-slate-300 hover:text-white shadow-xl flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all"
            title="Expand 3D Spatial Gizmo & Coordinate Scales"
          >
            <Compass size={15} className="text-primary" />
            <span>3D Spatial Gizmo</span>
          </button>
        )}
      </div>

      {/* Consolidated Geological Status & Exaggeration Toolbar (Bottom Dock) */}
      <div className="bottom-dock-bar absolute bottom-3 left-4 right-4 min-h-12 p-2 px-4 z-10 flex items-center justify-between flex-wrap gap-3 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/12 shadow-2xl overflow-x-auto no-scrollbar">
        {/* Interactive Stratum Toggles */}
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">
            STRATA:
          </span>
          <button
            onClick={() => setLayerVisibilities(prev => ({ ...prev, layer1: !prev.layer1 }))}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              layerVisibilities.layer1 
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-xs' 
                : 'bg-white/4 border-white/8 text-slate-500 opacity-60 line-through'
            }`}
            title="Toggle Upper Sand Layer & Ground Surface (0 to -30m)"
          >
            <div className="w-2 h-2 rounded-full bg-[#c89666]" />
            <span>Sand (0-30m)</span>
          </button>
          <button
            onClick={() => setLayerVisibilities(prev => ({ ...prev, layer2: !prev.layer2 }))}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              layerVisibilities.layer2 
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-200 shadow-xs' 
                : 'bg-white/4 border-white/8 text-slate-500 opacity-60 line-through'
            }`}
            title="Toggle Compressible Clay Aquitard (30 to -60m)"
          >
            <div className="w-2 h-2 rounded-full bg-[#ea580c]" />
            <span>Clay (30-60m)</span>
          </button>
          <button
            onClick={() => setLayerVisibilities(prev => ({ ...prev, layer3: !prev.layer3 }))}
            className={`h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              layerVisibilities.layer3 
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-200 shadow-xs' 
                : 'bg-white/4 border-white/8 text-slate-500 opacity-60 line-through'
            }`}
            title="Toggle Lower Confined Aquifer (60 to -120m)"
          >
            <div className="w-2 h-2 rounded-full bg-[#0284c7]" />
            <span>Aquifer (60-120m)</span>
          </button>
        </div>

        {/* Subsidence Colormap Legend */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            Settlement (Δz):
          </span>
          <div className="w-28 sm:w-36 h-2 rounded-full bg-linear-to-r from-[#38bdf8] via-[#f59e0b] to-[#ef4444] shadow-inner" />
          <div className="flex gap-1.5 text-xs text-slate-400 font-mono tabular-nums font-medium">
            <span>0cm</span>
            <span>→</span>
            <span>≥25cm</span>
          </div>
        </div>

        {/* Vertical Exaggeration Slider */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Exaggeration:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={verticalExaggeration}
            onChange={(e) => setVerticalExaggeration(Number(e.target.value))}
            className="w-20 sm:w-24 cursor-pointer accent-primary"
          />
          <span className="font-mono tabular-nums text-primary text-xs font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 min-w-7 text-center">
            {verticalExaggeration}×
          </span>
        </div>
      </div>
    </div>
  );
}
