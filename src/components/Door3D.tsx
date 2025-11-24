/**
 * Door3D Component - Renders 3D door geometry with frame and door panel
 * Implements requirements: 2.2
 */

"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Opening, WallObject } from "../types/scene";
import {
  createDoorGeometry,
  calculateOpeningPosition,
  calculateOpeningRotation,
} from "../utils/openingGeometry";

interface Door3DProps {
  opening: Opening;
  wall: WallObject;
  isSelected?: boolean;
  onClick?: (event: any) => void;
  onPointerOver?: (event: any) => void;
  onPointerOut?: (event: any) => void;
}

export default function Door3D({
  opening,
  wall,
  isSelected = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: Door3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate door geometry and positioning
  const geometryData = useMemo(() => {
    return createDoorGeometry(opening, wall.thickness);
  }, [opening.width, opening.height, wall.thickness]);

  const position = useMemo(() => {
    return calculateOpeningPosition(wall, opening);
  }, [wall, opening.position]);

  const rotation = useMemo(() => {
    return calculateOpeningRotation(wall);
  }, [wall.startPoint, wall.endPoint]);

  // Door frame material (using default door material)
  const frameMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#8B4513", // Brown wood color
      roughness: 0.6,
      metalness: 0.0,
    });
  }, []);

  // Door panel material (using default door material)
  const doorMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#8B4513", // Same as frame for consistency
      roughness: 0.6,
      metalness: 0.0,
    });
  }, []);

  // Door handle material
  const handleMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#696969", // Metal handle
      roughness: 0.3,
      metalness: 0.8,
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

  // Create door panel geometry (slightly smaller than opening)
  const doorPanelGeometry = useMemo(() => {
    const panelWidth = opening.width - 0.02; // 2cm smaller than opening
    const panelHeight = opening.height - 0.02;
    const panelThickness = 0.04; // 4cm thick door panel

    return new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness);
  }, [opening.width, opening.height]);

  // Create door handle geometry
  const handleGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8);
  }, []);

  // Handle door selection
  const handleDoorClick = (event: any) => {
    event.stopPropagation();
    if (onClick) {
      // Pass opening-specific data
      onClick({
        ...event,
        openingId: opening.id,
        wallId: wall.id,
        openingType: "door",
      });
    }
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onClick={handleDoorClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      userData={{ openingId: opening.id, wallId: wall.id, type: "door" }}
    >
      {/* Door frame */}
      <mesh
        geometry={geometryData.geometry}
        material={frameMaterial}
        castShadow
        receiveShadow
      />

      {/* Door panel */}
      <mesh
        position={[0, 0, -wall.thickness / 4]}
        geometry={doorPanelGeometry}
        material={doorMaterial}
        castShadow
        receiveShadow
      />

      {/* Door handle */}
      <mesh
        position={[opening.width / 2 - 0.1, 0, -wall.thickness / 4]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={handleGeometry}
        material={handleMaterial}
        castShadow
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
            color="#ff0000"
            transparent
            opacity={0.1}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}