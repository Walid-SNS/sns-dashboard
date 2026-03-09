import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useMissions() {
  const { userProfile } = useAuth()
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMissions = async () => {
    if (!userProfile?.organization_id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Calculer marge et markup
      const enrichedData = data.map(m => ({
        ...m,
        margeJour: m.tjm_vente - m.tjm_achat,
        markup: m.tjm_vente > 0 ? ((m.tjm_vente - m.tjm_achat) / m.tjm_vente) * 100 : 0
      }))
      
      setMissions(enrichedData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissions()
  }, [userProfile?.organization_id])

  const addMission = async (mission) => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .insert([{
          ...mission,
          organization_id: userProfile.organization_id
        }])
        .select()
        .single()

      if (error) throw error
      
      await fetchMissions()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  const updateMission = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('missions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      await fetchMissions()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  const deleteMission = async (id) => {
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchMissions()
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  const importMissions = async (missionsData) => {
    try {
      const formattedMissions = missionsData.map(m => ({
        consultant_name: m.consultant || m.Consultant,
        client: m.client || m.Client,
        tjm_achat: parseFloat(m.tjmAchat || m['TJM Achat (€)'] || m['TJM Achat'] || 0),
        tjm_vente: parseFloat(m.tjmVente || m['TJM Vente (€)'] || m['TJM Vente'] || 0),
        date_debut: m.debut || m.Début || m.Debut || null,
        date_fin: m.fin || m.Fin || null,
        statut: m.statut || m.Statut || 'Actif',
        organization_id: userProfile.organization_id
      }))

      const { data, error } = await supabase
        .from('missions')
        .insert(formattedMissions)
        .select()

      if (error) throw error
      
      await fetchMissions()
      return { data, error: null, count: data.length }
    } catch (err) {
      return { data: null, error: err, count: 0 }
    }
  }

  return {
    missions,
    loading,
    error,
    fetchMissions,
    addMission,
    updateMission,
    deleteMission,
    importMissions
  }
}

export default useMissions
