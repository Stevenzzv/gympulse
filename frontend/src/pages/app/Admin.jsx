import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CheckCircle2, FileText, Inbox, MessageCircle, Search, XCircle } from 'lucide-react'
import { api, errorMessage, openProtectedFile } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import {
  SUBSCRIPTION_STATUS, date, dateTime, daysUntil, methodLabel, money, monthsLabel, whatsappLink,
} from '../../lib/format'
import { Alert, Badge, Button, EmptyState, Field, Modal, PageHeader, Spinner } from '../../components/ui'
import PaymentHistory from '../../components/PaymentHistory'
import { PENDING_EVENT } from '../../components/AppLayout'

const receiptPath = (id) => `/admin/payments/${id}/receipt`

export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState('pending')
  const [summary, setSummary] = useState(null)
  const [version, setVersion] = useState(0) // bump to reload every tab after a change
  const reload = () => setVersion((v) => v + 1)

  useEffect(() => {
    if (user.role !== 'ADMIN') return
    api.get('/admin/summary').then(({ data }) => {
      setSummary(data)
      window.dispatchEvent(new CustomEvent(PENDING_EVENT, { detail: data.pendingPayments }))
    })
  }, [user.role, version])

  if (user.role !== 'ADMIN') return <Navigate to="/app" replace />

  const tabs = [
    ['pending', `Por revisar${summary?.pendingPayments ? ` (${summary.pendingPayments})` : ''}`],
    ['customers', 'Clientes'],
    ['history', 'Historial de pagos'],
  ]

  return (
    <>
      <PageHeader eyebrow="Administración" title="Pagos y clientes" subtitle="Aprueba transferencias y DeUna, y controla las suscripciones de tus clientes." />
      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Tile label="Pagos por revisar" value={summary.pendingPayments} warn={summary.pendingPayments > 0} />
          <Tile label="Clientes pagando" value={summary.activeCustomers} />
          <Tile label="En prueba" value={summary.trialCustomers} />
          <Tile label="Vencen en 7 días" value={summary.expiringIn7Days} warn={summary.expiringIn7Days > 0} />
          <Tile label="Cobrado últimos 30 días" value={money(summary.revenueLast30Days)} />
        </div>
      )}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {tabs.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-semibold ${tab === key ? 'border-b-2 border-brand-400 text-brand-200' : 'text-subtle hover:text-fg'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'pending' && <PendingPayments key={version} onChange={reload} />}
      {tab === 'customers' && <Customers key={version} onChange={reload} />}
      {tab === 'history' && <History key={version} />}
    </>
  )
}

function Tile({ label, value, warn }) {
  return (
    <div className={`card p-4 ${warn ? 'border-amber-400/40 bg-amber-400/5' : ''}`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 num text-2xl font-semibold tracking-tight text-fg">{value}</p>
    </div>
  )
}

function PendingPayments({ onChange }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api.get('/admin/payments', { params: { status: 'PENDING' } })
      .then(({ data }) => setItems(data)).catch((e) => setError(errorMessage(e)))
  }, [])

  if (error) return <Alert>{error}</Alert>
  if (!items) return <Spinner />
  if (items.length === 0) {
    return <div className="card"><EmptyState icon={Inbox} title="Nada por revisar" text="Cuando un cliente registre una transferencia o un pago con DeUna, aparecerá aquí." /></div>
  }
  return <div className="space-y-4">{items.map((it) => <PendingCard key={it.payment.id} item={it} onDone={onChange} />)}</div>
}

function PendingCard({ item: { payment: p, user }, onDone }) {
  const [months, setMonths] = useState(p.months || 1)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null)
  const wa = whatsappLink(user.phone, `Hola ${user.fullName}, te escribimos de GymPulse sobre tu pago de ${money(p.amount)}.`)

  const act = async (action) => {
    if (action === 'reject' && !note.trim()) {
      setError('Escribe el motivo del rechazo; el cliente lo verá en su historial.')
      return
    }
    setBusy(action)
    setError('')
    try {
      await api.post(`/admin/payments/${p.id}/${action}`, { months: Number(months), adminNote: note.trim() || null })
      onDone()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(null)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold text-fg">{user.fullName}</p>
          <p className="text-sm text-muted">{user.email}</p>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300 hover:underline">
              <MessageCircle className="h-4 w-4" /> {user.phone}
            </a>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div><dt className="text-xs text-muted">Monto</dt><dd className="font-semibold text-fg">{money(p.amount)}</dd></div>
          <div><dt className="text-xs text-muted">Método</dt><dd>{methodLabel(p.method)}</dd></div>
          <div><dt className="text-xs text-muted">Plan</dt><dd>{monthsLabel(p.months)}</dd></div>
          <div><dt className="text-xs text-muted">Enviado</dt><dd>{dateTime(p.createdAt)}</dd></div>
          <div className="col-span-2 sm:col-span-4"><dt className="text-xs text-muted">Comprobante</dt>
            <dd className="flex flex-wrap items-center gap-3">
              <span className="break-all font-mono">{p.reference || 'sin número'}</span>
              {p.hasReceipt && (
                <button onClick={() => openProtectedFile(receiptPath(p.id)).catch((e) => setError(errorMessage(e)))}
                        className="inline-flex items-center gap-1 font-medium text-brand-300 hover:underline">
                  <FileText className="h-4 w-4" /> Ver archivo
                </button>
              )}
            </dd>
          </div>
          {p.payerNote && <div className="col-span-2 sm:col-span-4"><dt className="text-xs text-muted">Nota del cliente</dt><dd>{p.payerNote}</dd></div>}
          {p.adminNote && <div className="col-span-2 sm:col-span-4"><dt className="text-xs text-muted">Aviso del sistema</dt><dd className="text-amber-300">{p.adminNote}</dd></div>}
        </dl>
      </div>
      <p className="mt-4 rounded-lg bg-surface-2 p-3 text-xs text-muted">
        Antes de aprobar, confirma en tu banco o en DeUna que el dinero llegó y que la referencia coincide.
      </p>
      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end">
        <Field label="Meses a activar" className="sm:w-36">
          <input type="number" min="1" max="36" className="input" value={months} onChange={(e) => setMonths(e.target.value)} />
        </Field>
        <Field label="Nota para el cliente (obligatoria al rechazar)" className="flex-1">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. No encontramos la transferencia" />
        </Field>
        <div className="flex gap-2">
          <Button variant="danger" loading={busy === 'reject'} disabled={!!busy} onClick={() => act('reject')}><XCircle className="h-4 w-4" /> Rechazar</Button>
          <Button loading={busy === 'approve'} disabled={!!busy} onClick={() => act('approve')} className="bg-emerald-400 text-ink hover:bg-emerald-300 shadow-none"><CheckCircle2 className="h-4 w-4" /> Aprobar</Button>
        </div>
      </div>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
    </div>
  )
}

const FILTERS = [
  ['all', 'Todos'],
  ['active', 'Pagando'],
  ['trial', 'En prueba'],
  ['expiring', 'Vencen pronto'],
  ['expired', 'Vencidos'],
]

function Customers({ onChange }) {
  const [users, setUsers] = useState(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [activating, setActivating] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data)).catch((e) => setError(errorMessage(e)))
  }, [])
  useEffect(() => { load() }, [load])

  const visible = useMemo(() => (users || [])
    .filter((u) => u.role !== 'ADMIN')
    .filter((u) => {
      const d = daysUntil(u.accessEndsAt)
      if (filter === 'active') return u.hasActiveAccess && u.subscriptionStatus === 'ACTIVE'
      if (filter === 'trial') return u.hasActiveAccess && u.subscriptionStatus === 'TRIAL'
      if (filter === 'expiring') return u.hasActiveAccess && d != null && d <= 7
      if (filter === 'expired') return !u.hasActiveAccess
      return true
    })
    .filter((u) => !q || `${u.fullName} ${u.email} ${u.phone || ''}`.toLowerCase().includes(q.toLowerCase())),
  [users, q, filter])

  if (error) return <Alert>{error}</Alert>
  if (!users) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-subtle" />
          <input className="input pl-9" placeholder="Buscar por nombre, email o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === k ? 'bg-brand-400 text-ink' : 'bg-surface text-muted ring-1 ring-line-strong hover:bg-surface-2'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {visible.length === 0 ? <p className="p-8 text-center text-sm text-muted">No hay clientes con este filtro.</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-surface-2">
                <tr>
                  <th className="th">Cliente</th>
                  <th className="th">Estado</th>
                  <th className="th">Acceso hasta</th>
                  <th className="th">Gimnasios</th>
                  <th className="th">Último pago</th>
                  <th className="th"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((u) => {
                  const st = u.hasActiveAccess ? SUBSCRIPTION_STATUS[u.subscriptionStatus] : SUBSCRIPTION_STATUS.EXPIRED
                  const d = daysUntil(u.accessEndsAt)
                  const reminder = d != null && d >= 0
                    ? `Hola ${u.fullName}, tu suscripción de GymPulse vence el ${date(u.accessEndsAt)}. ¿Te ayudamos a renovarla?`
                    : `Hola ${u.fullName}, tu suscripción de GymPulse está vencida. Tus datos siguen guardados; renueva para seguir registrando.`
                  const wa = whatsappLink(u.phone, reminder)
                  return (
                    <tr key={u.id} className="hover:bg-surface-2">
                      <td className="td">
                        <p className="font-medium text-fg">{u.fullName}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 hover:underline">
                            <MessageCircle className="h-3.5 w-3.5" /> {u.phone}
                          </a>
                        )}
                      </td>
                      <td className="td"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="td whitespace-nowrap">
                        {date(u.accessEndsAt)}
                        {u.hasActiveAccess && d != null && d <= 7 && <span className="block text-xs font-medium text-amber-300">{d <= 0 ? 'vence hoy' : `en ${d} días`}</span>}
                      </td>
                      <td className="td">{u.gymCount}</td>
                      <td className="td whitespace-nowrap">{date(u.lastPaymentAt)}</td>
                      <td className="td text-right">
                        <Button variant="secondary" className="whitespace-nowrap px-3 py-1.5" onClick={() => setActivating(u)}>Registrar pago</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!activating} onClose={() => setActivating(null)} title="Registrar pago y activar">
        {activating && (
          <ActivateForm customer={activating} onCancel={() => setActivating(null)}
                        onSaved={() => { setActivating(null); load(); onChange() }} />
        )}
      </Modal>
    </div>
  )
}

function ActivateForm({ customer, onSaved, onCancel }) {
  const [form, setForm] = useState({ months: 1, method: 'TRANSFER', amount: '', reference: '', adminNote: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post(`/admin/users/${customer.id}/activate`, {
        ...form, months: Number(form.months), amount: form.amount === '' ? null : Number(form.amount),
      })
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted">
        Para pagos recibidos fuera de la app (efectivo, transferencia que viste en tu banco…). Se suman los meses a la
        suscripción de <b>{customer.fullName}</b>.
      </p>
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Meses">
          <select className="input" value={form.months} onChange={set('months')}>
            {[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{monthsLabel(m)}</option>)}
          </select>
        </Field>
        <Field label="Método">
          <select className="input" value={form.method} onChange={set('method')}>
            {['TRANSFER', 'DEUNA', 'CASH', 'PAYPAL', 'OTHER'].map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
          </select>
        </Field>
        <Field label="Monto recibido (USD)"><input className="input" type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} /></Field>
        <Field label="Referencia"><input className="input" value={form.reference} onChange={set('reference')} /></Field>
      </div>
      <Field label="Nota"><input className="input" value={form.adminNote} onChange={set('adminNote')} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={busy}>Activar</Button>
      </div>
    </form>
  )
}

function History() {
  const [items, setItems] = useState(null)
  useEffect(() => { api.get('/admin/payments').then(({ data }) => setItems(data)) }, [])
  if (!items) return <Spinner />
  return (
    <div className="card overflow-hidden">
      <PaymentHistory payments={items} receiptPath={receiptPath} showUser />
    </div>
  )
}
