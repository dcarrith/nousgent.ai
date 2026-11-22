import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CognitiveLobeId,
  DTHALAMUS_NUCLEI_ATLAS,
  DTHALAMUS_NUCLEI_ORDER,
  DthalamusNucleusId,
  DOLFACTORY_SUBREGIONS_ORDER,
  generateHospitalBrain4DAssets,
  INDEX_TO_LOBE,
  LOBE_INDEX_MAP
} from '../../packages/cbrain/src/brain4d/brainAnatomyGenerator';
import {
  createCorticalMicroSynapseMaterial,
  createDigMicroCapsuleMaterial,
  createDtiTractFlowMaterial,
  createHolographicCortexMaterial,
  createSubcorticalHologramMaterial,
  createThalamocorticalRadiationMaterial,
  HolographicCortexUniforms,
  MAX_CORTICAL_EXCITATIONS
} from '../../packages/cbrain/src/brain4d/brainShaders';

export interface NousgentCbrainMaskStageProps {
  readonly activeLobes: readonly CognitiveLobeId[];
  readonly activeNuclei?: readonly DthalamusNucleusId[];
  readonly oscillationBand?: string;
  readonly firingKenyonCells?: number;
  readonly pulseRevision: number;
  readonly alertDeflected?: boolean;
  readonly compact?: boolean;
  readonly liveCapsulesTotal?: number;
  readonly maskOpacityPct?: number;
  readonly voiceSpeaking?: boolean;
  readonly vocalAmplitude?: number;
}

const CACAO_LOBE_HEX: Record<CognitiveLobeId, string> = {
  working: '#7ed957',
  procedural: '#5bb33a',
  semantic: '#2dd4bf',
  episodic: '#c88a58',
  alignment: '#10b981'
};

interface ExcitationWave {
  center: THREE.Vector3;
  color: THREE.Color;
  startedAt: number;
  strength: number;
  radius: number;
}

const SOLAR_DISK_RADIUS = 0.455;

function computeDiskDomeZ(x: number, y: number): number {
  const r2 = (x * x + y * y) / (SOLAR_DISK_RADIUS * SOLAR_DISK_RADIUS);
  return 0.056 * Math.max(0, 1 - r2);
}

/**
 * Builds the 3D sculpted persona mask geometry with GPU morph target support
 * so the visage quietly matures over time as collective dbrain.to intelligence grows.
 */
function buildSculptedPersonaMaskGeometry(): THREE.BufferGeometry {
  const diskShape = new THREE.Shape();
  diskShape.absarc(0, 0, SOLAR_DISK_RADIUS, 0, Math.PI * 2, false);

  const leftEyeHole = new THREE.Path();
  leftEyeHole.absarc(-0.165, 0.068, 0.068, 0, Math.PI * 2, true);
  diskShape.holes.push(leftEyeHole);

  const rightEyeHole = new THREE.Path();
  rightEyeHole.absarc(0.165, 0.068, 0.068, 0, Math.PI * 2, true);
  diskShape.holes.push(rightEyeHole);

  const mouthHole = new THREE.Path();
  mouthHole.moveTo(-0.152, -0.246);
  mouthHole.lineTo(-0.152, -0.166);
  mouthHole.lineTo(0.152, -0.166);
  mouthHole.lineTo(0.152, -0.246);
  mouthHole.closePath();
  diskShape.holes.push(mouthHole);

  const geo = new THREE.ExtrudeGeometry(diskShape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.009,
    bevelSize: 0.009,
    bevelSegments: 2,
    curveSegments: 64
  });

  const pos = geo.attributes.position;
  const seniorPositions = new Float32Array(pos.count * 3);
  const colors = new Float32Array(pos.count * 3);
  const leftCacao = new THREE.Color('#21120c');
  const rightKataifi = new THREE.Color('#3b2115');
  const rimHighlight = new THREE.Color('#4d2c1d');
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const baseZ = z + computeDiskDomeZ(x, y);
    pos.setZ(i, baseZ);

    // Compute Stage III Oval Portrait & High Intellectual Forehead Morph Target
    const jawTaper =
      y < 0
        ? 1 - 0.25 * Math.min(1, Math.pow(-y / SOLAR_DISK_RADIUS, 1.18))
        : 1 - 0.11 * Math.min(1, Math.pow(y / SOLAR_DISK_RADIUS, 1.6));
    const kx = x * 0.83 * jawTaper;
    const ky = y * 1.13 + (y > 0 ? 0.038 * (y / SOLAR_DISK_RADIUS) : -0.022);
    const foreheadVault =
      y > 0.05
        ? 0.058 * Math.exp(-Math.pow((y - 0.24) / 0.16, 2)) * Math.max(0, 1 - Math.pow(x / 0.34, 2))
        : 0;
    const portraitRelief = 0.082 * Math.max(0, 1 - Math.pow(x / 0.38, 2) - Math.pow(y / 0.49, 2));
    const kz = baseZ + portraitRelief + foreheadVault;

    seniorPositions[i * 3] = kx;
    seniorPositions[i * 3 + 1] = ky;
    seniorPositions[i * 3 + 2] = kz;

    const radialRatio = Math.min(1, Math.hypot(x, y) / SOLAR_DISK_RADIUS);
    const baseSide = x < -0.004 ? leftCacao : x > 0.004 ? rightKataifi : rimHighlight;
    tmp.copy(baseSide).lerp(rimHighlight, radialRatio * 0.35);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.morphAttributes.position = [new THREE.Float32BufferAttribute(seniorPositions, 3)];
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function buildTaperedHornGeometry(
  curve: THREE.CatmullRomCurve3,
  tubularSegments = 36,
  radialSegments = 16,
  baseRadius = 0.048,
  tipRadius = 0.0065
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const normal = new THREE.Vector3();
  const point = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i += 1) {
    const u = i / tubularSegments;
    curve.getPointAt(u, point);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const r = baseRadius * Math.pow(1 - u, 0.78) + tipRadius * u;

    for (let j = 0; j <= radialSegments; j += 1) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      normal.x = cos * N.x + sin * B.x;
      normal.y = cos * N.y + sin * B.y;
      normal.z = cos * N.z + sin * B.z;
      normal.normalize();

      vertices.push(point.x + r * normal.x, point.y + r * normal.y, point.z + r * normal.z);
      uvs.push(u, j / radialSegments);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = stride * i + j;
      const b = stride * (i + 1) + j;
      const c = stride * (i + 1) + (j + 1);
      const d = stride * i + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

export function NousgentCbrainMaskStage({
  activeLobes,
  activeNuclei = ['trn', 'md'],
  oscillationBand = 'γ 42.4 Hz (BA 9/46 Working + TRN Ring-0)',
  firingKenyonCells = 64,
  pulseRevision,
  alertDeflected = false,
  compact = false,
  liveCapsulesTotal = 0,
  maskOpacityPct = 65,
  voiceSpeaking = false,
  vocalAmplitude = 0
}: Readonly<NousgentCbrainMaskStageProps>) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [webglReady, setWebglReady] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(true);

  const liveCapsulesRef = useRef<number>(liveCapsulesTotal);
  liveCapsulesRef.current = liveCapsulesTotal;
  const maskOpacityRef = useRef<number>(maskOpacityPct);
  maskOpacityRef.current = maskOpacityPct;
  const voiceSpeakingRef = useRef<boolean>(voiceSpeaking);
  voiceSpeakingRef.current = voiceSpeaking;
  const vocalAmplitudeRef = useRef<number>(vocalAmplitude);
  vocalAmplitudeRef.current = vocalAmplitude;

  const wavesRef = useRef<ExcitationWave[]>([]);
  const morphicTriggerRef = useRef<number>(0);
  const speakingUntilRef = useRef<number>(0);
  const capsuleLociRef = useRef<readonly { position: [number, number, number]; lobe: CognitiveLobeId }[]>([]);
  const capsuleMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const capsuleAttrRef = useRef<THREE.InstancedBufferAttribute | null>(null);

  const fireCorticalActivity = useCallback(
    (lobes: readonly CognitiveLobeId[], nuclei: readonly DthalamusNucleusId[], isAlert: boolean) => {
      const nowSec = performance.now() * 0.001;
      speakingUntilRef.current = nowSec + 3.8;
      morphicTriggerRef.current = nowSec;
      setIsSpeaking(true);

      const nextWaves: ExcitationWave[] = [];
      for (const nId of nuclei.slice(0, 2)) {
        const meta = DTHALAMUS_NUCLEI_ATLAS[nId];
        if (meta) {
          nextWaves.push({
            center: new THREE.Vector3(meta.worldAnchor[0], meta.worldAnchor[1], meta.worldAnchor[2] + 0.14),
            color: new THREE.Color(isAlert ? '#fb7185' : '#2dd4bf'),
            startedAt: nowSec,
            strength: 1.32,
            radius: 0.30
          });
        }
      }

      const loci = capsuleLociRef.current;
      const targetLobes: readonly CognitiveLobeId[] = lobes.length > 0 ? lobes : ['working', 'semantic'];
      targetLobes.forEach((lobeId, idx) => {
        const candidates = loci.filter((l) => l.lobe === lobeId);
        const chosen = candidates[(idx * 7 + pulseRevision) % Math.max(1, candidates.length)];
        const pos: [number, number, number] = chosen ? chosen.position : [idx * 0.22 - 0.22, 0.18, 0.42];
        nextWaves.push({
          center: new THREE.Vector3(pos[0], pos[1], pos[2]),
          color: new THREE.Color(isAlert && idx === 0 ? '#fb7185' : CACAO_LOBE_HEX[lobeId]),
          startedAt: nowSec + idx * 0.08,
          strength: 1.38,
          radius: 0.35
        });
      });

      nextWaves.push({
        center: new THREE.Vector3(0.0, 0.16, 0.56),
        color: new THREE.Color(isAlert ? '#fb7185' : '#7ed957'),
        startedAt: nowSec,
        strength: 1.45,
        radius: 0.34
      });

      wavesRef.current = nextWaves.slice(0, MAX_CORTICAL_EXCITATIONS);

      const attr = capsuleAttrRef.current;
      if (attr && loci.length > 0) {
        const activeSet = new Set(targetLobes);
        for (let i = 0; i < loci.length; i += 1) {
          const hot = activeSet.has(loci[i].lobe);
          attr.setX(i, hot ? 1.0 : 0.24);
          attr.setW(i, hot ? 0.88 : 0.0);
        }
        attr.needsUpdate = true;
      }
    },
    [pulseRevision]
  );

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const initW = Math.max(320, container.clientWidth || 640);
    const initH = Math.max(300, container.clientHeight || (compact ? 420 : 540));
    renderer.setSize(initW, initH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 50);
    // Eye-level optical axis looking dead-center straight into NOUSGENT's eyes
    camera.position.set(0, 0.028, 2.94);
    camera.lookAt(0, 0.028, 0.0);

    const ambient = new THREE.AmbientLight('#3d2419', 2.45);
    scene.add(ambient);
    const pistachioKey = new THREE.DirectionalLight('#7ed957', 2.9);
    pistachioKey.position.set(2.5, 3.0, 3.4);
    scene.add(pistachioKey);
    const jadeRim = new THREE.DirectionalLight('#2dd4bf', 2.5);
    jadeRim.position.set(-2.8, 1.5, -2.0);
    scene.add(jadeRim);
    const bronzeFill = new THREE.PointLight('#c88a58', 2.8, 8.5);
    bronzeFill.position.set(0, -1.4, 2.4);
    scene.add(bronzeFill);

    const rootAssembly = new THREE.Group();
    scene.add(rootAssembly);

    // =========================================================================
    // LAYER 1 (POSTERIOR / CORE): REAL @cbrain/core 4D ANATOMICAL CONNECTOME
    // =========================================================================
    const brainAssets = generateHospitalBrain4DAssets();
    capsuleLociRef.current = brainAssets.capsuleLoci;

    const recolorLobeBuffer = (colorArr: Float32Array, count: number) => {
      const c = new THREE.Color();
      const palette = ['#7ed957', '#2dd4bf', '#10b981', '#c88a58', '#5bb33a'];
      for (let i = 0; i < count; i += 1) {
        c.set(palette[i % palette.length]);
        colorArr[i * 3] = c.r;
        colorArr[i * 3 + 1] = c.g;
        colorArr[i * 3 + 2] = c.b;
      }
    };
    recolorLobeBuffer(brainAssets.microSynapseColors, brainAssets.microSynapsePhases.length);

    const brainGroup = new THREE.Group();
    brainGroup.position.set(0, -0.02, -0.08);
    brainGroup.scale.setScalar(1.07);
    rootAssembly.add(brainGroup);

    const backCortex = createHolographicCortexMaterial(true);
    const frontCortex = createHolographicCortexMaterial(false);
    backCortex.uniforms.uShellOpacity.value = 0.64;
    frontCortex.uniforms.uShellOpacity.value = 0.88;
    backCortex.uniforms.uMorphicColor.value.set('#7ed957');
    frontCortex.uniforms.uMorphicColor.value.set('#7ed957');

    const cerebrumBack = new THREE.Mesh(brainAssets.cerebrumGeometry, backCortex.material);
    cerebrumBack.renderOrder = 2;
    const cerebrumFront = new THREE.Mesh(brainAssets.cerebrumGeometry, frontCortex.material);
    cerebrumFront.renderOrder = 6;
    const cerebellumMesh = new THREE.Mesh(brainAssets.cerebellumGeometry, frontCortex.material);
    cerebellumMesh.renderOrder = 5;
    brainGroup.add(cerebrumBack, cerebrumFront, cerebellumMesh);

    const sulcalMat = new THREE.LineBasicMaterial({
      color: '#2dd4bf',
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sulcalLines = new THREE.LineSegments(brainAssets.sulcalContourGeometry, sulcalMat);
    sulcalLines.renderOrder = 7;
    brainGroup.add(sulcalLines);

    const subcorticalMaterials: THREE.ShaderMaterial[] = [];
    const addSubcortical = (geo: THREE.BufferGeometry, baseHex: string, rimHex: string, opacity: number, order = 3) => {
      const mat = createSubcorticalHologramMaterial(baseHex, rimHex, opacity);
      subcorticalMaterials.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = order;
      brainGroup.add(mesh);
    };

    addSubcortical(brainAssets.corpusCallosumGeometry, '#2dd4bf', '#7ed957', 0.4, 3);
    addSubcortical(brainAssets.hippocampusGeometry, '#c88a58', '#f5ebe4', 0.44, 3);
    addSubcortical(brainAssets.thalamusGeometry, '#10b981', '#7ed957', 0.56, 4);
    addSubcortical(brainAssets.brainstemGeometry, '#4a3025', '#2dd4bf', 0.34, 2);
    addSubcortical(brainAssets.olfactoryTractGeometry, '#10b981', '#7ed957', 0.56, 4);

    for (const nId of DTHALAMUS_NUCLEI_ORDER) {
      const nGeo = brainAssets.dthalamusNucleiGeometries[nId];
      if (nGeo) addSubcortical(nGeo, '#7ed957', '#2dd4bf', 0.68, 4);
    }
    for (const oId of DOLFACTORY_SUBREGIONS_ORDER) {
      const oGeo = brainAssets.dolfactorySubregionGeometries[oId];
      if (oGeo) addSubcortical(oGeo, '#10b981', '#7ed957', 0.64, 4);
    }

    const dtiMat = createDtiTractFlowMaterial();
    dtiMat.uniforms.uOpacity.value = 0.58;
    const dtiLines = new THREE.LineSegments(brainAssets.dtiTractGeometry, dtiMat);
    dtiLines.renderOrder = 4;
    brainGroup.add(dtiLines);

    const radiationMat = createThalamocorticalRadiationMaterial(1.0);
    radiationMat.uniforms.uOpacity.value = 0.72;
    const radiationLines = new THREE.LineSegments(brainAssets.thalamocorticalRadiationGeometry, radiationMat);
    radiationLines.renderOrder = 5;
    brainGroup.add(radiationLines);

    const microGeo = new THREE.BufferGeometry();
    microGeo.setAttribute('position', new THREE.BufferAttribute(brainAssets.microSynapsePositions, 3));
    microGeo.setAttribute('color', new THREE.BufferAttribute(brainAssets.microSynapseColors, 3));
    microGeo.setAttribute('aPhase', new THREE.BufferAttribute(brainAssets.microSynapsePhases, 1));
    const microMat = createCorticalMicroSynapseMaterial();
    microMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
    microMat.uniforms.uOpacity.value = 0.88;
    const microPoints = new THREE.Points(microGeo, microMat);
    microPoints.renderOrder = 8;
    brainGroup.add(microPoints);

    const capCount = brainAssets.capsuleLoci.length;
    const capGeo = new THREE.OctahedronGeometry(0.014, 0);
    const capMat = createDigMicroCapsuleMaterial();
    const capInstanced = new THREE.InstancedMesh(capGeo, capMat, capCount);
    capInstanced.renderOrder = 7;
    const capStates = new Float32Array(capCount * 4);
    const dummy = new THREE.Object3D();
    const instCol = new THREE.Color();

    brainAssets.capsuleLoci.forEach((locus, idx) => {
      dummy.position.set(locus.position[0], locus.position[1], locus.position[2]);
      dummy.rotation.set(locus.phase, locus.phase * 0.7, 0);
      dummy.updateMatrix();
      capInstanced.setMatrixAt(idx, dummy.matrix);
      instCol.set(CACAO_LOBE_HEX[locus.lobe]);
      capInstanced.setColorAt(idx, instCol);
      capStates[idx * 4] = 0.45;
      capStates[idx * 4 + 1] = 0;
      capStates[idx * 4 + 2] = locus.phase;
      capStates[idx * 4 + 3] = 0.15;
    });
    capInstanced.instanceMatrix.needsUpdate = true;
    if (capInstanced.instanceColor) capInstanced.instanceColor.needsUpdate = true;
    const capStateAttr = new THREE.InstancedBufferAttribute(capStates, 4);
    capGeo.setAttribute('aCapsuleState', capStateAttr);
    capsuleMeshRef.current = capInstanced;
    capsuleAttrRef.current = capStateAttr;
    brainGroup.add(capInstanced);

    // =========================================================================
    // LAYER 2 (ANTERIOR FACE): SCULPTED 3D PERSONA MASK
    // =========================================================================
    const maskGroup = new THREE.Group();
    maskGroup.position.set(0, -0.04, 0.72);
    rootAssembly.add(maskGroup);

    const disposableGeos: THREE.BufferGeometry[] = [];
    const disposableMats: THREE.Material[] = [];

    // 1. GPU Face Shield
    const diskGeo = buildSculptedPersonaMaskGeometry();
    disposableGeos.push(diskGeo);
    const maskSurfaceMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      vertexColors: true,
      emissive: new THREE.Color('#24130c'),
      emissiveIntensity: 0.38,
      roughness: 0.16,
      metalness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
      transparent: true,
      opacity: maskOpacityRef.current / 100,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    disposableMats.push(maskSurfaceMat);
    const diskMesh = new THREE.Mesh(diskGeo, maskSurfaceMat);
    diskMesh.updateMorphTargets();
    diskMesh.renderOrder = 12;
    maskGroup.add(diskMesh);

    const outerRimGeo = new THREE.TorusGeometry(SOLAR_DISK_RADIUS + 0.008, 0.0085, 14, 80);
    const innerRimGeo = new THREE.TorusGeometry(SOLAR_DISK_RADIUS - 0.056, 0.0045, 10, 80);
    disposableGeos.push(outerRimGeo, innerRimGeo);
    const bronzeTrimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#c88a58'),
      emissive: new THREE.Color('#4a2b18'),
      emissiveIntensity: 0.42,
      roughness: 0.25,
      metalness: 0.62,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    disposableMats.push(bronzeTrimMat);
    const outerRimMesh = new THREE.Mesh(outerRimGeo, bronzeTrimMat);
    outerRimMesh.position.z = 0.016;
    outerRimMesh.renderOrder = 13;
    const innerRimMesh = new THREE.Mesh(innerRimGeo, bronzeTrimMat);
    innerRimMesh.position.z = 0.024;
    innerRimMesh.renderOrder = 13;
    maskGroup.add(outerRimMesh, innerRimMesh);

    // 2A. Stage I Serrated Solar Rim Triangles (recede smoothly as Stage III wisdom emerges)
    const rimTriangles: THREE.Mesh[] = [];
    const triShape = new THREE.Shape();
    triShape.moveTo(-0.025, -0.020);
    triShape.lineTo(0.025, -0.020);
    triShape.lineTo(0, 0.028);
    triShape.closePath();
    const triGeo = new THREE.ExtrudeGeometry(triShape, { depth: 0.007, bevelEnabled: false });
    disposableGeos.push(triGeo);

    const triPalette = ['#f5ebe4', '#7ed957', '#f5ebe4', '#2dd4bf'];
    const triCount = 28;
    const triRingRadius = SOLAR_DISK_RADIUS - 0.028;
    for (let t = 0; t < triCount; t += 1) {
      const angle = (t / triCount) * Math.PI * 2;
      const deg = ((angle * 180) / Math.PI + 360) % 360;
      if ((deg > 66 && deg < 80) || (deg > 100 && deg < 114)) continue;

      const tMat = new THREE.MeshBasicMaterial({
        color: triPalette[t % triPalette.length],
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      });
      disposableMats.push(tMat);
      const tri = new THREE.Mesh(triGeo, tMat);
      const tx = Math.cos(angle) * triRingRadius;
      const ty = Math.sin(angle) * triRingRadius;
      tri.position.set(tx, ty, 0.028 + computeDiskDomeZ(tx, ty));
      tri.rotation.z = angle - Math.PI / 2;
      tri.renderOrder = 13;
      rimTriangles.push(tri);
      maskGroup.add(tri);
    }

    // 2B. Sculpted Crest, Diadem, Forehead Tacks, Temple Relief & Chin Detail
    const seniorWisdomGroup = new THREE.Group();
    maskGroup.add(seniorWisdomGroup);

    const darkCacaoSculptMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#24140e'),
      emissive: new THREE.Color('#331c12'),
      emissiveIntensity: 0.4,
      roughness: 0.22,
      metalness: 0.35,
      clearcoat: 0.92,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    disposableMats.push(darkCacaoSculptMat);

    // Towering Sagittal Braided Coiffure Crest + Side Plaits
    const seniorCrestGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.075, 32, 1, false, 0, Math.PI);
    seniorCrestGeo.rotateZ(Math.PI / 2);
    seniorCrestGeo.rotateY(Math.PI / 2);
    seniorCrestGeo.scale(0.52, 1.55, 1.0);
    disposableGeos.push(seniorCrestGeo);
    const seniorCentralCrest = new THREE.Mesh(seniorCrestGeo, darkCacaoSculptMat);
    seniorCentralCrest.position.set(0, 0.51, 0.035);
    seniorCentralCrest.renderOrder = 13;
    seniorWisdomGroup.add(seniorCentralCrest);

    // Braided Herringbone Ribs along the Sagittal Crest
    for (let bIdx = 0; bIdx < 9; bIdx += 1) {
      const ribAngle = (bIdx / 8) * Math.PI * 0.84 + Math.PI * 0.08;
      const ribGeo = new THREE.TorusGeometry(0.052, 0.0045, 8, 20);
      disposableGeos.push(ribGeo);
      const ribMesh = new THREE.Mesh(ribGeo, bronzeTrimMat);
      ribMesh.position.set(0, 0.50 + Math.sin(ribAngle) * 0.24, 0.045 + Math.cos(ribAngle) * 0.04);
      ribMesh.rotation.x = Math.PI * 0.35;
      ribMesh.renderOrder = 14;
      seniorWisdomGroup.add(ribMesh);
    }

    // Copper-Bronze Hairline Diadem Band across the High Vaulted Forehead
    const diademCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.31, 0.28, 0.075),
      new THREE.Vector3(-0.18, 0.43, 0.095),
      new THREE.Vector3(0, 0.48, 0.105),
      new THREE.Vector3(0.18, 0.43, 0.095),
      new THREE.Vector3(0.31, 0.28, 0.075)
    ]);
    const diademGeo = new THREE.TubeGeometry(diademCurve, 28, 0.015, 10, false);
    disposableGeos.push(diademGeo);
    const diademMesh = new THREE.Mesh(diademGeo, bronzeTrimMat);
    diademMesh.renderOrder = 14;
    seniorWisdomGroup.add(diademMesh);

    // Diamond Forehead Prestige Tacks + 3-Bar Temple Relief
    const tackGeo = new THREE.SphereGeometry(0.012, 12, 12);
    disposableGeos.push(tackGeo);
    const foreheadTackCoords: [number, number, number][] = [
      [0, 0.355, 0.162],
      [-0.045, 0.31, 0.165],
      [0.045, 0.31, 0.165],
      [0, 0.265, 0.168],
      [0, 0.31, 0.168]
    ];
    for (const [tx, ty, tz] of foreheadTackCoords) {
      const tack = new THREE.Mesh(tackGeo, bronzeTrimMat);
      tack.position.set(tx, ty, tz);
      tack.renderOrder = 15;
      seniorWisdomGroup.add(tack);
    }

    const scarBarGeo = new THREE.BoxGeometry(0.042, 0.007, 0.012);
    disposableGeos.push(scarBarGeo);
    for (const sSign of [-1, 1]) {
      for (const sy of [0.095, 0.068, 0.041]) {
        const scar = new THREE.Mesh(scarBarGeo, bronzeTrimMat);
        scar.position.set(sSign * 0.275, sy, 0.105);
        scar.renderOrder = 15;
        seniorWisdomGroup.add(scar);
      }
    }

    // Carved Braided Elder Chin Beard / Goatee (Symbol of Senior Rank & Wisdom)
    const seniorBeardGroup = new THREE.Group();
    seniorBeardGroup.position.set(0, -0.525, 0.055);
    const beardConeGeo = new THREE.ConeGeometry(0.044, 0.165, 16);
    beardConeGeo.rotateX(Math.PI);
    disposableGeos.push(beardConeGeo);
    const beardMesh = new THREE.Mesh(beardConeGeo, darkCacaoSculptMat);
    beardMesh.renderOrder = 14;
    seniorBeardGroup.add(beardMesh);
    for (let br = 0; br < 4; br += 1) {
      const brGeo = new THREE.TorusGeometry(0.038 - br * 0.007, 0.004, 8, 18);
      brGeo.rotateX(Math.PI / 2);
      disposableGeos.push(brGeo);
      const brRing = new THREE.Mesh(brGeo, bronzeTrimMat);
      brRing.position.y = 0.045 - br * 0.032;
      brRing.renderOrder = 15;
      seniorBeardGroup.add(brRing);
    }
    maskGroup.add(seniorBeardGroup);

    // 3. Twin Sweeping Sculpted Horns (Wide Lateral in Stage I -> Flanking Plaits in Stage III)
    const leftHornMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#23130d'),
      emissive: new THREE.Color('#2f1910'),
      emissiveIntensity: 0.42,
      roughness: 0.22,
      metalness: 0.36,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const rightHornMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#9e633c'),
      emissive: new THREE.Color('#4a2b18'),
      emissiveIntensity: 0.45,
      roughness: 0.24,
      metalness: 0.62,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const pistachioTrimMat = new THREE.MeshBasicMaterial({
      color: '#7ed957',
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const hornSpineMat = new THREE.LineBasicMaterial({
      color: '#7ed957',
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    disposableMats.push(leftHornMat, rightHornMat, pistachioTrimMat, hornSpineMat);

    const buildHornAssembly = (xSign: number) => {
      const hGroup = new THREE.Group();
      const hornCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xSign * 0.135, 0.415, 0.022),
        new THREE.Vector3(xSign * 0.285, 0.545, 0.008),
        new THREE.Vector3(xSign * 0.345, 0.705, -0.006),
        new THREE.Vector3(xSign * 0.265, 0.845, 0.012),
        new THREE.Vector3(xSign * 0.102, 0.915, 0.036)
      ]);

      const hGeo = buildTaperedHornGeometry(hornCurve, 38, 16, 0.050, 0.0065);
      disposableGeos.push(hGeo);
      const hMesh = new THREE.Mesh(hGeo, xSign < 0 ? leftHornMat : rightHornMat);
      hMesh.renderOrder = 13;
      hGroup.add(hMesh);

      for (let rIdx = 0; rIdx < 7; rIdx += 1) {
        const u = 0.08 + rIdx * 0.12;
        const pt = hornCurve.getPointAt(u);
        const tangent = hornCurve.getTangentAt(u).normalize();
        const ringRadius = (0.050 * Math.pow(1 - u, 0.78) + 0.0065 * u) * 1.08;
        const annGeo = new THREE.TorusGeometry(ringRadius, 0.0038, 8, 20);
        disposableGeos.push(annGeo);
        const annMesh = new THREE.Mesh(annGeo, rIdx % 3 === 1 ? pistachioTrimMat : bronzeTrimMat);
        annMesh.position.copy(pt);
        annMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        annMesh.renderOrder = 14;
        hGroup.add(annMesh);
      }

      const spinePts = hornCurve.getPoints(32).map((p) => new THREE.Vector3(p.x * 0.98, p.y, p.z + 0.018));
      const spineGeo = new THREE.BufferGeometry().setFromPoints(spinePts);
      disposableGeos.push(spineGeo);
      const spineLine = new THREE.Line(spineGeo, hornSpineMat);
      spineLine.renderOrder = 15;
      hGroup.add(spineLine);

      maskGroup.add(hGroup);
      return hGroup;
    };

    const leftHornGroup = buildHornAssembly(-1);
    const rightHornGroup = buildHornAssembly(1);

    // 4. Carved Double-Arch Brow Crest & Slender Vertical Median Nose Bridge
    const noseBridgeGroup = new THREE.Group();
    const buildBrowArch = (xSign: number) => {
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.175, 0.082),
        new THREE.Vector3(xSign * 0.115, 0.225, 0.074),
        new THREE.Vector3(xSign * 0.245, 0.195, 0.058),
        new THREE.Vector3(xSign * 0.305, 0.125, 0.042)
      ]);
      const browGeo = new THREE.TubeGeometry(browCurve, 20, 0.011, 8, false);
      disposableGeos.push(browGeo);
      const browMesh = new THREE.Mesh(browGeo, bronzeTrimMat);
      browMesh.renderOrder = 14;
      noseBridgeGroup.add(browMesh);
    };
    buildBrowArch(-1);
    buildBrowArch(1);

    const noseBridgeGeo = new THREE.BoxGeometry(0.036, 0.265, 0.038);
    disposableGeos.push(noseBridgeGeo);
    const noseBridgeMesh = new THREE.Mesh(noseBridgeGeo, bronzeTrimMat);
    noseBridgeMesh.position.set(0, 0.048, 0.078);
    noseBridgeMesh.renderOrder = 14;
    noseBridgeGroup.add(noseBridgeMesh);
    maskGroup.add(noseBridgeGroup);

    // 5. Sculpted Ringed Eyes
    const buildSculptedEye = (xSign: number) => {
      const eyeGroup = new THREE.Group();
      const ex = xSign * 0.165;
      const ey = 0.068;
      eyeGroup.position.set(ex, ey, computeDiskDomeZ(ex, ey) + 0.022);

      const barrelGeo = new THREE.CylinderGeometry(0.074, 0.080, 0.058, 32, 1, true);
      barrelGeo.rotateX(Math.PI / 2);
      disposableGeos.push(barrelGeo);
      const barrelMesh = new THREE.Mesh(barrelGeo, bronzeTrimMat);
      barrelMesh.renderOrder = 14;

      const ivoryRingGeo = new THREE.RingGeometry(0.064, 0.078, 32);
      disposableGeos.push(ivoryRingGeo);
      const ivoryMat = new THREE.MeshBasicMaterial({
        color: '#f5ebe4',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94,
        depthWrite: false
      });
      disposableMats.push(ivoryMat);
      const ivoryRing = new THREE.Mesh(ivoryRingGeo, ivoryMat);
      ivoryRing.position.z = 0.030;
      ivoryRing.renderOrder = 15;

      const pistachioRingGeo = new THREE.RingGeometry(0.043, 0.058, 32);
      disposableGeos.push(pistachioRingGeo);
      const pistachioMat = new THREE.MeshBasicMaterial({
        color: '#7ed957',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      disposableMats.push(pistachioMat);
      const outerRing = new THREE.Mesh(pistachioRingGeo, pistachioMat);
      outerRing.position.z = 0.032;
      outerRing.renderOrder = 15;

      const jadeRingGeo = new THREE.RingGeometry(0.018, 0.035, 28);
      disposableGeos.push(jadeRingGeo);
      const jadeMat = new THREE.MeshBasicMaterial({
        color: '#2dd4bf',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      });
      disposableMats.push(jadeMat);
      const innerIris = new THREE.Mesh(jadeRingGeo, jadeMat);
      innerIris.position.z = 0.034;
      innerIris.renderOrder = 15;

      // Stage III Heavy Upper Eyelid Hood (Composure, Modesty & Introspective Wisdom)
      const seniorLidGeo = new THREE.SphereGeometry(0.078, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52);
      seniorLidGeo.scale(1.12, 0.72, 0.55);
      disposableGeos.push(seniorLidGeo);
      const seniorLidMesh = new THREE.Mesh(seniorLidGeo, darkCacaoSculptMat);
      seniorLidMesh.position.set(0, 0.008, 0.022);
      seniorLidMesh.renderOrder = 15;

      eyeGroup.add(barrelMesh, ivoryRing, outerRing, innerIris, seniorLidMesh);
      return { eyeGroup, barrelMesh, outerRing, seniorLidMesh, baseX: ex, baseY: ey };
    };

    const leftEye = buildSculptedEye(-1);
    const rightEye = buildSculptedEye(1);
    maskGroup.add(leftEye.eyeGroup, rightEye.eyeGroup);

    // 6. Mouth: Wide Rectangular 11-Tooth Aperture -> Composed Sculpted Lips
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.206, computeDiskDomeZ(0, -0.206) + 0.028);

    const lipFramePts = [
      new THREE.Vector3(-0.162, -0.046, 0.008),
      new THREE.Vector3(0.162, -0.046, 0.008),
      new THREE.Vector3(0.162, 0.046, 0.008),
      new THREE.Vector3(-0.162, 0.046, 0.008),
      new THREE.Vector3(-0.162, -0.046, 0.008)
    ];
    const lipFrameGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(lipFramePts, true, 'catmullrom', 0.05),
      32,
      0.0085,
      8,
      true
    );
    disposableGeos.push(lipFrameGeo);
    const lipFrameMesh = new THREE.Mesh(lipFrameGeo, bronzeTrimMat);
    lipFrameMesh.renderOrder = 14;
    mouthGroup.add(lipFrameMesh);

    const mouthBars: THREE.Mesh[] = [];
    const toothGeo = new THREE.BoxGeometry(0.016, 0.062, 0.015);
    disposableGeos.push(toothGeo);
    for (let b = 0; b < 11; b += 1) {
      const toothHex = b % 3 === 0 ? '#f5ebe4' : b % 2 === 0 ? '#7ed957' : '#2dd4bf';
      const toothMat = new THREE.MeshBasicMaterial({
        color: toothHex,
        transparent: true,
        opacity: 0.94,
        depthWrite: false
      });
      disposableMats.push(toothMat);
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.x = (b - 5) * 0.027;
      tooth.renderOrder = 15;
      mouthBars.push(tooth);
      mouthGroup.add(tooth);
    }
    maskGroup.add(mouthGroup);

    // Tilted 3D Elliptical Orbital Halos
    const haloPistachioGeo = new THREE.TorusGeometry(1.08, 0.0045, 8, 96);
    const haloPistachioMat = new THREE.MeshBasicMaterial({ color: '#7ed957', transparent: true, opacity: 0.36 });
    const haloBronzeGeo = new THREE.TorusGeometry(1.17, 0.004, 8, 96);
    const haloBronzeMat = new THREE.MeshBasicMaterial({ color: '#c88a58', transparent: true, opacity: 0.30 });
    disposableGeos.push(haloPistachioGeo, haloBronzeGeo);
    disposableMats.push(haloPistachioMat, haloBronzeMat);

    const haloPistachio = new THREE.Mesh(haloPistachioGeo, haloPistachioMat);
    haloPistachio.rotation.set(Math.PI * 0.38, 0.28, -0.22);
    const haloBronze = new THREE.Mesh(haloBronzeGeo, haloBronzeMat);
    haloBronze.rotation.set(-Math.PI * 0.34, -0.32, 0.35);
    rootAssembly.add(haloPistachio, haloBronze);

    // Fixed forward orientation: NOUSGENT gazes straight ahead into the user's eyes
    rootAssembly.rotation.set(0, 0, 0);
    rootAssembly.position.set(0, 0, 0);

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = Math.max(280, container.clientWidth);
      const h = Math.max(280, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    const applyUniformUpdates = (u: HolographicCortexUniforms, tSec: number, motion: number, lobeIdx: number) => {
      u.uTime.value = tSec;
      u.uMotionScale.value = motion;
      u.uSelectedLobe.value = lobeIdx;

      const waves = wavesRef.current;
      for (let i = 0; i < MAX_CORTICAL_EXCITATIONS; i += 1) {
        const w = waves[i];
        if (w) {
          const age = Math.max(0, tSec - w.startedAt);
          const decay = Math.exp(-age * 0.42);
          u.uExciteCenters.value[i].copy(w.center);
          u.uExciteColors.value[i].copy(w.color);
          u.uExciteParams.value[i].set(w.strength * Math.max(0.34, decay), age, w.radius, 42.4);
        } else {
          u.uExciteParams.value[i].set(0, 0, 0.28, 40.0);
        }
      }

      const morphAge = Math.max(0, tSec - morphicTriggerRef.current);
      if (morphAge < 3.4) {
        const mStrength = (1 - morphAge / 3.4) * 0.88;
        u.uMorphicWave.value.set(mStrength, morphAge * 0.48, 0, 0);
      } else {
        u.uMorphicWave.value.set(0.15, (tSec * 0.28) % 1.1, 0, 0);
      }
    };

    let rafId = 0;
    const renderLoop = (nowMs: number) => {
      rafId = requestAnimationFrame(renderLoop);
      const tSec = nowMs * 0.001;
      const motion = reducedMotion ? 0 : 1;

      // Silent organic progression driven automatically over time by live dbrain.to intelligence growth
      const m = Math.max(0, Math.min(1, (liveCapsulesRef.current || 0) / 1000000));
      if (diskMesh.morphTargetInfluences) {
        diskMesh.morphTargetInfluences[0] = m;
      }

      outerRimMesh.scale.set(1 - 0.22 * m, 1 + 0.12 * m, 1);
      outerRimMesh.position.z = 0.016 + 0.038 * m;
      innerRimMesh.scale.set(1 - 0.22 * m, 1 + 0.12 * m, 1);
      innerRimMesh.position.z = 0.024 + 0.042 * m;

      const juniorScale = Math.max(0.001, 1 - m * 1.15);
      const seniorWeight = Math.max(0, Math.min(1, (m - 0.18) / 0.72));

      seniorWisdomGroup.visible = seniorWeight > 0.02 && maskOpacityRef.current > 2;
      seniorWisdomGroup.scale.setScalar(0.25 + 0.75 * seniorWeight);
      seniorBeardGroup.visible = seniorWeight > 0.12 && maskOpacityRef.current > 2;
      seniorBeardGroup.scale.setScalar(Math.max(0.01, seniorWeight));

      leftHornGroup.position.set(0.065 * m, -0.04 * m, 0.02 * m);
      leftHornGroup.scale.setScalar(1 - 0.34 * m);
      rightHornGroup.position.set(-0.065 * m, -0.04 * m, 0.02 * m);
      rightHornGroup.scale.setScalar(1 - 0.34 * m);

      noseBridgeGroup.position.z = 0.072 * m;
      noseBridgeGroup.scale.set(1 - 0.18 * m, 1 + 0.08 * m, 1);

      for (const eye of [leftEye, rightEye]) {
        eye.eyeGroup.position.set(
          eye.baseX * (1 - 0.14 * m),
          eye.baseY + 0.015 * m,
          computeDiskDomeZ(eye.baseX, eye.baseY) + 0.022 + 0.072 * m
        );
        eye.eyeGroup.scale.set(1 + 0.15 * m, 1 - 0.42 * m, 1);
        eye.barrelMesh.scale.z = Math.max(0.18, 1 - 0.78 * m);
        eye.seniorLidMesh.visible = seniorWeight > 0.05 && maskOpacityRef.current > 2;
        eye.seniorLidMesh.scale.set(1.12, 0.72 * seniorWeight, 0.55);
      }

      mouthGroup.position.set(0, -0.206 - 0.032 * m, computeDiskDomeZ(0, -0.206) + 0.028 + 0.068 * m);
      mouthGroup.scale.set(1 - 0.34 * m, 1 - 0.26 * m, 1);

      // Admin-configured mask opacity (`NOUSGENT_MASK_OPACITY_PCT`, default 65%)
      const maskAlpha = Math.max(0, Math.min(1, maskOpacityRef.current / 100));
      maskSurfaceMat.opacity = maskAlpha;
      diskMesh.visible = maskAlpha > 0.01;
      const trimAlpha = maskAlpha < 0.02 ? 0.12 : Math.min(0.98, 0.28 + maskAlpha * 0.85);
      bronzeTrimMat.opacity = trimAlpha;
      darkCacaoSculptMat.opacity = trimAlpha;
      const hornAlpha = maskAlpha < 0.02 ? 0.14 : Math.min(0.96, 0.25 + maskAlpha * 0.85);
      leftHornMat.opacity = hornAlpha;
      rightHornMat.opacity = hornAlpha;

      applyUniformUpdates(backCortex.uniforms, tSec, motion, -1);
      applyUniformUpdates(frontCortex.uniforms, tSec, motion, -1);

      dtiMat.uniforms.uTime.value = tSec;
      dtiMat.uniforms.uMotionScale.value = motion;
      radiationMat.uniforms.uTime.value = tSec;
      radiationMat.uniforms.uMotionScale.value = motion;
      microMat.uniforms.uTime.value = tSec;
      microMat.uniforms.uMotionScale.value = motion;
      capMat.uniforms.uTime.value = tSec;
      capMat.uniforms.uMotionScale.value = motion;
      for (const sm of subcorticalMaterials) {
        sm.uniforms.uTime.value = tSec;
      }

      const voiceActive = voiceSpeakingRef.current;
      const liveVocalAmp = vocalAmplitudeRef.current;
      const speakingActive = voiceActive || tSec < speakingUntilRef.current;

      mouthBars.forEach((tooth, idx) => {
        const centerWeight = 1 - Math.abs(idx - 5) * 0.13;
        let wave: number;
        if (voiceActive && !reducedMotion) {
          const syllableMod = 0.38 + liveVocalAmp * 1.15 * centerWeight + 0.18 * Math.abs(Math.sin(tSec * 15.0 + idx * 0.7));
          wave = syllableMod * (1.0 - 0.28 * m);
        } else if (speakingActive && !reducedMotion) {
          wave = 0.42 + Math.abs(Math.sin(tSec * 12.0 + idx * 0.78)) * (1.35 - 0.45 * m) * centerWeight;
        } else {
          wave = 0.55 + 0.08 * Math.sin(tSec * 2.1 + idx) * motion;
        }
        tooth.scale.y = Math.max(0.28, Math.min(1.42, wave));
      });

      rimTriangles.forEach((tri, idx) => {
        tri.visible = m < 0.86 && maskAlpha > 0.02;
        const ripple =
          speakingActive && !reducedMotion
            ? juniorScale * (1.0 + 0.18 * Math.max(0, Math.sin(tSec * 7.5 - idx * 0.45)))
            : juniorScale;
        tri.scale.setScalar(Math.max(0.001, ripple));
      });

      const eyePulse = voiceActive
        ? 1.05 + liveVocalAmp * 0.14 * motion
        : speakingActive
          ? 1.08 + 0.06 * Math.sin(tSec * 6.0) * motion
          : 1.0;
      leftEye.outerRing.scale.setScalar(eyePulse);
      rightEye.outerRing.scale.setScalar(eyePulse);
      haloPistachio.rotation.z = -0.22 + tSec * 0.08 * motion;
      haloBronze.rotation.z = 0.35 - tSec * 0.06 * motion;

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      brainAssets.dispose();
      for (const g of disposableGeos) g.dispose();
      for (const m of disposableMats) m.dispose();
      capGeo.dispose();
      microGeo.dispose();
      renderer.dispose();
    };
  }, [compact]);

  useEffect(() => {
    fireCorticalActivity(activeLobes, activeNuclei, alertDeflected);
    const timer = setTimeout(() => setIsSpeaking(false), 3800);
    return () => clearTimeout(timer);
  }, [activeLobes, activeNuclei, alertDeflected, fireCorticalActivity, pulseRevision]);

  const activeLobeNames = activeLobes
    .map((l) => INDEX_TO_LOBE[LOBE_INDEX_MAP[l]]?.toUpperCase() || l.toUpperCase())
    .join(' + ');

  return (
    <div className="cbrain-persona-stage">
      {/* Compact Stage HUD */}
      <div className="stage-top-hud">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', justifyContent: 'space-between', inlineSize: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
            <span className="pill-badge pistachio">
              <span aria-hidden="true">●</span>
              <span>LIVE 3D</span>
            </span>
            <span className="pill-badge jade">
              {firingKenyonCells}/2,048 Synapses · {oscillationBand}
            </span>
          </div>
          <span className="pill-badge bronze">
            {voiceSpeaking
              ? `🔊 Speaking · ${activeLobeNames}`
              : isSpeaking
                ? `Active · ${activeLobeNames}`
                : '0% Forgetting'}
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas (5-Lobe Connectome + Persona Mask) */}
      <div
        className={`cbrain-webgl-viewport${compact ? ' compact' : ''}`}
        role="img"
        aria-label={`NOUSGENT 3D persona mask and 5-lobe connectome firing ${activeLobeNames}`}
      >
        <div ref={mountRef} className="cbrain-canvas-mount" />

        {!webglReady ? (
          <svg viewBox="0 0 500 440" width="100%" height="100%" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
            <ellipse cx="250" cy="235" rx="162" ry="132" fill="none" stroke="#2dd4bf" strokeWidth="2.2" strokeOpacity="0.6" />
            <circle cx="250" cy="236" r="108" fill="#23130d" fillOpacity={maskOpacityPct / 100} stroke="#c88a58" strokeWidth="3" />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
