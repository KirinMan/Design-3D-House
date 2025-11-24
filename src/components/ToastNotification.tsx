/**
 * Toast notification system for user feedback
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
}

export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 5000,
  position = "top-right",
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? defaultDuration,
    };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts, defaultDuration]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Auto-remove toasts after their duration
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    toasts.forEach((toast) => {
      if (toast.duration && toast.duration > 0) {
        const timeout = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [toasts, removeToast]);

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      default:
        return "top-4 right-4";
    }
  };

  const contextValue: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast container */}
      <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full`}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getToastStyles = () => {
    const baseStyles = "relative p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out";
    
    switch (toast.type) {
      case "success":
        return `${baseStyles} bg-green-50 border-green-400 text-green-800`;
      case "error":
        return `${baseStyles} bg-red-50 border-red-400 text-red-800`;
      case "warning":
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case "info":
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-400 text-gray-800`;
    }
  };

  const getIcon = () => {
    const iconClass = "h-5 w-5 mr-2 flex-shrink-0";
    
    switch (toast.type) {
      case "success":
        return (
          <svg className={`${iconClass} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "error":
        return (
          <svg className={`${iconClass} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case "warning":
        return (
          <svg className={`${iconClass} text-yellow-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case "info":
        return (
          <svg className={`${iconClass} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium">{toast.title}</h4>
          {toast.message && (
            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm underline hover:no-underline focus:outline-none"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onRemove}
          className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Convenience hooks for different toast types
export function useToastHelpers() {
  const { addToast } = useToast();

  const showSuccess = useCallback((title: string, message?: string, action?: Toast["action"]) => {
    return addToast({ type: "success", title, message, action });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, action?: Toast["action"]) => {
    return addToast({ type: "error", title, message, action, duration: 8000 });
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string, action?: Toast["action"]) => {
    return addToast({ type: "warning", title, message, action });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, action?: Toast["action"]) => {
    return addToast({ type: "info", title, message, action });
  }, [addToast]);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}