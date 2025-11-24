/**
 * Unit tests for project storage utilities
 * Tests requirements: 4.1, 4.2, 4.3
 */

import {
  saveProject,
  loadProject,
  deleteProject,
  getProjectList,
  isStorageAvailable,
  getStorageInfo,
} from "../projectStorage";
import { SceneData, WallObject } from "../../types/scene";
import { ProjectData } from "../../types/project";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Test data
const mockWallObject: WallObject = {
  id: "wall-1",
  type: "wall",
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  properties: {},
  material: {
    id: "default-wall",
    name: "Default Wall",
    color: "#ffffff",
    roughness: 0.5,
    metalness: 0.0,
  },
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 5, y: 0 },
  height: 3,
  thickness: 0.2,
  openings: [],
};

const mockSceneData: SceneData = {
  objects: [mockWallObject],
  materials: [
    {
      id: "default-wall",
      name: "Default Wall",
      color: "#ffffff",
      roughness: 0.5,
      metalness: 0.0,
    },
  ],
  settings: {
    gridSize: 1,
    snapToGrid: true,
    units: "metric",
    lightingMode: "realistic",
  },
};

describe("projectStorage", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("isStorageAvailable", () => {
    it("should return true when localStorage is available", () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });

  describe("saveProject", () => {
    it("should save a new project successfully", async () => {
      const projectData = await saveProject(mockSceneData, "Test Project");

      expect(projectData).toBeDefined();
      expect(projectData.name).toBe("Test Project");
      expect(projectData.id).toBeDefined();
      expect(projectData.sceneData).toEqual(mockSceneData);
      expect(projectData.createdAt).toBeInstanceOf(Date);
      expect(projectData.updatedAt).toBeInstanceOf(Date);
    });

    it("should update an existing project", async () => {
      // First save
      const originalProject = await saveProject(mockSceneData, "Original Name");
      const originalCreatedAt = originalProject.createdAt;

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update save
      const updatedProject = await saveProject(
        mockSceneData,
        "Updated Name",
        originalProject.id
      );

      expect(updatedProject.id).toBe(originalProject.id);
      expect(updatedProject.name).toBe("Updated Name");
      expect(updatedProject.createdAt).toEqual(originalCreatedAt);
      expect(updatedProject.updatedAt.getTime()).toBeGreaterThan(
        originalProject.updatedAt.getTime()
      );
    });

    it("should handle save errors gracefully", async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error("Storage full");
      };

      await expect(saveProject(mockSceneData, "Test Project")).rejects.toThrow(
        "Failed to save project"
      );

      // Restore original method
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe("loadProject", () => {
    it("should load a saved project successfully", async () => {
      // Save a project first
      const savedProject = await saveProject(mockSceneData, "Test Project");

      // Load the project
      const loadedProject = await loadProject(savedProject.id);

      expect(loadedProject).toEqual(savedProject);
      expect(loadedProject.sceneData).toEqual(mockSceneData);
    });

    it("should throw error for non-existent project", async () => {
      await expect(loadProject("non-existent-id")).rejects.toThrow(
        "Project with ID non-existent-id not found"
      );
    });

    it("should validate project data when requested", async () => {
      // Save invalid project data directly to localStorage
      const invalidProjectKey = "3d-house-design-project-invalid";
      localStorageMock.setItem(
        invalidProjectKey,
        JSON.stringify({ invalid: "data" })
      );

      await expect(
        loadProject("invalid", { validateData: true })
      ).rejects.toThrow("Failed to load project");
    });
  });

  describe("deleteProject", () => {
    it("should delete a project successfully", async () => {
      // Save a project first
      const savedProject = await saveProject(mockSceneData, "Test Project");

      // Delete the project
      await deleteProject(savedProject.id);

      // Try to load the deleted project
      await expect(loadProject(savedProject.id)).rejects.toThrow(
        "Project with ID"
      );
    });

    it("should throw error when deleting non-existent project", async () => {
      await expect(deleteProject("non-existent-id")).rejects.toThrow(
        "Project with ID non-existent-id not found"
      );
    });

    it("should update project list after deletion", async () => {
      // Save two projects
      const project1 = await saveProject(mockSceneData, "Project 1");
      const project2 = await saveProject(mockSceneData, "Project 2");

      // Verify both are in the list
      let projectList = await getProjectList();
      expect(projectList).toHaveLength(2);

      // Delete one project
      await deleteProject(project1.id);

      // Verify only one remains
      projectList = await getProjectList();
      expect(projectList).toHaveLength(1);
      expect(projectList[0].id).toBe(project2.id);
    });
  });

  describe("getProjectList", () => {
    it("should return empty list when no projects exist", async () => {
      const projectList = await getProjectList();
      expect(projectList).toEqual([]);
    });

    it("should return list of saved projects", async () => {
      // Save multiple projects
      const project1 = await saveProject(mockSceneData, "Project 1");
      const project2 = await saveProject(mockSceneData, "Project 2");

      const projectList = await getProjectList();

      expect(projectList).toHaveLength(2);
      expect(projectList.find((p) => p.id === project1.id)).toBeDefined();
      expect(projectList.find((p) => p.id === project2.id)).toBeDefined();
    });

    it("should sort projects by updated date (most recent first)", async () => {
      // Save first project
      const project1 = await saveProject(mockSceneData, "Project 1");

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Save second project
      const project2 = await saveProject(mockSceneData, "Project 2");

      const projectList = await getProjectList();

      expect(projectList[0].id).toBe(project2.id); // Most recent first
      expect(projectList[1].id).toBe(project1.id);
    });

    it("should handle corrupted project list gracefully", async () => {
      // Set invalid JSON in project list
      localStorageMock.setItem("3d-house-design-projects", "invalid json");

      const projectList = await getProjectList();
      expect(projectList).toEqual([]);
    });
  });

  describe("getStorageInfo", () => {
    it("should return storage usage information", () => {
      // Save some data
      localStorageMock.setItem("3d-house-design-test", "test data");

      const storageInfo = getStorageInfo();

      expect(storageInfo.used).toBeGreaterThan(0);
      expect(storageInfo.available).toBeGreaterThan(0);
      expect(typeof storageInfo.used).toBe("number");
      expect(typeof storageInfo.available).toBe("number");
    });
  });
});
