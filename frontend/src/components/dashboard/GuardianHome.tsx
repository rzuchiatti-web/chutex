import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { apiFetch } from '../../services/api';
import { requestNotificationPermission, notifyAlert, notifyIntervention } from '../../services/notifications';
import FullScreenLoader from '../FullScreenLoader';
import CopilotCard from './CopilotCard';
import { Card, HeroCard, StatusBadge, PillButton, SectionHeader, LanguageFlagButton } from './SharedUI';
import { Icon } from '../WebIcon';
import { ContextualTip, MiniTuto } from '../HelpSystem';
import { PhoneInputWithPrefix } from '../components/PhoneInputWithPrefix';
import { CHX, isDarkMode, webShadow, BG_IMAGES } from './constants';

export default function GuardianHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const { refreshUser } = useAuth();
  const [bens, setBens] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [pendingInterventions, setPendingInterventions] = useState<any[]>([]);
  const [saadInvitations, setSaadInvitations] = useState<any[]>([]);
  const [saadLink, setSaadLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [activeAlertsG, setActiveAlertsG] = useState<any[]>([]);
  const [showNotifsG, setShowNotifsG] = useState(false);
  const [langOpenG, setLangOpenG] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a, inv, piv, saadInv, saadLk] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/guardian/invitations', {}, token).catch(() => []),
        apiFetch('/api/interventions/pending', {}, token).catch(() => []),
        apiFetch('/api/guardian/saad-invitations', {}, token).catch(() => []),
        apiFetch('/api/guardian/saad-link', {}, token).catch(() => null),
      ]);
      const aa = await apiFetch('/api/alerts/active-with-interventions', {}, token).catch(() => []);
      setActiveAlertsG(Array.isArray(aa) ? aa : []);
      setBens(Array.isArray(b) ? b : []);
      setAlerts(Array.isArray(a) ? a : []);
      setInvitations(Array.isArray(inv) ? inv : []);
      setPendingInterventions(Array.isArray(piv) ? piv : []);
      setSaadInvitations(Array.isArray(saadInv) ? saadInv : []);
      setSaadLink(saadLk || null);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 10000); return () => clearInterval(iv); }, [fetchData]);
  useEffect(() => { requestNotificationPermission(); }, []);
  useEffect(() => {
    if (pendingInterventions.length > 0) pendingInterventions.forEach((piv: any) => { if (piv.status === 'pending_acceptance') notifyIntervention(piv.beneficiary_name, piv.distance_km); });
    if (invitations.length > 0) invitations.forEach((inv: any) => notifyAlert('guardian_request', `${inv.beneficiary_name} vous demande comme gardien`));
  }, [pendingInterventions.length, invitations.length]);

  const switchToBeneficiary = async () => {
    if (switching) return;
    setSwitching(true);
    try {
      if (user.has_beneficiary_space || user.role === 'beneficiary') {
        await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'beneficiary' }) }, token);
        await refreshUser();
      } else { router.push('/activate-beneficiary' as any); }
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSwitching(false); }
  };

  const [showAddBenPopup, setShowAddBenPopup] = useState(false);
  const [showSaadPopup, setShowSaadPopup] = useState(false);
  const [detaching, setDetaching] = useState(false);
  const [linkPhone, setLinkPhone] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('');
  const [linkingBen, setLinkingBen] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');

  if (loading) return <FullScreenLoader />;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const BG_GUARD = BG_IMAGES.beneficiary;
  const BG_RED_G = BG_IMAGES.red;

  if (Platform.OS === 'web') {
    return (
      <div data-testid="guardian-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_GUARD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1 } as any} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div onClick={() => router.push('/(tabs)/profile' as any)} style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(167,139,250,0.4)', cursor: 'pointer', flexShrink: 0 } as any}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', letterSpacing: -0.3, marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(167,139,250,0.8)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{t('space_guardian')}{user.is_prescriber ? ' | Prescripteur' : ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
              <div onClick={() => setLangOpenG(!langOpenG)} style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, lineHeight: 1 } as any}>
                {lang === 'FR' ? '\u{1F1EB}\u{1F1F7}' : lang === 'EN' ? '\u{1F1EC}\u{1F1E7}' : lang === 'ES' ? '\u{1F1EA}\u{1F1F8}' : lang === 'DE' ? '\u{1F1E9}\u{1F1EA}' : lang === 'IT' ? '\u{1F1EE}\u{1F1F9}' : lang === 'PT' ? '\u{1F1F5}\u{1F1F9}' : lang === 'NL' ? '\u{1F1F3}\u{1F1F1}' : '\u{1F30D}'}
              </div>
              <div onClick={() => setShowNotifsG(!showNotifsG)} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' } as any}>
                <i className="ri-notification-3-line" style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)' }} />
                {(invitations.length > 0 || activeAlertsG.length > 0) && <div style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: 5, background: '#EF4444', border: '2px solid rgba(4,14,26,0.8)' } as any} />}
              </div>
            </div>
          </div>
          {/* SAAD affiliation card */}
          {saadLink && (
            <div onClick={() => setShowSaadPopup(true)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px 18px', marginBottom: 14, cursor: 'pointer' } as any}>
              <img src={BG_IMAGES.saad} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } as any}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{saadLink.company_name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#FFF', background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: 99, letterSpacing: 0.5, textTransform: 'uppercase' }}>Rattaché</span>
                  </div>
                  {saadLink.company_address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{saadLink.company_address}</div>}
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
              </div>
            </div>
          )}

          {/* Alert card */}
          <div onClick={() => router.push('/(tabs)/alerts' as any)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px 18px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <img src={BG_RED_G} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{activeAlerts.length}</div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alerte{activeAlerts.length !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{activeAlerts.length > 0 ? `${activeAlerts.length} en cours` : 'Aucune alerte'}</div></div>
            </div>
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 6 } as any}>
              {activeAlerts.length > 0 ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div> : <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#10B981' }}>Aucune alerte</span></div>}
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Mes beneficiaires</div>

          {/* Language popup glass */}
          {langOpenG && (
            <div onClick={() => setLangOpenG(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setLangOpenG(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
                <div style={{ textAlign: 'center', marginBottom: 28 } as any}><div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-global-line" style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)' }} /></div><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Langue</div></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                  {[{ code: 'FR', flag: '\u{1F1EB}\u{1F1F7}', name: 'Francais' }, { code: 'EN', flag: '\u{1F1EC}\u{1F1E7}', name: 'English' }, { code: 'DE', flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutsch' }, { code: 'ES', flag: '\u{1F1EA}\u{1F1F8}', name: 'Espanol' }, { code: 'IT', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italiano' }, { code: 'PT', flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugues' }, { code: 'NL', flag: '\u{1F1F3}\u{1F1F1}', name: 'Nederlands' }].map(l => (
                    <div key={l.code} onClick={() => { setLang(l.code); setLangOpenG(false); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 18, cursor: 'pointer', background: lang === l.code ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border: lang === l.code ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)' } as any}>
                      <span style={{ fontSize: 32, lineHeight: 1 }}>{l.flag}</span>
                      <span style={{ fontSize: 15, fontWeight: lang === l.code ? 800 : 500, color: lang === l.code ? '#FFF' : 'rgba(255,255,255,0.45)', flex: 1 }}>{l.name}</span>
                      {lang === l.code && <i className="ri-check-line" style={{ fontSize: 18, color: '#22D3EE' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* POPUP FICHE SAAD */}
          {showSaadPopup && saadLink && (
            <div onClick={() => setShowSaadPopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowSaadPopup(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.2)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 26, color: '#10B981' }} /></div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{saadLink.company_name}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4, padding: '3px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' } as any}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: '#10B981', display: 'inline-block' } as any} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Rattaché</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Structure</div>
                  {[
                    saadLink.company_address && { icon: 'ri-map-pin-line', label: 'Adresse', value: saadLink.company_address },
                    saadLink.company_siret && { icon: 'ri-file-text-line', label: 'SIRET', value: saadLink.company_siret },
                    saadLink.linked_since && { icon: 'ri-calendar-line', label: 'Rattaché depuis', value: new Date(saadLink.linked_since).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  ].filter(Boolean).map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                      <i className={item.icon} style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 13, color: '#FFF' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Mes espaces</div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: saadLink.intervenant_active !== false ? 'rgba(124,92,255,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${saadLink.intervenant_active !== false ? 'rgba(124,92,255,0.25)' : 'rgba(255,255,255,0.08)'}`, textAlign: 'center' } as any}>
                      <i className="ri-stethoscope-line" style={{ fontSize: 16, color: saadLink.intervenant_active !== false ? '#A78BFA' : 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 4 }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: saadLink.intervenant_active !== false ? '#A78BFA' : 'rgba(255,255,255,0.3)' }}>Intervenant Care</div>
                      <div style={{ fontSize: 9, color: saadLink.intervenant_active !== false ? 'rgba(164,139,250,0.7)' : 'rgba(255,255,255,0.2)', marginTop: 2 }}>{saadLink.intervenant_active !== false ? 'Actif' : 'Désactivé'}</div>
                    </div>
                    <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: saadLink.prescripteur_active !== false ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${saadLink.prescripteur_active !== false ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`, textAlign: 'center' } as any}>
                      <i className="ri-file-text-line" style={{ fontSize: 16, color: saadLink.prescripteur_active !== false ? '#F59E0B' : 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 4 }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: saadLink.prescripteur_active !== false ? '#F59E0B' : 'rgba(255,255,255,0.3)' }}>Prescripteur</div>
                      <div style={{ fontSize: 9, color: saadLink.prescripteur_active !== false ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.2)', marginTop: 2 }}>{saadLink.prescripteur_active !== false ? 'Actif' : 'Désactivé'}</div>
                    </div>
                  </div>
                </div>
                <div onClick={async () => {
                  if (!window.confirm(`Vous allez vous détacher de ${saadLink.company_name}. Cette action est irréversible. Continuer ?`)) return;
                  setDetaching(true);
                  try {
                    await apiFetch('/api/guardian/saad-detach', { method: 'POST' }, token);
                    setShowSaadPopup(false);
                    fetchData();
                  } catch (e: any) { window.alert(`Erreur : ${(e as any).message}`); }
                  finally { setDetaching(false); }
                }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: detaching ? 'not-allowed' : 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                  {detaching ? <><i className="ri-loader-4-line" style={{ fontSize: 16 }} />Détachement...</> : <><i className="ri-link-unlink-m" style={{ fontSize: 16 }} />Se détacher de la structure</>}
                </div>
              </div>
            </div>
          )}
          {/* SAAD pending invitations */}
          {saadInvitations.map((inv: any) => (
            <div key={inv.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 10 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-building-4-line" style={{ fontSize: 18, color: '#F59E0B' }} /></div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{inv.company_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Souhaite vous rattacher comme gardien professionnel</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div onClick={async () => { try { await apiFetch(`/api/guardian/saad-invitations/${inv.id}/accept`, { method: 'POST' }, token); fetchData(); } catch {} }} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#10B981' } as any}>Accepter</div>
                <div onClick={async () => { try { await apiFetch(`/api/guardian/saad-invitations/${inv.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Refuser</div>
              </div>
            </div>
          ))}
          {/* Beneficiary cards */}
          {bens.map((b: any) => (
            <div key={b.id} onClick={() => router.push({ pathname: '/beneficiary-detail', params: { beneficiaryId: b.id } })} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12, cursor: 'pointer', overflow: 'hidden', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
              <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{b.name?.charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{b.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } as any}>
                    {b.date_of_birth && !isNaN(new Date(b.date_of_birth).getTime()) && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{Math.floor((Date.now() - new Date(b.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))} ans</span>}
                    {b.subscription_type && <><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>&middot;</span><span style={{ fontSize: 10, color: '#D97706', fontWeight: 600 }}>{b.subscription_type}</span></>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 } as any}>
                  {b.active_alerts > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 99, background: 'rgba(239,68,68,0.2)' } as any}><span style={{ width: 5, height: 5, borderRadius: 99, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444' }}>{b.active_alerts} alerte{b.active_alerts > 1 ? 's' : ''}</span></div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.15)' } as any}><span style={{ width: 5, height: 5, borderRadius: 99, background: '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>OK</span></div>
                  )}
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
                </div>
              </div>
              {b.latest_vitals && (
                <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '10px 16px 12px', gap: 6 } as any}>
                  {[
                    { val: b.latest_vitals.heart_rate, unit: 'bpm', color: '#EF4444', dot: '#EF4444' },
                    { val: b.latest_vitals.spo2, unit: '%', color: '#60A5FA', dot: '#3B82F6' },
                    { val: b.latest_vitals.blood_pressure_systolic ? `${b.latest_vitals.blood_pressure_systolic}/${b.latest_vitals.blood_pressure_diastolic}` : null, unit: 'mmHg', color: '#C084FC', dot: '#A78BFA' },
                    { val: b.latest_vitals.temperature, unit: '°C', color: '#FB923C', dot: '#F59E0B' },
                  ].map((s: any, i: number) => s.val ? (
                    <div key={i} style={{ flex: 1, padding: '6px 4px', borderRadius: 10, background: `${s.dot}15`, textAlign: 'center' } as any}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{s.unit}</div>
                    </div>
                  ) : (
                    <div key={i} style={{ flex: 1, padding: '6px 4px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.2)', lineHeight: 1 }}>--</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{s.unit}</div>
                    </div>
                  ))}
                </div>
              )}
              {(b.bracelet_battery != null || b.last_seen) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' } as any}>
                  {b.bracelet_battery != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                      <i className="ri-battery-line" style={{ fontSize: 13, color: b.bracelet_battery > 30 ? '#10B981' : '#EF4444' }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: b.bracelet_battery > 30 ? '#10B981' : '#EF4444' }}>{b.bracelet_battery}%</span>
                    </div>
                  )}
                  {b.last_seen && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                      <i className="ri-map-pin-line" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{b.address || 'Position connue'}</span>
                    </div>
                  )}
                  <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Voir la fiche &rarr;</div>
                </div>
              )}
            </div>
          ))}
          {bens.length === 0 && <div style={{ textAlign: 'center', padding: '30px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', marginBottom: 10 } as any}><i className="ri-group-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginTop: 10 }}>Aucun beneficiaire</div></div>}
          <div onClick={() => setShowAddBenPopup(true)} style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}><i className="ri-heart-line" style={{ fontSize: 16, color: '#FFF' }} /><span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{t('add_beneficiary')}</span></div>

          {/* Nora IA card */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', margin: '16px 20px' } as any} />
          <CopilotCard subtitle={"Un accompagnement intelligent pour comprendre la sant\u00e9 de vos b\u00e9n\u00e9ficiaires et agir au quotidien."} />
        </div>
        {/* POPUP AJOUTER BENEFICIAIRE */}
        {showAddBenPopup && (
          <div onClick={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                  <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
                </div>
              </div>
              <div style={{ marginBottom: 28 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Gardien &middot; Bénéficiaire</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginBottom: 8, lineHeight: 1.1 }}>Ajouter un<br />bénéficiaire</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                  Entrez le numéro de téléphone de votre proche. S'il a déjà un compte, il recevra une notification. Sinon, un SMS lui sera envoyé.
                </div>
              </div>
              <div style={{ marginBottom: 28 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Numéro de téléphone</div>
                <div style={{ position: 'relative' } as any}>
                  <i className="ri-phone-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' } as any} />
                  <input value={linkPhone} onChange={(e: any) => setLinkPhone(e.target.value)} placeholder="06 12 34 56 78" type="tel" style={{ width: '100%', padding: '15px 16px 15px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
              </div>
              {(() => {
                const PROS = ['Auxiliaire de vie', 'Aide soignant(e)', 'Aide à domicile', 'Professionnel de santé', 'Infirmier(e) libérale', 'Coach sportif', 'Préparateur physique'];
                const PERSO = ['Mère', 'Père', 'Fils', 'Fille', 'Petit-enfant', 'Conjoint(e)', 'Frère', 'Sœur', 'Ami(e)', 'Voisin(e)', 'Autre'];
                const isPro = PROS.includes(linkRelationship);
                const isPerso = PERSO.includes(linkRelationship);
                const linkType = isPro ? 'pro' : isPerso ? 'perso' : '';
                return (
                  <div style={{ marginBottom: 28 } as any}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>Lien avec le bénéficiaire</div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
                      <div onClick={() => { if (linkType !== 'pro') { setLinkRelationship(PROS[0]); } }} style={{ flex: 1, padding: '14px 12px', borderRadius: 16, cursor: 'pointer', background: isPro ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isPro ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`, textAlign: 'center', transition: 'all 0.2s', opacity: isPerso ? 0.5 : 1 } as any}>
                        <i className="ri-briefcase-line" style={{ fontSize: 22, color: '#FFF', display: 'block', marginBottom: 6 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Professionnel</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>Auxil., infirmier…</div>
                        {isPro && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: '#FFF' }}>✓ {linkRelationship}</div>}
                      </div>
                      <div onClick={() => { if (linkType !== 'perso') { setLinkRelationship(PERSO[0]); } }} style={{ flex: 1, padding: '14px 12px', borderRadius: 16, cursor: 'pointer', background: isPerso ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)', border: `2px solid ${isPerso ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`, textAlign: 'center', transition: 'all 0.2s', opacity: isPro ? 0.5 : 1 } as any}>
                        <i className="ri-heart-line" style={{ fontSize: 22, color: '#FFF', display: 'block', marginBottom: 6 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Particulier</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>Famille, ami…</div>
                        {isPerso && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: '#FFF' }}>✓ {linkRelationship}</div>}
                      </div>
                    </div>
                    {isPro && (
                      <div style={{ position: 'relative' } as any}>
                        <select value={linkRelationship} onChange={(e: any) => setLinkRelationship(e.target.value)} style={{ width: '100%', padding: '13px 40px 13px 16px', borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)', color: '#10B981', fontSize: 14, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' } as any}>
                          {PROS.map(r => <option key={r} value={r} style={{ background: '#1a1a2e', color: '#FFF' }}>{r}</option>)}
                        </select>
                        <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(16,185,129,0.6)', pointerEvents: 'none' } as any} />
                      </div>
                    )}
                    {isPerso && (
                      <div style={{ position: 'relative' } as any}>
                        <select value={linkRelationship} onChange={(e: any) => setLinkRelationship(e.target.value)} style={{ width: '100%', padding: '13px 40px 13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' } as any}>
                          {PERSO.map(r => <option key={r} value={r} style={{ background: '#1a1a2e', color: '#FFF' }}>{r}</option>)}
                        </select>
                        <i className="ri-arrow-down-s-line" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' } as any} />
                      </div>
                    )}
                    {isPro && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(16,185,129,0.7)' } as any}><i className="ri-information-line" style={{ fontSize: 13 }} /><span>Les alertes de ce bénéficiaire remonteront dans l'espace SAAD</span></div>}
                  </div>
                );
              })()}
              {linkMessage !== '' && (
                <div style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 16, background: linkMessage.startsWith('Erreur') ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${linkMessage.startsWith('Erreur') ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` } as any}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 } as any}>
                    <i className={linkMessage.startsWith('Erreur') ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 18, color: linkMessage.startsWith('Erreur') ? '#EF4444' : '#10B981', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{linkMessage}</span>
                  </div>
                </div>
              )}
              <div
                onClick={async () => {
                  if (!linkPhone.trim() || linkingBen) return;
                  const phoneClean = linkPhone.trim().replace(/[\s.\-]/g, '');
                  if (phoneClean.length < 10) { setLinkMessage('Erreur : Numero invalide (min 10 chiffres)'); return; }
                  setLinkingBen(true);
                  setLinkMessage('');
                  try {
                    const res = await apiFetch('/api/guardian/link-with-phone', { method: 'POST', body: JSON.stringify({ phone: linkPhone.trim(), relationship: linkRelationship.trim() }) }, token);
                    setLinkMessage(res.message || 'Demande envoyee avec succes !');
                    if (res.status === 'pending' || res.status === 'already_linked' || res.status === 'sms_sent') {
                      fetchData();
                      setTimeout(() => { setShowAddBenPopup(false); setLinkPhone(''); setLinkRelationship(''); setLinkMessage(''); }, 2500);
                    }
                  } catch (e: any) {
                    setLinkMessage(`Erreur : ${e.message}`);
                  } finally { setLinkingBen(false); }
                }}
                style={{ padding: '17px', borderRadius: 999, textAlign: 'center', cursor: linkPhone.trim() && !linkingBen ? 'pointer' : 'not-allowed', background: linkPhone.trim() && !linkingBen ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)', border: `1px solid ${linkPhone.trim() ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, color: linkPhone.trim() ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}
              >
                {linkingBen ? (
                  <><i className="ri-loader-4-line" style={{ fontSize: 16 }} /><span>Envoi en cours...</span></>
                ) : (
                  <><i className="ri-send-plane-line" style={{ fontSize: 16 }} /><span>Envoyer l'invitation</span></>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      <HeroCard style={{ backgroundColor: '#111827', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #9A5533 0%, #111827 40%, #6B7280 100%)', backgroundSize: '200% 200%', boxShadow: '0 8px 32px rgba(154,85,51,0.25)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity testID="guardian-header-switch" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={switchToBeneficiary}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' }}>
              {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 48, height: 48 }} /> : <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{t('guardian')}{user.is_prescriber ? ' | Prescripteur' : ''}</Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LanguageFlagButton />
            <TouchableOpacity testID="guardian-notification-bell" onPress={() => setShowNotifsG(!showNotifsG)} style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="notifications-outline" size={18} color="#111827" />
              {(invitations.length > 0 || pendingInterventions.length > 0 || activeAlertsG.length > 0) && <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }} />}
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: bens.length, label: 'Beneficiaires' },
            { val: activeAlerts.length, label: 'Alertes' },
            { val: pendingInterventions.length, label: 'Interventions' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {/* Notifications */}
      {showNotifsG && (
        <Card style={{ borderLeftWidth: 3, borderLeftColor: '#111827' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Notifications</Text>
            <TouchableOpacity onPress={() => setShowNotifsG(false)}><Icon name="close" size={18} color="#9CA3AF" /></TouchableOpacity>
          </View>
          {activeAlertsG.length === 0 && invitations.length === 0 && pendingInterventions.length === 0 && (
            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', paddingVertical: 8 }}>Aucune notification</Text>
          )}
          {activeAlertsG.map((a: any) => (
            <TouchableOpacity key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
              onPress={() => { setShowNotifsG(false); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }}>
              <Icon name="alert-circle" size={14} color="#EF4444" />
              <Text style={{ fontSize: 12, color: '#111827', flex: 1 }}>{a.beneficiary_name}: {a.message}</Text>
            </TouchableOpacity>
          ))}
          {pendingInterventions.map((p: any) => (
            <TouchableOpacity key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
              onPress={() => { setShowNotifsG(false); router.push({ pathname: '/intervention-detail', params: { interventionId: p.id } }); }}>
              <Icon name="navigate" size={14} color="#F59E0B" />
              <Text style={{ fontSize: 12, color: '#111827', flex: 1 }}>Intervention: {p.beneficiary_name}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      {/* Active Alerts */}
      {activeAlertsG.map((a: any) => {
        const myIntervention = a.intervention?.assigned_to === user.id;
        const hasIntervenant = a.intervener_info || a.intervention?.assigned_to;
        const isDispatch = a.incident_state === 'CARE_DISPATCHED' || a.teleassistance_status === 'CARE_DISPATCHED';
        const interventionId = a.intervention?.id;
        return (
          <View key={a.id}>
            <TouchableOpacity onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
              <Card style={{ backgroundColor: 'rgba(239,68,68,0.04)', borderLeftWidth: 3, borderLeftColor: '#EF4444', padding: 16, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name="alert-circle" size={22} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>ALERTE - {a.beneficiary_name}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{a.message}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
            {myIntervention ? (
              <PillButton label="VOUS ETES EN INTERVENTION" icon="shield-checkmark" variant="warm" onPress={() => interventionId ? router.push({ pathname: '/company-intervention-detail', params: { interventionId } }) : router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} />
            ) : hasIntervenant && a.intervener_info && interventionId ? (
              <PillButton label={`SUIVRE ${a.intervener_info.name?.split(' ')[0]?.toUpperCase()}`} icon="navigate" variant="warm" onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId } })} />
            ) : isDispatch ? (
              <PillButton label="EN ATTENTE D'UN INTERVENANT" icon="time" variant="warm" onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} />
            ) : (
              <PillButton label="VOIR L'ALERTE" icon="shield-checkmark" onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} />
            )}
          </View>
        );
      })}

      {/* Pending Interventions */}
      {pendingInterventions.map((piv: any) => (
        <TouchableOpacity key={piv.id} testID={`intervention-${piv.id}`} onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: piv.id } })}>
          <Card style={{ borderLeftWidth: 3, borderLeftColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.03)' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1 }}>{t('intervention_required')}</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 4 }}>{piv.alert_message || piv.notes || 'Alerte'}</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{piv.beneficiary_name} {piv.distance_km ? `- ${piv.distance_km}km` : ''}</Text>
            {piv.status === 'pending_acceptance' && (
              <View style={{ backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 }}>{t('i_intervene')}</Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>
      ))}

      {/* Invitations */}
      {invitations.map((inv: any) => (
        <Card key={inv.id} style={{ borderLeftWidth: 3, borderLeftColor: '#F59E0B' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>INVITATION</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 4 }}>{inv.beneficiary_name} vous invite</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity testID={`accept-inv-${inv.id}`} style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/accept`, { method: 'POST' }, token); Alert.alert('Accepte', 'Vous etes maintenant gardien.'); fetchData(); } catch (e: any) { Alert.alert('Erreur', e.message); } }}>
              <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{t('accept')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
              onPress={async () => { try { await apiFetch(`/api/guardian/invitations/${inv.id}/reject`, { method: 'POST' }, token); fetchData(); } catch {} }}>
              <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '700' }}>{t('reject')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}

      {/* Beneficiary Cards */}
      <SectionHeader title="Mes beneficiaires" />
      {bens.map((b: any) => (
        <TouchableOpacity key={b.id} testID={`beneficiary-card-${b.id}`} onPress={() => router.push({ pathname: '/beneficiary-detail', params: { beneficiaryId: b.id } })}>
          <Card style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>{b.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{b.name}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{b.latest_vitals ? `${b.latest_vitals.heart_rate || '--'} bpm | SpO2 ${b.latest_vitals.spo2 || '--'}%` : 'Pas de donnees'}</Text>
                {b.active_alerts > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Icon name="warning" size={12} color="#EF4444" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>{b.active_alerts} alerte{b.active_alerts > 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>
              <Icon name="chevron-forward" size={18} color="#9CA3AF" />
            </View>
            <StatusBadge label={b.active_alerts > 0 ? t('attention') : t('good_health')} color={b.active_alerts > 0 ? '#EF4444' : undefined} />
          </Card>
        </TouchableOpacity>
      ))}
      {bens.length === 0 && (
        <Card style={{ alignItems: 'center', padding: 32 }}>
          <Icon name="people-outline" size={40} color="#9CA3AF" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 12 }}>Aucun beneficiaire</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>Ajoutez un beneficiaire pour veiller sur lui</Text>
        </Card>
      )}

      <PillButton label={t('add_beneficiary')} icon="heart-outline" onPress={() => setShowAddBenPopup(true)} testID="add-beneficiary-btn" variant="warm" />

      {/* Native Add Beneficiary Modal */}
      {Platform.OS !== 'web' && showAddBenPopup && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 9999 }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }} />
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 48 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Inviter par telephone</Text>
              <TouchableOpacity onPress={() => { setShowAddBenPopup(false); setLinkMessage(''); setLinkPhone(''); setLinkRelationship(''); }}>
                <Icon name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 20 }}>Entrez le numero de telephone de votre proche. S'il a un compte, il recevra une notification pour accepter.</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Numero de telephone</Text>
            <TextInput value={linkPhone} onChangeText={setLinkPhone} placeholder="06 12 34 56 78" keyboardType="phone-pad" style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 14 }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Lien de parente (optionnel)</Text>
            <TextInput value={linkRelationship} onChangeText={setLinkRelationship} placeholder="Ex: Fils, Fille, Voisin..." style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', marginBottom: 20 }} />
            {linkMessage !== '' && (
              <View style={{ padding: 14, borderRadius: 12, marginBottom: 14, backgroundColor: linkMessage.startsWith('Erreur') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)' }}>
                <Text style={{ fontSize: 13, color: linkMessage.startsWith('Erreur') ? '#EF4444' : '#10B981' }}>{linkMessage}</Text>
              </View>
            )}
            <TouchableOpacity
              style={{ backgroundColor: linkPhone.trim() ? '#111827' : '#E5E7EB', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}
              disabled={!linkPhone.trim() || linkingBen}
              onPress={async () => {
                if (!linkPhone.trim() || linkingBen) return;
                const phoneClean = linkPhone.trim().replace(/[\s.\-]/g, '');
                if (phoneClean.length < 10) { setLinkMessage('Erreur : Numero invalide (min 10 chiffres)'); return; }
                setLinkingBen(true); setLinkMessage('');
                try {
                  const res = await apiFetch('/api/guardian/link-with-phone', { method: 'POST', body: JSON.stringify({ phone: linkPhone.trim(), relationship: linkRelationship.trim() }) }, token);
                  setLinkMessage(res.message || 'Demande envoyee !');
                  if (res.status === 'pending' || res.status === 'already_linked' || res.status === 'sms_sent') {
                    fetchData();
                    setTimeout(() => { setShowAddBenPopup(false); setLinkPhone(''); setLinkRelationship(''); setLinkMessage(''); }, 2500);
                  }
                } catch (e: any) { setLinkMessage(`Erreur : ${e.message}`); } finally { setLinkingBen(false); }
              }}
            >
              <Text style={{ color: linkPhone.trim() ? '#FFF' : '#9CA3AF', fontSize: 15, fontWeight: '700' }}>
                {linkingBen ? 'Envoi...' : "Envoyer l'invitation"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Help system */}
      <ContextualTip id="guardian-welcome" icon="people-outline" text="Bienvenue dans votre espace gardien ! Suivez la sante de vos proches en temps reel." color="#111827" />
      <MiniTuto id="guardian-intro" triggerLabel="Guide du gardien" steps={[
        { title: 'Votre role', text: 'Vous veillez sur vos proches a distance avec des notifications instantanees.', icon: 'shield-outline' },
        { title: 'Alertes', text: 'Quand une alerte se declenche, vous pouvez intervenir ou suivre l\'intervenant.', icon: 'alert-circle-outline' },
        { title: 'Ajouter', text: 'Entrez le numero de telephone de votre proche pour lui envoyer une invitation a rejoindre votre espace gardien.', icon: 'person-add-outline' },
      ]} />
    </ScrollView>
  );
}
