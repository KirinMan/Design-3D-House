/**
 * Mobile Layout Component - Mobile-optimized layout for smaller screens
 * Implements requirements: 1.1, 1.2, 3.4
 */

"use client";

import React, { useState } from "react";
import Viewport3D from "./3DViewport";
import ToolPanel from "./ToolPanel";
import PropertyEditor from "./PropertyEditor";
import { ProjectControls } from "./ProjectControls";
import { useToolStore } from "../stores/toolStore";
import * as THREE from "three";

interface MobileLayoutProps {
  className?: string;
}

type MobilePanel = "viewport" | "tools" | "properties";

export const MobileLayout: React.FC<MobileLayoutProps> = ({ className = "" }) => {
  const [activePanel, setActivePanel] = useState<MobilePanel>("viewport");
  const { activeTool } = useToolStore();

  const panels = [
    {
      id: "viewport" as MobilePanel,
      title: "3D View",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "tools" as MobilePanel,
      title: "Tools",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "properties" as MobilePanel,
      title: "Properties",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`flex flex-col h-screen bg-gray-100 ${className}`}>
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-gray-800">3D House Design</h1>
            <div className="text-xs text-gray-600 capitalize">
              Tool: {activeTool}
            </div>
          </div>
          <ProjectControls />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activePanel === "viewport" && (
          <div className="h-full bg-gray-900">
            <Viewport3D />
          </div>
        )}
        
        {activePanel === "tools" && (
          <div className="h-full overflow-auto p-4">
            <ToolPanel className="h-auto" />
          </div>
        )}
        
        {activePanel === "properties" && (
          <div className="h-full overflow-auto p-4">
            <PropertyEditor className="h-auto" />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                activePanel === panel.id
                  ? "bg-blue-50 text-blue-600 border-t-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {panel.icon}
              <span className="text-xs mt-1 font-medium">{panel.title}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;