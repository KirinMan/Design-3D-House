/**
 * Hook for handling unsaved changes warnings
 * Implements requirements: 4.4
 */

import { useEffect } from "react";
import { useProjectStore } from "../stores/projectStore";

export const useUnsavedChangesWarning = () => {
  const { hasUnsavedChanges, currentProject } = useProjectStore();

  useEffect(() => {
    // Warn user before closing/refreshing the page if there are unsaved changes
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && currentProject) {
        event.preventDefault();
        event.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return event.returnValue;
      }
    };

    // Add event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, currentProject]);

  return {
    hasUnsavedChanges,
    currentProject,
  };
};
