import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Building2, Check, ClipboardList, Cloud, Globe, Landmark, QrCode, Receipt, ShieldCheck, Users,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { money, monthsLabel } from '../lib/format'
import { Logo } from '../components/ui'

const features = [
  { icon: BarChart3, title: 'Estadísticas en vivo', text: 'Ingresos del mes, ticket promedio, inscripciones, planes más vendidos y métodos de pago.' },
  { icon: Receipt, title: 'Ventas en segundos', text: 'Membresías, entrenamiento personal, batidos o ropa. Al cobrar un plan, el socio se renueva solo.' },
  { icon: Users, title: 'Socios y observaciones', text: 'Contacto, plan, vencimiento y notas privadas como lesiones u objetivos, en una sola ficha.' },
  { icon: ClipboardList, title: 'Planes a tu medida', text: 'Pase diario, mensual, trimestral o anual. Tú pones precio y duración; GymPulse controla los vencimientos.' },
  { icon: Building2, title: 'Varias sucursales', text: 'Cambia de gimnasio con un clic. Cada sucursal tiene sus propios datos y estadísticas.' },
  { icon: Cloud, title: 'Seguro en la nube', text: 'Conexión cifrada, copia en la nube y cada gimnasio ve solo sus datos. Desde cualquier dispositivo.' },
]

const steps = [
  ['Crea tu cuenta', 'En un minuto, sin tarjeta. Tienes 7 días con todas las funciones.'],
  ['Carga tus planes y socios', 'Inscribe a cada socio y cóbrale el plan en el mismo paso.'],
  ['Mira crecer tu negocio', 'Cada venta alimenta tu panel: sabes cuánto entra y quién está por vencer.'],
]

const faqs = [
  ['¿Necesito tarjeta para la prueba?', 'No. Creas tu cuenta y usas todo durante 7 días. Pagas solo si decides continuar.'],
  ['¿Cómo pago desde Ecuador?', 'Por transferencia bancaria o DeUna. Registras el comprobante en la app y activamos tu plan apenas verificamos el pago, normalmente el mismo día hábil.'],
  ['¿Y si estoy fuera de Ecuador?', 'Puedes pagar con PayPal, con tarjeta internacional o saldo PayPal.'],
  ['¿Qué pasa si se vence mi suscripción?', 'No se borra nada. Tus datos quedan en modo de solo lectura hasta que renueves.'],
  ['¿Puedo manejar más de un gimnasio?', 'Sí, una suscripción cubre todas tus sucursales.'],
]

const DEFAULT_PRICING = {
  trialDays: 7,
  plans: [
    { code: 'MONTHLY', name: 'Mensual', months: 1, price: 29 },
    { code: 'QUARTERLY', name: 'Trimestral', months: 3, price: 79 },
    { code: 'YEARLY', name: 'Anual', months: 12, price: 290 },
  ],
}

export default function Landing() {
  const { user } = useAuth()
  const [pricing, setPricing] = useState(DEFAULT_PRICING)

  useEffect(() => {
    document.title = 'GymPulse · Software para gimnasios'
    api.get('/public/pricing').then(({ data }) => setPricing(data)).catch(() => {})
  }, [])

  const base = pricing.plans.reduce((a, b) => (a.months <= b.months ? a : b))
  const savings = (p) => Math.round((1 - p.price / (base.price / base.months * p.months)) * 100)
  const cta = user ? { to: '/app', label: 'Ir a mi panel' } : { to: '/register', label: `Probar ${pricing.trialDays} días gratis` }

  return (
    <div className="overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="text-lg"><Logo /></Link>
          <nav className="hidden gap-8 text-sm font-medium text-muted md:flex">
            <a href="#funciones" className="hover:text-fg">Funciones</a>
            <a href="#precios" className="hover:text-fg">Precios</a>
            <a href="#preguntas" className="hover:text-fg">Preguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            {!user && <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-fg">Ingresar</Link>}
            <Link to={user ? '/app' : '/register'} className="whitespace-nowrap rounded-xl bg-brand-400 px-4 py-2 text-sm font-semibold text-ink shadow-glow hover:bg-brand-300">
              {user ? 'Ir al panel' : 'Prueba gratis'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-brand-400/20 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[.16em] text-brand-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-300" /> {pricing.trialDays} días gratis · sin tarjeta
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            El sistema operativo <br className="hidden sm:block" />de tu <span className="gradient-text">gimnasio</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Socios, planes, ventas y estadísticas en un solo panel en la nube. Deja el cuaderno y el Excel:
            sabe cuánto ganas y quién está por vencer.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={cta.to} className="inline-flex items-center gap-2 rounded-xl bg-brand-400 px-6 py-3.5 text-base font-semibold text-ink shadow-glow hover:bg-brand-300">
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
            {!user && <Link to="/login" className="rounded-xl border border-line-strong px-6 py-3.5 text-base font-semibold text-fg hover:border-brand-400/60">Ya tengo cuenta</Link>}
          </div>
          <PanelPreview />
        </div>
      </section>

      {/* Features */}
      <section id="funciones" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <p className="hud-label text-center">Funciones</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-3xl font-bold sm:text-4xl">Todo lo que tu gimnasio necesita, nada que no uses</h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group bg-surface p-7 transition hover:bg-surface-2">
              <Icon className="h-6 w-6 text-brand-300 transition group-hover:text-brand-200" />
              <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works: a real sequence, so it is numbered */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <div key={t} className="card p-6">
              <p className="num text-sm text-brand-300">PASO {String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-3 font-display text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="scroll-mt-20 border-y border-line bg-surface/50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="hud-label text-center">Precios</p>
          <h2 className="mt-3 text-center font-display text-3xl font-bold sm:text-4xl">Un precio simple, en dólares</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted">Todas las funciones y socios ilimitados en todos los planes. Empieza con {pricing.trialDays} días gratis.</p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
            {pricing.plans.map((p) => {
              const featured = p.months === 12
              const off = savings(p)
              return (
                <div key={p.code} className={`relative flex flex-col rounded-2xl border p-7 ${featured ? 'border-brand-400/60 bg-surface-2 shadow-glow' : 'border-line bg-surface'}`}>
                  {featured && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent" />}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    {off > 0 && <span className="rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-400/30">Ahorra {off}%</span>}
                  </div>
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="num text-4xl font-semibold tracking-tight">{money(p.price)}</span>
                    <span className="text-sm text-subtle">/ {monthsLabel(p.months)}</span>
                  </p>
                  <p className="mt-1 h-5 text-sm text-muted">{p.months > 1 && <>equivale a <span className="num">{money(p.price / p.months)}</span> al mes</>}</p>
                  <ul className="mt-6 space-y-3 text-sm text-fg/90">
                    {['Socios y planes ilimitados', 'Ventas y estadísticas', 'Varias sucursales', 'Soporte por WhatsApp'].map((f) => (
                      <li key={f} className="flex gap-3"><Check className="h-5 w-5 flex-none text-brand-300" />{f}</li>
                    ))}
                  </ul>
                  <Link to="/register" className={`mt-8 block rounded-xl px-6 py-3 text-center font-semibold transition ${featured ? 'bg-brand-400 text-ink hover:bg-brand-300' : 'border border-line-strong text-fg hover:border-brand-400/60'}`}>
                    Empezar gratis
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[[Landmark, 'Transferencia', 'Bancos de Ecuador'], [QrCode, 'DeUna', 'Desde tu celular'], [Globe, 'PayPal', 'Tarjeta internacional']].map(([Icon, t, d]) => (
              <div key={t} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                <Icon className="h-5 w-5 flex-none text-brand-300" />
                <div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-subtle">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <p className="hud-label text-center">Preguntas frecuentes</p>
        <h2 className="mt-3 text-center font-display text-3xl font-bold">Lo que suelen preguntarnos</h2>
        <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}<span className="grid h-6 w-6 flex-none place-items-center rounded-md border border-line-strong text-brand-300 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-brand-400/30 bg-surface-2 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-violet-500/25 blur-[90px]" />
          <ShieldCheck className="relative mx-auto h-8 w-8 text-brand-300" />
          <h2 className="relative mt-4 font-display text-3xl font-bold">Tu gimnasio, bajo control desde hoy</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted">Configúralo en menos de cinco minutos. Si no te convence, no pagas nada.</p>
          <Link to={cta.to} className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-400 px-6 py-3.5 font-semibold text-ink shadow-glow hover:bg-brand-300">
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-subtle sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} GymPulse</p>
          <nav className="flex gap-6">
            <Link to="/terminos" className="hover:text-fg">Términos</Link>
            <Link to="/privacidad" className="hover:text-fg">Privacidad</Link>
            <Link to="/login" className="hover:text-fg">Ingresar</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

/** Static mock of the dashboard for the hero section. */
function PanelPreview() {
  const bars = [38, 45, 41, 52, 60, 58, 66, 72, 69, 80, 86, 94]
  return (
    <div className="relative mx-auto mt-16 max-w-4xl text-left">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-brand-400/50 via-line to-transparent" aria-hidden="true" />
      <div className="relative rounded-2xl bg-surface p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <span className="hud-label">Panel · Iron Temple Fitness</span>
          <span className="flex gap-1.5" aria-hidden="true"><i className="h-2 w-2 rounded-full bg-line-strong" /><i className="h-2 w-2 rounded-full bg-line-strong" /><i className="h-2 w-2 rounded-full bg-brand-400" /></span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['Ingresos del mes', '$4.820', true], ['Ventas', '212'], ['Plan vigente', '148'], ['Nuevos', '+23']].map(([l, v, hl]) => (
            <div key={l} className={`rounded-xl border p-3 ${hl ? 'border-brand-400/40 bg-brand-400/5' : 'border-line bg-surface-2'}`}>
              <p className="hud-label">{l}</p>
              <p className={`num mt-1 text-xl font-semibold ${hl ? 'text-brand-100' : 'text-fg'}`}>{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex h-40 items-end gap-1.5 border-b border-line sm:gap-3" aria-hidden="true">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: '#2b9be0', opacity: i === bars.length - 1 ? 1 : 0.45 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
