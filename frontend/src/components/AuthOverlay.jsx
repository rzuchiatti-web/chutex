import { useState } from 'react'
import { X, Mail, Lock, User as UserIcon, Phone, ArrowRight, LogOut, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

const TEXTS = {
  fr: {
    login: 'Connexion', register: 'Inscription', email: 'Email', password: 'Mot de passe',
    name: 'Nom complet', phone: 'Téléphone', loginBtn: 'Se connecter', registerBtn: "S'inscrire",
    noAccount: 'Pas de compte ?', hasAccount: 'Déjà un compte ?', createOne: 'Créer un compte', connect: 'Se connecter',
    welcome: 'Bienvenue,', account: 'Mon compte', settings: 'Paramètres', logoutBtn: 'Déconnexion',
    forgotPw: 'Mot de passe oublié ?',
  },
  en: {
    login: 'Login', register: 'Sign Up', email: 'Email', password: 'Password',
    name: 'Full name', phone: 'Phone', loginBtn: 'Sign in', registerBtn: 'Sign up',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?', createOne: 'Create one', connect: 'Sign in',
    welcome: 'Welcome,', account: 'My account', settings: 'Settings', logoutBtn: 'Sign out',
    forgotPw: 'Forgot password?',
  },
}

export default function AuthOverlay({ isOpen, onClose }) {
  const { lang } = useI18n()
  const { user, isAuthenticated, login, register, logout } = useAuth()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const tx = TEXTS[lang] || TEXTS.fr

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      setForm({ email: '', password: '', name: '', phone: '' })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleLogout = () => { logout(); onClose() }
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }} className="fixed inset-0 z-[100]" data-testid="auth-overlay">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xl" onClick={onClose} />

          <div className="relative flex items-start justify-center pt-[12vh] px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md">

              {/* Title + close */}
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-white text-2xl font-semibold tracking-tight">
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
                  {[
                    { icon: UserIcon, label: tx.account },
                    { icon: Settings, label: tx.settings },
                  ].map((item, i) => (
                    <a key={i} href="#" onClick={onClose}
                      className="flex items-center justify-between py-5 border-b border-white/10 text-white/60 hover:text-white transition-all group">
                      <div className="flex items-center gap-4">
                        <item.icon size={18} strokeWidth={1.5} />
                        <span className="text-[15px] font-medium">{item.label}</span>
                      </div>
                      <ArrowRight size={15} className="text-white/15 group-hover:text-white/50 transition-colors" />
                    </a>
                  ))}
                  <button onClick={handleLogout} data-testid="logout-btn"
                    className="flex items-center gap-4 w-full py-5 text-white/30 hover:text-red-400 transition-all">
                    <LogOut size={18} strokeWidth={1.5} />
                    <span className="text-[15px] font-medium">{tx.logoutBtn}</span>
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
                        <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                          placeholder={tx.phone} data-testid="auth-phone"
                          className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 py-4 border-b border-white/10">
                      <Lock size={17} className="text-white/25 flex-shrink-0" />
                      <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required
                        placeholder={tx.password} data-testid="auth-password"
                        className="flex-1 bg-transparent text-white text-[15px] placeholder:text-white/20 outline-none" />
                    </div>
                  </div>

                  {mode === 'login' && (
                    <button type="button" className="text-white/20 text-xs mt-4 hover:text-white/50 transition-colors">
                      {tx.forgotPw}
                    </button>
                  )}

                  <button type="submit" disabled={loading} data-testid="auth-submit"
                    className="group relative w-full mt-10 py-4 rounded-full text-white text-[15px] font-semibold overflow-hidden transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] disabled:opacity-50">
                    <span className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full group-hover:bg-white/[0.18] transition-all duration-500" />
                    <span className="relative flex items-center justify-center gap-2.5">
                      {loading ? '...' : (mode === 'login' ? tx.loginBtn : tx.registerBtn)}
                      <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>

                  <div className="text-center mt-8">
                    <span className="text-white/20 text-sm">{mode === 'login' ? tx.noAccount : tx.hasAccount} </span>
                    <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                      className="text-white/70 text-sm font-semibold hover:text-white transition-colors">
                      {mode === 'login' ? tx.createOne : tx.connect}
                    </button>
                  </div>
                </form>
              )}

              <div className="flex justify-center mt-10">
                <span className="text-white/15 text-[10px] tracking-widest">ESC</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
