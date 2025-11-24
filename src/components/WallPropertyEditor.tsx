/**
 * WallPropertyEditor Component - Wall-specific property editing
 * Implements requirements: 2.4
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSceneStore } from "../stores/sceneStore";
import { WallObject } from "../types/scene";

interface WallPropertyEditorProps {
  wallId: string;
  className?: string;
}

export default function WallPropertyEditor({ 
  wallId, 
  className = "" 
}: WallPropertyEditorProps) {
  const updateObject = useSceneStore((state) => state.updateObject);
  const objects = useSceneStore((state) => state.objects);
  
  const wall = objects.get(wallId) as WallObject | undefined;
  
  // Local state for form inputs
  const [formData, setFormData] = useState({
    height: wall?.height || 2.5,
    thickness: wall?.thickness || 0.2,
    startPointX: wall?.startPoint.x || 0,
    startPointY: wall?.startPoint.y || 0,
    endPointX: wall?.endPoint.x || 0,
    endPointY: wall?.endPoint.y || 0,
    materialColor: wall?.material.color || "#e2e8f0",
    materialRoughness: wall?.material.roughness || 0.8,
    materialMetalness: wall?.material.metalness || 0.1,
  });

  // Update form data when wall changes
  useEffect(() => {
    if (wall) {
      setFormData({
        height: wall.height,
        thickness: wall.thickness,
        startPointX: wall.startPoint.x,
        startPointY: wall.startPoint.y,
        endPointX: wall.endPoint.x,
        endPointY: wall.endPoint.y,
        materialColor: wall.material.color,
        materialRoughness: wall.material.roughness,
        materialMetalness: wall.material.metalness,
      });
    }
  }, [wall]);

  if (!wall) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">Wall not found</p>
      </div>
    );
  }

  // Calculate wall length for display
  const wallLength = Math.sqrt(
    Math.pow(wall.endPoint.x - wall.startPoint.x, 2) +
    Math.pow(wall.endPoint.y - wall.startPoint.y, 2)
  );

  // Handle input changes
  const handleInputChange = (field: string, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Apply changes to the wall object
  const applyChanges = () => {
    const updatedWall: Partial<WallObject> = {
      height: formData.height,
      thickness: formData.thickness,
      startPoint: {
        x: formData.startPointX,
        y: formData.startPointY,
      },
      endPoint: {
        x: formData.endPointX,
        y: formData.endPointY,
      },
      material: {
        ...wall.material,
        color: formData.materialColor,
        roughness: formData.materialRoughness,
        metalness: formData.materialMetalness,
      },
    };

    updateObject(wallId, updatedWall);
  };

  // Reset changes
  const resetChanges = () => {
    setFormData({
      height: wall.height,
      thickness: wall.thickness,
      startPointX: wall.startPoint.x,
      startPointY: wall.startPoint.y,
      endPointX: wall.endPoint.x,
      endPointY: wall.endPoint.y,
      materialColor: wall.material.color,
      materialRoughness: wall.material.roughness,
      materialMetalness: wall.material.metalness,
    });
  };

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}>
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">Wall Properties</h3>
        <p className="text-sm text-gray-500">ID: {wallId}</p>
        <p className="text-sm text-gray-500">
          Length: {wallLength.toFixed(2)}m
        </p>
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Dimensions</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Height (m)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10"
              value={formData.height}
              onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Thickness (m)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              value={formData.thickness}
              onChange={(e) => handleInputChange('thickness', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Position</h4>
        
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Start X
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.startPointX}
                onChange={(e) => handleInputChange('startPointX', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Start Y
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.startPointY}
                onChange={(e) => handleInputChange('startPointY', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                End X
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.endPointX}
                onChange={(e) => handleInputChange('endPointX', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                End Y
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.endPointY}
                onChange={(e) => handleInputChange('endPointY', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Material Properties */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Material</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Color
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.materialColor}
              onChange={(e) => handleInputChange('materialColor', e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.materialColor}
              onChange={(e) => handleInputChange('materialColor', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#e2e8f0"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Roughness
            </label>
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
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Metalness
            </label>
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
      <div className="flex gap-2 pt-4 border-t">
        <button
          onClick={applyChanges}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          Apply Changes
        </button>
        <button
          onClick={resetChanges}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}