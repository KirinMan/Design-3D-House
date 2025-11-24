/**
 * 3D Model Export Utilities
 * Implements OBJ and GLTF export functionality using Three.js exporters
 * Requirements: 6.1, 6.2, 6.3
 */

import * as THREE from "three";
import { OBJExporter } from "three-obj-exporter";
import { GLTFExporter } from "three-gltf-exporter";
import {
  ModelExportOptions,
  ExportResult,
  ExportProgress,
} from "../types/export";
import { SceneObject, MaterialProperties } from "../types/scene";

export class ModelExporter {
  private objExporter: OBJExporter;
  private gltfExporter: GLTFExporter;

  constructor() {
    this.objExporter = new OBJExporter();
    this.gltfExporter = new GLTFExporter();
  }

  /**
   * Export scene objects to OBJ format
   */
  async exportToOBJ(
    objects: SceneObject[],
    materials: MaterialProperties[],
    options: ModelExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    try {
      onProgress?.({
        stage: "preparing",
        progress: 0,
        message: "Preparing scene for OBJ export...",
      });

      // Create a temporary scene for export
      const scene = new THREE.Scene();
      const materialMap = this.createMaterialMap(materials);

      onProgress?.({
        stage: "processing",
        progress: 20,
        message: "Converting objects to Three.js geometry...",
      });

      // Convert scene objects to Three.js objects
      await this.addObjectsToScene(scene, objects, materialMap, (progress) => {
        onProgress?.({
          stage: "processing",
          progress: 20 + progress * 0.6,
          message: "Processing 3D objects...",
        });
      });

      onProgress?.({
        stage: "finalizing",
        progress: 80,
        message: "Generating OBJ file...",
      });

      // Export to OBJ format
      const objData = this.objExporter.parse(scene);

      // Create blob
      const blob = new Blob([objData], { type: "text/plain" });
      const filename = options.filename || `house-design-${Date.now()}.obj`;

      onProgress?.({
        stage: "complete",
        progress: 100,
        message: "OBJ export completed successfully",
      });

      return {
        success: true,
        filename,
        blob,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onProgress?.({
        stage: "error",
        progress: 0,
        message: `Export failed: ${errorMessage}`,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Export scene objects to GLTF format
   */
  async exportToGLTF(
    objects: SceneObject[],
    materials: MaterialProperties[],
    options: ModelExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    try {
      onProgress?.({
        stage: "preparing",
        progress: 0,
        message: "Preparing scene for GLTF export...",
      });

      // Create a temporary scene for export
      const scene = new THREE.Scene();
      const materialMap = this.createMaterialMap(materials);

      onProgress?.({
        stage: "processing",
        progress: 20,
        message: "Converting objects to Three.js geometry...",
      });

      // Convert scene objects to Three.js objects
      await this.addObjectsToScene(scene, objects, materialMap, (progress) => {
        onProgress?.({
          stage: "processing",
          progress: 20 + progress * 0.5,
          message: "Processing 3D objects...",
        });
      });

      onProgress?.({
        stage: "finalizing",
        progress: 70,
        message: "Generating GLTF file...",
      });

      // Export to GLTF format
      const gltfData = await new Promise<ArrayBuffer>((resolve, reject) => {
        this.gltfExporter.parse(
          scene,
          (result) => {
            if (result instanceof ArrayBuffer) {
              resolve(result);
            } else {
              // Convert JSON to ArrayBuffer
              const jsonString = JSON.stringify(result);
              const encoder = new TextEncoder();
              resolve(encoder.encode(jsonString).buffer);
            }
          },
          (error) => reject(error),
          {
            binary: options.embedTextures !== false,
            includeCustomExtensions: true,
            embedImages: options.includeTextures && options.embedTextures,
          }
        );
      });

      // Create blob
      const blob = new Blob([gltfData], { type: "model/gltf-binary" });
      const filename = options.filename || `house-design-${Date.now()}.glb`;

      onProgress?.({
        stage: "complete",
        progress: 100,
        message: "GLTF export completed successfully",
      });

      return {
        success: true,
        filename,
        blob,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onProgress?.({
        stage: "error",
        progress: 0,
        message: `Export failed: ${errorMessage}`,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create a map of materials for efficient lookup
   */
  private createMaterialMap(
    materials: MaterialProperties[]
  ): Map<string, THREE.Material> {
    const materialMap = new Map<string, THREE.Material>();

    materials.forEach((materialProps) => {
      const material = new THREE.MeshStandardMaterial({
        color: materialProps.color,
        roughness: materialProps.roughness,
        metalness: materialProps.metalness,
        name: materialProps.name,
      });

      // Load textures if available
      if (materialProps.diffuseMap) {
        const textureLoader = new THREE.TextureLoader();
        material.map = textureLoader.load(materialProps.diffuseMap);
      }

      if (materialProps.normalMap) {
        const textureLoader = new THREE.TextureLoader();
        material.normalMap = textureLoader.load(materialProps.normalMap);
      }

      materialMap.set(materialProps.id, material);
    });

    return materialMap;
  }

  /**
   * Convert scene objects to Three.js objects and add to scene
   */
  private async addObjectsToScene(
    scene: THREE.Scene,
    objects: SceneObject[],
    materialMap: Map<string, THREE.Material>,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const total = objects.length;

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const threejsObject = await this.convertSceneObjectToThreeJS(
        obj,
        materialMap
      );

      if (threejsObject) {
        scene.add(threejsObject);
      }

      onProgress?.((i + 1) / total);
    }
  }

  /**
   * Convert a scene object to a Three.js object
   */
  private async convertSceneObjectToThreeJS(
    sceneObject: SceneObject,
    materialMap: Map<string, THREE.Material>
  ): Promise<THREE.Object3D | null> {
    const material =
      materialMap.get(sceneObject.material.id) ||
      new THREE.MeshStandardMaterial();

    switch (sceneObject.type) {
      case "wall":
        return this.createWallGeometry(sceneObject, material);
      case "door":
        return this.createDoorGeometry(sceneObject, material);
      case "window":
        return this.createWindowGeometry(sceneObject, material);
      default:
        return null;
    }
  }

  /**
   * Create wall geometry for export
   */
  private createWallGeometry(
    sceneObject: SceneObject,
    material: THREE.Material
  ): THREE.Object3D {
    // Import wall geometry utility
    const { createWallGeometry } = require("./wallGeometry");

    const wallObject = sceneObject as any; // Type assertion for wall-specific properties
    const geometry = createWallGeometry(
      wallObject.startPoint,
      wallObject.endPoint,
      wallObject.height,
      wallObject.thickness
    );

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      sceneObject.position.x,
      sceneObject.position.y,
      sceneObject.position.z
    );
    mesh.rotation.set(
      sceneObject.rotation.x,
      sceneObject.rotation.y,
      sceneObject.rotation.z
    );
    mesh.scale.set(
      sceneObject.scale.x,
      sceneObject.scale.y,
      sceneObject.scale.z
    );
    mesh.name = `wall-${sceneObject.id}`;

    return mesh;
  }

  /**
   * Create door geometry for export
   */
  private createDoorGeometry(
    sceneObject: SceneObject,
    material: THREE.Material
  ): THREE.Object3D {
    const geometry = new THREE.BoxGeometry(1, 2, 0.1); // Default door dimensions
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      sceneObject.position.x,
      sceneObject.position.y,
      sceneObject.position.z
    );
    mesh.rotation.set(
      sceneObject.rotation.x,
      sceneObject.rotation.y,
      sceneObject.rotation.z
    );
    mesh.scale.set(
      sceneObject.scale.x,
      sceneObject.scale.y,
      sceneObject.scale.z
    );
    mesh.name = `door-${sceneObject.id}`;

    return mesh;
  }

  /**
   * Create window geometry for export
   */
  private createWindowGeometry(
    sceneObject: SceneObject,
    material: THREE.Material
  ): THREE.Object3D {
    const geometry = new THREE.BoxGeometry(1.5, 1, 0.1); // Default window dimensions
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
      sceneObject.position.x,
      sceneObject.position.y,
      sceneObject.position.z
    );
    mesh.rotation.set(
      sceneObject.rotation.x,
      sceneObject.rotation.y,
      sceneObject.rotation.z
    );
    mesh.scale.set(
      sceneObject.scale.x,
      sceneObject.scale.y,
      sceneObject.scale.z
    );
    mesh.name = `window-${sceneObject.id}`;

    return mesh;
  }
}

/**
 * Convenience function to export models
 */
export async function exportModel(
  objects: SceneObject[],
  materials: MaterialProperties[],
  options: ModelExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const exporter = new ModelExporter();

  switch (options.format) {
    case "obj":
      return exporter.exportToOBJ(objects, materials, options, onProgress);
    case "gltf":
      return exporter.exportToGLTF(objects, materials, options, onProgress);
    default:
      return {
        success: false,
        error: `Unsupported export format: ${options.format}`,
      };
  }
}

/**
 * Download exported file
 */
export function downloadExportedFile(result: ExportResult): void {
  if (!result.success || !result.blob || !result.filename) {
    throw new Error("Invalid export result");
  }

  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
