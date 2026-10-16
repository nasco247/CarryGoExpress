import { useState } from 'react'

export default function LazyImage({ src, alt, className, ...props }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const handleLoad = () => {
    setLoaded(true)
  }

  const handleError = () => {
    setError(true)
    setLoaded(true) // stop loading animation
  }

  return (
    <div className={`relative overflow-hidden bg-veltrix-gray-900 ${className}`} {...props}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-veltrix-blue border-t-transparent rounded-full animate-spin opacity-50" />
        </div>
      )}
      <img
        src={error ? 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&blur=20' : src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  )
}
