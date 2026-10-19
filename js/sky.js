import { SimplexNoise } from './noise.js';

const simplex = new SimplexNoise();

export class SkyManager {
  constructor(scene) {
    this.scene = scene;
    this.cloudsGroup = new THREE.Group();
    this.scene.add(this.cloudsGroup);

    this.initSkyDome();
    this.initSun();
    this.initOrganicClouds();
  }

  // Cúpula do Céu com gradiente atmosférico realista
  initSkyDome() {
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        vec3 skyDeep = vec3(0.18, 0.42, 0.76);     // Azul no topo
        vec3 skyHorizon = vec3(0.75, 0.86, 0.96);  // Nevoeiro claro no horizonte
        vec3 sunGlow = vec3(1.0, 0.95, 0.85);      // Brilho solar
        
        vec3 col = mix(skyHorizon, skyDeep, max(h, 0.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const skyGeo = new THREE.SphereGeometry(600, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  // Sol vibrante com múltiplas camadas de iluminação (Halo/Glow)
  initSun() {
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(120, 220, -250);

    // Núcleo do Sol
    const coreGeo = new THREE.SphereGeometry(16, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunCore = new THREE.Mesh(coreGeo, coreMat);
    this.sunGroup.add(sunCore);

    // Halo Interno (Brilho Intenso)
    const innerGlowGeo = new THREE.SphereGeometry(28, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfff0b3,
      transparent: true,
      opacity: 0.55
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    this.sunGroup.add(innerGlow);

    // Halo Externo Radiante
    const outerGlowGeo = new THREE.SphereGeometry(50, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffe49e,
      transparent: true,
      opacity: 0.25
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    this.sunGroup.add(outerGlow);

    this.scene.add(this.sunGroup);
  }

  // Nuvens Orgânicas e Fofas (Estilo Hytale / Shaders)
  initOrganicClouds() {
    // Usamos um material padrão com auto-sombreamento suave
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.94,
      flatShading: true // Dá o aspeto low-poly/voxel bonito sem ser um cubo simples
    });

    // Criamos instâncias de cubos com proporções variadas para formar "aglomerados"
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    
    // Lista de posições de aglomerados aleatórios (Clusters)
    const clusterCenters = [];
    for (let i = 0; i < 18; i++) {
      clusterCenters.push({
        x: (Math.random() - 0.5) * 450,
        y: 65 + Math.random() * 15,
        z: (Math.random() - 0.5) * 450,
        radius: 18 + Math.random() * 25
      });
    }

    // Calcula o total de blocos necessários
    let totalBlocks = 0;
    const blocksData = [];

    for (const cluster of clusterCenters) {
      const numPuffs = 12 + Math.floor(Math.random() * 16);
      for (let p = 0; p < numPuffs; p++) {
        // Distribuição esférica em redor do centro do aglomerado
        const offsetX = (Math.random() - 0.5) * cluster.radius;
        const offsetY = (Math.random() - 0.5) * (cluster.radius * 0.35); // Mais achatadas na vertical
        const offsetZ = (Math.random() - 0.5) * cluster.radius;

        // Escalas variadas para criar o efeito "fofo"
        const scaleX = 10 + Math.random() * 18;
        const scaleY = 4 + Math.random() * 8;
        const scaleZ = 10 + Math.random() * 18;

        blocksData.push({
          x: cluster.x + offsetX,
          y: cluster.y + offsetY,
          z: cluster.z + offsetZ,
          sx: scaleX,
          sy: scaleY,
          sz: scaleZ
        });
        totalBlocks++;
      }
    }

    this.cloudMesh = new THREE.InstancedMesh(boxGeo, cloudMaterial, totalBlocks);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < blocksData.length; i++) {
      const b = blocksData[i];
      dummy.position.set(b.x, b.y, b.z);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      this.cloudMesh.setMatrixAt(i, dummy.matrix);
    }

    this.cloudMesh.instanceMatrix.needsUpdate = true;
    this.cloudsGroup.add(this.cloudMesh);
  }

  update(delta, playerPosition) {
    if (playerPosition) {
      this.skyDome.position.set(playerPosition.x, 0, playerPosition.z);
      this.sunGroup.position.set(playerPosition.x + 120, 220, playerPosition.z - 250);
      this.cloudsGroup.position.x = playerPosition.x;
      this.cloudsGroup.position.z = playerPosition.z;
    }

    // Vento suave deslocando todo o conjunto de nuvens
    this.cloudMesh.position.x += delta * 1.2;
    if (this.cloudMesh.position.x > 250) {
      this.cloudMesh.position.x = -250;
    }
  }
}