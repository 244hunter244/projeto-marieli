export class CharacterManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Criar a textura da skin clássica do Steve (64x64)
    this.steveSkin = this.createSteveSkinTexture();

    // Grupo do corpo em 3ª pessoa
    this.playerGroup = new THREE.Group();
    this.buildSteveModel();
    this.scene.add(this.playerGroup);

    // Esconde o corpo em 1ª pessoa para não entrar na frente da visão
    this.playerGroup.visible = false;

    // Braço isolado e corrigido para a 1ª pessoa
    this.buildFirstPersonArm();

    this.walkTime = 0;
  }

  createSteveSkinTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Fundo preto base
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 64, 64);

    // --- CABEÇA (0-32, 0-16) ---
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(8, 0, 8, 8);  // Topo do Cabelo
    ctx.fillStyle = '#c68b59'; ctx.fillRect(16, 0, 8, 8); // Baixo (Queixo)
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(0, 8, 8, 8);  // Lado D
    ctx.fillRect(16, 8, 8, 8); // Lado E
    ctx.fillRect(24, 8, 8, 8); // Trás
    
    // Rosto (Frente)
    ctx.fillStyle = '#c68b59'; ctx.fillRect(8, 8, 8, 8);
    ctx.fillStyle = '#4a2c11'; ctx.fillRect(8, 8, 8, 2); // Testa / Cabelo
    ctx.fillStyle = '#ffffff'; ctx.fillRect(9, 11, 2, 1); ctx.fillRect(13, 11, 2, 1); // Olhos
    ctx.fillStyle = '#3a53a4'; ctx.fillRect(10, 11, 1, 1); ctx.fillRect(13, 11, 1, 1); // Pupilas
    ctx.fillStyle = '#9b5b3f'; ctx.fillRect(11, 12, 2, 1); // Nariz
    ctx.fillStyle = '#61331c'; ctx.fillRect(10, 13, 4, 1); // Barba / Boca

    // --- TRONCO (16-40, 16-32) ---
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(20, 16, 8, 4);  // Topo
    ctx.fillRect(28, 16, 8, 4);  // Baixo
    ctx.fillRect(16, 20, 24, 12); // Lados, Frente e Trás

    // --- BRAÇOS (40-56, 16-32) ---
    ctx.fillStyle = '#00a8a8'; 
    ctx.fillRect(44, 16, 4, 4); // Ombro Topo
    ctx.fillRect(48, 16, 4, 4); // Ombro Baixo
    ctx.fillRect(40, 20, 16, 6); // Camisa (Manga Azul)
    
    ctx.fillStyle = '#c68b59'; 
    ctx.fillRect(40, 26, 16, 6); // Pele do Braço e Mão

    // --- PERNAS (0-16, 16-32) ---
    ctx.fillStyle = '#2b2b80';
    ctx.fillRect(4, 16, 4, 4);   // Topo
    ctx.fillRect(0, 20, 16, 12); // Calça Azul Escuro

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
  }

  // Define UVs personalizadas para caixas do Steve
  setBoxUVs(geometry, uMin, vMin, uMax, vMax) {
    const uvs = geometry.attributes.uv;
    for (let i = 0; i < uvs.count; i += 4) {
      uvs.setX(i, uMin);     uvs.setY(i, vMax);
      uvs.setX(i + 1, uMax); uvs.setY(i, vMax);
      uvs.setX(i + 2, uMin); uvs.setY(i + 2, vMin);
      uvs.setX(i + 3, uMax); uvs.setY(i + 3, vMin);
    }
    uvs.needsUpdate = true;
  }

  buildSteveModel() {
    const mat = new THREE.MeshStandardMaterial({
      map: this.steveSkin,
      roughness: 0.8
    });

    // Cabeça
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    this.head = new THREE.Mesh(headGeo, mat);
    this.head.position.y = 1.4;
    this.playerGroup.add(this.head);

    // Tronco
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    this.body = new THREE.Mesh(bodyGeo, mat);
    this.body.position.y = 0.775;
    this.playerGroup.add(this.body);

    // Braços
    const armGeo = new THREE.BoxGeometry(0.25, 0.75, 0.25);
    armGeo.translate(0, -0.3, 0);

    this.leftArm = new THREE.Mesh(armGeo, mat);
    this.leftArm.position.set(-0.375, 1.1, 0);
    this.playerGroup.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, mat);
    this.rightArm.position.set(0.375, 1.1, 0);
    this.playerGroup.add(this.rightArm);

    // Pernas
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
    // Textura exclusiva recortada apenas para o Braço em 1ª Pessoa
    const armCanvas = document.createElement('canvas');
    armCanvas.width = 16;
    armCanvas.height = 32;
    const ctx = armCanvas.getContext('2d');

    // Parte da Manga Azul Turquesa
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(0, 0, 16, 16);

    // Parte da Pele e Mão do Steve
    ctx.fillStyle = '#c68b59';
    ctx.fillRect(0, 16, 16, 16);

    const armTexture = new THREE.CanvasTexture(armCanvas);
    armTexture.magFilter = THREE.NearestFilter;
    armTexture.minFilter = THREE.NearestFilter;

    const armMat = new THREE.MeshStandardMaterial({
      map: armTexture,
      roughness: 0.7
    });

    // Geometria proporcional do braço reto em 1ª pessoa
    const fpArmGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);

    this.fpArm = new THREE.Mesh(fpArmGeo, armMat);

    // Posicionamento e ângulo do braço no canto inferior direito da tela
    this.fpArm.position.set(0.35, -0.32, -0.48);
    this.fpArm.rotation.set(0.35, -0.35, 0.1);

    this.camera.add(this.fpArm);
  }

  update(delta, playerPosition, playerVelocity, isGrounded, isSubmerged) {
    this.playerGroup.position.copy(playerPosition);
    this.playerGroup.position.y -= 1.5;

    const horizontalSpeed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);

    if (horizontalSpeed > 0.5) {
      this.walkTime += delta * (isSubmerged ? 6 : 10);

      // Animação de balanço natural do braço ao caminhar/correr
      const swingY = Math.abs(Math.sin(this.walkTime * 1.5)) * 0.03;
      const swingX = Math.cos(this.walkTime) * 0.015;

      this.fpArm.position.set(0.35 + swingX, -0.32 + swingY, -0.48);
      this.fpArm.rotation.z = 0.1 + Math.sin(this.walkTime) * 0.04;
    } else {
      // Animação leve de respiração parado
      const breathe = Math.sin(Date.now() * 0.002) * 0.006;
      this.fpArm.position.set(0.35, -0.32 + breathe, -0.48);
      this.fpArm.rotation.set(0.35, -0.35, 0.1);
    }
  }
}