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

  update(delta) {
    // Checa a presença de água diretamente na posição da cabeça/olhos
    const headBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      Math.floor(this.position.z)
    );

    this.isSubmerged = (headBlock === 'water') && (this.position.y < WATER_LEVEL + 0.2);

    if (this.isSubmerged) {
      const swimSpeed = this.moveKeys.run ? 9 : 5.5;
      const moveDir = new THREE.Vector3();

      if (this.moveKeys.forward) moveDir.z -= 1;
      if (this.moveKeys.backward) moveDir.z += 1;
      if (this.moveKeys.left) moveDir.x -= 1;
      if (this.moveKeys.right) moveDir.x += 1;

      moveDir.normalize();

      const lookVector = new THREE.Vector3(0, 0, -1);
      lookVector.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitchObject.rotation.x);
      lookVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yawObject.rotation.y);

      if (this.moveKeys.forward) {
        this.velocity.lerp(lookVector.multiplyScalar(swimSpeed), delta * 4);
      } else {
        this.velocity.x *= Math.pow(0.05, delta);
        this.velocity.z *= Math.pow(0.05, delta);
      }

      if (this.moveKeys.jump) {
        this.velocity.y = 5;
      } else if (!this.moveKeys.forward) {
        this.velocity.y = Math.sin(Date.now() * 0.003) * 0.4;
      }

      this.velocity.y *= Math.pow(0.1, delta);

    } else {
      const speed = this.moveKeys.run ? 11 : 6;
      const moveDir = new THREE.Vector3();

      if (this.moveKeys.forward) moveDir.z -= 1;
      if (this.moveKeys.backward) moveDir.z += 1;
      if (this.moveKeys.left) moveDir.x -= 1;
      if (this.moveKeys.right) moveDir.x += 1;

      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yawObject.rotation.y);

      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      this.velocity.y -= 26 * delta;

      if (this.moveKeys.jump && this.isGrounded) {
        this.velocity.y = 8.5;
        this.isGrounded = false;
      }
    }

    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;
    this.position.y += this.velocity.y * delta;

    const feetBlock = this.world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y - 1.5),
      Math.floor(this.position.z)
    );

    if (feetBlock && feetBlock !== 'water') {
      this.position.y = Math.floor(this.position.y - 1.5) + 2.5;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    if (this.position.y < -10) {
      this.position.set(8, 35, 8);
      this.velocity.set(0, 0, 0);
    }
  }
}