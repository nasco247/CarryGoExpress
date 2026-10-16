import Hero from '../components/Hero'
import FeaturedCategories from '../components/FeaturedCategories'
import ProductGrid from '../components/ProductGrid'

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturedCategories />

      {/* Featured Products Section */}
      <section className="py-20 bg-veltrix-black-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-veltrix-blue uppercase tracking-widest">
              Best Sellers
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mt-3">
              Featured Electronics
            </h2>
            <p className="mt-4 text-veltrix-gray-400 max-w-2xl mx-auto">
              Discover our most popular electronics, handpicked for quality and performance
            </p>
          </div>
          <ProductGrid filters={{ limit: 8 }} hideSidebar hideHeader />
        </div>
      </section>

      {/* Features Banner */}
      <section className="py-16 bg-veltrix-black border-y border-veltrix-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Free Delivery', desc: 'On orders above ₦100,000', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
              { title: 'Secure Payment', desc: '100% secure checkout', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { title: '2 Year Warranty', desc: 'On all CarryGoExpress products', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              { title: '24/7 Support', desc: 'Dedicated customer service', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4 p-6 bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/50 hover:border-veltrix-blue/30 transition-all">
                <div className="w-12 h-12 bg-veltrix-blue/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-veltrix-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-veltrix-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-gradient-to-br from-veltrix-blue/10 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-veltrix-gray-400 mb-8">
            Subscribe to our newsletter for exclusive deals, new arrivals, and tech tips
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 focus:border-veltrix-blue focus:outline-none focus:ring-1 focus:ring-veltrix-blue/50"
            />
            <button type="submit" className="px-8 py-4 bg-veltrix-blue text-veltrix-black font-bold rounded-xl hover:shadow-glow transition-all">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
