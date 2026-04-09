import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../cart/CartContext'
import { useI18n } from '../i18n/I18nContext'

const TEXTS = {
  fr: {
    title: 'Votre panier', empty: 'Votre panier est vide',
    emptyDesc: 'Découvrez nos dispositifs de prévention.', back: "Retour à l'accueil",
    subtotal: 'Sous-total', shipping: 'Livraison', free: 'Gratuite', total: 'Total', checkout: 'Passer commande',
  },
  en: {
    title: 'Your cart', empty: 'Your cart is empty',
    emptyDesc: 'Discover our prevention devices.', back: 'Back to home',
    subtotal: 'Subtotal', shipping: 'Shipping', free: 'Free', total: 'Total', checkout: 'Checkout',
  },
}

export default function CartOverlay({ isOpen, onClose }) {
  const { lang } = useI18n()
  const { items, removeItem, updateQuantity, total, count } = useCart()
  const tx = TEXTS[lang] || TEXTS.fr

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }} className="fixed inset-0 z-[100]" data-testid="cart-overlay">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl" onClick={onClose} />

          <div className="relative flex items-start justify-center pt-[10vh] px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md">

              {/* Title */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <h2 className="text-white text-xl font-semibold tracking-tight">{tx.title}</h2>
                  {count > 0 && <span className="text-white/30 text-sm">{count}</span>}
                </div>
                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors" data-testid="cart-close">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag size={32} className="text-white/10 mx-auto mb-4" strokeWidth={1} />
                  <p className="text-white/50 text-sm mb-1">{tx.empty}</p>
                  <p className="text-white/20 text-xs mb-8">{tx.emptyDesc}</p>
                  <button onClick={onClose} data-testid="cart-back-home"
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-white text-sm font-medium overflow-hidden transition-all duration-500">
                    <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full group-hover:bg-white/[0.16] transition-all duration-500" />
                    <span className="relative">{tx.back}</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className="border-t border-white/10">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 py-5 border-b border-white/10" data-testid={`cart-item-${item.id}`}>
                        <div className="w-16 h-16 rounded-lg bg-white/[0.04] flex-shrink-0 p-1.5">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white text-sm font-medium">{item.name}</h3>
                              <p className="text-white/25 text-xs mt-0.5">{item.variant}</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-white/15 hover:text-red-400 transition-colors">
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="text-white/30 hover:text-white transition-colors"><Minus size={14} /></button>
                              <span className="text-white text-xs font-medium w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="text-white/30 hover:text-white transition-colors"><Plus size={14} /></button>
                            </div>
                            <span className="text-white text-sm font-medium">{(item.price * item.quantity).toLocaleString()}€</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="py-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/30">{tx.subtotal}</span>
                      <span className="text-white/60">{total.toLocaleString()}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/30">{tx.shipping}</span>
                      <span className="text-emerald-400/80 text-xs">{tx.free}</span>
                    </div>
                    <div className="border-t border-white/10 pt-4 flex justify-between">
                      <span className="text-white font-medium">{tx.total}</span>
                      <span className="text-white text-lg font-semibold">{total.toLocaleString()}€</span>
                    </div>
                  </div>

                  {/* Checkout button */}
                  <button data-testid="cart-checkout"
                    className="group relative w-full py-3.5 rounded-full text-white text-sm font-semibold overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full group-hover:bg-white/[0.18] transition-all duration-500" />
                    <span className="relative flex items-center justify-center gap-2">
                      {tx.checkout}
                      <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                </>
              )}

              <div className="flex justify-center mt-8">
                <span className="text-white/15 text-[10px] tracking-widest">ESC</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
