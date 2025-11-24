/**
 * Unit tests for model export functionality
 * Tests OBJ and GLTF export operations
 */

import * as THREE from "three";
import {
  ModelExporter,
  exportModel,
  downloadExportedFile,
} from "../modelExport";
import { SceneObject, MaterialProperties } from "../../types/scene";
import { ModelExportOptions } from "../../types/export";

// Mock Three.js exporters
jest.mock("three-obj-exporter", () => ({
  OBJExporter: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue("# OBJ file content"),
  })),
}));

jest.mock("three-gltf-exporter", () => ({
  GLTFExporter: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockImplementation((scene, onLoad, onError, options) => {
      // Simulate successful export
      setTimeout(() => {
        const mockGLTFData = new ArrayBuffer(100);
        onLoad(mockGLTFData);
      }, 10);
    }),
  })),
}));

// Mock URL.createObjectURL and related DOM methods
Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: jest.fn(() => "mock-url"),
    revokeObjectURL: jest.fn(),
  },
});

// Mock document methods
Object.defineProperty(global, "document", {
  value: {
    createElement: jest.fn(() => ({
      href: "",
      download: "",
      click: jest.fn(),
    })),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
  },
});

describe("ModelExporter", () => {
  let exporter: ModelExporter;
  let mockObjects: SceneObject[];
  let mockMaterials: MaterialProperties[];

  beforeEach(() => {
    exporter = new ModelExporter();

    mockMaterials = [
      {
        id: "material-1",
        name: "Wall Material",
        color: "#ffffff",
        roughness: 0.8,
        metalness: 0.1,
      },
    ];

    mockObjects = [
      {
        id: "wall-1",
        type: "wall",
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        properties: {},
        material: mockMaterials[0],
      },
    ];
  });

  describe("exportToOBJ", () => {
    it("should export objects to OBJ format successfully", async () => {
      const options: ModelExportOptions = {
        format: "obj",
        filename: "test.obj",
        includeTextures: true,
      };

      const progressCallback = jest.fn();
      const result = await exporter.exportToOBJ(
        mockObjects,
        mockMaterials,
        options,
        progressCallback
      );

      expect(result.success).toBe(true);
      expect(result.filename).toBe("test.obj");
      expect(result.blob).toBeInstanceOf(Blob);
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: "complete",
          progress: 100,
        })
      );
    });

    it("should handle export errors gracefully", async () => {
      // Mock the OBJ exporter to throw an error
      const mockOBJExporter = require("three-obj-exporter").OBJExporter;
      mockOBJExporter.mockImplementation(() => ({
        parse: jest.fn().mockImplementation(() => {
          throw new Error("Export failed");
        }),
      }));

      const exporter = new ModelExporter();
      const options: ModelExportOptions = {
        format: "obj",
        includeTextures: true,
      };

      const result = await exporter.exportToOBJ(
        mockObjects,
        mockMaterials,
        options
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Export failed");
    });
  });

  describe("exportToGLTF", () => {
    it("should export objects to GLTF format successfully", async () => {
      const options: ModelExportOptions = {
        format: "gltf",
        filename: "test.glb",
        includeTextures: true,
        embedTextures: true,
      };

      const progressCallback = jest.fn();
      const result = await exporter.exportToGLTF(
        mockObjects,
        mockMaterials,
        options,
        progressCallback
      );

      expect(result.success).toBe(true);
      expect(result.filename).toBe("test.glb");
      expect(result.blob).toBeInstanceOf(Blob);
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: "complete",
          progress: 100,
        })
      );
    });

    it("should handle GLTF export errors gracefully", async () => {
      // Mock the GLTF exporter to call onError
      const mockGLTFExporter = require("three-gltf-exporter").GLTFExporter;
      mockGLTFExporter.mockImplementation(() => ({
        parse: jest
          .fn()
          .mockImplementation((scene, onLoad, onError, options) => {
            setTimeout(() => {
              onError(new Error("GLTF export failed"));
            }, 10);
          }),
      }));

      const exporter = new ModelExporter();
      const options: ModelExportOptions = {
        format: "gltf",
        includeTextures: true,
      };

      const result = await exporter.exportToGLTF(
        mockObjects,
        mockMaterials,
        options
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("GLTF export failed");
    });
  });
});

describe("exportModel", () => {
  const mockObjects: SceneObject[] = [];
  const mockMaterials: MaterialProperties[] = [];

  it("should export OBJ format", async () => {
    const options: ModelExportOptions = {
      format: "obj",
      includeTextures: true,
    };

    const result = await exportModel(mockObjects, mockMaterials, options);
    expect(result.success).toBe(true);
  });

  it("should export GLTF format", async () => {
    const options: ModelExportOptions = {
      format: "gltf",
      includeTextures: true,
    };

    const result = await exportModel(mockObjects, mockMaterials, options);
    expect(result.success).toBe(true);
  });

  it("should handle unsupported format", async () => {
    const options = {
      format: "unsupported" as any,
      includeTextures: true,
    };

    const result = await exportModel(mockObjects, mockMaterials, options);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported export format");
  });
});

describe("downloadExportedFile", () => {
  it("should download file successfully", () => {
    const mockBlob = new Blob(["test content"], { type: "text/plain" });
    const result = {
      success: true,
      filename: "test.obj",
      blob: mockBlob,
    };

    expect(() => downloadExportedFile(result)).not.toThrow();
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it("should throw error for invalid result", () => {
    const result = {
      success: false,
      error: "Export failed",
    };

    expect(() => downloadExportedFile(result)).toThrow("Invalid export result");
  });
});
