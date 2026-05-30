import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const expiryInterval = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('shrink_token')
    if (!token) {
      setLoading(false)
      return
    }
    getMe()
      .then(res => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('shrink_token')
        localStorage.removeItem('shrink_expires')
      })
      .finally(() => setLoading(false))
  }, [])

  function startExpiryWatch() {
    clearInterval(expiryInterval.current)
    expiryInterval.current = setInterval(() => {
      const expires = localStorage.getItem('shrink_expires')
      if (expires && Date.now() >= new Date(expires).getTime()) {
        logout()
        window.location.href = '/login'
      }
    }, 10_000)
  }

  function saveSession(data) {
    localStorage.setItem('shrink_token', data.access_token)
    localStorage.setItem('shrink_expires', data.expires_at)
    setUser(data.user)
    startExpiryWatch()
  }

  function logout() {
    clearInterval(expiryInterval.current)
    localStorage.removeItem('shrink_token')
    localStorage.removeItem('shrink_expires')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, saveSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
