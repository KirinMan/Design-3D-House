/**
 * Keyboard Shortcuts Component - Help dialog showing available keyboard shortcuts
 * Implements requirements: 3.4
 */

"use client";

import React, { useState, useEffect } from "react";

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: "Tools",
      shortcuts: [
        { keys: ["S"], description: "Select tool" },
        { keys: ["W"], description: "Wall tool" },
        { keys: ["D"], description: "Door tool" },
        { keys: ["N"], description: "Window tool" },
        { keys: ["R"], description: "Room tool" },
      ],
    },
    {
      title: "View",
      shortcuts: [
        { keys: ["Ctrl", "R"], description: "Reset camera view" },
        { keys: ["Alt", "F"], description: "Toggle fullscreen viewport" },
        { keys: ["Alt", "1"], description: "Toggle left panel" },
        { keys: ["Alt", "2"], description: "Toggle right panel" },
        { keys: ["Esc"], description: "Exit fullscreen" },
      ],
    },
    {
      title: "Project",
      shortcuts: [
        { keys: ["Ctrl", "S"], description: "Quick save project" },
        { keys: ["Ctrl", "Shift", "Delete"], description: "Clear scene (with confirmation)" },
      ],
    },
    {
      title: "Selection",
      shortcuts: [
        { keys: ["Click"], description: "Select object" },
        { keys: ["Ctrl", "Click"], description: "Multi-select objects" },
        { keys: ["Click empty space"], description: "Deselect all (in Select mode)" },
      ],
    },
    {
      title: "3D Navigation",
      shortcuts: [
        { keys: ["Mouse drag"], description: "Rotate camera" },
        { keys: ["Mouse wheel"], description: "Zoom in/out" },
        { keys: ["Right-click drag"], description: "Pan camera" },
      ],
    },
  ];

  const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => (
    <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-md shadow-sm">
      {keyName}
    </kbd>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  {group.title}
                </h3>
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, shortcutIndex) => (
                    <div key={shortcutIndex} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 flex-1">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 ml-4">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-gray-400 text-xs mx-1">+</span>
                            )}
                            <KeyBadge keyName={key} />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Shortcuts work when not typing in input fields</li>
                    <li>• Use Ctrl (Windows) or Cmd (Mac) for system shortcuts</li>
                    <li>• Hold Ctrl/Cmd while clicking to select multiple objects</li>
                    <li>• Press ? or F1 to open this help dialog anytime</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to manage keyboard shortcuts help dialog
export const useKeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Open help with ? or F1
      if (event.key === "?" || event.key === "F1") {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    openHelp: () => setIsOpen(true),
    closeHelp: () => setIsOpen(false),
  };
};

export default KeyboardShortcuts;