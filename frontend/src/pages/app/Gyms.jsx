import { useState } from 'react'
import { Building2, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { api, errorMessage } from '../../lib/api'
import { useGym } from '../../context/GymContext'
import { Alert, Badge, Button, EmptyState, Field, Modal, PageHeader } from '../../components/ui'

export default function Gyms() {
  const { gyms, gymId, setGymId, reload } = useGym()
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const remove = async (g) => {
    const typed = prompt(`Esto elimina para siempre "${g.name}" con TODOS sus socios, planes y ventas.\nEscribe el nombre del gimnasio para confirmar:`)
    if (typed !== g.name) return
    try {
      await api.delete(`/gyms/${g.id}`)
      await reload()
    } catch (e) { setError(errorMessage(e)) }
  }

  return (
    <>
      <PageHeader
        eyebrow="Sucursales"
        title="Gimnasios"
        subtitle="Tus sucursales. Cada una tiene sus propios socios, planes, ventas y estadísticas."
        actions={<Button onClick={() => setEditing({})}><Plus className="h-4 w-4" /> Agregar gimnasio</Button>}
      />
      <Alert>{error}</Alert>
      {gyms.length === 0 ? (
        <div className="card">
          <EmptyState icon={Building2} title="Aún no tienes gimnasios" text="Agrega tu primer gimnasio para empezar."
                      action={<Button onClick={() => setEditing({})}>Agregar gimnasio</Button>} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gyms.map((g) => (
            <div key={g.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-fg">{g.name}</h3>
                {g.id === gymId && <Badge tone="brand">Seleccionado</Badge>}
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted"><MapPin className="h-4 w-4 text-subtle" />{g.address || '—'}</p>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted"><Phone className="h-4 w-4 text-subtle" />{g.phone || '—'}</p>
              <div className="mt-5 flex gap-2">
                {g.id !== gymId && <Button variant="secondary" className="flex-1" onClick={() => setGymId(g.id)}>Seleccionar</Button>}
                <Button variant="secondary" className="flex-1" onClick={() => setEditing(g)}><Pencil className="h-4 w-4" /> Editar</Button>
                <Button variant="ghost" onClick={() => remove(g)} aria-label="Eliminar gimnasio"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Editar gimnasio' : 'Nuevo gimnasio'}>
        {editing && (
          <GymForm gym={editing} onCancel={() => setEditing(null)}
                   onSaved={async (saved) => { setEditing(null); await reload(); if (!editing.id) setGymId(saved.id) }} />
        )}
      </Modal>
    </>
  )
}

function GymForm({ gym, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: gym.name || '', address: gym.address || '', phone: gym.phone || '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { data } = gym.id ? await api.put(`/gyms/${gym.id}`, form) : await api.post('/gyms', form)
      onSaved(data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Alert>{error}</Alert>
      <Field label="Nombre"><input className="input" required value={form.name} onChange={set('name')} /></Field>
      <Field label="Dirección"><input className="input" value={form.address} onChange={set('address')} /></Field>
      <Field label="Teléfono"><input className="input" value={form.phone} onChange={set('phone')} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={busy}>{gym.id ? 'Guardar' : 'Crear gimnasio'}</Button>
      </div>
    </form>
  )
}
