/**
 * React hook for error handling in components
 */

import { useCallback, useEffect, useState } from "react";
import { AppError, ErrorType } from "../types/errors";
import { errorHandler } from "../utils/errorHandler";
import { errorRecovery, RecoveryAction } from "../utils/errorRecovery";

export interface UseErrorHandlerOptions {
  onError?: (error: AppError, recoveryActions: RecoveryAction[]) => void;
  showRecoveryOptions?: boolean;
}

export interface UseErrorHandlerReturn {
  error: AppError | null;
  recoveryActions: RecoveryAction[];
  clearError: () => void;
  handleError: (error: AppError) => void;
  handleAsyncOperation: <T>(
    operation: () => Promise<T>,
    errorType: ErrorType,
    errorMessage: string
  ) => Promise<T | null>;
  handleSyncOperation: <T>(
    operation: () => T,
    errorType: ErrorType,
    errorMessage: string
  ) => T | null;
}

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);

  const clearError = useCallback(() => {
    setError(null);
    setRecoveryActions([]);
  }, []);

  const handleError = useCallback(
    (appError: AppError) => {
      setError(appError);

      const actions = errorRecovery.getRecoveryActions(appError);
      setRecoveryActions(actions);

      // Call custom error handler if provided
      if (options.onError) {
        options.onError(appError, actions);
      }

      // Also send to global error handler
      errorHandler.handleError(appError);
    },
    [options.onError]
  );

  const handleAsyncOperation = useCallback(
    async <T>(
      operation: () => Promise<T>,
      errorType: ErrorType,
      errorMessage: string
    ): Promise<T | null> => {
      try {
        return await operation();
      } catch (error) {
        const appError = errorHandler.createAppError(
          errorType,
          errorMessage,
          error
        );
        handleError(appError);
        return null;
      }
    },
    [handleError]
  );

  const handleSyncOperation = useCallback(
    <T>(
      operation: () => T,
      errorType: ErrorType,
      errorMessage: string
    ): T | null => {
      try {
        return operation();
      } catch (error) {
        const appError = errorHandler.createAppError(
          errorType,
          errorMessage,
          error
        );
        handleError(appError);
        return null;
      }
    },
    [handleError]
  );

  // Listen to global errors if component wants to handle them
  useEffect(() => {
    if (options.onError) {
      const unsubscribe = errorHandler.addErrorListener((globalError) => {
        const actions = errorRecovery.getRecoveryActions(globalError);
        options.onError!(globalError, actions);
      });

      return unsubscribe;
    }
  }, [options.onError]);

  return {
    error,
    recoveryActions,
    clearError,
    handleError,
    handleAsyncOperation,
    handleSyncOperation,
  };
}

// Specialized hooks for common error scenarios

export function useSceneErrorHandler() {
  return useErrorHandler({
    onError: (error, recoveryActions) => {
      if (error.type === ErrorType.SCENE_LOAD_ERROR) {
        console.warn("Scene loading error detected:", error.message);
        // Could trigger a toast notification here
      }
    },
  });
}

export function useGeometryErrorHandler() {
  return useErrorHandler({
    onError: (error, recoveryActions) => {
      if (error.type === ErrorType.GEOMETRY_ERROR) {
        console.warn("Geometry error detected:", error.message);
        // Could highlight the problematic object
      }
    },
  });
}

export function useStorageErrorHandler() {
  return useErrorHandler({
    onError: (error, recoveryActions) => {
      if (error.type === ErrorType.STORAGE_ERROR) {
        console.warn("Storage error detected:", error.message);
        // Could show storage cleanup options
      }
    },
  });
}

export function useExportErrorHandler() {
  return useErrorHandler({
    onError: (error, recoveryActions) => {
      if (error.type === ErrorType.EXPORT_ERROR) {
        console.warn("Export error detected:", error.message);
        // Could suggest alternative export formats
      }
    },
  });
}
