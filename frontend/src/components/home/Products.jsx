import { motion } from 'framer-motion'
import { ArrowRight, Heart, Shield, Activity } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: 'https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=1200',
    href: '/produits/elio',
    icon: Heart,
    fr: {
      tag: 'Sans engagement',
      name: 'Bracelet Elio',
      type: 'Bracelet connecté',
      price: '24.9€',
      unit: '/mois',
      desc: 'Suivi santé continu : fréquence cardiaque, température, sommeil, activité.',
      features: ['Suivi cardiaque', 'SpO2 & température', 'Sommeil', '10j autonomie'],
      cta: 'Découvrir',
    },
    en: {
      tag: 'No commitment',
      name: 'Elio Bracelet',
      type: 'Smart bracelet',
      price: '€24.9',
      unit: '/month',
      desc: 'Continuous health monitoring: heart rate, temperature, sleep, activity.',
      features: ['Heart monitoring', 'SpO2 & temp', 'Sleep', '10d battery'],
      cta: 'Discover',
    },
  },
  {
    key: 'vita',
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    href: '/produits/vita',
    icon: Activity,
    fr: {
      tag: 'Nouveau',
      name: 'Balance Vita',
      type: 'Balance connectée',
      price: '229€',
      unit: ' TTC',
      desc: 'Analyse complète de la composition corporelle, hydratation, métabolisme.',
      features: ['Composition corporelle', 'Masse musculaire', 'Hydratation', 'Multi-profils'],
      cta: 'Découvrir',
    },
    en: {
      tag: 'New',
      name: 'Vita Scale',
      type: 'Smart scale',
      price: '€229',
      unit: ' incl. tax',
      desc: 'Complete body composition analysis, hydration, metabolism tracking.',
      features: ['Body composition', 'Muscle mass', 'Hydration', 'Multi-profiles'],
      cta: 'Discover',
    },
  },
  {
    key: 'elder',
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
    href: '/produits/elder',
    icon: Shield,
    fr: {
      tag: 'Made in France',
      name: 'Gilet Elder',
      type: 'Gilet airbag',
      price: '879€',
      unit: ' TTC',
      desc: 'Protection vitale du dos, tête, bassin, hanches. Déclenchement en 0.08s.',
      features: ['Déclenchement 0.08s', 'Protection intégrale', 'Alerte chute', '36h autonomie'],
      cta: 'Découvrir',
    },
    en: {
      tag: 'Made in France',
      name: 'Elder Vest',
      type: 'Airbag vest',
      price: '€879',
      unit: ' incl. tax',
      desc: 'Vital protection for back, head, pelvis, hips. 0.08s automatic deployment.',
      features: ['0.08s deployment', 'Full protection', 'Fall alert', '36h battery'],
      cta: 'Discover',
    },
  },
]

export default function Products() {
  const { t, lang } = useI18n()

  return (
    <section id="products" data-testid="products-section" className="py-20 md:py-28">
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

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {PRODUCTS.map((product, idx) => {
            const tx = product[lang] || product.fr
            const Icon = product.icon
            return (
              <motion.a
                key={product.key}
                href={product.href}
                data-testid={`product-card-${product.key}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="group block"
              >
                {/* Image area */}
                <div className="relative bg-[#f3f3f3] rounded-2xl overflow-hidden h-[340px] md:h-[400px] lg:h-[440px] mb-5">
                  {/* Tag */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white text-slate-600 shadow-sm">
                      {tx.tag}
                    </span>
                  </div>

                  {/* Decorative number */}
                  <div className="absolute bottom-4 right-5 z-10">
                    <span className="text-[80px] md:text-[100px] font-extralight leading-none text-slate-900/[0.04] select-none">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Product image */}
                  <img
                    src={product.image}
                    alt={tx.name}
                    className="absolute inset-0 w-full h-full object-contain p-10 md:p-12 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="px-1">
                  {/* Icon + Type */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <Icon size={15} strokeWidth={1.5} className="text-slate-400" />
                    <span className="text-[11px] uppercase tracking-[0.12em] text-slate-400 font-medium">{tx.type}</span>
                  </div>

                  {/* Name + Price */}
                  <div className="flex items-end justify-between mb-2.5">
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">{tx.name}</h3>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-bold text-slate-900">{tx.price}</span>
                      <span className="text-xs text-slate-400">{tx.unit}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-slate-400 leading-relaxed mb-4">{tx.desc}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                    {tx.features.map((f, i) => (
                      <span key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        {f}
                      </span>
                    ))}
                  </div>

                  {/* CTA line */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <span className="text-sm font-medium text-slate-900 group-hover:text-slate-600 transition-colors">{tx.cta}</span>
                    <ArrowRight size={14} strokeWidth={2} className="text-slate-400 group-hover:translate-x-1 transition-transform duration-300" />
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
