import { useState } from 'react'
import { Mail, MapPin, MessageSquare, Clock, CheckCircle, Send } from 'lucide-react'
import { useAdminStore } from '../hooks/useAdminStore'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email || !message) return

    try {
      useAdminStore.getState().addInboundEmail({
        senderName: name,
        senderEmail: email,
        subject: subject || 'Store Inquiry from ' + name,
        category: 'Support',
        body: message
      })
    } catch (err) {
      console.warn('[Contact] Inbound store notice:', err)
    }

    setSent(true)
    setName('')
    setEmail('')
    setSubject('')
    setMessage('')
  }

  return (
    <div className="pt-20 min-h-screen bg-veltrix-black text-veltrix-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Get in Touch</h1>
          <p className="text-lg">Have a question about a product, your order, or delivery status? CarryGoExpress support is here to help.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Contact Form */}
          <div className="bg-veltrix-black-light p-8 lg:p-10 rounded-3xl border border-veltrix-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>

            {sent && (
              <div className="mb-6 p-5 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-start gap-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Message Delivered to Support Team!</h4>
                  <p className="text-xs text-green-300 mt-0.5">
                    Your inquiry has been received at <strong>support@carrygoexpress.store</strong> and forwarded to our support queue. A specialist will reply shortly.
                  </p>
                </div>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-2 text-veltrix-gray-400">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-veltrix-gray-400">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-veltrix-gray-400">Subject (Optional)</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
                  placeholder="e.g. Question on iPhone 16 Pro delivery"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-veltrix-gray-400">Message *</label>
                <textarea 
                  required
                  rows="4"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-veltrix-black border border-veltrix-gray-700 rounded-xl text-white focus:outline-none focus:border-veltrix-blue transition-colors resize-none text-sm"
                  placeholder="How can CarryGoExpress assist you today?"
                ></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-veltrix-blue text-black font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Message to Support
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col justify-center space-y-10">
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-veltrix-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-veltrix-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Official Support Email</h3>
                    <a href="mailto:support@carrygoexpress.store" className="text-veltrix-blue hover:underline">
                      support@carrygoexpress.store
                    </a>
                    <p className="text-xs text-veltrix-gray-500 mt-1">We respond to all inquiries within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-veltrix-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-veltrix-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Operational Hours</h3>
                    <p className="text-veltrix-gray-400">Monday – Saturday: 8:00 AM – 7:00 PM</p>
                    <p className="text-xs text-veltrix-gray-500 mt-1">Dispatch & Express Courier Tracking 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-veltrix-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-veltrix-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Head Office & Central Fulfillment</h3>
                    <p className="text-veltrix-gray-400">CarryGoExpress Hub<br />123 Technology Drive, Victoria Island, Lagos<br />Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-veltrix-blue/20 to-transparent border border-veltrix-blue/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-veltrix-blue" />
                <h3 className="font-bold text-white">Live Digital Support</h3>
              </div>
              <p className="text-sm mb-4 text-veltrix-gray-400">Chat directly with our customer happiness representatives during business hours.</p>
              <button 
                onClick={() => {
                  window.location.href = 'mailto:support@carrygoexpress.store?subject=Live%20Chat%20Inquiry'
                }}
                className="px-5 py-2.5 bg-white text-black font-semibold rounded-lg text-sm hover:bg-veltrix-gray-200 transition-colors"
              >
                Send Direct Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
