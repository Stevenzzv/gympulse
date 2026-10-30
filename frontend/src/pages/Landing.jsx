import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Building2, Check, ClipboardList, Cloud, Globe, Landmark, NotebookPen, QrCode, Receipt, Users,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { money, monthsLabel } from '../lib/format'
import { Logo } from '../components/ui'

const features = [
  { icon: BarChart3, title: 'Estadísticas de ventas', text: 'Ingresos del mes, ticket promedio, nuevas inscripciones, planes más vendidos y métodos de pago, en un solo panel.' },
  { icon: Receipt, title: 'Registro de ventas', text: 'Registra cada venta en segundos: membresías, entrenamiento personal, batidos o ropa. Al vender un plan, el socio se renueva solo.' },
  { icon: Users, title: 'Socios y observaciones', text: 'Cada socio con sus datos de contacto, plan, fecha de vencimiento y notas privadas como lesiones u objetivos.' },
  { icon: ClipboardList, title: 'Planes a tu medida', text: 'Pase diario, mensual, trimestral o anual: define precio y duración y nosotros controlamos los vencimientos.' },
  { icon: Building2, title: 'Varias sucursales', text: '¿Tienes más de un local? Cambia de gimnasio con un clic, cada uno con sus propios datos y estadísticas.' },
  { icon: Cloud, title: 'Tus datos siempre guardados', text: 'Todo queda seguro en la nube. Sin hojas de Excel ni cuadernos perdidos, desde cualquier dispositivo.' },
]

const faqs = [
  ['¿Necesito tarjeta para la prueba gratis?', 'No. Crea tu cuenta y usa todas las funciones durante la prueba. Pagas solo si decides continuar.'],
  ['¿Cómo pago desde Ecuador?', 'Por transferencia bancaria o DeUna. Registras el número de comprobante en la app y activamos tu plan apenas verificamos el pago, normalmente el mismo día.'],
  ['¿Y si estoy fuera de Ecuador?', 'Puedes pagar con PayPal (tarjeta o saldo PayPal). Tu plan se activa automáticamente al confirmarse el pago.'],
  ['¿Qué pasa si se vence mi suscripción?', 'No se borra nada. Tus datos quedan disponibles en modo de solo lectura hasta que renueves.'],
  ['¿Puedo manejar más de un gimnasio?', 'Sí, una sola suscripción cubre todas tus sucursales.'],
]

const DEFAULT_PRICING = {
  trialDays: 14,
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
    api.get('/public/pricing').then(({ data }) => setPricing(data)).catch(() => {})
  }, [])

  const base = pricing.plans.reduce((a, b) => (a.months <= b.months ? a : b))
  const savings = (p) => Math.round((1 - p.price / (base.price / base.months * p.months)) * 100)

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-lg text-slate-900"><Logo /></Link>
          <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#funciones" className="hover:text-slate-900">Funciones</a>
            <a href="#precios" className="hover:text-slate-900">Precios</a>
            <a href="#preguntas" className="hover:text-slate-900">Preguntas</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Ir al panel</Link>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Ingresar</Link>
                <Link to="/register" className="whitespace-nowrap rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Prueba gratis</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            {pricing.trialDays} días gratis · Sin tarjeta
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Maneja tu gimnasio con <span className="text-brand-600">datos</span>, no con cuadernos.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            GymPulse es el sistema en la nube para registrar socios, planes y cada venta, y ver las estadísticas
            que de verdad hacen crecer tu negocio.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700">
              Empieza tu prueba gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="rounded-xl px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100">
              Ver la cuenta demo
            </Link>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="funciones" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Todo lo que tu gimnasio necesita</h2>
          <p className="mt-4 text-slate-600">Hecho para dueños que quieren dejar de adivinar y empezar a crecer.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-6 transition hover:border-brand-200 hover:shadow-md">
              <div className="inline-flex rounded-xl bg-brand-50 p-3"><Icon className="h-5 w-5 text-brand-600" /></div>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="precios" className="scroll-mt-20 bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Precios simples, en dólares</h2>
            <p className="mt-4 text-slate-600">Todas las funciones, socios ilimitados. Elige cada cuánto quieres pagar.</p>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {pricing.plans.map((p) => {
              const featured = p.months === 12
              const off = savings(p)
              return (
                <div key={p.code} className={`flex flex-col rounded-3xl bg-white p-8 ${featured ? 'border-2 border-brand-600 shadow-xl' : 'border border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
                    {off > 0 && <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">Ahorra {off}%</span>}
                  </div>
                  <p className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">{money(p.price)}</span>
                    <span className="text-slate-500">/ {monthsLabel(p.months)}</span>
                  </p>
                  {p.months > 1 && <p className="mt-1 text-sm text-slate-500">equivale a {money(p.price / p.months)} al mes</p>}
                  <ul className="mt-6 space-y-3 text-sm text-slate-700">
                    {['Socios y planes ilimitados', 'Registro de ventas y estadísticas', 'Varias sucursales'].map((f) => (
                      <li key={f} className="flex gap-3"><Check className="h-5 w-5 flex-none text-brand-600" />{f}</li>
                    ))}
                  </ul>
                  <Link to="/register" className={`mt-8 block rounded-xl px-6 py-3 text-center font-semibold ${featured ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                    Empezar gratis
                  </Link>
                </div>
              )
            })}
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <p className="text-center text-sm font-semibold text-slate-900">Paga como prefieras</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                [Landmark, 'Transferencia', 'Cualquier banco de Ecuador'],
                [QrCode, 'DeUna', 'Paga con el QR desde tu celular'],
                [Globe, 'PayPal', 'Tarjeta internacional o saldo PayPal'],
              ].map(([Icon, t, d]) => (
                <div key={t} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <Icon className="h-5 w-5 flex-none text-brand-600" />
                  <div><p className="text-sm font-semibold text-slate-900">{t}</p><p className="text-xs text-slate-500">{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Preguntas frecuentes</h2>
        <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-slate-900">
                {q}<span className="ml-4 text-slate-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 px-6 py-14 text-center sm:px-12">
          <NotebookPen className="mx-auto h-8 w-8 text-brand-400" />
          <h2 className="mt-4 text-3xl font-bold text-white">¿Listo para dejar el cuaderno?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Configura tu gimnasio en menos de cinco minutos.</p>
          <Link to="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100">
            Crear mi cuenta <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} GymPulse. Todos los derechos reservados.
      </footer>
    </div>
  )
}

/** Static mock of the dashboard for the hero section. */
function DashboardPreview() {
  const bars = [38, 45, 41, 52, 60, 58, 66, 72, 69, 80, 86, 94]
  return (
    <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl shadow-slate-900/10 sm:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Ingresos del mes', '$4.820'], ['Ventas', '212'], ['Socios activos', '148'], ['Nuevos este mes', '+23']].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">{l}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex h-40 items-end gap-1.5 sm:gap-3" aria-hidden="true">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-[#2a78d6]" style={{ height: `${h}%`, opacity: i === bars.length - 1 ? 1 : 0.55 }} />
        ))}
      </div>
    </div>
  )
}
