const LOCALE = 'es-EC'
const currencyFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD' })
const compactFmt = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })

export const money = (v) => currencyFmt.format(Number(v || 0))
export const compactMoney = (v) => `$${compactFmt.format(Number(v || 0))}`

export const date = (v) => (v ? new Date(v.length === 10 ? `${v}T00:00:00` : v).toLocaleDateString(LOCALE) : '—')
export const dateTime = (v) =>
  v ? new Date(v).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/** "2026-03" -> "mar 26" */
export const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(LOCALE, { month: 'short', year: '2-digit' }).replace('.', '')
}

/** Local date as YYYY-MM-DD (toISOString would shift to UTC and give tomorrow's date at night in Ecuador). */
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const daysUntil = (iso) => (iso ? Math.ceil((new Date(iso) - new Date()) / 86_400_000) : null)

/** Payment methods of the gym's own sales. */
export const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'DEUNA', 'PAYPAL', 'OTHER']
export const METHOD_LABELS = {
  CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia', DEUNA: 'DeUna', PAYPAL: 'PayPal',
  OTHER: 'Otro', SIMULATED: 'Simulado',
}
export const methodLabel = (m) => METHOD_LABELS[m] || m

export const PAYMENT_STATUS = {
  PENDING: { label: 'En revisión', tone: 'amber' },
  APPROVED: { label: 'Aprobado', tone: 'green' },
  REJECTED: { label: 'Rechazado', tone: 'red' },
}

export const SUBSCRIPTION_STATUS = {
  TRIAL: { label: 'Prueba', tone: 'amber' },
  ACTIVE: { label: 'Activa', tone: 'green' },
  EXPIRED: { label: 'Vencida', tone: 'red' },
}

export const monthsLabel = (n) => (n === 1 ? '1 mes' : n === 12 ? '1 año' : `${n} meses`)

/** wa.me link from an Ecuadorian or international number. */
export const whatsappLink = (phone, text = '') => {
  let digits = (phone || '').replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) digits = `593${digits.slice(1)}` // 09xxxxxxxx -> 5939xxxxxxxx
  return digits ? `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null
}
