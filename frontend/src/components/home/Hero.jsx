import { motion } from 'framer-motion'
import { ArrowDown, Star } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const AVATARS = [
  { src: 'https://images.unsplash.com/photo-1643224196036-a61f69ff4144?w=150&h=150&fit=crop&crop=faces', alt: 'Senior' },
  { src: 'https://images.unsplash.com/photo-1758691461516-7e716e0ca135?w=150&h=150&fit=crop&crop=faces', alt: 'Doctor' },
  { src: 'https://images.unsplash.com/photo-1750853730688-61ba53660e0d?w=150&h=150&fit=crop&crop=faces', alt: 'Senior' },
  { src: 'https://images.unsplash.com/photo-1758691463393-a2aa9900af8a?w=150&h=150&fit=crop&crop=faces', alt: 'Doctor' },
  { src: 'https://images.unsplash.com/photo-1613394242132-1268854bde44?w=150&h=150&fit=crop&crop=faces', alt: 'Senior' },
]

const PARTNER_LOGOS = [
  { name: 'Decathlon', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Decathlon.jpg?height=80' },
  { name: 'RedCare', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_RedCare_Pharmacie.jpg?height=80' },
  { name: 'Quirumed', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Quirumed.jpg?height=80' },
  { name: 'Castorama', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Castorama.jpg?height=80' },
  { name: 'MediaMarkt', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_MediaMarkt.jpg?height=80' },
  { name: 'Stadium', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Stadium.jpg?height=80' },
  { name: 'Reha Team', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_reha_team_ortho_team_chutex.jpg?height=80' },
  { name: 'Farmaline', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_farmaline_chutex.jpg?height=80' },
]

const TITLES = {
  fr: {
    line1: 'Construire un avenir',
    line2: 'où la longévité, la vitalité et la santé',
    line3: 'sont portées par ',
    highlight: 'la prévention.',
    subtitle: "L'écosystème de santé connecté, au service de votre sérénité et de celle de vos proches.",
    cta: 'Nos solutions',
    ctaSecondary: 'En savoir plus',
    rec: 'Recommandé par les professionnels de santé',
  },
  en: {
    line1: 'Building a future',
    line2: 'where longevity, vitality, and health',
    line3: 'are driven by ',
    highlight: 'prevention.',
    subtitle: 'The connected health ecosystem, dedicated to your peace of mind and that of your loved ones.',
    cta: 'Our solutions',
    ctaSecondary: 'Learn more',
    rec: 'Recommended by healthcare professionals',
  },
}

export default function Hero() {
  const { lang } = useI18n()
  const tx = TITLES[lang] || TITLES.fr

  return (
    <section data-testid="hero-section" className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay muted loop playsInline preload="auto"
          className="w-full h-full object-cover"
          style={{ minWidth: '100%', minHeight: '100%' }}
        >
          <source src="https://cdn.prod.website-files.com/679d8b01c23ed7847fc5108f/681a5d6a393040f8a64f2175_topaz_hero-transcode.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/35" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-[1780px] mx-auto px-6 md:px-12 w-full flex-1 flex flex-col justify-center pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-[clamp(1.6rem,3.8vw,3.2rem)] font-light tracking-[-0.02em] leading-[1.2] text-white mb-7 max-w-3xl"
        >
          {tx.line1}<br />
          {tx.line2}<br />
          {tx.line3}
          <span className="font-semibold">{tx.highlight}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="text-[13px] md:text-[14px] text-white/40 leading-relaxed mb-8 max-w-md"
        >
          {tx.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex items-center gap-4"
        >
          <a href="#products" data-testid="hero-cta-button"
            className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-sm text-slate-900 font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-500 hover:bg-white hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02]">
            {tx.cta}
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          </a>
          <a href="#app" data-testid="hero-secondary-cta"
            className="text-white/40 font-medium text-sm transition-all duration-300 hover:text-white flex items-center gap-1.5">
            {tx.ctaSecondary} <span>&rarr;</span>
          </a>
        </motion.div>
      </div>

      {/* Bottom — Avatars + Stars then Logos marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.1 }}
        className="relative z-10 w-full pb-6 md:pb-8"
      >
        {/* Avatars + Stars */}
        <div className="max-w-[1780px] mx-auto px-6 md:px-12 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {AVATARS.map((av, i) => (
                <img key={i} src={av.src} alt={av.alt}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover border-2 border-white/30 shadow-lg" />
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-[3px]">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={12} className="text-emerald-400 fill-emerald-400" />
                ))}
              </div>
              <span className="text-white/50 text-[11px] font-medium">{tx.rec}</span>
            </div>
          </div>
        </div>

        {/* Partner Logos — infinite marquee slide */}
        <div className="overflow-hidden">
          <div className="flex animate-marquee items-center gap-12">
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
              <img key={`${logo.name}-${i}`} src={logo.url} alt={logo.name}
                className="h-5 md:h-[22px] w-auto object-contain mix-blend-screen opacity-60 flex-shrink-0" />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
