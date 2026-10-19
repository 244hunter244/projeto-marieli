export class CharacterManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Criar o grupo do modelo 3D completo em 3ª pessoa
    this.playerGroup = new THREE.Group();
    this.buildSteveParts();
    this.scene.add(this.playerGroup);

    // Módulos de Camadas (Layers) do Three.js:
    // Camada 0: Cena padrão / Terreno / Reflexos
    // Camada 1: Modelo do jogador 3D (Invisível na câmera do jogador para não tapar a visão)
    this.setupLayers();

    // Braço dedicado de 1ª pessoa
    this.buildFirstPersonArm();

    this.walkTime = 0;
  }

  setupLayers() {
    // A câmera do jogador enxerga a Camada 0 (Cena) e a Camada 2 (Braço 1ª pessoa),
    // mas IGNORA a Camada 1 (Corpo em 3ª pessoa) para a cabeça não tapar a visão!
    this.camera.layers.enable(0);
    this.camera.layers.enable(2);
    this.camera.layers.disable(1);

    // Atribui todos os blocos do corpo de 3ª pessoa à Camada 1
    this.playerGroup.traverse((child) => {
      if (child.isMesh) {
        child.layers.set(1);
      }
    });
  }

  // Desenha e monta cada parte do corpo individualmente com materiais e cores nativas
  buildSteveParts() {
    // Materiais individuais por parte do corpo (evita o bug de esticar a pele inteira em cada bloco)
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.7 }); // Pele
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.8 }); // Cabelo
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x00a8a8, roughness: 0.6 }); // Camisa Azul Turquesa
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b2b80, roughness: 0.7 }); // Calça Azul Escuro
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeBlueMat = new THREE.MeshBasicMaterial({ color: 0x3a53a4 });

    // 1. CABEÇA
    this.head = new THREE.Group();
    const headCube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    this.head.add(headCube);

    // Cabelo em relevo no topo e laterais
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.52), hairMat);
    hairTop.position.set(0, 0.2, 0);
    this.head.add(hairTop);

    // Olhos desenhados individualmente na frente do rosto
    const eyeLeftW = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), eyeWhiteMat);
    eyeLeftW.position.set(-0.12, 0.02, 0.252);
    const eyeLeftB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), eyeBlueMat);
    eyeLeftB.position.set(-0.1, 0.02, 0.254);

    const eyeRightW = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), eyeWhiteMat);
    eyeRightW.position.set(0.12, 0.02, 0.252);
    const eyeRightB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), eyeBlueMat);
    eyeRightB.position.set(0.14, 0.02, 0.254);

    this.head.add(eyeLeftW, eyeLeftB, eyeRightW, eyeRightB);
    this.head.position.y = 1.4;
    this.playerGroup.add(this.head);

    // 2. TRONCO
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    this.body = new THREE.Mesh(bodyGeo, shirtMat);
    this.body.position.y = 0.775;
    this.playerGroup.add(this.body);

    // 3. BRAÇO ESQUERDO
    this.leftArm = new THREE.Group();
    const lSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.24), shirtMat);
    lSleeve.position.y = -0.175;
    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.22), skinMat);
    lHand.position.y = -0.525;
    this.leftArm.add(lSleeve, lHand);
    this.leftArm.position.set(-0.37, 1.1, 0);
    this.playerGroup.add(this.leftArm);

    // 4. BRAÇO DIREITO
    this.rightArm = new THREE.Group();
    const rSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.24), shirtMat);
    rSleeve.position.y = -0.175;
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.22), skinMat);
    rHand.position.y = -0.525;
    this.rightArm.add(rSleeve, rHand);
    this.rightArm.position.set(0.37, 1.1, 0);
    this.playerGroup.add(this.rightArm);

    // 5. PERNAS
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), pantsMat);
    this.leftLeg.geometry.translate(0, -0.375, 0);
    this.leftLeg.position.set(-0.125, 0.4, 0);
    this.playerGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), pantsMat);
    this.rightLeg.geometry.translate(0, -0.375, 0);
    this.rightLeg.position.set(0.125, 0.4, 0);
    this.playerGroup.add(this.rightLeg);
  }

  // Desenha o braço em 1ª Pessoa montado peça por peça (Manga + Mão)
  buildFirstPersonArm() {
    this.fpArm = new THREE.Group();

    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x00a8a8, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.7 });

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.25), shirtMat);
    sleeve.position.z = 0.125;

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.4), skinMat);
    hand.position.z = -0.2;

    this.fpArm.add(sleeve, hand);

    // Atribui o braço de 1ª pessoa para a Camada 2 (Visível apenas na vista direta do jogador)
    this.fpArm.traverse((child) => {
      if (child.isMesh) child.layers.set(2);
    });

    this.fpArm.position.set(0.32, -0.25, -0.42);
    this.fpArm.rotation.set(0.25, -0.35, -0.15);

    this.camera.add(this.fpArm);
  }

  update(delta, playerPosition, playerVelocity, yawRotation, pitchRotation, isGrounded, isSubmerged) {
    // 1. Sincroniza posição do corpo no mundo
    this.playerGroup.position.copy(playerPosition);
    this.playerGroup.position.y -= 1.5;

    // 2. Rotação Horizontal (O corpo do jogador agora ROTAÇÃO JUNTO com a câmera!)
    if (yawRotation !== undefined) {
      this.playerGroup.rotation.y = yawRotation;
    }

    // 3. Inclinação da Cabeça (Acompanha a rotação vertical da câmera)
    if (pitchRotation !== undefined) {
      this.head.rotation.x = pitchRotation;
    }

    const horizontalSpeed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);

    // 4. Animações de Movimento
    if (horizontalSpeed > 0.5) {
      this.walkTime += delta * (isSubmerged ? 6 : 10);

      const armAngle = Math.sin(this.walkTime) * 0.6;
      const legAngle = Math.sin(this.walkTime) * 0.7;

      this.leftArm.rotation.x = armAngle;
      this.rightArm.rotation.x = -armAngle;
      this.leftLeg.rotation.x = -legAngle;
      this.rightLeg.rotation.x = legAngle;

      // Balanço em 1ª Pessoa
      const swingZ = Math.sin(this.walkTime * 1.3) * 0.04;
      const swingY = Math.abs(Math.cos(this.walkTime * 1.3)) * 0.025;

      this.fpArm.position.set(0.32 + swingZ * 0.5, -0.25 + swingY, -0.42);
      this.fpArm.rotation.z = -0.15 + swingZ;
    } else {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;

      const breathe = Math.sin(Date.now() * 0.002) * 0.005;
      this.fpArm.position.set(0.32, -0.25 + breathe, -0.42);
      this.fpArm.rotation.set(0.25, -0.35, -0.15);
    }
  }
}