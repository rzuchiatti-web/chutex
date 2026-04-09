import { motion } from 'framer-motion'
import { ArrowRight, Phone } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

export default function CTASection() {
  const { t } = useI18n()

  return (
    <section data-testid="cta-section" className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative bg-slate-950 rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
          <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-white mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#products"
                data-testid="cta-primary-button"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-full hover:bg-blue-600 transition-all hover:-translate-y-0.5 hover:shadow-xl text-sm"
              >
                {t('cta.button')}
                <ArrowRight size={18} strokeWidth={2} />
              </a>
              <a
                href="#"
                data-testid="cta-secondary-button"
                className="inline-flex items-center justify-center gap-2 border border-slate-600 text-slate-300 font-medium px-8 py-4 rounded-full hover:border-slate-400 hover:text-white transition-all text-sm"
              >
                <Phone size={16} strokeWidth={2} />
                {t('cta.secondary')}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
