/**
 * Integration Tests - Save/Load and Export Functionality
 * Tests the complete workflow of saving, loading, and exporting projects
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import * as THREE from 'three';
import { useSceneStore } from '../../stores/sceneStore';
import { useProjectStore } from '../../stores/projectStore';
import { useMaterialStore } from '../../stores/materialStore';
import { 
  saveProject, 
  loadProject, 
  deleteProject, 
  getProjectList,
  isStorageAvailable 
} from '../../utils/projectStorage';
import { exportModel, ModelExporter } from '../../utils/modelExport';
import { captureScreenshot, ScreenshotExporter } from '../../utils/screenshotExport';
import { WallObject, SceneData } from '../../types/scene';
import { ProjectData } from '../../types/project';
import { ModelExportOptions, ImageExportOptions } from '../../types/export';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: Object.keys(store).length,
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

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

// Mock canvas toBlob method
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  const blob = new Blob(['mock-image-data'], { type: 'image/png' });
  callback(blob);
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement for download links
const mockLink = {
  href: '',
  download: '',
  click: jest.fn(),
};

const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock document.body.appendChild and removeChild
document.body.appendChild = jest.fn();
document.body.removeChild = jest.fn();

describe('Save/Load and Export Functionality', () => {
  let testSceneData: SceneData;
  let testWalls: WallObject[];

  beforeEach(() => {
    // Reset all stores and localStorage before each test
    useSceneStore.getState().clearScene();
    useProjectStore.getState().clearCurrentProject();
    localStorageMock.clear();
    jest.clearAllMocks();

    // Create test scene data
    testWalls = [
      {
        id: 'wall-1',
        type: 'wall',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        properties: {},
        material: {
          id: 'wall-material-1',
          name: 'Wall Material',
          color: '#e2e8f0',
          roughness: 0.8,
          metalness: 0.1,
        },
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 4, y: 0 },
        height: 2.5,
        thickness: 0.2,
        openings: [
          {
            id: 'door-1',
            type: 'door',
            position: 0.3,
            width: 0.8,
            height: 2.0,
            properties: {},
          },
        ],
      },
      {
        id: 'wall-2',
        type: 'wall',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        properties: {},
        material: {
          id: 'wall-material-2',
          name: 'Wall Material 2',
          color: '#f1f5f9',
          roughness: 0.8,
          metalness: 0.1,
        },
        startPoint: { x: 4, y: 0 },
        endPoint: { x: 4, y: 3 },
        height: 2.5,
        thickness: 0.2,
        openings: [
          {
            id: 'window-1',
            type: 'window',
            position: 0.5,
            width: 1.2,
            height: 1.2,
            properties: {},
          },
        ],
      },
    ];

    testSceneData = {
      objects: testWalls,
      materials: [
        {
          id: 'wall-material-1',
          name: 'Wall Material',
          color: '#e2e8f0',
          roughness: 0.8,
          metalness: 0.1,
        },
        {
          id: 'wall-material-2',
          name: 'Wall Material 2',
          color: '#f1f5f9',
          roughness: 0.8,
          metalness: 0.1,
        },
      ],
      settings: {
        gridSize: 1,
        snapToGrid: true,
        units: 'metric',
        lightingMode: 'realistic',
      },
    };

    // Load test data into scene store
    act(() => {
      testWalls.forEach(wall => {
        useSceneStore.getState().addObject(wall);
      });
    });
  });

  describe('Project Save Functionality', () => {
    test('should save project to localStorage', async () => {
      const projectName = 'Test House Design';
      
      const savedProject = await saveProject(testSceneData, projectName);

      expect(savedProject).toBeDefined();
      expect(savedProject.name).toBe(projectName);
      expect(savedProject.sceneData).toEqual(testSceneData);
      expect(savedProject.id).toBeDefined();
      expect(savedProject.createdAt).toBeInstanceOf(Date);
      expect(savedProject.updatedAt).toBeInstanceOf(Date);

      // Verify data was saved to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should update existing project when saving with existing ID', async () => {
      const projectName = 'Test House Design';
      
      // Save initial project
      const initialProject = await saveProject(testSceneData, projectName);
      
      // Modify scene data
      const modifiedSceneData = {
        ...testSceneData,
        objects: [...testSceneData.objects, {
          id: 'wall-3',
          type: 'wall',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          properties: {},
          material: {
            id: 'wall-material-3',
            name: 'Wall Material 3',
            color: '#cbd5e1',
            roughness: 0.8,
            metalness: 0.1,
          },
          startPoint: { x: 0, y: 3 },
          endPoint: { x: 4, y: 3 },
          height: 2.5,
          thickness: 0.2,
          openings: [],
        } as WallObject],
      };

      // Save updated project
      const updatedProject = await saveProject(
        modifiedSceneData,
        'Updated Test House Design',
        initialProject.id
      );

      expect(updatedProject.id).toBe(initialProject.id);
      expect(updatedProject.name).toBe('Updated Test House Design');
      expect(updatedProject.sceneData.objects.length).toBe(3);
      expect(updatedProject.createdAt).toEqual(initialProject.createdAt);
      expect(updatedProject.updatedAt.getTime()).toBeGreaterThan(
        initialProject.updatedAt.getTime()
      );
    });

    test('should handle save errors gracefully', async () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      await expect(
        saveProject(testSceneData, 'Test Project')
      ).rejects.toThrow('Failed to save project');
    });
  });

  describe('Project Load Functionality', () => {
    test('should load project from localStorage', async () => {
      const projectName = 'Test House Design';
      
      // Save a project first
      const savedProject = await saveProject(testSceneData, projectName);
      
      // Load the project
      const loadedProject = await loadProject(savedProject.id);

      expect(loadedProject).toBeDefined();
      expect(loadedProject.id).toBe(savedProject.id);
      expect(loadedProject.name).toBe(projectName);
      expect(loadedProject.sceneData).toEqual(testSceneData);
      expect(loadedProject.createdAt).toBeInstanceOf(Date);
      expect(loadedProject.updatedAt).toBeInstanceOf(Date);
    });

    test('should throw error when loading non-existent project', async () => {
      await expect(
        loadProject('non-existent-project-id')
      ).rejects.toThrow('Project with ID non-existent-project-id not found');
    });

    test('should validate project data when loading with validation option', async () => {
      const projectName = 'Test House Design';
      const savedProject = await saveProject(testSceneData, projectName);

      // Load with validation
      const loadedProject = await loadProject(savedProject.id, {
        validateData: true,
      });

      expect(loadedProject).toBeDefined();
      expect(loadedProject.sceneData.objects).toBeDefined();
      expect(Array.isArray(loadedProject.sceneData.objects)).toBe(true);
    });
  });

  describe('Project List Management', () => {
    test('should get list of saved projects', async () => {
      // Save multiple projects
      await saveProject(testSceneData, 'Project 1');
      await saveProject(testSceneData, 'Project 2');
      await saveProject(testSceneData, 'Project 3');

      const projectList = await getProjectList();

      expect(projectList).toBeDefined();
      expect(projectList.length).toBe(3);
      expect(projectList[0].name).toBeDefined();
      expect(projectList[0].updatedAt).toBeInstanceOf(Date);
    });

    test('should return empty list when no projects exist', async () => {
      const projectList = await getProjectList();
      expect(projectList).toEqual([]);
    });

    test('should delete project from storage', async () => {
      const savedProject = await saveProject(testSceneData, 'Test Project');
      
      // Verify project exists
      let projectList = await getProjectList();
      expect(projectList.length).toBe(1);

      // Delete project
      await deleteProject(savedProject.id);

      // Verify project was deleted
      projectList = await getProjectList();
      expect(projectList.length).toBe(0);

      // Verify loading deleted project throws error
      await expect(
        loadProject(savedProject.id)
      ).rejects.toThrow('Project with ID');
    });
  });

  describe('Scene Store Integration', () => {
    test('should load project data into scene store', async () => {
      const projectName = 'Test House Design';
      const savedProject = await saveProject(testSceneData, projectName);

      // Clear scene store
      act(() => {
        useSceneStore.getState().clearScene();
      });

      expect(useSceneStore.getState().objects.size).toBe(0);

      // Load project data into scene store
      const loadedProject = await loadProject(savedProject.id);
      
      act(() => {
        useSceneStore.getState().loadScene(loadedProject.sceneData);
      });

      await waitFor(() => {
        const objects = useSceneStore.getState().objects;
        expect(objects.size).toBe(2);
        expect(objects.has('wall-1')).toBe(true);
        expect(objects.has('wall-2')).toBe(true);
      });
    });

    test('should export scene data from scene store', async () => {
      // Scene store already has test data loaded
      const exportedData = useSceneStore.getState().exportScene();

      expect(exportedData).toBeDefined();
      expect(exportedData.objects.length).toBe(2);
      expect(exportedData.materials).toBeDefined();
      expect(exportedData.settings).toBeDefined();
    });
  });

  describe('3D Model Export Functionality', () => {
    test('should export scene to OBJ format', async () => {
      const exportOptions: ModelExportOptions = {
        format: 'obj',
        filename: 'test-house.obj',
        includeTextures: false,
      };

      const result = await exportModel(
        testSceneData.objects,
        testSceneData.materials,
        exportOptions
      );

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test-house.obj');
      expect(result.blob).toBeInstanceOf(Blob);
    });

    test('should export scene to GLTF format', async () => {
      const exportOptions: ModelExportOptions = {
        format: 'gltf',
        filename: 'test-house.glb',
        includeTextures: true,
        embedTextures: true,
      };

      const result = await exportModel(
        testSceneData.objects,
        testSceneData.materials,
        exportOptions
      );

      expect(result.success).toBe(true);
      expect(result.filename).toBe('test-house.glb');
      expect(result.blob).toBeInstanceOf(Blob);
    });

    test('should handle export errors gracefully', async () => {
      // Mock exporter to throw an error
      const mockExporter = new ModelExporter();
      jest.spyOn(mockExporter, 'exportToOBJ').mockRejectedValueOnce(
        new Error('Export failed')
      );

      const exportOptions: ModelExportOptions = {
        format: 'obj',
        filename: 'test-house.obj',
      };

      const result = await exportModel(
        testSceneData.objects,
        testSceneData.materials,
        exportOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Export failed');
    });

    test('should track export progress', async () => {
      const progressUpdates: any[] = [];
      
      const exportOptions: ModelExportOptions = {
        format: 'obj',
        filename: 'test-house.obj',
      };

      await exportModel(
        testSceneData.objects,
        testSceneData.materials,
        exportOptions,
        (progress) => {
          progressUpdates.push(progress);
        }
      );

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe('preparing');
      expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');
    });
  });

  describe('Screenshot Export Functionality', () => {
    test('should capture screenshot from renderer', async () => {
      // Mock Three.js renderer
      const mockRenderer = {
        domElement: document.createElement('canvas'),
        getSize: jest.fn(() => new THREE.Vector2(800, 600)),
        getPixelRatio: jest.fn(() => 1),
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        render: jest.fn(),
      } as any;

      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.PerspectiveCamera();

      const exportOptions: ImageExportOptions = {
        resolution: { width: 1920, height: 1080 },
        quality: 1.0,
        filename: 'house-screenshot.png',
      };

      const result = await captureScreenshot(
        mockRenderer,
        mockScene,
        mockCamera,
        exportOptions
      );

      expect(result.success).toBe(true);
      expect(result.filename).toBe('house-screenshot.png');
      expect(result.blob).toBeInstanceOf(Blob);
    });

    test('should handle screenshot capture errors', async () => {
      const mockRenderer = {
        domElement: document.createElement('canvas'),
        getSize: jest.fn(() => new THREE.Vector2(800, 600)),
        getPixelRatio: jest.fn(() => 1),
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        render: jest.fn(() => {
          throw new Error('Render failed');
        }),
      } as any;

      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.PerspectiveCamera();

      const exportOptions: ImageExportOptions = {
        resolution: { width: 1920, height: 1080 },
        quality: 1.0,
        filename: 'house-screenshot.png',
      };

      const result = await captureScreenshot(
        mockRenderer,
        mockScene,
        mockCamera,
        exportOptions
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Render failed');
    });

    test('should track screenshot progress', async () => {
      const progressUpdates: any[] = [];
      
      const mockRenderer = {
        domElement: document.createElement('canvas'),
        getSize: jest.fn(() => new THREE.Vector2(800, 600)),
        getPixelRatio: jest.fn(() => 1),
        setSize: jest.fn(),
        setPixelRatio: jest.fn(),
        render: jest.fn(),
      } as any;

      const mockScene = new THREE.Scene();
      const mockCamera = new THREE.PerspectiveCamera();

      const exportOptions: ImageExportOptions = {
        resolution: { width: 1920, height: 1080 },
        quality: 1.0,
        filename: 'house-screenshot.png',
      };

      await captureScreenshot(
        mockRenderer,
        mockScene,
        mockCamera,
        exportOptions,
        (progress) => {
          progressUpdates.push(progress);
        }
      );

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe('preparing');
      expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');
    });
  });

  describe('Storage Availability', () => {
    test('should check if localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    test('should handle localStorage unavailability', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage not available');
      });

      expect(isStorageAvailable()).toBe(false);

      // Restore original implementation
      localStorageMock.setItem.mockImplementation(originalSetItem);
    });
  });
});