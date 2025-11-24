/**
 * Example integration of project management components
 * This shows how to integrate project management into the main application
 */

import React from "react";
import { ProjectControls, useProjectKeyboardShortcuts } from "../ProjectControls";
import { useUnsavedChangesWarning } from "../../hooks/useUnsavedChangesWarning";

export const ProjectIntegrationExample: React.FC = () => {
  // Enable keyboard shortcuts for project operations
  useProjectKeyboardShortcuts();
  
  // Enable unsaved changes warning
  useUnsavedChangesWarning();

  return (
    <div className="h-screen flex flex-col">
      {/* Project Controls at the top */}
      <ProjectControls />
      
      {/* Main application content */}
      <div className="flex-1 flex">
        {/* Sidebar with tools */}
        <div className="w-64 bg-gray-100 border-r">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Tools</h3>
            {/* Tool components would go here */}
            <div className="space-y-2">
              <button className="w-full p-2 text-left bg-white border rounded hover:bg-gray-50">
                Wall Tool
              </button>
              <button className="w-full p-2 text-left bg-white border rounded hover:bg-gray-50">
                Door Tool
              </button>
              <button className="w-full p-2 text-left bg-white border rounded hover:bg-gray-50">
                Window Tool
              </button>
            </div>
          </div>
        </div>
        
        {/* Main 3D viewport */}
        <div className="flex-1 bg-gray-200 flex items-center justify-center">
          <div className="text-gray-500">
            3D Viewport would be rendered here
          </div>
        </div>
        
        {/* Properties panel */}
        <div className="w-64 bg-gray-100 border-l">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Properties</h3>
            {/* Property editor would go here */}
            <div className="text-sm text-gray-500">
              Select an object to edit properties
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Usage instructions:
// 1. Add <ProjectIntegrationExample /> to your main app component
// 2. The ProjectControls component will handle save/load UI
// 3. Keyboard shortcuts (Ctrl+S) will work automatically
// 4. Browser will warn about unsaved changes when navigating away