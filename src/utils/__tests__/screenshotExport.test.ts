/**
 * Unit tests for screenshot export functionality
 * Tests PNG screenshot capture operations
 */

import * as THREE from "three";
import {
  ScreenshotExporter,
  captureScreenshot,
  downloadScreenshot,
  ARCHITECTURAL_VIEWPOINTS,
  RESOLUTION_PRESETS,
} from "../screenshotExport";
import { ImageExportOptions } from "../../types/export";

// Mock Three.js WebGLRenderer
const mockRenderer = {
  domElement: {
    toBlob: jest.fn(),
  },
  getSize: jest.fn().mockReturnValue(new THREE.Vector2(800, 600)),
  getPixelRatio: jest.fn().mockReturnValue(1),
  setSize: jest.fn(),
  setPixelRatio: jest.fn(),
  render: jest.fn(),
} as unknown as THREE.WebGLRenderer;

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

describe("ScreenshotExporter", () => {
  let exporter: ScreenshotExporter;
  let mockScene: THREE.Scene;
  let mockCamera: THREE.Camera;

  beforeEach(() => {
    exporter = new ScreenshotExporter();
    mockScene = new THREE.Scene();
    mockCamera = new THREE.PerspectiveCamera();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("captureScreenshot", () => {
    it("should capture screenshot successfully", async () => {
      const mockBlob = new Blob(["image data"], { type: "image/png" });

      // Mock successful toBlob call
      (mockRenderer.domElement.toBlob as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockBlob);
        }
      );

      const options: ImageExportOptions = {
        format: "png",
        filename: "test.png",
        resolution: { width: 1920, height: 1080 },
      };

      const progressCallback = jest.fn();
      const result = await exporter.captureScreenshot(
        mockRenderer,
        mockScene,
        mockCamera,
        options,
        progressCallback
      );

      expect(result.success).toBe(true);
      expect(result.filename).toBe("test.png");
      expect(result.blob).toBe(mockBlob);
      expect(mockRenderer.setSize).toHaveBeenCalledWith(1920, 1080, false);
      expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: "complete",
          progress: 100,
        })
      );
    });

    it("should handle screenshot capture errors", async () => {
      // Mock failed toBlob call
      (mockRenderer.domElement.toBlob as jest.Mock).mockImplementation(
        (callback) => {
          callback(null);
        }
      );

      const options: ImageExportOptions = {
        format: "png",
        resolution: { width: 1920, height: 1080 },
      };

      const result = await exporter.captureScreenshot(
        mockRenderer,
        mockScene,
        mockCamera,
        options
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to create image blob");
    });

    it("should restore original renderer settings", async () => {
      const mockBlob = new Blob(["image data"], { type: "image/png" });
      (mockRenderer.domElement.toBlob as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockBlob);
        }
      );

      const options: ImageExportOptions = {
        format: "png",
        resolution: { width: 1920, height: 1080 },
      };

      await exporter.captureScreenshot(
        mockRenderer,
        mockScene,
        mockCamera,
        options
      );

      // Check that original settings are restored
      expect(mockRenderer.setSize).toHaveBeenCalledWith(800, 600, false);
      expect(mockRenderer.setPixelRatio).toHaveBeenCalledWith(1);
    });
  });

  describe("captureScreenshotWithCamera", () => {
    it("should capture screenshot with custom camera position", async () => {
      const mockBlob = new Blob(["image data"], { type: "image/png" });
      (mockRenderer.domElement.toBlob as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockBlob);
        }
      );

      const cameraPosition = new THREE.Vector3(10, 10, 10);
      const cameraTarget = new THREE.Vector3(0, 0, 0);
      const options: ImageExportOptions = {
        format: "png",
        resolution: { width: 1920, height: 1080 },
      };

      const result = await exporter.captureScreenshotWithCamera(
        mockRenderer,
        mockScene,
        cameraPosition,
        cameraTarget,
        options
      );

      expect(result.success).toBe(true);
      expect(mockRenderer.render).toHaveBeenCalled();
    });
  });

  describe("captureMultipleScreenshots", () => {
    it("should capture multiple screenshots from different viewpoints", async () => {
      const mockBlob = new Blob(["image data"], { type: "image/png" });
      (mockRenderer.domElement.toBlob as jest.Mock).mockImplementation(
        (callback) => {
          callback(mockBlob);
        }
      );

      const viewpoints = [
        {
          position: new THREE.Vector3(10, 0, 0),
          target: new THREE.Vector3(0, 0, 0),
          name: "side-view",
        },
        {
          position: new THREE.Vector3(0, 10, 0),
          target: new THREE.Vector3(0, 0, 0),
          name: "top-view",
        },
      ];

      const options = {
        format: "png" as const,
        resolution: { width: 1920, height: 1080 },
      };

      const progressCallback = jest.fn();
      const results = await exporter.captureMultipleScreenshots(
        mockRenderer,
        mockScene,
        viewpoints,
        options,
        progressCallback
      );

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockRenderer.render).toHaveBeenCalledTimes(2);
    });
  });
});

describe("captureScreenshot", () => {
  it("should use ScreenshotExporter to capture screenshot", async () => {
    const mockBlob = new Blob(["image data"], { type: "image/png" });
    (mockRenderer.domElement.toBlob as jest.Mock).mockImplementation(
      (callback) => {
        callback(mockBlob);
      }
    );

    const mockScene = new THREE.Scene();
    const mockCamera = new THREE.PerspectiveCamera();
    const options: ImageExportOptions = {
      format: "png",
      resolution: { width: 1920, height: 1080 },
    };

    const result = await captureScreenshot(
      mockRenderer,
      mockScene,
      mockCamera,
      options
    );
    expect(result.success).toBe(true);
  });
});

describe("downloadScreenshot", () => {
  it("should download screenshot successfully", () => {
    const mockBlob = new Blob(["image data"], { type: "image/png" });
    const result = {
      success: true,
      filename: "test.png",
      blob: mockBlob,
    };

    expect(() => downloadScreenshot(result)).not.toThrow();
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it("should throw error for invalid result", () => {
    const result = {
      success: false,
      error: "Screenshot failed",
    };

    expect(() => downloadScreenshot(result)).toThrow(
      "Invalid screenshot result"
    );
  });
});

describe("Constants", () => {
  it("should have predefined architectural viewpoints", () => {
    expect(ARCHITECTURAL_VIEWPOINTS.FRONT).toBeDefined();
    expect(ARCHITECTURAL_VIEWPOINTS.BACK).toBeDefined();
    expect(ARCHITECTURAL_VIEWPOINTS.LEFT).toBeDefined();
    expect(ARCHITECTURAL_VIEWPOINTS.RIGHT).toBeDefined();
    expect(ARCHITECTURAL_VIEWPOINTS.TOP).toBeDefined();
    expect(ARCHITECTURAL_VIEWPOINTS.ISOMETRIC).toBeDefined();

    // Check that viewpoints have required properties
    Object.values(ARCHITECTURAL_VIEWPOINTS).forEach((viewpoint) => {
      expect(viewpoint.position).toBeInstanceOf(THREE.Vector3);
      expect(viewpoint.target).toBeInstanceOf(THREE.Vector3);
      expect(typeof viewpoint.name).toBe("string");
    });
  });

  it("should have predefined resolution presets", () => {
    expect(RESOLUTION_PRESETS.HD).toEqual({ width: 1280, height: 720 });
    expect(RESOLUTION_PRESETS.FULL_HD).toEqual({ width: 1920, height: 1080 });
    expect(RESOLUTION_PRESETS["4K"]).toEqual({ width: 3840, height: 2160 });
    expect(RESOLUTION_PRESETS.SQUARE_HD).toEqual({ width: 1080, height: 1080 });
    expect(RESOLUTION_PRESETS.A4_PORTRAIT).toEqual({
      width: 2480,
      height: 3508,
    });
  });
});
