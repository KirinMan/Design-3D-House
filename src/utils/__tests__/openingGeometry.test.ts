/**
 * Unit tests for opening geometry utilities
 * Tests requirements: 2.2, 2.3
 */

import {
  calculateOpeningPosition,
  calculateOpeningRotation,
  createDoorGeometry,
  createWindowGeometry,
  createOpeningCutout,
  validateOpeningPosition,
} from "../openingGeometry";
import { WallObject, Opening } from "../../types/scene";

// Mock wall object for testing
const mockWall: WallObject = {
  id: "wall-1",
  type: "wall",
  startPoint: { x: 0, y: 0 },
  endPoint: { x: 4, y: 0 },
  height: 2.5,
  thickness: 0.2,
  position: { x: 2, y: 1.25, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  properties: {},
  material: {
    id: "wall-material",
    name: "Wall Material",
    color: "#CCCCCC",
    roughness: 0.8,
    metalness: 0.1,
  },
  openings: [],
};

// Mock door opening
const mockDoorOpening: Opening = {
  id: "door-1",
  type: "door",
  position: 0.5, // Center of wall
  width: 0.8,
  height: 2.0,
  properties: {},
};

// Mock window opening
const mockWindowOpening: Opening = {
  id: "window-1",
  type: "window",
  position: 0.25, // Quarter way along wall
  width: 1.2,
  height: 1.0,
  properties: {},
};

describe("calculateOpeningPosition", () => {
  it("should calculate correct position for opening at center of horizontal wall", () => {
    const position = calculateOpeningPosition(mockWall, mockDoorOpening);

    expect(position.x).toBeCloseTo(2); // Center of 4m wall
    expect(position.y).toBeCloseTo(1); // Half of door height
    expect(position.z).toBeCloseTo(0); // Wall is along X axis
  });

  it("should calculate correct position for opening at quarter position", () => {
    const position = calculateOpeningPosition(mockWall, mockWindowOpening);

    expect(position.x).toBeCloseTo(1); // Quarter of 4m wall
    expect(position.y).toBeCloseTo(0.5); // Half of window height
    expect(position.z).toBeCloseTo(0);
  });

  it("should handle diagonal walls correctly", () => {
    const diagonalWall: WallObject = {
      ...mockWall,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 3, y: 4 }, // 3-4-5 triangle
    };

    const position = calculateOpeningPosition(diagonalWall, {
      ...mockDoorOpening,
      position: 0.5,
    });

    expect(position.x).toBeCloseTo(1.5); // Half of 3
    expect(position.z).toBeCloseTo(2); // Half of 4
  });
});

describe("calculateOpeningRotation", () => {
  it("should return zero rotation for horizontal wall", () => {
    const rotation = calculateOpeningRotation(mockWall);

    expect(rotation.x).toBe(0);
    expect(rotation.y).toBeCloseTo(0);
    expect(rotation.z).toBe(0);
  });

  it("should calculate correct rotation for vertical wall", () => {
    const verticalWall: WallObject = {
      ...mockWall,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 4 },
    };

    const rotation = calculateOpeningRotation(verticalWall);

    expect(rotation.x).toBe(0);
    expect(rotation.y).toBeCloseTo(Math.PI / 2);
    expect(rotation.z).toBe(0);
  });

  it("should calculate correct rotation for diagonal wall", () => {
    const diagonalWall: WallObject = {
      ...mockWall,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    };

    const rotation = calculateOpeningRotation(diagonalWall);

    expect(rotation.x).toBe(0);
    expect(rotation.y).toBeCloseTo(Math.PI / 4); // 45 degrees
    expect(rotation.z).toBe(0);
  });
});

describe("createDoorGeometry", () => {
  it("should create door geometry with correct dimensions", () => {
    const geometryData = createDoorGeometry(
      mockDoorOpening,
      mockWall.thickness
    );

    expect(geometryData.width).toBeCloseTo(0.9); // Door width + frame
    expect(geometryData.height).toBeCloseTo(2.05); // Door height + frame
    expect(geometryData.depth).toBeCloseTo(0.22); // Wall thickness + margin
    expect(geometryData.geometry).toBeDefined();
  });

  it("should handle different wall thicknesses", () => {
    const thickWall = 0.3;
    const geometryData = createDoorGeometry(mockDoorOpening, thickWall);

    expect(geometryData.depth).toBeCloseTo(0.32); // Thick wall + margin
  });
});

describe("createWindowGeometry", () => {
  it("should create window geometry with correct dimensions", () => {
    const geometryData = createWindowGeometry(
      mockWindowOpening,
      mockWall.thickness
    );

    expect(geometryData.width).toBeCloseTo(1.3); // Window width + frame
    expect(geometryData.height).toBeCloseTo(1.1); // Window height + frame
    expect(geometryData.depth).toBeCloseTo(0.2); // Wall thickness
    expect(geometryData.geometry).toBeDefined();
  });

  it("should handle small windows", () => {
    const smallWindow: Opening = {
      ...mockWindowOpening,
      width: 0.5,
      height: 0.5,
    };

    const geometryData = createWindowGeometry(smallWindow, mockWall.thickness);

    expect(geometryData.width).toBeCloseTo(0.6); // Small window + frame
    expect(geometryData.height).toBeCloseTo(0.6);
  });
});

describe("createOpeningCutout", () => {
  it("should create cutout geometry with correct dimensions", () => {
    const cutoutGeometry = createOpeningCutout(
      mockDoorOpening,
      mockWall.thickness
    );

    expect(cutoutGeometry).toBeDefined();
    // Note: Three.js geometry doesn't expose dimensions directly,
    // but we can verify it's a BoxGeometry
    expect(cutoutGeometry.type).toBe("BoxGeometry");
  });
});

describe("validateOpeningPosition", () => {
  it("should validate opening that fits within wall", () => {
    const result = validateOpeningPosition(mockWall, mockDoorOpening);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject opening that extends beyond wall start", () => {
    const invalidOpening: Opening = {
      ...mockDoorOpening,
      position: 0.05, // Too close to start
      width: 1.0,
    };

    const result = validateOpeningPosition(mockWall, invalidOpening);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("beyond wall start");
  });

  it("should reject opening that extends beyond wall end", () => {
    const invalidOpening: Opening = {
      ...mockDoorOpening,
      position: 0.95, // Too close to end
      width: 1.0,
    };

    const result = validateOpeningPosition(mockWall, invalidOpening);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("beyond wall end");
  });

  it("should reject opening taller than wall", () => {
    const invalidOpening: Opening = {
      ...mockDoorOpening,
      height: 3.0, // Taller than 2.5m wall
    };

    const result = validateOpeningPosition(mockWall, invalidOpening);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("exceeds wall height");
  });

  it("should reject overlapping openings", () => {
    const wallWithOpening: WallObject = {
      ...mockWall,
      openings: [mockDoorOpening],
    };

    const overlappingOpening: Opening = {
      id: "door-2",
      type: "door",
      position: 0.55, // Overlaps with existing door at 0.5
      width: 0.8,
      height: 2.0,
      properties: {},
    };

    const result = validateOpeningPosition(wallWithOpening, overlappingOpening);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("overlaps");
  });

  it("should allow non-overlapping openings", () => {
    const wallWithOpening: WallObject = {
      ...mockWall,
      openings: [mockDoorOpening], // Door at position 0.5
    };

    const nonOverlappingOpening: Opening = {
      id: "window-2",
      type: "window",
      position: 0.1, // Far from existing door
      width: 0.6,
      height: 1.0,
      properties: {},
    };

    const result = validateOpeningPosition(
      wallWithOpening,
      nonOverlappingOpening
    );

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
