import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Phone, Clock, MapPin, Users, ArrowRight, Shield, Radio, HeartPulse, Siren } from 'lucide-react'

function AnimatedNumber({ target, suffix = '', duration = 2000 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!inView) return
    const num = parseInt(String(target).replace(/[^0-9]/g, ''))
    if (isNaN(num)) { setValue(target); return }
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * num))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])
  const prefix = String(target).replace(/[0-9]/g, '')
  return <span ref={ref}>{typeof value === 'number' ? prefix + value + suffix : value}</span>
}

const CONTENT = {
  fr: {
    overline: 'Teleassistance 24/7',
    title: 'Une equipe medicale\nveille sur vous.',
    desc: "Notre centre de teleassistance surveille en continu les donnees de vos dispositifs. En cas d'alerte, une equipe formee intervient en moins de 3 minutes.",
    stats: [
      { value: '<3', suffix: ' min', label: "Temps d'intervention", icon: Clock },
      { value: '100', suffix: '%', label: 'Couverture France', icon: MapPin },
      { value: '50', suffix: '+', label: 'Operateurs formes', icon: Users },
      { value: '24', suffix: '/7', label: 'Disponibilite', icon: Phone },
    ],
    features: [
      { icon: HeartPulse, title: 'Detection automatique', desc: 'Chutes, anomalies cardiaques, immobilite prolongee.' },
      { icon: Phone, title: 'Appel bidirectionnel', desc: 'Communication directe avec le porteur du dispositif.' },
      { icon: MapPin, title: 'Geolocalisation temps reel', desc: 'Localisation precise pour une intervention rapide.' },
      { icon: Siren, title: 'Coordination des secours', desc: 'Liaison SAMU, pompiers et gardiens en simultanee.' },
      { icon: Shield, title: 'Notification gardiens', desc: 'Alertes instantanees a tous les proches designes.' },
      { icon: Radio, title: 'Suivi post-alerte', desc: 'Accompagnement et rapport post-intervention.' },
    ],
    cta: 'Decouvrir la teleassistance',
    live: 'En service',
  },
  en: {
    overline: 'Teleassistance 24/7',
    title: 'A medical team\nwatching over you.',
    desc: "Our teleassistance center continuously monitors data from your devices. In case of an alert, a trained team intervenes in less than 3 minutes.",
    stats: [
      { value: '<3', suffix: ' min', label: 'Response time', icon: Clock },
      { value: '100', suffix: '%', label: 'France coverage', icon: MapPin },
      { value: '50', suffix: '+', label: 'Trained operators', icon: Users },
      { value: '24', suffix: '/7', label: 'Availability', icon: Phone },
    ],
    features: [
      { icon: HeartPulse, title: 'Automatic detection', desc: 'Falls, cardiac anomalies, prolonged immobility.' },
      { icon: Phone, title: 'Two-way call', desc: 'Direct communication with the device wearer.' },
      { icon: MapPin, title: 'Real-time geolocation', desc: 'Precise location for rapid intervention.' },
      { icon: Siren, title: 'Emergency coordination', desc: 'Simultaneous liaison with paramedics and guardians.' },
      { icon: Shield, title: 'Guardian notification', desc: 'Instant alerts to all designated loved ones.' },
      { icon: Radio, title: 'Post-alert follow-up', desc: 'Support and post-intervention report.' },
    ],
    cta: 'Discover teleassistance',
    live: 'Active',
  },
}

export default function Teleassistance() {
  const { lang } = useI18n()
  const tx = CONTENT[lang] || CONTENT.fr
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])

  return (
    <section ref={sectionRef} data-testid="teleassistance-section" className="relative bg-slate-950 overflow-hidden py-24 md:py-32">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.07] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-blue-500/[0.05] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[1780px] mx-auto px-4 md:px-12">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] mb-6"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[12px] uppercase tracking-[0.2em] text-emerald-400/80 font-semibold">{tx.live}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[0.92] text-white whitespace-pre-line mb-5"
          >
            {tx.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[15px] md:text-[17px] text-white/40 max-w-xl mx-auto leading-relaxed"
          >
            {tx.desc}
          </motion.p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-16 md:mb-20">
          {tx.stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                data-testid={`tele-metric-${i}`}
                className="relative group bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 md:p-6 text-center hover:bg-white/[0.07] hover:border-emerald-500/20 transition-all duration-500"
              >
                <Icon size={18} className="text-emerald-400/50 mx-auto mb-3" strokeWidth={1.5} />
                <div className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1">
                  {stat.value}{stat.suffix}
                </div>
                <span className="text-[12px] text-white/30 font-medium">{stat.label}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-14 md:mb-16">
          {tx.features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="group flex items-start gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all duration-400"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                  <Icon size={18} className="text-emerald-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-white mb-1">{feat.title}</h4>
                  <p className="text-[13px] text-white/30 leading-relaxed">{feat.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <a
            href="/teleassistance"
            data-testid="tele-cta-button"
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-slate-900 text-[14px] font-semibold hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300"
          >
            {tx.cta}
            <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
