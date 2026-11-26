import { useState, useEffect, useRef } from 'react'
import { Icon } from './components/Icon'
import { LogoutButton } from './components/LogoutButton'
import { useAuth } from './lib/auth'
import { firebaseInitError } from './lib/firebase'
import { LoginScreen } from './components/LoginScreen'
import type { IconName, Role, PanelType, MenuItem, Category, TableInfo, Order, ServiceRequest, OrderItem } from './types'
import { ROLE_LABELS } from './types'
import {
  subscribeProducts, subscribeAvailableProducts, subscribeCategories,
  subscribeTables, subscribeOrders, subscribeClientOrders, subscribeServiceRequests,
  createProduct, updateProduct, deleteProduct, createCategory, deleteCategory,
  createTable, updateTableStatus, deleteTable,
  createOrder, updateOrderStatus,
  createServiceRequest, updateServiceRequestStatus,
} from './lib/firestore'
import { uploadProductImage, uploadPaymentProof } from './lib/storage'

const adminNav = [
  ['dashboard', 'Vista general', 'grid'], ['products', 'Productos', 'bag'],
  ['employees', 'Equipo y permisos', 'users'], ['reports', 'Ventas y reportes', 'chart'],
  ['reviews', 'Reseñas privadas', 'message'], ['tables', 'Mesas y QR', 'table'],
  ['expenses', 'Gastos e insumos', 'wallet'],
] as const

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo-wrap"><div className="logo-mark">S</div>{!compact && <div><strong>Salvia</strong><span>RESTAURANT OS</span></div>}</div>
}

function TopBar({ title, subtitle }: { title: string; subtitle: string }) {
  const { user } = useAuth()
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'CM'
  const label = user?.role ? ROLE_LABELS[user.role] : 'Administradora'
  return <header className="topbar">
    <div><p className="eyebrow">{subtitle}</p><h1>{title}</h1></div>
    <div className="top-actions">
      <div className="live"><i/> Operación en vivo</div>
      <button className="icon-button"><Icon name="bell"/><b>3</b></button>
      <div className="avatar">{initials}</div>
      <div className="user-meta"><strong>{user?.email || 'Casa Misti'}</strong><span>{label}</span></div>
    </div>
  </header>
}

function AdminDashboard() {
  const metrics = [
    ['Ventas de hoy', 'S/ 4,280', '+12.5%', 'spark-a'],
    ['Pedidos', '128', '9 activos', 'spark-b'],
    ['Mesas ocupadas', '12 / 18', '67%', 'spark-c'],
    ['Ticket promedio', 'S/ 33.40', '+4.2%', 'spark-d'],
  ]
  return <div className="dashboard">
    <section className="metric-grid">
      {metrics.map((m, i) => <article className="metric-card" key={m[0]}>
        <div className={`metric-icon m${i}`}><Icon name={i === 0 ? 'wallet' : i === 1 ? 'bag' : i === 2 ? 'table' : 'chart'}/></div>
        <p>{m[0]}</p><div className="metric-value"><strong>{m[1]}</strong><span className={i === 1 ? 'neutral' : ''}>{m[2]}</span></div>
        <div className={`mini-spark ${m[3]}`}><i/><i/><i/><i/><i/><i/><i/><i/></div>
      </article>)}
    </section>
    <section className="dashboard-grid">
      <article className="panel sales-panel">
        <div className="panel-head"><div><p className="eyebrow">RENDIMIENTO</p><h2>Ventas de la semana</h2></div><button className="select-button"><Icon name="calendar"/> 11–17 Nov. <span>⌄</span></button></div>
        <div className="chart-summary"><strong>S/ 24,860</strong><span>+8.4% vs. semana anterior</span></div>
        <div className="bar-chart">
          {[52, 67, 58, 80, 72, 94, 66].map((h, i) => <div className="bar-col" key={i}><div className="bar-track"><i style={{height: `${h}%`}} className={i === 5 ? 'focus' : ''}/></div><span>{['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][i]}</span></div>)}
        </div>
      </article>
      <article className="panel activity-panel">
        <div className="panel-head"><div><p className="eyebrow">AHORA</p><h2>Actividad en vivo</h2></div><button className="text-button">Ver todo <Icon name="arrow" size={15}/></button></div>
        {[
          ['#1048', 'Mesa 07', 'En preparación', 'amber', '2 min'],
          ['#1047', 'Mesa 03', 'Listo para entregar', 'green', '5 min'],
          ['#1046', 'Mesa 11', 'Pendiente de pago', 'purple', '12 min'],
          ['#1045', 'Mesa 02', 'Pedido aceptado', 'blue', '14 min'],
        ].map((a) => <div className="activity-row" key={a[0]}><div className={`status-dot ${a[3]}`}/><div><strong>{a[0]} · {a[1]}</strong><span>{a[2]}</span></div><time>{a[4]}</time></div>)}
      </article>
      <article className="panel top-products">
        <div className="panel-head"><div><p className="eyebrow">MENÚ</p><h2>Más vendidos</h2></div><button className="text-button">Gestionar</button></div>
        {[
          { n: 'Arroz chaufa', u: 42, v: 1176 }, { n: 'Lomo saltado', u: 35, v: 1260 }, { n: 'Ceviche', u: 29, v: 986 },
        ].map((d, i) => <div className="product-rank" key={d.n}><b>0{i+1}</b><img src="/assets/chaufa.png"/><div><strong>{d.n}</strong><span>{d.u} unidades</span></div><em>S/ {d.v.toLocaleString()}</em></div>)}
      </article>
      <article className="panel payment-split">
        <div className="panel-head"><div><p className="eyebrow">COBROS</p><h2>Métodos de pago</h2></div></div>
        <div className="donut"><div><strong>128</strong><span>pagos</span></div></div>
        <div className="legend"><p><i className="cash-color"/>Efectivo <strong>S/ 2,610</strong><span>61%</span></p><p><i className="yape-color"/>Yape <strong>S/ 1,670</strong><span>39%</span></p></div>
      </article>
    </section>
  </div>
}

function ProductsView() {
  const [products, setProducts] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const unsubP = subscribeProducts((items) => { setProducts(items); setLoading(false) })
    const unsubC = subscribeCategories((cats) => setCategories(cats))
    return () => { unsubP(); unsubC() }
  }, [])

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCat === 'all' || p.category === activeCat
    return matchesSearch && matchesCat
  })

  const catCount = (catId: string) => catId === 'all' ? products.length : products.filter((p) => p.category === catId).length

  return <div className="module-view">
    <div className="module-toolbar">
      <div className="search"><Icon name="search"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto o categoría"/></div>
      <button className="primary" onClick={() => { setEditing(null); setShowForm(true) }}><Icon name="plus"/> Nuevo producto</button>
    </div>
    <div className="category-tabs">
      <button className={activeCat === 'all' ? 'active' : ''} onClick={() => setActiveCat('all')}>Todos <b>{catCount('all')}</b></button>
      {categories.map((c) => <button key={c.id} className={activeCat === c.id ? 'active' : ''} onClick={() => setActiveCat(c.id)}>{c.name} <b>{catCount(c.id)}</b></button>)}
    </div>
    {loading ? <div className="loading-state"><div className="login-spinner"/><p>Cargando productos…</p></div> :
    <div className="table-card">
      <div className="data-row data-head"><span>PRODUCTO</span><span>CATEGORÍA</span><span>PRECIO</span><span>DISPONIBILIDAD</span><span></span><span></span></div>
      {filtered.length === 0 ? <div className="empty-state"><p>No hay productos para mostrar.</p></div> :
      filtered.map((p) => <div className="data-row" key={p.id}>
        <span className="product-cell"><img src={p.imageUrl || '/assets/chaufa.png'}/><span><strong>{p.name}</strong><small>{p.description}</small></span></span>
        <span>{categories.find((c) => c.id === p.category)?.name || 'Sin categoría'}</span>
        <strong>S/ {p.price.toFixed(2)}</strong>
        <span><i className={`toggle ${p.isAvailable ? 'on' : ''}`} /> {p.isAvailable ? 'Disponible' : 'Agotado'}</span>
        <span></span>
        <div className="row-actions">
          <button className="icon-button" onClick={() => { setEditing(p); setShowForm(true) }}><Icon name="edit" size={14}/></button>
          <button className="icon-button" onClick={async () => { if (confirm(`¿Eliminar "${p.name}"?`)) await deleteProduct(p.id) }}><Icon name="trash" size={14}/></button>
        </div>
      </div>)}
    </div>}
    {showForm && <ProductForm product={editing} categories={categories} onClose={() => setShowForm(false)} />}
  </div>
}

function ProductForm({ product, categories, onClose }: { product: MenuItem | null; categories: Category[]; onClose: () => void }) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price ?? 0)
  const [category, setCategory] = useState(product?.category ?? (categories[0]?.id ?? ''))
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true)
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const url = await uploadProductImage(file)
      setImageUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    if (!name.trim()) { setError('El nombre es obligatorio.'); return }
    if (price < 0) { setError('El precio no puede ser negativo.'); return }
    setSaving(true)
    try {
      const data = { name: name.trim(), description: description.trim(), price, category, imageUrl, isAvailable }
      if (product) {
        await updateProduct(product.id, data)
      } else {
        await createProduct(data)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="product-form-modal" onClick={(e) => e.stopPropagation()}>
      <div className="form-modal-head">
        <h2>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
        <button className="modal-close" onClick={onClose}><Icon name="close" size={18}/></button>
      </div>
      <div className="form-modal-body">
        <label className="form-field"><span>Nombre</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Arroz chaufa especial"/></label>
        <label className="form-field"><span>Descripción</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ingredientes, preparación…"/></label>
        <div className="form-row">
          <label className="form-field"><span>Precio (S/)</span><input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}/></label>
          <label className="form-field"><span>Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              {categories.length === 0 && <option value="">Sin categorías</option>}
            </select>
          </label>
        </div>
        <label className="form-field"><span>Imagen del producto</span>
          <div className="image-upload-area">
            {imageUrl && <img src={imageUrl} className="image-preview" />}
            <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageUpload} style={{ display: 'none' }} />
            <button type="button" className="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Subiendo…' : imageUrl ? 'Cambiar imagen' : 'Subir imagen (JPG, PNG, WebP · máx. 5 MB)'}
            </button>
          </div>
        </label>
        <label className="form-field"><span>Disponibilidad</span>
          <button type="button" className="toggle-button" onClick={() => setIsAvailable(!isAvailable)}>
            <i className={`toggle ${isAvailable ? 'on' : ''}`} /> {isAvailable ? 'Disponible' : 'Agotado'}
          </button>
        </label>
        {error && <div className="login-error">{error}</div>}
      </div>
      <div className="form-modal-foot">
        <button className="secondary" onClick={onClose}>Cancelar</button>
        <button className="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </div>
  </div>
}

function TablesView() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newNumber, setNewNumber] = useState('')
  const [newSeats, setNewSeats] = useState(4)

  useEffect(() => {
    const unsub = subscribeTables((items) => { setTables(items); setLoading(false) })
    return () => unsub()
  }, [])

  const statusLabels: Record<TableInfo['status'], string> = { free: 'Disponible', busy: 'Ocupada', prep: 'En preparación', ready: 'Pedido listo', due: 'Cuenta pendiente' }

  const handleCreate = async () => {
    if (!newNumber.trim()) return
    await createTable(newNumber.trim(), newSeats)
    setNewNumber('')
    setNewSeats(4)
    setShowForm(false)
  }

  return <div className="module-view">
    <div className="module-toolbar">
      <div className="summary-pills">
        <span><i className="free"/>{tables.filter((t) => t.status === 'free').length} disponibles</span>
        <span><i className="busy"/>{tables.filter((t) => t.status !== 'free').length} ocupadas</span>
      </div>
      <button className="primary" onClick={() => setShowForm(true)}><Icon name="plus"/> Nueva mesa</button>
    </div>
    {loading ? <div className="loading-state"><div className="login-spinner"/><p>Cargando mesas…</p></div> :
    <div className="tables-grid">{tables.map((t) => <article className="table-tile" key={t.id}>
      <div className="table-tile-top"><span>MESA</span>
        <div className="row-actions">
          <button onClick={() => { if (confirm(`¿Eliminar la mesa ${t.number}?`)) deleteTable(t.id) }}><Icon name="trash" size={14}/></button>
        </div>
      </div>
      <strong>{t.number}</strong>
      <span className={`status-badge ${t.status}`}><i/>{statusLabels[t.status]}</span>
      <div className="table-meta"><span>Asientos <b>{t.seats}</b></span></div>
      <div className="fake-qr">{Array.from({ length: 25 }).map((_, i) => <i key={i} className={(i * 7) % 4 === 0 || [0, 1, 5, 6, 18, 19, 23, 24].includes(i) ? 'dark' : ''} />)}</div>
      <select className="tile-action-select" value={t.status} onChange={(e) => updateTableStatus(t.id, e.target.value as TableInfo['status'])}>
        <option value="free">Disponible</option>
        <option value="busy">Ocupada</option>
        <option value="prep">En preparación</option>
        <option value="ready">Pedido listo</option>
        <option value="due">Cuenta pendiente</option>
      </select>
    </article>)}</div>}
    {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}>
      <div className="product-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-modal-head"><h2>Nueva mesa</h2><button className="modal-close" onClick={() => setShowForm(false)}><Icon name="close" size={18}/></button></div>
        <div className="form-modal-body">
          <label className="form-field"><span>Número de mesa</span><input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="Ej. 09"/></label>
          <label className="form-field"><span>Asientos</span><input type="number" min="1" max="20" value={newSeats} onChange={(e) => setNewSeats(parseInt(e.target.value) || 4)}/></label>
        </div>
        <div className="form-modal-foot"><button className="secondary" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary" onClick={handleCreate}>Crear mesa</button></div>
      </div>
    </div>}
  </div>
}

function GenericModule({ view }: { view: string }) {
  const data: Record<string, { title: string; intro: string; icon: IconName; rows: string[][] }> = {
    employees: { title: 'Equipo del restaurante', intro: 'Administra roles, permisos y actividad del personal.', icon: 'users', rows: [['Lucía Torres', 'Caja', 'Activa', 'Hoy, 12:40'], ['Marco Ríos', 'Cocina', 'Activo', 'Hoy, 12:38'], ['Elena Paz', 'Administradora', 'Activa', 'Hoy, 11:52']] },
    reports: { title: 'Ventas y reportes', intro: 'Solo los cobros validados se incluyen como ingresos.', icon: 'chart', rows: [['Ventas cobradas', 'S/ 4,280', '128 operaciones', '+12.5%'], ['Pedidos entregados', '134', '6 por cobrar', '94%'], ['Mesas atendidas', '47', 'Ticket S/ 91.06', '+8.2%']] },
    reviews: { title: 'Reseñas privadas', intro: 'Comentarios visibles únicamente para administradores autorizados.', icon: 'message', rows: [['Calidad de comida', '"El chaufa estuvo excelente"', 'Positiva', 'Revisada'], ['Tiempo de espera', '"Demoró más de 25 minutos"', 'Atención media', 'Pendiente'], ['Limpieza', '"Todo impecable"', 'Positiva', 'Revisada']] },
    expenses: { title: 'Control de gastos e ingredientes', intro: 'Cuaderno administrativo de compras, proveedores e insumos.', icon: 'wallet', rows: [['Arroz superior', '25 kg', 'S/ 112.50', 'Mercado Central'], ['Aceite vegetal', '12 litros', 'S/ 96.00', 'Distribuidora Sol'], ['Verduras mixtas', '18 kg', 'S/ 144.00', 'Huerto Norte']] },
  }
  const d = data[view] || data.reports
  return <div className="module-view">
    <div className="feature-banner"><div className="feature-icon"><Icon name={d.icon} /></div><div><h2>{d.title}</h2><p>{d.intro}</p></div><button className="primary"><Icon name="plus" /> Nuevo registro</button></div>
    <div className="report-strip"><div><span>HOY</span><strong>S/ 4,280</strong></div><div><span>ESTA SEMANA</span><strong>S/ 24,860</strong></div><div><span>ESTE MES</span><strong>S/ 92,430</strong></div><button className="select-button"><Icon name="calendar" /> 18 Nov. 2026</button></div>
    <div className="simple-list"><div className="simple-head"><span>DETALLE</span><span>INFORMACIÓN</span><span>ESTADO / TOTAL</span><span>REFERENCIA</span></div>{d.rows.map((r) => <div className="simple-row" key={r[0]}>{r.map((v, i) => <span key={v} className={i === 0 ? 'strong' : ''}>{v}</span>)}</div>)}</div>
  </div>
}

function AdminApp({ role }: { role: Role }) {
  const [view, setView] = useState('dashboard')
  const current = adminNav.find((n) => n[0] === view)
  return <div className="admin-shell">
    <aside className="sidebar"><Logo /><div className="restaurant-chip"><div>CM</div><span><small>RESTAURANTE</small><strong>Casa Misti</strong></span><b>⌄</b></div>
      <nav><p>GESTIÓN</p>{adminNav.map(([id, label, icon]) => <button className={view === id ? 'active' : ''} onClick={() => setView(id)} key={id}><Icon name={icon} /><span>{label}</span>{id === 'reviews' && <b>3</b>}</button>)}</nav>
      <div className="sidebar-bottom"><button><Icon name="settings" />Configuración</button><div className="help-card"><strong>Centro de ayuda</strong><span>¿Necesitas asistencia?</span><button>Contactar soporte</button></div></div>
    </aside>
    <main className="admin-main"><TopBar title={current?.[1] || 'Vista general'} subtitle={view === 'dashboard' ? 'MIÉRCOLES, 18 DE NOVIEMBRE' : 'ADMINISTRACIÓN'} />
      <div className="admin-content">{view === 'dashboard' ? <AdminDashboard /> : view === 'products' ? <ProductsView /> : view === 'tables' ? <TablesView /> : <GenericModule view={view} />}</div>
    </main>
    <LogoutButton role={role} />
  </div>
}

function KitchenApp({ role }: { role: Role }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeOrders((items) => { setOrders(items); setLoading(false) })
    return () => unsub()
  }, [])

  const newOrders = orders.filter((o) => o.status === 'pending_review' || o.status === 'accepted')
  const prepOrders = orders.filter((o) => o.status === 'preparing')
  const readyOrders = orders.filter((o) => o.status === 'ready')

  const columns = [
    { title: 'Pedidos nuevos', items: newOrders, color: 'new', action: 'Aceptar pedido', nextStatus: 'preparing' as const },
    { title: 'En preparación', items: prepOrders, color: 'prep', action: 'Marcar como listo', nextStatus: 'ready' as const },
    { title: 'Listos para entregar', items: readyOrders, color: 'ready', action: 'Confirmar entrega', nextStatus: 'delivered' as const },
  ]

  return <div className="ops-shell">
    <header className="ops-header"><Logo /><div className="ops-title"><Icon name="chef" /><div><strong>Panel de cocina</strong><span>Servicio de almuerzo · {orders.length} pedidos activos</span></div></div><div className="ops-right"><span className="time">{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span><button className="icon-button"><Icon name="bell" /></button></div></header>
    <main className="kitchen-main"><div className="kitchen-summary"><div><p className="eyebrow">COCINA EN VIVO</p><h1>Buen servicio, equipo.</h1></div><div className="speed"><Icon name="clock" /><div><span>Tiempo promedio</span><strong>14 min</strong></div></div></div>
      {loading ? <div className="loading-state"><div className="login-spinner" /><p>Cargando pedidos…</p></div> :
      <div className="kanban">{columns.map((col) => <section className={`kanban-col ${col.color}`} key={col.title}>
        <div className="kanban-head"><div><i /><h2>{col.title}</h2><b>{col.items.length}</b></div></div>
        <div className="order-stack">
          {col.items.length === 0 ? <div className="empty-requests"><div><Icon name="check" /></div><p>Sin pedidos</p></div> :
          col.items.map((o) => <article className="order-card" key={o.id}>
            <div className="order-top"><div><span>PEDIDO</span><strong>#{o.id.slice(-4)}</strong></div><span className="table-number">Mesa {o.tableId}</span></div>
            <div className="order-time"><Icon name="clock" size={15} /><span>{new Date(o.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <ul>{o.items.map((item, i) => <li key={i}><b>{item.quantity}×</b><span>{item.name}</span></li>)}</ul>
            {o.notes && <div className="order-note"><strong>NOTA</strong><span>{o.notes}</span></div>}
            <button className="order-action" onClick={() => updateOrderStatus(o.id, col.nextStatus)}>{col.action}<Icon name="arrow" /></button>
          </article>)}
        </div>
      </section>)}</div>}
    </main><LogoutButton role={role} />
  </div>
}

function CashierApp({ role }: { role: Role }) {
  return <div className="ops-shell cashier-shell">
    <header className="ops-header"><Logo /><div className="ops-title"><Icon name="cash" /><div><strong>Panel de caja</strong><span>Turno de caja 01</span></div></div><div className="ops-right"><div className="live"><i /> Sincronizado</div><button className="icon-button"><Icon name="bell" /></button></div></header>
    <main className="cashier-main"><section className="accounts"><div className="section-title"><div><p className="eyebrow">CUENTAS ABIERTAS</p><h1>Mesas por cobrar</h1></div></div>
      <div className="empty-requests"><div><Icon name="check" /></div><h3>Todas las cuentas están al día</h3><p>Los pedidos pendientes de pago aparecerán aquí en tiempo real.</p></div>
    </section></main><LogoutButton role={role} />
  </div>
}

function WaiterApp({ role }: { role: Role }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeServiceRequests((items) => { setRequests(items); setLoading(false) })
    return () => unsub()
  }, [])

  const active = requests.filter((r) => r.status !== 'done')
  const completed = requests.filter((r) => r.status === 'done')

  return <div className="ops-shell waiter-shell">
    <header className="ops-header"><Logo /><div className="ops-title"><Icon name="bell" /><div><strong>Atención de mesas</strong><span>Panel exclusivo para mozos · Salón principal</span></div></div><div className="ops-right"><div className="live"><i /> Solicitudes en vivo</div><button className="icon-button"><Icon name="bell" />{active.length > 0 && <b>{active.length}</b>}</button></div></header>
    <main className="waiter-main">
      <section className="waiter-heading"><div><p className="eyebrow">SERVICIO EN SALÓN</p><h1>Peticiones de clientes</h1><p>Recibe y atiende las solicitudes enviadas desde cada mesa.</p></div>
        <div className="waiter-stats"><article><span>PENDIENTES</span><strong>{requests.filter((r) => r.status === 'pending').length}</strong></article><article><span>EN CAMINO</span><strong>{requests.filter((r) => r.status === 'attending').length}</strong></article><article><span>ATENDIDAS</span><strong>{completed.length}</strong></article></div>
      </section>
      <div className="waiter-layout"><section className="request-feed"><div className="feed-head"><div><i /><h2>Solicitudes activas</h2><b>{active.length}</b></div><span>Actualizado ahora</span></div>
        {loading ? <div className="loading-state"><div className="login-spinner" /><p>Cargando…</p></div> :
        active.length === 0 ? <div className="empty-requests"><div><Icon name="check" /></div><h3>Todo está atendido</h3><p>Las nuevas solicitudes aparecerán aquí en tiempo real.</p></div> :
        active.map((item) => <article className={`service-request ${item.status}`} key={item.id}>
          <div className="request-table"><span>MESA</span><strong>{item.tableNumber}</strong></div>
          <div className="request-detail"><div><span className={`request-state ${item.status}`}><i />{item.status === 'pending' ? 'Nueva solicitud' : 'Mozo en camino'}</span><time><Icon name="clock" size={13} />{new Date(item.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</time></div><h3>Mesa {item.tableNumber} necesita {item.request.toLowerCase()}</h3>{item.comment && <p>"{item.comment}"</p>}</div>
          <div className="request-actions">{item.status === 'pending' ? <button onClick={() => updateServiceRequestStatus(item.id, 'attending')}>Voy a atender <Icon name="arrow" /></button> : <><button className="complete-request" onClick={() => updateServiceRequestStatus(item.id, 'done')}><Icon name="check" /> Marcar atendida</button></>}</div>
        </article>)}
      </section>
      <aside className="waiter-side">
        <div className="recent-card"><div><h2>Atendidas recientemente</h2><Icon name="check" /></div>{completed.slice(0, 3).map((item) => <p key={item.id}><span><strong>Mesa {item.tableNumber} · {item.request}</strong><small>{new Date(item.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</small></span><i><Icon name="check" size={12} /></i></p>)}</div>
        <div className="service-tip"><Icon name="bell" /><div><strong>Respuesta rápida</strong><p>Las mesas reciben una confirmación cuando tomas su solicitud.</p></div></div>
      </aside>
      </div>
    </main><LogoutButton role={role} />
  </div>
}

function ClientApp({ role }: { role: Role }) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'menu' | 'orders' | 'pay' | 'review'>('menu')
  const [products, setProducts] = useState<MenuItem[]>([])
  const [tables, setTables] = useState<TableInfo[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [detail, setDetail] = useState<MenuItem | null>(null)
  const [sent, setSent] = useState(false)
  const [attention, setAttention] = useState(false)
  const [attentionSent, setAttentionSent] = useState(false)
  const [attentionOption, setAttentionOption] = useState('')
  const [attentionText, setAttentionText] = useState('')
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')

  useEffect(() => {
    const unsubP = subscribeAvailableProducts((items) => { setProducts(items); setLoading(false) })
    const unsubT = subscribeTables((t) => setTables(t))
    const unsubO = subscribeClientOrders((o) => setOrders(o))
    return () => { unsubP(); unsubT(); unsubO() }
  }, [])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  const handleSendOrder = async () => {
    if (cart.length === 0 || !selectedTable) return
    try {
      await createOrder(selectedTable, cart, '')
      setCart([])
      setSent(false)
      setTab('orders')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al enviar el pedido.')
    }
  }

  const handleAttention = async () => {
    if (!attentionOption && !attentionText.trim()) return
    const table = tables.find((t) => t.id === selectedTable)
    try {
      await createServiceRequest(selectedTable, table?.number ?? '', attentionOption || 'Solicitud especial', attentionText.trim())
      setAttentionSent(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al enviar la solicitud.')
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCat = activeCat === 'all' || p.category === activeCat
    return matchesSearch && matchesCat
  })

  const categories = [...new Set(products.map((p) => p.category))].filter(Boolean)

  if (!selectedTable && tables.length > 0) {
    return <div className="client-bg"><div className="phone-app">
      <header className="client-header"><Logo /></header>
      <div className="client-page">
        <p className="eyebrow">BIENVENIDO</p>
        <h1>Selecciona tu mesa</h1>
        <p className="page-intro">Escanea el QR de tu mesa o elige el número para empezar a pedir.</p>
        <div className="table-selector">
          {tables.map((t) => <button key={t.id} className="table-select-btn" onClick={() => setSelectedTable(t.id)}>
            <strong>{t.number}</strong><span>{t.seats} asientos</span>
          </button>)}
        </div>
      </div>
      <LogoutButton role={role} />
    </div></div>
  }

  return <div className="client-bg"><div className="phone-app">
    <header className="client-header"><Logo /><button className="client-table"><span>MESA</span><strong>{tables.find((t) => t.id === selectedTable)?.number ?? '?'}</strong></button></header>
    <div className="welcome"><div><p>Buenas,</p><h1>¿Qué se te antoja hoy?</h1></div><button aria-label="Solicitar atención" onClick={() => { setAttention(true); setAttentionSent(false) }} className="icon-button attention-bell"><Icon name="bell" /><span>Atención</span></button></div>
    {tab === 'menu' && <>
      <div className="client-search"><Icon name="search" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en la carta…" /></div>
      <div className="food-tabs"><button className={activeCat === 'all' ? 'active' : ''} onClick={() => setActiveCat('all')}>Todo</button>{categories.map((c) => <button key={c} className={activeCat === c ? 'active' : ''} onClick={() => setActiveCat(c)}>{c}</button>)}</div>
      {loading ? <div className="loading-state"><div className="login-spinner" /><p>Cargando menú…</p></div> :
      filteredProducts.length === 0 ? <div className="client-page"><p className="page-intro">No hay productos disponibles en este momento.</p></div> :
      <div className="client-products">{filteredProducts.map((d) => <article onClick={() => setDetail(d)} key={d.id}><img src={d.imageUrl || '/assets/chaufa.png'} /><h3>{d.name}</h3><p>{d.description}</p><div><strong>S/ {d.price.toFixed(2)}</strong><button onClick={(e) => { e.stopPropagation(); addToCart(d) }}><Icon name="plus" /></button></div></article>)}</div>}
    </>}
    {tab === 'orders' && <div className="client-page"><p className="eyebrow">MESA {tables.find((t) => t.id === selectedTable)?.number ?? '?'}</p><h1>Mis pedidos</h1>
      {orders.length === 0 ? <div className="empty-requests"><div><Icon name="bag" /></div><h3>Aún no tienes pedidos</h3><p>Cuando envíes un pedido, podrás seguir su estado aquí.</p></div> :
      orders.map((o) => <div className="client-order-card" key={o.id}><div><span>PEDIDO #{o.id.slice(-4)}</span><b>{o.status === 'pending_review' ? 'Pendiente de revisión' : o.status === 'accepted' ? 'Aceptado' : o.status === 'preparing' ? 'En preparación' : o.status === 'ready' ? 'Listo' : o.status === 'delivered' ? 'Entregado' : o.status}</b></div>
        <ul>{o.items.map((item, i) => <li key={i}><b>{item.quantity}×</b><span>{item.name}</span></li>)}</ul>
        <div className="order-total"><span>{o.items.length} productos</span><strong>S/ {o.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</strong></div>
      </div>)}
    </div>}
    {tab === 'pay' && <div className="client-page"><p className="eyebrow">TU CUENTA</p><h1>Pagos</h1>
      <div className="balance-card"><span>SALDO PENDIENTE</span><strong>S/ {orders.filter((o) => o.status === 'delivered' || o.status === 'pending_payment').reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.price * i.quantity, 0), 0).toFixed(2)}</strong><p>{orders.filter((o) => o.status === 'delivered').length} pedidos entregados</p></div>
      <h3>Elige cómo pagar</h3><button className="client-pay"><Icon name="cash" /><div><strong>Efectivo</strong><span>Paga directamente en caja</span></div><Icon name="arrow" /></button>
      <button className="client-pay"><b className="yape-dot">Y</b><div><strong>Yape</strong><span>Adjunta tu comprobante</span></div><Icon name="arrow" /></button>
    </div>}
    {tab === 'review' && <div className="client-page"><p className="eyebrow">SOLO PARA NOSOTROS</p><h1>Cuéntanos tu experiencia</h1><p className="page-intro">Tu opinión es privada y solo será leída por la administración de Casa Misti.</p>
      <div className="rating">{[1, 2, 3, 4, 5].map((n) => <button key={n}>★</button>)}</div>
      <label className="form-label">Tu comentario</label><textarea placeholder="Cuéntanos qué ocurrió o cómo podemos mejorar…" />
      <button className="client-submit">Enviar comentario privado <Icon name="arrow" /></button>
    </div>}
    <nav className="client-nav"><button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')}><Icon name="grid" /><span>Menú</span></button><button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}><Icon name="bag" /><span>Pedidos</span></button><button className={tab === 'pay' ? 'active' : ''} onClick={() => setTab('pay')}><Icon name="wallet" /><span>Pagos</span></button><button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}><Icon name="message" /><span>Opinión</span></button></nav>
    {cartCount > 0 && tab === 'menu' && <button className="cart-bar" onClick={() => setSent(true)}><span><b>{cartCount}</b> Ver mi pedido</span><strong>S/ {cartTotal.toFixed(2)} <Icon name="arrow" /></strong></button>}
    {detail && <div className="modal-backdrop" onClick={() => setDetail(null)}><div className="product-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setDetail(null)}>×</button><img src={detail.imageUrl || '/assets/chaufa.png'} /><div><h2>{detail.name}</h2><p>{detail.description}</p><label>Observaciones</label><textarea placeholder="Ej. sin cebolla, ají aparte…" /><button onClick={() => { addToCart(detail); setDetail(null) }}>Agregar · S/ {detail.price.toFixed(2)}</button></div></div></div>}
    {sent && <div className="modal-backdrop"><div className="confirm-modal"><div className="confirm-icon"><Icon name="check" /></div><h2>¡Pedido listo para enviar!</h2><p>Se creará un pedido para tu mesa. El restaurante deberá aprobarlo antes de enviarlo a cocina.</p><div><span>Total</span><strong>S/ {cartTotal.toFixed(2)}</strong></div><button onClick={handleSendOrder}>Confirmar y enviar pedido</button><button className="ghost" onClick={() => setSent(false)}>Seguir explorando</button></div></div>}
    {attention && <div className="modal-backdrop" onClick={() => setAttention(false)}><div className="attention-modal" onClick={(e) => e.stopPropagation()}>
      {!attentionSent ? <>
        <div className="attention-heading"><div className="attention-icon"><Icon name="bell" /></div><div><span>SOLICITAR ATENCIÓN</span><h2>¿Qué necesitas?</h2></div><button onClick={() => setAttention(false)}>×</button></div>
        <p className="attention-intro">Enviaremos tu solicitud al personal para que se acerque a tu mesa.</p>
        <div className="attention-options">{['Más sal', 'Más cremas', 'Una cuchara', 'Servilletas', 'Cubiertos', 'Llamar al mesero'].map((option) => <button className={attentionOption === option ? 'active' : ''} onClick={() => setAttentionOption(option)} key={option}><span>{option}</span>{attentionOption === option && <Icon name="check" size={14} />}</button>)}</div>
        <label className="form-label">¿Necesitas algo diferente?</label><textarea value={attentionText} onChange={(e) => setAttentionText(e.target.value)} placeholder="Escribe aquí lo que necesitas…" />
        <button className="attention-submit" disabled={!attentionOption && !attentionText.trim()} onClick={handleAttention}>Enviar solicitud <Icon name="arrow" /></button>
      </> : <div className="attention-success"><div className="confirm-icon"><Icon name="check" /></div><span>SOLICITUD ENVIADA</span><h2>Ya avisamos al personal</h2><p>Tu solicitud fue enviada. Alguien se acercará pronto a tu mesa.</p><button onClick={() => setAttention(false)}>Entendido</button></div>}
    </div></div>}
    <LogoutButton role={role} />
  </div></div>
}

function ConfigErrorScreen({ message }: { message: string }) {
  return <div className="login-screen"><div className="login-card"><div className="login-brand"><div className="logo-mark">S</div><div><strong>Salvia</strong><span>RESTAURANT OS</span></div></div>
    <div className="login-error" style={{ textAlign: 'center', padding: '20px' }}><strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Error de configuración</strong><p style={{ fontSize: '11px', lineHeight: '1.5', margin: 0 }}>{message}</p></div>
  </div></div>
}

function LoadingScreen() {
  return <div className="login-screen"><div className="login-card"><div className="login-brand"><div className="logo-mark">S</div><div><strong>Salvia</strong><span>RESTAURANT OS</span></div></div>
    <div className="login-loading"><div className="login-spinner" /><p>Conectando al sistema…</p></div></div></div>
}

export default function App() {
  const { user, loading } = useAuth()

  if (firebaseInitError) return <ConfigErrorScreen message={firebaseInitError} />
  if (loading) return <LoadingScreen />
  if (!user || !user.role) return <LoginScreen />

  const role = user.role
  const panel = user.activePanel

  if (role === 'owner') {
    if (panel === 'kitchen') return <KitchenApp role={role} />
    if (panel === 'cashier') return <CashierApp role={role} />
    if (panel === 'waiter') return <WaiterApp role={role} />
    if (panel === 'client') return <ClientApp role={role} />
    return <AdminApp role={role} />
  }

  if (role === 'kitchen') return <KitchenApp role={role} />
  if (role === 'cashier') return <CashierApp role={role} />
  if (role === 'waiter') return <WaiterApp role={role} />
  if (role === 'client') return <ClientApp role={role} />
  return <AdminApp role={role} />
}
