import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Receipt, Trash2 } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { dateTime, methodLabel, money, todayISO } from '../../lib/format'
import { Alert, Badge, Button, EmptyState, Field, Modal, PageHeader, Pagination, Spinner } from '../../components/ui'
import RequireGym from '../../components/RequireGym'
import SaleForm from '../../components/SaleForm'

export default function Sales() {
  return <RequireGym><SalesContent /></RequireGym>
}

const firstOfMonth = () => todayISO().slice(0, 8) + '01'

function SalesContent() {
  const { gym } = useGym()
  const [params, setParams] = useSearchParams()
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(todayISO())
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const creating = params.get('new') === '1'
  const setCreating = (v) => setParams(v ? { new: '1' } : {})

  const load = useCallback(() => {
    api.get(`/gyms/${gym.id}/sales`, { params: { from: from || undefined, to: to || undefined, page, size: 20 } })
      .then(({ data }) => setData(data))
      .catch((e) => setError(errorMessage(e)))
  }, [gym.id, from, to, page])

  useEffect(() => { load() }, [load])

  const remove = async (s) => {
    if (!confirm(`¿Eliminar la venta "${s.concept}" de ${money(s.amount)}?`)) return
    try {
      await api.delete(`/gyms/${gym.id}/sales/${s.id}`)
      load()
    } catch (e) { setError(errorMessage(e)) }
  }

  const pageTotal = data?.content.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle="Cada membresía, producto y servicio que vendes."
        actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nueva venta</Button>}
      />
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Desde"><input type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0) }} /></Field>
          <Field label="Hasta"><input type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); setPage(0) }} /></Field>
          {data && (
            <p className="ml-auto text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{data.totalElements}</span> ventas en el rango
              {data.totalPages > 1 ? <> · en esta página <span className="font-semibold text-slate-900">{money(pageTotal)}</span></>
                : <> · total <span className="font-semibold text-slate-900">{money(pageTotal)}</span></>}
            </p>
          )}
        </div>

        <div className="card overflow-hidden">
          {!data ? <Spinner /> : data.content.length === 0 ? (
            <EmptyState icon={Receipt} title="No hay ventas en este periodo" text="Registra una venta o amplía el rango de fechas."
                        action={<Button onClick={() => setCreating(true)}>Nueva venta</Button>} />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="th">Fecha</th>
                      <th className="th">Concepto</th>
                      <th className="th">Socio</th>
                      <th className="th">Método</th>
                      <th className="th text-right">Monto</th>
                      <th className="th"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.content.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="td whitespace-nowrap text-slate-500">{dateTime(s.soldAt)}</td>
                        <td className="td">
                          <span className="font-medium text-slate-900">{s.concept}</span>
                          {s.planId && <span className="ml-2"><Badge tone="brand">Plan</Badge></span>}
                          {s.notes && <p className="text-xs text-slate-500">{s.notes}</p>}
                        </td>
                        <td className="td">{s.memberName || <span className="text-slate-400">Ocasional</span>}</td>
                        <td className="td">{methodLabel(s.paymentMethod)}</td>
                        <td className="td text-right font-semibold text-slate-900">{money(s.amount)}</td>
                        <td className="td text-right">
                          <button onClick={() => remove(s)} aria-label="Eliminar venta" title="Eliminar"
                                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600">
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

      <Modal open={creating} onClose={() => setCreating(false)} title="Registrar venta">
        {creating && (
          <SaleForm gymId={gym.id} onCancel={() => setCreating(false)}
                    onSaved={() => { setCreating(false); setTo(todayISO()); load() }} />
        )}
      </Modal>
    </>
  )
}
