import { Icon } from '../../src/components/WebIcon';
import FullScreenLoader from '../../src/components/FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';

const STATE_LABEL: Record<string, string> = {
  IDLE: 'En attente', CALLING_PATIENT: 'Appel patient', CALLING_GUARDIANS: 'Appel gardiens',
  CARE_DISPATCHED: 'Intervenant envoye', RESOLVED: 'Resolue',
};

/* Clean alert type label */
const getAlertLabel = (t: string) => {
  if (t === 'fall') return 'Chute detectee (gilet)';
  if (t === 'manual_app') return 'Bouton SOS (application)';
  if (t === 'manual_bracelet') return 'Pression manuelle (bracelet)';
  if (t === 'sos') return 'Bouton SOS';
  if (t === 'heart_rate' || t === 'health_anomaly') return 'Anomalie de sante detectee';
  if (t === 'spo2') return 'Anomalie de sante detectee';
  if (t === 'threshold') return 'Depassement de seuil';
  if (t === 'inactivity') return 'Inactivite detectee';
  return t || 'Alerte';
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
  if (vd.temperature || td.temperature_max) items.push({ label: 'Temperature', value: vd.temperature ? `${vd.temperature}°C` : '?', threshold: td.temperature_max ? `Seuil : ${td.temperature_max}°C` : '', icon: 'ri-temp-hot-line', color: '#F59E0B' });
  if (items.length === 0 && !hasVitalData) {
    // Fallback: show a generic anomaly message from the alert message
    return (
      <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 10 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className="ri-alert-line" style={{ fontSize: 16, color: '#EF4444' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase' }}>Anomalie detectee</span></div>
        <div style={{ fontSize: 14, color: '#FFF', marginTop: 6, lineHeight: 1.4 }}>{msg}</div>
      </div>
    );
  }
  return (
    <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 10 } as any}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#EF4444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Anomalie detectee</div>
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

/* ────────────────────────────────────────────────────────────────────
   EXPLAINER PAGE  — "Comprendre les alertes"
   ──────────────────────────────────────────────────────────────────── */
function ExplainerPage({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: 'ri-alarm-warning-line', title: 'Declenchement', desc: 'Une alerte se declenche automatiquement via un appareil connecte (chute, anomalie cardiaque) ou manuellement par le bouton SOS du beneficiaire.', color: '#EF4444' },
    { icon: 'ri-phone-line', title: 'Appel automatique', desc: 'Le plateau de teleassistance CARE WATCH est immediatement notifie. Un operateur appelle le beneficiaire pour evaluer la situation.', color: '#F59E0B' },
    { icon: 'ri-group-line', title: 'Notification des gardiens', desc: 'Tous les gardiens du beneficiaire recoivent une notification en temps reel avec les details de l\'alerte.', color: '#3B82F6' },
    { icon: 'ri-map-pin-range-line', title: 'Envoi d\'un intervenant', desc: 'Si necessaire, un intervenant Care est envoye sur place. Il peut etre suivi en temps reel sur la carte par les gardiens.', color: '#8B5CF6' },
    { icon: 'ri-file-text-line', title: 'Rapport de cloture', desc: 'L\'alerte est cloturee avec un rapport detaille : etat du beneficiaire, actions realisees et notes. Le rapport est accessible a tous les gardiens.', color: '#10B981' },
  ];
  const roles = [
    { icon: 'ri-user-heart-line', role: 'Beneficiaire', actions: ['Declencher un SOS', 'Recevoir l\'appel du plateau', 'Cloturer l\'alerte a tout moment'] },
    { icon: 'ri-shield-check-line', role: 'Gardien / Prescripteur', actions: ['Recevoir les notifications', 'Intervenir si aucun intervenant assigne', 'Cloturer l\'alerte', 'Suivre l\'intervenant en temps reel'] },
    { icon: 'ri-first-aid-kit-line', role: 'Intervenant Care', actions: ['Accepter ou refuser une intervention', 'Se rendre sur place', 'Rediger le rapport de cloture'] },
    { icon: 'ri-headphone-line', role: 'Teleassistance', actions: ['Gerer le flux d\'appels', 'Escalader les situations critiques', 'Coordonner les intervenants'] },
  ];
  return (
    <div data-testid="comprendre-alertes-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0', zIndex: 5 } as any}>
        <div data-testid="back-from-explainer" onClick={onClose} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#FFF' }}>Comprendre les alertes</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
            <i className="ri-shield-check-line" style={{ fontSize: 32, color: '#FFF' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Le processus CARE WATCH</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>De l'alerte a la resolution, chaque etape est concue pour assurer la securite de vos proches.</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Les 5 etapes</div>
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
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 12 }}>Roles et permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
          {roles.map((ro, i) => (
            <div key={i} style={{ padding: '16px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                <i className={ro.icon} style={{ fontSize: 20, color: '#FFF' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ro.role}</div>
              </div>
              {ro.actions.map((a, j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 } as any}>
                  <i className="ri-check-line" style={{ fontSize: 12, color: '#10B981' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{a}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, marginTop: 20 }}>Questions frequentes</div>
        {[
          { q: 'Que se passe-t-il si je declenche un SOS par erreur ?', a: 'Vous pouvez cloturer l\'alerte immediatement depuis l\'application. Le plateau sera notifie de l\'annulation.' },
          { q: 'Combien de temps avant l\'arrivee d\'un intervenant ?', a: 'Le delai depend de votre localisation. En zone urbaine, comptez 15 a 30 minutes en moyenne.' },
          { q: 'Puis-je voir la position de l\'intervenant ?', a: 'Oui, les gardiens peuvent suivre l\'intervenant en temps reel sur la carte de l\'application.' },
          { q: 'Les alertes sont-elles archivees ?', a: 'Oui, toutes les alertes cloturees restent accessibles avec leur rapport dans l\'onglet "Cloturees".' },
        ].map((faq, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 6 }}>{faq.q}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{faq.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   REPORT PAGE  — Rapport de cloture
   ──────────────────────────────────────────────────────────────────── */
function ReportPage({ alert, role, token, onClose, onDone }: { alert: any; role: string; token: string; onClose: () => void; onDone: () => void }) {
  const [reportText, setReportText] = useState('');
  const [reportAnswers, setReportAnswers] = useState<Record<string, string>>({});
  const user = useAuth().user;

  const isBeneficiary = role === 'beneficiary';
  const reportQuestions = isBeneficiary ? [
    { id: 'reason', label: 'Pourquoi cloturez-vous cette alerte ?', options: ['Fausse alerte / Erreur de manipulation', 'Je vais bien, pas besoin d\'aide', 'L\'aide est deja arrivee', 'Autre raison'] },
  ] : [
    { id: 'situation', label: 'La situation est-elle maitrisee ?', options: ['Oui, situation resolue', 'Partiellement, surveillance necessaire', 'Non, necessite un suivi'] },
    { id: 'actions', label: 'Actions realisees', options: ['Levee de doute telephonique', 'Intervention physique au domicile', 'Contact avec les secours (SAMU/Pompiers)', 'Contact avec le medecin traitant', 'Aucune action necessaire'] },
    { id: 'condition', label: 'Etat du beneficiaire', options: ['Stable - pas de blessure', 'Blessure legere - soins apportes', 'Necessitant un suivi medical', 'Hospitalisation necessaire'] },
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
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
          <textarea value={reportText} onChange={(e: any) => setReportText(e.target.value)} placeholder={isBeneficiary ? 'Optionnel...' : 'Details supplementaires...'}
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

/* ────────────────────────────────────────────────────────────────────
   INTERVENANT POPUP  — ultra-glass overlay
   ──────────────────────────────────────────────────────────────────── */
function IntervenantPopup({ person, onClose }: { person: any; onClose: () => void }) {
  const dn = person?.name || 'Intervenant';
  const rows = [
    person?.phone && { icon: 'ri-phone-line', label: 'Telephone', value: person.phone, phone: true },
    person?.email && { icon: 'ri-mail-line', label: 'Email', value: person.email },
    person?.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: person.profession },
    person?.structure_name && { icon: 'ri-building-line', label: 'Structure', value: person.structure_name },
    person?.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: person.address },
    person?.distance_km && { icon: 'ri-route-line', label: 'Distance', value: `${person.distance_km} km` },
  ].filter(Boolean) as any[];

  return (
    <div onClick={onClose} data-testid="intervenant-popup-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} data-testid="close-intervenant-popup" style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Fiche intervenant</div>
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

/* ────────────────────────────────────────────────────────────────────
   DETAIL PAGE  — Full-screen alert detail (web)
   ──────────────────────────────────────────────────────────────────── */
function AlertDetailWeb({ alert, onClose, role, token, onRefresh, user }: { alert: any; onClose: () => void; role: string; token: string; onRefresh: () => void; user: any }) {
  const router = useRouter();
  const [alertDetail, setAlertDetail] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [showIntervenantPopup, setShowIntervenantPopup] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  useEffect(() => {
    apiFetch(`/api/alerts/${alert.id}/detail`, {}, token).then(setAlertDetail).catch(() => {});
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

  /* ── Slide button helper ── */
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
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5, flexShrink: 0 } as any}>
        <div onClick={onClose} data-testid="back-from-detail" style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: isResolved ? '#10B981' : '#EF4444' } as any} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isResolved ? 'Alerte resolue' : 'Alerte active'}</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as any}>
            <i className="ri-user-heart-line" style={{ fontSize: 28, color: '#FFF' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{alert.beneficiary_name || 'Beneficiaire'}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
          {[
            { label: 'Type', value: getAlertLabel(alert.alert_type) },
            { label: 'Statut', value: isResolved ? 'Resolue' : STATE_LABEL[alert.incident_state || alert.teleassistance_status] || 'Active' },
            { label: 'Appareil', value: alert.device_type || '-' },
            { label: 'Heure', value: new Date(alert.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
          ].map((item, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Anomaly detail card */}
        <AnomalyCard alert={alert} />

        {/* Message */}
        {alert.message && (
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Message</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF', lineHeight: 1.5 }}>{alert.message}</div>
          </div>
        )}

        {/* FICHE BENEFICIAIRE */}
        {alertDetail?.beneficiary && <BeneficiaireCard ben={alertDetail.beneficiary} />}

        {/* GARDIENS */}
        {alertDetail?.guardians && alertDetail.guardians.length > 0 && (
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
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
        {isResolved && <ResolvedSection alert={alert} alertDetail={alertDetail} />}

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
            {/* Teleassistance / Admin actions */}
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

/* ────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS for detail page
   ──────────────────────────────────────────────────────────────────── */

function BeneficiaireCard({ ben }: { ben: any }) {
  const rows = [
    ben.date_of_birth && { icon: 'ri-calendar-line', label: 'Date de naissance', value: ben.date_of_birth },
    ben.gender && { icon: 'ri-user-line', label: 'Genre', value: ben.gender },
    ben.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: ben.blood_type, color: '#EF4444' },
    (ben.height_cm || ben.weight_kg) && { icon: 'ri-ruler-line', label: 'Morphologie', value: [ben.height_cm && `${ben.height_cm} cm`, ben.weight_kg && `${ben.weight_kg} kg`].filter(Boolean).join(' - ') },
    ben.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: ben.medical_conditions, color: '#F59E0B', highlight: true },
    ben.allergies && { icon: 'ri-alarm-warning-line', label: 'Allergies', value: ben.allergies, color: '#EF4444', highlight: true },
    ben.doctor_name && { icon: 'ri-stethoscope-line', label: 'Medecin traitant', value: ben.doctor_name + (ben.doctor_phone ? ` — ${ben.doctor_phone}` : ''), phone: ben.doctor_phone },
    ben.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact d\'urgence', value: ben.emergency_contact_name + (ben.emergency_contact_phone ? ` — ${ben.emergency_contact_phone}` : ''), phone: ben.emergency_contact_phone },
    ben.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: ben.address },
  ].filter(Boolean) as any[];

  return (
    <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Fiche beneficiaire</div>
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
  const statusLabel = iv.status === 'completed' ? 'Terminee' : iv.status === 'in_progress' ? 'En cours' : iv.status === 'en_route' ? 'En route' : iv.status === 'pending_acceptance' ? 'En attente d\'acceptation' : iv.status || '';

  return (
    <div onClick={hasAssigned ? onOpenPopup : undefined} data-testid="intervention-card" style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, cursor: hasAssigned ? 'pointer' : 'default' } as any}>
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
  return (
    <div style={{ marginTop: 6 } as any}>
      {/* Resolution summary */}
      <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Resolution</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Resolue le {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />
        {alert.resolved_by_name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Par {alert.resolved_by_name}</div>}
        {alert.created_at && alert.resolved_at && (() => {
          const dur = Math.round((new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime()) / 60000);
          return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginTop: 8 } as any}><i className="ri-time-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Duree : {dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? String(dur % 60).padStart(2, '0') : ''}` : `${dur} min`}</span></div>;
        })()}
      </div>

      {/* Intervention report */}
      {ivReport && (() => {
        const entries = [
          ivReport.description && { label: 'Description', value: ivReport.description },
          ivReport.actions_taken && { label: 'Actions realisees', value: ivReport.actions_taken },
          ivReport.patient_condition && { label: 'Etat du patient', value: ivReport.patient_condition === 'stable' ? 'Stable' : ivReport.patient_condition },
          ivReport.follow_up_notes && { label: 'Suivi necessaire', value: ivReport.follow_up_notes, warn: true },
        ].filter(Boolean) as any[];
        if (!entries.length) return null;
        return (
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Rapport d'intervention</div>
            {entries.map((e: any, i: number) => (
              <div key={i}>
                {e.warn ? (
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', margin: '6px 0' } as any}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div>
                    <div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.4 }}>{e.value}</div>
                  </div>
                ) : (
                  <div style={{ padding: '10px 0' } as any}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div>
                    <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{e.value}</div>
                  </div>
                )}
                {i < entries.length - 1 && !e.warn && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}
              </div>
            ))}
            {ivReport.completed_by && <><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} /><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Redige par {ivReport.completed_by}</div></>}
          </div>
        );
      })()}

      {/* Closure report (QCM answers) */}
      {alert.report?.answers && (
        <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
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

      {/* Timeline */}
      {alertDetail?.timeline && alertDetail.timeline.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Chronologie</div>
          {alertDetail.timeline.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 } as any}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 } as any}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: i === alertDetail.timeline.length - 1 ? '#10B981' : 'rgba(255,255,255,0.25)', marginTop: 4 } as any} />
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

/* ════════════════════════════════════════════════════════════════════
   MAIN EXPORT  — AlertsScreen
   ════════════════════════════════════════════════════════════════════ */
export default function AlertsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { preselect } = useLocalSearchParams<{ preselect?: string }>();
  const r = user?.active_role || user?.role || '';
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'resolved'>('active');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showExplainer, setShowExplainer] = useState(false);

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
      if (found) { setSelectedAlert(found); }
    }
  }, [preselect, alerts]);

  const resolved = alerts.filter(a => a.status === 'resolved');
  const filtered = tab === 'active' ? activeAlerts : resolved;

  /* ── Web: full-screen sub-pages via early returns ── */
  if (Platform.OS === 'web') {
    if (showExplainer) return <ExplainerPage onClose={() => setShowExplainer(false)} />;
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

  if (loading) return <FullScreenLoader />;

  /* ── Web list page ── */
  if (Platform.OS === 'web' && (r === 'guardian' || r === 'beneficiary' || r === 'prescriber_company' || r === 'admin' || r === 'teleassistance')) {
    return (
      <div data-testid="alerts-list-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}>
          <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        </div>
        {/* Header */}
        <div style={{ position: 'relative', padding: '24px 20px 20px', textAlign: 'center', zIndex: 5, flexShrink: 0 } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Alertes</div>
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
            const alertTypeLabel = getAlertLabel(alert.alert_type);
            return (
              <div key={alert.id} data-testid={`alert-card-${alert.id}`} style={{ borderRadius: 20, position: 'relative', padding: '18px 16px', marginBottom: 12, minHeight: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'transform 0.15s' } as any}>
                {/* Clickable card area */}
                <div onClick={() => router.push({ pathname: '/alert-detail' as any, params: { alertId: alert.id } })} style={{ cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{alert.beneficiary_name || 'Beneficiaire'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Le {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)', flexShrink: 0 } as any}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: isActive ? '#EF4444' : '#10B981' } as any} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{isActive ? 'Alerte active' : 'Resolue'}</span>
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

  /* ── Native: intervenant role uses FlatList ── */
  if (r === 'care_intervenant') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 16, letterSpacing: -0.5 }}>Alertes</Text>
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

  /* ── Fallback for other roles (native) ── */
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#111', letterSpacing: -0.5 }}>Alertes</Text>
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
