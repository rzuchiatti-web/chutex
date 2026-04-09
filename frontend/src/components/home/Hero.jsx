import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

export default function Hero() {
  const { t } = useI18n()

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex items-center overflow-hidden bg-[#FAFAFA]">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/d955d4a583939baecfe98a46249fde1ce2d0262a8b03eb39cb0719970a34cb71.png"
            alt="Prevention and longevity"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAFAFA] via-[#FAFAFA]/60 to-transparent" />
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20 md:pt-40 md:pb-32 w-full">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs md:text-sm uppercase tracking-[0.2em] font-semibold text-primary mb-6"
          >
            {t('hero.overline')}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-light tracking-tighter leading-[1.1] text-slate-900 mb-8"
          >
            {t('hero.title')}{' '}
            <span className="font-medium italic text-primary">{t('hero.titleHighlight')}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-base md:text-lg text-slate-500 leading-relaxed mb-10 max-w-lg"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="#products"
              data-testid="hero-cta-button"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-full hover:bg-blue-700 transition-all hover:-translate-y-0.5 hover:shadow-xl text-sm"
            >
              {t('hero.cta')}
              <ArrowRight size={18} strokeWidth={2} />
            </a>
            <a
              href="#app"
              data-testid="hero-secondary-cta"
              className="inline-flex items-center justify-center gap-2 bg-transparent border border-slate-300 text-slate-700 font-medium px-8 py-4 rounded-full hover:border-slate-500 hover:bg-white transition-all text-sm"
            >
              <Play size={16} strokeWidth={2} fill="currentColor" />
              {t('hero.ctaSecondary')}
            </a>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
        </motion.div>
      </div>
    </section>
  )
}
