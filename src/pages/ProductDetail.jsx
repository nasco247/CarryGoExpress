import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star, ShoppingCart, Heart, Share2, Truck, Shield,
  RotateCcw, ChevronRight, Minus, Plus, Check,
  Package, ArrowLeft, Zap, FileText, ChevronDown
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
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])

  // Ensure scroll is immediately at the top on product navigation / change
  useEffect(() => {
    const html = document.documentElement
    const originalScrollBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const raf = requestAnimationFrame(() => {
      html.style.scrollBehavior = originalScrollBehavior
    })

    setActiveImage(0)
    setQuantity(1)
    setIsDescExpanded(false)

    return () => cancelAnimationFrame(raf)
  }, [id])

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

  // Pre-calculate images unconditionally to comply with React Rules of Hooks
  const images = useMemo(() => {
    if (!product) return []
    let list = []
    if (Array.isArray(product.images) && product.images.length > 0) {
      list = product.images
    } else if (typeof product.image === 'string' && product.image.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(product.image)
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed
      } catch { }
    } else if (product.image) {
      list = [product.image]
    }
    list = list.filter(img => typeof img === 'string' && img.trim().length > 0)
    return list.length > 0 ? list : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800']
  }, [product?.image, product?.images])

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

  return (
    <div className="pt-20 lg:pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-veltrix-gray-500 mb-5 lg:mb-6 flex-wrap">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">

          {/* ── Image Gallery (Left Column - Moderated & Sticky on Desktop) ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3.5">
            {/* Main image */}
            <div className="relative aspect-square max-w-[400px] xl:max-w-[440px] max-h-[400px] xl:max-h-[440px] mx-auto w-full bg-gradient-to-b from-veltrix-black-light to-veltrix-black rounded-2xl border border-veltrix-gray-800/80 overflow-hidden group shadow-2xl flex items-center justify-center">
              <LazyImage
                src={images[activeImage] || images[0]}
                alt={product.name}
                priority={true}
                className="w-full h-full flex items-center justify-center"
                imgClassName="object-contain p-3 sm:p-5 group-hover:scale-105 transition-transform duration-500"
              />
              {product.badge && (
                <span className="absolute top-3.5 left-3.5 px-3 py-1 bg-veltrix-blue text-veltrix-black text-xs font-bold rounded-full z-10 shadow-glow">
                  {product.badge}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="absolute top-3.5 right-3.5 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1 z-10 shadow-lg">
                  <Zap className="w-3 h-3 fill-current" />
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Gallery Thumbnails if multiple images exist */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 overflow-x-auto py-1 max-w-[400px] xl:max-w-[440px] mx-auto no-scrollbar">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-veltrix-black-light p-1 ${activeImage === idx
                        ? 'border-veltrix-blue shadow-glow scale-105'
                        : 'border-veltrix-gray-800/80 hover:border-veltrix-gray-600 opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={imgUrl} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info (Right Column) ── */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-4.5">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-bold text-veltrix-blue uppercase tracking-wider">
                  {product.brand || 'CarryGoExpress'}
                </span>
                <span className="text-veltrix-gray-600">•</span>
                <span className="text-xs text-veltrix-gray-400 font-medium">
                  {product.category}
                </span>
                {product.subcategory && (
                  <>
                    <span className="text-veltrix-gray-600">•</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-veltrix-blue/10 text-veltrix-blue font-semibold border border-veltrix-blue/20">
                      {product.subcategory}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating & Stock */}
            <div className="flex items-center gap-3.5 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-veltrix-black-light px-2.5 py-1 rounded-lg border border-veltrix-gray-800/60">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.floor(product.rating || 4.5) ? 'fill-current' : 'opacity-30'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-white ml-0.5">{product.rating || 4.5}</span>
                <span className="text-veltrix-gray-400">({product.reviews || 0})</span>
              </div>

              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${product.in_stock !== false
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${product.in_stock !== false ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {product.in_stock !== false ? `In Stock (${product.stock ?? 10} available)` : 'Out of Stock'}
              </span>

              {product.sku && (
                <span className="text-[11px] text-veltrix-gray-500 font-mono hidden sm:inline">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="py-3 px-4 sm:py-3.5 sm:px-5 bg-gradient-to-r from-veltrix-black-light via-veltrix-black-light/90 to-veltrix-black rounded-xl border border-veltrix-gray-800/80 flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                {formatPrice(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <>
                  <span className="text-base sm:text-lg text-veltrix-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                  <span className="px-2 py-0.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold rounded-md">
                    Save {formatPrice(product.original_price - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* ── Sleek Expandable Product Description Card ── */}
            <div className="bg-veltrix-black-light/70 rounded-xl border border-veltrix-gray-800/80 p-3.5 sm:p-4 relative transition-all duration-300 hover:border-veltrix-gray-700/80 group/desc">
              {/* Header Description */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-veltrix-gray-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-veltrix-blue/15 border border-veltrix-blue/30 flex items-center justify-center text-veltrix-blue shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Product Overview
                    </h3>
                  </div>
                </div>

                {((product.description || '').length > 170 || (product.description || '').includes('\n')) && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-veltrix-gray-800 text-veltrix-blue font-semibold border border-veltrix-blue/20">
                    {isDescExpanded ? 'Full Details' : 'Preview'}
                  </span>
                )}
              </div>

              {/* Description Content with Expandable Reveal */}
              <div className={`relative transition-all duration-300 ${((product.description || '').length > 170 || (product.description || '').includes('\n')) && !isDescExpanded
                  ? 'max-h-16 overflow-hidden'
                  : 'max-h-none'
                }`}>
                <p className="text-veltrix-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {product.description || 'Brand new flagship gadget with verified manufacturer warranty, express insured delivery, and easy installments.'}
                </p>

                {/* Bottom Fade Gradient when collapsed */}
                {((product.description || '').length > 170 || (product.description || '').includes('\n')) && !isDescExpanded && (
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-veltrix-black-light via-veltrix-black-light/80 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Show More / Show Less Toggle Button */}
              {((product.description || '').length > 170 || (product.description || '').includes('\n')) && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-2 pt-1.5 w-full flex items-center justify-center gap-1 text-[11px] font-bold text-veltrix-blue hover:text-white transition-colors border-t border-veltrix-gray-800/40 group/btn"
                >
                  <span>{isDescExpanded ? 'Show Less' : 'Show Full Description'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isDescExpanded ? 'rotate-180 text-white' : 'group-hover/btn:translate-y-0.5'}`} />
                </button>
              )}
            </div>

            {/* Expandable Installment Plan Set View (Pay Complete & Ship Now vs Pay in Months up to a Year) */}
            <InstallmentPlanView
              price={product.price * quantity}
              defaultExpanded={false}
              showSelectButtons={false}
            />

            {/* Quantity + Actions */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-veltrix-gray-400">Quantity:</span>
                <div className="flex items-center bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2.5 text-veltrix-gray-400 hover:text-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 font-bold text-white min-w-[2.5rem] text-center text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-2.5 text-veltrix-gray-400 hover:text-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 sm:gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.in_stock === false}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-5 sm:py-3.5 sm:px-6 rounded-xl text-sm font-bold transition-all duration-300 ${product.in_stock === false
                      ? 'bg-veltrix-gray-800 text-veltrix-gray-600 cursor-not-allowed'
                      : addedToCart
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-veltrix-blue text-veltrix-black hover:shadow-glow-lg hover:-translate-y-0.5'
                    }`}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-4 h-4" />
                      Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      {product.in_stock === false ? 'Out of Stock' : 'Add to Cart'}
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-all ${isWishlisted
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : 'bg-veltrix-black-light border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white'
                    }`}
                  aria-label="Wishlist"
                  title="Save to Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
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
                  className="p-3 sm:p-3.5 rounded-xl border bg-veltrix-black-light border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white transition-colors"
                  aria-label="Share"
                  title="Share product link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-veltrix-gray-800/80">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-veltrix-black-light/40 border border-veltrix-gray-800/40 text-[11px] text-veltrix-gray-400">
                <Truck className="w-3.5 h-3.5 text-veltrix-blue shrink-0" />
                <span className="truncate">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-veltrix-black-light/40 border border-veltrix-gray-800/40 text-[11px] text-veltrix-gray-400">
                <Shield className="w-3.5 h-3.5 text-veltrix-blue shrink-0" />
                <span className="truncate">2-Yr Warranty</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-veltrix-black-light/40 border border-veltrix-gray-800/40 text-[11px] text-veltrix-gray-400">
                <RotateCcw className="w-3.5 h-3.5 text-veltrix-blue shrink-0" />
                <span className="truncate">7-Day Return</span>
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
                className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === tab ? 'text-veltrix-blue' : 'text-veltrix-gray-500 hover:text-white'
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
            <div className="max-w-4xl space-y-6">
              <div className="p-6 bg-veltrix-black-light/90 rounded-2xl border border-veltrix-gray-800/80 space-y-4">
                <div className="flex items-center gap-2.5 text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-veltrix-gray-800">
                  <FileText className="w-4 h-4 text-veltrix-blue" />
                  <span>Comprehensive Gadget Specifications & Description</span>
                </div>
                <div className="text-veltrix-gray-300 text-sm leading-relaxed whitespace-pre-line space-y-3">
                  <p>{product.description || 'Full technical specifications and details for this gadget.'}</p>
                  <p className="text-xs text-veltrix-gray-400 pt-2 border-t border-veltrix-gray-800/40">
                    All CarryGoExpress electronics are 100% genuine and verified for optimal power efficiency, high performance, and long lifespan. Tested to meet rigorous international standards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-veltrix-black-light/60 rounded-xl border border-veltrix-gray-800/60">
                  <h4 className="text-xs font-bold text-veltrix-blue uppercase mb-1">Authenticity</h4>
                  <p className="text-xs text-veltrix-gray-400">100% Genuine, sealed retail package with factory warranty.</p>
                </div>
                <div className="p-4 bg-veltrix-black-light/60 rounded-xl border border-veltrix-gray-800/60">
                  <h4 className="text-xs font-bold text-veltrix-blue uppercase mb-1">Official Warranty</h4>
                  <p className="text-xs text-veltrix-gray-400">24 months official coverage against manufacturer defects.</p>
                </div>
                <div className="p-4 bg-veltrix-black-light/60 rounded-xl border border-veltrix-gray-800/60">
                  <h4 className="text-xs font-bold text-veltrix-blue uppercase mb-1">Express Dispatch</h4>
                  <p className="text-xs text-veltrix-gray-400">Fully insured trackable shipping across all 50 states.</p>
                </div>
              </div>
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
