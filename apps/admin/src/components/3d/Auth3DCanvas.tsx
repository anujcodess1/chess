import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createPieceMesh } from './pieces3d';

export const Auth3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050507, 0.08);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.6, 4.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Balanced Lighting (Soft natural shading)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(4, 7, 4);
    scene.add(keyLight);

    // Soft Rim Light
    const silverRim = new THREE.PointLight(0xd4d4d8, 1.2, 12);
    silverRim.position.set(-4, 3, -2);
    scene.add(silverRim);

    // Subtle Fill Light
    const fillLight = new THREE.PointLight(0x71717a, 1.0, 10);
    fillLight.position.set(3, -1, 2);
    scene.add(fillLight);

    // Center Stage Group
    const stage = new THREE.Group();
    scene.add(stage);

    // Pedestal Platform (Deep Obsidian)
    const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.35, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x141418,
      metalness: 0.5,
      roughness: 0.35,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.55;
    stage.add(pedestal);

    // Brushed Silver Ring
    const ringGeo = new THREE.TorusGeometry(2.35, 0.035, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x27272a,
      emissiveIntensity: 0.1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.37;
    stage.add(ring);

    // 3D Pieces: Pristine Alabaster King (center), Satin Platinum Queen (left), Onyx Obsidian Knight (right)
    const kingMesh = createPieceMesh('k', 'w', 'default');
    kingMesh.position.set(0, -0.35, 0.2);
    kingMesh.scale.setScalar(1.25);
    stage.add(kingMesh);

    const queenMesh = createPieceMesh('q', 'w', 'default');
    queenMesh.position.set(-1.05, -0.35, -0.2);
    queenMesh.scale.setScalar(1.15);
    queenMesh.rotation.y = 0.3;
    stage.add(queenMesh);

    const knightMesh = createPieceMesh('n', 'b', 'default');
    knightMesh.position.set(1.05, -0.35, -0.2);
    knightMesh.scale.setScalar(1.15);
    knightMesh.rotation.y = -0.4;
    stage.add(knightMesh);

    // Floating Stardust Particles (Silver & White)
    const particleCount = 90;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8;
      positions[i + 1] = Math.random() * 4 - 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 8;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    scene.add(particles);

    // Mouse Tracking Parallax
    let targetRotY = 0;
    let targetRotX = 0;
    let currentRotY = 0;
    let currentRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotY = x * 0.45;
      targetRotX = y * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse interpolation
      currentRotY += (targetRotY - currentRotY) * 0.05;
      currentRotX += (targetRotX - currentRotX) * 0.05;

      stage.rotation.y = currentRotY + Math.sin(elapsed * 0.5) * 0.08;
      stage.rotation.x = currentRotX * 0.4;

      // Subtle float on pieces
      kingMesh.position.y = -0.35 + Math.sin(elapsed * 1.5) * 0.03;
      queenMesh.position.y = -0.35 + Math.cos(elapsed * 1.3) * 0.025;
      knightMesh.position.y = -0.35 + Math.sin(elapsed * 1.4 + 1) * 0.025;

      // Rotate particle dust
      particles.rotation.y = elapsed * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
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
