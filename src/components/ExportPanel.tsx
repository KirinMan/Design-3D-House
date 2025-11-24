/**
 * Export Panel Component
 * Provides UI for exporting 3D models and screenshots
 * Requirements: 6.1, 6.2, 6.4
 */

import React, { useState, useRef } from "react";
import { useSceneStore } from "../stores/sceneStore";
import { useMaterialStore } from "../stores/materialStore";
import { exportModel, downloadExportedFile } from "../utils/modelExport";
import { captureScreenshot, downloadScreenshot, RESOLUTION_PRESETS, ARCHITECTURAL_VIEWPOINTS } from "../utils/screenshotExport";
import { ExportFormat, ExportProgress, ModelExportOptions, ImageExportOptions } from "../types/export";
import * as THREE from "three";

interface ExportPanelProps {
  renderer?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  className?: string;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  renderer,
  scene,
  camera,
  className = "",
}) => {
  const sceneStore = useSceneStore();
  const materialStore = useMaterialStore();
  
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("obj");
  const [selectedResolution, setSelectedResolution] = useState<keyof typeof RESOLUTION_PRESETS>("FULL_HD");
  const [filename, setFilename] = useState("");
  const [includeTextures, setIncludeTextures] = useState(true);
  const [embedTextures, setEmbedTextures] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [selectedViewpoint, setSelectedViewpoint] = useState<keyof typeof ARCHITECTURAL_VIEWPOINTS | "CURRENT">("ISOMETRIC");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress({
      stage: "preparing",
      progress: 0,
      message: "Starting export...",
    });

    try {
      if (selectedFormat === "png") {
        await handleScreenshotExport();
      } else {
        await handleModelExport();
      }
    } catch (error) {
      console.error("Export failed:", error);
      setExportProgress({
        stage: "error",
        progress: 0,
        message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(null), 3000);
    }
  };

  const handleModelExport = async () => {
    const objects = Array.from(sceneStore.objects.values());
    const materials = materialStore.getAllMaterials();

    const options: ModelExportOptions = {
      format: selectedFormat as "obj" | "gltf",
      filename: filename || undefined,
      includeTextures,
      embedTextures,
    };

    const result = await exportModel(objects, materials, options, setExportProgress);

    if (result.success) {
      downloadExportedFile(result);
    } else {
      throw new Error(result.error);
    }
  };

  const handleScreenshotExport = async () => {
    if (!renderer || !scene || !camera) {
      throw new Error("3D viewport not available for screenshot");
    }

    const resolution = RESOLUTION_PRESETS[selectedResolution];
    const options: ImageExportOptions = {
      format: "png",
      filename: filename || undefined,
      resolution,
    };

    let result;
    if (selectedViewpoint === "CURRENT") {
      result = await captureScreenshot(renderer, scene, camera, options, setExportProgress);
    } else {
      const viewpoint = ARCHITECTURAL_VIEWPOINTS[selectedViewpoint];
      const { ScreenshotExporter } = await import("../utils/screenshotExport");
      const exporter = new ScreenshotExporter();
      result = await exporter.captureScreenshotWithCamera(
        renderer,
        scene,
        viewpoint.position,
        viewpoint.target,
        options,
        setExportProgress
      );
    }

    if (result.success) {
      downloadScreenshot(result);
    } else {
      throw new Error(result.error);
    }
  };

  const handleMultipleScreenshots = async () => {
    if (!renderer || !scene) {
      throw new Error("3D viewport not available for screenshots");
    }

    setIsExporting(true);
    setExportProgress({
      stage: "preparing",
      progress: 0,
      message: "Preparing multiple screenshots...",
    });

    try {
      const resolution = RESOLUTION_PRESETS[selectedResolution];
      const viewpoints = Object.values(ARCHITECTURAL_VIEWPOINTS);
      
      const { ScreenshotExporter } = await import("../utils/screenshotExport");
      const exporter = new ScreenshotExporter();
      
      const results = await exporter.captureMultipleScreenshots(
        renderer,
        scene,
        viewpoints,
        { format: "png", resolution },
        setExportProgress
      );

      // Download all successful screenshots
      results.forEach((result) => {
        if (result.success) {
          downloadScreenshot(result);
        }
      });

      const successCount = results.filter(r => r.success).length;
      setExportProgress({
        stage: "complete",
        progress: 100,
        message: `Successfully exported ${successCount} screenshots`,
      });
    } catch (error) {
      console.error("Multiple screenshots export failed:", error);
      setExportProgress({
        stage: "error",
        progress: 0,
        message: `Export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(null), 3000);
    }
  };

  const getFileExtension = () => {
    switch (selectedFormat) {
      case "obj":
        return ".obj";
      case "gltf":
        return ".glb";
      case "png":
        return ".png";
      default:
        return "";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Export</h3>

      {/* Format Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isExporting}
        >
          <option value="obj">OBJ (3D Model)</option>
          <option value="gltf">GLTF (3D Model)</option>
          <option value="png">PNG (Screenshot)</option>
        </select>
      </div>

      {/* Filename Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filename (optional)
        </label>
        <div className="flex">
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder={`house-design-${Date.now()}`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isExporting}
          />
          <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
            {getFileExtension()}
          </span>
        </div>
      </div>

      {/* Model Export Options */}
      {(selectedFormat === "obj" || selectedFormat === "gltf") && (
        <div className="mb-4 space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeTextures"
              checked={includeTextures}
              onChange={(e) => setIncludeTextures(e.target.checked)}
              className="mr-2"
              disabled={isExporting}
            />
            <label htmlFor="includeTextures" className="text-sm text-gray-700">
              Include textures
            </label>
          </div>
          
          {selectedFormat === "gltf" && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="embedTextures"
                checked={embedTextures}
                onChange={(e) => setEmbedTextures(e.target.checked)}
                className="mr-2"
                disabled={isExporting || !includeTextures}
              />
              <label htmlFor="embedTextures" className="text-sm text-gray-700">
                Embed textures in file
              </label>
            </div>
          )}
        </div>
      )}

      {/* Screenshot Options */}
      {selectedFormat === "png" && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution
            </label>
            <select
              value={selectedResolution}
              onChange={(e) => setSelectedResolution(e.target.value as keyof typeof RESOLUTION_PRESETS)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            >
              {Object.entries(RESOLUTION_PRESETS).map(([key, { width, height }]) => (
                <option key={key} value={key}>
                  {key.replace("_", " ")} ({width}×{height})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Viewpoint
            </label>
            <select
              value={selectedViewpoint}
              onChange={(e) => setSelectedViewpoint(e.target.value as keyof typeof ARCHITECTURAL_VIEWPOINTS | "CURRENT")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isExporting}
            >
              <option value="CURRENT">Current View</option>
              {Object.entries(ARCHITECTURAL_VIEWPOINTS).map(([key, viewpoint]) => (
                <option key={key} value={key}>
                  {viewpoint.name.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Export Progress */}
      {exportProgress && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {exportProgress.message}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(exportProgress.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                exportProgress.stage === "error"
                  ? "bg-red-500"
                  : exportProgress.stage === "complete"
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${exportProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? "Exporting..." : `Export ${selectedFormat.toUpperCase()}`}
        </button>

        {selectedFormat === "png" && (
          <button
            onClick={handleMultipleScreenshots}
            disabled={isExporting}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? "Exporting..." : "Export All Views"}
          </button>
        )}
      </div>

      {/* Info Text */}
      <div className="mt-4 text-xs text-gray-500">
        {selectedFormat === "obj" && "OBJ format exports geometry and materials as separate files."}
        {selectedFormat === "gltf" && "GLTF format exports a complete 3D scene with embedded materials."}
        {selectedFormat === "png" && "PNG format exports high-quality screenshots of your 3D model."}
      </div>
    </div>
  );
};

export default ExportPanel;