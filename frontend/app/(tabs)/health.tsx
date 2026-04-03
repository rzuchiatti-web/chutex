import { Icon, MCIcon } from '../../src/components/WebIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, TextInput, Alert, Modal } from 'react-native';
import ProgramDailyView from '../../src/components/ProgramDailyView';
import AdminClients from '../../src/components/health/AdminClients';
import AnalysisPhase from '../../src/components/health/AnalysisPhase';
import HeroScore from '../../src/components/health/HeroScore';
import DailyObjectives from '../../src/components/health/DailyObjectives';
import WeighingFlow from '../../src/components/dashboard/WeighingFlow';
import ActivityCard from '../../src/components/dashboard/ActivityCard';
import NoraCard from '../../src/components/shared/NoraCard';
import NoraAgingOverlay from '../../src/components/dashboard/NoraAgingOverlay';
import SleepCard from '../../src/components/health/SleepCard';
import HealthSections from '../../src/components/health/HealthSections';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';
import FullScreenLoader from '../../src/components/FullScreenLoader';
import AnimatedDarkBg from '../../src/components/AnimatedDarkBg';
import CompanyAgencyScreen from '../company-agency';
import { GlycemiaCard } from '../../src/components/health/GlycemiaCard';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

/* ===== COMPANY: AGENCES ===== */
function CompanyAgences({ token }: { token: string }) {
  return <CompanyAgencyScreen />;
}

export default function HealthScreen() {
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState<any>(null);
  const [dashData, setDashData] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [showScoreDetail, setShowScoreDetail] = useState(false);
  const [showAnalysisInfo, setShowAnalysisInfo] = useState(false);
  const [showDayPlanPopup, setShowDayPlanPopup] = useState(false);
  const [weighingStep, setWeighingStep] = useState(0);
  const [healthProgData, setHealthProgData] = useState<any>(null);
  const [healthProgCatalog, setHealthProgCatalog] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [agingRate, setAgingRate] = useState<any>(null);
  const [todayExercises, setTodayExercises] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(() => typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') === '1' : false);
  const [showNoraAging, setShowNoraAging] = useState(false);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const iv = setInterval(() => {
      const v = localStorage.getItem('chutex_dark') === '1';
      setIsDark(prev => prev !== v ? v : prev);
    }, 400);
    return () => clearInterval(iv);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [latest, bracelet] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
      ]);
      if (bracelet && (bracelet.heart_rate > 0 || bracelet.steps > 0)) {
        setVitals({ heart_rate: bracelet.heart_rate || 0, spo2: bracelet.spo2 || 0, systolic: bracelet.systolic || 0, diastolic: bracelet.diastolic || 0, temperature: bracelet.temperature || 0, steps: bracelet.steps || 0 });
      } else if (latest?.heart_rate) setVitals(latest);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  const fetchDashData = useCallback(async () => { try { setDashData(await apiFetch('/api/devices/dashboard-summary', {}, token)); } catch {} }, [token]);
  const fetchReport = useCallback(async () => { try { setReport(await apiFetch('/api/health/daily-report', {}, token)); } catch {} finally { setReportLoading(false); } }, [token]);

  useEffect(() => { fetchData(); fetchDashData(); fetchReport(); apiFetch('/api/health/aging-rate', {}, token).then(setAgingRate).catch(() => {}); apiFetch('/api/pro/beneficiary-today-exercises', {}, token).then(e => setTodayExercises(Array.isArray(e) ? e : [])).catch(() => {}); }, [fetchData, fetchDashData, fetchReport]);
  useEffect(() => {
    Promise.all([
      apiFetch('/api/programs/active', {}, token).catch(() => null),
      apiFetch('/api/programs/catalog', {}, token).catch(() => null),
    ]).then(([p, c]) => { if (p) setHealthProgData(p); if (c?.programs) setHealthProgCatalog(c.programs); });
  }, [token]);

  const effectiveRole = user?.active_role || user?.role;
  if (effectiveRole === 'admin' && token) return <AdminClients token={token} />;
  if (effectiveRole === 'prescriber_company' && token) return <CompanyAgences token={token} />;
  if ((effectiveRole === 'guardian' || effectiveRole === 'professional') && token) {
    const ProSpace = require('../../src/components/dashboard/ProSpace').default;
    return <ProSpace token={token} user={user} />;
  }
  const BG_DARK = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
  const PROGRESS_BG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/jai7cybu_background_progressbar.jpg';

  const d = report?.data || {};
  const ai = report?.ai || {};
  const status = report?.status || '';
  const statusColor = report?.status_color || 'rgba(255,255,255,0.3)';
  const subs = report?.subscores || {};
  const plan = report?.daily_plan || [];
  const weighings = report?.weighings || [];
  const analysisPhase = report?.analysis_phase || null;
  const bodyAgeNora = report?.body_age_nora || null;
  const noraBodyAge = bodyAgeNora?.body_age || 0;
  const activityStreak = report?.activity_streak || { current_streak: 0, max_streak: 0, objectives_today: [], badge: null };
  const hasHeartRate = Number(d.heart_rate || 0) > 0;
  const hasSpo2 = Number(d.spo2 || 0) > 0;
  const hasBloodPressure = Number(d.blood_pressure?.systolic || 0) > 0 && Number(d.blood_pressure?.diastolic || 0) > 0;
  const hasValidTemp = Number(d.temperature || 0) >= 34 && Number(d.temperature || 0) <= 42;
  const hasMeaningfulVitals = hasHeartRate || hasSpo2 || hasBloodPressure || hasValidTemp;
  const hasBodyAge = noraBodyAge > 0 || Number(d.body_age || 0) > 0;
  const hasWeightData = weighings.length > 0 || Number(d.weight || 0) > 0;
  const hasAnyHealthData = hasMeaningfulVitals || hasBodyAge || hasWeightData;
  const filteredPlan = (Array.isArray(plan) ? plan : []).filter((p: any) => {
    if (p.key === 'steps') return Number(d.steps || 0) > 0;
    if (p.key === 'hydration') return Number(d.water_pct || 0) > 0;
    if (p.key === 'sleep') return true; // Always show bedtime recommendation
    if (p.key === 'calories') return Number(d.calories || 0) > 0;
    if (p.key === 'calories_intake') return true; // Always show calorie target
    return p?.value != null && `${p.value}` !== '' && `${p.value}` !== '0';
  });

  /* ─── WEB BENEFICIARY VIEW ─── */
  if (Platform.OS === 'web' && effectiveRole === 'beneficiary') {
    if (reportLoading) return <FullScreenLoader />;

    // isDark comes from the state hook at the top of the component
    const BG_RED_HEADER = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
    const cardBg = isDark ? 'rgba(70,70,78,0.85)' : '#E8E8EA';
    const textColor = isDark ? '#FFF' : '#1A1A2E';
    const subColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
    const sepColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const contentBg = isDark ? 'linear-gradient(to bottom, #000 0%, #3A3A3C 100%)' : '#FFF';

    /* No data — show connect device message ONLY if no device paired */
    const hasDevice = report?.has_device || dashData?.connected_count > 0 || (dashData?.dashboard_summary?.bracelet?.paired);
    if ((report?.no_data && !hasDevice) || (!hasAnyHealthData && !hasDevice)) {
      const noDataAi = report?.ai;
      const BRACELET_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
      const SCALE_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';
      const ndBg = isDark ? '#0A0A1A' : '#F8F8FA';
      const ndText = isDark ? '#FFF' : '#111';
      const ndSub = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
      const ndCardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
      const ndCardBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
      return (
        <div data-testid="health-no-data" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'auto', background: ndBg } as any}>
          {isDark && <AnimatedDarkBg />}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5, padding: '0 28px', textAlign: 'center', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: '70px', paddingBottom: 100 } as any}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ndText, marginBottom: 10 }}>{noDataAi?.hero_line || 'Aucune donnee de sante'}</div>
            <div style={{ fontSize: 14, color: ndSub, lineHeight: 1.6, maxWidth: 320, marginBottom: 28 }}>{noDataAi?.priority || 'Connectez vos dispositifs pour commencer a suivre votre sante et recevoir des analyses personnalisees de Nora.'}</div>

            {/* Device promo cards */}
            <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 380, marginBottom: 28 } as any}>
              <div data-testid="promo-bracelet" onClick={() => { try { router.push('/(tabs)/devices' as any); } catch { if (typeof window !== 'undefined') window.location.hash = '#/devices'; } }} style={{ flex: 1, padding: '20px 14px', borderRadius: 18, background: ndCardBg, border: `1.5px solid ${ndCardBorder}`, cursor: 'pointer', textAlign: 'center' } as any}>
                <img src={BRACELET_IMG} alt="Bracelet Elio" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 12px', display: 'block' } as any} />
                <div style={{ fontSize: 14, fontWeight: 800, color: ndText, marginBottom: 4 }}>Bracelet Elio</div>
                <div style={{ fontSize: 10, color: ndSub, lineHeight: 1.4 }}>Suivi cardiaque, sommeil, activite</div>
              </div>
              <div data-testid="promo-scale" onClick={() => { try { router.push('/(tabs)/devices' as any); } catch { if (typeof window !== 'undefined') window.location.hash = '#/devices'; } }} style={{ flex: 1, padding: '20px 14px', borderRadius: 18, background: ndCardBg, border: `1.5px solid ${ndCardBorder}`, cursor: 'pointer', textAlign: 'center' } as any}>
                <img src={SCALE_IMG} alt="Balance Vita" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 12px', display: 'block' } as any} />
                <div style={{ fontSize: 14, fontWeight: 800, color: ndText, marginBottom: 4 }}>Balance Vita</div>
                <div style={{ fontSize: 10, color: ndSub, lineHeight: 1.4 }}>Poids, IMC, masse grasse</div>
              </div>
            </div>

            <div data-testid="connect-device-btn" onClick={() => { try { router.push('/(tabs)/devices' as any); } catch { if (typeof window !== 'undefined') window.location.hash = '#/devices'; } }} style={{ padding: '16px 36px', borderRadius: 999, background: isDark ? '#FFF' : '#111', color: isDark ? '#111' : '#FFF', cursor: 'pointer', fontSize: 15, fontWeight: 700, flexShrink: 0 } as any}>Connecter un dispositif</div>
          </div>
        </div>
      );
    }

    return (
      <div data-testid="health-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>

          {/* ═══ RED BG HEADER — Bio Age + Aging Rate + Comprendre mon corps ═══ */}
          <div style={{ position: 'relative', zIndex: 1 } as any}>
            <img src={BG_RED_HEADER} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 28px' } as any}>
              {/* Analysis Phase */}
              <AnalysisPhase analysisPhase={analysisPhase} showInfo={showAnalysisInfo} setShowInfo={setShowAnalysisInfo} progressBg={PROGRESS_BG} />

              {/* Hero BioAge + Aging Rate */}
              {!analysisPhase && (hasMeaningfulVitals || hasBodyAge || (agingRate && agingRate.rate > 0)) && (
                <HeroScore bioAge={agingRate?.bio_age || noraBodyAge || d.body_age || 0} realAge={agingRate?.real_age || (user?.date_of_birth ? Math.floor((Date.now() - new Date(user.date_of_birth).getTime()) / 31557600000) : 0)} status={status} statusColor={statusColor} ai={ai} subs={subs} showDetail={showScoreDetail} setShowDetail={setShowScoreDetail} d={d} bodyAgeNora={bodyAgeNora} agingRate={agingRate} />
              )}
              {!analysisPhase && !hasMeaningfulVitals && !hasBodyAge && !(agingRate && agingRate.rate > 0) && (
                <div data-testid="health-score-unavailable" style={{ padding: '18px 16px', borderRadius: 16, marginBottom: 8, background: 'rgba(0,0,0,0.3)' } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FCD34D', marginBottom: 6 }}>Score Nora indisponible</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>Nous avons besoin de mesures physiologiques valides (bracelet Elio) pour calculer un score fiable.</div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ THEMED CONTENT CARD ═══ */}
          <div style={{
            padding: '24px 16px 120px', marginTop: -16,
            borderRadius: '24px 24px 0 0',
            background: contentBg,
            position: 'relative', zIndex: 10,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          } as any}>

          {/* Nora Aging Analysis Button — above vitals */}
          <div data-testid="nora-aging-btn" onClick={() => setShowNoraAging(true)}
            style={{ borderRadius: 16, background: '#000', padding: '14px 16px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'opacity 0.15s' } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1'; }}>
            <video autoPlay loop muted playsInline style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'contain', flexShrink: 0 } as any}
              src="https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4" />
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Analyse biologique</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Age biologique et rythme de vieillissement</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>

          {/* Vitals Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 } as any}>
            {[
              { val: d.heart_rate > 0 ? d.heart_rate : '--', unit: 'bpm', label: 'Rythme cardiaque', status: d.heart_rate > 0 ? 'Mesure recente' : 'Aucune donnee', icon: 'ri-heart-pulse-line', color: '#EF4444', key: 'heart_rate' },
              { val: d.spo2 > 0 ? `${d.spo2}` : '--', unit: '%', label: 'Saturation O2', status: d.spo2 > 0 ? 'Mesure recente' : 'Aucune donnee', icon: 'ri-drop-line', color: '#6366F1', key: 'spo2' },
              { val: d.blood_pressure?.systolic > 0 && d.blood_pressure?.diastolic > 0 ? `${d.blood_pressure.systolic}/${d.blood_pressure.diastolic}` : '--/--', unit: 'mmHg', label: 'Pression arterielle', status: d.blood_pressure?.systolic > 0 ? 'Mesure recente' : 'Aucune donnee', icon: 'ri-water-flash-line', color: '#8B5CF6', key: 'blood_pressure' },
              { val: d.temperature > 0 ? `${d.temperature}` : '--', unit: '°C', label: 'Temperature', status: d.temperature > 0 ? 'Mesure recente' : 'Aucune donnee', icon: 'ri-temp-hot-line', color: '#F59E0B', key: 'temperature' },
            ].map((v, i) => (
              <div key={i} onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: v.key } })} style={{ padding: '12px 14px 10px', borderRadius: 18, background: cardBg, cursor: 'pointer', transition: 'transform 0.15s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                    <i className={v.icon} style={{ fontSize: 13, color: v.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: subColor }}>{v.label}</span>
                  </div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 2 } as any}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: textColor, lineHeight: 1, letterSpacing: -0.5 }}>{v.val}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: subColor }}>{v.unit}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: v.color, opacity: 0.7 }}>{v.status}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

          {/* 4b. Activity Card */}
          {(() => {
            const stepPlan = filteredPlan.find((p: any) => p.key === 'steps');
            const sGoal = stepPlan ? parseInt(stepPlan.value) || 6000 : 6000;
            return <ActivityCard steps={d.steps || 0} calories={d.calories || 0} distance={d.distance_km || 0} recovery={d.recovery_score || 0} stress={d.stress_level || 0} sleepQuality={d.sleep_quality || 0} heartRate={d.heart_rate || 0} streak={activityStreak} stepGoal={sGoal} />;
          })()}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0 16px' } as any} />
          <SleepCard d={d} />

          <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

          {/* Poids & Nutrition */}
          <div data-testid="weight-nutrition-card" onClick={() => router.push('/minceur' as any)}
            style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', position: 'relative', transition: 'transform 0.15s', border: isDark ? '1.5px solid rgba(255,255,255,0.25)' : '1.5px solid rgba(0,0,0,0.08)', boxShadow: isDark ? '0 0 30px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)' } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
            <img src="https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2 } as any}>
              <div style={{ textAlign: 'center', paddingTop: 16 } as any}>
                <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg" alt="" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))' } as any} />
              </div>
              <div style={{ padding: '10px 16px 14px' } as any}>
                <div style={{ textAlign: 'center', marginBottom: 10 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>Poids & Nutrition</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Repas, exercices, objectif</div>
                </div>
                <div style={{ display: 'flex', gap: 6 } as any}>
                  {[
                    { label: 'Poids', val: d.weight, unit: 'kg', color: '#F59E0B' },
                    { label: 'Graisse', val: weighings[0]?.body_fat_pct, unit: '%', color: '#F97316' },
                    { label: 'Muscle', val: weighings[0]?.muscle_pct, unit: '%', color: '#10B981' },
                  ].map((m, i) => (
                    <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: 'rgba(0,0,0,0.2)', textAlign: 'center' } as any}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: Number(m.val || 0) > 0 ? '#FFF' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                        {Number(m.val || 0) > 0 ? m.val : '--'}<span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span>
                      </div>
                      <div style={{ fontSize: 8, color: m.color, fontWeight: 700, marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Suivi quotidien personnalise</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#60A5FA' }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 10 }} /></span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

          {/* Glycemia Estimation Card */}
          <GlycemiaCard token={token} />

          <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

          {/* Health Sections */}
          <HealthSections d={d} subs={subs} />

          <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

          {/* Pesee card */}
          <div style={{ borderRadius: 18, background: cardBg, marginBottom: 14, overflow: 'hidden' } as any}>
            <div data-testid="action-weighing" onClick={() => setWeighingStep(1)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: `1px solid ${sepColor}` } as any}>
              <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg" alt="Balance" style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', flexShrink: 0 } as any} />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: textColor }}>Nouvelle pesee</div><div style={{ fontSize: 10, color: subColor }}>Balance 8 electrodes</div></div>
              <div style={{ padding: '8px 14px', borderRadius: 999, background: isDark ? '#FFF' : '#1A1A2E', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-scales-3-line" style={{ fontSize: 14, color: isDark ? '#111' : '#FFF' }} /><span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#111' : '#FFF' }}>Lancer</span></div>
            </div>
            <div style={{ padding: '0 16px' } as any}>
              {weighings.length === 0 && <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: subColor }}>Aucune pesee</div>}
              {weighings.slice(0, 3).map((w: any, i: number) => (
                <div key={i} onClick={() => router.push({ pathname: '/weighing-report' as any, params: { id: w.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? `1px solid ${sepColor}` : 'none', cursor: 'pointer' } as any}>
                  <div style={{ flex: 1 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: textColor }}>{w.weight} kg</span><span style={{ fontSize: 10, color: subColor, marginLeft: 8 }}>{new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></div>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: w.status === 'Bonne' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', fontSize: 9, fontWeight: 700, color: w.status === 'Bonne' ? '#10B981' : '#F59E0B' }}>{w.status}</span>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: subColor }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

          {/* ECG card */}
          <div style={{ borderRadius: 18, background: cardBg, marginBottom: 14, overflow: 'hidden' } as any}>
            <div data-testid="action-ecg" onClick={() => router.push('/ecg' as any)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: `1px solid ${sepColor}` } as any}>
              <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg" alt="Bracelet" style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', flexShrink: 0 } as any} />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: textColor }}>Realiser un ECG</div><div style={{ fontSize: 10, color: subColor }}>Electrocardiogramme</div></div>
              <div style={{ padding: '8px 14px', borderRadius: 999, background: isDark ? '#FFF' : '#1A1A2E', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-pulse-line" style={{ fontSize: 14, color: isDark ? '#111' : '#FFF' }} /><span style={{ fontSize: 11, fontWeight: 700, color: isDark ? '#111' : '#FFF' }}>Lancer</span></div>
            </div>
            <div style={{ padding: '0 16px' } as any}>
              {(!report?.ecg_history || report.ecg_history.length === 0) && <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: subColor }}>Aucun ECG</div>}
              {(report?.ecg_history || []).slice(0, 3).map((e: any, i: number) => (
                <div key={i} onClick={() => router.push({ pathname: '/ecg-detail' as any, params: { id: e.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? `1px solid ${sepColor}` : 'none', cursor: 'pointer' } as any}>
                  <div style={{ flex: 1 } as any}><span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{e.result || 'Rythme sinusal'}</span><span style={{ fontSize: 10, color: subColor, marginLeft: 8 }}>{e.bpm || '--'} bpm</span></div>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: e.normal !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', fontSize: 9, fontWeight: 700, color: e.normal !== false ? '#10B981' : '#EF4444' }}>{e.normal !== false ? 'Normal' : 'Anomalie'}</span>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: subColor }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

          {ai.motivation && <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: subColor, fontStyle: 'italic' }}>{ai.motivation}</div>}

      </div>
      </div>

      {/* Popups outside stacking context */}
      {weighingStep > 0 && <WeighingFlow onClose={() => setWeighingStep(0)} d={d} weighings={weighings} />}

      {/* Nora Aging Overlay */}
      {showNoraAging && <NoraAgingOverlay token={token} onClose={() => setShowNoraAging(false)} />}
    </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  const nativeVitals = vitals || { heart_rate: 0, spo2: 0, systolic: 0, diastolic: 0, temperature: 0, steps: 0 };
  const metrics = [
    { id: 'heart_rate', label: 'Frequence cardiaque', value: nativeVitals.heart_rate, unit: 'bpm', icon: 'pulse-outline' as any, color: '#EF4444', range: '60-100' },
    { id: 'spo2', label: 'Saturation O2', value: nativeVitals.spo2, unit: '%', icon: 'water-outline' as any, color: '#38BDF8', range: '95-100' },
    { id: 'blood_pressure', label: 'Tension arterielle', value: `${nativeVitals.systolic}/${nativeVitals.diastolic}`, unit: 'mmHg', icon: 'pulse-outline' as any, color: '#A78BFA', range: '120/80' },
    { id: 'temperature', label: 'Temperature', value: nativeVitals.temperature, unit: 'C', icon: 'thermometer-outline' as any, color: '#F59E0B', range: '36.5-37.5' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} testID="health-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 16, marginBottom: 8 }}>Sante</Text>
        <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Suivi de vos constantes en temps reel</Text>
        {loading ? (
          <FullScreenLoader />
        ) : vitals ? (
          <>
            {metrics.map(m => (
              <TouchableOpacity key={m.id} testID={`health-metric-${m.id}`} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', flexDirection: 'row', alignItems: 'center', gap: 16 }} onPress={() => router.push({ pathname: '/health-detail', params: { metricId: m.id } })}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: m.color + '15', justifyContent: 'center', alignItems: 'center' }}><Icon name={m.icon} size={22} color={m.color} /></View>
                <View style={{ flex: 1 }}><Text style={{ fontSize: 13, color: '#9CA3AF' }}>{m.label}</Text><Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>{m.value} <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{m.unit}</Text></Text></View>
                <Icon name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
            <MCIcon name="bluetooth-off" size={40} color="#9CA3AF" />
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 16 }}>Aucune donnee</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>Connectez votre bracelet pour suivre vos constantes</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
