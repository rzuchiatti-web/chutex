import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

const DEVICES = [
  {
    key: 'elio',
    href: '/produits/elio',
    image: '/images/products/elio-hero.webp',
    fr: { badge: 'Bracelet de sante', name: 'Elio', tagline: "Le bracelet de sante\nle plus performant." },
    en: { badge: 'Health bracelet', name: 'Elio', tagline: "The most advanced\nhealth bracelet." },
  },
  {
    key: 'vita',
    href: '/produits/vita',
    image: '/images/products/vita-card.webp',
    fr: { badge: 'Balance de sante', name: 'Vita', tagline: "Comprenez votre corps.\nAgissez en consequence." },
    en: { badge: 'Health scale', name: 'Vita', tagline: "Understand your body.\nAct on it." },
  },
  {
    key: 'elder',
    href: '/produits/elder',
    image: '/images/products/elder-card.webp',
    fr: { badge: 'Gilet de protection', name: 'Elder', tagline: "Protection instantanee\ncontre les chutes." },
    en: { badge: 'Protection vest', name: 'Elder', tagline: "Instant protection\nagainst falls." },
  },
  {
    key: 'dorsi',
    href: '/produits/dorsi',
    image: '/images/products/dorsi-card.webp',
    fr: { badge: 'Coussin connecte', name: 'Dorsi', tagline: "Le premier coussin\nconnecte preventif." },
    en: { badge: 'Smart cushion', name: 'Dorsi', tagline: "The first preventive\nsmart cushion." },
  },
]

function DeviceCard({ device, lang, index }) {
  const tx = device[lang] || device.fr

  return (
    <motion.a
      href={device.href}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      data-testid={`device-card-${device.key}`}
      className="group relative bg-[#f0f0f3] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden cursor-pointer hover:shadow-[0_12px_50px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col"
    >
      <div className="p-5 md:p-7 pb-0 flex flex-col flex-1">
        {/* Badge pill */}
        <div className="mb-3 md:mb-4">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#5B6CFF] text-white text-[11px] md:text-[12px] font-semibold tracking-wide">
            {tx.badge}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold text-slate-900 tracking-[-0.04em] leading-[0.9] mb-2 md:mb-3">
          {tx.name}
        </h3>

        {/* Tagline */}
        <p className="text-[14px] md:text-[16px] text-slate-500 leading-[1.45] whitespace-pre-line font-medium">
          {tx.tagline}
        </p>
      </div>

      {/* Image container — overflows from bottom-right */}
      <div className="relative h-[220px] md:h-[280px] lg:h-[320px] mt-auto overflow-hidden">
        <img
          src={device.image}
          alt={tx.name}
          className="absolute bottom-0 right-0 w-[85%] h-[110%] object-contain object-right-bottom transition-transform duration-700 group-hover:scale-105"
        />
      </div>
    </motion.a>
  )
}

export default function Products() {
  const { lang } = useI18n()

  return (
    <section id="products" data-testid="products-section" className="py-20 md:py-28 bg-white">
      <div className="max-w-[1780px] mx-auto px-4 md:px-12">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-5"
          >
            <div className="w-10 h-px bg-slate-900" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">
              {lang === 'fr' ? 'Nos dispositifs' : 'Our devices'}
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-slate-900"
          >
            {lang === 'fr' ? 'Technologies de prevention' : 'Prevention technologies'}
          </motion.h2>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {DEVICES.map((device, i) => (
            <DeviceCard key={device.key} device={device} lang={lang} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
