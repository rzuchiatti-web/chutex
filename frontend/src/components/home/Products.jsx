import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Heart, Activity, Shield } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: 'https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=1200',
    href: '/produits/elio',
    icon: Heart,
    bg: 'bg-[#f2f2f2]',
    fr: {
      tag: 'Sans engagement',
      name: 'Elio',
      headline: 'Il veille sur vous,\njour et nuit.',
      points: ['Surveillance continue 24h/24', 'Alertes instantanées aux proches', 'Détection précoce des risques'],
      price: 'À partir de 24.9€/mois',
      cta: 'Protéger ma santé',
    },
    en: {
      tag: 'No commitment',
      name: 'Elio',
      headline: 'It watches over you,\nday and night.',
      points: ['24/7 continuous monitoring', 'Instant alerts to loved ones', 'Early risk detection'],
      price: 'From €24.9/month',
      cta: 'Protect my health',
    },
  },
  {
    key: 'vita',
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    href: '/produits/vita',
    icon: Activity,
    bg: 'bg-[#eaeaea]',
    fr: {
      tag: 'Nouveau',
      name: 'Vita',
      headline: 'Comprenez votre corps.\nAgissez en conséquence.',
      points: ['Bilan corporel complet à chaque pesée', 'Données partagées avec votre médecin', 'Suivi des progrès dans le temps'],
      price: '229€ TTC',
      cta: 'Comprendre mon corps',
    },
    en: {
      tag: 'New',
      name: 'Vita',
      headline: 'Understand your body.\nAct on it.',
      points: ['Full body check at every weigh-in', 'Data shared with your doctor', 'Progress tracking over time'],
      price: '€229 incl. tax',
      cta: 'Understand my body',
    },
  },
  {
    key: 'elder',
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
    href: '/produits/elder',
    icon: Shield,
    bg: 'bg-[#e5e5e5]',
    fr: {
      tag: 'Made in France',
      name: 'Elder',
      headline: 'Vous tombez.\nIl vous protège.',
      points: ['Protection automatique en 0.08s', 'Aucune action requise', 'Alerte immédiate aux proches'],
      price: '879€ TTC',
      cta: 'Me protéger des chutes',
    },
    en: {
      tag: 'Made in France',
      name: 'Elder',
      headline: 'You fall.\nIt protects you.',
      points: ['Automatic protection in 0.08s', 'No action required', 'Instant alert to loved ones'],
      price: '€879 incl. tax',
      cta: 'Protect me from falls',
    },
  },
]

function ProductSlide({ product, lang }) {
  const tx = product[lang] || product.fr
  const Icon = product.icon

  return (
    <div className={`w-full h-full ${product.bg}`}>
      <div className="h-full max-w-[1780px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center">

        {/* Image — big */}
        <div className="md:w-[50%] h-[40vh] md:h-full flex items-center justify-center">
          <img
            src={product.image}
            alt={tx.name}
            className="max-h-[85%] max-w-[90%] object-contain"
          />
        </div>

        {/* Content */}
        <div className="md:w-[50%] h-[60vh] md:h-full flex flex-col justify-center py-8 md:py-0">
          {/* Tag */}
          <div className="flex items-center gap-2.5 mb-8">
            <Icon size={15} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-medium">{tx.tag}</span>
          </div>

          {/* Name */}
          <h3 className="text-6xl md:text-7xl lg:text-[6rem] font-semibold text-slate-900 tracking-[-0.04em] leading-[0.9] mb-5">
            {tx.name}
          </h3>

          {/* Headline */}
          <p className="text-xl md:text-2xl lg:text-[1.7rem] text-slate-900/50 leading-[1.3] whitespace-pre-line mb-10" style={{ fontWeight: 350 }}>
            {tx.headline}
          </p>

          {/* Points separated by lines */}
          <div className="mb-10">
            {tx.points.map((point, i) => (
              <div key={i}>
                <div className="h-px w-full bg-slate-300/50" />
                <p className="py-4 text-[15px] md:text-base text-slate-700 font-medium">{point}</p>
              </div>
            ))}
            <div className="h-px w-full bg-slate-300/50" />
          </div>

          {/* CTA + Price */}
          <div className="flex items-center gap-5">
            <a href={product.href}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors duration-300">
              {lang === 'fr' ? 'Découvrir' : 'Discover'}
              <ArrowRight size={16} strokeWidth={2} />
            </a>
            <span className="text-sm text-slate-400">{tx.price}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const { t, lang } = useI18n()
  const containerRef = useRef(null)
  const count = PRODUCTS.length

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  return (
    <section id="products" data-testid="products-section" ref={containerRef} style={{ height: `${count * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {PRODUCTS.map((product, idx) => {
          const start = idx / count
          const active = (idx + 0.3) / count
          const end = (idx + 1) / count

          return (
            <ProductPanel
              key={product.key}
              product={product}
              lang={lang}
              scrollYProgress={scrollYProgress}
              start={start}
              active={active}
              end={end}
              isLast={idx === count - 1}
              index={idx}
            />
          )
        })}
      </div>
    </section>
  )
}

function ProductPanel({ product, lang, scrollYProgress, start, active, end, isLast, index }) {
  // Each panel slides up from below and covers the previous one
  const y = useTransform(
    scrollYProgress,
    [start, active],
    ['100%', '0%']
  )
  // First panel is always at 0
  const isFirst = index === 0

  return (
    <motion.div
      className="absolute inset-0"
      style={isFirst ? { zIndex: index + 1 } : { y, zIndex: index + 1 }}
    >
      <ProductSlide product={product} lang={lang} />
    </motion.div>
  )
}
