import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    // Immediately disable smooth scroll so the viewport snaps to top on navigation
    const html = document.documentElement
    const originalScrollBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    // Restore smooth scroll behavior for in-page anchors
    const raf = requestAnimationFrame(() => {
      html.style.scrollBehavior = originalScrollBehavior
    })

    return () => cancelAnimationFrame(raf)
  }, [pathname, search])

  return null
}
