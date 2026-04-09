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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

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

  return (
    <header data-testid="main-header" className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 pt-4 md:pt-5">
      {/* DESKTOP */}
      <div className="hidden lg:flex items-center justify-between">
        <div className={`flex items-center gap-1 rounded-full px-4 py-2.5 border transition-all duration-500 ${
          scrolled 
            ? 'bg-slate-900/80 backdrop-blur-2xl border-white/10 shadow-2xl' 
            : 'bg-white/10 backdrop-blur-xl border-white/15'
        }`}>
          <Link to="/" className="flex-shrink-0 mr-4" data-testid="header-logo">
            <img src="/images/logo_white.png" alt="Chutex Care" className="h-9 w-auto brightness-0 invert" />
          </Link>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`relative font-body text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-all duration-300 ${
                scrolled
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              data-testid="lang-selector"
              onClick={() => setLangOpen(!langOpen)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full border transition-all duration-500 ${
                scrolled
                  ? 'bg-slate-900/80 backdrop-blur-2xl border-white/10 text-white/80 shadow-2xl'
                  : 'bg-white/10 backdrop-blur-xl border-white/15 text-white/80'
              }`}
            >
              <img src={FLAGS[lang]} alt={lang} className="w-[18px] h-auto rounded-[2px]" />
              <span className="text-xs font-semibold">{currency}</span>
              <ChevronDown size={11} strokeWidth={2.5} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-gray-200/50 rounded-2xl shadow-2xl py-1.5 min-w-[150px] overflow-hidden">
                {Object.entries(FLAGS).map(([code, flag]) => (
                  <button
                    key={code}
                    data-testid={`lang-option-${code}`}
                    onClick={() => { setLang(code); setLangOpen(false) }}
                    className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-all hover:bg-slate-50 ${
                      lang === code ? 'text-primary font-semibold' : 'text-slate-600'
                    }`}
                  >
                    <img src={flag} alt={code} className="w-[18px] h-auto rounded-[2px]" />
                    {FLAG_LABELS[code]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {[
            { icon: Search, testId: 'search-icon' },
            { icon: User, testId: 'account-icon' },
          ].map(({ icon: Icon, testId }) => (
            <button
              key={testId}
              data-testid={testId}
              className={`p-2.5 rounded-full border transition-all duration-500 hover:scale-105 ${
                scrolled
                  ? 'bg-slate-900/80 backdrop-blur-2xl border-white/10 text-white/70 hover:text-white shadow-2xl'
                  : 'bg-white/10 backdrop-blur-xl border-white/15 text-white/70 hover:text-white'
              }`}
            >
              <Icon size={17} strokeWidth={1.5} />
            </button>
          ))}

          <button
            data-testid="cart-icon"
            className={`relative p-2.5 rounded-full border transition-all duration-500 hover:scale-105 ${
              scrolled
                ? 'bg-slate-900/80 backdrop-blur-2xl border-white/10 text-white/70 hover:text-white shadow-2xl'
                : 'bg-white/10 backdrop-blur-xl border-white/15 text-white/70 hover:text-white'
            }`}
          >
            <ShoppingBag size={17} strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
          </button>
        </div>
      </div>

      {/* MOBILE */}
      <div className="flex lg:hidden items-center justify-between">
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white transition-all duration-300 hover:bg-white/20"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2" data-testid="header-logo-mobile">
          <img src="/images/logo_white.png" alt="Chutex Care" className="h-10 w-auto brightness-0 invert" />
        </Link>

        <button
          data-testid="cart-icon-mobile"
          className="relative w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white transition-all duration-300 hover:bg-white/20"
        >
          <ShoppingBag size={17} strokeWidth={1.5} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
        </button>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div data-testid="mobile-menu" className="lg:hidden mt-3 bg-white/95 backdrop-blur-2xl rounded-2xl border border-gray-200/50 shadow-2xl overflow-hidden">
          <div className="px-5 py-5 space-y-1">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="block font-body text-[15px] font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-xl px-3 py-2.5 transition-all">
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center gap-2">
              {Object.entries(FLAGS).map(([code, flag]) => (
                <button key={code} onClick={() => { setLang(code); setMobileOpen(false) }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${lang === code ? 'bg-primary/10 text-primary' : 'text-slate-400 bg-slate-50'}`}>
                  <img src={flag} alt={code} className="w-[18px] h-auto rounded-[2px]" /> {FLAG_LABELS[code]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
