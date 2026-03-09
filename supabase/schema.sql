-- =====================================================
-- SOLENSOFT DASHBOARD - SCHEMA SUPABASE
-- =====================================================
-- Exécutez ce script dans Supabase > SQL Editor
-- =====================================================

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: organizations
-- =====================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer l'organisation Solensoft par défaut
INSERT INTO organizations (name) VALUES ('Solensoft Consulting')
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE: users (profils utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: missions
-- =====================================================
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  consultant_name TEXT NOT NULL,
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
-- TABLE: settings (paramètres par organisation)
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) UNIQUE NOT NULL,
  objectif_marge_annuelle DECIMAL(12,2) DEFAULT 150000,
  seuil_markup_alerte DECIMAL(5,2) DEFAULT 10,
  seuil_concentration_client DECIMAL(5,2) DEFAULT 30,
  annee_en_cours INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les settings par défaut pour Solensoft
INSERT INTO settings (organization_id, objectif_marge_annuelle, seuil_markup_alerte)
SELECT id, 150000, 10 FROM organizations WHERE name = 'Solensoft Consulting'
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users peuvent voir leur organisation
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Users peuvent voir leur propre profil et ceux de leur organisation
CREATE POLICY "Users can view profiles in their organization"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Users peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Policy: Missions - lecture par organisation
CREATE POLICY "Users can view missions in their organization"
  ON missions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Missions - insertion (admin et manager seulement)
CREATE POLICY "Admins can insert missions"
  ON missions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: Missions - modification (admin et manager seulement)
CREATE POLICY "Admins can update missions"
  ON missions FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: Missions - suppression (admin seulement)
CREATE POLICY "Admins can delete missions"
  ON missions FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Settings - lecture par organisation
CREATE POLICY "Users can view settings in their organization"
  ON settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Settings - modification (admin seulement)
CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS pour updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTION: Créer automatiquement le profil user
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Récupérer l'ID de l'organisation Solensoft
  SELECT id INTO default_org_id FROM organizations WHERE name = 'Solensoft Consulting' LIMIT 1;
  
  -- Créer le profil utilisateur
  INSERT INTO public.users (id, email, organization_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    default_org_id,
    'viewer'  -- Rôle par défaut, à modifier manuellement pour les admins
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement à l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- INDEX pour les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_missions_organization ON missions(organization_id);
CREATE INDEX IF NOT EXISTS idx_missions_consultant ON missions(consultant_name);
CREATE INDEX IF NOT EXISTS idx_missions_client ON missions(client);
CREATE INDEX IF NOT EXISTS idx_missions_dates ON missions(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================
-- N'oubliez pas de :
-- 1. Créer vos utilisateurs dans Authentication > Users
-- 2. Modifier leur rôle en 'admin' dans la table users
-- =====================================================
