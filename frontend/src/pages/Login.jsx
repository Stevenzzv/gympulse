import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import { Alert, Button, Field } from '../components/ui'
import AuthCard from './AuthCard'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/app" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/app')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Bienvenido de nuevo"
      subtitle="Ingresa para administrar tu gimnasio."
      footer={<>¿Aún no tienes cuenta? <Link to="/register" className="font-semibold text-brand-600">Prueba gratis</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Email">
          <input className="input" type="email" autoComplete="email" required value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Contraseña">
          <input className="input" type="password" autoComplete="current-password" required value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Ingresar</Button>
        <button type="button" className="w-full text-center text-xs text-slate-500 hover:text-brand-600"
                onClick={() => setForm({ email: 'demo@gymsaas.app', password: 'demo1234' })}>
          Usar la cuenta demo
        </button>
      </form>
    </AuthCard>
  )
}
