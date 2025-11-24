/**
 * Opening Geometry Utilities - Creates geometry for doors and windows
 * Implements requirements: 2.2, 2.3
 */

import * as THREE from "three";
import { Opening, WallObject, Vector3 } from "../types/scene";

export interface OpeningGeometryData {
  geometry: THREE.BufferGeometry;
  position: Vector3;
  rotation: Vector3;
  width: number;
  height: number;
  depth: number;
}

/**
 * Calculate the 3D position of an opening along a wall
 */
export function calculateOpeningPosition(
  wall: WallObject,
  opening: Opening
): Vector3 {
  // Calculate wall direction vector
  const wallDirection = {
    x: wall.endPoint.x - wall.startPoint.x,
    y: wall.endPoint.y - wall.startPoint.y,
  };

  // Calculate wall length
  const wallLength = Math.sqrt(
    wallDirection.x * wallDirection.x + wallDirection.y * wallDirection.y
  );

  // Normalize wall direction
  const normalizedDirection = {
    x: wallDirection.x / wallLength,
    y: wallDirection.y / wallLength,
  };

  // Calculate position along wall
  const positionAlongWall = opening.position * wallLength;

  // Calculate world position
  const worldPosition = {
    x: wall.startPoint.x + normalizedDirection.x * positionAlongWall,
    y: opening.height / 2, // Center vertically
    z: wall.startPoint.y + normalizedDirection.y * positionAlongWall,
  };

  return worldPosition;
}

/**
 * Calculate the rotation of an opening to align with the wall
 */
export function calculateOpeningRotation(wall: WallObject): Vector3 {
  // Calculate wall direction vector
  const wallDirection = {
    x: wall.endPoint.x - wall.startPoint.x,
    y: wall.endPoint.y - wall.startPoint.y,
  };

  // Calculate rotation angle around Y axis
  const angle = Math.atan2(wallDirection.y, wallDirection.x);

  return {
    x: 0,
    y: angle,
    z: 0,
  };
}

/**
 * Create door geometry with frame
 */
export function createDoorGeometry(
  opening: Opening,
  wallThickness: number
): OpeningGeometryData {
  const frameThickness = 0.05; // 5cm frame thickness
  const frameDepth = wallThickness + 0.02; // Slightly deeper than wall

  // Create door frame geometry using CSG-like approach
  const frameGeometry = new THREE.BoxGeometry(
    opening.width + frameThickness * 2,
    opening.height + frameThickness,
    frameDepth
  );

  // Create door opening (hole in the frame)
  const openingGeometry = new THREE.BoxGeometry(
    opening.width,
    opening.height,
    frameDepth + 0.01
  );

  // For now, we'll create a simple frame without actual CSG
  // In a full implementation, we'd use a CSG library like three-csg-ts
  const doorFrameGeometry = new THREE.BoxGeometry(
    opening.width + frameThickness * 2,
    opening.height + frameThickness,
    frameDepth
  );

  return {
    geometry: doorFrameGeometry,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    width: opening.width + frameThickness * 2,
    height: opening.height + frameThickness,
    depth: frameDepth,
  };
}

/**
 * Create window geometry with frame and glass
 */
export function createWindowGeometry(
  opening: Opening,
  wallThickness: number
): OpeningGeometryData {
  const frameThickness = 0.05; // 5cm frame thickness
  const frameDepth = wallThickness;
  const glassThickness = 0.005; // 5mm glass thickness

  // Create window frame geometry
  const frameGeometry = new THREE.BoxGeometry(
    opening.width + frameThickness * 2,
    opening.height + frameThickness * 2,
    frameDepth
  );

  return {
    geometry: frameGeometry,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    width: opening.width + frameThickness * 2,
    height: opening.height + frameThickness * 2,
    depth: frameDepth,
  };
}

/**
 * Create opening cutout geometry for wall subtraction
 */
export function createOpeningCutout(
  opening: Opening,
  wallThickness: number
): THREE.BufferGeometry {
  // Create a box geometry that will be used to cut the opening in the wall
  const cutoutGeometry = new THREE.BoxGeometry(
    opening.width,
    opening.height,
    wallThickness + 0.01 // Slightly thicker to ensure clean cut
  );

  return cutoutGeometry;
}

/**
 * Check if an opening position is valid on a wall
 */
export function validateOpeningPosition(
  wall: WallObject,
  opening: Opening
): { isValid: boolean; error?: string } {
  // Check if opening fits within wall bounds
  const minPosition = opening.width / 2;
  const wallLength = Math.sqrt(
    Math.pow(wall.endPoint.x - wall.startPoint.x, 2) +
      Math.pow(wall.endPoint.y - wall.startPoint.y, 2)
  );
  const maxPosition = wallLength - opening.width / 2;

  const absolutePosition = opening.position * wallLength;

  if (absolutePosition < minPosition) {
    return {
      isValid: false,
      error: "Opening extends beyond wall start",
    };
  }

  if (absolutePosition > maxPosition) {
    return {
      isValid: false,
      error: "Opening extends beyond wall end",
    };
  }

  // Check if opening height fits within wall height
  if (opening.height > wall.height) {
    return {
      isValid: false,
      error: "Opening height exceeds wall height",
    };
  }

  // Check for overlaps with other openings
  for (const existingOpening of wall.openings) {
    if (existingOpening.id === opening.id) continue;

    const existingPosition = existingOpening.position * wallLength;
    const existingStart = existingPosition - existingOpening.width / 2;
    const existingEnd = existingPosition + existingOpening.width / 2;

    const newStart = absolutePosition - opening.width / 2;
    const newEnd = absolutePosition + opening.width / 2;

    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      return {
        isValid: false,
        error: "Opening overlaps with existing opening",
      };
    }
  }

  return { isValid: true };
}
