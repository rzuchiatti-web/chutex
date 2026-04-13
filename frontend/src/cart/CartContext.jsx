import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext()

const STORAGE_KEY = 'chutex_cart'

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveCart(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { saveCart(items) }, [items])

  const addItem = useCallback((item) => {
    setItems(prev => {
      const key = item.variant_id ? `${item.id}__${item.variant_id}` : item.id
      const existing = prev.find(i => (i.variant_id ? `${i.id}__${i.variant_id}` : i.id) === key)
      if (existing) {
        return prev.map(i =>
          (i.variant_id ? `${i.id}__${i.variant_id}` : i.id) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id, variantId) => {
    setItems(prev => prev.filter(i => {
      if (variantId) return !(i.id === id && i.variant_id === variantId)
      return i.id !== id
    }))
  }, [])

  const updateQuantity = useCallback((id, variantId, qty) => {
    if (qty <= 0) return removeItem(id, variantId)
    setItems(prev => prev.map(i => {
      if (variantId && i.id === id && i.variant_id === variantId) return { ...i, quantity: qty }
      if (!variantId && i.id === id) return { ...i, quantity: qty }
      return i
    }))
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const total = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0)
  const subscriptionTotal = items.reduce((sum, i) => sum + (i.subscription_price || 0) * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  const checkout = useCallback(async (customerInfo) => {
    setIsLoading(true)
    try {
      const API = import.meta.env.REACT_APP_BACKEND_URL
      const res = await fetch(`${API}/api/shop/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            product_id: i.id,
            variant_id: i.variant_id || null,
            quantity: i.quantity,
          })),
          ...customerInfo,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Checkout failed')
      }
      const data = await res.json()
      return data
    } finally {
      setIsLoading(false)
    }
  }, [items])

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      total, subscriptionTotal, count, checkout, isLoading,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() { return useContext(CartContext) }
