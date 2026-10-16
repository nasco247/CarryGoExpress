import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import ScrollToTop from './components/ScrollToTop'
import Navbar from './components/Navbar'
import CartSidebar from './components/CartSidebar'
import Footer from './components/Footer'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import ProductDetail from './pages/ProductDetail'
import { Login, Register } from './pages/Auth'
import Profile from './pages/Profile'
import MyOrders from './pages/MyOrders'
import Transactions from './pages/Transactions'
import Deposit from './pages/Deposit'
import Checkout from './pages/Checkout'
import Deals from './pages/Deals'
import AboutUs from './pages/AboutUs'
import OurStores from './pages/OurStores'
import Careers from './pages/Careers'
import Contact from './pages/Contact'
import Blog from './pages/Blog'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import { useAuthStore } from './hooks/useStore'

// Admin Imports
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminProducts from './pages/admin/Products'
import AdminOrders from './pages/admin/Orders'
import AdminDeposits from './pages/admin/Deposits'
import AdminRestrictions from './pages/admin/Restrictions'
import AdminNotifications from './pages/admin/Notifications'
import AdminSettings from './pages/admin/Settings'
import AdminVisitors from './pages/admin/Visitors'
import VisitorTracker from './components/VisitorTracker'

// ── Shared Layout Wrapper ────────────────────────────────────────────────────
// Wraps all public-facing pages with Navbar, CartSidebar, main content, Footer
function MainLayout({ children, fullWidth = false }) {
  return (
    <div className="min-h-screen bg-veltrix-black text-white">
      <Navbar />
      <CartSidebar />
      <main className={fullWidth ? '' : ''}>{children}</main>
      <Footer />
    </div>
  )
}

// ── Protected Route ────────────────────────────────────────────────────────────
function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-veltrix-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-veltrix-blue border-t-transparent rounded-full" />
          <p className="text-veltrix-gray-400 text-sm">Loading CarryGoExpress...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to login')
    return <Navigate to={requireAdmin ? "/login?redirect=/admin" : "/login"} replace />
  }

  const isAdmin = user.user_metadata?.role === 'admin' || user.email?.includes('admin') || profile?.role === 'admin'
  if (requireAdmin && !isAdmin) {
    console.log('[ProtectedRoute] User lacks admin role, redirecting to home')
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    console.log('[App] Initializing CarryGoExpress Store...')
    initialize()
  }, [initialize])

  return (
    <>
      <VisitorTracker />
      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/" element={
          <MainLayout>
            <Home />
          </MainLayout>
        } />

        <Route path="/product/:id" element={
          <MainLayout>
            <ProductDetail />
          </MainLayout>
        } />

        <Route path="/login" element={
          <MainLayout>
            <Login />
          </MainLayout>
        } />

        <Route path="/register" element={
          <MainLayout>
            <Register />
          </MainLayout>
        } />

        <Route path="/category/:category" element={
          <MainLayout>
            <CategoryPage />
          </MainLayout>
        } />

        <Route path="/search" element={
          <MainLayout>
            <Home />
          </MainLayout>
        } />

        <Route path="/brand/:brand" element={
          <MainLayout>
            <CategoryPage />
          </MainLayout>
        } />

        {/* ── Static Pages ── */}
        <Route path="/deals" element={<MainLayout><Deals /></MainLayout>} />
        <Route path="/new-arrivals" element={<MainLayout><Deals /></MainLayout>} />
        
        <Route path="/about-us" element={<MainLayout><AboutUs /></MainLayout>} />
        <Route path="/our-stores" element={<MainLayout><OurStores /></MainLayout>} />
        <Route path="/careers" element={<MainLayout><Careers /></MainLayout>} />
        <Route path="/blog" element={<MainLayout><Blog /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><PrivacyPolicy /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><TermsOfService /></MainLayout>} />

        {/* ── Protected User Routes ── */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute>
            <MainLayout>
              <MyOrders />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/transactions" element={
          <ProtectedRoute>
            <MainLayout>
              <Transactions />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/deposit" element={
          <ProtectedRoute>
            <MainLayout>
              <Deposit />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/checkout" element={
          <ProtectedRoute>
            <MainLayout>
              <Checkout />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* ── Admin Routes ── */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="visitors" element={<AdminVisitors />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="deposits" element={<AdminDeposits />} />
          <Route path="restrictions" element={<AdminRestrictions />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
