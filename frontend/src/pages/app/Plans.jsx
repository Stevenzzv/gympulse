import { useCallback, useEffect, useState } from 'react'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { money } from '../../lib/format'
import { Alert, Badge, Button, EmptyState, Field, Modal, PageHeader, Spinner } from '../../components/ui'
import RequireGym from '../../components/RequireGym'

export default function Plans() {
  return <RequireGym><PlansContent /></RequireGym>
}

function PlansContent() {
  const { gym } = useGym()
  const [plans, setPlans] = useState(null)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    api.get(`/gyms/${gym.id}/plans`).then(({ data }) => setPlans(data)).catch((e) => setError(errorMessage(e)))
  }, [gym.id])
  useEffect(() => { load() }, [load])

  const remove = async (p) => {
    if (!confirm(`¿Eliminar el plan "${p.name}"? Los socios y las ventas pasadas se conservan. Consejo: puedes desactivarlo para ocultarlo de nuevas ventas.`)) return
    try {
      await api.delete(`/gyms/${gym.id}/plans/${p.id}`)
      load()
    } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        title="Planes"
        subtitle="Las membresías que vendes: precio y duración."
        actions={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Nuevo plan</Button>}
      />
      <Alert>{error}</Alert>
      {!plans ? <Spinner /> : plans.length === 0 ? (
        <div className="card">
          <EmptyState icon={ClipboardList} title="Aún no tienes planes" text="Crea planes como Mensual, Trimestral o Anual."
                      action={<Button onClick={() => setEditing({})}>Crear plan</Button>} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className={`card flex flex-col p-5 ${p.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                {!p.active && <Badge>Inactivo</Badge>}
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight">{money(p.price)}</p>
              <p className="text-sm text-slate-500">{p.durationDays} {p.durationDays === 1 ? 'día' : 'días'}</p>
              {p.description && <p className="mt-3 text-sm text-slate-600">{p.description}</p>}
              <div className="mt-auto flex gap-2 pt-5">
                <Button variant="secondary" className="flex-1" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /> Editar</Button>
                <Button variant="ghost" onClick={() => remove(p)} aria-label="Eliminar plan"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar plan' : 'Nuevo plan'}>
        {editing && <PlanForm gymId={gym.id} plan={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      </Modal>
    </>
  )
}

function PlanForm({ gymId, plan, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: plan.name || '', price: plan.price ?? '', durationDays: plan.durationDays ?? 30,
    description: plan.description || '', active: plan.active ?? true,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const payload = { ...form, price: Number(form.price), durationDays: Number(form.durationDays) }
    try {
      if (plan.id) await api.put(`/gyms/${gymId}/plans/${plan.id}`, payload)
      else await api.post(`/gyms/${gymId}/plans`, payload)
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
      <Field label="Nombre"><input className="input" required placeholder="Mensual" value={form.name} onChange={set('name')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Precio"><input className="input" type="number" step="0.01" min="0" required value={form.price} onChange={set('price')} /></Field>
        <Field label="Duración (días)"><input className="input" type="number" min="1" required value={form.durationDays} onChange={set('durationDays')} /></Field>
      </div>
      <Field label="Descripción"><textarea className="input" rows={2} value={form.description} onChange={set('description')} /></Field>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={form.active}
               onChange={(e) => setForm({ ...form, active: e.target.checked })} />
        Disponible para nuevas ventas
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={busy}>{plan.id ? 'Guardar' : 'Crear plan'}</Button>
      </div>
    </form>
  )
}
