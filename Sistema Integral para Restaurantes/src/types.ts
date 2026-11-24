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
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
  isAvailable: boolean
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
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference: string
  verifiedBy: string | null
  verifiedAt: number | null
  createdAt: number
}
