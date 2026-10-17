import { useState } from 'react'
import { 
  Search, Plus, Edit, Trash2, Eye, Package, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Sparkles, ArrowUpDown,
  Upload, Image as ImageIcon, Loader2, Key, HelpCircle, Check, Tag, Cpu
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { uploadProductImage } from '../../lib/supabase'
import { formatPrice } from '../../lib/utils'
import { 
  GADGET_CATEGORIES, 
  GADGET_BRANDS, 
  getSubcategoriesForCategory, 
  getAllCategoryNames 
} from '../../lib/gadgetCategories'
import { 
  detectProductWithGemini, 
  getGeminiApiKey, 
  saveGeminiApiKey 
} from '../../lib/geminiProductVision'

export default function AdminProducts() {
  const { 
    products, 
    addProduct, 
    editProduct, 
    removeProduct, 
    adjustStock, 
    seedStarterCatalog, 
    isLoading 
  } = useAdminStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // Gemini AI Vision state
  const [geminiKeyModalOpen, setGeminiKeyModalOpen] = useState(false)
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey())
  const [analyzingWithGemini, setAnalyzingWithGemini] = useState(false)
  const [aiSuccessMsg, setAiSuccessMsg] = useState(null)
  const [aiErrorMsg, setAiErrorMsg] = useState(null)

  // Product Form state
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Smartphones & Tablets',
    subcategory: 'iPhone',
    brand: 'Apple',
    price: '',
    original_price: '',
    stock: 10,
    status: 'active',
    image: '',
    badge: 'New Arrival',
    description: ''
  })

  const availableSubcategories = getSubcategoriesForCategory(form.category)

  // Filtered Products
  const filteredProducts = products.filter(product => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = 
      (product.name || '').toLowerCase().includes(q) ||
      (product.sku || '').toLowerCase().includes(q) ||
      (product.brand || '').toLowerCase().includes(q) ||
      (product.category || '').toLowerCase().includes(q) ||
      (product.subcategory || '').toLowerCase().includes(q)

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesSubcategory = subcategoryFilter === 'all' || product.subcategory === subcategoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter

    return matchesSearch && matchesCategory && matchesSubcategory && matchesStatus
  })

  const openAddModal = () => {
    setEditingProduct(null)
    setAiSuccessMsg(null)
    setAiErrorMsg(null)
    setForm({
      name: '',
      sku: `CGO-GDT-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Smartphones & Tablets',
      subcategory: 'iPhone',
      brand: 'Apple',
      price: '',
      original_price: '',
      stock: 12,
      status: 'active',
      image: '',
      badge: 'New Arrival',
      description: ''
    })
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setAiSuccessMsg(null)
    setAiErrorMsg(null)
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || 'Smartphones & Tablets',
      subcategory: product.subcategory || (getSubcategoriesForCategory(product.category)[0] || ''),
      brand: product.brand || 'CarryGoExpress',
      price: product.price || '',
      original_price: product.original_price || '',
      stock: product.stock ?? 10,
      status: product.status || 'active',
      image: product.image || '',
      badge: product.badge || '',
      description: product.description || ''
    })
    setUploadError(null)
    setShowModal(true)
  }

  const handleCategoryChange = (newCategory) => {
    const subs = getSubcategoriesForCategory(newCategory)
    setForm(prev => ({
      ...prev,
      category: newCategory,
      subcategory: subs[0] || ''
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setUploadError(null)

    const { url, error } = await uploadProductImage(file)
    if (error) {
      setUploadError(error)
    } else if (url) {
      setForm(prev => ({ ...prev, image: url }))
    }
    setUploadingImage(false)
  }

  // ── Gemini AI Auto-Fill Action ──────────────────────────────────────────────
  const handleGeminiAutoFill = async () => {
    setAiErrorMsg(null)
    setAiSuccessMsg(null)

    if (!form.image) {
      setAiErrorMsg('Please provide or upload a gadget product image first.')
      return
    }

    const currentKey = getGeminiApiKey()
    if (!currentKey) {
      setGeminiKeyModalOpen(true)
      return
    }

    setAnalyzingWithGemini(true)

    const result = await detectProductWithGemini({
      imageSource: form.image,
      apiKey: currentKey
    })

    if (!result.success) {
      setAiErrorMsg(result.error)
      if (result.error?.toLowerCase().includes('api key')) {
        setGeminiKeyModalOpen(true)
      }
    } else {
      const detected = result.data
      setForm(prev => {
        const nextCat = detected.category || prev.category
        const validSubs = getSubcategoriesForCategory(nextCat)
        const matchedSub = validSubs.find(s => s.toLowerCase() === (detected.subcategory || '').toLowerCase()) || validSubs[0] || detected.subcategory

        return {
          ...prev,
          name: detected.name || prev.name,
          brand: detected.brand || prev.brand,
          category: nextCat,
          subcategory: matchedSub || prev.subcategory,
          price: detected.price !== undefined ? detected.price : prev.price,
          original_price: detected.original_price !== undefined ? detected.original_price : prev.original_price,
          badge: detected.badge || prev.badge,
          stock: detected.stock !== undefined ? detected.stock : prev.stock,
          description: detected.description || prev.description
        }
      })
      setAiSuccessMsg('✨ Gadget detected! Title, specs, category, and pricing auto-filled by Gemini AI. You can freely adjust any field.')
    }

    setAnalyzingWithGemini(false)
  }

  const handleSaveGeminiKey = (e) => {
    e.preventDefault()
    saveGeminiApiKey(geminiKeyInput)
    setGeminiKeyModalOpen(false)
    if (geminiKeyInput.trim() && form.image) {
      handleGeminiAutoFill()
    }
  }

  // ── Product Save Submission ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) return
    setSubmitting(true)

    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      subcategory: form.subcategory || null,
      brand: form.brand || 'CarryGoExpress',
      price: parseFloat(form.price) || 0,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      stock: parseInt(form.stock) || 0,
      in_stock: (parseInt(form.stock) || 0) > 0,
      status: form.status,
      image: form.image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
      badge: form.badge || null,
      description: form.description
    }

    if (editingProduct) {
      await editProduct(editingProduct.id, payload)
    } else {
      await addProduct(payload)
    }

    setSubmitting(false)
    setShowModal(false)
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete gadget "${name}" permanently from Supabase database?`)) {
      await removeProduct(id)
    }
  }

  const toggleStatus = async (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active'
    await editProduct(product.id, { status: nextStatus })
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'inactive': return 'bg-veltrix-gray-800 text-veltrix-gray-400 border-veltrix-gray-700'
      case 'out_of_stock': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-veltrix-gray-800 text-veltrix-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white">Gadget Storefront Catalog</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-veltrix-blue/20 text-veltrix-blue border border-veltrix-blue/30">
              Electronics & Tech
            </span>
          </div>
          <p className="text-sm text-veltrix-gray-400 mt-1">
            Realtime database stream of smartphones, laptops, audio, wearables & gaming gadgets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setGeminiKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-500/20 transition-all"
            title="Configure Google Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Gemini AI Key</span>
            {getGeminiApiKey() ? (
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            )}
          </button>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-veltrix-blue text-veltrix-black font-bold rounded-xl text-xs sm:text-sm shadow-glow hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Gadget
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: 'Gadgets in Store', value: products.length, icon: Package, color: 'blue' },
          { label: 'Active on Storefront', value: products.filter(p => p.status === 'active').length, icon: CheckCircle, color: 'green' },
          { label: 'Low Stock (≤5)', value: products.filter(p => (p.stock !== undefined && p.stock <= 5 && p.stock > 0)).length, icon: AlertTriangle, color: 'yellow' },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0 || p.in_stock === false).length, icon: XCircle, color: 'red' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/60 p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  stat.color === 'blue' ? 'bg-veltrix-blue/20 text-veltrix-blue' :
                  stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  stat.color === 'red' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-veltrix-gray-400 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-black text-white truncate">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters (Search + Gadget Categories + Subcategories) */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gadgets by name, model, brand (iPhone, Galaxy, MacBook)..."
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 text-xs sm:text-sm focus:border-veltrix-blue focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
          {/* Main Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setSubcategoryFilter('all')
            }}
            className="w-full px-3 py-2.5 sm:py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Categories</option>
            {GADGET_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>

          {/* Subcategory */}
          <select
            value={subcategoryFilter}
            onChange={(e) => setSubcategoryFilter(e.target.value)}
            disabled={categoryFilter === 'all'}
            className="w-full px-3 py-2.5 sm:py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none disabled:opacity-40"
          >
            <option value="all">All Sub-categories</option>
            {categoryFilter !== 'all' && getSubcategoriesForCategory(categoryFilter).map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 sm:py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table (Desktop) & Cards (Mobile) */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 overflow-hidden shadow-xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-3">
                <th className="px-6 py-4">Gadget Details</th>
                <th className="px-6 py-4">Category & Sub-category</th>
                <th className="px-6 py-4">SKU / Code</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Inventory Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veltrix-gray-800/40">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-veltrix-gray-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={product.image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100'} 
                        alt={product.name} 
                        className="w-12 h-12 object-cover rounded-xl bg-veltrix-black border border-veltrix-gray-800 shrink-0" 
                      />
                      <div className="min-w-0 max-w-xs">
                        <p className="font-bold text-white text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-veltrix-gray-400">Brand: {product.brand || 'CarryGo'}</span>
                          {product.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-veltrix-blue/20 text-veltrix-blue border border-veltrix-blue/30">
                              {product.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{product.category}</p>
                    {product.subcategory && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-veltrix-gray-800/80 text-veltrix-blue rounded-md text-[10px] font-mono border border-veltrix-gray-700">
                        ↳ {product.subcategory}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 font-mono text-veltrix-gray-400">
                    {product.sku || 'N/A'}
                  </td>

                  <td className="px-6 py-4 font-bold text-white text-sm">
                    {formatPrice(product.price)}
                    {product.original_price && (
                      <span className="block text-[11px] text-veltrix-gray-500 line-through">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustStock(product.id, -1)}
                        className="w-6 h-6 bg-veltrix-black border border-veltrix-gray-700 rounded flex items-center justify-center text-veltrix-gray-400 hover:text-white"
                        title="Decrease stock by 1"
                      >
                        -
                      </button>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                        (product.stock ?? 0) <= 5 ? 'text-red-400 bg-red-500/10' : 'text-white'
                      }`}>
                        {product.stock ?? 10}
                      </span>
                      <button
                        onClick={() => adjustStock(product.id, 1)}
                        className="w-6 h-6 bg-veltrix-black border border-veltrix-gray-700 rounded flex items-center justify-center text-veltrix-gray-400 hover:text-white"
                        title="Increase stock by 1"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleStatus(product)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${getStatusColor(product.status)}`}
                      title="Click to toggle status"
                    >
                      {product.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-2 text-veltrix-gray-400 hover:text-veltrix-blue hover:bg-veltrix-blue/10 rounded-lg transition-all"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-2 text-veltrix-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Product Cards View */}
        <div className="block md:hidden divide-y divide-veltrix-gray-800">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <img 
                  src={product.image || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100'} 
                  alt={product.name} 
                  className="w-16 h-16 object-cover rounded-xl bg-veltrix-black border border-veltrix-gray-800 shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{product.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 bg-veltrix-gray-800 text-[10px] text-veltrix-gray-300 rounded font-medium">
                      {product.category}
                    </span>
                    {product.subcategory && (
                      <span className="px-1.5 py-0.5 bg-veltrix-blue/10 text-[10px] text-veltrix-blue rounded font-mono">
                        {product.subcategory}
                      </span>
                    )}
                  </div>
                  <p className="font-black text-white text-sm mt-1">{formatPrice(product.price)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                {/* Stock Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-[11px] text-veltrix-gray-400">Stock:</span>
                  <button
                    onClick={() => adjustStock(product.id, -1)}
                    className="w-7 h-7 bg-veltrix-black border border-veltrix-gray-700 rounded-lg flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-white px-1">
                    {product.stock ?? 10}
                  </span>
                  <button
                    onClick={() => adjustStock(product.id, 1)}
                    className="w-7 h-7 bg-veltrix-black border border-veltrix-gray-700 rounded-lg flex items-center justify-center text-white active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => toggleStatus(product)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${getStatusColor(product.status)}`}
                >
                  {product.status}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openEditModal(product)}
                    className="p-1.5 text-veltrix-gray-400 hover:text-white rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id, product.name)}
                    className="p-1.5 text-veltrix-gray-400 hover:text-red-400 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-veltrix-gray-500">
            No gadgets found matching filters. Click <strong>Add New Gadget</strong> to create one.
          </div>
        )}
      </div>

      {/* Add / Edit Gadget Modal with Gemini AI Product Vision */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 shadow-2xl max-h-[88dvh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-veltrix-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingProduct ? 'Edit Gadget Details' : 'Add New Gadget to Storefront'}
                </h2>
                <p className="text-xs text-veltrix-gray-400 mt-0.5">
                  Synchronizes directly with Supabase database and real-time storefront.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-veltrix-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* ── Gemini AI Assistant Callout ── */}
              <div className="p-4 bg-gradient-to-r from-purple-500/15 via-veltrix-blue/10 to-transparent border border-purple-500/30 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Gemini AI Product Vision</span>
                        <span className="text-[10px] font-normal px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                          Auto-Detector
                        </span>
                      </h4>
                      <p className="text-[11px] text-veltrix-gray-400">
                        Upload or paste a gadget image to auto-detect title, category, subcategory, specs & pricing.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGeminiKeyModalOpen(true)}
                      className="px-2.5 py-1.5 bg-veltrix-black/60 border border-veltrix-gray-700 text-veltrix-gray-300 hover:text-white rounded-lg text-xs flex items-center gap-1"
                    >
                      <Key className="w-3 h-3 text-yellow-400" />
                      <span>API Key</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGeminiAutoFill}
                      disabled={analyzingWithGemini || !form.image}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-500 to-veltrix-blue text-white font-bold text-xs rounded-lg hover:shadow-glow transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {analyzingWithGemini ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Detecting Specs...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>✨ Auto-Fill with Gemini</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Alerts */}
                {aiSuccessMsg && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-xs text-green-300 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{aiSuccessMsg}</span>
                  </div>
                )}
                {aiErrorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{aiErrorMsg}</span>
                  </div>
                )}
              </div>

              {/* ── Product Image Upload & Live Preview ── */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-veltrix-gray-300 flex items-center justify-between">
                  <span>Gadget Image (Supabase Storage or Web URL) *</span>
                  {uploadingImage && (
                    <span className="text-veltrix-blue flex items-center gap-1 text-[11px]">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Supabase...
                    </span>
                  )}
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={form.image}
                    onChange={e => setForm({ ...form, image: e.target.value })}
                    className="input-field text-xs flex-1"
                    placeholder="https://... or upload photo directly"
                  />

                  <label className="px-4 py-2.5 bg-veltrix-gray-800 hover:bg-veltrix-blue hover:text-black rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0 border border-veltrix-gray-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadError && (
                  <p className="text-xs text-red-400">{uploadError}</p>
                )}

                {form.image && (
                  <div className="flex items-center gap-3 p-2 bg-veltrix-black rounded-xl border border-veltrix-gray-800">
                    <img 
                      src={form.image} 
                      alt="Product preview" 
                      className="w-14 h-14 object-cover rounded-lg border border-veltrix-gray-700" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">{form.image}</p>
                      <p className="text-[10px] text-green-400">Live preview ready — click Auto-Fill with Gemini to detect</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Form Inputs ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Product Title / Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field text-sm font-semibold"
                    placeholder="e.g. Apple iPhone 15 Pro Max 256GB - Natural Titanium"
                  />
                </div>

                {/* Main Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Gadget Category *</label>
                  <select
                    value={form.category}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="input-field text-sm"
                  >
                    {GADGET_CATEGORIES.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Sub-Category *</label>
                  <select
                    value={form.subcategory}
                    onChange={e => setForm({ ...form, subcategory: e.target.value })}
                    className="input-field text-sm"
                  >
                    {availableSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Brand</label>
                  <input
                    type="text"
                    list="brand-suggestions"
                    value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Apple, Samsung, Sony..."
                  />
                  <datalist id="brand-suggestions">
                    {GADGET_BRANDS.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">SKU / Code</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    className="input-field text-sm font-mono"
                    placeholder="CGO-GDT-1001"
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-veltrix-gray-300">Selling Price ($) *</label>
                    <span className="text-[10px] text-veltrix-blue font-medium">You can choose/adjust anytime</span>
                  </div>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="input-field text-sm font-bold text-white"
                    placeholder="e.g. 999"
                  />
                </div>

                {/* Original Price */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Original List Price ($) (Optional)</label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={e => setForm({ ...form, original_price: e.target.value })}
                    className="input-field text-sm"
                    placeholder="e.g. 1199"
                  />
                </div>

                {/* Stock Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Stock Inventory Units</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="input-field text-sm"
                    placeholder="10"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Storefront Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="active">Active (Visible to Shoppers)</option>
                    <option value="inactive">Inactive (Draft / Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Badge */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-veltrix-gray-300">Marketing Badge (Optional)</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={e => setForm({ ...form, badge: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Flagship, Best Seller, Hot Deal, New Arrival"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-veltrix-gray-300">Technical Specifications & Description</label>
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-field text-sm resize-none leading-relaxed"
                  placeholder="Display type, processor, battery capacity, cameras, RAM/Storage, included accessories, and warranty terms..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-veltrix-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-veltrix-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-veltrix-blue text-veltrix-black font-bold rounded-xl text-xs shadow-glow hover:scale-105 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving to Database...' : editingProduct ? 'Save Gadget Updates' : 'Add Gadget to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Gemini API Key Configuration Modal ── */}
      {geminiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 shadow-2xl p-4 sm:p-6 space-y-4 animate-fade-in max-h-[88dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-veltrix-gray-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">Google Gemini AI Setup</h3>
              </div>
              <button 
                onClick={() => setGeminiKeyModalOpen(false)}
                className="text-veltrix-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-veltrix-gray-400 leading-relaxed">
              Enter your Google Gemini API key to enable instant AI gadget photo recognition and automatic metadata extraction.
            </p>

            <form onSubmit={handleSaveGeminiKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-veltrix-gray-300">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={e => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="input-field text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 text-[11px] text-veltrix-gray-400 space-y-1">
                <p className="font-semibold text-white flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-veltrix-blue" />
                  Don't have a Gemini API key?
                </p>
                <p>
                  You can get a free key in 30 seconds at Google AI Studio:
                </p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-veltrix-blue hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  https://aistudio.google.com/app/apikey ↗
                </a>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGeminiKeyModalOpen(false)}
                  className="px-4 py-2 text-xs text-veltrix-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-veltrix-blue text-white font-bold rounded-xl text-xs hover:shadow-glow transition-all"
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
