import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, User, Menu, X, ChevronDown, LogOut, Shield } from 'lucide-react'
import { useCartStore, useAuthStore } from '../hooks/useStore'
import { useScrollPosition } from '../hooks/useProducts'
import { signOut } from '../lib/supabase'
import { cn } from '../lib/utils'

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const { isScrolled } = useScrollPosition()
  const { getTotalItems, toggleCart } = useCartStore()
  const { user, profile, setUser, logout } = useAuthStore()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/category/televisions?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    setIsProfileOpen(false)
    setIsMobileMenuOpen(false)
    navigate('/login')
  }

  const [showPromo, setShowPromo] = useState(() => {
    return localStorage.getItem('hidePromo') !== 'true'
  })

  const dismissPromo = () => {
    setShowPromo(false)
    localStorage.setItem('hidePromo', 'true')
  }

  const isAdmin = user?.user_metadata?.role === 'admin' || profile?.role === 'admin'

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Phones', path: '/products?category=Smartphones%20%26%20Tablets' },
    { name: 'Laptops', path: '/products?category=Laptops%20%26%20Computers' },
    { name: 'Wearables', path: '/products?category=Smartwatches%20%26%20Wearables' },
    { name: 'Audio', path: '/products?category=Audio%20%26%20Sound' },
    { name: 'Gaming', path: '/products?category=Gaming%20%26%20Handhelds' },
    { name: 'Accessories', path: '/products?category=Accessories%20%26%20Power' },
  ]

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-veltrix-black/95 backdrop-blur-xl shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      {/* Top bar */}
      {showPromo && (
        <div className="bg-veltrix-blue text-veltrix-black py-2 px-4 relative text-center text-[10px] sm:text-xs font-extrabold tracking-wide flex justify-center items-center gap-2">
          <span>🚀 CARRYGOEXPRESS • FREE EXPRESS DELIVERY ON ORDERS ABOVE $100 • FAST SECURE SHIPPING</span>
          <button 
            onClick={dismissPromo}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/10 rounded-full transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-glow group-hover:scale-105 transition-transform border border-veltrix-blue/30 bg-black flex items-center justify-center">
              <img src="/logo.png" alt="CarryGoExpress" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none text-white">
                CarryGo<span className="text-veltrix-blue">Express</span>
              </h1>
              <p className="text-[9px] text-veltrix-gray-400 tracking-widest uppercase font-semibold">
                Fast & Secure Delivery
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-sm font-medium text-veltrix-gray-300 hover:text-veltrix-blue transition-colors duration-300 relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-veltrix-blue transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xs xl:max-w-sm mx-6"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products in CarryGoExpress..."
                className="w-full pl-10 pr-4 py-2 bg-veltrix-black-light border border-veltrix-gray-800 rounded-full text-xs text-white placeholder-veltrix-gray-500 focus:border-veltrix-blue focus:outline-none focus:ring-1 focus:ring-veltrix-blue/50 transition-all duration-300"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-veltrix-gray-500" />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-3">

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-veltrix-gray-300 hover:text-veltrix-blue transition-colors"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-veltrix-blue text-veltrix-black text-xs font-bold rounded-full flex items-center justify-center animate-bounce-subtle">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-veltrix-gray-900 transition-colors"
                  aria-label="Account menu"
                >
                  <div className="w-8 h-8 bg-veltrix-blue/20 text-veltrix-blue rounded-full flex items-center justify-center font-bold text-xs border border-veltrix-blue/30">
                    {user.email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-veltrix-gray-400 hidden sm:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl shadow-2xl py-2 animate-fade-in z-50">
                    <div className="px-4 py-2.5 border-b border-veltrix-gray-800">
                      <p className="text-[10px] text-veltrix-gray-500 uppercase font-semibold">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-purple-400 hover:bg-purple-500/10 transition-colors"
                      >
                        <Shield className="w-4 h-4" /> Admin Console
                      </Link>
                    )}

                    {[
                      { to: '/profile', label: 'My Profile' },
                      { to: '/orders', label: 'My Orders' },
                      { to: '/transactions', label: 'Wallet & Deposits' },
                      { to: '/deposit', label: 'Top-up Balance' },
                    ].map(link => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-2 text-sm text-veltrix-gray-300 hover:text-veltrix-blue hover:bg-veltrix-gray-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                    <div className="border-t border-veltrix-gray-800 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-veltrix-gray-900 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-semibold text-veltrix-blue border border-veltrix-blue/30 rounded-xl hover:bg-veltrix-blue/10 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-veltrix-gray-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-veltrix-black-light border-t border-veltrix-gray-800 animate-fade-in">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="md:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search CarryGoExpress..."
                  className="w-full pl-10 pr-4 py-2.5 bg-veltrix-black border border-veltrix-gray-800 rounded-xl text-white text-sm placeholder-veltrix-gray-500 focus:border-veltrix-blue focus:outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
              </div>
            </form>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-veltrix-gray-300 hover:text-veltrix-blue transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {!user ? (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-2 text-base font-semibold text-veltrix-blue"
              >
                Sign In / Register
              </Link>
            ) : (
              <div className="border-t border-veltrix-gray-800 pt-3 mt-1 space-y-1">
                <p className="text-xs text-veltrix-gray-500 uppercase tracking-wider mb-2">My Account</p>
                {[
                  { to: '/profile', label: 'My Profile' },
                  { to: '/orders', label: 'My Orders' },
                  { to: '/transactions', label: 'Wallet & Deposits' },
                  { to: '/deposit', label: 'Top-up Balance' },
                ].map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-veltrix-gray-300 hover:text-veltrix-blue transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false) }}
                  className="block py-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
