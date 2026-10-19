function createPixelTexture(baseColor, noiseColor, noiseAmount = 0.15, isOre = false, oreColor = '#000') {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 16, 16);

  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      if (Math.random() < 0.4) {
        ctx.fillStyle = noiseColor;
        ctx.globalAlpha = Math.random() * noiseAmount;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  if (isOre) {
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = oreColor;
    const spots = [[3,4], [4,4], [3,5], [10,11], [11,11], [11,12], [7,8], [8,8]];
    spots.forEach(([sx, sy]) => ctx.fillRect(sx, sy, 1, 1));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

export const waterUniforms = {
  uTime: { value: 0.0 }
};

export let texturedMaterials = null;
export let solidColorMaterials = null;

export function initMaterials() {
  if (texturedMaterials) return; // Evita criar duplicado

  const realisticWaterMaterial = new THREE.ShaderMaterial({
    uniforms: waterUniforms,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      uniform float uTime;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        if (normal.y > 0.5) {
          pos.y += sin(pos.x * 3.0 + uTime * 2.5) * 0.05 + cos(pos.z * 3.0 + uTime * 2.0) * 0.05;
        }

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      uniform float uTime;

      void main() {
        vec3 waterColor = vec3(0.08, 0.45, 0.72);
        vec3 deepColor = vec3(0.02, 0.22, 0.48);
        vec3 foamColor = vec3(0.85, 0.95, 1.0);

        float wave = sin(vWorldPosition.x * 4.0 + uTime * 3.0) * cos(vWorldPosition.z * 4.0 + uTime * 2.5);
        vec3 finalColor = mix(waterColor, deepColor, 0.3 + wave * 0.1);

        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        float specular = pow(max(dot(vNormal, lightDir), 0.0), 32.0);
        finalColor += vec3(specular * 0.4);

        if (wave > 0.6) {
          finalColor = mix(finalColor, foamColor, (wave - 0.6) * 1.5);
        }

        gl_FragColor = vec4(finalColor, 0.72);
      }
    `
  });

  texturedMaterials = {
    grassTop: new THREE.MeshLambertMaterial({ map: createPixelTexture('#557a2b', '#3b581d', 0.3) }),
    dirt: new THREE.MeshLambertMaterial({ map: createPixelTexture('#6b5034', '#4a3622', 0.25) }),
    sand: new THREE.MeshLambertMaterial({ map: createPixelTexture('#d6c585', '#b3a062', 0.25) }),
    stone: new THREE.MeshLambertMaterial({ map: createPixelTexture('#737373', '#525252', 0.3) }),
    coalOre: new THREE.MeshLambertMaterial({ map: createPixelTexture('#737373', '#525252', 0.3, true, '#111111') }),
    goldOre: new THREE.MeshLambertMaterial({ map: createPixelTexture('#737373', '#525252', 0.3, true, '#facc15') }),
    wood: new THREE.MeshLambertMaterial({ map: createPixelTexture('#5c4033', '#3d281e', 0.2) }),
    leaves: new THREE.MeshLambertMaterial({ map: createPixelTexture('#2d5a27', '#1b3d17', 0.3), transparent: true, opacity: 0.9 }),
    water: realisticWaterMaterial
  };

  solidColorMaterials = {
    grassTop: new THREE.MeshLambertMaterial({ color: '#557a2b' }),
    dirt: new THREE.MeshLambertMaterial({ color: '#6b5034' }),
    sand: new THREE.MeshLambertMaterial({ color: '#d6c585' }),
    stone: new THREE.MeshLambertMaterial({ color: '#737373' }),
    coalOre: new THREE.MeshLambertMaterial({ color: '#525252' }),
    goldOre: new THREE.MeshLambertMaterial({ color: '#655e38' }),
    wood: new THREE.MeshLambertMaterial({ color: '#5c4033' }),
    leaves: new THREE.MeshLambertMaterial({ color: '#2d5a27', transparent: true, opacity: 0.85 }),
    water: new THREE.MeshLambertMaterial({ color: '#136098', transparent: true, opacity: 0.65, depthWrite: false, side: THREE.DoubleSide })
  };
}