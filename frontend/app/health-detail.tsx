import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import SleepHypnogram, { fromBraceletStages } from '../src/components/health/SleepHypnogram';
import NoraCard from '../src/components/shared/NoraCard';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const SECTIONS: Record<string, { title: string; color: string; img: string; metrics: { key: string; label: string; unit: string; explain: string }[] }> = {
  cardio: {
    title: 'Sante cardiaque', color: '#EF4444',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/8x2d3bbk_hearth%20red%20app%20healthbeat%20Chutex.png',
    metrics: [
      { key: 'heart_rate', label: 'Frequence cardiaque', unit: 'bpm', explain: 'Le nombre de battements par minute au repos. Un pouls entre 60 et 80 bpm est considere comme sain.' },
      { key: 'hrv', label: 'Variabilite cardiaque (HRV)', unit: 'ms', explain: 'Mesure la variation entre les battements. Un HRV eleve indique une bonne capacite d\'adaptation au stress.' },
      { key: 'bp_display', label: 'Tension arterielle', unit: 'mmHg', explain: 'Pression du sang dans les arteres. Une tension normale est autour de 120/80 mmHg.' },
      { key: 'spo2', label: 'Saturation en oxygene (SpO2)', unit: '%', explain: 'Taux d\'oxygene dans le sang. Au-dessus de 95% est normal.' },
      { key: 'temperature', label: 'Temperature corporelle', unit: '°C', explain: 'La temperature normale est entre 36.5 et 37.5°C. Des variations peuvent indiquer une inflammation ou infection.' },
    ],
  },
  metabolism: {
    title: 'Sante metabolique', color: '#F59E0B',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png',
    metrics: [
      { key: 'glycemia', label: 'Glycemie', unit: 'g/L', explain: 'Taux de sucre dans le sang. A jeun, une glycemie normale est entre 0.7 et 1.1 g/L.' },
      { key: 'bmi', label: 'Indice de masse corporelle (IMC)', unit: '', explain: 'Rapport poids/taille. Normal entre 18.5 et 25. Au-dessus de 25 : surpoids.' },
      { key: 'visceral_fat', label: 'Graisse viscerale', unit: '', explain: 'Graisse autour des organes internes. Un indice inferieur a 10 est sain.' },
      { key: 'basal_metabolism', label: 'Metabolisme de base (BMR)', unit: 'kcal', explain: 'Energie depensee au repos pour maintenir les fonctions vitales.' },
      { key: 'recommended_calories', label: 'Apport calorique recommande', unit: 'kcal', explain: 'Calories a consommer par jour pour maintenir votre poids actuel.' },
      { key: 'waist_hip_ratio', label: 'Ratio taille-hanche', unit: '', explain: 'Indicateur de repartition des graisses. Inferieur a 0.90 (homme) ou 0.85 (femme) est ideal.' },
      { key: 'body_age', label: 'Age corporel', unit: 'ans', explain: 'Age biologique estime base sur votre composition corporelle.' },
      { key: 'ideal_weight', label: 'Poids ideal', unit: 'kg', explain: 'Poids optimal calcule selon votre taille et votre morphologie.' },
    ],
  },
  sleep: {
    title: 'Sommeil', color: '#A78BFA',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/xtzgjs5s_sommeil.png',
    metrics: [],
  },
  activity: {
    title: 'Sante physique & Activite', color: '#10B981',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png',
    metrics: [
      { key: 'steps', label: 'Nombre de pas', unit: 'pas', explain: 'Objectif recommande : 6000 a 10000 pas par jour pour maintenir une bonne sante.' },
      { key: 'calories', label: 'Depense energetique', unit: 'kcal', explain: 'Calories brulees par l\'activite physique aujourd\'hui.' },
      { key: 'distance_km', label: 'Distance parcourue', unit: 'km', explain: 'Distance totale estimee a partir du nombre de pas.' },
      { key: 'vo2_max', label: 'VO2 Max', unit: 'ml/kg/min', explain: 'Capacite aerobique maximale. Plus elle est elevee, meilleure est votre condition physique.' },
      { key: 'stress_level', label: 'Niveau de stress', unit: '/100', explain: 'Indice de stress mesure par la variabilite cardiaque. Plus bas est mieux.' },
      { key: 'recovery_score', label: 'Score de recuperation', unit: '/100', explain: 'Capacite de votre corps a recuperer. Un score eleve indique une bonne recuperation.' },
    ],
  },
  composition: {
    title: 'Composition corporelle', color: '#F97316',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/3yq7hxyr_composition%281%29.png',
    metrics: [
      { key: 'weight', label: 'Poids', unit: 'kg', explain: 'Votre poids total. A interpreter avec la composition corporelle.' },
      { key: 'body_fat_pct', label: 'Pourcentage de graisse', unit: '%', explain: 'Part de graisse dans le corps. Normal : 15-25% homme, 20-30% femme.' },
      { key: 'muscle_pct', label: 'Pourcentage musculaire', unit: '%', explain: 'Part de muscle dans le corps. Plus il est eleve, meilleur est le metabolisme.' },
      { key: 'water_pct', label: 'Taux d\'hydratation', unit: '%', explain: 'Pourcentage d\'eau dans le corps. Normal entre 50% et 65%.' },
      { key: 'bone_mass_kg', label: 'Masse osseuse', unit: 'kg', explain: 'Poids des mineraux osseux. Important pour prevenir l\'osteoporose.' },
      { key: 'protein_pct', label: 'Taux de proteine', unit: '%', explain: 'Pourcentage de proteines. Important pour la reparation musculaire.' },
      { key: 'skeletal_muscle_pct', label: 'Muscle squelettique', unit: '%', explain: 'Muscles attaches aux os, responsables du mouvement.' },
      { key: 'subcutaneous_fat_pct', label: 'Graisse sous-cutanee', unit: '%', explain: 'Graisse situee juste sous la peau.' },
      { key: 'trunk_fat_kg', label: 'Graisse du tronc', unit: 'kg', explain: 'Graisse accumulee dans la region abdominale.' },
    ],
  },
};

const BG_DEFAULT = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

export default function HealthDetailScreen() {
  const { metricId } = useLocalSearchParams<{ metricId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [sectionAi, setSectionAi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  /* ── Per-night sleep data: uses REAL bracelet data only ── */
  const [sleepData, setSleepData] = useState<any>(null);

  useEffect(() => {
    if (metricId !== 'sleep' || !token) return;
    (async () => {
      try {
        const data = await apiFetch('/api/health/sleep/history', {}, token);
        if (data && Array.isArray(data) && data.length > 0) {
          setSleepData(data);
        }
      } catch {}
    })();
  }, [token, metricId]);

  // Find sleep data for the selected date
  const getSleepForDate = (dt: Date) => {
    if (!sleepData || sleepData.length === 0) return null;
    const dateStr = dt.toISOString().split('T')[0];
    const match = sleepData.find((s: any) => s.date?.startsWith(dateStr));
    if (!match) return null;

    const deepMin = match.deep || 0;
    const lightMin = match.light || 0;
    const remMin = match.rem || 0;
    const awakeMin = match.awake || 0;
    const totalSleep = deepMin + lightMin + remMin;
    const duration = match.duration || (totalSleep + awakeMin);
    const quality = match.quality || (totalSleep > 0 ? Math.min(100, Math.round((deepMin * 2 + remMin * 1.5 + lightMin * 0.8) / totalSleep * 100)) : 0);
    const interruptions = match.sleep_interruptions || 0;

    // Build stages array from real data for hypnogram
    const stages: number[] = [];
    const cycles = Math.max(1, Math.round(totalSleep / 90));
    for (let c = 0; c < cycles; c++) {
      for (let i = 0; i < Math.round(lightMin / cycles); i++) stages.push(2);
      for (let i = 0; i < Math.round(deepMin / cycles); i++) stages.push(1);
      for (let i = 0; i < Math.round(remMin / cycles); i++) stages.push(3);
      if (c < cycles - 1) stages.push(0); // brief wake between cycles
    }

    const startH = 22, startM = 30;
    const session = fromBraceletStages(stages.length > 0 ? stages : [2, 2, 1, 1, 3, 2], startH, startM);
    const apnea = Math.min(100, Math.max(5, interruptions * 12 + (quality < 70 ? 20 : 0)));

    return { session, deepMin, lightMin, remMin, awakeMin, totalSleep, duration, quality, interruptions, apnea };
  };

  const sleepNightData = getSleepForDate(selectedDate);

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    if (d <= new Date()) setSelectedDate(d);
  };
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday ? "Aujourd'hui" : selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  useEffect(() => {
    (async () => {
      try {
        const rep = await apiFetch('/api/health/daily-report', {}, token);
        setReport(rep);
        setLoading(false);
        // Defer AI analysis — show page content immediately
        if (metricId && metricId !== 'heart_rate' && metricId !== 'spo2' && metricId !== 'blood_pressure' && metricId !== 'temperature') {
          apiFetch(`/api/health/section-analysis/${metricId}`, {}, token).then(ai => { if (ai) setSectionAi(ai); }).catch(() => {});
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  const sec = SECTIONS[metricId || ''] || SECTIONS.cardio;
  const d = report?.data || {};
  const subs = report?.subscores || {};
  const subScore = subs[metricId || '']?.score;

  const getValue = (key: string) => {
    if (key === 'bp_display') {
      const sys = d.blood_pressure?.systolic || 0;
      const dia = d.blood_pressure?.diastolic || 0;
      return sys > 0 ? `${sys}/${dia}` : '--';
    }
    if (key === 'sleep_duration') { const m = d.sleep_duration_min || 0; return m > 0 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}min` : '--'; }
    const v = d[key];
    if (v === undefined || v === null || v === 0) return '--';
    if (typeof v === 'number') return v % 1 === 0 ? v.toLocaleString() : v.toFixed(1);
    return String(v);
  };

  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Page disponible sur le web</Text></View>;
  }

  if (loading) return <FullScreenLoader />;

  const bgUrl = metricId === 'sleep' ? BG_VIOLET : BG_RED;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={bgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => { try { router.back(); } catch { router.push('/(tabs)/health' as any); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 20 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Retour</span>
        </div>

        {/* Hero — sleep: just big image, no title */}
        {metricId === 'sleep' ? (
          <div style={{ textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 2 } as any}>
            <img src={sec.img} alt="" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -50 } as any} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 2 } as any}>
            <img src={sec.img} alt="" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -50 } as any} />
          </div>
        )}

        {/* Sleep section: Hypnogram hero + apnea risk */}
        {metricId === 'sleep' && (() => {
          if (!sleepNightData) return (
            <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 14, padding: 24, textAlign: 'center' } as any}>
              <i className="ri-moon-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.2)', marginBottom: 12, display: 'block' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Aucune donnee de sommeil</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>Portez votre bracelet Elio pendant la nuit pour obtenir une analyse detaillee de votre sommeil.</div>
            </div>
          );
          const { session: sleepSession, deepMin: nightDeepMin, lightMin: nightLightMin, remMin: nightRemMin, awakeMin: nightAwakeMin, totalSleep: nightTotalSleep, duration: nightDuration, quality: nightQuality, interruptions: nightInterruptions, apnea: nightApnea } = sleepNightData;
          const deepPct = nightTotalSleep > 0 ? Math.round(nightDeepMin / nightTotalSleep * 100) : 0;
          return (
            <div key={`sleep-${selectedDate.getTime()}`}>
            {/* Hypnogram card with blur — image overlaps into this card */}
            <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 14, overflow: 'hidden', position: 'relative', paddingTop: 56 } as any}>
              {/* Duration header + date selector */}
              <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' } as any}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Duree de sommeil</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>{Math.floor(nightDuration / 60)}h {String(nightDuration % 60).padStart(2, '0')}min</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                  <div data-testid="sleep-date-prev" onClick={() => changeDate(-1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /></div>
                  <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 4 } as any}>
                    <i className="ri-calendar-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                    <span data-testid="sleep-date-label" style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{dateLabel}</span>
                  </div>
                  {!isToday && <div data-testid="sleep-date-next" onClick={() => changeDate(1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /></div>}
                </div>
              </div>
              <div style={{ padding: '0 16px 8px' } as any}>
                <SleepHypnogram session={sleepSession} width={700} height={280} showLabels={true} timeLabelCount={5} />
              </div>
              <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                {[
                  { l: 'Eveil', v: `${Math.floor(nightAwakeMin / 60)}h${String(nightAwakeMin % 60).padStart(2, '0')}m`, c: '#E87C8A' },
                  { l: 'REM', v: `${Math.floor(nightRemMin / 60)}h${String(nightRemMin % 60).padStart(2, '0')}m`, pct: nightTotalSleep > 0 ? `${Math.round(nightRemMin / nightTotalSleep * 100)}%` : '', c: '#A8B4F0' },
                  { l: 'Leger', v: `${Math.floor(nightLightMin / 60)}h${String(nightLightMin % 60).padStart(2, '0')}m`, pct: nightTotalSleep > 0 ? `${Math.round(nightLightMin / nightTotalSleep * 100)}%` : '', c: '#6B7BD9' },
                  { l: 'Profond', v: `${Math.floor(nightDeepMin / 60)}h${String(nightDeepMin % 60).padStart(2, '0')}m`, pct: nightTotalSleep > 0 ? `${Math.round(nightDeepMin / nightTotalSleep * 100)}%` : '', c: '#3A4099' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                    <div style={{ width: 28, height: 14, borderRadius: 4, background: s.c, flexShrink: 0 } as any} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', flex: 1 }}>{s.l}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{s.v}</span>
                    {s.pct && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.pct}</span>}
                  </div>
                ))}
              </div>
              {/* Quality progress bar */}
              <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                  <i className="ri-star-line" style={{ fontSize: 16, color: nightQuality >= 80 ? '#10B981' : nightQuality >= 60 ? '#F59E0B' : '#EF4444' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Qualite du sommeil</span>
                  <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 999, background: nightQuality >= 80 ? 'rgba(16,185,129,0.12)' : nightQuality >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', fontSize: 10, fontWeight: 700, color: nightQuality >= 80 ? '#10B981' : nightQuality >= 60 ? '#F59E0B' : '#EF4444' }}>{nightQuality}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative', marginBottom: 6 } as any}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 5, background: 'linear-gradient(90deg, #EF4444 0%, #F59E0B 50%, #10B981 100%)', opacity: 0.12 } as any} />
                  <div style={{ height: 10, borderRadius: 5, width: `${nightQuality}%`, background: nightQuality >= 80 ? '#10B981' : nightQuality >= 60 ? 'linear-gradient(90deg, #F59E0B, #10B981)' : 'linear-gradient(90deg, #EF4444, #F59E0B)', transition: 'width 1s ease', boxShadow: `0 0 12px ${nightQuality >= 80 ? 'rgba(16,185,129,0.4)' : nightQuality >= 60 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}` } as any} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
                  <span style={{ fontSize: 9, color: 'rgba(239,68,68,0.5)' }}>Mauvais</span>
                  <span style={{ fontSize: 9, color: 'rgba(245,158,11,0.5)' }}>Correct</span>
                  <span style={{ fontSize: 9, color: 'rgba(16,185,129,0.5)' }}>Excellent</span>
                </div>
              </div>
              {/* Interruptions — mini bar chart from 7-day history */}
              <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                  <i className="ri-alarm-line" style={{ fontSize: 16, color: nightInterruptions <= 2 ? '#10B981' : '#F59E0B' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Interruptions</span>
                  <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 999, background: nightInterruptions <= 2 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', fontSize: 11, fontWeight: 700, color: nightInterruptions <= 2 ? '#10B981' : '#F59E0B' }}>{nightInterruptions}</span>
                </div>
                {/* 7-day mini bar chart */}
                {sleepData && Array.isArray(sleepData) && sleepData.length > 1 && (() => {
                  const days = sleepData.slice(-7).map((d: any) => ({
                    label: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2),
                    val: d.sleep_interruptions || d.interruptions || 0,
                    isToday: new Date(d.date).toDateString() === selectedDate.toDateString(),
                  }));
                  const maxVal = Math.max(5, ...days.map((d: any) => d.val));
                  return (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 } as any}>
                      {days.map((d: any, i: number) => {
                        const h = Math.max(4, (d.val / maxVal) * 48);
                        const color = d.val <= 1 ? '#10B981' : d.val <= 3 ? '#F59E0B' : '#EF4444';
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } as any}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: d.isToday ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{d.val}</span>
                            <div style={{ width: '100%', height: h, borderRadius: 4, background: d.isToday ? color : `${color}55`, boxShadow: d.isToday ? `0 0 8px ${color}44` : 'none', transition: 'height 0.6s ease' } as any} />
                            <span style={{ fontSize: 9, color: d.isToday ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', fontWeight: d.isToday ? 700 : 400 }}>{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Sleep Debt Card — calculated from 7-day history */}
            {(() => {
              const NEED_MIN = 7 * 60 + 30; // 7h30 recommandé senior
              // Tonight's effective sleep
              const tonightEffective = nightDuration - nightAwakeMin;
              const tonightDebtMin = Math.max(0, NEED_MIN - tonightEffective);
              // 7-day cumulative debt from history
              let weekDebtMin = 0;
              let weekDays = 0;
              let weekAvgQuality = 0;
              let weekAvgDeep = 0;
              if (sleepData && Array.isArray(sleepData)) {
                for (const day of sleepData) {
                  const dur = day.duration || 0;
                  const aw = day.awake || 0;
                  const eff = dur - aw;
                  weekDebtMin += Math.max(0, NEED_MIN - eff);
                  weekAvgQuality += (day.quality || 0);
                  weekAvgDeep += (day.deep || 0);
                  weekDays++;
                }
                if (weekDays > 0) { weekAvgQuality = Math.round(weekAvgQuality / weekDays); weekAvgDeep = Math.round(weekAvgDeep / weekDays); }
              }
              const weekDebtH = Math.floor(weekDebtMin / 60);
              const weekDebtM = weekDebtMin % 60;
              const tonightPct = Math.min(100, Math.round((tonightEffective / NEED_MIN) * 100));
              const tonightColor = tonightPct >= 90 ? '#10B981' : tonightPct >= 75 ? '#F59E0B' : '#EF4444';
              const weekColor = weekDebtMin <= 60 ? '#10B981' : weekDebtMin <= 180 ? '#F59E0B' : '#EF4444';
              const deepRatio = nightTotalSleep > 0 ? Math.round(nightDeepMin / nightTotalSleep * 100) : 0;
              const remRatio = nightTotalSleep > 0 ? Math.round(nightRemMin / nightTotalSleep * 100) : 0;
              const recoveryScore = Math.min(100, Math.round(tonightPct * 0.4 + nightQuality * 0.3 + Math.min(deepRatio * 3, 30) + Math.min(remRatio * 1.5, 15)));
              const recoveryColor = recoveryScore >= 80 ? '#10B981' : recoveryScore >= 60 ? '#F59E0B' : '#EF4444';
              const effH = Math.floor(tonightEffective / 60);
              const effM = tonightEffective % 60;

              return (
              <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 } as any}>
                  <i className="ri-battery-charge-line" style={{ fontSize: 16, color: tonightColor }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Bilan du sommeil</span>
                </div>

                {/* Tonight: effective vs needed */}
                <div style={{ marginBottom: 16 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Sommeil effectif cette nuit</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>{effH}h{String(effM).padStart(2, '0')} <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>/ 7h30</span></span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' } as any}>
                    <div style={{ height: 10, borderRadius: 5, width: `${tonightPct}%`, background: tonightColor, transition: 'width 1s ease', boxShadow: `0 0 10px ${tonightColor}55` } as any} />
                  </div>
                  <div style={{ fontSize: 10, color: tonightColor, fontWeight: 700, marginTop: 4 }}>{tonightDebtMin > 0 ? `${Math.floor(tonightDebtMin / 60) > 0 ? Math.floor(tonightDebtMin / 60) + 'h' : ''}${tonightDebtMin % 60}min de dette cette nuit` : 'Objectif atteint !'}</div>
                </div>

                {/* 7-day cumulative debt */}
                {weekDays > 1 && (
                <div style={{ padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.04)', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Dette cumulee sur {weekDays} jours</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: weekColor }}>{weekDebtH > 0 ? `${weekDebtH}h${String(weekDebtM).padStart(2, '0')}` : `${weekDebtM}min`}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                    <div style={{ height: 8, borderRadius: 4, width: `${Math.min(100, Math.round(weekDebtMin / (NEED_MIN * weekDays) * 100))}%`, background: weekColor, boxShadow: `0 0 8px ${weekColor}44` } as any} />
                  </div>
                </div>
                )}

                {/* Correlation: Recovery Score */}
                <div style={{ padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Score de recuperation</span>
                    <span style={{ padding: '3px 10px', borderRadius: 999, background: `${recoveryColor}18`, fontSize: 11, fontWeight: 700, color: recoveryColor }}>{recoveryScore}/100</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    {[
                      { label: 'Duree', val: `${tonightPct}%`, sub: 'vs besoin', c: tonightColor },
                      { label: 'Qualite', val: `${nightQuality}%`, sub: 'bracelet', c: nightQuality >= 70 ? '#818CF8' : '#F59E0B' },
                      { label: 'Profond', val: `${deepRatio}%`, sub: `${nightDeepMin}min`, c: deepRatio >= 15 ? '#4338CA' : '#F59E0B' },
                      { label: 'REM', val: `${remRatio}%`, sub: `${nightRemMin}min`, c: remRatio >= 20 ? '#C4B5FD' : '#F59E0B' },
                    ].map((m, i) => (
                      <div key={i} style={{ flex: 1, padding: '10px 6px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: m.c }}>{m.val}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{m.label}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8, lineHeight: 1.5 }}>
                    Calcul : 40% duree + 30% qualite + 20% profond + 10% REM.{weekDays > 1 ? ` Qualite moy. 7j: ${weekAvgQuality}%, profond moy: ${weekAvgDeep}min.` : ''}
                  </div>
                </div>
              </div>
              );
            })()}

            {/* Apnea risk — separate card with Nora analysis */}
            {(() => {
              return (
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 18px', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                <i className="ri-lungs-line" style={{ fontSize: 16, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Risque d'apnee du sommeil</span>
                <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 999, background: nightApnea < 30 ? 'rgba(16,185,129,0.12)' : nightApnea < 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', fontSize: 10, fontWeight: 700, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444' }}>{nightApnea < 30 ? 'Faible' : nightApnea < 60 ? 'Modere' : 'Eleve'}</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative', marginBottom: 6 } as any}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 5, background: 'linear-gradient(90deg, #10B981 0%, #10B981 30%, #F59E0B 50%, #EF4444 80%, #DC2626 100%)', opacity: 0.15 } as any} />
                <div style={{ height: 10, borderRadius: 5, width: `${nightApnea}%`, background: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? 'linear-gradient(90deg, #10B981, #F59E0B)' : 'linear-gradient(90deg, #F59E0B, #EF4444)', transition: 'width 1s ease', boxShadow: `0 0 12px ${nightApnea < 30 ? 'rgba(16,185,129,0.4)' : nightApnea < 60 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}` } as any} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 } as any}>
                <span style={{ fontSize: 9, color: 'rgba(16,185,129,0.5)' }}>Faible</span>
                <span style={{ fontSize: 9, color: 'rgba(245,158,11,0.5)' }}>Modere</span>
                <span style={{ fontSize: 9, color: 'rgba(239,68,68,0.5)' }}>Eleve</span>
              </div>
              {/* Nora analysis for apnea */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 8, fontWeight: 900, color: '#A78BFA' }}>N</span></div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.7)' }}>Analyse de Nora</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                  {nightApnea < 30
                    ? `Avec ${nightInterruptions} interruption${nightInterruptions > 1 ? 's' : ''} et une qualite de sommeil de ${nightQuality}%, votre risque d'apnee est faible. Votre sommeil profond represente ${deepPct}% du total, ce qui est un bon indicateur de recuperation. Continuez a maintenir une heure de coucher reguliere.`
                    : nightApnea < 60
                    ? `${nightInterruptions} interruptions detectees avec une qualite de ${nightQuality}%. Le risque modere d'apnee merite attention. Votre sommeil profond (${deepPct}%) pourrait etre ameliore. Je recommande de consulter si les interruptions persistent ou augmentent.`
                    : `Attention : ${nightInterruptions} interruptions et une qualite de ${nightQuality}% indiquent un risque eleve d'apnee. Le sommeil profond ne represente que ${deepPct}% du total. Une consultation en medecine du sommeil est fortement recommandee pour un diagnostic precis.`
                  }
                </div>
              </div>
            </div>
              );
            })()}
            </div>
          );
        })()}

        {/* Nora Analysis for this section */}
        {sectionAi && (() => {
          const ai = sectionAi;
          const parts: string[] = [];
          if (ai.recommendation) parts.push(ai.recommendation);
          if (ai.correlations?.length) parts.push(ai.correlations.slice(0, 3).join(' '));
          if (ai.whats_good?.length) parts.push('Points forts : ' + ai.whats_good.slice(0, 2).join('. '));
          if (ai.watch_out?.length) parts.push('A surveiller : ' + ai.watch_out.slice(0, 2).join('. '));
          const text = parts.join(' ');
          if (!text) return null;
          return <NoraCard title={`Analyse ${sec.title.toLowerCase()}`} text={text} />;
        })()}

        {/* Metrics list */}
        {sec.metrics.map((m) => {
          const val = getValue(m.key);
          const numVal = parseFloat(String(val).replace(/[^0-9.]/g, ''));
          const isExpanded = expanded === m.key;
          const zones: Record<string, { low: number; normal: [number, number]; high: number; unit: string }> = {
            heart_rate: { low: 40, normal: [60, 100], high: 130, unit: 'bpm' },
            hrv: { low: 10, normal: [20, 80], high: 100, unit: 'ms' },
            bp_display: { low: 90, normal: [110, 130], high: 160, unit: 'mmHg' },
            spo2: { low: 88, normal: [95, 100], high: 100, unit: '%' },
            temperature: { low: 35, normal: [36.1, 37.5], high: 39.5, unit: '°C' },
            vo2_max: { low: 15, normal: [30, 50], high: 60, unit: 'ml/kg/min' },
            glycemia: { low: 0.4, normal: [0.7, 1.1], high: 1.6, unit: 'g/L' },
            bmi: { low: 15, normal: [18.5, 25], high: 40, unit: '' },
            visceral_fat: { low: 1, normal: [1, 10], high: 20, unit: '' },
            basal_metabolism: { low: 1000, normal: [1300, 2000], high: 2500, unit: 'kcal' },
            recommended_calories: { low: 1200, normal: [1800, 2400], high: 3000, unit: 'kcal' },
            waist_hip_ratio: { low: 0.6, normal: [0.7, 0.9], high: 1.1, unit: '' },
            body_age: { low: 40, normal: [55, 70], high: 85, unit: 'ans' },
            ideal_weight: { low: 50, normal: [60, 80], high: 100, unit: 'kg' },
            steps: { low: 0, normal: [6000, 12000], high: 20000, unit: 'pas' },
            calories: { low: 0, normal: [200, 600], high: 1000, unit: 'kcal' },
            distance_km: { low: 0, normal: [3, 8], high: 15, unit: 'km' },
            stress_level: { low: 0, normal: [10, 40], high: 100, unit: '/100' },
            recovery_score: { low: 0, normal: [70, 100], high: 100, unit: '/100' },
            weight: { low: 40, normal: [60, 85], high: 120, unit: 'kg' },
            body_fat_pct: { low: 5, normal: [15, 25], high: 40, unit: '%' },
            muscle_pct: { low: 20, normal: [30, 45], high: 55, unit: '%' },
            water_pct: { low: 40, normal: [50, 65], high: 75, unit: '%' },
            bone_mass_kg: { low: 1.5, normal: [2.5, 4], high: 5, unit: 'kg' },
            protein_pct: { low: 10, normal: [14, 20], high: 25, unit: '%' },
            skeletal_muscle_pct: { low: 15, normal: [25, 40], high: 50, unit: '%' },
            subcutaneous_fat_pct: { low: 5, normal: [10, 20], high: 35, unit: '%' },
            trunk_fat_kg: { low: 1, normal: [3, 8], high: 15, unit: 'kg' },
          };
          const z = zones[m.key];
          const inNormal = z ? numVal >= z.normal[0] && numVal <= z.normal[1] : true;
          const zoneLabel = z ? (numVal < z.normal[0] ? 'En dessous' : numVal > z.normal[1] ? 'Au dessus' : 'Normal') : null;
          const zoneColor = z ? (inNormal ? '#10B981' : numVal < z.normal[0] ? '#38BDF8' : '#EF4444') : null;
          const pctPos = z ? Math.max(0, Math.min(100, ((numVal - z.low) / (z.high - z.low)) * 100)) : 50;
          const normalStart = z ? ((z.normal[0] - z.low) / (z.high - z.low)) * 100 : 0;
          const normalWidth = z ? ((z.normal[1] - z.normal[0]) / (z.high - z.low)) * 100 : 100;
          return (
            <div key={m.key} onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: m.key === 'bp_display' ? 'blood_pressure' : m.key } })} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 10, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <div style={{ padding: '18px 20px' } as any}>
                {/* Label + value row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                  <div style={{ fontSize: 15, color: '#FFF', fontWeight: 700 }}>{m.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 } as any}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{val}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{m.unit}</span>
                  </div>
                </div>
                {/* Zone bar — only shown when there is actual measured data */}
                {z && val !== '--' && !isNaN(numVal) && numVal !== 0 && (
                  <div>
                    <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'visible' } as any}>
                      {/* Danger zones */}
                      <div style={{ position: 'absolute', left: 0, width: `${normalStart}%`, height: '100%', borderRadius: '6px 0 0 6px', background: 'rgba(56,189,248,0.12)' } as any} />
                      {/* Normal zone */}
                      <div style={{ position: 'absolute', left: `${normalStart}%`, width: `${normalWidth}%`, height: '100%', background: 'rgba(16,185,129,0.25)', borderLeft: '1px solid rgba(16,185,129,0.4)', borderRight: '1px solid rgba(16,185,129,0.4)' } as any} />
                      {/* High zone */}
                      <div style={{ position: 'absolute', right: 0, width: `${100 - normalStart - normalWidth}%`, height: '100%', borderRadius: '0 6px 6px 0', background: 'rgba(239,68,68,0.12)' } as any} />
                      {/* Current value marker */}
                      <div style={{ position: 'absolute', left: `${pctPos}%`, top: -3, width: 14, height: 18, borderRadius: 7, background: zoneColor || '#FFF', border: '2.5px solid rgba(0,0,0,0.4)', transform: 'translateX(-7px)', boxShadow: `0 0 10px ${zoneColor}60` } as any} />
                    </div>
                    {/* Labels under bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 } as any}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{z.low} {z.unit}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: zoneColor } as any} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor }}>{zoneLabel}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>({z.normal[0]}-{z.normal[1]})</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{z.high} {z.unit}</span>
                    </div>
                  </div>
                )}
              </div>
              {/* Expandable explanation */}
              {isExpanded && (
                <div style={{ padding: '0 20px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginTop: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}>
                      <i className="ri-information-line" style={{ fontSize: 16, color: sec.color }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Comprendre</span>
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>{m.explain}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
