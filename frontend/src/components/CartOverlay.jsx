import { useState, useEffect } from 'react'
import { X, Minus, Plus, Trash2, ArrowRight, ArrowLeft, ShoppingBag, Check, Loader2 } from 'lucide-react'
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
    subscription: '/mois', backToCart: 'Retour au panier',
    formTitle: 'Informations de livraison',
    firstName: 'Prénom', lastName: 'Nom', email: 'Email', phone: 'Téléphone',
    address: 'Adresse', city: 'Ville', postalCode: 'Code postal', country: 'Pays',
    pay: 'Payer maintenant', paying: 'Redirection vers le paiement...',
    error: 'Une erreur est survenue. Veuillez réessayer.',
    required: 'Ce champ est requis',
  },
  en: {
    title: 'Your cart', empty: 'Your cart is empty',
    emptyDesc: 'Discover our prevention devices.', back: 'Back to home',
    subtotal: 'Subtotal', shipping: 'Shipping', total: 'Total', checkout: 'Checkout',
    freeShipping: 'Free shipping included', freeLabel: 'Free', deliveryBy: 'Estimated delivery',
    subscription: '/month', backToCart: 'Back to cart',
    formTitle: 'Shipping information',
    firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone',
    address: 'Address', city: 'City', postalCode: 'Postal code', country: 'Country',
    pay: 'Pay now', paying: 'Redirecting to payment...',
    error: 'An error occurred. Please try again.',
    required: 'This field is required',
  },
}

function FormField({ label, value, onChange, type = 'text', required = true, placeholder = '' }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.15em] text-white/30 font-medium mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/15 focus:outline-none focus:border-white/25 focus:bg-white/[0.08] transition-all duration-300"
      />
    </div>
  )
}

export default function CartOverlay({ isOpen, onClose }) {
  const { lang } = useI18n()
  const { items, removeItem, updateQuantity, total, subscriptionTotal, count, checkout, isLoading } = useCart()
  const tx = TEXTS[lang] || TEXTS.fr
  const delivery = getDeliveryDate(lang)
  const [step, setStep] = useState('cart')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    address: '', city: '', postal_code: '', country: 'FR',
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setStep('cart')
      setError('')
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

  const updateForm = (field) => (value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleCheckout = () => {
    if (items.length === 0) return
    setStep('form')
  }

  const handlePay = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await checkout({ ...form, lang })
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (err) {
      setError(err.message || tx.error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-0 left-0 w-screen h-screen z-[100] bg-[#1a120a]/60 overflow-y-auto" style={{backdropFilter: 'blur(100px)', WebkitBackdropFilter: 'blur(100px)'}} data-testid="cart-overlay" onClick={onClose}>
          <div className="flex items-start justify-center pt-[6vh] px-4 min-h-full pb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  {step === 'form' && (
                    <button onClick={() => setStep('cart')} className="text-white/30 hover:text-white transition-colors mr-1">
                      <ArrowLeft size={18} strokeWidth={1.5} />
                    </button>
                  )}
                  <h2 className="text-white text-2xl font-semibold tracking-tight">
                    {step === 'cart' ? tx.title : tx.formTitle}
                  </h2>
                  {step === 'cart' && count > 0 && <span className="text-white/30 text-lg">{count}</span>}
                </div>
                <button onClick={onClose} data-testid="cart-close"
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {step === 'cart' && (
                  <motion.div key="cart" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
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
                            <div key={item.variant_id ? `${item.id}__${item.variant_id}` : item.id} className="flex gap-5 py-5 border-b border-white/10" data-testid={`cart-item-${item.id}`}>
                              <div className="w-18 h-18 rounded-xl bg-white/[0.04] flex-shrink-0 p-2">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="text-white text-[15px] font-semibold">{item.name}</h3>
                                    {item.variant_label && <p className="text-white/25 text-[13px] mt-0.5">{item.variant_label}</p>}
                                  </div>
                                  <button onClick={() => removeItem(item.id, item.variant_id)} className="text-white/15 hover:text-red-400 transition-colors">
                                    <Trash2 size={15} strokeWidth={1.5} />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-4">
                                    <button onClick={() => updateQuantity(item.id, item.variant_id, item.quantity - 1)}
                                      className="text-white/30 hover:text-white transition-colors"><Minus size={15} /></button>
                                    <span className="text-white text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.variant_id, item.quantity + 1)}
                                      className="text-white/30 hover:text-white transition-colors"><Plus size={15} /></button>
                                  </div>
                                  <div className="text-right">
                                    {item.price > 0 && <span className="text-white text-[15px] font-semibold">{(item.price * item.quantity).toLocaleString()}&euro;</span>}
                                    {item.subscription_price > 0 && (
                                      <span className="text-emerald-400/70 text-[12px] block">+{(item.subscription_price * item.quantity).toFixed(2)}&euro;{tx.subscription}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Free shipping banner */}
                        <div className="py-4 border-b border-white/10">
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-transparent border border-emerald-500/15 px-5 py-3.5">
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            />
                            <div className="relative flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                  <Check size={16} className="text-emerald-400" strokeWidth={2.5} />
                                </div>
                                <div>
                                  <p className="text-white text-[13px] font-semibold">{tx.freeShipping}</p>
                                  <p className="text-white/35 text-[11px] mt-0.5">{tx.deliveryBy}</p>
                                </div>
                              </div>
                              <div className="text-right pl-3">
                                <p className="text-white text-base font-bold leading-tight">{delivery.day}</p>
                                <p className="text-white/40 text-[11px]">{delivery.rest}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="py-5">
                          <div className="flex justify-between items-baseline">
                            <span className="text-white text-[15px] font-semibold">{tx.total}</span>
                            <div className="text-right">
                              {total > 0 && <span className="text-white text-2xl font-bold">{total.toLocaleString()}&euro;</span>}
                              {subscriptionTotal > 0 && (
                                <span className="text-emerald-400/70 text-[13px] block mt-0.5">+{subscriptionTotal.toFixed(2)}&euro;{tx.subscription}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button data-testid="cart-checkout" onClick={handleCheckout}
                          className="group relative w-full py-4 rounded-full text-white text-[15px] font-semibold overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                          <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full group-hover:bg-white/[0.18] transition-all duration-500" />
                          <span className="relative flex items-center justify-center gap-2.5">
                            {tx.checkout}
                            <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
                          </span>
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {step === 'form' && (
                  <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
                    <form onSubmit={handlePay} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label={tx.firstName} value={form.first_name} onChange={updateForm('first_name')} />
                        <FormField label={tx.lastName} value={form.last_name} onChange={updateForm('last_name')} />
                      </div>
                      <FormField label={tx.email} value={form.email} onChange={updateForm('email')} type="email" />
                      <FormField label={tx.phone} value={form.phone} onChange={updateForm('phone')} type="tel" required={false} />
                      <FormField label={tx.address} value={form.address} onChange={updateForm('address')} />
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label={tx.city} value={form.city} onChange={updateForm('city')} />
                        <FormField label={tx.postalCode} value={form.postal_code} onChange={updateForm('postal_code')} />
                      </div>

                      {/* Order summary */}
                      <div className="mt-6 pt-5 border-t border-white/10">
                        <div className="flex justify-between items-baseline mb-4">
                          <span className="text-white/50 text-[13px]">{tx.total}</span>
                          <div className="text-right">
                            {total > 0 && <span className="text-white text-xl font-bold">{total.toLocaleString()}&euro;</span>}
                            {subscriptionTotal > 0 && (
                              <span className="text-emerald-400/70 text-[12px] block">+{subscriptionTotal.toFixed(2)}&euro;{tx.subscription}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-[13px]" data-testid="checkout-error">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        data-testid="cart-pay"
                        className="group relative w-full py-4 rounded-full text-[15px] font-semibold overflow-hidden transition-all duration-500 disabled:opacity-50"
                      >
                        <span className="absolute inset-0 bg-emerald-500 rounded-full group-hover:bg-emerald-600 transition-all duration-300" />
                        <span className="relative flex items-center justify-center gap-2.5 text-white">
                          {isLoading ? (
                            <><Loader2 size={16} className="animate-spin" />{tx.paying}</>
                          ) : (
                            <>{tx.pay}<ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" /></>
                          )}
                        </span>
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-center mt-8">
                <span className="text-white/15 text-[10px] tracking-widest">ESC</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
