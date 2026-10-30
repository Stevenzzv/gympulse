import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const GymContext = createContext(null)
const KEY = 'gympulse.gymId'

/** Keeps the owner's gyms and which one is currently selected in the top bar. */
export function GymProvider({ children }) {
  const [gyms, setGyms] = useState([])
  const [gymId, setGymIdState] = useState(() => Number(localStorage.getItem(KEY)) || null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data } = await api.get('/gyms')
    setGyms(data)
    setGymIdState((current) => (data.some((g) => g.id === current) ? current : data[0]?.id ?? null))
    setLoading(false)
    return data
  }, [])

  useEffect(() => { reload().catch(() => setLoading(false)) }, [reload])
  useEffect(() => { if (gymId) localStorage.setItem(KEY, String(gymId)) }, [gymId])

  const gym = gyms.find((g) => g.id === gymId) || null
  return (
    <GymContext.Provider value={{ gyms, gym, gymId, setGymId: setGymIdState, reload, loading }}>
      {children}
    </GymContext.Provider>
  )
}

export const useGym = () => useContext(GymContext)
