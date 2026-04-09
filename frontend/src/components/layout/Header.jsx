import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

export default function Header() {
  const { t, lang, setLang, currency } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
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
    <header
      data-testid="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex-shrink-0" data-testid="header-logo">
            <img
              src="/images/logo_black.png"
              alt="Chutex Care"
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8" data-testid="desktop-nav">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-body text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors tracking-wide"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className="relative">
              <button
                data-testid="lang-selector"
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Globe size={16} strokeWidth={1.5} />
                <span className="uppercase">{lang}</span>
                <span className="text-slate-300">|</span>
                <span>{currency}</span>
                <ChevronDown size={14} strokeWidth={1.5} />
              </button>
              {langOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
                  {['fr', 'en'].map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        lang === l ? 'text-primary font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {l === 'fr' ? 'Français' : 'English'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <a
              href="#products"
              data-testid="header-cta"
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-blue-700 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {t('nav.order')}
            </a>
          </div>

          <button
            data-testid="mobile-menu-toggle"
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div data-testid="mobile-menu" className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block font-body text-base font-medium text-slate-700 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
              <button onClick={() => { setLang('fr'); setMobileOpen(false) }} className={`text-sm font-medium ${lang === 'fr' ? 'text-primary' : 'text-slate-400'}`}>FR</button>
              <span className="text-slate-200">|</span>
              <button onClick={() => { setLang('en'); setMobileOpen(false) }} className={`text-sm font-medium ${lang === 'en' ? 'text-primary' : 'text-slate-400'}`}>EN</button>
            </div>
            <a
              href="#products"
              onClick={() => setMobileOpen(false)}
              className="block text-center bg-primary text-white font-semibold px-6 py-3 rounded-full"
            >
              {t('nav.order')}
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
