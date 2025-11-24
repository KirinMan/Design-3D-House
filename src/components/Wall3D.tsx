/**
 * Wall3D Component - Renders 3D wall geometry from WallObject data
 * Implements requirements: 1.3, 2.1
 */

"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { WallObject } from "../types/scene";
import { calculateWallGeometry } from "../utils/wallGeometry";
import Door3D from "./Door3D";
import Window3D from "./Window3D";

interface Wall3DProps {
  wall: WallObject;
  isSelected?: boolean;
  onClick?: (event: any) => void;
  onPointerOver?: (event: any) => void;
  onPointerOut?: (event: any) => void;
}

export default function Wall3D({
  wall,
  isSelected = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: Wall3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Calculate wall geometry data
  const geometryData = useMemo(() => {
    return calculateWallGeometry(wall);
  }, [wall.startPoint, wall.endPoint, wall.height, wall.thickness]);

  // Create material based on wall material properties
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: wall.material.color,
      roughness: wall.material.roughness,
      metalness: wall.material.metalness,
      transparent: isSelected,
      opacity: isSelected ? 0.9 : 1,
    });
  }, [wall.material, isSelected]);

  // Create selection outline material
  const outlineMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: "#4f46e5",
      linewidth: 3,
    });
  }, []);

  // Create selection glow material
  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: "#4f46e5",
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
  }, []);

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
      {/* Main wall mesh */}
      <mesh
        ref={meshRef}
        geometry={geometryData.geometry}
        material={material}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        castShadow
        receiveShadow
        userData={{ wallId: wall.id, type: "wall" }}
      />

      {/* Selection highlight */}
      {isSelected && (
        <>
          {/* Wireframe outline */}
          <lineSegments>
            <edgesGeometry args={[geometryData.geometry]} />
            <primitive object={outlineMaterial} />
          </lineSegments>

          {/* Selection glow effect */}
          <mesh>
            <boxGeometry
              args={[
                geometryData.length * 1.02,
                wall.height * 1.02,
                wall.thickness * 1.02,
              ]}
            />
            <primitive object={glowMaterial} />
          </mesh>
        </>
      )}

      {/* Wall openings (doors and windows) */}
      {wall.openings.map((opening) => {
        const handleOpeningClick = (event: any) => {
          // Handle opening selection differently from wall selection
          event.stopPropagation();
          if (event.openingId && event.wallId) {
            // This will be handled by the parent component
            if (onClick) {
              onClick({
                ...event,
                isOpening: true,
              });
            }
          }
        };

        if (opening.type === "door") {
          return (
            <Door3D
              key={opening.id}
              opening={opening}
              wall={wall}
              isSelected={false} // Opening selection is handled separately
              onClick={handleOpeningClick}
              onPointerOver={onPointerOver}
              onPointerOut={onPointerOut}
            />
          );
        } else if (opening.type === "window") {
          return (
            <Window3D
              key={opening.id}
              opening={opening}
              wall={wall}
              isSelected={false} // Opening selection is handled separately
              onClick={handleOpeningClick}
              onPointerOver={onPointerOver}
              onPointerOut={onPointerOut}
            />
          );
        }
        return null;
      })}
    </group>
  );
}