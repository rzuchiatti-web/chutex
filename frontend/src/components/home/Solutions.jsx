import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Watch, Scale, ShieldCheck, Smartphone, Headphones, ArrowUpRight } from 'lucide-react'

const SOLUTIONS = [
  {
    key: 'elio',
    icon: Watch,
    image: '/images/products/elio-card.webp',
    href: '/produits/elio',
    accent: 'from-blue-500/20 to-blue-600/5',
    accentBorder: 'hover:border-blue-300/40',
    fr: { name: 'Bracelet Elio', tagline: 'Surveillance santé 24h/24 au poignet.', category: 'Bracelet connecté' },
    en: { name: 'Elio Bracelet', tagline: '24/7 health monitoring on your wrist.', category: 'Smart bracelet' },
  },
  {
    key: 'elder',
    icon: ShieldCheck,
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=600',
    href: '/produits/elder',
    accent: 'from-emerald-500/20 to-emerald-600/5',
    accentBorder: 'hover:border-emerald-300/40',
    fr: { name: 'Gilet Elder', tagline: 'Airbag intelligent, protection en 0.08s.', category: 'Gilet airbag' },
    en: { name: 'Elder Vest', tagline: 'Smart airbag, protection in 0.08s.', category: 'Airbag vest' },
  },
  {
    key: 'vita',
    icon: Scale,
    image: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/99cc1301d04c1c60a23347cfabdb0335b694b42162bb12541d38ea6638ebb23d.png',
    href: '/produits/vita',
    accent: 'from-violet-500/20 to-violet-600/5',
    accentBorder: 'hover:border-violet-300/40',
    fr: { name: 'Balance Vita', tagline: 'Bilan corporel complet à chaque pesée.', category: 'Balance connectée' },
    en: { name: 'Vita Scale', tagline: 'Full body assessment at every weigh-in.', category: 'Smart scale' },
  },
  {
    key: 'app',
    icon: Smartphone,
    image: 'https://chutex-innovation.com/cdn/shop/files/chutex-app-ia-health-data.jpg?v=1760549560&width=600',
    href: '/application',
    accent: 'from-slate-500/20 to-slate-600/5',
    accentBorder: 'hover:border-slate-300/40',
    fr: { name: 'Application', tagline: "Pilotez votre santé depuis votre smartphone.", category: 'App iOS & Android' },
    en: { name: 'Application', tagline: 'Manage your health from your smartphone.', category: 'iOS & Android App' },
  },
  {
    key: 'teleassistance',
    icon: Headphones,
    image: 'https://images.unsplash.com/photo-1666214280577-5f90bc36be92?w=600&h=400&fit=crop&q=80',
    href: '/teleassistance',
    accent: 'from-amber-500/20 to-amber-600/5',
    accentBorder: 'hover:border-amber-300/40',
    fr: { name: 'Téléassistance', tagline: 'Une équipe médicale connectée 24h/24.', category: 'Service 24/7' },
    en: { name: 'Teleassistance', tagline: 'A connected medical team 24/7.', category: '24/7 Service' },
  },
]

export default function Solutions() {
  const { lang } = useI18n()
  const discover = lang === 'fr' ? 'Découvrir' : 'Discover'

  return (
    <section data-testid="solutions-section" className="py-28 md:py-40 bg-[#f7f7f7]">
      <div className="max-w-[1780px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-10 h-px bg-slate-900" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">
              {lang === 'fr' ? 'Nos solutions' : 'Our solutions'}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-slate-900 mb-4"
          >
            {lang === 'fr' ? "Un écosystème complet" : 'A complete ecosystem'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[15px] text-slate-400 max-w-lg leading-relaxed"
          >
            {lang === 'fr'
              ? 'Cinq solutions interconnectées pour une prévention santé à 360°.'
              : 'Five interconnected solutions for 360° health prevention.'}
          </motion.p>
          <div className="h-px bg-slate-300/50 mt-10" />
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {SOLUTIONS.map((sol, i) => {
            const tx = sol[lang] || sol.fr
            const Icon = sol.icon
            const isLarge = i < 2
            return (
              <motion.a
                key={sol.key}
                href={sol.href}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.07 }}
                data-testid={`solution-card-${sol.key}`}
                className={`group relative bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-[0_12px_50px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 ${sol.accentBorder} ${isLarge ? 'lg:row-span-1' : ''}`}
              >
                {/* Image area */}
                <div className={`relative overflow-hidden bg-gradient-to-br ${sol.accent} ${isLarge ? 'h-52 md:h-64' : 'h-44 md:h-52'}`}>
                  <img
                    src={sol.image}
                    alt={tx.name}
                    className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Number */}
                  <span className="absolute top-4 left-5 text-[11px] font-semibold text-slate-400/60 tracking-wider">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 md:p-7">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={14} strokeWidth={1.5} className="text-slate-400" />
                    <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">{tx.category}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-2">{tx.name}</h3>
                  <p className="text-[13px] text-slate-400 leading-relaxed mb-5">{tx.tagline}</p>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">
                    {discover}
                    <ArrowUpRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
