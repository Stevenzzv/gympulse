import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { Spinner } from './components/ui'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'

// The app screens (and the charts library) load only after login, so the landing page opens fast.
const Dashboard = lazy(() => import('./pages/app/Dashboard'))
const Members = lazy(() => import('./pages/app/Members'))
const Sales = lazy(() => import('./pages/app/Sales'))
const Plans = lazy(() => import('./pages/app/Plans'))
const Gyms = lazy(() => import('./pages/app/Gyms'))
const Billing = lazy(() => import('./pages/app/Billing'))
const Account = lazy(() => import('./pages/app/Account'))
const Admin = lazy(() => import('./pages/app/Admin'))
const Legal = lazy(() => import('./pages/Legal'))

export default function App() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/terminos" element={<Legal doc="terms" />} />
        <Route path="/privacidad" element={<Legal doc="privacy" />} />
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="sales" element={<Sales />} />
          <Route path="plans" element={<Plans />} />
          <Route path="gyms" element={<Gyms />} />
          <Route path="billing" element={<Billing />} />
          <Route path="account" element={<Account />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NotFound inApp />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
