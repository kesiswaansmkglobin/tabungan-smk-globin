// Performance and error monitoring utilities
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  
  static startTimer(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  static recordMetric(label: string, value: number): void {
    const existing = this.metrics.get(label) || [];
    existing.push(value);
    
    // Keep only last 100 measurements
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100);
    }
    
    this.metrics.set(label, existing);
  }

  static getAverageMetric(label: string): number {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static logSlowOperations(): void {
    this.metrics.forEach((values, label) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      if (avg > 1000) { // Slower than 1 second
        console.warn(`Slow operation detected: ${label} - ${avg.toFixed(2)}ms average`);
      }
    });
  }

  // Memory usage tracking
  static trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
      });
    }
  }

  // Network quality detection
  static getNetworkQuality(): 'fast' | 'slow' | 'offline' {
    if (!navigator.onLine) return 'offline';
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const speed = connection.downlink;
      
      if (speed >= 10) return 'fast';
      if (speed >= 1.5) return 'slow';
      return 'slow';
    }
    
    return 'fast'; // Default assumption
  }
}

export class ErrorTracker {
  private static errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    url: string;
    userId?: string;
  }> = [];

  static recordError(error: Error, userId?: string): void {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userId
    });

    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.splice(0, this.errors.length - 50);
    }

    console.error('Recorded error:', error);
  }

  static getRecentErrors(count: number = 10): typeof ErrorTracker.errors {
    return this.errors.slice(-count);
  }

  static clearErrors(): void {
    this.errors.length = 0;
  }
}

// Initialize global error tracking
window.addEventListener('error', (event) => {
  ErrorTracker.recordError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorTracker.recordError(new Error(event.reason));
});
