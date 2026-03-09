import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useConsultants() {
  const { userProfile } = useAuth()
  const [consultants, setConsultants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConsultants = async () => {
    if (!userProfile?.organization_id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('consultants')
        .select(`
          *,
          missions_v2 (
            *,
            jours_travailles (*)
          )
        `)
        .eq('organization_id', userProfile.organization_id)
        .eq('actif', true)
        .order('nom', { ascending: true })

      if (error) throw error
      setConsultants(data || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching consultants:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsultants()
  }, [userProfile?.organization_id])

  // Créer un consultant
  const addConsultant = async (consultant) => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .insert([{
          ...consultant,
          organization_id: userProfile.organization_id
        }])
        .select()
        .single()

      if (error) throw error
      await fetchConsultants()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // Modifier un consultant
  const updateConsultant = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('consultants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await fetchConsultants()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // Supprimer un consultant (soft delete)
  const deleteConsultant = async (id) => {
    try {
      const { error } = await supabase
        .from('consultants')
        .update({ actif: false })
        .eq('id', id)

      if (error) throw error
      await fetchConsultants()
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  // Créer une mission
  const addMission = async (mission) => {
    try {
      const { data, error } = await supabase
        .from('missions_v2')
        .insert([{
          ...mission,
          organization_id: userProfile.organization_id
        }])
        .select()
        .single()

      if (error) throw error
      await fetchConsultants()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // Modifier une mission
  const updateMission = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('missions_v2')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await fetchConsultants()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // Supprimer une mission
  const deleteMission = async (id) => {
    try {
      const { error } = await supabase
        .from('missions_v2')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchConsultants()
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  // Sauvegarder les jours travaillés
  const saveJoursTravailles = async (missionId, annee, mois, jours) => {
    try {
      const { data, error } = await supabase
        .from('jours_travailles')
        .upsert({
          mission_id: missionId,
          annee,
          mois,
          jours
        }, {
          onConflict: 'mission_id,annee,mois'
        })
        .select()
        .single()

      if (error) throw error
      await fetchConsultants()
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  // Sauvegarder plusieurs mois d'un coup
  const saveJoursTravaillesBulk = async (missionId, joursParMois) => {
    try {
      const records = Object.entries(joursParMois).map(([key, jours]) => {
        const [annee, mois] = key.split('-').map(Number)
        return {
          mission_id: missionId,
          annee,
          mois,
          jours: jours || 0
        }
      })

      const { error } = await supabase
        .from('jours_travailles')
        .upsert(records, {
          onConflict: 'mission_id,annee,mois'
        })

      if (error) throw error
      await fetchConsultants()
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  }

  return {
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
    saveJoursTravailles,
    saveJoursTravaillesBulk
  }
}

export default useConsultants
