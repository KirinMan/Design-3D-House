/**
 * Unit tests for ToolStore
 * Tests tool management functionality including tool selection and settings updates
 */

import { renderHook, act } from "@testing-library/react";
import { useToolStore } from "../toolStore";
import { ToolType } from "../../types/tools";

describe("ToolStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useToolStore());
    act(() => {
      result.current.setActiveTool("select");
    });
  });

  describe("Initial State", () => {
    it("should initialize with select tool as active", () => {
      const { result } = renderHook(() => useToolStore());
      expect(result.current.activeTool).toBe("select");
    });

    it("should initialize with default tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      // Check select tool settings
      expect(result.current.toolSettings.select).toEqual({
        snapToGrid: true,
        gridSize: 1,
        multiSelect: true,
        showBoundingBox: true,
      });

      // Check wall tool settings
      expect(result.current.toolSettings.wall).toEqual({
        snapToGrid: true,
        gridSize: 1,
        defaultHeight: 3,
        defaultThickness: 0.2,
        material: "default-wall",
      });

      // Check door tool settings
      expect(result.current.toolSettings.door).toEqual({
        snapToGrid: true,
        gridSize: 1,
        defaultWidth: 0.8,
        defaultHeight: 2,
        material: "default-door",
      });

      // Check window tool settings
      expect(result.current.toolSettings.window).toEqual({
        snapToGrid: true,
        gridSize: 1,
        defaultWidth: 1.2,
        defaultHeight: 1.2,
        material: "default-window",
      });

      // Check room tool settings
      expect(result.current.toolSettings.room).toEqual({
        snapToGrid: true,
        gridSize: 1,
        defaultCeilingHeight: 3,
        floorMaterial: "default-floor",
        ceilingMaterial: "default-ceiling",
      });
    });
  });

  describe("setActiveTool", () => {
    it("should set the active tool to wall", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.setActiveTool("wall");
      });

      expect(result.current.activeTool).toBe("wall");
    });

    it("should set the active tool to door", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.setActiveTool("door");
      });

      expect(result.current.activeTool).toBe("door");
    });

    it("should set the active tool to window", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.setActiveTool("window");
      });

      expect(result.current.activeTool).toBe("window");
    });

    it("should set the active tool to room", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.setActiveTool("room");
      });

      expect(result.current.activeTool).toBe("room");
    });

    it("should allow switching between different tools", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.setActiveTool("wall");
      });
      expect(result.current.activeTool).toBe("wall");

      act(() => {
        result.current.setActiveTool("door");
      });
      expect(result.current.activeTool).toBe("door");

      act(() => {
        result.current.setActiveTool("select");
      });
      expect(result.current.activeTool).toBe("select");
    });
  });

  describe("updateToolSettings", () => {
    it("should update wall tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.updateToolSettings("wall", {
          defaultHeight: 4,
          defaultThickness: 0.3,
        });
      });

      expect(result.current.toolSettings.wall.defaultHeight).toBe(4);
      expect(result.current.toolSettings.wall.defaultThickness).toBe(0.3);
      // Other settings should remain unchanged
      expect(result.current.toolSettings.wall.snapToGrid).toBe(true);
      expect(result.current.toolSettings.wall.gridSize).toBe(1);
      expect(result.current.toolSettings.wall.material).toBe("default-wall");
    });

    it("should update door tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.updateToolSettings("door", {
          defaultWidth: 1.0,
          material: "oak-door",
        });
      });

      expect(result.current.toolSettings.door.defaultWidth).toBe(1.0);
      expect(result.current.toolSettings.door.material).toBe("oak-door");
      // Other settings should remain unchanged
      expect(result.current.toolSettings.door.defaultHeight).toBe(2);
      expect(result.current.toolSettings.door.snapToGrid).toBe(true);
    });

    it("should update window tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.updateToolSettings("window", {
          defaultWidth: 1.5,
          defaultHeight: 1.5,
          material: "glass-window",
        });
      });

      expect(result.current.toolSettings.window.defaultWidth).toBe(1.5);
      expect(result.current.toolSettings.window.defaultHeight).toBe(1.5);
      expect(result.current.toolSettings.window.material).toBe("glass-window");
    });

    it("should update select tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.updateToolSettings("select", {
          multiSelect: false,
          showBoundingBox: false,
          gridSize: 0.5,
        });
      });

      expect(result.current.toolSettings.select.multiSelect).toBe(false);
      expect(result.current.toolSettings.select.showBoundingBox).toBe(false);
      expect(result.current.toolSettings.select.gridSize).toBe(0.5);
      expect(result.current.toolSettings.select.snapToGrid).toBe(true);
    });

    it("should update room tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.updateToolSettings("room", {
          defaultCeilingHeight: 3.5,
          floorMaterial: "hardwood",
          ceilingMaterial: "white-paint",
        });
      });

      expect(result.current.toolSettings.room.defaultCeilingHeight).toBe(3.5);
      expect(result.current.toolSettings.room.floorMaterial).toBe("hardwood");
      expect(result.current.toolSettings.room.ceilingMaterial).toBe(
        "white-paint"
      );
    });

    it("should not affect other tool settings when updating one tool", () => {
      const { result } = renderHook(() => useToolStore());

      // Store original settings
      const originalWallSettings = { ...result.current.toolSettings.wall };
      const originalDoorSettings = { ...result.current.toolSettings.door };

      act(() => {
        result.current.updateToolSettings("wall", {
          defaultHeight: 5,
        });
      });

      // Wall settings should be updated
      expect(result.current.toolSettings.wall.defaultHeight).toBe(5);

      // Door settings should remain unchanged
      expect(result.current.toolSettings.door).toEqual(originalDoorSettings);
    });

    it("should allow partial updates to tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      act(() => {
        result.current.updateToolSettings("wall", {
          defaultHeight: 2.5,
        });
      });

      expect(result.current.toolSettings.wall.defaultHeight).toBe(2.5);
      expect(result.current.toolSettings.wall.defaultThickness).toBe(0.2); // unchanged
      expect(result.current.toolSettings.wall.material).toBe("default-wall"); // unchanged
    });
  });

  describe("Tool Settings Persistence", () => {
    it("should maintain tool settings when switching active tools", () => {
      const { result } = renderHook(() => useToolStore());

      // Update wall settings
      act(() => {
        result.current.updateToolSettings("wall", {
          defaultHeight: 4,
        });
      });

      // Switch to door tool
      act(() => {
        result.current.setActiveTool("door");
      });

      // Switch back to wall tool
      act(() => {
        result.current.setActiveTool("wall");
      });

      // Wall settings should be preserved
      expect(result.current.toolSettings.wall.defaultHeight).toBe(4);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety for tool settings", () => {
      const { result } = renderHook(() => useToolStore());

      // This test ensures TypeScript compilation passes with correct types
      act(() => {
        result.current.updateToolSettings("wall", {
          defaultHeight: 3.5,
          defaultThickness: 0.25,
          material: "brick",
          snapToGrid: false,
          gridSize: 2,
        });
      });

      expect(result.current.toolSettings.wall.defaultHeight).toBe(3.5);
      expect(result.current.toolSettings.wall.defaultThickness).toBe(0.25);
      expect(result.current.toolSettings.wall.material).toBe("brick");
      expect(result.current.toolSettings.wall.snapToGrid).toBe(false);
      expect(result.current.toolSettings.wall.gridSize).toBe(2);
    });
  });
});
