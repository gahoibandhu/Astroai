// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react'
import { getSavedUser, signInWithGoogle, signOutUser } from '../utils/googleAuth'
import { upsertUser } from '../utils/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = getSavedUser()
    if (saved) {
      setUser(saved)
      upsertUser(saved).catch(console.error)
    }
    setLoading(false)
  }, [])

  const login = async () => {
    const userData = await signInWithGoogle()
    setUser(userData)
    await upsertUser(userData).catch(console.error)
    return userData
  }

  const logout = () => {
    signOutUser()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
