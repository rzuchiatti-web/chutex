import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../cart/CartContext'
import { useI18n } from '../i18n/I18nContext'

const TEXTS = {
  fr: {
    title: 'Votre panier',
    empty: 'Votre panier est vide',
    emptyDesc: 'Découvrez nos dispositifs de prévention et ajoutez-les à votre panier.',
    back: "Retour à l'accueil",
    subtotal: 'Sous-total',
    shipping: 'Livraison',
    shippingFree: 'Gratuite',
    total: 'Total',
    checkout: 'Passer commande',
    remove: 'Retirer',
  },
  en: {
    title: 'Your cart',
    empty: 'Your cart is empty',
    emptyDesc: 'Discover our prevention devices and add them to your cart.',
    back: 'Back to home',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    shippingFree: 'Free',
    total: 'Total',
    checkout: 'Checkout',
    remove: 'Remove',
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={onClose} />

          <div className="relative flex items-start justify-center pt-[10vh] px-4">
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg">

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-white text-lg font-semibold">{tx.title}</h2>
                    {count > 0 && (
                      <span className="bg-white/15 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">{count}</span>
                    )}
                  </div>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1" data-testid="cart-close">
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>

                {items.length === 0 ? (
                  /* Empty state */
                  <div className="px-6 pb-8 pt-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
                      <ShoppingBag size={28} className="text-white/20" strokeWidth={1.5} />
                    </div>
                    <p className="text-white/70 text-sm font-medium mb-1">{tx.empty}</p>
                    <p className="text-white/30 text-xs mb-6">{tx.emptyDesc}</p>
                    <button onClick={onClose} data-testid="cart-back-home"
                      className="group relative inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-500">
                      <span className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl group-hover:bg-white/[0.16] transition-all duration-500" />
                      <span className="relative">{tx.back}</span>
                    </button>
                  </div>
                ) : (
                  /* Cart items */
                  <>
                    <div className="px-6 py-3 border-t border-white/10 max-h-[40vh] overflow-y-auto space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4" data-testid={`cart-item-${item.id}`}>
                          <div className="w-20 h-20 rounded-xl bg-white/[0.06] border border-white/10 flex-shrink-0 overflow-hidden p-2">
                            <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-white text-sm font-semibold">{item.name}</h3>
                                <p className="text-white/35 text-xs mt-0.5">{item.variant}</p>
                              </div>
                              <button onClick={() => removeItem(item.id)}
                                className="text-white/20 hover:text-red-400 transition-colors p-1 -mr-1">
                                <Trash2 size={14} strokeWidth={1.5} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-0.5 bg-white/[0.06] border border-white/10 rounded-lg">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1.5 text-white/40 hover:text-white transition-colors">
                                  <Minus size={13} strokeWidth={2} />
                                </button>
                                <span className="text-white text-xs font-semibold w-6 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1.5 text-white/40 hover:text-white transition-colors">
                                  <Plus size={13} strokeWidth={2} />
                                </button>
                              </div>
                              <span className="text-white text-sm font-semibold">{(item.price * item.quantity).toLocaleString()}€</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals + Checkout */}
                    <div className="px-6 py-5 border-t border-white/10 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">{tx.subtotal}</span>
                        <span className="text-white/70">{total.toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">{tx.shipping}</span>
                        <span className="text-emerald-400 text-xs font-medium">{tx.shippingFree}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/10">
                        <span className="text-white font-semibold">{tx.total}</span>
                        <span className="text-white text-lg font-bold">{total.toLocaleString()}€</span>
                      </div>

                      <button data-testid="cart-checkout"
                        className="group relative w-full py-3.5 rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-500 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] mt-2">
                        <span className="absolute inset-0 bg-white/15 border border-white/25 rounded-xl group-hover:bg-white/[0.22] transition-all duration-500" />
                        <span className="relative flex items-center justify-center gap-2">
                          {tx.checkout}
                          <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-center mt-4">
                <span className="text-white/20 text-xs">ESC</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
