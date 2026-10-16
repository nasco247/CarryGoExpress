import { useState } from 'react'
import { 
  Search, CheckCircle, XCircle, Clock, 
  CreditCard, Banknote, RefreshCw, Eye
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { formatPrice } from '../../lib/utils'

export default function AdminDeposits() {
  const { deposits, processDeposit, fetchDashboardData, isLoading } = useAdminStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDeposit, setSelectedDeposit] = useState(null)
  const [activeTab, setActiveTab] = useState('deposits')

  const filteredDeposits = deposits.filter(deposit => {
    const ref = (deposit.reference || '').toLowerCase()
    const email = (deposit.email || '').toLowerCase()
    const matchesSearch = ref.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter
    const matchesTab = activeTab === 'all' || (activeTab === 'deposits' ? deposit.type === 'credit' : true)
    return matchesSearch && matchesStatus && matchesTab
  })

  const getStatusColor = (status) => {
    switch(status) {
      case 'success':
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed':
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-veltrix-gray-800 text-veltrix-gray-400'
    }
  }

  const handleApprove = async (id) => {
    await processDeposit(id, 'success')
  }

  const handleReject = async (id) => {
    await processDeposit(id, 'failed')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deposits & Financial Transactions</h1>
          <p className="text-sm text-veltrix-gray-400 mt-1">
            Realtime monitoring of customer wallet fundings, checkout debits, and verification.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchDashboardData()}
            className="flex items-center gap-2 px-4 py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs font-semibold text-veltrix-gray-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Finances
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: formatPrice(deposits.reduce((acc, d) => acc + (Number(d.amount) || 0), 0)), color: 'blue' },
          { label: 'Completed Credits', value: deposits.filter(d => (d.status === 'success' || d.status === 'approved') && d.type === 'credit').length, color: 'green' },
          { label: 'Pending Verification', value: deposits.filter(d => d.status === 'pending').length, color: 'yellow' },
          { label: 'Debits / Purchases', value: deposits.filter(d => d.type === 'debit').length, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/60 p-4">
            <p className="text-xs text-veltrix-gray-400">{stat.label}</p>
            <p className="text-xl font-black text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-1 p-1 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'deposits' ? 'bg-veltrix-blue text-veltrix-black' : 'text-veltrix-gray-400 hover:text-white'
            }`}
          >
            Deposits (Credits)
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all' ? 'bg-veltrix-blue text-veltrix-black' : 'text-veltrix-gray-400 hover:text-white'
            }`}
          >
            All Ledger Records
          </button>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference or user email..."
              className="w-full pl-10 pr-4 py-2 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 text-xs focus:border-veltrix-blue focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-3">
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">User Email</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veltrix-gray-800/40">
              {filteredDeposits.map((dep) => (
                <tr key={dep.id} className="hover:bg-veltrix-gray-900/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-veltrix-blue">
                    {dep.reference || `#${(dep.id || '').slice(0, 8)}`}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {dep.email || 'CarryGo Customer'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      dep.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {dep.type === 'credit' ? 'Deposit' : 'Debit'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-extrabold text-white text-sm">
                    {formatPrice(dep.amount)}
                  </td>
                  <td className="px-6 py-4 text-veltrix-gray-400 truncate max-w-xs">
                    {dep.description || 'Wallet funding via Paystack'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(dep.status)}`}>
                      {dep.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-veltrix-gray-400">
                    {dep.created_at ? new Date(dep.created_at).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {dep.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(dep.id)}
                            className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                            title="Approve Deposit"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(dep.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Reject Deposit"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDeposits.length === 0 && (
            <div className="p-12 text-center text-veltrix-gray-500">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
