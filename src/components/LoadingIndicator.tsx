/**
 * Loading indicator components for various loading states
 */

import React from "react";

interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: Omit<LoadingIndicatorProps, "message">) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

export function LoadingIndicator({ size = "md", message, className = "" }: LoadingIndicatorProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <LoadingSpinner size={size} />
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  message?: string;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  progress, 
  message, 
  className = "", 
  showPercentage = true 
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      {message && (
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-700">{message}</p>
          {showPercentage && (
            <span className="text-sm text-gray-500">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = "Loading...", 
  progress,
  onCancel,
  className = "" 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
          
          {typeof progress === "number" && (
            <ProgressBar 
              progress={progress} 
              className="mb-4"
              showPercentage={true}
            />
          )}
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Specialized loading indicators for 3D operations
export function ThreeDLoadingIndicator({ message = "Loading 3D scene..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <div className="text-center">
        <div className="relative">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function ExportLoadingIndicator({ 
  progress, 
  format,
  onCancel 
}: { 
  progress: number; 
  format: string;
  onCancel?: () => void;
}) {
  return (
    <LoadingOverlay
      isVisible={true}
      message={`Exporting ${format.toUpperCase()} file...`}
      progress={progress}
      onCancel={onCancel}
    />
  );
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [message, setMessage] = React.useState<string>();
  const [progress, setProgress] = React.useState<number>();

  const startLoading = (loadingMessage?: string) => {
    setIsLoading(true);
    setMessage(loadingMessage);
    setProgress(undefined);
  };

  const updateProgress = (newProgress: number, newMessage?: string) => {
    setProgress(newProgress);
    if (newMessage) setMessage(newMessage);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setMessage(undefined);
    setProgress(undefined);
  };

  return {
    isLoading,
    message,
    progress,
    startLoading,
    updateProgress,
    stopLoading,
  };
}

// Higher-order component for adding loading states
export function withLoadingState<P extends object>(
  Component: React.ComponentType<P>,
  loadingMessage?: string
) {
  return function LoadingWrapper(props: P & { isLoading?: boolean }) {
    const { isLoading, ...componentProps } = props;

    if (isLoading) {
      return <LoadingIndicator message={loadingMessage} />;
    }

    return <Component {...(componentProps as P)} />;
  };
}