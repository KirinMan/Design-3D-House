/**
 * Camera Store - Manages 3D camera position and navigation
 * Implements requirements: 3.1, 3.2, 3.3, 3.4
 */

import { create } from "zustand";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface CameraStore {
  // Camera state
  position: Vector3;
  target: Vector3;

  // Actions
  setCamera: (position: Vector3, target: Vector3) => void;
  resetCamera: () => void;
}

// Default camera position and target values
const DEFAULT_CAMERA_POSITION: Vector3 = { x: 10, y: 10, z: 10 };
const DEFAULT_CAMERA_TARGET: Vector3 = { x: 0, y: 0, z: 0 };

export const useCameraStore = create<CameraStore>((set) => ({
  // Initial state
  position: DEFAULT_CAMERA_POSITION,
  target: DEFAULT_CAMERA_TARGET,

  // Actions
  setCamera: (position: Vector3, target: Vector3) => {
    set({ position, target });
  },

  resetCamera: () => {
    set({
      position: DEFAULT_CAMERA_POSITION,
      target: DEFAULT_CAMERA_TARGET,
    });
  },
}));
