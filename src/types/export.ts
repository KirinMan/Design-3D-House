/**
 * Export types and interfaces for 3D model and image export functionality
 */

export type ExportFormat = "obj" | "gltf" | "png";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeTextures?: boolean;
  resolution?: {
    width: number;
    height: number;
  };
}

export interface ExportProgress {
  stage: "preparing" | "processing" | "finalizing" | "complete" | "error";
  progress: number; // 0-100
  message: string;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  blob?: Blob;
  error?: string;
}

export interface ModelExportOptions extends ExportOptions {
  format: "obj" | "gltf";
  includeTextures: boolean;
  embedTextures?: boolean;
}

export interface ImageExportOptions extends ExportOptions {
  format: "png";
  resolution: {
    width: number;
    height: number;
  };
  quality?: number; // 0-1 for JPEG-like formats
}
