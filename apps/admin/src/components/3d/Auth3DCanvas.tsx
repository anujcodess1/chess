import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createPieceMesh } from './pieces3d';

export const Auth3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050507, 0.055);

    const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.45, 4.6);
    camera.lookAt(0, 0.15, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // Studio environment map — gives alabaster/onyx pieces real soft reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    // Balanced Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    // Key Light — crisp top-front
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 8, 5);
    scene.add(keyLight);

    // Silver rim light from behind left
    const silverRim = new THREE.PointLight(0xe4e4e7, 2.4, 14);
    silverRim.position.set(-4.5, 3.2, -2.5);
    scene.add(silverRim);

    // Back rim light from behind right
    const backRim = new THREE.PointLight(0xa1a1aa, 1.6, 14);
    backRim.position.set(4.5, 2.4, -3.5);
    scene.add(backRim);

    // Subtle warm-neutral fill
    const fillLight = new THREE.PointLight(0x71717a, 0.8, 10);
    fillLight.position.set(3, -1, 2.5);
    scene.add(fillLight);

    // Center Stage Group
    const stage = new THREE.Group();
    scene.add(stage);

    // Polished Obsidian Floor — catches reflections of the pieces
    const floorGeo = new THREE.CircleGeometry(9, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0c,
      metalness: 0.85,
      roughness: 0.42,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.95;
    scene.add(floor);

    // Pedestal Platform (Deep Obsidian)
    const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.7, 0.35, 64);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x141418,
      metalness: 0.75,
      roughness: 0.22,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.55;
    stage.add(pedestal);

    // Double Brushed Silver Rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x3f3f46,
      emissiveIntensity: 0.15,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.035, 16, 96), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.37;
    stage.add(ring);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.018, 12, 96), ringMat);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = -0.9;
    scene.add(outerRing);

    // Piece helper — places a piece on the pedestal top
    const addPiece = (
      type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p',
      color: 'w' | 'b',
      x: number,
      z: number,
      scale: number,
      rotY: number
    ) => {
      const mesh = createPieceMesh(type, color, 'default');
      mesh.position.set(x, -0.35, z);
      mesh.scale.setScalar(scale);
      mesh.rotation.y = rotY;
      stage.add(mesh);
      return mesh;
    };

    // Hero trio + supporting cast around the stage
    const kingMesh = addPiece('k', 'w', 0, 0.25, 1.3, 0);
    const queenMesh = addPiece('q', 'b', -1.15, -0.15, 1.18, 0.45);
    const knightMesh = addPiece('n', 'w', 1.15, -0.15, 1.18, -0.55);
    const rookL = addPiece('r', 'b', -1.85, 0.55, 0.85, 0.9);
    const rookR = addPiece('r', 'w', 1.85, 0.55, 0.85, -0.9);
    const bishopMesh = addPiece('b', 'b', 0.55, 1.15, 0.8, -2.4);
    const pawnL = addPiece('p', 'w', -0.55, 1.2, 0.7, 2.2);
    const pawnR = addPiece('p', 'b', 1.5, -0.95, 0.7, -1.6);

    const floaters = [
      { mesh: kingMesh, speed: 1.5, amp: 0.03, phase: 0 },
      { mesh: queenMesh, speed: 1.3, amp: 0.025, phase: 2.1 },
      { mesh: knightMesh, speed: 1.4, amp: 0.025, phase: 1.0 },
      { mesh: rookL, speed: 1.2, amp: 0.02, phase: 3.2 },
      { mesh: rookR, speed: 1.25, amp: 0.02, phase: 0.6 },
      { mesh: bishopMesh, speed: 1.45, amp: 0.022, phase: 2.7 },
      { mesh: pawnL, speed: 1.35, amp: 0.024, phase: 1.6 },
      { mesh: pawnR, speed: 1.55, amp: 0.02, phase: 3.9 },
    ];

    // Drifting Stardust — two layers with depth attenuation
    const makeDust = (count: number, size: number, spread: number, height: number, opacity: number) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * spread;
        positions[i + 1] = Math.random() * height - 0.6;
        positions[i + 2] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffffff,
        size,
        transparent: true,
        opacity,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Points(geo, mat);
    };

    const dustNear = makeDust(120, 0.035, 9, 4.2, 0.8);
    const dustFar = makeDust(160, 0.018, 16, 6, 0.45);
    scene.add(dustNear, dustFar);

    // Mouse / touch Parallax
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotY = x * 0.5;
      targetRotX = y * 0.22;
    };

    window.addEventListener('pointermove', handlePointerMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth pointer interpolation + slow ambient orbit
      currentRotY += (targetRotY - currentRotY) * 0.045;
      currentRotX += (targetRotX - currentRotX) * 0.045;

      stage.rotation.y = currentRotY + elapsed * 0.06;
      stage.rotation.x = currentRotX * 0.35;

      // Independent float + idle spin per piece
      for (const f of floaters) {
        f.mesh.position.y = -0.35 + Math.sin(elapsed * f.speed + f.phase) * f.amp;
      }
      ring.rotation.z = elapsed * 0.12;
      outerRing.rotation.z = -elapsed * 0.08;

      // Counter-rotating dust layers for depth
      dustNear.rotation.y = elapsed * 0.035;
      dustFar.rotation.y = -elapsed * 0.018;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      envTexture.dispose();
      pmrem.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose();
        }
      });
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};
