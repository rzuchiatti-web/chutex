import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Activity, Bell, Brain, MapPin, Shield, TrendingUp } from 'lucide-react'

const CONTENT = {
  fr: {
    overline: "L'application",
    title: 'Votre santé,\ndans votre poche.',
    desc: "Pilotez l'ensemble de votre écosystème Chutex depuis une interface unique, intuitive et sécurisée.",
    features: [
      { icon: Activity, label: 'Suivi en temps réel', desc: 'Pouls, tension, sommeil, activité.' },
      { icon: Bell, label: 'Alertes intelligentes', desc: 'Notifications instantanées aux gardiens.' },
      { icon: Brain, label: 'IA Nora', desc: 'Analyse prédictive de vos données.' },
      { icon: MapPin, label: 'Géolocalisation', desc: 'Localisez vos proches à tout moment.' },
      { icon: Shield, label: 'Données sécurisées', desc: 'Chiffrement de bout en bout, RGPD.' },
      { icon: TrendingUp, label: 'Rapports médicaux', desc: 'Partagez avec votre médecin.' },
    ],
    cta: 'Télécharger',
    available: 'Disponible sur iOS & Android',
  },
  en: {
    overline: 'The application',
    title: 'Your health,\nin your pocket.',
    desc: "Manage your entire Chutex ecosystem from a single, intuitive and secure interface.",
    features: [
      { icon: Activity, label: 'Real-time tracking', desc: 'Pulse, BP, sleep, activity.' },
      { icon: Bell, label: 'Smart alerts', desc: 'Instant notifications to guardians.' },
      { icon: Brain, label: 'Nora AI', desc: 'Predictive analysis of your data.' },
      { icon: MapPin, label: 'Geolocation', desc: 'Locate your loved ones anytime.' },
      { icon: Shield, label: 'Secure data', desc: 'End-to-end encryption, GDPR.' },
      { icon: TrendingUp, label: 'Medical reports', desc: 'Share with your doctor.' },
    ],
    cta: 'Download',
    available: 'Available on iOS & Android',
  },
}

const APP_IMAGE = 'https://chutex-innovation.com/cdn/shop/files/chutex-app-ia-health-data.jpg?v=1760549560&width=500'

export default function AppShowcase() {
  const { lang } = useI18n()
  const tx = CONTENT[lang] || CONTENT.fr
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const phoneScale = useTransform(scrollYProgress, [0.1, 0.35], [0.85, 1])
  const phoneOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1])
  const glowOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 0.6])

  return (
    <section ref={ref} data-testid="app-showcase-section" className="relative py-28 md:py-40 bg-slate-950 overflow-hidden">
      {/* Radial glow behind phone */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none"
        style={{ opacity: glowOpacity }}
      />

      <div className="relative z-10 max-w-[1780px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-7"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-medium">{tx.overline}</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.95] text-white whitespace-pre-line mb-6"
          >
            {tx.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[15px] text-white/40 max-w-md mx-auto leading-relaxed"
          >
            {tx.desc}
          </motion.p>
        </div>

        {/* Phone + features layout */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0">

          {/* Left features */}
          <div className="lg:w-[30%] flex flex-col gap-6 md:gap-8 lg:pr-12">
            {tx.features.slice(0, 3).map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  data-testid={`app-feature-left-${i}`}
                  className="group flex items-start gap-4 lg:flex-row-reverse lg:text-right"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                    <Icon size={18} className="text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-white mb-1">{feat.label}</h4>
                    <p className="text-[12px] text-white/35 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Center phone */}
          <motion.div
            className="lg:w-[40%] flex justify-center"
            style={{ scale: phoneScale, opacity: phoneOpacity }}
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="relative w-[260px] md:w-[300px] rounded-[2.5rem] overflow-hidden border-2 border-white/10 shadow-[0_0_80px_-20px_rgba(16,185,129,0.3)]">
                <img
                  src={APP_IMAGE}
                  alt="Chutex Care App"
                  className="w-full h-auto"
                  data-testid="app-phone-image"
                />
              </div>
              {/* Decorative rings */}
              <div className="absolute -inset-8 border border-white/5 rounded-[3.5rem] pointer-events-none" />
              <div className="absolute -inset-16 border border-white/[0.02] rounded-[4.5rem] pointer-events-none" />
            </div>
          </motion.div>

          {/* Right features */}
          <div className="lg:w-[30%] flex flex-col gap-6 md:gap-8 lg:pl-12">
            {tx.features.slice(3, 6).map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  data-testid={`app-feature-right-${i}`}
                  className="group flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                    <Icon size={18} className="text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-semibold text-white mb-1">{feat.label}</h4>
                    <p className="text-[12px] text-white/35 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Download CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-16 md:mt-20"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://apps.apple.com/fr/app/chutex/id6746360370"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="app-showcase-appstore"
              className="inline-flex items-center justify-center gap-2.5 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 text-[14px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.nouvy.chutex"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="app-showcase-playstore"
              className="inline-flex items-center justify-center gap-2.5 border border-white/15 text-white/80 font-semibold px-7 py-3.5 rounded-full hover:border-white/30 hover:text-white transition-all duration-300 text-[14px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.59.34-1.11.84-1.35l9.41 9.41-9.41 9.41c-.5-.24-.84-.76-.84-1.35v-.12zm13.81-4.56L5.15 21.73l8.79-8.79 2.87 3zm.52-6.84L5.15 2.27l12.18 5.79-2.87 3.04h-.13zM20.16 10.81c.63.36 1.01 1.02 1.01 1.74 0 .72-.38 1.38-1.01 1.74l-2.54 1.47-3.08-3.08 3.08-3.08 2.54 1.21z"/></svg>
              Google Play
            </a>
          </div>
          <p className="text-[12px] text-white/25 mt-4">{tx.available}</p>
        </motion.div>
      </div>
    </section>
  )
}
