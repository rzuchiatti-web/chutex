import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const AVATARS = [
  { src: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=faces', alt: 'Doctor' },
  { src: 'https://images.unsplash.com/photo-1758691461516-7e716e0ca135?w=200&h=200&fit=crop&crop=faces', alt: 'Doctor' },
  { src: 'https://images.unsplash.com/photo-1686737357932-ae1c50492a9e?w=200&h=200&fit=crop&crop=faces', alt: 'Nurse' },
  { src: 'https://images.unsplash.com/photo-1758691463393-a2aa9900af8a?w=200&h=200&fit=crop&crop=faces', alt: 'Doctor' },
  { src: 'https://images.unsplash.com/photo-1670191069225-f992139f6545?w=200&h=200&fit=crop&crop=faces', alt: 'Doctor' },
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
    cta: 'Découvrir nos solutions',
    ctaSecondary: 'En savoir plus',
    rec: 'Recommandé par les professionnels de santé',
  },
  en: {
    line1: 'Building a future',
    line2: 'where longevity, vitality, and health',
    line3: 'are driven by ',
    highlight: 'prevention.',
    subtitle: 'The connected health ecosystem, dedicated to your peace of mind and that of your loved ones.',
    cta: 'Discover our solutions',
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
        <video autoPlay muted loop playsInline preload="auto" className="w-full h-full object-cover">
          <source src="https://cdn.prod.website-files.com/679d8b01c23ed7847fc5108f/681a5d6a393040f8a64f2175_topaz_hero-transcode.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/30" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-[1780px] mx-auto px-6 md:px-12 w-full flex-1 flex flex-col justify-center pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-[clamp(1.6rem,3.8vw,3.2rem)] font-light tracking-[-0.02em] leading-[1.2] text-white mb-7 max-w-3xl"
        >
          {tx.line1}<br />
          {tx.line2}<br />
          {tx.line3}
          <span className="font-semibold">{tx.highlight}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-[13px] md:text-[14px] text-white/40 leading-relaxed mb-9 max-w-md"
        >
          {tx.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex items-center gap-4"
        >
          {/* Glass CTA Button */}
          <a href="#products" data-testid="hero-cta-button"
            className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold text-white overflow-hidden transition-all duration-700 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full transition-all duration-700 group-hover:bg-white/20 group-hover:border-white/30" />
            <span className="relative flex items-center gap-2.5">
              {tx.cta}
              <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-500 group-hover:translate-x-1" />
            </span>
          </a>
          <a href="#app" data-testid="hero-secondary-cta"
            className="text-white/35 font-medium text-sm transition-all duration-500 hover:text-white/80 flex items-center gap-1.5">
            {tx.ctaSecondary} <span>&rarr;</span>
          </a>
        </motion.div>
      </div>

      {/* Bottom — Professionals + Stars + Logos */}
      <div className="relative z-10 w-full pb-6 md:pb-8">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex items-center gap-4 mb-5"
          >
            <div className="flex -space-x-2">
              {AVATARS.map((av, i) => (
                <img key={i} src={av.src} alt={av.alt}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-[2.5px] border-white/30 shadow-xl" />
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-[3px]">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} className="text-emerald-400 fill-emerald-400" />
                ))}
              </div>
              <span className="text-white/60 text-xs md:text-[13px] font-medium">{tx.rec}</span>
            </div>
          </motion.div>

          {/* Partner Logos — fade edges marquee, same width as section above */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.7 }}
            className="relative overflow-hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)' }}
          >
            <div className="flex animate-marquee items-center gap-14">
              {[...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS].map((logo, i) => (
                <img key={`${logo.name}-${i}`} src={logo.url} alt={logo.name}
                  className="h-5 md:h-6 w-auto object-contain mix-blend-screen opacity-60 flex-shrink-0" />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
