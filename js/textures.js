export const waterUniforms = {
  uTime: { value: 0.0 }
};

export const blockMaterialsHD = {};
export const blockMaterialsSD = {};
export const solidMaterials = {};

export function initMaterials() {
  const createHDTexture = (type) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');

    if (type === 'grass_top') {
      ctx.fillStyle = '#5c8e32';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4c7a27';
      for (let i = 0; i < 60; i++) ctx.fillRect(Math.random() * 30, Math.random() * 30, 2, 2);
    } else if (type === 'dirt') {
      ctx.fillStyle = '#866043';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#6e4e36';
      for (let i = 0; i < 80; i++) ctx.fillRect(Math.random() * 30, Math.random() * 30, 2, 2);
    } else if (type === 'stone') {
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#5c5c5c';
      for (let i = 0; i < 70; i++) ctx.fillRect(Math.random() * 30, Math.random() * 30, 2, 2);
    } else if (type === 'log_side') {
      ctx.fillStyle = '#674d3c';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#4a3528';
      for (let y = 0; y < 32; y += 4) ctx.fillRect(0, y, 32, 2);
    } else if (type === 'leaves') {
      ctx.fillStyle = '#2e5a1c';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#204013';
      for (let i = 0; i < 90; i++) ctx.fillRect(Math.random() * 30, Math.random() * 30, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  };

  const grassTex = createHDTexture('grass_top');
  const dirtTex = createHDTexture('dirt');
  const stoneTex = createHDTexture('stone');
  const logTex = createHDTexture('log_side');
  const leavesTex = createHDTexture('leaves');

  // Shader da Água HD: Superfície Lisa, Ondulada e Opaca (Impede ver cubos por baixo)
  const waterShaderHD = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;

      void main() {
        vNormal = normalMatrix * normal;
        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
        
        // Deforma suavemente a superfície sem quebrar as laterais
        if (position.y > 0.4) {
          float wave = sin(worldPos.x * 1.5 + uTime * 2.0) * cos(worldPos.z * 1.5 + uTime * 1.8) * 0.06;
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
        // Tom azul profundo e realista de água de jogo 3D
        vec3 deepBlue = vec3(0.08, 0.45, 0.88);
        vec3 brightBlue = vec3(0.2, 0.65, 0.98);
        
        // Padrão de ondas procedurais no topo
        float wavePattern = sin(vWorldPosition.x * 3.0 + uTime * 2.0) * cos(vWorldPosition.z * 3.0 + uTime * 2.0);
        vec3 waterColor = mix(deepBlue, brightBlue, wavePattern * 0.25 + 0.5);

        // Brilho especular de luz na água
        vec3 lightDirection = normalize(vec3(0.4, 1.0, 0.4));
        float specular = pow(max(dot(reflect(-lightDirection, vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);
        waterColor += vec3(0.5) * specular;

        // Opacidade alta (0.95) para esconder totalmente os blocos do fundo
        gl_FragColor = vec4(waterColor, 0.95);
      }
    `,
    transparent: true,
    depthWrite: true
  });

  // Água simples para chunks distantes
  const simpleWater = new THREE.MeshLambertMaterial({
    color: 0x1e78dd,
    opacity: 0.95,
    transparent: false
  });

  blockMaterialsHD.grass = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.6 });
  blockMaterialsHD.dirt = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.8 });
  blockMaterialsHD.stone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.5 });
  blockMaterialsHD.log = new THREE.MeshStandardMaterial({ map: logTex, roughness: 0.7 });
  blockMaterialsHD.leaves = new THREE.MeshStandardMaterial({ map: leavesTex, roughness: 0.5, transparent: true, opacity: 0.9 });
  blockMaterialsHD.water = waterShaderHD;

  blockMaterialsSD.grass = new THREE.MeshLambertMaterial({ map: grassTex });
  blockMaterialsSD.dirt = new THREE.MeshLambertMaterial({ map: dirtTex });
  blockMaterialsSD.stone = new THREE.MeshLambertMaterial({ map: stoneTex });
  blockMaterialsSD.log = new THREE.MeshLambertMaterial({ map: logTex });
  blockMaterialsSD.leaves = new THREE.MeshLambertMaterial({ map: leavesTex, transparent: true, opacity: 0.9 });
  blockMaterialsSD.water = simpleWater;

  solidMaterials.grass = new THREE.MeshLambertMaterial({ color: 0x5c8e32 });
  solidMaterials.dirt = new THREE.MeshLambertMaterial({ color: 0x866043 });
  solidMaterials.stone = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
  solidMaterials.log = new THREE.MeshLambertMaterial({ color: 0x674d3c });
  solidMaterials.leaves = new THREE.MeshLambertMaterial({ color: 0x2e5a1c });
  solidMaterials.water = simpleWater;
}