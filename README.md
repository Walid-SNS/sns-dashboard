# 📊 Solensoft Dashboard

Dashboard de pilotage des marges pour ESN.

## 🚀 Déploiement rapide

### Prérequis
- Compte GitHub
- Compte Supabase (gratuit)
- Compte Vercel (gratuit)

### Étapes

1. **Configurer Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Exécuter le script `supabase/schema.sql` dans SQL Editor
   - Récupérer les clés API dans Settings > API

2. **Déployer sur Vercel**
   - Fork ou push ce repo sur GitHub
   - Connecter le repo à Vercel
   - Ajouter les variables d'environnement :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Créer les utilisateurs**
   - Dans Supabase > Authentication > Users
   - Modifier leur rôle dans la table `users`

## 📁 Structure

```
src/
├── core/           # Composants et hooks partagés
│   ├── components/
│   ├── hooks/
│   └── lib/
├── modules/        # Modules métier
│   └── pilotage/   # Dashboard de pilotage
├── pages/          # Pages (Login, etc.)
└── App.jsx         # Router principal
```

## 🔐 Sécurité

- Authentification Supabase (JWT)
- Row Level Security (RLS) activée
- Variables d'environnement pour les clés

## 📊 Fonctionnalités

- ✅ Dashboard avec KPIs
- ✅ Filtrage par trimestre/année
- ✅ Comparaisons Q vs Q-1
- ✅ Courbe prédictive
- ✅ Import Excel
- ✅ Export PDF
- ✅ Simulateur de marge
- ✅ Gestion des rôles

## 🛠️ Développement local

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local
# Remplir avec vos clés Supabase

# Lancer en local
npm run dev
```

## 📝 Licence

Propriétaire - Solensoft Consulting
