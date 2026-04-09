import { useI18n } from '../../i18n/I18nContext'
import { Star } from 'lucide-react'

const REVIEWS = [
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/576e8a0cf553ad50467418871fc109df03f6f278e25edc64b1fe6bf9c135a742.png',
    fr: { name: 'Marguerite D.', role: 'Bénéficiaire, 78 ans', quote: "Le gilet Elder m'a redonné confiance pour sortir seule. Ma famille est rassurée et moi aussi." },
    en: { name: 'Marguerite D.', role: 'Beneficiary, 78 years', quote: 'The Elder vest gave me back the confidence to go out alone. My family is reassured and so am I.' },
  },
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/198f847aa075d3d82d1b4eea3395ec089ab8c0dbe4e1937b14bf9a42c15c3aac.png',
    fr: { name: 'Sophie M.', role: 'Fille aidante, Lyon', quote: "Depuis que ma mère porte le gilet Elder, je suis beaucoup plus sereine. L'alerte automatique nous a déjà sauvé une fois." },
    en: { name: 'Sophie M.', role: 'Family caregiver, Lyon', quote: 'Since my mother started wearing the Elder vest, I feel so much more at ease. The automatic alert already saved us once.' },
  },
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/ad0bd0c4e2efd7baa5b36335060ce7a6439b59de3af436eacb627c7e403b74fc.png',
    fr: { name: 'Jean-Pierre R.', role: 'Bénéficiaire, Bordeaux', quote: "Le bracelet Elio me permet de suivre ma santé au quotidien. Mon médecin anticipe les problèmes avant qu'ils ne surviennent." },
    en: { name: 'Jean-Pierre R.', role: 'Beneficiary, Bordeaux', quote: 'The Elio bracelet lets me monitor my health daily. My doctor can anticipate problems before they arise.' },
  },
  {
    image: 'https://static.prod-images.emergentagent.com/jobs/5a7370fb-c4f0-4234-85a0-267160576166/images/ef73300a432aaa3569b121ea7e6cc67caac44d5c66f9e6df4f7b70e0bdf515c5.png',
    fr: { name: 'Dr. Claire B.', role: 'Kinésithérapeute, Paris', quote: "La téléassistance Chutex Care a considérablement amélioré le suivi de nos patients. Interface claire, alertes fiables." },
    en: { name: 'Dr. Claire B.', role: 'Physiotherapist, Paris', quote: 'Chutex Care teleassistance has significantly improved our patient follow-up. Clear interface, reliable alerts.' },
  },
  {
    image: 'https://images.unsplash.com/photo-1693434361986-6c169ce1eb41?w=600&h=900&fit=crop&crop=faces',
    fr: { name: 'Hélène V.', role: 'Bénéficiaire, 72 ans', quote: "La balance Vita m'aide à suivre mon poids et mon hydratation. Les données sont claires et mon coach adapte mon programme." },
    en: { name: 'Hélène V.', role: 'Beneficiary, 72 years', quote: 'The Vita scale helps me track my weight and hydration. The data is clear and my coach adapts my program.' },
  },
  {
    image: 'https://images.unsplash.com/photo-1760722531515-a2b2d5013879?w=600&h=900&fit=crop&crop=faces',
    fr: { name: 'Pierre & Marie L.', role: 'Couple bénéficiaire, Nice', quote: "Nous utilisons les produits Chutex depuis 6 mois. La sérénité que ça apporte à nos enfants n'a pas de prix." },
    en: { name: 'Pierre & Marie L.', role: 'Beneficiary couple, Nice', quote: "We've been using Chutex products for 6 months. The peace of mind it brings our children is priceless." },
  },
]

const PARTNER_LOGOS = [
  { name: 'Decathlon', url: '/partners/decathlon.png' },
  { name: 'RedCare', url: '/partners/redcare.png' },
  { name: 'Reha Team', url: '/partners/rehateam.png' },
  { name: 'Farmaline', url: '/partners/farmaline.png' },
  { name: 'Identités', url: '/partners/identites.png' },
]

function ReviewCard({ review, lang }) {
  const tx = review[lang] || review.fr
  return (
    <div className="flex-shrink-0 w-[280px] md:w-[320px] h-[420px] md:h-[480px] rounded-2xl overflow-hidden relative group" data-testid="review-card">
      <img src={review.image} alt={tx.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      {/* Top glass bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={12} className="text-white fill-white" />
            ))}
          </div>
          <span className="text-[10px] font-medium text-white/70 tracking-wider uppercase bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full">
            Avis vérifié
          </span>
        </div>
      </div>
      {/* Bottom gradient with text */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-20">
        <p className="text-white/90 text-[13px] leading-[1.6] mb-4 line-clamp-3">"{tx.quote}"</p>
        <div>
          <p className="text-white text-sm font-semibold">{tx.name}</p>
          <p className="text-white/50 text-xs mt-0.5">{tx.role}</p>
        </div>
      </div>
    </div>
  )
}

export default function TrustSection() {
  const { lang } = useI18n()
  const titleFr = 'La confiance de nos utilisateurs'
  const titleEn = 'Trusted by our users'
  const partnerTitleFr = 'Ils nous font confiance'
  const partnerTitleEn = 'They trust us'

  const doubled = [...REVIEWS, ...REVIEWS]
  const doubledLogos = [...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS]

  return (
    <section data-testid="trust-section" className="py-20 md:py-28 overflow-hidden">
      {/* Reviews title */}
      <div className="max-w-[1780px] mx-auto px-6 md:px-12 mb-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">
          {lang === 'fr' ? 'Témoignages' : 'Testimonials'}
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
          {lang === 'fr' ? titleFr : titleEn}
        </h2>
      </div>

      {/* Scrolling review cards — marquee */}
      <div className="relative">
        <div className="flex gap-5 animate-marquee-reviews">
          {doubled.map((review, i) => (
            <ReviewCard key={i} review={review} lang={lang} />
          ))}
        </div>
      </div>

      {/* Partner logos */}
      <div className="mt-20 md:mt-28">
        <div className="max-w-[1780px] mx-auto px-6 md:px-12 mb-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">
            {lang === 'fr' ? 'Partenaires' : 'Partners'}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            {lang === 'fr' ? partnerTitleFr : partnerTitleEn}
          </h2>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex items-center gap-16 md:gap-24 animate-marquee-logos">
            {doubledLogos.map((logo, i) => (
              <img
                key={i}
                src={logo.url}
                alt={logo.name}
                className="h-8 md:h-10 w-auto opacity-40 hover:opacity-70 transition-opacity duration-300 flex-shrink-0 grayscale"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
