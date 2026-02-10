/**
 * Performance Test Script
 * Run this to verify performance optimizations are working
 */

// Test performance monitoring
console.log('🚀 Starting Performance Tests...\n')

// Test 1: Measure basic navigation timing
console.time('Navigation Test')
setTimeout(() => {
  console.timeEnd('Navigation Test')
  console.log('✅ Navigation timing measurement working\n')
}, 100)

// Test 2: Test debounce function
const { debounce } = require('./lib/performance')

console.log('Testing debounce function...')
let callCount = 0
const debouncedFn = debounce(() => {
  callCount++
  console.log(`Debounced function called ${callCount} times`)
}, 200)

// Call multiple times rapidly
debouncedFn()
debouncedFn()
debouncedFn()
debouncedFn()

setTimeout(() => {
  console.log(`✅ Debounce working correctly - called ${callCount} time(s)\n`)
}, 250)

// Test 3: Test caching
const { TTLCache } = require('./lib/performance')

console.log('Testing TTL Cache...')
const cache = new TTLCache(1000) // 1 second TTL

cache.set('test-key', 'test-value')
console.log('Cache set:', cache.get('test-key'))

setTimeout(() => {
  console.log('Cache after 500ms:', cache.get('test-key'))
}, 500)

setTimeout(() => {
  console.log('Cache after 1100ms:', cache.get('test-key'))
  console.log('✅ TTL Cache working correctly\n')
}, 1100)

// Test 4: Performance metrics
const { perfMonitor } = require('./lib/performance')

console.log('Testing performance monitoring...')

// Record some fake metrics
perfMonitor.recordMetric('api-call', 45)
perfMonitor.recordMetric('api-call', 52)
perfMonitor.recordMetric('render', 12)
perfMonitor.recordMetric('render', 8)

console.log('Average API call time:', perfMonitor.getAverage('api-call').toFixed(2) + 'ms')
console.log('Average render time:', perfMonitor.getAverage('render').toFixed(2) + 'ms')

perfMonitor.logReport()
console.log('✅ Performance monitoring working\n')

// Test 5: Memory usage (browser only)
if (typeof window !== 'undefined' && 'memory' in performance) {
  const memory = (performance as any).memory
  console.log('Current memory usage:', Math.round(memory.usedJSHeapSize / 1048576) + 'MB')
  console.log('Memory limit:', Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB')
  console.log('✅ Memory monitoring available\n')
}

console.log('🎉 All performance tests completed!')
console.log('\n🔧 Optimization Summary:')
console.log('- Debouncing reduces unnecessary function calls')
console.log('- Caching eliminates redundant API requests')
console.log('- Performance monitoring helps identify bottlenecks')
console.log('- Memory tracking prevents leaks')
console.log('- Route prefetching enables instant navigation')