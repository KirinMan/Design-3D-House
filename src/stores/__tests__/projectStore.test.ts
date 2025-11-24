/**
 * Unit tests for project store
 * Tests requirements: 4.1, 4.2, 4.3, 4.4
 */

import { act, renderHook } from "@testing-library/react";
import { useProjectStore } from "../projectStore";
import { useSceneStore } from "../sceneStore";
import * as projectStorage from "../../utils/projectStorage";

// Mock the project storage utilities
jest.mock("../../utils/projectStorage");
const mockProjectStorage = projectStorage as jest.Mocked<typeof projectStorage>;

// Mock the scene store
jest.mock("../sceneStore");
const mockUseSceneStore = useSceneStore as jest.MockedFunction<
  typeof useSceneStore
>;

const mockSceneStore = {
  objects: new Map(),
  selectedObjects: [],
  selectedOpening: null,
  clearScene: jest.fn(),
  loadScene: jest.fn(),
  exportScene: jest.fn(() => ({
    objects: [],
    materials: [],
    settings: {
      gridSize: 1,
      snapToGrid: true,
      units: "metric" as const,
      lightingMode: "realistic" as const,
    },
  })),
  addObject: jest.fn(),
  removeObject: jest.fn(),
  updateObject: jest.fn(),
  selectObjects: jest.fn(),
  selectOpening: jest.fn(),
};

describe("projectStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSceneStore.mockReturnValue(mockSceneStore);
    mockUseSceneStore.getState = jest.fn(() => mockSceneStore);
    mockProjectStorage.isStorageAvailable.mockReturnValue(true);
  });

  describe("createNewProject", () => {
    it("should create a new project successfully", async () => {
      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.createNewProject("Test Project");
      });

      expect(result.current.currentProject).toBeDefined();
      expect(result.current.currentProject?.name).toBe("Test Project");
      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(mockSceneStore.clearScene).toHaveBeenCalled();
    });

    it("should handle storage unavailable error", async () => {
      mockProjectStorage.isStorageAvailable.mockReturnValue(false);
      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.createNewProject("Test Project");
      });

      expect(result.current.error).toBe("Local storage is not available");
      expect(result.current.currentProject).toBeNull();
    });
  });

  describe("saveCurrentProject", () => {
    it("should save current project successfully", async () => {
      const mockSavedProject = {
        id: "project-1",
        name: "Test Project",
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
        sceneData: {
          objects: [],
          materials: [],
          settings: {
            gridSize: 1,
            snapToGrid: true,
            units: "metric" as const,
            lightingMode: "realistic" as const,
          },
        },
      };

      mockProjectStorage.saveProject.mockResolvedValue(mockSavedProject);
      mockProjectStorage.getProjectList.mockResolvedValue([]);

      const { result } = renderHook(() => useProjectStore());

      // First create a project
      await act(async () => {
        await result.current.createNewProject("Test Project");
      });

      // Then save it
      await act(async () => {
        await result.current.saveCurrentProject();
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(mockProjectStorage.saveProject).toHaveBeenCalled();
    });

    it("should handle error when no current project", async () => {
      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.saveCurrentProject();
      });

      expect(result.current.error).toBe("No project to save");
    });

    it("should handle storage unavailable error", async () => {
      mockProjectStorage.isStorageAvailable.mockReturnValue(false);
      const { result } = renderHook(() => useProjectStore());

      // Create a project first
      mockProjectStorage.isStorageAvailable.mockReturnValue(true);
      await act(async () => {
        await result.current.createNewProject("Test Project");
      });

      // Then try to save with storage unavailable
      mockProjectStorage.isStorageAvailable.mockReturnValue(false);
      await act(async () => {
        await result.current.saveCurrentProject();
      });

      expect(result.current.error).toBe("Local storage is not available");
    });
  });

  describe("loadProjectById", () => {
    it("should load project successfully", async () => {
      const mockProject = {
        id: "project-1",
        name: "Test Project",
        createdAt: new Date(),
        updatedAt: new Date(),
        version: "1.0.0",
        sceneData: {
          objects: [],
          materials: [],
          settings: {
            gridSize: 1,
            snapToGrid: true,
            units: "metric" as const,
            lightingMode: "realistic" as const,
          },
        },
      };

      mockProjectStorage.loadProject.mockResolvedValue(mockProject);

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.loadProjectById("project-1");
      });

      expect(result.current.currentProject).toEqual(mockProject);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(mockSceneStore.loadScene).toHaveBeenCalledWith(
        mockProject.sceneData
      );
    });

    it("should handle load error", async () => {
      mockProjectStorage.loadProject.mockRejectedValue(
        new Error("Project not found")
      );

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.loadProjectById("non-existent");
      });

      expect(result.current.error).toBe("Project not found");
      expect(result.current.currentProject).toBeNull();
    });
  });

  describe("deleteProjectById", () => {
    it("should delete project successfully", async () => {
      mockProjectStorage.deleteProject.mockResolvedValue();
      mockProjectStorage.getProjectList.mockResolvedValue([]);

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.deleteProjectById("project-1");
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockProjectStorage.deleteProject).toHaveBeenCalledWith(
        "project-1"
      );
    });

    it("should clear current project if it was deleted", async () => {
      mockProjectStorage.deleteProject.mockResolvedValue();
      mockProjectStorage.getProjectList.mockResolvedValue([]);

      const { result } = renderHook(() => useProjectStore());

      // Set a current project
      await act(async () => {
        await result.current.createNewProject("Test Project");
      });

      // Manually set the project ID to match what we're deleting
      act(() => {
        if (result.current.currentProject) {
          result.current.currentProject.id = "project-1";
        }
      });

      // Delete the current project
      await act(async () => {
        await result.current.deleteProjectById("project-1");
      });

      expect(result.current.currentProject).toBeNull();
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe("project metadata actions", () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useProjectStore());
      await act(async () => {
        await result.current.createNewProject("Test Project");
      });
    });

    it("should update project name", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.updateProjectName("Updated Name");
      });

      expect(result.current.currentProject?.name).toBe("Updated Name");
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it("should update project description", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.updateProjectDescription("Test description");
      });

      expect(result.current.currentProject?.description).toBe(
        "Test description"
      );
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it("should add project tag", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.addProjectTag("residential");
      });

      expect(result.current.currentProject?.tags).toContain("residential");
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it("should not add duplicate tags", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.addProjectTag("residential");
        result.current.addProjectTag("residential");
      });

      expect(
        result.current.currentProject?.tags?.filter(
          (tag) => tag === "residential"
        )
      ).toHaveLength(1);
    });

    it("should remove project tag", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.addProjectTag("residential");
        result.current.addProjectTag("modern");
        result.current.removeProjectTag("residential");
      });

      expect(result.current.currentProject?.tags).not.toContain("residential");
      expect(result.current.currentProject?.tags).toContain("modern");
    });
  });

  describe("unsaved changes tracking", () => {
    it("should mark as changed", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.markAsChanged();
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it("should mark as saved", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.markAsChanged();
        result.current.markAsSaved();
      });

      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should set and clear errors", () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.error).toBe("Test error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
