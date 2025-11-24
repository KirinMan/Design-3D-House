/**
 * Tool Store - Manages active tools and tool settings
 * Implements requirements: 2.1, 2.4
 */

import { create } from "zustand";
import { ToolType, ToolSettings } from "../types/tools";

export interface ToolStore {
  // Tool state
  activeTool: ToolType;
  toolSettings: ToolSettings;

  // Actions
  setActiveTool: (tool: ToolType) => void;
  updateToolSettings: <T extends ToolType>(
    tool: T,
    settings: Partial<ToolSettings[T]>
  ) => void;
}

// Default tool settings for each tool type
const defaultToolSettings: ToolSettings = {
  select: {
    snapToGrid: true,
    gridSize: 1,
    multiSelect: true,
    showBoundingBox: true,
  },
  wall: {
    snapToGrid: true,
    gridSize: 1,
    defaultHeight: 3,
    defaultThickness: 0.2,
    material: "default-wall",
  },
  door: {
    snapToGrid: true,
    gridSize: 1,
    defaultWidth: 0.8,
    defaultHeight: 2,
    material: "default-door",
  },
  window: {
    snapToGrid: true,
    gridSize: 1,
    defaultWidth: 1.2,
    defaultHeight: 1.2,
    material: "default-window",
  },
  room: {
    snapToGrid: true,
    gridSize: 1,
    defaultCeilingHeight: 3,
    floorMaterial: "default-floor",
    ceilingMaterial: "default-ceiling",
  },
};

export const useToolStore = create<ToolStore>((set, get) => ({
  // Initial state
  activeTool: "select",
  toolSettings: defaultToolSettings,

  // Actions
  setActiveTool: (tool: ToolType) => {
    set({ activeTool: tool });
  },

  updateToolSettings: <T extends ToolType>(
    tool: T,
    settings: Partial<ToolSettings[T]>
  ) => {
    set((state) => ({
      toolSettings: {
        ...state.toolSettings,
        [tool]: {
          ...state.toolSettings[tool],
          ...settings,
        },
      },
    }));
  },
}));
