/**
 * Main types export file for the 3D house design application
 */

// Scene types
export type {
  Vector2,
  Vector3,
  ObjectProperties,
  OpeningProperties,
  MaterialProperties,
  SceneObject,
  Opening,
  WallObject,
  SceneSettings,
  SceneData,
} from "./scene";

// Tool types
export type {
  ToolType,
  BaseToolSettings,
  WallToolSettings,
  DoorToolSettings,
  WindowToolSettings,
  RoomToolSettings,
  SelectToolSettings,
  ToolSettings,
} from "./tools";

// Error types
export { ErrorType } from "./errors";

export type {
  AppError,
  ErrorBoundaryState,
  ValidationError,
  StorageError,
  GeometryError,
} from "./errors";

// Project types
export type {
  ProjectMetadata,
  ProjectData,
  ProjectSaveOptions,
  ProjectLoadOptions,
  ProjectExportOptions,
  ProjectListItem,
} from "./project";

// Lighting types
export type { LightingMode, LightingSettings } from "../stores/lightingStore";

// Export types
export type {
  ExportFormat,
  ExportOptions,
  ExportProgress,
  ExportResult,
  ModelExportOptions,
  ImageExportOptions,
} from "./export";

// Re-export project store for convenience
export { useProjectStore } from "../stores/projectStore";
