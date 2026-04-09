import { useI18n } from '../../i18n/I18nContext'

const STORE_LOGOS = [
  { name: 'Decathlon', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Decathlon.jpg?height=80&v=1751359745' },
  { name: 'RedCare Pharmacie', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_RedCare_Pharmacie.jpg?height=80&v=1751359800' },
  { name: 'Quirumed', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Quirumed.jpg?height=80&v=1751359862' },
  { name: 'Castorama', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Castorama.jpg?height=80&v=1751360090' },
  { name: 'Stadium', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_Stadium.jpg?height=80&v=1751360141' },
  { name: 'MediaMarkt', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_MediaMarkt.jpg?height=80&v=1751360224' },
  { name: 'Reha Team', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_reha_team_ortho_team_chutex.jpg?height=80&v=1760549239' },
  { name: 'Hobbybox', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_hobbybox.jpg?height=80&v=1751360581' },
  { name: 'Farmaline', url: 'https://chutex-innovation.com/cdn/shop/files/Logo_farmaline_chutex.jpg?height=80&v=1760549361' },
]

export default function StoreLogos() {
  const { t } = useI18n()

  return (
    <section data-testid="store-logos-section" className="py-12 md:py-16 border-y border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 text-center mb-8">
          {t('logos.title')}
        </p>
        <div className="overflow-hidden relative">
          <div className="flex animate-marquee items-center gap-12 md:gap-16">
            {[...STORE_LOGOS, ...STORE_LOGOS].map((logo, i) => (
              <div key={`${logo.name}-${i}`} className="flex-shrink-0">
                <img
                  src={logo.url}
                  alt={logo.name}
                  className="h-8 md:h-10 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'block'
                  }}
                />
                <span className="hidden font-heading font-black text-lg tracking-widest text-gray-300">{logo.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
