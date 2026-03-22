import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import KundliPage from './pages/KundliPage'
import PanchangPage from './pages/PanchangPage'
import RamShalakaPage from './pages/RamShalakaPage'
import RemediesPage from './pages/RemediesPage'
import PrashnaPage from './pages/PrashnaPage'
import PredictionsPage from './pages/PredictionsPage'
import AdminPage from './pages/AdminPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'2rem',marginBottom:'1rem',animation:'pulse 1.5s infinite',color:'var(--gold)' }}>✦</div>
        <div style={{ fontFamily:'var(--font-display)',color:'var(--gold)',fontSize:'0.8rem',letterSpacing:'0.1em' }}>LOADING</div>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login"       element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/"            element={<ProtectedRoute><Layout><ChatPage /></Layout></ProtectedRoute>} />
      <Route path="/kundli"      element={<ProtectedRoute><Layout><KundliPage /></Layout></ProtectedRoute>} />
      <Route path="/panchang"    element={<ProtectedRoute><Layout><PanchangPage /></Layout></ProtectedRoute>} />
      <Route path="/ramshalaka"  element={<ProtectedRoute><Layout><RamShalakaPage /></Layout></ProtectedRoute>} />
      <Route path="/remedies"    element={<ProtectedRoute><Layout><RemediesPage /></Layout></ProtectedRoute>} />
      <Route path="/prashna"     element={<ProtectedRoute><Layout><PrashnaPage /></Layout></ProtectedRoute>} />
      <Route path="/predictions" element={<ProtectedRoute><Layout><PredictionsPage /></Layout></ProtectedRoute>} />
      <Route path="/admin"       element={<AdminPage />} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  )
}
