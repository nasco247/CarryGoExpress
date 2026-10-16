import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePaystackPayment } from 'react-paystack'
import {
  ShoppingBag, ArrowLeft, MapPin, User, Phone, CreditCard,
  Shield, CheckCircle, AlertCircle, Loader2, Trash2, Minus, Plus, Package,
  Gift, Coins, MessageSquare, Headphones, Upload, Check, ExternalLink, AlertTriangle
} from 'lucide-react'
import { useAuthStore, useCartStore, useOrderStore, useTransactionStore } from '../hooks/useStore'
import { uploadProductImage } from '../lib/supabase'
import { formatPrice } from '../lib/utils'
import { Wallet } from 'lucide-react'

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxx'
const DELIVERY_FEE = 0 // free express delivery

export default function Checkout() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore()
  const { createOrder } = useOrderStore()
  const { walletBalance, fetchTransactions, recordDebit } = useTransactionStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [formError, setFormError] = useState(null)

  // Payment method selection: 'giftcard' (default/available), 'atm_card', 'crypto', 'agent', 'wallet'
  const [paymentMethod, setPaymentMethod] = useState('giftcard')

  // Gift Card State
  const [giftCardType, setGiftCardType] = useState('Apple Gift Card')
  const [giftCardCode, setGiftCardCode] = useState('')
  const [giftCardPin, setGiftCardPin] = useState('')
  const [giftCardAmount, setGiftCardAmount] = useState('')
  const [giftCardReceipt, setGiftCardReceipt] = useState('')
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

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

  const validateDeliveryForm = () => {
    if (items.length === 0) {
      setFormError('Your cart is empty.')
      return false
    }
    if (!form.full_name.trim()) {
      setFormError('Please enter your full recipient name.')
      return false
    }
    if (!form.phone.trim()) {
      setFormError('Please enter your contact phone number for dispatch.')
      return false
    }
    if (!form.address.trim() || !form.city.trim() || !form.state.trim()) {
      setFormError('Please enter your complete delivery destination address.')
      return false
    }
    setFormError(null)
    return true
  }

  // ── Gift Card Receipt Upload ────────────────────────────────────────────────
  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingReceipt(true)
    const { url, error } = await uploadProductImage(file)
    if (error) {
      setFormError('Failed to upload gift card photo: ' + error)
    } else if (url) {
      setGiftCardReceipt(url)
    }
    setUploadingReceipt(false)
  }

  // ── 1. Submit with Gift Card (Available Now) ────────────────────────────────
  const handleGiftCardPayment = async () => {
    if (!validateDeliveryForm()) return

    if (!giftCardCode.trim()) {
      setFormError('Please enter your gift card claim code or voucher digits.')
      return
    }

    setIsProcessing(true)
    setFormError(null)

    const deliveryAddress = `${form.address}, ${form.city}, ${form.state} (Phone: ${form.phone})`
    const ref = `CGO-GC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    try {
      const { order, error } = await createOrder(
        user.id,
        items,
        totalAmount,
        deliveryAddress,
        ref,
        {
          name: form.full_name,
          email: user?.email,
          payment_method: `Gift Card (${giftCardType} - Code: ${giftCardCode.trim().slice(0, 4)}****)`,
          gift_card_type: giftCardType,
          gift_card_code: giftCardCode.trim(),
          gift_card_pin: giftCardPin.trim() || null,
          gift_card_receipt: giftCardReceipt || null
        }
      )

      if (error || !order) {
        throw new Error(error?.message || 'Order creation failed. Please try again.')
      }

      clearCart()
      setOrderSuccess({
        orderId: order.id,
        reference: ref,
        total: totalAmount,
        paymentType: `Gift Card (${giftCardType})`,
        message: 'Your gift card voucher has been received! Our verification team is confirming your code and your gadget package will be dispatched immediately.'
      })
    } catch (err) {
      console.error('[Checkout GiftCard Error]', err)
      setFormError(err.message || 'Error processing gift card payment.')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── 2. Submit with Live Agent Assistance ────────────────────────────────────
  const handleAgentOrder = async () => {
    if (!validateDeliveryForm()) return

    setIsProcessing(true)
    setFormError(null)

    const deliveryAddress = `${form.address}, ${form.city}, ${form.state} (Phone: ${form.phone})`
    const ref = `CGO-AGT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    try {
      const { order, error } = await createOrder(
        user.id,
        items,
        totalAmount,
        deliveryAddress,
        ref,
        {
          name: form.full_name,
          email: user?.email,
          payment_method: 'Live Agent Assisted Payment'
        }
      )

      if (error || !order) {
        throw new Error(error?.message || 'Failed to place agent order.')
      }

      clearCart()
      setOrderSuccess({
        orderId: order.id,
        reference: ref,
        total: totalAmount,
        paymentType: 'Agent Assisted Support',
        isAgent: true,
        message: 'Your order has been reserved! Connect directly with our live support agent to finalize your payment and arrange priority dispatch.'
      })
    } catch (err) {
      console.error('[Checkout Agent Order Error]', err)
      setFormError(err.message || 'Error connecting with agent.')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── 3. Pay with ATM Card (Unavailable right now) ────────────────────────────
  const handleAtmCardClick = () => {
    setFormError('ATM Card & Web Paystack processing is currently under scheduled maintenance. Please use Gift Card (Instant) or Reach Out to an Agent.')
  }

  // ── 4. Pay with Wallet (If balance exists) ───────────────────────────────────
  const handleWalletPayment = async () => {
    if (!validateDeliveryForm()) return

    if (walletBalance < totalAmount) {
      setFormError('Insufficient wallet balance.')
      return
    }

    setIsProcessing(true)
    const walletRef = `CGO-WLT-${Date.now()}`
    const deliveryAddress = `${form.address}, ${form.city}, ${form.state} (Phone: ${form.phone})`

    try {
      const { error: debitError } = await recordDebit(
        user.id,
        totalAmount,
        walletRef,
        `Payment for Gadget Order ${walletRef}`
      )

      if (debitError) throw new Error('Failed to debit wallet balance.')

      const { order, error: orderError } = await createOrder(
        user.id,
        items,
        totalAmount,
        deliveryAddress,
        walletRef,
        { name: form.full_name, email: user?.email }
      )

      if (orderError || !order) throw new Error('Order creation failed after debit. Contact support.')

      clearCart()
      setOrderSuccess({
        orderId: order.id,
        reference: walletRef,
        total: totalAmount,
        paymentType: 'CarryGo Digital Wallet',
        message: 'Payment completed successfully from your wallet balance.'
      })
      
      fetchTransactions(user.id)
    } catch (err) {
      console.error('[Checkout Wallet Error]', err)
      setFormError(err.message || 'Unexpected error occurred.')
    } finally {
      setIsProcessing(false)
    }
  }

  const giftCardOptions = [
    'Apple Gift Card (App Store & iTunes)',
    'Razer Gold Gift Card',
    'Steam Wallet Gift Card',
    'Amazon Gift Card',
    'Vanilla Visa / Mastercard',
    'Google Play Gift Card',
    'Nike / Nordstrom / Other Gift Card'
  ]

  if (!user) return null

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-veltrix-gray-700 text-veltrix-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Checkout & Order Settlement</h1>
            <p className="text-veltrix-gray-400 text-sm mt-0.5">Secure gadget checkout with instant Gift Card redemption or Agent Support</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-veltrix-gray-900 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-veltrix-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your gadget cart is empty</h3>
            <p className="text-veltrix-gray-400 text-sm mb-6">Browse our electronics and add flagship gadgets to proceed</p>
            <Link to="/" className="btn-primary">Browse Gadgets</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Left Column: Delivery Details & Payment Selectors ── */}
            <div className="lg:col-span-7 space-y-6">

              {/* Delivery Details Form */}
              <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="flex items-center gap-3 p-5 border-b border-veltrix-gray-800">
                  <MapPin className="w-5 h-5 text-veltrix-blue" />
                  <h2 className="font-bold text-white text-base">Delivery Destination & Recipient</h2>
                </div>

                <div className="p-5 space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-xs text-red-400">{formError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                        <input
                          type="text"
                          value={form.full_name}
                          onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                          placeholder="Recipient full name"
                          className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue text-xs"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">Contact Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+234 800 000 0000 (For courier delivery update)"
                          className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">State *</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                        placeholder="e.g. Lagos, Abuja, Rivers"
                        className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">City / Town *</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                        placeholder="e.g. Ikeja, Lekki, Wuse"
                        className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">Delivery Street Address *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-veltrix-gray-500" />
                        <textarea
                          value={form.address}
                          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                          placeholder="Street name, house/apartment number, nearest landmark..."
                          rows={2}
                          className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue resize-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Payment Method Selectors ── */}
              <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-veltrix-gray-800">
                  <h2 className="font-bold text-white text-base">Select Payment Method</h2>
                  <span className="text-[11px] text-veltrix-blue font-semibold">100% Secure Transaction</span>
                </div>

                {/* Method Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option 1: Gift Card (Active & Available) */}
                  <div 
                    onClick={() => setPaymentMethod('giftcard')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                      paymentMethod === 'giftcard' 
                        ? 'bg-gradient-to-br from-veltrix-blue/15 to-purple-500/10 border-veltrix-blue shadow-glow' 
                        : 'bg-veltrix-black/60 border-veltrix-gray-800 hover:border-veltrix-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-veltrix-blue/20 text-veltrix-blue flex items-center justify-center font-bold">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Gift Card</p>
                          <p className="text-[10px] text-veltrix-gray-400">Apple, Razer, Steam, etc.</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        AVAILABLE NOW
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Reach Out to Agent (Active & Available) */}
                  <div 
                    onClick={() => setPaymentMethod('agent')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'agent' 
                        ? 'bg-gradient-to-br from-green-500/15 to-veltrix-blue/10 border-green-400 shadow-glow' 
                        : 'bg-veltrix-black/60 border-veltrix-gray-800 hover:border-veltrix-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center font-bold">
                          <Headphones className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">Reach Out to Agent</p>
                          <p className="text-[10px] text-veltrix-gray-400">Live Support & Custom Pay</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-veltrix-blue/20 text-veltrix-blue border border-veltrix-blue/30">
                        INSTANT AGENT
                      </span>
                    </div>
                  </div>

                  {/* Option 3: ATM Card (Unavailable at the moment) */}
                  <div 
                    onClick={handleAtmCardClick}
                    className="p-4 rounded-xl border border-veltrix-gray-800/80 bg-veltrix-black/30 opacity-70 cursor-not-allowed relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-veltrix-gray-800 text-veltrix-gray-500 flex items-center justify-center font-bold">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-veltrix-gray-300 text-xs">ATM Card</p>
                          <p className="text-[10px] text-veltrix-gray-500">Mastercard, Visa, Verve</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                        UNAVAILABLE NOW
                      </span>
                    </div>
                  </div>

                  {/* Option 4: Crypto Currency (Coming Soon) */}
                  <div 
                    className="p-4 rounded-xl border border-veltrix-gray-800/80 bg-veltrix-black/30 opacity-70 cursor-not-allowed relative"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-veltrix-gray-800 text-veltrix-gray-500 flex items-center justify-center font-bold">
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-veltrix-gray-300 text-xs">Crypto (USDT / BTC)</p>
                          <p className="text-[10px] text-veltrix-gray-500">Automated Web3 Pay</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        COMING SOON
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── SUB-PANEL: GIFT CARD (Active) ── */}
                {paymentMethod === 'giftcard' && (
                  <div className="pt-4 border-t border-veltrix-gray-800 space-y-4 animate-fade-in">
                    
                    {/* Gift Card Visual Showcase (Transparent background image) */}
                    <div className="relative p-6 bg-gradient-to-b from-veltrix-black via-veltrix-black/80 to-veltrix-black-light rounded-2xl border border-veltrix-gray-800 text-center overflow-hidden">
                      <div className="absolute -top-12 -left-12 w-36 h-36 bg-veltrix-blue/20 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative z-10 flex flex-col items-center">
                        <img 
                          src="/images/giftcard.png" 
                          alt="CarryGoExpress Digital Gift Card" 
                          className="w-full max-w-[240px] h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,212,255,0.3)] transition-transform hover:scale-105 duration-300"
                        />
                        <div className="mt-3">
                          <h4 className="text-white font-bold text-sm">CarryGoExpress Gift Card Checkout</h4>
                          <p className="text-xs text-veltrix-gray-400 mt-0.5">
                            Redeem Apple, Steam, Razer Gold, Amazon, or Vanilla cards for instant gadget settlement
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-semibold text-veltrix-gray-300">Select Gift Card Type *</label>
                        <select
                          value={giftCardType}
                          onChange={e => setGiftCardType(e.target.value)}
                          className="input-field text-xs"
                        >
                          {giftCardOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-veltrix-gray-300">Claim Code / Card Number *</label>
                          <input
                            type="text"
                            required
                            value={giftCardCode}
                            onChange={e => setGiftCardCode(e.target.value)}
                            placeholder="e.g. X882-9912-XXXX-XXXX"
                            className="input-field text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-veltrix-gray-300">Card PIN (If applicable)</label>
                          <input
                            type="text"
                            value={giftCardPin}
                            onChange={e => setGiftCardPin(e.target.value)}
                            placeholder="4-digit PIN"
                            className="input-field text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Photo / Receipt Upload */}
                      <div className="space-y-1 pt-1">
                        <label className="font-semibold text-veltrix-gray-300 flex items-center justify-between">
                          <span>Card Back / Receipt Photo (Optional for faster verification)</span>
                          {uploadingReceipt && <span className="text-veltrix-blue text-[11px] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>}
                        </label>
                        <label className="p-3 bg-veltrix-black border border-dashed border-veltrix-gray-700 hover:border-veltrix-blue/50 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-veltrix-gray-400 hover:text-white transition-colors">
                          <Upload className="w-4 h-4 text-veltrix-blue" />
                          <span>{giftCardReceipt ? 'Photo Attached (Click to change)' : 'Upload Card Photo or Purchase Receipt'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleReceiptUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={handleGiftCardPayment}
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-veltrix-blue to-purple-500 text-black font-extrabold rounded-xl text-sm shadow-glow hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying & Placing Order...</span>
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4" />
                            <span>Pay with Gift Card & Place Order</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── SUB-PANEL: REACH OUT TO AGENT (Active) ── */}
                {paymentMethod === 'agent' && (
                  <div className="pt-4 border-t border-veltrix-gray-800 space-y-4 animate-fade-in">
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
                        <Headphones className="w-4 h-4" />
                        <span>Dedicated Live Support & Custom Settlement</span>
                      </div>
                      <p className="text-xs text-veltrix-gray-300 leading-relaxed">
                        Need assistance completing your payment, wish to pay via direct crypto transfer, or want bespoke delivery arrangements? A CarryGoExpress agent is on standby 24/7 to finalize your transaction.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href={`https://wa.me/?text=Hello%20CarryGoExpress%20Agent!%20I%20am%20ready%20to%20complete%20my%20order%20for%20${encodeURIComponent(items.map(i => i.name).join(', '))}%20totaling%20${encodeURIComponent(formatPrice(totalAmount))}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3.5 bg-green-500 text-black font-bold rounded-xl text-xs hover:bg-green-400 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat Directly with Live Agent</span>
                      </a>

                      <button
                        onClick={handleAgentOrder}
                        disabled={isProcessing}
                        className="flex-1 py-3.5 bg-veltrix-black border border-veltrix-gray-700 text-white font-bold rounded-xl text-xs hover:border-veltrix-blue transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-veltrix-blue" />}
                        <span>Reserve Order for Agent</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── SUB-PANEL: ATM CARD (Unavailable notice) ── */}
                {paymentMethod === 'atm_card' && (
                  <div className="pt-4 border-t border-veltrix-gray-800 space-y-3 animate-fade-in text-xs text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto" />
                    <h4 className="font-bold text-yellow-300">ATM Card Gateway Unavailable</h4>
                    <p className="text-veltrix-gray-400">
                      Our ATM card payment network is currently undergoing scheduled upgrade. Please use <strong>Gift Card</strong> or <strong>Reach Out to Agent</strong> to complete your order instantly.
                    </p>
                    <button
                      onClick={() => setPaymentMethod('giftcard')}
                      className="px-4 py-2 bg-veltrix-blue text-black font-bold rounded-lg text-xs"
                    >
                      Switch to Gift Card (Available Now)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right Column: Order Summary & Cart Items ── */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-5 shadow-xl sticky top-24">
                <div className="flex items-center justify-between pb-4 border-b border-veltrix-gray-800 mb-4">
                  <h2 className="font-bold text-white text-base">Gadget Cart Summary</h2>
                  <span className="text-xs font-mono text-veltrix-gray-400">{items.length} items</span>
                </div>

                {/* Item List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 bg-veltrix-black/60 rounded-xl border border-veltrix-gray-800/40">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100'} 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded-lg border border-veltrix-gray-800 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-veltrix-gray-400">{formatPrice(item.price)} × {item.quantity}</p>
                      </div>
                      <span className="font-black text-white text-xs shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="border-t border-veltrix-gray-800 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-veltrix-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white font-semibold">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-veltrix-gray-400">
                    <span>Express Insured Shipping</span>
                    <span className="text-green-400 font-bold uppercase text-[11px]">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-black pt-3 border-t border-veltrix-gray-800">
                    <span className="text-white">Total Order Value</span>
                    <span className="text-veltrix-blue">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Optional Wallet Balance Quick Pay */}
                {walletBalance >= totalAmount && (
                  <div className="mt-5 p-3.5 bg-veltrix-black border border-green-500/30 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-veltrix-gray-300">Available Wallet</span>
                      <span className="font-bold text-green-400">{formatPrice(walletBalance)}</span>
                    </div>
                    <button
                      onClick={handleWalletPayment}
                      disabled={isProcessing}
                      className="w-full py-2.5 bg-green-500/15 text-green-400 border border-green-500/30 font-bold rounded-lg hover:bg-green-500/25 transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Quick Pay with Wallet Balance</span>
                    </button>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="mt-5 pt-4 border-t border-veltrix-gray-800 space-y-2 text-[11px] text-veltrix-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-veltrix-blue shrink-0" />
                    <span>CarryGo Buyer Protection & 2-Year Official Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Insured Same-Day Dispatch Across Nigeria</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Order Success Modal ── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-300 space-y-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-white">Order Confirmed! 🎉</h2>
            <p className="text-xs text-veltrix-gray-400 leading-relaxed">
              {orderSuccess.message}
            </p>

            <div className="bg-veltrix-black rounded-2xl p-4 border border-veltrix-gray-800 text-xs space-y-1.5 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-veltrix-gray-500 font-sans">Order ID:</span>
                <span className="text-white font-bold">#{(orderSuccess.orderId || '').slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-veltrix-gray-500 font-sans">Payment Method:</span>
                <span className="text-veltrix-blue font-bold">{orderSuccess.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-veltrix-gray-500 font-sans">Reference:</span>
                <span className="text-veltrix-gray-300">{orderSuccess.reference}</span>
              </div>
              <div className="border-t border-veltrix-gray-800 pt-1.5 flex justify-between font-bold text-sm">
                <span className="text-veltrix-gray-400 font-sans">Total:</span>
                <span className="text-veltrix-blue">{formatPrice(orderSuccess.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {orderSuccess.isAgent && (
                <a
                  href={`https://wa.me/?text=Hello%20CarryGoExpress%20Support!%20My%20Order%20ID%20is%20${encodeURIComponent(orderSuccess.orderId)}%20(Ref:%20${encodeURIComponent(orderSuccess.reference)}).%20Please%20assist%20me%20with%20payment%20verification.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-green-500 text-black font-bold rounded-xl text-xs hover:bg-green-400 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Connect with Agent on WhatsApp</span>
                </a>
              )}

              <Link
                to="/orders"
                className="w-full py-3.5 bg-veltrix-blue text-black font-bold rounded-xl text-xs hover:shadow-glow transition-all"
              >
                Track My Gadget Order
              </Link>

              <button
                onClick={() => setOrderSuccess(null)}
                className="w-full py-2.5 text-xs text-veltrix-gray-400 hover:text-white"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
