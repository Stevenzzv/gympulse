import { useState } from 'react'
import { KeyRound, UserRound } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { Alert, Button, Field, PageHeader, useToast } from '../../components/ui'

export default function Account() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState({ fullName: user.fullName, phone: user.phone || '' })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState({ profile: '', pw: '' })
  const [busy, setBusy] = useState(null)

  const saveProfile = async (e) => {
    e.preventDefault()
    setBusy('profile')
    setErrors((x) => ({ ...x, profile: '' }))
    try {
      await api.put('/auth/me', profile)
      await refresh()
      toast('Datos actualizados')
    } catch (err) {
      setErrors((x) => ({ ...x, profile: errorMessage(err) }))
    } finally {
      setBusy(null)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) {
      setErrors((x) => ({ ...x, pw: 'Las contraseñas nuevas no coinciden.' }))
      return
    }
    setBusy('pw')
    setErrors((x) => ({ ...x, pw: '' }))
    try {
      await api.post('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      toast('Contraseña cambiada')
    } catch (err) {
      setErrors((x) => ({ ...x, pw: errorMessage(err) }))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHeader eyebrow="Cuenta" title="Mi cuenta" subtitle={user.email} />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card space-y-5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><UserRound className="h-5 w-5 text-brand-300" /> Tus datos</h2>
          <Alert>{errors.profile}</Alert>
          <Field label="Nombre"><input className="input" required value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} /></Field>
          <Field label="WhatsApp" hint="Te escribimos aquí sobre tus pagos y renovaciones.">
            <input className="input" type="tel" placeholder="09XXXXXXXX" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </Field>
          <Field label="Email" hint="Para cambiar tu email, escríbenos."><input className="input" disabled value={user.email} /></Field>
          <Button type="submit" loading={busy === 'profile'}>Guardar datos</Button>
        </form>

        <form onSubmit={changePassword} className="card space-y-5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><KeyRound className="h-5 w-5 text-brand-300" /> Cambiar contraseña</h2>
          <Alert>{errors.pw}</Alert>
          <Field label="Contraseña actual">
            <input className="input" type="password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </Field>
          <Field label="Contraseña nueva" hint="Mínimo 8 caracteres.">
            <input className="input" type="password" required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
          </Field>
          <Field label="Repite la contraseña nueva">
            <input className="input" type="password" required minLength={8} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <Button type="submit" loading={busy === 'pw'}>Cambiar contraseña</Button>
        </form>
      </div>
    </>
  )
}
