import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Plus, Table2 } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { compactMoney, methodLabel, money, monthLabel } from '../../lib/format'
import { Alert, PageHeader, Spinner } from '../../components/ui'
import RequireGym from '../../components/RequireGym'

// Validated categorical slots 1 and 2 (blue, orange); each chart shows a single series.
const REVENUE = '#2a78d6'
const MEMBERS = '#eb6834'
const AXIS = { fontSize: 12, fill: '#64748b' }

export default function Dashboard() {
  return <RequireGym><DashboardContent /></RequireGym>
}

function DashboardContent() {
  const { gym } = useGym()
  const [months, setMonths] = useState(12)
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
        title="Panel"
        subtitle={`Así va ${gym.name}`}
        actions={
          <>
            <RangePicker value={months} onChange={setMonths} />
            <Link to="/app/sales?new=1" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              <Plus className="h-4 w-4" /> Nueva venta
            </Link>
          </>
        }
      />
      <Alert>{error}</Alert>
      {!stats ? <Spinner /> : <StatsView stats={stats} months={months} />}
    </>
  )
}

function RangePicker({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-sm" role="group" aria-label="Periodo">
      {[6, 12, 24].map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${value === m ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {m} meses
        </button>
      ))}
    </div>
  )
}

function StatsView({ stats, months }) {
  const [showTable, setShowTable] = useState(false)
  const monthly = stats.monthly.map((p) => ({ ...p, label: monthLabel(p.month), revenue: Number(p.revenue) }))
  const growth = stats.revenueGrowthPct

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ingresos del mes" value={money(stats.revenueThisMonth)}
             delta={growth} deltaText={growth == null ? 'Sin ventas el mes pasado' : 'vs. mes pasado'} />
        <Kpi label="Ventas del mes" value={stats.salesThisMonth} sub={`${stats.salesLastMonth} el mes pasado`} />
        <Kpi label="Ticket promedio" value={money(stats.averageTicket)} sub="Este mes" />
        <Kpi label="Ingresos totales" value={money(stats.totalRevenue)} sub="Desde el inicio" />
        <Kpi label="Socios con plan vigente" value={stats.membersWithValidPlan} sub={`${stats.totalMembers} registrados`} />
        <Kpi label="Socios activos" value={stats.activeMembers} sub="Con estado activo" />
        <Kpi label="Socios nuevos del mes" value={stats.newMembersThisMonth} sub="Inscripciones" />
        <Kpi
          label="Vencen en 7 días"
          value={stats.expiringNext7Days}
          sub={stats.expiringNext7Days > 0 ? <Link to="/app/members" className="font-medium text-brand-600">Contáctalos →</Link> : 'Todo en orden'}
          warn={stats.expiringNext7Days > 0}
        />
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-900">Ingresos por mes</h2>
            <p className="text-sm text-slate-500">Últimos {months} meses · todas las ventas registradas</p>
          </div>
          <button onClick={() => setShowTable((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">
            <Table2 className="h-4 w-4" /> {showTable ? 'Ver gráfico' : 'Ver tabla'}
          </button>
        </div>
        {showTable ? <MonthlyTable data={monthly} /> : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={compactMoney} width={56} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip kind="revenue" />} />
                <Bar dataKey="revenue" fill={REVENUE} isAnimationActive={false} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Inscripciones de socios</h2>
          <p className="mb-4 text-sm text-slate-500">Socios nuevos por mes</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltip kind="members" />} />
                <Bar dataKey="newMembers" fill={MEMBERS} isAnimationActive={false} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Breakdown title="Lo más vendido" subtitle={`Ingresos por plan o producto · últimos ${months} meses`}
                   rows={stats.byConcept.slice(0, 8)} />
      </div>

      <Breakdown title="Métodos de pago" subtitle={`Ingresos por método · últimos ${months} meses`}
                 rows={stats.byPaymentMethod.map((r) => ({ ...r, label: methodLabel(r.label) }))
                   .sort((a, b) => b.revenue - a.revenue)} />
    </div>
  )
}

function Kpi({ label, value, sub, delta, deltaText, warn }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 sm:text-sm">
        {warn && <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Atención" />}
        {label}
      </p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <div className="mt-1 text-xs text-slate-500">
        {delta != null ? (
          <span className="inline-flex items-center gap-1">
            <span className={`inline-flex items-center font-semibold ${delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {delta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(delta)}%
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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-slate-900">{p.label}</p>
      {kind === 'revenue' ? (
        <>
          <p className="text-slate-700">{money(p.revenue)}</p>
          <p className="text-slate-500">{p.sales} ventas</p>
        </>
      ) : (
        <p className="text-slate-700">{p.newMembers} socios nuevos</p>
      )}
    </div>
  )
}

/** Sorted horizontal bars: the label and value stay in text ink, the bar carries the magnitude. */
function Breakdown({ title, subtitle, rows }) {
  const max = Math.max(...rows.map((r) => Number(r.revenue)), 1)
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mb-4 text-sm text-slate-500">{subtitle}</p>
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Aún no hay ventas en este periodo.</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label} title={`${r.label}: ${money(r.revenue)} · ${r.count} ventas`}>
              <div className="mb-1 flex justify-between gap-4 text-sm">
                <span className="truncate font-medium text-slate-700">{r.label}</span>
                <span className="whitespace-nowrap text-slate-900">
                  {money(r.revenue)} <span className="text-slate-500">· {r.count}</span>
                </span>
              </div>
              <div className="h-2 rounded bg-slate-100">
                <div className="h-2 rounded" style={{ width: `${(Number(r.revenue) / max) * 100}%`, background: REVENUE }} />
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
        <thead className="sticky top-0 bg-white">
          <tr><th className="th">Mes</th><th className="th text-right">Ingresos</th><th className="th text-right">Ventas</th><th className="th text-right">Socios nuevos</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[...data].reverse().map((p) => (
            <tr key={p.month}>
              <td className="td">{p.label}</td>
              <td className="td text-right">{money(p.revenue)}</td>
              <td className="td text-right">{p.sales}</td>
              <td className="td text-right">{p.newMembers}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
