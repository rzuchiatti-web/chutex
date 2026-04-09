import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import { Package, Smartphone, Link2, ShieldCheck } from 'lucide-react'

const STEPS = {
  fr: [
    { num: '01', title: 'Commandez', desc: 'Choisissez votre dispositif sur notre site. Livraison rapide et soignée.', icon: Package },
    { num: '02', title: 'Activez', desc: 'Déballez, chargez et activez votre appareil en quelques minutes.', icon: Smartphone },
    { num: '03', title: 'Connectez', desc: 'Associez votre dispositif à l\'application Chutex Care et ajoutez vos gardiens.', icon: Link2 },
    { num: '04', title: 'Protégez', desc: 'Vivez sereinement. Nos capteurs veillent 24h/24 sur votre santé et votre sécurité.', icon: ShieldCheck },
  ],
  en: [
    { num: '01', title: 'Order', desc: 'Choose your device on our site. Fast and careful delivery.', icon: Package },
    { num: '02', title: 'Activate', desc: 'Unbox, charge and activate your device in minutes.', icon: Smartphone },
    { num: '03', title: 'Connect', desc: 'Pair your device with the Chutex Care app and add your guardians.', icon: Link2 },
    { num: '04', title: 'Protect', desc: 'Live peacefully. Our sensors watch 24/7 over your health and safety.', icon: ShieldCheck },
  ],
}

export default function HowItWorks() {
  const { lang } = useI18n()
  const steps = STEPS[lang] || STEPS.fr

  return (
    <section data-testid="how-it-works-section" className="py-20 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group bg-white rounded-2xl p-6 md:p-7 border border-gray-100 hover:border-primary/20 hover:shadow-lg transition-all duration-500"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Phase</span>
                  <span className="font-heading text-lg font-semibold text-primary">{step.num}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <Icon size={20} className="text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-lg font-medium text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
