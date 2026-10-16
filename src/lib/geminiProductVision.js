// ── Gemini AI Vision & Product Auto-Fill Helper ──
// Allows Admin to supply a Google Gemini API Key and automatically detect product details from an image

const LOCAL_STORAGE_KEY = 'carrygo_gemini_api_key'

export function getGeminiApiKey() {
  return localStorage.getItem(LOCAL_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || ''
}

export function saveGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(LOCAL_STORAGE_KEY, key.trim())
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }
}

/**
 * Converts a file or URL to base64 inline data
 */
async function toBase64InlineData(source) {
  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const [header, base64] = source.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
      return { mimeType, data: base64 }
    }
    // Fetch image URL and convert to blob
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
 * Analyze gadget image with Google Gemini API
 */
export async function detectProductWithGemini({ imageSource, apiKey = null }) {
  const activeKey = apiKey || getGeminiApiKey()
  if (!activeKey) {
    return {
      success: false,
      error: 'Please enter your Google Gemini API key to use AI Product Auto-Fill.'
    }
  }

  try {
    const { mimeType, data: base64Data } = await toBase64InlineData(imageSource)

    const promptText = `
You are an expert consumer electronics & gadget catalog manager for CarryGoExpress.
Analyze this gadget product image.

Identify the device accurately and respond with a strictly valid JSON object (no markdown, no backticks, just raw JSON) containing the following fields:
{
  "name": "Full official commercial product title including model, capacity/color if apparent (e.g. 'Apple iPhone 15 Pro Max 256GB - Natural Titanium')",
  "brand": "Brand name (e.g. 'Apple', 'Samsung', 'Sony', 'Dell', 'Lenovo', 'ASUS', 'Google', 'Xiaomi', 'OnePlus', etc.)",
  "category": "Must be exactly one of: 'Smartphones & Tablets', 'Laptops & Computers', 'Smartwatches & Wearables', 'Audio & Sound', 'Gaming & Handhelds', 'Accessories & Power'",
  "subcategory": "Specific model line, e.g. 'iPhone', 'Samsung Galaxy', 'Google Pixel', 'MacBooks', 'Gaming Laptops', 'AirPods & Earbuds', 'PlayStation 5', etc.",
  "price": 1250000,
  "original_price": 1400000,
  "badge": "One of: 'Hot Deal', 'Flagship', 'New Arrival', 'Best Seller', or 'Premium'",
  "stock": 12,
  "description": "Engaging, professional product description detailing specs, screen, battery life, processor, connectivity, and standout features in 2-3 crisp paragraphs."
}
Prices must be realistic approximate figures in Nigerian Naira (NGN).
`

    // Try gemini-1.5-flash with fallback to gemini-1.5-pro or gemini-2.0-flash
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`

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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const msg = errData?.error?.message || `Gemini API returned status ${response.status}`
      return { success: false, error: msg }
    }

    const result = await response.json()
    const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!candidateText) {
      return { success: false, error: 'No content received from Gemini model.' }
    }

    // Clean potential markdown quotes
    const cleanedJson = candidateText.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(cleanedJson)

    return {
      success: true,
      data: parsedData
    }
  } catch (err) {
    console.error('[Gemini Product Vision Error]', err)
    return {
      success: false,
      error: err.message || 'Failed to detect product with Gemini AI.'
    }
  }
}
