import { useState, useMemo } from 'react'
import { 
  Globe, Eye, Users, Smartphone, Monitor, Compass, 
  MapPin, Clock, Search, Filter, RefreshCw, ArrowUpRight,
  Shield, Activity, ExternalLink, Calendar, Tablet
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'

export default function AdminVisitors() {
  const { visits, stats, fetchDashboardData, isLoading } = useAdminStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [selectedVisit, setSelectedVisit] = useState(null)

  const INITIAL_LIMIT = 8
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT)

  // Filtered visits
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = 
        (v.ip_address || '').toLowerCase().includes(q) ||
        (v.city || '').toLowerCase().includes(q) ||
        (v.country || '').toLowerCase().includes(q) ||
        (v.page_path || '').toLowerCase().includes(q) ||
        (v.browser || '').toLowerCase().includes(q) ||
        (v.os || '').toLowerCase().includes(q)

      const matchesDevice = deviceFilter === 'all' || v.device_type === deviceFilter
      return matchesSearch && matchesDevice
    })
  }, [visits, searchQuery, deviceFilter])

  // Paginated visible visits for stream
  const visibleVisits = useMemo(() => {
    return filteredVisits.slice(0, visibleCount)
  }, [filteredVisits, visibleCount])

  // Hourly or Daily timeline distribution
  const trafficChartData = useMemo(() => {
    const hoursMap = {}
    const now = new Date()

    // Last 12 hours buckets
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000)
      const label = `${d.getHours()}:00`
      hoursMap[label] = { time: label, visits: 0, uniqueIps: new Set() }
    }

    visits.forEach(v => {
      if (!v.created_at) return
      const vDate = new Date(v.created_at)
      // Check if within last 12 hours
      if (now.getTime() - vDate.getTime() <= 12 * 3600000) {
        const label = `${vDate.getHours()}:00`
        if (hoursMap[label]) {
          hoursMap[label].visits += 1
          if (v.ip_address) hoursMap[label].uniqueIps.add(v.ip_address)
        }
      }
    })

    return Object.values(hoursMap).map(h => ({
      time: h.time,
      visits: h.visits,
      unique: h.uniqueIps.size
    }))
  }, [visits])

  // Device breakdown
  const deviceData = useMemo(() => {
    const counts = { desktop: 0, mobile: 0, tablet: 0 }
    visits.forEach(v => {
      const type = (v.device_type || 'desktop').toLowerCase()
      if (counts[type] !== undefined) counts[type]++
      else counts.desktop++
    })
    return [
      { name: 'Mobile', count: counts.mobile, color: '#00d4ff' },
      { name: 'Desktop', count: counts.desktop, color: '#3b82f6' },
      { name: 'Tablet', count: counts.tablet, color: '#8b5cf6' }
    ]
  }, [visits])

  // Top visited pages
  const topPages = useMemo(() => {
    const pages = {}
    visits.forEach(v => {
      const p = v.page_path || '/'
      pages[p] = (pages[p] || 0) + 1
    })
    return Object.entries(pages)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [visits])

  // Top Countries
  const topCountries = useMemo(() => {
    const map = {}
    visits.forEach(v => {
      const country = v.country || 'Unknown'
      const flag = v.country_flag || '🌐'
      const key = `${flag} ${country}`
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [visits])

  const mobilePercentage = visits.length > 0 
    ? Math.round((visits.filter(v => v.device_type === 'mobile').length / visits.length) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Realtime Visitor & IP Analytics</h1>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
              Live Tracking Active
            </span>
          </div>
          <p className="text-sm text-veltrix-gray-400 mt-1">
            Realtime intelligence tracking every customer visit, IP address, country, device, and page navigation.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData()}
          className="flex items-center gap-2 px-4 py-2 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs font-semibold text-veltrix-gray-300 hover:text-white transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-veltrix-black-light p-5 rounded-2xl border border-veltrix-gray-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-veltrix-gray-400">Total Pageviews</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-veltrix-blue">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalVisits.toLocaleString()}</p>
          <p className="text-[11px] text-veltrix-gray-500 mt-1">Logged to Supabase</p>
        </div>

        <div className="bg-veltrix-black-light p-5 rounded-2xl border border-veltrix-gray-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-veltrix-gray-400">Unique Visitors</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.uniqueVisitors.toLocaleString()}</p>
          <p className="text-[11px] text-veltrix-gray-500 mt-1">Distinct IP addresses</p>
        </div>

        <div className="bg-veltrix-black-light p-5 rounded-2xl border border-veltrix-gray-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-veltrix-gray-400">Active Online (10m)</span>
            <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{stats.activeVisitorsNow.toLocaleString()}</p>
          <p className="text-[11px] text-green-400 mt-1">Currently on storefront</p>
        </div>

        <div className="bg-veltrix-black-light p-5 rounded-2xl border border-veltrix-gray-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-veltrix-gray-400">Mobile Traffic</span>
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{mobilePercentage}%</p>
          <p className="text-[11px] text-veltrix-gray-500 mt-1">{stats.mobileVisitsCount} mobile visits</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-veltrix-black-light p-6 rounded-2xl border border-veltrix-gray-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Live Traffic Velocity</h2>
              <p className="text-xs text-veltrix-gray-400">Pageviews over the last 12 hours</p>
            </div>
            <span className="text-xs font-mono text-veltrix-blue">{visits.length} logged hits</span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficChartData}>
                <defs>
                  <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', borderColor: '#404040', borderRadius: '12px', fontSize: '12px' }} 
                  itemStyle={{ color: '#00d4ff' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#visitorGradient)" name="Total Pageviews" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device & Location Split */}
        <div className="bg-veltrix-black-light p-6 rounded-2xl border border-veltrix-gray-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Devices & Platforms</h2>
            <p className="text-xs text-veltrix-gray-400 mb-6">Customer hardware breakdown</p>

            <div className="space-y-4">
              {deviceData.map((d) => {
                const total = visits.length || 1
                const pct = Math.round((d.count / total) * 100)
                return (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-2">
                        {d.name === 'Mobile' && <Smartphone className="w-3.5 h-3.5 text-veltrix-blue" />}
                        {d.name === 'Desktop' && <Monitor className="w-3.5 h-3.5 text-blue-400" />}
                        {d.name === 'Tablet' && <Tablet className="w-3.5 h-3.5 text-purple-400" />}
                        {d.name}
                      </span>
                      <span className="text-veltrix-gray-400">{d.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-veltrix-gray-900 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%`, backgroundColor: d.color }} 
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-veltrix-gray-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Top Locations</h3>
              <div className="space-y-2">
                {topCountries.length === 0 ? (
                  <p className="text-xs text-veltrix-gray-500">No geo data logged yet</p>
                ) : (
                  topCountries.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-veltrix-gray-300 truncate">{c.name}</span>
                      <span className="font-mono font-bold text-veltrix-blue">{c.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-veltrix-gray-800 text-[11px] text-veltrix-gray-500 flex items-center justify-between">
            <span>Live IP Logging</span>
            <span className="text-green-400">● Active</span>
          </div>
        </div>
      </div>

      {/* Top Pages Visited */}
      <div className="bg-veltrix-black-light p-6 rounded-2xl border border-veltrix-gray-800/80 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Most Visited Store Paths</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topPages.map((tp, idx) => (
            <div key={idx} className="p-3.5 bg-veltrix-black rounded-xl border border-veltrix-gray-800/70">
              <p className="font-mono text-xs font-semibold text-veltrix-blue truncate">{tp.path}</p>
              <p className="text-xl font-black text-white mt-1">{tp.count} <span className="text-[10px] text-veltrix-gray-500 font-normal">views</span></p>
            </div>
          ))}
          {topPages.length === 0 && (
            <p className="text-xs text-veltrix-gray-500 py-2">No visits logged yet</p>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by IP, city, country, path, browser, OS..."
            className="w-full pl-10 pr-4 py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white placeholder-veltrix-gray-500 focus:border-veltrix-blue focus:outline-none"
          />
        </div>

        <select
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
          className="px-4 py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
        >
          <option value="all">All Devices</option>
          <option value="mobile">Mobile Devices</option>
          <option value="desktop">Desktop Computers</option>
          <option value="tablet">Tablets</option>
        </select>
      </div>

      {/* Detailed Visitor Table (Adaptive for Desktop and Mobile) */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/80 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-veltrix-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Live Visitor Stream ({filteredVisits.length})</h2>
          <span className="text-[11px] text-veltrix-gray-500 font-mono">Sorted by newest first</span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-3">
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Visited Page</th>
                <th className="px-6 py-3.5">Device & Browser</th>
                <th className="px-6 py-3.5">Referrer</th>
                <th className="px-6 py-3.5">Timestamp</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veltrix-gray-800/40">
              {visibleVisits.map((v) => (
                <tr key={v.id} className="hover:bg-veltrix-gray-900/30 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="font-mono font-bold text-veltrix-blue">{v.ip_address}</span>
                    {v.user_email && (
                      <span className="block text-[10px] text-veltrix-gray-400 truncate max-w-[140px]">{v.user_email}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{v.country_flag || '🌐'}</span>
                      <span className="font-semibold text-white">{v.city || 'Unknown'}, {v.country || ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-white max-w-[200px] truncate" title={v.page_path}>
                    {v.page_path}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.device_type === 'mobile' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {v.device_type}
                    </span>
                    <span className="block text-[11px] text-veltrix-gray-400 mt-0.5">
                      {v.browser} • {v.os}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-veltrix-gray-400">
                    {v.referrer || 'Direct'}
                  </td>
                  <td className="px-6 py-3.5 text-veltrix-gray-400 whitespace-nowrap">
                    {v.created_at ? new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedVisit(v)}
                      className="px-3 py-1 bg-veltrix-gray-900 hover:bg-veltrix-blue hover:text-black rounded-lg text-[11px] font-semibold text-veltrix-gray-300 transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden divide-y divide-veltrix-gray-800">
          {visibleVisits.map((v) => (
            <div key={v.id} className="p-3.5 sm:p-4 space-y-2.5 hover:bg-veltrix-gray-900/30">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">{v.country_flag || '🌐'}</span>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-xs text-veltrix-blue block truncate">{v.ip_address}</span>
                    <p className="text-[11px] text-veltrix-gray-400 truncate">{v.city || 'Unknown'}, {v.country || ''}</p>
                  </div>
                </div>
                <span className="text-[10px] text-veltrix-gray-500 font-mono shrink-0">
                  {v.created_at ? new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs bg-veltrix-black p-2.5 rounded-xl font-mono border border-veltrix-gray-800/60">
                <span className="text-white truncate max-w-[200px]" title={v.page_path}>{v.page_path}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  v.device_type === 'mobile' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {v.device_type}
                </span>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-xs">
                <span className="text-[11px] text-veltrix-gray-500 truncate max-w-[180px]">{v.browser} • {v.os}</span>
                <button
                  onClick={() => setSelectedVisit(v)}
                  className="px-3 py-1 bg-veltrix-gray-900 hover:bg-veltrix-blue hover:text-veltrix-black text-veltrix-blue rounded-lg text-xs font-semibold border border-veltrix-gray-800 transition-colors shrink-0"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Visitor Stream Pagination & Show More Actions */}
        {filteredVisits.length > 0 && (
          <div className="p-3.5 sm:p-5 border-t border-veltrix-gray-800 bg-veltrix-black/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-veltrix-gray-400">
              <span>Showing</span>
              <span className="font-bold text-white px-2 py-0.5 bg-veltrix-gray-900 border border-veltrix-gray-800 rounded-md font-mono text-[11px]">
                {Math.min(visibleCount, filteredVisits.length)}
              </span>
              <span>of</span>
              <span className="font-bold text-veltrix-blue font-mono text-[11px]">
                {filteredVisits.length}
              </span>
              <span>visitors</span>
            </div>

            {filteredVisits.length > INITIAL_LIMIT && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {visibleCount < filteredVisits.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => Math.min(prev + 10, filteredVisits.length))}
                      className="flex-1 sm:flex-none px-4 py-2 bg-veltrix-gray-900 hover:bg-veltrix-blue hover:text-veltrix-black text-white text-xs font-bold rounded-xl border border-veltrix-gray-800 hover:border-veltrix-blue transition-all active:scale-95"
                    >
                      Show More (+10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleCount(filteredVisits.length)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-veltrix-blue text-veltrix-black text-xs font-bold rounded-xl shadow-glow hover:bg-veltrix-blue-dark transition-all active:scale-95"
                    >
                      View Full List ({filteredVisits.length})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(INITIAL_LIMIT)}
                    className="w-full sm:w-auto px-4 py-2 bg-veltrix-gray-900 hover:bg-veltrix-gray-800 text-veltrix-gray-300 text-xs font-bold rounded-xl border border-veltrix-gray-800 transition-all active:scale-95"
                  >
                    Show Less (Collapse)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {filteredVisits.length === 0 && (
          <div className="text-center py-12 text-veltrix-gray-500 text-xs">
            No visitor logs found matching your criteria.
          </div>
        )}
      </div>

      {/* Detail Inspection Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl w-full max-w-lg max-h-[85dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-veltrix-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedVisit.country_flag || '🌐'}</span>
                <div>
                  <h3 className="font-bold text-white text-base">Visitor Detail Report</h3>
                  <p className="text-xs font-mono text-veltrix-blue">{selectedVisit.ip_address}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVisit(null)}
                className="text-veltrix-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-veltrix-black rounded-xl">
                <span className="text-veltrix-gray-500">Location</span>
                <p className="font-semibold text-white mt-0.5">{selectedVisit.city}, {selectedVisit.region}, {selectedVisit.country}</p>
              </div>
              <div className="p-3 bg-veltrix-black rounded-xl">
                <span className="text-veltrix-gray-500">Device Type</span>
                <p className="font-semibold text-white mt-0.5 capitalize">{selectedVisit.device_type}</p>
              </div>
              <div className="p-3 bg-veltrix-black rounded-xl">
                <span className="text-veltrix-gray-500">Browser & OS</span>
                <p className="font-semibold text-white mt-0.5">{selectedVisit.browser} / {selectedVisit.os}</p>
              </div>
              <div className="p-3 bg-veltrix-black rounded-xl">
                <span className="text-veltrix-gray-500">Screen Resolution</span>
                <p className="font-semibold text-white mt-0.5">{selectedVisit.screen_resolution || 'N/A'}</p>
              </div>
              <div className="col-span-2 p-3 bg-veltrix-black rounded-xl">
                <span className="text-veltrix-gray-500">Page Visited</span>
                <p className="font-mono font-semibold text-veltrix-blue mt-0.5">{selectedVisit.page_path}</p>
                <p className="text-[11px] text-veltrix-gray-400 mt-1">{selectedVisit.page_title}</p>
              </div>
              <div className="col-span-2 p-3 bg-veltrix-black rounded-xl">
                <span className="text-veltrix-gray-500">Referrer</span>
                <p className="font-semibold text-white mt-0.5">{selectedVisit.referrer || 'Direct visit'}</p>
              </div>
              <div className="col-span-2 p-3 bg-veltrix-black rounded-xl">
                <span className="text-veltrix-gray-500">Full User Agent</span>
                <p className="text-[10px] font-mono text-veltrix-gray-400 mt-1 break-all">{selectedVisit.user_agent}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-veltrix-gray-800">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-5 py-2 bg-veltrix-blue text-black font-bold text-xs rounded-xl"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
