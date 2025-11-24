/**
 * Lighting Panel Component - UI controls for lighting settings
 * Implements requirements: 5.2, 5.4
 */

"use client";

import React from "react";
import { useLightingStore, LightingMode } from "../stores/lightingStore";

interface LightingPanelProps {
  className?: string;
}

export const LightingPanel: React.FC<LightingPanelProps> = ({ className = "" }) => {
  const {
    settings,
    setLightingMode,
    setAmbientIntensity,
    setDirectionalIntensity,
    toggleShadows,
    setSunPosition,
    setTimeOfDay,
    resetToDefaults,
  } = useLightingStore();

  const lightingModes: { value: LightingMode; label: string; description: string }[] = [
    { value: "realistic", label: "Realistic", description: "Natural lighting with shadows" },
    { value: "basic", label: "Basic", description: "Simple lighting, no shadows" },
    { value: "studio", label: "Studio", description: "Professional studio lighting" },
    { value: "outdoor", label: "Outdoor", description: "Bright outdoor lighting" },
  ];

  const formatTime = (hour: number): string => {
    const h = Math.floor(hour);
    const m = Math.floor((hour - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`bg-white border border-gray-300 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Lighting</h3>

      {/* Lighting Mode Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Lighting Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {lightingModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setLightingMode(mode.value)}
              className={`p-2 text-sm rounded border ${
                settings.mode === mode.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              title={mode.description}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time of Day */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Time of Day: {formatTime(settings.timeOfDay)}
        </label>
        <input
          type="range"
          min="0"
          max="24"
          step="0.5"
          value={settings.timeOfDay}
          onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>00:00</span>
          <span>12:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* Sun Position */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Sun Position</label>
        
        <div className="mb-2">
          <label className="block text-xs text-gray-600 mb-1">
            Azimuth: {settings.sunPosition.azimuth}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={settings.sunPosition.azimuth}
            onChange={(e) =>
              setSunPosition(parseInt(e.target.value), settings.sunPosition.elevation)
            }
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Elevation: {settings.sunPosition.elevation}°
          </label>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={settings.sunPosition.elevation}
            onChange={(e) =>
              setSunPosition(settings.sunPosition.azimuth, parseInt(e.target.value))
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Light Intensities */}
      <div className="mb-4">
        <div className="mb-2">
          <label className="block text-sm font-medium mb-1">
            Ambient Light: {settings.ambientIntensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.ambientIntensity}
            onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Directional Light: {settings.directionalIntensity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={settings.directionalIntensity}
            onChange={(e) => setDirectionalIntensity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Shadow Settings */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Shadows</label>
          <button
            onClick={toggleShadows}
            className={`px-3 py-1 rounded text-sm ${
              settings.shadowsEnabled
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            {settings.shadowsEnabled ? "On" : "Off"}
          </button>
        </div>
        
        {settings.shadowsEnabled && (
          <div className="text-xs text-gray-600">
            Shadow Quality: {settings.shadowMapSize}px
          </div>
        )}
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Quick Presets</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTimeOfDay(8)}
            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
          >
            Morning
          </button>
          <button
            onClick={() => setTimeOfDay(12)}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Noon
          </button>
          <button
            onClick={() => setTimeOfDay(18)}
            className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded hover:bg-orange-200"
          >
            Evening
          </button>
          <button
            onClick={() => setTimeOfDay(22)}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
          >
            Night
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetToDefaults}
        className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Reset to Defaults
      </button>
    </div>
  );
};