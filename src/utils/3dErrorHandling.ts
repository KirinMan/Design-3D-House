/**
 * 3D-specific error handling utilities for Three.js operations
 */

import * as THREE from "three";
import { AppError, ErrorType } from "../types/errors";
import { errorHandler } from "./errorHandler";

// 3D-specific error types
export interface ThreeJSError extends AppError {
  type:
    | ErrorType.GEOMETRY_ERROR
    | ErrorType.MATERIAL_ERROR
    | ErrorType.SCENE_LOAD_ERROR;
  objectType?: string;
  operation?: string;
  threeJSError?: any;
}

// Error handling for Three.js geometry operations
export class GeometryErrorHandler {
  static validateGeometry(
    geometry: THREE.BufferGeometry,
    objectId: string
  ): boolean {
    try {
      // Check if geometry has valid attributes
      if (!geometry.attributes.position) {
        throw new Error("Geometry missing position attribute");
      }

      // Check for valid vertex count
      const positionCount = geometry.attributes.position.count;
      if (positionCount === 0) {
        throw new Error("Geometry has no vertices");
      }

      // Check for NaN or infinite values
      const positions = geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i++) {
        if (!isFinite(positions[i])) {
          throw new Error(
            `Invalid position value at index ${i}: ${positions[i]}`
          );
        }
      }

      // Validate bounding box
      geometry.computeBoundingBox();
      if (!geometry.boundingBox) {
        throw new Error("Failed to compute bounding box");
      }

      const box = geometry.boundingBox;
      if (
        !isFinite(box.min.x) ||
        !isFinite(box.max.x) ||
        !isFinite(box.min.y) ||
        !isFinite(box.max.y) ||
        !isFinite(box.min.z) ||
        !isFinite(box.max.z)
      ) {
        throw new Error("Invalid bounding box values");
      }

      return true;
    } catch (error) {
      errorHandler.handleGeometryError(
        objectId,
        "validate",
        `Geometry validation failed: ${error}`,
        { geometryType: geometry.type, error }
      );
      return false;
    }
  }

  static safeGeometryOperation<T>(
    operation: () => T,
    objectId: string,
    operationName: string,
    fallback?: T
  ): T | null {
    try {
      const result = operation();

      // Additional validation for geometry results
      if (result instanceof THREE.BufferGeometry) {
        if (!this.validateGeometry(result, objectId)) {
          return fallback || null;
        }
      }

      return result;
    } catch (error) {
      errorHandler.handleGeometryError(
        objectId,
        operationName,
        `Geometry operation failed: ${error}`,
        { error }
      );
      return fallback || null;
    }
  }

  static createSafeBoxGeometry(
    width: number,
    height: number,
    depth: number,
    objectId: string
  ): THREE.BoxGeometry | null {
    return this.safeGeometryOperation(
      () => {
        // Validate parameters
        if (width <= 0 || height <= 0 || depth <= 0) {
          throw new Error("Box dimensions must be positive");
        }
        if (width > 1000 || height > 1000 || depth > 1000) {
          throw new Error("Box dimensions too large");
        }

        return new THREE.BoxGeometry(width, height, depth);
      },
      objectId,
      "createBoxGeometry"
    );
  }

  static createSafePlaneGeometry(
    width: number,
    height: number,
    objectId: string
  ): THREE.PlaneGeometry | null {
    return this.safeGeometryOperation(
      () => {
        if (width <= 0 || height <= 0) {
          throw new Error("Plane dimensions must be positive");
        }
        if (width > 1000 || height > 1000) {
          throw new Error("Plane dimensions too large");
        }

        return new THREE.PlaneGeometry(width, height);
      },
      objectId,
      "createPlaneGeometry"
    );
  }
}

// Error handling for Three.js material operations
export class MaterialErrorHandler {
  static validateMaterial(
    material: THREE.Material,
    materialId: string
  ): boolean {
    try {
      // Check if material is properly initialized
      if (!material) {
        throw new Error("Material is null or undefined");
      }

      // Check for valid material type
      if (!material.type) {
        throw new Error("Material missing type property");
      }

      // Validate material properties based on type
      if (
        material instanceof THREE.MeshBasicMaterial ||
        material instanceof THREE.MeshLambertMaterial ||
        material instanceof THREE.MeshPhongMaterial ||
        material instanceof THREE.MeshStandardMaterial
      ) {
        // Check color property
        if (material.color && !(material.color instanceof THREE.Color)) {
          throw new Error("Invalid color property");
        }
      }

      return true;
    } catch (error) {
      errorHandler.handleMaterialError(`Material validation failed: ${error}`, {
        materialId,
        materialType: material?.type,
        error,
      });
      return false;
    }
  }

  static safeMaterialOperation<T>(
    operation: () => T,
    materialId: string,
    operationName: string,
    fallback?: T
  ): T | null {
    try {
      const result = operation();

      // Additional validation for material results
      if (result instanceof THREE.Material) {
        if (!this.validateMaterial(result, materialId)) {
          return fallback || null;
        }
      }

      return result;
    } catch (error) {
      errorHandler.handleMaterialError(`Material operation failed: ${error}`, {
        materialId,
        operation: operationName,
        error,
      });
      return fallback || null;
    }
  }

  static createSafeMaterial(
    type: "basic" | "standard" | "phong",
    properties: any,
    materialId: string
  ): THREE.Material | null {
    return this.safeMaterialOperation(
      () => {
        let material: THREE.Material;

        switch (type) {
          case "basic":
            material = new THREE.MeshBasicMaterial(properties);
            break;
          case "standard":
            material = new THREE.MeshStandardMaterial(properties);
            break;
          case "phong":
            material = new THREE.MeshPhongMaterial(properties);
            break;
          default:
            throw new Error(`Unknown material type: ${type}`);
        }

        return material;
      },
      materialId,
      "createMaterial"
    );
  }
}

// Error handling for Three.js scene operations
export class SceneErrorHandler {
  static validateScene(scene: THREE.Scene): boolean {
    try {
      if (!scene) {
        throw new Error("Scene is null or undefined");
      }

      if (!(scene instanceof THREE.Scene)) {
        throw new Error("Object is not a Three.js Scene");
      }

      // Check for excessive object count
      let objectCount = 0;
      scene.traverse(() => objectCount++);

      if (objectCount > 10000) {
        throw new Error(`Scene has too many objects: ${objectCount}`);
      }

      return true;
    } catch (error) {
      errorHandler.handleSceneError(`Scene validation failed: ${error}`, {
        error,
      });
      return false;
    }
  }

  static safeSceneOperation<T>(
    operation: () => T,
    operationName: string,
    fallback?: T
  ): T | null {
    try {
      return operation();
    } catch (error) {
      errorHandler.handleSceneError(`Scene operation failed: ${error}`, {
        operation: operationName,
        error,
      });
      return fallback || null;
    }
  }

  static safeAddToScene(
    scene: THREE.Scene,
    object: THREE.Object3D,
    objectId: string
  ): boolean {
    return (
      this.safeSceneOperation(
        () => {
          if (!this.validateScene(scene)) {
            throw new Error("Invalid scene");
          }

          if (!object) {
            throw new Error("Object is null or undefined");
          }

          if (!(object instanceof THREE.Object3D)) {
            throw new Error("Object is not a Three.js Object3D");
          }

          scene.add(object);
          return true;
        },
        "addToScene",
        false
      ) || false
    );
  }

  static safeRemoveFromScene(
    scene: THREE.Scene,
    object: THREE.Object3D,
    objectId: string
  ): boolean {
    return (
      this.safeSceneOperation(
        () => {
          if (!scene || !object) {
            throw new Error("Scene or object is null");
          }

          scene.remove(object);

          // Clean up geometry and materials
          if (object instanceof THREE.Mesh) {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((mat) => mat.dispose());
              } else {
                object.material.dispose();
              }
            }
          }

          return true;
        },
        "removeFromScene",
        false
      ) || false
    );
  }
}

// Error handling for camera operations
export class CameraErrorHandler {
  static validateCamera(camera: THREE.Camera): boolean {
    try {
      if (!camera) {
        throw new Error("Camera is null or undefined");
      }

      if (!(camera instanceof THREE.Camera)) {
        throw new Error("Object is not a Three.js Camera");
      }

      // Check camera position for invalid values
      const pos = camera.position;
      if (!isFinite(pos.x) || !isFinite(pos.y) || !isFinite(pos.z)) {
        throw new Error("Camera position contains invalid values");
      }

      // Check for perspective camera specific properties
      if (camera instanceof THREE.PerspectiveCamera) {
        if (camera.fov <= 0 || camera.fov >= 180) {
          throw new Error(`Invalid camera FOV: ${camera.fov}`);
        }
        if (camera.near <= 0) {
          throw new Error(`Invalid camera near plane: ${camera.near}`);
        }
        if (camera.far <= camera.near) {
          throw new Error(`Invalid camera far plane: ${camera.far}`);
        }
      }

      return true;
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createAppError(
          ErrorType.UNKNOWN_ERROR,
          `Camera validation failed: ${error}`,
          { cameraType: camera?.type, error }
        )
      );
      return false;
    }
  }

  static safeCameraOperation<T>(
    operation: () => T,
    operationName: string,
    fallback?: T
  ): T | null {
    try {
      return operation();
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createAppError(
          ErrorType.UNKNOWN_ERROR,
          `Camera operation failed: ${error}`,
          { operation: operationName, error }
        )
      );
      return fallback || null;
    }
  }
}

// Utility function to wrap Three.js operations with error handling
export function withThreeJSErrorHandling<T>(
  operation: () => T,
  errorType: ErrorType,
  operationName: string,
  objectId?: string,
  fallback?: T
): T | null {
  try {
    return operation();
  } catch (error) {
    const appError = errorHandler.createAppError(
      errorType,
      `Three.js operation failed: ${operationName}`,
      {
        objectId,
        operation: operationName,
        threeJSError: error,
      }
    );
    errorHandler.handleError(appError);
    return fallback || null;
  }
}

// Memory management utilities
export class ThreeJSMemoryManager {
  static disposeObject(object: THREE.Object3D): void {
    try {
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createAppError(
          ErrorType.UNKNOWN_ERROR,
          `Failed to dispose Three.js object: ${error}`,
          { objectId: object.uuid, error }
        )
      );
    }
  }

  static getMemoryUsage(): {
    geometries: number;
    textures: number;
    materials: number;
  } {
    try {
      return {
        geometries: (THREE as any).Cache?.files
          ? Object.keys((THREE as any).Cache.files).length
          : 0,
        textures: 0, // Would need to track textures manually
        materials: 0, // Would need to track materials manually
      };
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createAppError(
          ErrorType.UNKNOWN_ERROR,
          `Failed to get memory usage: ${error}`,
          { error }
        )
      );
      return { geometries: 0, textures: 0, materials: 0 };
    }
  }
}
