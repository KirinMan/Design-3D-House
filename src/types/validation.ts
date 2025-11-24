/**
 * Type validation utilities and examples to verify our type definitions work correctly
 */

import {
  SceneObject,
  WallObject,
  Opening,
  MaterialProperties,
  ToolType,
  ToolSettings,
  ErrorType,
  AppError,
  ProjectData,
  SceneData,
} from "./index";

// Example usage and validation of our type definitions

// Example SceneObject
export const exampleSceneObject: SceneObject = {
  id: "example-wall-1",
  type: "wall",
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  properties: { color: "white", texture: "brick" },
  material: {
    id: "brick-material",
    name: "Red Brick",
    roughness: 0.8,
    metalness: 0.0,
    color: "#cc4444",
  },
};

// Example WallObject
export const exampleWallObject: WallObject = {
  id: "wall-1",
  type: "wall",
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  properties: { insulation: "standard" },
  material: {
    id: "wall-material",
    name: "Drywall",
    roughness: 0.5,
    metalness: 0.0,
    color: "#ffffff",
  },
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 5, y: 0 },
  height: 2.5,
  thickness: 0.15,
  openings: [
    {
      id: "door-1",
      type: "door",
      position: 0.3,
      width: 0.8,
      height: 2.0,
      properties: { material: "wood", handle: "brass" },
    },
  ],
};

// Example MaterialProperties
export const exampleMaterial: MaterialProperties = {
  id: "wood-oak",
  name: "Oak Wood",
  diffuseMap: "/textures/oak-diffuse.jpg",
  normalMap: "/textures/oak-normal.jpg",
  roughness: 0.7,
  metalness: 0.0,
  color: "#8B4513",
};

// Example ToolSettings
export const exampleToolSettings: ToolSettings = {
  select: {
    snapToGrid: true,
    gridSize: 0.1,
    multiSelect: true,
    showBoundingBox: true,
  },
  wall: {
    snapToGrid: true,
    gridSize: 0.1,
    defaultHeight: 2.5,
    defaultThickness: 0.15,
    material: "default-wall",
  },
  door: {
    snapToGrid: true,
    gridSize: 0.1,
    defaultWidth: 0.8,
    defaultHeight: 2.0,
    material: "default-door",
  },
  window: {
    snapToGrid: true,
    gridSize: 0.1,
    defaultWidth: 1.2,
    defaultHeight: 1.0,
    material: "default-window",
  },
  room: {
    snapToGrid: true,
    gridSize: 0.1,
    defaultCeilingHeight: 2.5,
    floorMaterial: "default-floor",
    ceilingMaterial: "default-ceiling",
  },
};

// Example AppError
export const exampleError: AppError = {
  type: ErrorType.GEOMETRY_ERROR,
  message: "Invalid wall geometry: start and end points cannot be the same",
  details: { startPoint: { x: 0, y: 0 }, endPoint: { x: 0, y: 0 } },
  timestamp: new Date(),
};

// Example ProjectData
export const exampleProjectData: ProjectData = {
  id: "project-example-1",
  name: "Sample House Design",
  description: "A simple two-bedroom house design",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date(),
  version: "1.0.0",
  sceneData: {
    objects: [exampleWallObject],
    materials: [exampleMaterial],
    settings: {
      gridSize: 0.1,
      snapToGrid: true,
      units: "metric",
      lightingMode: "realistic",
    },
  },
  tags: ["residential", "two-bedroom", "modern"],
};

// Type validation functions
export function isValidToolType(tool: string): tool is ToolType {
  return ["select", "wall", "door", "window", "room"].includes(tool);
}

export function isValidSceneObjectType(
  type: string
): type is SceneObject["type"] {
  return ["wall", "door", "window", "room", "furniture"].includes(type);
}

export function isValidOpeningType(type: string): type is Opening["type"] {
  return ["door", "window"].includes(type);
}
