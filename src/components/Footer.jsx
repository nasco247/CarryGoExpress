import { Link } from 'react-router-dom'
import { MapPin, Mail, Facebook, Twitter, Instagram, Youtube, ArrowUp, Send, ShieldCheck } from 'lucide-react'

function TikTokIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    handle: '@carrygoexpresss',
    href: import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/carrygoexpresss?exln=cDN2ZGY0cHJveDBn',
    icon: Instagram,
    hover: 'hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10'
  },
  {
    name: 'TikTok',
    handle: '@carrygoexpress3',
    href: import.meta.env.VITE_TIKTOK_URL || 'https://www.tiktok.com/@carrygoexpress3',
    icon: TikTokIcon,
    hover: 'hover:text-[#00f2fe] hover:border-[#00f2fe]/40 hover:bg-[#00f2fe]/10'
  },
  {
    name: 'Facebook',
    handle: 'CarryGoExpress',
    href: '#',
    icon: Facebook,
    hover: 'hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10'
  },
  {
    name: 'Twitter',
    handle: '@carrygoexpress',
    href: '#',
    icon: Twitter,
    hover: 'hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10'
  },
  {
    name: 'Youtube',
    handle: 'CarryGoExpress TV',
    href: '#',
    icon: Youtube,
    hover: 'hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10'
  }
]

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-veltrix-black-light border-t border-veltrix-gray-800">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-veltrix-blue to-veltrix-blue-dark rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-veltrix-black font-extrabold text-2xl tracking-tighter">CG</span>
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">CarryGo<span className="text-veltrix-blue">Express</span></h3>
                <p className="text-[10px] text-veltrix-gray-400 tracking-widest uppercase">Fast & Reliable E-Commerce</p>
              </div>
            </div>
            <p className="text-sm text-veltrix-gray-400 leading-relaxed">
              Your premier destination for genuine consumer electronics, 4K Smart TVs, and audio entertainment. Backed by manufacturer warranty and express nationwide delivery.
            </p>
            <div>
              <p className="text-xs font-semibold text-veltrix-gray-400 uppercase tracking-wider mb-3">Connect With Us</p>
              <div className="flex flex-wrap gap-2.5">
                {SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`w-10 h-10 bg-veltrix-gray-900 border border-veltrix-gray-800 rounded-lg flex items-center justify-center text-veltrix-gray-400 transition-all ${item.hover}`}
                    aria-label={`${item.name} - ${item.handle}`}
                    title={`${item.name} (${item.handle})`}
                  >
                    <item.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { name: 'About Us', path: '/about-us' },
                { name: 'Our Stores', path: '/our-stores' },
                { name: 'Careers', path: '/careers' },
                { name: 'Blog', path: '/blog' },
                { name: 'Contact', path: '/contact' },
                { name: 'Deals & Discounts', path: '/deals' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-sm text-veltrix-gray-400 hover:text-veltrix-blue transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Categories</h4>
            <ul className="space-y-3">
              {[
                { name: 'Televisions', path: '/category/televisions' },
                { name: 'Audio Systems', path: '/category/audio' },
                { name: 'Projectors', path: '/category/projectors' },
                { name: 'Headphones', path: '/category/headphones' },
                { name: 'Monitors', path: '/category/monitors' },
                { name: 'Smart Home', path: '/category/smart-home' },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="text-sm text-veltrix-gray-400 hover:text-veltrix-blue transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details (Phone number removed) */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-6">Contact & Support</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-veltrix-blue shrink-0 mt-0.5" />
                <span className="text-sm text-veltrix-gray-400">
                  2349 Brentwood Drive, Austin, TX 78749
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-veltrix-blue shrink-0" />
                <a href="mailto:support@carrygoexpress.store" className="text-sm text-veltrix-gray-400 hover:text-veltrix-blue transition-colors">
                  support@carrygoexpress.store
                </a>
              </li>
              <li className="flex items-start gap-3 pt-2">
                <ShieldCheck className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <span className="text-xs text-veltrix-gray-400">
                  100% Secure Checkout powered by Supabase & Paystack
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-veltrix-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-veltrix-gray-500">
            © {new Date().getFullYear()} CarryGoExpress. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-veltrix-gray-500 hover:text-veltrix-blue transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-veltrix-gray-500 hover:text-veltrix-blue transition-colors">
              Terms of Service
            </Link>
            <Link to="/admin" className="text-sm text-veltrix-gray-500 hover:text-veltrix-blue transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-veltrix-blue text-veltrix-black rounded-full shadow-glow hover:shadow-glow-lg transition-all hover:-translate-y-1 flex items-center justify-center z-40"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
  )
}
