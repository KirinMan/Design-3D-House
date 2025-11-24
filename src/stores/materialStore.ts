/**
 * Material Store - Manages material properties and application
 * Implements requirements: 5.1, 5.3
 */

import { create } from "zustand";
import { MaterialProperties } from "../types/scene";

export interface MaterialStore {
  // Material data
  materials: Map<string, MaterialProperties>;
  selectedMaterial: string | null;

  // Actions
  addMaterial: (material: MaterialProperties) => void;
  removeMaterial: (id: string) => void;
  updateMaterial: (id: string, changes: Partial<MaterialProperties>) => void;
  selectMaterial: (id: string | null) => void;
  getMaterial: (id: string) => MaterialProperties | undefined;
  getAllMaterials: () => MaterialProperties[];

  // Material application
  applyMaterialToObject: (objectId: string, materialId: string) => void;
}

// Default materials for walls, doors, and windows
const defaultMaterials: MaterialProperties[] = [
  {
    id: "wall-default",
    name: "Default Wall",
    color: "#f5f5f5",
    roughness: 0.8,
    metalness: 0.0,
  },
  {
    id: "wall-brick",
    name: "Brick Wall",
    color: "#8B4513",
    roughness: 0.9,
    metalness: 0.0,
  },
  {
    id: "wall-concrete",
    name: "Concrete Wall",
    color: "#808080",
    roughness: 0.7,
    metalness: 0.0,
  },
  {
    id: "door-wood",
    name: "Wood Door",
    color: "#8B4513",
    roughness: 0.6,
    metalness: 0.0,
  },
  {
    id: "door-metal",
    name: "Metal Door",
    color: "#696969",
    roughness: 0.3,
    metalness: 0.8,
  },
  {
    id: "window-glass",
    name: "Clear Glass",
    color: "#87CEEB",
    roughness: 0.0,
    metalness: 0.0,
  },
  {
    id: "window-frame",
    name: "Window Frame",
    color: "#FFFFFF",
    roughness: 0.4,
    metalness: 0.1,
  },
];

export const useMaterialStore = create<MaterialStore>((set, get) => ({
  // Initial state with default materials
  materials: new Map(
    defaultMaterials.map((material) => [material.id, material])
  ),
  selectedMaterial: null,

  // Actions
  addMaterial: (material: MaterialProperties) => {
    set((state) => {
      const newMaterials = new Map(state.materials);
      newMaterials.set(material.id, material);
      return { materials: newMaterials };
    });
  },

  removeMaterial: (id: string) => {
    set((state) => {
      const newMaterials = new Map(state.materials);
      newMaterials.delete(id);

      // Clear selection if the removed material was selected
      const newSelectedMaterial =
        state.selectedMaterial === id ? null : state.selectedMaterial;

      return {
        materials: newMaterials,
        selectedMaterial: newSelectedMaterial,
      };
    });
  },

  updateMaterial: (id: string, changes: Partial<MaterialProperties>) => {
    set((state) => {
      const existingMaterial = state.materials.get(id);
      if (!existingMaterial) return state;

      const newMaterials = new Map(state.materials);
      const updatedMaterial = { ...existingMaterial, ...changes };
      newMaterials.set(id, updatedMaterial);

      return { materials: newMaterials };
    });
  },

  selectMaterial: (id: string | null) => {
    set({ selectedMaterial: id });
  },

  getMaterial: (id: string) => {
    return get().materials.get(id);
  },

  getAllMaterials: () => {
    return Array.from(get().materials.values());
  },

  applyMaterialToObject: (objectId: string, materialId: string) => {
    const material = get().getMaterial(materialId);
    if (!material) return;

    // This will be implemented to work with the scene store
    // For now, we'll import and use the scene store
    const { useSceneStore } = require("./sceneStore");
    const sceneStore = useSceneStore.getState();

    sceneStore.updateObject(objectId, { material });
  },
}));
