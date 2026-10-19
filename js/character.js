export class CharacterManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    // Grupo do modelo 3D em 3ª pessoa (geração de sombras e reflexos na água)
    this.playerGroup = new THREE.Group();
    this.buildSteveParts();
    this.scene.add(this.playerGroup);

    // Sistema de Camadas (Layers) do Three.js
    this.setupLayers();

    // Braço de 1ª pessoa
    this.buildFirstPersonArm();

    // Variáveis de tempo e interpolação de animação
    this.walkTime = 0;
    this.swimTime = 0;

    // Posições e Rotações Alvo para o Lerp (Transição Suave do Braço 1ª Pessoa)
    this.targetPos = new THREE.Vector3(0.32, -0.25, -0.42);
    this.targetRot = new THREE.Euler(0.25, -0.35, -0.15);
  }

  setupLayers() {
    this.camera.layers.enable(0);
    this.camera.layers.enable(2);
    this.camera.layers.disable(1);

    this.playerGroup.traverse((child) => {
      if (child.isMesh) {
        child.layers.set(1);
      }
    });
  }

  buildSteveParts() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.8 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x00a8a8, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2b2b80, roughness: 0.7 });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeBlueMat = new THREE.MeshBasicMaterial({ color: 0x3a53a4 });

    // Cabeça
    this.head = new THREE.Group();
    const headCube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    this.head.add(headCube);

    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.52), hairMat);
    hairTop.position.set(0, 0.2, 0);
    this.head.add(hairTop);

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

    // Tronco
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
    this.body = new THREE.Mesh(bodyGeo, shirtMat);
    this.body.position.y = 0.775;
    this.playerGroup.add(this.body);

    // Braço Esquerdo
    this.leftArm = new THREE.Group();
    const lSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.24), shirtMat);
    lSleeve.position.y = -0.175;
    const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.22), skinMat);
    lHand.position.y = -0.525;
    this.leftArm.add(lSleeve, lHand);
    this.leftArm.position.set(-0.37, 1.1, 0);
    this.playerGroup.add(this.leftArm);

    // Braço Direito
    this.rightArm = new THREE.Group();
    const rSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.24), shirtMat);
    rSleeve.position.y = -0.175;
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.4, 0.22), skinMat);
    rHand.position.y = -0.525;
    this.rightArm.add(rSleeve, rHand);
    this.rightArm.position.set(0.37, 1.1, 0);
    this.playerGroup.add(this.rightArm);

    // Pernas
    this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), pantsMat);
    this.leftLeg.geometry.translate(0, -0.375, 0);
    this.leftLeg.position.set(-0.125, 0.4, 0);
    this.playerGroup.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), pantsMat);
    this.rightLeg.geometry.translate(0, -0.375, 0);
    this.rightLeg.position.set(0.125, 0.4, 0);
    this.playerGroup.add(this.rightLeg);
  }

  buildFirstPersonArm() {
    this.fpArm = new THREE.Group();

    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x00a8a8, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68b59, roughness: 0.7 });

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.25), shirtMat);
    sleeve.position.z = 0.125;

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.4), skinMat);
    hand.position.z = -0.2;

    this.fpArm.add(sleeve, hand);

    this.fpArm.traverse((child) => {
      if (child.isMesh) child.layers.set(2);
    });

    this.fpArm.position.set(0.32, -0.25, -0.42);
    this.fpArm.rotation.set(0.25, -0.35, -0.15);

    this.camera.add(this.fpArm);
  }

  update(delta, playerPosition, playerVelocity, yawRotation, pitchRotation, isGrounded, isSubmerged) {
    // 1. Sincronização do modelo no mundo
    this.playerGroup.position.copy(playerPosition);
    this.playerGroup.position.y -= 1.5;

    if (yawRotation !== undefined) {
      this.playerGroup.rotation.y = yawRotation;
    }
    if (pitchRotation !== undefined) {
      this.head.rotation.x = pitchRotation;
    }

    const horizontalSpeed = Math.sqrt(playerVelocity.x ** 2 + playerVelocity.z ** 2);

    // 2. Animação do Corpo em 3ª Pessoa (Reflexo na Água e Sombras)
    if (horizontalSpeed > 0.5) {
      this.walkTime += delta * (isSubmerged ? 6 : 10);
      const armAngle = Math.sin(this.walkTime) * 0.6;
      const legAngle = Math.sin(this.walkTime) * 0.7;

      this.leftArm.rotation.x = armAngle;
      this.rightArm.rotation.x = -armAngle;
      this.leftLeg.rotation.x = -legAngle;
      this.rightLeg.rotation.x = legAngle;
    } else {
      this.leftArm.rotation.x = 0;
      this.rightArm.rotation.x = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }

    // 3. ANIMAÇÃO PROCEDURAL DO BRAÇO EM 1ª PESSOA
    const basePosX = 0.32;
    const basePosY = -0.25;
    const basePosZ = -0.42;

    const baseRotX = 0.25;
    const baseRotY = -0.35;
    const baseRotZ = -0.15;

    if (isSubmerged) {
      // --- ANIMAÇÃO DE NATAÇÃO ---
      this.swimTime += delta * (horizontalSpeed > 0.5 ? 7 : 3);

      const strokeX = Math.sin(this.swimTime) * 0.08;
      const strokeY = Math.cos(this.swimTime * 2) * 0.04;
      const strokeZ = Math.sin(this.swimTime) * 0.06;

      this.targetPos.set(basePosX + strokeX, basePosY + strokeY - 0.05, basePosZ + strokeZ);
      this.targetRot.set(
        baseRotX + Math.sin(this.swimTime) * 0.3,
        baseRotY + Math.cos(this.swimTime) * 0.2,
        baseRotZ + Math.sin(this.swimTime * 0.5) * 0.2
      );

    } else if (!isGrounded) {
      // --- ANIMAÇÃO DE PULO / QUEDA ---
      const vertVel = playerVelocity.y;

      if (vertVel > 1.0) {
        // Pulo para cima: Braço recua e inclina para baixo
        this.targetPos.set(basePosX + 0.02, basePosY - 0.06, basePosZ + 0.05);
        this.targetRot.set(baseRotX - 0.25, baseRotY - 0.1, baseRotZ - 0.1);
      } else if (vertVel < -1.0) {
        // Queda: Braço eleva-se levemente
        this.targetPos.set(basePosX, basePosY + 0.04, basePosZ - 0.03);
        this.targetRot.set(baseRotX + 0.15, baseRotY, baseRotZ + 0.1);
      }

    } else if (horizontalSpeed > 0.5) {
      // --- ANIMAÇÃO DE ANDAR / CORRER ---
      const runMultiplier = horizontalSpeed > 7 ? 1.4 : 1.0;
      this.walkTime += delta * 9 * runMultiplier;

      const bobY = Math.abs(Math.cos(this.walkTime)) * 0.035 * runMultiplier;
      const swayX = Math.sin(this.walkTime) * 0.025 * runMultiplier;

      this.targetPos.set(basePosX + swayX, basePosY + bobY, basePosZ);
      this.targetRot.set(
        baseRotX + Math.sin(this.walkTime) * 0.12 * runMultiplier,
        baseRotY + swayX * 0.8,
        baseRotZ + Math.sin(this.walkTime * 0.5) * 0.08
      );

    } else {
      // --- ANIMAÇÃO PARADO (IDLE / RESSPIRAÇÃO) ---
      const breatheTime = Date.now() * 0.0025;
      const breatheY = Math.sin(breatheTime) * 0.006;
      const breatheX = Math.cos(breatheTime * 0.5) * 0.003;

      this.targetPos.set(basePosX + breatheX, basePosY + breatheY, basePosZ);
      this.targetRot.set(baseRotX + breatheY * 2, baseRotY, baseRotZ);
    }

    // Interpolação suave (Lerp) das posições e rotações para transições sem saltos
    const lerpSpeed = delta * 12;
    this.fpArm.position.lerp(this.targetPos, lerpSpeed);

    this.fpArm.rotation.x = THREE.MathUtils.lerp(this.fpArm.rotation.x, this.targetRot.x, lerpSpeed);
    this.fpArm.rotation.y = THREE.MathUtils.lerp(this.fpArm.rotation.y, this.targetRot.y, lerpSpeed);
    this.fpArm.rotation.z = THREE.MathUtils.lerp(this.fpArm.rotation.z, this.targetRot.z, lerpSpeed);
  }
}