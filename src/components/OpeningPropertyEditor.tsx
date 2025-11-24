/**
 * OpeningPropertyEditor Component - Property editor for door and window openings
 * Implements requirements: 2.4
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSceneStore } from "../stores/sceneStore";
import { WallObject, Opening } from "../types/scene";
import { validateOpeningPosition } from "../utils/openingGeometry";

interface OpeningPropertyEditorProps {
  wallId: string;
  openingId: string;
  className?: string;
}

export default function OpeningPropertyEditor({ 
  wallId, 
  openingId,
  className = "" 
}: OpeningPropertyEditorProps) {
  const updateObject = useSceneStore((state) => state.updateObject);
  const objects = useSceneStore((state) => state.objects);
  
  const wall = objects.get(wallId) as WallObject | undefined;
  const opening = wall?.openings.find(o => o.id === openingId);
  
  // Local state for form inputs
  const [formData, setFormData] = useState({
    width: opening?.width || 0.8,
    height: opening?.height || 2.0,
    position: opening?.position || 0.5,
    // Door-specific properties
    openDirection: opening?.properties?.openDirection || "inward",
    material: opening?.properties?.material || "default",
    // Window-specific properties
    glassType: opening?.properties?.glassType || "clear",
    frameColor: opening?.properties?.frameColor || "#FFFFFF",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Update form data when opening changes
  useEffect(() => {
    if (opening) {
      setFormData({
        width: opening.width,
        height: opening.height,
        position: opening.position,
        openDirection: opening.properties?.openDirection || "inward",
        material: opening.properties?.material || "default",
        glassType: opening.properties?.glassType || "clear",
        frameColor: opening.properties?.frameColor || "#FFFFFF",
      });
    }
  }, [opening]);

  if (!wall || !opening) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500">Opening not found</p>
      </div>
    );
  }

  // Calculate wall length for position validation
  const wallLength = Math.sqrt(
    Math.pow(wall.endPoint.x - wall.startPoint.x, 2) +
    Math.pow(wall.endPoint.y - wall.startPoint.y, 2)
  );

  // Handle input changes with validation
  const handleInputChange = (field: string, value: number | string) => {
    const newFormData = {
      ...formData,
      [field]: value,
    };

    // Validate opening position if width or position changed
    if (field === 'width' || field === 'position') {
      const testOpening: Opening = {
        ...opening,
        width: typeof newFormData.width === 'number' ? newFormData.width : opening.width,
        position: typeof newFormData.position === 'number' ? newFormData.position : opening.position,
      };

      const validation = validateOpeningPosition(wall, testOpening);
      setValidationError(validation.isValid ? null : validation.error || "Invalid position");
    }

    setFormData(newFormData);
  };

  // Apply changes to the opening
  const applyChanges = () => {
    if (validationError) {
      return; // Don't apply if there are validation errors
    }

    const updatedOpening: Opening = {
      ...opening,
      width: formData.width,
      height: formData.height,
      position: formData.position,
      properties: {
        ...opening.properties,
        ...(opening.type === "door" && {
          openDirection: formData.openDirection,
          material: formData.material,
        }),
        ...(opening.type === "window" && {
          glassType: formData.glassType,
          frameColor: formData.frameColor,
          material: formData.material,
        }),
      },
    };

    // Update the wall with the modified opening
    const updatedWall: WallObject = {
      ...wall,
      openings: wall.openings.map(o => 
        o.id === openingId ? updatedOpening : o
      ),
    };

    updateObject(wallId, updatedWall);
  };

  // Reset changes
  const resetChanges = () => {
    setFormData({
      width: opening.width,
      height: opening.height,
      position: opening.position,
      openDirection: opening.properties?.openDirection || "inward",
      material: opening.properties?.material || "default",
      glassType: opening.properties?.glassType || "clear",
      frameColor: opening.properties?.frameColor || "#FFFFFF",
    });
    setValidationError(null);
  };

  // Delete opening
  const deleteOpening = () => {
    if (confirm(`Are you sure you want to delete this ${opening.type}?`)) {
      const updatedWall: WallObject = {
        ...wall,
        openings: wall.openings.filter(o => o.id !== openingId),
      };

      updateObject(wallId, updatedWall);
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-4 ${className}`}>
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800 capitalize">
          {opening.type} Properties
        </h3>
        <p className="text-sm text-gray-500">ID: {openingId}</p>
        <p className="text-sm text-gray-500">Wall: {wallId}</p>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Dimensions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Dimensions</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Width (m)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={formData.width}
              onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Height (m)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="5"
              value={formData.height}
              onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Position */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">Position</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Position along wall (0 = start, 1 = end)
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={formData.position}
            onChange={(e) => handleInputChange('position', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Start (0)</span>
            <span>{formData.position.toFixed(2)}</span>
            <span>End (1)</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Distance from start: {(formData.position * wallLength).toFixed(2)}m
          </p>
        </div>
      </div>

      {/* Door-specific properties */}
      {opening.type === "door" && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Door Properties</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Opening Direction
            </label>
            <select
              value={formData.openDirection}
              onChange={(e) => handleInputChange('openDirection', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Door Material
            </label>
            <select
              value={formData.material}
              onChange={(e) => handleInputChange('material', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="wood">Wood</option>
              <option value="metal">Metal</option>
              <option value="glass">Glass</option>
              <option value="composite">Composite</option>
            </select>
          </div>
        </div>
      )}

      {/* Window-specific properties */}
      {opening.type === "window" && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Window Properties</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Glass Type
            </label>
            <select
              value={formData.glassType}
              onChange={(e) => handleInputChange('glassType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="clear">Clear</option>
              <option value="tinted">Tinted</option>
              <option value="frosted">Frosted</option>
              <option value="double">Double Glazed</option>
              <option value="triple">Triple Glazed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Frame Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.frameColor}
                onChange={(e) => handleInputChange('frameColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.frameColor}
                onChange={(e) => handleInputChange('frameColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Frame Material
            </label>
            <select
              value={formData.material}
              onChange={(e) => handleInputChange('material', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="aluminum">Aluminum</option>
              <option value="wood">Wood</option>
              <option value="vinyl">Vinyl</option>
              <option value="fiberglass">Fiberglass</option>
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          onClick={applyChanges}
          disabled={!!validationError}
          className={`flex-1 px-4 py-2 rounded-md transition-colors ${
            validationError
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          Apply Changes
        </button>
        <button
          onClick={resetChanges}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={deleteOpening}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}