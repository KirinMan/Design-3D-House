/**
 * Global error handling utilities for the 3D house design application
 */

import { AppError, ErrorType } from "../types/errors";

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: AppError) => void)[] = [];

  private constructor() {
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const error = this.createAppError(
        ErrorType.UNKNOWN_ERROR,
        "Unhandled promise rejection",
        event.reason
      );
      this.handleError(error);
      event.preventDefault();
    });

    // Handle global JavaScript errors
    window.addEventListener("error", (event) => {
      const error = this.createAppError(
        ErrorType.UNKNOWN_ERROR,
        event.message || "Global JavaScript error",
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        }
      );
      this.handleError(error);
    });
  }

  public createAppError(
    type: ErrorType,
    message: string,
    details?: any,
    stack?: string
  ): AppError {
    return {
      type,
      message,
      details,
      timestamp: new Date(),
      stack,
    };
  }

  public handleError(error: AppError): void {
    // Log error
    this.logError(error);

    // Notify listeners
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error("Error in error listener:", listenerError);
      }
    });
  }

  public addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  private logError(error: AppError): void {
    if (process.env.NODE_ENV === "development") {
      console.group(`🚨 ${error.type}`);
      console.error("Message:", error.message);
      console.error("Timestamp:", error.timestamp.toISOString());
      if (error.details) {
        console.error("Details:", error.details);
      }
      if (error.stack) {
        console.error("Stack:", error.stack);
      }
      console.groupEnd();
    } else {
      // In production, log minimal information
      console.error(`[${error.type}] ${error.message}`);
    }
  }

  // Helper methods for common error scenarios
  public handleSceneError(message: string, details?: any): AppError {
    const error = this.createAppError(
      ErrorType.SCENE_LOAD_ERROR,
      message,
      details
    );
    this.handleError(error);
    return error;
  }

  public handleGeometryError(
    objectId: string,
    operation: string,
    message: string,
    details?: any
  ): AppError {
    const error = this.createAppError(ErrorType.GEOMETRY_ERROR, message, {
      objectId,
      operation,
      ...details,
    });
    this.handleError(error);
    return error;
  }

  public handleStorageError(
    operation: "save" | "load" | "delete",
    storageType: "localStorage" | "indexedDB",
    message: string,
    details?: any
  ): AppError {
    const error = this.createAppError(ErrorType.STORAGE_ERROR, message, {
      operation,
      storageType,
      ...details,
    });
    this.handleError(error);
    return error;
  }

  public handleExportError(message: string, details?: any): AppError {
    const error = this.createAppError(ErrorType.EXPORT_ERROR, message, details);
    this.handleError(error);
    return error;
  }

  public handleMaterialError(message: string, details?: any): AppError {
    const error = this.createAppError(
      ErrorType.MATERIAL_ERROR,
      message,
      details
    );
    this.handleError(error);
    return error;
  }

  public handleToolError(message: string, details?: any): AppError {
    const error = this.createAppError(ErrorType.TOOL_ERROR, message, details);
    this.handleError(error);
    return error;
  }

  public handleValidationError(
    field: string,
    value: any,
    constraint: string,
    message?: string
  ): AppError {
    const error = this.createAppError(
      ErrorType.VALIDATION_ERROR,
      message || `Validation failed for ${field}: ${constraint}`,
      { field, value, constraint }
    );
    this.handleError(error);
    return error;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Helper function for wrapping async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorType: ErrorType,
  errorMessage: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const appError = errorHandler.createAppError(
      errorType,
      errorMessage,
      error
    );
    errorHandler.handleError(appError);
    return null;
  }
}

// Helper function for wrapping sync operations with error handling
export function withSyncErrorHandling<T>(
  operation: () => T,
  errorType: ErrorType,
  errorMessage: string
): T | null {
  try {
    return operation();
  } catch (error) {
    const appError = errorHandler.createAppError(
      errorType,
      errorMessage,
      error
    );
    errorHandler.handleError(appError);
    return null;
  }
}
