import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  // Afficher un loader pendant la vérification
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

  // Rediriger vers login si non connecté
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Vérifier le rôle si requis
  if (requiredRole && userProfile?.role !== requiredRole && userProfile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Accès refusé</h1>
          <p className="text-slate-400">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
