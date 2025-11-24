/**
 * Tool types and settings for the 3D house design application
 */

export type ToolType = "select" | "wall" | "door" | "window" | "room";

export interface BaseToolSettings {
  snapToGrid: boolean;
  gridSize: number;
}

export interface WallToolSettings extends BaseToolSettings {
  defaultHeight: number;
  defaultThickness: number;
  material: string;
}

export interface DoorToolSettings extends BaseToolSettings {
  defaultWidth: number;
  defaultHeight: number;
  material: string;
}

export interface WindowToolSettings extends BaseToolSettings {
  defaultWidth: number;
  defaultHeight: number;
  material: string;
}

export interface RoomToolSettings extends BaseToolSettings {
  defaultCeilingHeight: number;
  floorMaterial: string;
  ceilingMaterial: string;
}

export interface SelectToolSettings extends BaseToolSettings {
  multiSelect: boolean;
  showBoundingBox: boolean;
}

export type ToolSettings = {
  select: SelectToolSettings;
  wall: WallToolSettings;
  door: DoorToolSettings;
  window: WindowToolSettings;
  room: RoomToolSettings;
};
