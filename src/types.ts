export type IconName =
  | 'grid' | 'bag' | 'users' | 'chart' | 'message' | 'table' | 'wallet'
  | 'chef' | 'cash' | 'phone' | 'search' | 'bell' | 'arrow' | 'clock'
  | 'check' | 'plus' | 'more' | 'calendar' | 'download' | 'settings'
  | 'lock' | 'logout' | 'close' | 'edit' | 'trash' | 'image'

export type Role = 'owner' | 'admin' | 'cashier' | 'kitchen' | 'waiter' | 'client'

export type StaffRole = Exclude<Role, 'client'>

export const STAFF_ROLES: StaffRole[] = ['owner', 'admin', 'cashier', 'kitchen', 'waiter']

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  cashier: 'Caja',
  kitchen: 'Cocina',
  waiter: 'Mozos',
  client: 'Cliente',
}

export type PanelType = 'admin' | 'kitchen' | 'cashier' | 'waiter' | 'client'

export const PANEL_LABELS: Record<PanelType, string> = {
  admin: 'Admin',
  kitchen: 'Cocina',
  cashier: 'Caja',
  waiter: 'Mozos',
  client: 'Cliente',
}

export const PANEL_ICONS: Record<PanelType, IconName> = {
  admin: 'grid',
  kitchen: 'chef',
  cashier: 'cash',
  waiter: 'bell',
  client: 'phone',
}

export function roleCanAccessPanel(role: Role, panel: PanelType): boolean {
  if (role === 'owner') return true
  if (role === 'admin' && panel === 'admin') return true
  if (role === 'kitchen' && panel === 'kitchen') return true
  if (role === 'cashier' && panel === 'cashier') return true
  if (role === 'waiter' && panel === 'waiter') return true
  if (role === 'client' && panel === 'client') return true
  return false
}

export type OrderStatus =
  | 'pending_review'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'pending_payment'
  | 'paid'
  | 'cancelled'

export type PaymentStatus =
  | 'pending'
  | 'pending_verification'
  | 'under_review'
  | 'paid'
  | 'rejected'
  | 'voided'

export type PaymentMethod = 'cash' | 'yape'

export type EmployeeStatus = 'active' | 'inactive'

export interface Employee {
  uid: string
  email: string
  fullName: string
  role: StaffRole
  status: EmployeeStatus
  createdAt: number
}

export interface AuthUser {
  uid: string
  email: string | null
  role: Role | null
  isAnonymous: boolean
  activePanel: PanelType
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
  isAvailable: boolean
  createdAt: number
}

export interface Category {
  id: string
  name: string
  order: number
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  tableId: string
  clientId: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  notes: string
  createdAt: number
  acceptedAt: number | null
  preparedAt: number | null
  deliveredAt: number | null
}

export interface Payment {
  id: string
  orderId: string
  clientId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference: string
  proofUrl: string | null
  verifiedBy: string | null
  verifiedAt: number | null
  createdAt: number
}

export interface TableInfo {
  id: string
  number: string
  status: 'free' | 'busy' | 'prep' | 'ready' | 'due'
  seats: number
  createdAt: number
}

export interface ServiceRequest {
  id: string
  tableId: string
  tableNumber: string
  clientId: string
  request: string
  comment: string
  status: 'pending' | 'attending' | 'done'
  attendedBy: string | null
  attendedAt: number | null
  createdAt: number
}
