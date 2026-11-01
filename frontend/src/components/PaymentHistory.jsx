import { FileText } from 'lucide-react'
import { openProtectedFile } from '../lib/api'
import { PAYMENT_STATUS, date, methodLabel, money, monthsLabel } from '../lib/format'
import { Badge } from './ui'

/** Subscription payments table, shared by the owner's billing page and the admin history. */
export default function PaymentHistory({ payments, receiptPath, showUser }) {
  if (payments.length === 0) return <p className="p-6 text-center text-sm text-muted">Aún no hay pagos.</p>
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-surface-2">
          <tr>
            <th className="th">Fecha</th>
            {showUser && <th className="th">Cliente</th>}
            <th className="th">Método</th>
            <th className="th">Periodo</th>
            <th className="th">Referencia</th>
            <th className="th">Estado</th>
            <th className="th text-right">Monto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payments.map(({ payment: p, user }) => {
            const st = PAYMENT_STATUS[p.status]
            return (
              <tr key={p.id} className="align-top">
                <td className="td whitespace-nowrap">{date(p.createdAt)}</td>
                {showUser && <td className="td"><p className="font-medium text-fg">{user.fullName}</p><p className="text-xs text-muted">{user.email}</p></td>}
                <td className="td">{methodLabel(p.method)}</td>
                <td className="td whitespace-nowrap">{p.months ? monthsLabel(p.months) : '—'}</td>
                <td className="td">
                  <span className="break-all font-mono text-xs">{p.reference || '—'}</span>
                  {p.hasReceipt && (
                    <button onClick={() => openProtectedFile(receiptPath(p.id))}
                            className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-300 hover:underline">
                      <FileText className="h-3.5 w-3.5" /> Comprobante
                    </button>
                  )}
                </td>
                <td className="td">
                  <Badge tone={st.tone}>{st.label}</Badge>
                  {p.adminNote && <p className="mt-1 max-w-xs text-xs text-muted">{p.adminNote}</p>}
                </td>
                <td className="td whitespace-nowrap text-right font-semibold">{p.amount != null ? money(p.amount) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
