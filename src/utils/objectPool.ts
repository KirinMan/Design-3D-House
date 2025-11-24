/**
 * Object Pool Utility - Manages object pooling for frequently created/destroyed objects
 * Implements performance optimization for 3D objects
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2
 */

import * as THREE from "three";

/**
 * Generic object pool interface
 */
interface ObjectPool<T> {
  acquire(): T;
  release(obj: T): void;
  clear(): void;
  size(): number;
  activeCount(): number;
}

/**
 * Generic object pool implementation
 */
class GenericObjectPool<T> implements ObjectPool<T> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn?: (obj: T) => void,
    maxSize: number = 100
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.createFn();
    }

    this.active.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.active.has(obj)) {
      console.warn("Attempting to release object that is not active");
      return;
    }

    this.active.delete(obj);

    // Reset object state if reset function is provided
    if (this.resetFn) {
      this.resetFn(obj);
    }

    // Only return to pool if we haven't exceeded max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
    this.active.clear();
  }

  size(): number {
    return this.pool.length;
  }

  activeCount(): number {
    return this.active.size;
  }
}

/**
 * Three.js specific object pools
 */

// Geometry pool for box geometries (walls, doors, windows)
export const boxGeometryPool = new GenericObjectPool<THREE.BoxGeometry>(
  () => new THREE.BoxGeometry(1, 1, 1),
  (geometry) => {
    // Reset geometry parameters
    geometry.dispose();
    // Note: BoxGeometry parameters can't be changed after creation,
    // so we'll create new ones as needed
  },
  50
);

// Material pool for standard materials
export const standardMaterialPool =
  new GenericObjectPool<THREE.MeshStandardMaterial>(
    () => new THREE.MeshStandardMaterial(),
    (material) => {
      // Reset material properties to defaults
      material.color.setHex(0xffffff);
      material.roughness = 1;
      material.metalness = 0;
      material.transparent = false;
      material.opacity = 1;
      material.wireframe = false;
      material.visible = true;

      // Dispose of textures
      if (material.map) {
        material.map.dispose();
        material.map = null;
      }
      if (material.normalMap) {
        material.normalMap.dispose();
        material.normalMap = null;
      }
      if (material.roughnessMap) {
        material.roughnessMap.dispose();
        material.roughnessMap = null;
      }
      if (material.metalnessMap) {
        material.metalnessMap.dispose();
        material.metalnessMap = null;
      }
    },
    30
  );

// Mesh pool for 3D objects
export const meshPool = new GenericObjectPool<THREE.Mesh>(
  () => new THREE.Mesh(),
  (mesh) => {
    // Reset mesh properties
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    mesh.scale.set(1, 1, 1);
    mesh.visible = true;
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // Remove from parent if attached
    if (mesh.parent) {
      mesh.parent.remove(mesh);
    }

    // Clear geometry and material references (don't dispose, they're pooled separately)
    mesh.geometry = new THREE.BufferGeometry();
    mesh.material = new THREE.MeshBasicMaterial();
  },
  100
);

// Vector3 pool for temporary calculations
export const vector3Pool = new GenericObjectPool<THREE.Vector3>(
  () => new THREE.Vector3(),
  (vector) => {
    vector.set(0, 0, 0);
  },
  200
);

// Matrix4 pool for transformations
export const matrix4Pool = new GenericObjectPool<THREE.Matrix4>(
  () => new THREE.Matrix4(),
  (matrix) => {
    matrix.identity();
  },
  50
);

// Quaternion pool for rotations
export const quaternionPool = new GenericObjectPool<THREE.Quaternion>(
  () => new THREE.Quaternion(),
  (quaternion) => {
    quaternion.set(0, 0, 0, 1);
  },
  50
);

/**
 * Specialized pools for application-specific objects
 */

// Wall geometry pool with specific dimensions
export class WallGeometryPool {
  private pools: Map<string, GenericObjectPool<THREE.BoxGeometry>> = new Map();

  private getPoolKey(width: number, height: number, depth: number): string {
    // Round to nearest 0.1 to reduce pool fragmentation
    const w = Math.round(width * 10) / 10;
    const h = Math.round(height * 10) / 10;
    const d = Math.round(depth * 10) / 10;
    return `${w}x${h}x${d}`;
  }

  acquire(width: number, height: number, depth: number): THREE.BoxGeometry {
    const key = this.getPoolKey(width, height, depth);

    if (!this.pools.has(key)) {
      this.pools.set(
        key,
        new GenericObjectPool<THREE.BoxGeometry>(
          () => new THREE.BoxGeometry(width, height, depth),
          (geometry) => geometry.dispose(),
          20
        )
      );
    }

    return this.pools.get(key)!.acquire();
  }

  release(
    geometry: THREE.BoxGeometry,
    width: number,
    height: number,
    depth: number
  ): void {
    const key = this.getPoolKey(width, height, depth);
    const pool = this.pools.get(key);

    if (pool) {
      pool.release(geometry);
    }
  }

  clear(): void {
    this.pools.forEach((pool) => pool.clear());
    this.pools.clear();
  }

  getStats(): { [key: string]: { poolSize: number; activeCount: number } } {
    const stats: { [key: string]: { poolSize: number; activeCount: number } } =
      {};

    this.pools.forEach((pool, key) => {
      stats[key] = {
        poolSize: pool.size(),
        activeCount: pool.activeCount(),
      };
    });

    return stats;
  }
}

export const wallGeometryPool = new WallGeometryPool();

/**
 * Pool manager for coordinating all pools
 */
export class PoolManager {
  private static instance: PoolManager;
  private pools: ObjectPool<any>[] = [];

  private constructor() {
    this.pools = [
      boxGeometryPool,
      standardMaterialPool,
      meshPool,
      vector3Pool,
      matrix4Pool,
      quaternionPool,
    ];
  }

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  /**
   * Get statistics for all pools
   */
  getStats(): {
    [poolName: string]: { poolSize: number; activeCount: number };
  } {
    return {
      boxGeometry: {
        poolSize: boxGeometryPool.size(),
        activeCount: boxGeometryPool.activeCount(),
      },
      standardMaterial: {
        poolSize: standardMaterialPool.size(),
        activeCount: standardMaterialPool.activeCount(),
      },
      mesh: {
        poolSize: meshPool.size(),
        activeCount: meshPool.activeCount(),
      },
      vector3: {
        poolSize: vector3Pool.size(),
        activeCount: vector3Pool.activeCount(),
      },
      matrix4: {
        poolSize: matrix4Pool.size(),
        activeCount: matrix4Pool.activeCount(),
      },
      quaternion: {
        poolSize: quaternionPool.size(),
        activeCount: quaternionPool.activeCount(),
      },
      wallGeometry: wallGeometryPool.getStats(),
    };
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    this.pools.forEach((pool) => pool.clear());
    wallGeometryPool.clear();
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): {
    totalObjects: number;
    activeObjects: number;
    estimatedMemoryMB: number;
  } {
    const stats = this.getStats();
    let totalObjects = 0;
    let activeObjects = 0;

    // Count regular pools
    Object.entries(stats).forEach(([key, value]) => {
      if (key !== "wallGeometry") {
        totalObjects += value.poolSize;
        activeObjects += value.activeCount;
      }
    });

    // Count wall geometry pools
    if (typeof stats.wallGeometry === "object") {
      Object.values(stats.wallGeometry).forEach((poolStats) => {
        totalObjects += poolStats.poolSize;
        activeObjects += poolStats.activeCount;
      });
    }

    // Rough estimate: each pooled object uses ~1KB on average
    const estimatedMemoryMB = (totalObjects + activeObjects) * 0.001;

    return {
      totalObjects,
      activeObjects,
      estimatedMemoryMB,
    };
  }
}

/**
 * Utility functions for working with pools
 */

/**
 * Create a temporary vector3 for calculations
 */
export function withTempVector3<T>(fn: (vector: THREE.Vector3) => T): T {
  const vector = vector3Pool.acquire();
  try {
    return fn(vector);
  } finally {
    vector3Pool.release(vector);
  }
}

/**
 * Create a temporary matrix4 for calculations
 */
export function withTempMatrix4<T>(fn: (matrix: THREE.Matrix4) => T): T {
  const matrix = matrix4Pool.acquire();
  try {
    return fn(matrix);
  } finally {
    matrix4Pool.release(matrix);
  }
}

/**
 * Create a temporary quaternion for calculations
 */
export function withTempQuaternion<T>(
  fn: (quaternion: THREE.Quaternion) => T
): T {
  const quaternion = quaternionPool.acquire();
  try {
    return fn(quaternion);
  } finally {
    quaternionPool.release(quaternion);
  }
}

/**
 * Performance monitoring
 */
export class PoolPerformanceMonitor {
  private static instance: PoolPerformanceMonitor;
  private startTime: number = Date.now();
  private samples: Array<{
    timestamp: number;
    stats: ReturnType<PoolManager["getStats"]>;
    memoryUsage: ReturnType<PoolManager["getMemoryUsage"]>;
  }> = [];

  private constructor() {}

  static getInstance(): PoolPerformanceMonitor {
    if (!PoolPerformanceMonitor.instance) {
      PoolPerformanceMonitor.instance = new PoolPerformanceMonitor();
    }
    return PoolPerformanceMonitor.instance;
  }

  /**
   * Record current pool statistics
   */
  recordSample(): void {
    const poolManager = PoolManager.getInstance();
    const sample = {
      timestamp: Date.now() - this.startTime,
      stats: poolManager.getStats(),
      memoryUsage: poolManager.getMemoryUsage(),
    };

    this.samples.push(sample);

    // Keep only last 100 samples
    if (this.samples.length > 100) {
      this.samples.shift();
    }
  }

  /**
   * Get performance report
   */
  getReport(): {
    duration: number;
    sampleCount: number;
    averageMemoryUsage: number;
    peakMemoryUsage: number;
    poolEfficiency: { [poolName: string]: number };
  } {
    if (this.samples.length === 0) {
      return {
        duration: 0,
        sampleCount: 0,
        averageMemoryUsage: 0,
        peakMemoryUsage: 0,
        poolEfficiency: {},
      };
    }

    const duration = this.samples[this.samples.length - 1].timestamp;
    const memoryUsages = this.samples.map(
      (s) => s.memoryUsage.estimatedMemoryMB
    );
    const averageMemoryUsage =
      memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
    const peakMemoryUsage = Math.max(...memoryUsages);

    // Calculate pool efficiency (ratio of active to total objects)
    const poolEfficiency: { [poolName: string]: number } = {};
    const latestStats = this.samples[this.samples.length - 1].stats;

    Object.entries(latestStats).forEach(([poolName, stats]) => {
      if (
        poolName !== "wallGeometry" &&
        typeof stats === "object" &&
        "poolSize" in stats
      ) {
        const total = stats.poolSize + stats.activeCount;
        poolEfficiency[poolName] = total > 0 ? stats.activeCount / total : 0;
      }
    });

    return {
      duration,
      sampleCount: this.samples.length,
      averageMemoryUsage,
      peakMemoryUsage,
      poolEfficiency,
    };
  }

  /**
   * Clear all samples
   */
  reset(): void {
    this.samples = [];
    this.startTime = Date.now();
  }
}
