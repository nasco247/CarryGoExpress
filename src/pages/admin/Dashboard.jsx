import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, Package, ShoppingCart, CreditCard, TrendingUp, 
  ArrowUpRight, AlertTriangle, CheckCircle, Globe,
  Clock, Radio, RefreshCw, Sparkles, Plus, Eye, Check, X, Shield, Activity
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatPrice } from '../../lib/utils'

export default function AdminDashboard() {
  const { 
    stats, 
    orders, 
    users, 
    products, 
    visits,
    liveEvents, 
    realtimeConnected, 
    fetchDashboardData, 
    isLoading,
    changeOrderStatus,
    seedStarterCatalog
  } = useAdminStore()

  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    await seedStarterCatalog()
    setSeeding(false)
  }

  // Derive dynamic monthly chart data exclusively from real orders
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonthIdx = new Date().getMonth()

    // Initialize 6 months window
    const baseWindow = []
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonthIdx - i + 12) % 12
      baseWindow.push({ name: months[mIdx], monthIndex: mIdx, sales: 0, orders: 0 })
    }

    orders.forEach(order => {
      if (!order.created_at) return
      const orderDate = new Date(order.created_at)
      const mIdx = orderDate.getMonth()
      const target = baseWindow.find(b => b.monthIndex === mIdx)
      if (target) {
        target.orders += 1
        target.sales += Number(order.total_amount) || 0
      }
    })

    return baseWindow
  }, [orders])

  const statsCards = [
    { 
      title: 'Total Customers', 
      value: stats.totalUsers.toLocaleString(), 
      change: 'Realtime Live', 
      trend: 'up',
      icon: Users, 
      color: 'blue',
      link: '/admin/users'
    },
    { 
      title: 'Products in Catalog', 
      value: stats.totalProducts.toLocaleString(), 
      change: `${stats.outOfStock} out of stock`, 
      trend: 'up',
      icon: Package, 
      color: 'green',
      link: '/admin/products'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toLocaleString(), 
      change: `${stats.pendingOrders} pending`, 
      trend: 'up',
      icon: ShoppingCart, 
      color: 'purple',
      link: '/admin/orders'
    },
    { 
      title: 'Gross Revenue', 
      value: formatPrice(stats.totalRevenue), 
      change: `Today: ${formatPrice(stats.todayRevenue)}`, 
      trend: 'up',
      icon: CreditCard, 
      color: 'yellow',
      link: '/admin/deposits'
    },
    { 
      title: 'Storefront Visitors', 
      value: stats.totalVisits.toLocaleString(), 
      change: `${stats.uniqueVisitors} unique IPs (${stats.activeVisitorsNow} live)`, 
      trend: 'up',
      icon: Globe, 
      color: 'cyan',
      link: '/admin/visitors'
    },
  ]

  const lowStockProducts = products
    .filter(p => (p.stock !== undefined && p.stock <= 5) || p.in_stock === false)
    .slice(0, 4)

  const recentOrdersList = orders.slice(0, 5)
  const recentUsersList = users.slice(0, 5)

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'processing': return 'bg-veltrix-blue/20 text-veltrix-blue border-veltrix-blue/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'restricted': return 'bg-red-500/20 text-red-400'
      default: return 'bg-veltrix-gray-800 text-veltrix-gray-400'
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white">CarryGoExpress Realtime Command Center</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              LIVE REALTIME
            </span>
          </div>
          <p className="text-sm text-veltrix-gray-400 mt-1">
            Tracking entire user-end transactions, order lifecycle, inventory levels, and live platform statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {products.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 bg-veltrix-blue text-veltrix-black font-bold rounded-xl text-xs shadow-glow hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {seeding ? 'Seeding...' : 'Seed Starter Products'}
            </button>
          )}

          <button
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 px-4 py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs font-semibold text-veltrix-gray-300 hover:text-white hover:border-veltrix-blue/30 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Link
              key={index}
              to={stat.link}
              className="group bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 p-4 sm:p-5 hover:border-veltrix-blue/40 transition-all duration-300 shadow-lg relative overflow-hidden flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  stat.color === 'blue' ? 'bg-veltrix-blue/20 text-veltrix-blue' :
                  stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  stat.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                  stat.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span className="truncate">{stat.change}</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-0.5 group-hover:text-veltrix-blue transition-colors">
                  {stat.value}
                </h3>
                <p className="text-[11px] sm:text-xs text-veltrix-gray-400 font-medium">{stat.title}</p>
                <p className="sm:hidden text-[10px] text-green-400 mt-1 font-medium truncate">{stat.change}</p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Live Activity Feed Stream (Realtime User End & Product End Ticker) */}
      <div className="bg-gradient-to-r from-veltrix-black-light to-veltrix-black border border-veltrix-blue/30 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-veltrix-blue animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Realtime App Feed (User & Product Activity)
            </h3>
          </div>
          <span className="text-xs text-veltrix-gray-500">Listening to Supabase WebSocket changes</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {liveEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-veltrix-gray-500">
              ⚡ Realtime stream active. As users register, add products, or place orders, live updates will stream here instantaneously.
            </div>
          ) : (
            liveEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="flex items-center justify-between p-2.5 bg-veltrix-black/80 border border-veltrix-gray-800 rounded-xl text-xs animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    evt.type === 'order' ? 'bg-veltrix-blue animate-ping' :
                    evt.type === 'product' ? 'bg-green-400 animate-ping' :
                    evt.type === 'user' ? 'bg-purple-400 animate-ping' :
                    'bg-yellow-400'
                  }`} />
                  <span className="font-semibold text-white">{evt.title}:</span>
                  <span className="text-veltrix-gray-300">{evt.message}</span>
                </div>
                <span className="text-[10px] text-veltrix-gray-500">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Charts & Low Stock Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Revenue & Orders Dynamic Trajectory</h3>
              <p className="text-xs text-veltrix-gray-500">Synchronized directly from customer checkouts</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-veltrix-blue" />
                <span className="text-xs text-veltrix-gray-400">Revenue ($)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-veltrix-gray-400">Volume</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#00d4ff" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="orders" stroke="#a855f7" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Monitor */}
        <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-base font-bold text-white">Inventory Health</h3>
              </div>
              <span className="text-xs font-bold text-yellow-400 px-2 py-0.5 bg-yellow-400/10 rounded-full">
                {stats.lowStock} Low Stock
              </span>
            </div>

            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="p-6 text-center text-xs text-veltrix-gray-400">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  All active products have healthy stock levels.
                </div>
              ) : (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800/70">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white truncate max-w-[180px]">{product.name}</span>
                      <span className="text-xs text-red-400 font-extrabold">{product.stock ?? 0} left</span>
                    </div>
                    <div className="w-full bg-veltrix-gray-800 rounded-full h-1.5">
                      <div 
                        className="bg-red-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, ((product.stock ?? 0) / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link 
            to="/admin/products" 
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 border border-veltrix-gray-800 rounded-xl text-xs font-semibold text-veltrix-gray-400 hover:text-veltrix-blue hover:border-veltrix-blue/30 transition-all"
          >
            Manage Product Catalog
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Orders & Users Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white">Live Customer Orders</h3>
            <Link to="/admin/orders" className="text-xs font-semibold text-veltrix-blue hover:underline flex items-center gap-1">
              View All ({orders.length}) <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrdersList.length === 0 ? (
            <div className="p-8 text-center text-xs text-veltrix-gray-500">
              No orders placed yet. Orders created on checkout appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-2">
                    <th className="pb-3">Order ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-veltrix-gray-800/40">
                  {recentOrdersList.map((ord) => (
                    <tr key={ord.id} className="hover:bg-veltrix-gray-900/40 transition-colors">
                      <td className="py-3 font-mono text-veltrix-blue">
                        #{(ord.id || '').slice(0, 8)}
                      </td>
                      <td className="py-3 text-white font-medium">
                        {ord.customer_name || 'Customer'}
                      </td>
                      <td className="py-3 font-bold text-white">
                        {formatPrice(ord.total_amount)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(ord.status)}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => changeOrderStatus(ord.id, 'processing')}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-all"
                            title="Confirm Order"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Registered Users */}
        <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-white">Recent Customer Signups</h3>
            <Link to="/admin/users" className="text-xs font-semibold text-veltrix-blue hover:underline flex items-center gap-1">
              View All ({users.length}) <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentUsersList.map((u, i) => (
              <div key={u.id || i} className="flex items-center justify-between p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-veltrix-blue/20 text-veltrix-blue flex items-center justify-center font-bold text-xs border border-veltrix-blue/30">
                    {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{u.full_name || 'Customer'}</p>
                    <p className="text-[11px] text-veltrix-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-veltrix-gray-800 text-veltrix-gray-400'
                  }`}>
                    {u.role || 'customer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
