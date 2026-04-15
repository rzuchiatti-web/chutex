import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Heart, Activity, Shield, Thermometer, Moon, Footprints, Droplets } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: '/images/products/elio-hero.webp',
    href: '/produits/elio',
    icon: Heart,
    fr: {
      tag: 'Bracelet de santé connecté',
      name: 'Elio',
      headline: 'Il veille sur vous,\njour et nuit.',
      price: 'À partir de 24.9€/mois',
    },
    en: {
      tag: 'Connected health bracelet',
      name: 'Elio',
      headline: 'It watches over you,\nday and night.',
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

const HEALTH_WIDGETS = {
  fr: [
    { icon: Heart, value: '72', unit: 'bpm', label: 'Pouls', position: 'top-left' },
    { icon: Activity, value: '120/80', unit: 'mmHg', label: 'Tension', position: 'top-right' },
    { icon: Droplets, value: '98', unit: '%', label: 'SpO2', position: 'mid-left' },
    { icon: Thermometer, value: '36.6', unit: '°C', label: 'Température', position: 'mid-right' },
    { icon: Moon, value: '7h42', unit: '', label: 'Sommeil', position: 'bot-left' },
    { icon: Footprints, value: '8 247', unit: '', label: 'Pas', position: 'bot-right' },
  ],
  en: [
    { icon: Heart, value: '72', unit: 'bpm', label: 'Heart rate', position: 'top-left' },
    { icon: Activity, value: '120/80', unit: 'mmHg', label: 'Blood pressure', position: 'top-right' },
    { icon: Droplets, value: '98', unit: '%', label: 'SpO2', position: 'mid-left' },
    { icon: Thermometer, value: '36.6', unit: '°C', label: 'Temperature', position: 'mid-right' },
    { icon: Moon, value: '7h42', unit: '', label: 'Sleep', position: 'bot-left' },
    { icon: Footprints, value: '8,247', unit: '', label: 'Steps', position: 'bot-right' },
  ],
}

const WIDGET_POSITIONS = {
  'top-left': 'top-[6%] left-[2%] md:left-[8%]',
  'top-right': 'top-[6%] right-[2%] md:right-[8%]',
  'mid-left': 'top-[38%] left-[0%] md:left-[3%]',
  'mid-right': 'top-[38%] right-[0%] md:right-[3%]',
  'bot-left': 'bottom-[18%] left-[4%] md:left-[10%]',
  'bot-right': 'bottom-[18%] right-[4%] md:right-[10%]',
}

function GlassWidget({ widget, index }) {
  const Icon = widget.icon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute ${WIDGET_POSITIONS[widget.position]} z-20`}
    >
      <div className="bg-white/70 backdrop-blur-2xl border border-white/80 rounded-2xl px-4 py-3 md:px-5 md:py-3.5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:bg-white/85 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.12)] transition-all duration-500">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-emerald-600" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] md:text-[17px] font-bold text-slate-900 tracking-tight leading-none">{widget.value}</span>
              {widget.unit && <span className="text-[10px] md:text-[11px] text-slate-400 font-medium">{widget.unit}</span>}
            </div>
            <span className="text-[10px] md:text-[11px] text-slate-400 leading-none">{widget.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ElioProductView({ product, lang, scrollYProgress }) {
  const tx = product[lang] || product.fr
  const widgets = HEALTH_WIDGETS[lang] || HEALTH_WIDGETS.fr
  const discover = lang === 'fr' ? 'Découvrir le bracelet Elio' : 'Discover the Elio bracelet'

  const opacity = useTransform(scrollYProgress, [0, 0, 0.23, 0.33], [1, 1, 1, 0])
  const imageScale = useTransform(scrollYProgress, [0, 0.05], [0.9, 1])
  const titleY = useTransform(scrollYProgress, [0, 0.05], [20, 0])

  return (
    <motion.div className="absolute inset-0 flex items-center justify-center" style={{ opacity }}>
      <div className="w-full max-w-[1780px] mx-auto px-6 md:px-12 text-center relative">

        {/* Pill badge */}
        <motion.div
          style={{ y: titleY }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/5 backdrop-blur-sm border border-slate-200/60 mb-6"
        >
          <Heart size={13} className="text-emerald-600" strokeWidth={2} />
          <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-semibold">{tx.tag}</span>
        </motion.div>

        {/* Title */}
        <motion.h3
          style={{ y: titleY }}
          className="text-[5rem] md:text-[7rem] lg:text-[9rem] font-semibold text-slate-900 tracking-[-0.06em] leading-[0.82] mb-2 md:mb-4"
        >
          {tx.name}
        </motion.h3>

        {/* Subtitle */}
        <motion.p
          style={{ y: titleY }}
          className="text-lg md:text-xl text-slate-400 leading-[1.4] whitespace-pre-line mb-8 md:mb-10 max-w-md mx-auto" style={{ fontWeight: 350 }}
        >
          {tx.headline}
        </motion.p>

        {/* Bracelet + widgets zone */}
        <div className="relative inline-block mx-auto mb-8 md:mb-10">
          {/* Floating glass widgets */}
          <div className="relative w-[340px] h-[380px] md:w-[500px] md:h-[540px] lg:w-[600px] lg:h-[640px]">
            {widgets.map((w, i) => (
              <GlassWidget key={i} widget={w} index={i} />
            ))}

            {/* Bracelet image centered */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ scale: imageScale }}
            >
              <img
                src={product.image}
                alt={tx.name}
                className="w-[200px] md:w-[300px] lg:w-[360px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
              />
            </motion.div>

            {/* Subtle glow behind bracelet */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[350px] md:h-[350px] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
          </div>
        </div>

        {/* CTA + Price */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={product.href}
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-all duration-300 hover:shadow-lg"
          >
            {discover}
            <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <span className="text-sm text-slate-400">{tx.price}</span>
        </div>
      </div>
    </motion.div>
  )
}

function ProductView({ product, lang, scrollYProgress, index, total }) {
  const tx = product[lang] || product.fr
  const Icon = product.icon
  const segment = 1 / total
  const start = index * segment
  const peak = start + segment * 0.15
  const hold = start + segment * 0.75
  const end = start + segment

  const isLast = index === total - 1

  const opacity = useTransform(
    scrollYProgress,
    isLast ? [start, peak, 1, 1] : [start, peak, hold, end],
    isLast ? [0, 1, 1, 1] : [0, 1, 1, 0]
  )

  const imageScale = useTransform(scrollYProgress, [start, peak], [0.85, 1])
  const textY = useTransform(scrollYProgress, [start, peak], [30, 0])
  const discover = lang === 'fr' ? 'Découvrir' : 'Discover'

  return (
    <motion.div className="absolute inset-0 flex items-center" style={{ opacity }}>
      <div className="w-full max-w-[1780px] mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-8 md:gap-16 lg:gap-24">
        <motion.div className="md:w-[48%] flex justify-center" style={{ scale: imageScale }}>
          <img src={product.image} alt={tx.name}
            className="w-[280px] md:w-[400px] lg:w-[480px] h-auto object-contain" />
        </motion.div>
        <motion.div className="md:w-[52%]" style={{ y: textY }}>
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <Icon size={14} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">{tx.tag}</span>
          </div>
          <h3 className="text-[4rem] md:text-[5.5rem] lg:text-[7rem] font-semibold text-slate-900 tracking-[-0.05em] leading-[0.85] mb-4 md:mb-6">
            {tx.name}
          </h3>
          <p className="text-lg md:text-xl lg:text-2xl text-slate-400 leading-[1.35] whitespace-pre-line mb-8 md:mb-10" style={{ fontWeight: 350 }}>
            {tx.headline}
          </p>
          {tx.points && (
            <div className="mb-8 md:mb-10">
              <div className="h-px bg-slate-200" />
              {tx.points.map((point, i) => (
                <div key={i}>
                  <p className="py-3.5 md:py-4 text-[14px] md:text-[15px] text-slate-600 font-medium">{point}</p>
                  <div className="h-px bg-slate-200" />
                </div>
              ))}
            </div>
          )}
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
          idx === 0 ? (
            <ElioProductView
              key={product.key}
              product={product}
              lang={lang}
              scrollYProgress={scrollYProgress}
            />
          ) : (
            <ProductView
              key={product.key}
              product={product}
              lang={lang}
              scrollYProgress={scrollYProgress}
              index={idx}
              total={count}
            />
          )
        ))}
      </div>
    </section>
  )
}
