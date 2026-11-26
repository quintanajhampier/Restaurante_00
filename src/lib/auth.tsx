import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { AuthUser, Role, StaffRole, PanelType } from '../types'
import { roleCanAccessPanel } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  error: string | null
  loginStaff: (email: string, password: string, panel: PanelType) => Promise<void>
  loginClient: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setActivePanel: (panel: PanelType) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchUserRole(uid: string): Promise<Role | null> {
  const employeeDoc = await getDoc(doc(db, 'employees', uid))
  if (employeeDoc.exists()) {
    const data = employeeDoc.data()
    if (data.role && data.status === 'active') {
      return data.role as StaffRole
    }
    return null
  }
  return null
}

const ROLE_TO_DEFAULT_PANEL: Record<StaffRole, PanelType> = {
  owner: 'admin',
  admin: 'admin',
  kitchen: 'kitchen',
  cashier: 'cashier',
  waiter: 'waiter',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      setError(null)
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      if (firebaseUser.isAnonymous) {
        setUser({
          uid: firebaseUser.uid,
          email: null,
          role: 'client',
          isAnonymous: true,
          activePanel: 'client',
        })
        setLoading(false)
        return
      }

      try {
        const role = await fetchUserRole(firebaseUser.uid)
        if (!role || role === 'client') {
          await signOut(auth)
          setError('Tu cuenta no tiene un rol asignado o está inactiva. Contacta al propietario.')
          setUser(null)
        } else {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role,
            isAnonymous: false,
            activePanel: ROLE_TO_DEFAULT_PANEL[role as StaffRole] ?? 'admin',
          })
        }
      } catch {
        setError('No se pudo verificar tu permiso de acceso. Intenta nuevamente.')
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginStaff = useCallback(async (email: string, password: string, panel: PanelType) => {
    setError(null)
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const role = await fetchUserRole(credential.user.uid)
      if (!role || role === 'client') {
        await signOut(auth)
        throw new Error('Tu cuenta no tiene un rol asignado o está inactiva. Contacta al propietario.')
      }
      if (!roleCanAccessPanel(role, panel)) {
        await signOut(auth)
        const panelLabels: Record<PanelType, string> = {
          admin: 'Admin', kitchen: 'Cocina', cashier: 'Caja', waiter: 'Mozos', client: 'Cliente',
        }
        throw new Error(`Tu rol no tiene acceso al panel de ${panelLabels[panel]}.`)
      }
      setUser({
        uid: credential.user.uid,
        email: credential.user.email,
        role,
        isAnonymous: false,
        activePanel: panel,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión.'
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
        setError('Correo o contraseña incorrectos.')
      } else if (message.includes('auth/user-not-found')) {
        setError('No existe una cuenta con este correo.')
      } else if (message.includes('auth/too-many-requests')) {
        setError('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')
      } else if (message.includes('auth/invalid-email')) {
        setError('El correo electrónico no es válido.')
      } else if (message.includes('auth/network-request-failed')) {
        setError('Sin conexión. Verifica tu internet e inténtalo de nuevo.')
      } else {
        setError(message)
      }
      throw err
    }
  }, [])

  const loginClient = useCallback(async () => {
    setError(null)
    try {
      await signInAnonymously(auth)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión anónima.'
      if (message.includes('auth/operation-not-allowed')) {
        setError('El inicio de sesión anónimo no está habilitado en Firebase Console.')
      } else {
        setError(message)
      }
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    await signOut(auth)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al enviar el correo.'
      if (message.includes('auth/user-not-found')) {
        setError('No existe una cuenta con este correo.')
      } else if (message.includes('auth/invalid-email')) {
        setError('El correo electrónico no es válido.')
      } else {
        setError(message)
      }
      throw err
    }
  }, [])

  const setActivePanel = useCallback((panel: PanelType) => {
    setUser((prev) => prev ? { ...prev, activePanel: panel } : prev)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, loginStaff, loginClient, logout, resetPassword, setActivePanel }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
