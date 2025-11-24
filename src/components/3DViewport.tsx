/**
 * 3D Viewport Component - Main 3D rendering viewport using React Three Fiber
 * Implements requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 5.2
 */

"use client";

import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { useCameraStore } from "../stores/cameraStore";
import { useSceneStore } from "../stores/sceneStore";
import { useToolStore } from "../stores/toolStore";
import { useLightingStore } from "../stores/lightingStore";
import { SceneObject, WallObject } from "../types/scene";
import Wall3D from "./Wall3D";
import WallTool from "./WallTool";
import DoorTool from "./DoorTool";
import WindowTool from "./WindowTool";
import { Lighting } from "./Lighting";
import { ThreeDErrorBoundary } from "./ErrorBoundary";
import { withThreeJSErrorHandling } from "../utils/3dErrorHandling";
import { ErrorType } from "../types/errors";
import * as THREE from "three";

interface ViewportProps {
  className?: string;
  onRendererReady?: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void;
}

// Ground plane component
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
}

// Advanced lighting setup using the Lighting component
function SceneLighting() {
  return <Lighting />;
}

// Individual selectable object component
function SelectableObject({ object }: { object: SceneObject }) {
  const selectedObjects = useSceneStore((state) => state.selectedObjects);
  const selectObjects = useSceneStore((state) => state.selectObjects);
  const selectOpening = useSceneStore((state) => state.selectOpening);
  const isSelected = selectedObjects.includes(object.id);

  const handleClick = (event: any) => {
    event.stopPropagation();
    
    // Check if this is an opening click
    if (event.isOpening && event.openingId && event.wallId) {
      selectOpening({
        wallId: event.wallId,
        openingId: event.openingId,
        type: event.openingType,
      });
      return;
    }
    
    // Handle multi-selection with Ctrl/Cmd key
    if (event.nativeEvent.ctrlKey || event.nativeEvent.metaKey) {
      if (isSelected) {
        // Remove from selection
        selectObjects(selectedObjects.filter(id => id !== object.id));
      } else {
        // Add to selection
        selectObjects([...selectedObjects, object.id]);
      }
    } else {
      // Single selection
      selectObjects([object.id]);
    }
  };

  const handlePointerOver = (event: any) => {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (event: any) => {
    event.stopPropagation();
    document.body.style.cursor = 'default';
  };

  // Render wall objects using Wall3D component
  if (object.type === 'wall') {
    return (
      <Wall3D
        wall={object as WallObject}
        isSelected={isSelected}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    );
  }

  // Render other object types with generic box geometry
  return (
    <group
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
    >
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={object.material.color}
          transparent={isSelected}
          opacity={isSelected ? 0.9 : 1}
        />
      </mesh>
      
      {/* Selection highlight */}
      {isSelected && (
        <>
          {/* Wireframe outline */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
            <lineBasicMaterial color="#4f46e5" linewidth={3} />
          </lineSegments>
          
          {/* Selection glow effect */}
          <mesh>
            <boxGeometry args={[1.05, 1.05, 1.05]} />
            <meshBasicMaterial
              color="#4f46e5"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

// Scene objects renderer
function SceneObjects() {
  const objects = useSceneStore((state) => state.objects);
  const selectObjects = useSceneStore((state) => state.selectObjects);
  const activeTool = useToolStore((state) => state.activeTool);

  // Handle clicking on empty space to deselect all (only when not using wall tool)
  const handleBackgroundClick = () => {
    if (activeTool === "select") {
      selectObjects([]);
    }
  };

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
      
      {/* Render all scene objects */}
      {Array.from(objects.values()).map((object) => (
        <SelectableObject key={object.id} object={object} />
      ))}

      {/* Interactive tools */}
      <WallTool isActive={activeTool === "wall"} />
      <DoorTool isActive={activeTool === "door"} />
      <WindowTool isActive={activeTool === "window"} />
    </>
  );
}

// Camera controller that syncs with camera store
function CameraController() {
  const controlsRef = useRef<any>(null);
  const { position, target, setCamera } = useCameraStore();

  useEffect(() => {
    if (controlsRef.current) {
      // Set initial camera position and target
      controlsRef.current.object.position.set(position.x, position.y, position.z);
      controlsRef.current.target.set(target.x, target.y, target.z);
      controlsRef.current.update();
    }
  }, [position, target]);

  const handleCameraChange = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      const target = controlsRef.current.target;
      
      setCamera(
        { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        { x: target.x, y: target.y, z: target.z }
      );
    }
  };

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
    />
  );
}

// Component to initialize test objects for demonstration
function TestObjectsInitializer() {
  const addObject = useSceneStore((state) => state.addObject);
  const objects = useSceneStore((state) => state.objects);

  useEffect(() => {
    // Add test objects only if scene is empty
    if (objects.size === 0) {
      const testObjects: SceneObject[] = [
        {
          id: "test-wall-1",
          type: "wall",
          position: { x: 0, y: 0, z: 0 }, // Position will be calculated by Wall3D
          rotation: { x: 0, y: 0, z: 0 }, // Rotation will be calculated by Wall3D
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: "wall-material",
            name: "Wall Material",
            color: "#e2e8f0",
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: -2, y: 0 },
          endPoint: { x: 2, y: 0 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        } as WallObject,
        {
          id: "test-wall-2",
          type: "wall",
          position: { x: 0, y: 0, z: 0 }, // Position will be calculated by Wall3D
          rotation: { x: 0, y: 0, z: 0 }, // Rotation will be calculated by Wall3D
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: "wall-material-2",
            name: "Wall Material 2",
            color: "#f1f5f9",
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 2, y: 0 },
          endPoint: { x: 2, y: 3 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        } as WallObject,
        {
          id: "test-furniture-1",
          type: "furniture",
          position: { x: -2, y: 0.5, z: -2 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: "furniture-material",
            name: "Furniture Material",
            color: "#8b5cf6",
            roughness: 0.6,
            metalness: 0.2,
          },
        },
      ];

      testObjects.forEach(addObject);
    }
  }, [addObject, objects.size]);

  return null;
}

function Viewport3DContent({ className = "", onRendererReady }: ViewportProps) {
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
        }}
        onCreated={({ gl, scene, camera }) => {
          withThreeJSErrorHandling(
            () => {
              gl.shadowMap.enabled = settings.shadowsEnabled;
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
              
              // Call the onRendererReady callback if provided
              if (onRendererReady) {
                onRendererReady(gl, scene, camera);
              }
            },
            ErrorType.SCENE_LOAD_ERROR,
            "initialize WebGL renderer",
            "viewport-renderer"
          );
        }}
      >
        {/* Initialize test objects */}
        <TestObjectsInitializer />
        
        {/* Camera controls */}
        <CameraController />
        
        {/* Lighting */}
        <SceneLighting />
        
        {/* Environment */}
        <Environment preset="city" background={false} />
        
        {/* Ground plane */}
        <GroundPlane />
        
        {/* Grid helper for visual reference */}
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
        
        {/* Scene objects */}
        <SceneObjects />
      </Canvas>
    </div>
  );
}

export default function Viewport3D(props: ViewportProps) {
  return (
    <ThreeDErrorBoundary>
      <Viewport3DContent {...props} />
    </ThreeDErrorBoundary>
  );
}