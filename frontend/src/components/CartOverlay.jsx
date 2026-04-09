import { useState, useEffect } from 'react'
import { X, Minus, Plus, Trash2, ArrowRight, ShoppingBag, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../cart/CartContext'
import { useI18n } from '../i18n/I18nContext'

function getDeliveryDate(lang) {
  const now = new Date()
  const d = new Date(now)
  let added = 0
  while (added < 3) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() === 0) continue
    added++
  }
  const loc = lang === 'fr' ? 'fr-FR' : 'en-US'
  const weekday = d.toLocaleDateString(loc, { weekday: 'long' })
  const dayNum = d.getDate()
  const month = d.toLocaleDateString(loc, { month: 'long' })
  return { day: `${weekday} ${dayNum}`, rest: month }
}

const TEXTS = {
  fr: {
    title: 'Votre panier', empty: 'Votre panier est vide',
    emptyDesc: 'Découvrez nos dispositifs de prévention.', back: "Retour à l'accueil",
    subtotal: 'Sous-total', shipping: 'Livraison', total: 'Total', checkout: 'Passer commande',
    freeShipping: 'Livraison offerte', freeLabel: 'Offerte', deliveryBy: 'Livraison estimée le',
  },
  en: {
    title: 'Your cart', empty: 'Your cart is empty',
    emptyDesc: 'Discover our prevention devices.', back: 'Back to home',
    subtotal: 'Subtotal', shipping: 'Shipping', total: 'Total', checkout: 'Checkout',
    freeShipping: 'Free shipping included', freeLabel: 'Free', deliveryBy: 'Estimated delivery',
  },
}

export default function CartOverlay({ isOpen, onClose }) {
  const { lang } = useI18n()
  const { items, removeItem, updateQuantity, total, count } = useCart()
  const tx = TEXTS[lang] || TEXTS.fr
  const delivery = getDeliveryDate(lang)
  const deliveryDay = delivery.day
  const deliveryRest = delivery.rest

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[100] bg-black/65 overflow-y-auto" style={{backdropFilter: 'blur(100px)', WebkitBackdropFilter: 'blur(100px)'}} data-testid="cart-overlay" onClick={onClose}>
          <div className="flex items-start justify-center pt-[8vh] px-4 min-h-full pb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <h2 className="text-white text-2xl font-semibold tracking-tight">{tx.title}</h2>
                  {count > 0 && <span className="text-white/30 text-lg">{count}</span>}
                </div>
                <button onClick={onClose} data-testid="cart-close"
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={40} className="text-white/10 mx-auto mb-5" strokeWidth={1} />
                  <p className="text-white/50 text-base mb-1">{tx.empty}</p>
                  <p className="text-white/20 text-sm mb-10">{tx.emptyDesc}</p>
                  <button onClick={onClose} data-testid="cart-back-home"
                    className="group relative inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-full text-white text-sm font-medium overflow-hidden">
                    <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full group-hover:bg-white/[0.16] transition-all duration-500" />
                    <span className="relative">{tx.back}</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="border-t border-white/10">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-5 py-6 border-b border-white/10" data-testid={`cart-item-${item.id}`}>
                        <div className="w-20 h-20 rounded-xl bg-white/[0.04] flex-shrink-0 p-2">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white text-base font-semibold">{item.name}</h3>
                              <p className="text-white/25 text-sm mt-1">{item.variant}</p>
                            </div>
                            <button onClick={() => removeItem(item.id)} className="text-white/15 hover:text-red-400 transition-colors">
                              <Trash2 size={15} strokeWidth={1.5} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="text-white/30 hover:text-white transition-colors"><Minus size={15} /></button>
                              <span className="text-white text-sm font-semibold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="text-white/30 hover:text-white transition-colors"><Plus size={15} /></button>
                            </div>
                            <span className="text-white text-base font-semibold">{(item.price * item.quantity).toLocaleString()}€</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Free shipping — premium animated banner */}
                  <div className="py-5 border-b border-white/10">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent border border-emerald-500/15 px-5 py-4">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Check size={18} className="text-emerald-400" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-white text-sm font-semibold">{tx.freeShipping}</p>
                            <p className="text-white/40 text-xs mt-0.5">{tx.deliveryBy}</p>
                          </div>
                        </div>
                        <div className="text-right pl-4">
                          <p className="text-white text-lg font-bold leading-tight">{deliveryDay} {deliveryRest}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="py-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-white text-base font-semibold">{tx.total}</span>
                      <span className="text-white text-2xl font-bold">{total.toLocaleString()}€</span>
                    </div>
                  </div>

                  <button data-testid="cart-checkout"
                    className="group relative w-full py-4 rounded-full text-white text-[15px] font-semibold overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full group-hover:bg-white/[0.18] transition-all duration-500" />
                    <span className="relative flex items-center justify-center gap-2.5">
                      {tx.checkout}
                      <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </>
              )}

              <div className="flex justify-center mt-10">
                <span className="text-white/15 text-[10px] tracking-widest">ESC</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
