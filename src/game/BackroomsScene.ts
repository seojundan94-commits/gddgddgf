import * as THREE from 'three';
import {
  CELL_SIZE,
  ENTITY_SPAWN,
  EXIT_DOOR_POS,
  INITIAL_ITEMS,
  MAZE_MAP,
  PLAYER_SPAWN,
  WALL_HEIGHT,
} from './mapData';
import {
  createCarpetTexture,
  createCeilingTexture,
  createExitDoorTexture,
  createWallpaperTexture,
} from './textures';
import { Difficulty, EntityState, ItemCollectible, PlayerStats } from './types';
import { soundManager } from '../audio/soundManager';

export class BackroomsScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;

  // Lighting
  private ambientLight: THREE.AmbientLight;
  private ceilingLights: { light: THREE.PointLight; baseIntensity: number; mesh: THREE.Mesh }[] = [];

  // Textures & Materials
  private wallMaterial: THREE.MeshStandardMaterial;
  private floorMaterial: THREE.MeshStandardMaterial;
  private ceilingMaterial: THREE.MeshStandardMaterial;
  private exitDoorMaterial: THREE.MeshStandardMaterial;

  // Player state
  private playerPos = new THREE.Vector3();
  private playerVelocity = new THREE.Vector3();
  private cameraYaw = 0;
  private cameraPitch = 0;
  private headBobTimer = 0;
  private isCrouching = false;
  private isSprinting = false;
  private stamina = 100;
  private sanity = 100;
  private difficulty: Difficulty = 'survivor';

  // Items
  private items: ItemCollectible[] = [];
  private itemMeshes: Map<string, THREE.Group | THREE.Mesh> = new Map();
  private exitDoorMesh: THREE.Group | null = null;
  private exitStatusLight: THREE.PointLight | null = null;

  // Entity
  private entityGroup: THREE.Group | null = null;
  private entityEyes: THREE.Mesh[] = [];
  private entityLight: THREE.PointLight | null = null;
  private entityTendrils: THREE.LineSegments[] = [];
  private entityPos = new THREE.Vector3();
  private entityState: EntityState = {
    x: 0,
    z: 0,
    rotationY: 0,
    state: 'patrol',
    speed: 2.2,
    distanceToPlayer: 100,
    hasLineOfSight: false,
    alertLevel: 0,
  };
  private entityPatrolTarget = new THREE.Vector3();
  private entitySearchTimer = 0;

  // Interaction
  private raycaster = new THREE.Raycaster();
  private centerScreen = new THREE.Vector2(0, 0);
  public hoveredItem: ItemCollectible | null = null;
  public isNearDoor = false;

  // Callbacks
  private onStatsUpdate?: (stats: PlayerStats) => void;
  private onEntityUpdate?: (state: EntityState) => void;
  private onJumpscare?: () => void;
  private onVictory?: () => void;
  private onInteractPrompt?: (prompt: string | null) => void;

  constructor(
    container: HTMLElement,
    difficulty: Difficulty,
    callbacks: {
      onStatsUpdate: (stats: PlayerStats) => void;
      onEntityUpdate: (state: EntityState) => void;
      onJumpscare: () => void;
      onVictory: () => void;
      onInteractPrompt: (prompt: string | null) => void;
    }
  ) {
    this.container = container;
    this.difficulty = difficulty;
    this.onStatsUpdate = callbacks.onStatsUpdate;
    this.onEntityUpdate = callbacks.onEntityUpdate;
    this.onJumpscare = callbacks.onJumpscare;
    this.onVictory = callbacks.onVictory;
    this.onInteractPrompt = callbacks.onInteractPrompt;

    this.items = JSON.parse(JSON.stringify(INITIAL_ITEMS));

    // Three Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#14120a');
    this.scene.fog = new THREE.FogExp2('#14120a', 0.038);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = false; // keep ultra smooth 60fps
    container.appendChild(this.renderer.domElement);

    // Build Materials
    const wallTex = createWallpaperTexture();
    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.05,
    });

    const carpetTex = createCarpetTexture();
    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.95,
      metalness: 0.02,
    });

    const ceilingTex = createCeilingTexture();
    this.ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTex,
      roughness: 0.9,
      metalness: 0.05,
    });

    const doorTex = createExitDoorTexture();
    this.exitDoorMaterial = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.6,
      metalness: 0.3,
    });

    // Lights - Sickly yellow ambient illumination from endless fluorescent tubes
    this.ambientLight = new THREE.AmbientLight(0xd4be7a, 0.75);
    this.scene.add(this.ambientLight);

    // Initialize map, entity, items
    this.buildMaze();
    this.spawnItems();
    this.createExitDoor();
    this.spawnEntity();

    // Set player start position
    this.playerPos.set(
      PLAYER_SPAWN.x * CELL_SIZE + CELL_SIZE / 2,
      1.7,
      PLAYER_SPAWN.z * CELL_SIZE + CELL_SIZE / 2
    );
    this.camera.position.copy(this.playerPos);

    // Resize listener
    window.addEventListener('resize', this.handleResize);

    // Start loop
    this.lastTime = performance.now();
    this.animate();
  }

  private handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private buildMaze() {
    const wallGeo = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, CELL_SIZE);
    const floorGeo = new THREE.PlaneGeometry(
      MAZE_MAP[0].length * CELL_SIZE,
      MAZE_MAP.length * CELL_SIZE
    );
    const ceilingGeo = new THREE.PlaneGeometry(
      MAZE_MAP[0].length * CELL_SIZE,
      MAZE_MAP.length * CELL_SIZE
    );

    // Floor
    const floorMesh = new THREE.Mesh(floorGeo, this.floorMaterial);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(
      (MAZE_MAP[0].length * CELL_SIZE) / 2,
      0,
      (MAZE_MAP.length * CELL_SIZE) / 2
    );
    this.scene.add(floorMesh);

    // Ceiling
    const ceilingMesh = new THREE.Mesh(ceilingGeo, this.ceilingMaterial);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.set(
      (MAZE_MAP[0].length * CELL_SIZE) / 2,
      WALL_HEIGHT,
      (MAZE_MAP.length * CELL_SIZE) / 2
    );
    this.scene.add(ceilingMesh);

    // Walls & Ceiling Fluorescent Fixtures
    const lightFixtureGeo = new THREE.BoxGeometry(1.6, 0.12, 0.6);
    const lightFixtureMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });

    for (let z = 0; z < MAZE_MAP.length; z++) {
      for (let x = 0; x < MAZE_MAP[z].length; x++) {
        const isWall = MAZE_MAP[z][x] === 1;
        const wx = x * CELL_SIZE + CELL_SIZE / 2;
        const wz = z * CELL_SIZE + CELL_SIZE / 2;

        if (isWall) {
          const wall = new THREE.Mesh(wallGeo, this.wallMaterial);
          wall.position.set(wx, WALL_HEIGHT / 2, wz);
          this.scene.add(wall);
        } else {
          // Place fluorescent fixtures every 3-4 tiles
          if (x % 3 === 1 && z % 3 === 1) {
            const fixture = new THREE.Mesh(lightFixtureGeo, lightFixtureMat);
            fixture.position.set(wx, WALL_HEIGHT - 0.06, wz);
            this.scene.add(fixture);

            // PointLight below fixture
            const pl = new THREE.PointLight(0xfff4d0, 1.8, 11, 1.8);
            pl.position.set(wx, WALL_HEIGHT - 0.4, wz);
            this.scene.add(pl);
            this.ceilingLights.push({
              light: pl,
              baseIntensity: 1.8,
              mesh: fixture,
            });
          }
        }
      }
    }
  }

  private spawnItems() {
    this.items.forEach((item) => {
      const group = new THREE.Group();
      const ix = item.x * CELL_SIZE + CELL_SIZE / 2;
      const iz = item.z * CELL_SIZE + CELL_SIZE / 2;

      if (item.type === 'tape') {
        // Black VHS cassette tape
        const tapeGeo = new THREE.BoxGeometry(0.5, 0.08, 0.3);
        const tapeMat = new THREE.MeshStandardMaterial({
          color: 0x111111,
          roughness: 0.4,
          metalness: 0.2,
        });
        const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);

        // White label
        const labelGeo = new THREE.BoxGeometry(0.35, 0.01, 0.18);
        const labelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const labelMesh = new THREE.Mesh(labelGeo, labelMat);
        labelMesh.position.y = 0.045;
        tapeMesh.add(labelMesh);

        // Subtle tape aura
        const auraLight = new THREE.PointLight(0x44ddff, 0.8, 2.5);
        auraLight.position.y = 0.2;
        group.add(auraLight);

        group.add(tapeMesh);
        group.position.set(ix, 0.6, iz);
      } else if (item.type === 'water') {
        // Almond Water Bottle
        const bottleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 12);
        const bottleMat = new THREE.MeshStandardMaterial({
          color: 0x98d4db,
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0.85,
        });
        const bottleMesh = new THREE.Mesh(bottleGeo, bottleMat);

        const waterLight = new THREE.PointLight(0x00e1d9, 0.6, 2.2);
        waterLight.position.y = 0.2;
        group.add(waterLight);

        group.add(bottleMesh);
        group.position.set(ix, 0.5, iz);
      } else if (item.type === 'note') {
        // Survivor Paper Note
        const noteGeo = new THREE.PlaneGeometry(0.35, 0.45);
        const noteMat = new THREE.MeshBasicMaterial({
          color: 0xf4ecd8,
          side: THREE.DoubleSide,
        });
        const noteMesh = new THREE.Mesh(noteGeo, noteMat);
        noteMesh.rotation.x = -Math.PI / 2;
        group.add(noteMesh);
        group.position.set(ix, 0.05, iz);
      }

      group.userData = { itemId: item.id };
      this.scene.add(group);
      this.itemMeshes.set(item.id, group);
    });
  }

  private createExitDoor() {
    this.exitDoorMesh = new THREE.Group();
    const dx = EXIT_DOOR_POS.x * CELL_SIZE + CELL_SIZE / 2;
    const dz = EXIT_DOOR_POS.z * CELL_SIZE + CELL_SIZE / 2;

    const doorGeo = new THREE.BoxGeometry(2.4, WALL_HEIGHT * 0.85, 0.3);
    const door = new THREE.Mesh(doorGeo, this.exitDoorMaterial);
    door.position.y = (WALL_HEIGHT * 0.85) / 2;
    this.exitDoorMesh.add(door);

    // Emergency Status Light above door (Red = locked, Green = 5 tapes collected)
    this.exitStatusLight = new THREE.PointLight(0xff2222, 2.5, 6.0);
    this.exitStatusLight.position.set(0, WALL_HEIGHT * 0.85 + 0.2, 0.4);
    this.exitDoorMesh.add(this.exitStatusLight);

    const bulbGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.copy(this.exitStatusLight.position);
    this.exitDoorMesh.add(bulb);

    this.exitDoorMesh.position.set(dx, 0, dz);
    this.scene.add(this.exitDoorMesh);
  }

  private spawnEntity() {
    this.entityGroup = new THREE.Group();
    this.entityPos.set(
      ENTITY_SPAWN.x * CELL_SIZE + CELL_SIZE / 2,
      0,
      ENTITY_SPAWN.z * CELL_SIZE + CELL_SIZE / 2
    );

    // The Entity: Towering wireframe/tendril figure (Bacteria entity from Kane Pixels lore)
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    
    // Spindly torso
    const torsoGeo = new THREE.CylinderGeometry(0.14, 0.22, 2.8, 6);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 1.6;
    this.entityGroup.add(torso);

    // Creepy head with hollow glowing red sockets
    const headGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 3.1;
    this.entityGroup.add(head);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
    
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.08, 3.12, 0.2);
    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.08, 3.12, 0.2);

    this.entityGroup.add(eyeLeft);
    this.entityGroup.add(eyeRight);
    this.entityEyes = [eyeLeft, eyeRight];

    // Ominous deep red light
    this.entityLight = new THREE.PointLight(0xff0000, 1.5, 5.5);
    this.entityLight.position.set(0, 3.1, 0.3);
    this.entityGroup.add(this.entityLight);

    // Writhing tendrils / limbs
    const wireMat = new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 });
    for (let i = 0; i < 6; i++) {
      const pts = [];
      const baseY = 1.0 + i * 0.35;
      pts.push(new THREE.Vector3(0, baseY, 0));
      pts.push(new THREE.Vector3((Math.random() - 0.5) * 1.4, baseY - 0.5, (Math.random() - 0.5) * 1.4));
      pts.push(new THREE.Vector3((Math.random() - 0.5) * 1.8, baseY - 1.2, (Math.random() - 0.5) * 1.8));

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineSegments(lineGeo, wireMat);
      this.entityGroup.add(line);
      this.entityTendrils.push(line);
    }

    this.entityGroup.position.copy(this.entityPos);
    this.scene.add(this.entityGroup);

    this.pickNewEntityPatrolTarget();
  }

  private pickNewEntityPatrolTarget() {
    // Pick a random open corridor in the maze
    const openCells: { x: number; z: number }[] = [];
    for (let z = 1; z < MAZE_MAP.length - 1; z++) {
      for (let x = 1; x < MAZE_MAP[z].length - 1; x++) {
        if (MAZE_MAP[z][x] === 0) {
          openCells.push({ x, z });
        }
      }
    }
    if (openCells.length > 0) {
      const pick = openCells[Math.floor(Math.random() * openCells.length)];
      this.entityPatrolTarget.set(
        pick.x * CELL_SIZE + CELL_SIZE / 2,
        0,
        pick.z * CELL_SIZE + CELL_SIZE / 2
      );
    }
  }

  public updateInput(controls: {
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    sprint: boolean;
    crouch: boolean;
    turnYaw: number;
    turnPitch: number;
  }) {
    // Rotation
    this.cameraYaw -= controls.turnYaw;
    this.cameraPitch = Math.max(-1.4, Math.min(1.4, this.cameraPitch - controls.turnPitch));

    this.isCrouching = controls.crouch;

    // Stamina & Sprint logic
    const wantsSprint = controls.sprint && !this.isCrouching && (controls.moveForward || controls.moveBackward || controls.moveLeft || controls.moveRight);
    if (wantsSprint && this.stamina > 5) {
      this.isSprinting = true;
    } else {
      this.isSprinting = false;
    }

    // Direction vector
    const forward = new THREE.Vector3(
      -Math.sin(this.cameraYaw),
      0,
      -Math.cos(this.cameraYaw)
    ).normalize();
    const right = new THREE.Vector3(
      Math.cos(this.cameraYaw),
      0,
      -Math.sin(this.cameraYaw)
    ).normalize();

    this.playerVelocity.set(0, 0, 0);

    const baseSpeed = this.isCrouching ? 1.6 : this.isSprinting ? 5.2 : 3.0;
    const diffMultiplier = this.difficulty === 'nightmare' ? 0.95 : 1.0;
    const speed = baseSpeed * diffMultiplier;

    if (controls.moveForward) this.playerVelocity.add(forward);
    if (controls.moveBackward) this.playerVelocity.sub(forward);
    if (controls.moveRight) this.playerVelocity.add(right);
    if (controls.moveLeft) this.playerVelocity.sub(right);

    if (this.playerVelocity.lengthSq() > 0) {
      this.playerVelocity.normalize().multiplyScalar(speed);
      soundManager.playFootstep(this.isSprinting, this.isCrouching);
    }
  }

  public interact(): { success: boolean; message: string; note?: ItemCollectible } {
    if (this.isNearDoor) {
      const tapesCount = this.items.filter((i) => i.type === 'tape' && i.collected).length;
      if (tapesCount >= 5) {
        soundManager.playExitDoorUnlocked();
        if (this.onVictory) this.onVictory();
        return { success: true, message: '탈출구 개방! 레벨 1로 진입합니다.' };
      } else {
        return {
          success: false,
          message: `탈출구가 잠겨 있습니다. VHS 기록 테이프가 더 필요합니다 (${tapesCount}/5).`,
        };
      }
    }

    if (this.hoveredItem) {
      const item = this.hoveredItem;
      item.collected = true;

      // Remove 3D mesh
      const mesh = this.itemMeshes.get(item.id);
      if (mesh) {
        this.scene.remove(mesh);
      }

      if (item.type === 'tape') {
        soundManager.playPickup();
        return {
          success: true,
          message: `${item.title}을(를) 회수했습니다.`,
          note: item,
        };
      } else if (item.type === 'water') {
        soundManager.playDrinkWater();
        this.sanity = Math.min(100, this.sanity + 40);
        this.stamina = Math.min(100, this.stamina + 50);
        return {
          success: true,
          message: '아몬드 워터를 마셨습니다. 정신력과 스태미나가 회복되었습니다!',
        };
      } else if (item.type === 'note') {
        soundManager.playPickup();
        return {
          success: true,
          message: `${item.title}을(를) 읽었습니다.`,
          note: item,
        };
      }
    }

    return { success: false, message: '' };
  }

  private checkCollision(newX: number, newZ: number, radius = 0.5): boolean {
    const minGridX = Math.floor((newX - radius) / CELL_SIZE);
    const maxGridX = Math.floor((newX + radius) / CELL_SIZE);
    const minGridZ = Math.floor((newZ - radius) / CELL_SIZE);
    const maxGridZ = Math.floor((newZ + radius) / CELL_SIZE);

    for (let gz = minGridZ; gz <= maxGridZ; gz++) {
      for (let gx = minGridX; gx <= maxGridX; gx++) {
        if (
          gz < 0 ||
          gz >= MAZE_MAP.length ||
          gx < 0 ||
          gx >= MAZE_MAP[0].length ||
          MAZE_MAP[gz][gx] === 1
        ) {
          return true; // Collided with wall
        }
      }
    }
    return false;
  }

  private lastTime = 0;

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.updatePlayer(dt);
    this.updateEntity(dt);
    this.updateFluorescentFlicker(now);
    this.updateItemsAnimation(now);
    this.updateRaycasting();
    this.updateStats(dt);

    this.renderer.render(this.scene, this.camera);
  };

  private updatePlayer(dt: number) {
    // Sliding collision check
    const stepX = this.playerVelocity.x * dt;
    const stepZ = this.playerVelocity.z * dt;

    if (!this.checkCollision(this.playerPos.x + stepX, this.playerPos.z)) {
      this.playerPos.x += stepX;
    }
    if (!this.checkCollision(this.playerPos.x, this.playerPos.z + stepZ)) {
      this.playerPos.z += stepZ;
    }

    // Camera height & Head bob
    const baseHeight = this.isCrouching ? 0.95 : 1.7;
    const isMoving = this.playerVelocity.lengthSq() > 0.1;
    if (isMoving) {
      const bobFreq = this.isSprinting ? 14 : this.isCrouching ? 6 : 9;
      this.headBobTimer += dt * bobFreq;
    }
    const bobOffset = isMoving ? Math.sin(this.headBobTimer) * 0.05 : 0;
    this.camera.position.set(this.playerPos.x, baseHeight + bobOffset, this.playerPos.z);

    // Apply rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.cameraYaw;
    this.camera.rotation.x = this.cameraPitch;
  }

  private updateEntity(dt: number) {
    if (!this.entityGroup) return;

    const dx = this.playerPos.x - this.entityPos.x;
    const dz = this.playerPos.z - this.entityPos.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);
    this.entityState.distanceToPlayer = distToPlayer;

    // Line of sight check: Raycast from entity to player
    const entityEyePos = new THREE.Vector3(this.entityPos.x, 2.8, this.entityPos.z);
    const toPlayer = this.camera.position.clone().sub(entityEyePos);
    const rayDist = toPlayer.length();
    toPlayer.normalize();

    this.raycaster.set(entityEyePos, toPlayer);
    this.raycaster.far = rayDist;

    // Check if line passes through walls
    const sightIntersects = this.raycaster.intersectObjects(
      this.scene.children.filter((c) => c !== this.entityGroup && c.type === 'Mesh')
    );
    const hasSight = sightIntersects.length === 0;
    this.entityState.hasLineOfSight = hasSight;

    // Player running sound detection
    const heardPlayer = this.isSprinting && distToPlayer < (this.difficulty === 'nightmare' ? 32 : 22);

    // AI State Machine
    let target = this.entityPatrolTarget;
    let targetSpeed = 2.0;

    if (this.difficulty === 'nightmare') targetSpeed = 2.8;

    if (distToPlayer < 2.0) {
      // JUMPSCARE & GAME OVER!
      this.entityState.state = 'attack';
      soundManager.playJumpscare();
      if (this.onJumpscare) this.onJumpscare();
      return;
    }

    if (hasSight && distToPlayer < 18) {
      if (this.entityState.state !== 'chase') {
        soundManager.playEntityRoar();
      }
      this.entityState.state = 'chase';
      targetSpeed = this.difficulty === 'nightmare' ? 5.6 : 4.4;
      target = this.playerPos;
      this.entityState.alertLevel = 1.0;
    } else if (heardPlayer) {
      this.entityState.state = 'investigate';
      targetSpeed = 3.4;
      target = this.playerPos;
      this.entityState.alertLevel = Math.min(1.0, this.entityState.alertLevel + 0.3 * dt);
    } else {
      // Return to patrol
      this.entityState.state = 'patrol';
      this.entityState.alertLevel = Math.max(0, this.entityState.alertLevel - 0.1 * dt);

      // If reached target, pick new patrol target
      const distToTarget = this.entityPos.distanceTo(this.entityPatrolTarget);
      if (distToTarget < 2.0) {
        this.entitySearchTimer += dt;
        if (this.entitySearchTimer > 1.5) {
          this.pickNewEntityPatrolTarget();
          this.entitySearchTimer = 0;
        }
      }
    }

    // Move toward target
    const moveDir = target.clone().sub(this.entityPos);
    moveDir.y = 0;
    if (moveDir.lengthSq() > 0.05) {
      moveDir.normalize();

      const nextX = this.entityPos.x + moveDir.x * targetSpeed * dt;
      const nextZ = this.entityPos.z + moveDir.z * targetSpeed * dt;

      // Entity path collision check
      if (!this.checkCollision(nextX, nextZ, 0.4)) {
        this.entityPos.x = nextX;
        this.entityPos.z = nextZ;
      } else {
        // Slide or repath
        if (!this.checkCollision(nextX, this.entityPos.z, 0.4)) {
          this.entityPos.x = nextX;
        } else if (!this.checkCollision(this.entityPos.x, nextZ, 0.4)) {
          this.entityPos.z = nextZ;
        } else {
          this.pickNewEntityPatrolTarget();
        }
      }

      // Rotate to face movement direction
      const angle = Math.atan2(moveDir.x, moveDir.z);
      this.entityGroup.rotation.y = angle;
    }

    this.entityGroup.position.copy(this.entityPos);

    // Writhing tendril animation
    const time = performance.now() * 0.005;
    this.entityTendrils.forEach((tendril, i) => {
      const posAttr = tendril.geometry.attributes.position;
      const wave = Math.sin(time * 2 + i) * 0.15;
      posAttr.setX(1, (posAttr.getX(1) || 0) + wave * 0.02);
      posAttr.needsUpdate = true;
    });

    // Sound proximity
    soundManager.updateEntityProximity(distToPlayer, 28);
    soundManager.updateHeartbeat(this.sanity, distToPlayer);

    if (this.onEntityUpdate) {
      this.onEntityUpdate(this.entityState);
    }
  }

  private updateFluorescentFlicker(now: number) {
    this.ceilingLights.forEach((item, idx) => {
      // Individual random flicker
      const flickerSeed = Math.sin(now * 0.003 + idx * 7.7);
      if (flickerSeed > 0.94) {
        item.light.intensity = item.baseIntensity * (Math.random() < 0.5 ? 0.1 : 0.4);
      } else {
        item.light.intensity = item.baseIntensity;
      }
    });

    // Exit door light color
    const collectedCount = this.items.filter((i) => i.type === 'tape' && i.collected).length;
    if (this.exitStatusLight) {
      if (collectedCount >= 5) {
        this.exitStatusLight.color.setHex(0x00ff44);
        this.exitStatusLight.intensity = 3.5;
      } else {
        this.exitStatusLight.color.setHex(0xff2222);
        // Subtle blink
        this.exitStatusLight.intensity = Math.sin(now * 0.004) > 0 ? 2.5 : 0.8;
      }
    }
  }

  private updateItemsAnimation(now: number) {
    const floatOffset = Math.sin(now * 0.003) * 0.08;
    this.itemMeshes.forEach((mesh) => {
      mesh.position.y += floatOffset * 0.02;
      mesh.rotation.y += 0.015;
    });
  }

  private updateRaycasting() {
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    this.raycaster.far = 3.2;

    const interactiveMeshes = Array.from(this.itemMeshes.values());
    if (this.exitDoorMesh) interactiveMeshes.push(this.exitDoorMesh);

    const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

    if (intersects.length > 0) {
      const topObj = intersects[0].object;
      
      // Check if exit door
      let parent: THREE.Object3D | null = topObj;
      let isDoor = false;
      let itemId: string | null = null;

      while (parent) {
        if (parent === this.exitDoorMesh) {
          isDoor = true;
          break;
        }
        if (parent.userData?.itemId) {
          itemId = parent.userData.itemId;
          break;
        }
        parent = parent.parent;
      }

      if (isDoor) {
        this.isNearDoor = true;
        this.hoveredItem = null;
        const tapesCount = this.items.filter((i) => i.type === 'tape' && i.collected).length;
        if (this.onInteractPrompt) {
          if (tapesCount >= 5) {
            this.onInteractPrompt('[ E / 터치 ] 비상 탈출구 열기 (탈출 가능)');
          } else {
            this.onInteractPrompt(`[ E / 터치 ] 비상 탈출구 (잠김: 테이프 ${tapesCount}/5 필요)`);
          }
        }
        return;
      }

      if (itemId) {
        const found = this.items.find((i) => i.id === itemId && !i.collected);
        if (found) {
          this.hoveredItem = found;
          this.isNearDoor = false;
          if (this.onInteractPrompt) {
            this.onInteractPrompt(`[ E / 터치 ] ${found.title} 획득`);
          }
          return;
        }
      }
    }

    this.isNearDoor = false;
    this.hoveredItem = null;
    if (this.onInteractPrompt) {
      this.onInteractPrompt(null);
    }
  }

  private updateStats(dt: number) {
    // Stamina
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - dt * 25);
    } else {
      const recoverRate = this.isCrouching ? 20 : 12;
      this.stamina = Math.min(100, this.stamina + dt * recoverRate);
    }

    // Sanity drain: Near entity or looking at entity
    let sanityDrain = 0.2; // base eerie atmosphere drain
    if (this.entityState.distanceToPlayer < 15) {
      sanityDrain += (15 - this.entityState.distanceToPlayer) * 0.9;
    }
    if (this.entityState.hasLineOfSight && this.entityState.distanceToPlayer < 12) {
      sanityDrain += 4.0;
    }
    this.sanity = Math.max(0, this.sanity - dt * sanityDrain);

    if (this.onStatsUpdate) {
      const tapesCollected = this.items.filter((i) => i.type === 'tape' && i.collected).length;
      const notesCollected = this.items.filter((i) => i.type === 'note' && i.collected).length;
      this.onStatsUpdate({
        stamina: this.stamina,
        maxStamina: 100,
        sanity: this.sanity,
        tapesCollected,
        totalTapes: 5,
        notesCollected,
      });
    }
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    // Geometries & Materials dispose
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
