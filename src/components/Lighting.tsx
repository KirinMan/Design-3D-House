/**
 * Lighting Component - Manages 3D scene lighting
 * Implements requirements: 5.2, 5.4
 */

"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useLightingStore } from "../stores/lightingStore";

export const Lighting: React.FC = () => {
  const { settings } = useLightingStore();
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);

  // Calculate sun position from azimuth and elevation
  const sunPosition = React.useMemo(() => {
    const { azimuth, elevation } = settings.sunPosition;
    const azimuthRad = (azimuth * Math.PI) / 180;
    const elevationRad = (elevation * Math.PI) / 180;
    
    const distance = 100; // Distance from origin
    const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
    const y = distance * Math.sin(elevationRad);
    const z = distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
    
    return new THREE.Vector3(x, y, z);
  }, [settings.sunPosition]);

  // Update lighting when settings change
  useEffect(() => {
    if (directionalLightRef.current) {
      const light = directionalLightRef.current;
      
      // Update intensity
      light.intensity = settings.directionalIntensity;
      
      // Update position
      light.position.copy(sunPosition);
      light.target.position.set(0, 0, 0);
      
      // Update shadows
      light.castShadow = settings.shadowsEnabled;
      if (light.shadow) {
        light.shadow.mapSize.width = settings.shadowMapSize;
        light.shadow.mapSize.height = settings.shadowMapSize;
        
        // Configure shadow camera for better coverage
        const shadowCamera = light.shadow.camera as THREE.OrthographicCamera;
        shadowCamera.left = -50;
        shadowCamera.right = 50;
        shadowCamera.top = 50;
        shadowCamera.bottom = -50;
        shadowCamera.near = 0.1;
        shadowCamera.far = 200;
        shadowCamera.updateProjectionMatrix();
        
        // Improve shadow quality
        light.shadow.bias = -0.0001;
        light.shadow.normalBias = 0.02;
      }
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = settings.ambientIntensity;
    }
  }, [settings, sunPosition]);

  // Calculate light color based on time of day
  const lightColor = React.useMemo(() => {
    const { timeOfDay } = settings;
    
    if (timeOfDay < 6 || timeOfDay > 18) {
      // Night - cool blue
      return new THREE.Color(0x404080);
    } else if (timeOfDay < 8 || timeOfDay > 16) {
      // Dawn/dusk - warm orange
      return new THREE.Color(0xffa500);
    } else {
      // Day - neutral white
      return new THREE.Color(0xffffff);
    }
  }, [settings.timeOfDay]);

  // Animate light changes smoothly
  useFrame((state, delta) => {
    if (directionalLightRef.current) {
      // Smooth color transitions
      directionalLightRef.current.color.lerp(lightColor, delta * 2);
    }
  });

  return (
    <>
      {/* Ambient light for general illumination */}
      <ambientLight
        ref={ambientLightRef}
        intensity={settings.ambientIntensity}
        color={0x404040}
      />

      {/* Main directional light (sun) */}
      <directionalLight
        ref={directionalLightRef}
        position={sunPosition}
        intensity={settings.directionalIntensity}
        color={lightColor}
        castShadow={settings.shadowsEnabled}
        shadow-mapSize-width={settings.shadowMapSize}
        shadow-mapSize-height={settings.shadowMapSize}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.1}
        shadow-camera-far={200}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      {/* Additional fill lights for studio mode */}
      {settings.mode === "studio" && (
        <>
          {/* Key light */}
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.6}
            color={0xffffff}
          />
          
          {/* Fill light */}
          <directionalLight
            position={[-10, 5, 5]}
            intensity={0.3}
            color={0xffffff}
          />
          
          {/* Rim light */}
          <directionalLight
            position={[0, 5, -10]}
            intensity={0.2}
            color={0xffffff}
          />
        </>
      )}

      {/* Ground reflection light for outdoor mode */}
      {settings.mode === "outdoor" && (
        <directionalLight
          position={[0, -5, 0]}
          intensity={0.1}
          color={0x87ceeb}
        />
      )}

      {/* Helper for visualizing directional light (development only) */}
      {process.env.NODE_ENV === "development" && (
        <primitive object={new THREE.DirectionalLightHelper(directionalLightRef.current!, 5)} />
      )}
    </>
  );
};