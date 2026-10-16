import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Package, Truck, CheckCircle, XCircle,
  ChevronRight, Clock, Search, Filter, RefreshCw, AlertCircle
} from 'lucide-react'
import { useAuthStore, useOrderStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'

// ─── How this page works ─────────────────────────────────────────────────────
// 1. Fetches all orders for the logged-in user from Supabase `orders` table
// 2. Each order links to individual items stored in `order_items` table
// 3. Orders can be filtered by status: all, pending, processing, delivered, cancelled
// 4. Shows order timeline, item count, total price and payment status
// ──────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'yellow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  processing: { label: 'Processing', icon: RefreshCw, color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  shipped: { label: 'Shipped', icon: Truck, color: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'green', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'red', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
}

export default function MyOrders() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { orders, isLoading, error, fetchOrders } = useOrderStore()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    if (!user) {
      console.log('[MyOrders] No user, redirecting to login')
      navigate('/login')
      return
    }
    console.log('[MyOrders] Fetching orders for:', user.id)
    fetchOrders(user.id)
  }, [user, navigate, fetchOrders])

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter
    const matchesSearch = !search ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.order_items?.some(item =>
        item.product_name?.toLowerCase().includes(search.toLowerCase())
      )
    return matchesFilter && matchesSearch
  })

  if (!user) return null

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Orders</h1>
            <p className="text-veltrix-gray-400 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
          <button
            onClick={() => fetchOrders(user.id)}
            className="flex items-center gap-2 px-4 py-2 border border-veltrix-gray-700 rounded-xl text-veltrix-gray-400 hover:text-white hover:border-veltrix-gray-600 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* ── How It Works Banner ── */}
        <div className="mb-6 p-4 bg-veltrix-blue/5 border border-veltrix-blue/20 rounded-2xl">
          <p className="text-xs text-veltrix-gray-400">
            📦 <strong className="text-veltrix-blue">Order Tracking:</strong> Orders move through →
            <span className="text-yellow-400 mx-1">Pending</span> →
            <span className="text-blue-400 mx-1">Processing</span> →
            <span className="text-purple-400 mx-1">Shipped</span> →
            <span className="text-green-400 mx-1">Delivered</span>.
            Click any order to see its details and items.
          </p>
        </div>

        {/* ── Filters & Search ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order ID or product name..."
              className="w-full pl-10 pr-4 py-3 bg-veltrix-black-light border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-veltrix-gray-500 shrink-0" />
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  filter === status
                    ? 'bg-veltrix-blue text-black'
                    : 'bg-veltrix-black-light border border-veltrix-gray-700 text-veltrix-gray-400 hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin w-10 h-10 border-4 border-veltrix-blue border-t-transparent rounded-full" />
            <p className="text-veltrix-gray-400 mt-4 text-sm">Loading your orders...</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-veltrix-gray-900 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-veltrix-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {filter !== 'all' || search ? 'No matching orders' : 'No orders yet'}
            </h3>
            <p className="text-veltrix-gray-400 text-sm mb-6">
              {filter !== 'all' || search
                ? 'Try adjusting your filter or search'
                : 'Start shopping to see your orders here'}
            </p>
            <Link to="/" className="btn-primary">Start Shopping</Link>
          </div>
        )}

        {/* ── Orders List ── */}
        {!isLoading && filteredOrders.length > 0 && (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const StatusIcon = status.icon
              const isExpanded = expandedOrder === order.id

              return (
                <div
                  key={order.id}
                  className={`bg-veltrix-black-light border rounded-2xl overflow-hidden transition-all ${
                    isExpanded ? 'border-veltrix-blue/40' : 'border-veltrix-gray-800 hover:border-veltrix-gray-700'
                  }`}
                >
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bg} border ${status.border}`}>
                        <StatusIcon className={`w-5 h-5 ${status.text}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-xs text-veltrix-gray-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          &nbsp;·&nbsp;
                          {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-veltrix-blue">{formatPrice(order.total_amount)}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-veltrix-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {/* Mobile price & status */}
                  <div className="sm:hidden px-5 pb-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <p className="text-sm font-bold text-veltrix-blue">{formatPrice(order.total_amount)}</p>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="border-t border-veltrix-gray-800 p-5 space-y-4">
                      {/* Order Items */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">Items Ordered</h4>
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-3 bg-veltrix-black/50 rounded-xl">
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-veltrix-gray-800"
                              />
                            )}
                            {!item.product_image && (
                              <div className="w-14 h-14 bg-veltrix-gray-900 rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-veltrix-gray-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
                              <p className="text-xs text-veltrix-gray-500 mt-0.5">Qty: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-bold text-veltrix-blue shrink-0">{formatPrice(item.total_price)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      {order.delivery_address && (
                        <div className="p-3 bg-veltrix-black/50 rounded-xl">
                          <h4 className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-1">Delivery Address</h4>
                          <p className="text-sm text-veltrix-gray-300">{order.delivery_address}</p>
                        </div>
                      )}

                      {/* Payment info */}
                      <div className="flex flex-wrap gap-3 pt-2 border-t border-veltrix-gray-800">
                        <div className="text-xs">
                          <span className="text-veltrix-gray-500">Payment: </span>
                          <span className={order.payment_status === 'paid' ? 'text-green-400 font-medium' : 'text-yellow-400 font-medium'}>
                            {order.payment_status || 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-veltrix-gray-500">Ref: </span>
                          <span className="text-veltrix-gray-300 font-mono">{order.payment_reference?.slice(0, 16) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
