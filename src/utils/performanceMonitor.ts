/**
 * Performance Monitor - Monitors and reports performance metrics
 * Integrates all performance optimization systems
 * Requirements: 3.1, 3.2, 3.3, 5.1, 5.2
 */

import * as THREE from "three";
import { PoolManager } from "./objectPool";
import { lodManager } from "./lodSystem";
import { cullingManager } from "./viewportCulling";
import { textureManager, materialManager } from "./materialOptimization";

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: {
    geometries: number;
    textures: number;
    materials: number;
    total: number;
  };
  renderStats: {
    drawCalls: number;
    triangles: number;
    points: number;
    lines: number;
  };
  optimizationStats: {
    objectPooling: {
      totalObjects: number;
      activeObjects: number;
      memoryReduction: number;
    };
    lod: {
      totalObjects: number;
      visibleObjects: number;
      cullingRatio: number;
      averageLODLevel: number;
    };
    culling: {
      totalObjects: number;
      visibleObjects: number;
      cullingRatio: number;
    };
    materials: {
      totalMaterials: number;
      activeMaterials: number;
      hitRate: number;
    };
    textures: {
      totalTextures: number;
      cacheSize: number;
      hitRate: number;
    };
  };
}

/**
 * Performance alert levels
 */
export enum AlertLevel {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical",
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  level: AlertLevel;
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
}

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  fps: { warning: number; critical: number };
  frameTime: { warning: number; critical: number };
  memoryUsage: { warning: number; critical: number };
  drawCalls: { warning: number; critical: number };
}

/**
 * Default performance thresholds
 */
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { warning: 30, critical: 15 },
  frameTime: { warning: 33, critical: 66 }, // milliseconds
  memoryUsage: { warning: 512, critical: 1024 }, // MB
  drawCalls: { warning: 1000, critical: 2000 },
};

/**
 * Performance Monitor class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.Camera | null = null;

  private thresholds: PerformanceThresholds;
  private alerts: PerformanceAlert[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: number = 1000; // 1 second
  private intervalId: NodeJS.Timeout | null = null;

  // FPS tracking
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;
  private frameTimes: number[] = [];
  private maxFrameTimeHistory: number = 60;

  // Memory tracking
  private memoryInfo: any = null;

  // Performance history
  private metricsHistory: PerformanceMetrics[] = [];
  private maxHistoryLength: number = 300; // 5 minutes at 1 second intervals

  private constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.setupMemoryMonitoring();
  }

  static getInstance(
    thresholds?: Partial<PerformanceThresholds>
  ): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(thresholds);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Setup render info tracking
    if (this.renderer.info) {
      this.renderer.info.autoReset = false;
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.lastTime = performance.now();

    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, this.monitoringInterval);

    // Start frame time tracking
    this.startFrameTimeTracking();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Start frame time tracking
   */
  private startFrameTimeTracking(): void {
    const trackFrame = () => {
      if (!this.isMonitoring) return;

      const currentTime = performance.now();
      const frameTime = currentTime - this.lastTime;

      this.frameTimes.push(frameTime);
      if (this.frameTimes.length > this.maxFrameTimeHistory) {
        this.frameTimes.shift();
      }

      this.frameCount++;
      this.lastTime = currentTime;

      requestAnimationFrame(trackFrame);
    };

    requestAnimationFrame(trackFrame);
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    // Check if performance.memory is available (Chrome)
    if ("memory" in performance) {
      this.memoryInfo = (performance as any).memory;
    }
  }

  /**
   * Collect performance metrics
   */
  private collectMetrics(): void {
    const metrics = this.getCurrentMetrics();

    // Add to history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistoryLength) {
      this.metricsHistory.shift();
    }

    // Check for performance issues
    this.checkPerformanceThresholds(metrics);

    // Reset frame count for FPS calculation
    this.frameCount = 0;
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    // Calculate FPS
    this.fps = this.frameCount;

    // Calculate average frame time
    const avgFrameTime =
      this.frameTimes.length > 0
        ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
        : 0;

    // Get memory usage
    const memoryUsage = this.getMemoryUsage();

    // Get render stats
    const renderStats = this.getRenderStats();

    // Get optimization stats
    const optimizationStats = this.getOptimizationStats();

    return {
      fps: this.fps,
      frameTime: avgFrameTime,
      memoryUsage,
      renderStats,
      optimizationStats,
    };
  }

  /**
   * Get memory usage information
   */
  private getMemoryUsage(): PerformanceMetrics["memoryUsage"] {
    let geometries = 0;
    let textures = 0;
    let materials = 0;

    if (this.renderer) {
      const info = this.renderer.info;
      geometries = info.memory?.geometries || 0;
      textures = info.memory?.textures || 0;
    }

    // Get texture cache size
    const textureStats = textureManager.getCacheStats();
    const textureCacheSize = textureStats.cacheSize;

    // Get material count
    const materialStats = materialManager.getCacheStats();
    materials = materialStats.totalMaterials;

    // Estimate total memory usage
    const poolMemory =
      PoolManager.getInstance().getMemoryUsage().estimatedMemoryMB;
    const total = poolMemory + textureCacheSize + materials * 0.1; // Rough estimate

    return {
      geometries,
      textures: Math.round(textureCacheSize),
      materials,
      total: Math.round(total),
    };
  }

  /**
   * Get render statistics
   */
  private getRenderStats(): PerformanceMetrics["renderStats"] {
    if (!this.renderer) {
      return { drawCalls: 0, triangles: 0, points: 0, lines: 0 };
    }

    const info = this.renderer.info;
    return {
      drawCalls: info.render?.calls || 0,
      triangles: info.render?.triangles || 0,
      points: info.render?.points || 0,
      lines: info.render?.lines || 0,
    };
  }

  /**
   * Get optimization statistics
   */
  private getOptimizationStats(): PerformanceMetrics["optimizationStats"] {
    // Object pooling stats
    const poolStats = PoolManager.getInstance().getMemoryUsage();

    // LOD stats
    const lodStats = lodManager.getPerformanceMetrics();

    // Culling stats
    const cullingStats = cullingManager.getPerformanceMetrics();

    // Material stats
    const materialStats = materialManager.getCacheStats();

    // Texture stats
    const textureStats = textureManager.getCacheStats();

    return {
      objectPooling: {
        totalObjects: poolStats.totalObjects,
        activeObjects: poolStats.activeObjects,
        memoryReduction: poolStats.estimatedMemoryMB,
      },
      lod: {
        totalObjects: lodStats.totalObjects,
        visibleObjects: lodStats.visibleObjects,
        cullingRatio: lodStats.cullingRatio,
        averageLODLevel: lodStats.averageLODLevel,
      },
      culling: {
        totalObjects: cullingStats.totalObjects,
        visibleObjects: cullingStats.visibleObjects,
        cullingRatio: cullingStats.cullingRatio,
      },
      materials: {
        totalMaterials: materialStats.totalMaterials,
        activeMaterials: materialStats.activeMaterials,
        hitRate: materialStats.hitRate,
      },
      textures: {
        totalTextures: textureStats.totalTextures,
        cacheSize: textureStats.cacheSize,
        hitRate: textureStats.hitRate,
      },
    };
  }

  /**
   * Check performance thresholds and generate alerts
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const now = Date.now();

    // Check FPS
    if (metrics.fps < this.thresholds.fps.critical) {
      this.addAlert(
        AlertLevel.CRITICAL,
        "FPS critically low",
        "fps",
        metrics.fps,
        this.thresholds.fps.critical,
        now
      );
    } else if (metrics.fps < this.thresholds.fps.warning) {
      this.addAlert(
        AlertLevel.WARNING,
        "FPS below optimal",
        "fps",
        metrics.fps,
        this.thresholds.fps.warning,
        now
      );
    }

    // Check frame time
    if (metrics.frameTime > this.thresholds.frameTime.critical) {
      this.addAlert(
        AlertLevel.CRITICAL,
        "Frame time critically high",
        "frameTime",
        metrics.frameTime,
        this.thresholds.frameTime.critical,
        now
      );
    } else if (metrics.frameTime > this.thresholds.frameTime.warning) {
      this.addAlert(
        AlertLevel.WARNING,
        "Frame time above optimal",
        "frameTime",
        metrics.frameTime,
        this.thresholds.frameTime.warning,
        now
      );
    }

    // Check memory usage
    if (metrics.memoryUsage.total > this.thresholds.memoryUsage.critical) {
      this.addAlert(
        AlertLevel.CRITICAL,
        "Memory usage critically high",
        "memoryUsage",
        metrics.memoryUsage.total,
        this.thresholds.memoryUsage.critical,
        now
      );
    } else if (
      metrics.memoryUsage.total > this.thresholds.memoryUsage.warning
    ) {
      this.addAlert(
        AlertLevel.WARNING,
        "Memory usage above optimal",
        "memoryUsage",
        metrics.memoryUsage.total,
        this.thresholds.memoryUsage.warning,
        now
      );
    }

    // Check draw calls
    if (metrics.renderStats.drawCalls > this.thresholds.drawCalls.critical) {
      this.addAlert(
        AlertLevel.CRITICAL,
        "Draw calls critically high",
        "drawCalls",
        metrics.renderStats.drawCalls,
        this.thresholds.drawCalls.critical,
        now
      );
    } else if (
      metrics.renderStats.drawCalls > this.thresholds.drawCalls.warning
    ) {
      this.addAlert(
        AlertLevel.WARNING,
        "Draw calls above optimal",
        "drawCalls",
        metrics.renderStats.drawCalls,
        this.thresholds.drawCalls.warning,
        now
      );
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(
    level: AlertLevel,
    message: string,
    metric: string,
    value: number,
    threshold: number,
    timestamp: number
  ): void {
    // Avoid duplicate alerts for the same metric within a short time
    const recentAlert = this.alerts.find(
      (alert) =>
        alert.metric === metric &&
        alert.level === level &&
        timestamp - alert.timestamp < 5000 // 5 seconds
    );

    if (!recentAlert) {
      this.alerts.push({
        level,
        message,
        metric,
        value,
        threshold,
        timestamp,
      });

      // Keep only recent alerts
      this.alerts = this.alerts.filter(
        (alert) => timestamp - alert.timestamp < 60000
      ); // 1 minute
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(maxAge: number = 60000): PerformanceAlert[] {
    const now = Date.now();
    return this.alerts.filter((alert) => now - alert.timestamp < maxAge);
  }

  /**
   * Get performance history
   */
  getHistory(maxEntries?: number): PerformanceMetrics[] {
    if (maxEntries) {
      return this.metricsHistory.slice(-maxEntries);
    }
    return [...this.metricsHistory];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageFPS: number;
    averageFrameTime: number;
    peakMemoryUsage: number;
    totalAlerts: number;
    criticalAlerts: number;
    optimizationEffectiveness: number;
  } {
    if (this.metricsHistory.length === 0) {
      return {
        averageFPS: 0,
        averageFrameTime: 0,
        peakMemoryUsage: 0,
        totalAlerts: 0,
        criticalAlerts: 0,
        optimizationEffectiveness: 0,
      };
    }

    const recentMetrics = this.metricsHistory.slice(-60); // Last minute

    const averageFPS =
      recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const averageFrameTime =
      recentMetrics.reduce((sum, m) => sum + m.frameTime, 0) /
      recentMetrics.length;
    const peakMemoryUsage = Math.max(
      ...recentMetrics.map((m) => m.memoryUsage.total)
    );

    const recentAlerts = this.getAlerts();
    const totalAlerts = recentAlerts.length;
    const criticalAlerts = recentAlerts.filter(
      (a) => a.level === AlertLevel.CRITICAL
    ).length;

    // Calculate optimization effectiveness (0-1 scale)
    const latestMetrics = recentMetrics[recentMetrics.length - 1];
    const cullingRatio = latestMetrics.optimizationStats.culling.cullingRatio;
    const lodRatio = latestMetrics.optimizationStats.lod.cullingRatio;
    const materialHitRate = latestMetrics.optimizationStats.materials.hitRate;
    const textureHitRate = latestMetrics.optimizationStats.textures.hitRate;

    const optimizationEffectiveness =
      (cullingRatio + lodRatio + materialHitRate + textureHitRate) / 4;

    return {
      averageFPS: Math.round(averageFPS),
      averageFrameTime: Math.round(averageFrameTime * 100) / 100,
      peakMemoryUsage: Math.round(peakMemoryUsage),
      totalAlerts,
      criticalAlerts,
      optimizationEffectiveness:
        Math.round(optimizationEffectiveness * 100) / 100,
    };
  }

  /**
   * Reset performance monitoring
   */
  reset(): void {
    this.metricsHistory = [];
    this.alerts = [];
    this.frameCount = 0;
    this.frameTimes = [];
    this.fps = 0;
  }

  /**
   * Update monitoring interval
   */
  setMonitoringInterval(intervalMs: number): void {
    this.monitoringInterval = Math.max(100, intervalMs); // Minimum 100ms

    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = PerformanceMonitor.getInstance();
