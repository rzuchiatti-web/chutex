import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

export default function Stats() {
  const { t } = useI18n()
  const items = t('stats.items')

  if (!Array.isArray(items)) return null

  return (
    <section data-testid="stats-section" className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs md:text-sm uppercase tracking-[0.2em] font-semibold text-slate-500 mb-12 md:mb-16"
        >
          {t('stats.overline')}
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              data-testid={`stat-item-${i}`}
              className={`p-6 md:p-10 ${
                i < items.length - 1 ? 'border-r border-gray-200' : ''
              } ${i < 2 ? 'border-b md:border-b-0 border-gray-200' : ''}`}
            >
              <span className="block font-heading text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-slate-900 mb-3">
                {item.value}
              </span>
              <span className="block text-sm font-semibold text-slate-900 mb-1">
                {item.label}
              </span>
              <span className="block text-xs text-slate-400">
                {item.desc}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
