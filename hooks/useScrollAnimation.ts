import { useState, useEffect, useRef } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = false } = options
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (triggerOnce) {
              observer.unobserve(entry.target)
            }
          } else if (!triggerOnce) {
            setIsVisible(false)
          }
        })
      },
      { threshold, rootMargin }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current)
      }
    }
  }, [threshold, rootMargin, triggerOnce])

  return { isVisible, elementRef }
}

// Hook for animating multiple child elements with staggered delays
export function useStaggeredAnimation(
  itemCount: number,
  options: UseScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px' } = options
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('[data-animate-item]')
            items.forEach((item, index) => {
              const itemIndex = parseInt(item.getAttribute('data-animate-item') || '0')
              setTimeout(() => {
                setVisibleItems((prev) => [...new Set([...prev, itemIndex])])
              }, itemIndex * 100) // 100ms delay between each item
            })
          }
        })
      },
      { threshold, rootMargin }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [itemCount, threshold, rootMargin])

  return { visibleItems, containerRef }
}