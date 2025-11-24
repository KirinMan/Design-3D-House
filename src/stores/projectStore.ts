/**
 * Project Store - Manages current project state and persistence
 * Implements requirements: 4.1, 4.2, 4.3, 4.4
 */

import { create } from "zustand";
import {
  ProjectData,
  ProjectMetadata,
  ProjectSaveOptions,
  ProjectLoadOptions,
  ProjectListItem,
} from "../types/project";
import {
  saveProject,
  loadProject,
  deleteProject,
  getProjectList,
  isStorageAvailable,
} from "../utils/projectStorage";
import { useSceneStore } from "./sceneStore";

export interface ProjectStore {
  // Current project state
  currentProject: ProjectData | null;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;

  // Project list
  projectList: ProjectListItem[];

  // Actions
  createNewProject: (name: string) => Promise<void>;
  saveCurrentProject: (options?: ProjectSaveOptions) => Promise<void>;
  loadProjectById: (
    projectId: string,
    options?: ProjectLoadOptions
  ) => Promise<void>;
  deleteProjectById: (projectId: string) => Promise<void>;
  refreshProjectList: () => Promise<void>;

  // Project metadata actions
  updateProjectName: (name: string) => void;
  updateProjectDescription: (description: string) => void;
  addProjectTag: (tag: string) => void;
  removeProjectTag: (tag: string) => void;

  // Unsaved changes tracking
  markAsChanged: () => void;
  markAsSaved: () => void;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  currentProject: null,
  hasUnsavedChanges: false,
  isLoading: false,
  error: null,
  projectList: [],

  // Actions
  createNewProject: async (name: string) => {
    if (!isStorageAvailable()) {
      set({ error: "Local storage is not available" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Clear current scene
      const sceneStore = useSceneStore.getState();
      sceneStore.clearScene();

      // Create new project data
      const now = new Date();
      const newProject: ProjectData = {
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        createdAt: now,
        updatedAt: now,
        version: "1.0.0",
        sceneData: sceneStore.exportScene(),
      };

      set({
        currentProject: newProject,
        hasUnsavedChanges: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create new project",
        isLoading: false,
      });
    }
  },

  saveCurrentProject: async (options: ProjectSaveOptions = {}) => {
    const { currentProject } = get();

    if (!currentProject) {
      set({ error: "No project to save" });
      return;
    }

    if (!isStorageAvailable()) {
      set({ error: "Local storage is not available" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const sceneStore = useSceneStore.getState();
      const sceneData = sceneStore.exportScene();

      const savedProject = await saveProject(
        sceneData,
        currentProject.name,
        currentProject.id,
        options
      );

      set({
        currentProject: savedProject,
        hasUnsavedChanges: false,
        isLoading: false,
      });

      // Refresh project list
      await get().refreshProjectList();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to save project",
        isLoading: false,
      });
    }
  },

  loadProjectById: async (
    projectId: string,
    options: ProjectLoadOptions = {}
  ) => {
    if (!isStorageAvailable()) {
      set({ error: "Local storage is not available" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const projectData = await loadProject(projectId, options);

      // Load scene data into scene store
      const sceneStore = useSceneStore.getState();
      sceneStore.loadScene(projectData.sceneData);

      set({
        currentProject: projectData,
        hasUnsavedChanges: false,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load project",
        isLoading: false,
      });
    }
  },

  deleteProjectById: async (projectId: string) => {
    if (!isStorageAvailable()) {
      set({ error: "Local storage is not available" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await deleteProject(projectId);

      // If we deleted the current project, clear it
      const { currentProject } = get();
      if (currentProject && currentProject.id === projectId) {
        set({ currentProject: null, hasUnsavedChanges: false });
      }

      // Refresh project list
      await get().refreshProjectList();

      set({ isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete project",
        isLoading: false,
      });
    }
  },

  refreshProjectList: async () => {
    try {
      const projectList = await getProjectList();
      set({ projectList });
    } catch (error) {
      console.error("Failed to refresh project list:", error);
    }
  },

  // Project metadata actions
  updateProjectName: (name: string) => {
    const { currentProject } = get();
    if (currentProject) {
      set({
        currentProject: { ...currentProject, name },
        hasUnsavedChanges: true,
      });
    }
  },

  updateProjectDescription: (description: string) => {
    const { currentProject } = get();
    if (currentProject) {
      set({
        currentProject: { ...currentProject, description },
        hasUnsavedChanges: true,
      });
    }
  },

  addProjectTag: (tag: string) => {
    const { currentProject } = get();
    if (currentProject) {
      const tags = currentProject.tags || [];
      if (!tags.includes(tag)) {
        set({
          currentProject: {
            ...currentProject,
            tags: [...tags, tag],
          },
          hasUnsavedChanges: true,
        });
      }
    }
  },

  removeProjectTag: (tag: string) => {
    const { currentProject } = get();
    if (currentProject && currentProject.tags) {
      set({
        currentProject: {
          ...currentProject,
          tags: currentProject.tags.filter((t) => t !== tag),
        },
        hasUnsavedChanges: true,
      });
    }
  },

  // Unsaved changes tracking
  markAsChanged: () => {
    set({ hasUnsavedChanges: true });
  },

  markAsSaved: () => {
    set({ hasUnsavedChanges: false });
  },

  // Error handling
  clearError: () => {
    set({ error: null });
  },

  setError: (error: string) => {
    set({ error });
  },
}));

// Subscribe to scene changes to mark project as changed
let previousSceneState: string | null = null;

useSceneStore.subscribe((state) => {
  const currentSceneState = JSON.stringify({
    objects: Array.from(state.objects.entries()),
    selectedObjects: state.selectedObjects,
  });

  if (previousSceneState !== null && previousSceneState !== currentSceneState) {
    const projectStore = useProjectStore.getState();
    if (projectStore.currentProject && !projectStore.hasUnsavedChanges) {
      projectStore.markAsChanged();
    }
  }

  previousSceneState = currentSceneState;
});
