/**
 * Window3D Component - Renders 3D window geometry with frame and glass
 * Implements requirements: 2.3
 */

"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Opening, WallObject } from "../types/scene";
import {
  createWindowGeometry,
  calculateOpeningPosition,
  calculateOpeningRotation,
} from "../utils/openingGeometry";

interface Window3DProps {
  opening: Opening;
  wall: WallObject;
  isSelected?: boolean;
  onClick?: (event: any) => void;
  onPointerOver?: (event: any) => void;
  onPointerOut?: (event: any) => void;
}

export default function Window3D({
  opening,
  wall,
  isSelected = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: Window3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate window geometry and positioning
  const geometryData = useMemo(() => {
    return createWindowGeometry(opening, wall.thickness);
  }, [opening.width, opening.height, wall.thickness]);

  const position = useMemo(() => {
    return calculateOpeningPosition(wall, opening);
  }, [wall, opening.position]);

  const rotation = useMemo(() => {
    return calculateOpeningRotation(wall);
  }, [wall.startPoint, wall.endPoint]);

  // Window frame material (using default window frame material)
  const frameMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#FFFFFF", // White window frame
      roughness: 0.4,
      metalness: 0.1,
    });
  }, []);

  // Glass material
  const glassMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: "#E6F3FF", // Light blue tint
      transparent: true,
      opacity: 0.3,
      transmission: 0.9,
      roughness: 0.0,
      metalness: 0.0,
      ior: 1.5, // Index of refraction for glass
      thickness: 0.005,
    });
  }, []);

  // Window sill material
  const sillMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#F5F5F5", // Light gray sill
      roughness: 0.7,
      metalness: 0.1,
    });
  }, []);

  // Selection highlight material
  const highlightMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: "#4f46e5",
      transparent: true,
      opacity: 0.3,
    });
  }, []);

  // Create glass pane geometry
  const glassGeometry = useMemo(() => {
    const glassWidth = opening.width - 0.04; // 4cm smaller than opening for frame
    const glassHeight = opening.height - 0.04;
    const glassThickness = 0.005; // 5mm thick glass

    return new THREE.BoxGeometry(glassWidth, glassHeight, glassThickness);
  }, [opening.width, opening.height]);

  // Create window sill geometry
  const sillGeometry = useMemo(() => {
    const sillWidth = opening.width + 0.1; // Extends beyond frame
    const sillHeight = 0.05; // 5cm high sill
    const sillDepth = 0.15; // 15cm deep sill

    return new THREE.BoxGeometry(sillWidth, sillHeight, sillDepth);
  }, [opening.width]);

  // Create window divider geometry (cross pattern)
  const dividerGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.02, opening.height - 0.04, 0.01);
  }, [opening.height]);

  const horizontalDividerGeometry = useMemo(() => {
    return new THREE.BoxGeometry(opening.width - 0.04, 0.02, 0.01);
  }, [opening.width]);

  // Handle window selection
  const handleWindowClick = (event: any) => {
    event.stopPropagation();
    if (onClick) {
      // Pass opening-specific data
      onClick({
        ...event,
        openingId: opening.id,
        wallId: wall.id,
        openingType: "window",
      });
    }
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={handleWindowClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      userData={{ openingId: opening.id, wallId: wall.id, type: "window" }}
    >
      {/* Window frame */}
      <mesh
        geometry={geometryData.geometry}
        material={frameMaterial}
        castShadow
        receiveShadow
      />

      {/* Glass pane */}
      <mesh
        position={[0, 0, 0]}
        geometry={glassGeometry}
        material={glassMaterial}
        receiveShadow
      />

      {/* Window dividers (cross pattern) */}
      <mesh
        position={[0, 0, 0.003]}
        geometry={dividerGeometry}
        material={frameMaterial}
        castShadow
      />
      <mesh
        position={[0, 0, 0.003]}
        geometry={horizontalDividerGeometry}
        material={frameMaterial}
        castShadow
      />

      {/* Window sill */}
      <mesh
        position={[0, -opening.height / 2 - 0.025, wall.thickness / 2 + 0.075]}
        geometry={sillGeometry}
        material={sillMaterial}
        castShadow
        receiveShadow
      />

      {/* Selection highlight */}
      {isSelected && (
        <mesh
          geometry={geometryData.geometry}
          material={highlightMaterial}
          scale={[1.05, 1.05, 1.05]}
        />
      )}

      {/* Opening cutout indicator (for debugging) */}
      {process.env.NODE_ENV === "development" && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry
            args={[opening.width, opening.height, wall.thickness + 0.02]}
          />
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}