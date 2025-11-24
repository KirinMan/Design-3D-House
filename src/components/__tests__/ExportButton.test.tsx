/**
 * Unit tests for ExportButton component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExportButton from "../ExportButton";
import * as THREE from "three";

// Mock the export utilities
jest.mock("../../utils/modelExport", () => ({
  exportModel: jest.fn().mockResolvedValue({
    success: true,
    filename: "test.obj",
    blob: new Blob(["test"], { type: "text/plain" }),
  }),
  downloadExportedFile: jest.fn(),
}));

jest.mock("../../utils/screenshotExport", () => ({
  captureScreenshot: jest.fn().mockResolvedValue({
    success: true,
    filename: "test.png",
    blob: new Blob(["test"], { type: "image/png" }),
  }),
  downloadScreenshot: jest.fn(),
  RESOLUTION_PRESETS: {
    FULL_HD: { width: 1920, height: 1080 },
  },
}));

// Mock the stores
jest.mock("../../stores/sceneStore", () => ({
  useSceneStore: () => ({
    objects: new Map([
      [
        "wall-1",
        {
          id: "wall-1",
          type: "wall",
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: { id: "mat-1", name: "Wall", color: "#fff", roughness: 0.8, metalness: 0.1 },
        },
      ],
    ]),
  }),
}));

jest.mock("../../stores/materialStore", () => ({
  useMaterialStore: () => ({
    getAllMaterials: () => [
      { id: "mat-1", name: "Wall", color: "#fff", roughness: 0.8, metalness: 0.1 },
    ],
  }),
}));

// Mock alert
global.alert = jest.fn();

// Mock Three.js objects
const mockRenderer = {} as THREE.WebGLRenderer;
const mockScene = {} as THREE.Scene;
const mockCamera = {} as THREE.Camera;

describe("ExportButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders OBJ export button", () => {
    render(<ExportButton format="obj" />);
    expect(screen.getByText("Export OBJ")).toBeInTheDocument();
  });

  it("renders GLTF export button", () => {
    render(<ExportButton format="gltf" />);
    expect(screen.getByText("Export GLTF")).toBeInTheDocument();
  });

  it("renders PNG export button", () => {
    render(<ExportButton format="png" renderer={mockRenderer} scene={mockScene} camera={mockCamera} />);
    expect(screen.getByText("Export PNG")).toBeInTheDocument();
  });

  it("renders custom children", () => {
    render(<ExportButton format="obj">Custom Export Text</ExportButton>);
    expect(screen.getByText("Custom Export Text")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ExportButton format="obj" className="custom-class" />);
    const button = screen.getByText("Export OBJ");
    expect(button).toHaveClass("custom-class");
  });

  it("calls model export for OBJ format", async () => {
    const { exportModel } = require("../../utils/modelExport");
    
    render(<ExportButton format="obj" />);
    
    const button = screen.getByText("Export OBJ");
    fireEvent.click(button);

    await waitFor(() => {
      expect(exportModel).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.objectContaining({
          format: "obj",
          includeTextures: true,
          embedTextures: false,
        })
      );
    });
  });

  it("calls model export for GLTF format with embedded textures", async () => {
    const { exportModel } = require("../../utils/modelExport");
    
    render(<ExportButton format="gltf" />);
    
    const button = screen.getByText("Export GLTF");
    fireEvent.click(button);

    await waitFor(() => {
      expect(exportModel).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.objectContaining({
          format: "gltf",
          includeTextures: true,
          embedTextures: true,
        })
      );
    });
  });

  it("calls screenshot export for PNG format", async () => {
    const { captureScreenshot } = require("../../utils/screenshotExport");
    
    render(
      <ExportButton 
        format="png" 
        renderer={mockRenderer} 
        scene={mockScene} 
        camera={mockCamera} 
      />
    );
    
    const button = screen.getByText("Export PNG");
    fireEvent.click(button);

    await waitFor(() => {
      expect(captureScreenshot).toHaveBeenCalledWith(
        mockRenderer,
        mockScene,
        mockCamera,
        expect.objectContaining({
          format: "png",
          resolution: { width: 1920, height: 1080 },
        })
      );
    });
  });

  it("shows error alert when PNG export fails without renderer", async () => {
    render(<ExportButton format="png" />);
    
    const button = screen.getByText("Export PNG");
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Export failed: 3D viewport not available for screenshot"
      );
    });
  });

  it("disables button during export", async () => {
    const { exportModel } = require("../../utils/modelExport");
    exportModel.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ExportButton format="obj" />);
    
    const button = screen.getByText("Export OBJ");
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Exporting...");

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent("Export OBJ");
    });
  });

  it("handles export errors gracefully", async () => {
    const { exportModel } = require("../../utils/modelExport");
    exportModel.mockRejectedValue(new Error("Export failed"));

    render(<ExportButton format="obj" />);
    
    const button = screen.getByText("Export OBJ");
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith("Export failed: Export failed");
    });
  });

  it("downloads file on successful export", async () => {
    const { exportModel, downloadExportedFile } = require("../../utils/modelExport");
    
    render(<ExportButton format="obj" />);
    
    const button = screen.getByText("Export OBJ");
    fireEvent.click(button);

    await waitFor(() => {
      expect(downloadExportedFile).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          filename: "test.obj",
        })
      );
    });
  });

  it("downloads screenshot on successful PNG export", async () => {
    const { captureScreenshot, downloadScreenshot } = require("../../utils/screenshotExport");
    
    render(
      <ExportButton 
        format="png" 
        renderer={mockRenderer} 
        scene={mockScene} 
        camera={mockCamera} 
      />
    );
    
    const button = screen.getByText("Export PNG");
    fireEvent.click(button);

    await waitFor(() => {
      expect(downloadScreenshot).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          filename: "test.png",
        })
      );
    });
  });
});