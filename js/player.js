import { WATER_LEVEL } from './chunk.js';

export class Player {
  constructor(camera, domElement, world) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;

    this.yawObject = new THREE.Object3D();
    this.pitchObject = new THREE.Object3D();

    this.pitchObject.add(this.camera);
    this.yawObject.add(this.pitchObject);

    this.camera.rotation.set(0, 0, 0);
    this.pitchObject.rotation.set(0, 0, 0);
    this.yawObject.rotation.set(0, 0, 0);

    this.position = this.yawObject.position;
    this.position.set(8, 35, 8);

    if (this.world && this.world.scene) {
      this.world.scene.add(this.yawObject);
    }

    this.velocity = new THREE.Vector3();
    this.moveKeys = { forward: false, backward: false, left: false, right: false, jump: false, run: false };
    this.isGrounded = false;
    this.isSubmerged = false;
    this.isLocked = false;

    this.radius = 0.3;
    this.height = 1.7;

    // Blocos que NÃO devem travar o jogador
    this.nonSolidBlocks = new Set(['water', 'kelp', 'seagrass', 'coral_pink', 'coral_blue']);

    this.initControls();
  }

  initControls() {
    if (this.domElement) {
      this.domElement.addEventListener('click', () => {
        this.domElement.requestPointerLock();
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked) return;

      const sensitivity = 0.0022;
      this.yawObject.rotation.y -= e.movementX * sensitivity;
      this.pitchObject.rotation.x -= e.movementY * sensitivity;

      const maxAngle = Math.PI / 2 - 0.01;
      this.pitchObject.rotation.x = Math.max(-maxAngle, Math.min(maxAngle, this.pitchObject.rotation.x));
    });

    window.addEventListener('keydown', (e) => this.handleKey(e.code, true));
    window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
  }

  handleKey(code, state) {
    switch (code) {
      case 'KeyW': this.moveKeys.forward = state; break;
      case 'KeyS': this.moveKeys.backward = state; break;
      case 'KeyA': this.moveKeys.left = state; break;
      case 'KeyD': this.moveKeys.right = state; break;
      case 'Space': this.moveKeys.jump = state; break;
      case 'ShiftLeft': this.moveKeys.run = state; break;
    }
  }

  // Verifica colisão ignorando água e vegetação aquática
  checkCollisionAt(x, y, z) {
    const minX = Math.floor(x - this.radius);
    const maxX = Math.floor(x + this.radius);
    const minY = Math.floor(y - 1.5);
    const maxY = Math.floor(y - 1.5 + this.height);
    const minZ = Math.floor(z - this.radius);
    const maxZ = Math.floor(z + this.radius);

    for (let bx = minX; bx <= maxX; bx++) {
      for (let by = minY; by <= maxY; by++) {
        for (let bz = minZ; bz <= maxZ; bz++) {
          const block = this.world.getBlock(bx, by, bz);
          if (block && !this.nonSolidBlocks.has(block)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  update(delta) {
    // Detecta submersão na água
    const headX = Math.floor(this.position.x);
    const headZ = Math.floor(this.position.z);
    const surfaceBlock = this.world.getBlock(headX, WATER_LEVEL, headZ);

    this.isSubmerged = (this.position.y <= WATER_LEVEL + 0.3) && (surfaceBlock === 'water' || !surfaceBlock);

    const moveDir = new THREE.Vector3();
    if (this.moveKeys.forward) moveDir.z -= 1;
    if (this.moveKeys.backward) moveDir.z += 1;
    if (this.moveKeys.left) moveDir.x -= 1;
    if (this.moveKeys.right) moveDir.x += 1;
    moveDir.normalize();

    if (this.isSubmerged) {
      // --- FÍSICA DE NATAÇÃO 3D ---
      const swimSpeed = this.moveKeys.run ? 9 : 5.5;

      const lookVector = new THREE.Vector3(0, 0, -1);
      lookVector.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitchObject.rotation.x);
      lookVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yawObject.rotation.y);

      if (this.moveKeys.forward) {
        this.velocity.lerp(lookVector.multiplyScalar(swimSpeed), delta * 5);
      } else {
        this.velocity.x *= Math.pow(0.05, delta);
        this.velocity.z *= Math.pow(0.05, delta);
      }

      if (this.moveKeys.jump) {
        this.velocity.y = 5.5;
      } else if (!this.moveKeys.forward) {
        this.velocity.y = Math.sin(Date.now() * 0.003) * 0.3;
      }

      this.velocity.y *= Math.pow(0.15, delta);

    } else {
      // --- FÍSICA DE TERRA FIRME ---
      const speed = this.moveKeys.run ? 11 : 6;

      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yawObject.rotation.y);

      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      this.velocity.y -= 26 * delta;

      if (this.moveKeys.jump && this.isGrounded) {
        this.velocity.y = 8.5;
        this.isGrounded = false;
      }
    }

    // Aplicação e Resolução de Colisão AABB por Eixo
    const newX = this.position.x + this.velocity.x * delta;
    if (!this.checkCollisionAt(newX, this.position.y, this.position.z)) {
      this.position.x = newX;
    } else {
      this.velocity.x = 0;
    }

    const newZ = this.position.z + this.velocity.z * delta;
    if (!this.checkCollisionAt(this.position.x, this.position.y, newZ)) {
      this.position.z = newZ;
    } else {
      this.velocity.z = 0;
    }

    const newY = this.position.y + this.velocity.y * delta;
    if (!this.checkCollisionAt(this.position.x, newY, this.position.z)) {
      this.position.y = newY;
      this.isGrounded = false;
    } else {
      if (this.velocity.y < 0) {
        this.isGrounded = true;
      }
      this.velocity.y = 0;
    }

    if (this.position.y < -10) {
      this.position.set(8, 35, 8);
      this.velocity.set(0, 0, 0);
    }
  }
}