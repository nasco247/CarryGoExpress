import { useState, useEffect } from 'react'
import { supabase, getProducts, getProductById } from '../lib/supabase'

// Hook for fetching products directly from Supabase with realtime synchronization
export function useProducts(filters = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error: sbError, count } = await getProducts(filters)

      if (sbError) {
        console.warn('[useProducts] Supabase error:', sbError.message)
        setError(sbError.message)
        setProducts([])
        setTotalCount(0)
      } else {
        setProducts(data || [])
        setTotalCount(count || 0)
        setError(null)
      }
    } catch (err) {
      console.error('[useProducts] Unexpected error:', err)
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()

    // ── Supabase Realtime channel for live product tracking on user-end ──
    const channel = supabase
      .channel('public-products-changes')
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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [JSON.stringify(filters)])

  return { products, loading, error, totalCount, refetch: fetchProducts }
}

// Hook for single product directly from Supabase
export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      try {
        setLoading(true)
        const { data, error: sbError } = await getProductById(id)

        if (sbError) {
          console.warn('[useProduct] Supabase fetch error:', sbError.message)
          setError(sbError.message)
          setProduct(null)
        } else {
          setProduct(data)
          setError(null)
        }
      } catch (err) {
        console.error('[useProduct] Unexpected error:', err)
        setError(err.message)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()

    // Realtime update for this specific product (e.g. stock or price update by admin)
    const channel = supabase
      .channel(`product-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `id=eq.${id}` },
        (payload) => {
          console.log('[useProduct Realtime] Live update for product:', payload.new)
          setProduct(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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
