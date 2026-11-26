import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db, auth } from './firebase'
import type { MenuItem, Category, TableInfo, Order, ServiceRequest, OrderItem, Payment } from '../types'

export function subscribeProducts(onData: (items: MenuItem[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'products'), (snap) => {
    const items: MenuItem[] = []
    snap.forEach((d) => {
      const data = d.data()
      items.push({
        id: d.id,
        name: data.name ?? '',
        description: data.description ?? '',
        price: data.price ?? 0,
        category: data.category ?? '',
        imageUrl: data.imageUrl ?? '',
        isAvailable: data.isAvailable ?? false,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      })
    })
    items.sort((a, b) => a.name.localeCompare(b.name))
    onData(items)
  })
}

export function subscribeAvailableProducts(onData: (items: MenuItem[]) => void): Unsubscribe {
  const q = query(collection(db, 'products'), where('isAvailable', '==', true))
  return onSnapshot(q, (snap) => {
    const items: MenuItem[] = []
    snap.forEach((d) => {
      const data = d.data()
      items.push({
        id: d.id,
        name: data.name ?? '',
        description: data.description ?? '',
        price: data.price ?? 0,
        category: data.category ?? '',
        imageUrl: data.imageUrl ?? '',
        isAvailable: true,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      })
    })
    items.sort((a, b) => a.name.localeCompare(b.name))
    onData(items)
  })
}

export function subscribeCategories(onData: (cats: Category[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'categories'), (snap) => {
    const cats: Category[] = []
    snap.forEach((d) => {
      const data = d.data()
      cats.push({ id: d.id, name: data.name ?? '', order: data.order ?? 0 })
    })
    cats.sort((a, b) => a.order - b.order)
    onData(cats)
  })
}

export async function createProduct(data: Omit<MenuItem, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'products'), {
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    imageUrl: data.imageUrl,
    isAvailable: data.isAvailable,
    createdAt: serverTimestamp(),
  })
}

export async function updateProduct(id: string, data: Partial<Omit<MenuItem, 'id' | 'createdAt'>>): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.description !== undefined) update.description = data.description
  if (data.price !== undefined) update.price = data.price
  if (data.category !== undefined) update.category = data.category
  if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl
  if (data.isAvailable !== undefined) update.isAvailable = data.isAvailable
  await updateDoc(doc(db, 'products', id), update)
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id))
}

export async function createCategory(name: string, order: number): Promise<void> {
  await addDoc(collection(db, 'categories'), { name, order })
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id))
}

export function subscribeTables(onData: (tables: TableInfo[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'tables'), (snap) => {
    const tables: TableInfo[] = []
    snap.forEach((d) => {
      const data = d.data()
      tables.push({
        id: d.id,
        number: data.number ?? d.id,
        status: data.status ?? 'free',
        seats: data.seats ?? 4,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      })
    })
    tables.sort((a, b) => a.number.localeCompare(b.number))
    onData(tables)
  })
}

export async function createTable(number: string, seats: number): Promise<void> {
  await addDoc(collection(db, 'tables'), {
    number,
    seats,
    status: 'free',
    createdAt: serverTimestamp(),
  })
}

export async function updateTableStatus(id: string, status: TableInfo['status']): Promise<void> {
  await updateDoc(doc(db, 'tables', id), { status })
}

export async function deleteTable(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tables', id))
}

export function subscribeOrders(onData: (orders: Order[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'orders'), (snap) => {
    const orders: Order[] = []
    snap.forEach((d) => {
      const data = d.data()
      orders.push({
        id: d.id,
        tableId: data.tableId ?? '',
        clientId: data.clientId ?? '',
        items: data.items ?? [],
        totalAmount: data.totalAmount ?? 0,
        status: data.status ?? 'pending_review',
        notes: data.notes ?? '',
        createdAt: data.createdAt?.toMillis?.() ?? 0,
        acceptedAt: data.acceptedAt?.toMillis?.() ?? null,
        preparedAt: data.preparedAt?.toMillis?.() ?? null,
        deliveredAt: data.deliveredAt?.toMillis?.() ?? null,
      })
    })
    orders.sort((a, b) => b.createdAt - a.createdAt)
    onData(orders)
  })
}

export function subscribeClientOrders(onData: (orders: Order[]) => void): Unsubscribe {
  const uid = auth.currentUser?.uid
  if (!uid) {
    onData([])
    return () => {}
  }
  const q = query(collection(db, 'orders'), where('clientId', '==', uid))
  return onSnapshot(q, (snap) => {
    const orders: Order[] = []
    snap.forEach((d) => {
      const data = d.data()
      orders.push({
        id: d.id,
        tableId: data.tableId ?? '',
        clientId: data.clientId ?? '',
        items: data.items ?? [],
        totalAmount: data.totalAmount ?? 0,
        status: data.status ?? 'pending_review',
        notes: data.notes ?? '',
        createdAt: data.createdAt?.toMillis?.() ?? 0,
        acceptedAt: data.acceptedAt?.toMillis?.() ?? null,
        preparedAt: data.preparedAt?.toMillis?.() ?? null,
        deliveredAt: data.deliveredAt?.toMillis?.() ?? null,
      })
    })
    orders.sort((a, b) => b.createdAt - a.createdAt)
    onData(orders)
  })
}

export async function createOrder(tableId: string, items: OrderItem[], notes: string): Promise<string> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('No hay usuario autenticado.')
  const docRef = await addDoc(collection(db, 'orders'), {
    tableId,
    clientId: uid,
    items,
    totalAmount: 0,
    status: 'pending_review',
    notes,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  const update: Record<string, unknown> = { status }
  if (status === 'preparing') update.preparedAt = serverTimestamp()
  await updateDoc(doc(db, 'orders', id), update)
}

export function subscribeServiceRequests(onData: (reqs: ServiceRequest[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'service_requests'), (snap) => {
    const reqs: ServiceRequest[] = []
    snap.forEach((d) => {
      const data = d.data()
      reqs.push({
        id: d.id,
        tableId: data.tableId ?? '',
        tableNumber: data.tableNumber ?? '',
        clientId: data.clientId ?? '',
        request: data.request ?? '',
        comment: data.comment ?? '',
        status: data.status ?? 'pending',
        attendedBy: data.attendedBy ?? null,
        attendedAt: data.attendedAt?.toMillis?.() ?? null,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      })
    })
    reqs.sort((a, b) => b.createdAt - a.createdAt)
    onData(reqs)
  })
}

export async function createServiceRequest(tableId: string, tableNumber: string, request: string, comment: string): Promise<void> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('No hay usuario autenticado.')
  await addDoc(collection(db, 'service_requests'), {
    tableId,
    tableNumber,
    clientId: uid,
    request,
    comment,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function updateServiceRequestStatus(id: string, status: ServiceRequest['status']): Promise<void> {
  const update: Record<string, unknown> = { status }
  if (status === 'attending' || status === 'done') {
    update.attendedBy = auth.currentUser?.uid ?? null
    update.attendedAt = serverTimestamp()
  }
  await updateDoc(doc(db, 'service_requests', id), update)
}

export async function createPayment(orderId: string, amount: number, method: Payment['method'], reference: string, proofUrl: string | null): Promise<void> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('No hay usuario autenticado.')
  await setDoc(doc(collection(db, 'payments')), {
    orderId,
    clientId: uid,
    amount,
    method,
    status: 'pending_verification',
    reference,
    proofUrl,
    verifiedBy: null,
    verifiedAt: null,
    createdAt: serverTimestamp(),
  })
}
