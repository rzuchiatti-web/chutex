import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: 'https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=1200',
    href: '/produits/elio',
    stat: '10',
    statUnit: { fr: 'jours', en: 'days' },
    statLabel: { fr: "d'autonomie", en: 'battery life' },
    fr: {
      tag: 'Sans engagement',
      name: 'Elio',
      type: 'Bracelet connecté',
      price: '24.9€',
      unit: '/mois',
      headline: 'Votre santé, à votre poignet.',
      desc: 'Fréquence cardiaque, température, SpO2, sommeil, activité — le bracelet Elio surveille vos constantes en continu et alerte vos proches en temps réel.',
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
      desc: 'Heart rate, temperature, SpO2, sleep, activity — the Elio bracelet monitors your vitals continuously and alerts your loved ones in real time.',
      features: ['Continuous heart monitoring', 'SpO2 & temperature', 'Sleep analysis', 'Preventive alerts', 'Waterproof 50m'],
      cta: 'Discover Elio',
    },
  },
  {
    key: 'vita',
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    href: '/produits/vita',
    stat: '12',
    statUnit: { fr: 'mesures', en: 'metrics' },
    statLabel: { fr: 'corporelles', en: 'tracked' },
    fr: {
      tag: 'Nouveau',
      name: 'Vita',
      type: 'Balance connectée',
      price: '229€',
      unit: ' TTC',
      headline: 'Comprenez votre corps.',
      desc: 'Poids, masse musculaire, graisse, hydratation, métabolisme basal — la balance Vita cartographie votre composition corporelle et suit vos progrès.',
      features: ['Composition corporelle', 'Masse musculaire & graisse', 'Suivi hydratation', 'Métabolisme basal', 'Multi-profils famille'],
      cta: 'Découvrir Vita',
    },
    en: {
      tag: 'New',
      name: 'Vita',
      type: 'Smart scale',
      price: '€229',
      unit: ' incl. tax',
      headline: 'Understand your body.',
      desc: 'Weight, muscle mass, fat, hydration, basal metabolism — the Vita scale maps your body composition and tracks your progress.',
      features: ['Body composition', 'Muscle mass & fat', 'Hydration tracking', 'Basal metabolism', 'Multi-family profiles'],
      cta: 'Discover Vita',
    },
  },
  {
    key: 'elder',
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
    href: '/produits/elder',
    stat: '0.08',
    statUnit: { fr: 'sec', en: 'sec' },
    statLabel: { fr: 'de déclenchement', en: 'deployment' },
    fr: {
      tag: 'Made in France',
      name: 'Elder',
      type: 'Gilet airbag',
      price: '879€',
      unit: ' TTC',
      headline: 'La protection invisible.',
      desc: "Dos, tête, bassin, hanches — le gilet Elder détecte la chute et déploie ses airbags en 0.08 seconde. Vous ne le sentez pas, mais il veille.",
      features: ['Protection dos & tête', 'Bassin & hanches', 'Alerte chute automatique', 'Géolocalisation', '36h d\'autonomie', 'Certification EPI Cat. II'],
      cta: 'Découvrir Elder',
    },
    en: {
      tag: 'Made in France',
      name: 'Elder',
      type: 'Airbag vest',
      price: '€879',
      unit: ' incl. tax',
      headline: 'Invisible protection.',
      desc: 'Back, head, pelvis, hips — the Elder vest detects falls and deploys its airbags in 0.08 seconds. You don\'t feel it, but it watches over you.',
      features: ['Back & head protection', 'Pelvis & hips', 'Automatic fall alert', 'Geolocation', '36h battery life', 'PPE Cat. II certified'],
      cta: 'Discover Elder',
    },
  },
]

function ProductCard({ product, lang, index, reversed }) {
  const tx = product[lang] || product.fr

  return (
    <motion.div
      data-testid={`product-card-${product.key}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className={`rounded-3xl overflow-hidden bg-[#0e0e0e] relative ${reversed ? 'md:flex-row-reverse' : ''} md:flex md:items-stretch min-h-[520px] md:min-h-[580px]`}>

        {/* Image side */}
        <div className={`relative md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 ${reversed ? 'md:order-2' : ''}`}>
          {/* Subtle radial glow */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), transparent 70%)' }} />
          <motion.img
            src={product.image}
            alt={tx.name}
            className="relative z-10 w-full max-w-[320px] md:max-w-[380px] h-auto object-contain drop-shadow-2xl"
            whileHover={{ scale: 1.04, rotate: reversed ? -1 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Content side */}
        <div className={`md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center ${reversed ? 'md:order-1' : ''}`}>
          {/* Tag + Type */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white/10 text-white/60 border border-white/10">
              {tx.tag}
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-white/30">{tx.type}</span>
          </div>

          {/* Name large */}
          <h3 className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-[-0.04em] leading-[1.05] mb-3">
            {tx.name}
          </h3>

          {/* Headline */}
          <p className="text-lg md:text-xl text-white/60 font-light mb-8">{tx.headline}</p>

          {/* Key stat */}
          <div className="flex items-end gap-2 mb-8">
            <span className="text-5xl md:text-6xl font-extralight text-white leading-none tracking-tighter">{product.stat}</span>
            <div className="pb-1.5">
              <span className="text-sm font-medium text-white/50">{product.statUnit[lang]}</span>
              <span className="block text-xs text-white/30">{product.statLabel[lang]}</span>
            </div>
          </div>

          {/* Thin separator */}
          <div className="h-px w-full bg-white/10 mb-6" />

          {/* Description */}
          <p className="text-[14px] text-white/40 leading-[1.7] mb-6">{tx.desc}</p>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-8">
            {tx.features.map((f, i) => (
              <span key={i} className="text-[11px] px-3 py-1.5 rounded-full border border-white/8 text-white/40 bg-white/[0.03]">
                {f}
              </span>
            ))}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-white">{tx.price}</span>
              <span className="text-sm text-white/30">{tx.unit}</span>
            </div>
            <a href={product.href}
              className="group/cta inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 transition-all duration-300">
              {tx.cta}
              <ArrowRight size={15} strokeWidth={2} className="group-hover/cta:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
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

        {/* Product cards — alternating layout */}
        <div className="flex flex-col gap-6 md:gap-8">
          {PRODUCTS.map((product, idx) => (
            <ProductCard
              key={product.key}
              product={product}
              lang={lang}
              index={idx}
              reversed={idx % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
