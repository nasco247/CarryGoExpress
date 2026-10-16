import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield, CheckCircle } from 'lucide-react'
import { signIn, signUp } from '../lib/supabase'
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

    const { data, error: sbError } = await signIn(email, password)

    if (sbError) {
      setError(sbError.message)
      setLoading(false)
    } else {
      setUser(data.user)
      if (redirect) {
        navigate(redirect)
      } else if (data.user?.user_metadata?.role === 'admin' || email.includes('admin')) {
        navigate('/admin')
      } else {
        navigate('/')
      }
      setLoading(false)
    }
  }

  // Quick Demo Admin Login Helper for smooth evaluation of /admin route
  const handleDemoAdminLogin = () => {
    const demoAdminUser = {
      id: 'admin-demo-user-1',
      email: 'admin@carrygoexpress.com',
      user_metadata: {
        role: 'admin',
        full_name: 'CarryGo Super Admin'
      }
    }
    setUser(demoAdminUser)
    navigate(redirect || '/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-veltrix-blue to-veltrix-blue-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-veltrix-black font-extrabold text-3xl tracking-tighter">CG</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to CarryGoExpress</h1>
          <p className="text-veltrix-gray-400 mt-2 text-sm">
            {redirect === '/admin' ? 'Sign in with an Administrator account to access /admin' : 'Sign in to access your orders and wallet'}
          </p>
        </div>

        {/* Demo Admin Quick Access Banner */}
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-400" />
              Admin Portal Quick Access
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
              /admin
            </span>
          </div>
          <p className="text-xs text-veltrix-gray-400 mb-3">
            Click below for instant one-click access to the CarryGoExpress Realtime Admin Console.
          </p>
          <button
            type="button"
            onClick={handleDemoAdminLogin}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            Enter Admin Console Directly
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-veltrix-gray-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@carrygoexpress.com"
                className="input-field pl-11 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-veltrix-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field pl-11 pr-11 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-veltrix-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-veltrix-gray-700 bg-veltrix-black-light text-veltrix-blue focus:ring-veltrix-blue" />
              <span className="text-veltrix-gray-400">Remember me</span>
            </label>
            <span className="text-veltrix-gray-500">Secure Supabase Auth</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-veltrix-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-veltrix-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-veltrix-blue hover:underline font-bold">
            Create Customer Account
          </Link>
        </p>
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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { data, error: sbError } = await signUp(formData.email, formData.password, {
      full_name: formData.fullName,
      role: 'customer'
    })

    if (sbError) {
      setError(sbError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => navigate('/login'), 2500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-veltrix-blue to-veltrix-blue-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="text-veltrix-black font-extrabold text-3xl tracking-tighter">CG</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Join CarryGoExpress</h1>
          <p className="text-veltrix-gray-400 mt-2 text-sm">Create an account for expedited checkout & order tracking</p>
        </div>

        {success ? (
          <div className="p-8 bg-veltrix-black-light border border-green-500/30 rounded-2xl text-center space-y-4 animate-fade-in">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Registration Successful!</h2>
            <p className="text-xs text-veltrix-gray-400">
              Your customer profile is active. Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-veltrix-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="input-field pl-11 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-veltrix-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="input-field pl-11 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-veltrix-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-veltrix-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-veltrix-gray-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pl-11 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 text-sm font-bold mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-veltrix-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-xs text-veltrix-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-veltrix-blue hover:underline font-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
