/**
 * Tests for error handling utilities
 */

import {
  ErrorHandler,
  errorHandler,
  withErrorHandling,
  withSyncErrorHandling,
} from "../errorHandler";
import { ErrorType } from "../../types/errors";

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleGroup = console.group;
const originalConsoleGroupEnd = console.groupEnd;

beforeEach(() => {
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.group = originalConsoleGroup;
  console.groupEnd = originalConsoleGroupEnd;
});

describe("ErrorHandler", () => {
  describe("createAppError", () => {
    it("should create an AppError with all required fields", () => {
      const error = errorHandler.createAppError(
        ErrorType.SCENE_LOAD_ERROR,
        "Test error message",
        { detail: "test" }
      );

      expect(error.type).toBe(ErrorType.SCENE_LOAD_ERROR);
      expect(error.message).toBe("Test error message");
      expect(error.details).toEqual({ detail: "test" });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should include stack trace when provided", () => {
      const stack = "Error stack trace";
      const error = errorHandler.createAppError(
        ErrorType.GEOMETRY_ERROR,
        "Test error",
        null,
        stack
      );

      expect(error.stack).toBe(stack);
    });
  });

  describe("handleError", () => {
    it("should log error in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = errorHandler.createAppError(
        ErrorType.STORAGE_ERROR,
        "Test storage error"
      );

      errorHandler.handleError(error);

      expect(console.group).toHaveBeenCalledWith("🚨 STORAGE_ERROR");
      expect(console.error).toHaveBeenCalledWith(
        "Message:",
        "Test storage error"
      );
      expect(console.groupEnd).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should log minimal info in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = errorHandler.createAppError(
        ErrorType.EXPORT_ERROR,
        "Test export error"
      );

      errorHandler.handleError(error);

      expect(console.error).toHaveBeenCalledWith(
        "[EXPORT_ERROR] Test export error"
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should notify error listeners", () => {
      const listener = jest.fn();
      const unsubscribe = errorHandler.addErrorListener(listener);

      const error = errorHandler.createAppError(
        ErrorType.TOOL_ERROR,
        "Test tool error"
      );

      errorHandler.handleError(error);

      expect(listener).toHaveBeenCalledWith(error);

      unsubscribe();
    });
  });

  describe("helper methods", () => {
    it("should handle scene errors", () => {
      const error = errorHandler.handleSceneError("Scene failed to load", {
        sceneId: "test",
      });

      expect(error.type).toBe(ErrorType.SCENE_LOAD_ERROR);
      expect(error.message).toBe("Scene failed to load");
      expect(error.details).toEqual({ sceneId: "test" });
    });

    it("should handle geometry errors", () => {
      const error = errorHandler.handleGeometryError(
        "wall-1",
        "create",
        "Invalid wall geometry",
        { width: -1 }
      );

      expect(error.type).toBe(ErrorType.GEOMETRY_ERROR);
      expect(error.message).toBe("Invalid wall geometry");
      expect(error.details).toEqual({
        objectId: "wall-1",
        operation: "create",
        width: -1,
      });
    });

    it("should handle storage errors", () => {
      const error = errorHandler.handleStorageError(
        "save",
        "localStorage",
        "Storage quota exceeded"
      );

      expect(error.type).toBe(ErrorType.STORAGE_ERROR);
      expect(error.message).toBe("Storage quota exceeded");
      expect(error.details).toEqual({
        operation: "save",
        storageType: "localStorage",
      });
    });

    it("should handle validation errors", () => {
      const error = errorHandler.handleValidationError(
        "height",
        -5,
        "must be positive",
        "Height must be a positive number"
      );

      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe("Height must be a positive number");
      expect(error.details).toEqual({
        field: "height",
        value: -5,
        constraint: "must be positive",
      });
    });
  });
});

describe("withErrorHandling", () => {
  it("should handle async operation success", async () => {
    const operation = jest.fn().mockResolvedValue("success");

    const result = await withErrorHandling(
      operation,
      ErrorType.SCENE_LOAD_ERROR,
      "test operation"
    );

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalled();
  });

  it("should handle async operation failure", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("async error"));

    const result = await withErrorHandling(
      operation,
      ErrorType.SCENE_LOAD_ERROR,
      "test operation"
    );

    expect(result).toBeNull();
    expect(console.group).toHaveBeenCalledWith("🚨 SCENE_LOAD_ERROR");
  });

  it("should return null on error", async () => {
    const operation = jest.fn().mockRejectedValue(new Error("test error"));

    const result = await withErrorHandling(
      operation,
      ErrorType.EXPORT_ERROR,
      "export operation"
    );

    expect(result).toBeNull();
  });
});

describe("withSyncErrorHandling", () => {
  it("should handle sync operation success", () => {
    const operation = jest.fn().mockReturnValue("sync success");

    const result = withSyncErrorHandling(
      operation,
      ErrorType.GEOMETRY_ERROR,
      "geometry operation"
    );

    expect(result).toBe("sync success");
    expect(operation).toHaveBeenCalled();
  });

  it("should handle sync operation failure", () => {
    const operation = jest.fn().mockImplementation(() => {
      throw new Error("sync error");
    });

    const result = withSyncErrorHandling(
      operation,
      ErrorType.GEOMETRY_ERROR,
      "geometry operation"
    );

    expect(result).toBeNull();
    expect(console.group).toHaveBeenCalledWith("🚨 GEOMETRY_ERROR");
  });
});
