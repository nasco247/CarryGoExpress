import { useState, useEffect } from 'react'
import { supabase, getProducts, getProductById, getCachedProducts } from '../lib/supabase'

// Hook for fetching products directly from Supabase with realtime synchronization
export function useProducts(filters = {}) {
  // Pre-seed state from local cache so user gets instantaneous 0ms display on arrival/refresh
  const [products, setProducts] = useState(() => {
    const cached = getCachedProducts()
    if (!filters.search && (!filters.brand || filters.brand.length === 0) && (!filters.category || filters.category.length === 0)) {
      return cached.length > 0 ? cached : []
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCachedProducts()
    return cached.length === 0
  })
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(() => {
    const cached = getCachedProducts()
    return cached.length
  })

  const fetchProducts = async (isRetry = false) => {
    try {
      setProducts(prev => {
        if (!prev || prev.length === 0) setLoading(true)
        return prev
      })

      const { data, error: sbError, count } = await getProducts(filters)

      if (sbError) {
        console.warn('[useProducts] Supabase notice:', sbError.message)
        // If we already have products displayed (e.g. from cache or previous state), keep them!
        setProducts(current => {
          if (!current || current.length === 0) {
            setError(sbError.message)
            setTotalCount(0)
            return []
          }
          return current
        })

        // Auto-retry once quietly after 2 seconds
        if (!isRetry) {
          setTimeout(() => fetchProducts(true), 2000)
        }
      } else {
        setProducts(data || [])
        setTotalCount(count || (data ? data.length : 0))
        setError(null)
      }
    } catch (err) {
      console.warn('[useProducts] Unexpected error:', err.message)
      setProducts(current => {
        if (!current || current.length === 0) {
          setError(err.message)
          return []
        }
        return current
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    // ── Supabase Realtime channel for live product tracking on user-end ──
    // Use unique instance ID so multiple components on the same page don't collide
    const channelId = `public-products-${Math.random().toString(36).substring(2, 9)}`
    let channel = null

    try {
      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            console.log('[useProducts Realtime] Product change detected:', payload.eventType)
            // Refetch to ensure filters and sorting remain consistent
            fetchProducts()
          }
        )
        .subscribe()
    } catch (subErr) {
      console.warn('[useProducts Realtime] Subscription issue:', subErr)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch {}
      }
    }
  }, [JSON.stringify(filters)])

  return { products, loading, error, totalCount, refetch: fetchProducts }
}

// Hook for single product directly from Supabase
export function useProduct(id) {
  const [product, setProduct] = useState(() => {
    if (!id) return null
    const cached = getCachedProducts()
    return cached.find(p => p.id === id) || null
  })
  const [loading, setLoading] = useState(() => {
    if (!id) return false
    const cached = getCachedProducts()
    return !cached.some(p => p.id === id)
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      try {
        if (!product) setLoading(true)
        const { data, error: sbError } = await getProductById(id)

        if (sbError) {
          console.warn('[useProduct] Supabase fetch notice:', sbError.message)
          if (!product) {
            setError(sbError.message)
            setProduct(null)
          }
        } else {
          setProduct(data)
          setError(null)
        }
      } catch (err) {
        console.error('[useProduct] Unexpected error:', err)
        if (!product) {
          setError(err.message)
          setProduct(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()

    // Realtime update for this specific product with unique channel instance
    const channelId = `product-${id}-${Math.random().toString(36).substring(2, 9)}`
    let channel = null

    try {
      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` },
          (payload) => {
            console.log('[useProduct Realtime] Live update for product:', payload.new)
            setProduct(payload.new)
          }
        )
        .subscribe()
    } catch (subErr) {
      console.warn('[useProduct Realtime] Subscription issue:', subErr)
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch {}
      }
    }
  }, [id])

  return { product, loading, error }
}

// Hook for auth state
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}

// Hook for scroll position
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { scrollY, isScrolled }
}
