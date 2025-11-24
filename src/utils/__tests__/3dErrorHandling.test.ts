/**
 * Tests for 3D-specific error handling utilities
 */

import * as THREE from "three";
import {
  GeometryErrorHandler,
  MaterialErrorHandler,
  SceneErrorHandler,
  CameraErrorHandler,
  withThreeJSErrorHandling,
} from "../3dErrorHandling";
import { ErrorType } from "../../types/errors";
import { errorHandler } from "../errorHandler";

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

describe("GeometryErrorHandler", () => {
  describe("validateGeometry", () => {
    it("should validate valid geometry", () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const result = GeometryErrorHandler.validateGeometry(
        geometry,
        "test-box"
      );
      expect(result).toBe(true);
    });

    it("should reject geometry without position attribute", () => {
      const geometry = new THREE.BufferGeometry();
      const result = GeometryErrorHandler.validateGeometry(
        geometry,
        "test-invalid"
      );
      expect(result).toBe(false);
    });

    it("should reject geometry with invalid position values", () => {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array([1, 2, NaN, 4, 5, 6]);
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const result = GeometryErrorHandler.validateGeometry(
        geometry,
        "test-nan"
      );
      expect(result).toBe(false);
    });
  });

  describe("createSafeBoxGeometry", () => {
    it("should create valid box geometry", () => {
      const geometry = GeometryErrorHandler.createSafeBoxGeometry(
        1,
        2,
        3,
        "test-box"
      );
      expect(geometry).toBeInstanceOf(THREE.BoxGeometry);
      expect(geometry).not.toBeNull();
    });

    it("should return null for invalid dimensions", () => {
      const geometry = GeometryErrorHandler.createSafeBoxGeometry(
        -1,
        2,
        3,
        "test-invalid"
      );
      expect(geometry).toBeNull();
    });

    it("should return null for oversized dimensions", () => {
      const geometry = GeometryErrorHandler.createSafeBoxGeometry(
        2000,
        2,
        3,
        "test-oversized"
      );
      expect(geometry).toBeNull();
    });
  });

  describe("createSafePlaneGeometry", () => {
    it("should create valid plane geometry", () => {
      const geometry = GeometryErrorHandler.createSafePlaneGeometry(
        5,
        10,
        "test-plane"
      );
      expect(geometry).toBeInstanceOf(THREE.PlaneGeometry);
      expect(geometry).not.toBeNull();
    });

    it("should return null for invalid dimensions", () => {
      const geometry = GeometryErrorHandler.createSafePlaneGeometry(
        0,
        10,
        "test-invalid"
      );
      expect(geometry).toBeNull();
    });
  });
});

describe("MaterialErrorHandler", () => {
  describe("validateMaterial", () => {
    it("should validate valid material", () => {
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const result = MaterialErrorHandler.validateMaterial(
        material,
        "test-material"
      );
      expect(result).toBe(true);
    });

    it("should reject null material", () => {
      const result = MaterialErrorHandler.validateMaterial(
        null as any,
        "test-null"
      );
      expect(result).toBe(false);
    });
  });

  describe("createSafeMaterial", () => {
    it("should create basic material", () => {
      const material = MaterialErrorHandler.createSafeMaterial(
        "basic",
        { color: 0xff0000 },
        "test-basic"
      );
      expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);
    });

    it("should create standard material", () => {
      const material = MaterialErrorHandler.createSafeMaterial(
        "standard",
        { color: 0x00ff00 },
        "test-standard"
      );
      expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it("should return null for unknown material type", () => {
      const material = MaterialErrorHandler.createSafeMaterial(
        "unknown" as any,
        { color: 0x0000ff },
        "test-unknown"
      );
      expect(material).toBeNull();
    });
  });
});

describe("SceneErrorHandler", () => {
  describe("validateScene", () => {
    it("should validate valid scene", () => {
      const scene = new THREE.Scene();
      const result = SceneErrorHandler.validateScene(scene);
      expect(result).toBe(true);
    });

    it("should reject null scene", () => {
      const result = SceneErrorHandler.validateScene(null as any);
      expect(result).toBe(false);
    });
  });

  describe("safeAddToScene", () => {
    it("should add valid object to scene", () => {
      const scene = new THREE.Scene();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );

      const result = SceneErrorHandler.safeAddToScene(scene, mesh, "test-mesh");
      expect(result).toBe(true);
      expect(scene.children).toContain(mesh);
    });

    it("should handle null object gracefully", () => {
      const scene = new THREE.Scene();
      const result = SceneErrorHandler.safeAddToScene(
        scene,
        null as any,
        "test-null"
      );
      expect(result).toBe(false);
    });
  });

  describe("safeRemoveFromScene", () => {
    it("should remove object from scene", () => {
      const scene = new THREE.Scene();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      scene.add(mesh);

      const result = SceneErrorHandler.safeRemoveFromScene(
        scene,
        mesh,
        "test-mesh"
      );
      expect(result).toBe(true);
      expect(scene.children).not.toContain(mesh);
    });
  });
});

describe("CameraErrorHandler", () => {
  describe("validateCamera", () => {
    it("should validate valid perspective camera", () => {
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const result = CameraErrorHandler.validateCamera(camera);
      expect(result).toBe(true);
    });

    it("should reject camera with invalid FOV", () => {
      const camera = new THREE.PerspectiveCamera(200, 1, 0.1, 1000);
      const result = CameraErrorHandler.validateCamera(camera);
      expect(result).toBe(false);
    });

    it("should reject camera with invalid near/far planes", () => {
      const camera = new THREE.PerspectiveCamera(75, 1, 10, 5);
      const result = CameraErrorHandler.validateCamera(camera);
      expect(result).toBe(false);
    });
  });
});

describe("withThreeJSErrorHandling", () => {
  it("should handle successful operations", () => {
    const operation = jest.fn().mockReturnValue("success");

    const result = withThreeJSErrorHandling(
      operation,
      ErrorType.GEOMETRY_ERROR,
      "test operation",
      "test-object"
    );

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalled();
  });

  it("should handle failed operations", () => {
    const operation = jest.fn().mockImplementation(() => {
      throw new Error("test error");
    });

    const result = withThreeJSErrorHandling(
      operation,
      ErrorType.GEOMETRY_ERROR,
      "test operation",
      "test-object",
      "fallback"
    );

    expect(result).toBe("fallback");
    expect(console.group).toHaveBeenCalledWith("🚨 GEOMETRY_ERROR");
  });

  it("should return null when no fallback provided", () => {
    const operation = jest.fn().mockImplementation(() => {
      throw new Error("test error");
    });

    const result = withThreeJSErrorHandling(
      operation,
      ErrorType.MATERIAL_ERROR,
      "test operation"
    );

    expect(result).toBeNull();
  });
});
