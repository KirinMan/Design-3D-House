/**
 * Lighting Store - Manages lighting settings and modes
 * Implements requirements: 5.2, 5.4
 */

import { create } from "zustand";

export type LightingMode = "realistic" | "basic" | "studio" | "outdoor";

export interface LightingSettings {
  mode: LightingMode;
  ambientIntensity: number;
  directionalIntensity: number;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  sunPosition: {
    azimuth: number; // 0-360 degrees
    elevation: number; // 0-90 degrees
  };
  timeOfDay: number; // 0-24 hours
}

export interface LightingStore {
  // Lighting state
  settings: LightingSettings;

  // Actions
  setLightingMode: (mode: LightingMode) => void;
  updateSettings: (changes: Partial<LightingSettings>) => void;
  setAmbientIntensity: (intensity: number) => void;
  setDirectionalIntensity: (intensity: number) => void;
  toggleShadows: () => void;
  setSunPosition: (azimuth: number, elevation: number) => void;
  setTimeOfDay: (hour: number) => void;
  resetToDefaults: () => void;
}

// Default lighting settings for different modes
const lightingModeDefaults: Record<LightingMode, LightingSettings> = {
  realistic: {
    mode: "realistic",
    ambientIntensity: 0.3,
    directionalIntensity: 1.0,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    sunPosition: { azimuth: 135, elevation: 45 },
    timeOfDay: 12,
  },
  basic: {
    mode: "basic",
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    shadowsEnabled: false,
    shadowMapSize: 1024,
    sunPosition: { azimuth: 0, elevation: 90 },
    timeOfDay: 12,
  },
  studio: {
    mode: "studio",
    ambientIntensity: 0.4,
    directionalIntensity: 1.2,
    shadowsEnabled: true,
    shadowMapSize: 4096,
    sunPosition: { azimuth: 45, elevation: 60 },
    timeOfDay: 12,
  },
  outdoor: {
    mode: "outdoor",
    ambientIntensity: 0.2,
    directionalIntensity: 1.5,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    sunPosition: { azimuth: 180, elevation: 30 },
    timeOfDay: 14,
  },
};

export const useLightingStore = create<LightingStore>((set, get) => ({
  // Initial state with realistic lighting
  settings: lightingModeDefaults.realistic,

  // Actions
  setLightingMode: (mode: LightingMode) => {
    set({ settings: lightingModeDefaults[mode] });
  },

  updateSettings: (changes: Partial<LightingSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...changes },
    }));
  },

  setAmbientIntensity: (intensity: number) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ambientIntensity: Math.max(0, Math.min(2, intensity)),
      },
    }));
  },

  setDirectionalIntensity: (intensity: number) => {
    set((state) => ({
      settings: {
        ...state.settings,
        directionalIntensity: Math.max(0, Math.min(3, intensity)),
      },
    }));
  },

  toggleShadows: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        shadowsEnabled: !state.settings.shadowsEnabled,
      },
    }));
  },

  setSunPosition: (azimuth: number, elevation: number) => {
    set((state) => ({
      settings: {
        ...state.settings,
        sunPosition: {
          azimuth: Math.max(0, Math.min(360, azimuth)),
          elevation: Math.max(0, Math.min(90, elevation)),
        },
      },
    }));
  },

  setTimeOfDay: (hour: number) => {
    const clampedHour = Math.max(0, Math.min(24, hour));

    // Calculate sun position based on time of day
    const azimuth = (hour - 6) * 15; // Sun moves 15 degrees per hour, starting east at 6 AM
    const elevation = Math.max(0, Math.sin(((hour - 6) * Math.PI) / 12) * 90);

    // Adjust lighting intensity based on time of day
    let directionalIntensity = 1.0;
    let ambientIntensity = 0.3;

    if (hour < 6 || hour > 18) {
      // Night time
      directionalIntensity = 0.1;
      ambientIntensity = 0.1;
    } else if (hour < 8 || hour > 16) {
      // Dawn/dusk
      directionalIntensity = 0.6;
      ambientIntensity = 0.2;
    }

    set((state) => ({
      settings: {
        ...state.settings,
        timeOfDay: clampedHour,
        sunPosition: { azimuth, elevation },
        directionalIntensity,
        ambientIntensity,
      },
    }));
  },

  resetToDefaults: () => {
    const currentMode = get().settings.mode;
    set({ settings: lightingModeDefaults[currentMode] });
  },
}));
