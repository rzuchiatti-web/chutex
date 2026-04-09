import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

export default function Testimonials() {
  const { t } = useI18n()
  const items = t('testimonials.items')

  if (!Array.isArray(items)) return null

  return (
    <section data-testid="testimonials-section" className="py-20 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-xs md:text-sm uppercase tracking-[0.2em] font-semibold text-slate-500 mb-4"
        >
          {t('testimonials.overline')}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-heading text-3xl md:text-4xl font-medium tracking-tight text-slate-900 mb-16"
        >
          {t('testimonials.title')}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              data-testid={`testimonial-${i}`}
              className="relative"
            >
              <span className="block font-heading text-6xl text-primary/20 leading-none mb-4">&ldquo;</span>
              <p className="text-base text-slate-600 leading-relaxed italic mb-6 -mt-6">
                {item.quote}
              </p>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.author}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
