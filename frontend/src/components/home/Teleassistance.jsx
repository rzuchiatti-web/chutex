import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Phone, Clock, MapPin, Users, ArrowRight } from 'lucide-react'

const CONTENT = {
  fr: {
    overline: 'Téléassistance',
    title: 'Toujours connectés.\nToujours protégés.',
    desc: "Notre centre de téléassistance surveille en continu les données de vos dispositifs Chutex. En cas d'alerte, une équipe médicale intervient immédiatement.",
    metrics: [
      { icon: Clock, value: '<3', suffix: 'min', label: "Temps d'intervention moyen" },
      { icon: MapPin, value: '100', suffix: '%', label: 'Couverture France métropolitaine' },
      { icon: Users, value: '50', suffix: '+', label: "Opérateurs formés à l'urgence" },
      { icon: Phone, value: '24', suffix: '/7', label: 'Disponibilité du service' },
    ],
    features: [
      'Détection automatique des chutes et anomalies',
      'Appel bidirectionnel avec le porteur',
      'Géolocalisation en temps réel',
      'Coordination avec les secours (SAMU, pompiers)',
      'Notification instantanée aux gardiens',
    ],
    cta: 'En savoir plus',
  },
  en: {
    overline: 'Teleassistance',
    title: 'Always connected.\nAlways protected.',
    desc: "Our teleassistance center continuously monitors data from your Chutex devices. In case of an alert, a medical team intervenes immediately.",
    metrics: [
      { icon: Clock, value: '<3', suffix: 'min', label: 'Average response time' },
      { icon: MapPin, value: '100', suffix: '%', label: 'Metropolitan France coverage' },
      { icon: Users, value: '50', suffix: '+', label: 'Trained emergency operators' },
      { icon: Phone, value: '24', suffix: '/7', label: 'Service availability' },
    ],
    features: [
      'Automatic fall and anomaly detection',
      'Two-way call with wearer',
      'Real-time geolocation',
      'Coordination with emergency services',
      'Instant notification to guardians',
    ],
    cta: 'Learn more',
  },
}

const BG_IMAGE = 'https://images.unsplash.com/photo-1666214280577-5f90bc36be92?w=1920&h=1080&fit=crop&q=80'

function AnimatedNumber({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    const numeric = parseInt(value.replace(/[^0-9]/g, ''))
    if (isNaN(numeric)) { setDisplay(value); return }
    const prefix = value.replace(/[0-9]/g, '')
    let start = null
    const duration = 1500
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(prefix + Math.round(eased * numeric))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, value])

  return <span ref={ref}>{display}{suffix}</span>
}

export default function Teleassistance() {
  const { lang } = useI18n()
  const tx = CONTENT[lang] || CONTENT.fr
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
  const contentY = useTransform(scrollYProgress, [0.1, 0.4], [50, 0])
  const contentOpacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 1])

  return (
    <section ref={sectionRef} data-testid="teleassistance-section" className="relative min-h-screen overflow-hidden">
      {/* Background image with parallax */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <img
          src={BG_IMAGE}
          alt="Teleassistance center"
          className="w-full h-[115%] object-cover"
        />
      </motion.div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/50" />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-[1780px] mx-auto px-6 md:px-12 py-28 md:py-40"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-2xl">
          {/* Overline with live pulse */}
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-white/50 font-medium">{tx.overline}</span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.95] text-white whitespace-pre-line mb-8">
            {tx.title}
          </h2>

          {/* Description */}
          <p className="text-base md:text-[17px] text-white/45 leading-[1.8] mb-12 md:mb-16 max-w-lg">
            {tx.desc}
          </p>

          {/* Metrics grid — glass cards */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-12 md:mb-16">
            {tx.metrics.map((metric, i) => {
              const Icon = metric.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  data-testid={`tele-metric-${i}`}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 hover:bg-white/8 hover:border-white/15 transition-all duration-400"
                >
                  <Icon size={16} className="text-emerald-400/70 mb-3" strokeWidth={1.5} />
                  <span className="block text-2xl md:text-3xl font-semibold text-white tracking-tight mb-1">
                    <AnimatedNumber value={metric.value} suffix={metric.suffix} />
                  </span>
                  <span className="text-[11px] md:text-[12px] text-white/40 leading-snug">{metric.label}</span>
                </motion.div>
              )
            })}
          </div>

          {/* Features list with thin lines */}
          <div className="mb-10">
            <div className="h-px bg-white/10" />
            {tx.features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <p className="py-3.5 text-[13px] md:text-[14px] text-white/60 font-medium">{feat}</p>
                <div className="h-px bg-white/10" />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.a
            href="/teleassistance"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            data-testid="tele-cta-button"
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-slate-900 text-[14px] font-semibold hover:bg-white/90 transition-all duration-300"
          >
            {tx.cta}
            <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
          </motion.a>
        </div>
      </motion.div>
    </section>
  )
}
