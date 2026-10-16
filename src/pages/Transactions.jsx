import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownLeft, Wallet, RefreshCw,
  Search, Filter, AlertCircle, TrendingUp, TrendingDown, Plus
} from 'lucide-react'
import { useAuthStore, useTransactionStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'

// ─── How this page works ─────────────────────────────────────────────────────
// 1. Fetches all transactions for the logged-in user from Supabase `transactions`
// 2. Calculates real-time wallet balance from credits minus debits
// 3. Transactions are filterable by type: all, credit, debit
// 4. Each transaction shows type, amount, description, reference and date
// 5. "Deposit Funds" CTA links to /deposit (Paystack-powered)
// ──────────────────────────────────────────────────────────────────────────────

export default function Transactions() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { transactions, walletBalance, isLoading, error, fetchTransactions } = useTransactionStore()

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) {
      console.log('[Transactions] No user, redirecting to login')
      navigate('/login')
      return
    }
    console.log('[Transactions] Fetching transactions for:', user.id)
    fetchTransactions(user.id)
  }, [user, navigate, fetchTransactions])

  const filtered = transactions.filter(t => {
    const matchesFilter = filter === 'all' || t.type === filter
    const matchesSearch = !search ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.reference?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalCredits = transactions
    .filter(t => t.type === 'credit' && t.status === 'success')
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)

  const totalDebits = transactions
    .filter(t => t.type === 'debit' && t.status === 'success')
    .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0)

  if (!user) return null

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Transactions</h1>
            <p className="text-veltrix-gray-400 mt-1">Your complete payment history</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchTransactions(user.id)}
              className="flex items-center gap-2 px-4 py-2 border border-veltrix-gray-700 rounded-xl text-veltrix-gray-400 hover:text-white transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <Link
              to="/deposit"
              className="flex items-center gap-2 px-4 py-2 bg-veltrix-blue text-black font-bold rounded-xl hover:bg-veltrix-blue/90 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Deposit
            </Link>
          </div>
        </div>

        {/* ── Wallet Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: 'Wallet Balance',
              value: formatPrice(walletBalance),
              icon: Wallet,
              gradient: 'from-veltrix-blue/20 to-blue-600/10',
              border: 'border-veltrix-blue/30',
              iconColor: 'text-veltrix-blue',
              valueColor: 'text-veltrix-blue',
            },
            {
              label: 'Total Deposited',
              value: formatPrice(totalCredits),
              icon: TrendingUp,
              gradient: 'from-green-500/20 to-green-600/5',
              border: 'border-green-500/30',
              iconColor: 'text-green-400',
              valueColor: 'text-green-400',
            },
            {
              label: 'Total Spent',
              value: formatPrice(totalDebits),
              icon: TrendingDown,
              gradient: 'from-red-500/20 to-red-600/5',
              border: 'border-red-500/30',
              iconColor: 'text-red-400',
              valueColor: 'text-red-400',
            },
          ].map((card, i) => (
            <div key={i} className={`bg-gradient-to-br ${card.gradient} border ${card.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-veltrix-black/40 flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
              <p className="text-xs text-veltrix-gray-500 mt-1">{transactions.length} total transactions</p>
            </div>
          ))}
        </div>

        {/* ── How it works info ── */}
        <div className="mb-6 p-4 bg-veltrix-blue/5 border border-veltrix-blue/20 rounded-2xl">
          <p className="text-xs text-veltrix-gray-400">
            💳 <strong className="text-veltrix-blue">How Wallet Works:</strong> Deposit funds using Paystack → funds are credited to your wallet → use wallet balance during checkout. Credits are shown in
            <span className="text-green-400 mx-1">green</span> and debits in <span className="text-red-400 mx-1">red</span>.
          </p>
        </div>

        {/* ── Search & Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by description or reference..."
              className="w-full pl-10 pr-4 py-3 bg-veltrix-black-light border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-veltrix-gray-500 shrink-0" />
            {['all', 'credit', 'debit'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === type
                    ? 'bg-veltrix-blue text-black'
                    : 'bg-veltrix-black-light border border-veltrix-gray-700 text-veltrix-gray-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
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
            <p className="text-veltrix-gray-400 mt-4 text-sm">Loading transactions...</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-veltrix-gray-900 rounded-full flex items-center justify-center mb-4">
              <Wallet className="w-10 h-10 text-veltrix-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {filter !== 'all' || search ? 'No matching transactions' : 'No transactions yet'}
            </h3>
            <p className="text-veltrix-gray-400 text-sm mb-6">
              {filter !== 'all' || search ? 'Try adjusting your search or filter' : 'Make your first deposit to get started'}
            </p>
            <Link to="/deposit" className="btn-primary">Deposit Funds</Link>
          </div>
        )}

        {/* ── Transaction List ── */}
        {!isLoading && filtered.length > 0 && (
          <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl overflow-hidden">
            {filtered.map((tx, idx) => {
              const isCredit = tx.type === 'credit'
              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-veltrix-gray-900/30 transition-colors ${
                    idx < filtered.length - 1 ? 'border-b border-veltrix-gray-800/60' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCredit ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    {isCredit
                      ? <ArrowDownLeft className="w-5 h-5 text-green-400" />
                      : <ArrowUpRight className="w-5 h-5 text-red-400" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {tx.description || (isCredit ? 'Wallet deposit' : 'Purchase')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-veltrix-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      {tx.reference && (
                        <p className="text-xs text-veltrix-gray-600 font-mono hidden sm:block truncate max-w-[120px]">
                          #{tx.reference.slice(0, 12)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Amount */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
                      {isCredit ? '+' : '-'}{formatPrice(tx.amount)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.status === 'success'
                        ? 'bg-green-500/10 text-green-400'
                        : tx.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
