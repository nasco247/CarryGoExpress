import { Link } from 'react-router-dom'
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react'
import { useCartStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'
import LazyImage from './LazyImage'

export default function ProductCard({ product }) {
  const { addItem } = useCartStore()
  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
    : 0

  return (
    <div className="group relative bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/50 overflow-hidden hover:border-veltrix-blue/30 transition-all duration-500 card-hover">
      {/* Badge */}
      {product.badge && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-veltrix-blue text-veltrix-black text-xs font-bold rounded-full">
          {product.badge}
        </div>
      )}

      {discount > 0 && (
        <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full">
          -{discount}%
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-veltrix-gray-900">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="group-hover:scale-110"
        />

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault()
              addItem(product)
            }}
            className="w-12 h-12 bg-white text-veltrix-black rounded-full flex items-center justify-center hover:bg-veltrix-blue transition-colors transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
          <Link
            to={`/product/${product.id}`}
            className="w-12 h-12 bg-white text-veltrix-black rounded-full flex items-center justify-center hover:bg-veltrix-blue transition-colors transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <button className="w-12 h-12 bg-white text-veltrix-black rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150">
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-veltrix-blue uppercase tracking-wider">
            {product.brand}
          </span>
          <span className="text-veltrix-gray-600">•</span>
          <span className="text-xs text-veltrix-gray-500">
            {product.category}
          </span>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-white hover:text-veltrix-blue transition-colors line-clamp-2 mb-3">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-veltrix-gray-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-veltrix-gray-500">
            ({product.reviews} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-veltrix-blue">
            {formatPrice(product.price)}
          </span>
          {product.original_price && (
            <span className="text-sm text-veltrix-gray-500 line-through">
              {formatPrice(product.original_price)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-3">
          {product.in_stock ? (
            <span className="text-xs text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
              In Stock
            </span>
          ) : (
            <span className="text-xs text-red-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              Out of Stock
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
