import { useState } from 'react'
import { 
  Search, Ban, CheckCircle, Clock, Shield, AlertTriangle,
  XCircle, UserCheck
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'

export default function AdminRestrictions() {
  const { users, changeUserStatus } = useAdminStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [reason, setReason] = useState('')

  // Users with restrictions or demo restriction cases
  const restrictedUsers = users.filter(u => u.status === 'restricted' || u.status === 'banned')

  const handleApplyRestriction = async (e) => {
    e.preventDefault()
    if (!selectedUserId) return
    await changeUserStatus(selectedUserId, 'restricted')
    setShowAddModal(false)
    setSelectedUserId('')
    setReason('')
  }

  const handleLift = async (id) => {
    await changeUserStatus(id, 'active')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Restrictions & Risk Mitigation</h1>
          <p className="text-sm text-veltrix-gray-400 mt-1">Manage user suspensions, restrictions, and security actions.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-600 transition-all"
        >
          <Ban className="w-4 h-4" />
          Restrict An Account
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Currently Restricted', value: restrictedUsers.length, color: 'red' },
          { label: 'Active Normal Accounts', value: users.filter(u => (u.status || 'active') === 'active').length, color: 'green' },
          { label: 'Total Monitored', value: users.length, color: 'blue' },
        ].map((stat, i) => (
          <div key={i} className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/60 p-4">
            <p className="text-xs text-veltrix-gray-400">{stat.label}</p>
            <p className="text-2xl font-black text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Restricted List */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-veltrix-gray-800">
          <h2 className="text-sm font-bold text-white">Restricted Customer Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-3">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veltrix-gray-800/40">
              {restrictedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-veltrix-gray-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{user.full_name || 'Customer'}</p>
                    <p className="text-[10px] text-veltrix-gray-500 font-mono">ID: {user.id}</p>
                  </td>
                  <td className="px-6 py-4 text-veltrix-gray-300 font-mono">
                    {user.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      {user.status || 'restricted'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleLift(user.id)}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 font-semibold rounded-lg text-xs hover:bg-green-500/30 transition-all"
                    >
                      Lift Restriction
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {restrictedUsers.length === 0 && (
            <div className="p-12 text-center text-xs text-veltrix-gray-500">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              No customer accounts are currently restricted.
            </div>
          )}
        </div>
      </div>

      {/* Restrict Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 shadow-2xl animate-fade-in p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-veltrix-gray-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" /> Apply Restriction
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-veltrix-gray-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyRestriction} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-veltrix-gray-300">Select Customer Account</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="">-- Choose Customer --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-veltrix-gray-300">Reason for Restriction</label>
                <textarea
                  rows="3"
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Suspicious payment attempts, policy violation..."
                  className="input-field text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-veltrix-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-600 transition-all"
                >
                  Apply Restriction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
