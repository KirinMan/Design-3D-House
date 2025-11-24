/**
 * Wall geometry utility tests
 * Tests requirements: 1.3, 2.1
 */

import {
  calculateWallGeometry,
  createWallFromPoints,
  shouldSnapPoints,
  snapToGrid,
  calculateWallIntersection,
} from "../wallGeometry";
import { WallObject, Vector2 } from "../../types/scene";

describe("wallGeometry", () => {
  describe("calculateWallGeometry", () => {
    it("should calculate correct geometry for horizontal wall", () => {
      const wall: Partial<WallObject> = {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 4, y: 0 },
        height: 2.5,
        thickness: 0.2,
      };

      const result = calculateWallGeometry(wall as WallObject);

      expect(result.length).toBe(4);
      expect(result.angle).toBe(0);
      expect(result.position).toEqual({ x: 2, y: 1.25, z: 0 });
      expect(result.rotation).toEqual({ x: 0, y: 0, z: 0 });
      expect(result.geometry.parameters.width).toBe(4); // length
      expect(result.geometry.parameters.height).toBe(2.5);
      expect(result.geometry.parameters.depth).toBe(0.2); // thickness
    });

    it("should calculate correct geometry for vertical wall", () => {
      const wall: Partial<WallObject> = {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 0, y: 3 },
        height: 2.5,
        thickness: 0.2,
      };

      const result = calculateWallGeometry(wall as WallObject);

      expect(result.length).toBe(3);
      expect(result.angle).toBe(Math.PI / 2);
      expect(result.position).toEqual({ x: 0, y: 1.25, z: 1.5 });
      expect(result.rotation).toEqual({ x: 0, y: Math.PI / 2, z: 0 });
    });

    it("should calculate correct geometry for diagonal wall", () => {
      const wall: Partial<WallObject> = {
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 3, y: 4 },
        height: 2.5,
        thickness: 0.2,
      };

      const result = calculateWallGeometry(wall as WallObject);

      expect(result.length).toBe(5); // sqrt(3^2 + 4^2)
      expect(result.angle).toBeCloseTo(Math.atan2(4, 3));
      expect(result.position).toEqual({ x: 1.5, y: 1.25, z: 2 });
    });

    it("should handle zero-length wall", () => {
      const wall: Partial<WallObject> = {
        startPoint: { x: 1, y: 1 },
        endPoint: { x: 1, y: 1 },
        height: 2.5,
        thickness: 0.2,
      };

      const result = calculateWallGeometry(wall as WallObject);

      expect(result.length).toBe(0);
      expect(result.position).toEqual({ x: 1, y: 1.25, z: 1 });
    });
  });

  describe("createWallFromPoints", () => {
    it("should create wall geometry with default dimensions", () => {
      const startPoint: Vector2 = { x: 0, y: 0 };
      const endPoint: Vector2 = { x: 5, y: 0 };

      const result = createWallFromPoints(startPoint, endPoint);

      expect(result.length).toBe(5);
      expect(result.position).toEqual({ x: 2.5, y: 1.25, z: 0 });
      expect(result.geometry.parameters.height).toBe(2.5); // default height
      expect(result.geometry.parameters.depth).toBe(0.2); // default thickness
    });

    it("should create wall geometry with custom dimensions", () => {
      const startPoint: Vector2 = { x: 0, y: 0 };
      const endPoint: Vector2 = { x: 2, y: 0 };
      const height = 3;
      const thickness = 0.3;

      const result = createWallFromPoints(
        startPoint,
        endPoint,
        height,
        thickness
      );

      expect(result.geometry.parameters.height).toBe(3);
      expect(result.geometry.parameters.depth).toBe(0.3);
      expect(result.position.y).toBe(1.5); // height / 2
    });
  });

  describe("shouldSnapPoints", () => {
    it("should return true for points within snap distance", () => {
      const point1: Vector2 = { x: 0, y: 0 };
      const point2: Vector2 = { x: 0.3, y: 0.4 };

      const result = shouldSnapPoints(point1, point2, 0.5);

      expect(result).toBe(true);
    });

    it("should return false for points outside snap distance", () => {
      const point1: Vector2 = { x: 0, y: 0 };
      const point2: Vector2 = { x: 1, y: 1 };

      const result = shouldSnapPoints(point1, point2, 0.5);

      expect(result).toBe(false);
    });

    it("should use default snap distance", () => {
      const point1: Vector2 = { x: 0, y: 0 };
      const point2: Vector2 = { x: 0.4, y: 0.3 };

      const result = shouldSnapPoints(point1, point2);

      expect(result).toBe(true);
    });
  });

  describe("snapToGrid", () => {
    it("should snap point to grid with default size", () => {
      const point: Vector2 = { x: 1.7, y: 2.3 };

      const result = snapToGrid(point);

      expect(result).toEqual({ x: 2, y: 2 });
    });

    it("should snap point to custom grid size", () => {
      const point: Vector2 = { x: 1.7, y: 2.3 };

      const result = snapToGrid(point, 0.5);

      expect(result).toEqual({ x: 1.5, y: 2.5 });
    });

    it("should handle negative coordinates", () => {
      const point: Vector2 = { x: -1.7, y: -2.3 };

      const result = snapToGrid(point);

      expect(result).toEqual({ x: -2, y: -2 });
    });
  });

  describe("calculateWallIntersection", () => {
    it("should find intersection of perpendicular walls", () => {
      const wall1Start: Vector2 = { x: 0, y: 0 };
      const wall1End: Vector2 = { x: 4, y: 0 };
      const wall2Start: Vector2 = { x: 2, y: -2 };
      const wall2End: Vector2 = { x: 2, y: 2 };

      const result = calculateWallIntersection(
        wall1Start,
        wall1End,
        wall2Start,
        wall2End
      );

      expect(result).toEqual({ x: 2, y: 0 });
    });

    it("should find intersection of diagonal walls", () => {
      const wall1Start: Vector2 = { x: 0, y: 0 };
      const wall1End: Vector2 = { x: 4, y: 4 };
      const wall2Start: Vector2 = { x: 0, y: 4 };
      const wall2End: Vector2 = { x: 4, y: 0 };

      const result = calculateWallIntersection(
        wall1Start,
        wall1End,
        wall2Start,
        wall2End
      );

      expect(result).toEqual({ x: 2, y: 2 });
    });

    it("should return null for parallel walls", () => {
      const wall1Start: Vector2 = { x: 0, y: 0 };
      const wall1End: Vector2 = { x: 4, y: 0 };
      const wall2Start: Vector2 = { x: 0, y: 2 };
      const wall2End: Vector2 = { x: 4, y: 2 };

      const result = calculateWallIntersection(
        wall1Start,
        wall1End,
        wall2Start,
        wall2End
      );

      expect(result).toBeNull();
    });

    it("should return null for non-intersecting walls", () => {
      const wall1Start: Vector2 = { x: 0, y: 0 };
      const wall1End: Vector2 = { x: 1, y: 0 };
      const wall2Start: Vector2 = { x: 2, y: -1 };
      const wall2End: Vector2 = { x: 2, y: 1 };

      const result = calculateWallIntersection(
        wall1Start,
        wall1End,
        wall2Start,
        wall2End
      );

      expect(result).toBeNull();
    });
  });
});
