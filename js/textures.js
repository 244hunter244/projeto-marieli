export const waterUniforms = {
  uTime: { value: 0.0 }
};

export const blockMaterials = {};
export const solidMaterials = {};

export function initMaterials() {
  try {
    const createProceduralTexture = (colorHex, stripeColorHex) => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = colorHex;
      ctx.fillRect(0, 0, 16, 16);
      ctx.fillStyle = stripeColorHex;
      for (let i = 0; i < 16; i += 4) {
        ctx.fillRect(i, i, 2, 2);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      return texture;
    };

    const grassTex = createProceduralTexture('#557a2b', '#4d6e27');
    const dirtTex = createProceduralTexture('#866043', '#6e4e36');
    const stoneTex = createProceduralTexture('#808080', '#696969');

    blockMaterials.grass = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.8 });
    blockMaterials.dirt = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.9 });
    blockMaterials.stone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.7 });

    solidMaterials.grass = new THREE.MeshLambertMaterial({ color: 0x557a2b });
    solidMaterials.dirt = new THREE.MeshLambertMaterial({ color: 0x866043 });
    solidMaterials.stone = new THREE.MeshLambertMaterial({ color: 0x808080 });
  } catch (e) {
    if (window.logGameError) window.logGameError("textures.js -> initMaterials", e);
  }
}