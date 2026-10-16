import { useState } from 'react'
import { 
  Settings, Store, Mail, Bell, Shield, CreditCard, Truck,
  Save, CheckCircle, Database, Lock, Radio
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'

const tabs = [
  { id: 'general', label: 'Store Profile', icon: Store },
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
  const [storeEmail, setStoreEmail] = useState('support@carrygoexpress.com')
  const [currency, setCurrency] = useState('NGN (₦)')
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
                      <option>NGN (₦)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
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
                    <label className="font-semibold text-veltrix-gray-300">Free Delivery Threshold (₦)</label>
                    <input type="number" defaultValue="100000" className="input-field text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-veltrix-gray-300">Standard Shipping Rate (₦)</label>
                    <input type="number" defaultValue="3500" className="input-field text-sm" />
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
