import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Zap, ShoppingBag, Layers } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { GADGET_CATEGORIES } from '../lib/gadgetCategories'

// Fallback curated slides representing active gadget catalog categories
const FALLBACK_CATEGORY_SLIDES = [
  {
    id: 'cat-phones',
    title: 'Flagship Smartphones & Tablets',
    subtitle: 'Next-Gen Mobile Power',
    description: 'Explore brand-new iPhone 16 Pro, Samsung Galaxy S-Series, and high-performance iPads with certified manufacturer warranties.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200',
    cta: 'Shop Smartphones',
    link: '/products?category=Smartphones%20%26%20Tablets',
    tag: 'Trending Mobile',
    category: 'Smartphones & Tablets'
  },
  {
    id: 'cat-laptops',
    title: 'Pro Laptops & High-FPS Rigs',
    subtitle: 'Elite Computing Performance',
    description: 'Apple MacBooks, Intel & AMD gaming laptops, and lightweight ultrabooks engineered for speed, creativity, and endurance.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200',
    cta: 'Explore Laptops',
    link: '/products?category=Laptops%20%26%20Computers',
    tag: 'High Performance',
    category: 'Laptops & Computers'
  },
  {
    id: 'cat-audio',
    title: 'Studio Audio & Immersive Sound',
    subtitle: 'Acoustic Precision',
    description: 'Active noise-cancelling headphones, true wireless earbuds, and portable Bluetooth speakers with deep bass delivered fast.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
    cta: 'Shop Audio Gear',
    link: '/products?category=Audio%20%26%20Sound',
    tag: 'Lossless Audio',
    category: 'Audio & Sound'
  },
  {
    id: 'cat-gaming',
    title: 'Next-Gen Gaming Consoles',
    subtitle: 'Pure Entertainment',
    description: 'PlayStation 5, Xbox Series X, and Nintendo Switch consoles with original controllers and accessories in stock.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200',
    cta: 'Explore Gaming',
    link: '/products?category=Gaming%20%26%20Handhelds',
    tag: '4K Gaming',
    category: 'Gaming & Handhelds'
  }
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Fetch newest live products from Supabase / local catalog
  const { products: liveProducts } = useProducts({ limit: 8, sortBy: 'created_at', sortOrder: 'desc' })

  // Construct dynamic slides: combine latest live products with verified category banners
  const slides = useMemo(() => {
    const productSlides = (liveProducts || []).slice(0, 4).map((p) => ({
      id: `prod-${p.id}`,
      title: p.name,
      subtitle: `${p.brand || 'CarryGo'} • ${p.category || 'Gadgets'}`,
      description: p.description && p.description.length > 20
        ? (p.description.length > 175 ? p.description.slice(0, 175) + '...' : p.description)
        : 'Brand new flagship gadget with verified manufacturer warranty, express insured delivery, and easy installments.',
      image: p.image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200',
      cta: `Explore Product • $${(Number(p.price) || 0).toLocaleString()}`,
      link: `/product/${p.id}`,
      tag: p.badge || (p.subcategory || 'New Arrival'),
      price: p.price,
      original_price: p.original_price,
      isLiveProduct: true
    }))

    if (productSlides.length >= 3) {
      // Merge top products with 2 category highlight slides
      return [...productSlides, ...FALLBACK_CATEGORY_SLIDES.slice(0, 2)]
    }

    if (productSlides.length > 0) {
      return [...productSlides, ...FALLBACK_CATEGORY_SLIDES]
    }

    return FALLBACK_CATEGORY_SLIDES
  }, [liveProducts])

  // Safeguard current index if slides array length changes
  const activeIndex = slides.length > 0 ? current % slides.length : 0

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isAutoPlaying, slides.length])

  const next = () => setCurrent((prev) => (prev + 1) % slides.length)
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)

  // Touch handlers for swipe
  const minSwipeDistance = 50 

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    if (distance > minSwipeDistance) next()
    else if (distance < -minSwipeDistance) prev()
  }

  return (
    <div className="relative">
      <section 
        className="relative h-[620px] lg:h-[720px] overflow-hidden"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
      >
        {slides.map((slide, index) => {
          const isActive = index === activeIndex
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ${
                isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
              }`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={slide.image}
                  alt={slide.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200'
                  }}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-veltrix-black/70 via-veltrix-black/60 to-veltrix-black" />
                <div className="absolute inset-0 bg-veltrix-black/35 backdrop-blur-[1px]" />
              </div>

              {/* Slide Content (Centered) */}
              <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center pt-14 lg:pt-0 pb-20">
                <div className={`max-w-3xl mx-auto flex flex-col items-center text-center transition-all duration-1000 delay-200 ${
                  isActive ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}>
                  <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 lg:px-4 lg:py-2 bg-veltrix-blue/20 border border-veltrix-blue/35 rounded-full mb-3 lg:mb-5 backdrop-blur-md">
                    <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-veltrix-blue" />
                    <span className="text-xs lg:text-sm font-bold text-veltrix-blue">{slide.tag}</span>
                    {slide.isLiveProduct && (
                      <span className="ml-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-veltrix-blue text-veltrix-black font-extrabold">
                        Live In Store
                      </span>
                    )}
                  </div>

                  <h2 className="text-xs lg:text-sm font-bold text-veltrix-blue uppercase tracking-widest mb-2">
                    {slide.subtitle}
                  </h2>
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-3 lg:mb-4 leading-tight tracking-tight drop-shadow-md max-w-2xl">
                    {slide.title}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-veltrix-gray-300 mb-6 lg:mb-8 leading-relaxed max-w-xl mx-auto">
                    {slide.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                    <Link
                      to={slide.link}
                      className="inline-flex items-center gap-2 lg:gap-3 px-6 py-3.5 lg:px-8 lg:py-4 bg-veltrix-blue text-veltrix-black text-sm lg:text-base font-black rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
                    </Link>

                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-semibold rounded-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <ShoppingBag className="w-4 h-4 text-veltrix-blue" />
                      <span>View All Products</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full items-center justify-center text-white hover:bg-veltrix-blue hover:border-veltrix-blue hover:text-veltrix-black transition-all z-20 shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full items-center justify-center text-white hover:bg-veltrix-blue hover:border-veltrix-blue hover:text-veltrix-black transition-all z-20 shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Carousel Slide Indicator Dots */}
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`transition-all duration-300 rounded-full ${
                index === activeIndex
                  ? 'w-8 h-2.5 bg-veltrix-blue shadow-glow'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* ── Quick Categories Bar Attached Below Hero ────────────────────────── */}
      <div className="bg-veltrix-black border-y border-veltrix-gray-800/80 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-start lg:justify-center gap-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0 pr-2 border-r border-veltrix-gray-800 text-xs font-bold text-veltrix-gray-400 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-veltrix-blue" />
            <span className="hidden sm:inline">Categories:</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/products"
              className="px-3.5 py-1.5 rounded-lg bg-veltrix-blue/15 border border-veltrix-blue/30 text-veltrix-blue text-xs font-bold hover:bg-veltrix-blue hover:text-veltrix-black transition-all shrink-0 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              All Products
            </Link>

            {GADGET_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="px-3 py-1.5 rounded-lg bg-veltrix-black-light border border-veltrix-gray-800/80 text-veltrix-gray-300 hover:text-white hover:border-veltrix-blue/50 text-xs font-medium transition-all shrink-0 whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

