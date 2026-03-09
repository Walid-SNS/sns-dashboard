import React, { useState, useRef, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart, ComposedChart, ReferenceLine, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, AlertTriangle, Target, Calendar, Building2, Euro, Bell, Upload, FileDown, Calculator, X, Check, RefreshCw, Sliders, Clock, Settings, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import * as XLSX from 'xlsx';

// Données Solensoft enrichies avec historique
const initialMissionsData = [
  // Q1 2026
  { id: 1, consultant: "Junaid Jabbar", client: "HORSE", tjmAchat: 550, tjmVente: 620, margeJour: 70, markup: 11.3, debut: "2026-01-01", fin: "2026-06-30", statut: "Actif" },
  { id: 2, consultant: "Junaid Jabbar", client: "HORSE", tjmAchat: 570, tjmVente: 640, margeJour: 70, markup: 10.9, debut: "2026-02-01", fin: "2026-06-30", statut: "Actif" },
  { id: 3, consultant: "Rupam Mandal", client: "ACCENTURE", tjmAchat: 660, tjmVente: 730, margeJour: 70, markup: 9.6, debut: "2025-07-15", fin: "2026-07-14", statut: "Actif" },
  { id: 4, consultant: "Salim CISSE", client: "SAE", tjmAchat: 450, tjmVente: 630, margeJour: 180, markup: 28.6, debut: "2025-10-01", fin: "2026-03-31", statut: "Actif" },
  { id: 5, consultant: "Naoufal HADI", client: "VALEO", tjmAchat: 875, tjmVente: 1000, margeJour: 125, markup: 12.5, debut: "2026-01-01", fin: "2026-03-31", statut: "Actif" },
  { id: 6, consultant: "Anas EL HABRI", client: "ACCENTURE", tjmAchat: 750, tjmVente: 820, margeJour: 70, markup: 8.5, debut: "2026-01-19", fin: "2026-05-08", statut: "Actif" },
  { id: 7, consultant: "Annasalman CHEICK ISMAIL", client: "ACCENTURE", tjmAchat: 760, tjmVente: 800, margeJour: 40, markup: 5.0, debut: "2026-01-01", fin: "2026-04-30", statut: "Actif" },
  { id: 8, consultant: "MODOU KANE ElHadj", client: "BOULANGER", tjmAchat: 727, tjmVente: 765, margeJour: 38, markup: 5.0, debut: "2026-01-01", fin: "2026-03-31", statut: "Actif" },
  { id: 9, consultant: "Abourakhmanne DIABATE", client: "SAE", tjmAchat: 550, tjmVente: 680, margeJour: 130, markup: 19.1, debut: "2026-02-01", fin: "2026-07-31", statut: "Actif" },
  { id: 10, consultant: "Serge", client: "SAE", tjmAchat: 725, tjmVente: 800, margeJour: 75, markup: 9.4, debut: "2026-01-15", fin: "2026-06-30", statut: "Actif" },
  { id: 11, consultant: "Galo KA", client: "PROFROID", tjmAchat: 500, tjmVente: 600, margeJour: 100, markup: 16.7, debut: "2026-04-01", fin: "2026-09-30", statut: "À venir" },
  // Q4 2025 (historique)
  { id: 12, consultant: "Marc DURAND", client: "AIRBUS", tjmAchat: 600, tjmVente: 720, margeJour: 120, markup: 16.7, debut: "2025-09-01", fin: "2025-12-31", statut: "Terminé" },
  { id: 13, consultant: "Sophie MARTIN", client: "THALES", tjmAchat: 580, tjmVente: 700, margeJour: 120, markup: 17.1, debut: "2025-10-01", fin: "2025-12-31", statut: "Terminé" },
  { id: 14, consultant: "Pierre LEROY", client: "SAFRAN", tjmAchat: 620, tjmVente: 750, margeJour: 130, markup: 17.3, debut: "2025-08-01", fin: "2025-12-15", statut: "Terminé" },
  // Q3 2025
  { id: 15, consultant: "Jean PETIT", client: "DASSAULT", tjmAchat: 550, tjmVente: 680, margeJour: 130, markup: 19.1, debut: "2025-07-01", fin: "2025-09-30", statut: "Terminé" },
  { id: 16, consultant: "Marie DUBOIS", client: "AIRBUS", tjmAchat: 500, tjmVente: 620, margeJour: 120, markup: 19.4, debut: "2025-06-01", fin: "2025-09-30", statut: "Terminé" },
  // Q2 2025
  { id: 17, consultant: "Luc BERNARD", client: "THALES", tjmAchat: 480, tjmVente: 590, margeJour: 110, markup: 18.6, debut: "2025-04-01", fin: "2025-06-30", statut: "Terminé" },
];

// Périodes disponibles (années + trimestres)
const QUARTERS = {
  // Années complètes
  '2026': { start: '2026-01-01', end: '2026-12-31', label: 'Année 2026 complète', year: 2026, q: null, isYear: true },
  '2025': { start: '2025-01-01', end: '2025-12-31', label: 'Année 2025 complète', year: 2025, q: null, isYear: true },
  // Trimestres 2026
  'Q1 2026': { start: '2026-01-01', end: '2026-03-31', label: 'Janvier - Mars 2026', year: 2026, q: 1 },
  'Q2 2026': { start: '2026-04-01', end: '2026-06-30', label: 'Avril - Juin 2026', year: 2026, q: 2 },
  'Q3 2026': { start: '2026-07-01', end: '2026-09-30', label: 'Juillet - Septembre 2026', year: 2026, q: 3 },
  'Q4 2026': { start: '2026-10-01', end: '2026-12-31', label: 'Octobre - Décembre 2026', year: 2026, q: 4 },
  // Trimestres 2025
  'Q1 2025': { start: '2025-01-01', end: '2025-03-31', label: 'Janvier - Mars 2025', year: 2025, q: 1 },
  'Q2 2025': { start: '2025-04-01', end: '2025-06-30', label: 'Avril - Juin 2025', year: 2025, q: 2 },
  'Q3 2025': { start: '2025-07-01', end: '2025-09-30', label: 'Juillet - Septembre 2025', year: 2025, q: 3 },
  'Q4 2025': { start: '2025-10-01', end: '2025-12-31', label: 'Octobre - Décembre 2025', year: 2025, q: 4 },
};

const JOURS_OUVRES_PAR_MOIS = { 1: 22, 2: 20, 3: 22, 4: 21, 5: 21, 6: 22, 7: 22, 8: 18, 9: 22, 10: 22, 11: 21, 12: 20 };

const initialActions = [
  { id: 1, action: "Renégocier TJM Annasalman chez ACCENTURE", responsable: "Président", echeance: "15/04/2026", statut: "En cours", priorite: "Haute" },
  { id: 2, action: "Renouvellement mission Naoufal VALEO", responsable: "Commercial", echeance: "01/03/2026", statut: "À faire", priorite: "Haute" },
  { id: 3, action: "Sourcing profil Teamcenter senior", responsable: "RH", echeance: "30/04/2026", statut: "En cours", priorite: "Moyenne" },
  { id: 4, action: "Point satisfaction Salim CISSE", responsable: "Président", echeance: "20/03/2026", statut: "Fait", priorite: "Basse" },
];

export default function DashboardSolensoft() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('Q1 2026');
  const [missionsData, setMissionsData] = useState(initialMissionsData);
  const [actionsEnCours, setActionsEnCours] = useState(initialActions);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [simulatorData, setSimulatorData] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  // Paramètres configurables
  const [settings, setSettings] = useState({
    objectifMargeAnnuelle: 150000,
    seuilMarkupAlerte: 10,
    seuilConcentrationClient: 30,
    anneeEnCours: 2026
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // ==================== FONCTIONS UTILITAIRES ====================

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
    return null;
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

  const missionInQuarter = (mission, quarterDates) => {
    const missionStart = parseDate(mission.debut);
    const missionEnd = parseDate(mission.fin);
    if (!missionStart || !missionEnd || !quarterDates) return { inQuarter: false };
    
    const { start: qStart, end: qEnd } = quarterDates;
    const inQuarter = missionStart <= qEnd && missionEnd >= qStart;
    if (!inQuarter) return { inQuarter: false };
    
    const effectiveStart = missionStart > qStart ? missionStart : qStart;
    const effectiveEnd = missionEnd < qEnd ? missionEnd : qEnd;
    const joursEffectifs = getJoursOuvres(effectiveStart, effectiveEnd);
    const joursTrimestre = getJoursOuvres(qStart, qEnd);
    const fullQuarter = missionStart <= qStart && missionEnd >= qEnd;
    
    return {
      inQuarter: true,
      joursEffectifs,
      joursTrimestre,
      fullQuarter,
      effectiveStart,
      effectiveEnd,
      coverage: Math.round((joursEffectifs / joursTrimestre) * 100)
    };
  };

  // ==================== CALCUL DES DONNÉES PAR TRIMESTRE ====================

  const calculateQuarterData = (quarter) => {
    const quarterDates = getQuarterDates(quarter);
    if (!quarterDates) return null;

    const missionsInQuarter = missionsData
      .map(mission => {
        const quarterInfo = missionInQuarter(mission, quarterDates);
        if (!quarterInfo.inQuarter) return null;
        return {
          ...mission,
          ...quarterInfo,
          margeTrimestrielle: mission.margeJour * quarterInfo.joursEffectifs,
          caTrimestriel: mission.tjmVente * quarterInfo.joursEffectifs
        };
      })
      .filter(Boolean);

    const totalMarge = missionsInQuarter.reduce((sum, m) => sum + m.margeTrimestrielle, 0);
    const totalCA = missionsInQuarter.reduce((sum, m) => sum + m.caTrimestriel, 0);
    const totalJours = missionsInQuarter.reduce((sum, m) => sum + m.joursEffectifs, 0);
    const alertes = missionsInQuarter.filter(m => m.markup < settings.seuilMarkupAlerte);
    const markupMoyen = totalCA > 0 ? ((totalMarge / totalCA) * 100) : 0;

    // Concentration client
    const clientsCA = {};
    missionsInQuarter.forEach(m => {
      clientsCA[m.client] = (clientsCA[m.client] || 0) + m.caTrimestriel;
    });
    const topClientCA = Math.max(...Object.values(clientsCA), 0);
    const concentrationClient = totalCA > 0 ? (topClientCA / totalCA) * 100 : 0;
    const topClient = Object.entries(clientsCA).find(([_, ca]) => ca === topClientCA)?.[0] || '';

    // Missions à renouveler (fin dans le trimestre)
    const missionsARenouveler = missionsInQuarter.filter(m => {
      const fin = parseDate(m.fin);
      return fin >= quarterDates.start && fin <= quarterDates.end;
    });

    return {
      quarter,
      quarterDates,
      missions: missionsInQuarter,
      stats: {
        totalMarge,
        totalCA,
        totalJours,
        markupMoyen,
        nbMissions: missionsInQuarter.length,
        nbAlertes: alertes.length,
        concentrationClient,
        topClient,
        nbRenouvellements: missionsARenouveler.length
      },
      alertes,
      missionsARenouveler
    };
  };

  // ==================== DONNÉES FILTRÉES & COMPARAISONS ====================

  const filteredData = useMemo(() => {
    const currentData = calculateQuarterData(selectedPeriod);
    if (!currentData) return null;

    const currentQuarterInfo = QUARTERS[selectedPeriod];
    const isYearView = currentQuarterInfo?.isYear || false;

    // Trouver la période de comparaison
    let previousQuarter = null;
    if (isYearView) {
      // Vue année : comparer avec l'année précédente
      const previousYear = String(currentQuarterInfo.year - 1);
      if (QUARTERS[previousYear]) {
        previousQuarter = previousYear;
      }
    } else {
      // Vue trimestre : comparer avec le trimestre précédent
      const currentQ = currentQuarterInfo.q;
      const currentYear = currentQuarterInfo.year;
      if (currentQ === 1) {
        previousQuarter = `Q4 ${currentYear - 1}`;
      } else {
        previousQuarter = `Q${currentQ - 1} ${currentYear}`;
      }
      // Vérifier que ce trimestre existe
      if (!QUARTERS[previousQuarter]) {
        previousQuarter = null;
      }
    }
    const previousData = previousQuarter ? calculateQuarterData(previousQuarter) : null;

    // Calculer les évolutions
    const evolutions = previousData ? {
      marge: {
        value: currentData.stats.totalMarge - previousData.stats.totalMarge,
        percent: previousData.stats.totalMarge > 0 ? ((currentData.stats.totalMarge - previousData.stats.totalMarge) / previousData.stats.totalMarge) * 100 : 0
      },
      markup: {
        value: currentData.stats.markupMoyen - previousData.stats.markupMoyen,
        percent: 0 // En points
      },
      missions: {
        value: currentData.stats.nbMissions - previousData.stats.nbMissions,
        percent: previousData.stats.nbMissions > 0 ? ((currentData.stats.nbMissions - previousData.stats.nbMissions) / previousData.stats.nbMissions) * 100 : 0
      },
      alertes: {
        value: currentData.stats.nbAlertes - previousData.stats.nbAlertes,
        percent: 0
      },
      concentration: {
        value: currentData.stats.concentrationClient - previousData.stats.concentrationClient,
        percent: 0
      }
    } : null;

    // Données par mois pour graphique
    const monthsData = [];
    let current = new Date(currentData.quarterDates.start);
    while (current <= currentData.quarterDates.end) {
      const monthName = current.toLocaleString('fr-FR', { month: 'short' });
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      
      let margeMois = 0;
      currentData.missions.forEach(m => {
        const mStart = parseDate(m.debut);
        const mEnd = parseDate(m.fin);
        if (mStart <= monthEnd && mEnd >= monthStart) {
          const effStart = mStart > monthStart ? mStart : monthStart;
          const effEnd = mEnd < monthEnd ? mEnd : monthEnd;
          margeMois += m.margeJour * getJoursOuvres(effStart, effEnd);
        }
      });
      
      monthsData.push({ mois: monthName.charAt(0).toUpperCase() + monthName.slice(1), marge: Math.round(margeMois) });
      current.setMonth(current.getMonth() + 1);
    }

    // Données par client
    const clientsMap = {};
    currentData.missions.forEach(m => {
      if (!clientsMap[m.client]) clientsMap[m.client] = { client: m.client, missions: 0, marge: 0, ca: 0, markupTotal: 0 };
      clientsMap[m.client].missions++;
      clientsMap[m.client].marge += m.margeTrimestrielle;
      clientsMap[m.client].ca += m.caTrimestriel;
      clientsMap[m.client].markupTotal += m.markup;
    });
    const clientsArray = Object.values(clientsMap)
      .map(c => ({ ...c, markupMoyen: c.markupTotal / c.missions }))
      .sort((a, b) => b.marge - a.marge);

    return {
      ...currentData,
      previousQuarter,
      previousData,
      evolutions,
      monthsData,
      clientsArray,
      isYearView
    };
  }, [missionsData, selectedPeriod, settings]);

  // ==================== HISTORIQUE TRIMESTRES ====================

  const historicalData = useMemo(() => {
    // Ne garder que les trimestres (pas les années) pour l'historique
    const trimestres = Object.keys(QUARTERS).filter(q => !QUARTERS[q].isYear);
    return trimestres.map(q => {
      const data = calculateQuarterData(q);
      return {
        quarter: q,
        marge: data?.stats.totalMarge || 0,
        markup: data?.stats.markupMoyen || 0,
        missions: data?.stats.nbMissions || 0,
        alertes: data?.stats.nbAlertes || 0
      };
    }).slice(0, 6); // Garder les 6 derniers trimestres
  }, [missionsData, settings]);

  // ==================== COURBE PRÉDICTIVE ====================

  const predictionData = useMemo(() => {
    const year = settings.anneeEnCours;
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // Calculer la marge réalisée par mois
    const margesParMois = months.map((mois, index) => {
      const monthStart = new Date(year, index, 1);
      const monthEnd = new Date(year, index + 1, 0);
      
      let margeMois = 0;
      missionsData.forEach(m => {
        const mStart = parseDate(m.debut);
        const mEnd = parseDate(m.fin);
        if (mStart && mEnd && mStart <= monthEnd && mEnd >= monthStart) {
          const effStart = mStart > monthStart ? mStart : monthStart;
          const effEnd = mEnd < monthEnd ? mEnd : monthEnd;
          margeMois += m.margeJour * getJoursOuvres(effStart, effEnd);
        }
      });
      
      return margeMois;
    });

    // Calculer marge cumulée réalisée
    let cumulRealise = 0;
    const dataPoints = months.map((mois, index) => {
      const isRealise = index <= currentMonth || year < now.getFullYear();
      const isPast = year < now.getFullYear() || (year === now.getFullYear() && index < currentMonth);
      
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

    // Projection pondérée (les derniers mois comptent plus)
    const moisRealises = dataPoints.filter(d => d.realise !== null && d.margesMois > 0);
    if (moisRealises.length < 2) {
      // Pas assez de données, projection linéaire simple
      const avgMarge = moisRealises.length > 0 ? moisRealises.reduce((s, m) => s + m.margesMois, 0) / moisRealises.length : 10000;
      let cumul = cumulRealise;
      dataPoints.forEach((d, i) => {
        if (d.realise === null) {
          cumul += avgMarge;
          d.projection = cumul;
          d.projectionHaute = cumul * 1.15;
          d.projectionBasse = cumul * 0.85;
        }
      });
    } else {
      // Projection pondérée
      const weights = moisRealises.map((_, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const weightedAvg = moisRealises.reduce((sum, m, i) => sum + m.margesMois * weights[i], 0) / totalWeight;
      
      // Tendance (croissance moyenne pondérée)
      let tendance = 0;
      if (moisRealises.length >= 2) {
        const croissances = [];
        for (let i = 1; i < moisRealises.length; i++) {
          if (moisRealises[i-1].margesMois > 0) {
            croissances.push((moisRealises[i].margesMois - moisRealises[i-1].margesMois) / moisRealises[i-1].margesMois);
          }
        }
        tendance = croissances.length > 0 ? croissances.reduce((a, b) => a + b, 0) / croissances.length : 0;
      }

      let cumul = cumulRealise;
      let lastMarge = moisRealises[moisRealises.length - 1]?.margesMois || weightedAvg;
      
      dataPoints.forEach((d, i) => {
        if (d.realise === null) {
          const projectedMarge = lastMarge * (1 + tendance * 0.5); // Tendance atténuée
          cumul += Math.max(projectedMarge, weightedAvg * 0.7);
          d.projection = Math.round(cumul);
          d.projectionHaute = Math.round(cumul * 1.15);
          d.projectionBasse = Math.round(cumul * 0.85);
          lastMarge = projectedMarge;
        }
      });
    }

    // Projection finale
    const projectionFinale = dataPoints[11].projection || dataPoints[11].realise || 0;
    const objectif = settings.objectifMargeAnnuelle;
    const ecartObjectif = projectionFinale - objectif;
    const ecartPercent = objectif > 0 ? (ecartObjectif / objectif) * 100 : 0;

    // Mois d'atteinte de l'objectif
    let moisAtteinte = null;
    for (const d of dataPoints) {
      const val = d.realise || d.projection;
      if (val >= objectif) {
        moisAtteinte = d.mois;
        break;
      }
    }

    return {
      dataPoints,
      projectionFinale,
      objectif,
      ecartObjectif,
      ecartPercent,
      moisAtteinte,
      realiseActuel: cumulRealise
    };
  }, [missionsData, settings]);

  // ==================== HANDLERS ====================

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setImportStatus('loading');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const missionsSheet = workbook.Sheets['Missions'] || workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(missionsSheet);

        const parsedMissions = jsonData
          .filter(row => row['Mission'] || row['Consultant'])
          .map((row, index) => {
            const tjmAchat = parseFloat(row['TJM Achat (€)'] || row['TJM Achat'] || 0);
            const tjmVente = parseFloat(row['TJM Vente (€)'] || row['TJM Vente'] || 0);
            const margeJour = tjmVente - tjmAchat;
            const markup = tjmVente > 0 ? ((margeJour / tjmVente) * 100) : 0;
            return {
              id: index + 1,
              consultant: row['Consultant'] || row['Nom Complet'] || '',
              client: row['Client'] || '',
              tjmAchat, tjmVente, margeJour, markup,
              debut: row['Début'] || row['Debut'] || '',
              fin: row['Fin'] || '',
              statut: row['Statut'] || 'Actif'
            };
          })
          .filter(m => m.consultant && m.tjmVente > 0);

        if (parsedMissions.length > 0) {
          setMissionsData(parsedMissions);
          setImportStatus('success');
          showNotification(`${parsedMissions.length} missions importées !`);
          setTimeout(() => { setShowImportModal(false); setImportStatus(null); }, 1500);
        } else {
          setImportStatus('error');
          showNotification('Format non reconnu', 'error');
        }
      } catch (error) {
        setImportStatus('error');
        showNotification('Erreur d\'import', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportPDF = () => {
    const { stats, clientsArray, alertes } = filteredData;
    const reportDate = new Date().toLocaleDateString('fr-FR');
    
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rapport Solensoft - ${selectedPeriod}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b}.header{text-align:center;margin-bottom:40px;border-bottom:3px solid #3B82F6;padding-bottom:20px}.header h1{font-size:28px}.period{background:#3B82F6;color:white;padding:8px 16px;border-radius:20px;display:inline-block;margin-top:10px}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:40px}.kpi-card{background:#f8fafc;border-radius:12px;padding:20px;text-align:center;border:1px solid #e2e8f0}.kpi-card h3{font-size:11px;color:#64748b;text-transform:uppercase}.kpi-card .value{font-size:28px;font-weight:bold}.kpi-card .evolution{font-size:12px;margin-top:5px}.evolution.up{color:#10b981}.evolution.down{color:#ef4444}.section{margin-bottom:40px}.section h2{font-size:16px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#3B82F6;color:white;padding:10px 8px;text-align:left}td{padding:8px;border-bottom:1px solid #e2e8f0}.footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;padding-top:20px}</style></head>
    <body><div class="header"><h1>📊 Solensoft Consulting</h1><p>Rapport de pilotage</p><div class="period">${selectedPeriod}</div></div>
    <div class="kpi-grid">
      <div class="kpi-card"><h3>Marge trimestre</h3><div class="value">${(stats.totalMarge/1000).toFixed(1)}K€</div>${filteredData.evolutions ? `<div class="evolution ${filteredData.evolutions.marge.percent >= 0 ? 'up' : 'down'}">${filteredData.evolutions.marge.percent >= 0 ? '+' : ''}${filteredData.evolutions.marge.percent.toFixed(1)}% vs Q-1</div>` : ''}</div>
      <div class="kpi-card"><h3>Markup moyen</h3><div class="value">${stats.markupMoyen.toFixed(1)}%</div>${filteredData.evolutions ? `<div class="evolution ${filteredData.evolutions.markup.value >= 0 ? 'up' : 'down'}">${filteredData.evolutions.markup.value >= 0 ? '+' : ''}${filteredData.evolutions.markup.value.toFixed(1)} pts</div>` : ''}</div>
      <div class="kpi-card"><h3>Missions</h3><div class="value">${stats.nbMissions}</div></div>
      <div class="kpi-card"><h3>Alertes</h3><div class="value" style="color:${stats.nbAlertes > 0 ? '#ef4444' : '#10b981'}">${stats.nbAlertes}</div></div>
    </div>
    <div class="section"><h2>🏢 Par client</h2><table><thead><tr><th>Client</th><th>Missions</th><th>Marge</th><th>Markup</th></tr></thead><tbody>${clientsArray.map(c => `<tr><td>${c.client}</td><td>${c.missions}</td><td>${Math.round(c.marge).toLocaleString()}€</td><td>${c.markupMoyen.toFixed(1)}%</td></tr>`).join('')}</tbody></table></div>
    <div class="section"><h2>📈 Projection ${settings.anneeEnCours}</h2><p>Projection fin d'année : <strong>${(predictionData.projectionFinale/1000).toFixed(0)}K€</strong> (objectif: ${(settings.objectifMargeAnnuelle/1000).toFixed(0)}K€)</p><p style="margin-top:10px;color:${predictionData.ecartPercent >= 0 ? '#10b981' : '#ef4444'}">${predictionData.ecartPercent >= 0 ? '✅' : '⚠️'} ${predictionData.ecartPercent >= 0 ? 'Objectif atteignable' : 'Objectif en danger'} (${predictionData.ecartPercent >= 0 ? '+' : ''}${predictionData.ecartPercent.toFixed(1)}%)</p></div>
    <div class="footer">Solensoft Consulting • ${reportDate}</div></body></html>`;

    const w = window.open('', '_blank');
    w.document.write(htmlContent);
    w.document.close();
    setTimeout(() => w.print(), 500);
    showNotification('Rapport généré !');
  };

  const openSimulator = (mission = null) => {
    setSimulatorData(mission ? { ...mission, newTjmVente: mission.tjmVente, newTjmAchat: mission.tjmAchat } : { consultant: '', client: '', tjmAchat: 500, tjmVente: 600, newTjmVente: 600, newTjmAchat: 500 });
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

  if (!filteredData) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-6" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center font-bold text-lg">S</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Solensoft</h1>
          </div>
          <p className="text-slate-400 text-sm">Dashboard de pilotage</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors text-sm">
            <Upload className="w-4 h-4" /><span className="hidden sm:inline">Import</span>
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors text-sm">
            <FileDown className="w-4 h-4" /><span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={() => openSimulator()} className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors text-sm">
            <Calculator className="w-4 h-4" /><span className="hidden sm:inline">Simuler</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors text-sm">
            <Settings className="w-4 h-4" /><span className="hidden sm:inline">Paramètres</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl">
            <Calendar className="w-4 h-4" />
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-transparent text-white outline-none cursor-pointer font-medium text-sm">
              <optgroup label="📅 Années" className="bg-slate-800 text-slate-300">
                <option value="2026" className="bg-slate-800">📅 2026 (année)</option>
                <option value="2025" className="bg-slate-800">📅 2025 (année)</option>
              </optgroup>
              <optgroup label="📊 Trimestres 2026" className="bg-slate-800 text-slate-300">
                <option value="Q1 2026" className="bg-slate-800">Q1 2026</option>
                <option value="Q2 2026" className="bg-slate-800">Q2 2026</option>
                <option value="Q3 2026" className="bg-slate-800">Q3 2026</option>
                <option value="Q4 2026" className="bg-slate-800">Q4 2026</option>
              </optgroup>
              <optgroup label="📊 Trimestres 2025" className="bg-slate-800 text-slate-300">
                <option value="Q1 2025" className="bg-slate-800">Q1 2025</option>
                <option value="Q2 2025" className="bg-slate-800">Q2 2025</option>
                <option value="Q3 2025" className="bg-slate-800">Q3 2025</option>
                <option value="Q4 2025" className="bg-slate-800">Q4 2025</option>
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
          { id: 'alerts', label: `⚠️ Alertes (${filteredData.stats.nbAlertes})` },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all text-sm ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== SETTINGS MODAL ==================== */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-blue-400" />Paramètres</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">🎯 Objectif marge annuelle {settings.anneeEnCours}</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={settings.objectifMargeAnnuelle} onChange={(e) => setSettings({ ...settings, objectifMargeAnnuelle: parseInt(e.target.value) || 0 })} className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 outline-none" />
                  <span className="text-slate-400">€</span>
                </div>
                <p className="text-slate-500 text-xs mt-1">Soit {(settings.objectifMargeAnnuelle / 12 / 1000).toFixed(1)}K€/mois</p>
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
                <p className="text-slate-500 text-xs mt-1">Alerte si un client dépasse ce % du CA</p>
              </div>
            </div>

            <button onClick={() => { setShowSettings(false); showNotification('Paramètres enregistrés'); }} className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ==================== IMPORT MODAL ==================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Importer Excel</h2>
              <button onClick={() => { setShowImportModal(false); setImportStatus(null); }} className="p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls" className="hidden" />
              {importStatus === 'loading' ? <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto" /> :
               importStatus === 'success' ? <Check className="w-10 h-10 text-emerald-400 mx-auto" /> :
               importStatus === 'error' ? <X className="w-10 h-10 text-red-400 mx-auto" /> :
               <><Upload className="w-10 h-10 text-slate-500 mx-auto mb-4" /><button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium">Parcourir</button></>}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SIMULATOR MODAL ==================== */}
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
            {simResult && simResult.newMarkup < settings.seuilMarkupAlerte && (
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-3 text-sm">
                <p className="text-orange-400">💡 TJM Vente min pour {settings.seuilMarkupAlerte}% : <span className="font-bold">{Math.ceil(simulatorData.newTjmAchat / (1 - settings.seuilMarkupAlerte/100))}€</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPIs avec évolutions */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPICard title={filteredData.isYearView ? "Marge année" : "Marge trimestre"} value={`${(filteredData.stats.totalMarge/1000).toFixed(1)}K€`} icon={Euro} evolution={filteredData.evolutions?.marge} evolutionLabel="%" />
            <KPICard title="Markup moyen" value={`${filteredData.stats.markupMoyen.toFixed(1)}%`} subtitle={`Objectif: ${settings.seuilMarkupAlerte}%`} icon={Target} evolution={filteredData.evolutions?.markup ? { value: filteredData.evolutions.markup.value, percent: undefined } : null} evolutionLabel=" pts" />
            <KPICard title="Missions" value={filteredData.stats.nbMissions} icon={Users} evolution={filteredData.evolutions?.missions} evolutionLabel="%" />
            <KPICard title="Concentration" value={`${filteredData.stats.concentrationClient.toFixed(0)}%`} subtitle={filteredData.stats.topClient} icon={Building2} evolution={filteredData.evolutions?.concentration ? { value: filteredData.evolutions.concentration.value, percent: undefined } : null} evolutionLabel=" pts" alert={filteredData.stats.concentrationClient > settings.seuilConcentrationClient} />
            <KPICard title="Alertes" value={filteredData.stats.nbAlertes} subtitle={`< ${settings.seuilMarkupAlerte}% markup`} icon={AlertTriangle} evolution={filteredData.evolutions?.alertes} alert={filteredData.stats.nbAlertes > 0} onClick={() => setActiveTab('alerts')} />
          </div>

          {/* Historique 4 trimestres */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">📊 Historique 4 trimestres</h3>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="quarter" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="marge" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Marge (€)" />
                <Line yAxisId="right" type="monotone" dataKey="markup" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} name="Markup (%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Graphiques côte à côte */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <h3 className="text-base font-semibold mb-4">📈 Marge par mois {filteredData.isYearView ? `(${selectedPeriod})` : `(${selectedPeriod})`}</h3>
              <ResponsiveContainer width="100%" height={filteredData.isYearView ? 220 : 180}>
                <BarChart data={filteredData.monthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="mois" stroke="#94a3b8" tick={{ fontSize: filteredData.isYearView ? 10 : 12 }} />
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

      {/* ==================== PREDICTION TAB ==================== */}
      {activeTab === 'prediction' && (
        <div className="space-y-6">
          {/* Message principal */}
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
                  À ce rythme, projection fin {settings.anneeEnCours} : <span className="font-bold text-white">{(predictionData.projectionFinale/1000).toFixed(0)}K€</span>
                  {' '}(objectif : {(settings.objectifMargeAnnuelle/1000).toFixed(0)}K€)
                </p>
                <p className={`mt-2 font-medium ${predictionData.ecartPercent >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {predictionData.ecartPercent >= 0 ? '+' : ''}{predictionData.ecartPercent.toFixed(1)}% vs objectif
                  {predictionData.moisAtteinte && predictionData.ecartPercent >= 0 && ` • Objectif atteint en ${predictionData.moisAtteinte}`}
                </p>
              </div>
            </div>
          </div>

          {/* Courbe prédictive */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              📈 Projection marge cumulée {settings.anneeEnCours}
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={predictionData.dataPoints}>
                <defs>
                  <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mois" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v/1000).toFixed(0)}K€`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  formatter={(value, name) => {
                    if (value === null) return ['-', name];
                    return [`${(value/1000).toFixed(1)}K€`, name];
                  }}
                />
                <Legend />
                
                {/* Zone de confiance */}
                <Area type="monotone" dataKey="projectionHaute" stroke="transparent" fill="url(#colorConfidence)" name="Intervalle confiance" />
                <Area type="monotone" dataKey="projectionBasse" stroke="transparent" fill="transparent" />
                
                {/* Ligne objectif */}
                <ReferenceLine y={settings.objectifMargeAnnuelle} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: `Objectif ${(settings.objectifMargeAnnuelle/1000).toFixed(0)}K€`, position: 'right', fill: '#F59E0B', fontSize: 12 }} />
                
                {/* Courbe réalisée */}
                <Line type="monotone" dataKey="realise" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} name="Réalisé" connectNulls={false} />
                
                {/* Courbe projection */}
                <Line type="monotone" dataKey="projection" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="8 4" dot={{ fill: '#8B5CF6', r: 3 }} name="Projection" connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
            
            <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-emerald-500 rounded"></div>
                <span className="text-slate-400">Réalisé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-violet-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6 0, #8B5CF6 8px, transparent 8px, transparent 12px)' }}></div>
                <span className="text-slate-400">Projection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-amber-500 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #F59E0B 0, #F59E0B 5px, transparent 5px, transparent 10px)' }}></div>
                <span className="text-slate-400">Objectif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-4 bg-violet-500/20 rounded"></div>
                <span className="text-slate-400">Intervalle ±15%</span>
              </div>
            </div>
          </div>

          {/* Stats de projection */}
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

      {/* ==================== MISSIONS TAB ==================== */}
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
                  <th className="pb-3 font-medium text-right">{filteredData.isYearView ? 'Marge An.' : 'Marge Trim.'}</th>
                  <th className="pb-3 font-medium text-right">Markup</th>
                  <th className="pb-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.missions.map(m => (
                  <tr key={m.id} className={`border-b border-slate-700/50 hover:bg-slate-700/20 ${m.markup < settings.seuilMarkupAlerte ? 'bg-red-900/10' : ''}`}>
                    <td className="py-3 font-medium">{m.consultant}</td>
                    <td className="py-3 text-slate-300">{m.client}</td>
                    <td className="py-3 text-right font-mono">{m.joursEffectifs}j</td>
                    <td className="py-3 text-right font-mono">{m.margeJour}€</td>
                    <td className="py-3 text-right font-mono text-emerald-400">{m.margeTrimestrielle.toLocaleString()}€</td>
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

      {/* ==================== CLIENTS TAB ==================== */}
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
                  <span className="text-slate-400">{filteredData.isYearView ? 'Marge année' : 'Marge trim.'}</span>
                  <span className="font-mono text-emerald-400">{Math.round(client.marge).toLocaleString()}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{filteredData.isYearView ? 'CA année' : 'CA trim.'}</span>
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

      {/* ==================== ALERTS TAB ==================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {filteredData.alertes.length === 0 ? (
            <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700/50">
              <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Aucune alerte</h3>
              <p className="text-slate-400">Toutes les missions sont au-dessus de {settings.seuilMarkupAlerte}%</p>
            </div>
          ) : (
            <>
              <div className="bg-red-900/20 rounded-2xl p-4 border border-red-500/30">
                <p className="text-red-400 font-medium">{filteredData.alertes.length} mission(s) sous {settings.seuilMarkupAlerte}% de markup</p>
                <p className="text-slate-400 text-sm">Manque à gagner : {filteredData.alertes.reduce((s, m) => s + Math.round((settings.seuilMarkupAlerte - m.markup) / 100 * m.tjmVente * m.joursEffectifs), 0).toLocaleString()}€</p>
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
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-800 text-center text-slate-500 text-xs">
        Solensoft Consulting • {selectedPeriod} • {new Date().toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
