import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const PARTNER_LOGOS = [
  { name: 'Decathlon', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Decathlon.jpg?height=80' },
  { name: 'RedCare', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_RedCare_Pharmacie.jpg?height=80' },
  { name: 'Castorama', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Castorama.jpg?height=80' },
  { name: 'MediaMarkt', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_MediaMarkt.jpg?height=80' },
  { name: 'Stadium', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Stadium.jpg?height=80' },
]

export default function Hero() {
  const { t } = useI18n()

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex flex-col justify-end overflow-hidden pb-8 md:pb-12">
      <div className="absolute inset-0">
        <img
          src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/x7c5eb8h_banner_login_mobile.jpg"
          alt="Prevention and care"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-[clamp(2.2rem,6vw,5.5rem)] font-light tracking-[-0.04em] leading-[1.05] text-white mb-6 max-w-4xl"
        >
          {t('hero.title')}{' '}
          <span className="italic font-normal bg-gradient-to-r from-blue-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
            {t('hero.titleHighlight')}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm md:text-base text-white/50 leading-relaxed mb-8 max-w-lg"
        >
          {t('hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-wrap items-center gap-3 mb-10"
        >
          <a href="#products" data-testid="hero-cta-button"
            className="group inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:scale-[1.02]">
            {t('hero.cta')}
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white">
              <ArrowDown size={12} strokeWidth={2.5} />
            </span>
          </a>
          <a href="#app" data-testid="hero-secondary-cta"
            className="inline-flex items-center gap-2 text-white/70 font-medium text-sm px-5 py-3.5 transition-all duration-300 hover:text-white">
            {t('hero.ctaSecondary')} <span className="text-white/40">&rarr;</span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex items-center gap-6 flex-wrap"
        >
          <div className="flex items-center -space-x-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 backdrop-blur-sm" />
            ))}
            <div className="ml-3 flex flex-col">
              <span className="text-white/40 text-[11px] leading-tight">Trusted by</span>
              <span className="text-white text-xs font-semibold">10,000+ families</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 ml-4 opacity-40">
            {PARTNER_LOGOS.map(logo => (
              <img key={logo.name} src={logo.url} alt={logo.name}
                className="h-5 w-auto object-contain brightness-0 invert" />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
