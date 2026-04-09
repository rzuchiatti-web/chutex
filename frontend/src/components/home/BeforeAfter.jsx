import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const DATA = {
  fr: {
    before: {
      title: 'Sans Chutex Care',
      subtitle: 'Vivre dans l\'inquiétude.',
      items: [
        'Pas de détection de chute en temps réel.',
        'Aucun suivi des constantes de santé.',
        'Communication limitée avec les aidants.',
        'Intervention tardive après un incident.',
      ],
    },
    after: {
      title: 'Avec Chutex Care',
      subtitle: 'Vivre en sérénité.',
      items: [
        'Airbag Elder se déclenche en 0.08s.',
        'Suivi continu : pouls, tension, sommeil.',
        'Alertes instantanées aux gardiens.',
        'Prévention proactive grâce à l\'IA Nora.',
      ],
    },
  },
  en: {
    before: {
      title: 'Without Chutex Care',
      subtitle: 'Living with worry.',
      items: [
        'No real-time fall detection.',
        'No continuous health monitoring.',
        'Limited communication with caregivers.',
        'Late intervention after incidents.',
      ],
    },
    after: {
      title: 'With Chutex Care',
      subtitle: 'Living with peace of mind.',
      items: [
        'Elder airbag deploys in 0.08s.',
        'Continuous tracking: pulse, BP, sleep.',
        'Instant guardian alerts.',
        'Proactive prevention with Nora AI.',
      ],
    },
  },
}

export default function BeforeAfter() {
  const { lang } = useI18n()
  const d = DATA[lang] || DATA.fr

  return (
    <section data-testid="before-after-section" className="py-20 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-[#F5F0E8] rounded-3xl p-8 md:p-10"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-medium mb-2">{d.before.title}</p>
            <h3 className="font-heading text-2xl md:text-3xl font-light tracking-tight text-slate-900 mb-8">{d.before.subtitle}</h3>
            <div className="space-y-4 mt-auto">
              {d.before.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X size={13} className="text-red-500" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="bg-slate-900 rounded-3xl p-8 md:p-10"
          >
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 font-medium mb-2">{d.after.title}</p>
            <h3 className="font-heading text-2xl md:text-3xl font-light tracking-tight text-white mb-8">{d.after.subtitle}</h3>
            <div className="space-y-4 mt-auto">
              {d.after.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={13} className="text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
