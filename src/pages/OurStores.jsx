import { MapPin, Mail, Clock } from 'lucide-react'

const stores = [
  {
    id: 1,
    name: 'CarryGoExpress Flagship Hub',
    address: '123 Technology Drive, Victoria Island, Lagos',
    email: 'vi@carrygoexpress.com',
    hours: 'Mon-Sat: 9:00 AM - 8:00 PM\nSun: 10:00 AM - 6:00 PM',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600'
  },
  {
    id: 2,
    name: 'CarryGoExpress Ikeja Center',
    address: '45 Computer Village Way, Ikeja, Lagos',
    email: 'ikeja@carrygoexpress.com',
    hours: 'Mon-Sat: 8:00 AM - 7:00 PM\nSun: Closed',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600'
  },
  {
    id: 3,
    name: 'CarryGoExpress Abuja Experience Hub',
    address: 'Plot 789 Aminu Kano Crescent, Wuse II, Abuja',
    email: 'abuja@carrygoexpress.com',
    hours: 'Mon-Sat: 9:00 AM - 8:00 PM\nSun: 11:00 AM - 5:00 PM',
    image: 'https://images.unsplash.com/photo-1519567281799-9712e52e4b47?w=600'
  }
]

export default function OurStores() {
  return (
    <div className="pt-20 min-h-screen bg-veltrix-black text-veltrix-gray-300">
      {/* Hero */}
      <div className="py-16 text-center max-w-3xl mx-auto px-4">
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Our Store Locations</h1>
        <p className="text-lg">Experience genuine electronics and home entertainment in person. Visit any of our physical CarryGoExpress fulfillment hubs for hands-on demonstrations.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {stores.map(store => (
            <div key={store.id} className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-3xl overflow-hidden group hover:border-veltrix-blue/50 transition-all">
              <div className="h-48 overflow-hidden">
                <img 
                  src={store.image} 
                  alt={store.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-white mb-6 group-hover:text-veltrix-blue transition-colors">{store.name}</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-veltrix-blue shrink-0 mt-0.5" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-veltrix-blue shrink-0 mt-0.5" />
                    <span>{store.email}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-veltrix-blue shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line">{store.hours}</span>
                  </div>
                </div>
                <button className="mt-8 w-full py-3 bg-veltrix-gray-900 text-white font-semibold rounded-xl hover:bg-veltrix-blue hover:text-black transition-all">
                  Get Directions
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
