import { useEffect, useState } from 'react'
import { ClipboardList, Package, Search, X } from 'lucide-react'
import { api, errorMessage } from '../lib/api'
import { addDays, longDate, methodLabel, money, todayISO } from '../lib/format'
import { Alert, Avatar, Button, DrawerBody, Field, FormSection, Segmented } from './ui'
import PlanPicker from './PlanPicker'
import PaymentChips from './PaymentChips'

/**
 * Registers a sale in two modes: a membership plan for a member (renews them) or a product / service.
 * Pass `member` to start with that member already chosen (the "Cobrar" button in Socios).
 */
export default function SaleForm({ gymId, member: initialMember, onSaved, onCancel }) {
  const [mode, setMode] = useState('plan')
  const [plans, setPlans] = useState([])
  const [quick, setQuick] = useState([])
  const [member, setMember] = useState(initialMember || null)
  const [planId, setPlanId] = useState(initialMember?.planId ?? '')
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get(`/gyms/${gymId}/plans`).then(({ data }) => setPlans(data.filter((p) => p.active)))
    // Recent products become one-tap shortcuts
    api.get(`/gyms/${gymId}/sales`, { params: { size: 60 } }).then(({ data }) => {
      const seen = new Map()
      data.content.filter((s) => !s.planId).forEach((s) => { if (!seen.has(s.concept)) seen.set(s.concept, s.amount) })
      setQuick([...seen.entries()].slice(0, 6))
    }).catch(() => {})
  }, [gymId])

  const plan = plans.find((p) => p.id === Number(planId))
  const total = mode === 'plan' ? (amount !== '' ? Number(amount) : plan?.price) : Number(amount || 0)
  const today = todayISO()
  const renewFrom = member?.membershipEndsAt && member.membershipEndsAt >= today ? member.membershipEndsAt : today
  const canSubmit = mode === 'plan' ? !!(plan && member) : !!(concept.trim() && amount !== '')

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setError(mode === 'plan' ? 'Elige el socio y el plan.' : 'Escribe qué vendiste y el monto.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/gyms/${gymId}/sales`, mode === 'plan'
        ? { memberId: member.id, planId: plan.id, amount: amount === '' ? null : Number(amount), paymentMethod: method, notes: notes || null }
        : { memberId: member?.id ?? null, concept: concept.trim(), amount: Number(amount), paymentMethod: method, notes: notes || null })
      onSaved(data)
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
          <div>
            <p className="hud-label">Total</p>
            <p className="num text-2xl font-semibold text-fg">{money(total || 0)}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" loading={busy} disabled={!canSubmit}>Cobrar {money(total || 0)}</Button>
          </div>
        </div>
      }
    >
      <Segmented label="Tipo de venta" value={mode} onChange={(m) => { setMode(m); setError('') }}
        options={[{ value: 'plan', label: 'Membresía', icon: ClipboardList }, { value: 'product', label: 'Producto o servicio', icon: Package }]} />
      <Alert>{error}</Alert>

      {mode === 'plan' ? (
        <>
          <FormSection step="1" title="Socio">
            <MemberPicker gymId={gymId} value={member} onChange={(m) => { setMember(m); if (m?.planId && !planId) setPlanId(m.planId) }} locked={!!initialMember} />
          </FormSection>
          <FormSection step="2" title="Plan">
            <PlanPicker plans={plans} value={planId} onChange={setPlanId} />
            {plan && member && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-400/30 bg-brand-400/5 px-4 py-3 text-sm">
                <span className="text-muted">Nuevo vencimiento</span>
                <span className="font-semibold text-brand-200">{longDate(addDays(renewFrom, plan.durationDays))}</span>
              </div>
            )}
            {plan && (
              <Field label="Precio cobrado" hint="Cámbialo solo si haces un descuento.">
                <input className="input num" type="number" step="0.01" min="0" placeholder={String(plan.price)} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
            )}
          </FormSection>
        </>
      ) : (
        <FormSection step="1" title="Qué vendiste">
          {quick.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quick.map(([c, a]) => (
                <button key={c} type="button" onClick={() => { setConcept(c); setAmount(String(a)) }}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${concept === c ? 'border-brand-400 bg-brand-400/15 text-brand-200' : 'border-line-strong bg-surface-2 text-muted hover:text-fg'}`}>
                  {c} · <span className="num">{money(a)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <Field label="Concepto"><input className="input" placeholder="Ej. Batido de proteína" value={concept} onChange={(e) => setConcept(e.target.value)} /></Field>
            <Field label="Monto"><input className="input num" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          </div>
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-brand-300">Asociar a un socio (opcional)</summary>
            <div className="pt-3"><MemberPicker gymId={gymId} value={member} onChange={setMember} /></div>
          </details>
        </FormSection>
      )}

      <FormSection step={mode === 'plan' ? '3' : '2'} title="Pago">
        <PaymentChips value={method} onChange={setMethod} />
        <Field label="Nota (opcional)"><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={`Ej. Pagó con ${methodLabel(method).toLowerCase()}`} /></Field>
      </FormSection>
    </DrawerBody>
  )
}

/** Search-as-you-type member selector. */
function MemberPicker({ gymId, value, onChange, locked }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (value) return
    const t = setTimeout(() => {
      api.get(`/gyms/${gymId}/members`, { params: { q, size: 6, status: 'ACTIVE' } }).then(({ data }) => setResults(data.content))
    }, 200)
    return () => clearTimeout(t)
  }, [gymId, q, value])

  if (value) {
    const full = `${value.firstName} ${value.lastName}`
    return (
      <div className="flex items-center gap-3 rounded-xl border border-brand-400/40 bg-brand-400/5 p-3">
        <Avatar name={full} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{full}</p>
          <p className="text-xs text-muted">{value.membershipEndsAt ? `Membresía hasta ${longDate(value.membershipEndsAt)}` : 'Sin membresía'}</p>
        </div>
        {!locked && (
          <button type="button" onClick={() => onChange(null)} className="rounded-lg p-1.5 text-subtle hover:bg-surface-3 hover:text-fg" aria-label="Cambiar socio">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-subtle" />
        <input className="input pl-10" placeholder="Busca por nombre, teléfono o cédula…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        {results.length === 0
          ? <p className="p-4 text-center text-sm text-subtle">{q ? 'Nadie coincide con la búsqueda.' : 'Aún no hay socios activos.'}</p>
          : results.map((m) => (
            <button key={m.id} type="button" onClick={() => onChange(m)}
                    className="flex w-full items-center gap-3 border-t border-line px-3 py-2.5 text-left first:border-t-0 hover:bg-surface-3">
              <Avatar name={`${m.firstName} ${m.lastName}`} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.firstName} {m.lastName}</span>
              <span className="text-xs text-subtle">{m.planName || 'Sin plan'}</span>
            </button>
          ))}
      </div>
    </div>
  )
}
