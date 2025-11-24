/**
 * DoorTool Component - Interactive door placement tool
 * Implements requirements: 2.2
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "../stores/sceneStore";
import { useToolStore } from "../stores/toolStore";
import { Vector2, WallObject, Opening } from "../types/scene";
import { validateOpeningPosition, calculateOpeningPosition } from "../utils/openingGeometry";

interface DoorToolProps {
  isActive: boolean;
}

interface DoorPlacementState {
  hoveredWall: WallObject | null;
  previewOpening: Opening | null;
  wallPosition: number; // Position along wall (0-1)
}

export default function DoorTool({ isActive }: DoorToolProps) {
  const { camera, raycaster } = useThree();
  const { objects, addObject, updateObject } = useSceneStore();
  const toolSettings = useToolStore((state) => state.toolSettings.door);
  
  const [placementState, setPlacementState] = useState<DoorPlacementState>({
    hoveredWall: null,
    previewOpening: null,
    wallPosition: 0,
  });

  // Find the closest wall to the mouse position
  const findClosestWall = useCallback((event: MouseEvent): { wall: WallObject | null; position: number } => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    let closestWall: WallObject | null = null;
    let closestDistance = Infinity;
    let wallPosition = 0;

    // Check all walls in the scene
    Array.from(objects.values()).forEach((obj) => {
      if (obj.type === "wall") {
        const wall = obj as WallObject;
        
        // Calculate wall center and direction
        const wallCenter = new THREE.Vector3(
          (wall.startPoint.x + wall.endPoint.x) / 2,
          wall.height / 2,
          (wall.startPoint.y + wall.endPoint.y) / 2
        );

        const wallDirection = new THREE.Vector3(
          wall.endPoint.x - wall.startPoint.x,
          0,
          wall.endPoint.y - wall.startPoint.y
        ).normalize();

        // Create a plane for the wall
        const wallNormal = new THREE.Vector3(-wallDirection.z, 0, wallDirection.x);
        const wallPlane = new THREE.Plane(wallNormal, -wallNormal.dot(wallCenter));

        // Find intersection with wall plane
        const ray = raycaster.ray;
        const intersectionPoint = new THREE.Vector3();
        const intersects = ray.intersectPlane(wallPlane, intersectionPoint);

        if (intersects) {
          // Check if intersection is within wall bounds
          const wallStart = new THREE.Vector3(wall.startPoint.x, wall.height / 2, wall.startPoint.y);
          const wallEnd = new THREE.Vector3(wall.endPoint.x, wall.height / 2, wall.endPoint.y);
          
          // Project intersection point onto wall line
          const wallVector = wallEnd.clone().sub(wallStart);
          const pointVector = intersectionPoint.clone().sub(wallStart);
          const projection = pointVector.dot(wallVector) / wallVector.lengthSq();
          
          // Check if projection is within wall bounds
          if (projection >= 0 && projection <= 1) {
            const distance = ray.distanceToPoint(intersectionPoint);
            if (distance < closestDistance && distance < 10) { // Max distance threshold
              closestDistance = distance;
              closestWall = wall;
              wallPosition = projection;
            }
          }
        }
      }
    });

    return { wall: closestWall, position: wallPosition };
  }, [camera, raycaster, objects]);

  // Handle mouse move - update preview
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    const { wall, position } = findClosestWall(event);

    if (wall) {
      // Create preview opening
      const previewOpening: Opening = {
        id: `preview-door-${Date.now()}`,
        type: "door",
        position: position,
        width: toolSettings.defaultWidth,
        height: toolSettings.defaultHeight,
        properties: {},
      };

      // Validate opening position
      const validation = validateOpeningPosition(wall, previewOpening);

      setPlacementState({
        hoveredWall: wall,
        previewOpening: validation.isValid ? previewOpening : null,
        wallPosition: position,
      });
    } else {
      setPlacementState({
        hoveredWall: null,
        previewOpening: null,
        wallPosition: 0,
      });
    }
  }, [isActive, findClosestWall, toolSettings]);

  // Handle mouse click - place door
  const handleClick = useCallback((event: MouseEvent) => {
    if (!isActive || !placementState.hoveredWall || !placementState.previewOpening) return;

    const wall = placementState.hoveredWall;
    const opening = placementState.previewOpening;

    // Create actual door opening
    const doorOpening: Opening = {
      id: `door-${Date.now()}`,
      type: "door",
      position: opening.position,
      width: opening.width,
      height: opening.height,
      properties: {
        material: toolSettings.material,
        openDirection: "inward", // Default opening direction
      },
    };

    // Add opening to wall
    const updatedWall: WallObject = {
      ...wall,
      openings: [...wall.openings, doorOpening],
    };

    // Update wall in scene
    updateObject(wall.id, updatedWall);

    // Clear preview
    setPlacementState({
      hoveredWall: null,
      previewOpening: null,
      wallPosition: 0,
    });
  }, [isActive, placementState, toolSettings, updateObject]);

  // Set up event listeners
  React.useEffect(() => {
    if (!isActive) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    // Change cursor when tool is active
    canvas.style.cursor = placementState.hoveredWall ? 'pointer' : 'crosshair';

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.style.cursor = 'default';
    };
  }, [isActive, handleMouseMove, handleClick, placementState.hoveredWall]);

  // Render preview door if hovering over a wall
  const PreviewDoor = () => {
    if (!placementState.hoveredWall || !placementState.previewOpening) return null;

    const wall = placementState.hoveredWall;
    const opening = placementState.previewOpening;
    const position = calculateOpeningPosition(wall, opening);

    return (
      <group
        position={[position.x, position.y, position.z]}
      >
        {/* Preview door frame */}
        <mesh>
          <boxGeometry args={[opening.width + 0.1, opening.height + 0.05, wall.thickness + 0.02]} />
          <meshStandardMaterial
            color="#8B4513"
            transparent
            opacity={0.6}
          />
        </mesh>
        
        {/* Preview door panel */}
        <mesh position={[0, 0, -wall.thickness / 4]}>
          <boxGeometry args={[opening.width - 0.02, opening.height - 0.02, 0.04]} />
          <meshStandardMaterial
            color="#654321"
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Preview opening cutout indicator */}
        <mesh>
          <boxGeometry args={[opening.width, opening.height, wall.thickness + 0.01]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent
            opacity={0.2}
            wireframe
          />
        </mesh>
      </group>
    );
  };

  // Render wall highlight if hovering
  const WallHighlight = () => {
    if (!placementState.hoveredWall) return null;

    const wall = placementState.hoveredWall;
    const wallLength = Math.sqrt(
      Math.pow(wall.endPoint.x - wall.startPoint.x, 2) +
      Math.pow(wall.endPoint.y - wall.startPoint.y, 2)
    );

    const wallCenter = {
      x: (wall.startPoint.x + wall.endPoint.x) / 2,
      y: wall.height / 2,
      z: (wall.startPoint.y + wall.endPoint.y) / 2,
    };

    const wallAngle = Math.atan2(
      wall.endPoint.y - wall.startPoint.y,
      wall.endPoint.x - wall.startPoint.x
    );

    return (
      <group
        position={[wallCenter.x, wallCenter.y, wallCenter.z]}
        rotation={[0, wallAngle, 0]}
      >
        <mesh>
          <boxGeometry args={[wallLength * 1.02, wall.height * 1.02, wall.thickness * 1.02]} />
          <meshBasicMaterial
            color="#4f46e5"
            transparent
            opacity={0.1}
          />
        </mesh>
      </group>
    );
  };

  if (!isActive) return null;

  return (
    <>
      <WallHighlight />
      <PreviewDoor />
    </>
  );
}