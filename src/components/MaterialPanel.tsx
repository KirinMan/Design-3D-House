/**
 * Material Panel Component - Material selection and preview
 * Implements requirements: 5.1, 5.3
 */

"use client";

import React, { useState } from "react";
import { useMaterialStore } from "../stores/materialStore";
import { useSceneStore } from "../stores/sceneStore";
import { MaterialProperties } from "../types/scene";
import { validateMaterialProperties, cloneMaterial } from "../utils/materialUtils";

interface MaterialPanelProps {
  className?: string;
}

export const MaterialPanel: React.FC<MaterialPanelProps> = ({ className = "" }) => {
  const {
    materials,
    selectedMaterial,
    selectMaterial,
    addMaterial,
    updateMaterial,
    removeMaterial,
    applyMaterialToObject,
  } = useMaterialStore();

  const { selectedObjects } = useSceneStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialProperties | null>(null);

  const materialList = Array.from(materials.values());

  const handleMaterialSelect = (materialId: string) => {
    selectMaterial(materialId);
  };

  const handleApplyMaterial = () => {
    if (!selectedMaterial || selectedObjects.length === 0) return;

    selectedObjects.forEach(objectId => {
      applyMaterialToObject(objectId, selectedMaterial);
    });
  };

  const handleEditMaterial = (material: MaterialProperties) => {
    setEditingMaterial({ ...material });
    setIsEditing(true);
  };

  const handleSaveMaterial = () => {
    if (!editingMaterial || !validateMaterialProperties(editingMaterial)) return;

    updateMaterial(editingMaterial.id, editingMaterial);
    setIsEditing(false);
    setEditingMaterial(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingMaterial(null);
  };

  const handleDuplicateMaterial = (material: MaterialProperties) => {
    const newId = `${material.id}-copy-${Date.now()}`;
    const duplicated = cloneMaterial(material, newId);
    addMaterial(duplicated);
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (materialId.includes("default")) {
      alert("Cannot delete default materials");
      return;
    }
    removeMaterial(materialId);
  };

  const MaterialPreview: React.FC<{ material: MaterialProperties }> = ({ material }) => (
    <div
      className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer"
      style={{
        backgroundColor: material.color,
        boxShadow: material.metalness > 0.5 ? "inset 0 0 10px rgba(255,255,255,0.3)" : "none",
      }}
      title={material.name}
    />
  );

  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Materials</h3>

      {/* Material Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {materialList.map((material) => (
          <div
            key={material.id}
            className={`p-2 border rounded cursor-pointer ${
              selectedMaterial === material.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-400"
            }`}
            onClick={() => handleMaterialSelect(material.id)}
          >
            <MaterialPreview material={material} />
            <p className="text-xs mt-1 truncate" title={material.name}>
              {material.name}
            </p>
          </div>
        ))}
      </div>

      {/* Material Actions */}
      <div className="space-y-2">
        <button
          onClick={handleApplyMaterial}
          disabled={!selectedMaterial || selectedObjects.length === 0}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Apply to Selected ({selectedObjects.length})
        </button>

        {selectedMaterial && (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const material = materials.get(selectedMaterial);
                if (material) handleEditMaterial(material);
              }}
              className="flex-1 px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => {
                const material = materials.get(selectedMaterial);
                if (material) handleDuplicateMaterial(material);
              }}
              className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Duplicate
            </button>
            <button
              onClick={() => handleDeleteMaterial(selectedMaterial)}
              disabled={selectedMaterial.includes("default")}
              className="flex-1 px-3 py-1 bg-red-500 text-white rounded text-sm disabled:bg-gray-300"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Material Editor Modal */}
      {isEditing && editingMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h4 className="text-lg font-semibold mb-4">Edit Material</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingMaterial.name}
                  onChange={(e) =>
                    setEditingMaterial({ ...editingMaterial, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={editingMaterial.color}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, color: e.target.value })
                    }
                    className="w-12 h-10 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={editingMaterial.color}
                    onChange={(e) =>
                      setEditingMaterial({ ...editingMaterial, color: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Roughness: {editingMaterial.roughness.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={editingMaterial.roughness}
                  onChange={(e) =>
                    setEditingMaterial({
                      ...editingMaterial,
                      roughness: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Metalness: {editingMaterial.metalness.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={editingMaterial.metalness}
                  onChange={(e) =>
                    setEditingMaterial({
                      ...editingMaterial,
                      metalness: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <button
                onClick={handleSaveMaterial}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};