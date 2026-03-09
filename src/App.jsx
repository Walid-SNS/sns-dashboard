import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './core/hooks/useAuth'
import ProtectedRoute from './core/components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './modules/pilotage/Dashboard'
import Ressources from './modules/ressources/Ressources'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Route publique */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />

      {/* Routes protégées */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pilotage"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ressources"
        element={
          <ProtectedRoute>
            <Ressources />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
