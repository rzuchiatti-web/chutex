import { Icon } from '../../src/components/WebIcon';
import FullScreenLoader from '../../src/components/FullScreenLoader';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../src/context/I18nContext';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';

const STATE_LABEL_MAP: Record<string, string> = {
  IDLE: 'alert_state_idle', CALLING_PATIENT: 'alert_state_calling_patient', CALLING_GUARDIANS: 'alert_state_calling_guardians',
  CARE_DISPATCHED: 'alert_state_care_dispatched', RESOLVED: 'alert_state_resolved',
};

/* Clean alert type label */
const getAlertLabel = (t: string, tr: (k: string) => string) => {
  if (t === 'fall') return tr('alert_type_fall');
  if (t === 'manual_app') return tr('alert_type_manual_app');
  if (t === 'manual_bracelet') return tr('alert_type_manual_bracelet');
  if (t === 'sos') return tr('alert_type_sos');
  if (t === 'heart_rate' || t === 'health_anomaly') return tr('alert_type_health_anomaly');
  if (t === 'spo2') return tr('alert_type_health_anomaly');
  if (t === 'threshold') return tr('alert_type_threshold');
  if (t === 'inactivity') return tr('alert_type_inactivity');
  if (t === 'geofence' || t === 'geofence_exit') return tr('alert_type_geofence');
  return t || tr('alert_type_default');
};

/* Anomaly detail card (for health anomalies with vital data) */
function AnomalyCard({ alert }: { alert: any }) {
  const isAnomaly = ['heart_rate', 'health_anomaly', 'spo2'].includes(alert.alert_type);
  if (!isAnomaly) return null;
  const vd = alert.vital_data || {};
  const td = alert.threshold_data || {};
  // Try to parse from message if no vital_data
  const msg = alert.message || '';
  const hasVitalData = Object.keys(vd).length > 0;
  const items: any[] = [];
  if (vd.heart_rate || td.heart_rate_max) items.push({ label: 'Pouls', value: vd.heart_rate ? `${vd.heart_rate} bpm` : '?', threshold: td.heart_rate_max ? `Seuil : ${td.heart_rate_max} bpm` : '', icon: 'ri-heart-pulse-line', color: '#EF4444' });
  if (vd.spo2 || td.spo2_min) items.push({ label: 'SpO2', value: vd.spo2 ? `${vd.spo2}%` : '?', threshold: td.spo2_min ? `Seuil min : ${td.spo2_min}%` : '', icon: 'ri-lungs-line', color: '#3B82F6' });
  if (vd.temperature || td.temperature_max) items.push({ label: 'Température', value: vd.temperature ? `${vd.temperature}°C` : '?', threshold: td.temperature_max ? `Seuil : ${td.temperature_max}°C` : '', icon: 'ri-temp-hot-line', color: '#F59E0B' });
  if (items.length === 0 && !hasVitalData) {
    // Fallback: show a generic anomaly message from the alert message
    return (
      <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 10 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-alert-line" style={{ fontSize: 16, color: '#EF4444' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase' }}>Anomalie détectée</span></div>
        <div style={{ fontSize: 14, color: '#FFF', marginTop: 6, lineHeight: 1.4 }}>{msg}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 10 } as any}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Anomalie détectée</div>
      {items.map((item, i) => (
        <div key={i}>
          {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 18, color: item.color }} /></div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{item.value}</div>
            </div>
            {item.threshold && <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' } as any}><span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444' }}>{item.threshold}</span></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------
   EXPLAINER PAGE  — "Comprendre les alertes"
   ------------------------------------------------------------------ */
function ExplainerPage({ onClose, role }: { onClose: () => void; role: string }) {
  const isSAAD = role === 'prescriber_company';
  const { t } = useI18n();

  const saadSteps = [
    { icon: 'ri-alarm-warning-line', title: t('alert_type_default'), desc: t('alert_saad_intro'), color: '#EF4444' },
    { icon: 'ri-headphone-line', title: t('alert_role_teleassist'), desc: t('alert_role_teleassist_a1'), color: '#F59E0B' },
    { icon: 'ri-user-star-line', title: t('alert_role_intervenant'), desc: t('alert_role_intervenant_a2'), color: '#8B5CF6' },
    { icon: 'ri-file-text-line', title: t('closure_report'), desc: t('alert_role_intervenant_a3'), color: '#3B82F6' },
    { icon: 'ri-bar-chart-box-line', title: t('information'), desc: t('alert_saad_steps_label'), color: '#10B981' },
  ];
  const defaultSteps = [
    { icon: 'ri-alarm-warning-line', title: t('alert_type_default'), desc: t('alert_process_intro'), color: '#EF4444' },
    { icon: 'ri-phone-line', title: t('alert_state_calling_patient'), desc: t('alert_role_operator_a2'), color: '#F59E0B' },
    { icon: 'ri-group-line', title: t('alert_state_calling_guardians'), desc: t('alert_role_guard_a1'), color: '#3B82F6' },
    { icon: 'ri-map-pin-range-line', title: t('alert_state_care_dispatched'), desc: t('alert_role_intervenant_a2'), color: '#8B5CF6' },
    { icon: 'ri-file-text-line', title: t('closure_report'), desc: t('alert_role_intervenant_a3'), color: '#10B981' },
  ];
  const steps = isSAAD ? saadSteps : defaultSteps;

  const saadRoles = [
    { icon: 'ri-building-line', role: t('alert_role_operator'), actions: [t('alert_role_operator_a1'), t('alert_role_operator_a2'), t('alert_role_operator_a3')], color: '#D4845A' },
    { icon: 'ri-user-star-line', role: t('alert_role_intervenant'), actions: [t('alert_role_intervenant_a1'), t('alert_role_intervenant_a2'), t('alert_role_intervenant_a3')], color: '#8B5CF6' },
    { icon: 'ri-shield-check-line', role: t('alert_role_guardian'), actions: [t('alert_role_guard_a1'), t('alert_role_guard_a2'), t('alert_role_guard_a3')], color: '#3B82F6' },
    { icon: 'ri-headphone-line', role: t('alert_role_teleassist'), actions: [t('alert_role_teleassist_a1'), t('alert_role_teleassist_a2'), t('alert_role_teleassist_a3')], color: '#10B981' },
  ];
  const defaultRoles = [
    { icon: 'ri-user-heart-line', role: t('alert_role_beneficiary'), actions: [t('alert_role_ben_a1'), t('alert_role_ben_a2'), t('alert_role_ben_a3')], color: '#EF4444' },
    { icon: 'ri-shield-check-line', role: t('alert_role_guardian'), actions: [t('alert_role_guard_a1'), t('alert_role_guard_a2'), t('alert_role_guard_a3')], color: '#3B82F6' },
    { icon: 'ri-first-aid-kit-line', role: t('alert_role_intervenant'), actions: [t('alert_role_intervenant_a1'), t('alert_role_intervenant_a2'), t('alert_role_intervenant_a3')], color: '#8B5CF6' },
    { icon: 'ri-headphone-line', role: t('alert_role_teleassist'), actions: [t('alert_role_teleassist_a1'), t('alert_role_teleassist_a2'), t('alert_role_teleassist_a3')], color: '#10B981' },
  ];
  const roles = isSAAD ? saadRoles : defaultRoles;

  const saadFaq = [
    { q: t('faq_saad_q1'), a: t('faq_saad_a1') },
    { q: t('faq_saad_q2'), a: t('faq_saad_a2') },
    { q: t('faq_saad_q3'), a: t('faq_saad_a3') },
    { q: t('faq_saad_q4'), a: t('faq_saad_a4') },
  ];
  const defaultFaq = [
    { q: t('faq_q1'), a: t('faq_a1') },
    { q: t('faq_q2'), a: t('faq_a2') },
    { q: t('faq_q3'), a: t('faq_a3') },
    { q: t('faq_q4'), a: t('faq_a4') },
  ];
  const faqs = isSAAD ? saadFaq : defaultFaq;

  return (
    <div data-testid="comprendre-alertes-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '70px 16px 0', zIndex: 5 } as any}>
        <div data-testid="back-from-explainer" onClick={onClose} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#FFF' }}>{isSAAD ? t('alert_saad_manage') : t('alert_understand')}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: isSAAD ? 'rgba(212,132,90,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isSAAD ? 'rgba(212,132,90,0.3)' : 'rgba(239,68,68,0.3)'}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
            <i className={isSAAD ? 'ri-building-line' : 'ri-shield-check-line'} style={{ fontSize: 32, color: '#FFF' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>{isSAAD ? t('alert_saad_header') : t('alert_process_header')}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>{isSAAD ? t('alert_saad_intro') : t('alert_process_intro')}</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>{isSAAD ? t('alert_saad_steps_label') : t('alert_steps_label')}</div>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' } as any}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}25`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
              </div>
              {i < steps.length - 1 && <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.1)', marginTop: 4 } as any} />}
            </div>
            <div style={{ flex: 1, paddingTop: 2 } as any}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>{`${i + 1}. ${s.title}`}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 12 }}>{isSAAD ? t('alert_saad_actors') : t('alert_roles_permissions')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
          {roles.map((ro: any, i: number) => (
            <div key={i} style={{ padding: '16px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: `1px solid ${(ro.color || '#FFF') + '25'}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                <i className={ro.icon} style={{ fontSize: 20, color: ro.color || '#FFF' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ro.role}</div>
              </div>
              {ro.actions.map((a: string, j: number) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 } as any}>
                  <i className="ri-check-line" style={{ fontSize: 12, color: ro.color || '#10B981' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{a}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 20 }}>{t('alert_faq_title')}</div>
        {faqs.map((faq, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', marginBottom: 8 } as any}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 6 }}>{faq.q}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------
   REPORT PAGE  — Rapport de cloture
   ------------------------------------------------------------------ */
function ReportPage({ alert, role, token, onClose, onDone }: { alert: any; role: string; token: string; onClose: () => void; onDone: () => void }) {
  const [reportText, setReportText] = useState('');
  const [reportAnswers, setReportAnswers] = useState<Record<string, string>>({});
  const user = useAuth().user;

  const isBeneficiary = role === 'beneficiary';
  const reportQuestions = isBeneficiary ? [
    { id: 'reason', label: t('report_reason_label'), options: [t('report_reason_1'), t('report_reason_2'), t('report_reason_3'), t('report_reason_4')] },
  ] : [
    { id: 'situation', label: t('report_situation_label'), options: [t('report_situation_1'), t('report_situation_2'), t('report_situation_3')] },
    { id: 'actions', label: t('report_actions_label'), options: [t('report_actions_1'), t('report_actions_2'), t('report_actions_3'), t('report_actions_4'), t('report_actions_5')] },
    { id: 'condition', label: t('report_condition_label'), options: [t('report_condition_1'), t('report_condition_2'), t('report_condition_3'), t('report_condition_4')] },
  ];
  const allAnswered = reportQuestions.every(q => reportAnswers[q.id]);

  const submit = () => {
    if (!allAnswered) return;
    const report = { ...reportAnswers, notes: reportText, closed_by: user?.name, closed_at: new Date().toISOString(), closed_by_role: role };
    apiFetch(`/api/alerts/${alert.id}/resolve`, { method: 'PUT', body: JSON.stringify({ answers: report, notes: reportText }) }, token)
      .then(() => onDone())
      .catch(() => {});
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '70px 16px 0', zIndex: 5 } as any}>
        <div onClick={onClose} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{isBeneficiary ? 'Cloturer l\'alerte' : 'Rapport de cloture'}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{isBeneficiary ? 'Dites-nous ce qui s\'est passe' : `Alerte : ${alert.beneficiary_name}`}</div>
        </div>
        {reportQuestions.map((q, qi) => (
          <div key={q.id} style={{ marginBottom: 16 } as any}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>{qi + 1}. {q.label} <span style={{ color: '#EF4444' }}>*</span></div>
            {q.options.map((opt, oi) => (
              <div key={oi} onClick={() => setReportAnswers({ ...reportAnswers, [q.id]: opt })} style={{
                padding: '12px 16px', borderRadius: 14, marginBottom: 6, cursor: 'pointer',
                background: reportAnswers[q.id] === opt ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${reportAnswers[q.id] === opt ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
              } as any}>
                <div style={{ width: 20, height: 20, borderRadius: 999, border: `2px solid ${reportAnswers[q.id] === opt ? '#FFF' : 'rgba(255,255,255,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  {reportAnswers[q.id] === opt && <div style={{ width: 10, height: 10, borderRadius: 999, background: '#FFF' }} />}
                </div>
                <span style={{ fontSize: 14, color: '#FFF', fontWeight: 500 }}>{opt}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginBottom: 16 } as any}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>{isBeneficiary ? 'Un commentaire ?' : 'Note personnalisee'}</div>
          <textarea value={reportText} onChange={(e: any) => setReportText(e.target.value)} placeholder={isBeneficiary ? 'Optionnel...' : 'Détails supplementaires...'}
            style={{ width: '100%', minHeight: isBeneficiary ? 80 : 100, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' } as any} />
        </div>
        <div onClick={submit} data-testid="confirm-report-btn" style={{
          width: '100%', padding: '16px', borderRadius: 999, textAlign: 'center', cursor: allAnswered ? 'pointer' : 'not-allowed',
          background: allAnswered ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
          border: allAnswered ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          color: allAnswered ? '#10B981' : 'rgba(255,255,255,0.3)',
          fontSize: 16, fontWeight: 700, transition: 'all 0.25s',
          boxShadow: allAnswered ? '0 4px 20px rgba(16,185,129,0.2)' : 'none', boxSizing: 'border-box',
        } as any}>
          {allAnswered ? 'Confirmer la cloture' : 'Repondez a la question'}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------
   INTERVENANT POPUP  — ultra-glass overlay
   ------------------------------------------------------------------ */
function IntervenantPopup({ person, onClose }: { person: any; onClose: () => void }) {
  const dn = person?.name || 'Intervenant';
  const rows = [
    person?.phone && { icon: 'ri-phone-line', label: t('phone_label'), value: person.phone, phone: true },
    person?.email && { icon: 'ri-mail-line', label: t('email_label'), value: person.email },
    person?.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: person.profession },
    person?.structure_name && { icon: 'ri-building-line', label: t('structure'), value: person.structure_name },
    person?.address && { icon: 'ri-map-pin-line', label: t('address'), value: person.address },
    person?.distance_km && { icon: 'ri-route-line', label: 'Distance', value: `${person.distance_km} km` },
  ].filter(Boolean) as any[];

  return (
    <div onClick={onClose} data-testid="intervenant-popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} data-testid="close-intervenant-popup" style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{t('intervenant_card')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 } as any}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#A78BFA' }}>{dn.charAt(0)}</span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{dn}</div>
            {person?.profession && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{person.profession}</div>}
          </div>
        </div>
        {rows.map((item: any, i: number, arr: any[]) => (
          <div key={i}>
            <div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: item.phone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.08)', border: `1px solid ${item.phone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div>
              </div>
            </div>
            {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------
   DETAIL PAGE  — Full-screen alert detail (web)
   ------------------------------------------------------------------ */
function AlertDetailWeb({ alert, onClose, role, token, onRefresh, user }: { alert: any; onClose: () => void; role: string; token: string; onRefresh: () => void; user: any }) {
  const router = useRouter();
  const [alertDetail, setAlertDetail] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [showIntervenantPopup, setShowIntervenantPopup] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  useEffect(() => {
    apiFetch(`/api/alerts/${alert.id}/detail`, {}, token).then(setAlertDetail).catch((e) => { console.error('Alert detail error:', e); setTimeout(() => apiFetch(`/api/alerts/${alert.id}/detail`, {}, token).then(setAlertDetail).catch(() => {}), 2000); });
  }, [alert.id, token]);

  const isResolved = alert.status === 'resolved';
  const bgImg = isResolved ? BG_GREEN : BG_RED;
  const iv = alertDetail?.interventions?.[0];
  const hasAssigned = !!(iv?.assigned_to);

  const openIntervenantPopup = () => {
    if (hasAssigned && iv?.intervenant_profile) {
      setSelectedPerson(iv.intervenant_profile);
    } else if (hasAssigned) {
      setSelectedPerson({ name: iv?.assigned_name || 'Intervenant' });
    }
    setShowIntervenantPopup(true);
  };

  if (showReport) {
    return <ReportPage alert={alert} role={role} token={token} onClose={() => setShowReport(false)} onDone={() => { onRefresh(); onClose(); }} />;
  }

  /* - Slide button helper - */
  const SlideButton = ({ label, icon, color, bgColor, borderColor, onSlideComplete }: any) => (
    <div data-testid={`slide-btn-${label.replace(/\s+/g, '-').toLowerCase()}`}
      style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: bgColor, border: `1px solid ${borderColor}`, marginBottom: 12, touchAction: 'none' } as any}
      onMouseDown={(e: any) => {
        const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return;
        const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.clientX;
        const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); onSlideComplete(); } };
        const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
      }}
      onTouchStart={(e: any) => {
        e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return;
        const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX;
        const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); onSlideComplete(); } };
        const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
        bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp);
      }}>
      <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
        <i className={icon} style={{ fontSize: 20, color: color === '#FFF' ? '#111' : '#FFF' }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `${color}99`, fontSize: 16, fontWeight: 700, pointerEvents: 'none', paddingLeft: 36 } as any}>{label}</div>
    </div>
  );

  return (
    <div data-testid="alert-detail-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

      {/* Top bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '70px 16px 0', zIndex: 5, flexShrink: 0 } as any}>
        <div onClick={onClose} data-testid="back-from-detail" style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isResolved ? '#10B981' : '#EF4444' } as any} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isResolved ? t('alert_resolved') : t('alert_active')}</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as any}>
            <i className="ri-user-heart-line" style={{ fontSize: 28, color: '#FFF' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{alert.beneficiary_name || 'Bénéficiaire'}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
          {[
            { label: t('alert_type'), value: getAlertLabel(alert.alert_type, t), icon: 'ri-alarm-warning-line', color: '#EF4444' },
            { label: t('status'), value: isResolved ? t('resolved') : t(STATE_LABEL_MAP[alert.incident_state || alert.teleassistance_status] || 'active'), icon: isResolved ? 'ri-check-double-line' : 'ri-pulse-line', color: isResolved ? '#10B981' : '#F59E0B' },
            { label: t('device'), value: alert.device_type === 'bracelet' ? t('bracelet') : alert.device_type === 'vest' ? t('vest') : alert.device_type || '-', icon: 'ri-device-line', color: '#38BDF8' },
            { label: t('hour'), value: new Date(alert.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }), icon: 'ri-time-line', color: '#A78BFA' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}>
                <i className={item.icon} style={{ fontSize: 14, color: item.color }} />
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>{item.label}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Anomaly detail card */}
        <AnomalyCard alert={alert} />

        {/* Message */}
        {alert.message && (
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{t('message')}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF', lineHeight: 1.5 }}>{alert.message}</div>
          </div>
        )}

        {/* FICHE BENEFICIAIRE */}
        {alertDetail?.beneficiary && <BeneficiaireCard ben={alertDetail.beneficiary} />}

        {/* GARDIENS */}
        {alertDetail?.guardians && alertDetail.guardians.length > 0 && (
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Gardiens ({alertDetail.guardians.length})</div>
            {alertDetail.guardians.map((g: any, i: number) => (
              <div key={g.id}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                  <div style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{g.name?.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
                    {g.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{g.email}</div>}
                  </div>
                  {g.phone && (
                    <div onClick={() => window.location.href = `tel:${g.phone}`} style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                      <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* INTERVENTION CARD */}
        {iv && <InterventionCard iv={iv} hasAssigned={hasAssigned} alert={alert} onOpenPopup={openIntervenantPopup} />}

        {/* RESOLVED INFO */}
        {isResolved && <ResolvedSection alert={alertDetail?.alert || alert} alertDetail={alertDetail} />}

        {/* ACTION BUTTONS — inside scroll, not fixed */}
        {!isResolved && (
          <div style={{ marginTop: 16 } as any}>
            {/* Lancer navigation / Suivre intervention */}
            {hasAssigned && alert.intervention?.id && (
              <SlideButton
                label={alert.intervention?.assigned_to === user?.id ? 'Lancer la navigation' : 'Suivre l\'intervention'}
                icon={alert.intervention?.assigned_to === user?.id ? 'ri-navigation-line' : 'ri-heart-line'}
                color={alert.intervention?.assigned_to === user?.id ? '#FFF' : '#FFF'} bgColor="rgba(255,255,255,0.08)" borderColor="rgba(255,255,255,0.15)"
                onSlideComplete={() => router.push({ pathname: '/intervention-map', params: { interventionId: alert.intervention.id } })}
              />
            )}
            {/* Intervenir — guardian only, no intervenant */}
            {role === 'guardian' && !hasAssigned && (
              <SlideButton
                label="Intervenir" icon="ri-shield-check-line"
                color="#FFF" bgColor="rgba(255,255,255,0.05)" borderColor="rgba(255,255,255,0.1)"
                onSlideComplete={() => {
                  apiFetch('/api/interventions/accept-as-guardian', { method: 'POST', body: JSON.stringify({ alert_id: alert.id }) }, token)
                    .then((res: any) => { onRefresh(); router.push({ pathname: '/intervention-map', params: { interventionId: res?.intervention_id || '', alertId: alert.id } }); })
                    .catch(() => router.push({ pathname: '/intervention-map', params: { alertId: alert.id } }));
                }}
              />
            )}
            {/* Cloturer */}
            {(role === 'beneficiary' || role === 'guardian') && (
              <SlideButton
                label="Glisser pour cloturer" icon="ri-check-line"
                color="#10B981" bgColor="rgba(16,185,129,0.12)" borderColor="rgba(16,185,129,0.25)"
                onSlideComplete={() => setShowReport(true)}
              />
            )}
            {/* Téléassistance / Admin actions */}
            {(role === 'teleassistance' || role === 'admin') && (
              <div style={{ display: 'flex', gap: 10 } as any}>
                <div onClick={() => {
                  apiFetch('/api/teleassistance/escalation/start', { method: 'POST', body: JSON.stringify({ alert_id: alert.id }) }, token).then(() => onRefresh()).catch(() => {});
                }} data-testid="launch-carewatch-btn" style={{ flex: 1, padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 14, fontWeight: 700 } as any}>
                  Lancer Care Watch
                </div>
                <div onClick={() => {
                  apiFetch(`/api/alerts/${alert.id}/resolve`, { method: 'PUT' }, token).then(() => { onRefresh(); onClose(); }).catch(() => {});
                }} data-testid="cloturer-btn" style={{ flex: 1, padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', fontSize: 14, fontWeight: 700 } as any}>
                  Cloturer
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Intervenant popup — rendered as OVERLAY on top of detail page */}
      {showIntervenantPopup && selectedPerson && (
        <IntervenantPopup person={selectedPerson} onClose={() => { setShowIntervenantPopup(false); setSelectedPerson(null); }} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------
   SUB-COMPONENTS for detail page
   ------------------------------------------------------------------ */

function BeneficiaireCard({ ben }: { ben: any }) {
  const rows = [
    ben.date_of_birth && { icon: 'ri-calendar-line', label: t('date_of_birth'), value: ben.date_of_birth },
    ben.gender && { icon: 'ri-user-line', label: t('gender'), value: ben.gender },
    ben.blood_type && { icon: 'ri-drop-line', label: t('blood_type'), value: ben.blood_type, color: '#EF4444' },
    (ben.height_cm || ben.weight_kg) && { icon: 'ri-ruler-line', label: 'Morphologie', value: [ben.height_cm && `${ben.height_cm} cm`, ben.weight_kg && `${ben.weight_kg} kg`].filter(Boolean).join(' - ') },
    ben.medical_conditions && { icon: 'ri-heart-pulse-line', label: t('pathologies'), value: ben.medical_conditions, color: '#F59E0B', highlight: true },
    ben.allergies && { icon: 'ri-alarm-warning-line', label: t('allergies_label'), value: ben.allergies, color: '#EF4444', highlight: true },
    ben.doctor_name && { icon: 'ri-stethoscope-line', label: 'Médecin traitant', value: ben.doctor_name + (ben.doctor_phone ? ` — ${ben.doctor_phone}` : ''), phone: ben.doctor_phone },
    ben.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact d\'urgence', value: ben.emergency_contact_name + (ben.emergency_contact_phone ? ` — ${ben.emergency_contact_phone}` : ''), phone: ben.emergency_contact_phone },
    ben.address && { icon: 'ri-map-pin-line', label: t('address'), value: ben.address },
  ].filter(Boolean) as any[];

  return (
    <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 10 } as any}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('beneficiary_card_label')}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(ben.name || '?').charAt(0)}</span>
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{ben.name}</div>
          {ben.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{ben.phone}</div>}
          {ben.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{ben.email}</div>}
        </div>
      </div>
      {rows.map((item: any, i: number) => (
        <div key={i}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />
          {item.highlight ? (
            <div style={{ padding: '10px 12px', borderRadius: 12, background: `${item.color}12`, border: `1px solid ${item.color}25` } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                <i className={item.icon} style={{ fontSize: 14, color: item.color }} />
                <div style={{ fontSize: 9, fontWeight: 600, color: item.color, textTransform: 'uppercase' }}>{item.label}</div>
              </div>
              <div style={{ fontSize: 13, color: '#FFF', marginTop: 4, lineHeight: 1.4 }}>{item.value}</div>
            </div>
          ) : (
            <div onClick={() => item.phone && (window.location.href = `tel:${item.phone}`)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: item.phone ? 'pointer' : 'default', padding: '2px 0' } as any}>
              <i className={item.icon} style={{ fontSize: 14, color: item.color || 'rgba(255,255,255,0.35)', marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: '#FFF' }}>{item.value}</div>
              </div>
              {item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981', marginTop: 2 }} />}
            </div>
          )}
        </div>
      ))}
      {ben.phone && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />
          <div onClick={() => window.location.href = `tel:${ben.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}>
            <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Appeler {ben.name?.split(' ')[0]}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{ben.phone}</span>
          </div>
        </>
      )}
    </div>
  );
}

function InterventionCard({ iv, hasAssigned, alert, onOpenPopup }: { iv: any; hasAssigned: boolean; alert: any; onOpenPopup: () => void }) {
  const structure = iv.structure_name || iv.company_name || alert.intervener_info?.structure;
  const displayName = hasAssigned ? (iv.assigned_name || iv.intervenant_profile?.name || 'Intervenant') : (structure || 'Intervention Care');
  const statusLabel = iv.status === 'completed' ? 'Terminee' : iv.status === 'in_progress' ? t('in_progress') : iv.status === 'en_route' ? 'En route' : iv.status === 'pending_acceptance' ? 'En attente d\'acceptation' : iv.status || '';

  return (
    <div onClick={hasAssigned ? onOpenPopup : undefined} data-testid="intervention-card" style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 10, cursor: hasAssigned ? 'pointer' : 'default' } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>{hasAssigned ? 'Intervenant' : 'Intervention Care'}</div>
        <div style={{ display: 'flex', gap: 6 } as any}>
          {structure && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}
          {hasAssigned && <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
        <div style={{ width: 44, height: 44, borderRadius: 16, background: hasAssigned ? 'rgba(124,92,255,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${hasAssigned ? 'rgba(124,92,255,0.3)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          {hasAssigned ? <span style={{ fontSize: 18, fontWeight: 800, color: '#A78BFA' }}>{displayName.charAt(0)}</span> : <i className="ri-building-line" style={{ fontSize: 20, color: '#A78BFA' }} />}
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{displayName}</div>
          {hasAssigned && structure && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{structure}</div>}
          {!hasAssigned && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{statusLabel}</div>}
        </div>
      </div>
      {/* Stats row */}
      {(iv.distance_km || iv.accepted_at || iv.created_at) && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 } as any}>
            {iv.distance_km && <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' } as any}><div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Distance</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{iv.distance_km} km</div></div>}
            {hasAssigned && iv.accepted_at && <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' } as any}><div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Accepte</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{new Date(iv.accepted_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div>}
            {!hasAssigned && iv.created_at && <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' } as any}><div style={{ fontSize: 8, fontWeight: 600, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Envoye</div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{new Date(iv.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div>}
          </div>
        </>
      )}
    </div>
  );
}

function ResolvedSection({ alert, alertDetail }: { alert: any; alertDetail: any }) {
  const ivReport = alert.intervention_report || alertDetail?.interventions?.[0]?.report;
  const G: any = { borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 10, padding: '14px 16px' };
  return (
    <div style={{ marginTop: 6 } as any}>
      {/* Resolution summary */}
      <div style={{ ...G } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
          <i className="ri-check-double-line" style={{ fontSize: 14, color: '#10B981' }} />
          <div style={{ fontSize: 10, fontWeight: 600, color: '#10B981', letterSpacing: 1, textTransform: 'uppercase' }}>{t('resolution')}</div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{t('resolved_on')} {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />
        {alert.resolved_by_name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t('by')} {alert.resolved_by_name}</div>}
        {alert.created_at && alert.resolved_at && (() => {
          const dur = Math.round((new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime()) / 60000);
          return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginTop: 8 } as any}><i className="ri-time-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{t('duration')} : {dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? String(dur % 60).padStart(2, '0') : ''}` : `${dur} ${t('min')}`}</span></div>;
        })()}
      </div>

      {/* Rapport de Nora */}
      {alert.call_report && (
        <div style={{ ...G, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' } as any}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#A78BFA', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <i className="ri-phone-line" style={{ fontSize: 14 }} />{t('nora_report')}
          </div>
          {alert.call_report.call_summary && (
            <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: 8 } as any}>
              <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{alert.call_report.call_summary}</div>
            </div>
          )}
          {(alert.call_report.patient_ok || alert.call_report.needs_help || alert.call_report.medical_issue || (alert.call_report.urgency_level && alert.call_report.urgency_level !== 'none')) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 } as any}>
              {alert.call_report.patient_ok && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 10, fontWeight: 700, color: '#10B981' } as any}>Patient OK</div>}
              {alert.call_report.needs_help && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 10, fontWeight: 700, color: '#EF4444' } as any}>Besoin d'aide</div>}
              {alert.call_report.medical_issue && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 10, fontWeight: 700, color: '#F59E0B' } as any}>{alert.call_report.medical_issue}</div>}
              {alert.call_report.urgency_level && alert.call_report.urgency_level !== 'none' && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 10, fontWeight: 700, color: '#EF4444' } as any}>Urgence: {alert.call_report.urgency_level}</div>}
            </div>
          )}
          {alert.call_report.recording_url && (
            <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className="ri-mic-line" style={{ fontSize: 16, color: '#A78BFA' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{t('call_recording')}</div>
                <audio controls preload="none" style={{ width: '100%', height: 32, borderRadius: 8, display: 'block', filter: 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9)' } as any}>
                  <source src={alert.call_report.recording_url} type="audio/wav" />
                </audio>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intervention report — only if has real content */}
      {ivReport && ivReport.description && (
        <div style={{ ...G } as any}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('intervention_report_label')}</div>
          <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{ivReport.description}</div>
        </div>
      )}

      {/* Closure report — only if has real answers */}
      {alert.report?.answers && Object.keys(alert.report.answers).filter(k => !['notes', 'closed_by', 'closed_at', 'closed_by_role'].includes(k)).length > 0 && (
        <div style={{ ...G } as any}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Rapport de cloture</div>
          {Object.entries(alert.report.answers).filter(([k]) => !['notes', 'closed_by', 'closed_at', 'closed_by_role'].includes(k)).map(([key, val]: any, i: number, arr: any[]) => (
            <div key={key}>
              <div style={{ padding: '10px 0' } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{key === 'situation' ? 'Situation' : key === 'actions' ? 'Actions' : key === 'condition' ? 'Etat' : key === 'reason' ? 'Raison' : key}</div>
                <div style={{ fontSize: 13, color: '#FFF' }}>{val}</div>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}
            </div>
          ))}
          {alert.report.answers.notes && <><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' } as any} /><div style={{ padding: '8px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>Note</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{alert.report.answers.notes}</div></div></>}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' } as any} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', paddingTop: 4 }}>Cloture par {alert.report.answers.closed_by || alert.report.closed_by_name || '-'} ({alert.report.answers.closed_by_role || 'gardien'})</div>
        </div>
      )}

      {/* Chronologie */}
      {alertDetail?.timeline && alertDetail.timeline.filter((t: any) => t.detail).length > 0 && (
        <div style={{ ...G } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
            <i className="ri-history-line" style={{ fontSize: 14, color: '#38BDF8' }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: '#38BDF8', letterSpacing: 1, textTransform: 'uppercase' }}>{t('timeline')}</div>
          </div>
          {alertDetail.timeline.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 } as any}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 } as any}>
                <div style={{ width: 24, height: 24, borderRadius: 99, background: t.color ? `${t.color}20` : i === alertDetail.timeline.length - 1 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${t.color ? `${t.color}40` : i === alertDetail.timeline.length - 1 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={t.icon || (i === alertDetail.timeline.length - 1 ? 'ri-check-line' : 'ri-circle-fill')} style={{ fontSize: t.icon ? 12 : 6, color: t.color || (i === alertDetail.timeline.length - 1 ? '#10B981' : 'rgba(255,255,255,0.3)') }} />
                </div>
                {i < alertDetail.timeline.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: 4 } as any} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 4 } as any}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{t.detail}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t.time ? new Date(t.time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================================================
   PRO MESSAGING  — WhatsApp-like messaging for Coach/Physio
   ======================================================================== */
function ProMessaging({ token, user }: { token: string; user: any }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [msgTab, setMsgTab] = useState<'conversations' | 'history'>('conversations');
  const [loading, setLoading] = useState(true);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCoach = user?.professional_type === 'coach';
  const accentColor = isCoach ? '#DC2626' : '#F97316';

  const fetchConversations = useCallback(async () => {
    try {
      const convos = await apiFetch('/api/pro/conversations', {}, token);
      const convoList = Array.isArray(convos) ? convos : [];
      // Auto-add beneficiaries that don't have a conversation yet
      try {
        const bens = await apiFetch('/api/guardian/beneficiaries', {}, token);
        if (Array.isArray(bens)) {
          const existingBenIds = new Set(convoList.map((c: any) => c.beneficiary_id || c.other_user_id));
          for (const ben of bens) {
            if (!existingBenIds.has(ben.id)) {
              convoList.push({ id: `new_${ben.id}`, beneficiary_id: ben.id, beneficiary_name: ben.name, other_user_id: ben.id, last_message: '', is_placeholder: true });
            }
          }
        }
      } catch {}
      setConversations(convoList);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const openConvo = async (convo: any) => {
    // If placeholder (no real conversation yet), create one via API
    if (convo.is_placeholder && convo.beneficiary_id) {
      try {
        const realConvo = await apiFetch(`/api/pro/conversations/${convo.beneficiary_id}`, {}, token);
        if (realConvo?.id) {
          setActiveConvo(realConvo);
          const msgs = await apiFetch(`/api/pro/messages/${realConvo.id}`, {}, token);
          setMessages(Array.isArray(msgs) ? msgs : []);
          setTimeout(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); }, 100);
          return;
        }
      } catch {}
    }
    setActiveConvo(convo);
    try {
      const msgs = await apiFetch(`/api/pro/messages/${convo.id}`, {}, token);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch {}
    setTimeout(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); }, 100);
  };

  useEffect(() => {
    if (!activeConvo?.id) return;
    const iv = setInterval(async () => {
      try {
        const msgs = await apiFetch(`/api/pro/messages/${activeConvo.id}`, {}, token);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch {}
    }, 4000);
    return () => clearInterval(iv);
  }, [activeConvo?.id, token]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!newMsg.trim() || !activeConvo?.id) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/api/pro/messages/${activeConvo.id}`, { method: 'POST', body: JSON.stringify({ content: newMsg }) }, token);
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
      inputRef.current?.focus();
    } catch {} finally { setSending(false); }
  };

  const BG_IMAGE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

  if (loading) return null;

  return (
    <div data-testid="pro-messaging" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>

      {!activeConvo ? (
        /* CONVERSATION LIST VIEW */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } as any}>
          {/* Header - centré vertical */}
          <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 } as any}>
            <img src={BG_IMAGE} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(255,255,255,0.2)' } as any}>
                <i className="ri-chat-3-fill" style={{ fontSize: 22, color: '#FFF' }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, marginBottom: 4 }}>Messagerie</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</div>

              {/* Pill tabs Conversations / Historique */}
              <div data-testid="msg-tabs" style={{ display: 'inline-flex', borderRadius: 999, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', padding: 3, gap: 2 } as any}>
                <div data-testid="msg-tab-convos" onClick={() => setMsgTab('conversations')}
                  style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.25s ease',
                    background: msgTab === 'conversations' ? '#FFF' : 'transparent',
                    boxShadow: msgTab === 'conversations' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: msgTab === 'conversations' ? '#111' : 'rgba(255,255,255,0.5)',
                  } as any}>
                  Conversations
                </div>
                <div data-testid="msg-tab-history" onClick={() => setMsgTab('history')}
                  style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.25s ease',
                    background: msgTab === 'history' ? '#FFF' : 'transparent',
                    boxShadow: msgTab === 'history' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: msgTab === 'history' ? '#111' : 'rgba(255,255,255,0.5)',
                  } as any}>
                  Historique
                </div>
              </div>
            </div>
          </div>

          {/* Content card with rounded top */}
          <div data-testid="convo-list" style={{ flex: 1, overflowY: 'auto', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(0,0,0,0.08)', padding: '20px 16px 80px' } as any}>

          {msgTab === 'history' ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' } as any}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
                <i className="ri-history-line" style={{ fontSize: 28, color: '#9CA3AF' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>Historique des conversations</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>Les conversations archivees apparaitront ici.</div>
            </div>
          ) : (
            <>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' } as any}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
                <i className="ri-chat-3-line" style={{ fontSize: 28, color: '#9CA3AF' }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 6 }}>Aucune conversation</div>
              <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>Les conversations apparaitront ici lorsque des beneficiaires souscriront a un abonnement.</div>
            </div>
          ) : (
            conversations.map((convo) => {
              const otherName = convo.beneficiary_name || convo.professional_name || 'Bénéficiaire';
              const lastMsg = convo.last_message || '';
              const lastTime = convo.last_message_at ? new Date(convo.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
              const unread = convo.unread_count || 0;
              return (
                <div key={convo.id} data-testid={`convo-${convo.id}`} onClick={() => openConvo(convo)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px', borderRadius: 16, cursor: 'pointer', marginBottom: 4, transition: 'background 0.15s', background: 'transparent', borderBottom: '1px solid #F3F4F6' } as any}
                  onMouseEnter={(e: any) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${accentColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${accentColor}20` } as any}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: accentColor }}>{otherName.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 } as any}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{otherName}</div>
                      {lastTime && <span style={{ fontSize: 11, color: unread > 0 ? accentColor : '#9CA3AF', fontWeight: unread > 0 ? 700 : 400 }}>{lastTime}</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                      <div style={{ fontSize: 13, color: unread > 0 ? '#374151' : '#9CA3AF', fontWeight: unread > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 } as any}>{lastMsg || 'Aucun message'}</div>
                      {unread > 0 && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#FFF' }}>{unread}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
            </>
          )}
          </div>
        </div>
      ) : (
        /* CHAT VIEW */
        <>
          {/* Chat header */}
          <div data-testid="chat-header" style={{ padding: '12px 16px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #F3F4F6', background: '#FFF' } as any}>
            <div data-testid="back-to-convos" onClick={() => { setActiveConvo(null); setMessages([]); }}
              style={{ width: 36, height: 36, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#6B7280' }} />
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${accentColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <span style={{ fontSize: 16, fontWeight: 800, color: accentColor }}>{(activeConvo.beneficiary_name || activeConvo.professional_name || '?').charAt(0)}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{activeConvo.beneficiary_name || activeConvo.professional_name || 'Bénéficiaire'}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>En ligne</div>
            </div>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', background: '#F9FAFB', display: 'flex', flexDirection: 'column' } as any}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', margin: 'auto 0', padding: '40px 20px' } as any}>
                <i className="ri-chat-smile-2-line" style={{ fontSize: 40, color: '#D1D5DB', display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 14, color: '#9CA3AF' }}>Commencez la conversation</div>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6 } as any}>
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe ? accentColor : '#FFF',
                    color: isMe ? '#FFF' : '#111',
                    boxShadow: isMe ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                  } as any}>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{msg.content}</div>
                    <div style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.6)' : '#9CA3AF', marginTop: 4, textAlign: 'right' } as any}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <i className="ri-check-double-line" style={{ marginLeft: 4, fontSize: 10 }} />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={msgEndRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '12px 16px 100px', flexShrink: 0, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, alignItems: 'center', background: '#FFF' } as any}>
            <input ref={inputRef} data-testid="pro-msg-input" value={newMsg} onChange={(e: any) => setNewMsg(e.target.value)}
              onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Votre message..."
              style={{ flex: 1, padding: '13px 18px', borderRadius: 999, background: '#F3F4F6', border: '1.5px solid #E5E7EB', color: '#111', fontSize: 15, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' } as any} />
            <div data-testid="pro-msg-send" onClick={sending ? undefined : send}
              style={{ width: 46, height: 46, borderRadius: '50%', background: newMsg.trim() ? accentColor : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.5 : 1, transition: 'background 0.15s' } as any}>
              <i className="ri-send-plane-fill" style={{ fontSize: 18, color: newMsg.trim() ? '#FFF' : '#9CA3AF' }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ========================================================================
   MAIN EXPORT  — AlertsScreen
   ======================================================================== */
export default function AlertsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { preselect } = useLocalSearchParams<{ preselect?: string }>();
  const r = user?.active_role || user?.role || '';

  // Coach/Physio: show messaging instead of alerts (unless navigating to a specific alert)
  const isCoachOrPhysio = user?.professional_type === 'coach' || user?.professional_type === 'physio';

  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'resolved'>('active');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showExplainer, setShowExplainer] = useState(false);

  if (isCoachOrPhysio && token && Platform.OS === 'web' && !preselect) {
    return <ProMessaging token={token} user={user} />;
  }

  const fetchAlerts = useCallback(async () => {
    try {
      const isAdmin = r === 'admin';
      const isCompany = r === 'prescriber_company';
      const alertsUrl = isAdmin ? '/api/backoffice/alerts' : isCompany ? '/api/company/alerts' : '/api/alerts';
      const [all, active] = await Promise.all([
        apiFetch(alertsUrl, {}, token).catch(() => []),
        isCompany ? apiFetch('/api/company/alerts', {}, token).catch(() => []) : apiFetch('/api/alerts/active-with-interventions', {}, token).catch(() => []),
      ]);
      setAlerts(Array.isArray(all) ? all : []);
      setActiveAlerts(isCompany ? (Array.isArray(all) ? all : []).filter((a: any) => a.status === 'active') : Array.isArray(active) ? active : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token, r]);

  useEffect(() => { fetchAlerts(); const t = setInterval(fetchAlerts, 10000); return () => clearInterval(t); }, [fetchAlerts]);

  // Auto-ouvrir une alerte depuis un lien externe (ex: fiche bénéficiaire)
  useEffect(() => {
    if (preselect && alerts.length > 0) {
      const found = alerts.find((a: any) => a.id === preselect);
      if (found) {
        if (found.status === 'resolved') setTab('resolved');
        setSelectedAlert(found);
      }
    }
  }, [preselect, alerts]);

  const resolved = alerts.filter(a => a.status === 'resolved');
  const filtered = tab === 'active' ? activeAlerts : resolved;

  /* - Web: full-screen sub-pages via early returns - */
  if (Platform.OS === 'web') {
    if (showExplainer) return <ExplainerPage onClose={() => setShowExplainer(false)} role={r} />;
    if (selectedAlert) return (
      <AlertDetailWeb
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        role={r}
        token={token}
        onRefresh={() => { fetchAlerts(); }}
        user={user}
      />
    );
  }

  if (loading) return null;

  /* - Web list page - */
  if (Platform.OS === 'web' && (r === 'guardian' || r === 'beneficiary' || r === 'prescriber_company' || r === 'admin' || r === 'teleassistance')) {
    return (
      <div data-testid="alerts-list-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}>
          <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        </div>
        {/* Header */}
        <div style={{ position: 'relative', padding: '24px 20px 20px', textAlign: 'center', zIndex: 5, flexShrink: 0 } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>{t('alerts_title')}</div>
          <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
            <div onClick={() => setTab('active')} data-testid="tab-active" style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: tab === 'active' ? '#FFF' : 'transparent', color: tab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' } as any}>En cours ({activeAlerts.length})</div>
            <div onClick={() => setTab('resolved')} data-testid="tab-resolved" style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: tab === 'resolved' ? '#FFF' : 'transparent', color: tab === 'resolved' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' } as any}>Cloturees ({resolved.length})</div>
          </div>
          <div onClick={() => setShowExplainer(true)} data-testid="comprendre-alertes-btn" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
            <i className="ri-book-open-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Comprendre les alertes</span>
          </div>
        </div>
        {/* Cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 100px', position: 'relative', zIndex: 5 } as any}>
          {filtered.length > 0 ? filtered.map((alert: any) => {
            const isActive = alert.status === 'active';
            const hasIntervention = !!(alert.intervention?.id);
            const hasAssignedIntervenant = !!(alert.intervener_info || alert.care_provider || alert.intervention?.assigned_to);
            const iAmAssignedAlert = alert.intervention?.assigned_to === user?.id;
            const alertTypeLabel = getAlertLabel(alert.alert_type, t);
            return (
              <div key={alert.id} data-testid={`alert-card-${alert.id}`} style={{ borderRadius: 20, position: 'relative', padding: '18px 16px', marginBottom: 12, minHeight: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'transform 0.15s' } as any}>
                {/* Clickable card area */}
                <div onClick={() => setSelectedAlert(alert)} style={{ cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{alert.beneficiary_name || 'Bénéficiaire'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Le {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)', flexShrink: 0 } as any}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: isActive ? '#EF4444' : '#10B981' } as any} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{isActive ? 'Alerte active' : t('resolved')}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (isActive && (hasIntervention && hasAssignedIntervenant)) ? 12 : ((isActive && r === 'guardian' && !hasAssignedIntervenant) ? 12 : 0) } as any}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{alertTypeLabel}</div>
                    {alert.intervention?.distance_km && <div style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{alert.intervention.distance_km} Km</span></div>}
                  </div>
                </div>
                {/* Slide button — Suivre if assigned, Intervenir if guardian + no assigned */}
                {isActive && hasIntervention && hasAssignedIntervenant && (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => {
                      e.stopPropagation();
                      const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return;
                      const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX;
                      const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: alert.intervention.id } }); } };
                      const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                    }}
                    onTouchStart={(e: any) => {
                      e.stopPropagation();
                      const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return;
                      const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX;
                      const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: alert.intervention.id } }); } };
                      const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
                      bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp);
                    }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: iAmAssignedAlert ? '#FFF' : 'rgba(255,255,255,0.15)', border: iAmAssignedAlert ? 'none' : '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none', boxShadow: iAmAssignedAlert ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' } as any}>
                      <i className={iAmAssignedAlert ? 'ri-navigation-line' : 'ri-heart-line'} style={{ fontSize: 18, color: iAmAssignedAlert ? '#111' : '#FFF' }} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>{iAmAssignedAlert ? 'Lancer la navigation' : 'Suivre l\'intervention'}</div>
                  </div>
                )}
                {/* Intervenir — guardian only, no assigned intervenant */}
                {isActive && r === 'guardian' && !hasAssignedIntervenant && (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => {
                      e.stopPropagation();
                      const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return;
                      const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX;
                      const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); apiFetch('/api/interventions/accept-as-guardian', { method: 'POST', body: JSON.stringify({ alert_id: alert.id }) }, token).then((res: any) => { fetchAlerts(); router.push({ pathname: '/intervention-map', params: { interventionId: res?.intervention_id || '', alertId: alert.id } }); }).catch(() => router.push({ pathname: '/intervention-map', params: { alertId: alert.id } })); } };
                      const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                      document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                    }}
                    onTouchStart={(e: any) => {
                      e.stopPropagation();
                      const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return;
                      const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX;
                      const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); apiFetch('/api/interventions/accept-as-guardian', { method: 'POST', body: JSON.stringify({ alert_id: alert.id }) }, token).then((res: any) => { fetchAlerts(); router.push({ pathname: '/intervention-map', params: { interventionId: res?.intervention_id || '', alertId: alert.id } }); }).catch(() => router.push({ pathname: '/intervention-map', params: { alertId: alert.id } })); } };
                      const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
                      bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp);
                    }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', willChange: 'transform', touchAction: 'none' } as any}>
                      <i className="ri-shield-check-line" style={{ fontSize: 18, color: '#111' }} />
                    </div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Intervenir</div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '60px 20px' } as any}>
              <i className={tab === 'active' ? 'ri-shield-check-line' : 'ri-archive-line'} style={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 16 }}>{tab === 'active' ? 'Tout va bien !' : 'Aucun historique'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{tab === 'active' ? 'Aucune alerte active' : 'Les alertes resolues apparaitront ici'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* - Native: intervenant role uses FlatList - */
  if (r === 'care_intervenant') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 16, letterSpacing: -0.5 }}>{t('alerts_title')}</Text>
        <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 14, padding: 3, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setTab('active')} style={{ flex: 1, backgroundColor: tab === 'active' ? '#111' : 'transparent', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'active' ? '#FFF' : '#6B7280' }}>En cours ({activeAlerts.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('resolved')} style={{ flex: 1, backgroundColor: tab === 'resolved' ? '#111' : 'transparent', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'resolved' ? '#FFF' : '#6B7280' }}>Cloturees ({resolved.length})</Text>
          </TouchableOpacity>
        </View>
        {filtered.length > 0 ? filtered.map((item: any) => (
          <TouchableOpacity key={item.id} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })} style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: item.status === 'active' ? '#EF4444' : '#10B981' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>{item.beneficiary_name || item.message || 'Alerte'}</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
          </TouchableOpacity>
        )) : (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Icon name={tab === 'active' ? 'checkmark-circle' : 'archive-outline'} size={32} color="#10B981" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', marginTop: 12 }}>{tab === 'active' ? 'Tout va bien !' : 'Aucun historique'}</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>{tab === 'active' ? 'Aucune alerte active' : 'Les alertes resolues apparaitront ici'}</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  /* - Fallback for other roles (native) - */
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: -0.5 }}>{t('alerts_title')}</Text>
      </View>
      <FlatList data={filtered} keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })} style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: item.status === 'active' ? '#EF4444' : '#10B981' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111' }}>{item.message || 'Alerte'}</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{item.beneficiary_name} · {new Date(item.created_at).toLocaleDateString('fr-FR')}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 48 }}><Text style={{ color: '#6B7280' }}>Aucune alerte</Text></View>}
      />
    </View>
  );
}
