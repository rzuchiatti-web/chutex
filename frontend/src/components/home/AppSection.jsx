import { motion } from 'framer-motion'
import { Smartphone, Check } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

export default function AppSection() {
  const { t } = useI18n()
  const features = t('app.features')

  return (
    <section id="app" data-testid="app-section" className="py-20 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] font-semibold text-primary mb-4">
              {t('app.overline')}
            </p>
            <h2 className="font-heading text-3xl md:text-4xl font-medium tracking-tight text-slate-900 mb-6">
              {t('app.title')}{' '}
              <span className="text-primary">{t('app.titleHighlight')}</span>
            </h2>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-8">
              {t('app.desc')}
            </p>

            {Array.isArray(features) && (
              <ul className="space-y-3 mb-8">
                {features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-primary" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{feat}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-3">
              <a
                href="https://apps.apple.com/fr/app/chutex/id6746360370"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="app-store-link"
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-medium px-5 py-3 rounded-lg hover:bg-slate-800 transition-colors text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                App Store
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.nouvy.chutex"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="play-store-link"
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-medium px-5 py-3 rounded-lg hover:bg-slate-800 transition-colors text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.59.34-1.11.84-1.35l9.41 9.41-9.41 9.41c-.5-.24-.84-.76-.84-1.35v-.12zm13.81-4.56L5.15 21.73l8.79-8.79 2.87 3zm.52-6.84L5.15 2.27l12.18 5.79-2.87 3.04h-.13zM20.16 10.81c.63.36 1.01 1.02 1.01 1.74 0 .72-.38 1.38-1.01 1.74l-2.54 1.47-3.08-3.08 3.08-3.08 2.54 1.21z"/></svg>
                Google Play
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              <img
                src="https://chutex-innovation.com/cdn/shop/files/chutex-app-ia-health-data.jpg?v=1760549560&width=800"
                alt="Chutex Care App"
                className="rounded-2xl shadow-2xl max-w-sm w-full"
                data-testid="app-screenshot"
              />
              <div className="absolute -bottom-4 -right-4 bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <Smartphone size={20} className="text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">iOS & Android</p>
                    <p className="text-[10px] text-slate-400">{t('app.cta')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
