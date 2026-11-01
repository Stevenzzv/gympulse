import { Banknote, CreditCard, Globe, Landmark, MoreHorizontal, QrCode } from 'lucide-react'
import { ChipGroup } from './ui'

const ICONS = { CASH: Banknote, CARD: CreditCard, TRANSFER: Landmark, DEUNA: QrCode, PAYPAL: Globe, OTHER: MoreHorizontal }
const LABELS = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia', DEUNA: 'DeUna', PAYPAL: 'PayPal', OTHER: 'Otro' }

/** Payment method picker for the gym's own sales. */
export default function PaymentChips({ value, onChange }) {
  return (
    <ChipGroup
      label="Método de pago" value={value} onChange={onChange}
      options={Object.keys(LABELS).map((k) => ({ value: k, label: LABELS[k], icon: ICONS[k] }))}
    />
  )
}
