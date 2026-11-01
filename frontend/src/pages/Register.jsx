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
      subtitle="7 días gratis con todas las funciones. Sin tarjeta."
      footer={<>¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">Ingresa</Link></>}
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
        <Button type="submit" size="lg" loading={busy} className="w-full">Empezar 7 días gratis</Button>
        <p className="text-center text-xs text-subtle">
          Al crear tu cuenta aceptas los <Link to="/terminos" className="text-muted underline underline-offset-2 hover:text-fg">Términos</Link> y
          la <Link to="/privacidad" className="text-muted underline underline-offset-2 hover:text-fg">Política de privacidad</Link>.
        </p>
      </form>
    </AuthCard>
  )
}
