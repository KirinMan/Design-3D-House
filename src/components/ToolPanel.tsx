/**
 * ToolPanel Component - Tool selection panel with icons and tooltips
 * Implements requirements: 2.1, 2.4
 */

"use client";

import React, { useState } from "react";
import { useToolStore } from "../stores/toolStore";
import { ToolType } from "../types/tools";
import { useToastHelpers } from "./ToastNotification";

interface ToolPanelProps {
  className?: string;
}

interface ToolDefinition {
  type: ToolType;
  label: string;
  icon: React.ReactNode;
  tooltip: string;
  description: string;
}

export default function ToolPanel({ className = "" }: ToolPanelProps) {
  const { activeTool, setActiveTool } = useToolStore();
  const [hoveredTool, setHoveredTool] = useState<ToolType | null>(null);
  const { showInfo } = useToastHelpers();

  const handleToolChange = (toolType: ToolType) => {
    if (toolType === activeTool) return;
    
    setActiveTool(toolType);
    
    // Show feedback when tool changes
    const tool = tools.find(t => t.type === toolType);
    if (tool) {
      showInfo(
        `${tool.label} Tool Selected`,
        tool.description,
        {
          label: "Got it",
          onClick: () => {}, // Toast will auto-dismiss
        }
      );
    }
  };

  const tools: ToolDefinition[] = [
    {
      type: "select",
      label: "Select",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
        </svg>
      ),
      tooltip: "Select and move objects",
      description: "Click to select objects, drag to move"
    },
    {
      type: "wall",
      label: "Wall",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      tooltip: "Draw walls",
      description: "Click and drag to draw walls"
    },
    {
      type: "door",
      label: "Door",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
      tooltip: "Place doors",
      description: "Click on walls to place doors"
    },
    {
      type: "window",
      label: "Window",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      tooltip: "Place windows",
      description: "Click on walls to place windows"
    },
    {
      type: "room",
      label: "Room",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l0-12" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21l0-12" />
        </svg>
      ),
      tooltip: "Create rooms",
      description: "Define room boundaries and properties"
    }
  ];

  const activeTool_def = tools.find(tool => tool.type === activeTool);

  return (
    <div className={`bg-white shadow-lg rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Tools</h3>
      </div>

      {/* Tool buttons */}
      <div className="p-3">
        <div className="grid grid-cols-1 gap-2">
          {tools.map((tool) => (
            <div key={tool.type} className="relative">
              <button
                onClick={() => handleToolChange(tool.type)}
                onMouseEnter={() => setHoveredTool(tool.type)}
                onMouseLeave={() => setHoveredTool(null)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  activeTool === tool.type
                    ? "bg-blue-500 text-white shadow-md transform scale-105"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-sm"
                }`}
                title={tool.tooltip}
              >
                <div className={`flex-shrink-0 ${
                  activeTool === tool.type ? "text-white" : "text-gray-600"
                }`}>
                  {tool.icon}
                </div>
                <span className="font-medium text-sm">{tool.label}</span>
                {activeTool === tool.type && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>

              {/* Tooltip */}
              {hoveredTool === tool.type && activeTool !== tool.type && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 z-50">
                  <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
                    {tool.tooltip}
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                      <div className="border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active tool info */}
      {activeTool_def && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-blue-500">
              {activeTool_def.icon}
            </div>
            <span className="font-semibold text-gray-800 capitalize">
              {activeTool_def.label}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {activeTool_def.description}
          </p>
        </div>
      )}
    </div>
  );
}