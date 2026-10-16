import { Link } from 'react-router-dom'
import { Smartphone, Laptop, Watch, Headphones, Gamepad2, Zap, ArrowRight } from 'lucide-react'
import { GADGET_CATEGORIES } from '../lib/gadgetCategories'

const categoryIcons = {
  Smartphone,
  Laptop,
  Watch,
  Headphones,
  Gamepad2,
  Zap
}

const categoryImages = {
  'Smartphones & Tablets': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
  'Laptops & Computers': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
  'Smartwatches & Wearables': 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600',
  'Audio & Sound': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  'Gaming & Handhelds': 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600',
  'Accessories & Power': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'
}

export default function FeaturedCategories() {
  return (
    <section className="py-20 bg-veltrix-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-veltrix-blue uppercase tracking-widest px-3 py-1 bg-veltrix-blue/10 rounded-full border border-veltrix-blue/20">
            Premium Gadgets & Electronics
          </span>
          <h2 className="text-3xl lg:text-4xl font-black text-white mt-4 tracking-tight">
            Shop by Gadget Category
          </h2>
          <p className="mt-3 text-veltrix-gray-400 max-w-2xl mx-auto text-sm">
            Explore authentic flagship smartphones, high-performance laptops, wearables, audio and gaming hardware at CarryGoExpress.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GADGET_CATEGORIES.map((category) => {
            const Icon = categoryIcons[category.icon] || Smartphone
            const bgImage = categoryImages[category.name] || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'

            return (
              <div
                key={category.id}
                className="group relative overflow-hidden rounded-2xl border border-veltrix-gray-800/60 hover:border-veltrix-blue/50 transition-all duration-500 bg-veltrix-black-light flex flex-col justify-between"
              >
                {/* Background Image Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={bgImage}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30 group-hover:opacity-20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-veltrix-black via-veltrix-black/85 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 p-7 flex flex-col h-full min-h-[260px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-veltrix-blue/20 rounded-xl flex items-center justify-center border border-veltrix-blue/30 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-veltrix-blue" />
                    </div>
                    <span className="text-[11px] font-mono text-veltrix-gray-500">
                      {category.subcategories.length} lines
                    </span>
                  </div>

                  <Link
                    to={`/products?category=${encodeURIComponent(category.name)}`}
                    className="text-xl font-bold text-white hover:text-veltrix-blue transition-colors"
                  >
                    {category.name}
                  </Link>

                  {/* Subcategories tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3 mb-6">
                    {category.subcategories.slice(0, 4).map((sub) => (
                      <Link
                        key={sub}
                        to={`/products?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(sub)}`}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-veltrix-black/80 border border-veltrix-gray-800 text-veltrix-gray-300 hover:border-veltrix-blue/40 hover:text-white transition-all font-medium"
                      >
                        {sub}
                      </Link>
                    ))}
                    {category.subcategories.length > 4 && (
                      <span className="text-[10px] text-veltrix-gray-500 self-center">
                        +{category.subcategories.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-3 border-t border-veltrix-gray-800/60 flex items-center justify-between">
                    <Link
                      to={`/products?category=${encodeURIComponent(category.name)}`}
                      className="text-xs font-bold text-veltrix-blue flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      <span>Explore {category.shortName}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
