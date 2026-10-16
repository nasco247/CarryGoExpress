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

const supabaseUrl = isValidHttpUrl(rawUrl) ? rawUrl : 'https://vhvwtogqeajcaudyyvit.supabase.co'
const supabaseAnonKey = rawKey || 'sb_publishable_1l-0AyjNMiSyJKaeNocKow_ovYmJtCl'

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

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

// ── Products API (Full Supabase CRUD) ────────────────────────────────────────
export const getProducts = async (filters = {}) => {
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
  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice)
  }
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  // Sorting
  const sortField = filters.sortBy || 'name'
  const sortOrder = filters.sortOrder || 'asc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  // Pagination
  if (filters.limit) {
    const page = filters.page || 1
    const limit = filters.limit
    const start = (page - 1) * limit
    query = query.range(start, start + limit - 1)
  }

  const { data, error, count } = await query
  return { data: data || [], error, count: count || (data ? data.length : 0) }
}

export const getProductById = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export const createProduct = async (productData) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single()
  return { data, error }
}

export const updateProduct = async (id, updates) => {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export const deleteProduct = async (id) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  return { error }
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
    name: 'CarryGo Hisense 55" ULED 4K Smart TV',
    sku: 'CGO-TV-55U',
    brand: 'CarryGoExpress',
    category: 'Televisions',
    price: 485000,
    original_price: 520000,
    description: 'Experience stunning 4K resolution with ULED technology. Features Dolby Vision HDR, built-in voice commands, and ultra-smooth motion.',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600',
    badge: 'Best Seller',
    in_stock: true,
    stock: 12,
    rating: 4.8,
    reviews: 124,
    status: 'active'
  },
  {
    name: 'CarryGo Hisense 65" QLED Smart TV',
    sku: 'CGO-TV-65Q',
    brand: 'CarryGoExpress',
    category: 'Televisions',
    price: 685000,
    original_price: 750000,
    description: 'Quantum Dot technology delivers over a billion shades of color with exceptional brightness and accuracy.',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600',
    badge: 'Popular',
    in_stock: true,
    stock: 8,
    rating: 4.9,
    reviews: 89,
    status: 'active'
  },
  {
    name: 'CarryGo Hisense 43" Full HD Smart TV',
    sku: 'CGO-TV-43F',
    brand: 'CarryGoExpress',
    category: 'Televisions',
    price: 185000,
    original_price: 210000,
    description: 'Perfect for bedrooms, apartments and office spaces. Built-in WiFi, Netflix, YouTube, and multiple HDMI inputs.',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600',
    badge: null,
    in_stock: true,
    stock: 25,
    rating: 4.5,
    reviews: 256,
    status: 'active'
  },
  {
    name: 'CarryGo Hisense 75" Mini-LED Cinema TV',
    sku: 'CGO-TV-75M',
    brand: 'CarryGoExpress',
    category: 'Televisions',
    price: 1250000,
    original_price: 1450000,
    description: 'Mini-LED backlight with 1000+ local dimming zones for extraordinary contrast and cinematic HDR performance.',
    image: 'https://images.unsplash.com/photo-1601944179066-29b8f7e13a56?w=600',
    badge: 'Premium',
    in_stock: true,
    stock: 4,
    rating: 4.9,
    reviews: 45,
    status: 'active'
  },
  {
    name: 'CarryGo SoundPulse 2.1 Soundbar HS218',
    sku: 'CGO-AUD-SB1',
    brand: 'CarryGoExpress',
    category: 'Audio',
    price: 85000,
    original_price: 95000,
    description: '2.1 channel soundbar with dedicated wireless subwoofer. Dolby Audio and effortless Bluetooth streaming.',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600',
    badge: 'Hot Deal',
    in_stock: true,
    stock: 15,
    rating: 4.6,
    reviews: 78,
    status: 'active'
  },
  {
    name: 'CarryGo Ultra Bass Surround System',
    sku: 'CGO-AUD-HT5',
    brand: 'CarryGoExpress',
    category: 'Audio',
    price: 195000,
    original_price: 230000,
    description: 'Complete home theater system with immersive spatial sound, optical connection, and remote control.',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600',
    badge: 'Top Rated',
    in_stock: true,
    stock: 9,
    rating: 4.7,
    reviews: 52,
    status: 'active'
  },
  {
    name: 'CarryGo CinemaMax 100" 4K Laser TV',
    sku: 'CGO-PRJ-100',
    brand: 'CarryGoExpress',
    category: 'Projectors',
    price: 2100000,
    original_price: 2400000,
    description: 'Ultra-short throw 4K laser projection delivering up to 100 inches of razor-sharp cinema display in any room.',
    image: 'https://images.unsplash.com/photo-1517604931442-7105376f2611?w=600',
    badge: 'Flagship',
    in_stock: true,
    stock: 3,
    rating: 5.0,
    reviews: 18,
    status: 'active'
  },
  {
    name: 'CarryGo Portable Smart Mini Projector',
    sku: 'CGO-PRJ-MIN',
    brand: 'CarryGoExpress',
    category: 'Projectors',
    price: 145000,
    original_price: 175000,
    description: 'Pocket-sized smart projector with built-in battery, automatic keystone alignment, and wireless mirroring.',
    image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600',
    badge: 'Portable',
    in_stock: true,
    stock: 14,
    rating: 4.4,
    reviews: 63,
    status: 'active'
  },
  {
    name: 'CarryGo Pro Wireless ANC Headphones',
    sku: 'CGO-HPH-NC1',
    brand: 'CarryGoExpress',
    category: 'Headphones',
    price: 65000,
    original_price: 80000,
    description: 'Active noise cancellation with 40 hours of playtime. Premium ergonomic memory foam cushions.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    badge: 'Trending',
    in_stock: true,
    stock: 20,
    rating: 4.8,
    reviews: 140,
    status: 'active'
  },
  {
    name: 'CarryGo 27" QHD 165Hz IPS Gaming Monitor',
    sku: 'CGO-MON-27G',
    brand: 'CarryGoExpress',
    category: 'Monitors',
    price: 230000,
    original_price: 260000,
    description: 'Ultra-smooth 165Hz refresh rate with 1ms response time and vivid QHD resolution for gamers and creators.',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
    badge: 'Gaming',
    in_stock: true,
    stock: 11,
    rating: 4.7,
    reviews: 85,
    status: 'active'
  },
  {
    name: 'CarryGo Smart Home Automation Hub',
    sku: 'CGO-SMT-HB1',
    brand: 'CarryGoExpress',
    category: 'Smart Home',
    price: 45000,
    original_price: 55000,
    description: 'Universal smart bridge compatible with Zigbee, Matter, Alexa and Google Home for total control of your devices.',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600',
    badge: null,
    in_stock: true,
    stock: 18,
    rating: 4.5,
    reviews: 39,
    status: 'active'
  },
  {
    name: 'CarryGo Hisense 32" HD LED Smart TV',
    sku: 'CGO-TV-32H',
    brand: 'CarryGoExpress',
    category: 'Televisions',
    price: 115000,
    original_price: 130000,
    description: 'Energy-saving smart TV with vivid color boosting and stereo speakers. Compact, reliable and feature-packed.',
    image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600',
    badge: 'Budget Pick',
    in_stock: true,
    stock: 30,
    rating: 4.4,
    reviews: 210,
    status: 'active'
  }
]

export const seedInitialProducts = async () => {
  try {
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
    if (count === 0 || count === null) {
      console.log('[Supabase] Seeding CarryGoExpress products...')
      const { data, error } = await supabase.from('products').insert(CARRYGO_STARTER_PRODUCTS).select()
      return { data, error, seeded: true }
    }
    return { count, seeded: false }
  } catch (err) {
    console.error('[Supabase] Error seeding initial products:', err)
    return { error: err.message, seeded: false }
  }
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
      .select()
      .single()

    return { data, error }
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
