import * as THREE from 'three';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';
export type BoardThemeType = 'forest' | 'royal' | 'obsidian' | 'wood' | 'default' | 'monochrome';

// Common turned foot profile points for standard fallback lathe
const footProfile: [number, number][] = [
  [0, 0],
  [0.36, 0],
  [0.37, 0.05],
  [0.33, 0.09],
  [0.28, 0.12],
  [0.23, 0.18],
  [0.19, 0.24],
];

/** Builds a lathe geometry from 2D profile points */
function lathe(points: [number, number][], segments = 32): THREE.BufferGeometry {
  const vectors = points.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(vectors, segments);
  geo.computeVertexNormals();
  return geo;
}

// Geometry cache for fallback getPieceGeometry
const fallbackGeoCache = new Map<string, THREE.BufferGeometry>();

export function getPieceGeometry(type: PieceType): THREE.BufferGeometry {
  const cached = fallbackGeoCache.get(type);
  if (cached) return cached;

  let geo: THREE.BufferGeometry;

  switch (type) {
    case 'p': {
      geo = lathe([
        ...footProfile,
        [0.17, 0.3],
        [0.14, 0.44],
        [0.16, 0.52],
        [0.13, 0.56],
        [0.16, 0.6],
        [0.17, 0.68],
        [0.14, 0.76],
        [0.08, 0.82],
        [0, 0.85],
      ]);
      break;
    }
    case 'r': {
      geo = lathe([
        ...footProfile,
        [0.24, 0.3],
        [0.23, 0.6],
        [0.27, 0.72],
        [0.28, 0.88],
        [0.18, 0.88],
        [0.18, 0.76],
        [0, 0.76],
      ]);
      break;
    }
    case 'n': {
      geo = lathe([
        ...footProfile,
        [0.24, 0.3],
        [0.26, 0.48],
        [0.24, 0.65],
        [0.28, 0.8],
        [0.24, 0.95],
        [0.12, 1.05],
        [0, 1.08],
      ]);
      break;
    }
    case 'b': {
      geo = lathe([
        ...footProfile,
        [0.2, 0.32],
        [0.17, 0.55],
        [0.22, 0.64],
        [0.18, 0.68],
        [0.22, 0.78],
        [0.2, 0.94],
        [0.1, 1.08],
        [0.05, 1.14],
        [0, 1.18],
      ]);
      break;
    }
    case 'q': {
      geo = lathe([
        ...footProfile,
        [0.23, 0.32],
        [0.19, 0.6],
        [0.25, 0.75],
        [0.23, 0.84],
        [0.3, 1.06],
        [0.24, 1.12],
        [0.14, 1.2],
        [0.07, 1.26],
        [0, 1.3],
      ]);
      break;
    }
    case 'k': {
      geo = lathe([
        ...footProfile,
        [0.25, 0.32],
        [0.21, 0.65],
        [0.27, 0.8],
        [0.25, 0.9],
        [0.31, 1.1],
        [0.27, 1.22],
        [0.16, 1.3],
        [0.1, 1.38],
        [0.05, 1.44],
        [0, 1.48],
      ]);
      break;
    }
  }

  fallbackGeoCache.set(type, geo);
  return geo;
}

export function createPieceMaterial(color: PieceColor, theme: BoardThemeType = 'default'): THREE.Material {
  if (color === 'w') {
    // Warm Natural Ivory Alabaster (Soft, comfortable, non-glaring)
    return new THREE.MeshStandardMaterial({
      color: 0xe4e2dc,
      metalness: 0.08,
      roughness: 0.35,
    });
  } else {
    // Deep Satin Obsidian Charcoal (Black)
    return new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.55,
      roughness: 0.35,
    });
  }
}

/** Accent Material for finials, cross, crowns, and eyes */
function createAccentMaterial(color: PieceColor): THREE.Material {
  if (color === 'w') {
    return new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.5,
      roughness: 0.25,
    });
  } else {
    return new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      metalness: 0.65,
      roughness: 0.25,
    });
  }
}

// Detailed Reusable Sub-Geometries Cache
const subGeoCache = new Map<string, THREE.BufferGeometry>();

function getCached<T extends THREE.BufferGeometry>(key: string, factory: () => T): T {
  let geo = subGeoCache.get(key);
  if (!geo) {
    geo = factory();
    geo.computeVertexNormals();
    subGeoCache.set(key, geo);
  }
  return geo as T;
}

/**
 * Creates an authentically detailed Staunton 3D Chess Piece.
 * Each piece has distinctive physical features (King cross, Queen coronet & pearl,
 * Bishop pointed mitre & finial, Knight sculpted horse head with ears & snout,
 * Rook castle battlements, Pawn spherical head).
 */
export function createPieceMesh(type: PieceType, color: PieceColor, theme: BoardThemeType = 'default'): THREE.Group {
  const group = new THREE.Group();
  const mat = createPieceMaterial(color, theme);
  const accentMat = createAccentMaterial(color);

  // Helper to add mesh to group
  const add = (geo: THREE.BufferGeometry, material: THREE.Material, pos: [number, number, number], rot?: [number, number, number], scale?: [number, number, number]) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  switch (type) {
    case 'p': {
      // --- PAWN ---
      // 1. Turned Base
      const baseGeo = getCached('pawn_base', () => lathe([
        [0, 0],
        [0.34, 0],
        [0.35, 0.05],
        [0.31, 0.09],
        [0.26, 0.12],
        [0.21, 0.17],
        [0.17, 0.22],
        [0.17, 0.26],
      ]));
      add(baseGeo, mat, [0, 0, 0]);

      // 2. Tapered Stem
      const stemGeo = getCached('pawn_stem', () => new THREE.CylinderGeometry(0.13, 0.17, 0.28, 24));
      add(stemGeo, mat, [0, 0.40, 0]);

      // 3. Collar Ring
      const collarGeo = getCached('pawn_collar', () => new THREE.TorusGeometry(0.15, 0.035, 12, 24));
      add(collarGeo, mat, [0, 0.54, 0], [Math.PI / 2, 0, 0]);

      // 4. Spherical Head
      const headGeo = getCached('pawn_head', () => new THREE.SphereGeometry(0.15, 24, 24));
      add(headGeo, mat, [0, 0.69, 0]);
      break;
    }

    case 'r': {
      // --- ROOK (CASTLE TOWER) ---
      // 1. Turned Base
      const baseGeo = getCached('rook_base', () => lathe([
        [0, 0],
        [0.38, 0],
        [0.39, 0.06],
        [0.34, 0.10],
        [0.29, 0.14],
        [0.24, 0.20],
        [0.22, 0.25],
      ]));
      add(baseGeo, mat, [0, 0, 0]);

      // 2. Tower Column
      const towerGeo = getCached('rook_tower', () => new THREE.CylinderGeometry(0.23, 0.26, 0.46, 24));
      add(towerGeo, mat, [0, 0.48, 0]);

      // 3. Capital Rim
      const rimGeo = getCached('rook_rim', () => new THREE.CylinderGeometry(0.29, 0.23, 0.08, 24));
      add(rimGeo, mat, [0, 0.74, 0]);

      // 4. Parapet Floor (Recessed)
      const floorGeo = getCached('rook_floor', () => new THREE.CylinderGeometry(0.21, 0.21, 0.05, 24));
      add(floorGeo, mat, [0, 0.77, 0]);

      // 5. Four Distinct Crenellations (Battlements with Open Embrasures)
      const merlonGeo = getCached('rook_merlon', () => new THREE.BoxGeometry(0.16, 0.16, 0.08));
      add(merlonGeo, mat, [0, 0.86, 0.21]); // Front (North)
      add(merlonGeo, mat, [0, 0.86, -0.21]); // Back (South)
      add(merlonGeo, mat, [0.21, 0.86, 0], [0, Math.PI / 2, 0]); // Right (East)
      add(merlonGeo, mat, [-0.21, 0.86, 0], [0, Math.PI / 2, 0]); // Left (West)
      break;
    }

    case 'n': {
      // --- KNIGHT (SCULPTED HORSE HEAD) ---
      // 1. Turned Base Pedestal
      const baseGeo = getCached('knight_base', () => lathe([
        [0, 0],
        [0.38, 0],
        [0.39, 0.06],
        [0.34, 0.10],
        [0.29, 0.14],
        [0.24, 0.20],
        [0.23, 0.26],
      ]));
      add(baseGeo, mat, [0, 0, 0]);

      // Base Collar Bead
      const collarGeo = getCached('knight_collar', () => new THREE.TorusGeometry(0.23, 0.035, 12, 24));
      add(collarGeo, mat, [0, 0.27, 0], [Math.PI / 2, 0, 0]);

      // 2. Arched Lower Neck (curved forward)
      const lowerNeckGeo = getCached('knight_lower_neck', () => new THREE.BoxGeometry(0.22, 0.32, 0.30));
      add(lowerNeckGeo, mat, [0, 0.42, 0.04], [-0.25, 0, 0]);

      // 3. Upper Head & Brow
      const browGeo = getCached('knight_brow', () => new THREE.BoxGeometry(0.21, 0.28, 0.28));
      add(browGeo, mat, [0, 0.72, 0.10], [-0.35, 0, 0]);

      // 4. Tapered Muzzle / Snout
      const snoutGeo = getCached('knight_snout', () => new THREE.CylinderGeometry(0.09, 0.14, 0.28, 16));
      add(snoutGeo, mat, [0, 0.65, 0.28], [1.1, 0, 0]);

      // Chin Bevel
      const chinGeo = getCached('knight_chin', () => new THREE.BoxGeometry(0.14, 0.10, 0.16));
      add(chinGeo, mat, [0, 0.54, 0.20], [-0.15, 0, 0]);

      // 5. Sculpted Arched Mane Crest along back spine
      const maneGeo = getCached('knight_mane', () => new THREE.BoxGeometry(0.07, 0.52, 0.12));
      add(maneGeo, mat, [0, 0.62, -0.12], [0.35, 0, 0]);

      // 6. Pointed Upright Horse Ears
      const earGeo = getCached('knight_ear', () => new THREE.ConeGeometry(0.045, 0.16, 6));
      add(earGeo, mat, [-0.075, 0.98, -0.01], [0.2, 0, -0.15]); // Left Ear
      add(earGeo, mat, [0.075, 0.98, -0.01], [0.2, 0, 0.15]); // Right Ear

      // 7. Distinct Eye Details (Left and Right)
      const eyeGeo = getCached('knight_eye', () => new THREE.SphereGeometry(0.035, 12, 12));
      add(eyeGeo, accentMat, [-0.105, 0.78, 0.15]);
      add(eyeGeo, accentMat, [0.105, 0.78, 0.15]);
      break;
    }

    case 'b': {
      // --- BISHOP (CLERICAL MITRE WITH SLIT & FINIAL) ---
      // 1. Turned Base
      const baseGeo = getCached('bishop_base', () => lathe([
        [0, 0],
        [0.37, 0],
        [0.38, 0.05],
        [0.33, 0.09],
        [0.28, 0.13],
        [0.23, 0.18],
        [0.19, 0.24],
      ]));
      add(baseGeo, mat, [0, 0, 0]);

      // 2. Slender Stem with Waist Ring
      const stemGeo = getCached('bishop_stem', () => new THREE.CylinderGeometry(0.15, 0.19, 0.38, 24));
      add(stemGeo, mat, [0, 0.42, 0]);

      const waistRingGeo = getCached('bishop_waist_ring', () => new THREE.TorusGeometry(0.17, 0.03, 12, 24));
      add(waistRingGeo, mat, [0, 0.44, 0], [Math.PI / 2, 0, 0]);

      // 3. Neck Collar
      const collarGeo = getCached('bishop_collar', () => new THREE.CylinderGeometry(0.23, 0.16, 0.08, 24));
      add(collarGeo, mat, [0, 0.63, 0]);

      // 4. Oval / Teardrop Mitre Dome Head
      const mitreGeo = getCached('bishop_mitre', () => new THREE.SphereGeometry(0.20, 24, 24));
      add(mitreGeo, mat, [0, 0.88, 0], [0, 0, 0], [0.88, 1.42, 0.88]);

      // 5. Diagonal Mitre Slit Cut (Iconic Staunton Cutout)
      const slitGeo = getCached('bishop_slit', () => new THREE.BoxGeometry(0.045, 0.18, 0.26));
      add(slitGeo, accentMat, [0.08, 0.94, 0], [0, 0, 0.65]);

      // 6. Mitre Peak Ball Finial
      const finialGeo = getCached('bishop_finial', () => new THREE.SphereGeometry(0.055, 16, 16));
      add(finialGeo, accentMat, [0, 1.17, 0]);
      break;
    }

    case 'q': {
      // --- QUEEN (REGAL CORONET & PEARL) ---
      // 1. Broad Turned Base
      const baseGeo = getCached('queen_base', () => lathe([
        [0, 0],
        [0.39, 0],
        [0.40, 0.06],
        [0.35, 0.10],
        [0.30, 0.14],
        [0.25, 0.20],
        [0.20, 0.26],
      ]));
      add(baseGeo, mat, [0, 0, 0]);

      // 2. Elegant Slender Stem & Waist
      const stemGeo = getCached('queen_stem', () => new THREE.CylinderGeometry(0.16, 0.20, 0.44, 24));
      add(stemGeo, mat, [0, 0.48, 0]);

      const waistRingGeo = getCached('queen_waist_ring', () => new THREE.TorusGeometry(0.18, 0.035, 12, 24));
      add(waistRingGeo, mat, [0, 0.50, 0], [Math.PI / 2, 0, 0]);

      // 3. Collar Ring
      const collarGeo = getCached('queen_collar', () => new THREE.CylinderGeometry(0.25, 0.17, 0.08, 24));
      add(collarGeo, mat, [0, 0.72, 0]);

      // 4. Flaring Coronet Chalice
      const coronetGeo = getCached('queen_coronet', () => new THREE.CylinderGeometry(0.31, 0.20, 0.32, 24, 1, true));
      add(coronetGeo, mat, [0, 0.92, 0]);

      // Coronet Inner Cap
      const innerCapGeo = getCached('queen_inner_cap', () => new THREE.SphereGeometry(0.21, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2));
      add(innerCapGeo, mat, [0, 0.88, 0]);

      // 5. Eight Coronet Radial Peaks / Points around rim
      const peakGeo = getCached('queen_peak', () => new THREE.SphereGeometry(0.038, 12, 12));
      const peakRadius = 0.305;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const px = Math.cos(angle) * peakRadius;
        const pz = Math.sin(angle) * peakRadius;
        add(peakGeo, accentMat, [px, 1.09, pz]);
      }

      // 6. Central Royal Pearl Finial
      const pearlGeo = getCached('queen_pearl', () => new THREE.SphereGeometry(0.075, 20, 20));
      add(pearlGeo, accentMat, [0, 1.18, 0]);
      break;
    }

    case 'k': {
      // --- KING (TALLEST, REGAL CROWN WITH MALTESE CROSS) ---
      // 1. Broad Heavy Weighted Base
      const baseGeo = getCached('king_base', () => lathe([
        [0, 0],
        [0.42, 0],
        [0.43, 0.07],
        [0.38, 0.11],
        [0.32, 0.16],
        [0.26, 0.22],
        [0.22, 0.28],
      ]));
      add(baseGeo, mat, [0, 0, 0]);

      // 2. Imperial Body Column
      const stemGeo = getCached('king_stem', () => new THREE.CylinderGeometry(0.18, 0.22, 0.50, 24));
      add(stemGeo, mat, [0, 0.53, 0]);

      const waistRingGeo = getCached('king_waist_ring', () => new THREE.TorusGeometry(0.20, 0.04, 12, 24));
      add(waistRingGeo, mat, [0, 0.56, 0], [Math.PI / 2, 0, 0]);

      // 3. Lower Crown Collar
      const collarGeo = getCached('king_collar', () => new THREE.CylinderGeometry(0.28, 0.19, 0.10, 24));
      add(collarGeo, mat, [0, 0.81, 0]);

      // 4. Imperial Domed Crown Cap
      const crownDomeGeo = getCached('king_crown_dome', () => new THREE.SphereGeometry(0.27, 24, 24));
      add(crownDomeGeo, mat, [0, 0.98, 0], [0, 0, 0], [0.95, 0.85, 0.95]);

      // Upper Crown Gallery Collar
      const upperCollarGeo = getCached('king_upper_collar', () => new THREE.CylinderGeometry(0.22, 0.26, 0.08, 24));
      add(upperCollarGeo, mat, [0, 1.18, 0]);

      // 5. The Royal Maltese Cross Finial (Unmistakable King Crest)
      // Vertical Cross Arm
      const crossVertGeo = getCached('king_cross_v', () => new THREE.BoxGeometry(0.065, 0.22, 0.05));
      add(crossVertGeo, accentMat, [0, 1.33, 0]);

      // Horizontal Cross Arm
      const crossHorizGeo = getCached('king_cross_h', () => new THREE.BoxGeometry(0.19, 0.065, 0.05));
      add(crossHorizGeo, accentMat, [0, 1.37, 0]);

      // Center Diamond Boss
      const bossGeo = getCached('king_cross_boss', () => new THREE.OctahedronGeometry(0.045));
      add(bossGeo, accentMat, [0, 1.37, 0]);
      break;
    }
  }

  return group;
}
