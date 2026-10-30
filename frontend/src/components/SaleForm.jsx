import { useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'
import { PAYMENT_METHODS, methodLabel, money } from '../lib/format'
import { Alert, Button, Field } from './ui'

/**
 * Registers a sale. Picking a plan fills concept and amount; if a member is also chosen,
 * the backend renews their membership by the plan duration.
 */
export default function SaleForm({ gymId, member, onSaved, onCancel }) {
  const [plans, setPlans] = useState([])
  const [members, setMembers] = useState(member ? [member] : [])
  const [memberQuery, setMemberQuery] = useState('')
  const [form, setForm] = useState({
    memberId: member?.id ?? '', planId: member?.planId ?? '', concept: '', amount: '',
    paymentMethod: 'CASH', notes: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get(`/gyms/${gymId}/plans`).then(({ data }) => setPlans(data.filter((p) => p.active)))
  }, [gymId])

  useEffect(() => {
    if (member) return
    const t = setTimeout(() => {
      api.get(`/gyms/${gymId}/members`, { params: { q: memberQuery, size: 20, status: 'ACTIVE' } })
        .then(({ data }) => setMembers(data.content))
    }, 250)
    return () => clearTimeout(t)
  }, [gymId, memberQuery, member])

  const plan = plans.find((p) => p.id === Number(form.planId))
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = {
        memberId: form.memberId ? Number(form.memberId) : null,
        planId: form.planId ? Number(form.planId) : null,
        concept: form.concept || null,
        amount: form.amount === '' ? null : Number(form.amount),
        paymentMethod: form.paymentMethod,
        notes: form.notes || null,
      }
      const { data } = await api.post(`/gyms/${gymId}/sales`, payload)
      onSaved(data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert>{error}</Alert>
      <Field label="Plan" hint={plan && form.memberId ? `Renueva al socio por ${plan.durationDays} días.` : 'Déjalo vacío para vender un producto o servicio.'}>
        <select className="input" value={form.planId} onChange={set('planId')}>
          <option value="">— Sin plan (producto / servicio) —</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name} · {money(p.price)} · {p.durationDays} días</option>)}
        </select>
      </Field>

      {member ? (
        <Field label="Socio"><input className="input" disabled value={`${member.firstName} ${member.lastName}`} /></Field>
      ) : (
        <Field label="Socio (opcional)">
          <input className="input mb-2" placeholder="Buscar por nombre, email, teléfono…" value={memberQuery}
                 onChange={(e) => setMemberQuery(e.target.value)} />
          <select className="input" value={form.memberId} onChange={set('memberId')}>
            <option value="">— Cliente ocasional / sin socio —</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}{m.email ? ` · ${m.email}` : ''}</option>)}
          </select>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Concepto">
          <input className="input" placeholder={plan?.name || 'Ej. Batido de proteína'} required={!plan}
                 value={form.concept} onChange={set('concept')} />
        </Field>
        <Field label="Monto">
          <input className="input" type="number" step="0.01" min="0" placeholder={plan ? String(plan.price) : '0.00'}
                 required={!plan} value={form.amount} onChange={set('amount')} />
        </Field>
      </div>
      <Field label="Método de pago">
        <select className="input" value={form.paymentMethod} onChange={set('paymentMethod')}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
        </select>
      </Field>
      <Field label="Notas">
        <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={busy}>Registrar venta</Button>
      </div>
    </form>
  )
}
