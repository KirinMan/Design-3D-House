/**
 * Scene Store - Manages 3D scene objects and operations
 * Implements requirements: 1.2, 2.1, 2.4, 4.2, 4.3
 */

import { create } from "zustand";
import { SceneObject, SceneData, SceneSettings } from "../types/scene";
import {
  withSceneErrorHandling,
  withGeometryErrorHandling,
  validateStoreOperation,
  safeStoreAccess,
} from "../utils/storeErrorHandling";
import { errorHandler } from "../utils/errorHandler";
import { ErrorType } from "../types/errors";

export interface SelectedOpening {
  wallId: string;
  openingId: string;
  type: "door" | "window";
}

export interface SceneStore {
  // Scene data
  objects: Map<string, SceneObject>;
  selectedObjects: string[];
  selectedOpening: SelectedOpening | null;

  // Actions
  addObject: (object: SceneObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, changes: Partial<SceneObject>) => void;
  selectObjects: (ids: string[]) => void;
  selectOpening: (opening: SelectedOpening | null) => void;

  // Scene operations
  clearScene: () => void;
  loadScene: (sceneData: SceneData) => void;
  exportScene: () => SceneData;
}

const defaultSceneSettings: SceneSettings = {
  gridSize: 1,
  snapToGrid: true,
  units: "metric",
  lightingMode: "realistic",
};

export const useSceneStore = create<SceneStore>((set, get) => ({
  // Initial state
  objects: new Map<string, SceneObject>(),
  selectedObjects: [],
  selectedOpening: null,

  // Actions
  addObject: withGeometryErrorHandling((object: SceneObject) => {
    // Validate object before adding
    validateStoreOperation(
      object,
      (obj) => obj && obj.id && obj.type && obj.position,
      "Invalid scene object: missing required properties",
      "object"
    );

    set((state) => {
      // Check for duplicate IDs
      if (state.objects.has(object.id)) {
        throw errorHandler.createAppError(
          ErrorType.VALIDATION_ERROR,
          `Object with ID "${object.id}" already exists`,
          { objectId: object.id, existingObject: state.objects.get(object.id) }
        );
      }

      const newObjects = new Map(state.objects);
      newObjects.set(object.id, object);
      return { objects: newObjects };
    });
  }, "add object to scene"),

  removeObject: withSceneErrorHandling((id: string) => {
    validateStoreOperation(
      id,
      (objId) => typeof objId === "string" && objId.length > 0,
      "Invalid object ID for removal",
      "objectId"
    );

    set((state) => {
      if (!state.objects.has(id)) {
        console.warn(`Attempted to remove non-existent object: ${id}`);
        return state;
      }

      const newObjects = new Map(state.objects);
      newObjects.delete(id);

      // Remove from selection if selected
      const newSelectedObjects = state.selectedObjects.filter(
        (selectedId) => selectedId !== id
      );

      return {
        objects: newObjects,
        selectedObjects: newSelectedObjects,
      };
    });
  }, "remove object from scene"),

  updateObject: withGeometryErrorHandling(
    (id: string, changes: Partial<SceneObject>) => {
      validateStoreOperation(
        id,
        (objId) => typeof objId === "string" && objId.length > 0,
        "Invalid object ID for update",
        "objectId"
      );

      validateStoreOperation(
        changes,
        (ch) => ch && typeof ch === "object",
        "Invalid changes object for update",
        "changes"
      );

      set((state) => {
        const existingObject = state.objects.get(id);
        if (!existingObject) {
          throw errorHandler.createAppError(
            ErrorType.GEOMETRY_ERROR,
            `Cannot update non-existent object: ${id}`,
            { objectId: id, changes }
          );
        }

        const newObjects = new Map(state.objects);
        const updatedObject = { ...existingObject, ...changes };

        // Validate the updated object
        validateStoreOperation(
          updatedObject,
          (obj) => obj && obj.id && obj.type && obj.position,
          "Updated object is invalid: missing required properties",
          "updatedObject"
        );

        newObjects.set(id, updatedObject);

        return { objects: newObjects };
      });
    },
    "update scene object"
  ),

  selectObjects: withSceneErrorHandling((ids: string[]) => {
    validateStoreOperation(
      ids,
      (idArray) => Array.isArray(idArray),
      "Selection must be an array of object IDs",
      "selectedObjects"
    );

    // Validate that all IDs exist in the scene
    const state = get();
    const invalidIds = ids.filter((id) => !state.objects.has(id));
    if (invalidIds.length > 0) {
      console.warn(
        `Attempted to select non-existent objects: ${invalidIds.join(", ")}`
      );
      // Filter out invalid IDs instead of throwing error
      const validIds = ids.filter((id) => state.objects.has(id));
      set({ selectedObjects: validIds, selectedOpening: null });
      return;
    }

    set({ selectedObjects: ids, selectedOpening: null });
  }, "select scene objects"),

  selectOpening: withSceneErrorHandling((opening: SelectedOpening | null) => {
    if (opening) {
      validateStoreOperation(
        opening,
        (op) => op && op.wallId && op.openingId && op.type,
        "Invalid opening selection: missing required properties",
        "selectedOpening"
      );

      // Validate that the wall exists
      const state = get();
      if (!state.objects.has(opening.wallId)) {
        throw errorHandler.createAppError(
          ErrorType.VALIDATION_ERROR,
          `Cannot select opening: wall "${opening.wallId}" does not exist`,
          { opening }
        );
      }
    }

    set({ selectedOpening: opening, selectedObjects: [] });
  }, "select opening"),

  // Scene operations
  clearScene: withSceneErrorHandling(() => {
    set({
      objects: new Map<string, SceneObject>(),
      selectedObjects: [],
      selectedOpening: null,
    });
  }, "clear scene"),

  loadScene: withSceneErrorHandling((sceneData: SceneData) => {
    validateStoreOperation(
      sceneData,
      (data) => data && Array.isArray(data.objects),
      "Invalid scene data: missing or invalid objects array",
      "sceneData"
    );

    const objectsMap = new Map<string, SceneObject>();

    // Validate each object before adding
    sceneData.objects.forEach((obj, index) => {
      try {
        validateStoreOperation(
          obj,
          (object) => object && object.id && object.type && object.position,
          `Invalid object at index ${index}: missing required properties`,
          `objects[${index}]`
        );

        if (objectsMap.has(obj.id)) {
          throw errorHandler.createAppError(
            ErrorType.VALIDATION_ERROR,
            `Duplicate object ID "${obj.id}" found in scene data`,
            { objectId: obj.id, index }
          );
        }

        objectsMap.set(obj.id, obj);
      } catch (error) {
        console.error(`Skipping invalid object at index ${index}:`, error);
        // Continue loading other objects instead of failing completely
      }
    });

    set({
      objects: objectsMap,
      selectedObjects: [],
      selectedOpening: null,
    });
  }, "load scene"),

  exportScene: withSceneErrorHandling((): SceneData => {
    const state = safeStoreAccess(
      () => get(),
      { objects: new Map(), selectedObjects: [], selectedOpening: null },
      "Failed to access scene state for export"
    );

    const { useMaterialStore } = require("./materialStore");
    const materialStore = safeStoreAccess(
      () => useMaterialStore.getState(),
      { getAllMaterials: () => [] },
      "Failed to access material store for export"
    );

    const objects = Array.from(state.objects.values());

    // Validate objects before export
    const validObjects = objects.filter((obj, index) => {
      try {
        validateStoreOperation(
          obj,
          (object) => object && object.id && object.type && object.position,
          `Invalid object for export at index ${index}`,
          `objects[${index}]`
        );
        return true;
      } catch (error) {
        console.warn(`Excluding invalid object from export:`, error);
        return false;
      }
    });

    return {
      objects: validObjects,
      materials: materialStore.getAllMaterials(),
      settings: defaultSceneSettings,
    };
  }, "export scene"),
}));
