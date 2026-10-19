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

  const grassTopTex = createTexture((ctx) => {
    ctx.fillStyle = '#4c812b';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#3f6c23';
    for (let i = 0; i < 90; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  const grassSideTex = createTexture((ctx) => {
    ctx.fillStyle = '#80593f';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#4c812b';
    ctx.fillRect(0, 0, 32, 6);
  });

  const dirtTex = createTexture((ctx) => {
    ctx.fillStyle = '#80593f';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#6a4933';
    for (let i = 0; i < 90; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  const stoneTex = createTexture((ctx) => {
    ctx.fillStyle = '#737373';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#595959';
    for (let i = 0; i < 80; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  const sandTex = createTexture((ctx) => {
    ctx.fillStyle = '#e5c180';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#cfaa67';
    for (let i = 0; i < 90; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  const kelpTex = createTexture((ctx) => {
    ctx.fillStyle = '#1e7530';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#2bb047';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  const seagrassTex = createTexture((ctx) => {
    ctx.fillStyle = '#3aa34a';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#257031';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  const coralPinkTex = createTexture((ctx) => {
    ctx.fillStyle = '#e64a88';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#f77cb0';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

  const coralBlueTex = createTexture((ctx) => {
    ctx.fillStyle = '#329de6';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#6fc0f7';
    for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

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
    ctx.fillRect(13, 13, 6, 6);
  });

  const leavesTex = createTexture((ctx) => {
    ctx.fillStyle = '#2b571e';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#1e3f15';
    for (let i = 0; i < 100; i++) ctx.fillRect(Math.floor(Math.random() * 32), Math.floor(Math.random() * 32), 2, 2);
  });

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
          float wave = sin(worldPos.x * 0.7 + uTime * 2.0) * cos(worldPos.z * 0.7 + uTime * 1.6) * 0.09;
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
        vec3 deepBlue = vec3(0.05, 0.4, 0.82);
        vec3 cyanShallow = vec3(0.15, 0.72, 0.92);
        
        float wavePattern = sin(vWorldPosition.x * 2.2 + uTime * 2.2) * cos(vWorldPosition.z * 2.2 + uTime * 2.2);
        vec3 waterColor = mix(deepBlue, cyanShallow, wavePattern * 0.3 + 0.5);

        vec3 lightDirection = normalize(vec3(0.4, 1.0, 0.4));
        float specular = pow(max(dot(reflect(-lightDirection, vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
        waterColor += vec3(0.5) * specular;

        gl_FragColor = vec4(waterColor, 0.85);
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

  const matKelp = new THREE.MeshStandardMaterial({ map: kelpTex, roughness: 0.4, transparent: true, opacity: 0.9 });
  const matSeagrass = new THREE.MeshStandardMaterial({ map: seagrassTex, roughness: 0.5, transparent: true, opacity: 0.88 });
  const matCoralPink = new THREE.MeshStandardMaterial({ map: coralPinkTex, roughness: 0.6 });
  const matCoralBlue = new THREE.MeshStandardMaterial({ map: coralBlueTex, roughness: 0.6 });

  const matLogSide = new THREE.MeshStandardMaterial({ map: logSideTex, roughness: 0.8 });
  const matLogTop = new THREE.MeshStandardMaterial({ map: logTopTex, roughness: 0.8 });
  const matLeaves = new THREE.MeshStandardMaterial({ map: leavesTex, roughness: 0.5, transparent: true, opacity: 0.92 });

  blockMaterialsHD.grass = [matGrassSide, matGrassSide, matGrassTop, matDirt, matGrassSide, matGrassSide];
  blockMaterialsHD.dirt = matDirt;
  blockMaterialsHD.stone = matStone;
  blockMaterialsHD.sand = matSand;
  blockMaterialsHD.kelp = matKelp;
  blockMaterialsHD.seagrass = matSeagrass;
  blockMaterialsHD.coral_pink = matCoralPink;
  blockMaterialsHD.coral_blue = matCoralBlue;
  blockMaterialsHD.log = [matLogSide, matLogSide, matLogTop, matLogTop, matLogSide, matLogSide];
  blockMaterialsHD.leaves = matLeaves;
  blockMaterialsHD.water = globalWaterShader;

  blockMaterialsSD.grass = blockMaterialsHD.grass;
  blockMaterialsSD.dirt = matDirt;
  blockMaterialsSD.stone = matStone;
  blockMaterialsSD.sand = matSand;
  blockMaterialsSD.kelp = matKelp;
  blockMaterialsSD.seagrass = matSeagrass;
  blockMaterialsSD.coral_pink = matCoralPink;
  blockMaterialsSD.coral_blue = matCoralBlue;
  blockMaterialsSD.log = blockMaterialsHD.log;
  blockMaterialsSD.leaves = matLeaves;
  blockMaterialsSD.water = globalWaterShader;

  solidMaterials.grass = new THREE.MeshLambertMaterial({ color: 0x4c812b });
  solidMaterials.dirt = new THREE.MeshLambertMaterial({ color: 0x80593f });
  solidMaterials.stone = new THREE.MeshLambertMaterial({ color: 0x737373 });
  solidMaterials.sand = new THREE.MeshLambertMaterial({ color: 0xe5c180 });
  solidMaterials.kelp = new THREE.MeshLambertMaterial({ color: 0x1e7530 });
  solidMaterials.seagrass = new THREE.MeshLambertMaterial({ color: 0x3aa34a });
  solidMaterials.coral_pink = new THREE.MeshLambertMaterial({ color: 0xe64a88 });
  solidMaterials.coral_blue = new THREE.MeshLambertMaterial({ color: 0x329de6 });
  solidMaterials.log = new THREE.MeshLambertMaterial({ color: 0x5c4333 });
  solidMaterials.leaves = new THREE.MeshLambertMaterial({ color: 0x2b571e });
  solidMaterials.water = globalWaterShader;
}