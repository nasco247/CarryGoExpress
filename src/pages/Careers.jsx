import { Briefcase, ArrowRight } from 'lucide-react'

const jobs = [
  { title: 'Store Manager', location: 'Austin Experience Center, TX', type: 'Full-time', department: 'Retail' },
  { title: 'Customer Support Specialist', location: 'Austin, TX (Hybrid)', type: 'Full-time', department: 'Support' },
  { title: 'Frontend Developer (React)', location: 'Remote (US)', type: 'Full-time', department: 'Engineering' },
  { title: 'Logistics Coordinator', location: 'Austin, TX Fulfillment Hub', type: 'Full-time', department: 'Operations' },
]

export default function Careers() {
  return (
    <div className="pt-20 min-h-screen bg-veltrix-black text-veltrix-gray-300">
      <div className="py-20 bg-veltrix-black-light border-b border-veltrix-gray-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Join the CarryGoExpress Team</h1>
          <p className="text-lg">We are always looking for passionate, innovative, and driven individuals to help us build the future of fast consumer electronics delivery nationwide.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl font-bold text-white mb-8">Open Positions</h2>
        
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <div key={i} className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-veltrix-blue transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-veltrix-gray-900 rounded-xl flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-veltrix-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-veltrix-blue transition-colors">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-veltrix-gray-500">
                    <span>{job.department}</span>
                    <span className="w-1 h-1 bg-veltrix-gray-700 rounded-full"></span>
                    <span>{job.location}</span>
                    <span className="w-1 h-1 bg-veltrix-gray-700 rounded-full"></span>
                    <span>{job.type}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-6 py-2 bg-veltrix-gray-900 text-white rounded-lg hover:bg-veltrix-blue hover:text-black font-semibold transition-all whitespace-nowrap">
                Apply <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-20">
            <p>No open positions at the moment. Check back later!</p>
          </div>
        )}
      </div>
    </div>
  )
}
