/**
 * Loading Store - Manages global loading states for various operations
 */

import { create } from "zustand";

export interface LoadingOperation {
  id: string;
  type: "export" | "import" | "save" | "load" | "3d-operation" | "general";
  message: string;
  progress?: number;
  startTime: number;
  canCancel?: boolean;
  onCancel?: () => void;
}

interface LoadingStore {
  operations: Map<string, LoadingOperation>;

  // Actions
  startOperation: (
    operation: Omit<LoadingOperation, "id" | "startTime">
  ) => string;
  updateOperation: (id: string, updates: Partial<LoadingOperation>) => void;
  finishOperation: (id: string) => void;
  cancelOperation: (id: string) => void;

  // Getters
  isLoading: (type?: LoadingOperation["type"]) => boolean;
  getOperation: (id: string) => LoadingOperation | undefined;
  getOperationsByType: (type: LoadingOperation["type"]) => LoadingOperation[];
  getAllOperations: () => LoadingOperation[];
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  operations: new Map<string, LoadingOperation>(),

  startOperation: (operation) => {
    const id = `${operation.type}-${Date.now()}-${Math.random()}`;
    const fullOperation: LoadingOperation = {
      ...operation,
      id,
      startTime: Date.now(),
    };

    set((state) => {
      const newOperations = new Map(state.operations);
      newOperations.set(id, fullOperation);
      return { operations: newOperations };
    });

    return id;
  },

  updateOperation: (id, updates) => {
    set((state) => {
      const operation = state.operations.get(id);
      if (!operation) return state;

      const newOperations = new Map(state.operations);
      newOperations.set(id, { ...operation, ...updates });
      return { operations: newOperations };
    });
  },

  finishOperation: (id) => {
    set((state) => {
      const newOperations = new Map(state.operations);
      newOperations.delete(id);
      return { operations: newOperations };
    });
  },

  cancelOperation: (id) => {
    const operation = get().operations.get(id);
    if (operation?.onCancel) {
      operation.onCancel();
    }
    get().finishOperation(id);
  },

  isLoading: (type) => {
    const operations = get().operations;
    if (!type) {
      return operations.size > 0;
    }
    return Array.from(operations.values()).some((op) => op.type === type);
  },

  getOperation: (id) => {
    return get().operations.get(id);
  },

  getOperationsByType: (type) => {
    return Array.from(get().operations.values()).filter(
      (op) => op.type === type
    );
  },

  getAllOperations: () => {
    return Array.from(get().operations.values());
  },
}));

// Hook for managing a specific loading operation
export function useLoadingOperation() {
  const { startOperation, updateOperation, finishOperation, cancelOperation } =
    useLoadingStore();

  const start = (operation: Omit<LoadingOperation, "id" | "startTime">) => {
    return startOperation(operation);
  };

  const update = (id: string, updates: Partial<LoadingOperation>) => {
    updateOperation(id, updates);
  };

  const finish = (id: string) => {
    finishOperation(id);
  };

  const cancel = (id: string) => {
    cancelOperation(id);
  };

  return { start, update, finish, cancel };
}

// Hook for export operations with progress tracking
export function useExportOperation() {
  const { start, update, finish, cancel } = useLoadingOperation();

  const startExport = (format: string, onCancel?: () => void) => {
    return start({
      type: "export",
      message: `Exporting ${format.toUpperCase()} file...`,
      progress: 0,
      canCancel: true,
      onCancel,
    });
  };

  const updateExportProgress = (
    id: string,
    progress: number,
    message?: string
  ) => {
    update(id, {
      progress: Math.max(0, Math.min(100, progress)),
      ...(message && { message }),
    });
  };

  const finishExport = (id: string) => {
    finish(id);
  };

  const cancelExport = (id: string) => {
    cancel(id);
  };

  return {
    startExport,
    updateExportProgress,
    finishExport,
    cancelExport,
  };
}

// Hook for 3D operations
export function use3DOperation() {
  const { start, update, finish } = useLoadingOperation();

  const start3DOperation = (message: string) => {
    return start({
      type: "3d-operation",
      message,
      canCancel: false,
    });
  };

  const finish3DOperation = (id: string) => {
    finish(id);
  };

  return {
    start3DOperation,
    finish3DOperation,
  };
}

// Hook for save/load operations
export function useSaveLoadOperation() {
  const { start, update, finish } = useLoadingOperation();

  const startSave = (projectName?: string) => {
    return start({
      type: "save",
      message: projectName ? `Saving "${projectName}"...` : "Saving project...",
      canCancel: false,
    });
  };

  const startLoad = (projectName?: string) => {
    return start({
      type: "load",
      message: projectName
        ? `Loading "${projectName}"...`
        : "Loading project...",
      canCancel: false,
    });
  };

  const finishSave = (id: string) => {
    finish(id);
  };

  const finishLoad = (id: string) => {
    finish(id);
  };

  return {
    startSave,
    startLoad,
    finishSave,
    finishLoad,
  };
}
