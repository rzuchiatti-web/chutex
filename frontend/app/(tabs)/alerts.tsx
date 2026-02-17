import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useTheme } from '../../src/context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, ScrollView, TextInput } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { useRouter } from 'expo-router';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/3nimaiv0_background_intervention_care_valide_prescription_valide.jpg';
const BG_HEADER = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

const STATE_LABEL: Record<string, string> = { IDLE: 'En attente', CALLING_PATIENT: 'Appel patient', CALLING_GUARDIANS: 'Appel gardiens', CARE_DISPATCHED: 'Intervenant envoye', RESOLVED: 'Resolue' };

export default function AlertsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const r = user?.active_role || user?.role || '';
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'resolved'>('active');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportAnswers, setReportAnswers] = useState<Record<string, string>>({});
  const [showExplainer, setShowExplainer] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const isAdmin = r === 'admin';
      const [all, active] = await Promise.all([
        apiFetch(isAdmin ? '/api/backoffice/alerts' : '/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/alerts/active-with-interventions', {}, token).catch(() => []),
      ]);
      setAlerts(Array.isArray(all) ? all : []);
      setActiveAlerts(Array.isArray(active) ? active : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token, r]);

  useEffect(() => { fetchAlerts(); const t = setInterval(fetchAlerts, 10000); return () => clearInterval(t); }, [fetchAlerts]);

  const resolved = alerts.filter(a => a.status === 'resolved');
  const filtered = tab === 'active' ? activeAlerts : resolved;

  /* ─── EXPLAINER: Comprendre les alertes (early return) ─── */
  if (showExplainer && Platform.OS === 'web') {
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

        {/* Top bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div data-testid="back-from-explainer" onClick={() => setShowExplainer(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#FFF' }}>Comprendre les alertes</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Intro */}
          <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
              <i className="ri-shield-check-line" style={{ fontSize: 32, color: '#FFF' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Le processus CARE WATCH</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              De l'alerte a la resolution, chaque etape est concue pour assurer la securite de vos proches en un minimum de temps.
            </div>
          </div>

          {/* Timeline steps */}
          <div style={{ marginBottom: 28 } as any}>
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
          </div>

          {/* Roles */}
          <div style={{ marginBottom: 28 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Roles et permissions</div>
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
          </div>

          {/* FAQ */}
          <div style={{ marginBottom: 20 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Questions frequentes</div>
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
      </div>
    );
  }

  /* ─── REPORT PAGE: must be checked BEFORE selectedAlert detail ─── */
  if (showReport && selectedAlert && Platform.OS === 'web') {
    const isBeneficiary = r === 'beneficiary';
    const reportQuestions = isBeneficiary ? [
      { id: 'reason', label: 'Pourquoi cloturez-vous cette alerte ?', options: ['Fausse alerte / Erreur de manipulation', 'Je vais bien, pas besoin d\'aide', 'L\'aide est deja arrivee', 'Autre raison'] },
    ] : [
      { id: 'situation', label: 'La situation est-elle maitrisee ?', options: ['Oui, situation resolue', 'Partiellement, surveillance necessaire', 'Non, necessite un suivi'] },
      { id: 'actions', label: 'Actions realisees', options: ['Levee de doute telephonique', 'Intervention physique au domicile', 'Contact avec les secours (SAMU/Pompiers)', 'Contact avec le medecin traitant', 'Aucune action necessaire'] },
      { id: 'condition', label: 'Etat du beneficiaire', options: ['Stable - pas de blessure', 'Blessure legere - soins apportes', 'Necessitant un suivi medical', 'Hospitalisation necessaire'] },
    ];
    const allAnswered = reportQuestions.every(q => reportAnswers[q.id]);

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setShowReport(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{isBeneficiary ? 'Cloturer l\'alerte' : 'Rapport de cloture'}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{isBeneficiary ? 'Dites-nous ce qui s\'est passe' : `Alerte : ${selectedAlert.beneficiary_name}`}</div>
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
              style={{ width: '100%', minHeight: isBeneficiary ? 80 : 100, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none' } as any} />
          </div>
          <div onClick={() => {
            if (!allAnswered) return;
            const report = { ...reportAnswers, notes: reportText, closed_by: user?.name, closed_at: new Date().toISOString(), closed_by_role: r };
            apiFetch(`/api/alerts/${selectedAlert.id}/resolve`, { method: 'PUT', body: JSON.stringify({ answers: report, notes: reportText }) }, token)
              .then(() => { fetchAlerts(); setSelectedAlert(null); setShowReport(false); setReportText(''); setReportAnswers({}); })
              .catch(() => {});
          }} style={{
            width: '100%', padding: '16px', borderRadius: 999, textAlign: 'center', cursor: allAnswered ? 'pointer' : 'not-allowed',
            background: allAnswered ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
            border: allAnswered ? '1px solid rgba(16,185,129,0.35)' : '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            color: allAnswered ? '#10B981' : 'rgba(255,255,255,0.3)',
            fontSize: 16, fontWeight: 700, transition: 'all 0.25s',
            boxShadow: allAnswered ? '0 4px 20px rgba(16,185,129,0.2)' : 'none',
          } as any}>
            {allAnswered ? 'Confirmer la cloture' : 'Repondez a la question'}
          </div>
        </div>
      </div>
    );
  }

  /* ─── DETAIL PAGE: alert (early return, replaces entire view) ─── */
  if (selectedAlert && Platform.OS === 'web') {
    const isResolved = selectedAlert.status === 'resolved';
    const bgImg = isResolved ? BG_GREEN : BG_RED;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setSelectedAlert(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isResolved ? '#10B981' : '#EF4444' } as any} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isResolved ? 'Alerte resolue' : 'Alerte active'}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {/* Header — beneficiary name as main title */}
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as any}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{selectedAlert.beneficiary_name || 'Beneficiaire'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(selectedAlert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          {/* Info grid — no severity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
            {[
              { label: 'Type', value: selectedAlert.alert_type === 'sos' ? 'SOS' : selectedAlert.alert_type === 'fall' ? 'Chute detectee' : selectedAlert.alert_type === 'health_anomaly' ? 'Anomalie de sante' : selectedAlert.alert_type || '-' },
              { label: 'Statut', value: isResolved ? 'Resolue' : STATE_LABEL[selectedAlert.incident_state || selectedAlert.teleassistance_status] || 'Active' },
              { label: 'Appareil', value: selectedAlert.device_type || '-' },
              { label: 'Heure', value: new Date(selectedAlert.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Message */}
          {selectedAlert.message && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Message</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF', lineHeight: 1.5 }}>{selectedAlert.message}</div>
            </div>
          )}

          {/* Intervention info — fiche intervenant (not clickable) */}
          {(selectedAlert.intervener_info || selectedAlert.care_provider) && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche intervenant</div>
                {selectedAlert.intervener_info?.structure && (
                  <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: selectedAlert.intervener_info?.structure ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(selectedAlert.intervener_info?.name || selectedAlert.care_provider || '?').charAt(0)}</span>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedAlert.intervener_info?.name || selectedAlert.care_provider || 'Intervenant'}</div>
                  {selectedAlert.intervener_info?.structure && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{selectedAlert.intervener_info.structure}</div>}
                  {selectedAlert.incident_state && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{STATE_LABEL[selectedAlert.incident_state] || selectedAlert.incident_state}</div>}
                </div>
              </div>
              {selectedAlert.intervener_info?.phone && (
                <div onClick={() => window.location.href = `tel:${selectedAlert.intervener_info.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginTop: 10, cursor: 'pointer' } as any}>
                  <i className="ri-phone-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{selectedAlert.intervener_info.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Resolved info */}
          {isResolved && selectedAlert.resolved_at && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Resolution</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>Resolue le {new Date(selectedAlert.resolved_at).toLocaleString('fr-FR')}</div>
            </div>
          )}

          {/* Action buttons */}
          {!isResolved && (
            <div style={{ marginTop: 16 } as any}>
              {/* Suivre l'intervention — shown when intervenant IS assigned (for beneficiary and other guardians) */}
              {(selectedAlert.intervener_info || selectedAlert.care_provider) && selectedAlert.intervention?.id && (
                <div style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', marginBottom: 12, touchAction: 'none' } as any}
                  onMouseDown={(e: any) => { const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedAlert.intervention.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                  onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedAlert.intervention.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                  <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(59,130,246,0.4)', willChange: 'transform', touchAction: 'none' } as any}>
                    <i className="ri-map-pin-range-line" style={{ fontSize: 20, color: '#FFF' }} />
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(59,130,246,0.7)', fontSize: 16, fontWeight: 700, pointerEvents: 'none', paddingLeft: 36 } as any}>Suivre l'intervention</div>
                </div>
              )}

              {/* Intervenir — GUARDIAN only, ONLY if no intervenant assigned */}
              {r === 'guardian' && !selectedAlert.intervener_info && !selectedAlert.care_provider && (
                <div style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12, touchAction: 'none' } as any}
                  onMouseDown={(e: any) => { const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); apiFetch('/api/interventions/accept-as-guardian', { method: 'POST', body: JSON.stringify({ alert_id: selectedAlert.id }) }, token).then((res: any) => { fetchAlerts(); if (res?.intervention_id) router.push({ pathname: '/intervention-map', params: { interventionId: res.intervention_id } }); else router.push({ pathname: '/intervention-map', params: { alertId: selectedAlert.id } }); }).catch(() => { router.push({ pathname: '/intervention-map', params: { alertId: selectedAlert.id } }); }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                  onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); apiFetch('/api/interventions/accept-as-guardian', { method: 'POST', body: JSON.stringify({ alert_id: selectedAlert.id }) }, token).then((res: any) => { fetchAlerts(); if (res?.intervention_id) router.push({ pathname: '/intervention-map', params: { interventionId: res.intervention_id } }); else router.push({ pathname: '/intervention-map', params: { alertId: selectedAlert.id } }); }).catch(() => { router.push({ pathname: '/intervention-map', params: { alertId: selectedAlert.id } }); }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                  <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 700, pointerEvents: 'none', paddingLeft: 36 } as any}>Glisser pour intervenir</div>
                </div>
              )}

              {/* Cloturer — beneficiary ALWAYS can, guardian ALWAYS can */}
              {(r === 'beneficiary' || r === 'guardian') && (
                <div style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', touchAction: 'none' } as any}
                  onMouseDown={(e: any) => { const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); setShowReport(true); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                  onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); setShowReport(true); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if(thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                  <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(16,185,129,0.7)', fontSize: 16, fontWeight: 700, pointerEvents: 'none', paddingLeft: 36 } as any}>Glisser pour cloturer</div>
                </div>
              )}
            </div>
          )}

          {/* Report form — FULL SCREEN PAGE (early return handled above) */}
        </div>
      </div>
    );
  }


  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}><ActivityIndicator size="large" color="#111" /></View>;

  /* ─── GUARDIAN: bypass wrapper, full screen with header ─── */
  if (r === 'guardian' || r === 'beneficiary') {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}>
        {/* Header with background */}
        {Platform.OS === 'web' ? (
          <div style={{ position: 'relative', padding: '24px 20px 20px', textAlign: 'center', overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 } as any}>
            <img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2 } as any}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Alertes</div>
              <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
                <div onClick={() => setTab('active')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: tab === 'active' ? '#FFF' : 'transparent', color: tab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s' } as any}>En cours ({activeAlerts.length})</div>
                <div onClick={() => setTab('resolved')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: tab === 'resolved' ? '#FFF' : 'transparent', color: tab === 'resolved' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s' } as any}>Cloturees ({resolved.length})</div>
              </div>
              <div onClick={() => setShowExplainer(true)} data-testid="comprendre-alertes-btn" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
                <i className="ri-book-open-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Comprendre les alertes</span>
              </div>
            </div>
          </div>
        ) : (
          <View style={{ backgroundColor: '#2d1050', padding: 20, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 14 }}>Alertes</Text>
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: 4 }}>
              <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, tab === 'active' && { backgroundColor: '#FFF' }]} onPress={() => setTab('active')}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: tab === 'active' ? '#111' : 'rgba(255,255,255,0.8)' }}>Actives</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, tab === 'resolved' && { backgroundColor: '#FFF' }]} onPress={() => setTab('resolved')}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: tab === 'resolved' ? '#111' : 'rgba(255,255,255,0.8)' }}>Resolues</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Alert cards */}
        <View style={{ padding: 16 }}>
          {filtered.length > 0 ? filtered.map((alert: any) => {
            const isActive = alert.status === 'active';
            const bgImg = isActive ? BG_RED : BG_GREEN;
            return Platform.OS === 'web' ? (
              <div key={alert.id} onClick={() => setSelectedAlert(alert)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '18px 16px', marginBottom: 12, cursor: 'pointer', minHeight: 100, boxShadow: '0 8px 24px rgba(0,0,0,.15)', transition: 'transform 0.25s ease' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                <img src={bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } as any}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{alert.beneficiary_name || 'Beneficiaire'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Le {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: isActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)', border: `1px solid ${isActive ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`, flexShrink: 0 } as any}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#EF4444' : '#10B981' } as any} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#FFF', letterSpacing: 0.3 }}>{isActive ? 'Alerte active' : 'Resolue'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{alert.alert_type === 'fall' ? 'Chute detectee' : alert.alert_type === 'sos' ? 'SOS' : alert.alert_type === 'health_anomaly' ? 'Anomalie de sante' : alert.message || 'Alerte'}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.15)', borderRadius: 999, padding: '8px 16px', border: '1px solid rgba(255,255,255,.2)' } as any}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <TouchableOpacity key={alert.id} onPress={() => setSelectedAlert(alert)}>
                <View style={{ borderRadius: 20, overflow: 'hidden', padding: 18, marginBottom: 12, backgroundColor: isActive ? '#3a0a0a' : '#0a2a1a' }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFF' }}>{alert.message || 'Alerte'}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{alert.beneficiary_name} · {new Date(alert.created_at).toLocaleString('fr-FR')}</Text>
                </View>
              </TouchableOpacity>
            );
          }) : (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Icon name={tab === 'active' ? 'checkmark-circle' : 'archive-outline'} size={32} color="#10B981" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', marginTop: 12 }}>{tab === 'active' ? 'Tout va bien !' : 'Aucun historique'}</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>{tab === 'active' ? 'Aucune alerte active' : 'Les alertes resolues apparaitront ici'}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  /* ─── FALLBACK for other roles ─── */
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
