import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Receipt, Trash2 } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { addDays, dateTime, methodLabel, money, todayISO } from '../../lib/format'
import { Alert, Avatar, Badge, Button, Drawer, EmptyState, Field, PageHeader, Pagination, Segmented, Spinner, useToast } from '../../components/ui'
import RequireGym from '../../components/RequireGym'
import SaleForm from '../../components/SaleForm'

export default function Sales() {
  return <RequireGym><SalesContent /></RequireGym>
}

/** Date range for each preset, as [from, to] in YYYY-MM-DD. */
function presetRange(preset) {
  const today = todayISO()
  const first = today.slice(0, 8) + '01'
  if (preset === 'today') return [today, today]
  if (preset === '7d') return [addDays(today, -6), today]
  if (preset === 'lastMonth') {
    const lastDay = addDays(first, -1)
    return [lastDay.slice(0, 8) + '01', lastDay]
  }
  return [first, today] // this month
}

function SalesContent() {
  const { gym } = useGym()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [preset, setPreset] = useState('month')
  const [[from, to], setRange] = useState(presetRange('month'))
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const creating = params.get('new') === '1'
  const setCreating = (v) => setParams(v ? { new: '1' } : {})

  const choosePreset = (p) => {
    setPreset(p)
    if (p !== 'custom') setRange(presetRange(p))
    setPage(0)
  }

  const load = useCallback(() => {
    const range = { from: from || undefined, to: to || undefined }
    api.get(`/gyms/${gym.id}/sales`, { params: { ...range, page, size: 20 } })
      .then(({ data }) => setData(data)).catch((e) => setError(errorMessage(e)))
    api.get(`/gyms/${gym.id}/sales/summary`, { params: range })
      .then(({ data }) => setSummary(data)).catch(() => {})
  }, [gym.id, from, to, page])

  useEffect(() => { load() }, [load])

  const remove = async (s) => {
    if (!confirm(`¿Eliminar la venta "${s.concept}" de ${money(s.amount)}?`)) return
    try {
      await api.delete(`/gyms/${gym.id}/sales/${s.id}`)
      toast('Venta eliminada')
      load()
    } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        eyebrow={gym.name}
        title="Ventas"
        subtitle="Membresías, productos y servicios cobrados."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nueva venta</Button>}
      />

      <div className="space-y-5">
        <Alert>{error}</Alert>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="overflow-x-auto">
            <Segmented label="Periodo" value={preset} onChange={choosePreset} options={[
              { value: 'today', label: 'Hoy' }, { value: '7d', label: '7 días' }, { value: 'month', label: 'Este mes' },
              { value: 'lastMonth', label: 'Mes pasado' }, { value: 'custom', label: 'Elegir fechas' },
            ]} />
          </div>
          {preset === 'custom' && (
            <div className="flex gap-3">
              <Field label="Desde"><input type="date" className="input" value={from} onChange={(e) => { setRange([e.target.value, to]); setPage(0) }} /></Field>
              <Field label="Hasta"><input type="date" className="input" value={to} onChange={(e) => { setRange([from, e.target.value]); setPage(0) }} /></Field>
            </div>
          )}
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total cobrado" value={money(summary.total)} accent />
            <Stat label="Ventas" value={summary.count} />
            <Stat label="Ticket promedio" value={money(summary.averageTicket)} />
          </div>
        )}

        <div className="card overflow-hidden">
          {!data ? <Spinner /> : data.content.length === 0 ? (
            <EmptyState icon={Receipt} title="Sin ventas en este periodo" text="Registra una venta o elige otro periodo."
                        action={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nueva venta</Button>} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-line">
                    <tr>
                      <th className="th">Concepto</th>
                      <th className="th hidden md:table-cell">Socio</th>
                      <th className="th hidden sm:table-cell">Método</th>
                      <th className="th text-right">Monto</th>
                      <th className="th"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.content.map((s) => (
                      <tr key={s.id} className="transition hover:bg-surface-2/60">
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-fg">{s.concept}</span>
                            {s.planId && <Badge tone="brand">Plan</Badge>}
                          </div>
                          <p className="num text-xs text-subtle">{dateTime(s.soldAt)}</p>
                          {s.notes && <p className="text-xs text-muted">{s.notes}</p>}
                        </td>
                        <td className="td hidden md:table-cell">
                          {s.memberName
                            ? <span className="flex items-center gap-2"><Avatar name={s.memberName} size="sm" />{s.memberName}</span>
                            : <span className="text-subtle">Cliente ocasional</span>}
                        </td>
                        <td className="td hidden sm:table-cell text-muted">{methodLabel(s.paymentMethod)}</td>
                        <td className="td num text-right text-base font-semibold text-fg">{money(s.amount)}</td>
                        <td className="td text-right">
                          <button onClick={() => remove(s)} aria-label="Eliminar venta" title="Eliminar"
                                  className="rounded-lg p-2 text-subtle hover:bg-surface-3 hover:text-rose-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      <Drawer open={creating} onClose={() => setCreating(false)} title="Nueva venta" subtitle="Membresía o producto, en segundos">
        {creating && (
          <SaleForm gymId={gym.id} onCancel={() => setCreating(false)}
                    onSaved={(s) => { setCreating(false); toast(`Venta registrada: ${s.concept} · ${money(s.amount)}`); load() }} />
        )}
      </Drawer>
    </>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className={`card px-4 py-3 ${accent ? 'border-brand-400/40' : ''}`}>
      <p className="hud-label">{label}</p>
      <p className={`num mt-1 truncate text-xl font-semibold sm:text-2xl ${accent ? 'text-brand-200' : 'text-fg'}`}>{value}</p>
    </div>
  )
}
