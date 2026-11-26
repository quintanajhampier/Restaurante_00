import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Icon } from './Icon'
import type { PanelType } from '../types'
import { PANEL_LABELS, PANEL_ICONS } from '../types'

const PANELS: PanelType[] = ['admin', 'kitchen', 'cashier', 'waiter', 'client']

const PANEL_DESCRIPTIONS: Record<PanelType, string> = {
  admin: 'Gestión completa del restaurante',
  kitchen: 'Pedidos y preparación',
  cashier: 'Cobros y cuentas',
  waiter: 'Atención a mesas',
  client: 'Menú QR del cliente',
}

export function LoginScreen() {
  const { loginStaff, loginClient, resetPassword, error } = useAuth()
  const [selectedPanel, setSelectedPanel] = useState<PanelType | null>(null)
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
    if (!selectedPanel || selectedPanel === 'client') return

    if (!email.trim() || !password) {
      setLocalError('Completa tu correo y contraseña.')
      return
    }

    setLoading(true)
    try {
      await loginStaff(email.trim(), password, selectedPanel)
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

  const handleSelectPanel = (panel: PanelType) => {
    setSelectedPanel(panel)
    setLocalError(null)
    if (panel === 'client') {
      handleClientLogin()
    }
  }

  // Reset password view
  if (showReset) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="logo-mark">S</div>
            <div><strong>Salvia</strong><span>RESTAURANT OS</span></div>
          </div>
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
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@casamisti.pe" autoComplete="email" />
                </div>
              </label>
              {displayError && <div className="login-error">{displayError}</div>}
              <button type="submit" className="login-submit">Enviar enlace <Icon name="arrow" size={16} /></button>
              <button type="button" className="login-reset-link" onClick={() => setShowReset(false)}>Volver al inicio de sesión</button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Panel selector view
  if (!selectedPanel) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="logo-mark">S</div>
            <div><strong>Salvia</strong><span>RESTAURANT OS</span></div>
          </div>
          <h1 className="login-title">¿A qué panel quieres entrar?</h1>
          <p className="login-subtitle">Casa Misti · Selecciona tu área</p>
          <div className="panel-selector">
            {PANELS.map((panel) => (
              <button key={panel} className="panel-option" onClick={() => handleSelectPanel(panel)} disabled={clientLoading && panel === 'client'}>
                <div className="panel-option-icon"><Icon name={PANEL_ICONS[panel]} size={22} /></div>
                <div className="panel-option-text">
                  <strong>{PANEL_LABELS[panel]}</strong>
                  <span>{PANEL_DESCRIPTIONS[panel]}</span>
                </div>
                <Icon name="arrow" size={16} />
              </button>
            ))}
          </div>
          {displayError && <div className="login-error">{displayError}</div>}
        </div>
      </div>
    )
  }

  // Staff login form (admin, kitchen, cashier, waiter)
  const isClientPanel = selectedPanel === 'client'
  if (isClientPanel) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="logo-mark">S</div>
            <div><strong>Salvia</strong><span>RESTAURANT OS</span></div>
          </div>
          <div className="login-loading">
            <div className="login-spinner" />
            <p>Conectando al menú QR…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="logo-mark">S</div>
          <div><strong>Salvia</strong><span>RESTAURANT OS</span></div>
        </div>

        <button className="panel-back" onClick={() => { setSelectedPanel(null); setLocalError(null) }}>
          <Icon name="arrow" size={14} /> Cambiar panel
        </button>

        <h1 className="login-title">Acceso a {PANEL_LABELS[selectedPanel]}</h1>
        <p className="login-subtitle">{PANEL_DESCRIPTIONS[selectedPanel]}</p>

        <form className="login-form" onSubmit={handleStaffLogin}>
          <label className="login-field">
            <span>Correo</span>
            <div className="login-input-wrap">
              <Icon name="users" size={16} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@casamisti.pe" autoComplete="email" disabled={loading} />
            </div>
          </label>
          <label className="login-field">
            <span>Contraseña</span>
            <div className="login-input-wrap">
              <Icon name="lock" size={16} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" disabled={loading} />
            </div>
          </label>
          {displayError && <div className="login-error">{displayError}</div>}
          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Verificando…' : `Entrar a ${PANEL_LABELS[selectedPanel]}`}
            {!loading && <Icon name="arrow" size={16} />}
          </button>
          <button type="button" className="login-reset-link" onClick={() => setShowReset(true)} disabled={loading}>
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </div>
  )
}
