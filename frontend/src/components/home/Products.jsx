import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Heart, Activity, Shield } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: '/images/products/elio-hero.webp',
    href: '/produits/elio',
    icon: Heart,
    fr: {
      tag: 'Sans engagement',
      name: 'Elio',
      headline: 'Il veille sur vous,\njour et nuit.',
      points: ['Surveillance continue 24h/24', 'Alertes instantanées aux proches', 'Détection précoce des risques'],
      price: 'À partir de 24.9€/mois',
    },
    en: {
      tag: 'No commitment',
      name: 'Elio',
      headline: 'It watches over you,\nday and night.',
      points: ['24/7 continuous monitoring', 'Instant alerts to loved ones', 'Early risk detection'],
      price: 'From €24.9/month',
    },
  },
  {
    key: 'vita',
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    href: '/produits/vita',
    icon: Activity,
    fr: {
      tag: 'Nouveau',
      name: 'Vita',
      headline: 'Comprenez votre corps.\nAgissez en conséquence.',
      points: ['Bilan corporel complet à chaque pesée', 'Données partagées avec votre médecin', 'Suivi des progrès dans le temps'],
      price: '229€ TTC',
    },
    en: {
      tag: 'New',
      name: 'Vita',
      headline: 'Understand your body.\nAct on it.',
      points: ['Full body check at every weigh-in', 'Data shared with your doctor', 'Progress tracking over time'],
      price: '€229 incl. tax',
    },
  },
  {
    key: 'elder',
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
    href: '/produits/elder',
    icon: Shield,
    fr: {
      tag: 'Made in France',
      name: 'Elder',
      headline: 'Vous tombez.\nIl vous protège.',
      points: ['Protection automatique en 0.08s', 'Aucune action requise', 'Alerte immédiate aux proches'],
      price: '879€ TTC',
    },
    en: {
      tag: 'Made in France',
      name: 'Elder',
      headline: 'You fall.\nIt protects you.',
      points: ['Automatic protection in 0.08s', 'No action required', 'Instant alert to loved ones'],
      price: '€879 incl. tax',
    },
  },
]

function ProductView({ product, lang, scrollYProgress, index, total }) {
  const tx = product[lang] || product.fr
  const Icon = product.icon
  const segment = 1 / total
  const start = index * segment
  const peak = start + segment * 0.15
  const hold = start + segment * 0.75
  const end = start + segment

  const isFirst = index === 0
  const isLast = index === total - 1

  const opacity = useTransform(
    scrollYProgress,
    isFirst
      ? (isLast ? [0, 0, 1, 1] : [0, 0, hold, end])
      : (isLast ? [start, peak, 1, 1] : [start, peak, hold, end]),
    isFirst
      ? (isLast ? [1, 1, 1, 1] : [1, 1, 1, 0])
      : (isLast ? [0, 1, 1, 1] : [0, 1, 1, 0])
  )

  const imageScale = useTransform(
    scrollYProgress,
    isFirst ? [0, 0.01] : [start, peak],
    isFirst ? [1, 1] : [0.85, 1]
  )

  const textY = useTransform(
    scrollYProgress,
    isFirst ? [0, 0.01] : [start, peak],
    isFirst ? [0, 0] : [30, 0]
  )

  const discover = lang === 'fr' ? 'Découvrir' : 'Discover'

  return (
    <motion.div className="absolute inset-0 flex items-center" style={{ opacity }}>
      <div className="w-full max-w-[1780px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-8 md:gap-16 lg:gap-24">

        {/* Image */}
        <motion.div className="md:w-[48%] flex justify-center" style={{ scale: imageScale }}>
          <img src={product.image} alt={tx.name}
            className="w-[280px] md:w-[400px] lg:w-[480px] h-auto object-contain" />
        </motion.div>

        {/* Content */}
        <motion.div className="md:w-[52%]" style={{ y: textY }}>
          {/* Tag */}
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <Icon size={14} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">{tx.tag}</span>
          </div>

          {/* Name */}
          <h3 className="text-[4rem] md:text-[5.5rem] lg:text-[7rem] font-semibold text-slate-900 tracking-[-0.05em] leading-[0.85] mb-4 md:mb-6">
            {tx.name}
          </h3>

          {/* Headline */}
          <p className="text-lg md:text-xl lg:text-2xl text-slate-400 leading-[1.35] whitespace-pre-line mb-8 md:mb-10" style={{ fontWeight: 350 }}>
            {tx.headline}
          </p>

          {/* Points separated by lines */}
          <div className="mb-8 md:mb-10">
            <div className="h-px bg-slate-200" />
            {tx.points.map((point, i) => (
              <div key={i}>
                <p className="py-3.5 md:py-4 text-[14px] md:text-[15px] text-slate-600 font-medium">{point}</p>
                <div className="h-px bg-slate-200" />
              </div>
            ))}
          </div>

          {/* CTA + Price */}
          <div className="flex items-center gap-5">
            <a href={product.href}
              className="inline-flex items-center gap-2.5 px-7 md:px-8 py-3.5 md:py-4 rounded-full bg-slate-900 text-white text-[14px] md:text-[15px] font-semibold hover:bg-slate-800 transition-colors duration-300">
              {discover}
              <ArrowRight size={15} strokeWidth={2} />
            </a>
            <span className="text-sm text-slate-400">{tx.price}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Products() {
  const { lang } = useI18n()
  const containerRef = useRef(null)
  const count = PRODUCTS.length

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  return (
    <section id="products" data-testid="products-section" ref={containerRef} className="relative bg-[#f7f7f7]" style={{ height: `${(count + 0.5) * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {PRODUCTS.map((product, idx) => (
          <ProductView
            key={product.key}
            product={product}
            lang={lang}
            scrollYProgress={scrollYProgress}
            index={idx}
            total={count}
          />
        ))}
      </div>
    </section>
  )
}
