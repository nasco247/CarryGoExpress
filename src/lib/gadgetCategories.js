// ── Centralized Gadget Store Category & Subcategory Taxonomy ──
// Tailored exclusively for modern electronics, smartphones, laptops, audio & wearables

export const GADGET_CATEGORIES = [
  {
    id: 'phones-tablets',
    name: 'Smartphones & Tablets',
    shortName: 'Phones',
    icon: 'Smartphone',
    subcategories: [
      'iPhone',
      'Samsung Galaxy',
      'Google Pixel',
      'Xiaomi & Redmi',
      'OnePlus',
      'iPads',
      'Android Tablets'
    ]
  },
  {
    id: 'laptops-computers',
    name: 'Laptops & Computers',
    shortName: 'Laptops',
    icon: 'Laptop',
    subcategories: [
      'MacBooks',
      'Windows Laptops',
      'Gaming Laptops',
      'Ultrabooks',
      'Workstations & Mini PCs',
      'High-Refresh Monitors'
    ]
  },
  {
    id: 'smartwatches-wearables',
    name: 'Smartwatches & Wearables',
    shortName: 'Wearables',
    icon: 'Watch',
    subcategories: [
      'Apple Watch',
      'Galaxy Watch',
      'Garmin & Sports',
      'Fitness Trackers',
      'Smart Glasses'
    ]
  },
  {
    id: 'audio-sound',
    name: 'Audio & Sound',
    shortName: 'Audio',
    icon: 'Headphones',
    subcategories: [
      'AirPods & Earbuds',
      'Noise Cancelling Headphones',
      'Bluetooth Speakers',
      'Soundbars & Subwoofers',
      'Studio Microphones'
    ]
  },
  {
    id: 'gaming-consoles',
    name: 'Gaming & Handhelds',
    shortName: 'Gaming',
    icon: 'Gamepad2',
    subcategories: [
      'PlayStation 5',
      'Xbox Series X|S',
      'Nintendo Switch',
      'Steam Deck & Handhelds',
      'VR Headsets & Gear'
    ]
  },
  {
    id: 'gadget-accessories',
    name: 'Accessories & Power',
    shortName: 'Accessories',
    icon: 'Zap',
    subcategories: [
      'MagSafe & Fast Chargers',
      'High Capacity Power Banks',
      'Protective Cases & Glass',
      'USB-C Docks & Hubs',
      'Cables & Adapters'
    ]
  }
]

export const GADGET_BRANDS = [
  'Apple',
  'Samsung',
  'Sony',
  'Dell',
  'HP',
  'Lenovo',
  'ASUS',
  'Google',
  'Xiaomi',
  'OnePlus',
  'Anker',
  'Bose',
  'Nintendo',
  'Microsoft',
  'CarryGoExpress'
]

export function getAllCategoryNames() {
  return GADGET_CATEGORIES.map(c => c.name)
}

export function getSubcategoriesForCategory(categoryName) {
  if (!categoryName) return []
  const found = GADGET_CATEGORIES.find(
    c => c.name.toLowerCase() === categoryName.toLowerCase() || 
         c.shortName.toLowerCase() === categoryName.toLowerCase()
  )
  return found ? found.subcategories : []
}

export function getAllSubcategories() {
  return GADGET_CATEGORIES.flatMap(c => c.subcategories)
}
