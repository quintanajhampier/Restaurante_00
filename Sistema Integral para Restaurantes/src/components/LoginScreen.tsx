import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Icon } from './Icon'

export function LoginScreen() {
  const { loginStaff, loginClient, resetPassword, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [clientLoading, setClientLoading] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const displayError = localError || error

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email.trim() || !password) {
      setLocalError('Completa tu correo y contraseña.')
      return
    }

    setLoading(true)
    try {
      await loginStaff(email.trim(), password)
    } catch {
      // el error se establece en el contexto
    } finally {
      setLoading(false)
    }
  }

  const handleClientLogin = async () => {
    setLocalError(null)
    setClientLoading(true)
    try {
      await loginClient()
    } catch {
      // el error se establece en el contexto
    } finally {
      setClientLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    if (!email.trim()) {
      setLocalError('Escribe tu correo para enviar el enlace.')
      return
    }
    try {
      await resetPassword(email.trim())
      setResetSent(true)
    } catch {
      // el error se establece en el contexto
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo-mark">S</div>
          <div>
            <strong>Salvia</strong>
            <span>RESTAURANT OS</span>
          </div>
        </div>

        {!showReset ? (
          <>
            <h1 className="login-title">Acceso del personal</h1>
            <p className="login-subtitle">Casa Misti · Sistema integral de gestión</p>

            <form className="login-form" onSubmit={handleStaffLogin}>
              <label className="login-field">
                <span>Correo</span>
                <div className="login-input-wrap">
                  <Icon name="users" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@casamisti.pe"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="login-field">
                <span>Contraseña</span>
                <div className="login-input-wrap">
                  <Icon name="lock" size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </label>

              {displayError && <div className="login-error">{displayError}</div>}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Verificando…' : 'Iniciar sesión'}
                {!loading && <Icon name="arrow" size={16} />}
              </button>

              <button
                type="button"
                className="login-reset-link"
                onClick={() => setShowReset(true)}
                disabled={loading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </form>

            <div className="login-divider" />

            <div className="login-client-section">
              <p>¿Eres cliente de una mesa?</p>
              <button
                type="button"
                className="login-client-btn"
                onClick={handleClientLogin}
                disabled={clientLoading}
              >
                {clientLoading ? 'Conectando…' : 'Entrar al menú QR'}
                {!clientLoading && <Icon name="phone" size={16} />}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="login-title">Recuperar contraseña</h1>
            <p className="login-subtitle">Te enviaremos un enlace a tu correo</p>

            {resetSent ? (
              <div className="login-success">
                <div className="login-success-icon"><Icon name="check" size={24} /></div>
                <h2>Correo enviado</h2>
                <p>Revisa tu bandeja y sigue las instrucciones para restablecer tu contraseña.</p>
                <button className="login-submit" onClick={() => { setShowReset(false); setResetSent(false) }}>
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <form className="login-form" onSubmit={handleResetPassword}>
                <label className="login-field">
                  <span>Correo</span>
                  <div className="login-input-wrap">
                    <Icon name="users" size={16} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@casamisti.pe"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </label>

                {displayError && <div className="login-error">{displayError}</div>}

                <button type="submit" className="login-submit" disabled={loading}>
                  Enviar enlace
                  <Icon name="arrow" size={16} />
                </button>

                <button
                  type="button"
                  className="login-reset-link"
                  onClick={() => setShowReset(false)}
                >
                  Volver al inicio de sesión
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
