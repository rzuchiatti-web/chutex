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
    welcome: 'Bienvenue,', account: 'Mon compte', orders: 'Mes commandes', settings: 'Paramètres', logoutBtn: 'Déconnexion',
    forgotPw: 'Mot de passe oublié ?',
  },
  en: {
    login: 'Login', register: 'Sign Up', email: 'Email', password: 'Password',
    name: 'Full name', phone: 'Phone', loginBtn: 'Sign in', registerBtn: 'Sign up',
    noAccount: "Don't have an account?", hasAccount: 'Already have an account?', createOne: 'Create one', connect: 'Sign in',
    welcome: 'Welcome,', account: 'My account', orders: 'My orders', settings: 'Settings', logoutBtn: 'Sign out',
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
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      }
      setForm({ email: '', password: '', name: '', phone: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => { logout(); onClose() }
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }} className="fixed inset-0 z-[100]" data-testid="auth-overlay">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={onClose} />

          <div className="relative flex items-start justify-center pt-[12vh] px-4">
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md">

              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h2 className="text-white text-lg font-semibold">
                    {isAuthenticated ? `${tx.welcome} ${user?.name || ''}` : (mode === 'login' ? tx.login : tx.register)}
                  </h2>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1" data-testid="auth-close">
                    <X size={18} strokeWidth={1.5} />
                  </button>
                </div>

                {isAuthenticated ? (
                  /* Account panel */
                  <div className="px-6 pb-6 space-y-1">
                    <div className="py-3 border-t border-white/10">
                      <p className="text-white/50 text-sm mb-4">{user?.email}</p>
                      {[
                        { icon: UserIcon, label: tx.account, href: '#' },
                        { icon: Settings, label: tx.settings, href: '#' },
                      ].map((item, i) => (
                        <a key={i} href={item.href} onClick={onClose}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.07] transition-all text-white/70 hover:text-white group">
                          <item.icon size={17} strokeWidth={1.5} />
                          <span className="text-sm font-medium">{item.label}</span>
                          <ArrowRight size={14} className="ml-auto text-white/20 group-hover:text-white/50 transition-colors" />
                        </a>
                      ))}
                      <button onClick={handleLogout} data-testid="logout-btn"
                        className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-red-500/10 transition-all text-white/50 hover:text-red-400 mt-2">
                        <LogOut size={17} strokeWidth={1.5} />
                        <span className="text-sm font-medium">{tx.logoutBtn}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Login / Register form */
                  <form onSubmit={handleSubmit} className="px-6 pb-6" data-testid="auth-form">
                    <div className="space-y-3 py-3 border-t border-white/10">
                      {error && <div className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}

                      {mode === 'register' && (
                        <div className="relative">
                          <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                          <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required
                            placeholder={tx.name} data-testid="auth-name"
                            className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/25 transition-colors" />
                        </div>
                      )}

                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required
                          placeholder={tx.email} data-testid="auth-email"
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/25 transition-colors" />
                      </div>

                      {mode === 'register' && (
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                          <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                            placeholder={tx.phone} data-testid="auth-phone"
                            className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/25 transition-colors" />
                        </div>
                      )}

                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input type="password" value={form.password} onChange={e => update('password', e.target.value)} required
                          placeholder={tx.password} data-testid="auth-password"
                          className="w-full bg-white/[0.06] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/25 outline-none focus:border-white/25 transition-colors" />
                      </div>

                      {mode === 'login' && (
                        <button type="button" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                          {tx.forgotPw}
                        </button>
                      )}

                      <button type="submit" disabled={loading} data-testid="auth-submit"
                        className="group relative w-full py-3 rounded-xl text-white text-sm font-semibold overflow-hidden transition-all duration-500 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] disabled:opacity-50">
                        <span className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl group-hover:bg-white/[0.16] transition-all duration-500" />
                        <span className="relative flex items-center justify-center gap-2">
                          {loading ? '...' : (mode === 'login' ? tx.loginBtn : tx.registerBtn)}
                          <ArrowRight size={15} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </button>
                    </div>

                    <div className="text-center pt-3 border-t border-white/10 mt-3">
                      <span className="text-white/30 text-xs">
                        {mode === 'login' ? tx.noAccount : tx.hasAccount}{' '}
                      </span>
                      <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                        className="text-white text-xs font-semibold hover:underline">
                        {mode === 'login' ? tx.createOne : tx.connect}
                      </button>
                    </div>
                  </form>
                )}
              </div>

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
