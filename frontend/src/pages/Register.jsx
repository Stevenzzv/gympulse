import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import { Alert, Button, Field } from '../components/ui'
import AuthCard from './AuthCard'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', gymName: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/app" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register(form)
      navigate('/app')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Crea tu cuenta"
      subtitle="Prueba gratis, sin tarjeta de crédito."
      footer={<>¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-brand-600">Ingresa</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Tu nombre">
          <input className="input" required autoComplete="name" value={form.fullName} onChange={set('fullName')} />
        </Field>
        <Field label="Nombre del gimnasio">
          <input className="input" required placeholder="Ej. Iron Temple Fitness" value={form.gymName} onChange={set('gymName')} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="WhatsApp (opcional)" hint="Para avisarte cuando se apruebe tu pago o tu plan esté por vencer.">
          <input className="input" type="tel" autoComplete="tel" placeholder="09XXXXXXXX" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Contraseña">
          <input className="input" type="password" required minLength={8} autoComplete="new-password"
                 value={form.password} onChange={set('password')} />
        </Field>
        <Button type="submit" loading={busy} className="w-full">Crear cuenta</Button>
      </form>
    </AuthCard>
  )
}
