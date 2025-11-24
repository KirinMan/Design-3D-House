/**
 * Screenshot Export Utilities
 * Implements high-quality screenshot capture from 3D viewport
 * Requirements: 6.1, 6.2, 6.4
 */

import * as THREE from "three";
import {
  ImageExportOptions,
  ExportResult,
  ExportProgress,
} from "../types/export";

export class ScreenshotExporter {
  /**
   * Capture screenshot from Three.js renderer
   */
  async captureScreenshot(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    options: ImageExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    try {
      onProgress?.({
        stage: "preparing",
        progress: 0,
        message: "Preparing screenshot capture...",
      });

      // Store original renderer size
      const originalSize = renderer.getSize(new THREE.Vector2());
      const originalPixelRatio = renderer.getPixelRatio();

      onProgress?.({
        stage: "processing",
        progress: 20,
        message: "Setting up high-resolution rendering...",
      });

      // Set up high-resolution rendering
      const { width, height } = options.resolution;
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(1); // Use 1:1 pixel ratio for consistent output

      onProgress?.({
        stage: "processing",
        progress: 50,
        message: "Rendering scene...",
      });

      // Render the scene
      renderer.render(scene, camera);

      onProgress?.({
        stage: "finalizing",
        progress: 80,
        message: "Capturing image data...",
      });

      // Capture the rendered image
      const canvas = renderer.domElement;
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create image blob"));
            }
          },
          "image/png",
          options.quality || 1.0
        );
      });

      // Restore original renderer settings
      renderer.setSize(originalSize.x, originalSize.y, false);
      renderer.setPixelRatio(originalPixelRatio);

      const filename = options.filename || `house-design-${Date.now()}.png`;

      onProgress?.({
        stage: "complete",
        progress: 100,
        message: "Screenshot captured successfully",
      });

      return {
        success: true,
        filename,
        blob,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      onProgress?.({
        stage: "error",
        progress: 0,
        message: `Screenshot capture failed: ${errorMessage}`,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Capture screenshot with custom camera position
   */
  async captureScreenshotWithCamera(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    cameraPosition: THREE.Vector3,
    cameraTarget: THREE.Vector3,
    options: ImageExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    // Create a temporary camera for the screenshot
    const camera = new THREE.PerspectiveCamera(
      75,
      options.resolution.width / options.resolution.height,
      0.1,
      1000
    );

    camera.position.copy(cameraPosition);
    camera.lookAt(cameraTarget);

    return this.captureScreenshot(renderer, scene, camera, options, onProgress);
  }

  /**
   * Capture multiple screenshots from different angles
   */
  async captureMultipleScreenshots(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    viewpoints: Array<{
      position: THREE.Vector3;
      target: THREE.Vector3;
      name: string;
    }>,
    options: Omit<ImageExportOptions, "filename">,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    const total = viewpoints.length;

    for (let i = 0; i < viewpoints.length; i++) {
      const viewpoint = viewpoints[i];

      onProgress?.({
        stage: "processing",
        progress: (i / total) * 100,
        message: `Capturing ${viewpoint.name} view (${i + 1}/${total})...`,
      });

      const screenshotOptions: ImageExportOptions = {
        ...options,
        filename: `${viewpoint.name}-${Date.now()}.png`,
      };

      const result = await this.captureScreenshotWithCamera(
        renderer,
        scene,
        viewpoint.position,
        viewpoint.target,
        screenshotOptions
      );

      results.push(result);
    }

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: `Captured ${results.length} screenshots`,
    });

    return results;
  }
}

/**
 * Predefined viewpoints for common architectural views
 */
export const ARCHITECTURAL_VIEWPOINTS = {
  FRONT: {
    position: new THREE.Vector3(0, 5, 15),
    target: new THREE.Vector3(0, 0, 0),
    name: "front-view",
  },
  BACK: {
    position: new THREE.Vector3(0, 5, -15),
    target: new THREE.Vector3(0, 0, 0),
    name: "back-view",
  },
  LEFT: {
    position: new THREE.Vector3(-15, 5, 0),
    target: new THREE.Vector3(0, 0, 0),
    name: "left-view",
  },
  RIGHT: {
    position: new THREE.Vector3(15, 5, 0),
    target: new THREE.Vector3(0, 0, 0),
    name: "right-view",
  },
  TOP: {
    position: new THREE.Vector3(0, 20, 0),
    target: new THREE.Vector3(0, 0, 0),
    name: "top-view",
  },
  ISOMETRIC: {
    position: new THREE.Vector3(10, 10, 10),
    target: new THREE.Vector3(0, 0, 0),
    name: "isometric-view",
  },
};

/**
 * Common resolution presets
 */
export const RESOLUTION_PRESETS = {
  HD: { width: 1280, height: 720 },
  FULL_HD: { width: 1920, height: 1080 },
  "4K": { width: 3840, height: 2160 },
  SQUARE_HD: { width: 1080, height: 1080 },
  SQUARE_4K: { width: 2160, height: 2160 },
  A4_PORTRAIT: { width: 2480, height: 3508 }, // 300 DPI A4
  A4_LANDSCAPE: { width: 3508, height: 2480 }, // 300 DPI A4
};

/**
 * Convenience function to capture screenshot
 */
export async function captureScreenshot(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: ImageExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const exporter = new ScreenshotExporter();
  return exporter.captureScreenshot(
    renderer,
    scene,
    camera,
    options,
    onProgress
  );
}

/**
 * Download screenshot file
 */
export function downloadScreenshot(result: ExportResult): void {
  if (!result.success || !result.blob || !result.filename) {
    throw new Error("Invalid screenshot result");
  }

  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
