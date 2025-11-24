/**
 * Performance Optimized Viewport - Integrates all performance optimizations
 * Combines object pooling, LOD, culling, and material optimization
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2
 */

"use client";

import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import * as THREE from "three";

// Store imports
import { useCameraStore } from "../stores/cameraStore";
import { useSceneStore } from "../stores/sceneStore";
import { useToolStore } from "../stores/toolStore";
import { useLightingStore } from "../stores/lightingStore";

// Performance optimization imports
import { PoolManager, meshPool, standardMaterialPool, wallGeometryPool } from "../utils/objectPool";
import { lodManager, LODObject } from "../utils/lodSystem";
import { cullingManager, ViewportCullingManager } from "../utils/viewportCulling";
import { textureManager, materialManager } from "../utils/materialOptimization";
import { performanceMonitor } from "../utils/performanceMonitor";

// Component imports
import { SceneObject, WallObject } from "../types/scene";
import Wall3D from "./Wall3D";
import WallTool from "./WallTool";
import DoorTool from "./DoorTool";
import WindowTool from "./WindowTool";
import { Lighting } from "./Lighting";
import { ThreeDErrorBoundary } from "./ErrorBoundary";

interface PerformanceOptimizedViewportProps {
  className?: string;
  enableLOD?: boolean;
  enableCulling?: boolean;
  enableObjectPooling?: boolean;
  enableMaterialOptimization?: boolean;
  enablePerformanceMonitoring?: boolean;
  onPerformanceUpdate?: (metrics: any) => void;
}

// Performance-optimized ground plane component
function OptimizedGroundPlane() {
  const mesh = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = materialManager.getMaterial({
      color: '#f0f0f0',
      roughness: 0.8,
      metalness: 0.1,
    });
    
    const groundMesh = new THREE.Mesh(geometry, material);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.01;
    groundMesh.receiveShadow = true;
    
    return groundMesh;
  }, []);

  return <primitive object={mesh} />;
}

// Performance-optimized scene objects renderer
function OptimizedSceneObjects({ 
  enableLOD, 
  enableCulling, 
  enableObjectPooling 
}: {
  enableLOD: boolean;
  enableCulling: boolean;
  enableObjectPooling: boolean;
}) {
  const { scene, camera } = useThree();
  const objects = useSceneStore((state) => state.objects);
  const selectObjects = useSceneStore((state) => state.selectObjects);
  const activeTool = useToolStore((state) => state.activeTool);
  
  const lodObjectsRef = useRef<Map<string, LODObject>>(new Map());
  const pooledObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Initialize performance systems
  useEffect(() => {
    if (enableLOD) {
      lodManager.setCamera(camera);
    }
    
    if (enableCulling) {
      cullingManager.setCamera(camera);
    }
  }, [camera, enableLOD, enableCulling]);

  // Update objects when scene changes
  useEffect(() => {
    const currentObjects = Array.from(objects.values());
    
    // Remove objects that no longer exist
    lodObjectsRef.current.forEach((lodObject, id) => {
      if (!objects.has(id)) {
        if (enableLOD) {
          lodManager.removeObject(id, scene);
        }
        scene.remove(lodObject);
        lodObject.dispose();
        lodObjectsRef.current.delete(id);
      }
    });

    pooledObjectsRef.current.forEach((mesh, id) => {
      if (!objects.has(id)) {
        scene.remove(mesh);
        if (enableObjectPooling) {
          meshPool.release(mesh);
        }
        pooledObjectsRef.current.delete(id);
      }
    });

    // Add or update existing objects
    currentObjects.forEach((sceneObject) => {
      if (enableLOD && !lodObjectsRef.current.has(sceneObject.id)) {
        const lodObject = lodManager.addObject(sceneObject, scene);
        lodObjectsRef.current.set(sceneObject.id, lodObject);
      } else if (!enableLOD && !pooledObjectsRef.current.has(sceneObject.id)) {
        const mesh = createOptimizedMesh(sceneObject, enableObjectPooling);
        if (mesh) {
          scene.add(mesh);
          pooledObjectsRef.current.set(sceneObject.id, mesh);
        }
      }
    });
  }, [objects, scene, enableLOD, enableObjectPooling]);

  // Performance update loop
  useFrame((state, delta) => {
    if (enableLOD) {
      lodManager.update(delta * 1000); // Convert to milliseconds
    }
    
    if (enableCulling) {
      cullingManager.cullScene(scene);
    }
  });

  // Handle background click for deselection
  const handleBackgroundClick = useCallback(() => {
    if (activeTool === "select") {
      selectObjects([]);
    }
  }, [activeTool, selectObjects]);

  // Create optimized mesh using object pooling
  const createOptimizedMesh = useCallback((sceneObject: SceneObject, usePooling: boolean): THREE.Mesh | null => {
    let mesh: THREE.Mesh;
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    if (usePooling) {
      mesh = meshPool.acquire();
      
      // Create geometry based on object type
      if (sceneObject.type === 'wall') {
        const wall = sceneObject as WallObject;
        const length = Math.sqrt(
          Math.pow(wall.endPoint.x - wall.startPoint.x, 2) +
          Math.pow(wall.endPoint.y - wall.startPoint.y, 2)
        );
        geometry = wallGeometryPool.acquire(length, wall.height, wall.thickness);
      } else {
        geometry = new THREE.BoxGeometry(1, 1, 1);
      }

      material = materialManager.getMaterial({
        color: sceneObject.material.color,
        roughness: sceneObject.material.roughness,
        metalness: sceneObject.material.metalness,
      });
    } else {
      // Create without pooling
      geometry = new THREE.BoxGeometry(1, 1, 1);
      material = new THREE.MeshStandardMaterial({
        color: sceneObject.material.color,
        roughness: sceneObject.material.roughness,
        metalness: sceneObject.material.metalness,
      });
      mesh = new THREE.Mesh(geometry, material);
    }

    // Set mesh properties
    mesh.position.set(
      sceneObject.position.x,
      sceneObject.position.y,
      sceneObject.position.z
    );
    mesh.rotation.set(
      sceneObject.rotation.x,
      sceneObject.rotation.y,
      sceneObject.rotation.z
    );
    mesh.scale.set(
      sceneObject.scale.x,
      sceneObject.scale.y,
      sceneObject.scale.z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { sceneObjectId: sceneObject.id };

    return mesh;
  }, []);

  return (
    <>
      {/* Invisible background plane for deselection */}
      <mesh
        position={[0, -0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleBackgroundClick}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial />
      </mesh>

      {/* Interactive tools */}
      <WallTool isActive={activeTool === "wall"} />
      <DoorTool isActive={activeTool === "door"} />
      <WindowTool isActive={activeTool === "window"} />
    </>
  );
}

// Camera controller with performance optimizations
function OptimizedCameraController() {
  const controlsRef = useRef<any>(null);
  const { position, target, setCamera } = useCameraStore();
  const lastUpdateTime = useRef<number>(0);
  const updateThrottle = 16; // ~60fps

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(position.x, position.y, position.z);
      controlsRef.current.target.set(target.x, target.y, target.z);
      controlsRef.current.update();
    }
  }, [position, target]);

  const handleCameraChange = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateTime.current < updateThrottle) {
      return;
    }
    lastUpdateTime.current = now;

    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      const target = controlsRef.current.target;
      
      setCamera(
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        { x: target.x, y: target.y, z: target.z }
      );
    }
  }, [setCamera]);

  return (
    <OrbitControls
      ref={controlsRef}
      onChange={handleCameraChange}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={100}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      enableDamping={true}
      dampingFactor={0.05}
    />
  );
}

// Performance monitoring component
function PerformanceMonitoringComponent({ 
  onPerformanceUpdate 
}: { 
  onPerformanceUpdate?: (metrics: any) => void 
}) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    performanceMonitor.initialize(gl, scene, camera);
    performanceMonitor.startMonitoring();

    const interval = setInterval(() => {
      const metrics = performanceMonitor.getCurrentMetrics();
      onPerformanceUpdate?.(metrics);
    }, 1000);

    return () => {
      clearInterval(interval);
      performanceMonitor.stopMonitoring();
    };
  }, [gl, scene, camera, onPerformanceUpdate]);

  return null;
}

// Main viewport content component
function OptimizedViewportContent({
  className = "",
  enableLOD = true,
  enableCulling = true,
  enableObjectPooling = true,
  enableMaterialOptimization = true,
  enablePerformanceMonitoring = false,
  onPerformanceUpdate,
}: PerformanceOptimizedViewportProps) {
  const { settings } = useLightingStore();

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows={settings.shadowsEnabled}
        camera={{
          position: [10, 10, 10],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        onCreated={({ gl, scene, camera }) => {
          // Configure renderer for performance
          gl.shadowMap.enabled = settings.shadowsEnabled;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.outputEncoding = THREE.sRGBEncoding;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;

          // Initialize performance systems
          if (enableCulling) {
            cullingManager.setCamera(camera);
            cullingManager.setRenderer(gl);
          }

          if (enableLOD) {
            lodManager.setCamera(camera);
          }

          if (enablePerformanceMonitoring) {
            performanceMonitor.initialize(gl, scene, camera);
          }
        }}
      >
        {/* Performance monitoring */}
        {enablePerformanceMonitoring && (
          <PerformanceMonitoringComponent onPerformanceUpdate={onPerformanceUpdate} />
        )}

        {/* Camera controls */}
        <OptimizedCameraController />
        
        {/* Lighting */}
        <Lighting />
        
        {/* Environment */}
        <Environment preset="city" background={false} />
        
        {/* Ground plane */}
        <OptimizedGroundPlane />
        
        {/* Grid helper */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#cccccc"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#999999"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />
        
        {/* Optimized scene objects */}
        <OptimizedSceneObjects
          enableLOD={enableLOD}
          enableCulling={enableCulling}
          enableObjectPooling={enableObjectPooling}
        />
      </Canvas>
    </div>
  );
}

// Main component with error boundary
export default function PerformanceOptimizedViewport(props: PerformanceOptimizedViewportProps) {
  return (
    <ThreeDErrorBoundary>
      <OptimizedViewportContent {...props} />
    </ThreeDErrorBoundary>
  );
}