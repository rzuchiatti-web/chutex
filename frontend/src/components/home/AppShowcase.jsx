import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Activity, Bell, Brain, MapPin, Shield, TrendingUp, Smartphone, ArrowRight } from 'lucide-react'

const APP_IMAGE = 'https://chutex-innovation.com/cdn/shop/files/chutex-app-ia-health-data.jpg?v=1760549560&width=500'

const CONTENT = {
  fr: {
    overline: "L'application",
    title: "Toute votre sante.\nUne seule app.",
    desc: "Pilotez votre ecosysteme Chutex depuis une interface unique. Donnees en temps reel, alertes intelligentes, IA predictive.",
    features: [
      { icon: Activity, label: 'Suivi temps reel', desc: 'Pouls, tension, SpO2, sommeil.' },
      { icon: Bell, label: 'Alertes intelligentes', desc: 'Notifications aux gardiens.' },
      { icon: Brain, label: 'IA Nora', desc: 'Analyse predictive de vos donnees.' },
      { icon: MapPin, label: 'Geolocalisation', desc: 'Localisez vos proches.' },
      { icon: Shield, label: 'Donnees securisees', desc: 'Chiffrement bout en bout.' },
      { icon: TrendingUp, label: 'Rapports medicaux', desc: 'Partagez avec votre medecin.' },
    ],
    cta: "Telecharger l'application",
    available: 'Disponible sur iOS & Android',
    appstore: 'App Store',
    playstore: 'Google Play',
  },
  en: {
    overline: 'The application',
    title: "All your health.\nOne single app.",
    desc: "Manage your Chutex ecosystem from a single interface. Real-time data, smart alerts, predictive AI.",
    features: [
      { icon: Activity, label: 'Real-time tracking', desc: 'Heart rate, BP, SpO2, sleep.' },
      { icon: Bell, label: 'Smart alerts', desc: 'Notifications to guardians.' },
      { icon: Brain, label: 'Nora AI', desc: 'Predictive data analysis.' },
      { icon: MapPin, label: 'Geolocation', desc: 'Locate your loved ones.' },
      { icon: Shield, label: 'Secure data', desc: 'End-to-end encryption.' },
      { icon: TrendingUp, label: 'Medical reports', desc: 'Share with your doctor.' },
    ],
    cta: 'Download the app',
    available: 'Available on iOS & Android',
    appstore: 'App Store',
    playstore: 'Google Play',
  },
}

function FeaturePill({ icon: Icon, label, desc, index, side }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
      className={`group flex items-start gap-3 ${side === 'left' ? 'sm:flex-row-reverse sm:text-right' : ''}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/20 transition-all duration-300">
        <Icon size={17} className="text-emerald-400" strokeWidth={1.5} />
      </div>
      <div>
        <h4 className="text-[14px] font-semibold text-white mb-0.5">{label}</h4>
        <p className="text-[12px] text-white/30 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

export default function AppShowcase() {
  const { lang } = useI18n()
  const tx = CONTENT[lang] || CONTENT.fr
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const phoneScale = useTransform(scrollYProgress, [0.1, 0.35], [0.88, 1])
  const phoneOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])
  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 0.5])

  return (
    <section ref={ref} data-testid="app-showcase-section" className="relative py-24 md:py-32 bg-[#0a0a0f] overflow-hidden">
      {/* Radial glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[130px] pointer-events-none"
        style={{ opacity: glowOpacity }}
      />

      <div className="relative z-10 max-w-[1780px] mx-auto px-4 md:px-12">
        {/* Header */}
        <div className="text-center mb-14 md:mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] mb-6"
          >
            <Smartphone size={13} className="text-emerald-400" strokeWidth={2} />
            <span className="text-[12px] uppercase tracking-[0.2em] text-white/40 font-semibold">{tx.overline}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.04em] leading-[0.92] text-white whitespace-pre-line mb-5"
          >
            {tx.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[15px] md:text-[17px] text-white/35 max-w-lg mx-auto"
          >
            {tx.desc}
          </motion.p>
        </div>

        {/* Phone + features layout */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-0 mb-14 md:mb-16">
          {/* Left features */}
          <div className="lg:w-[30%] flex flex-col gap-7 lg:pr-10">
            {tx.features.slice(0, 3).map((f, i) => (
              <FeaturePill key={i} {...f} index={i} side="left" />
            ))}
          </div>

          {/* Center phone */}
          <motion.div
            className="lg:w-[40%] flex justify-center"
            style={{ scale: phoneScale, opacity: phoneOpacity }}
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="relative w-[240px] md:w-[280px] rounded-[2.5rem] overflow-hidden border-2 border-white/[0.08] shadow-[0_0_80px_-15px_rgba(16,185,129,0.25)]">
                <img src={APP_IMAGE} alt="Chutex Care App" className="w-full h-auto" data-testid="app-phone-image" />
              </div>
              {/* Decorative rings */}
              <div className="absolute -inset-6 border border-white/[0.04] rounded-[3.2rem] pointer-events-none" />
              <div className="absolute -inset-12 border border-white/[0.02] rounded-[4rem] pointer-events-none" />
            </div>
          </motion.div>

          {/* Right features */}
          <div className="lg:w-[30%] flex flex-col gap-7 lg:pl-10">
            {tx.features.slice(3, 6).map((f, i) => (
              <FeaturePill key={i} {...f} index={i} side="right" />
            ))}
          </div>
        </div>

        {/* Download CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <a
              href="https://apps.apple.com/fr/app/chutex/id6746360370"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="app-showcase-appstore"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 text-[14px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              {tx.appstore}
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.nouvy.chutex"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="app-showcase-playstore"
              className="inline-flex items-center justify-center gap-2.5 border border-white/[0.12] text-white/70 font-semibold px-7 py-3.5 rounded-full hover:border-white/25 hover:text-white transition-all duration-300 text-[14px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.59.34-1.11.84-1.35l9.41 9.41-9.41 9.41c-.5-.24-.84-.76-.84-1.35v-.12zm13.81-4.56L5.15 21.73l8.79-8.79 2.87 3zm.52-6.84L5.15 2.27l12.18 5.79-2.87 3.04h-.13zM20.16 10.81c.63.36 1.01 1.02 1.01 1.74 0 .72-.38 1.38-1.01 1.74l-2.54 1.47-3.08-3.08 3.08-3.08 2.54 1.21z"/></svg>
              {tx.playstore}
            </a>
          </div>
          <p className="text-[12px] text-white/20">{tx.available}</p>
        </motion.div>
      </div>
    </section>
  )
}
