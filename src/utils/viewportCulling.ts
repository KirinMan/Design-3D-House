/**
 * Viewport Culling System - Culls objects outside camera view
 * Implements performance optimization by not rendering objects outside the viewport
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2
 */

import * as THREE from "three";

/**
 * Culling result for an object
 */
export interface CullingResult {
  visible: boolean;
  reason?: "frustum" | "distance" | "occlusion" | "size";
  distance?: number;
  screenSize?: number;
}

/**
 * Culling configuration
 */
export interface CullingConfig {
  enableFrustumCulling: boolean;
  enableDistanceCulling: boolean;
  enableOcclusionCulling: boolean;
  enableSizeCulling: boolean;
  maxDistance: number;
  minScreenSize: number; // Minimum size in pixels to render
  occlusionTestSamples: number;
}

/**
 * Default culling configuration
 */
const DEFAULT_CULLING_CONFIG: CullingConfig = {
  enableFrustumCulling: true,
  enableDistanceCulling: true,
  enableOcclusionCulling: false, // Expensive, disabled by default
  enableSizeCulling: true,
  maxDistance: 200,
  minScreenSize: 2, // 2 pixels minimum
  occlusionTestSamples: 4,
};

/**
 * Viewport Culling Manager
 */
export class ViewportCullingManager {
  private camera: THREE.Camera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private frustum: THREE.Frustum = new THREE.Frustum();
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private config: CullingConfig;

  // Performance tracking
  private stats = {
    totalObjects: 0,
    visibleObjects: 0,
    frustumCulled: 0,
    distanceCulled: 0,
    sizeCulled: 0,
    occlusionCulled: 0,
  };

  // Temporary objects for calculations
  private tempVector3 = new THREE.Vector3();
  private tempBox3 = new THREE.Box3();
  private tempSphere = new THREE.Sphere();

  constructor(config?: Partial<CullingConfig>) {
    this.config = { ...DEFAULT_CULLING_CONFIG, ...config };
  }

  /**
   * Set the camera for culling calculations
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
    this.updateFrustum();
  }

  /**
   * Set the renderer for screen size calculations
   */
  setRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
  }

  /**
   * Update culling configuration
   */
  updateConfig(config: Partial<CullingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update frustum from camera
   */
  private updateFrustum(): void {
    if (!this.camera) return;

    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Test if an object should be culled
   */
  cullObject(object: THREE.Object3D): CullingResult {
    if (!this.camera) {
      return { visible: true };
    }

    // Update frustum if camera has moved
    this.updateFrustum();

    // Get object bounding box
    this.tempBox3.setFromObject(object);

    // Skip culling for empty bounding boxes
    if (this.tempBox3.isEmpty()) {
      return { visible: true };
    }

    // Frustum culling
    if (this.config.enableFrustumCulling) {
      if (!this.frustum.intersectsBox(this.tempBox3)) {
        return { visible: false, reason: "frustum" };
      }
    }

    // Distance culling
    if (this.config.enableDistanceCulling) {
      this.tempBox3.getCenter(this.tempVector3);
      const distance = this.tempVector3.distanceTo(this.camera.position);

      if (distance > this.config.maxDistance) {
        return { visible: false, reason: "distance", distance };
      }
    }

    // Size culling (screen space size)
    if (this.config.enableSizeCulling && this.renderer) {
      const screenSize = this.calculateScreenSize(object);

      if (screenSize < this.config.minScreenSize) {
        return { visible: false, reason: "size", screenSize };
      }
    }

    // Occlusion culling (expensive, optional)
    if (this.config.enableOcclusionCulling) {
      if (this.isOccluded(object)) {
        return { visible: false, reason: "occlusion" };
      }
    }

    return { visible: true };
  }

  /**
   * Calculate screen space size of an object
   */
  private calculateScreenSize(object: THREE.Object3D): number {
    if (!this.camera || !this.renderer) return Infinity;

    // Get object bounding sphere
    this.tempBox3.setFromObject(object);
    this.tempBox3.getBoundingSphere(this.tempSphere);

    // Project sphere center to screen space
    this.tempVector3.copy(this.tempSphere.center);
    this.tempVector3.project(this.camera);

    // Calculate screen space radius
    const distance = this.tempSphere.center.distanceTo(this.camera.position);
    const fov = (this.camera as THREE.PerspectiveCamera).fov || 50;
    const screenHeight = this.renderer.getSize(new THREE.Vector2()).y;

    // Approximate screen space size
    const screenRadius =
      (this.tempSphere.radius * screenHeight) /
      (2 * distance * Math.tan(THREE.MathUtils.degToRad(fov / 2)));

    return screenRadius * 2; // Return diameter
  }

  /**
   * Test if an object is occluded by other objects
   * This is a simplified occlusion test - in practice, you'd use more sophisticated methods
   */
  private isOccluded(object: THREE.Object3D): boolean {
    if (!this.camera) return false;

    // This is a placeholder for occlusion testing
    // Real occlusion culling would require:
    // 1. Depth buffer analysis
    // 2. Occlusion queries
    // 3. Hierarchical Z-buffer
    // 4. Portal/zone systems

    // For now, we'll do a simple ray-based test
    this.tempBox3.setFromObject(object);
    this.tempBox3.getCenter(this.tempVector3);

    const direction = this.tempVector3
      .clone()
      .sub(this.camera.position)
      .normalize();
    const distance = this.tempVector3.distanceTo(this.camera.position);

    // Cast rays from camera to object center
    const raycaster = new THREE.Raycaster(this.camera.position, direction);

    // This would need access to all scene objects to test intersections
    // For now, return false (not occluded)
    return false;
  }

  /**
   * Cull all objects in a scene
   */
  cullScene(scene: THREE.Scene): void {
    this.resetStats();
    this.traverseAndCull(scene);
  }

  /**
   * Recursively traverse and cull objects
   */
  private traverseAndCull(object: THREE.Object3D): void {
    // Skip non-mesh objects and already invisible objects
    if (!(object instanceof THREE.Mesh) || !object.visible) {
      object.children.forEach((child) => this.traverseAndCull(child));
      return;
    }

    this.stats.totalObjects++;

    const cullingResult = this.cullObject(object);

    if (cullingResult.visible) {
      this.stats.visibleObjects++;
      object.visible = true;
    } else {
      object.visible = false;

      // Update stats based on culling reason
      switch (cullingResult.reason) {
        case "frustum":
          this.stats.frustumCulled++;
          break;
        case "distance":
          this.stats.distanceCulled++;
          break;
        case "size":
          this.stats.sizeCulled++;
          break;
        case "occlusion":
          this.stats.occlusionCulled++;
          break;
      }
    }

    // Continue traversing children
    object.children.forEach((child) => this.traverseAndCull(child));
  }

  /**
   * Get culling statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    totalObjects: number;
    visibleObjects: number;
    cullingRatio: number;
    cullingBreakdown: {
      frustum: number;
      distance: number;
      size: number;
      occlusion: number;
    };
  } {
    const total = this.stats.totalObjects;
    const cullingRatio =
      total > 0 ? (total - this.stats.visibleObjects) / total : 0;

    return {
      totalObjects: total,
      visibleObjects: this.stats.visibleObjects,
      cullingRatio,
      cullingBreakdown: {
        frustum: this.stats.frustumCulled,
        distance: this.stats.distanceCulled,
        size: this.stats.sizeCulled,
        occlusion: this.stats.occlusionCulled,
      },
    };
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      totalObjects: 0,
      visibleObjects: 0,
      frustumCulled: 0,
      distanceCulled: 0,
      sizeCulled: 0,
      occlusionCulled: 0,
    };
  }
}

/**
 * Hierarchical Culling System for large scenes
 */
export class HierarchicalCullingManager extends ViewportCullingManager {
  private spatialGrid: Map<string, THREE.Object3D[]> = new Map();
  private gridSize: number = 10;

  constructor(config?: Partial<CullingConfig>, gridSize: number = 10) {
    super(config);
    this.gridSize = gridSize;
  }

  /**
   * Add object to spatial grid
   */
  addToSpatialGrid(object: THREE.Object3D): void {
    const gridKey = this.getGridKey(object.position);

    if (!this.spatialGrid.has(gridKey)) {
      this.spatialGrid.set(gridKey, []);
    }

    this.spatialGrid.get(gridKey)!.push(object);
  }

  /**
   * Remove object from spatial grid
   */
  removeFromSpatialGrid(object: THREE.Object3D): void {
    const gridKey = this.getGridKey(object.position);
    const gridCell = this.spatialGrid.get(gridKey);

    if (gridCell) {
      const index = gridCell.indexOf(object);
      if (index !== -1) {
        gridCell.splice(index, 1);
      }

      if (gridCell.length === 0) {
        this.spatialGrid.delete(gridKey);
      }
    }
  }

  /**
   * Cull scene using hierarchical approach
   */
  cullSceneHierarchical(scene: THREE.Scene): void {
    if (!this.camera) return;

    this.resetStats();

    // Get visible grid cells
    const visibleCells = this.getVisibleGridCells();

    // Only cull objects in visible cells
    visibleCells.forEach((cellKey) => {
      const objects = this.spatialGrid.get(cellKey);
      if (objects) {
        objects.forEach((object) => {
          this.stats.totalObjects++;
          const cullingResult = this.cullObject(object);

          if (cullingResult.visible) {
            this.stats.visibleObjects++;
            object.visible = true;
          } else {
            object.visible = false;
            this.updateStatsForCulling(cullingResult.reason);
          }
        });
      }
    });

    // Hide objects in non-visible cells
    this.spatialGrid.forEach((objects, cellKey) => {
      if (!visibleCells.has(cellKey)) {
        objects.forEach((object) => {
          this.stats.totalObjects++;
          this.stats.frustumCulled++;
          object.visible = false;
        });
      }
    });
  }

  /**
   * Get grid key for a position
   */
  private getGridKey(position: THREE.Vector3): string {
    const x = Math.floor(position.x / this.gridSize);
    const z = Math.floor(position.z / this.gridSize);
    return `${x},${z}`;
  }

  /**
   * Get visible grid cells based on camera frustum
   */
  private getVisibleGridCells(): Set<string> {
    const visibleCells = new Set<string>();

    if (!this.camera) return visibleCells;

    // Get frustum corners in world space
    const frustumCorners = this.getFrustumCorners();

    // Find grid cells that intersect with frustum
    const minX = Math.min(...frustumCorners.map((p) => p.x));
    const maxX = Math.max(...frustumCorners.map((p) => p.x));
    const minZ = Math.min(...frustumCorners.map((p) => p.z));
    const maxZ = Math.max(...frustumCorners.map((p) => p.z));

    const startGridX = Math.floor(minX / this.gridSize);
    const endGridX = Math.floor(maxX / this.gridSize);
    const startGridZ = Math.floor(minZ / this.gridSize);
    const endGridZ = Math.floor(maxZ / this.gridSize);

    for (let x = startGridX; x <= endGridX; x++) {
      for (let z = startGridZ; z <= endGridZ; z++) {
        visibleCells.add(`${x},${z}`);
      }
    }

    return visibleCells;
  }

  /**
   * Get frustum corners in world space
   */
  private getFrustumCorners(): THREE.Vector3[] {
    // This is a simplified version - real implementation would calculate
    // actual frustum corners based on camera parameters
    const corners: THREE.Vector3[] = [];

    if (this.camera instanceof THREE.PerspectiveCamera) {
      const distance = 100; // Max culling distance
      const fov = THREE.MathUtils.degToRad(this.camera.fov);
      const aspect = this.camera.aspect;

      const height = 2 * Math.tan(fov / 2) * distance;
      const width = height * aspect;

      // Calculate corners relative to camera
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
        this.camera.quaternion
      );
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
        this.camera.quaternion
      );
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(
        this.camera.quaternion
      );

      const center = this.camera.position
        .clone()
        .add(forward.clone().multiplyScalar(distance));

      corners.push(
        center
          .clone()
          .add(right.clone().multiplyScalar(width / 2))
          .add(up.clone().multiplyScalar(height / 2)),
        center
          .clone()
          .add(right.clone().multiplyScalar(-width / 2))
          .add(up.clone().multiplyScalar(height / 2)),
        center
          .clone()
          .add(right.clone().multiplyScalar(-width / 2))
          .add(up.clone().multiplyScalar(-height / 2)),
        center
          .clone()
          .add(right.clone().multiplyScalar(width / 2))
          .add(up.clone().multiplyScalar(-height / 2))
      );
    }

    return corners;
  }

  /**
   * Update stats based on culling reason
   */
  private updateStatsForCulling(reason?: string): void {
    switch (reason) {
      case "frustum":
        this.stats.frustumCulled++;
        break;
      case "distance":
        this.stats.distanceCulled++;
        break;
      case "size":
        this.stats.sizeCulled++;
        break;
      case "occlusion":
        this.stats.occlusionCulled++;
        break;
    }
  }

  /**
   * Clear spatial grid
   */
  clearSpatialGrid(): void {
    this.spatialGrid.clear();
  }
}

/**
 * Global culling manager instance
 */
export const cullingManager = new ViewportCullingManager();
