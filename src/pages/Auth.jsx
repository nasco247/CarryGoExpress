import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield, 
  CheckCircle, AlertCircle, Sparkles, Loader2, ArrowLeft, Check
} from 'lucide-react'
import { signIn, signUp, resendConfirmationEmail } from '../lib/supabase'
import { useAuthStore } from '../hooks/useStore'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { setUser } = useAuthStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const trimmedEmail = email.trim().toLowerCase()

    try {
      const { data, error: sbError } = await signIn(trimmedEmail, password)

      if (sbError) {
        console.warn('[Login Notice] Supabase response:', sbError.message)
        if (sbError.message?.includes('schema') || sbError.message?.includes('Database error')) {
          setError('Database schema sync required: please run the supabase_schema.sql script in your Supabase SQL editor to ensure auth tokens are initialized.')
        } else {
          setError(sbError.message || 'Invalid email or password. Please try again.')
        }
        setLoading(false)
      } else {
        setUser(data.user)
        const isAdmin = data.user?.app_metadata?.role === 'admin' || data.user?.user_metadata?.role === 'admin'
        if (redirect) {
          navigate(redirect)
        } else if (isAdmin) {
          navigate('/admin')
        } else {
          navigate('/')
        }
        setLoading(false)
      }
    } catch (err) {
      console.error('[Login Error]', err)
      setError(err.message || 'An unexpected error occurred during sign in.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 bg-veltrix-black overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-veltrix-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-veltrix-gray-400 hover:text-veltrix-blue transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Store</span>
          </Link>
          <span className="text-[11px] font-mono text-veltrix-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Store Secure
          </span>
        </div>

        {/* Card Header & Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group mb-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-glow group-hover:scale-105 transition-transform border border-veltrix-blue/30 bg-black flex items-center justify-center">
              <img src="/logo.png" alt="CarryGoExpress" className="w-full h-full object-cover" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-veltrix-gray-400 mt-1.5 text-xs sm:text-sm">
            {redirect === '/admin' 
              ? 'Sign in with administrator credentials' 
              : 'Sign in to your CarryGoExpress account'}
          </p>
        </div>

        {/* Auth Mode Toggle Pill */}
        <div className="grid grid-cols-2 p-1 bg-veltrix-black-light/80 border border-veltrix-gray-800 rounded-xl mb-4">
          <div className="py-2 text-center text-xs font-bold text-veltrix-black bg-veltrix-blue rounded-lg shadow-sm">
            Sign In
          </div>
          <Link 
            to="/register" 
            className="py-2 text-center text-xs font-semibold text-veltrix-gray-400 hover:text-white transition-colors"
          >
            Create Account
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-veltrix-black-light/95 backdrop-blur-xl border border-veltrix-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-veltrix-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. johnsmith@example.com"
                  className="w-full h-12 pl-10 pr-4 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue focus:ring-2 focus:ring-veltrix-blue/20 text-base sm:text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-veltrix-gray-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-11 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue focus:ring-2 focus:ring-veltrix-blue/20 text-base sm:text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-veltrix-gray-500 hover:text-white transition-colors rounded-lg focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="w-4 h-4 rounded border-veltrix-gray-700 bg-veltrix-black text-veltrix-blue focus:ring-veltrix-blue cursor-pointer" 
                />
                <span className="text-veltrix-gray-400">Remember me</span>
              </label>
              <span className="text-[11px] text-veltrix-gray-500 font-mono">256-bit SSL</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 bg-veltrix-blue text-veltrix-black font-extrabold rounded-xl text-sm shadow-glow hover:shadow-glow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-veltrix-gray-800 text-center">
            <p className="text-xs text-veltrix-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-veltrix-blue hover:underline font-bold transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security Trust Badge */}
        <div className="mt-6 text-center text-[11px] text-veltrix-gray-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>Encrypted Session • Supabase Authentication</span>
        </div>

      </div>
    </div>
  )
}

export function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState(null)
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleResend = async () => {
    if (!registeredEmail) return
    setResending(true)
    setResendStatus(null)
    const { error: resendErr } = await resendConfirmationEmail(registeredEmail)
    setResending(false)
    if (resendErr) {
      setResendStatus({ type: 'error', message: resendErr.message || 'Failed to resend confirmation email.' })
    } else {
      setResendStatus({ type: 'success', message: 'Confirmation email resent! Please check your inbox and spam folder.' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const name = formData.fullName.trim()
    const email = formData.email.trim()

    if (!name || name.length < 2) {
      setError('Please provide your full name (at least 2 characters).')
      return
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.')
      return
    }

    setLoading(true)

    try {
      const { data, error: sbError } = await signUp(email, formData.password, {
        full_name: name,
        role: 'customer'
      })

      if (sbError) {
        let msg = sbError.message || 'Failed to create account. Please try again.'
        if (msg.toLowerCase().includes('database error saving new user')) {
          msg = 'Database schema notice: Please run the updated supabase_schema.sql in your Supabase SQL Editor to enable automatic customer profile creation.'
        } else if (msg.toLowerCase().includes('rate limit')) {
          msg = 'Supabase email rate limit reached. In your Supabase Dashboard under Authentication -> Providers -> Email, disable "Confirm email" for instant account creation.'
        }
        setError(msg)
        setLoading(false)
        return
      }

      setRegisteredEmail(email)

      // If Supabase immediately returns a session, log user in directly
      if (data?.session && data?.user) {
        setUser(data.user)
        setSuccess(true)
        setTimeout(() => navigate('/'), 2800)
      } else {
        // Confirmation email state or user created
        setSuccess(true)
        setLoading(false)
      }
    } catch (err) {
      console.error('[Sign Up Error]', err)
      setError(err.message || 'An error occurred during account registration.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 bg-veltrix-black overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-veltrix-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md mx-auto z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-veltrix-gray-400 hover:text-veltrix-blue transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Store</span>
          </Link>
          <span className="text-[11px] font-mono text-veltrix-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Instant Activation
          </span>
        </div>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group mb-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto shadow-glow group-hover:scale-105 transition-transform border border-veltrix-blue/30 bg-black flex items-center justify-center">
              <img src="/logo.png" alt="CarryGoExpress" className="w-full h-full object-cover" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Create an Account
          </h1>
          <p className="text-veltrix-gray-400 mt-1.5 text-xs sm:text-sm">
            Join CarryGoExpress for fast checkout and gadget tracking
          </p>
        </div>

        {/* Auth Mode Toggle Pill */}
        <div className="grid grid-cols-2 p-1 bg-veltrix-black-light/80 border border-veltrix-gray-800 rounded-xl mb-4">
          <Link 
            to="/login" 
            className="py-2 text-center text-xs font-semibold text-veltrix-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <div className="py-2 text-center text-xs font-bold text-veltrix-black bg-veltrix-blue rounded-lg shadow-sm">
            Create Account
          </div>
        </div>

        {/* Card */}
        <div className="bg-veltrix-black-light/95 backdrop-blur-xl border border-veltrix-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {success ? (
            <div className="py-4 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-veltrix-blue/25 to-purple-500/20 text-veltrix-blue border border-veltrix-blue/40 rounded-2xl flex items-center justify-center mx-auto shadow-glow">
                <Mail className="w-8 h-8 text-veltrix-blue animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Confirmation Email Sent! 📩</h2>
                <p className="text-xs text-veltrix-gray-300 mt-2 leading-relaxed">
                  We've sent a secure verification link to:
                </p>
                <div className="mt-1 px-3 py-1.5 bg-veltrix-black border border-veltrix-gray-800 rounded-lg inline-block max-w-full">
                  <span className="text-veltrix-blue font-mono font-bold text-xs truncate block">{registeredEmail}</span>
                </div>
              </div>

              {/* Instructions checklist */}
              <div className="p-3.5 bg-veltrix-black/80 rounded-xl border border-veltrix-gray-800 text-left text-xs space-y-2">
                <div className="flex items-start gap-2 text-veltrix-gray-300">
                  <span className="w-4 h-4 rounded-full bg-veltrix-blue/20 text-veltrix-blue text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Open your inbox and look for the confirmation link from <strong>CarryGoExpress</strong>.</span>
                </div>
                <div className="flex items-start gap-2 text-veltrix-gray-300">
                  <span className="w-4 h-4 rounded-full bg-veltrix-blue/20 text-veltrix-blue text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Can't find it? Check your <strong>Spam or Junk folder</strong> (usually arrives in 1–2 minutes).</span>
                </div>
                <div className="flex items-start gap-2 text-veltrix-gray-300">
                  <span className="w-4 h-4 rounded-full bg-veltrix-blue/20 text-veltrix-blue text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Click <strong>Confirm Email</strong> in the message to activate full checkout & order access.</span>
                </div>
              </div>

              {resendStatus && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  resendStatus.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-300' : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  {resendStatus.type === 'success' ? <Check className="w-4 h-4 text-green-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <span>{resendStatus.message}</span>
                </div>
              )}

              <div className="pt-2 space-y-2.5">
                <Link
                  to="/login"
                  className="w-full h-12 bg-veltrix-blue text-veltrix-black font-bold rounded-xl text-sm shadow-glow flex items-center justify-center gap-2 hover:shadow-glow-lg transition-all"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-2.5 bg-veltrix-gray-900 border border-veltrix-gray-800 hover:border-veltrix-gray-700 text-veltrix-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {resending ? 'Resending verification email...' : "Didn't receive it? Click to Resend Email"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-veltrix-gray-300">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. John Smith"
                    className="w-full h-12 pl-10 pr-4 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue focus:ring-2 focus:ring-veltrix-blue/20 text-base sm:text-sm transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-veltrix-gray-300">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. johnsmith@example.com"
                    className="w-full h-12 pl-10 pr-4 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue focus:ring-2 focus:ring-veltrix-blue/20 text-base sm:text-sm transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-veltrix-gray-300">
                    Password *
                  </label>
                  <span className="text-[10px] text-veltrix-gray-500 font-mono">Min 6 chars</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-12 pl-10 pr-11 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue focus:ring-2 focus:ring-veltrix-blue/20 text-base sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-veltrix-gray-500 hover:text-white transition-colors rounded-lg focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-veltrix-gray-300">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-12 pl-10 pr-11 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white placeholder-veltrix-gray-600 focus:outline-none focus:border-veltrix-blue focus:ring-2 focus:ring-veltrix-blue/20 text-base sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-veltrix-gray-500 hover:text-white transition-colors rounded-lg focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match yet
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-[11px] text-green-400 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-veltrix-blue text-veltrix-black font-extrabold rounded-xl text-sm shadow-glow hover:shadow-glow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create CarryGoExpress Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-veltrix-gray-800 text-center">
            <p className="text-xs text-veltrix-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-veltrix-blue hover:underline font-bold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center text-[11px] text-veltrix-gray-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-green-400" />
          <span>Protected by Supabase Auth with Row Level Security</span>
        </div>
      </div>
    </div>
  )
}
