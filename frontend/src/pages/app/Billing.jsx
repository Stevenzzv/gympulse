import { useEffect, useState } from 'react'
import {
  Check, CheckCircle2, Clock, Copy, ExternalLink, Globe, Landmark, MessageCircle, QrCode, RefreshCw, Upload,
} from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { SUBSCRIPTION_STATUS, date, daysUntil, money, monthsLabel, whatsappLink } from '../../lib/format'
import { Alert, Badge, Button, Field, PageHeader, Spinner } from '../../components/ui'
import PaymentHistory from '../../components/PaymentHistory'

export default function Billing() {
  const { user, refresh } = useAuth()
  const [billing, setBilling] = useState(null)
  const [planCode, setPlanCode] = useState(null)
  const [tab, setTab] = useState('local')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.get('/billing')
    .then(({ data }) => {
      setBilling(data)
      setPlanCode((c) => c ?? data.plans.find((p) => p.months === 12)?.code ?? data.plans[0]?.code)
    })
    .catch((e) => setError(errorMessage(e)))
  useEffect(() => { load() }, [])

  // The PayPal webhook may take a few seconds after paying.
  const checkAgain = async () => {
    setBusy(true)
    await Promise.all([load(), refresh()])
    setBusy(false)
  }

  const simulate = async () => {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post('/billing/simulate')
      setBilling(data)
      await refresh()
      setNotice('Pago simulado: suscripción extendida un mes.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (!billing) return error ? <Alert>{error}</Alert> : <Spinner />

  const plan = billing.plans.find((p) => p.code === planCode) || billing.plans[0]
  const base = billing.plans.reduce((a, b) => (a.months <= b.months ? a : b))
  const status = !billing.hasActiveAccess ? SUBSCRIPTION_STATUS.EXPIRED : SUBSCRIPTION_STATUS[billing.subscriptionStatus]
  const endsAt = billing.subscriptionStatus === 'TRIAL' ? billing.trialEndsAt : billing.subscriptionEndsAt
  const pending = billing.payments.find((p) => p.status === 'PENDING')
  const support = whatsappLink(billing.manualPayment.whatsapp,
    `Hola, soy ${user.fullName} (${user.email}). Tengo una consulta sobre mi suscripción de GymPulse.`)

  return (
    <>
      <PageHeader title="Suscripción" subtitle="Tu plan de GymPulse y tus pagos." />
      <div className="space-y-6">
        <Alert>{error}</Alert>
        <Alert tone="success">{notice}</Alert>

        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge tone={status.tone}>{status.label}</Badge>
            <p className="text-sm text-slate-600">
              {billing.hasActiveAccess
                ? <>Acceso hasta el <span className="font-semibold text-slate-900">{date(endsAt)}</span> ({daysUntil(endsAt)} días)</>
                : 'Tus datos están en modo de solo lectura hasta que renueves.'}
            </p>
          </div>
          {support && (
            <a href={support} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline">
              <MessageCircle className="h-4 w-4" /> ¿Dudas? Escríbenos por WhatsApp
            </a>
          )}
        </div>

        {pending && (
          <Alert tone="warning">
            <span className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 flex-none" />
              <span>
                Recibimos tu pago de <b>{money(pending.amount)}</b> ({monthsLabel(pending.months)}) del {date(pending.createdAt)}.
                Lo estamos verificando y activaremos tu plan apenas lo confirmemos, normalmente el mismo día hábil.
              </span>
            </span>
          </Alert>
        )}

        <section>
          <h2 className="mb-3 font-semibold text-slate-900">1. Elige tu plan</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {billing.plans.map((p) => {
              const selected = p.code === plan.code
              const off = Math.round((1 - p.price / (base.price / base.months * p.months)) * 100)
              return (
                <button key={p.code} onClick={() => setPlanCode(p.code)} aria-pressed={selected}
                        className={`relative rounded-xl border-2 bg-white p-4 text-left transition ${selected ? 'border-brand-600 ring-4 ring-brand-600/10' : 'border-slate-200 hover:border-slate-300'}`}>
                  {selected && <Check className="absolute right-3 top-3 h-5 w-5 text-brand-600" />}
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{money(p.price)}</p>
                  <p className="text-xs text-slate-500">
                    {monthsLabel(p.months)}{p.months > 1 && ` · ${money(p.price / p.months)}/mes`}
                  </p>
                  {off > 0 && <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Ahorras {off}%</span>}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-slate-900">2. Elige cómo pagar</h2>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-2 border-b border-slate-200" role="tablist">
              {[
                ['local', Landmark, 'Transferencia o DeUna', 'Ecuador'],
                ['paypal', Globe, 'PayPal', 'Internacional'],
              ].map(([key, Icon, label, sub]) => (
                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                        className={`flex items-center justify-center gap-2 px-3 py-3 text-sm font-semibold transition ${tab === key ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500 hover:text-slate-800'}`}>
                  <Icon className="h-4 w-4 flex-none" />
                  <span className="text-left leading-tight">{label}<span className="block text-xs font-normal text-slate-500">{sub}</span></span>
                </button>
              ))}
            </div>
            <div className="p-5">
              {tab === 'local'
                ? <LocalPayment billing={billing} plan={plan} disabled={!!pending} onSent={async () => {
                    setNotice('¡Gracias! Registramos tu pago y lo estamos verificando.')
                    await load()
                  }} />
                : <PaypalPayment plan={plan} email={user.email} busy={busy} onRefresh={checkAgain} />}
            </div>
          </div>
          {billing.simulationEnabled && (
            <button onClick={simulate} disabled={busy} className="mt-3 text-xs text-slate-400 hover:text-brand-600">
              Simular pago (solo desarrollo)
            </button>
          )}
        </section>

        <div className="card overflow-hidden">
          <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">Historial de pagos</h2>
          <PaymentHistory payments={billing.payments.map((p) => ({ payment: p }))}
                          receiptPath={(id) => `/billing/payments/${id}/receipt`} />
        </div>
      </div>
    </>
  )
}

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard not available */ }
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate font-medium text-slate-900">{value}</p>
      </div>
      <button onClick={copy} className="flex-none rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label={`Copiar ${label}`}>
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

function LocalPayment({ billing, plan, disabled, onSent }) {
  const bank = billing.manualPayment
  const [form, setForm] = useState({ method: 'TRANSFER', reference: '', note: '' })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const hasDeuna = bank.deunaQrUrl || bank.deunaPhone

  const submit = async (e) => {
    e.preventDefault()
    if (!form.reference.trim() && !file) {
      setError('Ingresa el número de comprobante o sube una foto del comprobante.')
      return
    }
    setBusy(true)
    setError('')
    const data = new FormData()
    data.append('planCode', plan.code)
    data.append('method', form.method)
    if (form.reference.trim()) data.append('reference', form.reference.trim())
    if (form.note.trim()) data.append('note', form.note.trim())
    if (file) data.append('receipt', file)
    try {
      await api.post('/billing/manual-payments', data)
      setForm({ method: 'TRANSFER', reference: '', note: '' })
      setFile(null)
      await onSent()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Paga <b className="text-slate-900">{money(plan.price)}</b> por el plan {plan.name.toLowerCase()} con cualquiera de estas opciones:
        </p>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900"><Landmark className="h-4 w-4 text-brand-600" /> Transferencia bancaria</p>
          <div className="divide-y divide-slate-100">
            <CopyRow label="Banco" value={bank.bankName} />
            <CopyRow label="Tipo de cuenta" value={bank.accountType} />
            <CopyRow label="Número de cuenta" value={bank.accountNumber} />
            <CopyRow label="Titular" value={bank.accountHolder} />
            <CopyRow label="Cédula / RUC" value={bank.holderId} />
            <CopyRow label="Email para el comprobante" value={bank.contactEmail} />
          </div>
        </div>
        {hasDeuna && (
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900"><QrCode className="h-4 w-4 text-brand-600" /> DeUna</p>
            {bank.deunaQrUrl && <img src={bank.deunaQrUrl} alt="Código QR de DeUna" className="mx-auto h-48 w-48 rounded-lg border border-slate-100 object-contain" />}
            <CopyRow label="Número DeUna" value={bank.deunaPhone} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-xl bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">¿Ya pagaste? Regístralo aquí</p>
        {disabled ? (
          <Alert tone="info">Ya tienes un pago en revisión. Podrás registrar otro cuando lo verifiquemos.</Alert>
        ) : (
          <>
            <Alert>{error}</Alert>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Método">
              {[['TRANSFER', 'Transferencia'], ['DEUNA', 'DeUna']].map(([v, l]) => (
                <button type="button" key={v} role="radio" aria-checked={form.method === v} onClick={() => setForm({ ...form, method: v })}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium ${form.method === v ? 'border-brand-600 bg-white text-brand-700' : 'border-slate-300 bg-white text-slate-600'}`}>
                  {l}
                </button>
              ))}
            </div>
            <Field label="Número de comprobante" hint="Lo encuentras en la app de tu banco o de DeUna.">
              <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Ej. 458812093" />
            </Field>
            <Field label="Foto o PDF del comprobante (opcional)">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-600 hover:border-brand-400">
                <Upload className="h-4 w-4 flex-none" />
                <span className="truncate">{file ? file.name : 'Elegir archivo (máx. 5 MB)'}</span>
                <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </Field>
            <Field label="Nota (opcional)">
              <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ej. Transferí desde Produbanco" />
            </Field>
            <Button type="submit" loading={busy} className="w-full">Enviar pago de {money(plan.price)}</Button>
            <p className="text-xs text-slate-500">Activamos tu plan apenas verificamos el pago, normalmente el mismo día hábil.</p>
          </>
        )}
      </form>
    </div>
  )
}

function PaypalPayment({ plan, email, busy, onRefresh }) {
  if (!plan.paypalLink) {
    return (
      <p className="text-sm text-slate-600">
        El pago con PayPal no está disponible para el plan {plan.name.toLowerCase()} por ahora. Usa transferencia o DeUna,
        o escríbenos para coordinar el pago.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md space-y-2 text-sm text-slate-600">
        <p>Paga con tarjeta internacional o con tu saldo de PayPal. Tu plan se activa automáticamente cuando PayPal confirma el pago.</p>
        <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
          <span>Usa la cuenta de PayPal con el email <b>{email}</b> para que reconozcamos tu pago.</span>
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:w-60">
        <a href={plan.paypalLink} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffc439] px-4 py-3 text-sm font-bold text-[#003087] shadow-sm hover:brightness-95">
          Pagar {money(plan.price)} con PayPal <ExternalLink className="h-4 w-4" />
        </a>
        <Button variant="secondary" loading={busy} onClick={onRefresh}><RefreshCw className="h-4 w-4" /> Ya pagué: actualizar</Button>
      </div>
    </div>
  )
}
