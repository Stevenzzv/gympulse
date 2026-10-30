import axios from 'axios'

const TOKEN_KEY = 'gympulse.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api`,
  headers: { 'Accept-Language': 'es' }, // Spanish validation messages from the backend
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

const FIELD_LABELS = {
  fullName: 'Nombre', email: 'Email', password: 'Contraseña', gymName: 'Gimnasio', phone: 'Teléfono',
  firstName: 'Nombres', lastName: 'Apellidos', name: 'Nombre', price: 'Precio', durationDays: 'Duración',
  amount: 'Monto', concept: 'Concepto', months: 'Meses', adminNote: 'Nota', method: 'Método',
}

/** Human readable message from an API error, including field validation errors. */
export function errorMessage(err) {
  const data = err?.response?.data
  if (data?.fields) return Object.entries(data.fields).map(([f, m]) => `${FIELD_LABELS[f] || f}: ${m}`).join(' · ')
  if (!err?.response) return 'No se pudo conectar con el servidor. Revisa tu conexión.'
  return data?.message || 'Algo salió mal. Inténtalo de nuevo.'
}

/** Opens an authenticated file (e.g. a payment receipt) in a new tab. */
export async function openProtectedFile(path) {
  const win = window.open('', '_blank') // open synchronously so pop-up blockers allow it
  try {
    const { data } = await api.get(path, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    if (win) win.location.href = url
    else window.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (e) {
    win?.close()
    throw e
  }
}
