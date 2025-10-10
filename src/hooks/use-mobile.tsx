import * as React from 'react'

/** Mobile breakpoint threshold in pixels */
const MOBILE_BREAKPOINT = 768

/**
 * Hook for detecting mobile screen size with responsive updates
 * 
 * @description Monitors screen width and provides real-time updates
 * when crossing the mobile breakpoint threshold.
 * 
 * @returns {boolean} True if screen width is below mobile breakpoint (768px)
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
