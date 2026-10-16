import { Building2, Users, Shield, Award, Truck, Zap } from 'lucide-react'

export default function AboutUs() {
  return (
    <div className="pt-20 min-h-screen bg-veltrix-black text-veltrix-gray-300">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200" 
          alt="About CarryGoExpress" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-veltrix-black via-veltrix-black/80 to-transparent" />
        <div className="absolute inset-0 flex items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">About CarryGo<span className="text-veltrix-blue">Express</span></h1>
            <p className="text-lg">Your premier destination for high-quality electronics, smart home entertainment, and swift nationwide delivery across Nigeria.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div className="bg-veltrix-black-light p-8 rounded-2xl border border-veltrix-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-veltrix-blue" /> Our Mission
            </h2>
            <p className="leading-relaxed">
              To empower homes and businesses by providing swift access to world-class, authentic electronics and cutting-edge display technology. We deliver an unmatched e-commerce experience with transparent pricing and rapid fulfillment.
            </p>
          </div>
          <div className="bg-veltrix-black-light p-8 rounded-2xl border border-veltrix-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-veltrix-blue" /> Our Vision
            </h2>
            <p className="leading-relaxed">
              To become the most dependable and tech-forward e-commerce platform in West Africa, known for speed, customer delight, and absolute product authenticity.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose CarryGoExpress?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Genuine Products', desc: '100% authentic manufacturer-certified electronics.' },
              { icon: Truck, title: 'Express Delivery', desc: 'Fast, trackable dispatch right to your doorstep.' },
              { icon: Zap, title: 'Best Value Deals', desc: 'Direct-from-manufacturer competitive pricing and discounts.' },
              { icon: Users, title: 'Real-time Support', desc: 'Dedicated customer care ready to assist your purchases.' },
            ].map((feature, i) => (
              <div key={i} className="text-center p-6 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 hover:border-veltrix-blue/30 transition-all">
                <div className="w-14 h-14 mx-auto bg-veltrix-blue/20 text-veltrix-blue rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="bg-veltrix-black-light rounded-3xl overflow-hidden border border-veltrix-gray-800 flex flex-col lg:flex-row">
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white mb-6">Our Journey</h2>
            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                Founded on the belief that acquiring modern electronics should be simple, transparent, and prompt, CarryGoExpress was built to eliminate the delays and uncertainty associated with traditional shopping.
              </p>
              <p>
                From premium 4K smart screens to high-fidelity audio engineering, every product in our catalog is vetted and stored in secure regional distribution hubs to guarantee rapid dispatch and intact arrival.
              </p>
            </div>
          </div>
          <div className="lg:w-1/2 min-h-[300px] relative">
             <img 
               src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800" 
               alt="CarryGoExpress Operations" 
               className="absolute inset-0 w-full h-full object-cover"
             />
          </div>
        </div>
      </div>
    </div>
  )
}
