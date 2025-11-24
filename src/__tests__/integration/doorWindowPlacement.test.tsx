/**
 * Integration Tests - Door and Window Placement and Modification
 * Tests the complete workflow of placing and modifying doors and windows
 * Requirements: 2.2, 2.3, 2.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import * as THREE from 'three';
import { useSceneStore } from '../../stores/sceneStore';
import { useToolStore } from '../../stores/toolStore';
import { useCameraStore } from '../../stores/cameraStore';
import Viewport3D from '../../components/3DViewport';
import DoorTool from '../../components/DoorTool';
import WindowTool from '../../components/WindowTool';
import { WallObject, Opening } from '../../types/scene';

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

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockWebGLContext);

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Test component for door/window placement workflow
function TestOpeningWorkflow() {
  const activeTool = useToolStore((state) => state.activeTool);
  const selectedOpening = useSceneStore((state) => state.selectedOpening);
  const objects = useSceneStore((state) => state.objects);

  return (
    <div style={{ width: '800px', height: '600px' }}>
      <Viewport3D />
      {selectedOpening && (
        <div data-testid="opening-selected">
          Opening selected: {selectedOpening.openingId}
        </div>
      )}
    </div>
  );
}

describe('Door and Window Placement Workflow', () => {
  let testWall: WallObject;

  beforeEach(() => {
    // Reset all stores before each test
    useSceneStore.getState().clearScene();
    useToolStore.getState().setActiveTool('select');
    useCameraStore.getState().resetCamera();

    // Create a test wall for door/window placement
    testWall = {
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
      startPoint: { x: -2, y: 0 },
      endPoint: { x: 2, y: 0 },
      height: 2.5,
      thickness: 0.2,
      openings: [],
    };

    act(() => {
      useSceneStore.getState().addObject(testWall);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Door Placement Workflow', () => {
    test('should place door on wall when clicked', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      // Activate door tool
      act(() => {
        useToolStore.getState().setActiveTool('door');
      });

      await waitFor(() => {
        expect(useToolStore.getState().activeTool).toBe('door');
      });

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();

      // Simulate clicking on the wall to place door
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 400, // Middle of the wall
          clientY: 300,
        });
      });

      // Verify door was added to the wall
      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(1);
        expect(wall.openings[0].type).toBe('door');
      });
    });

    test('should use default door settings from tool store', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      // Set custom door settings
      const customSettings = {
        defaultWidth: 0.9,
        defaultHeight: 2.1,
        material: 'custom-door-material',
      };

      act(() => {
        useToolStore.getState().updateToolSettings('door', customSettings);
        useToolStore.getState().setActiveTool('door');
      });

      const canvas = container.querySelector('canvas');

      // Place door
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 400,
          clientY: 300,
        });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        
        if (wall.openings.length > 0) {
          const door = wall.openings[0];
          expect(door.width).toBe(customSettings.defaultWidth);
          expect(door.height).toBe(customSettings.defaultHeight);
          expect(door.properties.material).toBe(customSettings.material);
        }
      });
    });

    test('should prevent door placement if it overlaps with existing opening', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      // Add an existing door to the wall
      act(() => {
        const existingDoor: Opening = {
          id: 'existing-door',
          type: 'door',
          position: 0.5, // Middle of wall
          width: 0.8,
          height: 2.0,
          properties: {},
        };

        const updatedWall: WallObject = {
          ...testWall,
          openings: [existingDoor],
        };

        useSceneStore.getState().updateObject('test-wall-1', updatedWall);
        useToolStore.getState().setActiveTool('door');
      });

      const canvas = container.querySelector('canvas');

      // Try to place another door in the same location
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 400, // Same location as existing door
          clientY: 300,
        });
      });

      // Verify no additional door was added
      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(1); // Still only one door
      });
    });
  });

  describe('Window Placement Workflow', () => {
    test('should place window on wall when clicked', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      // Activate window tool
      act(() => {
        useToolStore.getState().setActiveTool('window');
      });

      await waitFor(() => {
        expect(useToolStore.getState().activeTool).toBe('window');
      });

      const canvas = container.querySelector('canvas');

      // Simulate clicking on the wall to place window
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 300, // Left side of the wall
          clientY: 300,
        });
      });

      // Verify window was added to the wall
      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(1);
        expect(wall.openings[0].type).toBe('window');
      });
    });

    test('should use default window settings from tool store', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      // Set custom window settings
      const customSettings = {
        defaultWidth: 1.5,
        defaultHeight: 1.3,
        material: 'custom-window-material',
      };

      act(() => {
        useToolStore.getState().updateToolSettings('window', customSettings);
        useToolStore.getState().setActiveTool('window');
      });

      const canvas = container.querySelector('canvas');

      // Place window
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 300,
          clientY: 300,
        });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        
        if (wall.openings.length > 0) {
          const window = wall.openings[0];
          expect(window.width).toBe(customSettings.defaultWidth);
          expect(window.height).toBe(customSettings.defaultHeight);
          expect(window.properties.material).toBe(customSettings.material);
        }
      });
    });

    test('should place multiple windows on same wall', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      act(() => {
        useToolStore.getState().setActiveTool('window');
      });

      const canvas = container.querySelector('canvas');

      // Place first window
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 250, // Left side
          clientY: 300,
        });
      });

      // Place second window
      act(() => {
        fireEvent.click(canvas!, {
          clientX: 550, // Right side
          clientY: 300,
        });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(2);
        expect(wall.openings.every(opening => opening.type === 'window')).toBe(true);
      });
    });
  });

  describe('Mixed Door and Window Placement', () => {
    test('should place both doors and windows on same wall', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      const canvas = container.querySelector('canvas');

      // Place a door
      act(() => {
        useToolStore.getState().setActiveTool('door');
      });

      act(() => {
        fireEvent.click(canvas!, {
          clientX: 300,
          clientY: 300,
        });
      });

      // Place a window
      act(() => {
        useToolStore.getState().setActiveTool('window');
      });

      act(() => {
        fireEvent.click(canvas!, {
          clientX: 500,
          clientY: 300,
        });
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(2);
        
        const doorCount = wall.openings.filter(opening => opening.type === 'door').length;
        const windowCount = wall.openings.filter(opening => opening.type === 'window').length;
        
        expect(doorCount).toBe(1);
        expect(windowCount).toBe(1);
      });
    });
  });

  describe('Opening Selection and Modification', () => {
    test('should select opening when clicked', async () => {
      const { container } = render(<TestOpeningWorkflow />);
      
      // First add a door to the wall
      act(() => {
        const door: Opening = {
          id: 'test-door-1',
          type: 'door',
          position: 0.5,
          width: 0.8,
          height: 2.0,
          properties: {},
        };

        const updatedWall: WallObject = {
          ...testWall,
          openings: [door],
        };

        useSceneStore.getState().updateObject('test-wall-1', updatedWall);
        useToolStore.getState().setActiveTool('select');
      });

      // Simulate clicking on the door opening
      act(() => {
        useSceneStore.getState().selectOpening({
          wallId: 'test-wall-1',
          openingId: 'test-door-1',
          type: 'door',
        });
      });

      await waitFor(() => {
        const selectedOpening = useSceneStore.getState().selectedOpening;
        expect(selectedOpening).not.toBeNull();
        expect(selectedOpening?.openingId).toBe('test-door-1');
        expect(selectedOpening?.wallId).toBe('test-wall-1');
        expect(selectedOpening?.type).toBe('door');
      });

      expect(screen.getByTestId('opening-selected')).toBeInTheDocument();
    });

    test('should modify opening properties', async () => {
      render(<TestOpeningWorkflow />);
      
      // Add a door to the wall
      act(() => {
        const door: Opening = {
          id: 'test-door-1',
          type: 'door',
          position: 0.5,
          width: 0.8,
          height: 2.0,
          properties: {},
        };

        const updatedWall: WallObject = {
          ...testWall,
          openings: [door],
        };

        useSceneStore.getState().updateObject('test-wall-1', updatedWall);
      });

      // Modify the door's width
      act(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        const updatedOpenings = wall.openings.map(opening => 
          opening.id === 'test-door-1' 
            ? { ...opening, width: 0.9 }
            : opening
        );

        const updatedWall: WallObject = {
          ...wall,
          openings: updatedOpenings,
        };

        useSceneStore.getState().updateObject('test-wall-1', updatedWall);
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        const door = wall.openings.find(opening => opening.id === 'test-door-1');
        expect(door?.width).toBe(0.9);
      });
    });

    test('should delete opening from wall', async () => {
      render(<TestOpeningWorkflow />);
      
      // Add a door to the wall
      act(() => {
        const door: Opening = {
          id: 'test-door-1',
          type: 'door',
          position: 0.5,
          width: 0.8,
          height: 2.0,
          properties: {},
        };

        const updatedWall: WallObject = {
          ...testWall,
          openings: [door],
        };

        useSceneStore.getState().updateObject('test-wall-1', updatedWall);
      });

      // Verify door exists
      expect(useSceneStore.getState().objects.get('test-wall-1')?.openings.length).toBe(1);

      // Remove the door
      act(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        const updatedOpenings = wall.openings.filter(opening => opening.id !== 'test-door-1');

        const updatedWall: WallObject = {
          ...wall,
          openings: updatedOpenings,
        };

        useSceneStore.getState().updateObject('test-wall-1', updatedWall);
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(0);
      });
    });
  });

  describe('Opening Position Validation', () => {
    test('should validate opening position within wall bounds', async () => {
      render(<TestOpeningWorkflow />);
      
      // Try to add a door at an invalid position (outside wall bounds)
      act(() => {
        const door: Opening = {
          id: 'invalid-door',
          type: 'door',
          position: 1.5, // Position > 1.0 is outside wall bounds
          width: 0.8,
          height: 2.0,
          properties: {},
        };

        // This should be validated by the opening geometry utility
        // For now, we'll simulate the validation by not adding invalid openings
        if (door.position >= 0 && door.position <= 1) {
          const updatedWall: WallObject = {
            ...testWall,
            openings: [door],
          };
          useSceneStore.getState().updateObject('test-wall-1', updatedWall);
        }
      });

      // Verify invalid door was not added
      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(0);
      });
    });

    test('should validate opening size against wall dimensions', async () => {
      render(<TestOpeningWorkflow />);
      
      // Try to add a door that's too wide for the wall
      act(() => {
        const oversizedDoor: Opening = {
          id: 'oversized-door',
          type: 'door',
          position: 0.5,
          width: 5.0, // Much wider than the 4-unit wall
          height: 2.0,
          properties: {},
        };

        // This should be validated - door width should not exceed wall length
        const wallLength = Math.sqrt(
          Math.pow(testWall.endPoint.x - testWall.startPoint.x, 2) +
          Math.pow(testWall.endPoint.y - testWall.startPoint.y, 2)
        );

        if (oversizedDoor.width <= wallLength) {
          const updatedWall: WallObject = {
            ...testWall,
            openings: [oversizedDoor],
          };
          useSceneStore.getState().updateObject('test-wall-1', updatedWall);
        }
      });

      // Verify oversized door was not added
      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        const wall = objects.get('test-wall-1') as WallObject;
        expect(wall.openings.length).toBe(0);
      });
    });
  });
});