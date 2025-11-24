/**
 * Confirmation dialog components for destructive actions
 */

import React, { createContext, useContext, useState, useCallback } from "react";

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error("useConfirmation must be used within a ConfirmationProvider");
  }
  return context;
}

interface ConfirmationProviderProps {
  children: React.ReactNode;
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = useCallback((options: ConfirmationOptions) => {
    setConfirmation(options);
  }, []);

  const handleConfirm = async () => {
    if (!confirmation) return;

    setIsLoading(true);
    try {
      await confirmation.onConfirm();
      setConfirmation(null);
    } catch (error) {
      console.error("Confirmation action failed:", error);
      // Keep dialog open on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirmation?.onCancel) {
      confirmation.onCancel();
    }
    setConfirmation(null);
  };

  const contextValue: ConfirmationContextValue = {
    confirm,
  };

  return (
    <ConfirmationContext.Provider value={contextValue}>
      {children}
      
      {confirmation && (
        <ConfirmationDialog
          options={confirmation}
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmationContext.Provider>
  );
}

interface ConfirmationDialogProps {
  options: ConfirmationOptions;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({ options, isLoading, onConfirm, onCancel }: ConfirmationDialogProps) {
  const {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    type = "danger",
  } = options;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: (
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case "warning":
        return {
          icon: (
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
        };
      case "info":
        return {
          icon: (
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        };
      default:
        return {
          icon: null,
          confirmButton: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center">
            {typeStyles.icon && (
              <div className="flex-shrink-0 mr-4">
                {typeStyles.icon}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${typeStyles.confirmButton}`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </div>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convenience hooks for common confirmation dialogs
export function useConfirmationHelpers() {
  const { confirm } = useConfirmation();

  const confirmDelete = useCallback((
    itemName: string,
    onConfirm: () => void | Promise<void>
  ) => {
    confirm({
      title: "Delete Item",
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      type: "danger",
      onConfirm,
    });
  }, [confirm]);

  const confirmClearScene = useCallback((onConfirm: () => void | Promise<void>) => {
    confirm({
      title: "Clear Scene",
      message: "Are you sure you want to clear the entire scene? All objects will be removed and this action cannot be undone.",
      confirmLabel: "Clear Scene",
      cancelLabel: "Cancel",
      type: "danger",
      onConfirm,
    });
  }, [confirm]);

  const confirmUnsavedChanges = useCallback((onConfirm: () => void | Promise<void>) => {
    confirm({
      title: "Unsaved Changes",
      message: "You have unsaved changes. Are you sure you want to continue? Your changes will be lost.",
      confirmLabel: "Continue",
      cancelLabel: "Cancel",
      type: "warning",
      onConfirm,
    });
  }, [confirm]);

  const confirmExport = useCallback((
    format: string,
    onConfirm: () => void | Promise<void>
  ) => {
    confirm({
      title: "Export Scene",
      message: `Export the current scene as ${format.toUpperCase()}? This may take a few moments for complex scenes.`,
      confirmLabel: "Export",
      cancelLabel: "Cancel",
      type: "info",
      onConfirm,
    });
  }, [confirm]);

  return {
    confirmDelete,
    confirmClearScene,
    confirmUnsavedChanges,
    confirmExport,
  };
}