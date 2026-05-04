import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Package, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useCart } from '../cart/CartContext'

const TEXTS = {
  fr: {
    loading: 'Verification de votre commande...',
    successTitle: 'Commande confirmee !',
    successDesc: 'Merci pour votre achat. Votre commande est en cours de preparation.',
    orderNum: 'Numero de commande',
    total: 'Total paye',
    subscription: 'Abonnement mensuel',
    delivery: 'Livraison estimee',
    deliveryTime: '3-5 jours ouvrables',
    email: 'Un email de confirmation a ete envoye a',
    backHome: "Retour a l'accueil",
    trackOrder: 'Suivre ma commande',
    pendingTitle: 'Paiement en attente',
    pendingDesc: 'Votre paiement est en cours de traitement. Vous recevrez un email de confirmation sous peu.',
    failedTitle: 'Paiement echoue',
    failedDesc: 'Le paiement n\'a pas abouti. Veuillez reessayer.',
    retry: 'Reessayer',
    errorTitle: 'Commande introuvable',
    errorDesc: 'Nous n\'avons pas pu retrouver cette commande.',
  },
  en: {
    loading: 'Verifying your order...',
    successTitle: 'Order confirmed!',
    successDesc: 'Thank you for your purchase. Your order is being prepared.',
    orderNum: 'Order number',
    total: 'Total paid',
    subscription: 'Monthly subscription',
    delivery: 'Estimated delivery',
    deliveryTime: '3-5 business days',
    email: 'A confirmation email has been sent to',
    backHome: 'Back to home',
    trackOrder: 'Track my order',
    pendingTitle: 'Payment pending',
    pendingDesc: 'Your payment is being processed. You will receive a confirmation email shortly.',
    failedTitle: 'Payment failed',
    failedDesc: 'The payment did not go through. Please try again.',
    retry: 'Try again',
    errorTitle: 'Order not found',
    errorDesc: 'We could not find this order.',
  },
}

export default function OrderConfirmationPage() {
  const { lang } = useI18n()
  const { clearCart } = useCart()
  const tx = TEXTS[lang] || TEXTS.fr
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!orderId) { setLoading(false); setError(true); return }

    const fetchOrder = async () => {
      try {
        const API = import.meta.env.REACT_APP_BACKEND_URL || ''
        const res = await fetch(`${API}/api/shop/order/${orderId}`)
        if (!res.ok) throw new Error('Not found')
        const data = await res.json()
        setOrder(data)
        if (data.status === 'paid') {
          clearCart()
        }
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
    const interval = setInterval(fetchOrder, 5000)
    return () => clearInterval(interval)
  }, [orderId, clearCart])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center" data-testid="order-loading">
        <div className="text-center">
          <Loader2 size={32} className="text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-[15px]">{tx.loading}</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center" data-testid="order-error">
        <div className="text-center max-w-md px-6">
          <AlertCircle size={40} className="text-slate-300 mx-auto mb-5" strokeWidth={1.5} />
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">{tx.errorTitle}</h1>
          <p className="text-slate-400 text-[15px] mb-8">{tx.errorDesc}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-all">
            {tx.backHome}
          </Link>
        </div>
      </div>
    )
  }

  const isPaid = order.status === 'paid'
  const isFailed = order.status === 'failed' || order.status === 'canceled' || order.status === 'expired'

  return (
    <div className="min-h-screen bg-[#f7f7f7] pt-28 md:pt-36 pb-20" data-testid="order-confirmation-page">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {isPaid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6">
                <Check size={28} className="text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-3" data-testid="order-success-title">{tx.successTitle}</h1>
              <p className="text-[15px] text-slate-400">{tx.successDesc}</p>
            </>
          ) : isFailed ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={28} className="text-white" strokeWidth={2} />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-3">{tx.failedTitle}</h1>
              <p className="text-[15px] text-slate-400 mb-8">{tx.failedDesc}</p>
              <Link to="/produits/elder" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-all">
                {tx.retry} <ArrowRight size={15} strokeWidth={2} />
              </Link>
            </>
          ) : (
            <>
              <Loader2 size={32} className="text-emerald-500 animate-spin mx-auto mb-6" />
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-3">{tx.pendingTitle}</h1>
              <p className="text-[15px] text-slate-400">{tx.pendingDesc}</p>
            </>
          )}
        </motion.div>

        {(isPaid || order.status === 'pending_payment') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-slate-200/60 rounded-3xl p-7 md:p-9"
          >
            {/* Order number */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-200">
              <span className="text-[13px] text-slate-400">{tx.orderNum}</span>
              <span className="text-[15px] font-semibold text-slate-900 font-mono" data-testid="order-id">#{order.order_id}</span>
            </div>

            {/* Items */}
            {order.items && order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-slate-50 flex-shrink-0 p-2">
                  <img src={item.image} alt={item.product_name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-slate-900">{item.product_name}</p>
                  {item.variant_label && <p className="text-[12px] text-slate-400">{item.variant_label}</p>}
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-semibold text-slate-900">{item.line_total.toLocaleString()}&euro;</span>
                  {item.quantity > 1 && <p className="text-[11px] text-slate-400">x{item.quantity}</p>}
                </div>
              </div>
            ))}

            {/* Totals */}
            <div className="pt-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-[14px] font-semibold text-slate-900">{tx.total}</span>
                <span className="text-xl font-bold text-slate-900">{order.total?.toLocaleString()}&euro;</span>
              </div>
              {order.subscription_monthly > 0 && (
                <div className="flex justify-between">
                  <span className="text-[13px] text-slate-400">{tx.subscription}</span>
                  <span className="text-[14px] font-semibold text-emerald-600">+{order.subscription_monthly?.toFixed(2)}&euro;/mois</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[13px] text-slate-400">{tx.delivery}</span>
                <span className="text-[13px] text-slate-500">{tx.deliveryTime}</span>
              </div>
            </div>

            {order.customer?.email && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[13px] text-slate-400 text-center">
                  {tx.email} <span className="font-semibold text-slate-600">{order.customer.email}</span>
                </p>
              </div>
            )}
          </motion.div>
        )}

        {isPaid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-10"
          >
            <Link
              to="/"
              data-testid="order-back-home"
              className="group inline-flex items-center gap-2.5 text-[14px] font-semibold text-slate-900 hover:text-emerald-600 transition-colors duration-300"
            >
              {tx.backHome}
              <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
