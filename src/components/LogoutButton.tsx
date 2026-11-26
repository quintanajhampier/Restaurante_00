import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Icon } from './Icon'
import { ROLE_LABELS, PANEL_LABELS, PANEL_ICONS } from '../types'
import type { Role, PanelType } from '../types'

const OWNER_PANELS: PanelType[] = ['admin', 'kitchen', 'cashier', 'waiter', 'client']

export function LogoutButton({ role }: { role: Role }) {
  const { logout, user, setActivePanel } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'CM'
  const label = ROLE_LABELS[role] || 'Usuario'
  const isOwner = role === 'owner'

  if (isOwner && !confirming && !showSwitcher) {
    return (
      <div className="floating-role">
        <div className="role-switcher">
          <div className="role-info">
            <div className="avatar">{initials}</div>
            <span>{label}</span>
          </div>
          <button onClick={() => setShowSwitcher(true)}>
            <Icon name="grid" size={16} />
            <span>Cambiar panel</span>
          </button>
          <button onClick={() => setConfirming(true)}>
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (isOwner && showSwitcher) {
    return (
      <div className="floating-role">
        <div className="role-switcher panel-switcher">
          {OWNER_PANELS.map((panel) => (
            <button
              key={panel}
              className={user?.activePanel === panel ? 'active' : ''}
              onClick={() => { setActivePanel(panel); setShowSwitcher(false) }}
            >
              <Icon name={PANEL_ICONS[panel]} size={16} />
              <span>{PANEL_LABELS[panel]}</span>
            </button>
          ))}
          <button onClick={() => setShowSwitcher(false)}>
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (confirming) {
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
