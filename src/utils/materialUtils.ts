/**
 * Material utilities for 3D object material application
 * Implements requirements: 5.1, 5.3
 */

import * as THREE from "three";
import { MaterialProperties } from "../types/scene";

/**
 * Creates a Three.js material from MaterialProperties
 */
export function createThreeMaterial(
  materialProps: MaterialProperties
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(materialProps.color),
    roughness: materialProps.roughness,
    metalness: materialProps.metalness,
  });

  // Load diffuse map if provided
  if (materialProps.diffuseMap) {
    const textureLoader = new THREE.TextureLoader();
    material.map = textureLoader.load(materialProps.diffuseMap);
  }

  // Load normal map if provided
  if (materialProps.normalMap) {
    const textureLoader = new THREE.TextureLoader();
    material.normalMap = textureLoader.load(materialProps.normalMap);
  }

  return material;
}

/**
 * Updates an existing Three.js material with new properties
 */
export function updateThreeMaterial(
  material: THREE.MeshStandardMaterial,
  materialProps: MaterialProperties
): void {
  material.color.setHex(parseInt(materialProps.color.replace("#", "0x")));
  material.roughness = materialProps.roughness;
  material.metalness = materialProps.metalness;

  // Update diffuse map
  if (materialProps.diffuseMap) {
    const textureLoader = new THREE.TextureLoader();
    material.map = textureLoader.load(materialProps.diffuseMap);
  } else {
    material.map = null;
  }

  // Update normal map
  if (materialProps.normalMap) {
    const textureLoader = new THREE.TextureLoader();
    material.normalMap = textureLoader.load(materialProps.normalMap);
  } else {
    material.normalMap = null;
  }

  material.needsUpdate = true;
}

/**
 * Gets default material for a specific object type
 */
export function getDefaultMaterialId(objectType: string): string {
  switch (objectType) {
    case "wall":
      return "wall-default";
    case "door":
      return "door-wood";
    case "window":
      return "window-glass";
    default:
      return "wall-default";
  }
}

/**
 * Creates a material preview sphere for UI display
 */
export function createMaterialPreview(
  materialProps: MaterialProperties,
  size: number = 1
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const material = createThreeMaterial(materialProps);

  return new THREE.Mesh(geometry, material);
}

/**
 * Validates material properties
 */
export function validateMaterialProperties(
  material: Partial<MaterialProperties>
): boolean {
  if (!material.id || !material.name) return false;
  if (!material.color || !/^#[0-9A-F]{6}$/i.test(material.color)) return false;
  if (
    material.roughness !== undefined &&
    (material.roughness < 0 || material.roughness > 1)
  )
    return false;
  if (
    material.metalness !== undefined &&
    (material.metalness < 0 || material.metalness > 1)
  )
    return false;

  return true;
}

/**
 * Clones a material with a new ID
 */
export function cloneMaterial(
  original: MaterialProperties,
  newId: string,
  newName?: string
): MaterialProperties {
  return {
    ...original,
    id: newId,
    name: newName || `${original.name} Copy`,
  };
}
