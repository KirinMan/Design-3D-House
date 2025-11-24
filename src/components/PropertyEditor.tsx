/**
 * PropertyEditor Component - Enhanced property editor for selected objects
 * Implements requirements: 2.4
 */

"use client";

import React, { useState } from "react";
import { useSceneStore } from "../stores/sceneStore";
import { SceneObject } from "../types/scene";
import WallPropertyEditor from "./WallPropertyEditor";
import OpeningPropertyEditor from "./OpeningPropertyEditor";

interface PropertyEditorProps {
  className?: string;
}

interface GenericPropertyEditorProps {
  object: SceneObject;
  objectId: string;
  onUpdate: (id: string, changes: Partial<SceneObject>) => void;
}

// Generic property editor for objects that don't have specific editors yet
function GenericPropertyEditor({ object, objectId, onUpdate }: GenericPropertyEditorProps) {
  const [formData, setFormData] = useState({
    positionX: object.position.x,
    positionY: object.position.y,
    positionZ: object.position.z,
    rotationX: object.rotation.x,
    rotationY: object.rotation.y,
    rotationZ: object.rotation.z,
    scaleX: object.scale.x,
    scaleY: object.scale.y,
    scaleZ: object.scale.z,
    materialColor: object.material.color,
    materialRoughness: object.material.roughness,
    materialMetalness: object.material.metalness,
  });

  const handleInputChange = (field: string, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyChanges = () => {
    const updatedObject: Partial<SceneObject> = {
      position: {
        x: formData.positionX,
        y: formData.positionY,
        z: formData.positionZ,
      },
      rotation: {
        x: formData.rotationX,
        y: formData.rotationY,
        z: formData.rotationZ,
      },
      scale: {
        x: formData.scaleX,
        y: formData.scaleY,
        z: formData.scaleZ,
      },
      material: {
        ...object.material,
        color: formData.materialColor,
        roughness: formData.materialRoughness,
        metalness: formData.materialMetalness,
      },
    };

    onUpdate(objectId, updatedObject);
  };

  const resetChanges = () => {
    setFormData({
      positionX: object.position.x,
      positionY: object.position.y,
      positionZ: object.position.z,
      rotationX: object.rotation.x,
      rotationY: object.rotation.y,
      rotationZ: object.rotation.z,
      scaleX: object.scale.x,
      scaleY: object.scale.y,
      scaleZ: object.scale.z,
      materialColor: object.material.color,
      materialRoughness: object.material.roughness,
      materialMetalness: object.material.metalness,
    });
  };

  return (
    <div className="space-y-4">
      {/* Object Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium text-gray-600">Type:</span>
          <span className="text-sm capitalize font-semibold">{object.type}</span>
        </div>
        <div className="text-xs text-gray-500 font-mono">ID: {objectId}</div>
      </div>

      {/* Transform Properties */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Transform
        </h4>
        
        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Position</label>
          <div className="grid grid-cols-3 gap-2">
            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis}>
                <label className="block text-xs text-gray-500 mb-1">{axis}</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData[`position${axis}` as keyof typeof formData] as number}
                  onChange={(e) => handleInputChange(`position${axis}`, parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Rotation (degrees)</label>
          <div className="grid grid-cols-3 gap-2">
            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis}>
                <label className="block text-xs text-gray-500 mb-1">{axis}</label>
                <input
                  type="number"
                  step="1"
                  min="-180"
                  max="180"
                  value={Math.round((formData[`rotation${axis}` as keyof typeof formData] as number) * 180 / Math.PI)}
                  onChange={(e) => handleInputChange(`rotation${axis}`, parseFloat(e.target.value) * Math.PI / 180)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Scale</label>
          <div className="grid grid-cols-3 gap-2">
            {['X', 'Y', 'Z'].map((axis, index) => (
              <div key={axis}>
                <label className="block text-xs text-gray-500 mb-1">{axis}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  value={formData[`scale${axis}` as keyof typeof formData] as number}
                  onChange={(e) => handleInputChange(`scale${axis}`, parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Material Properties */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
          Material
        </h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.materialColor}
              onChange={(e) => handleInputChange('materialColor', e.target.value)}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.materialColor}
              onChange={(e) => handleInputChange('materialColor', e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="#e2e8f0"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Roughness</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.materialRoughness}
              onChange={(e) => handleInputChange('materialRoughness', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{formData.materialRoughness}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Metalness</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.materialMetalness}
              onChange={(e) => handleInputChange('materialMetalness', parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">{formData.materialMetalness}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={applyChanges}
          className="flex-1 bg-blue-500 text-white px-3 py-2 text-sm rounded-md hover:bg-blue-600 transition-colors"
        >
          Apply Changes
        </button>
        <button
          onClick={resetChanges}
          className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default function PropertyEditor({ className = "" }: PropertyEditorProps) {
  const selectedObjects = useSceneStore((state) => state.selectedObjects);
  const selectedOpening = useSceneStore((state) => state.selectedOpening);
  const objects = useSceneStore((state) => state.objects);
  const updateObject = useSceneStore((state) => state.updateObject);
  const selectObjects = useSceneStore((state) => state.selectObjects);

  // Check if an opening is selected
  if (selectedOpening) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
        </div>
        <div className="p-4">
          <OpeningPropertyEditor
            wallId={selectedOpening.wallId}
            openingId={selectedOpening.openingId}
            className=""
          />
        </div>
      </div>
    );
  }

  // No selection
  if (selectedObjects.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
        </div>
        <div className="p-4">
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
            </svg>
            <p className="text-gray-500 text-sm">
              Select an object to edit its properties
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Click on objects in the 3D viewport to select them
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Multiple selection
  if (selectedObjects.length > 1) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-600 text-sm mb-3">
              Multiple objects selected ({selectedObjects.length})
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedObjects.map((id) => {
                const object = objects.get(id);
                return (
                  <div 
                    key={id} 
                    className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => selectObjects([id])}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium capitalize">{object?.type}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{id.slice(0, 8)}...</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Click on an object above to edit its properties individually
            </p>
          </div>
          
          {/* Bulk actions */}
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Bulk Actions</h4>
            <div className="flex gap-2">
              <button
                onClick={() => selectObjects([])}
                className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single selection
  const selectedId = selectedObjects[0];
  const selectedObject = objects.get(selectedId);

  if (!selectedObject) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
        </div>
        <div className="p-4">
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-500 text-sm">
              Selected object not found
            </p>
            <button
              onClick={() => selectObjects([])}
              className="mt-2 px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate property editor based on object type
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
      </div>
      <div className="p-4">
        {selectedObject.type === "wall" ? (
          <WallPropertyEditor 
            wallId={selectedId} 
            className=""
          />
        ) : (
          <GenericPropertyEditor
            object={selectedObject}
            objectId={selectedId}
            onUpdate={updateObject}
          />
        )}
      </div>
    </div>
  );
}