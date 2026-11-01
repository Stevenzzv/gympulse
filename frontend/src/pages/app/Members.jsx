import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Plus, Receipt, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { date, daysUntil, whatsappLink } from '../../lib/format'
import { Alert, Avatar, Badge, Button, Drawer, EmptyState, PageHeader, Pagination, Segmented, Spinner, useToast } from '../../components/ui'
import RequireGym from '../../components/RequireGym'
import MemberForm from '../../components/MemberForm'
import SaleForm from '../../components/SaleForm'

export default function Members() {
  return <RequireGym><MembersContent /></RequireGym>
}

function MembersContent() {
  const { gym } = useGym()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(params.get('new') === '1' ? {} : null) // null | {} (new) | member
  const [selling, setSelling] = useState(null)

  const load = useCallback(() => {
    api.get(`/gyms/${gym.id}/members`, { params: { q, status: status || undefined, page, size: 15 } })
      .then(({ data }) => setData(data))
      .catch((e) => setError(errorMessage(e)))
  }, [gym.id, q, status, page])

  const loadCounts = useCallback(() => {
    api.get(`/gyms/${gym.id}/stats`, { params: { months: 1 } }).then(({ data }) => setCounts(data)).catch(() => {})
  }, [gym.id])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])
  useEffect(() => { loadCounts() }, [loadCounts])

  const closeEditor = () => {
    setEditing(null)
    if (params.get('new')) setParams({})
  }
  const afterChange = (message) => {
    toast(message)
    load()
    loadCounts()
  }

  const remove = async (m) => {
    if (!confirm(`¿Eliminar a ${m.firstName} ${m.lastName}? Sus ventas se mantienen en tu historial.`)) return
    try {
      await api.delete(`/gyms/${gym.id}/members/${m.id}`)
      afterChange('Socio eliminado')
    } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        eyebrow={gym.name}
        title="Socios"
        subtitle="Inscribe socios, cobra sus planes y guarda sus observaciones."
        actions={<Button onClick={() => setEditing({})}><UserPlus className="h-4 w-4" /> Nuevo socio</Button>}
      />

      {counts && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Counter label="Registrados" value={counts.totalMembers} />
          <Counter label="Con plan vigente" value={counts.membersWithValidPlan} tone="text-emerald-300" />
          <Counter label="Vencen en 7 días" value={counts.expiringNext7Days} tone={counts.expiringNext7Days ? 'text-amber-300' : undefined} />
        </div>
      )}

      <div className="space-y-4">
        <Alert>{error}</Alert>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-subtle" />
            <input className="input pl-10" placeholder="Buscar por nombre, teléfono, email o cédula…" value={q}
                   onChange={(e) => { setQ(e.target.value); setPage(0) }} />
          </div>
          <Segmented label="Estado" value={status} onChange={(v) => { setStatus(v); setPage(0) }}
            options={[{ value: '', label: 'Todos' }, { value: 'ACTIVE', label: 'Activos' }, { value: 'INACTIVE', label: 'Inactivos' }]} />
        </div>

        <div className="card overflow-hidden">
          {!data ? <Spinner /> : data.content.length === 0 ? (
            <EmptyState icon={Users} title={q ? 'No se encontraron socios' : 'Aún no hay socios'}
              text={q ? 'Prueba con otra búsqueda.' : 'Inscribe a tu primer socio; puedes cobrarle el plan en el mismo paso.'}
              action={!q && <Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Nuevo socio</Button>} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-line">
                    <tr>
                      <th className="th">Socio</th>
                      <th className="th hidden sm:table-cell">Plan</th>
                      <th className="th">Membresía</th>
                      <th className="th hidden lg:table-cell">Observaciones</th>
                      <th className="th"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.content.map((m) => {
                      const full = `${m.firstName} ${m.lastName}`
                      const wa = whatsappLink(m.phone)
                      return (
                        <tr key={m.id} className="transition hover:bg-surface-2/60">
                          <td className="td">
                            <button onClick={() => setEditing(m)} className="flex items-center gap-3 text-left">
                              <Avatar name={full} size="sm" />
                              <span className="min-w-0">
                                <span className="block font-semibold text-fg hover:text-brand-200">{full}</span>
                                <span className="block text-xs text-subtle">
                                  {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-emerald-300">{m.phone}</a> : m.email || 'Sin contacto'}
                                  {m.status === 'INACTIVE' && <span className="ml-2 text-rose-300">· Inactivo</span>}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="td hidden sm:table-cell">{m.planName || <span className="text-subtle">—</span>}</td>
                          <td className="td"><MembershipBadge endsAt={m.membershipEndsAt} /></td>
                          <td className="td hidden max-w-xs truncate text-muted lg:table-cell" title={m.observations || ''}>{m.observations || <span className="text-subtle">—</span>}</td>
                          <td className="td">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="secondary" size="sm" onClick={() => setSelling(m)}><Receipt className="h-3.5 w-3.5" /> Cobrar</Button>
                              <IconBtn label="Editar" onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /></IconBtn>
                              <IconBtn label="Eliminar" onClick={() => remove(m)} danger><Trash2 className="h-4 w-4" /></IconBtn>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={data.number} totalPages={data.totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>

      <Drawer open={!!editing} onClose={closeEditor} title={editing?.id ? 'Editar socio' : 'Nuevo socio'}
              subtitle={editing?.id ? `${editing.firstName} ${editing.lastName}` : 'Datos, plan y cobro en un solo paso'}>
        {editing && <MemberForm gymId={gym.id} member={editing} onCancel={closeEditor} onSaved={(_, msg) => { closeEditor(); afterChange(msg) }} />}
      </Drawer>

      <Drawer open={!!selling} onClose={() => setSelling(null)} title="Cobrar o renovar" subtitle={selling ? `${selling.firstName} ${selling.lastName}` : ''}>
        {selling && <SaleForm gymId={gym.id} member={selling} onCancel={() => setSelling(null)}
                              onSaved={(s) => { setSelling(null); afterChange(`Venta registrada: ${s.concept}`) }} />}
      </Drawer>
    </>
  )
}

function Counter({ label, value, tone = 'text-fg' }) {
  return (
    <div className="card px-4 py-3">
      <p className="hud-label">{label}</p>
      <p className={`num mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function IconBtn({ label, onClick, danger, children }) {
  return (
    <button title={label} aria-label={label} onClick={onClick}
            className={`rounded-lg p-2 text-subtle transition hover:bg-surface-3 ${danger ? 'hover:text-rose-300' : 'hover:text-brand-200'}`}>
      {children}
    </button>
  )
}

function MembershipBadge({ endsAt }) {
  if (!endsAt) return <Badge>Sin plan</Badge>
  const days = daysUntil(endsAt)
  if (days < 0) return <Badge tone="red" dot>Venció {date(endsAt)}</Badge>
  if (days <= 7) return <Badge tone="amber" dot>{days === 0 ? 'Vence hoy' : `Vence en ${days} ${days === 1 ? 'día' : 'días'}`}</Badge>
  return <Badge tone="green" dot>Hasta {date(endsAt)}</Badge>
}
