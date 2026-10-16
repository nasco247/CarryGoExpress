import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Tag, Clock, Zap, Flame, ChevronRight, Star, ShoppingCart, Package, ArrowLeft } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useCartStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'
import LazyImage from '../components/LazyImage'

const DEAL_ENDS_HOURS = 24

function useCountdown(hoursFromNow) {
  const [timeLeft, setTimeLeft] = useState(() => hoursFromNow * 3600)
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const h = String(Math.floor(timeLeft / 3600)).padStart(2, '0')
  const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0')
  const s = String(timeLeft % 60).padStart(2, '0')
  return { h, m, s }
}

const FILTERS = [
  { label: 'All Deals', min: 1 },
  { label: '5%+ Off',   min: 5 },
  { label: '10%+ Off',  min: 10 },
  { label: '20%+ Off',  min: 20 },
]

export default function Deals() {
  const { addItem, openCart } = useCartStore()
  const { h, m, s } = useCountdown(DEAL_ENDS_HOURS)
  const [filterMin, setFilterMin] = useState(1)
  const [added, setAdded] = useState(null)

  // Fetch real products from Supabase
  const { products: allProducts, loading } = useProducts({ limit: 60 })

  const dealsAll = (allProducts || [])
    .filter(p => p.original_price && Number(p.original_price) > Number(p.price))
    .map(p => ({
      ...p,
      discount: Math.round(((p.original_price - p.price) / p.original_price) * 100),
      saving: p.original_price - p.price,
    }))
    .sort((a, b) => b.discount - a.discount)

  const deals = dealsAll.filter(p => p.discount >= filterMin)
  const flashDeals = dealsAll.slice(0, 3)

  const handleAdd = (product) => {
    addItem(product)
    openCart()
    setAdded(product.id)
    setTimeout(() => setAdded(null), 2000)
  }

  return (
    <div className="pt-20 min-h-screen">
      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-red-950/60 via-veltrix-black to-veltrix-black border-b border-red-500/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 fill-current" /> Special Deals
              </span>
              <span className="text-xs text-veltrix-gray-400">CarryGoExpress Discounts</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
              Limited Time Deals
            </h1>
            <p className="text-veltrix-gray-400 mt-2 text-sm sm:text-base max-w-lg">
              Save big on premium electronics, 4K Smart TVs, and audio systems while stock lasts.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3 bg-veltrix-black-light border border-red-500/30 p-4 rounded-2xl shadow-xl">
            <Clock className="w-5 h-5 text-red-400 shrink-0" />
            <div className="text-center">
              <span className="text-[10px] text-veltrix-gray-400 uppercase tracking-widest block">Ends In</span>
              <div className="flex items-center gap-1 text-2xl font-mono font-bold text-white mt-0.5">
                <span className="bg-veltrix-black px-2 py-1 rounded border border-veltrix-gray-800">{h}</span>
                <span>:</span>
                <span className="bg-veltrix-black px-2 py-1 rounded border border-veltrix-gray-800">{m}</span>
                <span>:</span>
                <span className="bg-veltrix-black px-2 py-1 rounded border border-veltrix-gray-800">{s}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Flash Deals Spotlight */}
        {flashDeals.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-yellow-400 fill-current" />
              <h2 className="text-2xl font-bold text-white">Top Flash Deals</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {flashDeals.map(p => (
                <div key={p.id} className="group relative bg-veltrix-black-light border border-red-500/20 hover:border-red-500/50 rounded-2xl overflow-hidden p-5 transition-all">
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-veltrix-black">
                    <LazyImage src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-2 left-2 px-2.5 py-1 bg-red-600 text-white font-black text-xs rounded-full">
                      -{p.discount}% OFF
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base truncate mb-1">{p.name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-extrabold text-white">{formatPrice(p.price)}</span>
                    <span className="text-sm text-veltrix-gray-500 line-through">{formatPrice(p.original_price)}</span>
                  </div>
                  <button
                    onClick={() => handleAdd(p)}
                    className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {added === p.id ? 'Added!' : 'Claim Deal'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center justify-between border-b border-veltrix-gray-800 pb-4">
          <div className="flex gap-2">
            {FILTERS.map(f => (
              <button
                key={f.min}
                onClick={() => setFilterMin(f.min)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  filterMin === f.min ? 'bg-veltrix-blue text-veltrix-black' : 'bg-veltrix-black-light text-veltrix-gray-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-sm text-veltrix-gray-500">{deals.length} deals available</span>
        </div>

        {/* All Deals Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-veltrix-black-light rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 p-8">
            <Package className="w-12 h-12 text-veltrix-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Active Deals Found</h3>
            <p className="text-sm text-veltrix-gray-400 mb-6">Check back regularly as new special discounts are updated daily.</p>
            <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-veltrix-blue text-veltrix-black font-semibold rounded-xl text-sm">
              <ArrowLeft className="w-4 h-4" /> Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deals.map(p => (
              <div key={p.id} className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4 flex flex-col justify-between group hover:border-veltrix-blue/30 transition-all">
                <Link to={`/product/${p.id}`} className="block">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-veltrix-black">
                    <LazyImage src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white font-bold text-xs rounded-full">
                      -{p.discount}%
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white line-clamp-2 mb-2 group-hover:text-veltrix-blue transition-colors">
                    {p.name}
                  </h4>
                </Link>
                <div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-lg font-bold text-white">{formatPrice(p.price)}</span>
                    <span className="text-xs text-veltrix-gray-500 line-through">{formatPrice(p.original_price)}</span>
                  </div>
                  <button
                    onClick={() => handleAdd(p)}
                    className="w-full py-2 bg-veltrix-blue/10 hover:bg-veltrix-blue text-veltrix-blue hover:text-veltrix-black border border-veltrix-blue/30 font-semibold rounded-xl text-xs transition-all"
                  >
                    {added === p.id ? 'Added!' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
