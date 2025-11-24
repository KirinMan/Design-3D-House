/**
 * Main Application Layout Component
 * Implements requirements: 1.1, 1.2, 3.4
 * 
 * Features:
 * - Responsive design with collapsible sidebar panels
 * - Keyboard shortcuts for common operations
 * - Integration of all major components
 * - Professional layout structure
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import Viewport3D from "./3DViewport";
import ToolPanel from "./ToolPanel";
import PropertyEditor from "./PropertyEditor";
import { ProjectControls, useProjectKeyboardShortcuts } from "./ProjectControls";
import { MaterialPanel } from "./MaterialPanel";
import { LightingPanel } from "./LightingPanel";
import ExportPanel from "./ExportPanel";
import { useToolStore } from "../stores/toolStore";
import { useSceneStore } from "../stores/sceneStore";
import { useCameraStore } from "../stores/cameraStore";
import KeyboardShortcuts, { useKeyboardShortcutsHelp } from "./KeyboardShortcuts";
import * as THREE from "three";

interface MainLayoutProps {
  className?: string;
}

type PanelType = "tools" | "properties" | "materials" | "lighting" | "export";

interface PanelConfig {
  id: PanelType;
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ className?: string }>;
  defaultOpen: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className = "" }) => {
  // Panel state management
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeLeftPanel, setActiveLeftPanel] = useState<PanelType>("tools");
  const [activeRightPanel, setActiveRightPanel] = useState<PanelType>("properties");
  const [fullscreenViewport, setFullscreenViewport] = useState(false);

  // 3D viewport refs for export functionality
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);

  // Store hooks
  const { activeTool, setActiveTool } = useToolStore();
  const { clearScene } = useSceneStore();
  const { resetCamera } = useCameraStore();

  // Enable project keyboard shortcuts
  useProjectKeyboardShortcuts();

  // Keyboard shortcuts help
  const { isOpen: isHelpOpen, openHelp, closeHelp } = useKeyboardShortcutsHelp();

  // Panel configurations
  const leftPanels: PanelConfig[] = [
    {
      id: "tools",
      title: "Tools",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      component: ToolPanel,
      defaultOpen: true,
    },
    {
      id: "materials",
      title: "Materials",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
      ),
      component: MaterialPanel,
      defaultOpen: false,
    },
    {
      id: "lighting",
      title: "Lighting",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      component: LightingPanel,
      defaultOpen: false,
    },
  ];

  const rightPanels: PanelConfig[] = [
    {
      id: "properties",
      title: "Properties",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
      component: PropertyEditor,
      defaultOpen: true,
    },
    {
      id: "export",
      title: "Export",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      component: (props: { className?: string }) => (
        <ExportPanel
          {...props}
          renderer={rendererRef.current || undefined}
          scene={sceneRef.current || undefined}
          camera={cameraRef.current || undefined}
        />
      ),
      defaultOpen: false,
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case "s":
            event.preventDefault();
            setActiveTool("select");
            break;
          case "w":
            event.preventDefault();
            setActiveTool("wall");
            break;
          case "d":
            event.preventDefault();
            setActiveTool("door");
            break;
          case "n":
            event.preventDefault();
            setActiveTool("window");
            break;
          case "r":
            event.preventDefault();
            setActiveTool("room");
            break;
        }
      }

      // Panel shortcuts (Alt + key)
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "1":
            event.preventDefault();
            setLeftPanelOpen(!leftPanelOpen);
            break;
          case "2":
            event.preventDefault();
            setRightPanelOpen(!rightPanelOpen);
            break;
          case "f":
            event.preventDefault();
            setFullscreenViewport(!fullscreenViewport);
            break;
        }
      }

      // View shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "r":
            if (!event.shiftKey) {
              event.preventDefault();
              resetCamera();
            }
            break;
          case "delete":
          case "backspace":
            if (event.shiftKey) {
              event.preventDefault();
              if (confirm("Clear entire scene? This cannot be undone.")) {
                clearScene();
              }
            }
            break;
        }
      }

      // Escape key
      if (event.key === "Escape") {
        setFullscreenViewport(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    leftPanelOpen,
    rightPanelOpen,
    fullscreenViewport,
    setActiveTool,
    resetCamera,
    clearScene,
  ]);

  // Panel rendering helper
  const renderPanel = (panels: PanelConfig[], activePanel: PanelType, setActivePanel: (panel: PanelType) => void) => {
    const activePanelConfig = panels.find(p => p.id === activePanel);
    const ActiveComponent = activePanelConfig?.component;

    return (
      <div className="flex flex-col h-full">
        {/* Panel tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activePanel === panel.id
                  ? "border-blue-500 text-blue-600 bg-white"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
              title={panel.title}
            >
              {panel.icon}
              <span className="hidden sm:inline">{panel.title}</span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-auto">
          {ActiveComponent && <ActiveComponent className="h-full" />}
        </div>
      </div>
    );
  };

  // Fullscreen viewport mode
  if (fullscreenViewport) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setFullscreenViewport(false)}
            className="px-3 py-2 bg-white bg-opacity-90 text-gray-800 rounded-md hover:bg-opacity-100 transition-all"
            title="Exit Fullscreen (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <Viewport3D
          onRendererReady={(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
            rendererRef.current = renderer;
            sceneRef.current = scene;
            cameraRef.current = camera;
          }}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-100 ${className}`}>
      {/* Header with project controls */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">3D House Design</h1>
            
            {/* Panel toggle buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className={`p-2 rounded-md transition-colors ${
                  leftPanelOpen ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Toggle Left Panel (Alt+1)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <button
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className={`p-2 rounded-md transition-colors ${
                  rightPanelOpen ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Toggle Right Panel (Alt+2)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                onClick={() => setFullscreenViewport(true)}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Fullscreen Viewport (Alt+F)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>

              <button
                onClick={openHelp}
                className="p-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Keyboard Shortcuts (? or F1)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>

          <ProjectControls />
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        {leftPanelOpen && (
          <aside className="w-80 bg-white border-r border-gray-200 shadow-sm">
            {renderPanel(leftPanels, activeLeftPanel, setActiveLeftPanel)}
          </aside>
        )}

        {/* Main viewport */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-900">
            <Viewport3D
              onRendererReady={(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
                rendererRef.current = renderer;
                sceneRef.current = scene;
                cameraRef.current = camera;
              }}
            />
          </div>

          {/* Status bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Tool: <span className="font-medium capitalize">{activeTool}</span></span>
                <span>|</span>
                <span>Shortcuts: S-Select, W-Wall, D-Door, N-Window, R-Room</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Ctrl+R: Reset View</span>
                <span>|</span>
                <span>Alt+F: Fullscreen</span>
              </div>
            </div>
          </div>
        </main>

        {/* Right sidebar */}
        {rightPanelOpen && (
          <aside className="w-80 bg-white border-l border-gray-200 shadow-sm">
            {renderPanel(rightPanels, activeRightPanel, setActiveRightPanel)}
          </aside>
        )}
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcuts isOpen={isHelpOpen} onClose={closeHelp} />
    </div>
  );
};

export default MainLayout;