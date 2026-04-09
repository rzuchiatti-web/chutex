import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

export default function Hero() {
  const { t } = useI18n()

  return (
    <section data-testid="hero-section" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/x7c5eb8h_banner_login_mobile.jpg"
          alt="Prevention and care"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 border border-white/20 bg-white/5 backdrop-blur-md rounded-full px-5 py-2 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-white/80">
            {t('hero.overline')}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter leading-[1.05] text-white mb-8"
        >
          {t('hero.title')}{' '}
          <span className="font-medium italic bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
            {t('hero.titleHighlight')}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-base md:text-lg text-white/60 leading-relaxed mb-12 max-w-2xl mx-auto"
        >
          {t('hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="#products"
            data-testid="hero-cta-button"
            className="group relative inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-8 py-4 rounded-full overflow-hidden transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] text-sm"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative group-hover:text-white transition-colors duration-500">{t('hero.cta')}</span>
            <ArrowDown size={16} strokeWidth={2} className="relative group-hover:text-white group-hover:animate-bounce transition-colors duration-500" />
          </a>
          <a
            href="#app"
            data-testid="hero-secondary-cta"
            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-medium px-8 py-4 rounded-full hover:bg-white/10 hover:border-white/50 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-500 text-sm backdrop-blur-sm"
          >
            {t('hero.ctaSecondary')}
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-7 h-11 border-2 border-white/30 rounded-full flex justify-center pt-2"
        >
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        </motion.div>
      </div>
    </section>
  )
}
