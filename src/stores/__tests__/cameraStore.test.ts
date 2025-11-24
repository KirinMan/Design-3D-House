/**
 * Unit tests for CameraStore
 * Tests camera position and navigation functionality
 */

import { renderHook, act } from "@testing-library/react";
import { useCameraStore, Vector3 } from "../cameraStore";

describe("CameraStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCameraStore());
    act(() => {
      result.current.resetCamera();
    });
  });

  describe("Initial State", () => {
    it("should initialize with default camera position", () => {
      const { result } = renderHook(() => useCameraStore());

      expect(result.current.position).toEqual({ x: 10, y: 10, z: 10 });
    });

    it("should initialize with default camera target", () => {
      const { result } = renderHook(() => useCameraStore());

      expect(result.current.target).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe("setCamera", () => {
    it("should set camera position and target", () => {
      const { result } = renderHook(() => useCameraStore());

      const newPosition: Vector3 = { x: 5, y: 8, z: 12 };
      const newTarget: Vector3 = { x: 2, y: 1, z: 3 };

      act(() => {
        result.current.setCamera(newPosition, newTarget);
      });

      expect(result.current.position).toEqual(newPosition);
      expect(result.current.target).toEqual(newTarget);
    });

    it("should update camera position while keeping target unchanged", () => {
      const { result } = renderHook(() => useCameraStore());

      const newPosition: Vector3 = { x: 15, y: 5, z: 8 };
      const currentTarget = result.current.target;

      act(() => {
        result.current.setCamera(newPosition, currentTarget);
      });

      expect(result.current.position).toEqual(newPosition);
      expect(result.current.target).toEqual(currentTarget);
    });

    it("should update camera target while keeping position unchanged", () => {
      const { result } = renderHook(() => useCameraStore());

      const currentPosition = result.current.position;
      const newTarget: Vector3 = { x: 5, y: 2, z: 1 };

      act(() => {
        result.current.setCamera(currentPosition, newTarget);
      });

      expect(result.current.position).toEqual(currentPosition);
      expect(result.current.target).toEqual(newTarget);
    });

    it("should handle negative coordinates", () => {
      const { result } = renderHook(() => useCameraStore());

      const newPosition: Vector3 = { x: -5, y: -3, z: -8 };
      const newTarget: Vector3 = { x: -2, y: -1, z: -4 };

      act(() => {
        result.current.setCamera(newPosition, newTarget);
      });

      expect(result.current.position).toEqual(newPosition);
      expect(result.current.target).toEqual(newTarget);
    });

    it("should handle zero coordinates", () => {
      const { result } = renderHook(() => useCameraStore());

      const newPosition: Vector3 = { x: 0, y: 0, z: 0 };
      const newTarget: Vector3 = { x: 0, y: 0, z: 0 };

      act(() => {
        result.current.setCamera(newPosition, newTarget);
      });

      expect(result.current.position).toEqual(newPosition);
      expect(result.current.target).toEqual(newTarget);
    });

    it("should handle decimal coordinates", () => {
      const { result } = renderHook(() => useCameraStore());

      const newPosition: Vector3 = { x: 1.5, y: 2.7, z: 3.14 };
      const newTarget: Vector3 = { x: 0.5, y: 1.2, z: 2.8 };

      act(() => {
        result.current.setCamera(newPosition, newTarget);
      });

      expect(result.current.position).toEqual(newPosition);
      expect(result.current.target).toEqual(newTarget);
    });
  });

  describe("resetCamera", () => {
    it("should reset camera to default position and target", () => {
      const { result } = renderHook(() => useCameraStore());

      // First, change the camera position and target
      const customPosition: Vector3 = { x: 20, y: 15, z: 25 };
      const customTarget: Vector3 = { x: 5, y: 3, z: 7 };

      act(() => {
        result.current.setCamera(customPosition, customTarget);
      });

      // Verify the camera was changed
      expect(result.current.position).toEqual(customPosition);
      expect(result.current.target).toEqual(customTarget);

      // Reset the camera
      act(() => {
        result.current.resetCamera();
      });

      // Verify the camera was reset to defaults
      expect(result.current.position).toEqual({ x: 10, y: 10, z: 10 });
      expect(result.current.target).toEqual({ x: 0, y: 0, z: 0 });
    });

    it("should reset camera multiple times consistently", () => {
      const { result } = renderHook(() => useCameraStore());

      // Change camera multiple times and reset each time
      for (let i = 0; i < 3; i++) {
        const customPosition: Vector3 = { x: i * 5, y: i * 3, z: i * 7 };
        const customTarget: Vector3 = { x: i, y: i * 2, z: i * 4 };

        act(() => {
          result.current.setCamera(customPosition, customTarget);
        });

        act(() => {
          result.current.resetCamera();
        });

        expect(result.current.position).toEqual({ x: 10, y: 10, z: 10 });
        expect(result.current.target).toEqual({ x: 0, y: 0, z: 0 });
      }
    });
  });

  describe("Camera State Persistence", () => {
    it("should maintain camera state across multiple setCamera calls", () => {
      const { result } = renderHook(() => useCameraStore());

      const positions: Vector3[] = [
        { x: 1, y: 2, z: 3 },
        { x: 4, y: 5, z: 6 },
        { x: 7, y: 8, z: 9 },
      ];

      const targets: Vector3[] = [
        { x: 0.1, y: 0.2, z: 0.3 },
        { x: 0.4, y: 0.5, z: 0.6 },
        { x: 0.7, y: 0.8, z: 0.9 },
      ];

      // Set camera positions sequentially
      for (let i = 0; i < positions.length; i++) {
        act(() => {
          result.current.setCamera(positions[i], targets[i]);
        });

        expect(result.current.position).toEqual(positions[i]);
        expect(result.current.target).toEqual(targets[i]);
      }
    });
  });

  describe("Camera Navigation Scenarios", () => {
    it("should support typical orbit camera movement", () => {
      const { result } = renderHook(() => useCameraStore());

      // Simulate orbit around origin
      const orbitPositions: Vector3[] = [
        { x: 10, y: 0, z: 0 }, // Right
        { x: 0, y: 10, z: 0 }, // Top
        { x: -10, y: 0, z: 0 }, // Left
        { x: 0, y: -10, z: 0 }, // Bottom
      ];

      const target: Vector3 = { x: 0, y: 0, z: 0 };

      orbitPositions.forEach((position) => {
        act(() => {
          result.current.setCamera(position, target);
        });

        expect(result.current.position).toEqual(position);
        expect(result.current.target).toEqual(target);
      });
    });

    it("should support zoom in/out by changing camera distance", () => {
      const { result } = renderHook(() => useCameraStore());

      const target: Vector3 = { x: 0, y: 0, z: 0 };

      // Zoom out
      const zoomOutPosition: Vector3 = { x: 20, y: 20, z: 20 };
      act(() => {
        result.current.setCamera(zoomOutPosition, target);
      });

      expect(result.current.position).toEqual(zoomOutPosition);

      // Zoom in
      const zoomInPosition: Vector3 = { x: 5, y: 5, z: 5 };
      act(() => {
        result.current.setCamera(zoomInPosition, target);
      });

      expect(result.current.position).toEqual(zoomInPosition);
    });

    it("should support panning by changing target position", () => {
      const { result } = renderHook(() => useCameraStore());

      const position: Vector3 = { x: 10, y: 10, z: 10 };

      // Pan to different targets
      const panTargets: Vector3[] = [
        { x: 5, y: 0, z: 0 }, // Pan right
        { x: 0, y: 5, z: 0 }, // Pan up
        { x: -5, y: 0, z: 0 }, // Pan left
        { x: 0, y: -5, z: 0 }, // Pan down
      ];

      panTargets.forEach((target) => {
        act(() => {
          result.current.setCamera(position, target);
        });

        expect(result.current.position).toEqual(position);
        expect(result.current.target).toEqual(target);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large coordinate values", () => {
      const { result } = renderHook(() => useCameraStore());

      const largePosition: Vector3 = { x: 1000000, y: 1000000, z: 1000000 };
      const largeTarget: Vector3 = { x: 999999, y: 999999, z: 999999 };

      act(() => {
        result.current.setCamera(largePosition, largeTarget);
      });

      expect(result.current.position).toEqual(largePosition);
      expect(result.current.target).toEqual(largeTarget);
    });

    it("should handle very small coordinate values", () => {
      const { result } = renderHook(() => useCameraStore());

      const smallPosition: Vector3 = { x: 0.0001, y: 0.0001, z: 0.0001 };
      const smallTarget: Vector3 = { x: 0.00005, y: 0.00005, z: 0.00005 };

      act(() => {
        result.current.setCamera(smallPosition, smallTarget);
      });

      expect(result.current.position).toEqual(smallPosition);
      expect(result.current.target).toEqual(smallTarget);
    });
  });
});
