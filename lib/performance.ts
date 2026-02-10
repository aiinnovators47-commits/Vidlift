/**
 * Global performance monitoring and optimization utilities
 */

// Performance monitoring class
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private startTime: number = performance.now()

  // Record a performance metric
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  // Get average for a metric
  getAverage(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  // Log performance report
  logReport() {
    console.group('📊 Performance Report')
    console.log(`Total Runtime: ${(performance.now() - this.startTime).toFixed(2)}ms`)
    
    this.metrics.forEach((values, name) => {
      console.log(`${name}: avg=${this.getAverage(name).toFixed(2)}ms, samples=${values.length}`)
    })
    
    console.groupEnd()
  }

  // Clear metrics
  clear() {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor()

// Utility functions for performance optimization

/**
 * Wrap a function with performance monitoring
 */
export function withPerformance<T extends (...args: any[]) => any>(
  fn: T,
  metricName: string
): T {
  return function(...args: Parameters<T>): ReturnType<T> {
    const start = performance.now()
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        return result.then(res => {
          perfMonitor.recordMetric(metricName, performance.now() - start)
          return res
        }) as ReturnType<T>
      } else {
        perfMonitor.recordMetric(metricName, performance.now() - start)
        return result
      }
    } catch (error) {
      perfMonitor.recordMetric(metricName, performance.now() - start)
      throw error
    }
  } as T
}

/**
 * Debounce function with immediate option
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    const callNow = immediate && !timeout
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      timeout = null
      if (!immediate) func(...args)
    }, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Cache with TTL (Time To Live)
 */
export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }> = new Map()
  
  constructor(private defaultTTL: number = 300000) {} // 5 minutes default
  
  set(key: K, value: V, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    })
  }
  
  get(key: K): V | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return undefined
    }
    
    return item.value
  }
  
  has(key: K): boolean {
    return this.get(key) !== undefined
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key)
  }
  
  clear() {
    this.cache.clear()
  }
  
  // Clean expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * Preload critical assets
 */
export function preloadAssets(urls: string[]) {
  urls.forEach(url => {
    if (url.endsWith('.js')) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'script'
      link.href = url
      document.head.appendChild(link)
    } else if (url.endsWith('.css')) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'style'
      link.href = url
      document.head.appendChild(link)
    }
  })
}

/**
 * Optimize image loading
 */
export function optimizeImageLoading(img: HTMLImageElement) {
  // Use native lazy loading if supported
  if ('loading' in HTMLImageElement.prototype) {
    img.loading = 'lazy'
  }
  
  // Add decoding hint
  img.decoding = 'async'
  
  // Add fetch priority for critical images
  if (img.classList.contains('critical')) {
    img.fetchPriority = 'high'
  }
}

/**
 * Memory usage monitoring
 */
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    console.log(`Memory Usage: ${Math.round(memory.usedJSHeapSize / 1048576)}MB / ${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`)
  }
}

// Auto-cleanup expired cache entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    // Clean up any TTL caches
    // This would need to be implemented per cache instance
  }, 60000) // Every minute
}

// Export utilities
export const performanceUtils = {
  perfMonitor,
  withPerformance,
  debounce,
  throttle,
  TTLCache,
  preloadAssets,
  optimizeImageLoading,
  monitorMemoryUsage
}