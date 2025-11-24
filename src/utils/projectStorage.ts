/**
 * Project Storage Utilities - Local storage persistence for 3D house design projects
 * Implements requirements: 4.1, 4.2, 4.3
 */

import {
  ProjectData,
  ProjectMetadata,
  ProjectSaveOptions,
  ProjectLoadOptions,
  ProjectListItem,
} from "../types/project";
import { SceneData } from "../types/scene";

const STORAGE_PREFIX = "3d-house-design";
const PROJECT_LIST_KEY = `${STORAGE_PREFIX}-projects`;
const PROJECT_KEY_PREFIX = `${STORAGE_PREFIX}-project`;

/**
 * Generate a unique project ID
 */
function generateProjectId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the storage key for a specific project
 */
function getProjectKey(projectId: string): string {
  return `${PROJECT_KEY_PREFIX}-${projectId}`;
}

/**
 * Generate a thumbnail from the current 3D scene
 * This is a placeholder implementation - in a real app, this would capture the canvas
 */
function generateThumbnail(): string | undefined {
  // TODO: Implement actual thumbnail generation from 3D viewport
  // For now, return undefined
  return undefined;
}

/**
 * Calculate the size of a project in bytes
 */
function calculateProjectSize(projectData: ProjectData): number {
  return new Blob([JSON.stringify(projectData)]).size;
}

/**
 * Save a project to local storage
 */
export async function saveProject(
  sceneData: SceneData,
  projectName: string,
  existingProjectId?: string,
  options: ProjectSaveOptions = {}
): Promise<ProjectData> {
  try {
    const now = new Date();
    const projectId = existingProjectId || generateProjectId();

    // Generate thumbnail if requested
    const thumbnail = options.generateThumbnail
      ? generateThumbnail()
      : undefined;

    // Get existing project data if updating
    let existingProject: ProjectData | null = null;
    if (existingProjectId) {
      existingProject = await loadProject(existingProjectId);
    }

    const projectData: ProjectData = {
      id: projectId,
      name: projectName,
      description: existingProject?.description,
      createdAt: existingProject?.createdAt || now,
      updatedAt: now,
      version: "1.0.0",
      sceneData,
      thumbnail,
      tags: existingProject?.tags,
    };

    // Save project data
    const projectKey = getProjectKey(projectId);
    localStorage.setItem(projectKey, JSON.stringify(projectData));

    // Update project list
    await updateProjectList(projectData);

    return projectData;
  } catch (error) {
    throw new Error(
      `Failed to save project: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Load a project from local storage
 */
export async function loadProject(
  projectId: string,
  options: ProjectLoadOptions = {}
): Promise<ProjectData> {
  try {
    const projectKey = getProjectKey(projectId);
    const projectDataString = localStorage.getItem(projectKey);

    if (!projectDataString) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const projectData: ProjectData = JSON.parse(projectDataString);

    // Validate data if requested
    if (options.validateData) {
      validateProjectData(projectData);
    }

    // Convert date strings back to Date objects
    projectData.createdAt = new Date(projectData.createdAt);
    projectData.updatedAt = new Date(projectData.updatedAt);

    return projectData;
  } catch (error) {
    throw new Error(
      `Failed to load project: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Delete a project from local storage
 */
export async function deleteProject(projectId: string): Promise<void> {
  try {
    const projectKey = getProjectKey(projectId);

    // Check if project exists
    if (!localStorage.getItem(projectKey)) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    // Remove project data
    localStorage.removeItem(projectKey);

    // Update project list
    const projectList = await getProjectList();
    const updatedList = projectList.filter(
      (project) => project.id !== projectId
    );
    localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(updatedList));
  } catch (error) {
    throw new Error(
      `Failed to delete project: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get list of all saved projects
 */
export async function getProjectList(): Promise<ProjectListItem[]> {
  try {
    const projectListString = localStorage.getItem(PROJECT_LIST_KEY);

    if (!projectListString) {
      return [];
    }

    const projectList: ProjectListItem[] = JSON.parse(projectListString);

    // Convert date strings back to Date objects
    return projectList.map((project) => ({
      ...project,
      updatedAt: new Date(project.updatedAt),
    }));
  } catch (error) {
    console.error("Failed to get project list:", error);
    return [];
  }
}

/**
 * Update the project list with a new or updated project
 */
async function updateProjectList(projectData: ProjectData): Promise<void> {
  const projectList = await getProjectList();

  const projectListItem: ProjectListItem = {
    id: projectData.id,
    name: projectData.name,
    updatedAt: projectData.updatedAt,
    thumbnail: projectData.thumbnail,
    size: calculateProjectSize(projectData),
  };

  // Remove existing entry if it exists
  const filteredList = projectList.filter(
    (project) => project.id !== projectData.id
  );

  // Add updated entry
  filteredList.unshift(projectListItem);

  // Sort by updated date (most recent first)
  filteredList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  localStorage.setItem(PROJECT_LIST_KEY, JSON.stringify(filteredList));
}

/**
 * Validate project data structure
 */
function validateProjectData(projectData: ProjectData): void {
  if (!projectData.id || typeof projectData.id !== "string") {
    throw new Error("Invalid project data: missing or invalid id");
  }

  if (!projectData.name || typeof projectData.name !== "string") {
    throw new Error("Invalid project data: missing or invalid name");
  }

  if (!projectData.sceneData) {
    throw new Error("Invalid project data: missing scene data");
  }

  if (
    !projectData.sceneData.objects ||
    !Array.isArray(projectData.sceneData.objects)
  ) {
    throw new Error("Invalid project data: invalid scene objects");
  }
}

/**
 * Check if local storage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): { used: number; available: number } {
  let used = 0;

  // Calculate used storage
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_PREFIX)) {
      used += localStorage[key].length;
    }
  }

  // Estimate available storage (5MB is typical localStorage limit)
  const estimated = 5 * 1024 * 1024; // 5MB in bytes

  return {
    used,
    available: Math.max(0, estimated - used),
  };
}
