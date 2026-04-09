import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

const STATS_DATA = {
  fr: [
    { end: 0.08, suffix: 's', label: 'Déclenchement airbag', desc: 'Protection instantanée' },
    { end: 36, suffix: 'h', label: 'Autonomie batterie', desc: 'Gilet Elder' },
    { end: 50, suffix: 'm', label: 'Étanchéité', desc: 'Bracelet Elio' },
    { end: 10000, suffix: '+', label: 'Familles protégées', desc: 'Et ce n\'est que le début' },
  ],
  en: [
    { end: 0.08, suffix: 's', label: 'Airbag deployment', desc: 'Instant protection' },
    { end: 36, suffix: 'h', label: 'Battery life', desc: 'Elder vest' },
    { end: 50, suffix: 'm', label: 'Waterproof', desc: 'Elio bracelet' },
    { end: 10000, suffix: '+', label: 'Families protected', desc: 'And just the beginning' },
  ],
}

function Counter({ end, suffix, duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * end)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, end, duration])

  const display = end < 1 ? count.toFixed(2) : end >= 1000 ? Math.round(count).toLocaleString() : Math.round(count)
  return <span ref={ref}>{display}{suffix}</span>
}

export default function Stats() {
  const { lang } = useI18n()
  const items = STATS_DATA[lang] || STATS_DATA.fr

  return (
    <section data-testid="stats-section" className="py-20 md:py-32 bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              data-testid={`stat-item-${i}`}
              className="bg-slate-950 p-6 md:p-10 text-center"
            >
              <span className="block font-heading text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-3">
                <Counter end={item.end} suffix={item.suffix} />
              </span>
              <span className="block text-sm font-semibold text-white/80 mb-1">{item.label}</span>
              <span className="block text-xs text-white/40">{item.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
