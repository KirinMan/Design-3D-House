/**
 * Global error handling provider for the 3D house design application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppError } from "../types/errors";
import { errorHandler } from "../utils/errorHandler";
import { errorRecovery, RecoveryAction } from "../utils/errorRecovery";
import { ErrorDisplay, ErrorDisplayCompact } from "./ErrorDisplay";

interface ErrorContextValue {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (errorId: string) => void;
  clearAllErrors: () => void;
  executeRecoveryAction: (error: AppError, action: RecoveryAction) => Promise<void>;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useErrorContext must be used within an ErrorProvider");
  }
  return context;
}

interface ErrorProviderProps {
  children: ReactNode;
  maxErrors?: number;
  showNotifications?: boolean;
  notificationPosition?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function ErrorProvider({
  children,
  maxErrors = 5,
  showNotifications = true,
  notificationPosition = "top-right",
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = (error: AppError) => {
    setErrors((prev) => {
      // Add unique ID to error for tracking
      const errorWithId = { ...error, id: `${error.type}-${Date.now()}-${Math.random()}` };
      
      // Remove oldest errors if we exceed maxErrors
      const newErrors = [errorWithId, ...prev];
      return newErrors.slice(0, maxErrors);
    });
  };

  const removeError = (errorId: string) => {
    setErrors((prev) => prev.filter((error) => (error as any).id !== errorId));
  };

  const clearAllErrors = () => {
    setErrors([]);
  };

  const executeRecoveryAction = async (error: AppError, action: RecoveryAction) => {
    try {
      await action.action();
      // Remove the error after successful recovery
      removeError((error as any).id);
    } catch (recoveryError) {
      console.error("Recovery action failed:", recoveryError);
      // Add a new error about the failed recovery
      const failedRecoveryError = errorHandler.createAppError(
        error.type,
        `Recovery action "${action.label}" failed: ${recoveryError}`,
        { originalError: error, recoveryError }
      );
      addError(failedRecoveryError);
    }
  };

  // Listen to global errors
  useEffect(() => {
    const unsubscribe = errorHandler.addErrorListener((error) => {
      addError(error);
    });

    return unsubscribe;
  }, []);

  // Auto-remove errors after a timeout (for non-critical errors)
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    errors.forEach((error) => {
      // Only auto-remove certain types of errors
      const autoRemoveTypes = ["VALIDATION_ERROR", "TOOL_ERROR"];
      if (autoRemoveTypes.includes(error.type)) {
        const timeout = setTimeout(() => {
          removeError((error as any).id);
        }, 10000); // Remove after 10 seconds
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [errors]);

  const contextValue: ErrorContextValue = {
    errors,
    addError,
    removeError,
    clearAllErrors,
    executeRecoveryAction,
  };

  const getPositionClasses = () => {
    switch (notificationPosition) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      
      {/* Error notifications */}
      {showNotifications && errors.length > 0 && (
        <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-md`}>
          {errors.slice(0, 3).map((error) => {
            const recoveryActions = errorRecovery.getRecoveryActions(error);
            return (
              <ErrorDisplayCompact
                key={(error as any).id}
                error={error}
                recoveryActions={recoveryActions}
                onRecoveryAction={(action) => executeRecoveryAction(error, action)}
                onDismiss={() => removeError((error as any).id)}
                className="shadow-lg"
              />
            );
          })}
          
          {errors.length > 3 && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-2 text-center">
              <span className="text-sm text-gray-600">
                +{errors.length - 3} more errors
              </span>
              <button
                onClick={clearAllErrors}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </ErrorContext.Provider>
  );
}

// Hook for components that want to show errors inline
export function useInlineErrors() {
  const { errors, removeError, executeRecoveryAction } = useErrorContext();

  const renderErrors = (filterFn?: (error: AppError) => boolean) => {
    const filteredErrors = filterFn ? errors.filter(filterFn) : errors;
    
    return filteredErrors.map((error) => {
      const recoveryActions = errorRecovery.getRecoveryActions(error);
      return (
        <ErrorDisplay
          key={(error as any).id}
          error={error}
          recoveryActions={recoveryActions}
          onRecoveryAction={(action) => executeRecoveryAction(error, action)}
          onDismiss={() => removeError((error as any).id)}
          className="mb-4"
        />
      );
    });
  };

  return {
    errors,
    renderErrors,
    hasErrors: errors.length > 0,
  };
}