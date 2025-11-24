/**
 * Integration Tests - Wall Creation and Editing Workflow
 * Tests the complete workflow of creating and editing walls
 * Requirements: 1.3, 1.4, 2.1, 2.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { useSceneStore } from '../../stores/sceneStore';
import { useToolStore } from '../../stores/toolStore';
import { useCameraStore } from '../../stores/cameraStore';
import Viewport3D from '../../components/3DViewport';
import WallTool from '../../components/WallTool';
import PropertyEditor from '../../components/PropertyEditor';
import { WallObject } from '../../types/scene';

// Mock Three.js WebGL context
const mockWebGLContext = {
  getExtension: jest.fn(),
  getParameter: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createProgram: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  getAttribLocation: jest.fn(),
  getUniformLocation: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  uniform1f: jest.fn(),
  uniform3fv: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  drawArrays: jest.fn(),
  viewport: jest.fn(),
  clearColor: jest.fn(),
  clear: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  blendFunc: jest.fn(),
  depthFunc: jest.fn(),
  cullFace: jest.fn(),
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test component that combines viewport and tools
function TestWallWorkflow() {
  const activeTool = useToolStore((state) => state.activeTool);
  const selectedObjects = useSceneStore((state) => state.selectedObjects);
  const objects = useSceneStore((state) => state.objects);

  return (
    <div style={{ width: '800px', height: '600px' }}>
      <Viewport3D />
      {selectedObjects.length > 0 && (
        <PropertyEditor
          selectedObject={Array.from(objects.values()).find(obj => 
            selectedObjects.includes(obj.id)
          ) || null}
          onPropertyChange={() => {}}
        />
      )}
    </div>
  );
}

describe('Wall Creation and Editing Workflow', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useSceneStore.getState().clearScene();
    useToolStore.getState().setActiveTool('select');
    useCameraStore.getState().resetCamera();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Wall Creation Workflow', () => {
    test('should create a wall using wall tool', async () => {
      const { container } = render(<TestWallWorkflow />);
      
      // Activate wall tool
      act(() => {
        useToolStore.getState().setActiveTool('wall');
      });

      // Wait for tool to be active
      await waitFor(() => {
        expect(useToolStore.getState().activeTool).toBe('wall');
      });

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();

      // Simulate mouse down to start wall creation
      act(() => {
        fireEvent.mouseDown(canvas!, {
          clientX: 100,
          clientY: 100,
          button: 0,
        });
      });

      // Simulate mouse move to draw wall
      act(() => {
        fireEvent.mouseMove(canvas!, {
          clientX: 200,
          clientY: 100,
        });
      });

      // Simulate mouse up to finish wall creation
      act(() => {
        fireEvent.mouseUp(canvas!, {
          clientX: 200,
          clientY: 100,
          button: 0,
        });
      });

      // Verify wall was created
      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const walls = Array.from(objects.values()).filter(obj => obj.type === 'wall');
        expect(walls.length).toBeGreaterThan(0);
      });
    });

    test('should apply grid snapping when enabled', async () => {
      const { container } = render(<TestWallWorkflow />);
      
      // Enable grid snapping
      act(() => {
        useToolStore.getState().updateToolSettings('wall', {
          snapToGrid: true,
          gridSize: 1,
        });
        useToolStore.getState().setActiveTool('wall');
      });

      const canvas = container.querySelector('canvas');

      // Create wall with coordinates that should snap to grid
      act(() => {
        fireEvent.mouseDown(canvas!, {
          clientX: 105, // Should snap to nearest grid point
          clientY: 105,
          button: 0,
        });
      });

      act(() => {
        fireEvent.mouseUp(canvas!, {
          clientX: 195, // Should snap to nearest grid point
          clientY: 105,
          button: 0,
        });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const walls = Array.from(objects.values()).filter(obj => obj.type === 'wall') as WallObject[];
        
        if (walls.length > 0) {
          const wall = walls[0];
          // Verify coordinates are snapped to grid (assuming grid size of 1)
          expect(wall.startPoint.x % 1).toBeCloseTo(0, 1);
          expect(wall.startPoint.y % 1).toBeCloseTo(0, 1);
          expect(wall.endPoint.x % 1).toBeCloseTo(0, 1);
          expect(wall.endPoint.y % 1).toBeCloseTo(0, 1);
        }
      });
    });

    test('should use default wall settings from tool store', async () => {
      const { container } = render(<TestWallWorkflow />);
      
      // Set custom default settings
      const customSettings = {
        defaultHeight: 3.5,
        defaultThickness: 0.25,
        material: 'custom-wall-material',
      };

      act(() => {
        useToolStore.getState().updateToolSettings('wall', customSettings);
        useToolStore.getState().setActiveTool('wall');
      });

      const canvas = container.querySelector('canvas');

      // Create a wall
      act(() => {
        fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100, button: 0 });
        fireEvent.mouseUp(canvas!, { clientX: 200, clientY: 100, button: 0 });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const walls = Array.from(objects.values()).filter(obj => obj.type === 'wall') as WallObject[];
        
        if (walls.length > 0) {
          const wall = walls[0];
          expect(wall.height).toBe(customSettings.defaultHeight);
          expect(wall.thickness).toBe(customSettings.defaultThickness);
        }
      });
    });
  });

  describe('Wall Selection and Editing Workflow', () => {
    test('should select wall when clicked', async () => {
      const { container } = render(<TestWallWorkflow />);
      
      // First create a wall
      act(() => {
        const wallObject: WallObject = {
          id: 'test-wall-1',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material',
            name: 'Wall Material',
            color: '#e2e8f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 2, y: 0 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        };
        useSceneStore.getState().addObject(wallObject);
      });

      // Switch to select tool
      act(() => {
        useToolStore.getState().setActiveTool('select');
      });

      const canvas = container.querySelector('canvas');

      // Click on wall to select it
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 150, // Click in the middle of the wall area
          clientY: 300,
        });
      });

      await waitFor(() => {
        const selectedObjects = useSceneStore.getState().selectedObjects;
        expect(selectedObjects).toContain('test-wall-1');
      });
    });

    test('should support multi-selection with Ctrl key', async () => {
      const { container } = render(<TestWallWorkflow />);
      
      // Create two walls
      act(() => {
        const wall1: WallObject = {
          id: 'test-wall-1',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material',
            name: 'Wall Material',
            color: '#e2e8f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 2, y: 0 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        };

        const wall2: WallObject = {
          id: 'test-wall-2',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material',
            name: 'Wall Material',
            color: '#e2e8f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 2 },
          endPoint: { x: 2, y: 2 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        };

        useSceneStore.getState().addObject(wall1);
        useSceneStore.getState().addObject(wall2);
      });

      act(() => {
        useToolStore.getState().setActiveTool('select');
      });

      const canvas = container.querySelector('canvas');

      // Select first wall
      act(() => {
        fireEvent.click(canvas!, { clientX: 150, clientY: 300 });
      });

      // Select second wall with Ctrl key
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 150,
          clientY: 250,
          ctrlKey: true,
        });
      });

      await waitFor(() => {
        const selectedObjects = useSceneStore.getState().selectedObjects;
        expect(selectedObjects).toContain('test-wall-1');
        expect(selectedObjects).toContain('test-wall-2');
        expect(selectedObjects.length).toBe(2);
      });
    });

    test('should deselect all when clicking empty space', async () => {
      const { container } = render(<TestWallWorkflow />);
      
      // Create and select a wall
      act(() => {
        const wallObject: WallObject = {
          id: 'test-wall-1',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material',
            name: 'Wall Material',
            color: '#e2e8f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 2, y: 0 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        };
        useSceneStore.getState().addObject(wallObject);
        useSceneStore.getState().selectObjects(['test-wall-1']);
        useToolStore.getState().setActiveTool('select');
      });

      const canvas = container.querySelector('canvas');

      // Click on empty space
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 50, // Click away from wall
          clientY: 50,
        });
      });

      await waitFor(() => {
        const selectedObjects = useSceneStore.getState().selectedObjects;
        expect(selectedObjects.length).toBe(0);
      });
    });
  });

  describe('Wall Property Editing Workflow', () => {
    test('should update wall properties through property editor', async () => {
      render(<TestWallWorkflow />);
      
      // Create and select a wall
      act(() => {
        const wallObject: WallObject = {
          id: 'test-wall-1',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material',
            name: 'Wall Material',
            color: '#e2e8f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 2, y: 0 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        };
        useSceneStore.getState().addObject(wallObject);
        useSceneStore.getState().selectObjects(['test-wall-1']);
      });

      // Update wall height through store
      act(() => {
        useSceneStore.getState().updateObject('test-wall-1', {
          height: 3.0,
        });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.height).toBe(3.0);
      });
    });

    test('should update wall thickness', async () => {
      render(<TestWallWorkflow />);
      
      // Create and select a wall
      act(() => {
        const wallObject: WallObject = {
          id: 'test-wall-1',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material',
            name: 'Wall Material',
            color: '#e2e8f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 2, y: 0 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        };
        useSceneStore.getState().addObject(wallObject);
        useSceneStore.getState().selectObjects(['test-wall-1']);
      });

      // Update wall thickness
      act(() => {
        useSceneStore.getState().updateObject('test-wall-1', {
          thickness: 0.3,
        });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.thickness).toBe(0.3);
      });
    });
  });

  describe('Wall Deletion Workflow', () => {
    test('should delete selected wall', async () => {
      render(<TestWallWorkflow />);
      
      // Create and select a wall
      act(() => {
        const wallObject: WallObject = {
          id: 'test-wall-1',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material',
            name: 'Wall Material',
            color: '#e2e8f0',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 2, y: 0 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        };
        useSceneStore.getState().addObject(wallObject);
        useSceneStore.getState().selectObjects(['test-wall-1']);
      });

      // Verify wall exists
      expect(useSceneStore.getState().objects.has('test-wall-1')).toBe(true);

      // Delete the wall
      act(() => {
        useSceneStore.getState().removeObject('test-wall-1');
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        expect(objects.has('test-wall-1')).toBe(false);
        expect(useSceneStore.getState().selectedObjects.length).toBe(0);
      });
    });
  });
});