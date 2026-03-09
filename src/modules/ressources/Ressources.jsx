import React, { useState, useEffect } from 'react'
import { 
  Users, UserPlus, Building2, Calendar, Euro, Edit2, Trash2, 
  Plus, X, Check, ChevronDown, ChevronRight, Search, Filter,
  Briefcase, Clock, AlertTriangle, Save, RefreshCw
} from 'lucide-react'
import Navigation from '../../core/components/Navigation'
import { useConsultants } from '../../core/hooks/useConsultants'
import { useAuth } from '../../core/hooks/useAuth'

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
const MOIS_COMPLETS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const COMPETENCES_PLM = [
  'ENOVIA', '3DEXPERIENCE', 'CATIA', 'DELMIA', 'SIMULIA',
  'Teamcenter', 'NX', 'Windchill', 'Creo', 'SAP PLM', 'Aras Innovator'
]

const STATUTS_CONSULTANT = ['Freelance', 'Portage', 'CDI']
const DISPONIBILITES = ['En mission', 'Intercontrat', 'Indisponible']
const STATUTS_MISSION = ['Actif', 'À venir', 'Terminé', 'Suspendu']

export default function Ressources() {
  const { userProfile } = useAuth()
  const { 
    consultants, 
    loading, 
    error,
    fetchConsultants,
    addConsultant, 
    updateConsultant, 
    deleteConsultant,
    addMission,
    updateMission,
    deleteMission,
    saveJoursTravaillesBulk
  } = useConsultants()

  const [activeTab, setActiveTab] = useState('consultants')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [expandedConsultant, setExpandedConsultant] = useState(null)
  const [expandedMission, setExpandedMission] = useState(null)
  
  // Modals
  const [showConsultantModal, setShowConsultantModal] = useState(false)
  const [showMissionModal, setShowMissionModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  
  // Form data
  const [editingConsultant, setEditingConsultant] = useState(null)
  const [editingMission, setEditingMission] = useState(null)
  const [selectedConsultantId, setSelectedConsultantId] = useState(null)
  
  // Jours travaillés
  const [joursEditing, setJoursEditing] = useState({})
  const [savingJours, setSavingJours] = useState(false)

  const [notification, setNotification] = useState(null)

  const currentYear = new Date().getFullYear()

  // Filtrer les consultants
  const filteredConsultants = consultants.filter(c => {
    const matchSearch = 
      c.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.missions_v2?.some(m => m.client?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchStatut = filterStatut === 'all' || c.disponibilite === filterStatut
    
    return matchSearch && matchStatut
  })

  // Calculer les stats
  const stats = {
    totalConsultants: consultants.length,
    enMission: consultants.filter(c => c.disponibilite === 'En mission').length,
    intercontrat: consultants.filter(c => c.disponibilite === 'Intercontrat').length,
    missionsActives: consultants.reduce((acc, c) => 
      acc + (c.missions_v2?.filter(m => m.statut === 'Actif').length || 0), 0
    )
  }

  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // ==================== HANDLERS ====================

  const handleSaveConsultant = async (data) => {
    const result = editingConsultant?.id 
      ? await updateConsultant(editingConsultant.id, data)
      : await addConsultant(data)
    
    if (result.error) {
      showNotification(`Erreur: ${result.error.message}`, 'error')
    } else {
      showNotification(editingConsultant?.id ? 'Consultant modifié' : 'Consultant créé')
      setShowConsultantModal(false)
      setEditingConsultant(null)
    }
  }

  const handleDeleteConsultant = async (id) => {
    const result = await deleteConsultant(id)
    if (result.error) {
      showNotification(`Erreur: ${result.error.message}`, 'error')
    } else {
      showNotification('Consultant supprimé')
      setShowDeleteConfirm(null)
    }
  }

  const handleSaveMission = async (data) => {
    const result = editingMission?.id
      ? await updateMission(editingMission.id, data)
      : await addMission({ ...data, consultant_id: selectedConsultantId })
    
    if (result.error) {
      showNotification(`Erreur: ${result.error.message}`, 'error')
    } else {
      showNotification(editingMission?.id ? 'Mission modifiée' : 'Mission créée')
      setShowMissionModal(false)
      setEditingMission(null)
    }
  }

  const handleDeleteMission = async (id) => {
    const result = await deleteMission(id)
    if (result.error) {
      showNotification(`Erreur: ${result.error.message}`, 'error')
    } else {
      showNotification('Mission supprimée')
      setShowDeleteConfirm(null)
    }
  }

  const handleSaveJours = async (missionId) => {
    setSavingJours(true)
    const result = await saveJoursTravaillesBulk(missionId, joursEditing[missionId] || {})
    setSavingJours(false)
    
    if (result.error) {
      showNotification(`Erreur: ${result.error.message}`, 'error')
    } else {
      showNotification('Jours enregistrés')
    }
  }

  const updateJoursLocal = (missionId, annee, mois, value) => {
    setJoursEditing(prev => ({
      ...prev,
      [missionId]: {
        ...prev[missionId],
        [`${annee}-${mois}`]: parseFloat(value) || 0
      }
    }))
  }

  // Initialiser les jours pour une mission
  const initJoursForMission = (mission) => {
    const existing = {}
    mission.jours_travailles?.forEach(j => {
      existing[`${j.annee}-${j.mois}`] = j.jours
    })
    setJoursEditing(prev => ({
      ...prev,
      [mission.id]: existing
    }))
  }

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Ressources</h1>
          <p className="text-slate-400">Gérez vos consultants et leurs missions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalConsultants}</p>
                <p className="text-xs text-slate-500">Consultants</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.enMission}</p>
                <p className="text-xs text-slate-500">En mission</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.intercontrat}</p>
                <p className="text-xs text-slate-500">Intercontrat</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.missionsActives}</p>
                <p className="text-xs text-slate-500">Missions actives</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un consultant ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
          >
            <option value="all">Tous les statuts</option>
            {DISPONIBILITES.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          
          <button
            onClick={() => {
              setEditingConsultant(null)
              setShowConsultantModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Nouveau consultant</span>
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            Erreur: {error}
          </div>
        )}

        {/* Consultants List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredConsultants.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Aucun consultant trouvé</p>
                <button
                  onClick={() => setShowConsultantModal(true)}
                  className="mt-4 text-blue-400 hover:text-blue-300"
                >
                  Créer votre premier consultant
                </button>
              </div>
            ) : (
              filteredConsultants.map(consultant => (
                <ConsultantCard
                  key={consultant.id}
                  consultant={consultant}
                  expanded={expandedConsultant === consultant.id}
                  onToggle={() => setExpandedConsultant(
                    expandedConsultant === consultant.id ? null : consultant.id
                  )}
                  onEdit={() => {
                    setEditingConsultant(consultant)
                    setShowConsultantModal(true)
                  }}
                  onDelete={() => setShowDeleteConfirm({ type: 'consultant', id: consultant.id, name: `${consultant.prenom} ${consultant.nom}` })}
                  onAddMission={() => {
                    setSelectedConsultantId(consultant.id)
                    setEditingMission(null)
                    setShowMissionModal(true)
                  }}
                  onEditMission={(mission) => {
                    setSelectedConsultantId(consultant.id)
                    setEditingMission(mission)
                    setShowMissionModal(true)
                  }}
                  onDeleteMission={(mission) => setShowDeleteConfirm({ type: 'mission', id: mission.id, name: `${mission.client}` })}
                  expandedMission={expandedMission}
                  onToggleMission={(missionId) => {
                    if (expandedMission !== missionId) {
                      const mission = consultant.missions_v2?.find(m => m.id === missionId)
                      if (mission) initJoursForMission(mission)
                    }
                    setExpandedMission(expandedMission === missionId ? null : missionId)
                  }}
                  joursEditing={joursEditing}
                  onUpdateJours={updateJoursLocal}
                  onSaveJours={handleSaveJours}
                  savingJours={savingJours}
                  currentYear={currentYear}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 ${
          notification.type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Modal Consultant */}
      {showConsultantModal && (
        <ConsultantModal
          consultant={editingConsultant}
          onSave={handleSaveConsultant}
          onClose={() => {
            setShowConsultantModal(false)
            setEditingConsultant(null)
          }}
        />
      )}

      {/* Modal Mission */}
      {showMissionModal && (
        <MissionModal
          mission={editingMission}
          onSave={handleSaveMission}
          onClose={() => {
            setShowMissionModal(false)
            setEditingMission(null)
          }}
        />
      )}

      {/* Confirmation suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-2">Confirmer la suppression</h3>
            <p className="text-slate-400 mb-6">
              Êtes-vous sûr de vouloir supprimer {showDeleteConfirm.type === 'consultant' ? 'le consultant' : 'la mission'} <strong className="text-white">{showDeleteConfirm.name}</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm.type === 'consultant') {
                    handleDeleteConsultant(showDeleteConfirm.id)
                  } else {
                    handleDeleteMission(showDeleteConfirm.id)
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== COMPOSANTS ====================

function ConsultantCard({ 
  consultant, 
  expanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddMission,
  onEditMission,
  onDeleteMission,
  expandedMission,
  onToggleMission,
  joursEditing,
  onUpdateJours,
  onSaveJours,
  savingJours,
  currentYear
}) {
  const missionsActives = consultant.missions_v2?.filter(m => m.statut === 'Actif') || []
  const missionEnCours = missionsActives[0]

  const getDisponibiliteColor = (dispo) => {
    switch (dispo) {
      case 'En mission': return 'bg-green-500/10 text-green-400 border-green-500/30'
      case 'Intercontrat': return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
        onClick={onToggle}
      >
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
          {consultant.prenom?.[0]}{consultant.nom?.[0]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">
              {consultant.prenom} {consultant.nom}
            </h3>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${getDisponibiliteColor(consultant.disponibilite)}`}>
              {consultant.disponibilite}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{consultant.statut}</span>
            {missionEnCours && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {missionEnCours.client}
                </span>
              </>
            )}
            {consultant.tjm_achat_defaut > 0 && (
              <>
                <span>•</span>
                <span>{consultant.tjm_achat_defaut}€/j</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-800 p-4">
          {/* Compétences */}
          {consultant.competences?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase mb-2">Compétences</p>
              <div className="flex flex-wrap gap-2">
                {consultant.competences.map(comp => (
                  <span key={comp} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg">
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Missions */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500 uppercase">Missions</p>
            <button
              onClick={onAddMission}
              className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              <Plus className="w-4 h-4" />
              Ajouter une mission
            </button>
          </div>

          {consultant.missions_v2?.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucune mission</p>
          ) : (
            <div className="space-y-3">
              {consultant.missions_v2?.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  expanded={expandedMission === mission.id}
                  onToggle={() => onToggleMission(mission.id)}
                  onEdit={() => onEditMission(mission)}
                  onDelete={() => onDeleteMission(mission)}
                  joursEditing={joursEditing[mission.id] || {}}
                  onUpdateJours={(annee, mois, value) => onUpdateJours(mission.id, annee, mois, value)}
                  onSaveJours={() => onSaveJours(mission.id)}
                  savingJours={savingJours}
                  currentYear={currentYear}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MissionCard({ 
  mission, 
  expanded, 
  onToggle, 
  onEdit, 
  onDelete,
  joursEditing,
  onUpdateJours,
  onSaveJours,
  savingJours,
  currentYear
}) {
  const margeJour = mission.tjm_vente - mission.tjm_achat
  const markup = mission.tjm_vente > 0 
    ? ((mission.tjm_vente - mission.tjm_achat) / mission.tjm_vente * 100).toFixed(1)
    : 0

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Actif': return 'bg-green-500/10 text-green-400'
      case 'À venir': return 'bg-blue-500/10 text-blue-400'
      case 'Terminé': return 'bg-slate-500/10 text-slate-400'
      default: return 'bg-orange-500/10 text-orange-400'
    }
  }

  // Calculer le total des jours et la marge réelle
  const totalJours = Object.values(joursEditing).reduce((acc, j) => acc + (j || 0), 0)
  const margeReelle = totalJours * margeJour

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
        onClick={onToggle}
      >
        <Building2 className="w-5 h-5 text-slate-400" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{mission.client}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatutColor(mission.statut)}`}>
              {mission.statut}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{mission.tjm_achat}€ → {mission.tjm_vente}€</span>
            <span className={markup < 10 ? 'text-red-400' : 'text-green-400'}>
              {markup}% markup
            </span>
            <span>{margeJour}€/j</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Expanded: Jours travaillés */}
      {expanded && (
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Jours travaillés {currentYear}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-400">Total: <strong className="text-white">{totalJours}j</strong></span>
              <span className="text-slate-400">Marge: <strong className="text-green-400">{margeReelle.toLocaleString()}€</strong></span>
            </div>
          </div>
          
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mb-4">
            {MOIS.map((mois, index) => (
              <div key={mois} className="text-center">
                <p className="text-xs text-slate-500 mb-1">{mois}</p>
                <input
                  type="number"
                  min="0"
                  max="31"
                  step="0.5"
                  value={joursEditing[`${currentYear}-${index + 1}`] || ''}
                  onChange={(e) => onUpdateJours(currentYear, index + 1, e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-center text-sm focus:border-blue-500 outline-none"
                  placeholder="-"
                />
              </div>
            ))}
          </div>
          
          <button
            onClick={onSaveJours}
            disabled={savingJours}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-xl transition-colors"
          >
            {savingJours ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      )}
    </div>
  )
}

function ConsultantModal({ consultant, onSave, onClose }) {
  const [formData, setFormData] = useState({
    prenom: consultant?.prenom || '',
    nom: consultant?.nom || '',
    email: consultant?.email || '',
    telephone: consultant?.telephone || '',
    statut: consultant?.statut || 'Freelance',
    tjm_achat_defaut: consultant?.tjm_achat_defaut || '',
    competences: consultant?.competences || [],
    disponibilite: consultant?.disponibilite || 'Intercontrat',
    notes: consultant?.notes || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      tjm_achat_defaut: parseFloat(formData.tjm_achat_defaut) || 0
    })
  }

  const toggleCompetence = (comp) => {
    setFormData(prev => ({
      ...prev,
      competences: prev.competences.includes(comp)
        ? prev.competences.filter(c => c !== comp)
        : [...prev.competences, comp]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {consultant ? 'Modifier le consultant' : 'Nouveau consultant'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Prénom *</label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              >
                {STATUTS_CONSULTANT.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Disponibilité</label>
              <select
                value={formData.disponibilite}
                onChange={(e) => setFormData({ ...formData, disponibilite: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              >
                {DISPONIBILITES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">TJM d'achat par défaut (€)</label>
            <input
              type="number"
              min="0"
              value={formData.tjm_achat_defaut}
              onChange={(e) => setFormData({ ...formData, tjm_achat_defaut: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              placeholder="ex: 500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Compétences PLM</label>
            <div className="flex flex-wrap gap-2">
              {COMPETENCES_PLM.map(comp => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => toggleCompetence(comp)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    formData.competences.includes(comp)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
            >
              {consultant ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MissionModal({ mission, onSave, onClose }) {
  const [formData, setFormData] = useState({
    client: mission?.client || '',
    tjm_achat: mission?.tjm_achat || '',
    tjm_vente: mission?.tjm_vente || '',
    date_debut: mission?.date_debut || '',
    date_fin: mission?.date_fin || '',
    statut: mission?.statut || 'Actif',
    notes: mission?.notes || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      tjm_achat: parseFloat(formData.tjm_achat) || 0,
      tjm_vente: parseFloat(formData.tjm_vente) || 0
    })
  }

  const margeJour = (parseFloat(formData.tjm_vente) || 0) - (parseFloat(formData.tjm_achat) || 0)
  const markup = formData.tjm_vente > 0 
    ? ((formData.tjm_vente - formData.tjm_achat) / formData.tjm_vente * 100).toFixed(1)
    : 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-800">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {mission ? 'Modifier la mission' : 'Nouvelle mission'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Client *</label>
            <input
              type="text"
              required
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              placeholder="ex: AIRBUS"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">TJM Achat (€) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.tjm_achat}
                onChange={(e) => setFormData({ ...formData, tjm_achat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">TJM Vente (€) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.tjm_vente}
                onChange={(e) => setFormData({ ...formData, tjm_vente: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Indicateurs de marge */}
          {formData.tjm_achat && formData.tjm_vente && (
            <div className="flex gap-4 p-3 bg-slate-800/50 rounded-xl">
              <div className="text-center">
                <p className="text-xs text-slate-500">Marge/jour</p>
                <p className={`font-semibold ${margeJour >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {margeJour}€
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Markup</p>
                <p className={`font-semibold ${markup >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                  {markup}%
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date début</label>
              <input
                type="date"
                value={formData.date_debut}
                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Date fin</label>
              <input
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Statut</label>
            <select
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none"
            >
              {STATUTS_MISSION.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
            >
              {mission ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
