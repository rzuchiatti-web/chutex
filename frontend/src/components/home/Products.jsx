import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

const DEVICES = [
  {
    key: 'elio',
    href: '/produits/elio',
    image: '/images/products/elio-hero.webp',
    fr: { badge: 'Bracelet de santé', name: 'Elio', tagline: "Surveillance santé continue.\nPouls, SpO2, sommeil, activité." },
    en: { badge: 'Health bracelet', name: 'Elio', tagline: "Continuous health monitoring.\nHeart rate, SpO2, sleep, activity." },
  },
  {
    key: 'vita',
    href: '/produits/vita',
    image: '/images/products/vita-card.webp',
    fr: { badge: 'Balance de santé', name: 'Vita', tagline: "Analyse complète du corps.\nPoids, masse musculaire, hydratation." },
    en: { badge: 'Health scale', name: 'Vita', tagline: "Complete body analysis.\nWeight, muscle mass, hydration." },
  },
  {
    key: 'elder',
    href: '/produits/elder',
    image: '/images/products/elder-card.webp',
    fr: { badge: 'Gilet de protection', name: 'Elder', tagline: "Détection automatique et\nprotection instantanée des chutes." },
    en: { badge: 'Protection vest', name: 'Elder', tagline: "Automatic detection and\ninstant fall protection." },
  },
  {
    key: 'dorsi',
    href: '/produits/dorsi',
    image: '/images/products/dorsi-card.webp',
    fr: { badge: 'Coussin connecté', name: 'Dorsi', tagline: "Bilan lombaire intelligent.\nExercices guidés et suivi continu." },
    en: { badge: 'Smart cushion', name: 'Dorsi', tagline: "Intelligent lumbar assessment.\nGuided exercises and continuous tracking." },
  },
]

function DeviceCard({ device, lang, index }) {
  const tx = device[lang] || device.fr

  return (
    <motion.a
      href={device.href}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      data-testid={`device-card-${device.key}`}
      className="group relative bg-[#EEEEF1] rounded-2xl md:rounded-[1.8rem] overflow-hidden cursor-pointer hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 block"
    >
      {/* ── DESKTOP ── */}
      <div className="hidden sm:block relative h-[300px] lg:h-[360px]">
        {/* Text — centered horizontally + vertically */}
        <div className="absolute top-0 left-0 h-full w-[40%] flex flex-col justify-center items-center text-center p-6 lg:p-8 z-10">
          <span className="inline-block px-5 py-2 rounded-full bg-[#5B6CFF] text-white text-[12px] lg:text-[14px] font-semibold tracking-wide mb-5 lg:mb-7">
            {tx.badge}
          </span>
          <h3 className="text-[3rem] lg:text-[3.8rem] xl:text-[4.5rem] font-extrabold text-slate-900 tracking-[-0.04em] leading-[0.85] mb-4 lg:mb-5">
            {tx.name}
          </h3>
          <p className="text-[15px] lg:text-[17px] text-slate-600 leading-[1.5] whitespace-pre-line font-semibold">
            {tx.tagline}
          </p>
        </div>

        {/* Image — right side, with top margin, crops at bottom */}
        <div className="absolute top-4 right-4 w-[58%] h-full overflow-hidden">
          <img
            src={device.image}
            alt={tx.name}
            className={`w-full object-contain object-top transition-transform duration-700 group-hover:scale-[1.03] ${device.key === 'elder' ? 'h-[160%]' : 'h-[120%]'}`}
          />
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="sm:hidden">
        {/* Text — centered */}
        <div className="pt-6 px-5 pb-3 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#5B6CFF] text-white text-[11px] font-semibold tracking-wide mb-4">
            {tx.badge}
          </span>
          <h3 className="text-[2.2rem] font-extrabold text-slate-900 tracking-[-0.04em] leading-[0.88] mb-2">
            {tx.name}
          </h3>
          <p className="text-[13px] text-slate-600 leading-[1.4] whitespace-pre-line font-semibold">
            {tx.tagline}
          </p>
        </div>

        {/* Image — centered, crops at bottom */}
        <div className={`relative overflow-hidden ${device.key === 'dorsi' ? 'h-[200px] mx-10' : 'h-[260px]'}`}>
          <img
            src={device.image}
            alt={tx.name}
            className={`absolute top-0 left-1/2 -translate-x-1/2 object-contain object-top ${device.key === 'dorsi' ? 'w-[350%] h-auto' : 'h-[140%] w-auto'}`}
          />
        </div>
      </div>
    </motion.a>
  )
}

export default function Products() {
  const { lang } = useI18n()

  return (
    <section id="products" data-testid="products-section" className="py-14 md:py-20 bg-white">
      <div className="max-w-[1780px] mx-auto px-4 md:px-12">
        <div className="mb-8 md:mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-10 h-px bg-slate-900" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">
              {lang === 'fr' ? 'Ecosysteme de sante' : 'Health ecosystem'}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-2"
          >
            {lang === 'fr' ? "L'innovation au service de votre sante." : 'Innovation at the service of your health.'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-[14px] md:text-[15px] text-slate-400 max-w-lg"
          >
            {lang === 'fr'
              ? 'Quatre dispositifs connectes pour anticiper, proteger et accompagner chaque instant de vie.'
              : 'Four connected devices to anticipate, protect and support every moment of life.'}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {DEVICES.map((device, i) => (
            <DeviceCard key={device.key} device={device} lang={lang} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
