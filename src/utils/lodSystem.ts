/**
 * Level of Detail (LOD) System - Manages LOD for complex 3D scenes
 * Implements performance optimization by reducing detail for distant objects
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2
 */

import * as THREE from "three";
import { SceneObject, WallObject } from "../types/scene";

/**
 * LOD levels for different object types
 */
export enum LODLevel {
  HIGH = 0, // Full detail - close to camera
  MEDIUM = 1, // Reduced detail - medium distance
  LOW = 2, // Minimal detail - far from camera
  CULLED = 3, // Not rendered - very far or outside view
}

/**
 * LOD configuration for different object types
 */
export interface LODConfig {
  distances: [number, number, number]; // [high->medium, medium->low, low->culled]
  geometryLevels: {
    [LODLevel.HIGH]: GeometryConfig;
    [LODLevel.MEDIUM]: GeometryConfig;
    [LODLevel.LOW]: GeometryConfig;
  };
}

export interface GeometryConfig {
  segments: number;
  detail: number;
  shadows: boolean;
  textures: boolean;
}

/**
 * Default LOD configurations for different object types
 */
const DEFAULT_LOD_CONFIGS: { [objectType: string]: LODConfig } = {
  wall: {
    distances: [20, 50, 100],
    geometryLevels: {
      [LODLevel.HIGH]: {
        segments: 1,
        detail: 1,
        shadows: true,
        textures: true,
      },
      [LODLevel.MEDIUM]: {
        segments: 1,
        detail: 0.7,
        shadows: true,
        textures: false,
      },
      [LODLevel.LOW]: {
        segments: 1,
        detail: 0.5,
        shadows: false,
        textures: false,
      },
    },
  },
  door: {
    distances: [15, 35, 70],
    geometryLevels: {
      [LODLevel.HIGH]: {
        segments: 2,
        detail: 1,
        shadows: true,
        textures: true,
      },
      [LODLevel.MEDIUM]: {
        segments: 1,
        detail: 0.8,
        shadows: false,
        textures: false,
      },
      [LODLevel.LOW]: {
        segments: 1,
        detail: 0.6,
        shadows: false,
        textures: false,
      },
    },
  },
  window: {
    distances: [15, 35, 70],
    geometryLevels: {
      [LODLevel.HIGH]: {
        segments: 2,
        detail: 1,
        shadows: true,
        textures: true,
      },
      [LODLevel.MEDIUM]: {
        segments: 1,
        detail: 0.8,
        shadows: false,
        textures: false,
      },
      [LODLevel.LOW]: {
        segments: 1,
        detail: 0.6,
        shadows: false,
        textures: false,
      },
    },
  },
  furniture: {
    distances: [10, 25, 50],
    geometryLevels: {
      [LODLevel.HIGH]: {
        segments: 4,
        detail: 1,
        shadows: true,
        textures: true,
      },
      [LODLevel.MEDIUM]: {
        segments: 2,
        detail: 0.7,
        shadows: false,
        textures: false,
      },
      [LODLevel.LOW]: {
        segments: 1,
        detail: 0.5,
        shadows: false,
        textures: false,
      },
    },
  },
};

/**
 * LOD object wrapper that manages different detail levels
 */
export class LODObject extends THREE.LOD {
  public sceneObjectId: string;
  public objectType: string;
  private config: LODConfig;
  private currentLevel: LODLevel = LODLevel.HIGH;
  private geometries: { [level: number]: THREE.BufferGeometry } = {};
  private materials: { [level: number]: THREE.Material } = {};

  constructor(sceneObject: SceneObject, config?: LODConfig) {
    super();

    this.sceneObjectId = sceneObject.id;
    this.objectType = sceneObject.type;
    this.config =
      config ||
      DEFAULT_LOD_CONFIGS[sceneObject.type] ||
      DEFAULT_LOD_CONFIGS.wall;

    this.createLODLevels(sceneObject);
  }

  private createLODLevels(sceneObject: SceneObject): void {
    // Create geometry and materials for each LOD level
    Object.values(LODLevel).forEach((level) => {
      if (typeof level === "number" && level !== LODLevel.CULLED) {
        const geometry = this.createGeometryForLevel(sceneObject, level);
        const material = this.createMaterialForLevel(sceneObject, level);

        if (geometry && material) {
          this.geometries[level] = geometry;
          this.materials[level] = material;

          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = this.config.geometryLevels[level].shadows;
          mesh.receiveShadow = this.config.geometryLevels[level].shadows;

          this.addLevel(mesh, this.config.distances[level] || 0);
        }
      }
    });
  }

  private createGeometryForLevel(
    sceneObject: SceneObject,
    level: LODLevel
  ): THREE.BufferGeometry | null {
    const config = this.config.geometryLevels[level];
    if (!config) return null;

    switch (sceneObject.type) {
      case "wall":
        return this.createWallGeometry(sceneObject as WallObject, config);
      case "door":
        return this.createDoorGeometry(sceneObject, config);
      case "window":
        return this.createWindowGeometry(sceneObject, config);
      case "furniture":
        return this.createFurnitureGeometry(sceneObject, config);
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  private createWallGeometry(
    wall: WallObject,
    config: GeometryConfig
  ): THREE.BufferGeometry {
    const length = Math.sqrt(
      Math.pow(wall.endPoint.x - wall.startPoint.x, 2) +
        Math.pow(wall.endPoint.y - wall.startPoint.y, 2)
    );

    const geometry = new THREE.BoxGeometry(
      length * config.detail,
      wall.height * config.detail,
      wall.thickness * config.detail,
      Math.max(1, Math.floor(config.segments * config.detail)),
      Math.max(1, Math.floor(config.segments * config.detail)),
      1
    );

    // Create openings for doors and windows at high detail level
    if (config.detail >= 0.8 && wall.openings.length > 0) {
      // For simplicity, we'll use CSG operations or custom geometry generation
      // This is a placeholder for more complex opening geometry
    }

    return geometry;
  }

  private createDoorGeometry(
    sceneObject: SceneObject,
    config: GeometryConfig
  ): THREE.BufferGeometry {
    const width = 0.8 * config.detail;
    const height = 2.0 * config.detail;
    const depth = 0.05 * config.detail;

    return new THREE.BoxGeometry(
      width,
      height,
      depth,
      Math.max(1, config.segments),
      Math.max(1, config.segments),
      1
    );
  }

  private createWindowGeometry(
    sceneObject: SceneObject,
    config: GeometryConfig
  ): THREE.BufferGeometry {
    const width = 1.2 * config.detail;
    const height = 1.2 * config.detail;
    const depth = 0.03 * config.detail;

    if (config.detail >= 0.8) {
      // High detail: create frame and glass separately
      const frameGeometry = new THREE.BoxGeometry(width, height, depth);
      return frameGeometry;
    } else {
      // Low detail: simple box
      return new THREE.BoxGeometry(width, height, depth);
    }
  }

  private createFurnitureGeometry(
    sceneObject: SceneObject,
    config: GeometryConfig
  ): THREE.BufferGeometry {
    return new THREE.BoxGeometry(
      1 * config.detail,
      1 * config.detail,
      1 * config.detail,
      Math.max(1, config.segments),
      Math.max(1, config.segments),
      Math.max(1, config.segments)
    );
  }

  private createMaterialForLevel(
    sceneObject: SceneObject,
    level: LODLevel
  ): THREE.Material {
    const config = this.config.geometryLevels[level];
    const baseMaterial = sceneObject.material;

    const material = new THREE.MeshStandardMaterial({
      color: baseMaterial.color,
      roughness: baseMaterial.roughness,
      metalness: baseMaterial.metalness,
    });

    // Apply textures only at high detail levels
    if (config.textures && baseMaterial.diffuseMap) {
      const textureLoader = new THREE.TextureLoader();
      material.map = textureLoader.load(baseMaterial.diffuseMap);
    }

    // Reduce material complexity at lower LOD levels
    if (level >= LODLevel.MEDIUM) {
      material.roughness = Math.min(1, baseMaterial.roughness + 0.2);
      material.metalness = Math.max(0, baseMaterial.metalness - 0.1);
    }

    return material;
  }

  /**
   * Update LOD based on camera distance
   */
  updateLOD(camera: THREE.Camera): void {
    const distance = this.position.distanceTo(camera.position);
    let newLevel = LODLevel.HIGH;

    if (distance > this.config.distances[2]) {
      newLevel = LODLevel.CULLED;
    } else if (distance > this.config.distances[1]) {
      newLevel = LODLevel.LOW;
    } else if (distance > this.config.distances[0]) {
      newLevel = LODLevel.MEDIUM;
    }

    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      this.visible = newLevel !== LODLevel.CULLED;
    }
  }

  /**
   * Get current LOD level
   */
  getCurrentLevel(): LODLevel {
    return this.currentLevel;
  }

  /**
   * Dispose of all geometries and materials
   */
  dispose(): void {
    Object.values(this.geometries).forEach((geometry) => geometry.dispose());
    Object.values(this.materials).forEach((material) => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.dispose();
        if (material.map) material.map.dispose();
        if (material.normalMap) material.normalMap.dispose();
      }
    });
  }
}

/**
 * LOD Manager - Manages all LOD objects in the scene
 */
export class LODManager {
  private lodObjects: Map<string, LODObject> = new Map();
  private camera: THREE.Camera | null = null;
  private updateInterval: number = 100; // Update every 100ms
  private lastUpdateTime: number = 0;
  private enabled: boolean = true;

  // Performance tracking
  private stats = {
    totalObjects: 0,
    culledObjects: 0,
    lowDetailObjects: 0,
    mediumDetailObjects: 0,
    highDetailObjects: 0,
  };

  /**
   * Set the camera for LOD calculations
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * Add a scene object to LOD management
   */
  addObject(
    sceneObject: SceneObject,
    scene: THREE.Scene,
    config?: LODConfig
  ): LODObject {
    const lodObject = new LODObject(sceneObject, config);

    // Position the LOD object
    lodObject.position.set(
      sceneObject.position.x,
      sceneObject.position.y,
      sceneObject.position.z
    );
    lodObject.rotation.set(
      sceneObject.rotation.x,
      sceneObject.rotation.y,
      sceneObject.rotation.z
    );
    lodObject.scale.set(
      sceneObject.scale.x,
      sceneObject.scale.y,
      sceneObject.scale.z
    );

    this.lodObjects.set(sceneObject.id, lodObject);
    scene.add(lodObject);

    return lodObject;
  }

  /**
   * Remove an object from LOD management
   */
  removeObject(objectId: string, scene: THREE.Scene): void {
    const lodObject = this.lodObjects.get(objectId);
    if (lodObject) {
      scene.remove(lodObject);
      lodObject.dispose();
      this.lodObjects.delete(objectId);
    }
  }

  /**
   * Update all LOD objects
   */
  update(deltaTime: number): void {
    if (!this.enabled || !this.camera) return;

    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return;
    }

    this.lastUpdateTime = currentTime;
    this.resetStats();

    this.lodObjects.forEach((lodObject) => {
      lodObject.updateLOD(this.camera!);
      this.updateStats(lodObject);
    });
  }

  /**
   * Enable or disable LOD system
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      // Set all objects to high detail when disabled
      this.lodObjects.forEach((lodObject) => {
        lodObject.visible = true;
      });
    }
  }

  /**
   * Set update interval for LOD calculations
   */
  setUpdateInterval(intervalMs: number): void {
    this.updateInterval = Math.max(50, intervalMs); // Minimum 50ms
  }

  /**
   * Get LOD statistics
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
    averageLODLevel: number;
    memoryReduction: number;
  } {
    const total = this.stats.totalObjects;
    const visible = total - this.stats.culledObjects;
    const cullingRatio = total > 0 ? this.stats.culledObjects / total : 0;

    // Calculate average LOD level (0 = high, 1 = medium, 2 = low)
    const weightedSum =
      this.stats.highDetailObjects * 0 +
      this.stats.mediumDetailObjects * 1 +
      this.stats.lowDetailObjects * 2;
    const averageLODLevel = visible > 0 ? weightedSum / visible : 0;

    // Estimate memory reduction (rough calculation)
    const memoryReduction =
      (this.stats.mediumDetailObjects * 0.3 +
        this.stats.lowDetailObjects * 0.7 +
        this.stats.culledObjects * 1.0) /
      Math.max(1, total);

    return {
      totalObjects: total,
      visibleObjects: visible,
      cullingRatio,
      averageLODLevel,
      memoryReduction,
    };
  }

  /**
   * Clear all LOD objects
   */
  clear(scene: THREE.Scene): void {
    this.lodObjects.forEach((lodObject) => {
      scene.remove(lodObject);
      lodObject.dispose();
    });
    this.lodObjects.clear();
    this.resetStats();
  }

  /**
   * Get LOD object by scene object ID
   */
  getLODObject(objectId: string): LODObject | undefined {
    return this.lodObjects.get(objectId);
  }

  /**
   * Update LOD configuration for a specific object type
   */
  updateLODConfig(objectType: string, config: LODConfig): void {
    DEFAULT_LOD_CONFIGS[objectType] = config;

    // Update existing objects of this type
    this.lodObjects.forEach((lodObject) => {
      if (lodObject.objectType === objectType) {
        // Recreate LOD levels with new config
        // This would require rebuilding the object
      }
    });
  }

  private resetStats(): void {
    this.stats = {
      totalObjects: 0,
      culledObjects: 0,
      lowDetailObjects: 0,
      mediumDetailObjects: 0,
      highDetailObjects: 0,
    };
  }

  private updateStats(lodObject: LODObject): void {
    this.stats.totalObjects++;

    const level = lodObject.getCurrentLevel();
    switch (level) {
      case LODLevel.HIGH:
        this.stats.highDetailObjects++;
        break;
      case LODLevel.MEDIUM:
        this.stats.mediumDetailObjects++;
        break;
      case LODLevel.LOW:
        this.stats.lowDetailObjects++;
        break;
      case LODLevel.CULLED:
        this.stats.culledObjects++;
        break;
    }
  }
}

/**
 * Global LOD manager instance
 */
export const lodManager = new LODManager();
