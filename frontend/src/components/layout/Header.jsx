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

  const navLinks = [
    { label: t('nav.elio'), href: '#products' },
    { label: t('nav.elder'), href: '#products' },
    { label: t('nav.vita'), href: '#products' },
    { label: t('nav.teleassistance'), href: '#' },
    { label: t('nav.partners'), href: '#' },
  ]

  return (
    <header data-testid="main-header" className="fixed top-0 left-0 right-0 z-50">
      {/* DESKTOP */}
      <div className="hidden lg:block">
        <div className="max-w-[1780px] mx-auto px-8 pt-5">
          <div className="grid grid-cols-3 items-center">
            {/* LEFT — Logo */}
            <div className="flex items-center">
              <Link to="/" data-testid="header-logo" className="group">
                <img src="/images/logo_white.png" alt="Chutex Care"
                  className="h-11 w-auto brightness-0 invert transition-all duration-500 group-hover:opacity-80" />
              </Link>
            </div>

            {/* CENTER — Nav */}
            <nav className="flex justify-center items-center gap-1" data-testid="desktop-nav">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href}
                  className="relative font-body text-[13px] font-medium px-4 py-2 text-white/50 transition-all duration-300 hover:text-white group">
                  {link.label}
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-full bg-white/40 transition-all duration-400" />
                </a>
              ))}
            </nav>

            {/* RIGHT — Actions */}
            <div className="flex items-center justify-end gap-3">
              <div className="relative">
                <button data-testid="lang-selector" onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-all duration-300">
                  <img src={FLAGS[lang]} alt={lang} className="w-[18px] h-auto rounded-[2px]" />
                  <span className="text-[11px] font-medium">{currency}</span>
                  <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute top-full right-0 mt-3 bg-white/95 backdrop-blur-2xl border border-gray-200/50 rounded-xl shadow-2xl py-1.5 min-w-[150px]">
                    {Object.entries(FLAGS).map(([code, flag]) => (
                      <button key={code} data-testid={`lang-option-${code}`}
                        onClick={() => { setLang(code); setLangOpen(false) }}
                        className={`flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm transition-all hover:bg-slate-50 ${lang === code ? 'text-primary font-semibold' : 'text-slate-600'}`}>
                        <img src={flag} alt={code} className="w-[18px] h-auto rounded-[2px]" /> {FLAG_LABELS[code]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-4 bg-white/15" />

              {[{ icon: Search, tid: 'search-icon' }, { icon: User, tid: 'account-icon' }].map(({ icon: Icon, tid }) => (
                <button key={tid} data-testid={tid}
                  className="p-2 text-white/40 hover:text-white transition-all duration-300">
                  <Icon size={17} strokeWidth={1.5} />
                </button>
              ))}

              <button data-testid="cart-icon"
                className="relative p-2 text-white/40 hover:text-white transition-all duration-300">
                <ShoppingBag size={17} strokeWidth={1.5} />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-white text-slate-900 text-[8px] font-bold rounded-full flex items-center justify-center">0</span>
              </button>
            </div>
          </div>

          {/* Thin white line */}
          <div className="mt-4 h-px bg-white/10" />
        </div>
      </div>

      {/* MOBILE */}
      <div className="flex lg:hidden items-center justify-between px-4 pt-4">
        <button data-testid="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Link to="/" data-testid="header-logo-mobile" className="absolute left-1/2 -translate-x-1/2">
          <img src="/images/logo_white.png" alt="Chutex Care" className="h-10 w-auto brightness-0 invert" />
        </Link>
        <button data-testid="cart-icon-mobile"
          className="relative w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white">
          <ShoppingBag size={17} strokeWidth={1.5} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
        </button>
      </div>

      {mobileOpen && (
        <div data-testid="mobile-menu" className="lg:hidden mx-4 mt-3 bg-white/95 backdrop-blur-2xl rounded-2xl border border-gray-200/50 shadow-2xl">
          <div className="px-5 py-5 space-y-1">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                className="block text-[15px] font-medium text-slate-700 hover:text-primary hover:bg-slate-50 rounded-xl px-3 py-2.5 transition-all">
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
