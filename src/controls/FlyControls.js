import * as THREE from 'three';

/**
 * FlyControls - First-person flight controls for exploring the fractal scene
 *
 * Controls:
 * - WASD: Move forward/left/backward/right
 * - Space: Move up
 * - Shift: Move down
 * - Mouse: Look around (click to lock pointer)
 * - O: Reset camera position
 */
export class FlyControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Movement state
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;

    // Movement parameters
    this.movementSpeed = 2.0;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    // Mouse look parameters
    this.lookSpeed = 0.002;
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.isPointerLocked = false;

    // Store initial position for reset
    this.initialPosition = this.camera.position.clone();
    this.initialRotation = this.camera.rotation.clone();

    // Bind methods
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onPointerLockError = this.onPointerLockError.bind(this);

    // Set up event listeners
    this.connect();
  }

  connect() {
    // Keyboard events
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);

    // Mouse events
    this.domElement.addEventListener('click', () => {
      this.domElement.requestPointerLock();
    });

    // Pointer lock events
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('pointerlockerror', this.onPointerLockError);
  }

  disconnect() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('pointerlockerror', this.onPointerLockError);
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'Space':
        this.moveUp = true;
        event.preventDefault();
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = true;
        break;
      case 'KeyR':
        this.reset();
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'Space':
        this.moveUp = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = false;
        break;
    }
  }

  onMouseMove(event) {
    if (!this.isPointerLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= movementX * this.lookSpeed;
    this.euler.x -= movementY * this.lookSpeed;

    // Clamp vertical rotation
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  }

  onPointerLockChange() {
    if (document.pointerLockElement === this.domElement) {
      this.isPointerLocked = true;
      document.addEventListener('mousemove', this.onMouseMove);
    } else {
      this.isPointerLocked = false;
      document.removeEventListener('mousemove', this.onMouseMove);
    }
  }

  onPointerLockError() {
    console.error('Pointer lock error');
  }

  reset() {
    this.camera.position.copy(this.initialPosition);
    this.camera.rotation.copy(this.initialRotation);
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.velocity.set(0, 0, 0);
  }

  update(delta) {
    // Damping for smooth movement
    const damping = 0.9;
    this.velocity.x *= damping;
    this.velocity.z *= damping;
    this.velocity.y *= damping;

    // Calculate movement direction
    this.direction.set(0, 0, 0);

    if (this.moveForward) this.direction.z -= 1;
    if (this.moveBackward) this.direction.z += 1;
    if (this.moveLeft) this.direction.x -= 1;
    if (this.moveRight) this.direction.x += 1;
    if (this.moveUp) this.direction.y += 1;
    if (this.moveDown) this.direction.y -= 1;

    // Normalize direction
    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Apply movement in camera's local space
    const moveVector = new THREE.Vector3();

    // Forward/backward and left/right in camera's horizontal plane
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0; // Keep movement on horizontal plane
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    right.normalize();

    // Calculate final movement vector
    moveVector.addScaledVector(forward, -this.direction.z);
    moveVector.addScaledVector(right, this.direction.x);
    moveVector.y += this.direction.y; // Vertical movement is absolute

    // Apply acceleration
    this.velocity.addScaledVector(moveVector, this.movementSpeed * delta);

    // Apply velocity to camera position
    this.camera.position.addScaledVector(this.velocity, delta * 60);

    // Update camera matrix
    this.camera.updateMatrixWorld();
  }

  setMovementSpeed(speed) {
    this.movementSpeed = speed;
  }

  setLookSpeed(speed) {
    this.lookSpeed = speed;
  }
}
