import { Link } from 'react-router-dom'
import { Tv, Speaker, Projector, Headphones, Monitor, Smartphone } from 'lucide-react'

const categories = [
  {
    name: 'Televisions',
    icon: Tv,
    count: '45 Products',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400',
    description: '4K, QLED, ULED Smart TVs'
  },
  {
    name: 'Audio',
    icon: Speaker,
    count: '32 Products',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400',
    description: 'Soundbars, Speakers, Systems'
  },
  {
    name: 'Projectors',
    icon: Projector,
    count: '12 Products',
    image: 'https://images.unsplash.com/photo-1517604931442-7105376f2611?w=400',
    description: 'Laser & Portable Projectors'
  },
  {
    name: 'Headphones',
    icon: Headphones,
    count: '28 Products',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    description: 'Wireless & Noise Cancelling'
  },
  {
    name: 'Monitors',
    icon: Monitor,
    count: '18 Products',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    description: 'Gaming & Professional'
  },
  {
    name: 'Smart Home',
    icon: Smartphone,
    count: '24 Products',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400',
    description: 'Smart Devices & Appliances'
  }
]

export default function FeaturedCategories() {
  return (
    <section className="py-20 bg-veltrix-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-veltrix-blue uppercase tracking-widest">
            Browse Collection
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3">
            Shop by Category
          </h2>
          <p className="mt-4 text-veltrix-gray-400 max-w-2xl mx-auto">
            Explore our wide range of Hisense products organized by category for easy browsing
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.name}
                to={`/category/${category.name.toLowerCase()}`}
                className="group relative overflow-hidden rounded-2xl border border-veltrix-gray-800/50 hover:border-veltrix-blue/30 transition-all duration-500"
              >
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-veltrix-black via-veltrix-black/80 to-transparent" />
                </div>

                <div className="relative p-8 flex flex-col h-full min-h-[240px]">
                  <div className="w-14 h-14 bg-veltrix-blue/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-veltrix-blue/30 transition-colors">
                    <Icon className="w-7 h-7 text-veltrix-blue" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-veltrix-blue transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-veltrix-gray-400 mb-4">
                    {category.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm font-medium text-veltrix-blue">
                      {category.count}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-veltrix-gray-800 flex items-center justify-center group-hover:bg-veltrix-blue group-hover:text-veltrix-black transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
