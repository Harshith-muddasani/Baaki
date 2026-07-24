import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { usersApi } from '@/lib/api'
import type { UserResponse } from '@/lib/types'

const STORAGE_KEY = 'baaki_current_user_id'

interface AuthContextValue {
  currentUser: UserResponse | null
  isLoading: boolean
  login: (user: UserResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * There is no /auth/login endpoint yet (see CLAUDE.md / spec §4) - this is a
 * deliberate stand-in that simulates a session by remembering which existing
 * user you're "acting as", with no password verification on re-entry. Good
 * enough to demo the product; not how a real login works.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY)
    if (!storedId) {
      setIsLoading(false)
      return
    }
    usersApi
      .get(Number(storedId))
      .then(setCurrentUser)
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setIsLoading(false))
  }, [])

  const login = (user: UserResponse) => {
    localStorage.setItem(STORAGE_KEY, String(user.id))
    setCurrentUser(user)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
