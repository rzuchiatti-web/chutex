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
    fr: { badge: 'Balance de sante', name: 'Vita', tagline: "L'analyse corporelle\nla plus complete." },
    en: { badge: 'Health scale', name: 'Vita', tagline: "The most complete\nbody analysis." },
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      data-testid={`device-card-${device.key}`}
      className="group relative bg-[#EEEEF1] rounded-2xl md:rounded-[1.8rem] overflow-hidden cursor-pointer hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 block"
    >
      {/* Desktop: text left, image right */}
      <div className="hidden sm:flex relative h-[260px] lg:h-[300px]">
        {/* Text — centered vertically */}
        <div className="w-[45%] flex flex-col justify-center p-5 lg:p-7">
          <span className="inline-block self-start px-3 py-1 rounded-full bg-[#5B6CFF] text-white text-[10px] lg:text-[11px] font-semibold tracking-wide mb-3">
            {tx.badge}
          </span>
          <h3 className="text-[2.2rem] lg:text-[3rem] xl:text-[3.5rem] font-extrabold text-slate-900 tracking-[-0.04em] leading-[0.88] mb-2">
            {tx.name}
          </h3>
          <p className="text-[13px] lg:text-[15px] text-slate-600 leading-[1.35] whitespace-pre-line font-semibold">
            {tx.tagline}
          </p>
        </div>
        {/* Image — right side, cropped at bottom */}
        <div className="w-[55%] relative overflow-hidden">
          <img
            src={device.image}
            alt={tx.name}
            className="absolute bottom-[-5%] right-0 h-[110%] w-auto object-contain object-right-bottom transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>
      </div>

      {/* Mobile: all centered, image cropped at bottom */}
      <div className="sm:hidden flex flex-col items-center text-center">
        <div className="pt-5 px-4">
          <span className="inline-block px-3 py-1 rounded-full bg-[#5B6CFF] text-white text-[10px] font-semibold tracking-wide mb-2">
            {tx.badge}
          </span>
          <h3 className="text-[2rem] font-extrabold text-slate-900 tracking-[-0.04em] leading-[0.88] mb-1.5">
            {tx.name}
          </h3>
          <p className="text-[12px] text-slate-600 leading-[1.35] whitespace-pre-line font-semibold">
            {tx.tagline}
          </p>
        </div>
        {/* Image centered, cropped at bottom */}
        <div className="w-full h-[180px] relative overflow-hidden mt-2">
          <img
            src={device.image}
            alt={tx.name}
            className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 h-[120%] w-auto object-contain"
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
        {/* Header */}
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

        {/* 2x2 Grid (desktop) / 1 col (mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {DEVICES.map((device, i) => (
            <DeviceCard key={device.key} device={device} lang={lang} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
