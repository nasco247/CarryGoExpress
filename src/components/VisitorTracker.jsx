import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../hooks/useStore'
import { trackPageView } from '../lib/visitorTracker'

export default function VisitorTracker() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Track every page view with current path and user context
    trackPageView(location.pathname, user)
  }, [location.pathname, user])

  return null
}
