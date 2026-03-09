import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, 
  DollarSign, Percent, PiggyBank, FileText, ChevronRight,
  ArrowUpRight, ArrowDownRight, Building2, Users,
  RefreshCw, Settings, Download, BarChart3, History, Loader2
} from 'lucide-react';
import { useConsultants } from '../../core/hooks/useConsultants';

// ============ DONNÉES HISTORIQUES (bilans comptables) ============
const HISTORICAL_DATA = {
  2023: {
    periode: "22/08/2022 - 31/12/2023",
    mois: 17,
    ca: 1582321,
    achats_freelances: 1310843,
    marge_brute: 271478,
    taux_marge: 17.2,
    salaires: 89834,
    charges_sociales: 30712,
    resultat_exploitation: 149833,
    resultat_net: 119144,
    tresorerie: 197150,
    creances_clients: 207731,
    capitaux_propres: 120144,
    dettes_fournisseurs: 150224
  },
  2024: {
    periode: "01/01/2024 - 31/12/2024",
    mois: 12,
    ca: 1543503,
    achats_freelances: 1427662,
    marge_brute: 115841,
    taux_marge: 7.5,
    salaires: 50571,
    charges_sociales: 22052,
    resultat_exploitation: 40779,
    resultat_net: 34662,
    tresorerie: 59930,
    creances_clients: 183334,
    capitaux_propres: 78695,
    dettes_fournisseurs: 123119
  }
};

// Données annualisées pour comparaison équitable
const getAnnualizedData = (year) => {
  const data = HISTORICAL_DATA[year];
  if (!data) return null;
  const factor = 12 / data.mois;
  return {
    ...data,
    ca_annualise: Math.round(data.ca * factor),
    marge_brute_annualisee: Math.round(data.marge_brute * factor),
    resultat_net_annualise: Math.round(data.resultat_net * factor)
  };
};

// ============ COMPOSANT PRINCIPAL ============
const DashboardV2 = () => {
  const [activeTab, setActiveTab] = useState('global');
  const [showSettings, setShowSettings] = useState(false);
  
  // ⬇️ CONNEXION SUPABASE - Récupère les vraies données
  const { consultants, missions, joursTravailles, loading, error, refresh } = useConsultants();
  
  // Paramètres
  const [settings, setSettings] = useState({
    objectifMargeAnnuelle: 150000,
    seuilMarkupAlerte: 10,
    seuilConcentrationClient: 30,
    seuilAlerteFin: 30
  });

  // Calculs basés sur les données Supabase
  const calculations = useMemo(() => {
    if (!missions || missions.length === 0) {
      return {
        totalMargeJour: 0,
        margeMensuelle: 0,
        margeAnnuelle: 0,
        avgMarkup: 0,
        nbConsultants: 0,
        alertesMarkup: [],
        alertesFin: []
      };
    }

    const activeMissions = missions.filter(m => m.statut === 'active' || m.statut === 'en_cours');
    
    if (activeMissions.length === 0) {
      return {
        totalMargeJour: 0,
        margeMensuelle: 0,
        margeAnnuelle: 0,
        avgMarkup: 0,
        nbConsultants: 0,
        alertesMarkup: [],
        alertesFin: []
      };
    }

    const totalMargeJour = activeMissions.reduce((sum, m) => sum + (m.tjm_vente - m.tjm_achat), 0);
    const avgMarkup = activeMissions.reduce((sum, m) => sum + ((m.tjm_vente - m.tjm_achat) / m.tjm_vente * 100), 0) / activeMissions.length;
    
    // Alertes markup
    const alertesMarkup = activeMissions.filter(m => {
      const markup = (m.tjm_vente - m.tjm_achat) / m.tjm_vente * 100;
      return markup < settings.seuilMarkupAlerte;
    }).map(m => {
      const consultant = consultants?.find(c => c.id === m.consultant_id);
      return {
        ...m,
        consultantNom: consultant ? `${consultant.prenom} ${consultant.nom}` : 'Inconnu',
        markup: ((m.tjm_vente - m.tjm_achat) / m.tjm_vente * 100)
      };
    });

    // Alertes fin de mission
    const today = new Date();
    const alertesFin = activeMissions.filter(m => {
      if (!m.date_fin) return false;
      const dateFin = new Date(m.date_fin);
      const joursRestants = Math.ceil((dateFin - today) / (1000 * 60 * 60 * 24));
      return joursRestants <= settings.seuilAlerteFin && joursRestants > 0;
    }).map(m => {
      const dateFin = new Date(m.date_fin);
      const joursRestants = Math.ceil((dateFin - today) / (1000 * 60 * 60 * 24));
      const consultant = consultants?.find(c => c.id === m.consultant_id);
      return { 
        ...m, 
        joursRestants,
        consultantNom: consultant ? `${consultant.prenom} ${consultant.nom}` : 'Inconnu'
      };
    }).sort((a, b) => a.joursRestants - b.joursRestants);

    return {
      totalMargeJour,
      margeMensuelle: totalMargeJour * 20,
      margeAnnuelle: totalMargeJour * 218,
      avgMarkup,
      nbConsultants: activeMissions.length,
      alertesMarkup,
      alertesFin
    };
  }, [missions, consultants, settings]);

  // Projection 2025/2026 basée sur données Supabase
  const projection2025 = useMemo(() => {
    if (!missions || missions.length === 0) {
      return { ca: 0, marge_brute: 0, taux_marge: 0, resultat_net: 0 };
    }

    const activeMissions = missions.filter(m => m.statut === 'active' || m.statut === 'en_cours');
    const caEstime = activeMissions.reduce((sum, m) => sum + (m.tjm_vente || 0) * 20 * 12, 0);
    const achatsEstimes = activeMissions.reduce((sum, m) => sum + (m.tjm_achat || 0) * 20 * 12, 0);
    const margeEstimee = caEstime - achatsEstimes;
    const tauxMargeEstime = caEstime > 0 ? (margeEstimee / caEstime) * 100 : 0;
    
    return {
      ca: caEstime,
      marge_brute: margeEstimee,
      taux_marge: tauxMargeEstime,
      resultat_net: margeEstimee * 0.4,
    };
  }, [missions]);

  // ============ UTILITAIRES ============
  const formatMontant = (montant) => {
    if (montant === null || montant === undefined) return '-';
    if (montant >= 1000000) {
      return `${(montant / 1000000).toFixed(2)}M€`;
    }
    if (montant >= 1000) {
      return `${(montant / 1000).toFixed(0)}K€`;
    }
    return `${Math.round(montant)}€`;
  };

  // ============ COMPOSANT KPI ============
  const KPICard = ({ title, value, evolution, subtitle, icon, evolutionSuffix = '%', alert = false }) => (
    <div className={`bg-slate-800/50 rounded-xl p-4 border ${alert ? 'border-red-500/50' : 'border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        <div className={`p-2 rounded-lg ${alert ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {evolution && (
          <span className={`text-sm flex items-center gap-1 ${evolution.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {evolution.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {evolution.isPositive ? '+' : ''}{evolution.value.toFixed(1)}{evolutionSuffix}
          </span>
        )}
        <span className="text-slate-500 text-xs">{subtitle}</span>
      </div>
    </div>
  );

  // ============ ONGLET HISTORIQUE ============
  const HistoriqueTab = () => {
    const data2023 = getAnnualizedData(2023);
    const data2024 = HISTORICAL_DATA[2024];

    // Données pour les graphiques
    const chartDataCA = [
      { annee: '2023', CA: data2023.ca_annualise, 'Marge brute': data2023.marge_brute_annualisee, 'Résultat net': data2023.resultat_net_annualise },
      { annee: '2024', CA: data2024.ca, 'Marge brute': data2024.marge_brute, 'Résultat net': data2024.resultat_net },
      { annee: '2025 (proj)', CA: projection2025.ca, 'Marge brute': projection2025.marge_brute, 'Résultat net': projection2025.resultat_net }
    ];

    const chartDataMarge = [
      { annee: '2023', taux: 17.2, objectif: 15 },
      { annee: '2024', taux: 7.5, objectif: 15 },
      { annee: '2025 (proj)', taux: projection2025.taux_marge, objectif: 15 }
    ];

    // Calcul des évolutions
    const evol = (val2024, val2023) => {
      const pct = ((val2024 - val2023) / val2023 * 100);
      return { value: pct, isPositive: pct > 0 };
    };

    const evolCA = evol(data2024.ca, data2023.ca_annualise);
    const evolMarge = evol(data2024.marge_brute, data2023.marge_brute_annualisee);
    const evolResultat = evol(data2024.resultat_net, data2023.resultat_net_annualise);
    const evolTauxMarge = { value: data2024.taux_marge - data2023.taux_marge, isPositive: false };

    // Analyse automatique
    const generateAnalysis = () => {
      const analyses = [];
      
      if (data2024.taux_marge < 10) {
        analyses.push({
          type: 'warning',
          title: 'Taux de marge critique',
          text: `Le taux de marge a chuté de ${data2023.taux_marge}% à ${data2024.taux_marge}% entre 2023 et 2024 (-${(data2023.taux_marge - data2024.taux_marge).toFixed(1)} points). Les TJM d'achat ont augmenté plus vite que les TJM de vente.`,
          action: 'Renégocier les TJM de vente (+50-100€/jour) sur les missions en cours.'
        });
      }

      if (evolCA.value > 20) {
        analyses.push({
          type: 'success',
          title: 'Forte croissance du CA',
          text: `Le CA annualisé a progressé de +${evolCA.value.toFixed(0)}% entre 2023 et 2024, signe d'une bonne dynamique commerciale.`,
          action: 'Maintenir cette dynamique tout en améliorant les marges.'
        });
      }

      const evolTreso = evol(data2024.tresorerie, data2023.tresorerie);
      if (evolTreso.value < -50) {
        analyses.push({
          type: 'warning',
          title: 'Trésorerie en baisse',
          text: `La trésorerie a diminué de ${Math.abs(evolTreso.value).toFixed(0)}% (${formatMontant(data2023.tresorerie)} → ${formatMontant(data2024.tresorerie)}).`,
          action: 'Réduire le DSO (relances à J+15, J+30) et négocier des acomptes clients.'
        });
      }

      if (evolResultat.value < -50) {
        analyses.push({
          type: 'danger',
          title: 'Résultat net en forte baisse',
          text: `Le résultat net a chuté de ${Math.abs(evolResultat.value).toFixed(0)}% malgré une activité stable.`,
          action: 'Priorité absolue : remonter le taux de marge à minimum 12-15%.'
        });
      }

      if (projection2025.taux_marge > data2024.taux_marge) {
        analyses.push({
          type: 'info',
          title: 'Projection 2025 encourageante',
          text: `Avec les missions actuelles, le taux de marge projeté est de ${projection2025.taux_marge.toFixed(1)}%, en amélioration par rapport à 2024.`,
          action: 'Continuer à sélectionner des missions avec un markup > 12%.'
        });
      }

      return analyses;
    };

    const analyses = generateAnalysis();

    // Tableau Row
    const TableRow = ({ label, val2023, val2023Ann, val2024, val2025, highlight = false }) => {
      const evolVal = val2023Ann && val2024 ? ((val2024 - val2023Ann) / val2023Ann * 100) : null;
      return (
        <tr className={`border-b border-slate-700/50 ${highlight ? 'bg-slate-700/20' : ''}`}>
          <td className="py-3 px-4 text-slate-300">{label}</td>
          <td className="py-3 px-4 text-right text-slate-400">{formatMontant(val2023)}</td>
          <td className="py-3 px-4 text-right text-slate-300">{formatMontant(val2023Ann)}</td>
          <td className="py-3 px-4 text-right font-medium">{formatMontant(val2024)}</td>
          <td className="py-3 px-4 text-right">
            {evolVal !== null && (
              <span className={`${evolVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {evolVal >= 0 ? '+' : ''}{evolVal.toFixed(0)}%
              </span>
            )}
          </td>
          <td className="py-3 px-4 text-right text-violet-400">{formatMontant(val2025)}</td>
        </tr>
      );
    };

    const TableRowPercent = ({ label, val2023, val2024, val2025, alert = false }) => {
      const evolVal = val2024 - val2023;
      return (
        <tr className={`border-b border-slate-700/50 ${alert ? 'bg-red-500/10' : ''}`}>
          <td className="py-3 px-4 text-slate-300">{label}</td>
          <td className="py-3 px-4 text-right text-slate-400">{val2023}%</td>
          <td className="py-3 px-4 text-right text-slate-300">{val2023}%</td>
          <td className={`py-3 px-4 text-right font-medium ${alert ? 'text-red-400' : ''}`}>{val2024}%</td>
          <td className="py-3 px-4 text-right">
            <span className={`${evolVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {evolVal >= 0 ? '+' : ''}{evolVal.toFixed(1)} pts
            </span>
          </td>
          <td className="py-3 px-4 text-right text-violet-400">{val2025.toFixed(1)}%</td>
        </tr>
      );
    };

    return (
      <div className="space-y-6">
        {/* KPIs avec tendances */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="CA 2024"
            value={formatMontant(data2024.ca)}
            evolution={evolCA}
            subtitle="vs 2023 annualisé"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <KPICard
            title="Marge brute 2024"
            value={formatMontant(data2024.marge_brute)}
            evolution={evolMarge}
            subtitle="vs 2023 annualisé"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KPICard
            title="Taux de marge"
            value={`${data2024.taux_marge}%`}
            evolution={evolTauxMarge}
            evolutionSuffix=" pts"
            subtitle="vs 2023"
            icon={<Percent className="w-5 h-5" />}
            alert={data2024.taux_marge < 10}
          />
          <KPICard
            title="Résultat net 2024"
            value={formatMontant(data2024.resultat_net)}
            evolution={evolResultat}
            subtitle="vs 2023 annualisé"
            icon={<PiggyBank className="w-5 h-5" />}
          />
        </div>

        {/* Graphique CA / Marge / Résultat */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Évolution annuelle
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartDataCA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="annee" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(value) => formatMontant(value)}
              />
              <Legend />
              <Bar dataKey="CA" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Marge brute" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Résultat net" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique Taux de marge */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-400" />
            Évolution du taux de marge
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartDataMarge} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="annee" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 25]} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                formatter={(value) => `${value.toFixed(1)}%`}
              />
              <ReferenceLine y={15} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: 'Objectif 15%', fill: '#F59E0B', fontSize: 12 }} />
              <Line type="monotone" dataKey="taux" stroke="#10B981" strokeWidth={3} dot={{ r: 6, fill: '#10B981' }} name="Taux de marge" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-2 text-sm text-slate-400 text-center">
            ⚠️ Le taux de marge est passé sous l'objectif de 15% en 2024
          </div>
        </div>

        {/* Tableau comparatif */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Tableau comparatif détaillé
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="text-left py-3 px-4">Indicateur</th>
                  <th className="text-right py-3 px-4">2023 (17m)</th>
                  <th className="text-right py-3 px-4">2023 annualisé</th>
                  <th className="text-right py-3 px-4">2024</th>
                  <th className="text-right py-3 px-4">Évol.</th>
                  <th className="text-right py-3 px-4">2025 (proj)</th>
                </tr>
              </thead>
              <tbody className="text-white">
                <TableRow 
                  label="Chiffre d'affaires" 
                  val2023={data2023.ca} 
                  val2023Ann={data2023.ca_annualise}
                  val2024={data2024.ca} 
                  val2025={projection2025.ca}
                />
                <TableRow 
                  label="Achats freelances" 
                  val2023={data2023.achats_freelances} 
                  val2023Ann={Math.round(data2023.achats_freelances * 12/17)}
                  val2024={data2024.achats_freelances} 
                  val2025={projection2025.ca - projection2025.marge_brute}
                />
                <TableRow 
                  label="Marge brute" 
                  val2023={data2023.marge_brute} 
                  val2023Ann={data2023.marge_brute_annualisee}
                  val2024={data2024.marge_brute} 
                  val2025={projection2025.marge_brute}
                  highlight
                />
                <TableRowPercent 
                  label="Taux de marge" 
                  val2023={data2023.taux_marge} 
                  val2024={data2024.taux_marge} 
                  val2025={projection2025.taux_marge}
                  alert={data2024.taux_marge < 10}
                />
                <TableRow 
                  label="Résultat net" 
                  val2023={data2023.resultat_net} 
                  val2023Ann={data2023.resultat_net_annualise}
                  val2024={data2024.resultat_net} 
                  val2025={projection2025.resultat_net}
                  highlight
                />
                <TableRow 
                  label="Trésorerie" 
                  val2023={data2023.tresorerie} 
                  val2023Ann={data2023.tresorerie}
                  val2024={data2024.tresorerie} 
                  val2025={null}
                />
                <TableRow 
                  label="Créances clients" 
                  val2023={data2023.creances_clients} 
                  val2023Ann={data2023.creances_clients}
                  val2024={data2024.creances_clients} 
                  val2025={null}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Analyse automatique */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Analyse & Recommandations
          </h3>
          <div className="space-y-4">
            {analyses.map((analysis, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border ${
                  analysis.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                  analysis.type === 'danger' ? 'bg-red-500/10 border-red-500/30' :
                  analysis.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    analysis.type === 'warning' ? 'bg-amber-500/20' :
                    analysis.type === 'danger' ? 'bg-red-500/20' :
                    analysis.type === 'success' ? 'bg-emerald-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    {analysis.type === 'warning' || analysis.type === 'danger' ? 
                      <AlertTriangle className={`w-5 h-5 ${analysis.type === 'danger' ? 'text-red-400' : 'text-amber-400'}`} /> :
                      <TrendingUp className={`w-5 h-5 ${analysis.type === 'success' ? 'text-emerald-400' : 'text-blue-400'}`} />
                    }
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${
                      analysis.type === 'warning' ? 'text-amber-400' :
                      analysis.type === 'danger' ? 'text-red-400' :
                      analysis.type === 'success' ? 'text-emerald-400' :
                      'text-blue-400'
                    }`}>{analysis.title}</h4>
                    <p className="text-slate-300 text-sm mb-2">{analysis.text}</p>
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                      <ChevronRight className="w-4 h-4" />
                      <span className="font-medium">Action :</span> {analysis.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projection 2025 */}
        <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-6 border border-violet-500/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-400" />
            Projection 2025 (basée sur {missions?.filter(m => m.statut === 'active' || m.statut === 'en_cours').length || 0} missions actives)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">CA estimé</div>
              <div className="text-2xl font-bold text-white">{formatMontant(projection2025.ca)}</div>
              <div className="text-xs text-slate-500">218 jours/an</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Marge brute estimée</div>
              <div className="text-2xl font-bold text-emerald-400">{formatMontant(projection2025.marge_brute)}</div>
              <div className="text-xs text-slate-500">Basé sur TJM actuels</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Taux de marge projeté</div>
              <div className={`text-2xl font-bold ${projection2025.taux_marge >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {projection2025.taux_marge.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500">Objectif : 15%</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-400 text-sm">Résultat net estimé</div>
              <div className="text-2xl font-bold text-violet-400">{formatMontant(projection2025.resultat_net)}</div>
              <div className="text-xs text-slate-500">~40% de la marge</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-slate-800/30 rounded-lg text-sm text-slate-400">
            💡 Cette projection est calculée à partir des missions saisies dans le module Ressources.
          </div>
        </div>
      </div>
    );
  };

  // ============ ONGLET VUE GLOBALE ============
  const VueGlobaleTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Consultants actifs</div>
          <div className="text-3xl font-bold text-white">{calculations.nbConsultants}</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Marge / jour</div>
          <div className="text-3xl font-bold text-emerald-400">{calculations.totalMargeJour}€</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Markup moyen</div>
          <div className={`text-3xl font-bold ${calculations.avgMarkup >= 10 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {calculations.avgMarkup.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">À renouveler</div>
          <div className={`text-3xl font-bold ${calculations.alertesFin.length > 0 ? 'text-amber-400' : 'text-white'}`}>
            {calculations.alertesFin.length}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {(calculations.alertesMarkup.length > 0 || calculations.alertesFin.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertes ({calculations.alertesMarkup.length + calculations.alertesFin.length})
          </h3>
          <div className="space-y-2">
            {calculations.alertesFin.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg p-2">
                <span className="text-white">{m.consultantNom} - {m.client}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  m.joursRestants <= 7 ? 'bg-red-500/20 text-red-400' :
                  m.joursRestants <= 15 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-amber-500/20 text-amber-400'
                }`}>
                  Fin dans {m.joursRestants}j
                </span>
              </div>
            ))}
            {calculations.alertesMarkup.map((m, i) => (
              <div key={`m-${i}`} className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg p-2">
                <span className="text-white">{m.consultantNom} - {m.client}</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                  Markup {m.markup.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de données */}
      {calculations.nbConsultants === 0 && (
        <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucune mission active</h3>
          <p className="text-slate-400 mb-4">Ajoutez des consultants et missions dans le module Ressources.</p>
          <a href="/ressources" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors">
            Aller aux Ressources
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );

  // ============ ONGLET ALERTES ============
  const AlertesTab = () => (
    <div className="space-y-6">
      {/* Alertes fin de mission */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          Missions à renouveler ({calculations.alertesFin.length})
        </h3>
        {calculations.alertesFin.length > 0 ? (
          <div className="space-y-2">
            {calculations.alertesFin.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                <div>
                  <div className="text-white font-medium">{m.consultantNom}</div>
                  <div className="text-slate-400 text-sm">{m.client}</div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    m.joursRestants <= 7 ? 'bg-red-500/20 text-red-400' :
                    m.joursRestants <= 15 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {m.joursRestants} jours
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Fin le {new Date(m.date_fin).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">Aucune mission à renouveler dans les {settings.seuilAlerteFin} prochains jours.</p>
        )}
      </div>

      {/* Alertes markup */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-red-400" />
          Markup insuffisant ({calculations.alertesMarkup.length})
        </h3>
        {calculations.alertesMarkup.length > 0 ? (
          <div className="space-y-2">
            {calculations.alertesMarkup.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                <div>
                  <div className="text-white font-medium">{m.consultantNom}</div>
                  <div className="text-slate-400 text-sm">{m.client}</div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-medium">{m.markup.toFixed(1)}%</div>
                  <div className="text-slate-500 text-xs">
                    {m.tjm_achat}€ → {m.tjm_vente}€
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">Toutes les missions ont un markup supérieur à {settings.seuilMarkupAlerte}%.</p>
        )}
      </div>
    </div>
  );

  // ============ RENDU PRINCIPAL ============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Erreur de chargement</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button 
            onClick={refresh}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Pilotage</h1>
            <p className="text-slate-400 text-sm">Données temps réel depuis Ressources</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors">
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'global', label: 'Vue globale', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'historique', label: 'Historique', icon: <History className="w-4 h-4" /> },
            { id: 'alertes', label: `Alertes (${calculations.alertesMarkup.length + calculations.alertesFin.length})`, icon: <AlertTriangle className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {activeTab === 'global' && <VueGlobaleTab />}
        {activeTab === 'historique' && <HistoriqueTab />}
        {activeTab === 'alertes' && <AlertesTab />}

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          Solensoft Consulting • Données historiques 2023-2024 + Temps réel Supabase
        </div>
      </div>
    </div>
  );
};

export default DashboardV2;
