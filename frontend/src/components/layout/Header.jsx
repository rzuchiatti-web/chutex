import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Search, ShoppingCart, User, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'
import SearchOverlay from '../SearchOverlay'
import AuthOverlay from '../AuthOverlay'
import CartOverlay from '../CartOverlay'
import { useCart } from '../../cart/CartContext'

const LANGS = [
  { code: 'fr', flag: 'https://flagcdn.com/24x18/fr.png', label: 'Français' },
  { code: 'en', flag: 'https://flagcdn.com/24x18/gb.png', label: 'English' },
  { code: 'es', flag: 'https://flagcdn.com/24x18/es.png', label: 'Español' },
  { code: 'de', flag: 'https://flagcdn.com/24x18/de.png', label: 'Deutsch' },
  { code: 'nl', flag: 'https://flagcdn.com/24x18/nl.png', label: 'Nederlands' },
  { code: 'it', flag: 'https://flagcdn.com/24x18/it.png', label: 'Italiano' },
  { code: 'pt', flag: 'https://flagcdn.com/24x18/pt.png', label: 'Português' },
]

export default function Header() {
  const { t, lang, setLang, currency } = useI18n()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [mobileLangOpen, setMobileLangOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { count: cartCount } = useCart()
  const currentFlag = LANGS.find(l => l.code === lang)?.flag || LANGS[0].flag
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => {
      const threshold = isHome ? window.innerHeight * 3.5 : window.innerHeight * 0.8
      setScrolled(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const navLinks = [
    { label: t('nav.elio'), href: '/produits/elio' },
    { label: t('nav.vita'), href: '/produits/vita' },
    { label: t('nav.elder'), href: '/produits/elder' },
    { label: t('nav.teleassistance'), href: '/teleassistance' },
    { label: t('nav.accessories'), href: '/produits/accessoires' },
    { label: t('nav.app'), href: '/application' },
  ]

  // Dynamic color classes
  const txtBase = scrolled ? 'text-slate-800/80' : 'text-white/80'
  const txtHover = scrolled ? 'hover:text-slate-900' : 'hover:text-white'
  const txtActive = scrolled ? 'text-slate-900' : 'text-white'
  const txtMuted = scrolled ? 'text-slate-600' : 'text-white/60'
  const lineColor = scrolled
    ? 'bg-gradient-to-r from-transparent via-slate-300/40 to-transparent'
    : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
  const hoverLine = scrolled
    ? 'bg-gradient-to-r from-transparent via-slate-900/40 to-transparent'
    : 'bg-gradient-to-r from-transparent via-white/60 to-transparent'
  const dividerColor = scrolled ? 'bg-slate-300/40' : 'bg-white/20'
  const badgeBg = scrolled ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'

  return (
    <header
      data-testid="main-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'backdrop-blur-2xl bg-white/40'
          : 'bg-transparent'
      }`}
    >
      {/* DESKTOP */}
      <div className="hidden lg:block">
        <div className="max-w-[1780px] mx-auto px-8 pt-5">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-3 items-center"
          >
            <div className="flex items-center">
              <Link to="/" data-testid="header-logo">
                <img src="/images/logo_white.png" alt="Chutex Care"
                  className={`h-14 w-auto transition-all duration-500 ${scrolled ? '' : 'brightness-0 invert'}`} />
              </Link>
            </div>

            <nav className="flex justify-center items-center gap-0" data-testid="desktop-nav">
              {navLinks.map((link, i) => (
                <motion.a key={link.label} href={link.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.05 }}
                  className={`relative text-[12px] font-medium px-3.5 py-2 transition-all duration-500 ${txtBase} ${txtHover} group whitespace-nowrap`}>
                  {link.label}
                  <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-full ${hoverLine} transition-all duration-500`} />
                </motion.a>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-3">
              <div className="relative">
                <button data-testid="lang-selector" onClick={() => setLangOpen(!langOpen)}
                  className={`flex items-center gap-2 transition-all duration-500 ${txtBase} ${txtHover}`}>
                  <img src={currentFlag} alt={lang} className="w-5 h-auto rounded-[2px]" />
                  <span className="text-xs font-medium">{currency}</span>
                  <ChevronDown size={11} strokeWidth={2.5} className={`transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute top-full right-0 mt-3 backdrop-blur-2xl border rounded-2xl shadow-2xl py-2 min-w-[170px] ${
                        scrolled
                          ? 'bg-white/80 border-slate-200/60'
                          : 'bg-black/40 border-white/15'
                      }`}>
                      {LANGS.map((l) => (
                        <button key={l.code} data-testid={`lang-option-${l.code}`}
                          onClick={() => { setLang(l.code); setLangOpen(false) }}
                          className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[13px] transition-all duration-200 ${
                            scrolled
                              ? `hover:bg-slate-100 ${lang === l.code ? 'text-slate-900 font-semibold' : 'text-slate-500'}`
                              : `hover:bg-white/10 ${lang === l.code ? 'text-white font-semibold' : 'text-white/60'}`
                          }`}>
                          <img src={l.flag} alt={l.code} className="w-5 h-auto rounded-[2px]" /> {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={`w-px h-5 transition-colors duration-500 ${dividerColor}`} />

              {[{ icon: Search, tid: 'search-icon', action: () => setSearchOpen(true) }, { icon: User, tid: 'account-icon', action: () => setAuthOpen(true) }].map(({ icon: Icon, tid, action }) => (
                <button key={tid} data-testid={tid} onClick={action}
                  className={`p-2.5 transition-all duration-500 ${txtBase} ${txtHover}`}>
                  <Icon size={19} strokeWidth={1.5} />
                </button>
              ))}
              <button data-testid="cart-icon" onClick={() => setCartOpen(true)}
                className={`relative p-2.5 transition-all duration-500 ${txtBase} ${txtHover}`}>
                <ShoppingCart size={19} strokeWidth={1.5} />
                <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center transition-all duration-500 ${badgeBg}`}>{cartCount}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* MOBILE */}
      <div className={`flex lg:hidden items-center justify-between px-4 pt-4 pb-3 transition-all duration-500 ${
        scrolled ? 'backdrop-blur-2xl bg-white/40' : ''
      }`}>
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          data-testid="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}
          className={`w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all duration-500 ${
            scrolled
              ? 'bg-slate-900/5 border-slate-200/60 text-slate-800'
              : 'bg-white/10 border-white/20 text-white'
          }`}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </motion.button>
        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <img src="/images/logo_white.png" alt="Chutex Care"
            className={`h-12 w-auto transition-all duration-500 ${scrolled ? '' : 'brightness-0 invert'}`} />
        </Link>
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          data-testid="cart-icon-mobile" onClick={() => setCartOpen(true)}
          className={`relative w-11 h-11 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all duration-500 ${
            scrolled
              ? 'bg-slate-900/5 border-slate-200/60 text-slate-800'
              : 'bg-white/10 border-white/20 text-white'
          }`}>
          <ShoppingCart size={17} strokeWidth={1.5} />
          <span className={`absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center transition-all duration-500 ${badgeBg}`}>{cartCount}</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl" onClick={() => setMobileOpen(false)} />
            <div className="relative px-6 pt-6 h-full flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-10">
                <img src="/images/logo_white.png" alt="Chutex Care" className="h-14 w-auto brightness-0 invert" />
                <button onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/50 hover:text-white transition-all">
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-0 mb-8">
                {navLinks.map((link, i) => (
                  <motion.a key={link.label} href={link.href}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => setMobileOpen(false)}
                    className="block text-[17px] font-medium text-white/70 hover:text-white py-3.5 border-b border-white/10 transition-all">
                    {link.label}
                  </motion.a>
                ))}
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4">
                <button onClick={() => { setMobileOpen(false); setTimeout(() => setSearchOpen(true), 200) }}
                  data-testid="mobile-search-btn"
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all">
                  <Search size={20} strokeWidth={1.5} />
                </button>
                <button onClick={() => { setMobileOpen(false); setTimeout(() => setAuthOpen(true), 200) }}
                  data-testid="mobile-account-btn"
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all">
                  <User size={20} strokeWidth={1.5} />
                </button>
                <button onClick={() => setMobileLangOpen(!mobileLangOpen)}
                  data-testid="mobile-lang-btn"
                  className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all">
                  <img src={currentFlag} alt={lang} className="w-6 h-auto rounded-[2px]" />
                </button>
              </motion.div>

              <AnimatePresence>
                {mobileLangOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden">
                    <div className="flex flex-wrap justify-center gap-2 py-3">
                      {LANGS.map((l) => (
                        <button key={l.code} onClick={() => { setLang(l.code); setMobileLangOpen(false) }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${lang === l.code ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white/60'}`}>
                          <img src={l.flag} alt={l.code} className="w-[18px] h-auto rounded-[2px]" />
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-center mt-auto pb-8">
                <span className="text-white/15 text-[10px] tracking-widest">ESC</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthOverlay isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <CartOverlay isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  )
}
