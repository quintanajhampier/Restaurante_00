import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Icon } from './Icon'
import { ROLE_LABELS } from '../types'
import type { Role } from '../types'

export function LogoutButton({ role }: { role: Role }) {
  const { logout, user } = useAuth()
  const [confirming, setConfirming] = useState(false)

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'CM'
  const label = ROLE_LABELS[role] || 'Usuario'

  if (!confirming) {
    return (
      <div className="floating-role">
        <div className="role-switcher">
          <div className="role-info">
            <div className="avatar">{initials}</div>
            <span>{label}</span>
          </div>
          <button onClick={() => setConfirming(true)}>
            <Icon name="logout" size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="floating-role">
      <div className="role-switcher logout-confirm">
        <span>¿Cerrar sesión?</span>
        <button className="confirm-yes" onClick={() => logout()}>
          <Icon name="check" size={15} /> Sí
        </button>
        <button className="confirm-no" onClick={() => setConfirming(false)}>
          No
        </button>
      </div>
    </div>
  )
}
