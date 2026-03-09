-- =====================================================
-- SOLENSOFT - MODULE RESSOURCES
-- =====================================================
-- Exécutez ce script dans Supabase > SQL Editor
-- =====================================================

-- =====================================================
-- TABLE: consultants
-- =====================================================
CREATE TABLE IF NOT EXISTS consultants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  statut TEXT DEFAULT 'Freelance' CHECK (statut IN ('Freelance', 'Portage', 'CDI')),
  tjm_achat_defaut DECIMAL(10,2) DEFAULT 0,
  competences TEXT[], -- Array de compétences PLM
  disponibilite TEXT DEFAULT 'En mission' CHECK (disponibilite IN ('En mission', 'Intercontrat', 'Indisponible')),
  date_entree DATE,
  notes TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: missions_v2 (remplace missions)
-- =====================================================
CREATE TABLE IF NOT EXISTS missions_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  consultant_id UUID REFERENCES consultants(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  tjm_achat DECIMAL(10,2) NOT NULL DEFAULT 0,
  tjm_vente DECIMAL(10,2) NOT NULL DEFAULT 0,
  date_debut DATE,
  date_fin DATE,
  statut TEXT DEFAULT 'Actif' CHECK (statut IN ('Actif', 'À venir', 'Terminé', 'Suspendu')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: jours_travailles (saisie mensuelle)
-- =====================================================
CREATE TABLE IF NOT EXISTS jours_travailles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions_v2(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  jours DECIMAL(4,1) NOT NULL DEFAULT 0, -- Permet les demi-journées (ex: 19.5)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mission_id, annee, mois) -- Une seule entrée par mission/mois
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE jours_travailles ENABLE ROW LEVEL SECURITY;

-- Policies pour consultants
CREATE POLICY "Users can view consultants in their organization"
  ON consultants FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert consultants"
  ON consultants FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update consultants"
  ON consultants FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete consultants"
  ON consultants FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour missions_v2
CREATE POLICY "Users can view missions_v2 in their organization"
  ON missions_v2 FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert missions_v2"
  ON missions_v2 FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update missions_v2"
  ON missions_v2 FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete missions_v2"
  ON missions_v2 FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour jours_travailles
CREATE POLICY "Users can view jours_travailles"
  ON jours_travailles FOR SELECT
  USING (
    mission_id IN (
      SELECT m.id FROM missions_v2 m
      JOIN users u ON u.organization_id = m.organization_id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert jours_travailles"
  ON jours_travailles FOR INSERT
  WITH CHECK (
    mission_id IN (
      SELECT m.id FROM missions_v2 m
      JOIN users u ON u.organization_id = m.organization_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update jours_travailles"
  ON jours_travailles FOR UPDATE
  USING (
    mission_id IN (
      SELECT m.id FROM missions_v2 m
      JOIN users u ON u.organization_id = m.organization_id
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete jours_travailles"
  ON jours_travailles FOR DELETE
  USING (
    mission_id IN (
      SELECT m.id FROM missions_v2 m
      JOIN users u ON u.organization_id = m.organization_id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS pour updated_at
-- =====================================================

CREATE TRIGGER update_consultants_updated_at
  BEFORE UPDATE ON consultants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_v2_updated_at
  BEFORE UPDATE ON missions_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jours_travailles_updated_at
  BEFORE UPDATE ON jours_travailles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INDEX pour les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_consultants_organization ON consultants(organization_id);
CREATE INDEX IF NOT EXISTS idx_consultants_actif ON consultants(actif);
CREATE INDEX IF NOT EXISTS idx_missions_v2_organization ON missions_v2(organization_id);
CREATE INDEX IF NOT EXISTS idx_missions_v2_consultant ON missions_v2(consultant_id);
CREATE INDEX IF NOT EXISTS idx_missions_v2_client ON missions_v2(client);
CREATE INDEX IF NOT EXISTS idx_jours_travailles_mission ON jours_travailles(mission_id);
CREATE INDEX IF NOT EXISTS idx_jours_travailles_periode ON jours_travailles(annee, mois);

-- =====================================================
-- VUE: Calcul des marges réelles
-- =====================================================

CREATE OR REPLACE VIEW vue_marges_reelles AS
SELECT 
  c.id as consultant_id,
  c.prenom || ' ' || c.nom as consultant_nom,
  c.statut as consultant_statut,
  m.id as mission_id,
  m.client,
  m.tjm_achat,
  m.tjm_vente,
  m.tjm_vente - m.tjm_achat as marge_jour,
  CASE WHEN m.tjm_vente > 0 
    THEN ROUND(((m.tjm_vente - m.tjm_achat) / m.tjm_vente * 100)::numeric, 1)
    ELSE 0 
  END as markup,
  m.date_debut,
  m.date_fin,
  m.statut as mission_statut,
  j.annee,
  j.mois,
  j.jours,
  j.jours * (m.tjm_vente - m.tjm_achat) as marge_mois,
  m.organization_id
FROM consultants c
JOIN missions_v2 m ON m.consultant_id = c.id
LEFT JOIN jours_travailles j ON j.mission_id = m.id
WHERE c.actif = true;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
