/**
 * Project data types and interfaces for persistence
 */

import { SceneData } from "./scene";

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  thumbnail?: string;
  tags?: string[];
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  sceneData: SceneData;
  thumbnail?: string;
  tags?: string[];
}

export interface ProjectSaveOptions {
  generateThumbnail?: boolean;
  compress?: boolean;
  includeHistory?: boolean;
}

export interface ProjectLoadOptions {
  validateData?: boolean;
  migrateVersion?: boolean;
}

export interface ProjectExportOptions {
  format: "json" | "obj" | "gltf" | "png";
  includeTextures?: boolean;
  quality?: "low" | "medium" | "high";
  resolution?: {
    width: number;
    height: number;
  };
}

export interface ProjectListItem {
  id: string;
  name: string;
  updatedAt: Date;
  thumbnail?: string;
  size: number; // in bytes
}
