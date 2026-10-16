import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  ChevronRight, Search, Grid3X3, List,
  ArrowUpDown, Package, X, ArrowLeft, Filter
} from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'
import { GADGET_CATEGORIES, getSubcategoriesForCategory } from '../lib/gadgetCategories'

const GADGET_CATEGORY_DETAILS = {
  'smartphones-tablets': {
    label: 'Smartphones & Tablets',
    description: 'Latest flagship iPhones, Samsung Galaxy, Google Pixel, and high-performance tablets with full warranty.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200',
  },
  phones: {
    label: 'Smartphones & Tablets',
    description: 'Latest flagship iPhones, Samsung Galaxy, Google Pixel, and high-performance tablets with full warranty.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200',
  },
  'laptops-computers': {
    label: 'Laptops & Computers',
    description: 'Apple MacBooks, high-FPS gaming rigs, ultrabooks and creative workstation laptops.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200',
  },
  laptops: {
    label: 'Laptops & Computers',
    description: 'Apple MacBooks, high-FPS gaming rigs, ultrabooks and creative workstation laptops.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200',
  },
  'smartwatches-wearables': {
    label: 'Smartwatches & Wearables',
    description: 'Apple Watch Series, Galaxy Watch, fitness trackers and smart eyewear to keep you connected.',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200',
  },
  wearables: {
    label: 'Smartwatches & Wearables',
    description: 'Apple Watch Series, Galaxy Watch, fitness trackers and smart eyewear to keep you connected.',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200',
  },
  'audio-sound': {
    label: 'Audio & Sound',
    description: 'Premium AirPods, noise-canceling headphones, punchy wireless speakers and sound systems.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
  },
  audio: {
    label: 'Audio & Sound',
    description: 'Premium AirPods, noise-canceling headphones, punchy wireless speakers and sound systems.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
  },
  'gaming-consoles': {
    label: 'Gaming & Handhelds',
    description: 'PlayStation 5 consoles, Xbox Series X|S, Nintendo Switch, and portable gaming gear.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200',
  },
  gaming: {
    label: 'Gaming & Handhelds',
    description: 'PlayStation 5 consoles, Xbox Series X|S, Nintendo Switch, and portable gaming gear.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=1200',
  },
  'accessories-power': {
    label: 'Accessories & Power',
    description: 'Fast GaN chargers, MagSafe gear, high-capacity power banks, cables and protective cases.',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200',
  },
  accessories: {
    label: 'Accessories & Power',
    description: 'Fast GaN chargers, MagSafe gear, high-capacity power banks, cables and protective cases.',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=1200',
  }
}

const SORT_OPTIONS = [
  { value: 'name:asc',    label: 'Name A–Z' },
  { value: 'price:asc',   label: 'Price: Low to High' },
  { value: 'price:desc',  label: 'Price: High to Low' },
  { value: 'rating:desc', label: 'Top Rated' },
]

export default function CategoryPage() {
  const { category: paramSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const queryCategory = searchParams.get('category')
  const querySubcategory = searchParams.get('subcategory')

  const effectiveCategory = queryCategory || paramSlug || ''
  const normalizedSlug = effectiveCategory.toLowerCase().trim()

  const meta = GADGET_CATEGORY_DETAILS[normalizedSlug] || {
    label: effectiveCategory 
      ? (GADGET_CATEGORIES.find(c => c.name.toLowerCase() === effectiveCategory.toLowerCase())?.name || effectiveCategory)
      : 'All Gadgets',
    description: 'Explore genuine CarryGoExpress electronics & gadgets with manufacturer warranty and express insured delivery.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200',
  }

  const [selectedSubcategory, setSelectedSubcategory] = useState(querySubcategory || 'all')
  const [sort, setSort] = useState('name:asc')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  const availableSubcategories = getSubcategoriesForCategory(meta.label)

  const sortParts = sort.split(':')
  const { products, loading, error, totalCount } = useProducts({
    category: meta.label !== 'All Gadgets' ? meta.label : undefined,
    subcategory: selectedSubcategory !== 'all' ? selectedSubcategory : undefined,
    sortBy: sortParts[0],
    sortOrder: sortParts[1],
    search: search.trim() || undefined,
  })

  return (
    <div className="pt-20 min-h-screen">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative h-64 lg:h-80 overflow-hidden">
        <img
          src={meta.image}
          alt={meta.label}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-veltrix-black via-veltrix-black/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-veltrix-black to-transparent" />

        <div className="absolute inset-0 flex items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-xl">
            <nav className="flex items-center gap-2 text-xs text-veltrix-gray-400 mb-3">
              <Link to="/" className="hover:text-veltrix-blue transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-veltrix-blue font-semibold">{meta.label}</span>
              {selectedSubcategory !== 'all' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-white font-mono">{selectedSubcategory}</span>
                </>
              )}
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
              {meta.label}
            </h1>
            <p className="text-sm sm:text-base text-veltrix-gray-300">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Subcategory Dive-In Chips (iPhone, Samsung Galaxy, etc.) ── */}
        {availableSubcategories.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-veltrix-blue" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Sub-Categories</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubcategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedSubcategory === 'all'
                    ? 'bg-veltrix-blue text-veltrix-black font-bold shadow-glow'
                    : 'bg-veltrix-black-light border border-veltrix-gray-800 text-veltrix-gray-300 hover:border-veltrix-gray-700'
                }`}
              >
                All {meta.label}
              </button>

              {availableSubcategories.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedSubcategory === sub
                      ? 'bg-veltrix-blue text-veltrix-black font-bold shadow-glow'
                      : 'bg-veltrix-black-light border border-veltrix-gray-800 text-veltrix-gray-300 hover:border-veltrix-gray-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search in ${meta.label}...`}
              className="w-full pl-10 pr-10 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-veltrix-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500 pointer-events-none" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none pl-9 pr-8 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-veltrix-blue cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* View mode */}
          <div className="hidden sm:flex items-center bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-veltrix-blue text-veltrix-black' : 'text-veltrix-gray-400 hover:text-white'}`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-veltrix-blue text-veltrix-black' : 'text-veltrix-gray-400 hover:text-white'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Product List from Supabase ────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/50 overflow-hidden animate-pulse">
                <div className="aspect-square bg-veltrix-gray-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-veltrix-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-veltrix-gray-800 rounded w-1/2" />
                  <div className="h-6 bg-veltrix-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 p-8">
            <p className="text-red-400 mb-2">Error connecting to database.</p>
            <p className="text-sm text-veltrix-gray-500">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 p-12">
            <Package className="w-16 h-16 text-veltrix-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Products Found</h3>
            <p className="text-veltrix-gray-400 text-sm max-w-md mx-auto mb-6">
              There are currently no listed gadgets in {meta.label} {selectedSubcategory !== 'all' ? `(${selectedSubcategory})` : ''}.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-veltrix-blue text-veltrix-black font-semibold rounded-xl hover:shadow-glow transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse All Gadgets
            </Link>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
