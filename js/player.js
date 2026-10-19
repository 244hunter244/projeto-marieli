export class Player {
  constructor(camera, domElement, world) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;

    this.position = new THREE.Vector3(8, 35, 8);
    this.velocity = new THREE.Vector3();
    this.camera.position.copy(this.position);

    this.moveKeys = { forward: false, backward: false, left: false, right: false, jump: false, run: false };
    this.isGrounded = false;
    this.isLocked = false;

    this.initControls();
  }

  initControls() {
    try {
      this.domElement.addEventListener('click', () => {
        this.domElement.requestPointerLock();
      });

      document.addEventListener('pointerlockchange', () => {
        this.isLocked = document.pointerLockElement === this.domElement;
      });

      document.addEventListener('mousemove', (e) => {
        if (!this.isLocked) return;
        const sensitivity = 0.002;
        this.camera.rotation.y -= e.movementX * sensitivity;
        this.camera.rotation.x -= e.movementY * sensitivity;
        this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
      });

      window.addEventListener('keydown', (e) => this.handleKey(e.code, true));
      window.addEventListener('keyup', (e) => this.handleKey(e.code, false));
    } catch (e) {
      if (window.logGameError) window.logGameError("player.js -> initControls", e);
    }
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
    try {
      const speed = this.moveKeys.run ? 12 : 6;
      const moveDir = new THREE.Vector3();

      if (this.moveKeys.forward) moveDir.z -= 1;
      if (this.moveKeys.backward) moveDir.z += 1;
      if (this.moveKeys.left) moveDir.x -= 1;
      if (this.moveKeys.right) moveDir.x += 1;

      moveDir.normalize();
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.camera.rotation.y);

      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;

      // Gravidade
      this.velocity.y -= 25 * delta;

      if (this.moveKeys.jump && this.isGrounded) {
        this.velocity.y = 9;
        this.isGrounded = false;
      }

      // Projeção de posição e colisão vertical
      this.position.x += this.velocity.x * delta;
      this.position.z += this.velocity.z * delta;
      this.position.y += this.velocity.y * delta;

      const groundBlock = this.world.getBlock(this.position.x, this.position.y - 1.5, this.position.z);
      if (groundBlock) {
        this.position.y = Math.floor(this.position.y - 1.5) + 2.5;
        this.velocity.y = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }

      this.camera.position.copy(this.position);
    } catch (e) {
      if (window.logGameError) window.logGameError("player.js -> update", e);
    }
  }
}