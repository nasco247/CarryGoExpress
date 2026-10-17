import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Edit3, Save, X, Camera,
  ShoppingBag, Wallet, ArrowRight, LogOut, Shield,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react'
import { useAuthStore, useOrderStore, useTransactionStore } from '../hooks/useStore'
import { supabase, signOut } from '../lib/supabase'
import { formatPrice } from '../lib/utils'

// ─── How this page works ─────────────────────────────────────────────────────
// 1. Loads the logged-in user's profile from Supabase `profiles` table
// 2. Allows editing name, phone, and address — saved back to Supabase on submit
// 3. Shows wallet balance from the transactions store
// 4. Quick-links to Orders, Transactions, and Deposit pages
// 5. Supports avatar upload via Supabase Storage (avatars bucket)
// ──────────────────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile, logout } = useAuthStore()
  const { orders, fetchOrders } = useOrderStore()
  const { walletBalance, fetchTransactions } = useTransactionStore()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  })

  // ── Load profile & data on mount ────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      console.log('[Profile] No user found, redirecting to login')
      navigate('/login')
      return
    }
    console.log('[Profile] Loading data for user:', user.id)
    fetchOrders(user.id)
    fetchTransactions(user.id)
  }, [user, navigate, fetchOrders, fetchTransactions])

  useEffect(() => {
    if (profile) {
      console.log('[Profile] Profile loaded:', profile)
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
      })
    }
  }, [profile])

  // ── Show toast notification ─────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Save profile changes ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    console.log('[Profile] Saving profile updates:', form)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: form.full_name?.trim() || null,
          phone: form.phone?.trim() || null,
          address: form.address?.trim() || null,
          city: form.city?.trim() || null,
          state: form.state?.trim() || null,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('[Profile] Save error:', error)
        showToast('Failed to save profile: ' + error.message, 'error')
        return
      }
      console.log('[Profile] Profile saved successfully')
      await refreshProfile()
      setEditing(false)
      showToast('Personal information updated successfully!')
    } catch (err) {
      console.error('[Profile] Unexpected save error:', err)
      showToast('An unexpected error occurred while saving profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Avatar upload ────────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error')
      return
    }

    setUploadingAvatar(true)
    console.log('[Profile] Uploading avatar:', file.name)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        console.error('[Profile] Avatar upload error:', uploadError)
        showToast('Avatar upload failed: ' + uploadError.message, 'error')
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      console.log('[Profile] Avatar uploaded, public URL:', publicUrl)

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() })

      if (updateError) {
        console.error('[Profile] Avatar URL update error:', updateError)
        showToast('Failed to update avatar URL', 'error')
        return
      }

      await refreshProfile()
      showToast('Avatar updated successfully!')
    } catch (err) {
      console.error('[Profile] Unexpected avatar error:', err)
      showToast('Upload failed unexpectedly', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    console.log('[Profile] Logging out...')
    await logout()
    navigate('/login')
  }

  if (!user) return null

  const completedOrders = orders.filter(o => o.status === 'delivered').length
  const pendingOrders = orders.filter(o => ['pending', 'processing'].includes(o.status)).length
  const avatarUrl = profile?.avatar_url || null
  const initials = (form.full_name || user.email || '?').charAt(0).toUpperCase()

  const completionItems = [
    { key: 'full_name', label: 'Full Name', done: !!form.full_name?.trim() },
    { key: 'phone', label: 'Phone Number', done: !!form.phone?.trim() },
    { key: 'address', label: 'Delivery Address', done: !!form.address?.trim() },
    { key: 'city', label: 'City', done: !!form.city?.trim() },
    { key: 'state', label: 'State / Province', done: !!form.state?.trim() },
  ]
  const completedFieldsCount = completionItems.filter(i => i.done).length
  const completionPercentage = Math.round((completedFieldsCount / completionItems.length) * 100)
  const isProfileComplete = completionPercentage === 100
  const missingFields = completionItems.filter(i => !i.done).map(i => i.label)

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Toast ── */}
        {toast && (
          <div className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-sm animate-fade-in
            ${toast.type === 'success'
              ? 'bg-green-500/20 border-green-500/40 text-green-400'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
            }`}>
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
          <p className="text-veltrix-gray-400 mt-1">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Avatar Card ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Avatar */}
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-veltrix-blue/40 flex items-center justify-center bg-veltrix-gray-900">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-veltrix-blue">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-veltrix-blue rounded-full flex items-center justify-center border-2 border-veltrix-black-light hover:bg-veltrix-blue/80 transition-colors"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 text-black animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-black" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <h2 className="mt-4 text-xl font-bold text-white">{form.full_name || 'Set your name'}</h2>
              <p className="text-sm text-veltrix-gray-400 mt-1">{user.email}</p>
              <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                <Shield className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Verified Account</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'blue' },
                { label: 'Wallet Balance', value: formatPrice(walletBalance), icon: Wallet, color: 'green', small: true },
                { label: 'Completed', value: completedOrders, icon: CheckCircle, color: 'green' },
                { label: 'Pending', value: pendingOrders, icon: AlertCircle, color: 'yellow' },
              ].map((stat, i) => (
                <div key={i} className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl p-4">
                  <stat.icon className={`w-5 h-5 mb-2 ${
                    stat.color === 'blue' ? 'text-veltrix-blue' :
                    stat.color === 'green' ? 'text-green-400' : 'text-yellow-400'
                  }`} />
                  <p className={`font-bold ${stat.small ? 'text-sm' : 'text-xl'} text-white`}>{stat.value}</p>
                  <p className="text-xs text-veltrix-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl overflow-hidden">
              {[
                { to: '/orders', icon: ShoppingBag, label: 'My Orders' },
                { to: '/transactions', icon: Wallet, label: 'Transactions' },
                { to: '/deposit', icon: Wallet, label: 'Deposit Funds' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between px-5 py-4 hover:bg-veltrix-gray-900/50 transition-colors border-b border-veltrix-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="w-4 h-4 text-veltrix-blue" />
                    <span className="text-sm text-veltrix-gray-300">{link.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-veltrix-gray-600" />
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/10 transition-colors text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>

          {/* ── Right: Edit Form ── */}
          <div className="lg:col-span-2">
            <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-6">
              {/* Profile Completion Callout */}
              {!isProfileComplete ? (
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-veltrix-blue/10 via-veltrix-blue/5 to-transparent border border-veltrix-blue/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-veltrix-blue shrink-0" />
                      <span className="text-sm font-bold text-white">Complete Your Personal Information</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-veltrix-blue bg-veltrix-blue/10 px-2.5 py-1 rounded-full border border-veltrix-blue/20">
                      {completionPercentage}% Completed ({completedFieldsCount}/{completionItems.length})
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-veltrix-black rounded-full overflow-hidden mb-2.5 border border-veltrix-gray-800">
                    <div
                      className="h-full bg-gradient-to-r from-veltrix-blue to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-veltrix-gray-400">
                    Missing: <span className="text-veltrix-gray-200 font-medium">{missingFields.join(', ')}</span>.
                    Please complete your personal details to enable fast delivery dispatch and one-click checkout.
                  </p>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-veltrix-blue text-black text-xs font-bold rounded-lg hover:bg-veltrix-blue/90 transition-colors shadow-glow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Complete Personal Information Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-400 text-xs font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Personal Profile 100% Completed</span>
                  </div>
                  <span className="text-[11px] text-green-300 font-mono">Ready for 1-Click Checkout</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Personal Information</h2>
                  <p className="text-xs text-veltrix-gray-400 mt-0.5">Your official recipient and delivery contact details</p>
                </div>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-veltrix-blue/10 text-veltrix-blue border border-veltrix-blue/30 rounded-xl hover:bg-veltrix-blue/20 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(false); setForm({ full_name: profile?.full_name || '', phone: profile?.phone || '', address: profile?.address || '', city: profile?.city || '', state: profile?.state || '' }) }}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-veltrix-gray-700 text-veltrix-gray-400 rounded-xl hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm bg-veltrix-blue text-black font-bold rounded-xl hover:bg-veltrix-blue/90 transition-colors disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Full Name */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">
                      Full Name *
                    </label>
                    {editing && <span className="text-[11px] text-veltrix-blue">Required</span>}
                  </div>
                  {editing ? (
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                        placeholder="Enter your full name (e.g. John Smith)"
                        className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditing(true)}
                      className="cursor-pointer group flex items-center justify-between py-3 px-4 bg-veltrix-black/50 rounded-xl border border-veltrix-gray-800 hover:border-veltrix-blue/40 transition-colors"
                    >
                      <span className="text-white text-sm">
                        {form.full_name || <span className="text-veltrix-gray-500 italic">Not set — click to complete</span>}
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-veltrix-gray-600 group-hover:text-veltrix-blue transition-colors" />
                    </div>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                    <p className="pl-10 py-3 pr-4 bg-veltrix-black/50 rounded-xl border border-veltrix-gray-800 text-veltrix-gray-400 text-sm">
                      {user.email}
                      <span className="ml-2 text-xs text-veltrix-gray-600">(cannot be changed)</span>
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">
                      Phone Number *
                    </label>
                    {editing && <span className="text-[11px] text-veltrix-blue">Required</span>}
                  </div>
                  {editing ? (
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+1 (555) 019-2834"
                        className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditing(true)}
                      className="cursor-pointer group flex items-center justify-between py-3 px-4 bg-veltrix-black/50 rounded-xl border border-veltrix-gray-800 hover:border-veltrix-blue/40 transition-colors"
                    >
                      <span className="text-white text-sm">
                        {form.phone || <span className="text-veltrix-gray-500 italic">Not set — click to complete</span>}
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-veltrix-gray-600 group-hover:text-veltrix-blue transition-colors" />
                    </div>
                  )}
                </div>

                {/* State / Province */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">
                      State / Province *
                    </label>
                    {editing && <span className="text-[11px] text-veltrix-blue">Required</span>}
                  </div>
                  {editing ? (
                    <input
                      type="text"
                      value={form.state}
                      onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                      placeholder="e.g. California, Texas, New York"
                      className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                    />
                  ) : (
                    <div
                      onClick={() => setEditing(true)}
                      className="cursor-pointer group flex items-center justify-between py-3 px-4 bg-veltrix-black/50 rounded-xl border border-veltrix-gray-800 hover:border-veltrix-blue/40 transition-colors"
                    >
                      <span className="text-white text-sm">
                        {form.state || <span className="text-veltrix-gray-500 italic">Not set — click to complete</span>}
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-veltrix-gray-600 group-hover:text-veltrix-blue transition-colors" />
                    </div>
                  )}
                </div>

                {/* City */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">
                      City *
                    </label>
                    {editing && <span className="text-[11px] text-veltrix-blue">Required</span>}
                  </div>
                  {editing ? (
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Los Angeles, Austin"
                      className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                    />
                  ) : (
                    <div
                      onClick={() => setEditing(true)}
                      className="cursor-pointer group flex items-center justify-between py-3 px-4 bg-veltrix-black/50 rounded-xl border border-veltrix-gray-800 hover:border-veltrix-blue/40 transition-colors"
                    >
                      <span className="text-white text-sm">
                        {form.city || <span className="text-veltrix-gray-500 italic">Not set — click to complete</span>}
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-veltrix-gray-600 group-hover:text-veltrix-blue transition-colors" />
                    </div>
                  )}
                </div>

                {/* Delivery Address */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider">
                      Delivery Address *
                    </label>
                    {editing && <span className="text-[11px] text-veltrix-blue">Required</span>}
                  </div>
                  {editing ? (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-veltrix-gray-500" />
                      <textarea
                        value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Street address (e.g. 742 Evergreen Terrace, Apt 4B)"
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue transition-colors resize-none text-sm"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditing(true)}
                      className="cursor-pointer group flex items-center justify-between py-3 px-4 bg-veltrix-black/50 rounded-xl border border-veltrix-gray-800 min-h-[48px] hover:border-veltrix-blue/40 transition-colors"
                    >
                      <span className="text-white text-sm">
                        {form.address || <span className="text-veltrix-gray-500 italic">Not set — click to complete</span>}
                      </span>
                      <Edit3 className="w-3.5 h-3.5 text-veltrix-gray-600 group-hover:text-veltrix-blue transition-colors" />
                    </div>
                  )}
                </div>
              </div>

              {editing && (
                <div className="mt-4 p-3 bg-veltrix-blue/5 border border-veltrix-blue/20 rounded-xl">
                  <p className="text-xs text-veltrix-gray-400">
                    💡 <strong className="text-veltrix-blue">Tip:</strong> Your delivery address will be pre-filled during checkout to save time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
