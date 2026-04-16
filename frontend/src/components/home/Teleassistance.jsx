import { useRef, useEffect, useState } from 'react'
import { motion, useInView, animate } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Phone, Clock, MapPin, Users, ArrowRight, Shield, Radio, HeartPulse, Siren } from 'lucide-react'

/* ─── Animated counter inspired by 21st.dev Activity Stats Card ─── */
function AnimatedMetric({ value, suffix = '' }) {
  const ref = useRef(null)
  const numRef = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || !numRef.current) return
    const num = parseInt(String(value).replace(/[^0-9]/g, ''))
    if (isNaN(num)) { numRef.current.textContent = value + suffix; return }
    const prefix = String(value).replace(/[0-9]/g, '')
    const controls = animate(0, num, {
      duration: 2,
      ease: 'easeOut',
      onUpdate(v) { numRef.current.textContent = prefix + Math.round(v) + suffix },
    })
    return () => controls.stop()
  }, [inView, value, suffix])

  return <span ref={ref}><span ref={numRef}>0</span></span>
}

/* ─── Glowing Stat Card inspired by 21st.dev Stat Card (halo + ray) ─── */
function GlowStatCard({ icon: Icon, value, suffix, label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative rounded-2xl overflow-hidden p-[1px] bg-gradient-to-br from-white/[0.08] via-emerald-500/[0.06] to-transparent"
    >
      {/* Moving halo */}
      <motion.div
        className="absolute w-16 h-16 rounded-full bg-emerald-400/15 blur-2xl"
        animate={{
          top: ['10%', '10%', '70%', '70%', '10%'],
          left: ['10%', '75%', '75%', '10%', '10%'],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner card */}
      <div className="relative flex flex-col items-center justify-center rounded-[15px] bg-gradient-to-br from-slate-900/90 to-slate-950/95 backdrop-blur-xl p-6 md:p-8 h-full">
        {/* Rotating subtle ray */}
        <motion.div
          className="absolute w-[180px] h-[30px] rounded-full bg-emerald-500/[0.06] blur-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        <Icon size={20} className="text-emerald-400/60 mb-4 relative z-10" strokeWidth={1.5} />

        {/* Animated value with glow */}
        <motion.div
          className="relative z-10 text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent mb-1.5"
          animate={{
            textShadow: [
              '0 0 12px rgba(52,211,153,0.4)',
              '0 0 2px rgba(52,211,153,0.1)',
              '0 0 12px rgba(52,211,153,0.4)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <AnimatedMetric value={value} suffix={suffix} />
        </motion.div>

        <span className="relative z-10 text-[12px] text-white/30 font-medium tracking-wide">{label}</span>

        {/* Subtle top line */}
        <motion.div
          className="absolute top-[10%] w-[70%] h-[1px] bg-gradient-to-r from-emerald-400/20 to-transparent"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>
    </motion.div>
  )
}

/* ─── Glass Feature Card ─── */
function GlassFeature({ icon: Icon, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative flex items-start gap-4 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] hover:border-emerald-500/15 transition-all duration-500"
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/[0.03] group-hover:to-transparent transition-all duration-500" />

      <div className="relative z-10 w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/20 transition-all duration-300">
        <Icon size={18} className="text-emerald-400" strokeWidth={1.5} />
      </div>
      <div className="relative z-10">
        <h4 className="text-[15px] font-semibold text-white mb-1 group-hover:text-emerald-100 transition-colors duration-300">{title}</h4>
        <p className="text-[13px] text-white/25 leading-relaxed group-hover:text-white/40 transition-colors duration-300">{desc}</p>
      </div>
    </motion.div>
  )
}

const CONTENT = {
  fr: {
    live: 'En service',
    title: "Une equipe medicale\nveille sur vous.",
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
      { icon: Radio, title: 'Suivi post-alerte', desc: 'Accompagnement et rapport apres chaque intervention.' },
    ],
    cta: 'Decouvrir la teleassistance',
  },
  en: {
    live: 'Active',
    title: "A medical team\nwatching over you.",
    desc: "Our teleassistance center continuously monitors your device data. In case of an alert, a trained team intervenes in less than 3 minutes.",
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
      { icon: Radio, title: 'Post-alert follow-up', desc: 'Support and report after each intervention.' },
    ],
    cta: 'Discover teleassistance',
  },
}

export default function Teleassistance() {
  const { lang } = useI18n()
  const tx = CONTENT[lang] || CONTENT.fr

  return (
    <section data-testid="teleassistance-section" className="relative bg-[#060611] overflow-hidden py-24 md:py-32">
      {/* Ambient glows */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/[0.04] blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-600/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute top-[60%] left-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500/[0.03] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[1780px] mx-auto px-4 md:px-12">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          {/* Live pulse badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] backdrop-blur-sm mb-7"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[12px] uppercase tracking-[0.25em] text-emerald-400/80 font-bold">{tx.live}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl lg:text-[3.8rem] font-bold tracking-[-0.04em] leading-[0.95] text-white whitespace-pre-line mb-6"
          >
            {tx.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[16px] md:text-[18px] text-white/30 max-w-xl mx-auto leading-relaxed"
          >
            {tx.desc}
          </motion.p>
        </div>

        {/* Glowing stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-16 md:mb-20">
          {tx.stats.map((stat, i) => (
            <GlowStatCard key={i} {...stat} delay={i * 0.1} />
          ))}
        </div>

        {/* Glass feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-14 md:mb-16">
          {tx.features.map((feat, i) => (
            <GlassFeature key={i} {...feat} delay={i * 0.07} />
          ))}
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
            className="group relative inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-[14px] font-semibold overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(52,211,153,0.15)]"
          >
            <span className="absolute inset-0 bg-white rounded-full" />
            <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-50 group-hover:to-white rounded-full transition-all duration-500" />
            <span className="relative text-slate-900">{tx.cta}</span>
            <ArrowRight size={15} strokeWidth={2} className="relative text-slate-900 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
