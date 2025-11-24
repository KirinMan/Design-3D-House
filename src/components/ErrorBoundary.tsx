/**
 * React Error Boundary component for catching and handling React errors
 */

import React, { Component, ReactNode } from "react";
import { AppError, ErrorType, ErrorBoundaryState } from "../types/errors";
import { errorHandler } from "../utils/errorHandler";
import { errorRecovery, RecoveryAction } from "../utils/errorRecovery";
import { ErrorDisplay } from "./ErrorDisplay";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, recoveryActions: RecoveryAction[]) => ReactNode;
  onError?: (error: AppError) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryComponentState extends ErrorBoundaryState {
  eventId?: string;
  recoveryActions: RecoveryAction[];
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryComponentState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      eventId: undefined,
      recoveryActions: [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryComponentState> {
    // Convert React error to AppError
    const appError: AppError = {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || "An unexpected error occurred",
      details: {
        name: error.name,
        stack: error.stack,
        componentStack: (error as any).componentStack,
      },
      timestamp: new Date(),
      stack: error.stack,
    };

    // Get recovery actions for this error
    const recoveryActions = errorRecovery.getRecoveryActions(appError);

    return {
      hasError: true,
      error: appError,
      eventId: `error-${Date.now()}-${Math.random()}`,
      recoveryActions,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError: AppError = {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message || "React component error",
      details: {
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
      timestamp: new Date(),
      stack: error.stack,
    };

    // Log the error through our error handler
    errorHandler.handleError(appError);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError);
    }

    // Update state with the error
    this.setState({
      error: appError,
      recoveryActions: errorRecovery.getRecoveryActions(appError),
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys have changed
    if (hasError && resetOnPropsChange && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: undefined,
      eventId: undefined,
      recoveryActions: [],
    });
  };

  handleRecoveryAction = async (action: RecoveryAction) => {
    try {
      await action.action();
      
      // If recovery action succeeds, reset the error boundary
      this.resetErrorBoundary();
    } catch (recoveryError) {
      console.error("Recovery action failed:", recoveryError);
      
      // Create a new error for the failed recovery
      const failedRecoveryError: AppError = {
        type: ErrorType.UNKNOWN_ERROR,
        message: `Recovery action "${action.label}" failed`,
        details: {
          originalError: this.state.error,
          recoveryError,
          actionLabel: action.label,
        },
        timestamp: new Date(),
      };

      errorHandler.handleError(failedRecoveryError);

      // Update state with the new error
      this.setState({
        error: failedRecoveryError,
        recoveryActions: errorRecovery.getRecoveryActions(failedRecoveryError),
      });
    }
  };

  render() {
    const { hasError, error, recoveryActions } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, recoveryActions);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                The application encountered an unexpected error.
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <ErrorDisplay
                error={error}
                recoveryActions={recoveryActions}
                onRecoveryAction={this.handleRecoveryAction}
                className="mb-4"
              />

              <div className="mt-6">
                <button
                  onClick={this.resetErrorBoundary}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for manually triggering error boundary
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    setError(errorObj);
  }, []);

  return captureError;
}

// Specialized error boundaries for different parts of the app
export function ThreeDErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, recoveryActions) => (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="max-w-md">
            <ErrorDisplay
              error={error}
              recoveryActions={recoveryActions}
              onRecoveryAction={async (action) => {
                await action.action();
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
      onError={(error) => {
        // Log 3D-specific errors with additional context
        console.error("3D Viewport Error:", error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ToolErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, recoveryActions) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-2">
            Tool Error
          </h3>
          <p className="text-sm text-red-700 mb-3">{error.message}</p>
          <div className="flex space-x-2">
            {recoveryActions.slice(0, 2).map((action, index) => (
              <button
                key={index}
                onClick={() => action.action()}
                className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}