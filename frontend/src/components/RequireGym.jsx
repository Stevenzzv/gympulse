import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useGym } from '../context/GymContext'
import { EmptyState } from './ui'

/** Renders children only once the owner has a gym selected. */
export default function RequireGym({ children }) {
  const { gym } = useGym()
  if (gym) return children
  return (
    <div className="card">
      <EmptyState
        icon={Building2}
        title="Crea tu primer gimnasio"
        text="Agrega un gimnasio para empezar a registrar socios, planes y ventas."
        action={<Link to="/app/gyms" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Agregar gimnasio</Link>}
      />
    </div>
  )
}
