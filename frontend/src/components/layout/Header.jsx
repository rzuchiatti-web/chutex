import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Search, ShoppingBag, User, ChevronDown } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

const FLAGS = {
  fr: 'https://flagcdn.com/24x18/fr.png',
  en: 'https://flagcdn.com/24x18/gb.png',
}

const FLAG_LABELS = { fr: 'Français', en: 'English' }

export default function Header() {
  const { t, lang, setLang, currency } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: t('nav.elio'), href: '#products' },
    { label: t('nav.elder'), href: '#products' },
    { label: t('nav.vita'), href: '#products' },
    { label: t('nav.teleassistance'), href: '#' },
    { label: t('nav.partners'), href: '#' },
  ]

  const isLight = scrolled

  return (
    <header
      data-testid="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isLight
          ? 'bg-white/70 backdrop-blur-2xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.06)]'
          : 'bg-black/10 backdrop-blur-xl border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex-shrink-0 group" data-testid="header-logo">
            <img
              src={isLight ? '/images/logo_black.png' : '/images/logo_white.png'}
              alt="Chutex Care"
              className="h-8 md:h-10 w-auto transition-all duration-300 group-hover:scale-105"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" data-testid="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`relative font-body text-sm font-medium px-4 py-2 rounded-full transition-all duration-300 group ${
                  isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-3/4 transition-all duration-300 rounded-full ${
                  isLight ? 'bg-primary' : 'bg-white'
                }`} />
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <button
              data-testid="search-icon"
              className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  : 'text-white/70 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
              }`}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <button
              data-testid="account-icon"
              className={`p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  : 'text-white/70 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
              }`}
            >
              <User size={18} strokeWidth={1.5} />
            </button>

            <button
              data-testid="cart-icon"
              className={`relative p-2.5 rounded-full transition-all duration-300 hover:scale-110 ${
                isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
                  : 'text-white/70 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
              }`}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                0
              </span>
            </button>

            <div className="w-px h-6 mx-1 bg-white/20" />

            <div className="relative">
              <button
                data-testid="lang-selector"
                onClick={() => setLangOpen(!langOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 hover:scale-105 ${
                  isLight
                    ? 'text-slate-600 hover:bg-slate-100/60'
                    : 'text-white/80 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                }`}
              >
                <img src={FLAGS[lang]} alt={lang} className="w-5 h-auto rounded-sm shadow-sm" />
                <span className="text-xs font-semibold uppercase">{currency}</span>
                <ChevronDown size={12} strokeWidth={2} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-2xl py-2 min-w-[160px] overflow-hidden">
                  {Object.entries(FLAGS).map(([code, flag]) => (
                    <button
                      key={code}
                      data-testid={`lang-option-${code}`}
                      onClick={() => { setLang(code); setLangOpen(false) }}
                      className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-all duration-200 hover:bg-primary/5 ${
                        lang === code ? 'text-primary font-semibold bg-primary/5' : 'text-slate-600'
                      }`}
                    >
                      <img src={flag} alt={code} className="w-5 h-auto rounded-sm" />
                      <span>{FLAG_LABELS[code]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            data-testid="mobile-menu-toggle"
            className={`lg:hidden p-2 rounded-full transition-all duration-300 ${
              isLight ? 'text-slate-700' : 'text-white'
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div data-testid="mobile-menu" className="lg:hidden bg-white/95 backdrop-blur-2xl border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block font-body text-base font-medium text-slate-700 hover:text-primary transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
              {Object.entries(FLAGS).map(([code, flag]) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); setMobileOpen(false) }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    lang === code ? 'bg-primary/10 text-primary' : 'text-slate-400'
                  }`}
                >
                  <img src={flag} alt={code} className="w-5 h-auto rounded-sm" />
                  {FLAG_LABELS[code]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-3">
              <button className="p-2.5 rounded-full bg-slate-100 text-slate-600"><Search size={18} /></button>
              <button className="p-2.5 rounded-full bg-slate-100 text-slate-600"><User size={18} /></button>
              <button className="relative p-2.5 rounded-full bg-slate-100 text-slate-600">
                <ShoppingBag size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
