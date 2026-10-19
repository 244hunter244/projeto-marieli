export const waterUniforms = {
  uTime: { value: 0.0 }
};

export const blockMaterialsHD = {};
export const blockMaterialsSD = {};
export const solidMaterials = {};

export function initMaterials() {
  const createTexture = (drawFn) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    drawFn(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  };

  // 1. Grama - Topo
  const grassTopTex = createTexture((ctx) => {
    ctx.fillStyle = '#4c812b';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#3f6c23';
    for (let i = 0; i < 90; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
    ctx.fillStyle = '#5b9933';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  // 2. Grama - Lateral (Verde no topo, Terra embaixo)
  const grassSideTex = createTexture((ctx) => {
    ctx.fillStyle = '#80593f';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#6a4933';
    for (let i = 0; i < 80; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
    ctx.fillStyle = '#4c812b';
    ctx.fillRect(0, 0, 32, 6);
    for (let x = 0; x < 32; x += 2) {
      const drop = 6 + Math.floor(Math.random() * 5);
      ctx.fillRect(x, 6, 2, drop - 6);
    }
  });

  // 3. Terra
  const dirtTex = createTexture((ctx) => {
    ctx.fillStyle = '#80593f';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#6a4933';
    for (let i = 0; i < 90; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  // 4. Pedra
  const stoneTex = createTexture((ctx) => {
    ctx.fillStyle = '#737373';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#595959';
    for (let i = 0; i < 80; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  // 5. Areia (Para o fundo do rio/mar)
  const sandTex = createTexture((ctx) => {
    ctx.fillStyle = '#e0c088';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#c7a973';
    for (let i = 0; i < 80; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
    ctx.fillStyle = '#ebd19d';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  // 6. Algas / Plantas Aquáticas (Kelp)
  const kelpTex = createTexture((ctx) => {
    ctx.fillStyle = '#1e6327';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#14451b';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
    ctx.fillStyle = '#2b8737';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  // 7. Tronco (Lateral e Topo)
  const logSideTex = createTexture((ctx) => {
    ctx.fillStyle = '#5c4333';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#422f23';
    for (let x = 0; x < 32; x += 4) ctx.fillRect(x, 0, 2, 32);
  });

  const logTopTex = createTexture((ctx) => {
    ctx.fillStyle = '#8c684d';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#5c4333';
    ctx.strokeRect(3, 3, 26, 26);
    ctx.fillRect(13, 13, 6, 6);
  });

  // 8. Folhas
  const leavesTex = createTexture((ctx) => {
    ctx.fillStyle = '#2b571e';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#1e3f15';
    for (let i = 0; i < 100; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  // Shader da Água
  const globalWaterShader = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        vNormal = normalMatrix * normal;
        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        
        if (position.y > 0.4) {
          float wave = sin(worldPos.x * 0.8 + uTime * 1.8) * cos(worldPos.z * 0.8 + uTime * 1.5) * 0.08;
          worldPos.y += wave;
        }

        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        vec3 deepBlue = vec3(0.08, 0.45, 0.88);
        vec3 brightBlue = vec3(0.2, 0.68, 0.98);
        
        float wavePattern = sin(vWorldPosition.x * 2.0 + uTime * 2.0) * cos(vWorldPosition.z * 2.0 + uTime * 2.0);
        vec3 waterColor = mix(deepBlue, brightBlue, wavePattern * 0.25 + 0.5);

        vec3 lightDirection = normalize(vec3(0.4, 1.0, 0.4));
        float specular = pow(max(dot(reflect(-lightDirection, vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
        waterColor += vec3(0.4) * specular;

        gl_FragColor = vec4(waterColor, 0.92);
      }
    `,
    transparent: true,
    depthWrite: true
  });

  const matGrassTop = new THREE.MeshStandardMaterial({ map: grassTopTex, roughness: 0.7 });
  const matGrassSide = new THREE.MeshStandardMaterial({ map: grassSideTex, roughness: 0.8 });
  const matDirt = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.9 });
  const matStone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.6 });
  const matSand = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.9 });
  const matKelp = new THREE.MeshStandardMaterial({ map: kelpTex, roughness: 0.5, transparent: true, opacity: 0.88 });

  const matLogSide = new THREE.MeshStandardMaterial({ map: logSideTex, roughness: 0.8 });
  const matLogTop = new THREE.MeshStandardMaterial({ map: logTopTex, roughness: 0.8 });
  const matLeaves = new THREE.MeshStandardMaterial({ map: leavesTex, roughness: 0.5, transparent: true, opacity: 0.92 });

  blockMaterialsHD.grass = [matGrassSide, matGrassSide, matGrassTop, matDirt, matGrassSide, matGrassSide];
  blockMaterialsHD.dirt = matDirt;
  blockMaterialsHD.stone = matStone;
  blockMaterialsHD.sand = matSand;
  blockMaterialsHD.kelp = matKelp;
  blockMaterialsHD.log = [matLogSide, matLogSide, matLogTop, matLogTop, matLogSide, matLogSide];
  blockMaterialsHD.leaves = matLeaves;
  blockMaterialsHD.water = globalWaterShader;

  blockMaterialsSD.grass = blockMaterialsHD.grass;
  blockMaterialsSD.dirt = matDirt;
  blockMaterialsSD.stone = matStone;
  blockMaterialsSD.sand = matSand;
  blockMaterialsSD.kelp = matKelp;
  blockMaterialsSD.log = blockMaterialsHD.log;
  blockMaterialsSD.leaves = matLeaves;
  blockMaterialsSD.water = globalWaterShader;

  solidMaterials.grass = new THREE.MeshLambertMaterial({ color: 0x4c812b });
  solidMaterials.dirt = new THREE.MeshLambertMaterial({ color: 0x80593f });
  solidMaterials.stone = new THREE.MeshLambertMaterial({ color: 0x737373 });
  solidMaterials.sand = new THREE.MeshLambertMaterial({ color: 0xe0c088 });
  solidMaterials.kelp = new THREE.MeshLambertMaterial({ color: 0x1e6327 });
  solidMaterials.log = new THREE.MeshLambertMaterial({ color: 0x5c4333 });
  solidMaterials.leaves = new THREE.MeshLambertMaterial({ color: 0x2b571e });
  solidMaterials.water = globalWaterShader;
}