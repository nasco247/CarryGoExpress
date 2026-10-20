import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star, ShoppingCart, Heart, Share2, Truck, Shield,
  RotateCcw, ChevronRight, Minus, Plus, Check,
  Package, ArrowLeft, Zap
} from 'lucide-react'
import { useProduct } from '../hooks/useProducts'
import { useCartStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/ProductCard'
import LazyImage from '../components/LazyImage'
import InstallmentPlanView from '../components/InstallmentPlanView'

export default function ProductDetail() {
  const { id } = useParams()
  const { product, loading } = useProduct(id)
  const { addItem, openCart } = useCartStore()

  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [relatedProducts, setRelatedProducts] = useState([])

  // Fetch real related products from Supabase
  useEffect(() => {
    if (!product?.category) return
    const fetchRelated = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('category', product.category)
          .neq('id', product.id)
          .eq('status', 'active')
          .limit(4)
        setRelatedProducts(data || [])
      } catch (err) {
        console.error('[ProductDetail] Error fetching related products:', err)
      }
    }
    fetchRelated()
  }, [product?.category, product?.id])

  // Add to cart with animation
  const handleAddToCart = () => {
    if (!product) return
    console.log('[ProductDetail] Adding to cart:', product.name, '× qty', quantity)
    addItem({ ...product, quantity })
    setAddedToCart(true)
    openCart()
    setTimeout(() => setAddedToCart(false), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-veltrix-blue border-t-transparent rounded-full" />
          <p className="text-veltrix-gray-400 text-sm">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="w-16 h-16 bg-veltrix-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-veltrix-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
        <p className="text-veltrix-gray-400 max-w-md mb-6">
          The product you are looking for does not exist or may have been removed.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-veltrix-blue text-veltrix-black font-bold rounded-xl hover:shadow-glow transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Store
        </Link>
      </div>
    )
  }

  const discountPercent = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const images = product.image ? [product.image] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-veltrix-gray-500 mb-8 flex-wrap">
          <Link to="/" className="hover:text-veltrix-blue transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/products" className="hover:text-veltrix-blue transition-colors">
            All Products
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-4 h-4" />
              <Link to={`/products?category=${encodeURIComponent(product.category || '')}`} className="hover:text-veltrix-blue transition-colors">
                {product.category}
              </Link>
            </>
          )}
          {product.subcategory && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-veltrix-blue font-medium">{product.subcategory}</span>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-veltrix-gray-300 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* ── Image Gallery ── */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/50 overflow-hidden group">
              <LazyImage
                src={images[activeImage] || images[0]}
                alt={product.name}
                imgClassName="group-hover:scale-105 transition-transform duration-500"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-veltrix-blue text-veltrix-black text-xs font-bold rounded-full">
                  {product.badge}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-current" />
                  -{discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* ── Product Info ── */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-veltrix-blue uppercase tracking-wider mb-2">
                {product.brand || 'CarryGoExpress'} • {product.category}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating || 4.5) ? 'fill-current' : 'opacity-40'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-white">{product.rating || 4.5}</span>
                <span className="text-sm text-veltrix-gray-500">({product.reviews || 0} reviews)</span>
              </div>
              <span className="text-veltrix-gray-700">•</span>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${product.in_stock !== false ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${product.in_stock !== false ? 'bg-green-400' : 'bg-red-400'}`} />
                {product.in_stock !== false ? `In Stock (${product.stock ?? 10} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Price */}
            <div className="p-4 bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/50 flex items-baseline gap-4">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-xl text-veltrix-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg">
                    Save {formatPrice(product.original_price - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Short Description */}
            <p className="text-veltrix-gray-300 text-sm leading-relaxed">
              {product.description}
            </p>

            {/* Expandable Installment Plan Set View (Pay Complete & Ship Now vs Pay in Months up to a Year) */}
            <InstallmentPlanView 
              price={product.price * quantity} 
              defaultExpanded={false}
              showSelectButtons={false}
            />

            {/* Quantity + Actions */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-veltrix-gray-400">Quantity:</span>
                <div className="flex items-center bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-3 text-veltrix-gray-400 hover:text-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-bold text-white min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-3 text-veltrix-gray-400 hover:text-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.in_stock === false}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold transition-all duration-300 ${
                    product.in_stock === false
                      ? 'bg-veltrix-gray-800 text-veltrix-gray-600 cursor-not-allowed'
                      : addedToCart
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-veltrix-blue text-veltrix-black hover:shadow-glow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {product.in_stock === false ? 'Out of Stock' : 'Add to Cart'}
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-4 rounded-xl border transition-all ${
                    isWishlisted
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-veltrix-black-light border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      alert('Product link copied to clipboard!')
                    }
                  }}
                  className="p-4 rounded-xl border bg-veltrix-black-light border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-veltrix-gray-800">
              <div className="flex items-center gap-2 text-xs text-veltrix-gray-400">
                <Truck className="w-4 h-4 text-veltrix-blue shrink-0" />
                <span>Fast Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-veltrix-gray-400">
                <Shield className="w-4 h-4 text-veltrix-blue shrink-0" />
                <span>2-Year Warranty</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-veltrix-gray-400">
                <RotateCcw className="w-4 h-4 text-veltrix-blue shrink-0" />
                <span>7-Day Return Policy</span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Tabs (Description, Shipping, Reviews) ── */}
        <div className="mt-16 border-t border-veltrix-gray-800 pt-10">
          <div className="flex gap-8 border-b border-veltrix-gray-800 mb-8">
            {['description', 'warranty & shipping', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${
                  activeTab === tab ? 'text-veltrix-blue' : 'text-veltrix-gray-500 hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-veltrix-blue" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-3xl space-y-4 text-veltrix-gray-300 text-sm leading-relaxed">
              <p>{product.description}</p>
              <p>
                All CarryGoExpress electronics are 100% genuine and verified for optimal power efficiency, high performance, and long lifespan. Tested to meet rigorous international standards.
              </p>
            </div>
          )}

          {activeTab === 'warranty & shipping' && (
            <div className="max-w-3xl space-y-4 text-veltrix-gray-300 text-sm leading-relaxed">
              <h3 className="font-bold text-white">Delivery Policy</h3>
              <p>We deliver nationwide across the United States with expedited 1–2 day express delivery dispatched from our Austin, TX fulfillment center.</p>
              <h3 className="font-bold text-white">Official Warranty</h3>
              <p>Each unit comes with an official CarryGoExpress 24-month manufacturer warranty covering repair and part replacements.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center gap-4 p-4 bg-veltrix-black-light rounded-xl border border-veltrix-gray-800">
                <div className="text-4xl font-extrabold text-white">{product.rating || 4.8}</div>
                <div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-veltrix-gray-400 mt-1">Based on {product.reviews || 84} verified purchaser reviews</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-white mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
