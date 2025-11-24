/**
 * Project Controls Component - Quick save/load controls for the main UI
 * Implements requirements: 4.2, 4.3, 4.4
 */

import React, { useState } from "react";
import { useProjectStore } from "../stores/projectStore";
import { ProjectManager } from "./ProjectManager";

export const ProjectControls: React.FC = () => {
  const {
    currentProject,
    hasUnsavedChanges,
    isLoading,
    saveCurrentProject,
  } = useProjectStore();

  const [showProjectManager, setShowProjectManager] = useState(false);

  const handleQuickSave = async () => {
    if (currentProject) {
      await saveCurrentProject({ generateThumbnail: true });
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-white border-b">
        {/* Project Name Display */}
        <div className="flex-1 min-w-0">
          {currentProject ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {currentProject.name}
              </span>
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                  Unsaved
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500">No project open</span>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Save Button */}
          {currentProject && hasUnsavedChanges && (
            <button
              onClick={handleQuickSave}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Quick Save (Ctrl+S)"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          )}

          {/* Project Manager Button */}
          <button
            onClick={() => setShowProjectManager(true)}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            title="Open Project Manager"
          >
            Projects
          </button>
        </div>
      </div>

      {/* Project Manager Modal */}
      <ProjectManager
        isOpen={showProjectManager}
        onClose={() => setShowProjectManager(false)}
      />
    </>
  );
};

// Hook for keyboard shortcuts
export const useProjectKeyboardShortcuts = () => {
  const { currentProject, hasUnsavedChanges, saveCurrentProject } = useProjectStore();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S for quick save
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        if (currentProject && hasUnsavedChanges) {
          saveCurrentProject({ generateThumbnail: true });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentProject, hasUnsavedChanges, saveCurrentProject]);
};