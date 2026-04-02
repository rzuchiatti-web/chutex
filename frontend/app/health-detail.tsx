import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import SleepHypnogram, { fromBraceletStages } from '../src/components/health/SleepHypnogram';
import NoraCard from '../src/components/shared/NoraCard';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { HorizontalCalendar } from '../src/components/dashboard/pro/ProCalendar';
import SleepHypnogramCard from '../src/components/health/sleep/SleepHypnogramCard';
import SleepQualityCard from '../src/components/health/sleep/SleepQualityCard';
import SleepApneaCard from '../src/components/health/sleep/SleepApneaCard';
import SleepDebtCard from '../src/components/health/sleep/SleepDebtCard';
import SleepRegularityCard from '../src/components/health/sleep/SleepRegularityCard';
import SleepExplainPopup from '../src/components/health/sleep/SleepExplainPopup';

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
            <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 60px', maxWidth: 480, margin: '0 auto' } as any}>
              <div onClick={() => { try { router.back(); } catch { router.push('/(tabs)/health' as any); } }} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
              <div style={{ textAlign: 'center', marginTop: 8 } as any}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>Sommeil</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Analyse detaillee de votre nuit</div>
                {sleepNightData && <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 } as any}><span style={{ fontSize: 48, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{Math.floor(sleepNightData.duration / 60)}</span><span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>h</span><span style={{ fontSize: 48, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{String(sleepNightData.duration % 60).padStart(2, '0')}</span><span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>min</span></div>}
                {!sleepNightData && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Aucune donnee disponible</div>}
              </div>
              {/* Calendar — identical to activity-detail / minceur */}
              <HorizontalCalendar selectedDate={selectedDate} onSelect={setSelectedDate} accent="#A78BFA" />
            </div>
          </div>

          {/* WHITE CONTENT CARD */}
          <div style={{ padding: '24px 16px 120px', marginTop: -24, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-24px auto 0', width: '100%' } as any}>

            {/* Nora sleep analysis button — always visible */}
            <div data-testid="nora-sleep-btn" onClick={() => setShowSleepInfo(true)} style={{ borderRadius: 16, background: '#000', padding: '14px 16px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <video autoPlay loop muted playsInline style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'contain', flexShrink: 0, pointerEvents: 'none' } as any} src="https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4" />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Analyse du sommeil</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Analyse par Nora de votre nuit</div></div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
            </div>

            {/* Sleep content — render with extracted components */}
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
              const sleepNeedMin = sleepAnalysis?.sleep_need_min || (7 * 60 + 30);
              return (
                <>
                  {nightData && sleepSession && (
                    <SleepHypnogramCard sleepSession={sleepSession} nightDeepMin={nightDeepMin} nightLightMin={nightLightMin} nightRemMin={nightRemMin} nightAwakeMin={nightAwakeMin} nightTotalSleep={nightTotalSleep} nightInterruptions={nightInterruptions} onExplain={setExplainSleep} />
                  )}
                  {nightData && <SleepQualityCard nightQuality={nightQuality} onExplain={setExplainSleep} />}
                  {nightData && <SleepApneaCard nightApnea={nightApnea} onExplain={setExplainSleep} />}
                  {nightData && <SleepDebtCard nightDuration={nightDuration} nightAwakeMin={nightAwakeMin} sleepData={sleepData} sleepNeedMin={sleepNeedMin} onExplain={setExplainSleep} />}
                  {sleepData && Array.isArray(sleepData) && sleepData.length >= 2 && <SleepRegularityCard sleepData={sleepData} onExplain={setExplainSleep} />}
                </>
              );
            })()}
          </div>
        </div>

        {/* Sleep Explain Popup (extracted component) */}
        {explainSleep && <SleepExplainPopup explainKey={explainSleep} onClose={() => setExplainSleep(null)} />}

        {/* Nora Sleep Info Popup (dark glass overlay) */}
        {showSleepInfo && (
          <div data-testid="nora-sleep-info-popup" onClick={() => setShowSleepInfo(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.82)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes popIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}` }} />
            <div onClick={(ev: any) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
              <div onClick={() => setShowSleepInfo(false)} style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
              <div style={{ textAlign: 'center', marginBottom: 32, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
                <i className="ri-moon-line" style={{ fontSize: 44, color: '#A78BFA' }} />
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginTop: 14 }}>Comprendre votre sommeil</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.5 }}>Votre bracelet Elio mesure chaque phase de sommeil.</div>
              </div>
              {[
                { icon: 'ri-moon-line', color: '#818CF8', title: 'Sommeil Leger', text: "Phase de transition entre l'eveil et le sommeil profond. Represente environ 50% d'une nuit normale." },
                { icon: 'ri-moon-fill', color: '#4338CA', title: 'Sommeil Profond', text: 'Phase la plus reparatrice. Le corps se regenere, le systeme immunitaire se renforce. Objectif : 15-20%.' },
                { icon: 'ri-eye-line', color: '#C4B5FD', title: 'Sommeil REM', text: 'Phase des reves. Le cerveau consolide la memoire et traite les emotions. Objectif : 20-25%.' },
                { icon: 'ri-alarm-line', color: '#F87171', title: "Phases d'eveil", text: 'Micro-reveils naturels entre les cycles. 2-4 par nuit est normal.' },
                { icon: 'ri-star-line', color: '#F59E0B', title: 'Qualite du sommeil', text: "Score calcule a partir de la duree, sommeil profond/REM et interruptions. Au-dessus de 80% : excellent." },
                { icon: 'ri-battery-charge-line', color: '#10B981', title: 'Dette de sommeil', text: 'Difference entre sommeil effectif et besoin recommande (7h30). Se cumule sur 7 jours.' },
                { icon: 'ri-lungs-line', color: '#60A5FA', title: "Risque d'apnee", text: "Estimation basee sur les interruptions et la qualite. Consultez un medecin si le risque est eleve." },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.06)' : 'none', animation: `slideUp 0.4s ease ${0.15 + i * 0.05}s both` } as any}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={item.icon} style={{ fontSize: 16, color: item.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{item.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

        {/* Hero — category image */}
        <div style={{ textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 2 } as any}>
          <img src={sec.img} alt="" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -50 } as any} />
        </div>

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

    </div>
  );
}
