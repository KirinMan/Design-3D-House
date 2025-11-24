/**
 * Error recovery mechanisms for the 3D house design application
 */

import { AppError, ErrorType } from "../types/errors";
import { errorHandler } from "./errorHandler";

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  isPrimary?: boolean;
}

export interface RecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  getRecoveryActions: (error: AppError) => RecoveryAction[];
}

class ErrorRecoveryManager {
  private strategies: RecoveryStrategy[] = [];

  constructor() {
    this.registerDefaultStrategies();
  }

  private registerDefaultStrategies() {
    // Scene loading error recovery
    this.registerStrategy({
      canRecover: (error) => error.type === ErrorType.SCENE_LOAD_ERROR,
      getRecoveryActions: (error) => [
        {
          label: "Create New Scene",
          action: () => {
            // Clear scene and start fresh
            if (typeof window !== "undefined") {
              localStorage.removeItem("currentScene");
              window.location.reload();
            }
          },
          isPrimary: true,
        },
        {
          label: "Load Backup",
          action: async () => {
            try {
              const backup = localStorage.getItem("sceneBackup");
              if (backup) {
                localStorage.setItem("currentScene", backup);
                window.location.reload();
              }
            } catch (e) {
              errorHandler.handleError(
                errorHandler.createAppError(
                  ErrorType.STORAGE_ERROR,
                  "Failed to load backup",
                  e
                )
              );
            }
          },
        },
      ],
    });

    // Storage error recovery
    this.registerStrategy({
      canRecover: (error) => error.type === ErrorType.STORAGE_ERROR,
      getRecoveryActions: (error) => [
        {
          label: "Clear Storage",
          action: () => {
            try {
              localStorage.clear();
              window.location.reload();
            } catch (e) {
              console.error("Failed to clear storage:", e);
            }
          },
          isPrimary: true,
        },
        {
          label: "Export Current Work",
          action: async () => {
            try {
              // Attempt to export current scene data
              const sceneData = localStorage.getItem("currentScene");
              if (sceneData) {
                const blob = new Blob([sceneData], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scene-backup-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }
            } catch (e) {
              console.error("Failed to export scene:", e);
            }
          },
        },
      ],
    });

    // Geometry error recovery
    this.registerStrategy({
      canRecover: (error) => error.type === ErrorType.GEOMETRY_ERROR,
      getRecoveryActions: (error) => [
        {
          label: "Reset Object",
          action: () => {
            // Reset the problematic object to default state
            const objectId = error.details?.objectId;
            if (objectId) {
              // This would need to be connected to the scene store
              console.log(`Resetting object ${objectId}`);
            }
          },
          isPrimary: true,
        },
        {
          label: "Remove Object",
          action: () => {
            // Remove the problematic object
            const objectId = error.details?.objectId;
            if (objectId) {
              console.log(`Removing object ${objectId}`);
            }
          },
        },
      ],
    });

    // Export error recovery
    this.registerStrategy({
      canRecover: (error) => error.type === ErrorType.EXPORT_ERROR,
      getRecoveryActions: (error) => [
        {
          label: "Try Different Format",
          action: () => {
            // Suggest trying a different export format
            console.log("Suggesting different export format");
          },
          isPrimary: true,
        },
        {
          label: "Simplify Scene",
          action: () => {
            // Suggest removing complex objects before export
            console.log("Suggesting scene simplification");
          },
        },
      ],
    });

    // Material error recovery
    this.registerStrategy({
      canRecover: (error) => error.type === ErrorType.MATERIAL_ERROR,
      getRecoveryActions: (error) => [
        {
          label: "Use Default Material",
          action: () => {
            // Apply default material to affected objects
            console.log("Applying default material");
          },
          isPrimary: true,
        },
        {
          label: "Reload Materials",
          action: async () => {
            // Attempt to reload material definitions
            try {
              // This would reload material configurations
              console.log("Reloading materials");
            } catch (e) {
              console.error("Failed to reload materials:", e);
            }
          },
        },
      ],
    });

    // Tool error recovery
    this.registerStrategy({
      canRecover: (error) => error.type === ErrorType.TOOL_ERROR,
      getRecoveryActions: (error) => [
        {
          label: "Reset Tool",
          action: () => {
            // Reset tool to default state
            console.log("Resetting tool to default state");
          },
          isPrimary: true,
        },
        {
          label: "Switch to Select Tool",
          action: () => {
            // Switch to safe select tool
            console.log("Switching to select tool");
          },
        },
      ],
    });

    // Validation error recovery
    this.registerStrategy({
      canRecover: (error) => error.type === ErrorType.VALIDATION_ERROR,
      getRecoveryActions: (error) => [
        {
          label: "Reset to Valid Value",
          action: () => {
            // Reset field to last valid value
            const field = error.details?.field;
            console.log(`Resetting field ${field} to valid value`);
          },
          isPrimary: true,
        },
        {
          label: "Use Default Value",
          action: () => {
            // Use default value for the field
            const field = error.details?.field;
            console.log(`Using default value for field ${field}`);
          },
        },
      ],
    });
  }

  public registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  public getRecoveryActions(error: AppError): RecoveryAction[] {
    const applicableStrategies = this.strategies.filter((strategy) =>
      strategy.canRecover(error)
    );

    const allActions: RecoveryAction[] = [];
    applicableStrategies.forEach((strategy) => {
      allActions.push(...strategy.getRecoveryActions(error));
    });

    // Always add generic recovery actions
    allActions.push(
      {
        label: "Refresh Page",
        action: () => window.location.reload(),
      },
      {
        label: "Report Issue",
        action: () => {
          // Open issue reporting (could be a modal or external link)
          console.log("Opening issue reporting");
        },
      }
    );

    return allActions;
  }

  public canRecover(error: AppError): boolean {
    return this.strategies.some((strategy) => strategy.canRecover(error));
  }
}

export const errorRecovery = new ErrorRecoveryManager();

// Helper function to create recovery-aware error handlers
export function createRecoverableErrorHandler(
  onError?: (error: AppError, recoveryActions: RecoveryAction[]) => void
) {
  return (error: AppError) => {
    const recoveryActions = errorRecovery.getRecoveryActions(error);

    if (onError) {
      onError(error, recoveryActions);
    } else {
      // Default behavior: log error and recovery options
      console.error("Error occurred:", error);
      console.log("Available recovery actions:", recoveryActions);
    }
  };
}
