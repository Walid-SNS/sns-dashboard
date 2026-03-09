import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  Building2
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { 
      path: '/', 
      label: 'Pilotage', 
      icon: LayoutDashboard,
      description: 'Dashboard des marges'
    },
    { 
      path: '/ressources', 
      label: 'Ressources', 
      icon: Users,
      description: 'Consultants & Missions'
    },
  ]

  const handleNavigate = (path) => {
    navigate(path)
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Logo + Menu button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-slate-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-400" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-white hidden sm:block">Solensoft</span>
            </div>
          </div>

          {/* Current page indicator */}
          <div className="flex items-center gap-2 text-slate-400">
            {menuItems.find(item => item.path === location.pathname)?.icon && (
              <>
                {(() => {
                  const Icon = menuItems.find(item => item.path === location.pathname)?.icon
                  return Icon ? <Icon className="w-4 h-4" /> : null
                })()}
                <span className="text-sm font-medium">
                  {menuItems.find(item => item.path === location.pathname)?.label}
                </span>
              </>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {userProfile?.full_name || userProfile?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-slate-500">{userProfile?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-40
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
            Modules
          </p>
          
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-500">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">Solensoft Consulting</span>
          </div>
        </div>
      </aside>

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  )
}
