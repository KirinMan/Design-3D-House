/**
 * Unit tests for ExportPanel component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExportPanel from "../ExportPanel";
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
    HD: { width: 1280, height: 720 },
    FULL_HD: { width: 1920, height: 1080 },
    "4K": { width: 3840, height: 2160 },
  },
  ARCHITECTURAL_VIEWPOINTS: {
    FRONT: {
      position: new THREE.Vector3(0, 5, 15),
      target: new THREE.Vector3(0, 0, 0),
      name: "front-view",
    },
    ISOMETRIC: {
      position: new THREE.Vector3(10, 10, 10),
      target: new THREE.Vector3(0, 0, 0),
      name: "isometric-view",
    },
  },
  ScreenshotExporter: jest.fn().mockImplementation(() => ({
    captureScreenshotWithCamera: jest.fn().mockResolvedValue({
      success: true,
      filename: "test.png",
      blob: new Blob(["test"], { type: "image/png" }),
    }),
    captureMultipleScreenshots: jest.fn().mockResolvedValue([
      {
        success: true,
        filename: "front-view.png",
        blob: new Blob(["test"], { type: "image/png" }),
      },
      {
        success: true,
        filename: "isometric-view.png",
        blob: new Blob(["test"], { type: "image/png" }),
      },
    ]),
  })),
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

// Mock Three.js objects
const mockRenderer = {} as THREE.WebGLRenderer;
const mockScene = {} as THREE.Scene;
const mockCamera = {} as THREE.Camera;

describe("ExportPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders export panel with default settings", () => {
    render(<ExportPanel />);

    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByDisplayValue("obj")).toBeInTheDocument();
    expect(screen.getByText("Export Format")).toBeInTheDocument();
    expect(screen.getByText("Filename (optional)")).toBeInTheDocument();
  });

  it("shows model export options for OBJ format", () => {
    render(<ExportPanel />);

    expect(screen.getByLabelText("Include textures")).toBeInTheDocument();
    expect(screen.getByText("Export OBJ")).toBeInTheDocument();
  });

  it("shows GLTF-specific options when GLTF is selected", () => {
    render(<ExportPanel />);

    const formatSelect = screen.getByDisplayValue("obj");
    fireEvent.change(formatSelect, { target: { value: "gltf" } });

    expect(screen.getByLabelText("Include textures")).toBeInTheDocument();
    expect(screen.getByLabelText("Embed textures in file")).toBeInTheDocument();
    expect(screen.getByText("Export GLTF")).toBeInTheDocument();
  });

  it("shows screenshot options when PNG is selected", () => {
    render(<ExportPanel />);

    const formatSelect = screen.getByDisplayValue("obj");
    fireEvent.change(formatSelect, { target: { value: "png" } });

    expect(screen.getByText("Resolution")).toBeInTheDocument();
    expect(screen.getByText("Viewpoint")).toBeInTheDocument();
    expect(screen.getByText("Export PNG")).toBeInTheDocument();
    expect(screen.getByText("Export All Views")).toBeInTheDocument();
  });

  it("handles filename input", () => {
    render(<ExportPanel />);

    const filenameInput = screen.getByPlaceholderText(/house-design-/);
    fireEvent.change(filenameInput, { target: { value: "my-house" } });

    expect(filenameInput).toHaveValue("my-house");
  });

  it("handles texture options", () => {
    render(<ExportPanel />);

    const includeTexturesCheckbox = screen.getByLabelText("Include textures");
    expect(includeTexturesCheckbox).toBeChecked();

    fireEvent.click(includeTexturesCheckbox);
    expect(includeTexturesCheckbox).not.toBeChecked();
  });

  it("calls export function when export button is clicked", async () => {
    const { exportModel } = require("../../utils/modelExport");
    
    render(<ExportPanel />);

    const exportButton = screen.getByText("Export OBJ");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(exportModel).toHaveBeenCalled();
    });
  });

  it("handles screenshot export with renderer props", async () => {
    const { captureScreenshot } = require("../../utils/screenshotExport");
    
    render(
      <ExportPanel
        renderer={mockRenderer}
        scene={mockScene}
        camera={mockCamera}
      />
    );

    const formatSelect = screen.getByDisplayValue("obj");
    fireEvent.change(formatSelect, { target: { value: "png" } });

    const exportButton = screen.getByText("Export PNG");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(captureScreenshot).toHaveBeenCalledWith(
        mockRenderer,
        mockScene,
        mockCamera,
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  it("handles multiple screenshots export", async () => {
    const { ScreenshotExporter } = require("../../utils/screenshotExport");
    
    render(
      <ExportPanel
        renderer={mockRenderer}
        scene={mockScene}
        camera={mockCamera}
      />
    );

    const formatSelect = screen.getByDisplayValue("obj");
    fireEvent.change(formatSelect, { target: { value: "png" } });

    const exportAllButton = screen.getByText("Export All Views");
    fireEvent.click(exportAllButton);

    await waitFor(() => {
      expect(ScreenshotExporter).toHaveBeenCalled();
    });
  });

  it("disables controls during export", async () => {
    const { exportModel } = require("../../utils/modelExport");
    exportModel.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<ExportPanel />);

    const exportButton = screen.getByText("Export OBJ");
    const formatSelect = screen.getByDisplayValue("obj");

    fireEvent.click(exportButton);

    expect(exportButton).toBeDisabled();
    expect(formatSelect).toBeDisabled();

    await waitFor(() => {
      expect(exportButton).not.toBeDisabled();
    });
  });

  it("shows progress during export", async () => {
    const { exportModel } = require("../../utils/modelExport");
    exportModel.mockImplementation((objects: any, materials: any, options: any, onProgress: any) => {
      onProgress?.({
        stage: "processing",
        progress: 50,
        message: "Processing objects...",
      });
      return Promise.resolve({
        success: true,
        filename: "test.obj",
        blob: new Blob(["test"], { type: "text/plain" }),
      });
    });

    render(<ExportPanel />);

    const exportButton = screen.getByText("Export OBJ");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText("Processing objects...")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });
  });

  it("shows error message on export failure", async () => {
    const { exportModel } = require("../../utils/modelExport");
    exportModel.mockRejectedValue(new Error("Export failed"));

    render(<ExportPanel />);

    const exportButton = screen.getByText("Export OBJ");
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText(/Export failed: Export failed/)).toBeInTheDocument();
    });
  });
});