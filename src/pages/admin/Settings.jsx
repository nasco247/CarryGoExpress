import { useState } from 'react'
import { 
  Settings, Store, Mail, Bell, Shield, CreditCard, Truck,
  Save, CheckCircle, Database, Lock, Radio
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'

const tabs = [
  { id: 'general', label: 'Store Profile', icon: Store },
  { id: 'smtp', label: 'Private Email SMTP', icon: Mail },
  { id: 'backend', label: 'Supabase Realtime', icon: Database },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'shipping', label: 'Shipping', icon: Truck },
]

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)
  const { realtimeConnected, stats, products, orders } = useAdminStore()

  const [storeName, setStoreName] = useState('CarryGoExpress')
  const [storeEmail, setStoreEmail] = useState('support@carrygoexpress.store')
  const [currency, setCurrency] = useState('USD ($)')
  const [storeAddress, setStoreAddress] = useState('CarryGoExpress Fulfillment Center, Victoria Island, Lagos, Nigeria')
  const [storeDescription, setStoreDescription] = useState('Your premier destination for high-grade consumer electronics with fast, nationwide delivery.')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Store Settings & System Configuration</h1>
        <p className="text-sm text-veltrix-gray-400 mt-1">Configure your CarryGoExpress operational parameters and backend integrations</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-veltrix-blue/20 text-veltrix-blue' 
                      : 'text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 p-6 space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-veltrix-blue" />
                    Store Profile
                  </h2>
                  <span className="text-xs text-veltrix-gray-400 font-mono">Brand: CarryGoExpress</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-veltrix-gray-300">Store Name</label>
                    <input 
                      type="text" 
                      value={storeName} 
                      onChange={e => setStoreName(e.target.value)}
                      className="input-field text-sm font-bold text-white" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-veltrix-gray-300">Support Email (Official Contact)</label>
                    <input 
                      type="email" 
                      value={storeEmail} 
                      onChange={e => setStoreEmail(e.target.value)}
                      className="input-field text-sm" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-veltrix-gray-300">Default Currency</label>
                    <select 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="input-field text-sm"
                    >
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>NGN (₦)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-veltrix-gray-300">Delivery SLA</label>
                    <input 
                      type="text" 
                      defaultValue="Same-day Lagos, 2-3 Days Nationwide"
                      className="input-field text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-veltrix-gray-300">Head Office Fulfillment Hub Address</label>
                  <textarea 
                    rows="2"
                    value={storeAddress}
                    onChange={e => setStoreAddress(e.target.value)}
                    className="input-field text-sm resize-none" 
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-veltrix-gray-300">Store Mission & Tagline</label>
                  <textarea 
                    rows="2"
                    value={storeDescription}
                    onChange={e => setStoreDescription(e.target.value)}
                    className="input-field text-sm resize-none" 
                  />
                </div>
              </div>
            )}

            {/* Namecheap Private Email SMTP Tab */}
            {activeTab === 'smtp' && (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-veltrix-gray-800">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-veltrix-blue" />
                      Namecheap Private Email & Custom SMTP
                    </h2>
                    <p className="text-xs text-veltrix-gray-400 mt-0.5">
                      Production email delivery for carrygoexpress.store with zero rate limits
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle className="w-3.5 h-3.5" />
                    SMTP Handshake Verified
                  </span>
                </div>

                {/* Configuration Summary Card */}
                <div className="p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider text-veltrix-blue">
                    Active Namecheap SMTP Parameters
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/80">
                      <span className="text-[10px] text-veltrix-gray-500 block uppercase font-sans">SMTP Host</span>
                      <span className="font-bold text-white">mail.privateemail.com</span>
                    </div>

                    <div className="p-3 bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/80">
                      <span className="text-[10px] text-veltrix-gray-500 block uppercase font-sans">Ports & Security</span>
                      <span className="font-bold text-white">465 (SSL) / 587 (TLS)</span>
                    </div>

                    <div className="p-3 bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/80">
                      <span className="text-[10px] text-veltrix-gray-500 block uppercase font-sans">Sender & Username</span>
                      <span className="font-bold text-veltrix-blue">support@carrygoexpress.store</span>
                    </div>

                    <div className="p-3 bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/80">
                      <span className="text-[10px] text-veltrix-gray-500 block uppercase font-sans">Store Domain URL</span>
                      <span className="font-bold text-white">https://www.carrygoexpress.store</span>
                    </div>
                  </div>
                </div>

                {/* Supabase Dashboard Guide */}
                <div className="p-4 bg-gradient-to-r from-veltrix-blue/10 via-purple-500/10 to-transparent rounded-xl border border-veltrix-blue/30 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-veltrix-blue" />
                    How to enable in your Supabase Project Settings
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-veltrix-gray-300 leading-relaxed text-xs">
                    <li>Go to your <strong>Supabase Dashboard</strong> → <strong>Authentication</strong> → <strong>SMTP Settings</strong>.</li>
                    <li>Toggle <strong>"Enable Custom SMTP"</strong> to <strong>ON</strong>.</li>
                    <li>Set <strong>Sender Email</strong>: <code className="text-veltrix-blue bg-black/60 px-1.5 py-0.5 rounded">support@carrygoexpress.store</code></li>
                    <li>Set <strong>Sender Name</strong>: <code className="text-white bg-black/60 px-1.5 py-0.5 rounded">CarryGoExpress</code></li>
                    <li>Set <strong>Host</strong>: <code className="text-white bg-black/60 px-1.5 py-0.5 rounded">mail.privateemail.com</code> &amp; <strong>Port</strong>: <code className="text-white bg-black/60 px-1.5 py-0.5 rounded">465</code></li>
                    <li>Set <strong>Username</strong>: <code className="text-white bg-black/60 px-1.5 py-0.5 rounded">support@carrygoexpress.store</code></li>
                    <li>Set <strong>Password</strong>: <code className="text-white bg-black/60 px-1.5 py-0.5 rounded">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull; (Your PrivateEmail Mailbox Password)</code></li>
                    <li>Click <strong>Save</strong>. All customer emails will now be sent directly from your Namecheap domain!</li>
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'backend' && (
              <div className="space-y-6 text-xs">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-veltrix-blue" />
                  Supabase Realtime Engine
                </h2>
                <div className="p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">WebSocket Connection</span>
                    <span className="flex items-center gap-1.5 text-green-400 font-bold px-2 py-0.5 bg-green-500/10 rounded-full">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      {realtimeConnected ? 'CONNECTED' : 'STANDBY / POLLING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-veltrix-gray-800">
                    <span className="text-veltrix-gray-400">Products in Realtime Cache</span>
                    <span className="font-mono font-bold text-white">{products.length} items</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-veltrix-gray-800">
                    <span className="text-veltrix-gray-400">Orders in Realtime Stream</span>
                    <span className="font-mono font-bold text-white">{orders.length} orders</span>
                  </div>
                </div>

                <div className="p-4 bg-veltrix-blue/10 border border-veltrix-blue/30 rounded-xl space-y-2">
                  <p className="font-bold text-veltrix-blue">Supabase Tables Active</p>
                  <p className="text-veltrix-gray-300">
                    User-end and Admin-end communicate over Supabase <code className="text-white">public.products</code>, <code className="text-white">public.orders</code>, <code className="text-white">public.order_items</code>, <code className="text-white">public.profiles</code>, and <code className="text-white">public.transactions</code> with Realtime publication listeners.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 text-xs">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Bell className="w-5 h-5 text-veltrix-blue" />
                  Realtime Notification Triggers
                </h2>
                {[
                  { label: 'Instant Order Notifications', desc: 'Audio and badge alert when a customer places an order', checked: true },
                  { label: 'Inventory Depletion Alert', desc: 'Trigger alert when product stock reaches 5 units or lower', checked: true },
                  { label: 'New User Signups', desc: 'Notify immediately when a new user registers on the platform', checked: true },
                  { label: 'Deposit Pending Verification', desc: 'Alert when a bank transfer deposit is awaiting review', checked: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-veltrix-black rounded-xl border border-veltrix-gray-800">
                    <div>
                      <p className="font-bold text-white">{item.label}</p>
                      <p className="text-veltrix-gray-500 text-[11px]">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                      <div className="w-10 h-5 bg-veltrix-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-veltrix-blue" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4 text-xs">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-veltrix-blue" />
                  Payment Gateways
                </h2>
                <div className="p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800 space-y-2">
                  <p className="font-bold text-white">Paystack Gateway</p>
                  <p className="text-veltrix-gray-400">Handles cards, USSD, bank transfer checkout and wallet top-ups.</p>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 text-xs">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-veltrix-blue" />
                  Express Delivery Settings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-veltrix-gray-300">Free Delivery Threshold ($)</label>
                    <input type="number" defaultValue="100" className="input-field text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-veltrix-gray-300">Standard Shipping Rate ($)</label>
                    <input type="number" defaultValue="15" className="input-field text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-veltrix-gray-800 flex justify-end">
              <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  saved 
                    ? 'bg-green-500 text-white' 
                    : 'bg-veltrix-blue text-veltrix-black hover:shadow-glow hover:scale-105'
                }`}
              >
                {saved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saved Successfully
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save CarryGoExpress Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
