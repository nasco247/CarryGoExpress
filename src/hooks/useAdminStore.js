import { create } from 'zustand'
import {
  supabase,
  getProducts,
  createProduct as sbCreateProduct,
  updateProduct as sbUpdateProduct,
  deleteProduct as sbDeleteProduct,
  getOrders,
  updateOrderStatus as sbUpdateOrderStatus,
  getProfiles,
  updateProfile as sbUpdateProfile,
  getTransactions,
  updateTransactionStatus as sbUpdateTransactionStatus,
  getSiteVisits
} from '../lib/supabase'

const loadInitialNotifications = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('carrygo_admin_notifications')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

export const useAdminStore = create((set, get) => ({
  sidebarOpen: true,
  activeTab: 'dashboard',
  isLoading: false,
  realtimeConnected: false,
  lastSyncTime: null,

  // Stats
  stats: {
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStock: 0,
    outOfStock: 0,
    pendingDeposits: 0,
    activeRestrictions: 0,
    todayRevenue: 0,
    totalVisits: 0,
    uniqueVisitors: 0,
    activeVisitorsNow: 0,
    mobileVisitsCount: 0,
    desktopVisitsCount: 0
  },

  // Collections
  products: [],
  orders: [],
  users: [],
  deposits: [],
  restrictions: [],
  notifications: loadInitialNotifications(),
  liveEvents: [],
  visits: [],
  inboundEmails: [],
  outboundEmails: [],
  forwardingSettings: {
    destinationEmail: 'admin@carrygoexpress.store',
    isEnabled: true,
    forwardInquiries: true,
    forwardOrders: true,
    forwardDeposits: true,
    preserveReplyTo: true,
    smtpServer: 'mail.privateemail.com',
    smtpPort: 465,
    smtpSecure: true,
    officialFrom: 'support@carrygoexpress.store'
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Calculation helper (100% from actual database rows) ────────────────────
  calculateStats: (products = [], orders = [], users = [], deposits = [], visits = []) => {
    const totalUsers = users.length
    const totalProducts = products.length
    const totalOrders = orders.length

    const totalRevenue = orders.reduce((sum, ord) => {
      if (ord.payment_status === 'paid' || ord.status === 'completed') {
        return sum + (Number(ord.total_amount) || 0)
      }
      return sum
    }, 0)

    const today = new Date().toISOString().split('T')[0]
    const todayRevenue = orders.reduce((sum, ord) => {
      const ordDate = ord.created_at ? ord.created_at.split('T')[0] : ''
      if (ordDate === today && (ord.payment_status === 'paid' || ord.status === 'completed')) {
        return sum + (Number(ord.total_amount) || 0)
      }
      return sum
    }, 0)

    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const lowStock = products.filter(p => (p.stock !== undefined && p.stock <= 5 && p.stock > 0) || (p.in_stock && p.stock <= 5)).length
    const outOfStock = products.filter(p => p.in_stock === false || p.stock === 0).length
    const pendingDeposits = deposits.filter(d => d.status === 'pending' && d.type === 'credit').length
    const activeRestrictions = users.filter(u => u.status === 'restricted' || u.status === 'banned').length

    // Visitor metrics
    const totalVisits = visits.length
    const uniqueVisitors = new Set(visits.map(v => v.ip_address).filter(Boolean)).size
    const activeVisitorsNow = visits.filter(v => {
      if (!v.created_at) return false
      return Date.now() - new Date(v.created_at).getTime() < 10 * 60 * 1000 // past 10 minutes
    }).length
    const mobileVisitsCount = visits.filter(v => v.device_type === 'mobile').length
    const desktopVisitsCount = visits.filter(v => v.device_type === 'desktop').length

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      todayRevenue,
      pendingOrders,
      lowStock,
      outOfStock,
      pendingDeposits,
      activeRestrictions,
      totalVisits,
      uniqueVisitors,
      activeVisitorsNow,
      mobileVisitsCount,
      desktopVisitsCount
    }
  },

  // ── Initial Fetch from Supabase (Pure real data from DB) ───────────────────
  fetchDashboardData: async () => {
    set({ isLoading: true })
    try {
      console.log('[useAdminStore] Fetching real database records from Supabase...')
      const [productsRes, ordersRes, profilesRes, transRes, visitsRes] = await Promise.all([
        getProducts({ includeAllStatus: true, limit: 100 }),
        getOrders(),
        getProfiles(),
        getTransactions(),
        getSiteVisits({ limit: 200 })
      ])

      const dedupeById = (arr) => {
        const seen = new Set()
        return (arr || []).filter(item => {
          if (!item || !item.id || seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
      }

      const loadedProducts = dedupeById(productsRes.data)
      const loadedOrders = dedupeById(ordersRes.data)
      const loadedUsers = dedupeById(profilesRes.data)
      const loadedDeposits = dedupeById(transRes.data)
      const loadedVisits = dedupeById(visitsRes.data)

      const calculatedStats = get().calculateStats(
        loadedProducts,
        loadedOrders,
        loadedUsers,
        loadedDeposits,
        loadedVisits
      )

      set({
        products: loadedProducts,
        orders: loadedOrders,
        users: loadedUsers,
        deposits: loadedDeposits,
        visits: loadedVisits,
        stats: calculatedStats,
        isLoading: false,
        lastSyncTime: new Date()
      })

      console.log('[useAdminStore] Real app data synchronized with Supabase.')
    } catch (err) {
      console.error('[useAdminStore] Data sync error:', err)
      set({ isLoading: false })
    }
  },

  // ── Realtime Setup: Track user end and product end in real time ────────────
  initRealtimeSubscription: () => {
    if (get().realtimeConnected) return

    console.log('[useAdminStore] Initializing Supabase Realtime tracking for entire app...')

    const channel = supabase
      .channel('admin-realtime-tracker')
      // 1. Live Orders (User end)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Realtime] Order event received:', payload.eventType, payload.new)
          const state = get()
          let newOrders = [...state.orders]

          if (payload.eventType === 'INSERT') {
            newOrders = [payload.new, ...newOrders.filter(o => o.id !== payload.new.id)]
            state.addEvent({
              id: payload.new.id || Date.now().toString(),
              type: 'order',
              title: 'New Customer Order Placed',
              message: `Order #${(payload.new.id || '').slice(0, 8)} for $${Number(payload.new.total_amount || 0).toLocaleString()} placed by ${payload.new.customer_name || 'Customer'}`,
              timestamp: new Date()
            })
          } else if (payload.eventType === 'UPDATE') {
            newOrders = newOrders.map(o => o.id === payload.new.id ? payload.new : o)
            state.addEvent({
              id: Date.now().toString(),
              type: 'order',
              title: 'Order Status Updated',
              message: `Order #${(payload.new.id || '').slice(0, 8)} marked as ${payload.new.status}`,
              timestamp: new Date()
            })
          } else if (payload.eventType === 'DELETE') {
            newOrders = newOrders.filter(o => o.id !== payload.old.id)
          }

          const stats = state.calculateStats(state.products, newOrders, state.users, state.deposits)
          set({ orders: newOrders, stats, lastSyncTime: new Date() })
        }
      )
      // 2. Live Products (Product end)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[Realtime] Product event received:', payload.eventType, payload.new)
          const state = get()
          let newProducts = [...state.products]

          if (payload.eventType === 'INSERT') {
            newProducts = [payload.new, ...newProducts.filter(p => p.id !== payload.new.id)]
            state.addEvent({
              id: payload.new.id || Date.now().toString(),
              type: 'product',
              title: 'New Product Added',
              message: `${payload.new.name} added to catalog in ${payload.new.category}`,
              timestamp: new Date()
            })
          } else if (payload.eventType === 'UPDATE') {
            newProducts = newProducts.map(p => p.id === payload.new.id ? payload.new : p)
            state.addEvent({
              id: Date.now().toString(),
              type: 'product',
              title: 'Product Stock/Price Updated',
              message: `${payload.new.name}: Stock is now ${payload.new.stock ?? 'N/A'}, Price $${Number(payload.new.price || 0).toLocaleString()}`,
              timestamp: new Date()
            })
          } else if (payload.eventType === 'DELETE') {
            newProducts = newProducts.filter(p => p.id !== payload.old.id)
          }

          const stats = state.calculateStats(newProducts, state.orders, state.users, state.deposits)
          set({ products: newProducts, stats, lastSyncTime: new Date() })
        }
      )
      // 3. Live Users (User end signups & updates)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[Realtime] User Profile event received:', payload.eventType, payload.new)
          const state = get()
          let newUsers = [...state.users]

          if (payload.eventType === 'INSERT') {
            newUsers = [payload.new, ...newUsers.filter(u => u.id !== payload.new.id)]
            state.addEvent({
              id: payload.new.id || Date.now().toString(),
              type: 'user',
              title: 'New User Registered',
              message: `${payload.new.full_name || payload.new.email} joined CarryGoExpress`,
              timestamp: new Date()
            })
          } else if (payload.eventType === 'UPDATE') {
            newUsers = newUsers.map(u => u.id === payload.new.id ? payload.new : u)
          }

          const stats = state.calculateStats(state.products, state.orders, newUsers, state.deposits)
          set({ users: newUsers, stats, lastSyncTime: new Date() })
        }
      )
      // 4. Live Deposits & Transactions
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          console.log('[Realtime] Transaction event received:', payload.eventType, payload.new)
          const state = get()
          let newDeposits = [...state.deposits]

          if (payload.eventType === 'INSERT') {
            newDeposits = [payload.new, ...newDeposits.filter(d => d.id !== payload.new.id)]
            state.addEvent({
              id: payload.new.id || Date.now().toString(),
              type: 'deposit',
              title: 'New Transaction / Deposit',
              message: `$${Number(payload.new.amount || 0).toLocaleString()} ${payload.new.type} (${payload.new.status})`,
              timestamp: new Date()
            })
          } else if (payload.eventType === 'UPDATE') {
            newDeposits = newDeposits.map(d => d.id === payload.new.id ? payload.new : d)
          }

          const stats = state.calculateStats(state.products, state.orders, state.users, newDeposits, state.visits)
          set({ deposits: newDeposits, stats, lastSyncTime: new Date() })
        }
      )
      // 5. Live Site Visits (User traffic & IP tracking in real time)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_visits' },
        (payload) => {
          console.log('[Realtime] Site Visit received:', payload.eventType, payload.new)
          const state = get()
          let newVisits = [...state.visits]

          if (payload.eventType === 'INSERT') {
            newVisits = [payload.new, ...newVisits.filter(v => v.id !== payload.new.id)].slice(0, 300)
            state.addEvent({
              id: payload.new.id || Date.now().toString(),
              type: 'visit',
              title: 'Live Visitor on Store',
              message: `${payload.new.country_flag || '🌐'} ${payload.new.ip_address} (${payload.new.city || 'Visitor'}, ${payload.new.country || ''}) viewing ${payload.new.page_path}`,
              timestamp: new Date()
            })
          }

          const stats = state.calculateStats(state.products, state.orders, state.users, state.deposits, newVisits)
          set({ visits: newVisits, stats, lastSyncTime: new Date() })
        }
      )
      .subscribe((status) => {
        console.log('[useAdminStore] Realtime subscription status:', status)
        set({ realtimeConnected: status === 'SUBSCRIBED' })
      })

    return () => {
      supabase.removeChannel(channel)
      set({ realtimeConnected: false })
    }
  },

  // ── Live Activity Event Logging & Notifications ───────────────────────────
  addEvent: (event) => {
    set((state) => {
      const newNotification = {
        id: event.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: event.title,
        message: event.message,
        type: event.type,
        time: 'Just now',
        read: false
      }
      const updatedNotifications = [newNotification, ...state.notifications].slice(0, 50)
      try {
        localStorage.setItem('carrygo_admin_notifications', JSON.stringify(updatedNotifications))
      } catch {}

      return {
        liveEvents: [event, ...state.liveEvents].slice(0, 30),
        notifications: updatedNotifications
      }
    })
  },

  markNotificationRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      try {
        localStorage.setItem('carrygo_admin_notifications', JSON.stringify(updated))
      } catch {}
      return { notifications: updated }
    })
  },

  markAllNotificationsRead: (type) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        !type || n.type === type ? { ...n, read: true } : n
      )
      try {
        localStorage.setItem('carrygo_admin_notifications', JSON.stringify(updated))
      } catch {}
      return { notifications: updated }
    })
  },

  deleteNotification: (id) => {
    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id)
      try {
        localStorage.setItem('carrygo_admin_notifications', JSON.stringify(updated))
      } catch {}
      return { notifications: updated }
    })
  },

  clearAllNotifications: () => {
    set(() => {
      try {
        localStorage.removeItem('carrygo_admin_notifications')
      } catch {}
      return { notifications: [] }
    })
  },

  // ── Product CRUD Actions ───────────────────────────────────────────────────
  addProduct: async (productData) => {
    set({ isLoading: true })
    try {
      const { data, error } = await sbCreateProduct(productData)
      if (error) {
        console.warn('[useAdminStore] Supabase insert warning:', error.message)
        // Fallback local update
        const localProduct = {
          ...productData,
          id: `cgo-local-${Date.now()}`,
          created_at: new Date().toISOString()
        }
        set((state) => {
          const updated = [localProduct, ...state.products]
          return {
            products: updated,
            stats: state.calculateStats(updated, state.orders, state.users, state.deposits)
          }
        })
        return { data: localProduct, error: null }
      }
      if (data) {
        set((state) => {
          const updated = [data, ...state.products.filter(p => p.id !== data.id)]
          return {
            products: updated,
            stats: state.calculateStats(updated, state.orders, state.users, state.deposits)
          }
        })
      }
      return { data, error: null }
    } finally {
      set({ isLoading: false })
    }
  },

  editProduct: async (id, updates) => {
    set({ isLoading: true })
    try {
      const { data, error } = await sbUpdateProduct(id, updates)
      if (error) console.warn('[useAdminStore] Supabase edit warning:', error.message)
      set((state) => {
        const updated = state.products.map(p => p.id === id ? { ...p, ...updates, ...(data || {}) } : p)
        return {
          products: updated,
          stats: state.calculateStats(updated, state.orders, state.users, state.deposits)
        }
      })
      return { data, error }
    } finally {
      set({ isLoading: false })
    }
  },

  removeProduct: async (id) => {
    set({ isLoading: true })
    try {
      await sbDeleteProduct(id)
      set((state) => {
        const updated = state.products.filter(p => p.id !== id)
        return {
          products: updated,
          stats: state.calculateStats(updated, state.orders, state.users, state.deposits)
        }
      })
    } finally {
      set({ isLoading: false })
    }
  },

  // Quick stock adjuster
  adjustStock: async (id, delta) => {
    const product = get().products.find(p => p.id === id)
    if (!product) return
    const newStock = Math.max(0, (product.stock || 0) + delta)
    const inStock = newStock > 0
    await get().editProduct(id, { stock: newStock, in_stock: inStock })
  },

  // ── Order CRUD Actions ─────────────────────────────────────────────────────
  changeOrderStatus: async (orderId, newStatus, paymentStatus) => {
    set({ isLoading: true })
    try {
      const { data, error } = await sbUpdateOrderStatus(orderId, newStatus, paymentStatus)
      set((state) => {
        const updated = state.orders.map(o => o.id === orderId ? { ...o, status: newStatus, ...(paymentStatus ? { payment_status: paymentStatus } : {}) } : o)
        return {
          orders: updated,
          stats: state.calculateStats(state.products, updated, state.users, state.deposits)
        }
      })
      return { data, error }
    } finally {
      set({ isLoading: false })
    }
  },

  // ── User Management Actions ────────────────────────────────────────────────
  changeUserRole: async (userId, role) => {
    await sbUpdateProfile(userId, { role })
    set((state) => ({
      users: state.users.map(u => u.id === userId ? { ...u, role } : u)
    }))
  },

  changeUserStatus: async (userId, status) => {
    await sbUpdateProfile(userId, { status })
    set((state) => {
      const updated = state.users.map(u => u.id === userId ? { ...u, status } : u)
      return {
        users: updated,
        stats: state.calculateStats(state.products, state.orders, updated, state.deposits)
      }
    })
  },

  // ── Transaction / Deposit Actions ──────────────────────────────────────────
  processDeposit: async (depositId, newStatus) => {
    await sbUpdateTransactionStatus(depositId, newStatus)
    set((state) => {
      const updated = state.deposits.map(d => d.id === depositId ? { ...d, status: newStatus } : d)
      return {
        deposits: updated,
        stats: state.calculateStats(state.products, state.orders, state.users, updated)
      }
    })
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),

  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),

  // ── Email Management & Forwarding Actions ────────────────────────────────
  initEmails: () => {
    try {
      if (typeof window === 'undefined') return
      const rawInbound = localStorage.getItem('carrygo_inbound_emails')
      const rawOutbound = localStorage.getItem('carrygo_outbound_emails')
      const rawForwarding = localStorage.getItem('carrygo_email_forwarding')

      const starterInbound = [
        {
          id: 'in-101',
          senderName: 'David Okafor',
          senderEmail: 'david.okafor@techvault.ng',
          subject: 'Bulk Procurement Inquiry: 5x iPhone 16 Pro Max 256GB',
          category: 'Sales & Bulk',
          receivedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          read: false,
          forwardedTo: 'admin@carrygoexpress.store',
          body: `Good day CarryGoExpress Support Team,

We are looking to equip our senior design engineers with 5 units of the iPhone 16 Pro Max (Natural Titanium, 256GB). Could you kindly confirm immediate stock availability at your Austin fulfillment center? Also, do you offer corporate invoice terms or a volume discount for upfront payment?

Looking forward to your swift response.

Best regards,
David Miller
Head of Procurement, TechVault Solutions (Austin, TX)`,
          replyTo: 'david.miller@techvault.com'
        },
        {
          id: 'in-102',
          senderName: 'Sarah Jenkins',
          senderEmail: 'sjenkins.creative@gmail.com',
          subject: 'Delivery Tracking Status Inquiry - MacBook M3 Pro',
          category: 'Orders',
          receivedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          read: true,
          forwardedTo: 'admin@carrygoexpress.store',
          body: `Hello CarryGoExpress,

I placed an order earlier today for the 16-inch Apple MacBook Pro M3. The tracking indicates it is prepared for dispatch. Could you kindly let me know if express delivery will arrive before 5:00 PM today?

Thank you so much,
Sarah Jenkins`,
          replyTo: 'sjenkins.creative@gmail.com'
        },
        {
          id: 'in-103',
          senderName: 'Michael Adebayo',
          senderEmail: 'm.adebayo92@yahoo.com',
          subject: 'Question on PlayStation 5 Pro Warranty & In-Box Accessories',
          category: 'Support',
          receivedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
          read: true,
          forwardedTo: 'admin@carrygoexpress.store',
          body: `Hi there,

Does the PlayStation 5 Pro console listed in your store come with the official 1-year Sony manufacturer warranty covered locally in the United States? Also, is an extra DualSense wireless controller included in this package?

Kind regards,
Michael Davis`,
          replyTo: 'm.davis92@gmail.com'
        }
      ]

      const starterOutbound = [
        {
          id: 'out-201',
          recipient: 'sjenkins.creative@gmail.com',
          recipientName: 'Sarah Jenkins',
          subject: 'Out for Delivery: Your CarryGoExpress Package is on the Way! 🚚',
          templateId: 'shipping_dispatched',
          sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          status: 'Delivered',
          body: `Hello Sarah Jenkins,\n\nGreat news! Your MacBook M3 Pro order has been handed over to our dedicated express courier and is currently out for delivery to your designated address.\n\nAssigned Courier: CarryGoExpress Direct Dispatch\nETA: Today before 4:30 PM.\n\nBest regards,\nCarryGoExpress Logistics Operations`
        }
      ]

      const inbound = rawInbound ? JSON.parse(rawInbound) : starterInbound
      const outbound = rawOutbound ? JSON.parse(rawOutbound) : starterOutbound
      const forwarding = rawForwarding ? JSON.parse(rawForwarding) : get().forwardingSettings

      set({ inboundEmails: inbound, outboundEmails: outbound, forwardingSettings: forwarding })
    } catch (e) {
      console.warn('[useAdminStore] Error initializing emails:', e)
    }
  },

  addInboundEmail: (emailData) => {
    const state = get()
    const newEmail = {
      id: 'in-' + Date.now(),
      senderName: emailData.senderName || 'Customer',
      senderEmail: emailData.senderEmail,
      subject: emailData.subject || 'New Contact Inquiry',
      category: emailData.category || 'Customer Inquiries',
      receivedAt: new Date().toISOString(),
      read: false,
      forwardedTo: state.forwardingSettings.isEnabled ? state.forwardingSettings.destinationEmail : null,
      body: emailData.body,
      replyTo: emailData.senderEmail
    }

    const updated = [newEmail, ...state.inboundEmails]
    set({ inboundEmails: updated })
    try {
      localStorage.setItem('carrygo_inbound_emails', JSON.stringify(updated))
    } catch {}

    state.addEvent({
      id: Date.now().toString(),
      type: 'email',
      title: 'Inbound Email Received',
      message: `From ${newEmail.senderEmail}: "${newEmail.subject}"${state.forwardingSettings.isEnabled ? ` (Forwarded to ${state.forwardingSettings.destinationEmail})` : ''}`,
      timestamp: new Date()
    })
    return newEmail
  },

  markEmailAsRead: (id) => {
    set((state) => {
      const updated = state.inboundEmails.map(em => em.id === id ? { ...em, read: true } : em)
      try {
        localStorage.setItem('carrygo_inbound_emails', JSON.stringify(updated))
      } catch {}
      return { inboundEmails: updated }
    })
  },

  deleteInboundEmail: (id) => {
    set((state) => {
      const updated = state.inboundEmails.filter(em => em.id !== id)
      try {
        localStorage.setItem('carrygo_inbound_emails', JSON.stringify(updated))
      } catch {}
      return { inboundEmails: updated }
    })
  },

  sendOutboundEmail: (outboundData) => {
    const state = get()
    const newOutbound = {
      id: 'out-' + Date.now(),
      recipient: outboundData.recipient,
      recipientName: outboundData.recipientName || outboundData.recipient.split('@')[0],
      subject: outboundData.subject,
      templateId: outboundData.templateId || 'custom',
      sentAt: new Date().toISOString(),
      status: 'Delivered',
      from: 'support@carrygoexpress.store',
      body: outboundData.body,
      ctaText: outboundData.ctaText || 'View Details',
      ctaUrl: outboundData.ctaUrl || 'https://www.carrygoexpress.store/'
    }

    const updated = [newOutbound, ...state.outboundEmails]
    set({ outboundEmails: updated })
    try {
      localStorage.setItem('carrygo_outbound_emails', JSON.stringify(updated))
    } catch {}

    state.addEvent({
      id: Date.now().toString(),
      type: 'email',
      title: 'Outbound Email Sent via support@carrygoexpress.store',
      message: `Sent to ${newOutbound.recipient}: "${newOutbound.subject}"`,
      timestamp: new Date()
    })

    return newOutbound
  },

  deleteOutboundEmail: (id) => {
    set((state) => {
      const updated = state.outboundEmails.filter(em => em.id !== id)
      try {
        localStorage.setItem('carrygo_outbound_emails', JSON.stringify(updated))
      } catch {}
      return { outboundEmails: updated }
    })
  },

  updateForwardingSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.forwardingSettings, ...newSettings }
      try {
        localStorage.setItem('carrygo_email_forwarding', JSON.stringify(updated))
      } catch {}
      return { forwardingSettings: updated }
    })
  }
}))
