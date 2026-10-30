import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/app/Dashboard'
import Members from './pages/app/Members'
import Sales from './pages/app/Sales'
import Plans from './pages/app/Plans'
import Gyms from './pages/app/Gyms'
import Billing from './pages/app/Billing'
import Admin from './pages/app/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="sales" element={<Sales />} />
        <Route path="plans" element={<Plans />} />
        <Route path="gyms" element={<Gyms />} />
        <Route path="billing" element={<Billing />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
