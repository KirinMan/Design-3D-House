/**
 * Tests for 3DViewport component
 */

import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Viewport3D from "../3DViewport";

// Mock React Three Fiber components
jest.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
}));

jest.mock("@react-three/drei", () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Grid: () => <div data-testid="grid" />,
  Environment: () => <div data-testid="environment" />,
}));

// Mock stores
jest.mock("../../stores/cameraStore", () => ({
  useCameraStore: () => ({
    position: { x: 10, y: 10, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    setCamera: jest.fn(),
  }),
}));

jest.mock("../../stores/sceneStore", () => ({
  useSceneStore: () => ({
    objects: new Map(),
    selectedObjects: [],
    addObject: jest.fn(),
    selectObjects: jest.fn(),
  }),
}));

describe("Viewport3D", () => {
  it("renders without crashing", () => {
    const { getByTestId } = render(<Viewport3D />);
    expect(getByTestId("canvas")).toBeInTheDocument();
  });

  it("includes necessary 3D components", () => {
    const { getByTestId } = render(<Viewport3D />);
    expect(getByTestId("orbit-controls")).toBeInTheDocument();
    expect(getByTestId("grid")).toBeInTheDocument();
    expect(getByTestId("environment")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Viewport3D className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});