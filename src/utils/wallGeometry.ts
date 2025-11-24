/**
 * Wall geometry generation utilities
 * Implements requirements: 1.3, 2.1
 */

import * as THREE from "three";
import { Vector2, Vector3, WallObject } from "../types/scene";

export interface WallGeometryData {
  geometry: THREE.BoxGeometry;
  position: Vector3;
  rotation: Vector3;
  length: number;
  angle: number;
}

/**
 * Calculate wall geometry data from WallObject
 */
export function calculateWallGeometry(wall: WallObject): WallGeometryData {
  const { startPoint, endPoint, height, thickness } = wall;

  // Calculate wall length and angle
  const deltaX = endPoint.x - startPoint.x;
  const deltaZ = endPoint.y - startPoint.y; // Note: Vector2.y maps to world Z
  const length = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
  const angle = Math.atan2(deltaZ, deltaX);

  // Calculate center position
  const centerX = (startPoint.x + endPoint.x) / 2;
  const centerZ = (startPoint.y + endPoint.y) / 2;
  const centerY = height / 2; // Wall base at y=0, center at height/2

  // Create geometry (length along X-axis, height along Y-axis, thickness along Z-axis)
  const geometry = new THREE.BoxGeometry(length, height, thickness);

  return {
    geometry,
    position: { x: centerX, y: centerY, z: centerZ },
    rotation: { x: 0, y: angle, z: 0 },
    length,
    angle,
  };
}

/**
 * Create wall geometry from start and end points
 */
export function createWallFromPoints(
  startPoint: Vector2,
  endPoint: Vector2,
  height: number = 2.5,
  thickness: number = 0.2
): WallGeometryData {
  const wallObject: Partial<WallObject> = {
    startPoint,
    endPoint,
    height,
    thickness,
  };

  return calculateWallGeometry(wallObject as WallObject);
}

/**
 * Check if two points are close enough to snap together
 */
export function shouldSnapPoints(
  point1: Vector2,
  point2: Vector2,
  snapDistance: number = 0.5
): boolean {
  const distance = Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
  );
  return distance <= snapDistance;
}

/**
 * Snap point to grid
 */
export function snapToGrid(point: Vector2, gridSize: number = 1): Vector2 {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Calculate wall intersection point (for connecting walls)
 */
export function calculateWallIntersection(
  wall1Start: Vector2,
  wall1End: Vector2,
  wall2Start: Vector2,
  wall2End: Vector2
): Vector2 | null {
  const x1 = wall1Start.x;
  const y1 = wall1Start.y;
  const x2 = wall1End.x;
  const y2 = wall1End.y;
  const x3 = wall2Start.x;
  const y3 = wall2Start.y;
  const x4 = wall2End.x;
  const y4 = wall2End.y;

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denominator) < 0.0001) {
    // Lines are parallel
    return null;
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    // Intersection point
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  return null;
}
