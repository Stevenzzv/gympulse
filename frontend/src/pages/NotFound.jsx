import { Link } from 'react-router-dom'
import { Logo } from '../components/ui'

export default function NotFound({ inApp }) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 text-center ${inApp ? 'py-24' : 'min-h-screen'}`}>
      {!inApp && <Link to="/" className="mb-10 text-xl"><Logo /></Link>}
      <p className="font-mono text-sm tracking-[.3em] text-brand-300">ERROR 404</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Esta página no existe</h1>
      <p className="mt-3 max-w-md text-muted">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
      <Link to={inApp ? '/app' : '/'} className="mt-8 rounded-xl bg-brand-400 px-5 py-3 text-sm font-semibold text-ink shadow-glow hover:bg-brand-300">
        {inApp ? 'Volver al panel' : 'Ir al inicio'}
      </Link>
    </div>
  )
}
