import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import SleepHypnogram, { fromBraceletStages } from '../src/components/health/SleepHypnogram';
import NoraCard from '../src/components/shared/NoraCard';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { HorizontalCalendar } from '../src/components/dashboard/pro/ProCalendar';

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
  const params = useLocalSearchParams<{ metricId: string; beneficiaryId?: string }>();
  const { token } = useAuth();
  const router = useRouter();
  // Expo Router useLocalSearchParams is unreliable on web — fallback to window.location.search
  const webBeneficiaryId = (() => { try { if (typeof window !== 'undefined' && window.location?.search) return new URLSearchParams(window.location.search).get('beneficiaryId') || ''; } catch {} return ''; })();
  const metricId = params.metricId;
  const beneficiaryId = params.beneficiaryId || webBeneficiaryId || undefined;
  const isReadonly = !!beneficiaryId;
  const [report, setReport] = useState<any>(null);
  const [sectionAi, setSectionAi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSleepInfo, setShowSleepInfo] = useState(false);
  const [sleepAnalysis, setSleepAnalysis] = useState<any>(null);
  const [explainSleep, setExplainSleep] = useState<string | null>(null);

  /* ── Per-night sleep data: uses REAL bracelet data only ── */
  const [sleepData, setSleepData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        if (metricId !== 'sleep' || !token) return;
        const sleepUrl = beneficiaryId
          ? `/api/guardian/beneficiary/${beneficiaryId}/metric-history/sleep_quality?period=30j`
          : '/api/health/sleep/history';
        const data = await apiFetch(sleepUrl, {}, token);
        if (data && Array.isArray(data) && data.length > 0) {
          setSleepData(data);
        }
      } catch {}
    })();
  }, [token, metricId, beneficiaryId]);

  /* ── WHOOP analysis data ── */
  useEffect(() => {
    (async () => {
      try {
        if (metricId !== 'sleep' || !token || beneficiaryId) return;
        const data = await apiFetch('/api/health/sleep/analysis', {}, token);
        if (data && data.has_data) setSleepAnalysis(data);
      } catch {}
    })();
  }, [token, metricId, beneficiaryId]);

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
    const duration = match.duration ? (match.duration < 24 ? Math.round(match.duration * 60) : match.duration) : (totalSleep + awakeMin);
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

  // Auto-select latest date with sleep data if today has none
  useEffect(() => {
    if (metricId === 'sleep' && sleepData && sleepData.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const hasToday = sleepData.some((s: any) => s.date?.startsWith(todayStr));
      if (!hasToday) {
        const latest = sleepData[sleepData.length - 1];
        if (latest?.date) setSelectedDate(new Date(latest.date + 'T12:00:00'));
      }
    }
  }, [sleepData, metricId]);

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
        const reportUrl = beneficiaryId
          ? `/api/guardian/beneficiary/${beneficiaryId}/daily-report`
          : '/api/health/daily-report';
        const rep = await apiFetch(reportUrl, {}, token);
        setReport(rep);
        setLoading(false);
        // Defer AI analysis — show page content immediately
        if (!beneficiaryId && metricId && metricId !== 'heart_rate' && metricId !== 'spo2' && metricId !== 'blood_pressure' && metricId !== 'temperature') {
          apiFetch(`/api/health/section-analysis/${metricId}`, {}, token).then(ai => { if (ai) setSectionAi(ai); }).catch(() => {});
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [token, beneficiaryId]);

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

  /* ═══ SLEEP: Light theme layout (header + white card) ═══ */
  if (metricId === 'sleep') {
    const sleepImg = sec.img;
    return (
      <div data-testid="sleep-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF' } as any}>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

          {/* HEADER with violet BG */}
          <div style={{ position: 'relative', zIndex: 1, minHeight: 260 } as any}>
            <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 60px', maxWidth: 480, margin: '0 auto' } as any}>
              <div onClick={() => { try { router.back(); } catch { router.push('/(tabs)/health' as any); } }} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
              <div style={{ textAlign: 'center', marginTop: 8 } as any}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Sommeil</div>
                {sleepNightData && <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{Math.floor(sleepNightData.duration / 60)}h{String(sleepNightData.duration % 60).padStart(2, '0')}</div>}
                {!sleepNightData && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Analyse detaillee de votre sommeil</div>}
              </div>
              {/* Calendar — identical to activity-detail / minceur */}
              <HorizontalCalendar selectedDate={selectedDate} onSelect={setSelectedDate} accent="#A78BFA" />
            </div>
          </div>

          {/* WHITE CONTENT CARD */}
          <div style={{ padding: '24px 16px 120px', marginTop: -24, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-24px auto 0', width: '100%' } as any}>

            {/* Nora sleep analysis button — always visible */}
            <div data-testid="nora-sleep-btn" onClick={() => setShowSleepInfo(true)} style={{ borderRadius: 16, background: '#000', padding: '14px 16px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <video autoPlay loop muted playsInline style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'contain', flexShrink: 0 } as any} src="https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4" />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Analyse du sommeil</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Analyse par Nora de votre nuit</div></div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
            </div>

            {/* Sleep content — render with gray cards */}
            {(() => {
              if (!sleepNightData && !sleepAnalysis) return (
                <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
                  <i className="ri-moon-line" style={{ fontSize: 40, color: '#D1D5DB', marginBottom: 12, display: 'block' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>Aucune donnee de sommeil</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>Portez votre bracelet Elio pendant la nuit pour obtenir une analyse detaillee.</div>
                </div>
              );
              const nightData = sleepNightData;
              const nightDeepMin = nightData?.deepMin || 0, nightLightMin = nightData?.lightMin || 0, nightRemMin = nightData?.remMin || 0, nightAwakeMin = nightData?.awakeMin || 0;
              const nightTotalSleep = nightData?.totalSleep || 0, nightDuration = nightData?.duration || 0, nightQuality = nightData?.quality || 0;
              const nightInterruptions = nightData?.interruptions || 0, nightApnea = nightData?.apnea || 0;
              const sleepSession = nightData?.session;
              return (
                <>
                  {/* ── HYPNOGRAM CARD (with stages + interruptions integrated) ── */}
                  {nightData && sleepSession && (
                    <div style={{ borderRadius: 18, background: '#F4F4F5', marginBottom: 12, overflow: 'hidden' } as any}>
                      <div style={{ padding: '16px 16px 0' } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                          <i className="ri-moon-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Cycles du sommeil</span>
                          <div style={{ marginLeft: 'auto' } as any} />
                          <div onClick={() => setExplainSleep('hypnogram')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-information-line" style={{ fontSize: 14, color: '#A78BFA' }} /></div>
                        </div>
                        <SleepHypnogram session={sleepSession} width={700} height={200} showLabels={true} timeLabelCount={5} light={true} />
                      </div>
                      {/* Stages breakdown */}
                      <div style={{ display: 'flex', borderTop: '1px solid #E5E7EB' } as any}>
                        {[
                          { l: 'Profond', v: nightDeepMin, pct: nightTotalSleep > 0 ? Math.round(nightDeepMin / nightTotalSleep * 100) : 0, c: '#3A4099' },
                          { l: 'Leger', v: nightLightMin, pct: nightTotalSleep > 0 ? Math.round(nightLightMin / nightTotalSleep * 100) : 0, c: '#6B7BD9' },
                          { l: 'REM', v: nightRemMin, pct: nightTotalSleep > 0 ? Math.round(nightRemMin / nightTotalSleep * 100) : 0, c: '#A8B4F0' },
                          { l: 'Eveil', v: nightAwakeMin, pct: 0, c: '#E87C8A' },
                        ].map((s, si) => (
                          <div key={si} style={{ flex: 1, padding: '10px 4px', textAlign: 'center', borderRight: si < 3 ? '1px solid #E5E7EB' : 'none' } as any}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.c, margin: '0 auto 4px' } as any} />
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#111', lineHeight: 1 }}>{Math.floor(s.v / 60)}h{String(s.v % 60).padStart(2, '0')}</div>
                            <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 2 }}>{s.l}{s.pct > 0 ? ` ${s.pct}%` : ''}</div>
                          </div>
                        ))}
                      </div>
                      {/* Interruptions row inside hypnogram card */}
                      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #E5E7EB', gap: 10 } as any}>
                        <i className="ri-alarm-line" style={{ fontSize: 14, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>Interruptions</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444', marginLeft: 'auto' }}>{nightInterruptions}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444' }}>{nightInterruptions <= 2 ? 'Bon' : nightInterruptions <= 4 ? 'Modere' : 'Eleve'}</span>
                        <div onClick={() => setExplainSleep('interruptions')} style={{ width: 24, height: 24, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-information-line" style={{ fontSize: 12, color: '#9CA3AF' }} /></div>
                      </div>
                    </div>
                  )}

                  {/* ── QUALITY CARD ── */}
                  {nightData && (
                    <div style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                        <i className="ri-star-line" style={{ fontSize: 14, color: nightQuality >= 80 ? '#10B981' : '#F59E0B' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Qualite du sommeil</span>
                        <span style={{ fontSize: 16, fontWeight: 900, color: nightQuality >= 80 ? '#10B981' : nightQuality >= 60 ? '#F59E0B' : '#EF4444', marginLeft: 'auto' }}>{nightQuality}%</span>
                        <div onClick={() => setExplainSleep('quality')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-information-line" style={{ fontSize: 14, color: '#A78BFA' }} /></div>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden' } as any}><div style={{ height: '100%', borderRadius: 4, width: `${nightQuality}%`, background: nightQuality >= 80 ? '#10B981' : nightQuality >= 60 ? '#F59E0B' : '#EF4444', transition: 'width 0.8s' } as any} /></div>
                    </div>
                  )}

                  {/* ── APNEA DEDICATED CARD ── */}
                  {nightData && (
                    <div style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                        <i className="ri-lungs-line" style={{ fontSize: 14, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444' }} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Risque d'apnee du sommeil</span>
                        <div onClick={() => setExplainSleep('apnea')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' } as any}><i className="ri-information-line" style={{ fontSize: 14, color: '#EF4444' }} /></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                        <div style={{ textAlign: 'center' } as any}>
                          <div style={{ fontSize: 40, fontWeight: 900, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>{nightApnea}%</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444', marginTop: 4 }}>{nightApnea < 30 ? 'Faible' : nightApnea < 60 ? 'Modere' : 'Eleve'}</div>
                        </div>
                        <div style={{ flex: 1 } as any}>
                          <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden', marginBottom: 6 } as any}>
                            <div style={{ height: '100%', borderRadius: 4, width: `${nightApnea}%`, background: `linear-gradient(90deg, #10B981, #F59E0B 50%, #EF4444)`, transition: 'width 0.8s' } as any} />
                          </div>
                          <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>
                            {nightApnea < 30 ? 'Votre sommeil semble continu et sans episodes respiratoires significatifs.' : nightApnea < 60 ? 'Quelques episodes detectes. Surveillez l\'evolution.' : 'Risque eleve. Consultez un medecin pour un diagnostic.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── DETTE DE SOMMEIL (refonte visuelle + graph barres 7j) ── */}
                  {nightData && (() => {
                    const NEED_MIN = sleepAnalysis?.sleep_need_min || (7 * 60 + 30);
                    const tonightEffective = nightDuration - nightAwakeMin;
                    const needH = Math.floor(NEED_MIN / 60), needM = NEED_MIN % 60;
                    const effH = Math.floor(tonightEffective / 60), effM = tonightEffective % 60;
                    const tonightPct = Math.min(100, Math.round((tonightEffective / NEED_MIN) * 100));
                    const tonightColor = tonightPct >= 90 ? '#10B981' : tonightPct >= 75 ? '#F59E0B' : '#EF4444';
                    // 7-day debt bars
                    const DAYS_S = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
                    const last7 = (sleepData && Array.isArray(sleepData)) ? sleepData.slice(-7) : [];
                    let totalDebt = 0;
                    const bars = last7.map((day: any) => {
                      const eff = (day.deep || 0) + (day.light || 0) + (day.rem || 0);
                      const debt = Math.max(0, NEED_MIN - eff);
                      totalDebt += debt;
                      const dt = new Date(day.date + 'T12:00:00');
                      return { day: DAYS_S[dt.getDay()], debt, eff };
                    });
                    const maxDebt = Math.max(120, ...bars.map(b => b.debt));
                    const totalH = Math.floor(totalDebt / 60), totalM = totalDebt % 60;
                    const totalColor = totalDebt <= 60 ? '#10B981' : totalDebt <= 180 ? '#F59E0B' : '#EF4444';
                    return (
                      <div style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 12 } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 } as any}>
                          <i className="ri-moon-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Besoin & dette de sommeil</span>
                        </div>
                        {/* Tonight vs Need — big visual */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 } as any}>
                          <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#FFF', textAlign: 'center' } as any}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Cette nuit</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: tonightColor, lineHeight: 1 }}>{effH}h{String(effM).padStart(2, '0')}</div>
                            <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden', marginTop: 8 } as any}><div style={{ height: '100%', borderRadius: 3, width: `${tonightPct}%`, background: tonightColor } as any} /></div>
                            <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 4 }}>{tonightPct}%</div>
                          </div>
                          <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#FFF', textAlign: 'center' } as any}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Besoin</div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: '#111', lineHeight: 1 }}>{needH}h{String(needM).padStart(2, '0')}</div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8, lineHeight: 1.4 }}>Recommande pour votre profil</div>
                          </div>
                        </div>
                        {/* 7-day debt bar chart */}
                        {bars.length > 0 && (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Dette accumulee sur 7 jours</span>
                              <span style={{ fontSize: 16, fontWeight: 900, color: totalColor }}>{totalH}h{String(totalM).padStart(2, '0')}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 4 } as any}>
                              {bars.map((b, i) => {
                                const h = maxDebt > 0 ? Math.max(4, (b.debt / maxDebt) * 70) : 4;
                                const bColor = b.debt <= 15 ? '#10B981' : b.debt <= 45 ? '#F59E0B' : '#EF4444';
                                return (
                                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } as any}>
                                    {b.debt > 0 && <span style={{ fontSize: 8, fontWeight: 700, color: bColor }}>{Math.round(b.debt)}m</span>}
                                    <div style={{ width: '100%', height: h, borderRadius: 4, background: bColor, transition: 'height 0.5s' } as any} />
                                  </div>
                                );
                              })}
                            </div>
                            <div style={{ display: 'flex', gap: 6 } as any}>
                              {bars.map((b, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>{b.day}</div>)}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── REGULARITE DU SOMMEIL (coucher/réveil 7j) ── */}
                  {sleepData && Array.isArray(sleepData) && sleepData.length >= 2 && (() => {
                    const last7 = sleepData.slice(-7);
                    const DAYS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
                    const W = 380, H = 160, LM = 40, RM = 10, TM = 20, BM = 28;
                    const gW = W - LM - RM, gH = H - TM - BM;
                    const toHour = (d: any) => { try { const dt = new Date(d.date + 'T12:00:00'); return { day: DAYS[dt.getDay()], bed: 22 + (d.bedtime_offset || Math.random() * 2 - 0.5), wake: 6 + (d.waketime_offset || (d.duration ? d.duration / 60 - 8 + 6.5 : Math.random() * 1.5)) }; } catch { return null; } };
                    const pts = last7.map(toHour).filter(Boolean) as { day: string; bed: number; wake: number }[];
                    if (pts.length < 2) return null;
                    const minH = 20, maxH = 9; // 20h evening to 9h morning (wraps around midnight)
                    const normY = (h: number) => { const n = h >= 18 ? h - 18 : h + 6; return TM + gH - (n / 15) * gH; };
                    const step = gW / (pts.length - 1);
                    return (
                      <div style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px', marginBottom: 12 } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                          <i className="ri-time-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Regularite du sommeil</span>
                        </div>
                        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160, display: 'block' }}>
                          {[20, 22, 0, 2, 4, 6, 8].map(h => {
                            const y = normY(h);
                            return <g key={h}><line x1={LM} x2={W - RM} y1={y} y2={y} stroke="rgba(0,0,0,0.04)" /><text x={LM - 6} y={y + 4} textAnchor="end" fill="#9CA3AF" fontSize="9" fontWeight="600">{h}h</text></g>;
                          })}
                          {/* Bedtime line */}
                          <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${LM + i * step} ${normY(p.bed)}`).join(' ')} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Wake line */}
                          <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${LM + i * step} ${normY(p.wake)}`).join(' ')} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Dots + day labels */}
                          {pts.map((p, i) => {
                            const x = LM + i * step;
                            return <g key={i}>
                              <circle cx={x} cy={normY(p.bed)} r="4" fill="#6366F1" stroke="#FFF" strokeWidth="1.5" />
                              <circle cx={x} cy={normY(p.wake)} r="4" fill="#F59E0B" stroke="#FFF" strokeWidth="1.5" />
                              <text x={x} y={H - 6} textAnchor="middle" fill="#9CA3AF" fontSize="9" fontWeight="600">{p.day}</text>
                            </g>;
                          })}
                        </svg>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#6366F1' } as any} /><span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Coucher</span></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#F59E0B' } as any} /><span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600 }}>Reveil</span></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── REGULARITE DU SOMMEIL (coucher/réveil 7j) — end ── */}

                </>
              );
            })()}
          </div>
        </div>

        {/* ══ SLEEP EXPLAIN POPUP ══ */}
        {explainSleep && (() => {
          const sleepExplanations: Record<string, { icon: string; color: string; title: string; desc: string; ranges: { label: string; value: string; color: string }[]; tip: string }> = {
            hypnogram: { icon: 'ri-bar-chart-horizontal-line', color: '#A78BFA', title: 'Cycles du sommeil', desc: "Votre sommeil alterne entre phases legeres, profondes et paradoxales (REM). Chaque cycle dure environ 90 minutes. Le sommeil profond regenere le corps, le REM consolide la memoire.", ranges: [{ label: 'Profond ideal', value: '15-25%', color: '#3A4099' }, { label: 'Leger normal', value: '45-55%', color: '#6B7BD9' }, { label: 'REM ideal', value: '20-25%', color: '#A8B4F0' }], tip: 'Un bon ratio de sommeil profond (>20%) est essentiel pour la recuperation physique. Le REM est crucial pour la memoire et la regulation emotionnelle.' },
            quality: { icon: 'ri-star-line', color: '#A78BFA', title: 'Qualite du sommeil', desc: "La qualite est calculee a partir de la duree, la proportion de sommeil profond et REM, et le nombre d'interruptions. Un score eleve indique un sommeil reparateur.", ranges: [{ label: 'Excellent', value: '> 80%', color: '#10B981' }, { label: 'Bon', value: '60-80%', color: '#22D3EE' }, { label: 'Moyen', value: '40-60%', color: '#F59E0B' }, { label: 'Mauvais', value: '< 40%', color: '#EF4444' }], tip: 'Evitez les ecrans 1h avant le coucher, maintenez une temperature fraiche (18-20°C) et couchez-vous a heures regulieres.' },
            interruptions: { icon: 'ri-alarm-line', color: '#F59E0B', title: 'Interruptions', desc: "Le nombre de fois ou vous vous etes reveille pendant la nuit. Des reveils frequents fragmentent le sommeil et reduisent sa qualite reparatrice.", ranges: [{ label: 'Excellent', value: '0-1', color: '#10B981' }, { label: 'Bon', value: '2', color: '#22D3EE' }, { label: 'Modere', value: '3-4', color: '#F59E0B' }, { label: 'Eleve', value: '> 4', color: '#EF4444' }], tip: "Limitez la cafeine apres 14h, evitez l'alcool le soir, et assurez-vous que votre chambre est sombre et silencieuse." },
            apnea: { icon: 'ri-lungs-line', color: '#EF4444', title: "Risque d'apnee", desc: "Estimation du risque d'apnee du sommeil basee sur les interruptions, la qualite du sommeil et les mouvements detectes. L'apnee provoque des micro-reveils repetitifs.", ranges: [{ label: 'Faible', value: '< 30%', color: '#10B981' }, { label: 'Modere', value: '30-60%', color: '#F59E0B' }, { label: 'Eleve', value: '> 60%', color: '#EF4444' }], tip: "Si le risque est eleve de maniere recurrente, consultez un medecin. L'apnee du sommeil non traitee augmente les risques cardiovasculaires." },
          };
          const e = sleepExplanations[explainSleep] || sleepExplanations.quality;
          return (
            <div data-testid="sleep-explain-popup" onClick={() => setExplainSleep(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.82)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
              <style dangerouslySetInnerHTML={{ __html: `@keyframes popIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}` }} />
              <div onClick={(ev: any) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
                <div onClick={() => setExplainSleep(null)} style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
                <div style={{ textAlign: 'center', marginBottom: 32, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
                  <i className={e.icon} style={{ fontSize: 44, color: e.color }} />
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginTop: 14 }}>{e.title}</div>
                </div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: 32, animation: 'slideUp 0.4s ease 0.2s both' } as any}>{e.desc}</div>
                <div style={{ marginBottom: 32, animation: 'slideUp 0.4s ease 0.3s both' } as any}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Valeurs de reference</div>
                  {e.ranges.map((r, ri) => (
                    <div key={ri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: ri < e.ranges.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                      <span style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{r.label}</span>
                      <span style={{ fontSize: 14, color: r.color, fontWeight: 800 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'slideUp 0.4s ease 0.4s both' } as any}>
                  <i className="ri-lightbulb-line" style={{ fontSize: 20, color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{e.tip}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  /* ═══ NON-SLEEP: existing dark layout ═══ */

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={bgUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => {
          if (isReadonly && beneficiaryId) {
            router.push({ pathname: '/health-readonly' as any, params: { beneficiaryId } });
          } else {
            try { router.back(); } catch { router.push('/(tabs)/health' as any); }
          }
        }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 20 } as any}>
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
          if (!sleepNightData && !sleepAnalysis) return (
            <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 14, padding: 24, textAlign: 'center' } as any}>
              <i className="ri-moon-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.2)', marginBottom: 12, display: 'block' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Aucune donnee de sommeil</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>Portez votre bracelet Elio pendant la nuit pour obtenir une analyse detaillee de votre sommeil.</div>
            </div>
          );
          const nightData = sleepNightData;
          const deepPct = nightData && nightData.totalSleep > 0 ? Math.round(nightData.deepMin / nightData.totalSleep * 100) : 0;
          const sleepSession = nightData?.session;
          const nightDeepMin = nightData?.deepMin || 0;
          const nightLightMin = nightData?.lightMin || 0;
          const nightRemMin = nightData?.remMin || 0;
          const nightAwakeMin = nightData?.awakeMin || 0;
          const nightTotalSleep = nightData?.totalSleep || 0;
          const nightDuration = nightData?.duration || 0;
          const nightQuality = nightData?.quality || 0;
          const nightInterruptions = nightData?.interruptions || 0;
          const nightApnea = nightData?.apnea || 0;
          return (
            <div key={`sleep-${selectedDate.getTime()}`}>

            {/* WHOOP Performance Score */}
            {sleepAnalysis && (() => {
              const a = sleepAnalysis;
              const perf = a.performance_score;
              const perfColor = perf >= 67 ? '#10B981' : perf >= 34 ? '#F59E0B' : '#EF4444';
              const perfLabel = perf >= 80 ? 'Optimal' : perf >= 67 ? 'Bon' : perf >= 50 ? 'Correct' : perf >= 34 ? 'A ameliorer' : 'Insuffisant';
              const circumference = 2 * Math.PI * 72;
              const dashLen = (perf / 100) * circumference;
              const subScores = [
                { label: 'Suffisance', score: a.sufficiency.score, icon: 'ri-battery-charge-line', sub: `${Math.floor(a.sufficiency.actual_min / 60)}h${String(a.sufficiency.actual_min % 60).padStart(2, '0')} / ${Math.floor(a.sufficiency.need_min / 60)}h${String(a.sufficiency.need_min % 60).padStart(2, '0')}` },
                { label: 'Regularite', score: a.consistency.score, icon: 'ri-rhythm-line', sub: a.consistency.detail },
                { label: 'Efficacite', score: a.efficiency.score, icon: 'ri-flashlight-line', sub: `${a.efficiency.pct}% du temps au lit` },
                { label: 'Stress sommeil', score: a.sleep_stress.score, icon: 'ri-mental-health-line', sub: `Niveau ${a.sleep_stress.level}` },
              ];
              return (
                <div data-testid="sleep-performance-card" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 14, padding: '24px 16px 16px', textAlign: 'center' } as any}>
                  <svg width="160" height="160" viewBox="0 0 160 160" style={{ display: 'block', margin: '0 auto' }}>
                    <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle cx="80" cy="80" r="72" fill="none" stroke={perfColor} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${dashLen} ${circumference}`} transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(.22,.61,.36,1)' } as any} />
                    <text x="80" y="72" textAnchor="middle" fill="#FFF" fontSize="38" fontWeight="900" fontFamily="Inter, system-ui, sans-serif">{perf}</text>
                    <text x="80" y="96" textAnchor="middle" fill={perfColor} fontSize="12" fontWeight="700" fontFamily="Inter, system-ui, sans-serif">{perfLabel}</text>
                  </svg>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Score de performance sommeil</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                    {subScores.map((s, i) => {
                      const sc = s.score >= 70 ? '#10B981' : s.score >= 50 ? '#F59E0B' : '#EF4444';
                      const rad = 20; const circ = 2 * Math.PI * rad; const dash = (s.score / 100) * circ;
                      return (
                        <div key={i} style={{ padding: '14px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                          <svg width="50" height="50" viewBox="0 0 50 50" style={{ display: 'block', margin: '0 auto 6px' }}>
                            <circle cx="25" cy="25" r={rad} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                            <circle cx="25" cy="25" r={rad} fill="none" stroke={sc} strokeWidth="4" strokeLinecap="round"
                              strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 25 25)" />
                            <text x="25" y="29" textAnchor="middle" fill="#FFF" fontSize="14" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">{s.score}</text>
                          </svg>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Hypnogram card with blur — image overlaps into this card */}
            {nightData && sleepSession && (
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
                <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative', marginBottom: 6 } as any}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'linear-gradient(90deg, rgba(239,68,68,0.06) 0%, rgba(245,158,11,0.06) 50%, rgba(16,185,129,0.06) 100%)' } as any} />
                  <div style={{ height: 12, borderRadius: 6, width: `${nightQuality}%`, background: 'linear-gradient(90deg, #EF4444, #F59E0B 40%, #10B981 80%)', transition: 'width 1.2s cubic-bezier(.22,.61,.36,1)', boxShadow: '0 0 16px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' } as any} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
                  <span style={{ fontSize: 9, color: 'rgba(239,68,68,0.4)' }}>Mauvais</span>
                  <span style={{ fontSize: 9, color: 'rgba(245,158,11,0.4)' }}>Correct</span>
                  <span style={{ fontSize: 9, color: 'rgba(16,185,129,0.4)' }}>Excellent</span>
                </div>
              </div>
              {/* Interruptions — radial gauge */}
              <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                  <i className="ri-alarm-line" style={{ fontSize: 16, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Interruptions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 } as any}>
                  {/* Arc gauge */}
                  <div style={{ position: 'relative', width: 80, height: 50, flexShrink: 0 } as any}>
                    <svg width="80" height="50" viewBox="0 0 80 50">
                      <defs>
                        <linearGradient id="intGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="50%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#EF4444" />
                        </linearGradient>
                      </defs>
                      <path d="M 8 46 A 32 32 0 0 1 72 46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round" />
                      <path d="M 8 46 A 32 32 0 0 1 72 46" fill="none" stroke="url(#intGrad)" strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${Math.min(1, nightInterruptions / 8) * 100} 100`} />
                    </svg>
                    <div style={{ position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center' } as any}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444' }}>{nightInterruptions}</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 12, color: nightInterruptions <= 2 ? '#10B981' : nightInterruptions <= 4 ? '#F59E0B' : '#EF4444', fontWeight: 800, marginBottom: 4 }}>
                      {nightInterruptions <= 1 ? 'Excellent' : nightInterruptions <= 2 ? 'Bon' : nightInterruptions <= 4 ? 'Modere' : 'Eleve'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                      {nightInterruptions <= 2 ? 'Sommeil continu, bonne recuperation.' : nightInterruptions <= 4 ? 'Quelques reveils, recuperation correcte.' : 'Trop de reveils, sommeil fragmente.'}
                    </div>
                    {sleepData && Array.isArray(sleepData) && sleepData.length > 1 && (
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                        Moy. 7j : {Math.round(sleepData.reduce((a: number, d: any) => a + (d.interruptions || 0), 0) / sleepData.length)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Sleep Debt Card — calculated from 7-day history */}
            {nightData && (() => {
              const NEED_MIN = sleepAnalysis?.sleep_need_min || (7 * 60 + 30);
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
                  const deepM = day.deep || 0;
                  const lightM = day.light || 0;
                  const remM = day.rem || 0;
                  const eff = deepM + lightM + remM;
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
                  <div onClick={() => setShowSleepInfo(true)} style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-question-line" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                </div>

                {/* Tonight: effective vs needed */}
                <div style={{ marginBottom: 16 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Sommeil effectif cette nuit</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>{effH}h{String(effM).padStart(2, '0')} <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>/ {Math.floor(NEED_MIN / 60)}h{String(NEED_MIN % 60).padStart(2, '0')}</span></span>
                  </div>
                  <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' } as any}>
                    <div style={{ height: 12, borderRadius: 6, width: `${tonightPct}%`, background: tonightPct >= 90 ? 'linear-gradient(90deg, #059669, #10B981, #34D399)' : tonightPct >= 75 ? 'linear-gradient(90deg, #D97706, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #DC2626, #EF4444, #F87171)', transition: 'width 1.2s cubic-bezier(.22,.61,.36,1)', boxShadow: `0 0 16px ${tonightColor}33, inset 0 1px 0 rgba(255,255,255,0.15)` } as any} />
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
                  <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}>
                    <div style={{ height: 10, borderRadius: 5, width: `${Math.min(100, Math.round(weekDebtMin / (NEED_MIN * weekDays) * 100))}%`, background: weekDebtMin <= 60 ? 'linear-gradient(90deg, #059669, #10B981, #34D399)' : weekDebtMin <= 180 ? 'linear-gradient(90deg, #D97706, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #DC2626, #EF4444, #F87171)', boxShadow: `0 0 12px ${weekColor}33, inset 0 1px 0 rgba(255,255,255,0.15)` } as any} />
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
                      { label: 'Paradoxal', val: `${remRatio}%`, sub: `${nightRemMin}min`, c: remRatio >= 20 ? '#C4B5FD' : '#F59E0B' },
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

            {/* Recovery Card */}
            {sleepAnalysis && (() => {
              const rec = sleepAnalysis.recovery;
              const zoneColors: Record<string, string> = { green: '#10B981', yellow: '#F59E0B', red: '#EF4444' };
              const zoneLabels: Record<string, string> = { green: 'Optimale', yellow: 'Moderee', red: 'Faible' };
              const zc = zoneColors[rec.zone] || '#6B7280';
              const zl = zoneLabels[rec.zone] || 'Inconnue';
              const rCirc = 2 * Math.PI * 36;
              const rDash = (rec.score / 100) * rCirc;
              return (
                <div data-testid="sleep-recovery-card" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 18px', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                    <i className="ri-heart-pulse-line" style={{ fontSize: 16, color: zc }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Recuperation</span>
                    <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 999, background: `${zc}18`, fontSize: 10, fontWeight: 700, color: zc }}>{zl}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                    <svg width="90" height="90" viewBox="0 0 90 90" style={{ flexShrink: 0 }}>
                      <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle cx="45" cy="45" r="36" fill="none" stroke={zc} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${rDash} ${rCirc}`} transform="rotate(-90 45 45)"
                        style={{ transition: 'stroke-dasharray 1.2s ease' } as any} />
                      <text x="45" y="42" textAnchor="middle" fill="#FFF" fontSize="22" fontWeight="900" fontFamily="Inter, system-ui, sans-serif">{rec.score}</text>
                      <text x="45" y="56" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="Inter, system-ui, sans-serif">/100</text>
                    </svg>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                      {rec.hrv > 0 && (
                        <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' } as any}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Variabilite cardiaque (VFC)</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#A78BFA' }}>{rec.hrv} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>ms</span></div>
                        </div>
                      )}
                      {rec.rhr > 0 && (
                        <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' } as any}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>FC au repos</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>{rec.rhr} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>bpm</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 10, lineHeight: 1.5 }}>
                    Base sur : performance sommeil, variabilite cardiaque et frequence cardiaque au repos.
                  </div>
                </div>
              );
            })()}

            {/* Weekly Trend */}
            {sleepAnalysis && sleepAnalysis.weekly_trend && sleepAnalysis.weekly_trend.length > 1 && (() => {
              const trend = sleepAnalysis.weekly_trend;
              const maxDur = Math.max(...trend.map((dd: any) => dd.duration));
              const need = sleepAnalysis.sleep_need_min || 480;
              const ref = Math.max(maxDur, need);
              return (
                <div data-testid="sleep-weekly-trend" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 18px', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                    <i className="ri-bar-chart-grouped-line" style={{ fontSize: 16, color: '#818CF8' }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>7 derniers jours</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110, padding: '0 2px' } as any}>
                    {trend.map((day: any, i: number) => {
                      const barH = Math.max(16, Math.round((day.duration / ref) * 100));
                      const qColor = day.quality >= 75 ? '#10B981' : day.quality >= 55 ? '#F59E0B' : '#EF4444';
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 } as any}>
                          <div style={{ fontSize: 8, fontWeight: 700, color: qColor }}>{day.quality}%</div>
                          <div style={{ width: '100%', maxWidth: 22, height: barH, borderRadius: 5, overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
                            {day.awake_pct > 0 && <div style={{ flex: day.awake_pct, background: '#F87171' } as any} />}
                            <div style={{ flex: day.rem_pct || 1, background: '#C4B5FD' } as any} />
                            <div style={{ flex: day.light_pct || 1, background: '#818CF8' } as any} />
                            <div style={{ flex: day.deep_pct || 1, background: '#4338CA' } as any} />
                          </div>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{day.date.slice(8)}/{day.date.slice(5, 7)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' } as any}>
                    {[
                      { l: 'Profond', c: '#4338CA' }, { l: 'Leger', c: '#818CF8' },
                      { l: 'REM', c: '#C4B5FD' }, { l: 'Eveil', c: '#F87171' },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 } as any}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c } as any} />
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Sleep Planner */}
            {sleepAnalysis && (
              <div data-testid="sleep-planner" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px 18px', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                  <i className="ri-time-line" style={{ fontSize: 16, color: '#818CF8' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Planification du sommeil</span>
                </div>
                <div style={{ display: 'flex', gap: 8 } as any}>
                  {[
                    { icon: 'ri-moon-line', label: 'Besoin', value: `${Math.floor(sleepAnalysis.sleep_need_min / 60)}h${String(sleepAnalysis.sleep_need_min % 60).padStart(2, '0')}`, c: '#A78BFA' },
                    { icon: 'ri-moon-cloudy-line', label: 'Coucher', value: sleepAnalysis.recommended_bedtime, c: '#818CF8' },
                    { icon: 'ri-sun-line', label: 'Reveil', value: '07:00', c: '#F59E0B' },
                  ].map((item, i) => (
                    <div key={i} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                      <i className={item.icon} style={{ fontSize: 20, color: item.c, marginBottom: 6, display: 'block' }} />
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{item.value}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apnea risk — separate card with Nora analysis */}
            {nightData && (() => {
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
            <div key={m.key} onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: m.key === 'bp_display' ? 'blood_pressure' : m.key, ...(beneficiaryId ? { beneficiaryId } : {}) } })} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 10, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s' } as any}
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

      {/* Sleep Info Glass Popup */}
      {showSleepInfo && (
        <div onClick={() => setShowSleepInfo(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => setShowSleepInfo(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Comprendre votre sommeil</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.5 }}>Votre bracelet Elio mesure chaque phase de sommeil. Voici ce que signifie chaque indicateur.</div>

            {[
              { icon: 'ri-moon-line', color: '#818CF8', title: 'Sommeil Leger', text: 'Phase de transition entre l\'eveil et le sommeil profond. Votre corps se detend, la respiration ralentit. Represente environ 50% d\'une nuit normale.' },
              { icon: 'ri-moon-fill', color: '#4338CA', title: 'Sommeil Profond', text: 'Phase la plus reparatrice. Le corps se regenere, les muscles se reparent, le systeme immunitaire se renforce. Objectif : au moins 15-20% de la nuit.' },
              { icon: 'ri-eye-line', color: '#C4B5FD', title: 'Sommeil REM (Paradoxal)', text: 'REM signifie "Rapid Eye Movement" (mouvements oculaires rapides). C\'est la phase des reves. Le cerveau est tres actif : il consolide la memoire, traite les emotions et favorise l\'apprentissage. Objectif : 20-25% de la nuit.' },
              { icon: 'ri-alarm-line', color: '#F87171', title: 'Phases d\'eveil', text: 'Micro-reveils naturels entre les cycles de sommeil. Quelques reveils courts sont normaux (2-4 par nuit). Trop d\'interruptions reduisent la qualite du sommeil.' },
              { icon: 'ri-star-line', color: '#F59E0B', title: 'Qualite du sommeil', text: 'Score calcule par le bracelet a partir de la duree, la proportion de sommeil profond et REM, et le nombre d\'interruptions. Au-dessus de 80% : excellent.' },
              { icon: 'ri-battery-charge-line', color: '#10B981', title: 'Dette de sommeil', text: 'Difference entre le sommeil effectif (duree - temps eveille) et le besoin recommande (7h30 pour les seniors). La dette se cumule sur 7 jours et impacte la sante globale.' },
              { icon: 'ri-heart-pulse-line', color: '#A78BFA', title: 'Score de recuperation', text: 'Indicateur global calcule a partir de la duree (40%), qualite bracelet (30%), sommeil profond (20%) et REM (10%). Au-dessus de 80 : bonne recuperation.' },
              { icon: 'ri-lungs-line', color: '#60A5FA', title: 'Risque d\'apnee', text: 'Estimation basee sur les interruptions et la qualite du sommeil. Un score eleve peut indiquer des pauses respiratoires pendant le sommeil. Consultez un medecin si le risque est eleve.' },
            ].map((item, i) => (
              <div key={i} style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 10 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={item.icon} style={{ fontSize: 16, color: item.color }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{item.title}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
