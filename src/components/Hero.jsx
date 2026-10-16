import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from 'lucide-react'

const slides = [
  {
    id: 1,
    title: 'CarryGo Ultra HD',
    subtitle: 'Cinema At Your Fingertips',
    description: 'Discover breathtaking picture quality with next-generation display technology. Over a billion vibrant colors, Dolby Vision HDR, and immersive sound delivered to your door.',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1200',
    cta: 'Shop Displays',
    link: '/category/televisions',
    tag: 'Trending Now'
  },
  {
    id: 2,
    title: 'Flagship Electronics',
    subtitle: 'CarryGoExpress Speed',
    description: 'Premium smartphones, audio gear, and smart appliances delivered in record time with certified manufacturer warranties.',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1200',
    cta: 'Explore Catalog',
    link: '/category/smartphones',
    tag: 'Express Delivery'
  },
  {
    id: 3,
    title: 'Smart Home Living',
    subtitle: 'Intelligent Living Solutions',
    description: 'Elevate your living space with intelligent soundbars, smart inverter air conditioners, and luxury kitchen tech.',
    image: 'https://images.unsplash.com/photo-1601944179066-29b8f7e13a56?w=1200',
    cta: 'View Collection',
    link: '/category/audio',
    tag: 'Smart Home'
  }
]

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isAutoPlaying])

  const next = () => setCurrent((prev) => (prev + 1) % slides.length)
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)

  // Touch handlers for swipe
  const minSwipeDistance = 50 

  const onTouchStart = (e) => {
    setTouchEnd(null) // Reset touch end
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      next()
    } else if (isRightSwipe) {
      prev()
    }
  }

  return (
    <section 
      className="relative h-[600px] lg:h-[700px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndHandler}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ${
            index === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-veltrix-black via-veltrix-black/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-veltrix-black via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center pt-16 lg:pt-0">
            <div className={`max-w-xl transition-all duration-1000 delay-300 ${
              index === current ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 bg-veltrix-blue/20 border border-veltrix-blue/30 rounded-full mb-4 lg:mb-6">
                <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-veltrix-blue" />
                <span className="text-xs lg:text-sm font-medium text-veltrix-blue">{slide.tag}</span>
              </div>

              <h2 className="text-xs lg:text-sm font-semibold text-veltrix-blue uppercase tracking-widest mb-2">
                {slide.subtitle}
              </h2>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-3 lg:mb-4 leading-tight">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-veltrix-gray-300 mb-6 lg:mb-8 leading-relaxed max-w-sm sm:max-w-md lg:max-w-none">
                {slide.description}
              </p>
              <Link
                to={slide.link}
                className="inline-flex items-center gap-2 lg:gap-3 px-6 py-3 lg:px-8 lg:py-4 bg-veltrix-blue text-veltrix-black text-sm lg:text-base font-bold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {slide.cta}
                <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full items-center justify-center text-white hover:bg-veltrix-blue hover:border-veltrix-blue hover:text-veltrix-black transition-all z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={next}
        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full items-center justify-center text-white hover:bg-veltrix-blue hover:border-veltrix-blue hover:text-veltrix-black transition-all z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 rounded-full ${
              index === current
                ? 'w-8 h-2 bg-veltrix-blue'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
