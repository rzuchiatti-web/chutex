import { useI18n } from '../../i18n/I18nContext'
import { Star } from 'lucide-react'

const REVIEWS = [
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/576e8a0cf553ad50467418871fc109df03f6f278e25edc64b1fe6bf9c135a742.png',
    fr: { name: 'Marguerite D.', role: 'Bénéficiaire, 78 ans', quote: "Le gilet Elder m'a redonné confiance pour sortir seule. Ma famille est rassurée et moi aussi." },
    en: { name: 'Marguerite D.', role: 'Beneficiary, 78 years', quote: 'The Elder vest gave me back the confidence to go out alone. My family is reassured and so am I.' },
  },
  {
    image: 'https://images.unsplash.com/photo-1707454710943-a359e4b5962e?w=600&h=900&fit=crop&crop=faces',
    fr: { name: 'Thomas K.', role: 'Sportif, 28 ans', quote: "Le bracelet Elio est devenu mon coach santé. Les données sont précises et l'app est incroyablement fluide." },
    en: { name: 'Thomas K.', role: 'Athlete, 28 years', quote: "The Elio bracelet became my health coach. The data is precise and the app is incredibly smooth." },
  },
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/198f847aa075d3d82d1b4eea3395ec089ab8c0dbe4e1937b14bf9a42c15c3aac.png',
    fr: { name: 'Sophie M.', role: 'Fille aidante, Lyon', quote: "Depuis que ma mère porte le gilet Elder, je suis beaucoup plus sereine. L'alerte automatique nous a déjà sauvé une fois." },
    en: { name: 'Sophie M.', role: 'Family caregiver, Lyon', quote: 'Since my mother started wearing the Elder vest, I feel so much more at ease. The automatic alert already saved us once.' },
  },
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/d1ab83b696366542c14713d16b55552c304a333847c3dc8f53d9dbbc5c2fbc38.png',
    fr: { name: 'Amina L.', role: 'Coach sportif, 35 ans', quote: "J'utilise le bracelet Elio avec mes clients. Les données de récupération et d'activité sont un vrai game-changer pour mes programmes." },
    en: { name: 'Amina L.', role: 'Sports coach, 35 years', quote: "I use the Elio bracelet with my clients. Recovery and activity data is a real game-changer for my programs." },
  },
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/ad0bd0c4e2efd7baa5b36335060ce7a6439b59de3af436eacb627c7e403b74fc.png',
    fr: { name: 'Jean-Pierre R.', role: 'Bénéficiaire, Bordeaux', quote: "Le bracelet Elio me permet de suivre ma santé au quotidien. Mon médecin anticipe les problèmes avant qu'ils ne surviennent." },
    en: { name: 'Jean-Pierre R.', role: 'Beneficiary, Bordeaux', quote: 'The Elio bracelet lets me monitor my health daily. My doctor can anticipate problems before they arise.' },
  },
  {
    image: 'https://images.unsplash.com/photo-1760551937527-2bc6cfe45180?w=600&h=900&fit=crop&crop=faces',
    fr: { name: 'Léa B.', role: 'Étudiante, 24 ans', quote: "J'ai offert la balance Vita à ma grand-mère. Les données sont simples à lire et son médecin adore le suivi connecté." },
    en: { name: 'Léa B.', role: 'Student, 24 years', quote: "I gifted the Vita scale to my grandmother. The data is easy to read and her doctor loves the connected monitoring." },
  },
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/ef73300a432aaa3569b121ea7e6cc67caac44d5c66f9e6df4f7b70e0bdf515c5.png',
    fr: { name: 'Dr. Claire B.', role: 'Kinésithérapeute, Paris', quote: "La téléassistance Chutex Care a considérablement amélioré le suivi de nos patients. Interface claire, alertes fiables." },
    en: { name: 'Dr. Claire B.', role: 'Physiotherapist, Paris', quote: 'Chutex Care teleassistance has significantly improved our patient follow-up. Clear interface, reliable alerts.' },
  },
  {
    image: 'https://images.unsplash.com/photo-1773682605866-94ab081beff5?w=600&h=900&fit=crop&crop=faces',
    fr: { name: 'Albert N.', role: 'Bénéficiaire, 75 ans', quote: "Le gilet Elder est si léger que je l'oublie. Et quand j'ai glissé sur le verglas, il m'a protégé instantanément." },
    en: { name: 'Albert N.', role: 'Beneficiary, 75 years', quote: "The Elder vest is so light I forget it. And when I slipped on ice, it protected me instantly." },
  },
  {
    image: 'https://images.unsplash.com/photo-1726140872265-17743d19078d?w=600&h=900&fit=crop&crop=faces',
    fr: { name: 'Lucas F.', role: 'Fils aidant, 32 ans', quote: "Grâce à la géolocalisation de l'app, je sais toujours où est mon père. La sérénité n'a pas de prix." },
    en: { name: 'Lucas F.', role: 'Family caregiver, 32 years', quote: "Thanks to the app's geolocation, I always know where my father is. Peace of mind is priceless." },
  },
  {
    image: 'https://images.unsplash.com/photo-1693434361986-6c169ce1eb41?w=600&h=900&fit=crop&crop=faces',
    fr: { name: 'Françoise T.', role: 'Bénéficiaire, 71 ans', quote: "La balance Vita m'aide à suivre mon hydratation et ma masse musculaire. Mon coach adapte mon programme chaque semaine." },
    en: { name: 'Françoise T.', role: 'Beneficiary, 71 years', quote: 'The Vita scale helps me track my hydration and muscle mass. My coach adapts my program every week.' },
  },
]

const PARTNER_LOGOS = [
  { name: 'Decathlon', url: '/partners/decathlon.png' },
  { name: 'RedCare', url: '/partners/redcare.png' },
  { name: 'Reha Team', url: '/partners/rehateam.png' },
  { name: 'Farmaline', url: '/partners/farmaline.png' },
  { name: 'Identités', url: '/partners/identites.png' },
]

function ReviewCard({ review, lang, mobile }) {
  const tx = review[lang] || review.fr
  const sizeClass = mobile
    ? 'w-[200px] h-[260px] rounded-xl'
    : 'w-[280px] md:w-[320px] h-[420px] md:h-[480px] rounded-2xl'
  return (
    <div className={`flex-shrink-0 ${sizeClass} overflow-hidden relative group`} data-testid="review-card">
      <img src={review.image} alt={tx.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      {/* Top: stars only */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} size={mobile ? 9 : 11} className="text-white fill-white" />
          ))}
        </div>
      </div>
      {/* Bottom gradient with text */}
      <div className={`absolute bottom-0 left-0 right-0 ${mobile ? 'p-3 pt-16' : 'p-5 pt-24'} bg-gradient-to-t from-black/80 via-black/50 to-transparent`}>
        <p className={`text-white/90 ${mobile ? 'text-[11px] leading-[1.5] mb-2 line-clamp-2' : 'text-[13px] leading-[1.6] mb-4 line-clamp-3'}`}>"{tx.quote}"</p>
        <div>
          <p className={`text-white font-semibold ${mobile ? 'text-xs' : 'text-sm'}`}>{tx.name}</p>
          <p className={`text-white/50 mt-0.5 ${mobile ? 'text-[10px]' : 'text-xs'}`}>{tx.role}</p>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ overline, title, subtitle }) {
  return (
    <div className="mb-12 md:mb-14 max-w-[1780px] mx-auto px-6 md:px-12">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 mb-5">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900/40" />
        <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
          {overline}
        </p>
      </div>
      <h2 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.025em] leading-tight font-semibold mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[15px] text-slate-400 leading-relaxed max-w-lg">
          {subtitle}
        </p>
      )}
      <div className="h-px w-full bg-slate-200 mt-8" />
    </div>
  )
}

export default function TrustSection() {
  const { lang } = useI18n()

  // Desktop: all reviews doubled for seamless loop
  const allDoubled = [...REVIEWS, ...REVIEWS, ...REVIEWS]
  // Mobile: split into 2 groups of 5, each tripled for seamless loop
  const row1Source = REVIEWS.slice(0, 5)
  const row2Source = REVIEWS.slice(5, 10)
  const mobileRow1 = [...row1Source, ...row1Source, ...row1Source, ...row1Source]
  const mobileRow2 = [...row2Source, ...row2Source, ...row2Source, ...row2Source]
  // Logos: lots of copies for seamless loop
  const logosRepeated = [...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS]

  return (
    <section data-testid="trust-section" className="py-20 md:py-28 overflow-hidden">
      {/* Reviews */}
      <div>
        <SectionTitle
          overline={lang === 'fr' ? 'Témoignages' : 'Testimonials'}
          title={lang === 'fr' ? 'La confiance de nos utilisateurs' : 'Trusted by our users'}
          subtitle={lang === 'fr' ? 'Des milliers de familles nous font confiance au quotidien.' : 'Thousands of families trust us every day.'}
        />
      </div>

      {/* Scrolling review cards — desktop: single row, mobile: two rows opposite */}
      <div className="relative overflow-hidden">
        {/* Desktop: single row */}
        <div className="hidden md:flex gap-5 animate-marquee-reviews pl-6">
          {allDoubled.map((review, i) => (
            <ReviewCard key={`d-${i}`} review={review} lang={lang} />
          ))}
        </div>
        {/* Mobile: two rows, opposite directions, 5 different each */}
        <div className="md:hidden space-y-3">
          <div className="flex gap-3 animate-marquee-reviews-mobile">
            {mobileRow1.map((review, i) => (
              <ReviewCard key={`m1-${i}`} review={review} lang={lang} mobile />
            ))}
          </div>
          <div className="flex gap-3 animate-marquee-reviews-mobile-reverse">
            {mobileRow2.map((review, i) => (
              <ReviewCard key={`m2-${i}`} review={review} lang={lang} mobile />
            ))}
          </div>
        </div>
      </div>

      {/* Partners */}
      <div className="mt-24 md:mt-32">
        <div>
          <div className="mb-12 md:mb-14 max-w-[1780px] mx-auto px-6 md:px-12 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900/40" />
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">
                {lang === 'fr' ? 'Partenaires' : 'Partners'}
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl text-slate-900 tracking-[-0.025em] leading-tight font-semibold mb-3">
              {lang === 'fr' ? 'Ils nous font confiance' : 'They trust us'}
            </h2>
            <p className="text-[15px] text-slate-400 leading-relaxed max-w-lg mx-auto">
              {lang === 'fr' ? 'Disponible chez les distributeurs santé et sport en Europe.' : 'Available at health and sports distributors across Europe.'}
            </p>
            <div className="h-px w-full bg-slate-200 mt-8" />
          </div>
        </div>

        {/* Logos marquee with fade edges */}
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <div className="flex items-center gap-6 md:gap-16 animate-marquee-logos">
              {logosRepeated.map((logo, i) => (
                <img
                  key={i}
                  src={logo.url}
                  alt={logo.name}
                  className="h-10 md:h-14 w-auto flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
