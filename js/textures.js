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
    } else if (type === 'sand') {
      ctx.fillStyle = '#e3c28d';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#cbb07c';
      for (let i = 0; i < 70; i++) ctx.fillRect(Math.random() * 30, Math.random() * 30, 2, 2);
    } else if (type === 'kelp') {
      ctx.fillStyle = '#1e6327';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#14451b';
      for (let i = 0; i < 50; i++) ctx.fillRect(Math.random() * 30, Math.random() * 30, 2, 2);
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
  const sandTex = createHDTexture('sand');
  const kelpTex = createHDTexture('kelp');
  const logTex = createHDTexture('log_side');
  const leavesTex = createHDTexture('leaves');

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

  blockMaterialsHD.grass = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.6 });
  blockMaterialsHD.dirt = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.8 });
  blockMaterialsHD.stone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.5 });
  blockMaterialsHD.sand = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.9 });
  blockMaterialsHD.kelp = new THREE.MeshStandardMaterial({ map: kelpTex, roughness: 0.5, transparent: true, opacity: 0.85 });
  blockMaterialsHD.log = new THREE.MeshStandardMaterial({ map: logTex, roughness: 0.7 });
  blockMaterialsHD.leaves = new THREE.MeshStandardMaterial({ map: leavesTex, roughness: 0.5, transparent: true, opacity: 0.9 });
  blockMaterialsHD.water = globalWaterShader;

  blockMaterialsSD.grass = new THREE.MeshLambertMaterial({ map: grassTex });
  blockMaterialsSD.dirt = new THREE.MeshLambertMaterial({ map: dirtTex });
  blockMaterialsSD.stone = new THREE.MeshLambertMaterial({ map: stoneTex });
  blockMaterialsSD.sand = new THREE.MeshLambertMaterial({ map: sandTex });
  blockMaterialsSD.kelp = new THREE.MeshLambertMaterial({ map: kelpTex, transparent: true, opacity: 0.85 });
  blockMaterialsSD.log = new THREE.MeshLambertMaterial({ map: logTex });
  blockMaterialsSD.leaves = new THREE.MeshLambertMaterial({ map: leavesTex, transparent: true, opacity: 0.9 });
  blockMaterialsSD.water = globalWaterShader;

  solidMaterials.grass = new THREE.MeshLambertMaterial({ color: 0x5c8e32 });
  solidMaterials.dirt = new THREE.MeshLambertMaterial({ color: 0x866043 });
  solidMaterials.stone = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
  solidMaterials.sand = new THREE.MeshLambertMaterial({ color: 0xe3c28d });
  solidMaterials.kelp = new THREE.MeshLambertMaterial({ color: 0x1e6327 });
  solidMaterials.log = new THREE.MeshLambertMaterial({ color: 0x674d3c });
  solidMaterials.leaves = new THREE.MeshLambertMaterial({ color: 0x2e5a1c });
  solidMaterials.water = globalWaterShader;
}