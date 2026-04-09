import { motion } from 'framer-motion'
import { ArrowDown, Star } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const AVATARS = [
  { src: 'https://images.unsplash.com/photo-1643224196036-a61f69ff4144?w=150&h=150&fit=crop&crop=faces', alt: 'Senior woman' },
  { src: 'https://images.unsplash.com/photo-1758691461516-7e716e0ca135?w=150&h=150&fit=crop&crop=faces', alt: 'Doctor' },
  { src: 'https://images.unsplash.com/photo-1750853730688-61ba53660e0d?w=150&h=150&fit=crop&crop=faces', alt: 'Senior man' },
  { src: 'https://images.unsplash.com/photo-1758691463393-a2aa9900af8a?w=150&h=150&fit=crop&crop=faces', alt: 'Medical professional' },
  { src: 'https://images.unsplash.com/photo-1613394242132-1268854bde44?w=150&h=150&fit=crop&crop=faces', alt: 'Happy elderly' },
]

const PARTNER_LOGOS = [
  { name: 'Decathlon', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Decathlon.jpg?height=80' },
  { name: 'RedCare', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_RedCare_Pharmacie.jpg?height=80' },
  { name: 'Quirumed', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Quirumed.jpg?height=80' },
  { name: 'Castorama', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Castorama.jpg?height=80' },
  { name: 'MediaMarkt', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_MediaMarkt.jpg?height=80' },
  { name: 'Stadium', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Stadium.jpg?height=80' },
  { name: 'Reha Team', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_reha_team_ortho_team_chutex.jpg?height=80' },
  { name: 'Hobbybox', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_hobbybox.jpg?height=80' },
  { name: 'Farmaline', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_farmaline_chutex.jpg?height=80' },
]

export default function Hero() {
  const { t, lang } = useI18n()
  const recText = lang === 'fr' ? 'Recommandé par les professionnels de santé' : 'Recommended by healthcare professionals'
  const partnerText = lang === 'fr' ? 'Disponible en magasin' : 'Available in store'

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex flex-col justify-end overflow-hidden pb-8 md:pb-12">
      <div className="absolute inset-0">
        <img
          src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/x7c5eb8h_banner_login_mobile.jpg"
          alt="Prevention and care"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-[clamp(2.2rem,6vw,5.5rem)] font-light tracking-[-0.04em] leading-[1.05] text-white mb-6 max-w-4xl"
        >
          {t('hero.title')}{' '}
          <span className="italic font-normal bg-gradient-to-r from-blue-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
            {t('hero.titleHighlight')}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-sm md:text-base text-white/50 leading-relaxed mb-8 max-w-lg"
        >
          {t('hero.subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex flex-wrap items-center gap-3 mb-10"
        >
          <a href="#products" data-testid="hero-cta-button"
            className="group inline-flex items-center gap-2 bg-white text-slate-900 font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:scale-[1.02]">
            {t('hero.cta')}
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white">
              <ArrowDown size={12} strokeWidth={2.5} />
            </span>
          </a>
          <a href="#app" data-testid="hero-secondary-cta"
            className="inline-flex items-center gap-2 text-white/70 font-medium text-sm px-5 py-3.5 transition-all duration-300 hover:text-white">
            {t('hero.ctaSecondary')} <span className="text-white/40">&rarr;</span>
          </a>
        </motion.div>

        {/* Avatars + Stars + Recommendation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:gap-10"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {AVATARS.map((av, i) => (
                <img key={i} src={av.src} alt={av.alt}
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover border-2 border-white/40 shadow-lg" />
              ))}
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} className="text-emerald-400 fill-emerald-400" />
                ))}
              </div>
              <span className="text-white/70 text-[11px] md:text-xs font-medium leading-tight">{recText}</span>
            </div>
          </div>

          {/* Partner Logos */}
          <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
            <span className="text-white/30 text-[10px] uppercase tracking-widest font-semibold flex-shrink-0 hidden md:block">{partnerText}</span>
            <div className="flex items-center gap-5 opacity-40">
              {PARTNER_LOGOS.slice(0, 6).map(logo => (
                <img key={logo.name} src={logo.url} alt={logo.name}
                  className="h-5 md:h-6 w-auto object-contain mix-blend-screen opacity-80 flex-shrink-0" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
