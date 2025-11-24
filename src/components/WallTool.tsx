/**
 * WallTool Component - Interactive wall creation tool
 * Implements requirements: 1.3, 1.4, 2.1
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "../stores/sceneStore";
import { useToolStore } from "../stores/toolStore";
import { Vector2, WallObject } from "../types/scene";
import { snapToGrid, createWallFromPoints } from "../utils/wallGeometry";

interface WallToolProps {
  isActive: boolean;
}

interface WallDrawingState {
  isDrawing: boolean;
  startPoint: Vector2 | null;
  currentPoint: Vector2 | null;
  previewWall: WallObject | null;
}

export default function WallTool({ isActive }: WallToolProps) {
  const { camera, raycaster, scene } = useThree();
  const addObject = useSceneStore((state) => state.addObject);
  const toolSettings = useToolStore((state) => state.toolSettings.wall);
  
  const [drawingState, setDrawingState] = useState<WallDrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    previewWall: null,
  });

  const groundPlaneRef = useRef<THREE.Mesh>(null);

  // Create invisible ground plane for raycasting
  const groundPlane = (
    <mesh
      ref={groundPlaneRef}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <planeGeometry args={[1000, 1000]} />
      <meshBasicMaterial />
    </mesh>
  );

  // Convert screen coordinates to world coordinates on the ground plane
  const getWorldPosition = useCallback((event: MouseEvent): Vector2 | null => {
    if (!groundPlaneRef.current) return null;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundPlaneRef.current);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      let worldPoint = { x: point.x, y: point.z }; // Note: world Z maps to Vector2 Y

      // Apply grid snapping if enabled
      if (toolSettings.snapToGrid) {
        worldPoint = snapToGrid(worldPoint, toolSettings.gridSize);
      }

      return worldPoint;
    }

    return null;
  }, [camera, raycaster, toolSettings.snapToGrid, toolSettings.gridSize]);

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    const worldPos = getWorldPosition(event);
    if (!worldPos) return;

    setDrawingState({
      isDrawing: true,
      startPoint: worldPos,
      currentPoint: worldPos,
      previewWall: null,
    });
  }, [isActive, getWorldPosition]);

  // Handle mouse move - update preview
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isActive || !drawingState.isDrawing || !drawingState.startPoint) return;

    const worldPos = getWorldPosition(event);
    if (!worldPos) return;

    // Create preview wall
    const wallId = `preview-wall-${Date.now()}`;
    const previewWall: WallObject = {
      id: wallId,
      type: "wall",
      position: { x: 0, y: 0, z: 0 }, // Will be calculated by Wall3D
      rotation: { x: 0, y: 0, z: 0 }, // Will be calculated by Wall3D
      scale: { x: 1, y: 1, z: 1 },
      properties: {},
      material: {
        id: "preview-wall-material",
        name: "Preview Wall Material",
        color: "#94a3b8", // Gray color for preview
        roughness: 0.8,
        metalness: 0.1,
      },
      startPoint: drawingState.startPoint,
      endPoint: worldPos,
      height: toolSettings.defaultHeight,
      thickness: toolSettings.defaultThickness,
      openings: [],
    };

    setDrawingState(prev => ({
      ...prev,
      currentPoint: worldPos,
      previewWall,
    }));
  }, [isActive, drawingState.isDrawing, drawingState.startPoint, getWorldPosition, toolSettings]);

  // Handle mouse up - finish drawing
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!isActive || !drawingState.isDrawing || !drawingState.startPoint) return;

    const worldPos = getWorldPosition(event);
    if (!worldPos) return;

    // Only create wall if there's a meaningful distance
    const distance = Math.sqrt(
      Math.pow(worldPos.x - drawingState.startPoint.x, 2) +
      Math.pow(worldPos.y - drawingState.startPoint.y, 2)
    );

    if (distance > 0.1) { // Minimum wall length
      // Create actual wall object
      const wallId = `wall-${Date.now()}`;
      const newWall: WallObject = {
        id: wallId,
        type: "wall",
        position: { x: 0, y: 0, z: 0 }, // Will be calculated by Wall3D
        rotation: { x: 0, y: 0, z: 0 }, // Will be calculated by Wall3D
        scale: { x: 1, y: 1, z: 1 },
        properties: {},
        material: {
          id: "wall-material",
          name: "Wall Material",
          color: "#e2e8f0",
          roughness: 0.8,
          metalness: 0.1,
        },
        startPoint: drawingState.startPoint,
        endPoint: worldPos,
        height: toolSettings.defaultHeight,
        thickness: toolSettings.defaultThickness,
        openings: [],
      };

      // Add wall to scene
      addObject(newWall);
    }

    // Reset drawing state
    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
      previewWall: null,
    });
  }, [isActive, drawingState.isDrawing, drawingState.startPoint, getWorldPosition, toolSettings, addObject]);

  // Set up event listeners
  React.useEffect(() => {
    if (!isActive) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Change cursor when tool is active
    canvas.style.cursor = 'crosshair';

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.style.cursor = 'default';
    };
  }, [isActive, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Render preview wall if drawing
  const PreviewWall = () => {
    if (!drawingState.previewWall || !drawingState.isDrawing) return null;

    const geometryData = createWallFromPoints(
      drawingState.previewWall.startPoint,
      drawingState.previewWall.endPoint,
      drawingState.previewWall.height,
      drawingState.previewWall.thickness
    );

    return (
      <group
        position={[
          geometryData.position.x,
          geometryData.position.y,
          geometryData.position.z,
        ]}
        rotation={[
          geometryData.rotation.x,
          geometryData.rotation.y,
          geometryData.rotation.z,
        ]}
      >
        <mesh geometry={geometryData.geometry}>
          <meshStandardMaterial
            color={drawingState.previewWall.material.color}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    );
  };

  if (!isActive) return null;

  return (
    <>
      {groundPlane}
      <PreviewWall />
    </>
  );
}