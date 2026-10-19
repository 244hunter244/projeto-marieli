import { SimplexNoise } from './noise.js';
import { blockMaterialsHD, blockMaterialsSD, solidMaterials } from './textures.js';

export const CHUNK_SIZE = 16;
export const WATER_LEVEL = 14;

const simplex = new SimplexNoise();
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

export class Chunk {
  constructor(cx, cz, scene) {
    this.cx = cx;
    this.cz = cz;
    this.scene = scene;
    this.blocksData = new Map();
    this.instancedMeshes = [];
    this.lodState = -1;

    this.generateTerrainData();
  }

  generateTerrainData() {
    const treePositions = [];
    const kelpPositions = [];

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = this.cx * CHUNK_SIZE + x;
        const worldZ = this.cz * CHUNK_SIZE + z;

        const baseNoise = simplex.noise2D(worldX * 0.015, worldZ * 0.015);
        const riverNoise = Math.abs(simplex.noise2D(worldX * 0.03 + 50, worldZ * 0.03 + 50));
        
        let height = Math.floor(18 + baseNoise * 12);
        if (riverNoise < 0.15) {
          height -= Math.floor((0.15 - riverNoise) * 25);
        }

        const isUnderWater = height < WATER_LEVEL;

        for (let y = 0; y <= height; y++) {
          let type = 'dirt';
          if (y === height) {
            type = isUnderWater ? 'sand' : 'grass';
          } else if (y < height - 3) {
            type = 'stone';
          }

          this.blocksData.set(`${worldX},${y},${worldZ}`, type);
        }

        // Superfície da água
        if (isUnderWater) {
          this.blocksData.set(`${worldX},${WATER_LEVEL},${worldZ}`, 'water');

          // Chance de nascer algas marinhas no fundo do rio
          const kelpNoise = simplex.noise2D(worldX * 0.2, worldZ * 0.2);
          if (kelpNoise > 0.4 && WATER_LEVEL - height >= 3) {
            kelpPositions.push({ x: worldX, minY: height + 1, maxY: WATER_LEVEL - 1 });
          }
        }

        if (height > WATER_LEVEL + 1 && (x > 2 && x < CHUNK_SIZE - 2 && z > 2 && z < CHUNK_SIZE - 2)) {
          const treeChance = simplex.noise2D(worldX * 0.5, worldZ * 0.5);
          if (treeChance > 0.75) {
            treePositions.push({ x: worldX, y: height + 1, z: worldZ });
          }
        }
      }
    }

    // Gerar Algas (Kelp)
    for (const kelp of kelpPositions) {
      const kelpHeight = Math.floor(1 + Math.random() * (kelp.maxY - kelp.minY));
      for (let y = 0; y < kelpHeight; y++) {
        this.blocksData.set(`${kelp.x},${kelp.minY + y},${kelp.z}`, 'kelp');
      }
    }

    // Gerar Árvores
    for (const tree of treePositions) {
      const trunkHeight = 4 + Math.floor(Math.random() * 2);
      for (let y = 0; y < trunkHeight; y++) {
        this.blocksData.set(`${tree.x},${tree.y + y},${tree.z}`, 'log');
      }

      const topY = tree.y + trunkHeight - 1;
      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -2; lz <= 2; lz++) {
          for (let ly = 0; ly <= 2; ly++) {
            if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 2) continue;
            const fx = tree.x + lx;
            const fy = topY + ly;
            const fz = tree.z + lz;
            if (!this.blocksData.has(`${fx},${fy},${fz}`)) {
              this.blocksData.set(`${fx},${fy},${fz}`, 'leaves');
            }
          }
        }
      }
    }
  }

  setLODMode(lodLevel) {
    if (this.lodState === lodLevel && this.instancedMeshes.length > 0) return;
    this.lodState = lodLevel;
    this.buildMesh();
  }

  buildMesh() {
    this.clearMesh();

    const blocksByType = { grass: [], dirt: [], stone: [], sand: [], kelp: [], log: [], leaves: [], water: [] };

    for (const [key, type] of this.blocksData.entries()) {
      const [x, y, z] = key.split(',').map(Number);
      if (blocksByType[type]) {
        blocksByType[type].push({ x, y, z });
      }
    }

    let matSet = blockMaterialsHD;
    if (this.lodState === 1) matSet = blockMaterialsSD;
    else if (this.lodState === 2) matSet = solidMaterials;

    const dummy = new THREE.Object3D();
    const typesOrder = ['dirt', 'stone', 'sand', 'grass', 'kelp', 'log', 'leaves', 'water'];

    for (const type of typesOrder) {
      const list = blocksByType[type];
      if (!list || list.length === 0) continue;

      const mat = matSet[type];
      if (!mat) continue;

      const imesh = new THREE.InstancedMesh(boxGeometry, mat, list.length);
      imesh.castShadow = (this.lodState === 0) && (type !== 'water');
      imesh.receiveShadow = (this.lodState === 0);

      if (type === 'water') {
        imesh.renderOrder = 2;
      }

      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        dummy.position.set(b.x, b.y, b.z);
        dummy.updateMatrix();
        imesh.setMatrixAt(i, dummy.matrix);
      }

      imesh.instanceMatrix.needsUpdate = true;
      this.scene.add(imesh);
      this.instancedMeshes.push(imesh);
    }
  }

  clearMesh() {
    for (const mesh of this.instancedMeshes) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
    }
    this.instancedMeshes = [];
  }

  dispose() {
    this.clearMesh();
    this.blocksData.clear();
  }
}