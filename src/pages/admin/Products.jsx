import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Search, Plus, Edit, Trash2, Eye, Package, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Sparkles, ArrowUpDown,
  Upload, Image as ImageIcon, Loader2, Key, HelpCircle, Check, Tag, Cpu, Radio,
  Maximize2, ExternalLink, Bot, Zap, RefreshCcw, Square, Wand2, DollarSign
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
  GEMINI_MODELS,
  DEEPSEEK_MODELS,
  generateProductCatalogWithAI,
  generateGadgetImageWithAI,
  detectProductWithGemini, 
  getGeminiApiKey, 
  saveGeminiApiKey,
  getGeminiModel,
  saveGeminiModel,
  resolveGeminiModelId,
  getDeepSeekApiKey,
  saveDeepSeekApiKey,
  getDeepSeekModel,
  saveDeepSeekModel,
  getAiProvider,
  saveAiProvider,
  getHighQualityGadgetImage,
  fetchAvailableGeminiModels
} from '../../lib/geminiProductVision'

const POPULAR_BRANDS = ['Apple', 'Samsung', 'HP', 'Dell', 'Lenovo', 'Sony', 'ASUS', 'Google', 'Xiaomi', 'Anker']
const BADGE_SUGGESTIONS = ['New Arrival', 'Hot Deal', 'Flagship', 'Best Seller', 'Premium', 'Top Rated']

export default function AdminProducts() {
  const { 
    products, 
    addProduct, 
    editProduct, 
    removeProduct, 
    adjustStock, 
    fetchDashboardData,
    isLoading 
  } = useAdminStore()

  // Always ensure fresh live products are fetched directly from Supabase on mount
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // Multi-Provider AI State & Model Selection (Google Gemini & DeepSeek)
  const [aiProvider, setAiProvider] = useState(getAiProvider())
  const [geminiKeyModalOpen, setGeminiKeyModalOpen] = useState(false)
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey())
  const [deepseekKeyInput, setDeepseekKeyInput] = useState(getDeepSeekApiKey())
  const [selectedGeminiModel, setSelectedGeminiModel] = useState(getGeminiModel())
  const [selectedDeepseekModel, setSelectedDeepseekModel] = useState(getDeepSeekModel())
  const [activeSetupTab, setActiveSetupTab] = useState('gemini') // 'gemini' | 'deepseek'
  const [availableGeminiModels, setAvailableGeminiModels] = useState(GEMINI_MODELS)
  const [generatingWithAi, setGeneratingWithAi] = useState(false)
  const [generatingImageWithAi, setGeneratingImageWithAi] = useState(false)
  const [aiSuccessMsg, setAiSuccessMsg] = useState(null)
  const [aiErrorMsg, setAiErrorMsg] = useState(null)
  const aiAbortControllerRef = useRef(null)
  const aiImageAbortControllerRef = useRef(null)

  // Image Preview Lightbox & Cycling
  const [previewImageModalOpen, setPreviewImageModalOpen] = useState(false)
  const [imageVariantIndex, setImageVariantIndex] = useState(0)

  // AI Prompt inputs (Title & Price only required from admin)
  const [aiTitle, setAiTitle] = useState('')
  const [aiPrice, setAiPrice] = useState('')
  const [aiIncludeImage, setAiIncludeImage] = useState(false) // Default: Off (generate details only)

  // Dynamically load available Gemini models from Google API
  useEffect(() => {
    fetchAvailableGeminiModels().then(models => {
      if (models && models.length > 0) {
        setAvailableGeminiModels(models)
        setSelectedGeminiModel(prev => {
          const resolved = resolveGeminiModelId(prev)
          if (!resolved || !models.some(m => m.id === resolved)) {
            const recommended = models.find(m => m.id === 'gemini-3.5-flash-lite') || models.find(m => m.id === 'gemini-3.5-flash') || models[0]
            if (recommended) {
              saveGeminiModel(recommended.id)
              return recommended.id
            }
          }
          return resolved
        })
      }
    })
  }, [])

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

  // Dynamically derive all categories present on live database products plus standard categories
  const allCategoryNames = useMemo(() => {
    const predefined = GADGET_CATEGORIES.map(c => c.name)
    const liveCategories = products.map(p => p.category).filter(Boolean)
    return Array.from(new Set([...predefined, ...liveCategories]))
  }, [products])

  // Filtered Live Products strictly from backend (memoized and deduplicated by id)
  const filteredProducts = useMemo(() => {
    const seen = new Set()
    return products.filter(product => {
      if (!product || !product.id || seen.has(product.id)) return false
      seen.add(product.id)

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
  }, [products, searchQuery, categoryFilter, subcategoryFilter, statusFilter])

  const openAddModal = () => {
    setEditingProduct(null)
    setAiSuccessMsg(null)
    setAiErrorMsg(null)
    setAiTitle('')
    setAiPrice('')
    setAiIncludeImage(false)
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
    setAiTitle(product.name || '')
    setAiPrice(product.price !== undefined && product.price !== null ? String(product.price) : '')
    setAiIncludeImage(Boolean(product.image))
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

  // ── Multi-Provider AI Actions (Gemini & DeepSeek) ──────────────────────────
  const handleProviderChange = (provider) => {
    setAiProvider(provider)
    saveAiProvider(provider)
    setAiErrorMsg(null)
  }

  const handleGeminiModelChange = (modelId) => {
    setSelectedGeminiModel(modelId)
    saveGeminiModel(modelId)
  }

  const handleDeepseekModelChange = (modelId) => {
    setSelectedDeepseekModel(modelId)
    saveDeepSeekModel(modelId)
  }

  const handleCycleImage = () => {
    const nextVariant = imageVariantIndex + 1
    setImageVariantIndex(nextVariant)
    const newImage = getHighQualityGadgetImage({
      title: form.name || aiTitle,
      category: form.category,
      subcategory: form.subcategory,
      brand: form.brand,
      variant: nextVariant
    })
    setForm(prev => ({ ...prev, image: newImage }))
  }

  const handleStopAiGeneration = () => {
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort()
      aiAbortControllerRef.current = null
    }
    setGeneratingWithAi(false)
    setAiErrorMsg('AI generation stopped by admin.')
  }

  const handleStopImageGeneration = () => {
    if (aiImageAbortControllerRef.current) {
      aiImageAbortControllerRef.current.abort()
      aiImageAbortControllerRef.current = null
    }
    setGeneratingImageWithAi(false)
    setAiErrorMsg('Image generation stopped by admin.')
  }

  const closeProductModal = () => {
    handleStopAiGeneration()
    handleStopImageGeneration()
    setShowModal(false)
  }

  const handleGenerateImageOnlyWithAi = async () => {
    const titleToUse = (aiTitle || form.name || '').trim()
    if (!titleToUse) {
      setAiErrorMsg('Please enter a Product Title / Model Name first so AI knows what gadget photo to generate.')
      return
    }

    setGeneratingImageWithAi(true)
    setAiErrorMsg(null)
    setAiSuccessMsg(null)

    const abortController = new AbortController()
    aiImageAbortControllerRef.current = abortController

    const safetyTimeout = setTimeout(() => {
      if (aiImageAbortControllerRef.current) {
        aiImageAbortControllerRef.current.abort()
      }
    }, 20000)

    try {
      const nextVariant = imageVariantIndex + 1
      setImageVariantIndex(nextVariant)

      const result = await generateGadgetImageWithAI({
        title: titleToUse,
        brand: form.brand,
        category: form.category,
        subcategory: form.subcategory,
        variant: nextVariant,
        signal: abortController.signal
      })

      if (result.success && result.imageUrl) {
        setForm(prev => ({ ...prev, image: result.imageUrl }))
        setAiSuccessMsg(`✨ AI product image generated for "${titleToUse}"! You can click Preview, AI Regenerate, or Cycle photo.`)
      } else {
        setAiErrorMsg(result.error || 'Failed to generate product image with AI.')
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setAiErrorMsg('Image generation stopped.')
      } else {
        setAiErrorMsg(err.message || 'Error generating image with AI.')
      }
    } finally {
      clearTimeout(safetyTimeout)
      setGeneratingImageWithAi(false)
      aiImageAbortControllerRef.current = null
    }
  }

  const handleAiGenerateProduct = async () => {
    setAiErrorMsg(null)
    setAiSuccessMsg(null)

    const titleToUse = (aiTitle || form.name || '').trim()
    const priceToUse = aiPrice !== '' ? aiPrice : form.price

    if (!titleToUse) {
      setAiErrorMsg('Please enter a Product Title / Model Name (e.g. "HP Pavilion 15" or "Sony WH-1000XM5").')
      return
    }

    const currentKey = aiProvider === 'deepseek' ? getDeepSeekApiKey() : getGeminiApiKey()
    if (!currentKey) {
      setActiveSetupTab(aiProvider)
      setGeminiKeyModalOpen(true)
      return
    }

    const abortController = new AbortController()
    aiAbortControllerRef.current = abortController
    setGeneratingWithAi(true)

    // 25-second maximum safety timeout so it NEVER spins forever
    const safetyTimeout = setTimeout(() => {
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort()
      }
    }, 25000)

    try {
      const chosenModel = aiProvider === 'deepseek' ? selectedDeepseekModel : selectedGeminiModel
      const result = await generateProductCatalogWithAI({
        provider: aiProvider,
        title: titleToUse,
        price: priceToUse,
        includeImage: aiIncludeImage,
        model: chosenModel,
        apiKey: currentKey,
        imageVariant: imageVariantIndex,
        signal: abortController.signal
      })

      if (!result.success) {
        if (result.aborted) {
          setAiErrorMsg('Generation stopped by user.')
        } else {
          setAiErrorMsg(result.error)
          if (result.error?.toLowerCase().includes('api key')) {
            setActiveSetupTab(aiProvider)
            setGeminiKeyModalOpen(true)
          }
        }
      } else {
        const detected = result.data
        setForm(prev => {
          const nextCat = detected.category || prev.category
          const validSubs = getSubcategoriesForCategory(nextCat)
          const matchedSub = validSubs.find(s => s.toLowerCase() === (detected.subcategory || '').toLowerCase()) || validSubs[0] || detected.subcategory

          return {
            ...prev,
            name: detected.name || titleToUse,
            brand: detected.brand || prev.brand,
            category: nextCat,
            subcategory: matchedSub || prev.subcategory,
            price: detected.price !== undefined ? detected.price : (priceToUse || prev.price),
            original_price: detected.original_price !== undefined ? detected.original_price : prev.original_price,
            sku: detected.sku || prev.sku,
            badge: detected.badge || prev.badge,
            stock: detected.stock !== undefined ? detected.stock : prev.stock,
            description: detected.description || prev.description,
            image: aiIncludeImage && detected.image ? detected.image : prev.image
          }
        })
        setAiTitle(detected.name || titleToUse)
        if (detected.price !== undefined) setAiPrice(String(detected.price))

        const providerLabel = aiProvider === 'deepseek' ? 'DeepSeek' : 'Google Gemini'
        if (aiIncludeImage && detected.image) {
          setAiSuccessMsg(`✨ Product details & photo generated with ${providerLabel} (${result.usedModel || chosenModel})! You can freely review or edit below.`)
        } else {
          setAiSuccessMsg(`✨ Product details generated with ${providerLabel} (${result.usedModel || chosenModel})! (Image generation is OFF by default — click "✨ AI Generate Image Only" below if you want an image).`)
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setAiErrorMsg('Generation stopped by user.')
      } else {
        setAiErrorMsg(err.message || 'Generation failed.')
      }
    } finally {
      clearTimeout(safetyTimeout)
      setGeneratingWithAi(false)
      aiAbortControllerRef.current = null
    }
  }

  const handleSaveAiSettings = (e) => {
    e.preventDefault()
    saveGeminiApiKey(geminiKeyInput)
    saveGeminiModel(selectedGeminiModel)
    saveDeepSeekApiKey(deepseekKeyInput)
    saveDeepSeekModel(selectedDeepseekModel)
    saveAiProvider(aiProvider)
    setGeminiKeyModalOpen(false)
    if (aiTitle.trim() || form.name.trim()) {
      handleAiGenerateProduct()
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
      {/* Header with Live Backend Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Live Product Catalog</h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              LIVE BACKEND
            </span>
          </div>
          <p className="text-xs sm:text-sm text-veltrix-gray-400 mt-1">
            Displaying live products directly from your Supabase database. No dummy products shown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Refresh Live Catalog */}
          <button
            onClick={() => fetchDashboardData()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-veltrix-black-light border border-veltrix-gray-800 hover:border-veltrix-gray-700 text-veltrix-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            title="Fetch fresh records from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-veltrix-blue' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Refresh Catalog'}</span>
          </button>

          <button
            onClick={() => setGeminiKeyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold hover:bg-purple-500/20 transition-all"
            title="Configure AI Assistant (Gemini & DeepSeek)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {aiProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'}: {
                aiProvider === 'deepseek' 
                  ? DEEPSEEK_MODELS.find(m => m.id === selectedDeepseekModel)?.name.replace('DeepSeek ', '') || 'Chat V3'
                  : availableGeminiModels.find(m => m.id === selectedGeminiModel)?.name.replace('Gemini ', '') || '2.0 Flash'
              }
            </span>
            {(aiProvider === 'deepseek' ? getDeepSeekApiKey() : getGeminiApiKey()) ? (
              <span className="w-2 h-2 rounded-full bg-green-400" title="API Key Configured"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-yellow-400" title="API Key Missing"></span>
            )}
          </button>

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-veltrix-blue text-veltrix-black font-bold rounded-xl text-xs sm:text-sm shadow-glow hover:scale-105 active:scale-95 transition-all"
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
          {/* Main Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setSubcategoryFilter('all')
            }}
            className="w-full px-3 py-2.5 sm:py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Categories ({products.length} live)</option>
            {allCategoryNames.map(catName => {
              const count = products.filter(p => p.category === catName).length
              return (
                <option key={catName} value={catName}>
                  {catName} {count > 0 ? `(${count})` : ''}
                </option>
              )
            })}
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

        {/* Loading & Empty States */}
        {isLoading && products.length === 0 ? (
          <div className="p-16 text-center text-veltrix-gray-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-veltrix-blue animate-spin" />
            <p className="text-sm font-semibold text-white">Loading live catalog from Supabase...</p>
            <p className="text-xs text-veltrix-gray-500">Querying real backend database records.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-veltrix-gray-400 space-y-3">
            <Package className="w-10 h-10 text-veltrix-gray-600 mx-auto" />
            <p className="text-sm font-semibold text-white">
              {products.length === 0 ? 'No live products in your database' : 'No live products match your search or filter'}
            </p>
            <p className="text-xs text-veltrix-gray-500 max-w-sm mx-auto">
              {products.length === 0 
                ? 'Only real products from your live Supabase backend are displayed here. Click "Add New Gadget" above to create your first live product.'
                : `Showing 0 of ${products.length} live database products. Try clearing your search or category filter.`}
            </p>
            {products.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                  setSubcategoryFilter('all')
                  setStatusFilter('all')
                }}
                className="px-3.5 py-1.5 bg-veltrix-gray-800 hover:bg-veltrix-gray-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Add / Edit Gadget Modal with Responsive Adaptive Layout & Live Preview ── */}
      {showModal && (() => {
        const previewDiscount = (form.original_price && Number(form.original_price) > Number(form.price))
          ? Math.round(((Number(form.original_price) - Number(form.price)) / Number(form.original_price)) * 100)
          : 0

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-full sm:max-w-2xl lg:max-w-5xl xl:max-w-6xl max-h-[96dvh] sm:max-h-[92dvh] flex flex-col bg-veltrix-black-light rounded-2xl sm:rounded-3xl border border-veltrix-gray-800 shadow-2xl overflow-hidden animate-fade-in">
              
              {/* ── Sticky Modal Header ── */}
              <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-veltrix-gray-800 bg-veltrix-black-light/95 backdrop-blur-md flex items-center justify-between gap-3 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-transparent border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
                    <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                        {editingProduct ? 'Edit Gadget Details' : 'Add New Gadget to Storefront'}
                      </h2>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                        Live Database Sync
                      </span>
                    </div>
                    <p className="text-[11px] text-veltrix-gray-400 truncate mt-0.5">
                      {editingProduct 
                        ? `Editing SKU ${form.sku || 'N/A'} • Changes update the storefront immediately` 
                        : 'Intelligent AI Auto-Fill & Instant Storefront Catalog Publishing'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Active AI Pill */}
                  <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-veltrix-black border border-veltrix-gray-800 text-[11px] text-veltrix-gray-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>{aiProvider === 'deepseek' ? 'DeepSeek V3' : 'Gemini 3.5 Flash-Lite'}</span>
                  </div>

                  <button 
                    type="button"
                    onClick={closeProductModal}
                    className="p-2 text-veltrix-gray-400 hover:text-white rounded-xl hover:bg-veltrix-gray-800 transition-colors"
                    title="Close modal (Esc)"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ── Form with Scrollable Body & Sticky Footer ── */}
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                
                {/* ── Scrollable Modal Body ── */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* ── Left Column: Live Storefront Card Preview & Media Controls ── */}
                    <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-0">
                      
                      {/* Live Storefront Preview Card */}
                      <div className="bg-veltrix-black/80 rounded-2xl border border-veltrix-gray-800 overflow-hidden shadow-xl">
                        <div className="px-4 py-3 bg-gradient-to-r from-veltrix-gray-900 via-veltrix-black-light to-veltrix-gray-900 border-b border-veltrix-gray-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                            <Eye className="w-3.5 h-3.5 text-veltrix-blue" />
                            <span>Live Storefront Preview</span>
                          </div>
                          <span className="text-[10px] text-green-400 font-mono font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            Shopper View
                          </span>
                        </div>

                        {/* The Live Product Card mimicking store card */}
                        <div className="p-4 bg-veltrix-black/60">
                          <div className="group relative bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/80 overflow-hidden hover:border-veltrix-blue/40 transition-all duration-300">
                            
                            {/* Badge Pill in Preview */}
                            {form.badge && (
                              <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-veltrix-blue text-veltrix-black text-[11px] font-bold rounded-full shadow-md">
                                {form.badge}
                              </div>
                            )}

                            {/* Discount Pill in Preview */}
                            {previewDiscount > 0 && (
                              <div className="absolute top-3 right-3 z-10 px-2.5 py-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full shadow-md">
                                -{previewDiscount}%
                              </div>
                            )}

                            {/* Image Preview Container */}
                            <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square overflow-hidden bg-veltrix-gray-900 flex items-center justify-center">
                              {form.image ? (
                                <img 
                                  src={form.image} 
                                  alt={form.name || 'Product preview'} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&auto=format&fit=crop&q=85'
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-veltrix-gray-600 p-6 text-center">
                                  <ImageIcon className="w-12 h-12 mb-2 stroke-1 text-veltrix-gray-700" />
                                  <p className="text-xs font-semibold text-veltrix-gray-400">No Image Attached Yet</p>
                                  <p className="text-[10px] text-veltrix-gray-500 mt-1 max-w-[200px]">
                                    Image generation is OFF by default. Use AI or Upload to add a photo.
                                  </p>
                                </div>
                              )}

                              {/* Click overlay for preview */}
                              {form.image && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageModalOpen(true)}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                  <span>View Full Resolution</span>
                                </button>
                              )}
                            </div>

                            {/* Card Content Details */}
                            <div className="p-4 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-veltrix-blue uppercase tracking-wider">
                                  {form.brand || 'CarryGo'}
                                </span>
                                <span className="text-veltrix-gray-700">•</span>
                                <span className="text-[10px] text-veltrix-gray-400">
                                  {form.category}
                                </span>
                                {form.subcategory && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-veltrix-blue/15 text-veltrix-blue font-mono border border-veltrix-blue/20">
                                    {form.subcategory}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                {form.name || <span className="text-veltrix-gray-600 italic">Enter gadget title to preview name...</span>}
                              </h4>

                              <div className="flex items-baseline gap-2 pt-1">
                                <span className="text-base sm:text-lg font-black text-white">
                                  {form.price ? formatPrice(Number(form.price)) : '$0.00'}
                                </span>
                                {form.original_price && Number(form.original_price) > Number(form.price) && (
                                  <span className="text-xs text-veltrix-gray-500 line-through">
                                    {formatPrice(Number(form.original_price))}
                                  </span>
                                )}
                                <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  form.status === 'active'
                                    ? (Number(form.stock) > 0 ? 'bg-green-500/15 text-green-400 border-green-500/25' : 'bg-red-500/15 text-red-400 border-red-500/25')
                                    : 'bg-veltrix-gray-800 text-veltrix-gray-400 border-veltrix-gray-700'
                                }`}>
                                  {form.status === 'active' ? (Number(form.stock) > 0 ? `Stock: ${form.stock}` : 'Out of Stock') : 'Draft / Hidden'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Media Controls Box */}
                      <div className="bg-veltrix-black/80 rounded-2xl border border-veltrix-gray-800 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-veltrix-blue" />
                            <span>Product Photo Actions</span>
                          </h4>
                          {uploadingImage && (
                            <span className="text-veltrix-blue flex items-center gap-1 text-[10px]">
                              <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                            </span>
                          )}
                        </div>

                        {/* Action Buttons Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <label className="px-3 py-2 bg-veltrix-gray-800/80 hover:bg-veltrix-gray-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-veltrix-gray-700/80 text-center">
                            <Upload className="w-3.5 h-3.5 text-veltrix-blue" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleGenerateImageOnlyWithAi}
                            disabled={generatingImageWithAi || (!aiTitle.trim() && !form.name.trim())}
                            className="px-3 py-2 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/40 hover:to-purple-600/40 text-blue-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-blue-500/40 disabled:opacity-50"
                            title="Generate brand-accurate photo using AI"
                          >
                            {generatingImageWithAi ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5 text-yellow-300" />
                                <span>AI {form.image ? 'Regenerate' : 'Generate'}</span>
                              </>
                            )}
                          </button>

                          {form.image && (
                            <>
                              <button
                                type="button"
                                onClick={handleCycleImage}
                                className="px-3 py-2 bg-veltrix-gray-800/80 hover:bg-veltrix-gray-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-veltrix-gray-700/80"
                                title="Cycle to next verified brand variant photo"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-veltrix-blue" />
                                <span>Cycle Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                                className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-red-500/25"
                                title="Remove image from product"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Remove Image</span>
                              </button>
                            </>
                          )}
                        </div>

                        {/* Direct Image URL input */}
                        <div className="pt-2 border-t border-veltrix-gray-800/80">
                          <label className="text-[10px] text-veltrix-gray-400 block mb-1">Direct Image URL (Optional):</label>
                          <input
                            type="text"
                            value={form.image}
                            onChange={e => setForm({ ...form, image: e.target.value })}
                            className="input-field text-xs font-mono py-2"
                            placeholder="https://images.unsplash.com/..."
                          />
                        </div>

                        {uploadError && (
                          <p className="text-xs text-red-400">{uploadError}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Right Column: AI Assistant & Product Data Cards ── */}
                    <div className="lg:col-span-7 space-y-5">

                      {/* ── AI Instant Catalog Assistant ── */}
                      <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-950/40 via-blue-950/20 to-veltrix-black-light border border-purple-500/40 rounded-2xl space-y-4 shadow-xl shadow-purple-950/20">
                        {/* AI Header & Model Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                              <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                                <span>AI Catalog Assistant</span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                                  {aiProvider === 'deepseek' ? 'DeepSeek AI' : 'Gemini AI'}
                                </span>
                              </h3>
                              <p className="text-[10px] text-veltrix-gray-400">
                                Type model title & price below — AI writes specs, category, brand & SKU.
                              </p>
                            </div>
                          </div>

                          {/* Provider & Model Selectors */}
                          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap shrink-0 max-w-full">
                            <div className="flex items-center p-0.5 bg-veltrix-black/80 border border-purple-500/30 rounded-xl shrink-0">
                              <button
                                type="button"
                                onClick={() => handleProviderChange('gemini')}
                                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                                  aiProvider === 'gemini' 
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm' 
                                    : 'text-veltrix-gray-400 hover:text-white'
                                }`}
                              >
                                Gemini
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProviderChange('deepseek')}
                                className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                                  aiProvider === 'deepseek' 
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm' 
                                    : 'text-veltrix-gray-400 hover:text-white'
                                }`}
                              >
                                DeepSeek
                              </button>
                            </div>

                            <div className="relative min-w-0 max-w-[135px] sm:max-w-[175px]">
                              {aiProvider === 'deepseek' ? (
                                <select
                                  value={selectedDeepseekModel}
                                  onChange={(e) => handleDeepseekModelChange(e.target.value)}
                                  className="w-full truncate bg-veltrix-black/80 border border-blue-500/40 text-blue-200 text-xs rounded-xl pl-2.5 pr-6 py-1 appearance-none focus:outline-none cursor-pointer"
                                  title={selectedDeepseekModel}
                                >
                                  {DEEPSEEK_MODELS.map(m => (
                                    <option key={m.id} value={m.id} className="bg-veltrix-black text-white">
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  value={selectedGeminiModel}
                                  onChange={(e) => handleGeminiModelChange(e.target.value)}
                                  className="w-full truncate bg-veltrix-black/80 border border-purple-500/40 text-purple-200 text-xs rounded-xl pl-2.5 pr-6 py-1 appearance-none focus:outline-none cursor-pointer"
                                  title={selectedGeminiModel}
                                >
                                  {availableGeminiModels.map(m => (
                                    <option key={m.id} value={m.id} className="bg-veltrix-black text-white">
                                      {m.name} {m.badge ? `(${m.badge})` : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <Cpu className="w-2.5 h-2.5 text-purple-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveSetupTab(aiProvider)
                                setGeminiKeyModalOpen(true)
                              }}
                              className="p-1.5 bg-veltrix-black/60 border border-veltrix-gray-700 text-veltrix-gray-300 hover:text-white rounded-xl text-xs flex items-center gap-1 hover:border-purple-500/50 shrink-0"
                              title="API Key Configuration"
                            >
                              <Key className="w-3.5 h-3.5 text-yellow-400" />
                            </button>
                          </div>
                        </div>

                        {/* Prompt Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-xs font-semibold text-white">
                              1. Gadget Title / Model *
                            </label>
                            <input
                              type="text"
                              value={aiTitle}
                              onChange={(e) => {
                                setAiTitle(e.target.value)
                                setForm(prev => ({ ...prev, name: e.target.value }))
                              }}
                              placeholder="e.g. Sony WH-1000XM5 or HP Pavilion 15.6"
                              className="input-field text-xs bg-veltrix-black/70 border-purple-500/30 focus:border-purple-400 text-white placeholder-veltrix-gray-500 font-medium py-2"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-white">
                              2. Selling Price ($) *
                            </label>
                            <input
                              type="number"
                              value={aiPrice}
                              onChange={(e) => {
                                setAiPrice(e.target.value)
                                setForm(prev => ({ ...prev, price: e.target.value }))
                              }}
                              placeholder="e.g. 399"
                              className="input-field text-xs bg-veltrix-black/70 border-purple-500/30 focus:border-purple-400 text-white placeholder-veltrix-gray-500 font-bold py-2"
                            />
                          </div>
                        </div>

                        {/* Image Toggle Switch & Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-purple-500/20">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                            <div 
                              onClick={() => setAiIncludeImage(!aiIncludeImage)}
                              className={`relative w-10 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                                aiIncludeImage ? 'bg-gradient-to-r from-purple-500 to-veltrix-blue' : 'bg-veltrix-gray-800 border border-veltrix-gray-700'
                              }`}
                            >
                              <div 
                                className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                                  aiIncludeImage ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </div>
                            <div onClick={() => setAiIncludeImage(!aiIncludeImage)}>
                              <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
                                Auto-generate image with AI
                              </p>
                              <p className="text-[10px] text-veltrix-gray-400">
                                {aiIncludeImage ? '✨ Image will be auto-attached' : 'Off by default (generates specs & text only)'}
                              </p>
                            </div>
                          </label>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {/* Generate Image Only Button */}
                            <button
                              type="button"
                              onClick={handleGenerateImageOnlyWithAi}
                              disabled={generatingImageWithAi || (!aiTitle.trim() && !form.name.trim())}
                              className="px-3 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              title="Use AI to generate only the product photo"
                            >
                              {generatingImageWithAi ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3.5 h-3.5 text-yellow-300" />
                                  <span>AI Image Only</span>
                                </>
                              )}
                            </button>

                            {generatingImageWithAi && (
                              <button
                                type="button"
                                onClick={handleStopImageGeneration}
                                className="px-2.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                                title="Stop Image Generation"
                              >
                                <Square className="w-3 h-3 fill-current" />
                                <span>Stop</span>
                              </button>
                            )}

                            {/* Main Generate Form Button */}
                            <button
                              type="button"
                              onClick={handleAiGenerateProduct}
                              disabled={generatingWithAi || (!aiTitle.trim() && !form.name.trim())}
                              className="px-4 py-2 bg-gradient-to-r from-purple-500 via-indigo-600 to-veltrix-blue text-white font-bold text-xs rounded-xl shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {generatingWithAi ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  <span>Generating Form...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 text-yellow-300" />
                                  <span>✨ Generate Entire Form</span>
                                </>
                              )}
                            </button>

                            {generatingWithAi && (
                              <button
                                type="button"
                                onClick={handleStopAiGeneration}
                                className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                                title="Stop AI Generation"
                              >
                                <Square className="w-3.5 h-3.5 fill-current" />
                                <span>Stop</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Alerts */}
                        {aiSuccessMsg && (
                          <div className="p-3 bg-green-500/15 border border-green-500/30 rounded-xl text-xs text-green-300 flex items-start gap-2 animate-fade-in">
                            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{aiSuccessMsg}</span>
                          </div>
                        )}
                        {aiErrorMsg && (
                          <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2 animate-fade-in">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{aiErrorMsg}</span>
                          </div>
                        )}
                      </div>

                      {/* ── Section 1: Gadget Identity & Classification ── */}
                      <div className="bg-veltrix-black/80 rounded-2xl border border-veltrix-gray-800 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-veltrix-gray-800">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-veltrix-blue" />
                            <span>1. Gadget Identity & Classification</span>
                          </h4>
                          <span className="text-[10px] text-veltrix-gray-500">Core Metadata</span>
                        </div>

                        <div className="space-y-4">
                          {/* Title */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-veltrix-gray-300">
                              Product Commercial Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={form.name}
                              onChange={e => {
                                setForm({ ...form, name: e.target.value })
                                if (!aiTitle) setAiTitle(e.target.value)
                              }}
                              className="input-field text-sm font-semibold py-2.5"
                              placeholder="e.g. Apple iPhone 15 Pro Max 256GB - Natural Titanium"
                            />
                          </div>

                          {/* Brand & Chips */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-veltrix-gray-300 flex items-center justify-between">
                              <span>Brand</span>
                              <span className="text-[10px] text-veltrix-gray-500">Click quick chip or type</span>
                            </label>
                            <input
                              type="text"
                              list="brand-suggestions"
                              value={form.brand}
                              onChange={e => setForm({ ...form, brand: e.target.value })}
                              className="input-field text-xs py-2"
                              placeholder="Apple, Samsung, HP, Dell, Lenovo..."
                            />
                            <datalist id="brand-suggestions">
                              {GADGET_BRANDS.map(b => <option key={b} value={b} />)}
                            </datalist>

                            {/* Quick Brand Chips */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {POPULAR_BRANDS.map(b => (
                                <button
                                  key={b}
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, brand: b }))}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors border ${
                                    form.brand.toLowerCase() === b.toLowerCase()
                                      ? 'bg-veltrix-blue text-veltrix-black border-veltrix-blue'
                                      : 'bg-veltrix-gray-800/80 text-veltrix-gray-400 hover:text-white border-veltrix-gray-700'
                                  }`}
                                >
                                  {b}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Categories Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-veltrix-gray-300">Category *</label>
                              <select
                                value={form.category}
                                onChange={e => handleCategoryChange(e.target.value)}
                                className="input-field text-xs py-2"
                              >
                                {GADGET_CATEGORIES.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-veltrix-gray-300">Sub-Category *</label>
                              <select
                                value={form.subcategory}
                                onChange={e => setForm({ ...form, subcategory: e.target.value })}
                                className="input-field text-xs py-2"
                              >
                                {availableSubcategories.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* SKU */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-veltrix-gray-300">SKU / Code</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const brandPrefix = (form.brand || 'GDT').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'GDT'
                                  const code = `CGO-${brandPrefix}-${Math.floor(1000 + Math.random() * 9000)}`
                                  setForm(prev => ({ ...prev, sku: code }))
                                }}
                                className="text-[10px] text-veltrix-blue hover:underline"
                              >
                                Regenerate Code
                              </button>
                            </div>
                            <input
                              type="text"
                              value={form.sku}
                              onChange={e => setForm({ ...form, sku: e.target.value })}
                              className="input-field text-xs font-mono py-2"
                              placeholder="CGO-GDT-1001"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Section 2: Pricing, Margins & Inventory ── */}
                      <div className="bg-veltrix-black/80 rounded-2xl border border-veltrix-gray-800 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-veltrix-gray-800">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 text-green-400" />
                            <span>2. Pricing, Margins & Inventory</span>
                          </h4>
                          <span className="text-[10px] text-veltrix-gray-500">Commercial Rates</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Selling Price */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-white flex items-center justify-between">
                              <span>Selling Price ($) *</span>
                              <span className="text-[10px] text-veltrix-blue">Required</span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-veltrix-gray-400 font-bold">$</span>
                              <input
                                type="number"
                                required
                                value={form.price}
                                onChange={e => {
                                  setForm({ ...form, price: e.target.value })
                                  if (!aiPrice) setAiPrice(e.target.value)
                                }}
                                className="input-field text-sm font-bold text-white pl-8 py-2"
                                placeholder="999"
                              />
                            </div>
                          </div>

                          {/* Original List Price */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-veltrix-gray-300 flex items-center justify-between">
                              <span>MSRP List Price ($)</span>
                              {previewDiscount > 0 && (
                                <span className="text-[10px] text-red-400 font-bold">-{previewDiscount}% Discount</span>
                              )}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-veltrix-gray-400 font-bold">$</span>
                              <input
                                type="number"
                                value={form.original_price}
                                onChange={e => setForm({ ...form, original_price: e.target.value })}
                                className="input-field text-sm pl-8 py-2 text-veltrix-gray-300"
                                placeholder="1199"
                              />
                            </div>
                          </div>

                          {/* Stock Inventory */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-veltrix-gray-300">Inventory Units in Stock</label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, stock: Math.max(0, (parseInt(prev.stock) || 0) - 1) }))}
                                className="w-9 h-9 bg-veltrix-gray-800 hover:bg-veltrix-gray-700 text-white rounded-lg flex items-center justify-center font-bold text-sm border border-veltrix-gray-700"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={form.stock}
                                onChange={e => setForm({ ...form, stock: e.target.value })}
                                className="input-field text-sm font-bold text-center py-2 flex-1"
                                placeholder="10"
                              />
                              <button
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, stock: (parseInt(prev.stock) || 0) + 1 }))}
                                className="w-9 h-9 bg-veltrix-gray-800 hover:bg-veltrix-gray-700 text-white rounded-lg flex items-center justify-center font-bold text-sm border border-veltrix-gray-700"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-veltrix-gray-300">Storefront Visibility</label>
                            <select
                              value={form.status}
                              onChange={e => setForm({ ...form, status: e.target.value })}
                              className="input-field text-xs py-2 font-medium"
                            >
                              <option value="active">Active (Visible to Shoppers)</option>
                              <option value="inactive">Inactive (Draft / Hidden)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ── Section 3: Marketing & Specifications ── */}
                      <div className="bg-veltrix-black/80 rounded-2xl border border-veltrix-gray-800 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-veltrix-gray-800">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-yellow-400" />
                            <span>3. Marketing Badges & Technical Specifications</span>
                          </h4>
                          <span className="text-[10px] text-veltrix-gray-500">Highlights & Details</span>
                        </div>

                        {/* Marketing Badge */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-veltrix-gray-300 flex items-center justify-between">
                            <span>Marketing Badge</span>
                            <span className="text-[10px] text-veltrix-gray-500">Click quick badge or type custom</span>
                          </label>
                          <input
                            type="text"
                            value={form.badge}
                            onChange={e => setForm({ ...form, badge: e.target.value })}
                            className="input-field text-xs py-2"
                            placeholder="Hot Deal, Flagship, Best Seller, New Arrival"
                          />
                          {/* Badge Chips */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {BADGE_SUGGESTIONS.map(bg => (
                              <button
                                key={bg}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, badge: bg }))}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors border ${
                                  form.badge === bg
                                    ? 'bg-yellow-400 text-black border-yellow-400'
                                    : 'bg-veltrix-gray-800/80 text-veltrix-gray-400 hover:text-white border-veltrix-gray-700'
                                }`}
                              >
                                {bg}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-veltrix-gray-300 flex items-center justify-between">
                            <span>Technical Specifications & Overview</span>
                            <span className="text-[10px] text-veltrix-blue">Auto-formatted by AI</span>
                          </label>
                          <textarea
                            rows="4"
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="input-field text-xs resize-none leading-relaxed font-sans py-2.5"
                            placeholder="Display type, processor, battery capacity, cameras, RAM/Storage, included accessories, and warranty terms..."
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* ── Sticky Modal Footer Bar ── */}
                <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 bg-veltrix-black-light/95 backdrop-blur-md border-t border-veltrix-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
                  <div className="hidden sm:flex items-center gap-2 text-xs text-veltrix-gray-400">
                    <span className={`w-2 h-2 rounded-full ${form.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span>
                      {form.name ? `${form.name.slice(0, 36)}${form.name.length > 36 ? '...' : ''}` : 'New Gadget'} • {form.price ? formatPrice(Number(form.price)) : '$0.00'} • Stock: {form.stock || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={closeProductModal}
                      className="px-4 py-2.5 text-xs font-semibold text-veltrix-gray-400 hover:text-white transition-colors w-1/2 sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !form.name || !form.price}
                      className="px-6 py-2.5 bg-veltrix-blue text-veltrix-black font-bold rounded-xl text-xs shadow-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 w-1/2 sm:w-auto"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Database...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{editingProduct ? 'Save Gadget Updates' : 'Publish to Storefront'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )
      })()}

      {/* ── Multi-Provider AI Setup Modal (Gemini & DeepSeek) ── */}
      {geminiKeyModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 shadow-2xl p-4 sm:p-6 space-y-4 animate-fade-in max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-veltrix-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AI Model & Provider Setup</h3>
                  <p className="text-[11px] text-veltrix-gray-400">Configure Google Gemini & DeepSeek API keys and models</p>
                </div>
              </div>
              <button 
                onClick={() => setGeminiKeyModalOpen(false)}
                className="text-veltrix-gray-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Provider Switcher Tabs in Modal */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-veltrix-black rounded-xl border border-veltrix-gray-800">
              <button
                type="button"
                onClick={() => setActiveSetupTab('gemini')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeSetupTab === 'gemini'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-veltrix-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Google Gemini</span>
                {getGeminiApiKey() ? (
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveSetupTab('deepseek')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeSetupTab === 'deepseek'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                    : 'text-veltrix-gray-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-300" />
                <span>DeepSeek AI</span>
                {getDeepSeekApiKey() ? (
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                )}
              </button>
            </div>

            <form onSubmit={handleSaveAiSettings} className="space-y-4">
              {/* Active Tab: Google Gemini */}
              {activeSetupTab === 'gemini' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-veltrix-gray-300">Gemini API Key</label>
                      {getGeminiApiKey() && (
                        <span className="text-[10px] text-green-400 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" /> Configured
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      value={geminiKeyInput}
                      onChange={e => setGeminiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-veltrix-gray-300 flex items-center justify-between">
                      <span>Supported Gemini Models</span>
                      <span className="text-[10px] text-purple-400 font-medium">Click to select active model</span>
                    </label>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {availableGeminiModels.map((m) => {
                        const isSelected = selectedGeminiModel === m.id
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleGeminiModelChange(m.id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-purple-500/15 border-purple-500/60 shadow-sm shadow-purple-500/20'
                                : 'bg-veltrix-black/60 border-veltrix-gray-800 hover:border-veltrix-gray-700'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">{m.name}</span>
                                {m.badge && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                    m.badge === 'Recommended' 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : m.badge === 'Pro' || m.badge === 'Pro Reasoning'
                                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  }`}>
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-veltrix-gray-400 line-clamp-1">{m.description}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'border-purple-400 bg-purple-500' : 'border-veltrix-gray-600'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 text-[11px] text-veltrix-gray-400 space-y-1">
                    <p className="font-semibold text-white flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-veltrix-blue" />
                      Get a free Google Gemini API key:
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
                </div>
              )}

              {/* Active Tab: DeepSeek */}
              {activeSetupTab === 'deepseek' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-veltrix-gray-300">DeepSeek API Key</label>
                      {getDeepSeekApiKey() && (
                        <span className="text-[10px] text-green-400 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" /> Configured
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      value={deepseekKeyInput}
                      onChange={e => setDeepseekKeyInput(e.target.value)}
                      placeholder="sk-..."
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-veltrix-gray-300 flex items-center justify-between">
                      <span>Supported DeepSeek Models</span>
                      <span className="text-[10px] text-cyan-400 font-medium">Click to select active model</span>
                    </label>

                    <div className="space-y-1.5">
                      {DEEPSEEK_MODELS.map((m) => {
                        const isSelected = selectedDeepseekModel === m.id
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleDeepseekModelChange(m.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-cyan-500/15 border-cyan-500/60 shadow-sm shadow-cyan-500/20'
                                : 'bg-veltrix-black/60 border-veltrix-gray-800 hover:border-veltrix-gray-700'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{m.name}</span>
                                {m.badge && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    m.badge === 'Recommended' 
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  }`}>
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-veltrix-gray-400">{m.description}</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected ? 'border-cyan-400 bg-cyan-500' : 'border-veltrix-gray-600'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-veltrix-black rounded-xl border border-veltrix-gray-800 text-[11px] text-veltrix-gray-400 space-y-1">
                    <p className="font-semibold text-white flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Get a DeepSeek API key:
                    </p>
                    <a 
                      href="https://platform.deepseek.com/api_keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                    >
                      https://platform.deepseek.com/api_keys ↗
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-veltrix-gray-800">
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
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Image Preview Lightbox Modal ── */}
      {previewImageModalOpen && form.image && (
        <div 
          onClick={() => setPreviewImageModalOpen(false)}
          className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="max-w-3xl w-full bg-veltrix-black-light border border-veltrix-gray-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-veltrix-gray-800">
              <div className="min-w-0 pr-4">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">
                  {form.name || 'Product Image Preview'}
                </h3>
                <p className="text-[11px] text-veltrix-gray-400 font-mono truncate mt-0.5">
                  {form.image}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModalOpen(false)}
                className="p-1.5 text-veltrix-gray-400 hover:text-white rounded-lg hover:bg-veltrix-gray-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black rounded-xl overflow-hidden flex items-center justify-center max-h-[60vh] border border-veltrix-gray-800 shadow-inner">
              <img 
                src={form.image} 
                alt={form.name || 'Full preview'} 
                className="max-h-[60vh] w-auto max-w-full object-contain mx-auto"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCycleImage}
                  className="px-3 py-1.5 bg-veltrix-gray-800 hover:bg-veltrix-gray-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-veltrix-gray-700"
                  title="Switch to another verified photo of this device"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-veltrix-blue" />
                  <span>Cycle Photo</span>
                </button>
                <a
                  href={form.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-veltrix-gray-800 hover:bg-veltrix-gray-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-veltrix-gray-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Resolution</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setPreviewImageModalOpen(false)}
                className="px-4 py-1.5 bg-veltrix-blue text-veltrix-black font-bold rounded-lg text-xs hover:scale-105 transition-all"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
