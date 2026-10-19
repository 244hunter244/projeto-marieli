export class CharacterManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.steveSkin = this.createSteveSkinTexture();

    this.playerGroup = new THREE.Group();
    this.buildSteveModel();
    this.scene.add(this.playerGroup);

    // Oculta o corpo de 3ª pessoa
    this.playerGroup.visible = false;

    // Braço em 1ª Pessoa
    this.buildFirstPersonArm();

    this.walkTime = 0;
  }

  createSteveSkinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 64, 64);

    // Cabeça
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(8, 0, 8, 8);
    ctx.fillStyle = '#c68b59'; ctx.fillRect(16, 0, 8, 8);
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(0, 8, 8, 8); ctx.fillRect(16, 8, 8, 8); ctx.fillRect(24, 8, 8, 8);
    ctx.fillStyle = '#c68b59'; ctx.fillRect(8, 8, 8, 8);
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(8, 8, 8, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(9, 11, 2, 1); ctx.fillRect(13, 11, 2, 1);
    ctx.fillStyle = '#3a53a4'; ctx.fillRect(10, 11, 1, 1); ctx.fillRect(13, 11, 1, 1);

    // Tronco
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(20, 16, 8, 4); ctx.fillRect(28, 16, 8, 4);
    ctx.fillRect(16, 20, 24, 12);

    // Braço
    ctx.fillStyle = '#00a8a8'; ctx.fillRect(44, 16, 4, 4); ctx.fillRect(40, 20, 16, 6);
    ctx.fillStyle = '#c68b59'; ctx.fillRect(40, 26, 16, 6);

    // Perna
    ctx.fillStyle = '#2b2b80'; ctx.fillRect(4, 16, 4, 4); ctx.fillRect(0, 20, 16, 12);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }

  buildSteveModel() {
    const mat = new THREE.MeshStandardMaterial({ map: this.steveSkin, roughness: 0.8 });

    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.head = new THREE.Mesh(headGeo, mat);
    this.head.position.y = 1.4;
    this.playerGroup.add(this.head);

    const bodyGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    this.body = new THREE.Mesh(bodyGeo, mat);
    this.body.position.y = 0.775;
    this.playerGroup.add(this.body);

    const armGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    armGeo.translate(0, -0.3, 0);

    this.leftArm = new THREE.Mesh(armGeo, mat);
    this.leftArm.position.set(-0.375, 1.1, 0);
    this.playerGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, mat);
    this.rightArm.position.set(0.375, 1.1, 0);
    this.playerGroup.add(this.rightArm);

    const legGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    legGeo.translate(0, -0.35, 0);

    this.leftLeg = new THREE.Mesh(legGeo, mat);
    this.leftLeg.position.set(-0.125, 0.4, 0);
    this.playerGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, mat);
    this.rightLeg.position.set(0.125, 0.4, 0);
    this.playerGroup.add(this.rightLeg);
  }

  buildFirstPersonArm() {
    // Textura de 6 faces para o braço de 1ª pessoa
    const createFaceTex = (color) => {
      const canvas = document.createElement('canvas');
      canvas.width = 16; canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 16, 16);
      const t = new THREE.CanvasTexture(canvas);
      t.magFilter = THREE.NearestFilter;
      return t;
    };

    const matBlue = new THREE.MeshStandardMaterial({ map: createFaceTex('#00a8a8'), roughness: 0.7 });
    const matSkin = new THREE.MeshStandardMaterial({ map: createFaceTex('#c68b59'), roughness: 0.7 });

    // [Direita, Esquerda, Topo, Baixo, Frente, Trás]
    const armMaterials = [matBlue, matBlue, matBlue, matSkin, matSkin, matBlue];

    // Geometria do braço estendido
    const fpArmGeo = new THREE.BoxGeometry(0.18, 0.18, 0.65);

    this.fpArm = new THREE.Mesh(fpArmGeo, armMaterials);

    // Posicionamento no canto inferior direito, apontado ligeiramente para o centro da tela
    this.fpArm.position.set(0.32, -0.25, -0.42);
    this.fpArm.rotation.set(0.25, -0.35, -0.15);

    this.camera.add(this.fpArm);
  }

  update(delta, playerPosition, playerVelocity, isGrounded, isSubmerged) {
    this.playerGroup.position.copy(playerPosition);
    this.playerGroup.position.y -= 1.5;

    const horizontalSpeed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);

    if (horizontalSpeed > 0.5) {
      this.walkTime += delta * (isSubmerged ? 6 : 10);

      // Animação clássica de balanço em 1ª pessoa
      const swingZ = Math.sin(this.walkTime * 1.3) * 0.04;
      const swingY = Math.abs(Math.cos(this.walkTime * 1.3)) * 0.025;

      this.fpArm.position.set(0.32 + swingZ * 0.5, -0.25 + swingY, -0.42);
      this.fpArm.rotation.z = -0.15 + swingZ;
    } else {
      // Leve respiração parado
      const breathe = Math.sin(Date.now() * 0.002) * 0.005;
      this.fpArm.position.set(0.32, -0.25 + breathe, -0.42);
      this.fpArm.rotation.set(0.25, -0.35, -0.15);
    }
  }
}