import { useState, useEffect, useRef } from 'react'
import { Package } from 'lucide-react'

const DEFAULT_GADGET_FALLBACK = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'

export default function LazyImage({ 
  src, 
  alt = 'Product image', 
  className = '', 
  imgClassName = '',
  priority = false,
  ...props 
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)
  const imgRef = useRef(null)

  // Compute active image source URL
  const imageSrc = !src || error ? DEFAULT_GADGET_FALLBACK : src

  // Reset states when the src prop itself changes
  useEffect(() => {
    setLoaded(false)
    setError(false)
    setFallbackFailed(false)
  }, [src])

  // Synchronously & asynchronously detect if image is already cached / complete
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete) {
      if (img.naturalWidth > 0) {
        setLoaded(true)
      } else if (img.src) {
        if (!error) {
          setError(true)
        } else {
          setFallbackFailed(true)
        }
        setLoaded(true)
      }
    }
  }, [imageSrc, error])

  // Safety timer: Never allow spinner to spin indefinitely (max 1.2s)
  useEffect(() => {
    if (loaded) return
    const timer = setTimeout(() => {
      setLoaded(true)
    }, 1200)
    return () => clearTimeout(timer)
  }, [imageSrc, loaded])

  const handleLoad = () => {
    setLoaded(true)
  }

  const handleError = () => {
    if (!error) {
      setError(true)
    } else {
      setFallbackFailed(true)
    }
    setLoaded(true)
  }

  return (
    <div 
      className={`relative w-full h-full overflow-hidden bg-veltrix-gray-900 flex items-center justify-center ${className}`} 
      {...props}
    >
      {/* Loading Spinner */}
      {!loaded && !fallbackFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-veltrix-gray-900/80 z-10 transition-opacity duration-300">
          <div className="w-8 h-8 border-2 border-veltrix-blue border-t-transparent rounded-full animate-spin opacity-80" />
        </div>
      )}

      {/* Fallback Icon if both original and fallback image URLs fail */}
      {fallbackFailed ? (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <Package className="w-12 h-12 text-veltrix-gray-600 mb-2" />
          <span className="text-[11px] text-veltrix-gray-500 font-medium">Image unavailable</span>
        </div>
      ) : (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={`w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${imgClassName}`}
        />
      )}
    </div>
  )
}
