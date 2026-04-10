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
    <div className={`w-full h-full ${product.bg} flex flex-col md:flex-row items-center`}>
      {/* Image side */}
      <div className="md:w-[45%] h-[40vh] md:h-full flex items-center justify-center p-8 md:p-16">
        <img
          src={product.image}
          alt={tx.name}
          className="max-h-[80%] max-w-[80%] object-contain"
        />
      </div>

      {/* Content side */}
      <div className="md:w-[55%] h-[60vh] md:h-full flex flex-col justify-center px-8 md:px-16 lg:px-20 md:border-l border-slate-300/40">
        {/* Tag */}
        <div className="flex items-center gap-2.5 pb-5 border-b border-slate-300/40 mb-8">
          <Icon size={16} strokeWidth={1.5} className="text-slate-400" />
          <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-medium">{tx.tag}</span>
        </div>

        {/* Name */}
        <h3 className="text-6xl md:text-7xl lg:text-8xl font-semibold text-slate-900 tracking-[-0.04em] leading-[0.9] mb-5">
          {tx.name}
        </h3>

        {/* Headline */}
        <p className="text-xl md:text-2xl lg:text-3xl text-slate-900/60 leading-[1.25] whitespace-pre-line mb-10" style={{ fontWeight: 350 }}>
          {tx.headline}
        </p>

        {/* Separator */}
        <div className="h-px w-full bg-slate-300/40 mb-8" />

        {/* Points */}
        <div className="space-y-4 mb-10">
          {tx.points.map((point, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span className="text-[15px] md:text-base text-slate-700 font-medium">{point}</span>
            </div>
          ))}
        </div>

        {/* CTA + Price */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-8 border-t border-slate-300/40">
          <a href={product.href}
            className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors duration-300">
            {tx.cta}
            <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <span className="text-sm text-slate-400 font-medium">{tx.price}</span>
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
  const opacity = useTransform(
    scrollYProgress,
    isLast
      ? [start, active]
      : [start, active, end - 0.05, end],
    isLast
      ? [0, 1]
      : [0, 1, 1, 0]
  )
  const y = useTransform(
    scrollYProgress,
    [start, active],
    [60, 0]
  )

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, y, zIndex: index + 1 }}
    >
      <ProductSlide product={product} lang={lang} />
    </motion.div>
  )
}
