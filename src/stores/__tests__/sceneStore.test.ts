/**
 * Unit tests for SceneStore
 */

import { renderHook, act } from "@testing-library/react";
import { useSceneStore } from "../sceneStore";
import { SceneObject, SceneData } from "../../types/scene";

// Mock scene object for testing
const mockSceneObject: SceneObject = {
  id: "test-wall-1",
  type: "wall",
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  properties: { height: 3, thickness: 0.2 },
  material: {
    id: "default-wall",
    name: "Default Wall",
    roughness: 0.8,
    metalness: 0.1,
    color: "#ffffff",
  },
};

const mockSceneObject2: SceneObject = {
  id: "test-door-1",
  type: "door",
  position: { x: 2, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  properties: { width: 0.8, height: 2 },
  material: {
    id: "default-door",
    name: "Default Door",
    roughness: 0.6,
    metalness: 0.2,
    color: "#8B4513",
  },
};

describe("SceneStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useSceneStore());
    act(() => {
      result.current.clearScene();
    });
  });

  describe("addObject", () => {
    it("should add an object to the scene", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
      });

      expect(result.current.objects.has("test-wall-1")).toBe(true);
      expect(result.current.objects.get("test-wall-1")).toEqual(
        mockSceneObject
      );
    });

    it("should add multiple objects to the scene", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.addObject(mockSceneObject2);
      });

      expect(result.current.objects.size).toBe(2);
      expect(result.current.objects.has("test-wall-1")).toBe(true);
      expect(result.current.objects.has("test-door-1")).toBe(true);
    });
  });

  describe("removeObject", () => {
    it("should remove an object from the scene", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.removeObject("test-wall-1");
      });

      expect(result.current.objects.has("test-wall-1")).toBe(false);
      expect(result.current.objects.size).toBe(0);
    });

    it("should remove object from selection when deleted", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.selectObjects(["test-wall-1"]);
        result.current.removeObject("test-wall-1");
      });

      expect(result.current.selectedObjects).toEqual([]);
    });

    it("should handle removing non-existent object gracefully", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.removeObject("non-existent-id");
      });

      expect(result.current.objects.size).toBe(0);
    });
  });

  describe("updateObject", () => {
    it("should update an existing object", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.updateObject("test-wall-1", {
          position: { x: 5, y: 0, z: 0 },
          properties: { height: 4, thickness: 0.3 },
        });
      });

      const updatedObject = result.current.objects.get("test-wall-1");
      expect(updatedObject?.position).toEqual({ x: 5, y: 0, z: 0 });
      expect(updatedObject?.properties.height).toBe(4);
      expect(updatedObject?.properties.thickness).toBe(0.3);
    });

    it("should handle updating non-existent object gracefully", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.updateObject("non-existent-id", {
          position: { x: 1, y: 1, z: 1 },
        });
      });

      expect(result.current.objects.size).toBe(0);
    });
  });

  describe("selectObjects", () => {
    it("should select objects by their IDs", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.addObject(mockSceneObject2);
        result.current.selectObjects(["test-wall-1", "test-door-1"]);
      });

      expect(result.current.selectedObjects).toEqual([
        "test-wall-1",
        "test-door-1",
      ]);
    });

    it("should clear selection when empty array is passed", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.selectObjects(["test-wall-1"]);
        result.current.selectObjects([]);
      });

      expect(result.current.selectedObjects).toEqual([]);
    });
  });

  describe("clearScene", () => {
    it("should clear all objects and selections", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.addObject(mockSceneObject2);
        result.current.selectObjects(["test-wall-1"]);
        result.current.clearScene();
      });

      expect(result.current.objects.size).toBe(0);
      expect(result.current.selectedObjects).toEqual([]);
    });
  });

  describe("loadScene", () => {
    it("should load scene data and populate objects", () => {
      const { result } = renderHook(() => useSceneStore());

      const sceneData: SceneData = {
        objects: [mockSceneObject, mockSceneObject2],
        materials: [],
        settings: {
          gridSize: 1,
          snapToGrid: true,
          units: "metric",
          lightingMode: "realistic",
        },
      };

      act(() => {
        result.current.loadScene(sceneData);
      });

      expect(result.current.objects.size).toBe(2);
      expect(result.current.objects.has("test-wall-1")).toBe(true);
      expect(result.current.objects.has("test-door-1")).toBe(true);
      expect(result.current.selectedObjects).toEqual([]);
    });

    it("should clear existing objects when loading new scene", () => {
      const { result } = renderHook(() => useSceneStore());

      const existingObject: SceneObject = {
        ...mockSceneObject,
        id: "existing-object",
      };

      const sceneData: SceneData = {
        objects: [mockSceneObject],
        materials: [],
        settings: {
          gridSize: 1,
          snapToGrid: true,
          units: "metric",
          lightingMode: "realistic",
        },
      };

      act(() => {
        result.current.addObject(existingObject);
        result.current.loadScene(sceneData);
      });

      expect(result.current.objects.size).toBe(1);
      expect(result.current.objects.has("existing-object")).toBe(false);
      expect(result.current.objects.has("test-wall-1")).toBe(true);
    });
  });

  describe("exportScene", () => {
    it("should export current scene data", () => {
      const { result } = renderHook(() => useSceneStore());

      act(() => {
        result.current.addObject(mockSceneObject);
        result.current.addObject(mockSceneObject2);
      });

      const exportedData = result.current.exportScene();

      expect(exportedData.objects).toHaveLength(2);
      expect(exportedData.objects).toContainEqual(mockSceneObject);
      expect(exportedData.objects).toContainEqual(mockSceneObject2);
      expect(exportedData.settings).toBeDefined();
    });

    it("should export empty scene when no objects exist", () => {
      const { result } = renderHook(() => useSceneStore());

      const exportedData = result.current.exportScene();

      expect(exportedData.objects).toHaveLength(0);
      expect(exportedData.settings).toBeDefined();
    });
  });
});
