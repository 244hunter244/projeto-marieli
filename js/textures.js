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

  // Ajuste do material de água para evitar z-fighting e transparências duplicadas
  const waterMaterialHD = new THREE.MeshPhysicalMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.6,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 1.2,
    depthWrite: false
  });

  const waterMaterialSD = new THREE.MeshStandardMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  });

  blockMaterialsHD.grass = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.6 });
  blockMaterialsHD.dirt = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 0.8 });
  blockMaterialsHD.stone = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.5 });
  blockMaterialsHD.log = new THREE.MeshStandardMaterial({ map: logTex, roughness: 0.7 });
  blockMaterialsHD.leaves = new THREE.MeshStandardMaterial({ map: leavesTex, roughness: 0.5, transparent: true, opacity: 0.9 });
  blockMaterialsHD.water = waterMaterialHD;

  blockMaterialsSD.grass = new THREE.MeshLambertMaterial({ map: grassTex });
  blockMaterialsSD.dirt = new THREE.MeshLambertMaterial({ map: dirtTex });
  blockMaterialsSD.stone = new THREE.MeshLambertMaterial({ map: stoneTex });
  blockMaterialsSD.log = new THREE.MeshLambertMaterial({ map: logTex });
  blockMaterialsSD.leaves = new THREE.MeshLambertMaterial({ map: leavesTex, transparent: true, opacity: 0.9 });
  blockMaterialsSD.water = waterMaterialSD;

  solidMaterials.grass = new THREE.MeshLambertMaterial({ color: 0x5c8e32 });
  solidMaterials.dirt = new THREE.MeshLambertMaterial({ color: 0x866043 });
  solidMaterials.stone = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
  solidMaterials.log = new THREE.MeshLambertMaterial({ color: 0x674d3c });
  solidMaterials.leaves = new THREE.MeshLambertMaterial({ color: 0x2e5a1c });
  solidMaterials.water = waterMaterialSD;
}