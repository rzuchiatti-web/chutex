import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: 'https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=1200',
    href: '/produits/elio',
    color: 'from-slate-900/90 via-slate-900/60',
    fr: {
      badge: 'Sans engagement',
      name: 'Bracelet Elio',
      type: 'Bracelet connecté',
      price: '24.9€',
      unit: '/mois',
      desc: 'Suivi santé continu : fréquence cardiaque, température, sommeil, activité. Alertes préventives en temps réel.',
      features: ['Suivi cardiaque', 'SpO2 & température', 'Analyse du sommeil', '10 jours d\'autonomie'],
      cta: 'Découvrir Elio',
    },
    en: {
      badge: 'No commitment',
      name: 'Elio Bracelet',
      type: 'Smart bracelet',
      price: '€24.9',
      unit: '/month',
      desc: 'Continuous health monitoring: heart rate, temperature, sleep, activity. Real-time preventive alerts.',
      features: ['Heart monitoring', 'SpO2 & temperature', 'Sleep analysis', '10 days battery'],
      cta: 'Discover Elio',
    },
  },
  {
    key: 'vita',
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    href: '/produits/vita',
    color: 'from-slate-900/90 via-slate-900/60',
    fr: {
      badge: 'Nouveau',
      name: 'Balance Vita',
      type: 'Balance connectée',
      price: '229€',
      unit: ' TTC',
      desc: 'Analyse complète de la composition corporelle. Suivi du poids, masse musculaire, hydratation, métabolisme.',
      features: ['Composition corporelle', 'Masse musculaire', 'Hydratation', 'Multi-profils'],
      cta: 'Découvrir Vita',
    },
    en: {
      badge: 'New',
      name: 'Vita Scale',
      type: 'Smart scale',
      price: '€229',
      unit: ' incl. tax',
      desc: 'Complete body composition analysis. Weight, muscle mass, hydration, metabolism tracking.',
      features: ['Body composition', 'Muscle mass', 'Hydration', 'Multi-profiles'],
      cta: 'Discover Vita',
    },
  },
  {
    key: 'elder',
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
    href: '/produits/elder',
    color: 'from-slate-900/90 via-slate-900/60',
    fr: {
      badge: 'Made in France',
      name: 'Gilet Elder',
      type: 'Gilet airbag',
      price: '879€',
      unit: ' TTC',
      desc: 'Protection vitale du dos, de la tête, du bassin et des hanches. Déclenchement automatique en 0.08s.',
      features: ['Déclenchement 0.08s', 'Protection intégrale', 'Alerte chute auto', '36h d\'autonomie'],
      cta: 'Découvrir Elder',
    },
    en: {
      badge: 'Made in France',
      name: 'Elder Vest',
      type: 'Airbag vest',
      price: '€879',
      unit: ' incl. tax',
      desc: 'Vital protection for the back, head, pelvis, and hips. Automatic deployment in 0.08s.',
      features: ['0.08s deployment', 'Full protection', 'Auto fall alert', '36h battery'],
      cta: 'Discover Elder',
    },
  },
]

export default function Products() {
  const { t, lang } = useI18n()

  return (
    <section id="products" data-testid="products-section" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1780px] mx-auto px-6 md:px-12">
        {/* Title */}
        <div className="mb-12 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900/40" />
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
              {t('products.overline')}
            </p>
          </div>
          <h2 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.025em] leading-tight font-semibold mb-3">
            {t('products.title')} {t('products.titleHighlight')}
          </h2>
          <div className="h-px w-full bg-slate-200 mt-8" />
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {PRODUCTS.map((product, idx) => {
            const tx = product[lang] || product.fr
            return (
              <motion.a
                key={product.key}
                href={product.href}
                data-testid={`product-card-${product.key}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="group relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-100 h-[500px] md:h-[600px] lg:h-[680px] flex flex-col"
              >
                {/* Product image */}
                <div className="flex-1 relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={tx.name}
                    className="absolute inset-0 w-full h-full object-contain p-8 md:p-10 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Top badge */}
                <div className="absolute top-5 left-5">
                  <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/90 text-slate-700 backdrop-blur-sm">
                    {tx.badge}
                  </span>
                </div>

                {/* Bottom info overlay */}
                <div className="relative bg-slate-900 text-white p-6 md:p-7">
                  {/* Type + Price row */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-white/40">{tx.type}</p>
                    <div className="flex items-baseline">
                      <span className="text-xl font-bold">{tx.price}</span>
                      <span className="text-xs text-white/40 ml-0.5">{tx.unit}</span>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">{tx.name}</h3>

                  {/* Features row */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tx.features.map((f, i) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 rounded-full border border-white/15 text-white/50">
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-white/70 group-hover:text-white transition-colors duration-300">
                    <span className="text-sm font-medium">{tx.cta}</span>
                    <ArrowRight size={14} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
