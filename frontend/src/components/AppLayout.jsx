import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3, Building2, ClipboardList, CreditCard, LogOut, Menu, Receipt, ShieldCheck, Users, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GymProvider, useGym } from '../context/GymContext'
import { api } from '../lib/api'
import { daysUntil } from '../lib/format'
import { Logo, Spinner } from './ui'

export const PENDING_EVENT = 'gympulse:pending-payments'

const nav = [
  { to: '/app', label: 'Panel', icon: BarChart3, end: true },
  { to: '/app/members', label: 'Socios', icon: Users },
  { to: '/app/sales', label: 'Ventas', icon: Receipt },
  { to: '/app/plans', label: 'Planes', icon: ClipboardList },
  { to: '/app/gyms', label: 'Gimnasios', icon: Building2 },
  { to: '/app/billing', label: 'Suscripción', icon: CreditCard },
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
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link to="/" className="mb-6 px-2 text-lg text-white"><Logo /></Link>
      {nav.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={linkClass}>
          <Icon className="h-4 w-4" /> {label}
        </NavLink>
      ))}
      {isAdmin && (
        <>
          <p className="mt-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Administración</p>
          <NavLink to="/app/admin" onClick={() => setOpen(false)} className={linkClass}>
            <ShieldCheck className="h-4 w-4" /> Pagos y clientes
            {pendingPayments > 0 && (
              <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">{pendingPayments}</span>
            )}
          </NavLink>
        </>
      )}
      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="truncate px-3 text-sm font-medium text-white">{user.fullName}</p>
        <p className="truncate px-3 text-xs text-slate-400">{user.email}</p>
        <button
          onClick={() => { logout(); navigate('/') }}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto bg-slate-900 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-slate-900">
            <button className="absolute right-3 top-4 p-1 text-slate-400" onClick={() => setOpen(false)} aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </button>
        {gyms.length > 0 && (
          <select
            value={gymId ?? ''}
            onChange={(e) => setGymId(Number(e.target.value))}
            className="input w-auto max-w-[55vw] py-1.5 font-medium"
            aria-label="Gimnasio actual"
          >
            {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
        <SubscriptionPill />
      </header>

      <SubscriptionBanner />
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {loading ? <Spinner /> : <Outlet />}
      </main>
    </div>
  )
}

function SubscriptionPill() {
  const { user } = useAuth()
  if (user.role === 'ADMIN') {
    return <span className="ml-auto rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Admin</span>
  }
  const status = user.subscriptionStatus
  const label = !user.hasActiveAccess ? 'Vencida'
    : status === 'TRIAL' ? `Prueba · ${daysUntil(user.trialEndsAt)} días`
    : 'Pro'
  const tone = !user.hasActiveAccess ? 'bg-red-100 text-red-700'
    : status === 'TRIAL' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
  return (
    <Link to="/app/billing" className={`ml-auto whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</Link>
  )
}

function SubscriptionBanner() {
  const { user } = useAuth()
  if (user.hasActiveAccess) return null
  return (
    <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
      Tu suscripción venció. Tus datos están a salvo, pero solo puedes consultarlos.{' '}
      <Link to="/app/billing" className="font-semibold underline">Renueva aquí</Link> para seguir registrando.
    </div>
  )
}
