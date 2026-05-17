import { useState, useEffect } from 'react'

export function useIsPortrait(): boolean {
  const [portrait, setPortrait] = useState(() => window.innerWidth < window.innerHeight)
  useEffect(() => {
    const update = () => setPortrait(window.innerWidth < window.innerHeight)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return portrait
}
