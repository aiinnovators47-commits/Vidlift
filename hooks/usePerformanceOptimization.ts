import { useCallback, useRef } from 'react'

/**
 * Hook for optimizing expensive operations with debouncing and caching
 */
export function usePerformanceOptimization() {
  const cacheRef = useRef<Map<string, any>>(new Map())
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  /**
   * Debounce function calls to reduce expensive operations
   */
  const debounce = useCallback((
    fn: (...args: any[]) => void, 
    delay: number = 300,
    key: string = 'default'
  ) => {
    return (...args: any[]) => {
      // Clear existing timeout
      if (timeoutRefs.current.has(key)) {
        clearTimeout(timeoutRefs.current.get(key)!)
      }
      
      // Set new timeout
      const timeoutId = setTimeout(() => {
        fn(...args)
        timeoutRefs.current.delete(key)
      }, delay)
      
      timeoutRefs.current.set(key, timeoutId)
    }
  }, [])

  /**
   * Memoize expensive calculations with automatic cleanup
   */
  const memoize = useCallback((
    fn: (...args: any[]) => any,
    key: string,
    ...args: any[]
  ) => {
    const cacheKey = `${key}_${JSON.stringify(args)}`
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)
    }
    
    const result = fn(...args)
    cacheRef.current.set(cacheKey, result)
    
    // Auto-cleanup old entries to prevent memory leaks
    if (cacheRef.current.size > 100) {
      const firstKey = cacheRef.current.keys().next().value
      cacheRef.current.delete(firstKey)
    }
    
    return result
  }, [])

  /**
   * Throttle function calls to limit execution rate
   */
  const throttle = useCallback((
    fn: (...args: any[]) => void,
    limit: number = 100,
    key: string = 'default'
  ) => {
    const lastRunRef = useRef<number>(0)
    
    return (...args: any[]) => {
      const now = Date.now()
      
      if (now - lastRunRef.current >= limit) {
        fn(...args)
        lastRunRef.current = now
      }
    }
  }, [])

  /**
   * Cleanup function to clear timeouts and cache
   */
  const cleanup = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current.clear()
    
    // Clear cache
    cacheRef.current.clear()
  }, [])

  return {
    debounce,
    memoize,
    throttle,
    cleanup
  }
}

/**
 * Hook for optimizing API calls with caching and deduplication
 */
export function useApiOptimization() {
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map())
  const cache = useRef<Map<string, { data: any; timestamp: number }>>(new Map())

  /**
   * Fetch with automatic caching and deduplication
   */
  const fetchWithCache = useCallback(async (
    url: string,
    options: RequestInit = {},
    cacheTime: number = 300000 // 5 minutes default
  ): Promise<any> => {
    const cacheKey = `${url}_${JSON.stringify(options)}`
    const now = Date.now()

    // Check if we have fresh cached data
    const cached = cache.current.get(cacheKey)
    if (cached && (now - cached.timestamp) < cacheTime) {
      return cached.data
    }

    // Check if request is already pending
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey)
    }

    // Make new request
    const requestPromise = fetch(url, options)
      .then(response => response.json())
      .then(data => {
        // Cache the result
        cache.current.set(cacheKey, { data, timestamp: now })
        // Remove from pending
        pendingRequests.current.delete(cacheKey)
        return data
      })
      .catch(error => {
        // Remove from pending on error
        pendingRequests.current.delete(cacheKey)
        throw error
      })

    // Store pending request
    pendingRequests.current.set(cacheKey, requestPromise)
    
    return requestPromise
  }, [])

  /**
   * Clear cache for specific URL or all cache
   */
  const clearCache = useCallback((url?: string) => {
    if (url) {
      const keysToDelete = Array.from(cache.current.keys()).filter(key => key.startsWith(url))
      keysToDelete.forEach(key => cache.current.delete(key))
    } else {
      cache.current.clear()
    }
  }, [])

  return {
    fetchWithCache,
    clearCache
  }
}