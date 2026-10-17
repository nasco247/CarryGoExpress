import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePaystackPayment } from 'react-paystack'
import {
  Wallet, ArrowLeft, CreditCard, Shield, CheckCircle,
  AlertCircle, Loader2, Info, Zap
} from 'lucide-react'
import { useAuthStore, useTransactionStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'

// ─── How this page works ─────────────────────────────────────────────────────
// 1. User selects or types a custom deposit amount (min $5)
// 2. Clicking "Deposit Now" opens the Paystack test payment modal
// 3. On successful payment, the reference is saved to Supabase `transactions`
// 4. Wallet balance is updated automatically in the Transactions store
// 5. TEST CARD: 4084 0840 8408 4081 | Exp: Any future date | CVV: 408 | PIN: 0000
// ──────────────────────────────────────────────────────────────────────────────

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000]

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxx'

export default function Deposit() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { recordDeposit, fetchTransactions } = useTransactionStore()

  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  if (!user) {
    navigate('/login')
    return null
  }

  const selectedAmount = amount || Number(customAmount.replace(/,/g, '')) || 0

  // ── Paystack config ──────────────────────────────────────────────────────────
  const config = {
    reference: `VLX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    email: user.email,
    amount: Math.round(selectedAmount * 100), // cents
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'USD',
    metadata: {
      custom_fields: [
        { display_name: 'User ID', variable_name: 'user_id', value: user.id },
        { display_name: 'Type', variable_name: 'transaction_type', value: 'wallet_deposit' },
      ]
    }
  }

  const initializePayment = usePaystackPayment(config)

  // ── Payment success handler ──────────────────────────────────────────────────
  const onSuccess = useCallback(async (reference) => {
    console.log('[Deposit] ✅ Paystack payment successful | Ref:', reference.reference)
    setIsProcessing(true)
    setError(null)

    try {
      const { error: saveError } = await recordDeposit(
        user.id,
        selectedAmount,
        reference.reference,
        user.email
      )

      if (saveError) {
        console.error('[Deposit] Failed to record deposit:', saveError)
        setError('Payment was received but failed to credit wallet. Please contact support with ref: ' + reference.reference)
        setIsProcessing(false)
        return
      }

      console.log('[Deposit] Deposit recorded — refreshing transactions')
      await fetchTransactions(user.id)
      setSuccess({ amount: selectedAmount, reference: reference.reference })
      setAmount('')
      setCustomAmount('')
    } catch (err) {
      console.error('[Deposit] Unexpected error after payment:', err)
      setError('Unexpected error. Contact support with ref: ' + reference.reference)
    } finally {
      setIsProcessing(false)
    }
  }, [user, selectedAmount, recordDeposit, fetchTransactions])

  // ── Payment close/cancel handler ─────────────────────────────────────────────
  const onClose = useCallback(() => {
    console.log('[Deposit] ℹ️ Payment modal closed by user')
  }, [])

  const handleDeposit = () => {
    setError(null)
    setSuccess(null)

    if (selectedAmount < 5) {
      setError('Minimum deposit amount is $5')
      return
    }
    if (selectedAmount > 10000) {
      setError('Maximum single deposit is $10,000')
      return
    }

    console.log('[Deposit] Initiating Paystack for:', formatPrice(selectedAmount))
    initializePayment(onSuccess, onClose)
  }

  const handleCustomAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    setCustomAmount(raw)
    setAmount('')
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        {/* ── Back nav ── */}
        <Link
          to="/transactions"
          className="inline-flex items-center gap-2 text-sm text-veltrix-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Transactions
        </Link>

        {/* ── Success State ── */}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Deposit Successful! 🎉</h3>
            <p className="text-veltrix-gray-300 text-sm mb-1">
              <strong className="text-green-400">{formatPrice(success.amount)}</strong> has been credited to your wallet.
            </p>
            <p className="text-veltrix-gray-500 text-xs font-mono">Ref: {success.reference}</p>
            <div className="flex gap-3 mt-5">
              <Link to="/transactions" className="flex-1 py-2 text-sm border border-veltrix-gray-700 rounded-xl text-veltrix-gray-300 hover:text-white transition-colors text-center">
                View Transactions
              </Link>
              <button
                onClick={() => setSuccess(null)}
                className="flex-1 py-2 text-sm bg-veltrix-blue text-black font-bold rounded-xl hover:bg-veltrix-blue/90 transition-colors"
              >
                Deposit More
              </button>
            </div>
          </div>
        )}

        {/* ── Main Deposit Card ── */}
        <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b border-veltrix-gray-800 bg-gradient-to-r from-veltrix-blue/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-veltrix-blue/20 border border-veltrix-blue/30 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-veltrix-blue" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Deposit Funds</h1>
                <p className="text-xs text-veltrix-gray-400">Secure payment via Paystack</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Preset Amounts */}
            <div>
              <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-3">
                Select Amount
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => { setAmount(amt); setCustomAmount('') }}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                      amount === amt
                        ? 'bg-veltrix-blue text-black shadow-glow'
                        : 'bg-veltrix-black border border-veltrix-gray-700 text-veltrix-gray-300 hover:border-veltrix-blue/50 hover:text-white'
                    }`}
                  >
                    {formatPrice(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-2">
                Or Enter Custom Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-veltrix-gray-400 font-semibold">$</span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="e.g. 250"
                  className="w-full pl-8 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white text-right text-lg font-bold placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors"
                />
              </div>
              <p className="text-xs text-veltrix-gray-500 mt-1">Minimum: $5 · Maximum: $10,000</p>
            </div>

            {/* Summary */}
            {selectedAmount > 0 && (
              <div className="p-4 bg-veltrix-blue/5 border border-veltrix-blue/20 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-veltrix-gray-400">You are depositing</span>
                  <span className="text-xl font-bold text-veltrix-blue">{formatPrice(selectedAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-veltrix-gray-500">Processing fee</span>
                  <span className="text-xs text-green-400 font-medium">$0 (Covered by us)</span>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={handleDeposit}
              disabled={isProcessing || selectedAmount < 100}
              className="w-full flex items-center justify-center gap-3 py-4 bg-veltrix-blue text-black font-bold rounded-xl text-base hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {selectedAmount >= 100 ? `Deposit ${formatPrice(selectedAmount)}` : 'Select an Amount'}
                </>
              )}
            </button>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-veltrix-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span>256-bit SSL</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>Instant credit</span>
              </div>
              <span>·</span>
              <span>Powered by Paystack</span>
            </div>
          </div>
        </div>

        {/* ── Test Card Info ── */}
        <div className="mt-6 p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-bold text-yellow-400">Test Mode — Use Test Card</h3>
          </div>
          <div className="space-y-1 text-xs text-veltrix-gray-400 font-mono">
            <div className="flex justify-between">
              <span className="text-veltrix-gray-500">Card Number:</span>
              <span className="text-white">4084 0840 8408 4081</span>
            </div>
            <div className="flex justify-between">
              <span className="text-veltrix-gray-500">Expiry:</span>
              <span className="text-white">Any future date</span>
            </div>
            <div className="flex justify-between">
              <span className="text-veltrix-gray-500">CVV:</span>
              <span className="text-white">408</span>
            </div>
            <div className="flex justify-between">
              <span className="text-veltrix-gray-500">PIN:</span>
              <span className="text-white">0000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-veltrix-gray-500">OTP:</span>
              <span className="text-white">123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
