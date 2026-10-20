import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Ensure valid URL format so client creation doesn't throw invalid URL error
const isValidHttpUrl = (str) => {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

if (!rawUrl || !rawKey) {
  console.warn('[CarryGoExpress] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Ensure your .env file is configured.')
}

const supabaseUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://your-project.supabase.co'
const supabaseAnonKey = rawKey || 'your-supabase-publishable-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// ── Auth Helpers ─────────────────────────────────────────────────────────────
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata }
  })
  return { data, error }
}

export const resendConfirmationEmail = async (email) => {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase()
    })
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    // Explicitly wipe all supabase session tokens from localStorage
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token') || key.includes('carrygo-auth'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k))
      } catch (e) {
        console.warn('[signOut] LocalStorage cleanup warning:', e)
      }
    }
    return { error: null }
  } catch (err) {
    console.warn('[signOut] Caught signOut error, wiping local tokens anyway:', err)
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token') || key.includes('carrygo-auth'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k))
      } catch (e) {
        console.warn('[signOut] LocalStorage cleanup error:', e)
      }
    }
    return { error: null }
  }
}

export const getCurrentUser = async () => {
  try {
    // 7-second timeout to accommodate slower mobile/wireless cold-starts
    const userPromise = supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        // "Auth session missing!" is standard for guest visitors who haven't signed in yet
        if (error.name === 'AuthSessionMissingError' || error.message?.toLowerCase().includes('session missing')) {
          return null
        }
        // Stale or corrupted session: reset local auth state
        console.warn('[Auth] Stale or invalid session detected, resetting local auth state:', error.message)
        signOut()
        return null
      }
      return data?.user || null
    })
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 7000))
    const user = await Promise.race([userPromise, timeoutPromise])
    return user
  } catch {
    return null
  }
}

// ── Product Cache Helpers ───────────────────────────────────────────────────
const PRODUCT_CACHE_KEY = 'carrygo_cached_products'

export const getCachedProducts = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PRODUCT_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {}
  return []
}

export const setCachedProducts = (products) => {
  if (typeof window === 'undefined' || !Array.isArray(products) || products.length === 0) return
  try {
    localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(products))
  } catch (e) {
    // Quota limits or private browsing, fail silently
  }
}

// ── Products API (Full Supabase CRUD) ────────────────────────────────────────
export const getProducts = async (filters = {}) => {
  const buildQuery = () => {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Admin may want all products, otherwise default to active for customer
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    } else if (!filters.includeAllStatus) {
      query = query.eq('status', 'active')
    }

    if (filters.brand && filters.brand.length > 0) {
      query = query.in('brand', Array.isArray(filters.brand) ? filters.brand : [filters.brand])
    }
    if (filters.category && filters.category.length > 0) {
      query = query.in('category', Array.isArray(filters.category) ? filters.category : [filters.category])
    }
    if (filters.subcategory && filters.subcategory.length > 0) {
      query = query.in('subcategory', Array.isArray(filters.subcategory) ? filters.subcategory : [filters.subcategory])
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    // Sorting: default to newest arrivals (created_at DESC) so newly added products show up immediately
    const sortField = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || (filters.sortBy ? 'asc' : 'desc')
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Pagination
    if (filters.limit) {
      const page = filters.page || 1
      const limit = filters.limit
      const start = (page - 1) * limit
      query = query.range(start, start + limit - 1)
    }

    return query
  }

  // Attempt query with 12s timeout protection
  const executeQuery = async () => {
    const queryPromise = buildQuery()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Product query timeout after 12s')), 12000)
    )
    return await Promise.race([queryPromise, timeoutPromise])
  }

  try {
    let result = await executeQuery()

    // If a temporary network glitch occurred, retry once after 400ms
    if (result.error) {
      console.warn('[getProducts] Query issue on initial attempt, retrying once...', result.error.message)
      await new Promise(r => setTimeout(r, 400))
      result = await executeQuery()
    }

    if (result.data) {
      // Cache products if this is an active catalog fetch
      if (!filters.search && (!filters.brand || filters.brand.length === 0) && (!filters.category || filters.category.length === 0)) {
        if (!filters.limit || filters.limit >= 50) {
          setCachedProducts(result.data)
        } else {
          // Merge newly fetched products into cache without dropping the rest of the catalog
          const current = getCachedProducts()
          const map = new Map(current.map(p => [p.id, p]))
          result.data.forEach(p => map.set(p.id, p))
          setCachedProducts(Array.from(map.values()))
        }
      }
      return { 
        data: result.data || [], 
        error: result.error || null, 
        count: result.count ?? (result.data ? result.data.length : 0) 
      }
    }

    throw result.error || new Error('No product data returned')
  } catch (err) {
    console.warn('[getProducts] Live query error/timeout, checking cache fallback:', err.message)

    // Fall back to cached products so user never sees a broken empty store
    const cached = getCachedProducts()
    if (cached.length > 0) {
      let filtered = cached
      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(p => p.status === filters.status)
      } else if (!filters.includeAllStatus) {
        filtered = filtered.filter(p => !p.status || p.status === 'active')
      }
      if (filters.brand && filters.brand.length > 0) {
        const brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand]
        filtered = filtered.filter(p => brands.includes(p.brand))
      }
      if (filters.category && filters.category.length > 0) {
        const cats = Array.isArray(filters.category) ? filters.category : [filters.category]
        filtered = filtered.filter(p => cats.includes(p.category))
      }
      if (filters.limit) {
        filtered = filtered.slice(0, filters.limit)
      }
      return { data: filtered, error: null, count: filtered.length, fromCache: true }
    }

    return { data: [], error: err, count: 0 }
  }
}

export const getProductById = async (id) => {
  try {
    const queryPromise = supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Product fetch timeout')), 10000)
    )
    const { data, error } = await Promise.race([queryPromise, timeoutPromise])
    if (data) return { data, error: null }
  } catch (err) {
    console.warn('[getProductById] Live query failed or timed out:', err.message)
  }

  // Cache fallback for single product
  const cached = getCachedProducts()
  const found = cached.find(p => p.id === id)
  if (found) {
    return { data: found, error: null }
  }

  return { data: null, error: new Error('Product not found') }
}

// Safe RFC4122 UUID generator that is 100% compliant with PostgreSQL UUID schema
export const generateSafeUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const createProduct = async (productData) => {
  const cleanData = {
    ...productData,
    price: parseFloat(productData.price) || 0,
    original_price: productData.original_price ? parseFloat(productData.original_price) : null,
    stock: parseInt(productData.stock) || 0,
    in_stock: (parseInt(productData.stock) || 0) > 0,
    updated_at: new Date().toISOString()
  }

  try {
    const executeInsert = async () => {
      return await supabase
        .from('products')
        .insert([cleanData])
        .select()
        .single()
    }

    // 8-second timeout protection: prevent browser fetch from hanging indefinitely on save
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Product creation timed out after 8s')), 8000)
    )

    const { data, error } = await Promise.race([executeInsert(), timeoutPromise])

    if (error) {
      throw error
    }

    if (data) {
      const cached = getCachedProducts()
      setCachedProducts([data, ...cached.filter(p => p.id !== data.id)])
      return { data, error: null }
    }

    throw new Error('No product row returned from database')
  } catch (err) {
    console.warn('[createProduct] Live database insert warning/timeout, saving to local catalog fallback:', err.message)
    // Create reliable fallback product with RFC4122 UUID so it never breaks DB/UI
    const fallbackProduct = {
      ...cleanData,
      id: cleanData.id || generateSafeUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const cached = getCachedProducts()
    setCachedProducts([fallbackProduct, ...cached.filter(p => p.id !== fallbackProduct.id)])
    return { data: fallbackProduct, error: null, warning: err.message }
  }
}

export const updateProduct = async (id, updates) => {
  const cleanUpdates = {
    ...updates,
    ...(updates.price !== undefined ? { price: parseFloat(updates.price) || 0 } : {}),
    ...(updates.original_price !== undefined ? { original_price: updates.original_price ? parseFloat(updates.original_price) : null } : {}),
    ...(updates.stock !== undefined ? { 
      stock: parseInt(updates.stock) || 0,
      in_stock: (parseInt(updates.stock) || 0) > 0
    } : {}),
    updated_at: new Date().toISOString()
  }

  try {
    const executeUpdate = async () => {
      return await supabase
        .from('products')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single()
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Product update timed out after 8s')), 8000)
    )

    const { data, error } = await Promise.race([executeUpdate(), timeoutPromise])

    if (error) throw error

    if (data) {
      const cached = getCachedProducts()
      setCachedProducts(cached.map(p => p.id === id ? data : p))
      return { data, error: null }
    }

    throw new Error('No updated data returned')
  } catch (err) {
    console.warn('[updateProduct] Live database update warning/timeout, applying to local catalog fallback:', err.message)
    const cached = getCachedProducts()
    const updatedList = cached.map(p => p.id === id ? { ...p, ...cleanUpdates } : p)
    setCachedProducts(updatedList)
    const localUpdated = updatedList.find(p => p.id === id) || { id, ...cleanUpdates }
    return { data: localUpdated, error: null, warning: err.message }
  }
}

export const deleteProduct = async (id) => {
  try {
    const executeDelete = async () => {
      return await supabase
        .from('products')
        .delete()
        .eq('id', id)
    }

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Product deletion timed out after 8s')), 8000)
    )

    const { error } = await Promise.race([executeDelete(), timeoutPromise])
    if (error) console.warn('[deleteProduct] Supabase delete warning:', error.message)

    const cached = getCachedProducts()
    setCachedProducts(cached.filter(p => p.id !== id))
    return { error: null }
  } catch (err) {
    console.warn('[deleteProduct] Live database deletion warning/timeout, removing from local catalog fallback:', err.message)
    const cached = getCachedProducts()
    setCachedProducts(cached.filter(p => p.id !== id))
    return { error: null, warning: err.message }
  }
}

// ── Orders API ───────────────────────────────────────────────────────────────
export const getOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export const getUserOrders = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export const updateOrderStatus = async (orderId, status, paymentStatus) => {
  const updates = { status, updated_at: new Date().toISOString() }
  if (paymentStatus) updates.payment_status = paymentStatus
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single()
  return { data, error }
}

// ── Profiles / Users API ─────────────────────────────────────────────────────
export const getProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export const updateProfile = async (id, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ── Transactions API ─────────────────────────────────────────────────────────
export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export const updateTransactionStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ── Cart operations ──────────────────────────────────────────────────────────
export const saveCartToSupabase = async (userId, cartItems) => {
  const { error } = await supabase
    .from('carts')
    .upsert({ user_id: userId, items: cartItems, updated_at: new Date() })
  return { error }
}

export const getCartFromSupabase = async (userId) => {
  const { data, error } = await supabase
    .from('carts')
    .select('items')
    .eq('user_id', userId)
    .single()
  return { data, error }
}

// ── Starter CarryGoExpress Products Seed ────────────────────────────────────
export const CARRYGO_STARTER_PRODUCTS = [
  {
    name: 'Apple iPhone 15 Pro Max 256GB - Natural Titanium',
    sku: 'CGO-IP15PM-256',
    brand: 'Apple',
    category: 'Smartphones & Tablets',
    subcategory: 'iPhone',
    price: 1680000,
    original_price: 1800000,
    description: 'Forged in titanium with industry-leading A17 Pro chip, customizable Action button, and 5x Telephoto camera.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
    badge: 'Flagship',
    in_stock: true,
    stock: 15,
    rating: 4.9,
    reviews: 142,
    status: 'active'
  },
  {
    name: 'Samsung Galaxy S24 Ultra 512GB AI - Titanium Gray',
    sku: 'CGO-S24U-512',
    brand: 'Samsung',
    category: 'Smartphones & Tablets',
    subcategory: 'Samsung Galaxy',
    price: 1720000,
    original_price: 1850000,
    description: 'Galaxy AI is here. 200MP camera system, built-in S Pen, Snapdragon 8 Gen 3 for Galaxy, and flat dynamic AMOLED 2X display.',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
    badge: 'Hot Deal',
    in_stock: true,
    stock: 12,
    rating: 4.9,
    reviews: 98,
    status: 'active'
  },
  {
    name: 'Apple MacBook Pro 16" M3 Pro 18GB / 512GB - Space Black',
    sku: 'CGO-MBP16-M3',
    brand: 'Apple',
    category: 'Laptops & Computers',
    subcategory: 'MacBooks',
    price: 2850000,
    original_price: 3100000,
    description: 'Liquid Retina XDR display, up to 22 hours of battery life, and monstrous performance powered by the Apple M3 Pro chip.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
    badge: 'Pro Tier',
    in_stock: true,
    stock: 6,
    rating: 5.0,
    reviews: 44,
    status: 'active'
  },
  {
    name: 'ASUS ROG Zephyrus G16 OLED Gaming Laptop RTX 4080',
    sku: 'CGO-ROG-G16',
    brand: 'ASUS',
    category: 'Laptops & Computers',
    subcategory: 'Gaming Laptops',
    price: 2450000,
    original_price: 2650000,
    description: 'Ultra-thin aluminum chassis, 240Hz 2.5K OLED ROG Nebula display, Intel Core Ultra 9, and NVIDIA GeForce RTX 4080 GPU.',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
    badge: 'Extreme Gaming',
    in_stock: true,
    stock: 5,
    rating: 4.8,
    reviews: 31,
    status: 'active'
  },
  {
    name: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    sku: 'CGO-SNY-XM5',
    brand: 'Sony',
    category: 'Audio & Sound',
    subcategory: 'Noise Cancelling Headphones',
    price: 385000,
    original_price: 430000,
    description: 'Industry-leading noise cancellation with 8 microphones, Auto NC Optimizer, and up to 30 hours of battery life with quick charging.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    badge: 'Best Seller',
    in_stock: true,
    stock: 22,
    rating: 4.9,
    reviews: 185,
    status: 'active'
  },
  {
    name: 'Apple AirPods Pro (2nd Gen) with MagSafe USB-C',
    sku: 'CGO-APP-2C',
    brand: 'Apple',
    category: 'Audio & Sound',
    subcategory: 'AirPods & Earbuds',
    price: 295000,
    original_price: 330000,
    description: 'Up to 2x more Active Noise Cancellation, Adaptive Audio, Transparency mode, and Personalized Spatial Audio with dynamic head tracking.',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600',
    badge: 'Popular',
    in_stock: true,
    stock: 35,
    rating: 4.8,
    reviews: 210,
    status: 'active'
  },
  {
    name: 'Apple Watch Ultra 2 GPS + Cellular 49mm Titanium',
    sku: 'CGO-AWU-2TI',
    brand: 'Apple',
    category: 'Smartwatches & Wearables',
    subcategory: 'Apple Watch',
    price: 980000,
    original_price: 1100000,
    description: 'The most rugged and capable Apple Watch. 3000-nit display, precision dual-frequency GPS, and up to 72 hours of battery in Low Power Mode.',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600',
    badge: 'Rugged Flagship',
    in_stock: true,
    stock: 8,
    rating: 4.9,
    reviews: 65,
    status: 'active'
  },
  {
    name: 'Sony PlayStation 5 Slim Console 1TB Disc Edition',
    sku: 'CGO-PS5-SLM',
    brand: 'Sony',
    category: 'Gaming & Handhelds',
    subcategory: 'PlayStation 5',
    price: 740000,
    original_price: 790000,
    description: 'Ultra-high-speed 1TB SSD, ray tracing, haptic feedback and adaptive triggers with the DualSense wireless controller.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600',
    badge: 'Top Pick',
    in_stock: true,
    stock: 14,
    rating: 5.0,
    reviews: 178,
    status: 'active'
  },
  {
    name: 'Anker 737 Power Bank (PowerCore 24K) 140W Fast Charge',
    sku: 'CGO-ANK-737',
    brand: 'Anker',
    category: 'Accessories & Power',
    subcategory: 'High Capacity Power Banks',
    price: 145000,
    original_price: 165000,
    description: '24,000mAh capacity with ultra-powerful two-way 140W fast charging. Smart digital display shows output and recharge time.',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600',
    badge: 'Fast Power',
    in_stock: true,
    stock: 28,
    rating: 4.8,
    reviews: 95,
    status: 'active'
  }
]

export const seedInitialProducts = async () => {
  // Disabled: Only live backend products are stored and shown
  return { seeded: false, message: 'Dummy products disabled. Live products only.' }
}

// ── Supabase Storage API ───────────────────────────────────────────────────
export const uploadProductImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `items/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath)

    return { url: publicUrlData.publicUrl, path: filePath, error: null }
  } catch (error) {
    console.error('[Supabase Storage] Upload error:', error)
    return { url: null, path: null, error: error.message }
  }
}

// ── Site Visits & Traffic Tracking API ──────────────────────────────────────
export const recordSiteVisit = async (visitData = {}) => {
  try {
    const { data, error } = await supabase
      .from('site_visits')
      .insert({
        ip_address: visitData.ip || '127.0.0.1',
        city: visitData.city || 'Unknown',
        region: visitData.region || 'Unknown',
        country: visitData.country || 'Unknown',
        country_code: visitData.country_code || '',
        country_flag: visitData.country_flag || '🌐',
        page_path: visitData.page_path || window.location.pathname,
        page_title: visitData.page_title || document.title,
        referrer: visitData.referrer || document.referrer || 'Direct',
        user_agent: visitData.user_agent || navigator.userAgent,
        browser: visitData.browser || 'Unknown',
        os: visitData.os || 'Unknown',
        device_type: visitData.device_type || 'desktop',
        screen_resolution: visitData.screen_resolution || `${window.screen.width}x${window.screen.height}`,
        session_id: visitData.session_id || 'anonymous',
        user_id: visitData.user_id || null,
        user_email: visitData.user_email || null,
      })

    if (error) {
      // If error is due to stale token (401 / JWT), wipe tokens
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.code === '401') {
        signOut()
      }
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err.message }
  }
}

export const getSiteVisits = async (options = {}) => {
  try {
    let query = supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query
    return { data: data || [], error }
  } catch (err) {
    return { data: [], error: err.message }
  }
}
