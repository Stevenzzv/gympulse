import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'

const variants = {
  primary: 'bg-brand-400 text-ink hover:bg-brand-300 shadow-glow',
  secondary: 'border border-line-strong bg-surface-2 text-fg hover:border-brand-400/60 hover:bg-surface-3',
  danger: 'border border-rose-400/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20',
  success: 'bg-emerald-400 text-ink hover:bg-emerald-300',
  ghost: 'text-muted hover:bg-surface-3 hover:text-fg',
}
const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-5 py-3 text-base' }

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition
        disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Field({ label, children, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1.5 block text-xs text-subtle">{hint}</span>}
    </label>
  )
}

const alertTones = {
  error: ['border-rose-400/30 bg-rose-500/10 text-rose-200', XCircle],
  success: ['border-emerald-400/30 bg-emerald-500/10 text-emerald-200', CheckCircle2],
  info: ['border-brand-400/30 bg-brand-400/10 text-brand-100', Info],
  warning: ['border-amber-400/30 bg-amber-500/10 text-amber-200', AlertTriangle],
}

export function Alert({ children, tone = 'error' }) {
  if (!children) return null
  const [cls, Icon] = alertTones[tone]
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${cls}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon className="mt-0.5 h-4 w-4 flex-none" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

const badgeTones = {
  slate: 'bg-surface-3 text-muted ring-line-strong',
  green: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  red: 'bg-rose-400/10 text-rose-300 ring-rose-400/30',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  brand: 'bg-brand-400/10 text-brand-300 ring-brand-400/30',
}

export function Badge({ tone = 'slate', children, dot }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badgeTones[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-2xl border border-brand-400/30 bg-brand-400/10 p-3.5">
          <Icon className="h-6 w-6 text-brand-300" />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
}

export function Modal({ open, onClose, title, children, wide }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`card max-h-[92vh] w-full animate-fade-up overflow-y-auto rounded-b-none bg-surface sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-subtle hover:bg-surface-3 hover:text-fg" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/** Side panel for create / edit flows. Children render their own sticky footer (see DrawerFooter). */
export function Drawer({ open, onClose, title, subtitle, children }) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        role="dialog" aria-modal="true" aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-xl animate-slide-in flex-col border-l border-line bg-surface shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div>
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-subtle hover:bg-surface-3 hover:text-fg" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </aside>
    </div>
  )
}

/** Scrollable body + pinned action bar for forms inside a Drawer. */
export function DrawerBody({ children, footer, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6">{children}</div>
      <div className="border-t border-line bg-surface-2/80 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur">{footer}</div>
    </form>
  )
}

export function FormSection({ step, title, children, aside }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        {step && <span className="grid h-6 w-6 place-items-center rounded-md border border-brand-400/40 bg-brand-400/10 font-mono text-xs text-brand-300">{step}</span>}
        <h3 className="font-display text-base font-semibold tracking-wide">{title}</h3>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

/** Pill buttons that behave like radio buttons. */
export function ChipGroup({ options, value, onChange, label }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
      {options.map(({ value: v, label: l, icon: Icon }) => {
        const on = v === value
        return (
          <button
            key={v} type="button" role="radio" aria-checked={on} onClick={() => onChange(v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              on ? 'border-brand-400 bg-brand-400/15 text-brand-200 shadow-glow' : 'border-line-strong bg-surface-2 text-muted hover:text-fg'}`}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}{l}
          </button>
        )
      })}
    </div>
  )
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1" role="tablist" aria-label={label}>
      {options.map(({ value: v, label: l, icon: Icon }) => (
        <button
          key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            value === v ? 'bg-surface-3 text-fg shadow-panel ring-1 ring-line-strong' : 'text-subtle hover:text-fg'}`}
        >
          {Icon && <Icon className="h-4 w-4" />}{l}
        </button>
      ))}
    </div>
  )
}

const AVATAR_TINTS = ['from-brand-400 to-violet-500', 'from-emerald-400 to-brand-500', 'from-violet-400 to-fuchsia-500', 'from-amber-400 to-rose-500']

export function Avatar({ name = '', size = 'md' }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  const tint = AVATAR_TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TINTS.length]
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
  return (
    <span className={`grid flex-none place-items-center rounded-xl bg-gradient-to-br font-display font-bold text-ink ${tint} ${dim}`} aria-hidden="true">
      {initials}
    </span>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="hud-label mb-2">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
      <span className="text-subtle">Página <span className="num text-muted">{page + 1}</span> de <span className="num text-muted">{totalPages}</span></span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>Anterior</Button>
        <Button variant="secondary" size="sm" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</Button>
      </div>
    </div>
  )
}

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display font-bold tracking-wide ${className}`}>
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      <span>Gym<span className="gradient-text">Pulse</span></span>
    </span>
  )
}

// ---------------------------------------------------------------- toasts

const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:items-end sm:pr-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full max-w-sm animate-fade-up shadow-2xl">
            <Alert tone={t.tone}>{t.message}</Alert>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** const toast = useToast(); toast('Guardado') or toast('Algo falló', 'error') */
export const useToast = () => useContext(ToastContext)
