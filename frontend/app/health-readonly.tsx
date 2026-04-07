import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import HeroScore from '../src/components/health/HeroScore';
import AnalysisPhase from '../src/components/health/AnalysisPhase';
import ActivityCard from '../src/components/dashboard/ActivityCard';
import SleepCard from '../src/components/health/SleepCard';
import HealthSections from '../src/components/health/HealthSections';

export default function HealthReadonlyScreen() {
  const params = useLocalSearchParams<{ beneficiaryId: string }>();
  const { token } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  // Expo Router useLocalSearchParams is unreliable on web — fallback to window.location.search
  const webBeneficiaryId = (() => { try { if (typeof window !== 'undefined' && window.location?.search) return new URLSearchParams(window.location.search).get('beneficiaryId') || ''; } catch {} return ''; })();
  const beneficiaryId = params.beneficiaryId || webBeneficiaryId || '';
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showScoreDetail, setShowScoreDetail] = useState(false);
  const [showAnalysisInfo, setShowAnalysisInfo] = useState(false);
  const [isDark, setIsDark] = useState(() => typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') !== '0' : true);
  const [benName, setBenName] = useState('');
  const [benAge, setBenAge] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const iv = setInterval(() => {
      const v = localStorage.getItem('chutex_dark') !== '0';
      setIsDark(prev => prev !== v ? v : prev);
    }, 400);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [dailyReport, bens] = await Promise.all([
          apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/daily-report`, {}, token),
          apiFetch('/api/guardian/beneficiaries', {}, token),
        ]);
        setReport(dailyReport);
        const ben = (bens || []).find((b: any) => b.id === beneficiaryId);
        if (ben) {
          setBenName(ben.name || '');
          if (ben.avatar_url) setAvatarUrl(ben.avatar_url);
          if (ben.date_of_birth) {
            setBenAge(Math.floor((Date.now() - new Date(ben.date_of_birth).getTime()) / 31557600000));
          }
        }
        if (dailyReport?.beneficiary_name) setBenName(prev => prev || dailyReport.beneficiary_name);
      } catch (e) {
        console.error('Failed to fetch health report:', e);
      } finally { setLoading(false); }
    })();
  }, [beneficiaryId, token]);

  // Navigate to metric-detail with beneficiaryId
  const goToMetric = (key: string) => {
    router.push({ pathname: '/metric-detail' as any, params: { key, beneficiaryId } });
  };

  if (loading) return <FullScreenLoader />;
  if (Platform.OS !== 'web') return null;
  if (!report) return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#000' : '#FFF', fontFamily: "'Inter', system-ui, sans-serif" } as any}>
      <div style={{ textAlign: 'center' } as any}>
        <i className="ri-heart-pulse-line" style={{ fontSize: 40, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#FFF' : '#111', marginTop: 12 }}>Donnees non disponibles</div>
        <div onClick={() => router.back()} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 99, background: isDark ? '#FFF' : '#111', color: isDark ? '#111' : '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' } as any}>{t('return_label')}</div>
      </div>
    </div>
  );

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
  const hasBloodPressure = Number(d.blood_pressure?.systolic || 0) > 0;
  const hasValidTemp = Number(d.temperature || 0) >= 34 && Number(d.temperature || 0) <= 42;
  const hasMeaningfulVitals = hasHeartRate || hasSpo2 || hasBloodPressure || hasValidTemp;
  const hasBodyAge = noraBodyAge > 0 || Number(d.body_age || 0) > 0;
  const firstName = (benName || '').split(' ')[0] || benName;
  const initials = (benName || '?').split(' ').map((n: string) => n[0]?.toUpperCase()).join('').slice(0, 2);

  const filteredPlan = (Array.isArray(plan) ? plan : []).filter((p: any) => {
    if (p.key === 'steps') return Number(d.steps || 0) > 0;
    if (p.key === 'hydration') return Number(d.water_pct || 0) > 0;
    if (p.key === 'sleep') return true;
    if (p.key === 'calories') return Number(d.calories || 0) > 0;
    if (p.key === 'calories_intake') return true;
    return p?.value != null && `${p.value}` !== '' && `${p.value}` !== '0';
  });

  const BG_RED_HEADER = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
  const PROGRESS_BG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/jai7cybu_background_progressbar.jpg';
  const SCALE_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';
  const BRACELET_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
  const NUTRITION_BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';

  const cardBg = isDark ? 'rgba(70,70,78,0.85)' : '#E8E8EA';
  const textColor = isDark ? '#FFF' : '#1A1A2E';
  const subColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const sepColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const contentBg = isDark ? 'linear-gradient(to bottom, #000 0%, #3A3A3C 100%)' : '#FFF';

  const stepPlan = filteredPlan.find((p: any) => p.key === 'steps');
  const sGoal = stepPlan ? parseInt(stepPlan.value) || 6000 : 6000;

  // No data view
  if (report?.no_data) {
    return (
      <div data-testid="health-readonly-no-data" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: isDark ? '#000' : '#FFF' } as any}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' } as any}>
          <i className="ri-heart-pulse-line" style={{ fontSize: 48, color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', marginBottom: 16 }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: textColor, marginBottom: 8 }}>Aucune donnee de sante</div>
          <div style={{ fontSize: 13, color: subColor, lineHeight: 1.6, maxWidth: 320, marginBottom: 24 }}>{firstName} n'a pas encore connecte de dispositif de sante.</div>
          <div onClick={() => router.back()} style={{ padding: '12px 32px', borderRadius: 99, background: isDark ? '#FFF' : '#111', color: isDark ? '#111' : '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' } as any}>{t('return_label')}</div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="health-readonly-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>

        {/* ═══ RED BG HEADER — CENTERED ═══ */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG_RED_HEADER} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 28px' } as any}>

            {/* Top bar: back + badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
              <div data-testid="health-readonly-back-btn" onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any}>
                <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
              </div>
              <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', letterSpacing: 0.5 }}>LECTURE SEULE</span>
              </div>
            </div>

            {/* Name — CENTERED, no avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', textAlign: 'center' }}>Sante de {firstName}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 2 }}>{benAge ? `${benAge} ans · ` : ''}Consultation gardien</div>
            </div>

            {/* Analysis Phase */}
            <AnalysisPhase analysisPhase={analysisPhase} showInfo={showAnalysisInfo} setShowInfo={setShowAnalysisInfo} progressBg={PROGRESS_BG} />

            {/* Hero BioAge */}
            {!analysisPhase && (hasMeaningfulVitals || hasBodyAge) && (
              <HeroScore bioAge={noraBodyAge || d.body_age || 0} realAge={benAge || 0} status={status} statusColor={statusColor} ai={ai} subs={subs} showDetail={showScoreDetail} setShowDetail={setShowScoreDetail} d={d} bodyAgeNora={bodyAgeNora} agingRate={null} />
            )}
            {!analysisPhase && !hasMeaningfulVitals && !hasBodyAge && (
              <div style={{ padding: '18px 16px', borderRadius: 16, marginBottom: 8, background: 'rgba(0,0,0,0.3)' } as any}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FCD34D', marginBottom: 6 }}>Score Nora indisponible</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>Pas assez de mesures physiologiques pour calculer un score fiable.</div>
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

        {/* Vitals Row — 2x2 grid, CLICKABLE to metric-detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 } as any}>
          {[
            { key: 'heart_rate', val: d.heart_rate > 0 ? d.heart_rate : '--', unit: 'bpm', label: 'Rythme cardiaque', status: d.heart_rate > 0 ? 'Mesure recente' : t('no_data'), icon: 'ri-heart-pulse-line', color: '#EF4444' },
            { key: 'spo2', val: d.spo2 > 0 ? `${d.spo2}` : '--', unit: '%', label: 'Saturation O2', status: d.spo2 > 0 ? 'Mesure recente' : t('no_data'), icon: 'ri-drop-line', color: '#6366F1' },
            { key: 'blood_pressure', val: d.blood_pressure?.systolic > 0 && d.blood_pressure?.diastolic > 0 ? `${d.blood_pressure.systolic}/${d.blood_pressure.diastolic}` : '--/--', unit: 'mmHg', label: 'Pression arterielle', status: d.blood_pressure?.systolic > 0 ? 'Mesure recente' : t('no_data'), icon: 'ri-water-flash-line', color: '#8B5CF6' },
            { key: 'temperature', val: d.temperature > 0 ? `${d.temperature}` : '--', unit: '\u00B0C', label: 'Température', status: d.temperature > 0 ? 'Mesure recente' : t('no_data'), icon: 'ri-temp-hot-line', color: '#F59E0B' },
          ].map((v, i) => (
            <div key={i} data-testid={`readonly-vital-${v.key}`} onClick={() => goToMetric(v.key)}
              style={{ padding: '12px 14px 10px', borderRadius: 18, background: cardBg, cursor: 'pointer', transition: 'transform 0.12s' } as any}
              onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(0.98)'} onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                  <i className={v.icon} style={{ fontSize: 13, color: v.color }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: subColor }}>{v.label}</span>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 12, color: subColor }} />
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

        {/* Activity Card */}
        <ActivityCard steps={d.steps || 0} calories={d.calories || 0} distance={d.distance_km || 0} recovery={d.recovery_score || 0} stress={d.stress_level || 0} sleepQuality={d.sleep_quality || 0} heartRate={d.heart_rate || 0} streak={activityStreak} stepGoal={sGoal} beneficiaryId={beneficiaryId} />

        <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

        {/* Sleep Card */}
        <SleepCard d={d} beneficiaryId={beneficiaryId} />

        <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

        {/* Poids & Nutrition — clickable to dedicated page */}
        <div onClick={() => router.push({ pathname: '/minceur' as any, params: { beneficiaryId } })} style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 14, position: 'relative', cursor: 'pointer', border: isDark ? '1.5px solid rgba(255,255,255,0.25)' : '1.5px solid rgba(0,0,0,0.08)', boxShadow: isDark ? '0 0 30px rgba(255,255,255,0.08), 0 8px 40px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.08)' } as any}>
          <img src={NUTRITION_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2 } as any}>
            <div style={{ textAlign: 'center', paddingTop: 16 } as any}>
              <img src={SCALE_IMG} alt="" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))' } as any} />
            </div>
            <div style={{ padding: '10px 16px 14px' } as any}>
              <div style={{ textAlign: 'center', marginBottom: 10 } as any}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>{t('weight_nutrition')}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Appuyez pour voir les details</div>
              </div>
              <div style={{ display: 'flex', gap: 6 } as any}>
                {[
                  { label: t('weight'), val: d.weight, unit: 'kg', color: '#F59E0B' },
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
          </div>
        </div>

        <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

        {/* Health Sections — pass beneficiaryId for navigation */}
        <HealthSections d={d} subs={subs} beneficiaryId={beneficiaryId} />

        <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

        {/* Pesees — clickable rows */}
        <div style={{ borderRadius: 18, background: cardBg, marginBottom: 14, overflow: 'hidden' } as any}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${sepColor}` } as any}>
            <img src={SCALE_IMG} alt="Balance" style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', flexShrink: 0 } as any} />
            <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: textColor }}>Historique pesees</div><div style={{ fontSize: 10, color: subColor }}>Balance 8 electrodes</div></div>
          </div>
          <div style={{ padding: '0 16px' } as any}>
            {weighings.length === 0 && <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: subColor }}>{t('no_weighing_data')}</div>}
            {weighings.slice(0, 5).map((w: any, i: number) => (
              <div key={i} onClick={() => router.push({ pathname: '/minceur' as any, params: { beneficiaryId } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? `1px solid ${sepColor}` : 'none', cursor: 'pointer' } as any}>
                <div style={{ flex: 1 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: textColor }}>{w.weight} kg</span><span style={{ fontSize: 10, color: subColor, marginLeft: 8 }}>{new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></div>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: w.status === 'Bonne' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', fontSize: 9, fontWeight: 700, color: w.status === 'Bonne' ? '#10B981' : '#F59E0B' }}>{w.status}</span>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: subColor }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

        {/* ECG History */}
        <div style={{ borderRadius: 18, background: cardBg, marginBottom: 14, overflow: 'hidden' } as any}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${sepColor}` } as any}>
            <img src={BRACELET_IMG} alt="Bracelet" style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))', flexShrink: 0 } as any} />
            <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: textColor }}>Historique ECG</div><div style={{ fontSize: 10, color: subColor }}>{t('ecg_full')}</div></div>
          </div>
          <div style={{ padding: '0 16px' } as any}>
            <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: subColor }}>Aucun ECG enregistré</div>
          </div>
        </div>

        <div style={{ height: 1, background: sepColor, margin: '12px 0 16px' } as any} />

        {/* AI Motivation */}
        {ai.motivation && <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: subColor, fontStyle: 'italic' }}>{ai.motivation}</div>}

      </div>
      </div>
    </div>
  );
}
