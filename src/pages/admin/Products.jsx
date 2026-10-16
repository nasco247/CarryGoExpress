import { useState } from 'react'
import { 
  Search, Plus, Edit, Trash2, Eye, Package, AlertTriangle, 
  CheckCircle, XCircle, RefreshCw, Sparkles, ArrowUpDown
} from 'lucide-react'
import { useAdminStore } from '../../hooks/useAdminStore'
import { formatPrice } from '../../lib/utils'

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
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: 'Televisions',
    brand: 'CarryGoExpress',
    price: '',
    original_price: '',
    stock: 10,
    status: 'active',
    image: '',
    badge: '',
    description: ''
  })

  const categories = ['Televisions', 'Audio', 'Projectors', 'Headphones', 'Monitors', 'Smart Home']

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const openAddModal = () => {
    setEditingProduct(null)
    setForm({
      name: '',
      sku: `CGO-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Televisions',
      brand: 'CarryGoExpress',
      price: '',
      original_price: '',
      stock: 10,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600',
      badge: 'New',
      description: ''
    })
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      category: product.category || 'Televisions',
      brand: product.brand || 'CarryGoExpress',
      price: product.price || '',
      original_price: product.original_price || '',
      stock: product.stock ?? 10,
      status: product.status || 'active',
      image: product.image || '',
      badge: product.badge || '',
      description: product.description || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price) return
    setSubmitting(true)

    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      brand: form.brand || 'CarryGoExpress',
      price: parseFloat(form.price) || 0,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      stock: parseInt(form.stock) || 0,
      in_stock: (parseInt(form.stock) || 0) > 0,
      status: form.status,
      image: form.image || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600',
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
    if (window.confirm(`Delete product "${name}" permanently from Supabase?`)) {
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
          <h1 className="text-2xl font-bold text-white">Product Catalog & Stock Management</h1>
          <p className="text-sm text-veltrix-gray-400 mt-1">
            Realtime catalog synced directly with user storefront. Edit price, manage stock, and add items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {products.length === 0 && (
            <button
              onClick={() => seedStarterCatalog()}
              className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-semibold rounded-xl text-xs hover:bg-yellow-500/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Seed CarryGo Catalog
            </button>
          )}

          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-veltrix-blue text-veltrix-black font-bold rounded-xl text-sm shadow-glow hover:scale-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Catalog', value: products.length, icon: Package, color: 'blue' },
          { label: 'Active in Store', value: products.filter(p => p.status === 'active').length, icon: CheckCircle, color: 'green' },
          { label: 'Low Stock (≤5)', value: products.filter(p => (p.stock !== undefined && p.stock <= 5 && p.stock > 0)).length, icon: AlertTriangle, color: 'yellow' },
          { label: 'Out of Stock', value: products.filter(p => p.stock === 0 || p.in_stock === false).length, icon: XCircle, color: 'red' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-veltrix-black-light rounded-xl border border-veltrix-gray-800/60 p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-veltrix-blue/20 text-veltrix-blue' :
                  stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  stat.color === 'red' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-veltrix-gray-400">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-veltrix-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, or SKU..."
            className="w-full pl-11 pr-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-white placeholder-veltrix-gray-500 text-sm focus:border-veltrix-blue focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-veltrix-black-light border border-veltrix-gray-800 rounded-xl text-xs text-white focus:border-veltrix-blue focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-veltrix-gray-800 text-veltrix-gray-500 uppercase tracking-wider pb-3">
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Selling Price</th>
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
                        src={product.image || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=100'} 
                        alt={product.name} 
                        className="w-12 h-12 object-cover rounded-xl bg-veltrix-black border border-veltrix-gray-800 shrink-0" 
                      />
                      <div>
                        <p className="font-bold text-white text-sm line-clamp-1">{product.name}</p>
                        <p className="text-[11px] text-veltrix-gray-500">Brand: {product.brand || 'CarryGoExpress'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono text-veltrix-gray-400">
                    {product.sku || 'N/A'}
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-veltrix-gray-800/80 text-veltrix-gray-300 rounded-full font-medium">
                      {product.category}
                    </span>
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
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-veltrix-gray-500">
              No products found matching filters.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-veltrix-black-light rounded-2xl border border-veltrix-gray-800 shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-veltrix-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? 'Edit Supabase Product' : 'Add New Product to Store'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-veltrix-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field text-sm"
                    placeholder="CarryGo Hisense 55 Inch TV..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">SKU Code</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    className="input-field text-sm font-mono"
                    placeholder="CGO-TV-001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="input-field text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                    className="input-field text-sm"
                    placeholder="CarryGoExpress"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Price (₦) *</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="input-field text-sm"
                    placeholder="450000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Original Price (₦)</label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={e => setForm({ ...form, original_price: e.target.value })}
                    className="input-field text-sm"
                    placeholder="500000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Inventory Stock Quantity</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="input-field text-sm"
                    placeholder="10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-veltrix-gray-300">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="active">Active (Visible in Store)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-veltrix-gray-300">Image URL</label>
                <input
                  type="url"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  className="input-field text-sm"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-veltrix-gray-300">Badge (e.g. Best Seller, New)</label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={e => setForm({ ...form, badge: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Best Seller"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-veltrix-gray-300">Description</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input-field text-sm resize-none"
                  placeholder="Product features, display size, warranty..."
                />
              </div>

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
                  {submitting ? 'Saving...' : editingProduct ? 'Save Updates' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
