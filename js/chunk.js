import { noise2D, riverNoise } from './noise.js';
import { initMaterials, texturedMaterials, solidColorMaterials } from './textures.js';

export const CHUNK_SIZE = 16;
export const WATER_LEVEL = 8;
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

function getTerrainHeight(x, z) {
  const scale1 = 0.02;
  const scale2 = 0.08;
  
  let h1 = noise2D(x * scale1, z * scale1) * 12;
  let h2 = noise2D(x * scale2, z * scale2) * 4;
  let baseHeight = Math.floor(h1 + h2 + 12);

  const rNoise = riverNoise(x, z);
  if (rNoise < 0.12) {
    const depthFactor = (0.12 - rNoise) / 0.12;
    baseHeight = Math.floor(baseHeight - depthFactor * 10);
  }

  return baseHeight;
}

export class Chunk {
  constructor(chunkX, chunkZ, scene) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.scene = scene;
    this.group = new THREE.Group();
    this.blocksData = new Map();
    this.isTextured = true;

    // Garante inicialização segura dos materiais
    initMaterials();

    this.generateData();
    this.buildMesh(true);
  }

  getKey(x, y, z) {
    return `${x},${y},${z}`;
  }

  generateData() {
    const startX = this.chunkX * CHUNK_SIZE;
    const startZ = this.chunkZ * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const worldX = startX + x;
        const worldZ = startZ + z;
        const surfaceY = getTerrainHeight(worldX, worldZ);

        for (let y = 0; y <= surfaceY; y++) {
          let blockType = 'stone';

          if (y === surfaceY) {
            if (y <= WATER_LEVEL + 1) {
              blockType = 'sand';
            } else {
              blockType = 'grassTop';
            }
          } else if (y > surfaceY - 3) {
            blockType = (surfaceY <= WATER_LEVEL + 1) ? 'sand' : 'dirt';
          } else {
            const rand = Math.random();
            if (rand < 0.04) blockType = 'coalOre';
            else if (rand < 0.012 && y < 6) blockType = 'goldOre';
          }

          this.blocksData.set(this.getKey(worldX, y, worldZ), blockType);
        }

        if (surfaceY < WATER_LEVEL) {
          for (let wy = surfaceY + 1; wy <= WATER_LEVEL; wy++) {
            this.blocksData.set(this.getKey(worldX, wy, worldZ), 'water');
          }
        }

        if (surfaceY > WATER_LEVEL + 1 && Math.random() < 0.015 && x > 2 && x < CHUNK_SIZE - 2 && z > 2 && z < CHUNK_SIZE - 2) {
          this.generateTreeData(worldX, surfaceY + 1, worldZ);
        }
      }
    }
  }

  generateTreeData(wx, wy, wz) {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < trunkHeight; i++) {
      this.blocksData.set(this.getKey(wx, wy + i, wz), 'wood');
    }
    const leafStart = wy + trunkHeight - 2;
    for (let lx = -2; lx <= 2; lx++) {
      for (let ly = 0; ly <= 2; ly++) {
        for (let lz = -2; lz <= 2; lz++) {
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && Math.random() > 0.4) continue;
          const k = this.getKey(wx + lx, leafStart + ly, wz + lz);
          if (!this.blocksData.has(k)) {
            this.blocksData.set(k, 'leaves');
          }
        }
      }
    }
  }

  isBlockHidden(x, y, z) {
    return (
      this.blocksData.has(this.getKey(x + 1, y, z)) &&
      this.blocksData.has(this.getKey(x - 1, y, z)) &&
      this.blocksData.has(this.getKey(x, y + 1, z)) &&
      this.blocksData.has(this.getKey(x, y - 1, z)) &&
      this.blocksData.has(this.getKey(x, y, z + 1)) &&
      this.blocksData.has(this.getKey(x, y, z - 1))
    );
  }

  setLODMode(useTextures) {
    if (this.isTextured === useTextures) return;
    this.isTextured = useTextures;
    this.disposeMeshOnly();
    this.buildMesh(useTextures);
  }

  buildMesh(useTextures = true) {
    const activeMaterials = useTextures ? texturedMaterials : solidColorMaterials;
    const typeInstances = {
      grassTop: [], dirt: [], sand: [], stone: [], coalOre: [], goldOre: [], wood: [], leaves: [], water: []
    };

    for (const [key, type] of this.blocksData.entries()) {
      const [x, y, z] = key.split(',').map(Number);
      
      if (type === 'water' || type === 'leaves' || !this.isBlockHidden(x, y, z)) {
        if (typeInstances[type]) {
          typeInstances[type].push(new THREE.Vector3(x, y, z));
        }
      }
    }

    const dummy = new THREE.Object3D();
    const renderOrderMap = { leaves: 1, water: 2 };

    Object.keys(typeInstances).forEach(type => {
      const positions = typeInstances[type];
      if (positions.length === 0) return;

      const instancedMesh = new THREE.InstancedMesh(cubeGeometry, activeMaterials[type], positions.length);
      
      instancedMesh.castShadow = (useTextures && type !== 'water');
      instancedMesh.receiveShadow = true;
      instancedMesh.renderOrder = renderOrderMap[type] || 0;

      positions.forEach((pos, idx) => {
        dummy.position.copy(pos);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(idx, dummy.matrix);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.group.add(instancedMesh);
    });

    this.scene.add(this.group);
  }

  disposeMeshOnly() {
    this.scene.remove(this.group);
    while (this.group.children.length > 0) {
      const obj = this.group.children.pop();
      if (obj.isInstancedMesh) {
        obj.geometry.dispose();
      }
    }
  }

  dispose() {
    this.disposeMeshOnly();
    this.blocksData.clear();
  }
}