import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { ArrowRight, Dumbbell, Stethoscope, Home } from 'lucide-react'

const PROS = [
  {
    key: 'coach',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1706806594828-318b9185ad0e?w=700&h=1000&fit=crop&crop=faces&q=80',
    href: '/professionnels/coach',
    accentColor: 'bg-blue-500',
    accentGlow: 'shadow-blue-500/20',
    fr: {
      role: 'Coach sportif',
      headline: 'Accompagnez vos clients avec des données précises.',
      desc: "Accédez aux données d'activité, de récupération et de performance de vos clients équipés Chutex pour personnaliser vos programmes.",
      cta: 'Devenir coach partenaire',
    },
    en: {
      role: 'Sports Coach',
      headline: 'Support your clients with precise data.',
      desc: "Access activity, recovery and performance data from your Chutex-equipped clients to personalize your programs.",
      cta: 'Become a partner coach',
    },
  },
  {
    key: 'kine',
    icon: Stethoscope,
    image: 'https://images.unsplash.com/photo-1611608822650-925c227ef4d2?w=700&h=1000&fit=crop&crop=faces&q=80',
    href: '/professionnels/kine',
    accentColor: 'bg-emerald-500',
    accentGlow: 'shadow-emerald-500/20',
    fr: {
      role: 'Kinésithérapeute',
      headline: 'Suivez la rééducation en temps réel.',
      desc: "Monitorez les progrès de vos patients entre les séances grâce aux données continues du bracelet Elio et du gilet Elder.",
      cta: 'Devenir kiné partenaire',
    },
    en: {
      role: 'Physiotherapist',
      headline: 'Monitor rehabilitation in real-time.',
      desc: "Track your patients\u2019 progress between sessions through continuous data from the Elio bracelet and Elder vest.",
      cta: 'Become a partner physio',
    },
  },
  {
    key: 'saad',
    icon: Home,
    image: 'https://images.unsplash.com/photo-1765896387387-0538bc9f997e?w=700&h=1000&fit=crop&crop=faces&q=80',
    href: '/professionnels/saad',
    accentColor: 'bg-amber-500',
    accentGlow: 'shadow-amber-500/20',
    fr: {
      role: 'Aide à domicile',
      headline: 'Sécurisez vos bénéficiaires au quotidien.',
      desc: "Intégrez les dispositifs Chutex dans vos prestations pour offrir une protection continue et rassurer les familles de vos bénéficiaires.",
      cta: 'Devenir SAAD partenaire',
    },
    en: {
      role: 'Home Care',
      headline: 'Secure your beneficiaries daily.',
      desc: "Integrate Chutex devices into your services to provide continuous protection and reassure your beneficiaries' families.",
      cta: 'Become a partner SAAD',
    },
  },
]

export default function Professionals() {
  const { lang } = useI18n()

  return (
    <section data-testid="professionals-section" className="py-28 md:py-40 bg-white overflow-hidden">
      <div className="max-w-[1780px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-20">
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-px bg-slate-900" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">
                {lang === 'fr' ? 'Professionnels' : 'Professionals'}
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-slate-900 leading-tight"
            >
              {lang === 'fr' ? "Rejoignez le réseau\nChutex Care." : "Join the Chutex\nCare network."}
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[15px] text-slate-400 max-w-md leading-relaxed md:text-right"
          >
            {lang === 'fr'
              ? "Coachs, kinés, services d'aide à domicile : intégrez Chutex dans votre pratique et offrez un suivi premium à vos clients."
              : "Coaches, physios, home care services: integrate Chutex into your practice and offer premium monitoring to your clients."}
          </motion.p>
        </div>

        <div className="h-px bg-slate-200 mb-12 md:mb-16" />

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {PROS.map((pro, i) => {
            const tx = pro[lang] || pro.fr
            const Icon = pro.icon
            return (
              <motion.div
                key={pro.key}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: i * 0.1 }}
                data-testid={`pro-card-${pro.key}`}
                className="group relative rounded-3xl overflow-hidden aspect-[3/4] cursor-pointer"
              >
                {/* Background image */}
                <img
                  src={pro.image}
                  alt={tx.role}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Accent dot */}
                <div className="absolute top-5 left-5 flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${pro.accentColor}`} />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">{tx.role}</span>
                </div>

                {/* Glass content at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                  <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 md:p-6 transition-all duration-500 group-hover:bg-white/15 group-hover:border-white/25">
                    <Icon size={18} className="text-white/70 mb-3" strokeWidth={1.5} />
                    <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight mb-2 leading-snug">{tx.headline}</h3>
                    <p className="text-[12px] text-white/45 leading-relaxed mb-4 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{tx.desc}</p>
                    <a
                      href={pro.href}
                      className="inline-flex items-center gap-2 text-[13px] font-semibold text-white group-hover:text-emerald-300 transition-colors duration-300"
                    >
                      {tx.cta}
                      <ArrowRight size={14} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-14 md:mt-16"
        >
          <a
            href="/devenir-distributeur"
            data-testid="pro-distributor-cta"
            className="group inline-flex items-center gap-2.5 text-[14px] font-semibold text-slate-900 hover:text-emerald-600 transition-colors duration-300"
          >
            {lang === 'fr' ? 'Devenir distributeur Chutex Care' : 'Become a Chutex Care distributor'}
            <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
