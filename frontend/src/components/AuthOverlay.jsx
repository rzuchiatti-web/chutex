import { useState, useEffect, useRef } from 'react'
import { X, Mail, Lock, User as UserIcon, Phone, ArrowRight, LogOut, Settings, MapPin, Hash, Building2, ChevronDown, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

const PHONE_PREFIXES = [
  { code: '+33', flag: 'https://flagcdn.com/24x18/fr.png', label: 'FR +33' },
  { code: '+32', flag: 'https://flagcdn.com/24x18/be.png', label: 'BE +32' },
  { code: '+41', flag: 'https://flagcdn.com/24x18/ch.png', label: 'CH +41' },
  { code: '+352', flag: 'https://flagcdn.com/24x18/lu.png', label: 'LU +352' },
  { code: '+44', flag: 'https://flagcdn.com/24x18/gb.png', label: 'GB +44' },
  { code: '+49', flag: 'https://flagcdn.com/24x18/de.png', label: 'DE +49' },
  { code: '+34', flag: 'https://flagcdn.com/24x18/es.png', label: 'ES +34' },
  { code: '+39', flag: 'https://flagcdn.com/24x18/it.png', label: 'IT +39' },
  { code: '+31', flag: 'https://flagcdn.com/24x18/nl.png', label: 'NL +31' },
  { code: '+351', flag: 'https://flagcdn.com/24x18/pt.png', label: 'PT +351' },
  { code: '+1', flag: 'https://flagcdn.com/24x18/us.png', label: 'US +1' },
]

const COUNTRIES = [
  { code: 'FR', flag: 'https://flagcdn.com/24x18/fr.png', label: 'France' },
  { code: 'BE', flag: 'https://flagcdn.com/24x18/be.png', label: 'Belgique' },
  { code: 'CH', flag: 'https://flagcdn.com/24x18/ch.png', label: 'Suisse' },
  { code: 'LU', flag: 'https://flagcdn.com/24x18/lu.png', label: 'Luxembourg' },
  { code: 'GB', flag: 'https://flagcdn.com/24x18/gb.png', label: 'United Kingdom' },
  { code: 'DE', flag: 'https://flagcdn.com/24x18/de.png', label: 'Deutschland' },
  { code: 'ES', flag: 'https://flagcdn.com/24x18/es.png', label: 'España' },
  { code: 'IT', flag: 'https://flagcdn.com/24x18/it.png', label: 'Italia' },
  { code: 'NL', flag: 'https://flagcdn.com/24x18/nl.png', label: 'Nederland' },
  { code: 'PT', flag: 'https://flagcdn.com/24x18/pt.png', label: 'Portugal' },
  { code: 'US', flag: 'https://flagcdn.com/24x18/us.png', label: 'United States' },
  { code: 'CA', flag: 'https://flagcdn.com/24x18/ca.png', label: 'Canada' },
  { code: 'MC', flag: 'https://flagcdn.com/24x18/mc.png', label: 'Monaco' },
  { code: 'AT', flag: 'https://flagcdn.com/24x18/at.png', label: 'Österreich' },
  { code: 'SE', flag: 'https://flagcdn.com/24x18/se.png', label: 'Sverige' },
]

const TEXTS = {
  fr: {
    login: 'Connexion', register: 'Inscription', email: 'Email', password: 'Mot de passe',
    name: 'Nom complet', phone: 'Téléphone', loginBtn: 'Se connecter', registerBtn: "S'inscrire",
    noAccount: 'Pas de compte ?', hasAccount: 'Déjà un compte ?', createOne: 'Créer un compte', connect: 'Se connecter',
    welcome: 'Bienvenue,', account: 'Mon compte', settings: 'Paramètres', logoutBtn: 'Déconnexion',
    forgotPw: 'Mot de passe oublié ?', address: 'Adresse', postalCode: 'Code postal', city: 'Ville', country: 'Pays',
  },
  en: {
    login: 'Login', register: 'Sign Up', email: 'Email', password: 'Password',
    name: 'Full name', phone: 'Phone', loginBtn: 'Sign in', registerBtn: 'Sign up',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?', createOne: 'Create one', connect: 'Sign in',
    welcome: 'Welcome,', account: 'My account', settings: 'Settings', logoutBtn: 'Sign out',
    forgotPw: 'Forgot password?', address: 'Address', postalCode: 'Postal code', city: 'City', country: 'Country',
  },
}

function useAddressAutocomplete(query) {
  const [suggestions, setSuggestions] = useState([])
  const timer = useRef(null)
  useEffect(() => {
    if (query.length < 4) { setSuggestions([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=4`)
        .then(r => r.json())
        .then(data => {
          setSuggestions((data.features || []).map(f => ({
            label: f.properties.label,
            address: f.properties.name,
            city: f.properties.city,
            postcode: f.properties.postcode,
          })))
        })
        .catch(() => setSuggestions([]))
    }, 300)
    return () => clearTimeout(timer.current)
  }, [query])
  return suggestions
}

export default function AuthOverlay({ isOpen, onClose }) {
  const { lang } = useI18n()
  const { user, isAuthenticated, login, register, logout } = useAuth()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', address: '', postal_code: '', city: '', country: 'FR' })
  const [phonePrefix, setPhonePrefix] = useState(PHONE_PREFIXES[0])
  const [prefixOpen, setPrefixOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const [showAddrSuggestions, setShowAddrSuggestions] = useState(false)
  const addressSuggestions = useAddressAutocomplete(form.address)
  const tx = TEXTS[lang] || TEXTS.fr
  const selectedCountry = COUNTRIES.find(c => c.code === form.country) || COUNTRIES[0]

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else {
        const fullPhone = form.phone ? `${phonePrefix.code}${form.phone.replace(/^0/, '')}` : ''
        await register({ name: form.name, email: form.email, phone: fullPhone, password: form.password, address: form.address, postal_code: form.postal_code, city: form.city, country: form.country })
      }
      setForm({ email: '', password: '', name: '', phone: '', address: '', postal_code: '', city: '', country: 'FR' })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleLogout = () => { logout(); onClose() }
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const selectSuggestion = (s) => {
    setForm(f => ({ ...f, address: s.address, city: s.city, postal_code: s.postcode }))
    setShowAddrSuggestions(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-3xl overflow-y-auto" data-testid="auth-overlay" onClick={onClose}>
          <div className="flex items-start justify-center pt-[6vh] md:pt-[8vh] px-4 min-h-full pb-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center justify-between mb-8 md:mb-10">
                  <h2 className="text-white text-xl md:text-2xl font-semibold tracking-tight">
                    {isAuthenticated ? `${tx.welcome} ${user?.name?.split(' ')[0] || ''}` : (mode === 'login' ? tx.login : tx.register)}
                  </h2>
                  <button onClick={onClose} data-testid="auth-close"
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-all">
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>

                {isAuthenticated ? (
                  <div>
                    <p className="text-white/30 text-sm mb-8">{user?.email}</p>
                    <div className="border-t border-white/10" />
                    {[{ icon: UserIcon, label: tx.account }, { icon: Settings, label: tx.settings }].map((item, i) => (
                      <a key={i} href="#" onClick={onClose}
                        className="flex items-center justify-between py-5 border-b border-white/10 text-white/60 hover:text-white transition-all group">
                        <div className="flex items-center gap-4"><item.icon size={18} strokeWidth={1.5} /><span className="text-[15px] font-medium">{item.label}</span></div>
                        <ArrowRight size={15} className="text-white/15 group-hover:text-white/50 transition-colors" />
                      </a>
                    ))}
                    <button onClick={handleLogout} data-testid="logout-btn"
                      className="flex items-center gap-4 w-full py-5 text-white/30 hover:text-red-400 transition-all">
                      <LogOut size={18} strokeWidth={1.5} /><span className="text-[15px] font-medium">{tx.logoutBtn}</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} data-testid="auth-form">
                    {error && <div className="text-red-400 text-sm mb-6">{error}</div>}
                    <div className="border-t border-white/10">
                      {mode === 'register' && (
                        <div className="flex items-center gap-4 py-4 border-b border-white/10">
                          <UserIcon size={17} className="text-white/25 flex-shrink-0" />
                          <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
                            placeholder={tx.name} data-testid="auth-name"
                            className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                        </div>
                      )}
                      <div className="flex items-center gap-4 py-4 border-b border-white/10">
                        <Mail size={17} className="text-white/25 flex-shrink-0" />
                        <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                          placeholder={tx.email} data-testid="auth-email"
                          className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                      </div>
                      {mode === 'register' && (
                        <div className="flex items-center gap-4 py-4 border-b border-white/10">
                          <Phone size={17} className="text-white/25 flex-shrink-0" />
                          <div className="relative flex-shrink-0">
                            <button type="button" onClick={() => setPrefixOpen(!prefixOpen)}
                              className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors">
                              <img src={phonePrefix.flag} alt="" className="w-[18px] h-auto rounded-[2px]" />
                              <span className="text-xs font-medium">{phonePrefix.code}</span>
                              <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform ${prefixOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>{prefixOpen && (
                              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                className="absolute top-full left-0 mt-2 bg-black/60 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl py-1 min-w-[140px] max-h-[200px] overflow-y-auto z-10">
                                {PHONE_PREFIXES.map(p => (
                                  <button key={p.code} type="button" onClick={() => { setPhonePrefix(p); setPrefixOpen(false) }}
                                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs transition-all hover:bg-white/10 ${phonePrefix.code === p.code ? 'text-white font-semibold' : 'text-white/50'}`}>
                                    <img src={p.flag} alt="" className="w-4 h-auto rounded-[1px]" /> {p.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}</AnimatePresence>
                          </div>
                          <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                            placeholder="6 12 34 56 78" data-testid="auth-phone"
                            className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                        </div>
                      )}
                      <div className="flex items-center gap-4 py-4 border-b border-white/10">
                        <Lock size={17} className="text-white/25 flex-shrink-0" />
                        <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required
                          placeholder={tx.password} data-testid="auth-password"
                          className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                      </div>
                      {mode === 'register' && (
                        <>
                          <div className="relative">
                            <div className="flex items-center gap-4 py-4 border-b border-white/10">
                              <MapPin size={17} className="text-white/25 flex-shrink-0" />
                              <input type="text" value={form.address}
                                onChange={e => { update('address', e.target.value); setShowAddrSuggestions(true) }}
                                onFocus={() => setShowAddrSuggestions(true)}
                                placeholder={tx.address} data-testid="auth-address"
                                className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                            </div>
                            {showAddrSuggestions && addressSuggestions.length > 0 && (
                              <div className="absolute left-0 right-0 top-full bg-black/60 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl py-1 z-10">
                                {addressSuggestions.map((s, i) => (
                                  <button key={i} type="button" onClick={() => selectSuggestion(s)}
                                    className="block w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex border-b border-white/10">
                            <div className="flex items-center gap-4 py-4 flex-1 border-r border-white/10 pr-4">
                              <Hash size={17} className="text-white/25 flex-shrink-0" />
                              <input type="text" value={form.postal_code} onChange={e => update('postal_code', e.target.value)}
                                placeholder={tx.postalCode} data-testid="auth-postal_code"
                                className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none w-20" />
                            </div>
                            <div className="flex items-center gap-4 py-4 flex-1 pl-4">
                              <Building2 size={17} className="text-white/25 flex-shrink-0" />
                              <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                                placeholder={tx.city} data-testid="auth-city"
                                className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                            </div>
                          </div>
                          <div className="relative">
                            <button type="button" onClick={() => setCountryOpen(!countryOpen)}
                              className="flex items-center gap-4 py-4 border-b border-white/10 w-full text-left">
                              <img src={selectedCountry.flag} alt="" className="w-[18px] h-auto rounded-[2px] flex-shrink-0" />
                              <span className="flex-1 text-white text-[15px]">{selectedCountry.label}</span>
                              <ChevronDown size={14} className={`text-white/30 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>{countryOpen && (
                              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 top-full bg-black/60 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl py-1 max-h-[200px] overflow-y-auto z-10">
                                {COUNTRIES.map(c => (
                                  <button key={c.code} type="button" onClick={() => { update('country', c.code); setCountryOpen(false) }}
                                    className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-all hover:bg-white/10 ${form.country === c.code ? 'text-white font-semibold' : 'text-white/50'}`}>
                                    <img src={c.flag} alt="" className="w-[18px] h-auto rounded-[2px]" /> {c.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}</AnimatePresence>
                          </div>
                        </>
                      )}
                    </div>
                    {mode === 'login' && (
                      <button type="button" className="text-white/20 text-xs mt-4 hover:text-white/50 transition-colors">{tx.forgotPw}</button>
                    )}
                    <button type="submit" disabled={loading} data-testid="auth-submit"
                      className="group relative w-full mt-8 md:mt-10 py-4 rounded-full text-white text-[15px] font-semibold overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50">
                      <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full group-hover:bg-white/[0.18] transition-all duration-500" />
                      <span className="relative flex items-center justify-center gap-2.5">
                        {loading ? '...' : (mode === 'login' ? tx.loginBtn : tx.registerBtn)}
                        <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                    <div className="text-center mt-6 md:mt-8">
                      <span className="text-white/20 text-sm">{mode === 'login' ? tx.noAccount : tx.hasAccount} </span>
                      <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                        className="text-white/70 text-sm font-semibold hover:text-white transition-colors">
                        {mode === 'login' ? tx.createOne : tx.connect}
                      </button>
                    </div>
                  </form>
                )}
                <div className="flex justify-center mt-8"><span className="text-white/15 text-[10px] tracking-widest">ESC</span></div>
              </motion.div>
            </div>
        </div>
      )}
    </AnimatePresence>
  )
}
