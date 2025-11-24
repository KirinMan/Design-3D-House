/**
 * Material and Texture Optimization System
 * Implements performance optimization for material and texture loading
 * Requirements: 5.1, 5.2
 */

import * as THREE from "three";

/**
 * Texture cache entry
 */
interface TextureCacheEntry {
  texture: THREE.Texture;
  refCount: number;
  lastUsed: number;
  size: number; // Estimated memory size in bytes
}

/**
 * Material cache entry
 */
interface MaterialCacheEntry {
  material: THREE.Material;
  refCount: number;
  lastUsed: number;
  hash: string;
}

/**
 * Texture optimization configuration
 */
export interface TextureOptimizationConfig {
  maxCacheSize: number; // Maximum cache size in MB
  maxTextureSize: number; // Maximum texture resolution
  enableMipmaps: boolean;
  enableCompression: boolean;
  anisotropy: number;
  cacheTimeout: number; // Time in ms before unused textures are removed
}

/**
 * Default texture optimization configuration
 */
const DEFAULT_TEXTURE_CONFIG: TextureOptimizationConfig = {
  maxCacheSize: 256, // 256 MB
  maxTextureSize: 2048,
  enableMipmaps: true,
  enableCompression: true,
  anisotropy: 4,
  cacheTimeout: 300000, // 5 minutes
};

/**
 * Texture Manager - Handles texture loading, caching, and optimization
 */
export class TextureManager {
  private static instance: TextureManager;
  private textureCache: Map<string, TextureCacheEntry> = new Map();
  private loader: THREE.TextureLoader = new THREE.TextureLoader();
  private config: TextureOptimizationConfig;
  private currentCacheSize: number = 0; // Current cache size in bytes

  private constructor(config?: Partial<TextureOptimizationConfig>) {
    this.config = { ...DEFAULT_TEXTURE_CONFIG, ...config };
    this.setupLoader();
    this.startCleanupTimer();
  }

  static getInstance(
    config?: Partial<TextureOptimizationConfig>
  ): TextureManager {
    if (!TextureManager.instance) {
      TextureManager.instance = new TextureManager(config);
    }
    return TextureManager.instance;
  }

  /**
   * Setup texture loader with optimization settings
   */
  private setupLoader(): void {
    // Configure loader for optimal performance
    this.loader.setCrossOrigin("anonymous");
  }

  /**
   * Load and cache a texture
   */
  async loadTexture(
    url: string,
    options?: {
      flipY?: boolean;
      wrapS?: THREE.Wrapping;
      wrapT?: THREE.Wrapping;
      minFilter?: THREE.TextureFilter;
      magFilter?: THREE.TextureFilter;
    }
  ): Promise<THREE.Texture> {
    // Check cache first
    const cacheEntry = this.textureCache.get(url);
    if (cacheEntry) {
      cacheEntry.refCount++;
      cacheEntry.lastUsed = Date.now();
      return cacheEntry.texture;
    }

    // Load texture
    const texture = await this.loadTextureFromURL(url);

    // Apply optimization settings
    this.optimizeTexture(texture, options);

    // Calculate texture size
    const size = this.estimateTextureSize(texture);

    // Check if we need to free cache space
    await this.ensureCacheSpace(size);

    // Add to cache
    this.textureCache.set(url, {
      texture,
      refCount: 1,
      lastUsed: Date.now(),
      size,
    });

    this.currentCacheSize += size;

    return texture;
  }

  /**
   * Load texture from URL
   */
  private loadTextureFromURL(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error)
      );
    });
  }

  /**
   * Optimize texture settings
   */
  private optimizeTexture(texture: THREE.Texture, options?: any): void {
    // Apply user options
    if (options) {
      if (options.flipY !== undefined) texture.flipY = options.flipY;
      if (options.wrapS !== undefined) texture.wrapS = options.wrapS;
      if (options.wrapT !== undefined) texture.wrapT = options.wrapT;
      if (options.minFilter !== undefined)
        texture.minFilter = options.minFilter;
      if (options.magFilter !== undefined)
        texture.magFilter = options.magFilter;
    }

    // Apply optimization settings
    if (this.config.enableMipmaps) {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
    } else {
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
    }

    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = this.config.anisotropy;

    // Resize texture if too large
    if (texture.image) {
      const { width, height } = texture.image;
      const maxSize = this.config.maxTextureSize;

      if (width > maxSize || height > maxSize) {
        this.resizeTexture(texture, maxSize);
      }
    }
  }

  /**
   * Resize texture to fit within maximum size
   */
  private resizeTexture(texture: THREE.Texture, maxSize: number): void {
    if (!texture.image) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = texture.image;
    const scale = Math.min(maxSize / width, maxSize / height);

    if (scale < 1) {
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);

      ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height);
      texture.image = canvas;
      texture.needsUpdate = true;
    }
  }

  /**
   * Estimate texture memory size
   */
  private estimateTextureSize(texture: THREE.Texture): number {
    if (!texture.image) return 0;

    const { width, height } = texture.image;
    let bytesPerPixel = 4; // RGBA

    // Adjust for different formats
    if (texture.format === THREE.RGBFormat) {
      bytesPerPixel = 3;
    } else if (texture.format === THREE.LuminanceFormat) {
      bytesPerPixel = 1;
    }

    let size = width * height * bytesPerPixel;

    // Account for mipmaps (adds ~33% more memory)
    if (texture.generateMipmaps) {
      size *= 1.33;
    }

    return size;
  }

  /**
   * Ensure cache has enough space
   */
  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    const maxSizeBytes = this.config.maxCacheSize * 1024 * 1024;

    while (this.currentCacheSize + requiredSize > maxSizeBytes) {
      // Find least recently used texture
      let oldestEntry: { url: string; entry: TextureCacheEntry } | null = null;
      let oldestTime = Date.now();

      this.textureCache.forEach((entry, url) => {
        if (entry.refCount === 0 && entry.lastUsed < oldestTime) {
          oldestTime = entry.lastUsed;
          oldestEntry = { url, entry };
        }
      });

      if (oldestEntry) {
        this.removeFromCache(oldestEntry.url);
      } else {
        // No unused textures to remove, break to avoid infinite loop
        break;
      }
    }
  }

  /**
   * Remove texture from cache
   */
  private removeFromCache(url: string): void {
    const entry = this.textureCache.get(url);
    if (entry) {
      entry.texture.dispose();
      this.currentCacheSize -= entry.size;
      this.textureCache.delete(url);
    }
  }

  /**
   * Release texture reference
   */
  releaseTexture(url: string): void {
    const entry = this.textureCache.get(url);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
    }
  }

  /**
   * Start cleanup timer for unused textures
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupUnusedTextures();
    }, 60000); // Run every minute
  }

  /**
   * Clean up unused textures
   */
  private cleanupUnusedTextures(): void {
    const now = Date.now();
    const timeout = this.config.cacheTimeout;

    const toRemove: string[] = [];

    this.textureCache.forEach((entry, url) => {
      if (entry.refCount === 0 && now - entry.lastUsed > timeout) {
        toRemove.push(url);
      }
    });

    toRemove.forEach((url) => this.removeFromCache(url));
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalTextures: number;
    cacheSize: number;
    maxCacheSize: number;
    hitRate: number;
  } {
    const totalTextures = this.textureCache.size;
    const cacheSize = this.currentCacheSize / (1024 * 1024); // Convert to MB
    const maxCacheSize = this.config.maxCacheSize;

    // Calculate hit rate (simplified)
    let activeTextures = 0;
    this.textureCache.forEach((entry) => {
      if (entry.refCount > 0) activeTextures++;
    });

    const hitRate = totalTextures > 0 ? activeTextures / totalTextures : 0;

    return {
      totalTextures,
      cacheSize,
      maxCacheSize,
      hitRate,
    };
  }

  /**
   * Clear all cached textures
   */
  clearCache(): void {
    this.textureCache.forEach((entry) => {
      entry.texture.dispose();
    });
    this.textureCache.clear();
    this.currentCacheSize = 0;
  }
}

/**
 * Material Manager - Handles material caching and optimization
 */
export class MaterialManager {
  private static instance: MaterialManager;
  private materialCache: Map<string, MaterialCacheEntry> = new Map();

  private constructor() {}

  static getInstance(): MaterialManager {
    if (!MaterialManager.instance) {
      MaterialManager.instance = new MaterialManager();
    }
    return MaterialManager.instance;
  }

  /**
   * Create or get cached material
   */
  getMaterial(properties: {
    color?: string;
    roughness?: number;
    metalness?: number;
    transparent?: boolean;
    opacity?: number;
    diffuseMap?: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
  }): THREE.MeshStandardMaterial {
    const hash = this.hashMaterialProperties(properties);

    // Check cache
    const cacheEntry = this.materialCache.get(hash);
    if (cacheEntry) {
      cacheEntry.refCount++;
      cacheEntry.lastUsed = Date.now();
      return cacheEntry.material as THREE.MeshStandardMaterial;
    }

    // Create new material
    const material = this.createMaterial(properties);

    // Add to cache
    this.materialCache.set(hash, {
      material,
      refCount: 1,
      lastUsed: Date.now(),
      hash,
    });

    return material;
  }

  /**
   * Create material from properties
   */
  private async createMaterial(
    properties: any
  ): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial();
    const textureManager = TextureManager.getInstance();

    // Apply basic properties
    if (properties.color) material.color.setStyle(properties.color);
    if (properties.roughness !== undefined)
      material.roughness = properties.roughness;
    if (properties.metalness !== undefined)
      material.metalness = properties.metalness;
    if (properties.transparent !== undefined)
      material.transparent = properties.transparent;
    if (properties.opacity !== undefined) material.opacity = properties.opacity;

    // Load textures
    if (properties.diffuseMap) {
      material.map = await textureManager.loadTexture(properties.diffuseMap);
    }
    if (properties.normalMap) {
      material.normalMap = await textureManager.loadTexture(
        properties.normalMap
      );
    }
    if (properties.roughnessMap) {
      material.roughnessMap = await textureManager.loadTexture(
        properties.roughnessMap
      );
    }
    if (properties.metalnessMap) {
      material.metalnessMap = await textureManager.loadTexture(
        properties.metalnessMap
      );
    }

    return material;
  }

  /**
   * Hash material properties for caching
   */
  private hashMaterialProperties(properties: any): string {
    const keys = Object.keys(properties).sort();
    const values = keys.map((key) => `${key}:${properties[key]}`);
    return values.join("|");
  }

  /**
   * Release material reference
   */
  releaseMaterial(hash: string): void {
    const entry = this.materialCache.get(hash);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
    }
  }

  /**
   * Clean up unused materials
   */
  cleanupUnusedMaterials(): void {
    const toRemove: string[] = [];

    this.materialCache.forEach((entry, hash) => {
      if (entry.refCount === 0) {
        entry.material.dispose();
        toRemove.push(hash);
      }
    });

    toRemove.forEach((hash) => this.materialCache.delete(hash));
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalMaterials: number;
    activeMaterials: number;
    hitRate: number;
  } {
    const totalMaterials = this.materialCache.size;
    let activeMaterials = 0;

    this.materialCache.forEach((entry) => {
      if (entry.refCount > 0) activeMaterials++;
    });

    const hitRate = totalMaterials > 0 ? activeMaterials / totalMaterials : 0;

    return {
      totalMaterials,
      activeMaterials,
      hitRate,
    };
  }

  /**
   * Clear all cached materials
   */
  clearCache(): void {
    this.materialCache.forEach((entry) => {
      entry.material.dispose();
    });
    this.materialCache.clear();
  }
}

/**
 * Performance optimization utilities
 */
export class MaterialOptimizer {
  /**
   * Optimize material for performance
   */
  static optimizeMaterial(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      // Disable features that aren't needed
      if (!material.map && !material.normalMap) {
        material.flatShading = true;
      }

      // Optimize for mobile devices
      if (this.isMobileDevice()) {
        material.roughness = Math.max(0.5, material.roughness);
        material.metalness = Math.min(0.5, material.metalness);
      }
    }
  }

  /**
   * Batch materials for better performance
   */
  static batchMaterials(materials: THREE.Material[]): THREE.Material[] {
    const materialMap = new Map<string, THREE.Material>();
    const batched: THREE.Material[] = [];

    materials.forEach((material) => {
      const key = this.getMaterialKey(material);

      if (!materialMap.has(key)) {
        materialMap.set(key, material);
        batched.push(material);
      }
    });

    return batched;
  }

  /**
   * Get material key for batching
   */
  private static getMaterialKey(material: THREE.Material): string {
    if (material instanceof THREE.MeshStandardMaterial) {
      return `${material.color.getHexString()}-${material.roughness}-${
        material.metalness
      }`;
    }
    return material.uuid;
  }

  /**
   * Check if running on mobile device
   */
  private static isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }
}

/**
 * Global instances
 */
export const textureManager = TextureManager.getInstance();
export const materialManager = MaterialManager.getInstance();
