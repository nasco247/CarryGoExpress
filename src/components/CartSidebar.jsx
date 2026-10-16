import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../hooks/useStore'
import { formatPrice } from '../lib/utils'

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore()
  const sidebarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeCart()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeCart} />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="relative w-full max-w-md bg-veltrix-black-light border-l border-veltrix-gray-800 flex flex-col animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-veltrix-gray-800">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-veltrix-blue" />
            <h2 className="text-xl font-bold">Your Cart</h2>
            <span className="px-2.5 py-0.5 bg-veltrix-blue/20 text-veltrix-blue text-sm font-semibold rounded-full">
              {items.length} items
            </span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-veltrix-gray-400 hover:text-white transition-colors rounded-lg hover:bg-veltrix-gray-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-veltrix-gray-900 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-veltrix-gray-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-veltrix-gray-300">Your cart is empty</p>
                <p className="text-sm text-veltrix-gray-500 mt-1">Add some products to get started</p>
              </div>
              <button
                onClick={closeCart}
                className="btn-primary"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-veltrix-black rounded-xl border border-veltrix-gray-800/50 group hover:border-veltrix-blue/30 transition-all"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.id}`}
                    onClick={closeCart}
                    className="text-sm font-medium text-white hover:text-veltrix-blue transition-colors line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-veltrix-gray-500 mt-1">{item.brand}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-veltrix-gray-900 text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-800 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-veltrix-gray-900 text-veltrix-gray-400 hover:text-white hover:bg-veltrix-gray-800 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-veltrix-blue">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-veltrix-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-veltrix-gray-800 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-veltrix-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-sm text-veltrix-gray-400">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-veltrix-gray-800">
                <span>Total</span>
                <span className="text-veltrix-blue">{formatPrice(getTotalPrice())}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={clearCart}
              className="w-full py-2 text-sm text-veltrix-gray-500 hover:text-red-400 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
