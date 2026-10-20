import { useState, useEffect } from 'react'

const DEFAULT_GADGET_FALLBACK = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'

export default function LazyImage({ 
  src, 
  alt = 'Product image', 
  className = '', 
  imgClassName = '',
  ...props 
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Reset loaded/error when src changes
  useEffect(() => {
    setLoaded(false)
    setError(false)
  }, [src])

  const handleLoad = () => {
    setLoaded(true)
  }

  const handleError = () => {
    setError(true)
    setLoaded(true)
  }

  const imageSrc = !src || error ? DEFAULT_GADGET_FALLBACK : src

  return (
    <div 
      className={`relative w-full h-full overflow-hidden bg-veltrix-gray-900 flex items-center justify-center ${className}`} 
      {...props}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-veltrix-gray-900/80 z-10">
          <div className="w-8 h-8 border-2 border-veltrix-blue border-t-transparent rounded-full animate-spin opacity-70" />
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-500 ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${imgClassName}`}
      />
    </div>
  )
}

