import { useState } from 'react'
import { 
  Search, Filter, Eye, CheckCircle, XCircle, 
  Clock, Truck, Package, CreditCard, ArrowUpRight, Download,
  Calendar, MapPin, User, RefreshCw, Mail
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { formatPrice } from '../../lib/utils'

export default function AdminOrders() {
  const { orders, changeOrderStatus, fetchDashboardData, isLoading } = useAdminStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const filteredOrders = orders.filter(order => {
    const orderId = (order.id || '').toLowerCase()
    const customer = (order.customer_name || order.customer_email || '').toLowerCase()
    const matchesSearch = orderId.includes(searchQuery.toLowerCase()) || customer.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusChange = async (orderId, newStatus, paymentStatus) => {
    setUpdatingId(orderId)
    await changeOrderStatus(orderId, newStatus, paymentStatus)
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus, ...(paymentStatus ? { payment_status: paymentStatus } : {}) }))
    }
    setUpdatingId(null)
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'processing': return 'bg-veltrix-blue/20 text-veltrix-blue border-veltrix-blue/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-veltrix-gray-800 text-veltrix-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Live Customer Orders</h1>
          <p className="text-xs sm:text-sm text-veltrix-gray-400 mt-1">
            Realtime stream of customer checkouts, fulfillment lifecycle, and payment verification.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs font-semibold text-veltrix-gray-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Orders
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: 'Total Placed', value: orders.length, icon: Package, color: 'blue' },
          { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle, color: 'green' },
          { label: 'Pending Action', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'yellow' },
          { label: 'In Transit', value: orders.filter(o => o.status === 'processing').length, icon: Truck, color: 'purple' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/60 p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  stat.color === 'blue' ? 'bg-veltrix-blue/20 text-veltrix-blue' :
                  stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-purple-500/20 text-purple-400'
                }`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-veltrix-gray-400 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-black text-white truncate">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or customer name/email..."
            className="w-full pl-11 pr-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 text-sm focus:border-veltrix-blue focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Container (Desktop Table + Mobile Cards) */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 overflow-hidden shadow-xl">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-3">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Date Placed</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veltrix-gray-800/40">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-veltrix-gray-900/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-veltrix-blue">
                    #{(order.id || '').slice(0, 8)}
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{order.customer_name || 'CarryGo Customer'}</p>
                    <p className="text-[11px] text-veltrix-gray-500">{order.customer_email || 'Verified user'}</p>
                  </td>

                  <td className="px-6 py-4 font-black text-white text-sm">
                    {formatPrice(order.total_amount)}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(order.status)}`}>
                      {order.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {order.status === 'pending' && <Clock className="w-3 h-3" />}
                      {order.status === 'processing' && <Truck className="w-3 h-3" />}
                      {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {order.payment_status || 'paid'}
                    </span>
                    <span className="block text-[10px] text-veltrix-gray-500 font-mono">
                      {order.payment_method || 'Card'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-veltrix-gray-400">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'processing')}
                          disabled={updatingId === order.id}
                          className="px-2.5 py-1 bg-veltrix-blue text-veltrix-black font-bold rounded-lg text-[11px] hover:shadow-glow transition-all"
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed', 'paid')}
                          disabled={updatingId === order.id}
                          className="px-2.5 py-1 bg-green-500 text-white font-bold rounded-lg text-[11px] hover:bg-green-600 transition-all"
                        >
                          Delivered
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-veltrix-gray-400 hover:text-veltrix-blue hover:bg-veltrix-blue/10 rounded-lg transition-all"
                        title="View Full Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Stack View */}
        <div className="md:hidden divide-y divide-veltrix-gray-800/60">
          {filteredOrders.map((order) => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-veltrix-blue">
                  #{(order.id || '').slice(0, 8)}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(order.status)}`}>
                  {order.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                  {order.status === 'pending' && <Clock className="w-3 h-3" />}
                  {order.status === 'processing' && <Truck className="w-3 h-3" />}
                  {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                  {order.status}
                </span>
              </div>

              <div>
                <p className="font-bold text-white text-sm">{order.customer_name || 'CarryGo Customer'}</p>
                <p className="text-xs text-veltrix-gray-500">{order.customer_email || 'Verified user'}</p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[10px] text-veltrix-gray-500 uppercase tracking-wider">Total</p>
                  <p className="font-black text-white text-base">{formatPrice(order.total_amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-veltrix-gray-500 uppercase tracking-wider">Payment</p>
                  <span className={`text-xs font-semibold ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {order.payment_status || 'paid'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-veltrix-gray-800/40">
                <span className="text-[11px] text-veltrix-gray-500">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'}
                </span>

                <div className="flex items-center gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'processing')}
                      disabled={updatingId === order.id}
                      className="px-3 py-1.5 bg-veltrix-blue text-veltrix-black font-bold rounded-lg text-xs"
                    >
                      Confirm
                    </button>
                  )}
                  {order.status === 'processing' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'completed', 'paid')}
                      disabled={updatingId === order.id}
                      className="px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg text-xs"
                    >
                      Delivered
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="p-1.5 px-3 text-xs font-semibold text-veltrix-blue bg-veltrix-blue/10 border border-veltrix-blue/20 rounded-lg flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-veltrix-gray-500">
            No orders found matching filters.
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-veltrix-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Order Details</h2>
                <p className="text-xs text-veltrix-gray-400 font-mono">#{selectedOrder.id}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-veltrix-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800">
                <div>
                  <span className="text-veltrix-gray-400 block mb-1">Status</span>
                  <span className={`inline-block px-3 py-1 rounded-full font-bold border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                {selectedOrder.metadata?.payment_plan && (
                  <div>
                    <span className="text-veltrix-gray-400 block mb-1">Payment Plan</span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-[11px]">
                      {selectedOrder.metadata.payment_plan}
                    </span>
                  </div>
                )}
                <div className="text-right">
                  <span className="text-veltrix-gray-400 block mb-1">Total Amount</span>
                  <span className="text-xl font-black text-white">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800 space-y-2">
                <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-veltrix-blue" /> Delivery Destination
                </h3>
                <p className="text-veltrix-gray-300">{selectedOrder.delivery_address || 'Address provided at checkout'}</p>
                <p className="text-veltrix-gray-500 font-mono">Ref: {selectedOrder.payment_reference || 'N/A'}</p>
              </div>

              {/* Items List */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div className="p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800 space-y-2">
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Ordered Items</h3>
                  <div className="divide-y divide-veltrix-gray-800/50">
                    {selectedOrder.order_items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{item.product_name}</p>
                          <p className="text-veltrix-gray-500">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
                        </div>
                        <span className="font-bold text-white">{formatPrice(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div className="flex gap-2 pt-2">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'processing')}
                    className="flex-1 py-3 bg-veltrix-blue text-veltrix-black font-bold rounded-xl hover:shadow-glow transition-all"
                  >
                    Confirm & Start Processing
                  </button>
                )}
                {selectedOrder.status === 'processing' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'completed', 'paid')}
                    className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all"
                  >
                    Mark as Delivered
                  </button>
                )}
                {selectedOrder.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                    className="py-3 px-4 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold rounded-xl transition-all"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
