/**
 * Error handling utilities for Zustand stores
 */

import { ErrorType } from "../types/errors";
import { errorHandler } from "./errorHandler";

// Higher-order function to wrap store actions with error handling
export function withStoreErrorHandling<T extends (...args: any[]) => any>(
  action: T,
  errorType: ErrorType,
  actionName: string
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = action(...args);

      // Handle async actions
      if (result instanceof Promise) {
        return result.catch((error) => {
          const appError = errorHandler.createAppError(
            errorType,
            `Failed to ${actionName}`,
            { args, error }
          );
          errorHandler.handleError(appError);
          throw appError;
        });
      }

      return result;
    } catch (error) {
      const appError = errorHandler.createAppError(
        errorType,
        `Failed to ${actionName}`,
        { args, error }
      );
      errorHandler.handleError(appError);
      throw appError;
    }
  }) as T;
}

// Specific error handling for scene operations
export function withSceneErrorHandling<T extends (...args: any[]) => any>(
  action: T,
  actionName: string
): T {
  return withStoreErrorHandling(action, ErrorType.SCENE_LOAD_ERROR, actionName);
}

// Specific error handling for geometry operations
export function withGeometryErrorHandling<T extends (...args: any[]) => any>(
  action: T,
  actionName: string
): T {
  return withStoreErrorHandling(action, ErrorType.GEOMETRY_ERROR, actionName);
}

// Specific error handling for storage operations
export function withStorageErrorHandling<T extends (...args: any[]) => any>(
  action: T,
  actionName: string
): T {
  return withStoreErrorHandling(action, ErrorType.STORAGE_ERROR, actionName);
}

// Specific error handling for material operations
export function withMaterialErrorHandling<T extends (...args: any[]) => any>(
  action: T,
  actionName: string
): T {
  return withStoreErrorHandling(action, ErrorType.MATERIAL_ERROR, actionName);
}

// Specific error handling for tool operations
export function withToolErrorHandling<T extends (...args: any[]) => any>(
  action: T,
  actionName: string
): T {
  return withStoreErrorHandling(action, ErrorType.TOOL_ERROR, actionName);
}

// Validation helper for store operations
export function validateStoreOperation<T>(
  value: T,
  validator: (value: T) => boolean,
  errorMessage: string,
  field?: string
): T {
  if (!validator(value)) {
    const appError = errorHandler.createAppError(
      ErrorType.VALIDATION_ERROR,
      errorMessage,
      { field, value }
    );
    errorHandler.handleError(appError);
    throw appError;
  }
  return value;
}

// Helper for safe store state access
export function safeStoreAccess<T>(
  accessor: () => T,
  fallback: T,
  errorMessage: string = "Failed to access store state"
): T {
  try {
    return accessor();
  } catch (error) {
    const appError = errorHandler.createAppError(
      ErrorType.UNKNOWN_ERROR,
      errorMessage,
      error
    );
    errorHandler.handleError(appError);
    return fallback;
  }
}

// Helper for batch operations with error handling
export function withBatchErrorHandling<T>(
  operations: (() => T)[],
  errorType: ErrorType,
  batchName: string
): T[] {
  const results: T[] = [];
  const errors: any[] = [];

  operations.forEach((operation, index) => {
    try {
      results.push(operation());
    } catch (error) {
      errors.push({ index, error });
    }
  });

  if (errors.length > 0) {
    const appError = errorHandler.createAppError(
      errorType,
      `Batch operation "${batchName}" failed`,
      {
        totalOperations: operations.length,
        failedOperations: errors.length,
        errors,
      }
    );
    errorHandler.handleError(appError);

    // Decide whether to throw or continue based on error ratio
    const errorRatio = errors.length / operations.length;
    if (errorRatio > 0.5) {
      throw appError;
    }
  }

  return results;
}
