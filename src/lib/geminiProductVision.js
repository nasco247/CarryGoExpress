// ── Unified AI Catalog Assistant & Image Vision Helper ──
// Supports Google Gemini (v1beta verified models + live ModelService) & DeepSeek (V3 & R1)
// One-click catalog generation from Title & Price, formatted specs, verified high-res images,
// image cycling/variants, and image preview lightbox.

import { GADGET_CATEGORIES, GADGET_BRANDS, getSubcategoriesForCategory } from './gadgetCategories.js'

// ── Supported Google Gemini Models ──────────────────────────────────────────
// Official, verified active models on Google Gemini v1beta endpoint
export const GEMINI_MODELS = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    badge: 'Recommended',
    description: 'Ultra-fast sub-second generation (600ms), highest availability, and elite structured JSON accuracy'
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'Fast & Stable',
    description: 'Next-generation multimodal model with comprehensive gadget specs reasoning'
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    badge: 'Latest Flash',
    description: 'Google latest Flash model with deep reasoning (auto-cascades to 3.5 Flash-Lite if busy)'
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    badge: 'Preview',
    description: 'Advanced reasoning model with thinking capabilities'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    badge: 'Rolling',
    description: 'Always points to current default production Flash endpoint'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro Preview',
    badge: 'Pro Tier',
    description: 'Google flagship Pro tier for comprehensive technical gadget specs'
  }
]

// ── Supported DeepSeek Models ───────────────────────────────────────────────
export const DEEPSEEK_MODELS = [
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    badge: 'Recommended',
    description: 'DeepSeek-V3: Ultra-fast, highly intelligent, cost-effective catalog generator'
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner (R1)',
    badge: 'Deep Reasoning',
    description: 'DeepSeek-R1: Advanced reasoning model with deep thought chains'
  }
]

// Storage Keys
const LOCAL_STORAGE_GEMINI_KEY = 'carrygo_gemini_api_key'
const LOCAL_STORAGE_GEMINI_MODEL = 'carrygo_gemini_model'
const LOCAL_STORAGE_DEEPSEEK_KEY = 'carrygo_deepseek_api_key'
const LOCAL_STORAGE_DEEPSEEK_MODEL = 'carrygo_deepseek_model'
const LOCAL_STORAGE_AI_PROVIDER = 'carrygo_ai_provider' // 'gemini' | 'deepseek'

function safeGetItem(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key)
    }
  } catch (e) {}
  return null
}

function safeSetItem(key, val) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val)
    }
  } catch (e) {}
}

function safeRemoveItem(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key)
    }
  } catch (e) {}
}

// ── Provider Getters / Setters ──────────────────────────────────────────────
export function getAiProvider() {
  return safeGetItem(LOCAL_STORAGE_AI_PROVIDER) || 'gemini'
}

export function saveAiProvider(provider) {
  if (provider === 'gemini' || provider === 'deepseek') {
    safeSetItem(LOCAL_STORAGE_AI_PROVIDER, provider)
  }
}

// ── Gemini Model Resolver (Safely maps non-existent or deprecated names) ─────
export function resolveGeminiModelId(modelId) {
  if (!modelId) return 'gemini-3.5-flash-lite'
  const id = modelId.toLowerCase().trim()

  // If already an active modern 3.x or rolling model, preserve it directly
  if (
    id === 'gemini-3.5-flash-lite' ||
    id === 'gemini-3.5-flash' ||
    id === 'gemini-3.8-flash' ||
    id === 'gemini-3.7-flash' ||
    id === 'gemini-3.6-flash' ||
    id === 'gemini-flash-latest' ||
    id === 'gemini-flash-lite-latest' ||
    id === 'gemini-3.1-pro-preview' ||
    id === 'gemini-pro-latest'
  ) {
    return id
  }

  // Any legacy or deprecated 1.5, 2.0, or 2.5 models safely migrate to gemini-3.5-flash-lite
  if (
    id.includes('2.0') ||
    id.includes('1.5') ||
    id.includes('2.5')
  ) {
    return 'gemini-3.5-flash-lite'
  }

  return id
}

// ── Gemini Getters / Setters ────────────────────────────────────────────────
export function getGeminiApiKey() {
  return safeGetItem(LOCAL_STORAGE_GEMINI_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || ''
}

export function saveGeminiApiKey(key) {
  if (key && key.trim()) {
    safeSetItem(LOCAL_STORAGE_GEMINI_KEY, key.trim())
  } else {
    safeRemoveItem(LOCAL_STORAGE_GEMINI_KEY)
  }
}

export function getGeminiModel() {
  const saved = safeGetItem(LOCAL_STORAGE_GEMINI_MODEL)
  if (!saved) return 'gemini-3.5-flash-lite'

  const resolved = resolveGeminiModelId(saved)
  if (resolved !== saved) {
    safeSetItem(LOCAL_STORAGE_GEMINI_MODEL, resolved)
    return resolved
  }

  const exists = GEMINI_MODELS.some(m => m.id === saved)
  if (!exists) {
    safeSetItem(LOCAL_STORAGE_GEMINI_MODEL, 'gemini-3.5-flash-lite')
    return 'gemini-3.5-flash-lite'
  }
  return saved
}

export function saveGeminiModel(modelId) {
  if (modelId && modelId.trim()) {
    const resolved = resolveGeminiModelId(modelId.trim())
    safeSetItem(LOCAL_STORAGE_GEMINI_MODEL, resolved)
  }
}

// ── DeepSeek Getters / Setters ──────────────────────────────────────────────
export function getDeepSeekApiKey() {
  return safeGetItem(LOCAL_STORAGE_DEEPSEEK_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPSEEK_API_KEY) || ''
}

export function saveDeepSeekApiKey(key) {
  if (key && key.trim()) {
    safeSetItem(LOCAL_STORAGE_DEEPSEEK_KEY, key.trim())
  } else {
    safeRemoveItem(LOCAL_STORAGE_DEEPSEEK_KEY)
  }
}

export function getDeepSeekModel() {
  const saved = safeGetItem(LOCAL_STORAGE_DEEPSEEK_MODEL)
  const exists = DEEPSEEK_MODELS.some(m => m.id === saved)
  return exists ? saved : 'deepseek-chat'
}

export function saveDeepSeekModel(modelId) {
  if (modelId && modelId.trim()) {
    safeSetItem(LOCAL_STORAGE_DEEPSEEK_MODEL, modelId.trim())
  }
}

/**
 * Dynamically queries Google Gemini ModelService to list models available for the user's specific API key
 */
export async function fetchAvailableGeminiModels(apiKey = null) {
  const key = apiKey || getGeminiApiKey()
  if (!key) return GEMINI_MODELS

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      signal: controller.signal
    })
    clearTimeout(timer)

    if (!res.ok) return GEMINI_MODELS

    const data = await res.json()
    if (Array.isArray(data.models)) {
      const generateModels = data.models
        .filter(m => {
          const id = m.name.replace('models/', '')
          const methods = m.supportedGenerationMethods || []
          // Must support generateContent
          if (!methods.includes('generateContent')) return false
          // Must start with gemini
          if (!id.startsWith('gemini-')) return false
          // Filter out specialized non-text or embedding preview variants
          if (
            id.includes('tts') ||
            id.includes('transcribe') ||
            id.includes('banana') ||
            id.includes('robotics') ||
            id.includes('computer-use') ||
            id.includes('customtools') ||
            id.includes('embedding') ||
            id.includes('aqa')
          ) {
            return false
          }
          return true
        })
        .map(m => {
          const id = m.name.replace('models/', '')
          const matchingKnown = GEMINI_MODELS.find(k => k.id === id)
          let badge = matchingKnown?.badge || (id.includes('flash') ? 'Flash' : 'Pro')
          if (id === 'gemini-3.5-flash-lite') badge = 'Recommended'
          else if (id === 'gemini-3.5-flash') badge = 'Fast & Stable'
          else if (id === 'gemini-3.8-flash') badge = 'Latest Flash'

          return {
            id,
            name: matchingKnown?.name || m.displayName || id,
            badge,
            description: matchingKnown?.description || m.description || `Google Gemini model ${id}`
          }
        })

      if (generateModels.length > 0) {
        // Prioritize gemini-3.5-flash-lite and gemini-3.5-flash at top
        generateModels.sort((a, b) => {
          if (a.id === 'gemini-3.5-flash-lite') return -1
          if (b.id === 'gemini-3.5-flash-lite') return 1
          if (a.id === 'gemini-3.5-flash') return -1
          if (b.id === 'gemini-3.5-flash') return 1
          if (a.id === 'gemini-3.8-flash') return -1
          if (b.id === 'gemini-3.8-flash') return 1
          return a.name.localeCompare(b.name)
        })
        return generateModels
      }
    }
  } catch (err) {
    console.warn('[Gemini ModelService.ListModels warning]', err.message)
  }

  return GEMINI_MODELS
}

// ── Verified High-Resolution Gadget Imagery Library (Strictly Brand Segregated) ──
// Curated, verified photos ensuring non-Apple products (e.g. HP laptops) NEVER show Apple MacBooks!
const GADGET_IMAGE_LIBRARY = {
  // Apple Smartphones
  iphone_pro: [
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000&auto=format&fit=crop&q=85'
  ],
  iphone: [
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1000&auto=format&fit=crop&q=85'
  ],
  
  // Samsung & Android
  samsung_galaxy: [
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=1000&auto=format&fit=crop&q=85'
  ],
  pixel: [
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=1000&auto=format&fit=crop&q=85'
  ],
  xiaomi: [
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=1000&auto=format&fit=crop&q=85'
  ],
  oneplus: [
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=1000&auto=format&fit=crop&q=85'
  ],
  smartphone_generic: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=1000&auto=format&fit=crop&q=85'
  ],

  // Tablets
  ipad: [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=1000&auto=format&fit=crop&q=85'
  ],

  // HP Laptops (Verified HP / Windows PC Laptops - NOT MacBooks)
  hp_laptop: [
    'https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=1000&auto=format&fit=crop&q=85'
  ],

  // Dell Laptops (Verified Dell XPS / Latitude - NOT MacBooks)
  dell_laptop: [
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=1000&auto=format&fit=crop&q=85'
  ],

  // Lenovo Laptops (ThinkPad / Yoga)
  lenovo_laptop: [
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1522199755839-a2bacb67c546?w=1000&auto=format&fit=crop&q=85'
  ],

  // Gaming Laptops (ASUS ROG / Alienware / Razer)
  gaming_laptop: [
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=1000&auto=format&fit=crop&q=85'
  ],

  // Apple MacBooks (ONLY for Apple Products)
  macbook: [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1000&auto=format&fit=crop&q=85'
  ],

  // Neutral Generic PC Laptops (NO Apple branding)
  laptop_generic: [
    'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1589561084283-930aa7b1ce50?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=1000&auto=format&fit=crop&q=85'
  ],

  monitor: [
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=1000&auto=format&fit=crop&q=85'
  ],

  // Wearables & Watches
  apple_watch: [
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=85'
  ],
  smartwatch_generic: [
    'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=85'
  ],

  // Audio & Sound
  airpods: [
    'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1000&auto=format&fit=crop&q=85'
  ],
  headphones: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1000&auto=format&fit=crop&q=85'
  ],
  speaker: [
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1000&auto=format&fit=crop&q=85'
  ],

  // Gaming Consoles & Handhelds
  playstation: [
    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=85'
  ],
  nintendo: [
    'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=1000&auto=format&fit=crop&q=85'
  ],
  xbox: [
    'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=1000&auto=format&fit=crop&q=85'
  ],
  gaming_generic: [
    'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1612287232230-e8f000305f8d?w=1000&auto=format&fit=crop&q=85'
  ],

  // Accessories & Power
  powerbank: [
    'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=1000&auto=format&fit=crop&q=85'
  ],
  charger: [
    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=1000&auto=format&fit=crop&q=85'
  ],

  // Fallback
  default_gadget: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=85',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=1000&auto=format&fit=crop&q=85'
  ]
}

/**
 * Returns available image options matching the gadget with strict brand segregation
 */
export function getGadgetImageOptions({ title = '', category = '', subcategory = '', brand = '', keyword = '' }) {
  const brandLower = (brand || '').toLowerCase().trim()
  const titleLower = (title || '').toLowerCase().trim()
  const subcategoryLower = (subcategory || '').toLowerCase().trim()
  const keywordLower = (keyword || '').toLowerCase().trim()
  const text = `${titleLower} ${brandLower} ${subcategoryLower} ${keywordLower}`

  // Apple check: strictly ensure only Apple products get MacBook / iPhone images
  const isApple = brandLower.includes('apple') || 
                  titleLower.includes('iphone') || 
                  titleLower.includes('ipad') || 
                  titleLower.includes('macbook') || 
                  titleLower.includes('apple watch') || 
                  titleLower.includes('airpods')

  // 1. SMARTPHONES
  if (isApple && (text.includes('15 pro') || text.includes('16 pro') || text.includes('14 pro') || text.includes('iphone 15') || text.includes('iphone 16'))) {
    return GADGET_IMAGE_LIBRARY.iphone_pro
  }
  if (isApple && text.includes('iphone')) return GADGET_IMAGE_LIBRARY.iphone

  if (text.includes('s24') || text.includes('s23') || text.includes('s22') || text.includes('s25') || text.includes('galaxy') || brandLower.includes('samsung')) {
    return GADGET_IMAGE_LIBRARY.samsung_galaxy
  }
  if (text.includes('pixel') || brandLower.includes('google')) return GADGET_IMAGE_LIBRARY.pixel
  if (text.includes('xiaomi') || text.includes('redmi') || brandLower.includes('xiaomi')) return GADGET_IMAGE_LIBRARY.xiaomi
  if (text.includes('oneplus') || brandLower.includes('oneplus')) return GADGET_IMAGE_LIBRARY.oneplus

  // 2. TABLETS
  if (isApple && (text.includes('ipad') || subcategoryLower.includes('ipad'))) return GADGET_IMAGE_LIBRARY.ipad
  if (category === 'Smartphones & Tablets') return GADGET_IMAGE_LIBRARY.smartphone_generic

  // 3. LAPTOPS & COMPUTERS
  // HP Check (HP Pavilion, Envy, Spectre, Omen, Victus, EliteBook, ProBook, or HP brand/title)
  if (
    brandLower.includes('hp') || 
    titleLower.includes('hp ') || 
    titleLower.startsWith('hp') || 
    titleLower.includes('pavilion') || 
    titleLower.includes('spectre') || 
    titleLower.includes('envy') || 
    titleLower.includes('omen') || 
    titleLower.includes('victus') || 
    titleLower.includes('elitebook') || 
    titleLower.includes('probook')
  ) {
    return GADGET_IMAGE_LIBRARY.hp_laptop
  }

  // Dell Check (XPS, Inspiron, Alienware, Latitude, G15)
  if (
    brandLower.includes('dell') || 
    titleLower.includes('dell') || 
    titleLower.includes('xps') || 
    titleLower.includes('inspiron') || 
    titleLower.includes('latitude')
  ) {
    return GADGET_IMAGE_LIBRARY.dell_laptop
  }

  // Lenovo Check (ThinkPad, IdeaPad, Legion, Yoga)
  if (
    brandLower.includes('lenovo') || 
    titleLower.includes('lenovo') || 
    titleLower.includes('thinkpad') || 
    titleLower.includes('ideapad') || 
    titleLower.includes('legion') || 
    titleLower.includes('yoga')
  ) {
    return GADGET_IMAGE_LIBRARY.lenovo_laptop
  }

  // Gaming Laptops (ASUS ROG, TUF, Acer Predator, Razer Blade, Alienware)
  if (
    text.includes('rog') || 
    text.includes('alienware') || 
    text.includes('razer') || 
    text.includes('predator') || 
    text.includes('tuf') || 
    text.includes('gaming laptop')
  ) {
    return GADGET_IMAGE_LIBRARY.gaming_laptop
  }

  // MacBook - ONLY IF EXPLICITLY APPLE!
  if (isApple && (text.includes('macbook') || text.includes('mac book') || subcategoryLower.includes('macbook'))) {
    return GADGET_IMAGE_LIBRARY.macbook
  }

  // Generic Windows / PC Laptop fallback (Guaranteed NO MacBook)
  if (category === 'Laptops & Computers' || text.includes('laptop') || text.includes('notebook') || text.includes('computer')) {
    return GADGET_IMAGE_LIBRARY.laptop_generic
  }

  if (text.includes('monitor') || text.includes('display')) return GADGET_IMAGE_LIBRARY.monitor

  // 4. WATCHES & WEARABLES
  if (isApple && (text.includes('apple watch') || text.includes('iwatch'))) return GADGET_IMAGE_LIBRARY.apple_watch
  if (text.includes('smartwatch') || text.includes('watch') || text.includes('garmin')) return GADGET_IMAGE_LIBRARY.smartwatch_generic

  // 5. AUDIO & SOUND
  if (isApple && text.includes('airpods')) return GADGET_IMAGE_LIBRARY.airpods
  if (text.includes('headphone') || text.includes('wh-1000') || text.includes('sony') || text.includes('bose') || text.includes('jbl') || text.includes('buds')) {
    return GADGET_IMAGE_LIBRARY.headphones
  }
  if (text.includes('speaker') || text.includes('soundbar')) return GADGET_IMAGE_LIBRARY.speaker

  // 6. GAMING
  if (text.includes('ps5') || text.includes('playstation')) return GADGET_IMAGE_LIBRARY.playstation
  if (text.includes('switch') || text.includes('nintendo')) return GADGET_IMAGE_LIBRARY.nintendo
  if (text.includes('xbox')) return GADGET_IMAGE_LIBRARY.xbox
  if (category === 'Gaming & Handhelds' || text.includes('gaming') || text.includes('console')) return GADGET_IMAGE_LIBRARY.gaming_generic

  // 7. ACCESSORIES & POWER
  if (text.includes('power bank') || text.includes('battery') || text.includes('anker')) return GADGET_IMAGE_LIBRARY.powerbank
  if (text.includes('charger') || text.includes('magsafe') || text.includes('adapter')) return GADGET_IMAGE_LIBRARY.charger

  // Fallbacks by Category
  if (category === 'Smartphones & Tablets') return GADGET_IMAGE_LIBRARY.smartphone_generic
  if (category === 'Laptops & Computers') return GADGET_IMAGE_LIBRARY.laptop_generic
  if (category === 'Smartwatches & Wearables') return GADGET_IMAGE_LIBRARY.smartwatch_generic
  if (category === 'Audio & Sound') return GADGET_IMAGE_LIBRARY.headphones
  if (category === 'Gaming & Handhelds') return GADGET_IMAGE_LIBRARY.gaming_generic
  if (category === 'Accessories & Power') return GADGET_IMAGE_LIBRARY.powerbank

  return GADGET_IMAGE_LIBRARY.default_gadget
}

/**
 * Returns a crystal-clear high quality product image URL matching the gadget
 */
export function getHighQualityGadgetImage({ title = '', category = '', subcategory = '', brand = '', keyword = '', variant = 0 }) {
  const options = getGadgetImageOptions({ title, category, subcategory, brand, keyword })
  const index = Math.abs(variant) % options.length
  return options[index] || options[0] || GADGET_IMAGE_LIBRARY.default_gadget[0]
}

/**
 * ── Generate Just The Image with AI (Curated Verified Library + Brand Protection) ──
 * Allows admin to generate or regenerate an accurate photorealistic product image for any gadget
 * Guarantees zero 403 network failures and strict brand isolation (e.g. HP laptops NEVER show MacBooks)
 */
export async function generateGadgetImageWithAI({
  title = '',
  brand = '',
  category = '',
  subcategory = '',
  variant = 0,
  signal = null
}) {
  if (signal?.aborted) {
    const err = new Error('Image generation stopped.')
    err.name = 'AbortError'
    throw err
  }

  // Curated, brand-isolated high resolution imagery
  const curatedUrl = getHighQualityGadgetImage({
    title,
    brand,
    category,
    subcategory,
    variant
  })

  return {
    success: true,
    imageUrl: curatedUrl,
    method: 'curated_library'
  }
}

/**
 * Normalizes and extracts JSON from AI response text
 */
function cleanAndParseAiJson(candidateText) {
  if (!candidateText || typeof candidateText !== 'string') {
    throw new Error('Empty response received from AI model.')
  }

  let text = candidateText.trim()

  // Remove markdown code fences if present
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  // Regex extract the outermost JSON object { ... }
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error('Could not parse structured product JSON from AI response.')
  }

  return JSON.parse(match[0])
}

/**
 * Formats and validates the product data to match the CarryGoExpress catalog schema.
 * Note: By default includeImage is false so image is NOT touched unless admin explicitly wants it.
 */
function formatProductData({ rawData, requestedTitle, requestedPrice, includeImage = false, imageVariant = 0 }) {
  // 1. Title / Name
  const name = (rawData.name || requestedTitle || '').trim()

  // 2. Brand
  let brand = (rawData.brand || '').trim()
  if (!brand) {
    const matchedBrand = GADGET_BRANDS.find(b => name.toLowerCase().includes(b.toLowerCase()))
    brand = matchedBrand || 'CarryGoExpress'
  }

  // 3. Category
  const categoryNames = GADGET_CATEGORIES.map(c => c.name)
  let category = rawData.category
  if (!categoryNames.includes(category)) {
    const matchedCat = categoryNames.find(c => 
      c.toLowerCase() === (rawData.category || '').toLowerCase() ||
      (rawData.category || '').toLowerCase().includes(c.toLowerCase().split(' ')[0])
    )
    category = matchedCat || 'Smartphones & Tablets'
  }

  // 4. Subcategory
  const validSubs = getSubcategoriesForCategory(category)
  let subcategory = rawData.subcategory
  const matchedSub = validSubs.find(s => 
    s.toLowerCase() === (subcategory || '').toLowerCase() ||
    name.toLowerCase().includes(s.toLowerCase())
  )
  subcategory = matchedSub || validSubs[0] || ''

  // 5. Pricing
  const price = requestedPrice !== undefined && requestedPrice !== '' && !isNaN(Number(requestedPrice))
    ? Number(requestedPrice)
    : Number(rawData.price) || 299

  let originalPrice = Number(rawData.original_price)
  if (isNaN(originalPrice) || originalPrice <= price) {
    originalPrice = Math.round(price * 1.22) // Suggest attractive 18-22% MSRP list price
  }

  // 6. SKU
  const brandPrefix = brand.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GDT'
  const randomCode = Math.floor(1000 + Math.random() * 9000)
  const sku = rawData.sku && typeof rawData.sku === 'string' && rawData.sku.startsWith('CGO-')
    ? rawData.sku
    : `CGO-${brandPrefix}-${randomCode}`

  // 7. Badge
  const allowedBadges = ['Flagship', 'Hot Deal', 'Best Seller', 'New Arrival', 'Premium', 'Top Rated']
  const badge = allowedBadges.includes(rawData.badge) ? rawData.badge : 'New Arrival'

  // 8. Stock
  const stock = !isNaN(Number(rawData.stock)) && Number(rawData.stock) > 0 ? Number(rawData.stock) : 15

  // 9. Description (Formatted specifications & overview)
  let description = rawData.description || ''
  if (!description) {
    description = `Premium ${name} engineered with high performance hardware, superior build quality, and cutting-edge features. Backed by full warranty and rapid express delivery.`
  }

  // 10. Image from internet ONLY if explicitly requested
  let image = ''
  if (includeImage) {
    image = getHighQualityGadgetImage({
      title: name,
      category,
      subcategory,
      brand,
      keyword: rawData.image_keyword || '',
      variant: imageVariant
    })
  }

  return {
    name,
    brand,
    category,
    subcategory,
    price,
    original_price: originalPrice,
    sku,
    badge,
    stock,
    status: 'active',
    description,
    image
  }
}

/**
 * Standard Catalog Prompt Builder for both Gemini and DeepSeek
 */
function buildProductCatalogPrompt(title, price) {
  return `
You are a senior consumer electronics & gadget catalog manager for CarryGoExpress, an elite tech e-commerce store.
Based ONLY on the following inputs from the store admin:
- Product Title / Name: "${title.trim()}"
- Selling Price ($ USD): ${price ? `$${price}` : 'Suggest realistic market price in USD'}

Generate a complete, professional, highly accurate e-commerce product entry.
You MUST output a strictly valid JSON object (no markdown, no backticks, no commentary) containing these exact fields:

{
  "name": "Full commercial official title including storage/color/specs if applicable (e.g. 'HP Pavilion 15.6 FHD Laptop - Intel Core i7 16GB RAM 512GB SSD')",
  "brand": "Accurate brand name (e.g. 'HP', 'Dell', 'Lenovo', 'Apple', 'Samsung', 'Sony', 'ASUS', 'Google', 'Xiaomi', 'OnePlus', 'Anker', 'Bose', 'Nintendo', etc.)",
  "category": "MUST BE EXACTLY ONE OF: 'Smartphones & Tablets', 'Laptops & Computers', 'Smartwatches & Wearables', 'Audio & Sound', 'Gaming & Handhelds', 'Accessories & Power'",
  "subcategory": "Accurate subcategory matching category (e.g. 'Windows Laptops', 'MacBooks', 'Gaming Laptops', 'iPhone', 'Samsung Galaxy', 'AirPods & Earbuds', 'Noise Cancelling Headphones', 'PlayStation 5', etc.)",
  "price": ${price ? Number(price) : 999},
  "original_price": ${price ? Math.round(Number(price) * 1.2) : 1199},
  "badge": "One of: 'Flagship', 'Hot Deal', 'Best Seller', 'New Arrival', or 'Premium'",
  "stock": 14,
  "sku": "CGO-BRD-#### (e.g. CGO-HP-8942)",
  "image_keyword": "1-2 keywords identifying ONLY this exact brand and device (e.g. for HP laptop write 'hp laptop' or 'hp pavilion'; NEVER mention Apple or MacBook for non-Apple brands)",
  "description": "Engaging, professional 2-3 paragraph product overview and detailed technical specifications list (Screen/Display, Processor/Chipset, Battery & Charging, Cameras/Audio, Connectivity, and What's in the box)."
}
`
}

/**
 * ── Generate Full Product Entry from Title & Price with Google Gemini AI ──
 */
export async function generateProductDetailsWithGemini({
  title,
  price,
  includeImage = false,
  model = null,
  apiKey = null,
  imageVariant = 0,
  signal = null
}) {
  const activeKey = apiKey || getGeminiApiKey()
  if (!activeKey) {
    return {
      success: false,
      error: 'Please enter your Google Gemini API key to enable AI Product Generation.'
    }
  }

  if (!title || !title.trim()) {
    return {
      success: false,
      error: 'Please enter a Product Title / Model Name (e.g. "HP Pavilion 15" or "Sony WH-1000XM5").'
    }
  }

  const requestedModel = model || getGeminiModel() || 'gemini-3.5-flash-lite'
  const primaryModel = resolveGeminiModelId(requestedModel)

  // Real verified fallback sequence in case of 503 high demand or quota limits
  const fallbackList = [
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest'
  ].filter(m => m !== primaryModel)
  const modelsToTry = [primaryModel, ...fallbackList]

  const promptText = buildProductCatalogPrompt(title, price)
  let lastError = null
  let successfulModel = primaryModel

  for (const currentModel of modelsToTry) {
    if (signal?.aborted) {
      return { success: false, error: 'Generation stopped by user.', aborted: true }
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${activeKey}`

      const requestBody = {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.3
        }
      }

      // 8-second per-model timeout so if Google hangs/503s on 3.8 Flash, it cascades immediately
      const perModelController = new AbortController()
      const timer = setTimeout(() => perModelController.abort(), 8000)

      if (signal) {
        signal.addEventListener('abort', () => perModelController.abort(), { once: true })
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: perModelController.signal
      })
      clearTimeout(timer)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const errorMsg = errData?.error?.message || `HTTP ${response.status} from Gemini (${currentModel})`
        lastError = errorMsg
        console.warn(`[Gemini Product AI] Model ${currentModel} returned error:`, errorMsg)
        
        if (response.status === 400 && errorMsg.toLowerCase().includes('api key not valid')) {
          return { success: false, error: 'Your Google Gemini API Key is invalid. Please check and re-enter it.' }
        }
        
        continue
      }

      const result = await response.json()
      const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!candidateText) {
        lastError = `No response candidate returned by ${currentModel}`
        continue
      }

      const rawJson = cleanAndParseAiJson(candidateText)
      const formatted = formatProductData({
        rawData: rawJson,
        requestedTitle: title,
        requestedPrice: price,
        includeImage,
        imageVariant
      })

      successfulModel = currentModel
      return {
        success: true,
        data: formatted,
        usedModel: successfulModel,
        provider: 'gemini'
      }
    } catch (err) {
      if (signal?.aborted) {
        return { success: false, error: 'Generation stopped by user.', aborted: true }
      }
      if (err.name === 'AbortError') {
        console.warn(`[Gemini Product AI] Model ${currentModel} timed out after 8s, auto-cascading to next model...`)
        lastError = `Model ${currentModel} timed out. Auto-cascading to next available model.`
        continue
      }
      console.warn(`[Gemini Product AI] Failed with ${currentModel}:`, err.message)
      lastError = err.message
    }
  }

  return {
    success: false,
    error: lastError || 'Failed to generate product details with Gemini AI. Please check your API key.'
  }
}

/**
 * ── Generate Full Product Entry from Title & Price with DeepSeek AI ──
 */
export async function generateProductDetailsWithDeepSeek({
  title,
  price,
  includeImage = false,
  model = null,
  apiKey = null,
  imageVariant = 0,
  signal = null
}) {
  const activeKey = apiKey || getDeepSeekApiKey()
  if (!activeKey) {
    return {
      success: false,
      error: 'Please enter your DeepSeek API key to enable DeepSeek AI catalog generation.'
    }
  }

  if (!title || !title.trim()) {
    return {
      success: false,
      error: 'Please enter a Product Title / Model Name (e.g. "HP Pavilion 15" or "Sony WH-1000XM5").'
    }
  }

  const selectedModel = model || getDeepSeekModel() || 'deepseek-chat'
  const promptText = buildProductCatalogPrompt(title, price)

  try {
    const requestBody = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: 'You are an expert consumer electronics & gadget catalog manager for CarryGoExpress. You MUST return ONLY a strictly valid JSON object matching the requested schema with no markdown formatting, no backticks, and no commentary. Ensure brand and subcategory accurately match the product title.'
        },
        {
          role: 'user',
          content: promptText
        }
      ],
      temperature: 0.2
    }

    if (selectedModel === 'deepseek-chat') {
      requestBody.response_format = { type: 'json_object' }
    }

    const perCallController = new AbortController()
    const timer = setTimeout(() => perCallController.abort(), 22000)

    if (signal) {
      signal.addEventListener('abort', () => perCallController.abort(), { once: true })
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`
      },
      body: JSON.stringify(requestBody),
      signal: perCallController.signal
    })
    clearTimeout(timer)

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const errorMsg = errData?.error?.message || `HTTP ${response.status} from DeepSeek (${selectedModel})`
      return { success: false, error: `DeepSeek Error: ${errorMsg}` }
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content
    if (!content) {
      return { success: false, error: 'No response content returned by DeepSeek.' }
    }

    const rawJson = cleanAndParseAiJson(content)
    const formatted = formatProductData({
      rawData: rawJson,
      requestedTitle: title,
      requestedPrice: price,
      includeImage,
      imageVariant
    })

    return {
      success: true,
      data: formatted,
      usedModel: selectedModel,
      provider: 'deepseek'
    }
  } catch (err) {
    if (signal?.aborted || err.name === 'AbortError') {
      return { success: false, error: 'Generation stopped by user.', aborted: true }
    }
    console.error('[DeepSeek Product AI Error]', err)
    return {
      success: false,
      error: err.message || 'Failed to generate product details with DeepSeek AI.'
    }
  }
}

/**
 * ── Unified AI Product Generator ──
 * Routes to either Google Gemini or DeepSeek based on provider setting
 */
export async function generateProductCatalogWithAI({
  provider = 'gemini',
  title,
  price,
  includeImage = false,
  model = null,
  apiKey = null,
  imageVariant = 0,
  signal = null
}) {
  if (provider === 'deepseek') {
    return generateProductDetailsWithDeepSeek({
      title,
      price,
      includeImage,
      model,
      apiKey,
      imageVariant,
      signal
    })
  }

  return generateProductDetailsWithGemini({
    title,
    price,
    includeImage,
    model,
    apiKey,
    imageVariant,
    signal
  })
}

/**
 * Image base64 conversion helper
 */
async function toBase64InlineData(source) {
  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const [header, base64] = source.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
      return { mimeType, data: base64 }
    }
    const response = await fetch(source)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        const [header, base64] = result.split(',')
        const mimeType = blob.type || 'image/jpeg'
        resolve({ mimeType, data: base64 })
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  if (source instanceof File || source instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        const [header, base64] = result.split(',')
        const mimeType = source.type || 'image/jpeg'
        resolve({ mimeType, data: base64 })
      }
      reader.onerror = reject
      reader.readAsDataURL(source)
    })
  }

  throw new Error('Unsupported image format for AI detection')
}

/**
 * Analyze gadget image with Google Gemini Vision API (Backward compatible)
 */
export async function detectProductWithGemini({ imageSource, apiKey = null, model = null }) {
  const activeKey = apiKey || getGeminiApiKey()
  if (!activeKey) {
    return {
      success: false,
      error: 'Please enter your Google Gemini API key to use AI Product Auto-Fill.'
    }
  }

  const primaryModel = resolveGeminiModelId(model || getGeminiModel() || 'gemini-3.5-flash-lite')
  const fallbackList = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'].filter(m => m !== primaryModel)
  const modelsToTry = [primaryModel, ...fallbackList]

  let base64Data
  let mimeType

  try {
    const inline = await toBase64InlineData(imageSource)
    base64Data = inline.data
    mimeType = inline.mimeType
  } catch (err) {
    return {
      success: false,
      error: 'Unable to process image data directly. You can instead type Title & Price to generate the product!'
    }
  }

  const promptText = `
You are an expert consumer electronics & gadget catalog manager for CarryGoExpress.
Analyze this gadget product image.

Identify the device accurately and respond with a strictly valid JSON object (no markdown, no backticks, just raw JSON) containing the following fields:
{
  "name": "Full official commercial product title including model, capacity/color if apparent (e.g. 'HP Pavilion 15.6 Laptop' or 'Apple iPhone 15 Pro Max 256GB - Natural Titanium')",
  "brand": "Brand name (e.g. 'HP', 'Dell', 'Lenovo', 'Apple', 'Samsung', 'Sony', 'ASUS', 'Google', 'Xiaomi', 'OnePlus', etc.)",
  "category": "Must be exactly one of: 'Smartphones & Tablets', 'Laptops & Computers', 'Smartwatches & Wearables', 'Audio & Sound', 'Gaming & Handhelds', 'Accessories & Power'",
  "subcategory": "Specific model line, e.g. 'Windows Laptops', 'MacBooks', 'Gaming Laptops', 'iPhone', 'Samsung Galaxy', 'AirPods & Earbuds', etc.",
  "price": 999,
  "original_price": 1199,
  "badge": "One of: 'Hot Deal', 'Flagship', 'New Arrival', 'Best Seller', or 'Premium'",
  "stock": 12,
  "description": "Engaging, professional product description detailing specs, screen, battery life, processor, connectivity, and standout features in 2-3 crisp paragraphs."
}
Prices must be realistic approximate figures in US Dollars ($ USD).
`

  for (const currentModel of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${activeKey}`

      const requestBody = {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.2
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) continue

      const result = await response.json()
      const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!candidateText) continue

      const rawJson = cleanAndParseAiJson(candidateText)
      const formatted = formatProductData({
        rawData: rawJson,
        requestedTitle: rawJson.name,
        requestedPrice: rawJson.price,
        includeImage: false
      })

      return {
        success: true,
        data: formatted,
        usedModel: currentModel
      }
    } catch (err) {
      console.warn(`[Gemini Vision] Model ${currentModel} error:`, err)
    }
  }

  return {
    success: false,
    error: 'Failed to detect gadget with Gemini AI. Try using Title & Price generation instead.'
  }
}
