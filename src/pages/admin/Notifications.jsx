import { useState } from 'react'
import { 
  Bell, CheckCircle, Trash2, ShoppingCart, User, CreditCard, Clock, Radio
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'

export default function AdminNotifications() {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification,
    clearAllNotifications,
    realtimeConnected 
  } = useAdminStore()

  const [filter, setFilter] = useState('all')

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Live Realtime Alerts & Notifications</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">
              <Radio className="w-3 h-3 animate-pulse" />
              {realtimeConnected ? 'Listening Live' : 'Active'}
            </span>
          </div>
          <p className="text-sm text-veltrix-gray-400 mt-1">
            Realtime notifications broadcasted whenever events occur on the user and product fronts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => markAllNotificationsRead()}
            className="flex items-center gap-2 px-3.5 py-2 bg-veltrix-blue text-veltrix-black rounded-xl text-xs font-bold hover:bg-veltrix-blue/90 transition-all shadow-glow"
            title="Mark all notifications as read"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Mark All Read
          </button>
          {notifications.length > 0 && (
            <button 
              onClick={() => clearAllNotifications()}
              className="flex items-center gap-1.5 px-3 py-2 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs font-semibold text-veltrix-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all"
              title="Clear all alerts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Notifications', count: notifications.length },
          { value: 'unread', label: 'Unread', count: notifications.filter(n => !n.read).length },
          { value: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'order').length },
          { value: 'user', label: 'Users', count: notifications.filter(n => n.type === 'user').length },
          { value: 'product', label: 'Products', count: notifications.filter(n => n.type === 'product').length },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f.value 
                ? 'bg-veltrix-blue text-veltrix-black' 
                : 'bg-veltrix-black-light border border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 overflow-hidden shadow-xl">
        <div className="divide-y divide-veltrix-gray-800/40">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-5 flex items-start gap-4 hover:bg-veltrix-gray-900/30 transition-all group ${
                !notification.read ? 'bg-veltrix-blue/5' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-veltrix-blue/20 text-veltrix-blue">
                {notification.type === 'order' && <ShoppingCart className="w-4 h-4" />}
                {notification.type === 'user' && <User className="w-4 h-4" />}
                {notification.type === 'deposit' && <CreditCard className="w-4 h-4" />}
                {!['order', 'user', 'deposit'].includes(notification.type) && <Bell className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      {notification.title}
                      {!notification.read && (
                        <span className="w-1.5 h-1.5 bg-veltrix-blue rounded-full animate-pulse" />
                      )}
                    </h3>
                    <p className="text-xs text-veltrix-gray-300 mt-1">{notification.message}</p>
                    <p className="text-[10px] text-veltrix-gray-500 mt-1.5 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {notification.time}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!notification.read && (
                      <button 
                        onClick={() => markNotificationRead(notification.id)}
                        className="p-1.5 text-veltrix-gray-400 hover:text-veltrix-blue hover:bg-veltrix-blue/10 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 text-veltrix-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="p-12 text-center text-xs text-veltrix-gray-500">
            <Bell className="w-10 h-10 text-veltrix-gray-700 mx-auto mb-3" />
            <p>No alerts found in this view. As events occur, they stream here live.</p>
          </div>
        )}
      </div>
    </div>
  )
}
