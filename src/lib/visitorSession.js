import { recordSiteVisit } from './supabase'

// Helper to detect browser
function getBrowserInfo(ua) {
  if (/edg/i.test(ua)) return 'Edge'
  if (/opr\//i.test(ua)) return 'Opera'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/safari/i.test(ua)) return 'Safari'
  if (/samsung/i.test(ua)) return 'Samsung Internet'
  return 'Browser'
}

// Helper to detect OS
function getOSInfo(ua) {
  if (/windows nt 10/i.test(ua)) return 'Windows 10/11'
  if (/windows/i.test(ua)) return 'Windows'
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS'
  if (/mac os x/i.test(ua)) return 'macOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Unknown OS'
}

// Helper to detect device type
function getDeviceType(ua) {
  const isTouch = navigator.maxTouchPoints > 0
  const width = window.innerWidth
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (isTouch && width >= 768 && width <= 1024)) {
    return 'tablet'
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer/i.test(ua) || width < 768) {
    return 'mobile'
  }
  return 'desktop'
}

// Get or create session ID
function getSessionId() {
  try {
    let sessionId = sessionStorage.getItem('cg_session_id')
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      sessionStorage.setItem('cg_session_id', sessionId)
    }
    return sessionId
  } catch {
    return `sess_${Date.now()}`
  }
}

// Fetch Geo & IP info (cached in sessionStorage to prevent rate limits)
async function getVisitorGeo() {
  try {
    const cached = sessionStorage.getItem('cg_visitor_geo')
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {}

  let geoData = {
    ip: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    country_code: '',
    country_flag: '🌐'
  }

  try {
    // Fast fetch from ipwho.is (free, returns rich geo + flag)
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) })
    if (res.ok) {
      const data = await res.json()
      if (data && data.success !== false) {
        geoData = {
          ip: data.ip || 'Unknown',
          city: data.city || 'Unknown',
          region: data.region || 'Unknown',
          country: data.country || 'Unknown',
          country_code: data.country_code || '',
          country_flag: data.flag?.emoji || '🌐'
        }
      }
    }
  } catch {
    try {
      // Fallback to ipify for raw IP
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) })
      if (res.ok) {
        const data = await res.json()
        if (data && data.ip) {
          geoData.ip = data.ip
        }
      }
    } catch {}
  }

  try {
    sessionStorage.setItem('cg_visitor_geo', JSON.stringify(geoData))
  } catch {}

  return geoData
}

let lastLoggedPath = null
let lastLogTime = 0

// Main track visit function
export async function trackPageView(path, user = null) {
  const now = Date.now()
  // Avoid duplicate logging within 2 seconds on same path
  if (lastLoggedPath === path && now - lastLogTime < 2000) {
    return
  }
  lastLoggedPath = path
  lastLogTime = now

  const ua = navigator.userAgent || ''
  const browser = getBrowserInfo(ua)
  const os = getOSInfo(ua)
  const deviceType = getDeviceType(ua)
  const sessionId = getSessionId()
  const screenResolution = `${window.screen?.width || 0}x${window.screen?.height || 0}`
  const referrer = document.referrer ? new URL(document.referrer, window.location.origin).hostname : 'Direct'
  const pageTitle = document.title || 'CarryGoExpress'

  // Get geo asynchronously
  const geo = await getVisitorGeo()

  await recordSiteVisit({
    ...geo,
    page_path: path,
    page_title: pageTitle,
    referrer,
    user_agent: ua,
    browser,
    os,
    device_type: deviceType,
    screen_resolution: screenResolution,
    session_id: sessionId,
    user_id: user?.id || null,
    user_email: user?.email || null
  })
}
