/**
 * Core scene object types and interfaces for 3D house design application
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ObjectProperties {
  [key: string]: any;
}

export interface OpeningProperties {
  [key: string]: any;
}

export interface MaterialProperties {
  id: string;
  name: string;
  diffuseMap?: string;
  normalMap?: string;
  roughness: number;
  metalness: number;
  color: string;
}

export interface SceneObject {
  id: string;
  type: "wall" | "door" | "window" | "room" | "furniture";
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  properties: ObjectProperties;
  material: MaterialProperties;
}

export interface Opening {
  id: string;
  type: "door" | "window";
  position: number; // position along wall (0-1)
  width: number;
  height: number;
  properties: OpeningProperties;
}

export interface WallObject extends SceneObject {
  type: "wall";
  startPoint: Vector2;
  endPoint: Vector2;
  height: number;
  thickness: number;
  openings: Opening[];
}

export interface SceneSettings {
  gridSize: number;
  snapToGrid: boolean;
  units: "metric" | "imperial";
  lightingMode: "realistic" | "basic";
}

export interface SceneData {
  objects: SceneObject[];
  materials: MaterialProperties[];
  settings: SceneSettings;
}
