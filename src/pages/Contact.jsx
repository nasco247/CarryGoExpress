import { useState } from 'react'
import { Mail, MapPin, MessageSquare, Clock, CheckCircle, Send, Instagram, ExternalLink } from 'lucide-react'
import { useAdminStore } from '../hooks/useAdminStore'

function TikTokIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  )
}

function TelegramIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  )
}

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
                  placeholder="e.g. John Smith"
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
                  placeholder="e.g. johnsmith@example.com"
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
          <div className="flex flex-col justify-center space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
              <div className="space-y-5">
                {/* Official Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-veltrix-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-veltrix-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-0.5">Official Support Email</h3>
                    <a href="mailto:support@carrygoexpress.store" className="text-veltrix-blue hover:underline">
                      support@carrygoexpress.store
                    </a>
                    <p className="text-xs text-veltrix-gray-500 mt-1">We respond to all inquiries within 24 hours</p>
                  </div>
                </div>

                {/* Telegram Official Link */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#229ED9]/10 rounded-xl flex items-center justify-center shrink-0">
                    <TelegramIcon className="w-6 h-6 text-[#229ED9]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-0.5">Telegram Support Channel</h3>
                    <a 
                      href="https://t.me/Carrygoexpress" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#229ED9] hover:underline font-semibold flex items-center gap-1.5"
                    >
                      <span>t.me/Carrygoexpress</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <p className="text-xs text-veltrix-gray-500 mt-1">24/7 direct live agent chat & instant delivery updates</p>
                  </div>
                </div>

                {/* Operational Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-veltrix-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-veltrix-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-0.5">Operational Hours</h3>
                    <p className="text-veltrix-gray-400 text-sm">Monday – Saturday: 8:00 AM – 7:00 PM</p>
                    <p className="text-xs text-veltrix-gray-500 mt-0.5">Dispatch & Express Courier Tracking 24/7</p>
                  </div>
                </div>

                {/* Head Office */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-veltrix-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-veltrix-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-0.5">Head Office & Central Fulfillment</h3>
                    <p className="text-veltrix-gray-400 text-sm">CarryGoExpress Hub & Headquarters<br />2349 Brentwood Drive<br />Austin, TX 78749</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media & Channels */}
            <div className="p-6 bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl">
              <h3 className="font-bold text-white mb-2">Connect Across Channels</h3>
              <p className="text-xs text-veltrix-gray-400 mb-4">
                Reach out on Telegram for instant response, or follow our updates on Instagram and TikTok.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="https://t.me/Carrygoexpress"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-veltrix-black border border-veltrix-gray-800 hover:border-[#229ED9]/50 rounded-xl group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TelegramIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-[#229ED9] transition-colors">Telegram</p>
                      <p className="text-[11px] text-veltrix-gray-400">t.me/Carrygoexpress</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-veltrix-gray-500 group-hover:text-[#229ED9] transition-colors" />
                </a>

                <a
                  href="https://www.instagram.com/carrygoexpresss?exln=cDN2ZGY0cHJveDBn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-veltrix-black border border-veltrix-gray-800 hover:border-pink-500/50 rounded-xl group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-pink-400 transition-colors">Instagram</p>
                      <p className="text-[11px] text-veltrix-gray-400">@carrygoexpresss</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-veltrix-gray-500 group-hover:text-pink-400 transition-colors" />
                </a>

                <a
                  href="https://www.tiktok.com/@carrygoexpress3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 bg-veltrix-black border border-veltrix-gray-800 hover:border-[#00f2fe]/50 rounded-xl group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#00f2fe]/10 text-[#00f2fe] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TikTokIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-[#00f2fe] transition-colors">TikTok</p>
                      <p className="text-[11px] text-veltrix-gray-400">@carrygoexpress3</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-veltrix-gray-500 group-hover:text-[#00f2fe] transition-colors" />
                </a>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-veltrix-blue/20 to-transparent border border-veltrix-blue/30 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-veltrix-blue" />
                <h3 className="font-bold text-white">Live Digital Support</h3>
              </div>
              <p className="text-sm mb-4 text-veltrix-gray-400">Chat directly with our customer happiness representatives on Telegram or via email.</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://t.me/Carrygoexpress"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-[#229ED9] text-white font-bold rounded-lg text-sm hover:bg-[#1b8bc2] transition-colors inline-flex items-center gap-2"
                >
                  <TelegramIcon className="w-4 h-4" />
                  Chat on Telegram (t.me/Carrygoexpress)
                </a>
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
    </div>
  )
}
