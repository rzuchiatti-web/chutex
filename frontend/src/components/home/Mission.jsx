import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Cpu, ShieldCheck, HeartPulse, Users } from 'lucide-react'

const CONTENT = {
  fr: {
    overline: 'Notre mission',
    title: 'La clinique digitale\nde prévention.',
    desc: "Chutex Care conçoit un écosystème de santé connecté qui anticipe les risques, protège au quotidien et accompagne chaque instant de vie. Notre vision : un monde où vieillir rime avec sérénité.",
    pillars: [
      { icon: Cpu, label: 'Innovation', desc: 'R&D française, brevets déposés, intelligence artificielle embarquée.' },
      { icon: HeartPulse, label: 'Prévention', desc: 'Détecter les signaux faibles avant que le risque ne survienne.' },
      { icon: ShieldCheck, label: 'Protection', desc: 'Réagir en millisecondes quand chaque seconde compte.' },
      { icon: Users, label: 'Accompagnement', desc: 'Une équipe humaine et connectée, disponible 24h/24.' },
    ],
    stats: [
      { value: '2020', label: 'Fondée à Paris' },
      { value: '10K+', label: 'Familles protégées' },
      { value: '3', label: 'Dispositifs certifiés' },
      { value: '24/7', label: 'Téléassistance active' },
    ],
  },
  en: {
    overline: 'Our mission',
    title: 'The digital clinic\nfor prevention.',
    desc: "Chutex Care designs a connected health ecosystem that anticipates risks, protects daily and supports every moment of life. Our vision: a world where aging means serenity.",
    pillars: [
      { icon: Cpu, label: 'Innovation', desc: 'French R&D, filed patents, embedded artificial intelligence.' },
      { icon: HeartPulse, label: 'Prevention', desc: 'Detect early signals before risk occurs.' },
      { icon: ShieldCheck, label: 'Protection', desc: 'React in milliseconds when every second counts.' },
      { icon: Users, label: 'Support', desc: 'A human and connected team, available 24/7.' },
    ],
    stats: [
      { value: '2020', label: 'Founded in Paris' },
      { value: '10K+', label: 'Families protected' },
      { value: '3', label: 'Certified devices' },
      { value: '24/7', label: 'Active teleassistance' },
    ],
  },
}

const MISSION_IMAGE = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=1100&fit=crop&q=80'

export default function Mission() {
  const { lang } = useI18n()
  const tx = CONTENT[lang] || CONTENT.fr
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const imageY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const titleY = useTransform(scrollYProgress, [0, 0.4], [80, 0])
  const titleOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1])

  return (
    <section ref={sectionRef} data-testid="mission-section" className="relative py-28 md:py-40 bg-white overflow-hidden">
      <div className="max-w-[1780px] mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

          {/* Left — Text content (55%) */}
          <div className="lg:w-[55%]">
            {/* Overline */}
            <motion.div
              style={{ opacity: titleOpacity }}
              className="flex items-center gap-3 mb-10"
            >
              <div className="w-10 h-px bg-slate-900" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">{tx.overline}</span>
            </motion.div>

            {/* Giant title */}
            <motion.h2
              style={{ opacity: titleOpacity, y: titleY }}
              className="text-[clamp(2.5rem,6.5vw,6rem)] font-semibold tracking-[-0.04em] leading-[0.92] text-slate-900 whitespace-pre-line mb-10 md:mb-14"
            >
              {tx.title}
            </motion.h2>

            {/* Description with emerald left border */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="mb-16 md:mb-20"
            >
              <div className="border-l-2 border-emerald-500 pl-6 md:pl-8">
                <p className="text-base md:text-[17px] text-slate-500 leading-[1.85] max-w-xl">{tx.desc}</p>
              </div>
            </motion.div>

            {/* Pillars — 2x2 grid with glass treatment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tx.pillars.map((pillar, i) => {
                const Icon = pillar.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 35 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: i * 0.08 }}
                    data-testid={`mission-pillar-${i}`}
                    className="group relative bg-slate-50/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 md:p-7 hover:bg-white hover:border-slate-300/80 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-500"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors duration-300">
                      <Icon size={18} className="text-emerald-600" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-[15px] font-semibold text-slate-900 mb-1.5 tracking-tight">{pillar.label}</h4>
                    <p className="text-[13px] text-slate-400 leading-relaxed">{pillar.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Right — Parallax image with glass overlay (45%) */}
          <div className="lg:w-[45%] relative lg:sticky lg:top-32">
            <motion.div
              className="relative rounded-3xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              {/* Image with parallax */}
              <div className="aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-3xl">
                <motion.img
                  src={MISSION_IMAGE}
                  alt="Chutex Care Innovation"
                  className="w-full h-[120%] object-cover"
                  style={{ y: imageY }}
                />
              </div>

              {/* Glass overlay card at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-5 md:p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {tx.stats.map((stat, i) => (
                      <div key={i} data-testid={`mission-stat-${i}`}>
                        <span className="block text-xl md:text-2xl font-semibold text-white tracking-tight">{stat.value}</span>
                        <span className="text-[11px] text-white/60 leading-tight">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtle dark gradient at bottom for glass readability */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent rounded-b-3xl pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
