import { SimplexNoise } from './noise.js';

const simplex = new SimplexNoise();

export class SkyManager {
  constructor(scene) {
    this.scene = scene;
    this.cloudsGroup = new THREE.Group();
    this.scene.add(this.cloudsGroup);

    this.initSkyDome();
    this.initSun();
    this.initClouds();
  }

  // Cúpula com gradiente de céu
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
        vec3 skyBlue = vec3(0.2, 0.45, 0.78);
        vec3 horizonWhite = vec3(0.82, 0.88, 0.95);
        gl_FragColor = vec4(mix(horizonWhite, skyBlue, max(h, 0.0)), 1.0);
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

  // Sol volumétrico com brilho
  initSun() {
    const sunGeo = new THREE.SphereGeometry(12, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(120, 220, -200);
    this.scene.add(this.sunMesh);

    // Glow ao redor do sol
    const glowGeo = new THREE.SphereGeometry(24, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
      transparent: true,
      opacity: 0.35,
      side: THREE.BackSide
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.sunMesh.add(glowMesh);
  }

  // Camada de Nuvens 3D em blocos volumétricos
  initClouds() {
    const cloudGeometry = new THREE.BoxGeometry(8, 3, 8);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    const cloudCount = 120;
    this.cloudMesh = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, cloudCount);

    const dummy = new THREE.Object3D();
    let instanceIdx = 0;

    for (let x = -10; x < 10; x++) {
      for (let z = -10; z < 10; z++) {
        const n = simplex.noise2D(x * 0.18, z * 0.18);
        if (n > 0.25 && instanceIdx < cloudCount) {
          const posX = x * 22 + (Math.random() - 0.5) * 6;
          const posY = 52 + Math.floor(n * 6);
          const posZ = z * 22 + (Math.random() - 0.5) * 6;

          dummy.position.set(posX, posY, posZ);
          dummy.scale.set(1 + Math.random() * 0.5, 1, 1 + Math.random() * 0.5);
          dummy.updateMatrix();

          this.cloudMesh.setMatrixAt(instanceIdx, dummy.matrix);
          instanceIdx++;
        }
      }
    }

    this.cloudMesh.instanceMatrix.needsUpdate = true;
    this.cloudsGroup.add(this.cloudMesh);
  }

  update(delta, playerPosition) {
    // Acompanha a posição XZ do jogador para o céu e as nuvens parecerem infinitos
    if (playerPosition) {
      this.skyDome.position.set(playerPosition.x, 0, playerPosition.z);
      this.cloudsGroup.position.x = playerPosition.x;
      this.cloudsGroup.position.z = playerPosition.z;
    }

    // Vento suave deslocando as nuvens
    this.cloudMesh.position.x += delta * 0.8;
    if (this.cloudMesh.position.x > 100) {
      this.cloudMesh.position.x = -100;
    }
  }
}