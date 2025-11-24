/**
 * Project Manager Component - UI for save/load operations and project management
 * Implements requirements: 4.2, 4.3, 4.4
 */

import React, { useState, useEffect } from "react";
import { useProjectStore } from "../stores/projectStore";
import { ProjectListItem } from "../types/project";

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentProject,
    hasUnsavedChanges,
    isLoading,
    error,
    projectList,
    createNewProject,
    saveCurrentProject,
    loadProjectById,
    deleteProjectById,
    refreshProjectList,
    clearError,
  } = useProjectStore();

  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState<{
    action: () => void;
    message: string;
  } | null>(null);
  const [newProjectName, setNewProjectName] = useState("");

  // Load project list when component opens
  useEffect(() => {
    if (isOpen) {
      refreshProjectList();
    }
  }, [isOpen, refreshProjectList]);

  // Clear error when component closes
  useEffect(() => {
    if (!isOpen && error) {
      clearError();
    }
  }, [isOpen, error, clearError]);

  const handleNewProject = async () => {
    if (!newProjectName.trim()) return;

    if (hasUnsavedChanges) {
      setShowUnsavedWarning({
        action: async () => {
          await createNewProject(newProjectName.trim());
          setNewProjectName("");
          setShowNewProjectDialog(false);
          setShowUnsavedWarning(null);
        },
        message: "Creating a new project will discard unsaved changes. Continue?",
      });
      return;
    }

    await createNewProject(newProjectName.trim());
    setNewProjectName("");
    setShowNewProjectDialog(false);
  };

  const handleLoadProject = async (projectId: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning({
        action: async () => {
          await loadProjectById(projectId);
          setShowUnsavedWarning(null);
          onClose();
        },
        message: "Loading a project will discard unsaved changes. Continue?",
      });
      return;
    }

    await loadProjectById(projectId);
    onClose();
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProjectById(projectId);
    setShowDeleteConfirm(null);
  };

  const handleSaveProject = async () => {
    await saveCurrentProject({ generateThumbnail: true });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Project Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="text-red-800">
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Current Project Section */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current Project
          </h3>
          {currentProject ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {currentProject.name}
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-orange-600 text-sm">
                      (Unsaved changes)
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  Last updated: {formatDate(currentProject.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProject}
                  disabled={isLoading || !hasUnsavedChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No project currently open</p>
          )}
        </div>

        {/* Actions Section */}
        <div className="p-6 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setShowNewProjectDialog(true)}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              New Project
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Saved Projects ({projectList.length})
            </h3>
            
            {projectList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No saved projects found</p>
                <p className="text-sm mt-2">Create a new project to get started</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {projectList.map((project) => (
                  <div
                    key={project.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail placeholder */}
                          <div className="w-16 h-12 bg-gray-200 rounded border flex items-center justify-center">
                            {project.thumbnail ? (
                              <img
                                src={project.thumbnail}
                                alt={`${project.name} thumbnail`}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs">No preview</span>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {project.name}
                              {currentProject?.id === project.id && (
                                <span className="ml-2 text-blue-600 text-sm">
                                  (Current)
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Updated: {formatDate(project.updatedAt)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Size: {formatFileSize(project.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadProject(project.id)}
                          disabled={isLoading || currentProject?.id === project.id}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(project.id)}
                          disabled={isLoading}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Project
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleNewProject()}
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowNewProjectDialog(false);
                  setNewProjectName("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNewProject}
                disabled={!newProjectName.trim() || isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Project
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(showDeleteConfirm)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Warning Dialog */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Unsaved Changes
            </h3>
            <p className="text-gray-600 mb-6">{showUnsavedWarning.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUnsavedWarning(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={showUnsavedWarning.action}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};