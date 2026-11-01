import { Check } from 'lucide-react'
import { money } from '../lib/format'

/** Membership plans as selectable cards. `noneLabel` adds a "no plan" option. */
export default function PlanPicker({ plans, value, onChange, noneLabel }) {
  const options = noneLabel ? [{ id: '', name: noneLabel }, ...plans] : plans
  if (plans.length === 0) {
    return <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">Todavía no tienes planes. Créalos en <b className="text-fg">Planes</b> para venderlos aquí.</p>
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Plan">
      {options.map((p) => {
        const on = String(value ?? '') === String(p.id)
        return (
          <button
            key={p.id || 'none'} type="button" role="radio" aria-checked={on} onClick={() => onChange(p.id === '' ? '' : p.id)}
            className={`relative rounded-xl border p-3.5 text-left transition ${
              on ? 'border-brand-400 bg-brand-400/10 shadow-glow' : 'border-line bg-surface-2 hover:border-line-strong'}`}
          >
            {on && <Check className="absolute right-3 top-3 h-4 w-4 text-brand-300" />}
            <p className="pr-6 text-sm font-semibold">{p.name}</p>
            {p.id === ''
              ? <p className="mt-1 text-xs text-subtle">Lo eliges después</p>
              : <p className="mt-1 flex items-baseline gap-2"><span className="num text-lg font-semibold text-fg">{money(p.price)}</span><span className="text-xs text-subtle">{p.durationDays} {p.durationDays === 1 ? 'día' : 'días'}</span></p>}
          </button>
        )
      })}
    </div>
  )
}
