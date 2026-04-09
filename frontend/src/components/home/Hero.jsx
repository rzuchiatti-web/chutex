import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const AVATARS = [
  { src: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/5d2cf3e7e3858fd2d7002514b916aa33b0ddb2bba19b66a81f4b3ecfa248621f.png', alt: 'Dr.' },
  { src: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/3439dd0836f467adcc8782ea08082082f3b3f90fffc81eb1e964b3d01bdb1c53.png', alt: 'Dr.' },
  { src: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/e215d56ef9cb97f16ba7ae9f035a65d73ffc2325fb06520f0c3794cdd04bf265.png', alt: 'Dr.' },
  { src: 'https://static.prod-images.emergentagent.com/jobs/48e5eb31-c61a-4fb1-be42-94e61a127565/images/4b57083f0f23152c0cd8ba94fc8b689887adb285a808cbea99e2f9730cd5f279.png', alt: 'Dr.' },
]

const PARTNER_LOGOS = [
  { name: 'Decathlon', url: '/partners/decathlon.png' },
  { name: 'RedCare', url: '/partners/redcare.png' },
  { name: 'Reha Team', url: '/partners/rehateam.png' },
  { name: 'Farmaline', url: '/partners/farmaline.png' },
  { name: 'Identités', url: '/partners/identites.png' },
]

const TITLES = {
  fr: {
    line1: 'Construire un avenir',
    line2: 'où la longévité, la vitalité et la santé',
    line3: 'sont portées par la prévention.',
    mLine1: 'Construire un avenir où',
    mLine2: 'la longévité, la vitalité et',
    mLine3: 'la santé sont portées par la prévention.',
    subtitle1: "Un écosystème de santé connecté et intelligent,",
    subtitle2: "conçu pour anticiper, protéger et accompagner",
    subtitle3: "chaque instant de vie avec sérénité.",
    cta: 'Découvrir nos solutions',
    rec: 'Recommandé par les professionnels de santé',
  },
  en: {
    line1: 'Building a future',
    line2: 'where longevity, vitality, and health',
    line3: 'are driven by prevention.',
    mLine1: 'Building a future where',
    mLine2: 'longevity, vitality, and health',
    mLine3: 'are driven by prevention.',
    subtitle1: "A connected and intelligent health ecosystem,",
    subtitle2: "designed to anticipate, protect and accompany",
    subtitle3: "every moment of life with peace of mind.",
    cta: 'Discover our solutions',
    rec: 'Recommended by healthcare professionals',
  },
}

export default function Hero() {
  const { lang } = useI18n()
  const tx = TITLES[lang] || TITLES.fr

  return (
    <section data-testid="hero-section" className="relative h-screen flex flex-col justify-between overflow-hidden">
      <div className="absolute inset-0">
        <video autoPlay muted loop playsInline preload="auto" className="w-full h-full object-cover">
          <source src="https://cdn.prod.website-files.com/679d8b01c23ed7847fc5108f/681a5d6a393040f8a64f2175_topaz_hero-transcode.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/30" />
      </div>

      <div className="relative z-10 max-w-[1780px] mx-auto px-6 md:px-12 w-full flex-1 flex flex-col justify-center pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-semibold tracking-[-0.02em] leading-[1.25] text-white mb-6 md:mb-7 max-w-3xl"
        >
          <span className="hidden md:block text-[clamp(1.4rem,3.2vw,2.8rem)]">{tx.line1}<br />{tx.line2}<br />{tx.line3}</span>
          <span className="md:hidden text-[22px]">{tx.mLine1}<br />{tx.mLine2}<br />{tx.mLine3}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-[14px] md:text-[15px] text-white/50 leading-[1.7] mb-9 max-w-2xl"
        >
          {tx.subtitle1} {tx.subtitle2} {tx.subtitle3}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          <a href="#products" data-testid="hero-cta-button"
            className="group relative inline-flex items-center gap-2 md:gap-3 px-6 md:px-9 py-3 md:py-4 rounded-full text-[13px] md:text-[15px] font-semibold text-white overflow-hidden transition-all duration-700 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] whitespace-nowrap">
            <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/25 rounded-full transition-all duration-700 group-hover:bg-white/[0.18] group-hover:border-white/35" />
            <span className="relative flex items-center gap-3">
              {tx.cta}
              <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-500 group-hover:translate-x-1" />
            </span>
          </a>
        </motion.div>
      </div>

      <div className="relative z-10 w-full pb-7 md:pb-9">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col md:flex-row md:items-center gap-4 md:gap-5 mb-6"
          >
            <div className="flex -space-x-2 md:-space-x-3">
              {AVATARS.map((av, i) => (
                <img key={i} src={av.src} alt={av.alt}
                  className="w-11 h-11 md:w-[72px] md:h-[72px] rounded-full object-cover border-2 md:border-[3px] border-white/30 shadow-xl" />
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={16} className="text-white fill-white" />
                ))}
              </div>
              <span className="text-white text-xs md:text-base font-semibold leading-tight">{tx.rec}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
