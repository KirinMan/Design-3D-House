/**
 * Export Button Component
 * Simple button component for quick export functionality with loading states and user feedback
 * Requirements: 6.1, 6.2, 6.4
 */

import React from "react";
import { useSceneStore } from "../stores/sceneStore";
import { useMaterialStore } from "../stores/materialStore";
import { exportModel, downloadExportedFile } from "../utils/modelExport";
import { captureScreenshot, downloadScreenshot, RESOLUTION_PRESETS } from "../utils/screenshotExport";
import { ExportFormat, ExportProgress, ModelExportOptions, ImageExportOptions } from "../types/export";
import { useExportOperation } from "../stores/loadingStore";
import { useToastHelpers } from "./ToastNotification";
import { useConfirmationHelpers } from "./ConfirmationDialog";
import * as THREE from "three";

interface ExportButtonProps {
  format: ExportFormat;
  renderer?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  className?: string;
  children?: React.ReactNode;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  format,
  renderer,
  scene,
  camera,
  className = "",
  children,
}) => {
  const sceneStore = useSceneStore();
  const materialStore = useMaterialStore();
  const { startExport, updateExportProgress, finishExport, cancelExport } = useExportOperation();
  const { showSuccess, showError } = useToastHelpers();
  const { confirmExport } = useConfirmationHelpers();

  const handleExport = async () => {
    // Show confirmation dialog first
    confirmExport(format.toUpperCase(), async () => {
      await performExport();
    });
  };

  const performExport = async () => {
    let exportId: string | null = null;
    
    try {
      // Start the export operation with loading indicator
      exportId = startExport(format, () => {
        if (exportId) {
          cancelExport(exportId);
          showError("Export Cancelled", "The export operation was cancelled by the user.");
        }
      });

      if (format === "png") {
        await handleScreenshotExport(exportId);
      } else {
        await handleModelExport(exportId);
      }

      // Show success notification
      showSuccess(
        "Export Completed",
        `Successfully exported ${format.toUpperCase()} file.`,
        {
          label: "Export Another",
          onClick: () => handleExport(),
        }
      );
    } catch (error) {
      console.error("Export failed:", error);
      showError(
        "Export Failed",
        error instanceof Error ? error.message : "An unknown error occurred during export.",
        {
          label: "Try Again",
          onClick: () => handleExport(),
        }
      );
    } finally {
      if (exportId) {
        finishExport(exportId);
      }
    }
  };

  const handleModelExport = async (exportId: string) => {
    const objects = Array.from(sceneStore.objects.values());
    const materials = materialStore.getAllMaterials();

    // Update progress: preparing data
    updateExportProgress(exportId, 10, "Preparing scene data...");

    const options: ModelExportOptions = {
      format: format as "obj" | "gltf",
      includeTextures: true,
      embedTextures: format === "gltf",
    };

    // Update progress: processing geometry
    updateExportProgress(exportId, 30, "Processing geometry...");

    const result = await exportModel(objects, materials, options);

    if (result.success) {
      // Update progress: finalizing
      updateExportProgress(exportId, 90, "Finalizing export...");
      
      downloadExportedFile(result);
      
      // Complete
      updateExportProgress(exportId, 100, "Export complete!");
    } else {
      throw new Error(result.error);
    }
  };

  const handleScreenshotExport = async (exportId: string) => {
    if (!renderer || !scene || !camera) {
      throw new Error("3D viewport not available for screenshot");
    }

    // Update progress: preparing screenshot
    updateExportProgress(exportId, 20, "Preparing screenshot...");

    const options: ImageExportOptions = {
      format: "png",
      resolution: RESOLUTION_PRESETS.FULL_HD,
    };

    // Update progress: capturing
    updateExportProgress(exportId, 60, "Capturing screenshot...");

    const result = await captureScreenshot(renderer, scene, camera, options);

    if (result.success) {
      // Update progress: finalizing
      updateExportProgress(exportId, 90, "Processing image...");
      
      downloadScreenshot(result);
      
      // Complete
      updateExportProgress(exportId, 100, "Screenshot saved!");
    } else {
      throw new Error(result.error);
    }
  };

  const getButtonText = () => {
    if (children) return children;
    
    switch (format) {
      case "obj":
        return "Export OBJ";
      case "gltf":
        return "Export GLTF";
      case "png":
        return "Export PNG";
      default:
        return "Export";
    }
  };

  return (
    <button
      onClick={handleExport}
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
    >
      {getButtonText()}
    </button>
  );
};

export default ExportButton;