import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PRODUCTS = [
  {
    key: 'elder',
    num: '01',
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200',
    features: {
      fr: ['Déclenchement en 0.08s', 'Protection dos, tête, bassin, hanches', 'Alerte chute automatique', 'Géolocalisation connectée', '36h d\'autonomie', 'Certification EPI Cat. II'],
      en: ['0.08s deployment', 'Back, head, pelvis, hip protection', 'Automatic fall alert', 'Connected geolocation', '36h battery life', 'PPE Cat. II certified'],
    },
    quote: { fr: 'L\'alerte automatique en cas de chute nous a déjà sauvé une fois.', en: 'The automatic fall alert already saved us once.' },
    quoteAuthor: 'Marie L.',
  },
  {
    key: 'elio',
    num: '02',
    image: 'https://chutex-innovation.com/cdn/shop/files/elio_bracelet_health_connected_chutex_1.jpg?v=1760010576&width=1200',
    features: {
      fr: ['Suivi cardiaque continu', 'Température, SpO2, tension', 'Analyse du sommeil', 'Alertes préventives', '10 jours d\'autonomie', 'Étanche 50m'],
      en: ['Continuous heart monitoring', 'Temperature, SpO2, blood pressure', 'Sleep analysis', 'Preventive alerts', '10 days battery', 'Waterproof 50m'],
    },
    quote: { fr: 'Mon médecin peut anticiper les problèmes avant qu\'ils ne surviennent.', en: 'My doctor can anticipate problems before they arise.' },
    quoteAuthor: 'Jean-Pierre D.',
  },
  {
    key: 'vita',
    num: '03',
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    features: {
      fr: ['Composition corporelle complète', 'Poids, masse musculaire, graisse', 'Suivi hydratation', 'Métabolisme basal', 'Connexion app Chutex', 'Multi-profils famille'],
      en: ['Complete body composition', 'Weight, muscle mass, fat', 'Hydration tracking', 'Basal metabolism', 'Chutex app connected', 'Multi-family profiles'],
    },
    quote: { fr: 'La téléassistance Chutex a amélioré notre suivi.', en: 'Chutex teleassistance improved our follow-up.' },
    quoteAuthor: 'Sophie M.',
  },
]

export default function Products() {
  const { t, lang } = useI18n()

  return (
    <section id="products" data-testid="products-section" className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 mb-3"
        >{t('products.overline')}</motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-slate-900 mb-16 md:mb-24 max-w-2xl"
        >
          {t('products.title')} <span className="italic text-primary">{t('products.titleHighlight')}</span>
        </motion.h2>

        <div className="space-y-20 md:space-y-32">
          {PRODUCTS.map((product, idx) => {
            const data = t(`products.${product.key}`)
            const features = product.features[lang] || product.features.fr
            const quote = product.quote[lang] || product.quote.fr
            const isReversed = idx % 2 !== 0

            return (
              <motion.div
                key={product.key}
                data-testid={`product-${product.key}-card`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isReversed ? 'lg:[direction:rtl]' : ''}`}
              >
                <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                  <div className="relative rounded-2xl overflow-hidden bg-slate-50 group">
                    <img src={product.image} alt={data.name}
                      className="w-full h-auto object-contain p-6 md:p-10 transition-transform duration-700 group-hover:scale-[1.03]" />
                    <div className="absolute top-5 left-5">
                      <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 text-xs font-semibold text-primary border border-primary/10">
                        {data.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-heading text-6xl md:text-7xl font-extralight text-slate-200">{product.num}</span>
                    <div>
                      <h3 className="font-heading text-2xl md:text-3xl font-medium tracking-tight text-slate-900">{data.name}</h3>
                      <p className="text-sm text-slate-400 font-medium">{data.type}</p>
                    </div>
                  </div>

                  <p className="text-base text-slate-500 leading-relaxed mb-6">{data.desc}</p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-8">
                    {features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-xs text-slate-500">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <span className="font-heading text-3xl md:text-4xl font-medium text-slate-900">{data.price}</span>
                      <span className="text-sm text-slate-400 ml-1.5">{data.unit}</span>
                    </div>
                    <a href="#" className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                      {t('products.cta')}
                      <ArrowUpRight size={15} strokeWidth={2} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </a>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <p className="text-sm italic text-slate-400 leading-relaxed">"{quote}"</p>
                    <p className="text-xs font-semibold text-slate-600 mt-2">{product.quoteAuthor}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
