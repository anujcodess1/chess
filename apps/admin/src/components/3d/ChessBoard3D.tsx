import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { createPieceMesh, PieceType, PieceColor, BoardThemeType } from './pieces3d';
import { Lock, Unlock, RotateCcw } from 'lucide-react';

interface ChessBoard3DProps {
  fen: string;
  selectedSquare: string | null;
  legalMoves: string[];
  checkSquare: string | null;
  lastMove: { from: string; to: string } | null;
  playerColor?: 'white' | 'black';
  theme?: BoardThemeType;
  onSquareClick: (square: string) => void;
}

export const ChessBoard3D: React.FC<ChessBoard3DProps> = ({
  fen,
  selectedSquare,
  legalMoves,
  checkSquare,
  lastMove,
  playerColor = 'white',
  theme = 'default',
  onSquareClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const piecesGroupRef = useRef<THREE.Group | null>(null);
  const highlightsGroupRef = useRef<THREE.Group | null>(null);
  const boardGroupRef = useRef<THREE.Group | null>(null);

  // Fixed Board State (Defaults to TRUE: Rock-solid fixed tournament angle)
  const [isFixed, setIsFixed] = useState(true);
  const isFixedRef = useRef(isFixed);
  useEffect(() => {
    isFixedRef.current = isFixed;
  }, [isFixed]);

  // Use refs for callback to NEVER trigger scene re-creation on click
  const onSquareClickRef = useRef(onSquareClick);
  useEffect(() => {
    onSquareClickRef.current = onSquareClick;
  }, [onSquareClick]);

  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Comfortable overview angle: whole board with margin around it, slightly elevated
  const defaultAngle = useCallback(
    () => ({
      theta: playerColor === 'black' ? Math.PI : 0,
      phi: 0.68,
      radius: 12.4,
    }),
    [playerColor]
  );

  const cameraAngleRef = useRef(defaultAngle());

  // Convert algebraic square e.g. "e4" to 3D board coordinates (-3.5 to 3.5)
  const squareToCoord = useCallback((sq: string): { x: number; z: number } => {
    const fileChar = sq[0] ?? 'a';
    const rankChar = sq[1] ?? '1';
    const file = fileChar.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(rankChar, 10) - 1;
    return {
      x: file - 3.5,
      z: -(rank - 3.5),
    };
  }, []);

  // Update camera position helper
  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Reset to default fixed angle
  const handleResetCamera = useCallback(() => {
    cameraAngleRef.current = defaultAngle();
    updateCameraPosition();
  }, [defaultAngle, updateCameraPosition]);

  // Initialize Three.js Scene ONCE on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean previous children if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Balanced Studio Lighting (Natural, pleasant, no harsh glare)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(6, 14, 6);
    scene.add(keyLight);

    const silverRim = new THREE.DirectionalLight(0xd4d4d8, 0.75);
    silverRim.position.set(-8, 8, -8);
    scene.add(silverRim);

    // Board Group
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);
    boardGroupRef.current = boardGroup;

    // Board Base Frame (Deep Obsidian)
    const baseGeo = new THREE.BoxGeometry(9.4, 0.5, 9.4);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141418,
      metalness: 0.4,
      roughness: 0.4,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.26;
    boardGroup.add(baseMesh);

    // Brushed Titanium Border Inlay
    const borderGeo = new THREE.BoxGeometry(8.5, 0.08, 8.5);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      metalness: 0.6,
      roughness: 0.35,
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.y = -0.04;
    boardGroup.add(borderMesh);

    // 64 Chess Squares (Comfortable Soft Alabaster & Deep Graphite Charcoal)
    const squareGeo = new THREE.BoxGeometry(0.98, 0.06, 0.98);
    const lightSquareMat = new THREE.MeshStandardMaterial({
      color: 0xcfd3d8, // Soft, non-glaring natural alabaster
      metalness: 0.05,
      roughness: 0.45,
    });
    const darkSquareMat = new THREE.MeshStandardMaterial({
      color: 0x24252a, // Deep natural charcoal
      metalness: 0.08,
      roughness: 0.5,
    });

    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const isLight = (f + r) % 2 !== 0;
        const squareMesh = new THREE.Mesh(squareGeo, isLight ? lightSquareMat : darkSquareMat);
        squareMesh.position.set(f - 3.5, 0, -(r - 3.5));
        squareMesh.userData = { square: `${String.fromCharCode('a'.charCodeAt(0) + f)}${r + 1}`, isSquare: true };
        boardGroup.add(squareMesh);
      }
    }

    // Pieces Group & Highlights Group
    const piecesGroup = new THREE.Group();
    scene.add(piecesGroup);
    piecesGroupRef.current = piecesGroup;

    const highlightsGroup = new THREE.Group();
    scene.add(highlightsGroup);
    highlightsGroupRef.current = highlightsGroup;

    updateCameraPosition();

    let startX = 0;
    let startY = 0;

    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      // Only enable orbit dragging if board is UNLOCKED
      if (!isFixedRef.current) {
        isDraggingRef.current = true;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || isFixedRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta += deltaX * 0.007;
      cameraAngleRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.1, cameraAngleRef.current.phi + deltaY * 0.007));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

      // Trigger click if it was a deliberate press/tap (dist < 18px)
      if (dist < 18) {
        handleClick(e);
      }
    };

    const onWheel = (e: WheelEvent) => {
      // Zoom allowed even in fixed mode for player convenience
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(7, Math.min(17, cameraAngleRef.current.radius + e.deltaY * 0.008));
      updateCameraPosition();
    };

    // Central Click Raycaster: Prioritizes legal move dots, pieces, and squares
    const handleClick = (e: MouseEvent | PointerEvent) => {
      if (!container || !cameraRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // 1. Check highlightsGroup FIRST (clicking directly on a legal move dot or capture ring)
      if (highlightsGroupRef.current) {
        const hHits = raycaster.intersectObjects(highlightsGroupRef.current.children, true);
        for (const hit of hHits) {
          if (hit.object.userData?.square) {
            onSquareClickRef.current(hit.object.userData.square as string);
            return;
          }
        }
      }

      // 2. Check piece clicks next!
      if (piecesGroupRef.current) {
        const pieceIntersects = raycaster.intersectObjects(piecesGroupRef.current.children, true);
        for (const hit of pieceIntersects) {
          let cur: THREE.Object3D | null = hit.object;
          while (cur && cur !== piecesGroupRef.current) {
            if (cur.userData?.square) {
              onSquareClickRef.current(cur.userData.square as string);
              return;
            }
            cur = cur.parent;
          }
        }
      }

      // 3. Check board square clicks
      if (boardGroupRef.current) {
        const boardIntersects = raycaster.intersectObjects(boardGroupRef.current.children);
        for (const hit of boardIntersects) {
          const sq = hit.object.userData?.square as string | undefined;
          if (sq) {
            onSquareClickRef.current(sq);
            return;
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Handle Resize
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [updateCameraPosition]);

  // Re-orient camera if playerColor changes
  useEffect(() => {
    cameraAngleRef.current = defaultAngle();
    updateCameraPosition();
  }, [playerColor, defaultAngle, updateCameraPosition]);

  // Redraw Pieces whenever FEN changes
  useEffect(() => {
    const piecesGroup = piecesGroupRef.current;
    if (!piecesGroup) return;

    // Clear old pieces safely
    while (piecesGroup.children.length > 0) {
      const child = piecesGroup.children[0];
      if (child) piecesGroup.remove(child);
      else break;
    }

    // Parse FEN string
    const boardPart = fen.split(' ')[0] ?? '';
    const ranks = boardPart.split('/');

    ranks.forEach((rankStr, rankIndex) => {
      const rank = 8 - rankIndex; // 8 down to 1
      let fileIndex = 0;

      for (let i = 0; i < rankStr.length; i++) {
        const char = rankStr[i] ?? '';
        if (!char) continue;
        if (/\d/.test(char)) {
          fileIndex += parseInt(char, 10);
        } else {
          const file = String.fromCharCode('a'.charCodeAt(0) + fileIndex);
          const square = `${file}${rank}`;
          const isWhite = char === char.toUpperCase();
          const pColor: PieceColor = isWhite ? 'w' : 'b';
          const pType: PieceType = char.toLowerCase() as PieceType;

          const pieceMesh = createPieceMesh(pType, pColor, theme);

          const { x, z } = squareToCoord(square);
          pieceMesh.position.set(x, 0.03, z);
          pieceMesh.scale.setScalar(0.92);
          pieceMesh.userData = { square, piece: char };

          // Face knights directly toward the opponent
          if (pType === 'n') {
            pieceMesh.rotation.y = isWhite ? Math.PI : 0;
          }

          piecesGroup.add(pieceMesh);
          fileIndex++;
        }
      }
    });
  }, [fen, theme, squareToCoord]);

  // Update Highlights: Selected piece, legal move dots, and capture rings
  useEffect(() => {
    const highlightsGroup = highlightsGroupRef.current;
    const piecesGroup = piecesGroupRef.current;
    if (!highlightsGroup) return;

    // Clear previous highlights
    while (highlightsGroup.children.length > 0) {
      const child = highlightsGroup.children[0];
      if (child) highlightsGroup.remove(child);
      else break;
    }

    // Lift selected piece and highlight its origin square
    if (piecesGroup) {
      piecesGroup.children.forEach((p) => {
        if (p.userData?.square === selectedSquare) {
          p.position.y = 0.20; // Lift selected piece physically
        } else {
          p.position.y = 0.03; // Ground unselected pieces
        }
      });
    }

    // 1. Selected Square Indicator (Luminous Ground Pad with Accent Ring)
    if (selectedSquare) {
      const { x, z } = squareToCoord(selectedSquare);
      // Base pad
      const selGeo = new THREE.PlaneGeometry(0.96, 0.96);
      const selMat = new THREE.MeshBasicMaterial({
        color: 0xd4d4d8,
        transparent: true,
        opacity: 0.35,
      });
      const selMesh = new THREE.Mesh(selGeo, selMat);
      selMesh.rotation.x = -Math.PI / 2;
      selMesh.position.set(x, 0.045, z);
      highlightsGroup.add(selMesh);

      // Contrast border ring
      const ringGeo = new THREE.RingGeometry(0.44, 0.48, 4);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x09090b,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.rotation.z = Math.PI / 4;
      ringMesh.position.set(x, 0.048, z);
      highlightsGroup.add(ringMesh);
    }

    // Helper: Check if a square has a piece
    const hasPiece = (sq: string) => {
      if (!piecesGroup) return false;
      return piecesGroup.children.some((c) => c.userData?.square === sq);
    };

    // 2. Legal Move Target Route Indicators:
    // - Empty squares get a high-contrast dual-layer beacon dot
    // - Occupied squares (captures) get an unmistakable capture target halo ring around the enemy piece
    legalMoves.forEach((moveSq) => {
      const { x, z } = squareToCoord(moveSq);
      const isCapture = hasPiece(moveSq);

      if (isCapture) {
        // CAPTURE TARGET RING (encircles the enemy piece base)
        const outerCaptureGeo = new THREE.RingGeometry(0.35, 0.45, 32);
        const outerCaptureMat = new THREE.MeshBasicMaterial({
          color: 0xe4e4e7,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const captureMesh = new THREE.Mesh(outerCaptureGeo, outerCaptureMat);
        captureMesh.rotation.x = -Math.PI / 2;
        captureMesh.position.set(x, 0.065, z);
        captureMesh.userData = { square: moveSq, isMoveTarget: true };
        highlightsGroup.add(captureMesh);

        // Accent outer border
        const accentGeo = new THREE.RingGeometry(0.45, 0.48, 32);
        const accentMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const accentMesh = new THREE.Mesh(accentGeo, accentMat);
        accentMesh.rotation.x = -Math.PI / 2;
        accentMesh.position.set(x, 0.066, z);
        accentMesh.userData = { square: moveSq, isMoveTarget: true };
        highlightsGroup.add(accentMesh);
      } else {
        // EMPTY SQUARE BEACON DOT (High-contrast dual-layer: Dark base disc + soft satin core)
        const darkBaseGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.015, 24);
        const darkBaseMat = new THREE.MeshBasicMaterial({
          color: 0x09090b,
          transparent: true,
          opacity: 0.75,
        });
        const darkBaseMesh = new THREE.Mesh(darkBaseGeo, darkBaseMat);
        darkBaseMesh.position.set(x, 0.052, z);
        darkBaseMesh.userData = { square: moveSq, isMoveTarget: true };
        highlightsGroup.add(darkBaseMesh);

        // Soft satin beacon core
        const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.022, 24);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0xd4d4d8,
          transparent: true,
          opacity: 0.9,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.set(x, 0.058, z);
        coreMesh.userData = { square: moveSq, isMoveTarget: true };
        highlightsGroup.add(coreMesh);
      }
    });

    // 3. Check Aura on King (Crimson Glow)
    if (checkSquare) {
      const { x, z } = squareToCoord(checkSquare);
      const checkGeo = new THREE.PlaneGeometry(0.96, 0.96);
      const checkMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.65,
      });
      const checkMesh = new THREE.Mesh(checkGeo, checkMat);
      checkMesh.rotation.x = -Math.PI / 2;
      checkMesh.position.set(x, 0.046, z);
      highlightsGroup.add(checkMesh);
    }

    // 4. Last Move Highlights (Sleek Frosted White)
    if (lastMove) {
      [lastMove.from, lastMove.to].forEach((sq) => {
        const { x, z } = squareToCoord(sq);
        const lmGeo = new THREE.PlaneGeometry(0.96, 0.96);
        const lmMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.22,
        });
        const lmMesh = new THREE.Mesh(lmGeo, lmMat);
        lmMesh.rotation.x = -Math.PI / 2;
        lmMesh.position.set(x, 0.044, z);
        highlightsGroup.add(lmMesh);
      });
    }
  }, [selectedSquare, legalMoves, checkSquare, lastMove, squareToCoord]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '560px' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '560px',
          cursor: isFixed ? 'pointer' : isDraggingRef.current ? 'grabbing' : 'grab',
          borderRadius: '24px',
          overflow: 'hidden',
        }}
      />

      {/* Camera Control HUD (Fixed vs Free Toggle) */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(9, 9, 11, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '6px 12px',
          borderRadius: '12px',
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (!isFixed) {
              handleResetCamera();
            }
            setIsFixed(!isFixed);
          }}
          title={isFixed ? 'Board locked in tournament view. Click to free rotate.' : 'Click to lock board.'}
          style={{
            background: 'none',
            border: 'none',
            color: isFixed ? '#ffffff' : '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 6px',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {isFixed ? <Lock size={14} color="#ffffff" /> : <Unlock size={14} color="#a1a1aa" />}
          <span>{isFixed ? 'Board Fixed' : 'Free Camera'}</span>
        </button>

        {!isFixed && (
          <button
            type="button"
            onClick={handleResetCamera}
            title="Reset to tournament view"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
