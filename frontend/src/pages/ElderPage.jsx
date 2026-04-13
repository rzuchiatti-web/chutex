import { useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
import { useCart } from '../cart/CartContext'
import {
  Shield, Zap, Clock, Award, ChevronDown, ArrowRight,
  Battery, Cpu, Radio, Heart, MapPin, Bell,
  ShieldCheck, Activity, AlertTriangle, Check, Plus, Minus, ShoppingCart
} from 'lucide-react'
import { useState } from 'react'

const PRODUCT_IMG = 'https://chutex-innovation.com/cdn/shop/files/chutex-elder-airbag-vest-made-in-france-front-side.png?v=1752931654&width=1200'
const LIFESTYLE_IMG = 'https://images.unsplash.com/photo-1765939935738-77eabcc3c198?w=1920&h=1080&fit=crop&q=80'
const COUPLE_IMG = 'https://images.unsplash.com/photo-1771924367854-72dfb9b72aef?w=1200&h=800&fit=crop&q=80'

const CONTENT = {
  fr: {
    hero: {
      badge: 'Made in France',
      title: 'Elder',
      subtitle: 'Vous tombez.\nIl vous protege.',
      desc: "Le premier gilet airbag intelligent qui detecte les chutes et protege instantanement le dos, la tete, le bassin et les hanches.",
      cta: 'Commander maintenant',
      price: '879',
      unit: 'EUR TTC',
      scroll: 'Decouvrir la technologie',
    },
    stats: [
      { value: '0.08', suffix: 's', label: 'Deploiement airbag', icon: Zap },
      { value: '36', suffix: 'h', label: 'Autonomie batterie', icon: Battery },
      { value: '8', suffix: 'x', label: 'Plus rapide que le reflexe', icon: Clock },
      { value: 'CE', suffix: '', label: 'Certifie dispositif medical', icon: Award },
    ],
    howItWorks: {
      overline: 'Comment ca marche',
      title: 'Protection en\ntrois temps.',
      steps: [
        {
          num: '01',
          title: 'Detection',
          desc: "Les capteurs inertiels analysent 1000 donnees par seconde. L'intelligence artificielle identifie une chute en quelques millisecondes.",
          icon: Cpu,
        },
        {
          num: '02',
          title: 'Deploiement',
          desc: "En 0.08 seconde, les cellules airbag se gonflent simultanement pour proteger les zones vitales : dos, tete, bassin, hanches.",
          icon: Shield,
        },
        {
          num: '03',
          title: 'Alerte',
          desc: "L'alerte est transmise instantanement a vos gardiens et au centre de teleassistance Chutex Care. Les secours sont coordonnes.",
          icon: Bell,
        },
      ],
    },
    protection: {
      overline: 'Zones protegees',
      title: 'Protection\n360 degres.',
      desc: "Quatre zones vitales protegees simultanement par des cellules airbag haute densite.",
      zones: [
        { label: 'Tete & Nuque', desc: 'Coussin cervical integre, reduction d\'impact de 90%', icon: ShieldCheck },
        { label: 'Dos & Colonne', desc: 'Protection vertebrale complete du coccyx aux cervicales', icon: Shield },
        { label: 'Bassin', desc: 'Amortissement de la zone la plus vulnerable aux fractures', icon: Heart },
        { label: 'Hanches', desc: 'Coussins lateraux pour les chutes sur le cote', icon: Activity },
      ],
    },
    tech: {
      overline: 'Technologie',
      title: 'Ingenierie\nfrancaise.',
      specs: [
        { label: 'Capteurs', value: '6 axes', desc: 'Accelerometre + gyroscope' },
        { label: 'Processeur', value: 'IA embarquee', desc: 'Algorithme de detection proprietaire' },
        { label: 'Airbags', value: '4 cellules', desc: 'Haute densite, reutilisables' },
        { label: 'Batterie', value: '36h', desc: 'Li-Po rechargeable USB-C' },
        { label: 'Poids', value: '680g', desc: 'Ultra-leger, port confortable' },
        { label: 'Connectivite', value: 'BLE 5.0', desc: 'App Chutex compatible' },
      ],
    },
    lifestyle: {
      overline: 'Liberte',
      title: 'Retrouvez votre\nliberte de mouvement.',
      desc: "Le gilet Elder est si leger et discret que vous l'oubliez. Mais en cas de chute, il est toujours la.",
      cta: 'En savoir plus',
    },
    testimonials: {
      overline: 'Temoignages',
      title: 'Ils font confiance\na Elder.',
      items: [
        {
          quote: "Le gilet Elder m'a redonne confiance pour sortir seule. Ma famille est rassuree et moi aussi.",
          name: 'Marguerite D.',
          role: 'Beneficiaire, 78 ans',
          image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/576e8a0cf553ad50467418871fc109df03f6f278e25edc64b1fe6bf9c135a742.png',
        },
        {
          quote: "Depuis que ma mere porte le gilet Elder, je suis beaucoup plus sereine. L'alerte automatique nous a deja sauve une fois.",
          name: 'Sophie M.',
          role: 'Fille aidante, Lyon',
          image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/198f847aa075d3d82d1b4eea3395ec089ab8c0dbe4e1937b14bf9a42c15c3aac.png',
        },
        {
          quote: "Le gilet Elder est si leger que je l'oublie. Et quand j'ai glisse sur le verglas, il m'a protege instantanement.",
          name: 'Albert N.',
          role: 'Beneficiaire, 75 ans',
          image: 'https://images.unsplash.com/photo-1773682605866-94ab081beff5?w=200&h=200&fit=crop&crop=faces&q=80',
        },
      ],
    },
    pricing: {
      overline: 'Commander',
      title: 'Choisissez votre\nformule Elder.',
      options: [
        {
          name: 'Elder',
          desc: 'Gilet airbag seul',
          price: '879',
          unit: 'EUR TTC',
          period: '',
          features: ['Gilet airbag Elder', '4 cellules airbag', 'Chargeur USB-C', 'App Chutex incluse', 'Garantie 2 ans'],
          cta: 'Ajouter au panier',
          highlighted: false,
        },
        {
          name: 'Elder + Teleassistance',
          desc: 'Protection complete 24/7',
          price: '879',
          unit: 'EUR + 29.9EUR/mois',
          period: '',
          features: ['Tout le pack Elder', 'Teleassistance 24/7', 'Geolocalisation temps reel', 'Coordination secours', 'Support prioritaire'],
          cta: 'Souscrire',
          highlighted: true,
          badge: 'Recommande',
        },
      ],
    },
    faq: {
      overline: 'FAQ',
      title: 'Questions\nfrequentes.',
      items: [
        { q: 'Le gilet est-il lavable ?', a: 'Oui, les cellules airbag sont amovibles. La housse textile est lavable en machine a 30 degres.' },
        { q: 'Combien de temps dure la batterie ?', a: 'Jusqu\'a 36 heures en utilisation continue. Le chargement complet prend environ 2 heures via USB-C.' },
        { q: 'L\'airbag est-il reutilisable apres un declenchement ?', a: 'Oui, les cellules airbag sont rechargeables. Apres un declenchement, vous pouvez les regonfler avec la pompe fournie ou les remplacer.' },
        { q: 'Le gilet est-il discret sous les vetements ?', a: 'Oui, le gilet Elder est concu pour etre porte sous une veste ou un manteau. Son design slim (680g) le rend quasiment invisible.' },
        { q: 'Faut-il un abonnement pour utiliser le gilet ?', a: 'Non, le gilet fonctionne de maniere autonome. L\'abonnement teleassistance est optionnel pour beneficier du centre d\'appel 24/7.' },
        { q: 'Est-il compatible avec l\'application Chutex ?', a: 'Oui, le gilet se connecte en Bluetooth a l\'application Chutex (iOS & Android) pour le suivi des donnees et les alertes.' },
      ],
    },
  },
  en: {
    hero: {
      badge: 'Made in France',
      title: 'Elder',
      subtitle: 'You fall.\nIt protects you.',
      desc: "The first smart airbag vest that detects falls and instantly protects the back, head, pelvis and hips.",
      cta: 'Order now',
      price: '879',
      unit: 'EUR incl. tax',
      scroll: 'Discover the technology',
    },
    stats: [
      { value: '0.08', suffix: 's', label: 'Airbag deployment', icon: Zap },
      { value: '36', suffix: 'h', label: 'Battery life', icon: Battery },
      { value: '8', suffix: 'x', label: 'Faster than reflex', icon: Clock },
      { value: 'CE', suffix: '', label: 'Certified medical device', icon: Award },
    ],
    howItWorks: {
      overline: 'How it works',
      title: 'Protection in\nthree steps.',
      steps: [
        {
          num: '01',
          title: 'Detection',
          desc: "Inertial sensors analyze 1,000 data points per second. AI identifies a fall within milliseconds.",
          icon: Cpu,
        },
        {
          num: '02',
          title: 'Deployment',
          desc: "In 0.08 seconds, airbag cells inflate simultaneously to protect vital zones: back, head, pelvis, hips.",
          icon: Shield,
        },
        {
          num: '03',
          title: 'Alert',
          desc: "The alert is instantly transmitted to your guardians and the Chutex Care teleassistance center. Emergency services are coordinated.",
          icon: Bell,
        },
      ],
    },
    protection: {
      overline: 'Protected zones',
      title: 'Full 360\nprotection.',
      desc: "Four vital zones simultaneously protected by high-density airbag cells.",
      zones: [
        { label: 'Head & Neck', desc: 'Integrated cervical cushion, 90% impact reduction', icon: ShieldCheck },
        { label: 'Back & Spine', desc: 'Complete vertebral protection from coccyx to cervicals', icon: Shield },
        { label: 'Pelvis', desc: 'Cushioning the most fracture-vulnerable zone', icon: Heart },
        { label: 'Hips', desc: 'Lateral cushions for side falls', icon: Activity },
      ],
    },
    tech: {
      overline: 'Technology',
      title: 'French\nengineering.',
      specs: [
        { label: 'Sensors', value: '6-axis', desc: 'Accelerometer + gyroscope' },
        { label: 'Processor', value: 'Embedded AI', desc: 'Proprietary detection algorithm' },
        { label: 'Airbags', value: '4 cells', desc: 'High-density, reusable' },
        { label: 'Battery', value: '36h', desc: 'Li-Po rechargeable USB-C' },
        { label: 'Weight', value: '680g', desc: 'Ultra-light, comfortable wear' },
        { label: 'Connectivity', value: 'BLE 5.0', desc: 'Chutex App compatible' },
      ],
    },
    lifestyle: {
      overline: 'Freedom',
      title: 'Regain your\nfreedom of movement.',
      desc: "The Elder vest is so light and discreet you forget it. But in case of a fall, it's always there.",
      cta: 'Learn more',
    },
    testimonials: {
      overline: 'Testimonials',
      title: 'They trust\nElder.',
      items: [
        {
          quote: "The Elder vest gave me back the confidence to go out alone. My family is reassured and so am I.",
          name: 'Marguerite D.',
          role: 'Beneficiary, 78 years',
          image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/576e8a0cf553ad50467418871fc109df03f6f278e25edc64b1fe6bf9c135a742.png',
        },
        {
          quote: "Since my mother started wearing the Elder vest, I feel so much more at ease. The automatic fall alert already saved us once.",
          name: 'Sophie M.',
          role: 'Family caregiver, Lyon',
          image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/198f847aa075d3d82d1b4eea3395ec089ab8c0dbe4e1937b14bf9a42c15c3aac.png',
        },
        {
          quote: "The Elder vest is so light I forget it. And when I slipped on ice, it protected me instantly.",
          name: 'Albert N.',
          role: 'Beneficiary, 75 years',
          image: 'https://images.unsplash.com/photo-1773682605866-94ab081beff5?w=200&h=200&fit=crop&crop=faces&q=80',
        },
      ],
    },
    pricing: {
      overline: 'Order',
      title: 'Choose your\nElder plan.',
      options: [
        {
          name: 'Elder',
          desc: 'Airbag vest only',
          price: '879',
          unit: 'EUR incl. tax',
          period: '',
          features: ['Elder airbag vest', '4 airbag cells', 'USB-C charger', 'Chutex App included', '2-year warranty'],
          cta: 'Add to cart',
          highlighted: false,
        },
        {
          name: 'Elder + Teleassistance',
          desc: 'Complete 24/7 protection',
          price: '879',
          unit: 'EUR + 29.9EUR/mo',
          period: '',
          features: ['Full Elder pack', '24/7 teleassistance', 'Real-time geolocation', 'Emergency coordination', 'Priority support'],
          cta: 'Subscribe',
          highlighted: true,
          badge: 'Recommended',
        },
      ],
    },
    faq: {
      overline: 'FAQ',
      title: 'Frequently\nasked questions.',
      items: [
        { q: 'Is the vest washable?', a: 'Yes, the airbag cells are removable. The textile cover is machine-washable at 30 degrees.' },
        { q: 'How long does the battery last?', a: 'Up to 36 hours of continuous use. Full charging takes about 2 hours via USB-C.' },
        { q: 'Is the airbag reusable after deployment?', a: 'Yes, airbag cells are rechargeable. After deployment, you can reinflate them with the provided pump or replace them.' },
        { q: 'Is the vest discreet under clothing?', a: 'Yes, the Elder vest is designed to be worn under a jacket or coat. Its slim design (680g) makes it nearly invisible.' },
        { q: 'Is a subscription required?', a: 'No, the vest works autonomously. The teleassistance subscription is optional for 24/7 call center access.' },
        { q: 'Is it compatible with the Chutex app?', a: 'Yes, the vest connects via Bluetooth to the Chutex app (iOS & Android) for data tracking and alerts.' },
      ],
    },
  },
}

function AnimatedCounter({ value, suffix }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [display, setDisplay] = useState(value)

  const isNumeric = !isNaN(parseFloat(value))

  if (isNumeric && inView && display === value) {
    // trigger count
  }

  return (
    <span ref={ref} className="tabular-nums">
      {inView ? value : '0'}{suffix}
    </span>
  )
}

function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      data-testid={`elder-faq-${index}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 md:py-6 text-left group"
        data-testid={`elder-faq-toggle-${index}`}
      >
        <span className="text-[15px] md:text-base font-semibold text-slate-900 pr-8 group-hover:text-emerald-700 transition-colors duration-300">{q}</span>
        <div className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${open ? 'bg-slate-900 border-slate-900' : 'group-hover:border-slate-400'}`}>
          {open ? <Minus size={14} className="text-white" strokeWidth={2} /> : <Plus size={14} className="text-slate-400" strokeWidth={2} />}
        </div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="text-[14px] text-slate-400 leading-[1.8] pb-5 md:pb-6 max-w-2xl">{a}</p>
      </motion.div>
      <div className="h-px bg-slate-200" />
    </motion.div>
  )
}

export default function ElderPage() {
  const { lang } = useI18n()
  const { addItem } = useCart()
  const tx = CONTENT[lang] || CONTENT.fr
  const heroRef = useRef(null)
  const lifestyleRef = useRef(null)
  const [selectedSize, setSelectedSize] = useState('M')
  const [addedFeedback, setAddedFeedback] = useState(null)

  const sizes = ['S', 'M', 'L', 'XL']

  const handleAddToCart = (productId, name, price, subscriptionPrice) => {
    const variantId = `${productId}-${selectedSize.toLowerCase()}`
    const variantLabel = lang === 'fr' ? `Taille ${selectedSize}` : `Size ${selectedSize}`
    addItem({
      id: productId,
      name,
      price,
      subscription_price: subscriptionPrice || 0,
      variant_id: variantId,
      variant_label: variantLabel,
      image: PRODUCT_IMG,
    })
    setAddedFeedback(productId)
    setTimeout(() => setAddedFeedback(null), 2000)
  }

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const { scrollYProgress: lifestyleProgress } = useScroll({
    target: lifestyleRef,
    offset: ['start end', 'end start'],
  })

  const heroImgY = useTransform(heroProgress, [0, 1], ['0%', '15%'])
  const heroImgScale = useTransform(heroProgress, [0, 0.5], [1, 1.08])
  const lifestyleBgY = useTransform(lifestyleProgress, [0, 1], ['-5%', '10%'])

  return (
    <div data-testid="elder-page">

      {/* ─── HERO ─── */}
      <section ref={heroRef} data-testid="elder-hero" className="relative min-h-screen bg-slate-950 overflow-hidden flex items-center">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/8 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-[1780px] mx-auto px-6 md:px-12 py-32 md:py-40 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

            {/* Left content */}
            <div className="lg:w-[50%]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
              >
                <Award size={12} className="text-emerald-400" strokeWidth={2} />
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-medium">{tx.hero.badge}</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-[5rem] md:text-[7rem] lg:text-[9rem] font-semibold text-white tracking-[-0.06em] leading-[0.82] mb-6"
                data-testid="elder-hero-title"
              >
                {tx.hero.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="text-xl md:text-2xl lg:text-3xl text-white/40 leading-[1.3] whitespace-pre-line mb-6 md:mb-8 font-light"
              >
                {tx.hero.subtitle}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65 }}
                className="text-[15px] text-white/30 leading-[1.8] max-w-lg mb-10 md:mb-12"
              >
                {tx.hero.desc}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-5"
              >
                <a
                  href="#elder-pricing"
                  data-testid="elder-hero-cta"
                  className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-slate-900 text-[14px] font-semibold hover:bg-white/90 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                >
                  {tx.hero.cta}
                  <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl md:text-4xl font-semibold text-white tracking-tight">{tx.hero.price}</span>
                  <span className="text-[13px] text-white/30">{tx.hero.unit}</span>
                </div>
              </motion.div>
            </div>

            {/* Right product image */}
            <motion.div
              className="lg:w-[50%] flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ y: heroImgY, scale: heroImgScale }}
            >
              <div className="relative">
                <img
                  src={PRODUCT_IMG}
                  alt="Chutex Elder Airbag Vest"
                  className="w-[320px] md:w-[420px] lg:w-[500px] h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                  data-testid="elder-hero-image"
                />
                {/* Decorative ring */}
                <div className="absolute -inset-10 border border-white/[0.04] rounded-full pointer-events-none" />
                <div className="absolute -inset-20 border border-white/[0.02] rounded-full pointer-events-none" />
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          >
            <span className="text-[11px] text-white/20 tracking-widest uppercase">{tx.hero.scroll}</span>
            <ChevronDown size={16} className="text-white/20 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section data-testid="elder-stats" className="relative -mt-1 bg-slate-950">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {tx.stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  data-testid={`elder-stat-${i}`}
                  className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 md:p-7 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-400"
                >
                  <Icon size={16} className="text-emerald-400/60 mb-4" strokeWidth={1.5} />
                  <div className="flex items-baseline gap-0.5 mb-1.5">
                    <span className="text-3xl md:text-4xl font-semibold text-white tracking-tight">{stat.value}</span>
                    <span className="text-lg md:text-xl font-medium text-emerald-400/80">{stat.suffix}</span>
                  </div>
                  <span className="text-[12px] text-white/30">{stat.label}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section data-testid="elder-how-it-works" className="py-28 md:py-40 bg-white">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
            {/* Left header */}
            <div className="lg:w-[40%] lg:sticky lg:top-32 lg:self-start">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-10 h-px bg-slate-900" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">{tx.howItWorks.overline}</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-slate-900 whitespace-pre-line"
              >
                {tx.howItWorks.title}
              </motion.h2>
            </div>

            {/* Right steps */}
            <div className="lg:w-[60%] space-y-0">
              {tx.howItWorks.steps.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    data-testid={`elder-step-${i}`}
                    className="group border-b border-slate-200 last:border-0"
                  >
                    <div className="py-10 md:py-14 flex gap-6 md:gap-8">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-200/60 transition-all duration-500">
                          <Icon size={22} className="text-slate-400 group-hover:text-emerald-600 transition-colors duration-500" strokeWidth={1.5} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[11px] font-semibold text-emerald-600/60 tracking-wider">{step.num}</span>
                          <h3 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">{step.title}</h3>
                        </div>
                        <p className="text-[14px] md:text-[15px] text-slate-400 leading-[1.8] max-w-lg">{step.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROTECTION ZONES ─── */}
      <section data-testid="elder-protection" className="py-28 md:py-40 bg-[#f7f7f7]">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-20">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="w-10 h-px bg-slate-900" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">{tx.protection.overline}</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-slate-900 whitespace-pre-line"
              >
                {tx.protection.title}
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[15px] text-slate-400 max-w-md leading-relaxed md:text-right"
            >
              {tx.protection.desc}
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Product image center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:w-[40%] flex justify-center"
            >
              <div className="relative">
                <img src={PRODUCT_IMG} alt="Elder Protection Zones"
                  className="w-[280px] md:w-[350px] h-auto object-contain" />
                {/* Subtle pulse rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[300px] h-[300px] md:w-[380px] md:h-[380px] border border-emerald-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            </motion.div>

            {/* Protection zone cards */}
            <div className="lg:w-[60%] grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tx.protection.zones.map((zone, i) => {
                const Icon = zone.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    data-testid={`elder-zone-${i}`}
                    className="group bg-white border border-slate-200/60 rounded-2xl p-6 md:p-7 hover:shadow-[0_12px_50px_-15px_rgba(0,0,0,0.08)] hover:border-slate-300/80 transition-all duration-500"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/15 transition-colors duration-300">
                      <Icon size={18} className="text-emerald-600" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-[15px] font-semibold text-slate-900 mb-2 tracking-tight">{zone.label}</h4>
                    <p className="text-[13px] text-slate-400 leading-relaxed">{zone.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TECHNOLOGY / SPECS ─── */}
      <section data-testid="elder-tech" className="py-28 md:py-40 bg-slate-950 overflow-hidden">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12">
          {/* Header */}
          <div className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-px bg-white/30" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-medium">{tx.tech.overline}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-white whitespace-pre-line"
            >
              {tx.tech.title}
            </motion.h2>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {tx.tech.specs.map((spec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                data-testid={`elder-spec-${i}`}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 md:p-7 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-400"
              >
                <span className="text-[11px] uppercase tracking-[0.15em] text-white/25 font-medium mb-3 block">{spec.label}</span>
                <span className="text-xl md:text-2xl font-semibold text-white tracking-tight block mb-1.5">{spec.value}</span>
                <span className="text-[12px] text-white/30 leading-relaxed">{spec.desc}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIFESTYLE ─── */}
      <section ref={lifestyleRef} data-testid="elder-lifestyle" className="relative min-h-[80vh] overflow-hidden flex items-center">
        <motion.div className="absolute inset-0" style={{ y: lifestyleBgY }}>
          <img src={LIFESTYLE_IMG} alt="Elder lifestyle"
            className="w-full h-[120%] object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-transparent" />
        <div className="relative z-10 max-w-[1780px] mx-auto px-6 md:px-12 py-28 md:py-40">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-10 h-px bg-white/30" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-medium">{tx.lifestyle.overline}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-white whitespace-pre-line mb-6 md:mb-8"
            >
              {tx.lifestyle.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-base md:text-[17px] text-white/40 leading-[1.8] mb-10"
            >
              {tx.lifestyle.desc}
            </motion.p>
            <motion.a
              href="#elder-pricing"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              data-testid="elder-lifestyle-cta"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-slate-900 text-[14px] font-semibold hover:bg-white/90 transition-all duration-300"
            >
              {tx.lifestyle.cta}
              <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
            </motion.a>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section data-testid="elder-testimonials" className="py-28 md:py-40 bg-white">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12">
          <div className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-px bg-slate-900" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">{tx.testimonials.overline}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-slate-900 whitespace-pre-line"
            >
              {tx.testimonials.title}
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {tx.testimonials.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                data-testid={`elder-testimonial-${i}`}
                className="group bg-slate-50/70 border border-slate-200/50 rounded-2xl p-7 md:p-8 hover:bg-white hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-500"
              >
                <div className="flex gap-0.5 mb-5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <p className="text-[14px] text-slate-600 leading-[1.8] mb-6 italic">"{item.quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name}
                    className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="elder-pricing" data-testid="elder-pricing" className="py-28 md:py-40 bg-[#f7f7f7]">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-px bg-slate-900" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">{tx.pricing.overline}</span>
              <div className="w-10 h-px bg-slate-900" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-slate-900 whitespace-pre-line"
            >
              {tx.pricing.title}
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {tx.pricing.options.map((option, i) => {
              const productId = i === 0 ? 'elder-vest' : 'elder-teleassistance'
              const price = 879
              const subPrice = i === 1 ? 29.9 : 0
              const isAdded = addedFeedback === productId
              return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                data-testid={`elder-pricing-${i}`}
                className={`relative rounded-3xl p-7 md:p-9 transition-all duration-500 ${
                  option.highlighted
                    ? 'bg-slate-950 text-white border-2 border-slate-800'
                    : 'bg-white border border-slate-200/60 hover:shadow-[0_12px_50px_-15px_rgba(0,0,0,0.08)]'
                }`}
              >
                {option.badge && (
                  <span className="absolute -top-3 left-8 px-4 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold tracking-wider uppercase">
                    {option.badge}
                  </span>
                )}
                <h3 className={`text-xl md:text-2xl font-semibold tracking-tight mb-1.5 ${option.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {option.name}
                </h3>
                <p className={`text-[13px] mb-6 ${option.highlighted ? 'text-white/40' : 'text-slate-400'}`}>{option.desc}</p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className={`text-4xl md:text-5xl font-semibold tracking-tight ${option.highlighted ? 'text-white' : 'text-slate-900'}`}>{option.price}</span>
                  <span className={`text-[13px] ${option.highlighted ? 'text-white/40' : 'text-slate-400'}`}>{option.unit}</span>
                </div>

                {/* Size selector */}
                <div className="mb-6">
                  <span className={`text-[11px] uppercase tracking-[0.15em] font-medium mb-2 block ${option.highlighted ? 'text-white/30' : 'text-slate-400'}`}>
                    {lang === 'fr' ? 'Taille' : 'Size'}
                  </span>
                  <div className="flex gap-2">
                    {sizes.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        data-testid={`elder-size-${s.toLowerCase()}-${i}`}
                        className={`w-10 h-10 rounded-xl text-[13px] font-semibold transition-all duration-300 ${
                          selectedSize === s
                            ? option.highlighted
                              ? 'bg-white text-slate-900'
                              : 'bg-slate-900 text-white'
                            : option.highlighted
                              ? 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/15'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`h-px mb-6 ${option.highlighted ? 'bg-white/10' : 'bg-slate-200'}`} />

                <ul className="space-y-3 mb-8">
                  {option.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <Check size={14} className={option.highlighted ? 'text-emerald-400' : 'text-emerald-600'} strokeWidth={2} />
                      <span className={`text-[13px] ${option.highlighted ? 'text-white/60' : 'text-slate-500'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  data-testid={`elder-pricing-cta-${i}`}
                  onClick={() => handleAddToCart(productId, option.name, price, subPrice)}
                  className={`w-full py-4 rounded-full text-[14px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    isAdded
                      ? 'bg-emerald-500 text-white'
                      : option.highlighted
                        ? 'bg-white text-slate-900 hover:bg-white/90'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isAdded ? (
                    <><Check size={16} strokeWidth={2} />{lang === 'fr' ? 'Ajouté !' : 'Added!'}</>
                  ) : (
                    <><ShoppingCart size={16} strokeWidth={1.5} />{option.cta}</>
                  )}
                </button>
              </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section data-testid="elder-faq" className="py-28 md:py-40 bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <div className="mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-10 h-px bg-slate-900" />
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400 font-medium">{tx.faq.overline}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] text-slate-900 whitespace-pre-line"
            >
              {tx.faq.title}
            </motion.h2>
          </div>

          <div>
            <div className="h-px bg-slate-200" />
            {tx.faq.items.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section data-testid="elder-final-cta" className="py-20 md:py-28 bg-[#f7f7f7]">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <img src={PRODUCT_IMG} alt="Elder" className="w-32 md:w-40 h-auto mx-auto mb-8 object-contain" />
            <h2 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-slate-900 mb-4">
              {lang === 'fr' ? 'Pret a vous proteger ?' : 'Ready to protect yourself?'}
            </h2>
            <p className="text-[15px] text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              {lang === 'fr'
                ? "Rejoignez les milliers de familles qui font confiance a Elder pour leur securite."
                : "Join thousands of families who trust Elder for their safety."}
            </p>
            <a
              href="#elder-pricing"
              data-testid="elder-final-cta-btn"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-all duration-300"
            >
              {tx.hero.cta}
              <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
