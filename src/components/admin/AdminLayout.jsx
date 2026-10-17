import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Users, Package, ShoppingCart, CreditCard, 
  Ban, Bell, Settings, LogOut, Menu, X, ChevronRight,
  TrendingUp, AlertTriangle, Shield, ExternalLink, Radio, RefreshCw,
  Globe, Activity, Mail
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { useAuthStore } from '../../hooks/useStore'
import { signOut } from '../../lib/supabase'

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Live Orders', badge: 'orders' },
  { path: '/admin/products', icon: Package, label: 'Product Inventory', badge: 'products' },
  { path: '/admin/emails', icon: Mail, label: 'Store Emails & AI', badge: 'emails' },
  { path: '/admin/visitors', icon: Globe, label: 'Visitor & IP Traffic', badge: 'visitors' },
  { path: '/admin/users', icon: Users, label: 'User Accounts', badge: 'users' },
  { path: '/admin/deposits', icon: CreditCard, label: 'Deposits & Finance', badge: 'deposits' },
  { path: '/admin/restrictions', icon: Ban, label: 'Restrictions & Bans', badge: 'restrictions' },
  { path: '/admin/notifications', icon: Bell, label: 'Realtime Alerts', badge: 'notifications' },
  { path: '/admin/settings', icon: Settings, label: 'Store Settings', badge: null },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const {
    stats,
    notifications,
    inboundEmails,
    initEmails,
    realtimeConnected,
    fetchDashboardData,
    initRealtimeSubscription,
    isLoading
  } = useAdminStore()

  useEffect(() => {
    fetchDashboardData()
    if (typeof initEmails === 'function') initEmails()
    const unsubscribe = initRealtimeSubscription()
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [fetchDashboardData, initRealtimeSubscription, initEmails])

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      await signOut()
    }
    navigate('/login')
  }

  const getBadgeCount = (badge) => {
    switch(badge) {
      case 'users': return stats.totalUsers || 0
      case 'orders': return stats.pendingOrders || 0
      case 'products': return stats.lowStock || 0
      case 'deposits': return stats.pendingDeposits || 0
      case 'restrictions': return stats.activeRestrictions || 0
      case 'visitors': return stats.activeVisitorsNow || 0
      case 'notifications': return notifications.filter(n => !n.read).length
      case 'emails': return (inboundEmails || []).filter(e => !e.read).length
      default: return 0
    }
  }

  return (
    <div className="min-h-screen bg-veltrix-black text-white flex relative">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-veltrix-black-light border-r border-veltrix-gray-800 transition-all duration-300 shadow-2xl lg:shadow-none ${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-veltrix-gray-800">
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-veltrix-blue to-veltrix-blue-dark rounded-xl flex items-center justify-center shrink-0 shadow-glow">
                <span className="text-veltrix-black font-black text-lg">CG</span>
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-extrabold text-base leading-none text-white tracking-tight">
                    CarryGo<span className="text-veltrix-blue">Express</span>
                  </h1>
                  <p className="text-[10px] text-veltrix-gray-400 tracking-wider mt-1 font-semibold uppercase">
                    Admin Center
                  </p>
                </div>
              )}
            </Link>

            {/* Mobile close sidebar button */}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-800 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Realtime Status Indicator in Sidebar */}
          {sidebarOpen && (
            <div className="mx-4 mt-4 p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold text-green-400">
                  {realtimeConnected ? 'Live Realtime Active' : 'Realtime Syncing'}
                </span>
              </div>
              <button 
                onClick={() => fetchDashboardData()} 
                className="text-veltrix-gray-500 hover:text-white transition-colors"
                title="Force Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              const badgeCount = getBadgeCount(item.badge)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-veltrix-blue/20 text-veltrix-blue font-semibold' 
                      : 'text-veltrix-gray-400 hover:bg-veltrix-gray-900 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-veltrix-blue' : ''}`} />
                  {sidebarOpen && (
                    <>
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {badgeCount > 0 && (
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          item.badge === 'products' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          item.badge === 'orders' ? 'bg-veltrix-blue/20 text-veltrix-blue border border-veltrix-blue/30' :
                          'bg-red-500 text-white'
                        }`}>
                          {badgeCount}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90 text-veltrix-blue' : 'opacity-0 group-hover:opacity-100'}`} />
                    </>
                  )}
                  {!sidebarOpen && badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-veltrix-gray-800 space-y-2">
            <Link
              to="/"
              target="_blank"
              className={`flex items-center gap-3 px-3 py-2 text-xs font-medium text-veltrix-gray-400 hover:text-veltrix-blue hover:bg-veltrix-blue/10 rounded-xl transition-all w-full ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>View Customer Store</span>}
            </Link>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-3 py-2.5 text-veltrix-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all w-full ${
                !sidebarOpen && 'justify-center'
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="text-xs font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-veltrix-black-light/80 backdrop-blur-xl border-b border-veltrix-gray-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-900 rounded-lg transition-all"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-veltrix-gray-500">
              <span className="font-semibold text-veltrix-blue">CarryGoExpress</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white capitalize">
                {location.pathname.replace('/admin', '').replace('/', '') || 'Realtime Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Realtime Live Pulse */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Supabase Realtime Live</span>
            </div>

            {/* Notifications */}
            <Link
              to="/admin/notifications"
              className="relative p-2 text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-900 rounded-lg transition-all"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-veltrix-blue text-veltrix-black text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-veltrix-gray-900 transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-veltrix-blue to-veltrix-blue-dark rounded-full flex items-center justify-center shadow-glow">
                  <span className="text-veltrix-black font-extrabold text-sm">A</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-white leading-none">CarryGo Admin</p>
                  <p className="text-[10px] text-veltrix-gray-400 mt-0.5">Super Admin</p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl shadow-2xl py-2 animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-veltrix-gray-800">
                    <p className="text-sm font-bold text-white">CarryGo Admin</p>
                    <p className="text-xs text-veltrix-gray-500 truncate">support@carrygoexpress.store</p>
                  </div>
                  <Link 
                    to="/admin/settings" 
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-veltrix-gray-300 hover:text-veltrix-blue hover:bg-veltrix-gray-900 transition-colors"
                  >
                    Store Settings
                  </Link>
                  <Link 
                    to="/" 
                    target="_blank"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-veltrix-gray-300 hover:text-veltrix-blue hover:bg-veltrix-gray-900 transition-colors"
                  >
                    Open Live Customer Store
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 w-full max-w-full min-w-0 p-3.5 sm:p-5 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav 
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,4px)] pt-1 bg-veltrix-black-light/95 backdrop-blur-2xl border-t border-veltrix-gray-800 z-40 flex items-center justify-between px-1.5 shadow-2xl"
        >
          <Link 
            to="/admin" 
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 min-w-0 rounded-xl transition-all active:scale-95 ${
              location.pathname === '/admin' 
                ? 'text-veltrix-blue bg-veltrix-blue/10 border border-veltrix-blue/30 font-bold shadow-glow' 
                : 'text-veltrix-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight truncate w-full text-center mt-0.5">Dashboard</span>
          </Link>

          <Link 
            to="/admin/orders" 
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 min-w-0 rounded-xl relative transition-all active:scale-95 ${
              location.pathname === '/admin/orders' 
                ? 'text-veltrix-blue bg-veltrix-blue/10 border border-veltrix-blue/30 font-bold shadow-glow' 
                : 'text-veltrix-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 shrink-0" />
              {stats.pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-veltrix-blue animate-pulse" />
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate w-full text-center mt-0.5">Orders</span>
          </Link>

          <Link 
            to="/admin/products" 
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 min-w-0 rounded-xl transition-all active:scale-95 ${
              location.pathname === '/admin/products' 
                ? 'text-veltrix-blue bg-veltrix-blue/10 border border-veltrix-blue/30 font-bold shadow-glow' 
                : 'text-veltrix-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <Package className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight truncate w-full text-center mt-0.5">Catalog</span>
          </Link>

          <Link 
            to="/admin/visitors" 
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 min-w-0 rounded-xl relative transition-all active:scale-95 ${
              location.pathname === '/admin/visitors' 
                ? 'text-veltrix-blue bg-veltrix-blue/10 border border-veltrix-blue/30 font-bold shadow-glow' 
                : 'text-veltrix-gray-400 hover:text-white border border-transparent'
            }`}
          >
            <div className="relative">
              <Globe className="w-5 h-5 shrink-0" />
              {stats.activeVisitorsNow > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-green-400 animate-ping" />
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate w-full text-center mt-0.5">Visitors</span>
          </Link>

          <button 
            type="button"
            onClick={() => setSidebarOpen(true)} 
            className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 min-w-0 rounded-xl text-veltrix-gray-400 hover:text-white border border-transparent transition-all active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight truncate w-full text-center mt-0.5">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
