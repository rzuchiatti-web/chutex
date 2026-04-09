import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()
const API = import.meta.env.REACT_APP_BACKEND_URL || ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('chutex_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(u => setUser(u))
        .catch(() => { localStorage.removeItem('chutex_token'); setToken(null); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Erreur de connexion')
    localStorage.setItem('chutex_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async ({ name, email, phone, password, role }) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, role: role || 'beneficiary' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : "Erreur d'inscription")
    localStorage.setItem('chutex_token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('chutex_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
