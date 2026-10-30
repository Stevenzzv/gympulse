import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Receipt, Search, Trash2, Users } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { date, daysUntil, todayISO } from '../../lib/format'
import { Alert, Badge, Button, EmptyState, Field, Modal, PageHeader, Pagination, Spinner } from '../../components/ui'
import RequireGym from '../../components/RequireGym'
import SaleForm from '../../components/SaleForm'

export default function Members() {
  return <RequireGym><MembersContent /></RequireGym>
}

function MembersContent() {
  const { gym } = useGym()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | {} (new) | member
  const [selling, setSelling] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(() => {
    api.get(`/gyms/${gym.id}/members`, { params: { q, status: status || undefined, page, size: 15 } })
      .then(({ data }) => setData(data))
      .catch((e) => setError(errorMessage(e)))
  }, [gym.id, q, status, page])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const remove = async (m) => {
    if (!confirm(`¿Eliminar a ${m.firstName} ${m.lastName}? Sus ventas se mantienen en tu historial.`)) return
    try {
      await api.delete(`/gyms/${gym.id}/members/${m.id}`)
      load()
    } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        title="Socios"
        subtitle="Todos los inscritos en tu gimnasio, con su plan y observaciones."
        actions={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Nuevo socio</Button>}
      />
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <Alert tone="success">{notice}</Alert>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar por nombre, email, teléfono o cédula…" value={q}
                   onChange={(e) => { setQ(e.target.value); setPage(0) }} />
          </div>
          <select className="input sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          {!data ? <Spinner /> : data.content.length === 0 ? (
            <EmptyState icon={Users} title="No se encontraron socios" text={q ? 'Prueba con otra búsqueda.' : 'Registra a tu primer socio.'} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Socio</th>
                      <th className="th">Plan</th>
                      <th className="th">Membresía</th>
                      <th className="th hidden md:table-cell">Observaciones</th>
                      <th className="th text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.content.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="td">
                          <p className="font-medium text-slate-900">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-slate-500">{m.email || m.phone || '—'}</p>
                          {m.status === 'INACTIVE' && <Badge>Inactivo</Badge>}
                        </td>
                        <td className="td">{m.planName || <span className="text-slate-400">—</span>}</td>
                        <td className="td"><MembershipBadge endsAt={m.membershipEndsAt} /></td>
                        <td className="td hidden max-w-xs truncate text-slate-500 md:table-cell" title={m.observations || ''}>
                          {m.observations || '—'}
                        </td>
                        <td className="td">
                          <div className="flex justify-end gap-1">
                            <IconBtn label="Registrar venta / renovar" onClick={() => setSelling(m)}><Receipt className="h-4 w-4" /></IconBtn>
                            <IconBtn label="Editar" onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /></IconBtn>
                            <IconBtn label="Eliminar" onClick={() => remove(m)} danger><Trash2 className="h-4 w-4" /></IconBtn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar socio' : 'Nuevo socio'} wide>
        {editing && (
          <MemberForm gymId={gym.id} member={editing} onCancel={() => setEditing(null)}
                      onSaved={() => { setEditing(null); load() }} />
        )}
      </Modal>

      <Modal open={!!selling} onClose={() => setSelling(null)} title="Registrar venta">
        {selling && (
          <SaleForm gymId={gym.id} member={selling} onCancel={() => setSelling(null)}
                    onSaved={(s) => { setSelling(null); setNotice(`Venta registrada: ${s.concept}`); load() }} />
        )}
      </Modal>
    </>
  )
}

function IconBtn({ label, onClick, danger, children }) {
  return (
    <button title={label} aria-label={label} onClick={onClick}
            className={`rounded-lg p-2 text-slate-500 hover:bg-slate-100 ${danger ? 'hover:text-red-600' : 'hover:text-brand-600'}`}>
      {children}
    </button>
  )
}

function MembershipBadge({ endsAt }) {
  if (!endsAt) return <Badge>Sin plan</Badge>
  const days = daysUntil(endsAt)
  if (days < 0) return <Badge tone="red">Venció {date(endsAt)}</Badge>
  if (days <= 7) return <Badge tone="amber">{days === 0 ? 'Vence hoy' : `Vence en ${days} días`}</Badge>
  return <Badge tone="green">Hasta {date(endsAt)}</Badge>
}

function MemberForm({ gymId, member, onSaved, onCancel }) {
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({
    firstName: member.firstName || '', lastName: member.lastName || '', email: member.email || '',
    phone: member.phone || '', documentId: member.documentId || '', birthDate: member.birthDate || '',
    observations: member.observations || '', status: member.status || 'ACTIVE', planId: member.planId || '',
    joinedAt: member.joinedAt || todayISO(), membershipEndsAt: member.membershipEndsAt || '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.get(`/gyms/${gymId}/plans`).then(({ data }) => setPlans(data)) }, [gymId])
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      ...form,
      planId: form.planId ? Number(form.planId) : null,
      birthDate: form.birthDate || null,
      membershipEndsAt: form.membershipEndsAt || null,
      joinedAt: form.joinedAt || null,
    }
    try {
      if (member.id) await api.put(`/gyms/${gymId}/members/${member.id}`, payload)
      else await api.post(`/gyms/${gymId}/members`, payload)
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert>{error}</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombres"><input className="input" required value={form.firstName} onChange={set('firstName')} /></Field>
        <Field label="Apellidos"><input className="input" required value={form.lastName} onChange={set('lastName')} /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Teléfono"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Cédula / pasaporte"><input className="input" value={form.documentId} onChange={set('documentId')} /></Field>
        <Field label="Fecha de nacimiento"><input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} /></Field>
        <Field label="Plan">
          <select className="input" value={form.planId} onChange={set('planId')}>
            <option value="">— Ninguno —</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className="input" value={form.status} onChange={set('status')}>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </Field>
        <Field label="Fecha de inscripción"><input className="input" type="date" value={form.joinedAt} onChange={set('joinedAt')} /></Field>
        <Field label="Vence la membresía" hint="Se actualiza sola al vender un plan.">
          <input className="input" type="date" value={form.membershipEndsAt} onChange={set('membershipEndsAt')} />
        </Field>
      </div>
      <Field label="Observaciones" hint="Lesiones, objetivos, notas médicas, preferencias…">
        <textarea className="input" rows={4} value={form.observations} onChange={set('observations')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={busy}>{member.id ? 'Guardar cambios' : 'Agregar socio'}</Button>
      </div>
    </form>
  )
}
