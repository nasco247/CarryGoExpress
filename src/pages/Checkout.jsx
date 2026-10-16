import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePaystackPayment } from 'react-paystack'
import {
  ShoppingBag, ArrowLeft, MapPin, User, Phone, CreditCard,
  Shield, CheckCircle, AlertCircle, Loader2, Trash2, Minus, Plus, Package
} from 'lucide-react'
import { useAuthStore, useCartStore, useOrderStore, useTransactionStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'
import { Wallet } from 'lucide-react'

// ─── How this page works ─────────────────────────────────────────────────────
// 1. Displays all cart items with quantity controls and running total
// 2. User fills in delivery details (pre-filled from profile if available)
// 3. "Pay Now" triggers Paystack modal for the cart total
// 4. On successful payment: an order record is created in Supabase,
//    order items are linked to the order, cart is cleared, user is redirected
// 5. TEST CARD: 4084 0840 8408 4081 | CVV: 408 | PIN: 0000 | OTP: 123456
// ──────────────────────────────────────────────────────────────────────────────

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxx'
const DELIVERY_FEE = 0 // free delivery

export default function Checkout() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore()
  const { createOrder } = useOrderStore()
  const { walletBalance, fetchTransactions, recordDebit } = useTransactionStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [formError, setFormError] = useState(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  })

  useEffect(() => {
    if (!user) {
      console.log('[Checkout] No user, redirecting to login')
      navigate('/login')
    } else {
      fetchTransactions(user.id)
    }
  }, [user, navigate, fetchTransactions])

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      console.log('[Checkout] Pre-filling form from profile:', profile.full_name)
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
      })
    }
  }, [profile])

  const totalAmount = getTotalPrice() + DELIVERY_FEE

  // ── Paystack config ──────────────────────────────────────────────────────────
  const paystackConfig = {
    reference: `CGO-ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    email: user?.email || '',
    amount: totalAmount * 100, // kobo
    publicKey: PAYSTACK_PUBLIC_KEY,
    currency: 'NGN',
    metadata: {
      custom_fields: [
        { display_name: 'User ID', variable_name: 'user_id', value: user?.id },
        { display_name: 'Customer Name', variable_name: 'customer_name', value: form.full_name },
      ]
    }
  }

  const initializePayment = usePaystackPayment(paystackConfig)

  // ── On payment success ───────────────────────────────────────────────────────
  const onPaymentSuccess = useCallback(async (reference) => {
    console.log('[Checkout] ✅ Payment successful | Ref:', reference.reference)
    setIsProcessing(true)
    setFormError(null)

    const deliveryAddress = `${form.address}, ${form.city}, ${form.state}`

    try {
      const { order, error } = await createOrder(
        user.id,
        items,
        totalAmount,
        deliveryAddress,
        reference.reference,
        { name: form.full_name, email: user?.email }
      )

      if (error || !order) {
        console.error('[Checkout] Order creation failed:', error)
        setFormError('Payment received but order creation failed. Please contact support. Ref: ' + reference.reference)
        setIsProcessing(false)
        return
      }

      console.log('[Checkout] Order created successfully:', order.id)
      clearCart()
      setOrderSuccess({ orderId: order.id, reference: reference.reference, total: totalAmount })
    } catch (err) {
      console.error('[Checkout] Unexpected error after payment:', err)
      setFormError('Unexpected error. Contact support with: ' + reference.reference)
    } finally {
      setIsProcessing(false)
    }
  }, [user, items, totalAmount, form, createOrder, clearCart])

  const onPaymentClose = useCallback(() => {
    console.log('[Checkout] ℹ️ Payment modal closed by user')
  }, [])

  // ── Validate then trigger payment ────────────────────────────────────────────
  const handleCheckout = () => {
    setFormError(null)

    if (items.length === 0) {
      setFormError('Your cart is empty')
      return
    }
    if (!form.full_name.trim()) {
      setFormError('Please enter your full name')
      return
    }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim()) {
      setFormError('Please complete your delivery address')
      return
    }

    console.log('[Checkout] Starting Paystack payment for:', formatPrice(totalAmount))
    initializePayment(onPaymentSuccess, onPaymentClose)
  }

  // ── Wallet Payment ──────────────────────────────────────────────────────────
  const handleWalletPayment = async () => {
    setFormError(null)
    if (items.length === 0 || !form.full_name.trim() || !form.address.trim()) {
      setFormError('Please complete your delivery details first.')
      return
    }

    if (walletBalance < totalAmount) {
      setFormError('Insufficient wallet balance.')
      return
    }

    setIsProcessing(true)
    const walletRef = `CGO-WLT-${Date.now()}`
    const deliveryAddress = `${form.address}, ${form.city}, ${form.state}`

    try {
      // 1. Debit Wallet
      const { error: debitError } = await recordDebit(
        user.id,
        totalAmount,
        walletRef,
        `Payment for Order ${walletRef}`
      )

      if (debitError) throw new Error('Failed to debit wallet')

      // 2. Create Order
      const { order, error: orderError } = await createOrder(
        user.id,
        items,
        totalAmount,
        deliveryAddress,
        walletRef,
        { name: form.full_name, email: user?.email }
      )

      if (orderError || !order) throw new Error('Order creation failed after debit. Contact support.')

      console.log('[Checkout] Wallet payment & order created successfully:', order.id)
      clearCart()
      setOrderSuccess({ orderId: order.id, reference: walletRef, total: totalAmount })
      
      // Refresh wallet balance
      fetchTransactions(user.id)
    } catch (err) {
      console.error('[Checkout] Wallet payment error:', err)
      setFormError(err.message || 'Unexpected error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  if (!user) return null

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-veltrix-gray-700 text-veltrix-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Checkout</h1>
            <p className="text-veltrix-gray-400 mt-0.5">Review your cart and complete your order</p>
          </div>
        </div>

        {/* ── How It Works Banner ── */}
        <div className="mb-6 p-4 bg-veltrix-blue/5 border border-veltrix-blue/20 rounded-2xl text-xs text-veltrix-gray-400">
          🛒 <strong className="text-veltrix-blue">Steps:</strong> (1) Review your cart →
          (2) Fill delivery details →
          (3) Click "Pay Now" → Paystack modal opens →
          (4) Complete payment → Order is created automatically
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-veltrix-gray-900 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-veltrix-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-veltrix-gray-400 text-sm mb-6">Add products before checking out</p>
            <Link to="/" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Left: Cart + Delivery Form ── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Cart Items */}
              <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-veltrix-gray-800">
                  <ShoppingBag className="w-5 h-5 text-veltrix-blue" />
                  <h2 className="font-bold text-white">Cart Items ({items.length})</h2>
                </div>
                <div className="p-4 space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-veltrix-black/50 rounded-xl">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg shrink-0 border border-veltrix-gray-800" />
                      ) : (
                        <div className="w-16 h-16 bg-veltrix-gray-900 rounded-lg flex items-center justify-center shrink-0">
                          <Package className="w-7 h-7 text-veltrix-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <p className="text-xs text-veltrix-gray-500">{item.brand}</p>
                        <p className="text-sm font-bold text-veltrix-blue mt-1">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-veltrix-gray-900 text-veltrix-gray-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-veltrix-gray-900 text-veltrix-gray-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 flex items-center justify-center text-veltrix-gray-500 hover:text-red-400 transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-veltrix-gray-800">
                  <MapPin className="w-5 h-5 text-veltrix-blue" />
                  <h2 className="font-bold text-white">Delivery Details</h2>
                </div>
                <div className="p-5 space-y-4">

                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-400">{formError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-2">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                        <input
                          type="text"
                          value={form.full_name}
                          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                          placeholder="Enter your full name"
                          className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-2">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+234 800 000 0000"
                          className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-2">State *</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                        placeholder="e.g. Lagos"
                        className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-2">City *</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="e.g. Ikeja"
                        className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-2">Street Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-veltrix-gray-500" />
                        <textarea
                          value={form.address}
                          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                          placeholder="Enter your delivery address..."
                          rows={2}
                          className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors resize-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-5 sticky top-24">
                <h2 className="font-bold text-white mb-5">Order Summary</h2>

                {/* Item Lines */}
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-veltrix-gray-400 truncate pr-2">
                        {item.name} <span className="text-veltrix-gray-600">×{item.quantity}</span>
                      </span>
                      <span className="text-white font-medium shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-veltrix-gray-800 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-veltrix-gray-400">Subtotal</span>
                    <span className="text-white">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-veltrix-gray-400">Delivery</span>
                    <span className="text-green-400 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-veltrix-gray-800">
                    <span className="text-white">Total</span>
                    <span className="text-veltrix-blue">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Pay Buttons */}
                <div className="mt-6 space-y-3">
                  {/* Wallet Option */}
                  {walletBalance >= totalAmount && (
                    <div className="p-4 bg-veltrix-black border border-veltrix-gray-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-veltrix-gray-300">Wallet Balance</span>
                        <span className="text-sm font-bold text-green-400">{formatPrice(walletBalance)}</span>
                      </div>
                      <button
                        onClick={handleWalletPayment}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 text-green-400 border border-green-500/30 font-bold rounded-lg hover:bg-green-500/20 transition-all disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                        Pay with Wallet
                      </button>
                    </div>
                  )}

                  {/* Paystack Option */}
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || items.length === 0}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-veltrix-blue text-black font-bold rounded-xl text-base hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay with Card
                      </>
                    )}
                  </button>
                </div>

                {/* Security */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-veltrix-gray-500">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  <span>Secured by Paystack · 256-bit SSL</span>
                </div>

                {/* Test card reminder */}
                <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <p className="text-xs text-yellow-400 font-semibold mb-1">🧪 Test Mode</p>
                  <p className="text-xs text-veltrix-gray-500 font-mono">Card: 4084 0840 8408 4081</p>
                  <p className="text-xs text-veltrix-gray-500 font-mono">CVV: 408 · PIN: 0000 · OTP: 123456</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Order Success Modal Dialogue ── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-veltrix-black border border-veltrix-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3">Order Placed! 🎉</h2>
            <p className="text-veltrix-gray-400 mb-6 text-sm">
              Thank you for shopping with Veltrix. Your order has been securely confirmed and is now being processed.
            </p>
            
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4 mb-6">
              <p className="text-xs text-veltrix-gray-500 uppercase tracking-wider font-semibold mb-1">Transaction Details</p>
              <p className="text-sm font-mono text-veltrix-gray-300 mb-1">Order: #{orderSuccess.orderId.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm font-mono text-veltrix-gray-300">Ref: {orderSuccess.reference.slice(0, 16)}</p>
              <div className="border-t border-veltrix-gray-800 my-3"></div>
              <p className="text-xl font-bold text-veltrix-blue">{formatPrice(orderSuccess.total)}</p>
            </div>

            <div className="flex flex-col gap-3">
              <Link to="/orders" className="w-full py-4 bg-veltrix-blue text-black font-bold rounded-xl hover:shadow-glow-lg transition-all text-center">
                View My Orders
              </Link>
              <button 
                onClick={() => setOrderSuccess(null)}
                className="w-full py-4 border border-veltrix-gray-700 text-veltrix-gray-400 font-bold rounded-xl hover:text-white hover:bg-veltrix-gray-800 transition-all text-center"
              >
                Close Dialogue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
