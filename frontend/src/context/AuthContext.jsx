import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, tokenStore } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!tokenStore.get())

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return setLoading(false)
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch {
      tokenStore.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleAuth = ({ token, user }) => {
    tokenStore.set(token)
    setUser(user)
    return user
  }

  const login = async (email, password) => handleAuth((await api.post('/auth/login', { email, password })).data)
  const register = async (payload) => handleAuth((await api.post('/auth/register', payload)).data)
  const logout = () => {
    tokenStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
