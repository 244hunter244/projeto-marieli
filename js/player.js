import { CHUNK_SIZE, WATER_LEVEL } from './chunk.js';

export class Player {
  constructor(camera, domElement, worldManager) {
    this.camera = camera;
    this.domElement = domElement;
    this.worldManager = worldManager;

    // Dimensões do Jogador (AABB)
    this.height = 1.7; // Altura dos olhos
    this.width = 0.6;  // Largura do corpo
    this.position = new THREE.Vector3(8, 25, 8);
    this.velocity = new THREE.Vector3();

    // Velocidades e Física
    this.speedWalk = 5.0;
    this.speedRun = 8.5;
    this.speedSwim = 3.5;
    this.gravity = 22.0;
    this.jumpForce = 7.5;
    this.swimUpForce = 4.0;

    // Estados
    this.isGrounded = false;
    this.isInWater = false;
    this.isSprinting = false;

    // Entrada de Teclas
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shift: false
    };

    // Orientação do Mouse
    this.pitch = 0;
    this.yaw = 0;
    this.isLocked = false;

    this.initControls();
  }

  initControls() {
    // Clique na tela para capturar o cursor
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock();
      }
    });

    // Evento disparado quando o mouse é preso ou solto
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = (document.pointerLockElement === this.domElement);
      if (!this.isLocked) {
        // Para o movimento imediatamente se o jogador apertar ESC ou perder o foco
        this.velocity.set(0, 0, 0);
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
      }
    });

    // Rotação da Câmera com o Mouse
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const sensitivity = 0.002;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;

      // Trava de rotação vertical (evita girar o pescoço 360°)
      const maxPitch = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });

    // Teclado
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isLocked) {
        document.exitPointerLock();
      }
      this.onKey(e.code, true);
    });

    window.addEventListener('keyup', (e) => this.onKey(e.code, false));
  }

  onKey(code, isPressed) {
    switch (code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = isPressed; break;
      case 'KeyS': case 'ArrowDown': this.keys.backward = isPressed; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = isPressed; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = isPressed; break;
      case 'Space': this.keys.jump = isPressed; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.shift = isPressed; break;
    }
  }

  isSolidBlock(x, y, z) {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);

    const blockType = this.worldManager.getBlock(bx, by, bz);
    return blockType && blockType !== 'water' && blockType !== 'leaves';
  }

  update(delta) {
    if (!this.isLocked) return;

    // Natação
    const feetY = this.position.y - this.height;
    this.isInWater = (feetY < WATER_LEVEL + 0.1);

    // Vetor de Movimento
    const moveVector = new THREE.Vector3();
    if (this.keys.forward) moveVector.z -= 1;
    if (this.keys.backward) moveVector.z += 1;
    if (this.keys.left) moveVector.x -= 1;
    if (this.keys.right) moveVector.x += 1;
    moveVector.normalize();

    const moveMatrix = new THREE.Matrix4().makeRotationY(this.yaw);
    moveVector.applyMatrix4(moveMatrix);

    let currentSpeed = this.speedWalk;
    if (this.isInWater) currentSpeed = this.speedSwim;
    else if (this.keys.shift) currentSpeed = this.speedRun;

    this.velocity.x = moveVector.x * currentSpeed;
    this.velocity.z = moveVector.z * currentSpeed;

    // Gravidade / Pulo
    if (this.isInWater) {
      this.velocity.y -= this.gravity * 0.15 * delta;
      this.velocity.y = Math.max(this.velocity.y, -3.0);

      if (this.keys.jump) {
        this.velocity.y = this.swimUpForce;
      }
    } else {
      this.velocity.y -= this.gravity * delta;

      if (this.keys.jump && this.isGrounded) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
    }

    // Colisão AABB
    this.moveAndCollide(delta);

    // Câmera
    this.camera.position.copy(this.position);
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }

  moveAndCollide(delta) {
    const halfW = this.width / 2;

    // Eixo X
    this.position.x += this.velocity.x * delta;
    if (this.checkCollision(this.position.x, this.position.y, this.position.z, halfW)) {
      this.position.x -= this.velocity.x * delta;
      this.velocity.x = 0;
    }

    // Eixo Z
    this.position.z += this.velocity.z * delta;
    if (this.checkCollision(this.position.x, this.position.y, this.position.z, halfW)) {
      this.position.z -= this.velocity.z * delta;
      this.velocity.z = 0;
    }

    // Eixo Y
    this.position.y += this.velocity.y * delta;
    if (this.checkCollision(this.position.x, this.position.y, this.position.z, halfW)) {
      if (this.velocity.y < 0) {
        this.isGrounded = true;
      }
      this.position.y -= this.velocity.y * delta;
      this.velocity.y = 0;
    } else {
      if (this.velocity.y !== 0) this.isGrounded = false;
    }
  }

  checkCollision(px, py, pz, halfW) {
    const minY = py - this.height;
    const maxY = py;

    for (let x of [px - halfW, px + halfW]) {
      for (let y of [minY + 0.1, py - 0.5, maxY - 0.1]) {
        for (let z of [pz - halfW, pz + halfW]) {
          if (this.isSolidBlock(x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}