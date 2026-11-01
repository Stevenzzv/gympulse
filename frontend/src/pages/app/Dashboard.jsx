import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Receipt, Table2, UserPlus } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { compactMoney, methodLabel, money, monthLabel } from '../../lib/format'
import { Alert, PageHeader, Segmented, Spinner } from '../../components/ui'
import RequireGym from '../../components/RequireGym'

// Validated for the dark surface: one hue per chart, each chart a single series.
const REVENUE = '#2b9be0'
const MEMBERS = '#d95926'
const AXIS = { fontSize: 11, fill: '#6c7999', fontFamily: 'JetBrains Mono, monospace' }
const GRID = '#1e2a45'

export default function Dashboard() {
  return <RequireGym><DashboardContent /></RequireGym>
}

function DashboardContent() {
  const { gym } = useGym()
  const [months, setMonths] = useState('12')
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    api.get(`/gyms/${gym.id}/stats`, { params: { months } })
      .then(({ data }) => !cancelled && setStats(data))
      .catch((e) => !cancelled && setError(errorMessage(e)))
    return () => { cancelled = true }
  }, [gym.id, months])

  return (
    <>
      <PageHeader
        eyebrow={gym.name}
        title="Panel"
        subtitle="Así va tu gimnasio."
        actions={
          <>
            <Link to="/app/members?new=1" className="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-surface-2 px-4 py-2.5 text-sm font-semibold hover:border-brand-400/60">
              <UserPlus className="h-4 w-4" /> Nuevo socio
            </Link>
            <Link to="/app/sales?new=1" className="inline-flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-ink shadow-glow hover:bg-brand-300">
              <Receipt className="h-4 w-4" /> Nueva venta
            </Link>
          </>
        }
      />
      <Alert>{error}</Alert>
      {!stats ? <Spinner /> : <StatsView stats={stats} months={Number(months)} onMonths={setMonths} />}
    </>
  )
}

function StatsView({ stats, months, onMonths }) {
  const [showTable, setShowTable] = useState(false)
  const monthly = stats.monthly.map((p) => ({ ...p, label: monthLabel(p.month), revenue: Number(p.revenue) }))
  const growth = stats.revenueGrowthPct

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ingresos del mes" value={money(stats.revenueThisMonth)} highlight
             delta={growth} deltaText={growth == null ? 'Sin ventas el mes pasado' : 'vs. mes pasado'} />
        <Kpi label="Ventas del mes" value={stats.salesThisMonth} sub={`${stats.salesLastMonth} el mes pasado`} />
        <Kpi label="Ticket promedio" value={money(stats.averageTicket)} sub="Este mes" />
        <Kpi label="Ingresos totales" value={money(stats.totalRevenue)} sub="Desde el inicio" />
        <Kpi label="Plan vigente" value={stats.membersWithValidPlan} sub={`de ${stats.totalMembers} socios`} />
        <Kpi label="Socios activos" value={stats.activeMembers} sub="Con estado activo" />
        <Kpi label="Nuevos del mes" value={stats.newMembersThisMonth} sub="Inscripciones" />
        <Kpi
          label="Vencen en 7 días" value={stats.expiringNext7Days} warn={stats.expiringNext7Days > 0}
          sub={stats.expiringNext7Days > 0 ? <Link to="/app/members" className="font-semibold text-amber-300 hover:underline">Contáctalos →</Link> : 'Todo en orden'}
        />
      </div>

      <div className="card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Ingresos por mes</h2>
            <p className="text-sm text-muted">Últimos {months} meses · todas las ventas registradas</p>
          </div>
          <div className="flex items-center gap-2">
            <Segmented label="Periodo" value={String(months)} onChange={onMonths}
              options={[{ value: '6', label: '6m' }, { value: '12', label: '12m' }, { value: '24', label: '24m' }]} />
            <button onClick={() => setShowTable((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-muted hover:bg-surface-3 hover:text-fg">
              <Table2 className="h-4 w-4" /> {showTable ? 'Gráfico' : 'Tabla'}
            </button>
          </div>
        </div>
        {showTable ? <MonthlyTable data={monthly} /> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={14} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compactMoney} width={56} />
                <Tooltip cursor={{ fill: 'rgba(43,155,224,.08)' }} content={<ChartTooltip kind="revenue" />} />
                <Bar dataKey="revenue" fill={REVENUE} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Inscripciones</h2>
          <p className="mb-5 text-sm text-muted">Socios nuevos por mes</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={14} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <Tooltip cursor={{ fill: 'rgba(217,89,38,.08)' }} content={<ChartTooltip kind="members" />} />
                <Bar dataKey="newMembers" fill={MEMBERS} radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <Breakdown title="Lo más vendido" subtitle={`Ingresos por plan o producto · últimos ${months} meses`} rows={stats.byConcept.slice(0, 7)} />
      </div>

      <Breakdown title="Métodos de pago" subtitle={`Ingresos por método · últimos ${months} meses`}
                 rows={stats.byPaymentMethod.map((r) => ({ ...r, label: methodLabel(r.label) })).sort((a, b) => b.revenue - a.revenue)} />
    </div>
  )
}

function Kpi({ label, value, sub, delta, deltaText, warn, highlight }) {
  return (
    <div className={`card relative overflow-hidden p-4 sm:p-5 ${highlight ? 'border-brand-400/40' : ''} ${warn ? 'border-amber-400/40' : ''}`}>
      {highlight && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />}
      <p className="hud-label flex items-center gap-1.5">
        {warn && <AlertTriangle className="h-3.5 w-3.5 text-amber-300" aria-label="Atención" />}{label}
      </p>
      <p className={`num mt-2 truncate text-xl font-semibold sm:text-2xl ${highlight ? 'text-brand-100' : 'text-fg'}`}>{value}</p>
      <div className="mt-1 text-xs text-muted">
        {delta != null ? (
          <span className="inline-flex items-center gap-1">
            <span className={`num inline-flex items-center font-semibold ${delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
              {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{Math.abs(delta)}%
            </span>
            {deltaText}
          </span>
        ) : sub ?? deltaText}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, kind }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-line-strong bg-surface-2/95 px-3 py-2 text-sm shadow-2xl backdrop-blur">
      <p className="font-semibold text-fg">{p.label}</p>
      {kind === 'revenue'
        ? <><p className="num text-fg">{money(p.revenue)}</p><p className="text-muted">{p.sales} ventas</p></>
        : <p className="text-fg"><span className="num">{p.newMembers}</span> socios nuevos</p>}
    </div>
  )
}

/** Sorted horizontal bars: label and value stay in text ink, the bar carries the magnitude. */
function Breakdown({ title, subtitle, rows }) {
  const max = Math.max(...rows.map((r) => Number(r.revenue)), 1)
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mb-5 text-sm text-muted">{subtitle}</p>
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-subtle">Aún no hay ventas en este periodo.</p> : (
        <ul className="space-y-3.5">
          {rows.map((r) => (
            <li key={r.label} title={`${r.label}: ${money(r.revenue)} · ${r.count} ventas`}>
              <div className="mb-1.5 flex justify-between gap-4 text-sm">
                <span className="truncate font-medium text-fg/90">{r.label}</span>
                <span className="num whitespace-nowrap text-fg">{money(r.revenue)} <span className="text-subtle">· {r.count}</span></span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-3">
                <div className="h-1.5 rounded-full" style={{ width: `${(Number(r.revenue) / max) * 100}%`, background: REVENUE }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MonthlyTable({ data }) {
  return (
    <div className="max-h-72 overflow-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 bg-surface">
          <tr><th className="th">Mes</th><th className="th text-right">Ingresos</th><th className="th text-right">Ventas</th><th className="th text-right">Socios nuevos</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {[...data].reverse().map((p) => (
            <tr key={p.month}>
              <td className="td">{p.label}</td>
              <td className="td num text-right">{money(p.revenue)}</td>
              <td className="td num text-right">{p.sales}</td>
              <td className="td num text-right">{p.newMembers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
