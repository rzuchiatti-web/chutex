import { Icon, MCIcon } from '../../src/components/WebIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, TextInput, Alert, Modal } from 'react-native';
import ProgramDailyView from '../../src/components/ProgramDailyView';
import AdminClients from '../../src/components/health/AdminClients';
import AnalysisPhase from '../../src/components/health/AnalysisPhase';
import HeroScore from '../../src/components/health/HeroScore';
import DailyObjectives from '../../src/components/health/DailyObjectives';
import WeighingFlow from '../../src/components/dashboard/WeighingFlow';
import SleepCard from '../../src/components/health/SleepCard';
import HealthSections from '../../src/components/health/HealthSections';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';
import FullScreenLoader from '../../src/components/FullScreenLoader';
import CompanyAgencyScreen from '../company-agency';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

/* ===== COMPANY: AGENCES — kept inline due to heavy local state ===== */
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

  useEffect(() => { fetchData(); fetchDashData(); fetchReport(); }, [fetchData, fetchDashData, fetchReport]);
  useEffect(() => {
    Promise.all([
      apiFetch('/api/programs/active', {}, token).catch(() => null),
      apiFetch('/api/programs/catalog', {}, token).catch(() => null),
    ]).then(([p, c]) => { if (p) setHealthProgData(p); if (c?.programs) setHealthProgCatalog(c.programs); });
  }, [token]);

  const effectiveRole = user?.active_role || user?.role;
  if (effectiveRole === 'admin' && token) return <AdminClients token={token} />;
  if (effectiveRole === 'prescriber_company' && token) return <CompanyAgences token={token} />;

  const BG_DARK = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
  const PROGRESS_BG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/jai7cybu_background_progressbar.jpg';

  const d = report?.data || {};
  const ai = report?.ai || {};
  const score = report?.score ?? 0;
  const status = report?.status || '';
  const statusColor = report?.status_color || 'rgba(255,255,255,0.3)';
  const subs = report?.subscores || {};
  const plan = report?.daily_plan || [];
  const weighings = report?.weighings || [];
  const analysisPhase = report?.analysis_phase || null;

  /* ─── WEB BENEFICIARY VIEW ─── */
  if (Platform.OS === 'web' && effectiveRole === 'beneficiary') {
    if (reportLoading) return <FullScreenLoader />;

    /* No data — show connect device message + Nora recommendations */
    if (report?.no_data) {
      const noDataAi = report?.ai;
      const noDataRecs = noDataAi?.secondary_recs || [];
      return (
        <div data-testid="health-no-data" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'auto' } as any}>
          <img src={BG_DARK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5, padding: '0 28px', textAlign: 'center', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 'env(safe-area-inset-top, 60px)', paddingBottom: 100 } as any}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 10 }}>{noDataAi?.hero_line || 'Aucune donnee de sante'}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 320, marginBottom: 20 }}>{noDataAi?.priority || 'Connectez vos dispositifs pour commencer a suivre votre sante et recevoir des analyses personnalisees de Nora.'}</div>

            {/* Nora recommendations */}
            {noDataRecs.length > 0 && (
              <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', marginBottom: 20, width: '100%', maxWidth: 340, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', textAlign: 'left' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 900, color: '#A78BFA' }}>N</span></div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Recommandations de Nora</span>
                </div>
                {noDataRecs.map((rec: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                    <i className="ri-arrow-right-circle-line" style={{ fontSize: 14, color: '#A78BFA', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{rec}</span>
                  </div>
                ))}
              </div>
            )}

            <div onClick={() => router.push('/(tabs)/devices' as any)} style={{ padding: '16px 36px', borderRadius: 999, background: '#FFF', color: '#111', cursor: 'pointer', fontSize: 15, fontWeight: 700, flexShrink: 0 } as any}>Connecter un dispositif</div>
          </div>
        </div>
      );
    }

    return (
      <div data-testid="health-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
        <img src={BG_DARK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* 0. Analysis Phase */}
          <AnalysisPhase analysisPhase={analysisPhase} showInfo={showAnalysisInfo} setShowInfo={setShowAnalysisInfo} progressBg={PROGRESS_BG} />

          {/* 1. Hero BioAge */}
          {!analysisPhase && <HeroScore bioAge={d.body_age || 0} realAge={user?.date_of_birth ? Math.floor((Date.now() - new Date(user.date_of_birth).getTime()) / 31557600000) : 0} status={status} statusColor={statusColor} ai={ai} subs={subs} showDetail={showScoreDetail} setShowDetail={setShowScoreDetail} d={d} />}

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* 2. Daily Objectives (no program here — moved to Programmes tab) */}

          {/* 3. Daily Objectives — no card wrapper */}
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>Objectifs journaliers</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 } as any}>
            {plan.map((p: any) => (
              <div key={p.key} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}><i className={p.icon} style={{ fontSize: 14, color: p.color }} /><span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{p.status || p.label}</span></div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{p.value} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{p.unit}</span></div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.label}</div>
                {p.progress != null && <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 6, overflow: 'hidden' } as any}><div style={{ height: 3, borderRadius: 2, width: `${p.progress}%`, background: p.color } as any} /></div>}
              </div>
            ))}
          </div>
          {/* 3b moved after sections */}

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* 4. Vitals Row — same design as dashboard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 } as any}>
            {[
              { val: d.heart_rate || 72, unit: 'bpm', label: 'Rythme cardiaque', status: 'Au repos', icon: 'ri-heart-pulse-line', color: '#EF4444', key: 'heart_rate' },
              { val: `${d.spo2 || 97}`, unit: '%', label: 'Saturation O2', status: 'Normal', icon: 'ri-drop-line', color: '#6366F1', key: 'spo2' },
              { val: `${d.blood_pressure?.systolic || 125}/${d.blood_pressure?.diastolic || 78}`, unit: 'mmHg', label: 'Pression arterielle', status: 'Stable', icon: 'ri-water-flash-line', color: '#8B5CF6', key: 'blood_pressure' },
              { val: `${d.temperature || 36.6}`, unit: '°C', label: 'Temperature', status: 'Normale', icon: 'ri-temp-hot-line', color: '#F59E0B', key: 'temperature' },
            ].map((v, i) => (
              <div key={i} onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: v.key } })} style={{ padding: '12px 14px 10px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', transition: 'transform 0.15s, background 0.15s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                    <i className={v.icon} style={{ fontSize: 13, color: v.color }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{v.label}</span>
                  </div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.15)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 2 } as any}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -0.5 }}>{v.val}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>{v.unit}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: v.color, opacity: 0.7 }}>{v.status}</div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* 5. Sleep Card */}
          <SleepCard d={d} />

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {/* 6. Health Sections */}
          <HealthSections d={d} subs={subs} />

          {/* 7. Pesee card — button + history */}
          <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 14, overflow: 'hidden' } as any}>
            <div data-testid="action-weighing" onClick={() => setWeighingStep(1)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}>
              <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg" alt="Balance" style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', flexShrink: 0 } as any} />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Nouvelle pesee</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Balance 8 electrodes</div></div>
              <div style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-scales-3-line" style={{ fontSize: 14, color: '#A78BFA' }} /><span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Lancer</span></div>
            </div>
            <div style={{ padding: '0 16px' } as any}>
              {weighings.length === 0 && <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Aucune pesee</div>}
              {weighings.slice(0, 3).map((w: any, i: number) => (
                <div key={i} onClick={() => router.push({ pathname: '/weighing-report' as any, params: { id: w.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' } as any}>
                  <div style={{ flex: 1 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{w.weight} kg</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></div>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: w.status === 'Bonne' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', fontSize: 9, fontWeight: 700, color: w.status === 'Bonne' ? '#10B981' : '#F59E0B' }}>{w.status}</span>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.12)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* 8. ECG card — button + history */}
          <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 14, overflow: 'hidden' } as any}>
            <div data-testid="action-ecg" onClick={() => router.push('/ecg' as any)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}>
              <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg" alt="Bracelet" style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', flexShrink: 0 } as any} />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Realiser un ECG</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Electrocardiogramme</div></div>
              <div style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-pulse-line" style={{ fontSize: 14, color: '#F97316' }} /><span style={{ fontSize: 11, fontWeight: 700, color: '#F97316' }}>Lancer</span></div>
            </div>
            <div style={{ padding: '0 16px' } as any}>
              {(!report?.ecg_history || report.ecg_history.length === 0) && <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Aucun ECG</div>}
              {(report?.ecg_history || []).slice(0, 3).map((e: any, i: number) => (
                <div key={i} onClick={() => router.push({ pathname: '/ecg-detail' as any, params: { id: e.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' } as any}>
                  <div style={{ flex: 1 } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{e.result || 'Rythme sinusal'}</span><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>{e.bpm || '--'} bpm</span></div>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: e.normal !== false ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', fontSize: 9, fontWeight: 700, color: e.normal !== false ? '#10B981' : '#EF4444' }}>{e.normal !== false ? 'Normal' : 'Anomalie'}</span>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.12)' }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '4px 20px 16px' } as any} />

          {ai.motivation && <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>{ai.motivation}</div>}

          </div>

          {weighingStep > 0 && <WeighingFlow onClose={() => setWeighingStep(0)} d={d} weighings={weighings} />}
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  const nativeVitals = vitals || { heart_rate: 72, spo2: 97, systolic: 125, diastolic: 78, temperature: 36.6, steps: 3842 };
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
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color="#111827" /></View>
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
