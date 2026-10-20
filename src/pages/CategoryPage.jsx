import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  ChevronRight, Search, Grid3X3, List,
  ArrowUpDown, Package, X, ArrowLeft, Filter,
  Layers, ShoppingBag
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
  { value: 'created_at:desc', label: 'Newest Arrivals' },
  { value: 'name:asc',        label: 'Name A–Z' },
  { value: 'price:asc',       label: 'Price: Low to High' },
  { value: 'price:desc',      label: 'Price: High to Low' },
  { value: 'rating:desc',     label: 'Top Rated' },
]

export default function CategoryPage() {
  const { category: paramSlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const queryCategory = searchParams.get('category') || ''
  const querySubcategory = searchParams.get('subcategory') || 'all'
  const querySearch = searchParams.get('search') || ''

  const effectiveCategory = queryCategory || paramSlug || ''
  const normalizedSlug = effectiveCategory.toLowerCase().trim()

  const meta = GADGET_CATEGORY_DETAILS[normalizedSlug] || {
    label: effectiveCategory 
      ? (GADGET_CATEGORIES.find(c => c.name.toLowerCase() === effectiveCategory.toLowerCase())?.name || effectiveCategory)
      : 'All Gadgets',
    description: effectiveCategory
      ? 'Explore genuine CarryGoExpress electronics & gadgets with manufacturer warranty and express insured delivery.'
      : 'Browse our complete catalog of brand-new smartphones, laptops, audio gear, wearables, gaming consoles, and accessories.',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200',
  }

  const [selectedSubcategory, setSelectedSubcategory] = useState(querySubcategory)
  const [sort, setSort] = useState('created_at:desc')
  const [search, setSearch] = useState(querySearch)
  const [viewMode, setViewMode] = useState('grid')

  // Keep state synced with URL changes
  useEffect(() => {
    setSelectedSubcategory(querySubcategory)
  }, [querySubcategory])

  useEffect(() => {
    setSearch(querySearch)
  }, [querySearch])

  const handleSelectCategory = (catName) => {
    const newParams = new URLSearchParams()
    if (catName) {
      newParams.set('category', catName)
    }
    if (search.trim()) {
      newParams.set('search', search.trim())
    }
    setSearchParams(newParams)
    setSelectedSubcategory('all')
  }

  const handleSelectSubcategory = (sub) => {
    const newParams = new URLSearchParams(searchParams)
    if (sub && sub !== 'all') {
      newParams.set('subcategory', sub)
    } else {
      newParams.delete('subcategory')
    }
    setSearchParams(newParams)
    setSelectedSubcategory(sub)
  }

  const isAllProductsView = meta.label === 'All Gadgets' || !effectiveCategory
  const availableSubcategories = !isAllProductsView ? getSubcategoriesForCategory(meta.label) : []

  const sortParts = sort.split(':')
  const { products, loading, error, totalCount, refetch } = useProducts({
    category: !isAllProductsView ? meta.label : undefined,
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
              <button 
                onClick={() => handleSelectCategory('')} 
                className={`transition-colors ${isAllProductsView ? 'text-veltrix-blue font-semibold' : 'hover:text-white'}`}
              >
                All Products
              </button>
              {!isAllProductsView && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-veltrix-blue font-semibold">{meta.label}</span>
                </>
              )}
              {selectedSubcategory !== 'all' && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-white font-mono">{selectedSubcategory}</span>
                </>
              )}
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">
              {isAllProductsView ? 'All Gadgets & Electronics' : meta.label}
            </h1>
            <p className="text-sm sm:text-base text-veltrix-gray-300">
              {meta.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Category Filter Bar (All Products + Available Categories) ─────── */}
        <div className="mb-8 p-5 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-veltrix-blue" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Browse by Category</span>
            </div>
            {!isAllProductsView && (
              <button
                onClick={() => handleSelectCategory('')}
                className="text-xs text-veltrix-blue hover:underline flex items-center gap-1 font-semibold"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                View All Catalog
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSelectCategory('')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isAllProductsView
                  ? 'bg-veltrix-blue text-veltrix-black shadow-glow'
                  : 'bg-veltrix-black border border-veltrix-gray-800 text-veltrix-gray-300 hover:border-veltrix-gray-700 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              All Products ({totalCount})
            </button>

            {GADGET_CATEGORIES.map(cat => {
              const isSelected = meta.label === cat.name
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.name)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-veltrix-blue text-veltrix-black font-bold shadow-glow'
                      : 'bg-veltrix-black border border-veltrix-gray-800 text-veltrix-gray-300 hover:border-veltrix-gray-700 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>

          {/* ── Subcategory Dive-In Chips (When a category is active) ── */}
          {availableSubcategories.length > 0 && (
            <div className="mt-5 pt-4 border-t border-veltrix-gray-800/80">
              <div className="flex items-center gap-2 mb-2.5">
                <Filter className="w-3.5 h-3.5 text-veltrix-blue" />
                <span className="text-[11px] font-bold text-veltrix-gray-400 uppercase tracking-wider">
                  Sub-Categories for {meta.label}:
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectSubcategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubcategory === 'all'
                      ? 'bg-veltrix-blue/20 border border-veltrix-blue text-veltrix-blue font-bold'
                      : 'bg-veltrix-black border border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white'
                  }`}
                >
                  All {meta.label}
                </button>

                {availableSubcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => handleSelectSubcategory(sub)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedSubcategory === sub
                        ? 'bg-veltrix-blue/20 border border-veltrix-blue text-veltrix-blue font-bold'
                        : 'bg-veltrix-black border border-veltrix-gray-800 text-veltrix-gray-400 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => {
                const val = e.target.value
                setSearch(val)
                const newParams = new URLSearchParams(searchParams)
                if (val.trim()) newParams.set('search', val.trim())
                else newParams.delete('search')
                setSearchParams(newParams)
              }}
              placeholder={`Search products in ${isAllProductsView ? 'all gadgets' : meta.label}...`}
              className="w-full pl-10 pr-10 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 focus:outline-none focus:border-veltrix-blue transition-colors text-sm"
            />
            {search && (
              <button 
                onClick={() => {
                  setSearch('')
                  const newParams = new URLSearchParams(searchParams)
                  newParams.delete('search')
                  setSearchParams(newParams)
                }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-veltrix-gray-500 hover:text-white"
              >
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
          <div>
            <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 bg-veltrix-blue/10 border border-veltrix-blue/20 rounded-xl text-veltrix-blue text-xs w-fit mx-auto animate-pulse">
              <span className="w-2 h-2 rounded-full bg-veltrix-blue animate-ping" />
              Loading gadgets from store catalog...
            </div>
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
          </div>
        ) : error && products.length === 0 ? (
          <div className="text-center py-20 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 p-8">
            <p className="text-red-400 mb-2">Error connecting to database.</p>
            <p className="text-sm text-veltrix-gray-500 mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-veltrix-blue text-veltrix-black font-semibold text-xs rounded-xl"
            >
              Retry Connection
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 p-12">
            <Package className="w-16 h-16 text-veltrix-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Products Found</h3>
            <p className="text-veltrix-gray-400 text-sm max-w-md mx-auto mb-6">
              {search 
                ? `No gadgets matched your search for "${search}".` 
                : `There are currently no listed gadgets in ${meta.label} ${selectedSubcategory !== 'all' ? `(${selectedSubcategory})` : ''}.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {(search || selectedSubcategory !== 'all' || !isAllProductsView) && (
                <button
                  onClick={() => {
                    handleSelectCategory('')
                    setSearch('')
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-veltrix-blue text-veltrix-black font-semibold rounded-xl hover:shadow-glow transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  View All Products & Gadgets
                </button>
              )}
            </div>
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

