import { useState } from 'react'
import { Filter, Grid3X3, LayoutList, SlidersHorizontal, ChevronDown } from 'lucide-react'
import ProductCard from './ProductCard'
import { useProducts } from '../hooks/useProducts'

const sortOptions = [
  { value: 'name:asc', label: 'Name: A-Z' },
  { value: 'name:desc', label: 'Name: Z-A' },
  { value: 'price:asc', label: 'Price: Low to High' },
  { value: 'price:desc', label: 'Price: High to Low' },
  { value: 'rating:desc', label: 'Highest Rated' },
]

export default function ProductGrid({ filters = {}, hideSidebar = false, hideHeader = false }) {
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('name:asc')
  const [showFilters, setShowFilters] = useState(false)

  const [priceRange, setPriceRange] = useState([0, 2000000])
  const [selectedBrands, setSelectedBrands] = useState(filters.brand ? [filters.brand] : [])
  const [selectedCategories, setSelectedCategories] = useState(filters.category ? [filters.category] : [])

  const { products, loading, error, totalCount } = useProducts({
    ...filters,
    brand: selectedBrands.length > 0 ? selectedBrands : undefined,
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sortBy: sortBy.split(':')[0],
    sortOrder: sortBy.split(':')[1]
  })

  const brands = ['Hisense', 'Samsung', 'LG', 'Sony']
  const categories = ['Televisions', 'Audio', 'Projectors', 'Monitors', 'Smart Home']

  return (
    <div className={`max-w-7xl mx-auto ${hideHeader ? '' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {filters.brand || filters.category || 'All Products'}
          </h1>
          <p className="text-sm text-veltrix-gray-500 mt-1">
            {totalCount} products found
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-veltrix-black-light rounded-lg border border-veltrix-gray-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-veltrix-blue text-veltrix-black' : 'text-veltrix-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-veltrix-blue text-veltrix-black' : 'text-veltrix-gray-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-veltrix-black-light border border-veltrix-gray-800 rounded-lg px-4 py-2.5 pr-10 text-sm text-white focus:border-veltrix-blue focus:outline-none cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500 pointer-events-none" />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-veltrix-black-light border border-veltrix-gray-800 rounded-lg text-sm text-white"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        {!hideSidebar && (
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0 space-y-8`}>
          {/* Price Range */}
          <div className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/50 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-veltrix-blue" />
              Price Range
            </h3>
            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="2000000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full accent-veltrix-blue"
              />
              <div className="flex items-center justify-between text-sm text-veltrix-gray-400">
                <span>₦{priceRange[0].toLocaleString()}</span>
                <span>₦{priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Brands */}
          <div className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/50 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Brands</h3>
            <div className="space-y-3">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBrands([...selectedBrands, brand])
                        } else {
                          setSelectedBrands(selectedBrands.filter(b => b !== brand))
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-veltrix-gray-700 rounded peer-checked:bg-veltrix-blue peer-checked:border-veltrix-blue transition-all" />
                    <svg className="absolute inset-0 w-5 h-5 text-veltrix-black opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-veltrix-gray-400 group-hover:text-white transition-colors">
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/50 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Categories</h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category])
                        } else {
                          setSelectedCategories(selectedCategories.filter(c => c !== category))
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-veltrix-gray-700 rounded peer-checked:bg-veltrix-blue peer-checked:border-veltrix-blue transition-all" />
                    <svg className="absolute inset-0 w-5 h-5 text-veltrix-black opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-veltrix-gray-400 group-hover:text-white transition-colors">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
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
            <div className="text-center py-20">
              <p className="text-veltrix-gray-400">Error loading products. Please try again.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-veltrix-gray-400 text-lg">No products found matching your criteria.</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
