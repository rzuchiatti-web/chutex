import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: 'https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=1200',
    href: '/produits/elio',
    stat: '10',
    statSuffix: { fr: 'jours d\'autonomie', en: 'days battery' },
    fr: {
      tag: 'Sans engagement',
      name: 'Elio',
      type: 'Bracelet connecté',
      price: '24.9€',
      unit: '/mois',
      headline: 'Votre santé, à votre poignet.',
      features: ['Suivi cardiaque continu', 'SpO2 & température', 'Analyse du sommeil', 'Alertes préventives', 'Étanche 50m'],
      cta: 'Découvrir Elio',
    },
    en: {
      tag: 'No commitment',
      name: 'Elio',
      type: 'Smart bracelet',
      price: '€24.9',
      unit: '/month',
      headline: 'Your health, on your wrist.',
      features: ['Continuous heart monitoring', 'SpO2 & temperature', 'Sleep analysis', 'Preventive alerts', 'Waterproof 50m'],
      cta: 'Discover Elio',
    },
  },
  {
    key: 'vita',
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    href: '/produits/vita',
    stat: '12',
    statSuffix: { fr: 'mesures corporelles', en: 'body metrics' },
    fr: {
      tag: 'Nouveau',
      name: 'Vita',
      type: 'Balance connectée',
      price: '229€',
      unit: ' TTC',
      headline: 'Comprenez votre corps.',
      features: ['Composition corporelle', 'Masse musculaire & graisse', 'Suivi hydratation', 'Métabolisme basal', 'Multi-profils'],
      cta: 'Découvrir Vita',
    },
    en: {
      tag: 'New',
      name: 'Vita',
      type: 'Smart scale',
      price: '€229',
      unit: ' incl. tax',
      headline: 'Understand your body.',
      features: ['Body composition', 'Muscle mass & fat', 'Hydration tracking', 'Basal metabolism', 'Multi-profiles'],
      cta: 'Discover Vita',
    },
  },
  {
    key: 'elder',
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
    href: '/produits/elder',
    stat: '0.08',
    statSuffix: { fr: 'sec de déclenchement', en: 'sec deployment' },
    fr: {
      tag: 'Made in France',
      name: 'Elder',
      type: 'Gilet airbag',
      price: '879€',
      unit: ' TTC',
      headline: 'La protection invisible.',
      features: ['Protection dos & tête', 'Bassin & hanches', 'Alerte chute auto', 'Géolocalisation', '36h d\'autonomie'],
      cta: 'Découvrir Elder',
    },
    en: {
      tag: 'Made in France',
      name: 'Elder',
      type: 'Airbag vest',
      price: '€879',
      unit: ' incl. tax',
      headline: 'Invisible protection.',
      features: ['Back & head protection', 'Pelvis & hips', 'Auto fall alert', 'Geolocation', '36h battery life'],
      cta: 'Discover Elder',
    },
  },
]

function ProductCard({ product, lang, reversed }) {
  const tx = product[lang] || product.fr

  return (
    <motion.a
      href={product.href}
      data-testid={`product-card-${product.key}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group block rounded-[2rem] bg-[#f2f2f2] overflow-hidden"
    >
      <div className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-stretch min-h-[480px] md:min-h-[540px]`}>

        {/* Image */}
        <div className="md:w-[45%] relative flex items-center justify-center p-10 md:p-14">
          <motion.img
            src={product.image}
            alt={tx.name}
            className="relative w-full max-w-[300px] md:max-w-[340px] h-auto object-contain"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Content */}
        <div className="md:w-[55%] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          {/* Row: Type + Tag */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-medium">{tx.type}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{tx.tag}</span>
          </div>

          {/* Name + Headline */}
          <h3 className="text-4xl md:text-5xl font-semibold text-slate-900 tracking-[-0.03em] leading-[1.05] mb-2">
            {tx.name}
          </h3>
          <p className="text-lg text-slate-400 font-light mb-8">{tx.headline}</p>

          {/* Stat */}
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-5xl md:text-6xl font-extralight text-slate-900 leading-none tracking-tighter">{product.stat}</span>
            <span className="text-sm text-slate-400">{product.statSuffix[lang]}</span>
          </div>

          {/* Features — clean list */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-10">
            {tx.features.map((f, i) => (
              <span key={i} className="text-[13px] text-slate-500 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-400" />
                {f}
              </span>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-slate-900">{tx.price}</span>
              <span className="text-sm text-slate-400">{tx.unit}</span>
            </div>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-medium group-hover:bg-slate-800 transition-colors duration-300">
              {tx.cta}
              <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  )
}

export default function Products() {
  const { t, lang } = useI18n()

  return (
    <section id="products" data-testid="products-section" className="py-20 md:py-28">
      <div className="max-w-[1780px] mx-auto px-6 md:px-12">
        {/* Title */}
        <div className="mb-12 md:mb-16">
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
        <div className="flex flex-col gap-6 md:gap-8">
          {PRODUCTS.map((product, idx) => (
            <ProductCard key={product.key} product={product} lang={lang} reversed={idx % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
