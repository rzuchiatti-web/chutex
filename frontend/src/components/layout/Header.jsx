import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Search, ShoppingBag, User, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../../i18n/I18nContext'

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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)

  const currentFlag = LANGS.find(l => l.code === lang)?.flag || LANGS[0].flag

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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-3 items-center"
          >
            <div className="flex items-center">
              <Link to="/" data-testid="header-logo" className="group">
                <img src="/images/logo_white.png" alt="Chutex Care"
                  className="h-11 w-auto brightness-0 invert transition-all duration-700 group-hover:opacity-70" />
              </Link>
            </div>

            <nav className="flex justify-center items-center gap-0.5" data-testid="desktop-nav">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.06 }}
                  className="relative font-body text-[13px] font-medium px-4 py-2 text-white/50 transition-all duration-500 hover:text-white group"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-500" />
                </motion.a>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-3">
              <div className="relative">
                <button data-testid="lang-selector" onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-2 text-white/50 hover:text-white transition-all duration-300">
                  <img src={currentFlag} alt={lang} className="w-[18px] h-auto rounded-[2px]" />
                  <span className="text-[11px] font-medium">{currency}</span>
                  <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-3 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl py-2 min-w-[170px] overflow-hidden"
                    >
                      {LANGS.map((l) => (
                        <button key={l.code} data-testid={`lang-option-${l.code}`}
                          onClick={() => { setLang(l.code); setLangOpen(false) }}
                          className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[13px] transition-all duration-200 hover:bg-white/10 ${
                            lang === l.code ? 'text-white font-semibold' : 'text-white/60'
                          }`}>
                          <img src={l.flag} alt={l.code} className="w-[18px] h-auto rounded-[2px]" />
                          {l.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
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
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent origin-left"
          />
        </div>
      </div>

      {/* MOBILE */}
      <div className="flex lg:hidden items-center justify-between px-4 pt-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          data-testid="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </motion.button>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <Link to="/" data-testid="header-logo-mobile" className="absolute left-1/2 -translate-x-1/2">
            <img src="/images/logo_white.png" alt="Chutex Care" className="h-10 w-auto brightness-0 invert" />
          </Link>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          data-testid="cart-icon-mobile"
          className="relative w-11 h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white">
          <ShoppingBag size={17} strokeWidth={1.5} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-slate-900 text-[9px] font-bold rounded-full flex items-center justify-center">0</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            data-testid="mobile-menu" className="lg:hidden mx-4 mt-3 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/15 shadow-2xl">
            <div className="px-5 py-5 space-y-1">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)}
                  className="block text-[15px] font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl px-3 py-2.5 transition-all">
                  {link.label}
                </a>
              ))}
              <div className="pt-3 mt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                {LANGS.slice(0, 4).map((l) => (
                  <button key={l.code} onClick={() => { setLang(l.code); setMobileOpen(false) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${lang === l.code ? 'bg-white/20 text-white' : 'text-white/40'}`}>
                    <img src={l.flag} alt={l.code} className="w-4 h-auto rounded-[1px]" /> {l.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
