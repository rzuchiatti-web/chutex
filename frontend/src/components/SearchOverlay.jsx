import { useState, useEffect, useRef } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../i18n/I18nContext'
const SEARCH_DATA = {
  fr: [
    { type: 'Produit', title: 'Bracelet Elio', desc: 'Bracelet connecté santé — suivi cardiaque, sommeil, activité', href: '#products', keywords: 'bracelet elio montre santé connecté cardiaque sommeil' },
    { type: 'Produit', title: 'Gilet Elder', desc: 'Gilet airbag anti-chute — déclenchement en 0.08s', href: '#products', keywords: 'gilet elder airbag chute protection sécurité' },
    { type: 'Produit', title: 'Balance Vita', desc: 'Balance connectée — composition corporelle complète', href: '#products', keywords: 'balance vita poids masse corporelle' },
    { type: 'Service', title: 'Téléassistance', desc: 'Service de téléassistance 24h/24 avec crédit d\'impôt', href: '#', keywords: 'téléassistance assistance urgence alarme aide' },
    { type: 'Page', title: 'L\'Application Chutex', desc: 'Suivi santé, IA Nora, alertes gardiens, géolocalisation', href: '#app', keywords: 'application app mobile télécharger nora ia' },
    { type: 'Page', title: 'Espace Professionnel', desc: 'Rejoignez notre réseau de partenaires santé', href: '#', keywords: 'professionnel partenaire coach physio saad espace pro' },
    { type: 'FAQ', title: 'Comment fonctionne le bracelet Elio ?', desc: 'Suivi continu de vos constantes de santé au poignet', href: '#', keywords: 'comment fonctionne bracelet elio utiliser' },
    { type: 'FAQ', title: 'Quels sont les abonnements disponibles ?', desc: 'Standard 24.9€/mois, Sport 99€/mois, Physio 99€/mois', href: '#', keywords: 'abonnement prix tarif standard sport physio' },
    { type: 'FAQ', title: 'Le gilet Elder est-il remboursé ?', desc: 'Informations sur la prise en charge et les aides', href: '#', keywords: 'remboursement prise en charge mutuelle aide' },
    { type: 'FAQ', title: 'Comment contacter le support ?', desc: 'Notre équipe est disponible par email et téléphone', href: '#', keywords: 'contact support aide email téléphone' },
    { type: 'Page', title: 'Devenir Coach Partenaire', desc: 'Accompagnez vos clients avec nos dispositifs connectés', href: '#', keywords: 'coach partenaire devenir inscription' },
    { type: 'Page', title: 'Devenir Physio Partenaire', desc: 'Intégrez la télérééducation dans votre pratique', href: '#', keywords: 'physio kiné partenaire devenir rééducation' },
  ],
  en: [
    { type: 'Product', title: 'Elio Bracelet', desc: 'Connected health bracelet — heart rate, sleep, activity tracking', href: '#products', keywords: 'bracelet elio watch health connected heart sleep' },
    { type: 'Product', title: 'Elder Vest', desc: 'Airbag anti-fall vest — 0.08s deployment', href: '#products', keywords: 'vest elder airbag fall protection safety' },
    { type: 'Product', title: 'Vita Scale', desc: 'Connected scale — complete body composition', href: '#products', keywords: 'scale vita weight body composition' },
    { type: 'Service', title: 'Teleassistance', desc: '24/7 teleassistance service with tax credit', href: '#', keywords: 'teleassistance assistance emergency alarm help' },
    { type: 'Page', title: 'The Chutex App', desc: 'Health tracking, Nora AI, guardian alerts, geolocation', href: '#app', keywords: 'application app mobile download nora ai' },
    { type: 'Page', title: 'Professional Space', desc: 'Join our health partner network', href: '#', keywords: 'professional partner coach physio space pro' },
    { type: 'FAQ', title: 'How does the Elio bracelet work?', desc: 'Continuous monitoring of your health vitals on your wrist', href: '#', keywords: 'how works bracelet elio use' },
    { type: 'FAQ', title: 'What subscriptions are available?', desc: 'Standard €24.9/mo, Sport €99/mo, Physio €99/mo', href: '#', keywords: 'subscription price plan standard sport physio' },
    { type: 'FAQ', title: 'Is the Elder vest covered by insurance?', desc: 'Information about coverage and assistance', href: '#', keywords: 'insurance coverage reimbursement help' },
    { type: 'FAQ', title: 'How to contact support?', desc: 'Our team is available by email and phone', href: '#', keywords: 'contact support help email phone' },
  ],
}

export default function SearchOverlay({ isOpen, onClose }) {
  const { lang } = useI18n()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const data = SEARCH_DATA[lang] || SEARCH_DATA.fr

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setQuery('')
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = query.length < 2 ? [] : data.filter(item => {
    const q = query.toLowerCase()
    return item.title.toLowerCase().includes(q) || item.keywords.includes(q) || item.desc.toLowerCase().includes(q)
  })

  const grouped = results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {})

  const placeholderText = lang === 'fr' ? 'Rechercher un produit, une page, une question...' : 'Search for a product, page, question...'
  const noResultsText = lang === 'fr' ? 'Aucun résultat trouvé' : 'No results found'
  const suggestionsText = lang === 'fr' ? 'Suggestions' : 'Suggestions'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100]"
          data-testid="search-overlay"
        >
          {/* Blur background */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={onClose} />

          {/* Search container */}
          <div className="relative flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl"
            >
              {/* Search input */}
              <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex items-center px-5 py-4 gap-4">
                  <Search size={20} className="text-white/50 flex-shrink-0" strokeWidth={1.5} />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholderText}
                    data-testid="search-input"
                    className="flex-1 bg-transparent text-white text-[15px] font-medium placeholder:text-white/30 outline-none"
                  />
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1" data-testid="search-close">
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Results */}
                {query.length >= 2 && (
                  <div className="border-t border-white/10 max-h-[50vh] overflow-y-auto">
                    {results.length === 0 ? (
                      <div className="px-5 py-8 text-center text-white/30 text-sm">{noResultsText}</div>
                    ) : (
                      <div className="py-2">
                        {Object.entries(grouped).map(([type, items]) => (
                          <div key={type}>
                            <div className="px-5 pt-3 pb-1">
                              <span className="text-[11px] uppercase tracking-widest font-semibold text-white/30">{type}</span>
                            </div>
                            {items.map((item, i) => (
                              <a key={i} href={item.href} onClick={onClose} data-testid={`search-result-${i}`}
                                className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.07] transition-all duration-200 group cursor-pointer">
                                <div>
                                  <div className="text-white text-sm font-medium">{item.title}</div>
                                  <div className="text-white/35 text-xs mt-0.5">{item.desc}</div>
                                </div>
                                <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0 ml-4" />
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions when empty */}
                {query.length < 2 && (
                  <div className="border-t border-white/10 py-3">
                    <div className="px-5 pt-1 pb-2">
                      <span className="text-[11px] uppercase tracking-widest font-semibold text-white/30">{suggestionsText}</span>
                    </div>
                    {data.slice(0, 5).map((item, i) => (
                      <a key={i} href={item.href} onClick={onClose}
                        className="flex items-center justify-between px-5 py-2.5 hover:bg-white/[0.07] transition-all duration-200 group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-white/20 w-14">{item.type}</span>
                          <span className="text-white/60 text-sm">{item.title}</span>
                        </div>
                        <ArrowRight size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Shortcut hint */}
              <div className="flex justify-center mt-4">
                <span className="text-white/20 text-xs">ESC</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
