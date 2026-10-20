import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, getCurrentUser, signOut } from '../lib/supabase'

// ─── Auth Store ───────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  _initializing: false,
  _initialized: false,

  initialize: async () => {
    if (get()._initializing || get()._initialized) return
    set({ _initializing: true })
    console.log('[Auth] Initializing auth store...')

    // Safety fallback: allow ample time for mobile/wireless cold start
    const safetyTimer = setTimeout(() => {
      if (get().isLoading) {
        console.warn('[Auth] Initialization safety timeout reached (7500ms)')
        set({ isLoading: false, _initializing: false })
      }
    }, 7500)

    try {
      const user = await getCurrentUser()
      clearTimeout(safetyTimer)
      console.log('[Auth] Current user:', user?.id || 'none')

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.warn('[Auth] Profile fetch notice:', error.message)
        }
        set({ user, profile: profile || null, isLoading: false, _initialized: true, _initializing: false })
      } else {
        set({ user: null, profile: null, isLoading: false, _initialized: true, _initializing: false })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth] Auth state changed:', event)
        const currentUser = session?.user || null
        set({ user: currentUser })

        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()
          set({ profile: profile || null })
        } else {
          set({ profile: null })
        }
      })
    } catch (err) {
      clearTimeout(safetyTimer)
      console.error('[Auth] Initialization error:', err)
      set({ isLoading: false, _initializing: false })
    }
  },

  refreshProfile: async () => {
    const { user } = get()
    if (!user) return
    console.log('[Auth] Refreshing profile for user:', user.id)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (error) {
      console.warn('[Auth] Profile refresh warning:', error.message)
      return
    }
    set({ profile: profile || null })
  },

  setUser: (user) => set({ user }),
  logout: async () => {
    console.log('[Auth] Complete signout initiated')
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('carrygo-admin-session')
      }
      await signOut()
    } catch (e) {
      console.warn('[Auth] Signout caught error:', e)
    }
    set({ user: null, profile: null, isLoading: false })
  }
}))

// ─── Cart Store (persisted) ────────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        console.log('[Cart] Adding item:', product.name)
        const items = get().items
        const existing = items.find(item => item.id === product.id)

        if (existing) {
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + (product.quantity || 1) }
                : item
            )
          })
        } else {
          set({ items: [...items, { ...product, quantity: product.quantity || 1 }] })
        }
      },

      removeItem: (productId) => {
        console.log('[Cart] Removing item:', productId)
        set({ items: get().items.filter(item => item.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
        })
      },

      clearCart: () => {
        console.log('[Cart] Clearing cart')
        set({ items: [] })
      },

      toggleCart: () => set({ isOpen: !get().isOpen }),
      closeCart: () => set({ isOpen: false }),
      openCart: () => set({ isOpen: true }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
    }),
    {
      name: 'carrygo-cart',
      partialize: (state) => ({ items: state.items })
    }
  )
)

// ─── UI Store ─────────────────────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  isMenuOpen: false,
  isSearchOpen: false,

  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  closeMenu: () => set({ isMenuOpen: false }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  closeSearch: () => set({ isSearchOpen: false })
}))

// ─── Order Store ──────────────────────────────────────────────────────────────
export const useOrderStore = create((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async (userId) => {
    console.log('[Orders] Fetching orders for user:', userId)
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Orders] Fetch error:', error)
        set({ error: error.message, isLoading: false })
        return
      }
      console.log('[Orders] Fetched', data?.length, 'orders')
      set({ orders: data || [], isLoading: false })
    } catch (err) {
      console.error('[Orders] Unexpected error:', err)
      set({ error: 'Failed to load orders', isLoading: false })
    }
  },

  createOrder: async (userId, cartItems, totalAmount, deliveryAddress, paymentRef, customerDetails = {}) => {
    console.log('[Orders] Creating order for user:', userId, '| Total:', totalAmount)
    try {
      // Create the order record with customer info
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total_amount: totalAmount,
          status: 'pending',
          payment_reference: paymentRef,
          payment_status: 'paid',
          delivery_address: deliveryAddress,
          customer_name: customerDetails.name || null,
          customer_email: customerDetails.email || null,
        })
        .select()
        .single()

      if (orderError) {
        console.error('[Orders] Create order error:', orderError)
        throw orderError
      }
      console.log('[Orders] Order created:', order.id)

      // Create order items (handle valid UUIDs vs numeric fallbacks cleanly)
      const orderItems = cartItems.map(item => {
        const isValidUUID = typeof item.id === 'string' && item.id.length === 36
        return {
          order_id: order.id,
          product_id: isValidUUID ? item.id : null,
          product_name: item.name,
          product_image: item.image,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('[Orders] Create order items error:', itemsError)
        throw itemsError
      }

      console.log('[Orders] Order items created successfully')
      return { order, error: null }
    } catch (err) {
      console.error('[Orders] createOrder failed:', err)
      return { order: null, error: err.message }
    }
  }
}))

// ─── Transaction / Deposit Store ─────────────────────────────────────────────
export const useTransactionStore = create((set) => ({
  transactions: [],
  walletBalance: 0,
  isLoading: false,
  error: null,

  fetchTransactions: async (userId) => {
    console.log('[Transactions] Fetching for user:', userId)
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Transactions] Fetch error:', error)
        set({ error: error.message, isLoading: false })
        return
      }

      const balance = data
        ? data
            .filter(t => t.status === 'success')
            .reduce((sum, t) => {
              const amt = parseFloat(t.amount) || 0
              return t.type === 'credit' ? sum + amt : sum - amt
            }, 0)
        : 0

      console.log('[Transactions] Fetched', data?.length, 'transactions | Balance:', balance)
      set({ transactions: data || [], walletBalance: balance, isLoading: false })
    } catch (err) {
      console.error('[Transactions] Unexpected error:', err)
      set({ error: 'Failed to load transactions', isLoading: false })
    }
  },

  recordDeposit: async (userId, amount, paymentRef, email) => {
    console.log('[Transactions] Recording deposit | Amount:', amount, '| Ref:', paymentRef)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'credit',
          amount,
          status: 'success',
          reference: paymentRef,
          description: `Wallet top-up via Paystack`,
          email,
        })
        .select()
        .single()

      if (error) {
        console.error('[Transactions] Record deposit error:', error)
        throw error
      }
      console.log('[Transactions] Deposit recorded successfully:', data.id)
      return { data, error: null }
    } catch (err) {
      console.error('[Transactions] recordDeposit failed:', err)
      return { data: null, error: err.message }
    }
  },

  recordDebit: async (userId, amount, reference, description) => {
    console.log('[Transactions] Recording debit | Amount:', amount, '| Ref:', reference)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'debit',
          amount,
          status: 'success',
          reference,
          description,
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('[Transactions] recordDebit failed:', err)
      return { data: null, error: err.message }
    }
  }
}))
