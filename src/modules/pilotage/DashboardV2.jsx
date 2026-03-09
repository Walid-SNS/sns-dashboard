import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, ReferenceLine, Legend, Area } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Target, Calendar, Building2, Euro, FileDown, Calculator, X, Check, Settings, ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Clock } from 'lucide-react';
import Navigation from '../../core/components/Navigation';
import { useConsultants } from '../../core/hooks/useConsultants';

// Périodes disponibles
const QUARTERS = {
  '2026': { start: '2026-01-01', end: '2026-12-31', label: 'Année 2026', year: 2026, isYear: true },
  '2025': { start: '2025-01-01', end: '2025-12-31', label: 'Année 2025', year: 2025, isYear: true },
  'Q1 2026': { start: '2026-01-01', end: '2026-03-31', label: 'Jan - Mar 2026', year: 2026, q: 1 },
  'Q2 2026': { start: '2026-04-01', end: '2026-06-30', label: 'Avr - Jun 2026', year: 2026, q: 2 },
  'Q3 2026': { start: '2026-07-01', end: '2026-09-30', label: 'Jul - Sep 2026', year: 2026, q: 3 },
  'Q4 2026': { start: '2026-10-01', end: '2026-12-31', label: 'Oct - Déc 2026', year: 2026, q: 4 },
  'Q1 2025': { start: '2025-01-01', end: '2025-03-31', label: 'Jan - Mar 2025', year: 2025, q: 1 },
  'Q2 2025': { start: '2025-04-01', end: '2025-06-30', label: 'Avr - Jun 2025', year: 2025, q: 2 },
  'Q3 2025': { start: '2025-07-01', end: '2025-09-30', label: 'Jul - Sep 2025', year: 2025, q: 3 },
  'Q4 2025': { start: '2025-10-01', end: '2025-12-31', label: 'Oct - Déc 2025', year: 2025, q: 4 },
};

const JOURS_OUVRES_PAR_MOIS = { 1: 22, 2: 20, 3: 22, 4: 21, 5: 21, 6: 22, 7: 22, 8: 18, 9: 22, 10: 22, 11: 21, 12: 20 };
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function DashboardV2() {
  const { consultants, loading, error, fetchConsultants } = useConsultants();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('Q1 2026');
  const [showSimulator, setShowSimulator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [simulatorData, setSimulatorData] = useState(null);
  const [notification, setNotification] = useState(null);

  const [settings, setSettings] = useState({
    objectifMargeAnnuelle: 150000,
    seuilMarkupAlerte: 10,
    seuilConcentrationClient: 30,
    seuilFinMissionJours: 30,
    anneeEnCours: 2026
  });

  // ==================== TRANSFORMATION DES DONNÉES ====================

  // Transformer les données Supabase en format utilisable
  const missionsData = useMemo(() => {
    const missions = [];
    consultants.forEach(consultant => {
      consultant.missions_v2?.forEach(mission => {
        const margeJour = mission.tjm_vente - mission.tjm_achat;
        const markup = mission.tjm_vente > 0 ? (margeJour / mission.tjm_vente) * 100 : 0;
        
        // Calculer les jours travaillés
        const joursParMois = {};
        mission.jours_travailles?.forEach(jt => {
          joursParMois[`${jt.annee}-${jt.mois}`] = jt.jours;
        });

        missions.push({
          id: mission.id,
          consultant: `${consultant.prenom} ${consultant.nom}`,
          consultantId: consultant.id,
          client: mission.client,
          tjmAchat: mission.tjm_achat,
          tjmVente: mission.tjm_vente,
          margeJour,
          markup,
          debut: mission.date_debut,
          fin: mission.date_fin,
          statut: mission.statut,
          joursParMois,
          jours_travailles: mission.jours_travailles || []
        });
      });
    });
    return missions;
  }, [consultants]);

  // ==================== FONCTIONS UTILITAIRES ====================

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? d : null;
  };

  const getJoursOuvres = (startDate, endDate) => {
    let jours = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const month = current.getMonth() + 1;
      const year = current.getFullYear();
      const joursMonth = JOURS_OUVRES_PAR_MOIS[month] || 20;
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      const effectiveStart = start > monthStart ? start : monthStart;
      const effectiveEnd = end < monthEnd ? end : monthEnd;
      
      if (effectiveStart <= effectiveEnd) {
        const totalDaysInMonth = monthEnd.getDate();
        const daysInPeriod = Math.min((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24) + 1, totalDaysInMonth);
        jours += Math.round(joursMonth * (daysInPeriod / totalDaysInMonth));
      }
      current.setMonth(current.getMonth() + 1);
    }
    return jours;
  };

  const getQuarterDates = (quarter) => {
    const q = QUARTERS[quarter];
    if (!q) return null;
    return { start: new Date(q.start), end: new Date(q.end), label: q.label, year: q.year, q: q.q, isYear: q.isYear || false };
  };

  // ==================== CALCUL DES DONNÉES PAR PÉRIODE ====================

  const calculatePeriodData = (period) => {
    const periodDates = getQuarterDates(period);
    if (!periodDates) return null;

    const missionsInPeriod = missionsData
      .map(mission => {
        const missionStart = parseDate(mission.debut);
        const missionEnd = parseDate(mission.fin);
        
        if (!missionStart || !missionEnd) return null;
        if (missionStart > periodDates.end || missionEnd < periodDates.start) return null;

        // Calculer les jours effectifs dans la période
        let joursEffectifs = 0;
        let margeReelle = 0;
        let caReel = 0;

        // Parcourir chaque mois de la période
        let current = new Date(periodDates.start);
        while (current <= periodDates.end) {
          const year = current.getFullYear();
          const month = current.getMonth() + 1;
          const key = `${year}-${month}`;
          
          // Vérifier si la mission est active ce mois-ci
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);
          
          if (missionStart <= monthEnd && missionEnd >= monthStart) {
            // Jours travaillés saisis ou estimation
            const joursSaisis = mission.joursParMois[key] || 0;
            
            if (joursSaisis > 0) {
              joursEffectifs += joursSaisis;
              margeReelle += joursSaisis * mission.margeJour;
              caReel += joursSaisis * mission.tjmVente;
            } else {
              // Estimation basée sur les jours ouvrés du mois
              const joursOuvresMois = JOURS_OUVRES_PAR_MOIS[month] || 20;
              const effStart = missionStart > monthStart ? missionStart : monthStart;
              const effEnd = missionEnd < monthEnd ? missionEnd : monthEnd;
              const ratioMois = (effEnd - effStart) / (monthEnd - monthStart);
              const joursEstimes = Math.round(joursOuvresMois * Math.min(1, Math.max(0, ratioMois)));
              
              joursEffectifs += joursEstimes;
              margeReelle += joursEstimes * mission.margeJour;
              caReel += joursEstimes * mission.tjmVente;
            }
          }
          
          current.setMonth(current.getMonth() + 1);
        }

        if (joursEffectifs === 0) return null;

        return {
          ...mission,
          joursEffectifs,
          margePeriode: margeReelle,
          caPeriode: caReel
        };
      })
      .filter(Boolean);

    const totalMarge = missionsInPeriod.reduce((sum, m) => sum + m.margePeriode, 0);
    const totalCA = missionsInPeriod.reduce((sum, m) => sum + m.caPeriode, 0);
    const totalJours = missionsInPeriod.reduce((sum, m) => sum + m.joursEffectifs, 0);
    const alertes = missionsInPeriod.filter(m => m.markup < settings.seuilMarkupAlerte);
    const markupMoyen = totalCA > 0 ? ((totalMarge / totalCA) * 100) : 0;

    // Concentration client
    const clientsCA = {};
    missionsInPeriod.forEach(m => {
      clientsCA[m.client] = (clientsCA[m.client] || 0) + m.caPeriode;
    });
    const topClientCA = Math.max(...Object.values(clientsCA), 0);
    const concentrationClient = totalCA > 0 ? (topClientCA / totalCA) * 100 : 0;
    const topClient = Object.entries(clientsCA).find(([_, ca]) => ca === topClientCA)?.[0] || '';

    return {
      period,
      periodDates,
      missions: missionsInPeriod,
      stats: {
        totalMarge,
        totalCA,
        totalJours,
        markupMoyen,
        nbMissions: missionsInPeriod.length,
        nbAlertes: alertes.length,
        concentrationClient,
        topClient,
        nbConsultants: new Set(missionsInPeriod.map(m => m.consultantId)).size
      },
      alertes
    };
  };

  // ==================== DONNÉES FILTRÉES ====================

  const filteredData = useMemo(() => {
    const currentData = calculatePeriodData(selectedPeriod);
    if (!currentData) return null;

    const currentPeriodInfo = QUARTERS[selectedPeriod];
    const isYearView = currentPeriodInfo?.isYear || false;

    // Période de comparaison
    let previousPeriod = null;
    if (isYearView) {
      const previousYear = String(currentPeriodInfo.year - 1);
      if (QUARTERS[previousYear]) previousPeriod = previousYear;
    } else {
      const currentQ = currentPeriodInfo.q;
      const currentYear = currentPeriodInfo.year;
      previousPeriod = currentQ === 1 ? `Q4 ${currentYear - 1}` : `Q${currentQ - 1} ${currentYear}`;
      if (!QUARTERS[previousPeriod]) previousPeriod = null;
    }
    
    const previousData = previousPeriod ? calculatePeriodData(previousPeriod) : null;

    // Évolutions
    const evolutions = previousData ? {
      marge: {
        value: currentData.stats.totalMarge - previousData.stats.totalMarge,
        percent: previousData.stats.totalMarge > 0 ? ((currentData.stats.totalMarge - previousData.stats.totalMarge) / previousData.stats.totalMarge) * 100 : 0
      },
      markup: {
        value: currentData.stats.markupMoyen - previousData.stats.markupMoyen,
        percent: 0
      },
      missions: {
        value: currentData.stats.nbMissions - previousData.stats.nbMissions,
        percent: previousData.stats.nbMissions > 0 ? ((currentData.stats.nbMissions - previousData.stats.nbMissions) / previousData.stats.nbMissions) * 100 : 0
      }
    } : null;

    // Données par mois
    const monthsData = [];
    let current = new Date(currentData.periodDates.start);
    while (current <= currentData.periodDates.end) {
      const monthName = current.toLocaleString('fr-FR', { month: 'short' });
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      
      let margeMois = 0;
      currentData.missions.forEach(m => {
        const key = `${year}-${month}`;
        const jours = m.joursParMois[key] || 0;
        if (jours > 0) {
          margeMois += jours * m.margeJour;
        }
      });
      
      monthsData.push({ 
        mois: monthName.charAt(0).toUpperCase() + monthName.slice(1), 
        marge: Math.round(margeMois) 
      });
      current.setMonth(current.getMonth() + 1);
    }

    // Données par client
    const clientsMap = {};
    currentData.missions.forEach(m => {
      if (!clientsMap[m.client]) clientsMap[m.client] = { client: m.client, missions: 0, marge: 0, ca: 0, markupTotal: 0 };
      clientsMap[m.client].missions++;
      clientsMap[m.client].marge += m.margePeriode;
      clientsMap[m.client].ca += m.caPeriode;
      clientsMap[m.client].markupTotal += m.markup;
    });
    const clientsArray = Object.values(clientsMap)
      .map(c => ({ ...c, markupMoyen: c.missions > 0 ? c.markupTotal / c.missions : 0 }))
      .sort((a, b) => b.marge - a.marge);

    // Missions à renouveler (fin dans les X prochains jours)
    const today = new Date();
    const missionsARenouveler = missionsData
      .filter(m => {
        if (m.statut !== 'Actif') return false;
        const finMission = parseDate(m.fin);
        if (!finMission) return false;
        const joursRestants = Math.ceil((finMission - today) / (1000 * 60 * 60 * 24));
        return joursRestants >= 0 && joursRestants <= settings.seuilFinMissionJours;
      })
      .map(m => {
        const finMission = parseDate(m.fin);
        const joursRestants = Math.ceil((finMission - today) / (1000 * 60 * 60 * 24));
        return { ...m, joursRestants, dateFin: finMission };
      })
      .sort((a, b) => a.joursRestants - b.joursRestants);

    return {
      ...currentData,
      previousPeriod,
      previousData,
      evolutions,
      monthsData,
      clientsArray,
      missionsARenouveler,
      isYearView
    };
  }, [missionsData, selectedPeriod, settings]);

  // ==================== PROJECTION ANNUELLE ====================

  const predictionData = useMemo(() => {
    const year = settings.anneeEnCours;
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const currentMonth = now.getMonth();

    // Calculer la marge réalisée par mois (basée sur jours_travailles)
    const margesParMois = months.map((_, index) => {
      const month = index + 1;
      let margeMois = 0;
      
      missionsData.forEach(m => {
        const key = `${year}-${month}`;
        const jours = m.joursParMois[key] || 0;
        margeMois += jours * m.margeJour;
      });
      
      return margeMois;
    });

    // Marge cumulée
    let cumulRealise = 0;
    const dataPoints = months.map((mois, index) => {
      const isRealise = index <= currentMonth || year < now.getFullYear();
      
      if (isRealise) {
        cumulRealise += margesParMois[index];
      }
      
      return {
        mois,
        index,
        realise: isRealise ? cumulRealise : null,
        margesMois: margesParMois[index],
        isCurrentMonth: year === now.getFullYear() && index === currentMonth
      };
    });

    // Projection
    const moisRealises = dataPoints.filter(d => d.realise !== null && d.margesMois > 0);
    const avgMarge = moisRealises.length > 0 
      ? moisRealises.reduce((s, m) => s + m.margesMois, 0) / moisRealises.length 
      : 0;

    let cumul = cumulRealise;
    dataPoints.forEach((d, i) => {
      if (d.realise === null) {
        cumul += avgMarge;
        d.projection = Math.round(cumul);
        d.projectionHaute = Math.round(cumul * 1.15);
        d.projectionBasse = Math.round(cumul * 0.85);
      }
    });

    const projectionFinale = dataPoints[11].projection || dataPoints[11].realise || 0;
    const objectif = settings.objectifMargeAnnuelle;
    const ecartObjectif = projectionFinale - objectif;
    const ecartPercent = objectif > 0 ? (ecartObjectif / objectif) * 100 : 0;

    return {
      dataPoints,
      projectionFinale,
      objectif,
      ecartObjectif,
      ecartPercent,
      realiseActuel: cumulRealise
    };
  }, [missionsData, settings]);

  // ==================== HANDLERS ====================

  const showNotificationMsg = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportPDF = () => {
    if (!filteredData) return;
    const { stats, clientsArray } = filteredData;
    const reportDate = new Date().toLocaleDateString('fr-FR');
    
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapport Solensoft - ${selectedPeriod}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b}.header{text-align:center;margin-bottom:40px;border-bottom:3px solid #3B82F6;padding-bottom:20px}.header h1{font-size:28px}.period{background:#3B82F6;color:white;padding:8px 16px;border-radius:20px;display:inline-block;margin-top:10px}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:40px}.kpi-card{background:#f8fafc;border-radius:12px;padding:20px;text-align:center;border:1px solid #e2e8f0}.kpi-card h3{font-size:11px;color:#64748b;text-transform:uppercase}.kpi-card .value{font-size:28px;font-weight:bold}.section{margin-bottom:40px}.section h2{font-size:16px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#3B82F6;color:white;padding:10px 8px;text-align:left}td{padding:8px;border-bottom:1px solid #e2e8f0}.footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:20px}</style></head>
    <body><div class="header"><h1>📊 Solensoft Consulting</h1><p>Rapport de pilotage</p><div class="period">${selectedPeriod}</div></div>
    <div class="kpi-grid">
      <div class="kpi-card"><h3>Marge</h3><div class="value">${(stats.totalMarge/1000).toFixed(1)}K€</div></div>
      <div class="kpi-card"><h3>Markup moyen</h3><div class="value">${stats.markupMoyen.toFixed(1)}%</div></div>
      <div class="kpi-card"><h3>Missions</h3><div class="value">${stats.nbMissions}</div></div>
      <div class="kpi-card"><h3>Alertes</h3><div class="value">${stats.nbAlertes}</div></div>
    </div>
    <div class="section"><h2>🏢 Par client</h2><table><thead><tr><th>Client</th><th>Missions</th><th>Marge</th><th>Markup</th></tr></thead><tbody>${clientsArray.map(c => `<tr><td>${c.client}</td><td>${c.missions}</td><td>${Math.round(c.marge).toLocaleString()}€</td><td>${c.markupMoyen.toFixed(1)}%</td></tr>`).join('')}</tbody></table></div>
    <div class="footer">Solensoft Consulting • ${reportDate}</div></body></html>`;

    const w = window.open('', '_blank');
    w.document.write(htmlContent);
    w.document.close();
    setTimeout(() => w.print(), 500);
    showNotificationMsg('Rapport généré !');
  };

  const openSimulator = (mission = null) => {
    setSimulatorData(mission 
      ? { ...mission, newTjmVente: mission.tjmVente, newTjmAchat: mission.tjmAchat }
      : { consultant: '', client: '', tjmAchat: 500, tjmVente: 600, newTjmVente: 600, newTjmAchat: 500 }
    );
    setShowSimulator(true);
  };

  const simResult = simulatorData ? (() => {
    const newMarge = simulatorData.newTjmVente - simulatorData.newTjmAchat;
    const newMarkup = simulatorData.newTjmVente > 0 ? (newMarge / simulatorData.newTjmVente) * 100 : 0;
    return { newMarge, newMarkup, margeMensuelle: newMarge * 20, margeTrimestrielle: newMarge * 62, margeAnnuelle: newMarge * 218 };
  })() : null;

  // ==================== COMPOSANTS ====================

  const EvolutionBadge = ({ value, percent, suffix = '', inverse = false }) => {
    const isPositive = inverse ? value < 0 : value >= 0;
    const color = isPositive ? 'text-emerald-400' : 'text-red-400';
    const bg = isPositive ? 'bg-emerald-400/10' : 'bg-red-400/10';
    const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
    
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${bg} ${color}`}>
        <Icon className="w-3 h-3" />
        <span>{value > 0 ? '+' : ''}{percent !== undefined ? percent.toFixed(1) : value.toFixed(1)}{suffix}</span>
      </div>
    );
  };

  const KPICard = ({ title, value, subtitle, icon: Icon, evolution, evolutionLabel, alert, onClick }) => (
    <div onClick={onClick} className={`relative overflow-hidden rounded-2xl p-5 transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} ${alert ? 'bg-gradient-to-br from-red-900/40 to-red-950/60 border border-red-500/30' : 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
          {evolution !== undefined && evolution !== null && (
            <div className="mt-2">
              <EvolutionBadge value={evolution.value} percent={evolution.percent} suffix={evolutionLabel} inverse={alert} />
            </div>
          )}
        </div>
        <div className={`p-2 rounded-xl ${alert ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
          <Icon className={`w-5 h-5 ${alert ? 'text-red-400' : 'text-blue-400'}`} />
        </div>
      </div>
    </div>
  );

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Navigation />
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">Erreur: {error}</p>
          <button onClick={fetchConsultants} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg">Réessayer</button>
        </div>
      </div>
    );
  }

  if (missionsData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <div className="flex flex-col items-center justify-center py-20">
          <Users className="w-16 h-16 text-slate-600 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Aucune mission</h2>
          <p className="text-slate-400 mb-6">Commencez par créer des consultants et missions dans l'onglet Ressources</p>
          <a href="/ressources" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium">
            Aller aux Ressources
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Navigation />
      
      <div className="p-4 md:p-6">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Pilotage</h1>
            <p className="text-slate-400 text-sm">Données temps réel depuis Ressources</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={fetchConsultants} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors text-sm">
              <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Actualiser</span>
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors text-sm">
              <FileDown className="w-4 h-4" /><span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={() => openSimulator()} className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors text-sm">
              <Calculator className="w-4 h-4" /><span className="hidden sm:inline">Simuler</span>
            </button>
            <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors text-sm">
              <Settings className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl">
              <Calendar className="w-4 h-4" />
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-transparent text-white outline-none cursor-pointer font-medium text-sm">
                <optgroup label="📅 Années">
                  <option value="2026">2026 (année)</option>
                  <option value="2025">2025 (année)</option>
                </optgroup>
                <optgroup label="📊 Trimestres 2026">
                  <option value="Q1 2026">Q1 2026</option>
                  <option value="Q2 2026">Q2 2026</option>
                  <option value="Q3 2026">Q3 2026</option>
                  <option value="Q4 2026">Q4 2026</option>
                </optgroup>
                <optgroup label="📊 Trimestres 2025">
                  <option value="Q1 2025">Q1 2025</option>
                  <option value="Q2 2025">Q2 2025</option>
                  <option value="Q3 2025">Q3 2025</option>
                  <option value="Q4 2025">Q4 2025</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: '📊 Vue globale' },
            { id: 'prediction', label: '📈 Projection' },
            { id: 'missions', label: '👥 Missions' },
            { id: 'clients', label: '🏢 Clients' },
            { id: 'alerts', label: `⚠️ Alertes (${(filteredData?.stats.nbAlertes || 0) + (filteredData?.missionsARenouveler?.length || 0)})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all text-sm ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-blue-400" />Paramètres</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">🎯 Objectif marge annuelle</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={settings.objectifMargeAnnuelle} onChange={(e) => setSettings({ ...settings, objectifMargeAnnuelle: parseInt(e.target.value) || 0 })} className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                    <span className="text-slate-400">€</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm mb-2">⚠️ Seuil alerte markup</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={settings.seuilMarkupAlerte} onChange={(e) => setSettings({ ...settings, seuilMarkupAlerte: parseFloat(e.target.value) || 0 })} className="w-24 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm mb-2">🏢 Seuil concentration client</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={settings.seuilConcentrationClient} onChange={(e) => setSettings({ ...settings, seuilConcentrationClient: parseFloat(e.target.value) || 0 })} className="w-24 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-400 text-sm mb-2">📅 Alerte fin de mission</label>
                  <div className="flex items-center gap-2">
                    <input type="number" value={settings.seuilFinMissionJours} onChange={(e) => setSettings({ ...settings, seuilFinMissionJours: parseInt(e.target.value) || 30 })} className="w-24 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                    <span className="text-slate-400">jours</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">Alerter si mission se termine dans moins de X jours</p>
                </div>
              </div>

              <button onClick={() => { setShowSettings(false); showNotificationMsg('Paramètres enregistrés'); }} className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors">
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Simulator Modal */}
        {showSimulator && simulatorData && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><Calculator className="w-5 h-5 text-violet-400" />Simulateur</h2>
                <button onClick={() => setShowSimulator(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              {simulatorData.consultant && <p className="text-slate-400 mb-4">{simulatorData.consultant} - {simulatorData.client}</p>}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">TJM Achat</label>
                  <input type="number" value={simulatorData.newTjmAchat} onChange={(e) => setSimulatorData({ ...simulatorData, newTjmAchat: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">TJM Vente</label>
                  <input type="number" value={simulatorData.newTjmVente} onChange={(e) => setSimulatorData({ ...simulatorData, newTjmVente: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono" />
                </div>
              </div>
              {simResult && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className="text-slate-400 text-xs">Marge/J</p>
                    <p className={`text-lg font-bold ${simResult.newMarkup >= settings.seuilMarkupAlerte ? 'text-emerald-400' : 'text-red-400'}`}>{simResult.newMarge}€</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className="text-slate-400 text-xs">Markup</p>
                    <p className={`text-lg font-bold ${simResult.newMarkup >= settings.seuilMarkupAlerte ? 'text-emerald-400' : 'text-red-400'}`}>{simResult.newMarkup.toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className="text-slate-400 text-xs">Trim.</p>
                    <p className="text-lg font-bold text-white">{(simResult.margeTrimestrielle/1000).toFixed(1)}K</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                    <p className="text-slate-400 text-xs">Année</p>
                    <p className="text-lg font-bold text-white">{(simResult.margeAnnuelle/1000).toFixed(1)}K</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENT */}
        {filteredData && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  <KPICard title={filteredData.isYearView ? "Marge année" : "Marge période"} value={`${(filteredData.stats.totalMarge/1000).toFixed(1)}K€`} icon={Euro} evolution={filteredData.evolutions?.marge} evolutionLabel="%" />
                  <KPICard title="Markup moyen" value={`${filteredData.stats.markupMoyen.toFixed(1)}%`} subtitle={`Objectif: ${settings.seuilMarkupAlerte}%`} icon={Target} evolution={filteredData.evolutions?.markup ? { value: filteredData.evolutions.markup.value } : null} evolutionLabel=" pts" />
                  <KPICard title="Missions" value={filteredData.stats.nbMissions} subtitle={`${filteredData.stats.nbConsultants} consultants`} icon={Users} evolution={filteredData.evolutions?.missions} evolutionLabel="%" />
                  <KPICard title="Concentration" value={`${filteredData.stats.concentrationClient.toFixed(0)}%`} subtitle={filteredData.stats.topClient} icon={Building2} alert={filteredData.stats.concentrationClient > settings.seuilConcentrationClient} />
                  <KPICard title="Alertes markup" value={filteredData.stats.nbAlertes} subtitle={`< ${settings.seuilMarkupAlerte}%`} icon={AlertTriangle} alert={filteredData.stats.nbAlertes > 0} onClick={() => setActiveTab('alerts')} />
                  <KPICard title="À renouveler" value={filteredData.missionsARenouveler?.length || 0} subtitle={`< ${settings.seuilFinMissionJours}j`} icon={Clock} alert={(filteredData.missionsARenouveler?.length || 0) > 0} onClick={() => setActiveTab('alerts')} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                    <h3 className="text-base font-semibold mb-4">📈 Marge par mois</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={filteredData.monthsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="mois" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} formatter={(v) => [`${v.toLocaleString()}€`, 'Marge']} />
                        <Bar dataKey="marge" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                    <h3 className="text-base font-semibold mb-4">🏢 Répartition clients</h3>
                    <div className="flex items-center">
                      <ResponsiveContainer width="50%" height={180}>
                        <PieChart>
                          <Pie data={filteredData.clientsArray.slice(0, 6)} dataKey="marge" nameKey="client" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                            {filteredData.clientsArray.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} formatter={(v) => [`${Math.round(v).toLocaleString()}€`]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1">
                        {filteredData.clientsArray.slice(0, 5).map((c, i) => (
                          <div key={c.client} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                              <span className="text-slate-300 truncate">{c.client}</span>
                            </div>
                            <span className="text-white font-mono">{(c.marge/1000).toFixed(1)}K</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prediction Tab */}
            {activeTab === 'prediction' && (
              <div className="space-y-6">
                <div className={`rounded-2xl p-6 border ${predictionData.ecartPercent >= 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-orange-900/20 border-orange-500/30'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${predictionData.ecartPercent >= 0 ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
                      <Target className={`w-8 h-8 ${predictionData.ecartPercent >= 0 ? 'text-emerald-400' : 'text-orange-400'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-1">
                        {predictionData.ecartPercent >= 0 ? '🎯 Objectif atteignable !' : '⚠️ Objectif en danger'}
                      </h2>
                      <p className="text-slate-300">
                        Projection fin {settings.anneeEnCours} : <span className="font-bold text-white">{(predictionData.projectionFinale/1000).toFixed(0)}K€</span>
                        {' '}(objectif : {(settings.objectifMargeAnnuelle/1000).toFixed(0)}K€)
                      </p>
                      <p className={`mt-2 font-medium ${predictionData.ecartPercent >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {predictionData.ecartPercent >= 0 ? '+' : ''}{predictionData.ecartPercent.toFixed(1)}% vs objectif
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                  <h3 className="text-lg font-semibold mb-6">📈 Projection marge cumulée {settings.anneeEnCours}</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={predictionData.dataPoints}>
                      <defs>
                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="mois" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v/1000).toFixed(0)}K€`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} formatter={(value) => value !== null ? [`${(value/1000).toFixed(1)}K€`] : ['-']} />
                      <Legend />
                      <Area type="monotone" dataKey="projectionHaute" stroke="transparent" fill="url(#colorConf)" name="Intervalle" />
                      <ReferenceLine y={settings.objectifMargeAnnuelle} stroke="#F59E0B" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="realise" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} name="Réalisé" connectNulls={false} />
                      <Line type="monotone" dataKey="projection" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="8 4" dot={{ fill: '#8B5CF6', r: 3 }} name="Projection" connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Réalisé YTD</p>
                    <p className="text-2xl font-bold text-emerald-400">{(predictionData.realiseActuel/1000).toFixed(1)}K€</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Projection fin {settings.anneeEnCours}</p>
                    <p className="text-2xl font-bold text-violet-400">{(predictionData.projectionFinale/1000).toFixed(0)}K€</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Objectif annuel</p>
                    <p className="text-2xl font-bold text-amber-400">{(settings.objectifMargeAnnuelle/1000).toFixed(0)}K€</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/50">
                    <p className="text-slate-400 text-sm">Écart prévu</p>
                    <p className={`text-2xl font-bold ${predictionData.ecartObjectif >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {predictionData.ecartObjectif >= 0 ? '+' : ''}{(predictionData.ecartObjectif/1000).toFixed(0)}K€
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Missions Tab */}
            {activeTab === 'missions' && (
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h3 className="text-base font-semibold mb-4">Missions {selectedPeriod} ({filteredData.missions.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-700">
                        <th className="pb-3 font-medium">Consultant</th>
                        <th className="pb-3 font-medium">Client</th>
                        <th className="pb-3 font-medium text-right">Jours</th>
                        <th className="pb-3 font-medium text-right">Marge/J</th>
                        <th className="pb-3 font-medium text-right">Marge</th>
                        <th className="pb-3 font-medium text-right">Markup</th>
                        <th className="pb-3 font-medium text-center">Simuler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.missions.map(m => (
                        <tr key={m.id} className={`border-b border-slate-700/50 hover:bg-slate-700/20 ${m.markup < settings.seuilMarkupAlerte ? 'bg-red-900/10' : ''}`}>
                          <td className="py-3 font-medium">{m.consultant}</td>
                          <td className="py-3 text-slate-300">{m.client}</td>
                          <td className="py-3 text-right font-mono">{m.joursEffectifs}j</td>
                          <td className="py-3 text-right font-mono">{m.margeJour}€</td>
                          <td className="py-3 text-right font-mono text-emerald-400">{m.margePeriode.toLocaleString()}€</td>
                          <td className={`py-3 text-right font-mono font-medium ${m.markup >= settings.seuilMarkupAlerte ? 'text-emerald-400' : 'text-red-400'}`}>{m.markup.toFixed(1)}%</td>
                          <td className="py-3 text-center">
                            <button onClick={() => openSimulator(m)} className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-violet-600/50"><Calculator className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredData.clientsArray.map((client, i) => (
                  <div key={client.client} className={`bg-slate-800/50 rounded-2xl p-5 border ${client.markupMoyen < settings.seuilMarkupAlerte ? 'border-red-500/30' : 'border-slate-700/50'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] + '30', color: COLORS[i % COLORS.length] }}>
                        {client.client.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{client.client}</h3>
                        <p className="text-slate-400 text-sm">{client.missions} mission(s)</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Marge</span>
                        <span className="font-mono text-emerald-400">{Math.round(client.marge).toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CA</span>
                        <span className="font-mono">{Math.round(client.ca).toLocaleString()}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Markup moy.</span>
                        <span className={`font-mono font-medium ${client.markupMoyen >= settings.seuilMarkupAlerte ? 'text-emerald-400' : 'text-red-400'}`}>{client.markupMoyen.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="space-y-6">
                {/* Section Missions à renouveler */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    Missions à renouveler
                    <span className="text-sm font-normal text-slate-400">(fin dans moins de {settings.seuilFinMissionJours} jours)</span>
                  </h3>
                  
                  {(!filteredData.missionsARenouveler || filteredData.missionsARenouveler.length === 0) ? (
                    <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700/50">
                      <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-slate-400">Aucune mission à renouveler prochainement</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-orange-900/20 rounded-2xl p-4 border border-orange-500/30">
                        <p className="text-orange-400 font-medium">⚠️ {filteredData.missionsARenouveler.length} mission(s) se termine(nt) bientôt</p>
                      </div>
                      {filteredData.missionsARenouveler.map(m => (
                        <div key={m.id} className={`bg-slate-800/50 rounded-xl p-4 border flex items-center justify-between ${m.joursRestants <= 7 ? 'border-red-500/50' : m.joursRestants <= 15 ? 'border-orange-500/30' : 'border-yellow-500/30'}`}>
                          <div>
                            <p className="font-medium">{m.consultant}</p>
                            <p className="text-slate-400 text-sm">{m.client}</p>
                            <p className="text-slate-500 text-xs mt-1">Fin : {m.dateFin?.toLocaleDateString('fr-FR')}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className={`text-2xl font-bold ${m.joursRestants <= 7 ? 'text-red-400' : m.joursRestants <= 15 ? 'text-orange-400' : 'text-yellow-400'}`}>
                                {m.joursRestants}
                              </p>
                              <p className="text-slate-500 text-xs">jours</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-white">{m.margeJour}€</p>
                              <p className="text-slate-500 text-xs">marge/j</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section Alertes Markup */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Alertes markup
                    <span className="text-sm font-normal text-slate-400">(sous {settings.seuilMarkupAlerte}%)</span>
                  </h3>
                  
                  {filteredData.alertes.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700/50">
                      <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <p className="text-slate-400">Toutes les missions sont au-dessus de {settings.seuilMarkupAlerte}%</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-red-900/20 rounded-2xl p-4 border border-red-500/30">
                        <p className="text-red-400 font-medium">{filteredData.alertes.length} mission(s) sous {settings.seuilMarkupAlerte}% de markup</p>
                      </div>
                      {filteredData.alertes.sort((a, b) => a.markup - b.markup).map(m => (
                        <div key={m.id} className="bg-slate-800/50 rounded-xl p-4 border border-red-500/30 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.consultant}</p>
                            <p className="text-slate-400 text-sm">{m.client}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-red-400 text-xl font-bold">{m.markup.toFixed(1)}%</p>
                              <p className="text-slate-500 text-xs">markup</p>
                            </div>
                            <button onClick={() => openSimulator(m)} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm">Simuler</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 text-center text-slate-500 text-xs">
          Solensoft Consulting • {selectedPeriod} • Données temps réel
        </div>
      </div>
    </div>
  );
}
