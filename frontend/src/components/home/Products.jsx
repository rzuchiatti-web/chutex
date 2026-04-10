import { motion } from 'framer-motion'
import { ArrowRight, Shield, Heart, Activity } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elio',
    image: 'https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=1200',
    href: '/produits/elio',
    icon: Heart,
    fr: {
      tag: 'Sans engagement',
      name: 'Elio',
      headline: 'Il veille sur vous,\njour et nuit.',
      benefit: "Votre bracelet détecte les anomalies avant qu'elles ne deviennent des urgences. Vos proches sont alertés en temps réel.",
      price: 'À partir de 24.9€/mois',
      points: ['Surveillance continue 24h/24', 'Alertes instantanées aux proches', 'Détection précoce des risques'],
      cta: 'Protéger ma santé',
    },
    en: {
      tag: 'No commitment',
      name: 'Elio',
      headline: 'It watches over you,\nday and night.',
      benefit: 'Your bracelet detects anomalies before they become emergencies. Your loved ones are alerted in real time.',
      price: 'From €24.9/month',
      points: ['24/7 continuous monitoring', 'Instant alerts to loved ones', 'Early risk detection'],
      cta: 'Protect my health',
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
      benefit: "Chaque pesée devient un bilan de santé complet. Votre médecin suit vos données à distance et adapte vos soins.",
      price: '229€ TTC',
      points: ['Bilan corporel complet à chaque pesée', 'Partagé avec votre médecin', 'Suivi des progrès dans le temps'],
      cta: 'Comprendre mon corps',
    },
    en: {
      tag: 'New',
      name: 'Vita',
      headline: 'Understand your body.\nAct on it.',
      benefit: 'Every weigh-in becomes a full health check. Your doctor monitors your data remotely and adapts your care.',
      price: '€229 incl. tax',
      points: ['Full body check at every weigh-in', 'Shared with your doctor', 'Progress tracking over time'],
      cta: 'Understand my body',
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
      benefit: "Le gilet détecte la chute et déploie ses airbags en 0.08 seconde. Dos, tête, bassin, hanches — tout est protégé, automatiquement.",
      price: '879€ TTC',
      points: ['Protection automatique en 0.08s', 'Aucune action requise', 'Alerte immédiate aux proches'],
      cta: 'Me protéger des chutes',
    },
    en: {
      tag: 'Made in France',
      name: 'Elder',
      headline: 'You fall.\nIt protects you.',
      benefit: 'The vest detects falls and deploys its airbags in 0.08 seconds. Back, head, pelvis, hips — everything is protected, automatically.',
      price: '€879 incl. tax',
      points: ['Automatic protection in 0.08s', 'No action required', 'Instant alert to loved ones'],
      cta: 'Protect me from falls',
    },
  },
]

function ProductCard({ product, lang, reversed }) {
  const tx = product[lang] || product.fr
  const Icon = product.icon

  return (
    <motion.div
      data-testid={`product-card-${product.key}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`rounded-[2rem] bg-[#f2f2f2] overflow-hidden flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-stretch`}>

        {/* Image */}
        <div className="md:w-[42%] relative flex items-center justify-center p-8 md:p-12 min-h-[300px] md:min-h-0">
          <img
            src={product.image}
            alt={tx.name}
            className="w-full max-w-[280px] md:max-w-[340px] h-auto object-contain"
          />
        </div>

        {/* Content */}
        <div className="md:w-[58%] p-8 md:p-14 lg:p-16 flex flex-col justify-center">
          {/* Tag */}
          <div className="flex items-center gap-2.5 mb-6">
            <Icon size={16} strokeWidth={1.5} className="text-slate-400" />
            <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400 font-medium">{tx.tag}</span>
          </div>

          {/* Name */}
          <h3 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-slate-900 tracking-[-0.04em] leading-[0.95] mb-4">
            {tx.name}
          </h3>

          {/* Headline — big, emotional */}
          <p className="text-xl md:text-2xl text-slate-900/70 leading-[1.3] whitespace-pre-line mb-8" style={{ fontWeight: 350 }}>
            {tx.headline}
          </p>

          {/* 3 benefit points */}
          <div className="space-y-3 mb-8">
            {tx.points.map((point, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span className="text-[15px] text-slate-700 leading-snug font-medium">{point}</span>
              </div>
            ))}
          </div>

          {/* Benefit text */}
          <p className="text-[14px] text-slate-400 leading-[1.7] mb-10">{tx.benefit}</p>

          {/* Price + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <a href={product.href}
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors duration-300">
              {tx.cta}
              <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
            <span className="text-sm text-slate-400 font-medium">{tx.price}</span>
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
          <h2 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.025em] leading-tight font-semibold">
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
