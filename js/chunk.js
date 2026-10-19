import { SimplexNoise } from './noise.js';
import { blockMaterials, solidMaterials } from './textures.js';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 64;

const simplex = new SimplexNoise();
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

export class Chunk {
  constructor(cx, cz, scene) {
    this.cx = cx;
    this.cz = cz;
    this.scene = scene;
    this.blocksData = new Map();
    this.instancedMeshes = [];
    this.hasTexture = true;

    this.generateTerrainData();
  }

  generateTerrainData() {
    try {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          const worldX = this.cx * CHUNK_SIZE + x;
          const worldZ = this.cz * CHUNK_SIZE + z;

          const n = simplex.noise2D(worldX * 0.015, worldZ * 0.015);
          const height = Math.floor(25 + n * 12);

          for (let y = 0; y <= height; y++) {
            let type = 'dirt';
            if (y === height) type = 'grass';
            else if (y < height - 3) type = 'stone';

            this.blocksData.set(`${worldX},${y},${worldZ}`, type);
          }
        }
      }
    } catch (e) {
      if (window.logGameError) window.logGameError(`chunk.js -> generateTerrainData [${this.cx},${this.cz}]`, e);
    }
  }

  setLODMode(useTexture) {
    try {
      if (this.hasTexture === useTexture && this.instancedMeshes.length > 0) return;
      this.hasTexture = useTexture;
      this.buildMesh();
    } catch (e) {
      if (window.logGameError) window.logGameError(`chunk.js -> setLODMode [${this.cx},${this.cz}]`, e);
    }
  }

  buildMesh() {
    try {
      this.clearMesh();

      const blocksByType = { grass: [], dirt: [], stone: [] };

      for (const [key, type] of this.blocksData.entries()) {
        const [x, y, z] = key.split(',').map(Number);
        if (blocksByType[type]) {
          blocksByType[type].push({ x, y, z });
        }
      }

      const matSet = this.hasTexture ? blockMaterials : solidMaterials;
      const dummy = new THREE.Object3D();

      for (const type in blocksByType) {
        const list = blocksByType[type];
        if (list.length === 0) continue;

        const mat = matSet[type];
        if (!mat) continue;

        const imesh = new THREE.InstancedMesh(boxGeometry, mat, list.length);
        imesh.castShadow = this.hasTexture;
        imesh.receiveShadow = this.hasTexture;

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
    } catch (e) {
      if (window.logGameError) window.logGameError(`chunk.js -> buildMesh [${this.cx},${this.cz}]`, e);
    }
  }

  clearMesh() {
    try {
      for (const mesh of this.instancedMeshes) {
        this.scene.remove(mesh);
        if (mesh.dispose) mesh.dispose();
      }
      this.instancedMeshes = [];
    } catch (e) {
      if (window.logGameError) window.logGameError(`chunk.js -> clearMesh [${this.cx},${this.cz}]`, e);
    }
  }

  dispose() {
    this.clearMesh();
    this.blocksData.clear();
  }
}