import { useState } from 'react'
import { 
  Search, Shield, Ban, CheckCircle, Mail, UserX, 
  RefreshCw, MoreHorizontal, Eye, Phone, MapPin
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { formatPrice } from '../../lib/utils'

export default function AdminUsers() {
  const { users, orders, changeUserRole, changeUserStatus, fetchDashboardData, isLoading } = useAdminStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)

  // Calculate order stats per user
  const usersWithStats = users.map(user => {
    const userOrders = orders.filter(o => o.user_id === user.id)
    const totalSpent = userOrders.reduce((sum, o) => {
      if (o.payment_status === 'paid' || o.status === 'completed') {
        return sum + (Number(o.total_amount) || 0)
      }
      return sum
    }, 0)

    return {
      ...user,
      orderCount: userOrders.length,
      totalSpent
    }
  })

  const filteredUsers = usersWithStats.filter(user => {
    const name = (user.full_name || '').toLowerCase()
    const email = (user.email || '').toLowerCase()
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || (user.status || 'active') === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'restricted': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'banned': return 'bg-red-500/30 text-red-400 border-red-500/40'
      default: return 'bg-green-500/20 text-green-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Registered Users & Customer Accounts</h1>
          <p className="text-sm text-veltrix-gray-400 mt-1">
            Realtime customer registry tracked directly from Supabase auth and profiles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 px-4 py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs font-semibold text-veltrix-gray-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Registry
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'blue' },
          { label: 'Active Customers', value: users.filter(u => (u.status || 'active') === 'active').length, color: 'green' },
          { label: 'Administrators', value: users.filter(u => u.role === 'admin').length, color: 'purple' },
          { label: 'Restricted / Suspended', value: users.filter(u => u.status === 'restricted' || u.status === 'banned').length, color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/60 p-4">
            <p className="text-xs text-veltrix-gray-400">{stat.label}</p>
            <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full pl-11 pr-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 text-sm focus:border-veltrix-blue focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Administrator</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-3">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Orders Placed</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veltrix-gray-800/40">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-veltrix-gray-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-veltrix-blue/20 to-purple-500/20 text-veltrix-blue flex items-center justify-center font-bold text-xs border border-veltrix-blue/30 shrink-0">
                        {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{user.full_name || 'Customer'}</p>
                        <p className="text-[10px] text-veltrix-gray-500 font-mono">ID: {(user.id || '').slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-veltrix-gray-300 font-mono">
                    {user.email || 'N/A'}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      user.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-veltrix-gray-800 text-veltrix-gray-400'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user.role || 'customer'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(user.status || 'active')}`}>
                      {user.status || 'active'}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-bold text-white">
                    {user.orderCount} orders
                  </td>

                  <td className="px-6 py-4 font-bold text-white text-sm">
                    {formatPrice(user.totalSpent)}
                  </td>

                  <td className="px-6 py-4 text-veltrix-gray-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        className="p-2 text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-900 rounded-lg transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {actionMenuOpen === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl shadow-2xl py-1 z-50 animate-fade-in text-xs">
                          {user.role === 'admin' ? (
                            <button
                              onClick={() => { changeUserRole(user.id, 'customer'); setActionMenuOpen(null) }}
                              className="w-full text-left px-4 py-2 text-veltrix-gray-300 hover:text-white hover:bg-veltrix-gray-900 transition-colors"
                            >
                              Demote to Customer
                            </button>
                          ) : (
                            <button
                              onClick={() => { changeUserRole(user.id, 'admin'); setActionMenuOpen(null) }}
                              className="w-full text-left px-4 py-2 text-purple-400 hover:bg-purple-500/10 transition-colors font-semibold"
                            >
                              Promote to Admin
                            </button>
                          )}

                          {user.status === 'restricted' ? (
                            <button
                              onClick={() => { changeUserStatus(user.id, 'active'); setActionMenuOpen(null) }}
                              className="w-full text-left px-4 py-2 text-green-400 hover:bg-green-500/10 transition-colors"
                            >
                              Activate Account
                            </button>
                          ) : (
                            <button
                              onClick={() => { changeUserStatus(user.id, 'restricted'); setActionMenuOpen(null) }}
                              className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Restrict Account
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-veltrix-gray-500">
              No registered users found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
