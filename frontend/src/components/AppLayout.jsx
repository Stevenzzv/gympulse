import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3, Building2, ClipboardList, CreditCard, LogOut, Menu, Receipt, ShieldCheck, UserCog, Users, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GymProvider, useGym } from '../context/GymContext'
import { api } from '../lib/api'
import { daysUntil } from '../lib/format'
import { Avatar, Logo, Spinner } from './ui'

export const PENDING_EVENT = 'gympulse:pending-payments'

const nav = [
  { to: '/app', label: 'Panel', icon: BarChart3, end: true },
  { to: '/app/members', label: 'Socios', icon: Users },
  { to: '/app/sales', label: 'Ventas', icon: Receipt },
  { to: '/app/plans', label: 'Planes', icon: ClipboardList },
  { to: '/app/gyms', label: 'Gimnasios', icon: Building2 },
]
const accountNav = [
  { to: '/app/billing', label: 'Suscripción', icon: CreditCard },
  { to: '/app/account', label: 'Mi cuenta', icon: UserCog },
]

export default function AppLayout() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace />
  return (
    <GymProvider>
      <Shell />
    </GymProvider>
  )
}

function Shell() {
  const { user, logout } = useAuth()
  const { gyms, gymId, setGymId, loading } = useGym()
  const [open, setOpen] = useState(false)
  const [pendingPayments, setPendingPayments] = useState(0)
  const navigate = useNavigate()
  const isAdmin = user.role === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) return
    api.get('/admin/summary').then(({ data }) => setPendingPayments(data.pendingPayments)).catch(() => {})
    // The admin page announces the new count after approving / rejecting.
    const onCount = (e) => setPendingPayments(e.detail)
    window.addEventListener(PENDING_EVENT, onCount)
    return () => window.removeEventListener(PENDING_EVENT, onCount)
  }, [isAdmin])

  const linkClass = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-brand-400/10 text-brand-200' : 'text-muted hover:bg-surface-3 hover:text-fg'
    }`
  const marker = ({ isActive }) => isActive && <span className="absolute -left-4 top-2 bottom-2 w-1 rounded-r-full bg-brand-400 shadow-glow" />

  const renderLinks = (items) => items.map(({ to, label, icon: Icon, end }) => (
    <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={linkClass}>
      {(state) => (<>{marker(state)}<Icon className="h-[18px] w-[18px]" />{label}</>)}
    </NavLink>
  ))

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <Link to="/" className="mb-7 px-2 text-lg"><Logo /></Link>
      <p className="hud-label mb-2 px-3">Gimnasio</p>
      {renderLinks(nav)}
      <p className="hud-label mb-2 mt-6 px-3">Cuenta</p>
      {renderLinks(accountNav)}
      {isAdmin && (
        <>
          <p className="hud-label mb-2 mt-6 px-3">Administración</p>
          <NavLink to="/app/admin" onClick={() => setOpen(false)} className={linkClass}>
            {(state) => (<>
              {marker(state)}<ShieldCheck className="h-[18px] w-[18px]" /> Pagos y clientes
              {pendingPayments > 0 && <span className="num ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-ink">{pendingPayments}</span>}
            </>)}
          </NavLink>
        </>
      )}
      <div className="mt-auto flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
        <Avatar name={user.fullName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.fullName}</p>
          <p className="truncate text-xs text-subtle">{user.email}</p>
        </div>
        <button onClick={() => { logout(); navigate('/') }} className="rounded-lg p-2 text-subtle hover:bg-surface-3 hover:text-fg" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto border-r border-line bg-surface/90 backdrop-blur lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-up overflow-y-auto border-r border-line bg-surface">
            <button className="absolute right-3 top-[max(1rem,env(safe-area-inset-top))] p-1 text-subtle" onClick={() => setOpen(false)} aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-ink/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <button className="rounded-lg p-2 text-muted hover:bg-surface-3 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        {gyms.length > 0 && (
          <div className="flex min-w-0 items-center gap-2">
            <Building2 className="hidden h-4 w-4 flex-none text-subtle sm:block" />
            <select
              value={gymId ?? ''} onChange={(e) => setGymId(Number(e.target.value))}
              className="input w-auto max-w-[52vw] truncate py-1.5 font-semibold" aria-label="Gimnasio actual"
            >
              {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        <SubscriptionPill />
      </header>

      <SubscriptionBanner />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<Spinner />}>
          {loading ? <Spinner /> : <Outlet />}
        </Suspense>
      </main>
    </div>
  )
}

function SubscriptionPill() {
  const { user } = useAuth()
  if (user.role === 'ADMIN') {
    return <span className="ml-auto rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[.14em] text-violet-200">Admin</span>
  }
  const trial = user.subscriptionStatus === 'TRIAL'
  const days = daysUntil(trial ? user.trialEndsAt : user.subscriptionEndsAt)
  const [label, cls] = !user.hasActiveAccess ? ['Vencida', 'border-rose-400/40 bg-rose-500/15 text-rose-200']
    : trial ? [`Prueba · ${days} ${days === 1 ? 'día' : 'días'}`, 'border-amber-400/40 bg-amber-500/10 text-amber-200']
    : ['Pro', 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200']
  return (
    <Link to="/app/billing" className={`ml-auto whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[.12em] ${cls}`}>{label}</Link>
  )
}

function SubscriptionBanner() {
  const { user } = useAuth()
  if (user.hasActiveAccess) return null
  return (
    <div className="border-b border-rose-400/30 bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-200">
      Tu suscripción venció. Tus datos están a salvo, pero solo puedes consultarlos.{' '}
      <Link to="/app/billing" className="font-semibold underline underline-offset-4">Renueva aquí</Link> para seguir registrando.
    </div>
  )
}
