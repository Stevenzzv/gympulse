import { useEffect, useState } from 'react'
import { Tag } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { addDays, longDate, methodLabel, money, todayISO } from '../lib/format'
import { Alert, Button, DrawerBody, Field, FormSection, Segmented } from './ui'
import PlanPicker from './PlanPicker'
import PaymentChips from './PaymentChips'

const QUICK_NOTES = ['Lesión', 'Condición médica', 'Objetivo: bajar de peso', 'Objetivo: ganar masa', 'Prefiere mañanas', 'Referido por un socio']

/**
 * New / edit member in three steps. For a new member with a plan, "Cobrar ahora" registers the sale too,
 * and the sale is what sets the plan and the expiry date (same rule as any other sale).
 */
export default function MemberForm({ gymId, member, onSaved, onCancel }) {
  const editing = !!member?.id
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({
    firstName: member?.firstName || '', lastName: member?.lastName || '', documentId: member?.documentId || '',
    phone: member?.phone || '', email: member?.email || '', birthDate: member?.birthDate || '',
    observations: member?.observations || '', status: member?.status || 'ACTIVE',
    planId: member?.planId ?? '', startDate: member?.joinedAt || todayISO(), membershipEndsAt: member?.membershipEndsAt || '',
  })
  const [charge, setCharge] = useState(true)
  const [method, setMethod] = useState('CASH')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get(`/gyms/${gymId}/plans`).then(({ data }) => setPlans(data.filter((p) => p.active || p.id === member?.planId)))
  }, [gymId, member?.planId])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const plan = plans.find((p) => p.id === Number(form.planId))
  const endPreview = plan ? addDays(form.startDate || todayISO(), plan.durationDays) : null
  const willCharge = !editing && plan && charge

  const addNote = (tag) => setForm((f) => ({ ...f, observations: f.observations ? `${f.observations.trimEnd()}\n• ${tag}: ` : `• ${tag}: ` }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const base = {
      firstName: form.firstName, lastName: form.lastName, documentId: form.documentId, phone: form.phone,
      email: form.email, birthDate: form.birthDate || null, observations: form.observations, status: form.status,
      joinedAt: form.startDate || null,
    }
    try {
      if (editing) {
        const { data } = await api.put(`/gyms/${gymId}/members/${member.id}`, {
          ...base, planId: form.planId ? Number(form.planId) : null, membershipEndsAt: form.membershipEndsAt || null,
        })
        onSaved(data, 'Cambios guardados')
        return
      }
      if (willCharge) {
        const { data: created } = await api.post(`/gyms/${gymId}/members`, { ...base, planId: null, membershipEndsAt: null })
        const time = new Date().toTimeString().slice(0, 8)
        await api.post(`/gyms/${gymId}/sales`, {
          memberId: created.id, planId: plan.id, paymentMethod: method, soldAt: `${form.startDate || todayISO()}T${time}`,
        })
        onSaved(created, `${created.firstName} quedó inscrito y se registró el cobro de ${money(plan.price)}`)
      } else {
        const { data } = await api.post(`/gyms/${gymId}/members`, {
          ...base, planId: plan ? plan.id : null, membershipEndsAt: endPreview,
        })
        onSaved(data, `${data.firstName} quedó inscrito`)
      }
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <DrawerBody
      onSubmit={submit}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {willCharge
              ? <><p className="hud-label">Cobro</p><p className="num text-xl font-semibold text-fg">{money(plan.price)} <span className="font-sans text-xs font-normal text-subtle">· {methodLabel(method)}</span></p></>
              : <p className="text-subtle">{editing ? 'Los cambios se guardan al confirmar.' : 'Sin cobro por ahora.'}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" loading={busy}>{editing ? 'Guardar' : willCharge ? 'Inscribir y cobrar' : 'Inscribir socio'}</Button>
          </div>
        </div>
      }
    >
      <Alert>{error}</Alert>

      <FormSection step="1" title="Datos personales">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombres"><input className="input" required autoFocus value={form.firstName} onChange={set('firstName')} /></Field>
          <Field label="Apellidos"><input className="input" required value={form.lastName} onChange={set('lastName')} /></Field>
          <Field label="WhatsApp / teléfono"><input className="input" type="tel" placeholder="09XXXXXXXX" value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Cédula / pasaporte"><input className="input" value={form.documentId} onChange={set('documentId')} /></Field>
          <Field label="Email (opcional)"><input className="input" type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Nacimiento (opcional)"><input className="input" type="date" value={form.birthDate} onChange={set('birthDate')} /></Field>
        </div>
      </FormSection>

      <FormSection step="2" title="Membresía">
        <PlanPicker plans={plans} value={form.planId} onChange={(id) => setForm({ ...form, planId: id })} noneLabel="Sin plan por ahora" />
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vence la membresía" hint="Se actualiza sola al cobrar un plan.">
              <input className="input" type="date" value={form.membershipEndsAt} onChange={set('membershipEndsAt')} />
            </Field>
            <Field label="Estado">
              <Segmented value={form.status} onChange={(v) => setForm({ ...form, status: v })} label="Estado"
                options={[{ value: 'ACTIVE', label: 'Activo' }, { value: 'INACTIVE', label: 'Inactivo' }]} />
            </Field>
          </div>
        ) : plan && (
          <div className="space-y-4 rounded-xl border border-line bg-surface-2 p-4">
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <Field label="Empieza el"><input className="input" type="date" value={form.startDate} onChange={set('startDate')} /></Field>
              <div className="pb-1">
                <p className="hud-label">Vence el</p>
                <p className="mt-1 font-semibold text-brand-200">{longDate(endPreview)}</p>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-5 w-5 rounded accent-[#22c8f5]" checked={charge} onChange={(e) => setCharge(e.target.checked)} />
              <span className="text-sm"><b>Cobrar ahora</b> <span className="text-muted">— registra la venta de {money(plan.price)} y aparece en tus estadísticas</span></span>
            </label>
            {charge && <PaymentChips value={method} onChange={setMethod} />}
          </div>
        )}
      </FormSection>

      <FormSection step="3" title="Observaciones">
        <div className="flex flex-wrap gap-2">
          {QUICK_NOTES.map((t) => (
            <button key={t} type="button" onClick={() => addNote(t)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-3 py-1 text-xs text-muted hover:border-brand-400 hover:text-brand-200">
              <Tag className="h-3 w-3" /> {t}
            </button>
          ))}
        </div>
        <textarea className="input min-h-[110px]" value={form.observations} onChange={set('observations')}
                  placeholder="Lesiones, objetivos, notas médicas, preferencias…" />
      </FormSection>
    </DrawerBody>
  )
}
