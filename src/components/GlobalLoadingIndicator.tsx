/**
 * Global loading indicator that shows active operations
 */

import React from "react";
import { useLoadingStore } from "../stores/loadingStore";
import { LoadingOverlay, ProgressBar } from "./LoadingIndicator";

export function GlobalLoadingIndicator() {
  const operations = useLoadingStore((state) => state.getAllOperations());
  const cancelOperation = useLoadingStore((state) => state.cancelOperation);

  // Show overlay for export operations or when there are multiple operations
  const showOverlay = operations.some(op => op.type === "export") || operations.length > 1;
  const primaryOperation = operations.find(op => op.type === "export") || operations[0];

  if (operations.length === 0) {
    return null;
  }

  if (showOverlay && primaryOperation) {
    return (
      <LoadingOverlay
        isVisible={true}
        message={primaryOperation.message}
        progress={primaryOperation.progress}
        onCancel={primaryOperation.canCancel ? () => cancelOperation(primaryOperation.id) : undefined}
      />
    );
  }

  // Show compact indicators for other operations
  return (
    <div className="fixed bottom-4 left-4 z-40 space-y-2 max-w-sm">
      {operations.map((operation) => (
        <CompactLoadingIndicator
          key={operation.id}
          operation={operation}
          onCancel={operation.canCancel ? () => cancelOperation(operation.id) : undefined}
        />
      ))}
    </div>
  );
}

interface CompactLoadingIndicatorProps {
  operation: {
    id: string;
    type: string;
    message: string;
    progress?: number;
    canCancel?: boolean;
  };
  onCancel?: () => void;
}

function CompactLoadingIndicator({ operation, onCancel }: CompactLoadingIndicatorProps) {
  const getTypeColor = () => {
    switch (operation.type) {
      case "export":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "save":
        return "bg-green-50 border-green-200 text-green-800";
      case "load":
        return "bg-purple-50 border-purple-200 text-purple-800";
      case "3d-operation":
        return "bg-orange-50 border-orange-200 text-orange-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <div className={`p-3 rounded-lg border shadow-sm ${getTypeColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          <span className="text-sm font-medium truncate">{operation.message}</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="ml-2 text-current hover:opacity-70 focus:outline-none"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {typeof operation.progress === "number" && (
        <div className="mt-2">
          <ProgressBar
            progress={operation.progress}
            showPercentage={false}
            className="h-1"
          />
        </div>
      )}
    </div>
  );
}

// Hook to easily show loading states for async operations
export function useAsyncOperation() {
  const { startOperation, updateOperation, finishOperation } = useLoadingStore();

  const withLoading = async <T,>(
    operation: () => Promise<T>,
    config: {
      type?: "export" | "import" | "save" | "load" | "3d-operation" | "general";
      message: string;
      onProgress?: (progress: number) => void;
      onCancel?: () => void;
    }
  ): Promise<T> => {
    const operationId = startOperation({
      type: config.type || "general",
      message: config.message,
      progress: config.onProgress ? 0 : undefined,
      canCancel: !!config.onCancel,
      onCancel: config.onCancel,
    });

    try {
      // Set up progress callback if provided
      if (config.onProgress) {
        const originalOnProgress = config.onProgress;
        config.onProgress = (progress: number) => {
          updateOperation(operationId, { progress });
          originalOnProgress(progress);
        };
      }

      const result = await operation();
      return result;
    } finally {
      finishOperation(operationId);
    }
  };

  return { withLoading };
}