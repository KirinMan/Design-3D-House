/**
 * Component for displaying errors with recovery options
 */

import React from "react";
import { AppError } from "../types/errors";
import { RecoveryAction } from "../utils/errorRecovery";

interface ErrorDisplayProps {
  error: AppError;
  recoveryActions: RecoveryAction[];
  onRecoveryAction: (action: RecoveryAction) => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorDisplay({
  error,
  recoveryActions,
  onRecoveryAction,
  onDismiss,
  className = "",
}: ErrorDisplayProps) {
  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case "SCENE_LOAD_ERROR":
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case "EXPORT_ERROR":
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "STORAGE_ERROR":
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        );
      case "GEOMETRY_ERROR":
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getErrorTypeLabel = (errorType: string) => {
    switch (errorType) {
      case "SCENE_LOAD_ERROR":
        return "Scene Loading Error";
      case "EXPORT_ERROR":
        return "Export Error";
      case "STORAGE_ERROR":
        return "Storage Error";
      case "GEOMETRY_ERROR":
        return "Geometry Error";
      case "MATERIAL_ERROR":
        return "Material Error";
      case "TOOL_ERROR":
        return "Tool Error";
      case "VALIDATION_ERROR":
        return "Validation Error";
      case "NETWORK_ERROR":
        return "Network Error";
      default:
        return "Error";
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon(error.type)}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-red-800">
              {getErrorTypeLabel(error.type)}
            </h3>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-red-700">{error.message}</p>
          
          {process.env.NODE_ENV === "development" && error.details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">
                Technical details
              </summary>
              <pre className="mt-1 text-xs text-red-500 bg-red-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}

          {recoveryActions.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {recoveryActions
                  .filter(action => action.isPrimary)
                  .slice(0, 2)
                  .map((action, index) => (
                    <button
                      key={index}
                      onClick={() => onRecoveryAction(action)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {action.label}
                    </button>
                  ))}
              </div>

              {recoveryActions.filter(action => !action.isPrimary).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                    More options
                  </summary>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {recoveryActions
                      .filter(action => !action.isPrimary)
                      .map((action, index) => (
                        <button
                          key={index}
                          onClick={() => onRecoveryAction(action)}
                          className="inline-flex items-center px-2 py-1 text-xs text-red-700 hover:text-red-900 hover:bg-red-100 rounded"
                        >
                          {action.label}
                        </button>
                      ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact version for inline errors
export function ErrorDisplayCompact({
  error,
  recoveryActions,
  onRecoveryAction,
  onDismiss,
  className = "",
}: ErrorDisplayProps) {
  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-4 w-4 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm text-red-700">{error.message}</span>
        </div>
        <div className="flex items-center space-x-2">
          {recoveryActions
            .filter(action => action.isPrimary)
            .slice(0, 1)
            .map((action, index) => (
              <button
                key={index}
                onClick={() => onRecoveryAction(action)}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                {action.label}
              </button>
            ))}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}