/**
 * Error handling types and enums for the 3D house design application
 */

export enum ErrorType {
  SCENE_LOAD_ERROR = "SCENE_LOAD_ERROR",
  EXPORT_ERROR = "EXPORT_ERROR",
  GEOMETRY_ERROR = "GEOMETRY_ERROR",
  MATERIAL_ERROR = "MATERIAL_ERROR",
  STORAGE_ERROR = "STORAGE_ERROR",
  TOOL_ERROR = "TOOL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}

export interface ValidationError extends AppError {
  type: ErrorType.VALIDATION_ERROR;
  field: string;
  value: any;
  constraint: string;
}

export interface StorageError extends AppError {
  type: ErrorType.STORAGE_ERROR;
  operation: "save" | "load" | "delete";
  storageType: "localStorage" | "indexedDB";
}

export interface GeometryError extends AppError {
  type: ErrorType.GEOMETRY_ERROR;
  objectId: string;
  operation: string;
}
