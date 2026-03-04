import { Icon, MCIcon } from '../WebIcon';
import { PhoneInputWithPrefix } from '../PhoneInputWithPrefix';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Linking, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { PageExplainer } from '../HelpSystem';
import { confirmAction } from './constants';

import RewardsCard from './RewardsCard';

function PrescriptionManagement({ token, user }: { token: string; user: any }) {
  const { refreshUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', firstName: '', email: '', phone: '', guardianName: '', guardianPhone: '', type: 'bracelet', notes: '' });
  const [phonePrefix, setPhonePrefix] = useState('+33');
  const [guardianPhonePrefix, setGuardianPhonePrefix] = useState('+33');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [actCode, setActCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [selectedPresc, setSelectedPresc] = useState<any>(null);
  const [showRewardsPage, setShowRewardsPage] = useState(false);
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [anonymize, setAnonymize] = useState(false);
  const [showRewardsExplainer, setShowRewardsExplainer] = useState(false);
  const [saadLink, setSaadLink] = useState<any>(null);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const [prescs, sl] = await Promise.all([
        apiFetch('/api/guardian/prescriptions', {}, token).catch(() => []),
        apiFetch('/api/guardian/saad-link', {}, token).catch(() => null),
      ]);
      setPrescriptions(prescs);
      setSaadLink(sl);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  // Is prescripteur space deactivated by SAAD?
  const prescSpaceDeactivated = saadLink && saadLink.prescripteur_active === false;

  useEffect(() => { if (user?.is_prescriber) fetchPrescriptions(); else setLoading(false); }, [fetchPrescriptions, user]);

  const activatePrescriber = async () => {
    if (!actCode.trim()) { setPrescError('Entrez un code prescripteur'); return; }
    setActivating(true); setPrescError('');
    try {
      await apiFetch('/api/guardian/activate-prescriber', { method: 'POST', body: JSON.stringify({ code: actCode.trim().toUpperCase() }) }, token);
      Alert.alert('Active', 'Votre espace prescripteur est maintenant actif !');
      setActCode(''); await refreshUser();
    } catch (e: any) { setPrescError(e.message || 'Code invalide'); } finally { setActivating(false); }
  };

  const submitPrescription = async () => {
    setFormError('');
    // Validations
    if (!formData.name.trim()) { setFormError('Le nom du beneficiaire est obligatoire'); return; }
    if (!formData.firstName.trim()) { setFormError('Le prenom du beneficiaire est obligatoire'); return; }
    const phoneClean = formData.phone.replace(/[\s.\-]/g, '');
    if (!phoneClean || phoneClean.length < 10) { setFormError('Le numero de telephone du beneficiaire est invalide (min 10 chiffres)'); return; }
    if (formData.guardianPhone.trim()) {
      const gPhoneClean = formData.guardianPhone.replace(/[\s.\-]/g, '');
      if (gPhoneClean.length < 10) { setFormError('Le numero de l\'aidant est invalide (min 10 chiffres)'); return; }
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/guardian/prescriptions', { method: 'POST', body: JSON.stringify({
        beneficiary_name: formData.name, beneficiary_first_name: formData.firstName,
        beneficiary_email: formData.email, beneficiary_phone: formData.phone,
        guardian_contact_name: formData.guardianName, guardian_contact_phone: formData.guardianPhone,
        subscription_type: formData.type, notes: formData.notes,
      }) }, token);
      setShowForm(false); setFormData({ name: '', firstName: '', email: '', phone: '', guardianName: '', guardianPhone: '', type: 'bracelet', notes: '' }); setFormError(''); fetchPrescriptions();
      if (Platform.OS === 'web') window.alert('Prescription creee ! Un SMS a ete envoye.');
      else Alert.alert('Prescription creee');
    } catch (e: any) { setFormError(e.message || 'Erreur lors de la creation'); } finally { setSubmitting(false); }
  };

  const validated = prescriptions.filter((p: any) => p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created');
  const pending = prescriptions.filter((p: any) => p.status === 'pending');
  const [prescTab, setPrescTab] = useState<'pending'|'validated'>('pending');
  const displayedPresc = prescTab === 'pending' ? pending : validated;

  // Montant du mois en cours (souscriptions validées ce mois seulement)
  const now = new Date();
  const currentMonthValidated = validated.filter((p: any) => {
    const d = new Date(p.created_at || p.date || '');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const saadCommType = saadLink?.commission_type || 'monthly';
  const isMonthlyG = saadCommType === 'monthly';
  const commLabelG = isMonthlyG ? '/mois' : '';
  const getCommission = (p: any) => {
    if (saadCommType === 'oneshot') return p.subscription_type === 'bracelet_gilet' ? 200 : 100;
    return p.subscription_type === 'bracelet_gilet' ? 15 : 8;
  };
  const currentMonthAmount = currentMonthValidated.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0);
  const allTimeAmount = validated.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0);

  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

  const BG_ORANGE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
  const BG_GREEN_P = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const LOGO_URL_P = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';
  const BG_HEADER_P = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';

  const [slideActivatedP, setSlideActivatedP] = useState(false);
  const [prescError, setPrescError] = useState('');

  if (loading) return <FullScreenLoader />;

  /* ─── EXPLAINER: Programme recompenses (early return) ─── */
  if (showRewardsExplainer && Platform.OS === 'web') {
    const BG_REWARD_EX = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png';
    return (
      <div data-testid="programme-recompenses-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_REWARD_EX} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />

        {/* Top bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div data-testid="back-from-rewards-explainer" onClick={() => setShowRewardsExplainer(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#FFF' }}>Programme de recompenses</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Intro */}
          <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
              <i className="ri-trophy-line" style={{ fontSize: 32, color: '#FFD700' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Challenges Prescripteurs</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Chaque mois, les prescripteurs les plus actifs sont recompenses. Prescrivez des abonnements CARE WATCH et gagnez des primes.
            </div>
          </div>

          {/* How it works */}
          <div style={{ marginBottom: 28 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Comment ca fonctionne</div>
            {[
              { icon: 'ri-file-text-line', title: 'Prescrivez un abonnement', desc: 'Creez une prescription pour un beneficiaire. Une fois que celui-ci souscrit, la prescription est validee et comptabilisee.', color: '#D4845A' },
              { icon: 'ri-bar-chart-box-line', title: 'Montez dans le classement', desc: 'Chaque prescription validee vous fait monter dans le classement mensuel. Plus vous prescrivez, plus vous montez.', color: '#3B82F6' },
              { icon: 'ri-trophy-line', title: 'Gagnez des primes', desc: 'A la fin du mois, les 3 meilleurs prescripteurs recoivent une prime automatiquement versee. Les montants varient chaque mois.', color: '#FFD700' },
              { icon: 'ri-refresh-line', title: 'Recommencez', desc: 'Le classement est reinitialise chaque 1er du mois. Chaque mois est une nouvelle chance de gagner.', color: '#10B981' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}25`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                </div>
                <div style={{ flex: 1, paddingTop: 2 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Prizes */}
          <div style={{ marginBottom: 28 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Grille des primes</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 } as any}>
              {[
                { pos: '1er', amount: '100 EUR', color: '#FFD700', icon: 'ri-medal-line' },
                { pos: '2eme', amount: '70 EUR', color: '#C0C0C0', icon: 'ri-medal-line' },
                { pos: '3eme', amount: '30 EUR', color: '#CD7F32', icon: 'ri-award-line' },
              ].map((p, i) => (
                <div key={i} style={{ padding: '18px 12px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: `${p.color}30`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as any}>
                    <i className={p.icon} style={{ fontSize: 22, color: p.color }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{p.pos}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.amount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div style={{ marginBottom: 28 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Regles du programme</div>
            {[
              'Seules les prescriptions validees (abonnement actif) sont comptabilisees.',
              'Le classement est reinitialise le 1er de chaque mois a 00h00.',
              'Les primes sont versees dans les 5 jours ouvrables suivant la fin du mois.',
              'En cas d\'egalite, le prescripteur ayant atteint le nombre en premier est favorise.',
              'Le programme est reserve aux prescripteurs actifs avec un code structure valide.',
              'Les montants des primes peuvent varier chaque mois selon les conditions du programme.',
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 } as any}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
                  <i className="ri-check-line" style={{ fontSize: 12, color: '#10B981' }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{rule}</span>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ marginBottom: 20 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Questions frequentes</div>
            {[
              { q: 'Comment activer mon espace prescripteur ?', a: 'Vous devez entrer le code a 6 chiffres fourni par votre structure. Ce code est unique et vous est attribue lors de votre inscription.' },
              { q: 'Quand serai-je paye ?', a: 'Les primes sont versees debut du mois suivant. Les commissions sur les prescriptions sont payees le 1er de chaque mois.' },
              { q: 'Le classement est-il anonyme ?', a: 'Oui, vous pouvez activer le mode anonyme depuis la page de classement. Les autres prescripteurs ne verront que votre initiale.' },
              { q: 'Puis-je gagner chaque mois ?', a: 'Absolument. Le classement est reinitialise chaque mois, donc chaque mois est une nouvelle opportunite.' },
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

  /* ─── INACTIF: plein écran orange ─── */
  if (!user?.is_prescriber && Platform.OS === 'web') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', zIndex: 5 } as any}>
        <img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 28px', width: '100%', maxWidth: 400 } as any}>
          {!slideActivatedP ? (
            <>
              <img src={LOGO_URL_P} alt="Chutex" className="anim-up" style={{ height: 60, marginTop: -30, marginBottom: 24, filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.15))' } as any} />
              <div className="anim-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, backdropFilter: 'blur(8px)' } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Inactif</span>
              </div>
              <h2 className="anim-up d2" style={{ fontSize: 28, fontWeight: 800, color: '#FFF', margin: '0 0 12px', textAlign: 'center' } as any}>Prescription</h2>
              <p className="anim-up d3" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 40px' } as any}>
                Activer votre espace de prescription et suivez en temps reel vos commissions.
              </p>
              <div className="anim-up d4" style={{ width: '100%' } as any}>
                <div style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' } as any}
                  onMouseDown={(e: any) => {
                    const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
                    if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52;
                    const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - e.clientX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { thumb.style.transform = `translateX(${maxX}px)`; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); setSlideActivatedP(true); } };
                    const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                  }}
                  onTouchStart={(e: any) => {
                    const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
                    if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX;
                    const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); setSlideActivatedP(true); } };
                    const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
                    bar.addEventListener('touchmove', onMove, { passive: true }); bar.addEventListener('touchend', onUp);
                  }}>
                  <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, pointerEvents: 'none', paddingLeft: 36 } as any}>Glisser pour commencer</div>
                </div>
              </div>
            </>
          ) : (
            <div className="anim-up" style={{ width: '100%', textAlign: 'center' } as any}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, backdropFilter: 'blur(8px)' } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Inactif</span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#FFF', margin: '0 0 8px' }}>Activation</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' } as any}>Renseigner votre code.</p>

              {/* Glass red error */}
              {prescError && (
                <div className="anim-up" style={{ width: '100%', padding: '12px 18px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 20, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#FCA5A5' } as any} onClick={() => setPrescError('')}>
                  {prescError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32 } as any}>
                {[0,1,2,3,4,5].map(i => (
                  <input key={i} id={`ppin-${i}`} type="text" inputMode="numeric" maxLength={1}
                    value={actCode[i] || ''}
                    onChange={(e: any) => { const v = e.target.value.replace(/[^0-9]/g, ''); const arr = actCode.split(''); arr[i] = v; const nc = arr.join('').slice(0,6); setActCode(nc); if (v && i < 5) { const n = document.getElementById(`ppin-${i+1}`); if (n) (n as HTMLInputElement).focus(); } }}
                    onKeyDown={(e: any) => { if (e.key === 'Backspace' && !actCode[i] && i > 0) { const p = document.getElementById(`ppin-${i-1}`); if (p) (p as HTMLInputElement).focus(); } }}
                    style={{ width: 48, height: 48, borderRadius: '50%', textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#FFF', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' } as any}
                    onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = '0 0 12px rgba(255,255,255,0.15)'; }}
                    onBlur={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>
              <button onClick={() => activatePrescriber()} disabled={activating || actCode.length < 6}
                style={{ width: '100%', padding: '16px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#FFF', color: '#111', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', opacity: (activating || actCode.length < 6) ? 0.5 : 1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'all 0.25s ease' } as any}>
                {activating ? 'Activation...' : 'Confirmer le code'}
              </button>
              <button onClick={() => setSlideActivatedP(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16, padding: 8 } as any}>Retour</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user?.is_prescriber) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1a0a0a' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 12 }}>Prescription</Text>
        <TextInput testID="prescriber-code-input" style={{ fontSize: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', textAlign: 'center', letterSpacing: 4, marginBottom: 16 }}
          placeholder="CODE PRESCRIPTEUR" placeholderTextColor="rgba(255,255,255,0.3)" value={actCode} onChangeText={setActCode} autoCapitalize="characters" />
        <TouchableOpacity testID="activate-prescriber-btn" style={{ backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }} onPress={activatePrescriber} disabled={activating}>
          {activating ? <ActivityIndicator color="#111" /> : <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>Activer</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ─── REWARDS PAGE (replaces entire view) ─── */
  if (showRewardsPage && rewardsData && Platform.OS === 'web') {
    const BG_REWARD = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png';
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_REWARD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setShowRewardsPage(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Challenge actif</span>
          </div>
          <div onClick={() => setAnonymize(!anonymize)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 999, background: anonymize ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${anonymize ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <span style={{ fontSize: 10, fontWeight: 600, color: anonymize ? '#10B981' : 'rgba(255,255,255,0.6)' }}>{anonymize ? 'Anonyme' : 'Visible'}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Recompenses</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Programme de challenge prescripteur</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#FFF', letterSpacing: -2, marginTop: 8 }}>{rewardsData.total_earned}EUR</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Total gagne</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12, textAlign: 'center' } as any}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF' }}>{rewardsData.current_position}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>e</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{rewardsData.current_prescriptions} prescription(s) ce mois</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 } as any}>
            {[{ pos: '1er', amount: rewardsData.prizes?.prize_1 || 100 }, { pos: '2e', amount: rewardsData.prizes?.prize_2 || 70 }, { pos: '3e', amount: rewardsData.prizes?.prize_3 || 30 }].map(r => (
              <div key={r.pos} style={{ textAlign: 'center' } as any}><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{r.pos}</div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 2 }}>+{r.amount}EUR</div></div>
            ))}
          </div>
          {rewardsData.my_history?.length > 0 && <><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Mon historique</div>{rewardsData.my_history.map((h: any, i: number) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 } as any}><div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{h.month_label}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>#{h.position} · {h.prescriptions_count} prescriptions</div></div><div style={{ fontSize: 18, fontWeight: 900, color: h.reward > 0 ? '#10B981' : '#FFF' }}>+{h.reward}EUR</div></div>)}</>}
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginTop: 16, marginBottom: 10 }}>Tous les challenges</div>
          {(rewardsData.all_history || []).map((ch: any) => <div key={ch.month} style={{ marginBottom: 8 } as any}><div onClick={() => setExpandedChallenge(expandedChallenge === ch.month ? null : ch.month)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: expandedChallenge === ch.month ? '16px 16px 0 0' : 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' } as any}><div><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{ch.month_label || ch.month}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{ch.ranking?.length || 0} participant(s)</div></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ transform: expandedChallenge === ch.month ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' } as any}><path d="M6 9l6 6 6-6"/></svg></div>{expandedChallenge === ch.month && ch.ranking?.length > 0 && <div style={{ padding: '0 16px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderRadius: '0 0 16px 16px' } as any}>{ch.ranking.slice(0, 5).map((r: any, j: number) => <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 6, borderBottom: j < Math.min(ch.ranking.length, 5) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}><div style={{ width: 28, height: 28, borderRadius: 999, background: j === 0 ? '#FFD700' : j === 1 ? '#C0C0C0' : j === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 11, fontWeight: 800, color: j < 3 ? '#111' : '#FFF' }}>#{r.position}</span></div><div><div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{anonymize && r.name !== user.name ? r.name.charAt(0) + '***' : r.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.prescriptions_count || 0} prescriptions</div></div></div><span style={{ fontSize: 15, fontWeight: 800, color: r.reward > 0 ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{r.reward > 0 ? `+${r.reward}EUR` : '-'}</span></div>)}</div>}{expandedChallenge === ch.month && (!ch.ranking || ch.ranking.length === 0) && <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderRadius: '0 0 16px 16px', textAlign: 'center' } as any}><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Challenge en cours</div></div>}</div>)}

          {/* PRESENTATION DU CHALLENGE */}
          <div style={{ marginTop: 24, padding: '20px', borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-information-line" style={{ fontSize: 22, color: '#FFD700' }} /></div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF' }}>Comment ca marche ?</div>
            </div>
            {[
              { icon: 'ri-file-text-line', title: 'Prescrivez', desc: 'Creez une prescription pour un beneficiaire. Quand il souscrit, elle est validee.', color: '#D4845A' },
              { icon: 'ri-bar-chart-box-line', title: 'Montez au classement', desc: 'Chaque validation vous fait monter. Plus vous prescrivez, plus vous montez.', color: '#3B82F6' },
              { icon: 'ri-trophy-line', title: 'Gagnez des primes', desc: 'Top 3 mensuel: 1er 100EUR, 2e 70EUR, 3e 30EUR. Verse automatiquement.', color: '#FFD700' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={s.icon} style={{ fontSize: 18, color: s.color }} /></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 2 }}>{s.title}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{s.desc}</div></div>
              </div>
            ))}
            <div onClick={() => setShowRewardsExplainer(true)} style={{ padding: '12px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', color: '#FFD700', fontSize: 13, fontWeight: 700, marginTop: 4 } as any}>Voir le programme complet</div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── DETAIL PAGE: prescription (replaces entire view) ─── */
  if (selectedPresc && Platform.OS === 'web') {
    const isValidated = selectedPresc.status === 'subscribed' || selectedPresc.status === 'validated' || selectedPresc.status === 'contract_created';
    const bgImg = isValidated ? BG_GREEN_P : BG_ORANGE;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setSelectedPresc(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isValidated ? '#10B981' : '#F59E0B' } as any} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isValidated ? 'Valide' : 'En attente'}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Prescription</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{selectedPresc.subscription_type === 'bracelet_gilet' ? 'Bracelet Elio + Gilet Elder — 79,90€/mois' : 'Bracelet Elio — 39,90€/mois'}</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#FFF', letterSpacing: -2, marginTop: 8 }}>+{selectedPresc.commission || getCommission(selectedPresc)}EUR{commLabelG}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
            {[
              { label: 'Beneficiaire', value: selectedPresc.beneficiary_name || '-' },
              { label: 'Statut', value: isValidated ? 'Valide' : 'En attente' },
              { label: 'Type', value: selectedPresc.subscription_type === 'bracelet_gilet' ? 'Bracelet + Gilet Elder' : 'Bracelet Elio' },
              { label: 'Paiement', value: isValidated ? 'Au 1er du mois' : 'Apres validation' },
              { label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-' },
              { label: 'Commission', value: `+${selectedPresc.commission || getCommission(selectedPresc)} EUR` },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{item.value}</div>
              </div>
            ))}
          </div>
          {selectedPresc.beneficiary_email && <div onClick={() => window.location.href = `mailto:${selectedPresc.beneficiary_email}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{selectedPresc.beneficiary_email}</div></div>}
          {selectedPresc.beneficiary_phone && <div onClick={() => window.location.href = `tel:${selectedPresc.beneficiary_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{selectedPresc.beneficiary_phone}</div></div>}
          {/* Aidant contact */}
          {selectedPresc.guardian_contact_name && (
            <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: 8 } as any}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(167,139,250,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Aidant / Contact</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className="ri-user-heart-line" style={{ fontSize: 16, color: '#A78BFA' }} />
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{selectedPresc.guardian_contact_name}</div>
                  {selectedPresc.guardian_contact_phone && <div onClick={() => window.location.href = `tel:${selectedPresc.guardian_contact_phone}`} style={{ fontSize: 12, color: '#10B981', fontWeight: 600, cursor: 'pointer', marginTop: 2 }}>{selectedPresc.guardian_contact_phone}</div>}
                </div>
              </div>
            </div>
          )}
          {selectedPresc.notes && <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Notes</div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF', lineHeight: 1.5 }}>{selectedPresc.notes}</div></div>}
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Prescrit par</div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{user.name} — {user.prescriber_structure || 'Structure'}</div></div>
        </div>
      </div>
    );
  }

  /* ─── ACTIF: page prescriptions plein ecran ─── */
  if (Platform.OS === 'web') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER_P} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            {/* Pilule statut — inactive si SAAD a désactivé */}
            {prescSpaceDeactivated ? (
              <div onClick={() => window.alert(`Votre espace prescripteur a été temporairement désactivé par ${saadLink?.company_name || 'votre structure SAAD'}. Contactez votre administrateur pour le réactiver.`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', marginBottom: 10 } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#EF4444' }}>Espace désactivé par {saadLink?.company_name || 'votre SAAD'}</span>
                <i className="ri-information-line" style={{ fontSize: 14, color: '#EF4444' }} />
              </div>
            ) : (
              <div onClick={() => setShowPrescModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', marginBottom: 10 } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Actif - {saadLink?.company_name || user.prescription_structure || user.structure_name || 'Structure'}</span>
              </div>
            )}
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Prescription</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: prescSpaceDeactivated ? 'rgba(255,255,255,0.4)' : '#FFF', letterSpacing: -1, marginBottom: 2 }}>+{currentMonthAmount}EUR</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Validés ce mois · {allTimeAmount} EUR au total</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 10 } as any}>
              <div onClick={() => setPrescTab('pending')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'pending' ? '#FFF' : 'transparent', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours ({pending.length})</div>
              <div onClick={() => setPrescTab('validated')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'validated' ? '#FFF' : 'transparent', color: prescTab === 'validated' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Validees ({validated.length})</div>
            </div>
          </div>
          {/* Nouvelle prescription button — désactivé si SAAD a révoqué */}
          {prescSpaceDeactivated ? (
            <div onClick={() => window.alert(`Votre espace prescripteur est désactivé. Contactez ${saadLink?.company_name || 'votre SAAD'} pour le réactiver.`)} style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'not-allowed', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 } as any}>
              <i className="ri-forbid-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Nouvelle prescription (désactivée)</span>
            </div>
          ) : (
            <div onClick={() => setShowForm(true)} data-testid="new-prescription-btn" style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, transition: 'all 0.2s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}>
              <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Nouvelle prescription</span>
            </div>
          )}
          {/* Rewards card */}
          <div onClick={() => { apiFetch("/api/rewards/history", {}, token).then((d2: any) => { setRewardsData(d2); setShowRewardsPage(true); }).catch(() => {}); }} style={{ borderRadius: 20, overflow: "hidden", position: "relative", padding: "18px", marginBottom: 14, cursor: "pointer" } as any} data-glass-card>
            <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14 } as any}><i className="ri-trophy-line" style={{ fontSize: 22, color: '#FFF' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Recompenses</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Challenge prescripteurs du mois</div></div><div style={{ display: 'flex', gap: 3 } as any}>{[{ c: '#FFD700' }, { c: '#C0C0C0' }, { c: '#CD7F32' }].map((m, i) => (<div key={i} style={{ width: 18, height: 18, borderRadius: 999, background: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 7, fontWeight: 800, color: '#FFF' }}>{i+1}</span></div>))}</div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /></div>
          </div>
          {/* Prescription cards — glass */}
          {displayedPresc.map(p => (
            <div key={p.id} onClick={() => setSelectedPresc(p)} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any} data-glass-card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } as any}>
                <div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{p.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{p.subscription_type === 'bracelet_gilet' ? 'Bracelet + Gilet Elder' : 'Bracelet Elio'}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: (p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created') ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: (p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created') ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{(p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created') ? 'Validee' : 'En cours'}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>+{p.commission || getCommission(p)}EUR${commLabelG}</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '8px 16px' } as any}><i className="ri-heart-line" style={{ fontSize: 14, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span></div></div>
            </div>
          ))}
          {displayedPresc.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-file-text-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Aucune prescription {prescTab === 'pending' ? 'en cours' : 'validee'}</div></div>}
        </div>
        {/* POPUP STRUCTURE PRESCRIPTEUR — meme design que Intervenant Care */}
        {showPrescModal && (
          <div onClick={() => setShowPrescModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => setShowPrescModal(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Structure prescripteur</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 } as any}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(212,132,90,0.15)', border: '1px solid rgba(212,132,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 28, color: '#E8A87C' }} /></div>
                <div><div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', letterSpacing: -0.5 }}>{user.prescription_structure || user.structure_name || 'Structure'}</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Prescripteur actif</span></div></div>
              </div>
              {[
                saadLink?.company_name && { icon: 'ri-building-line', label: 'Structure SAAD', value: saadLink.company_name },
                saadLink?.agency_name && { icon: 'ri-map-pin-line', label: 'Agence', value: saadLink.agency_name },
                saadLink?.commission_type && { icon: 'ri-hand-coin-line', label: 'Mode commission', value: saadLink.commission_type === 'oneshot' ? 'Commission unique' : 'Commission mensuelle' },
                user.phone && { icon: 'ri-phone-line', label: 'Telephone', value: user.phone, phone: true },
                user.email && { icon: 'ri-mail-line', label: 'Email', value: user.email },
                user.name && { icon: 'ri-user-line', label: 'Prescripteur', value: user.name },
                { icon: 'ri-file-text-line', label: 'Prescriptions', value: `${prescriptions.length} prescription(s)` },
                { icon: 'ri-money-euro-circle-line', label: 'Commission estimee', value: `${allTimeAmount} EUR${commLabelG}` },
              ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
                <div key={i}>
                  <div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>
                  </div>
                  {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}
                </div>
              ))}
              <div onClick={async () => { try { await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ is_prescriber: false }) }, token); await refreshUser(); setShowPrescModal(false); } catch {} }} style={{ padding: '15px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 14, fontWeight: 700, marginTop: 20, transition: 'all 0.2s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>Desactiver mon espace prescripteur</div>
            </div>
          </div>
        )}
        {/* GLASS POPUP — Nouvelle prescription (web) */}
        {showForm && (
          <div onClick={() => { setShowForm(false); setFormError(''); }} data-testid="new-prescription-popup" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => { setShowForm(false); setFormError(''); }} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Prescription</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 24 }}>Nouvelle prescription</div>

              {/* Error message */}
              {formError && (
                <div onClick={() => setFormError('')} style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' } as any}>
                  <i className="ri-error-warning-line" style={{ fontSize: 16, color: '#EF4444', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.4 }}>{formError}</span>
                </div>
              )}

              {/* Beneficiaire section */}
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Beneficiaire</div>
              {[
                { key: 'name', label: 'Nom *', placeholder: 'Dupont', required: true },
                { key: 'firstName', label: 'Prenom *', placeholder: 'Jean', required: true },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: f.required ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                  <input type="text" value={(formData as any)[f.key]} onChange={(e: any) => { setFormData({ ...formData, [f.key]: e.target.value }); setFormError(''); }} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${f.required && formError && !(formData as any)[f.key]?.trim() ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`, color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
              ))}
              <div style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Telephone *</div>
                <PhoneInputWithPrefix value={formData.phone} onChangeText={(v: string) => { setFormData({ ...formData, phone: v }); setFormError(''); }} prefix={phonePrefix} onPrefixChange={setPhonePrefix} placeholder="6 12 34 56 78" error={!!formError && !formData.phone.trim()} />
              </div>
              <div style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Email</div>
                <input type="email" value={formData.email} onChange={(e: any) => { setFormData({ ...formData, email: e.target.value }); setFormError(''); }} placeholder="jean@email.com"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>

              {/* Aidant section */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' } as any} />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Aidant / Contact</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>Recevra un SMS pour finaliser la souscription</div>
              {[
                { key: 'guardianName', label: 'Nom de l\'aidant', placeholder: 'Marie Dupont' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                  <input type="text" value={(formData as any)[f.key]} onChange={(e: any) => { setFormData({ ...formData, [f.key]: e.target.value }); setFormError(''); }} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
              ))}
              <div style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Telephone de l'aidant</div>
                <PhoneInputWithPrefix value={formData.guardianPhone} onChangeText={(v: string) => { setFormData({ ...formData, guardianPhone: v }); setFormError(''); }} prefix={guardianPhonePrefix} onPrefixChange={setGuardianPhonePrefix} placeholder="6 98 76 54 32" />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Notes</div>
                <input value={formData.notes} onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })} placeholder="Informations supplementaires..."
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>

              <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Type d'abonnement</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 } as any}>
                {[{k:'bracelet', l:'Bracelet Elio', p:'39,90€/mois'}, {k:'bracelet_gilet', l:'Bracelet + Gilet Elder', p:'79,90€/mois'}].map(t => (
                  <div key={t.k} onClick={() => setFormData({ ...formData, type: t.k })} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', border: `1.5px solid ${formData.type === t.k ? '#FFF' : 'rgba(255,255,255,0.1)'}`, background: formData.type === t.k ? 'rgba(255,255,255,0.15)' : 'transparent', color: formData.type === t.k ? '#FFF' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, transition: 'all 0.2s' } as any}><div>{t.l}</div><div style={{ fontSize: 10, marginTop: 2, color: formData.type === t.k ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{t.p}</div></div>
                ))}
              </div>
              <div onClick={() => { if (!submitting) submitPrescription(); }} data-testid="submit-prescription-btn" style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: submitting ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 15, fontWeight: 700, transition: 'all 0.2s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}>
                {submitting ? '...' : 'Envoyer la prescription'}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={[d.sc, { paddingBottom: 80, paddingHorizontal: 0 }]} showsVerticalScrollIndicator={false}>
      {/* Header orange avec toggle DANS le header */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'relative', padding: '24px 20px 20px', textAlign: 'center', overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 } as any}>
          <img src={BG_HEADER_P} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2 } as any}>
            <div onClick={() => setShowPrescModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', marginBottom: 10, cursor: 'pointer' } as any}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Actif - {saadLink?.company_name || user.prescription_structure || user.structure_name || 'Structure'}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Prescription</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div onClick={() => setPrescTab('pending')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'pending' ? '#FFF' : 'transparent', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s', boxShadow: prescTab === 'pending' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' } as any}>En cours</div>
              <div onClick={() => setPrescTab('validated')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'validated' ? '#FFF' : 'transparent', color: prescTab === 'validated' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s', boxShadow: prescTab === 'validated' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' } as any}>Cloturees</div>
            </div>
            {/* Total */}
            <div style={{ marginTop: 16 } as any}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Total</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>+{displayedPresc.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0)}EUR</div>
            </div>
            <div onClick={() => setShowRewardsExplainer(true)} data-testid="programme-recompenses-btn" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
              <i className="ri-trophy-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Programme de recompenses</span>
            </div>
          </div>
        </div>
      ) : (
        <View style={{ backgroundColor: '#8B4513', padding: 20, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16, marginBottom: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Actif - {saadLink?.company_name || user.prescription_structure || 'Structure'}</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 14 }}>Prescription</Text>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: 4 }}>
            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, prescTab === 'pending' && { backgroundColor: '#FFF' }]} onPress={() => setPrescTab('pending')}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)' }}>En cours</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, prescTab === 'validated' && { backgroundColor: '#FFF' }]} onPress={() => setPrescTab('validated')}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: prescTab === 'validated' ? '#111' : 'rgba(255,255,255,0.8)' }}>Cloturees</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* White container for cards */}
      <View style={{ padding: 16, paddingTop: 12 }}>

      {/* Récompenses card — dark satin background */}
      {Platform.OS === 'web' ? (
        <div onClick={() => { apiFetch("/api/rewards/history", {}, token).then((d: any) => { setRewardsData(d); setShowRewardsPage(true); }).catch(() => {}); }} style={{ borderRadius: 20, overflow: "hidden", position: "relative", padding: "18px", marginBottom: 14, cursor: "pointer", boxShadow: '0 8px 24px rgba(0,0,0,.15)' } as any}>
          <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 } as any}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Recompenses</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>01/04/2026 - 30/04/2026</div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' } as any} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#FFF' }}>Actif</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 10 } as any}>
              {[{ pos: '1er', amount: '+100EUR' }, { pos: '2eme', amount: '+70EUR' }, { pos: '3eme', amount: '+30EUR' }].map(r => (
                <div key={r.pos} style={{ textAlign: 'center' } as any}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{r.pos}</div>
                  <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, color: '#FFF', marginTop: 4 } as any}>{r.amount}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Votre position actuelle 26eme</div>
          </div>
        </div>
      ) : (
        <TouchableOpacity onPress={() => setShowPrescModal(true)} style={{ backgroundColor: '#1a1a1a', borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>Recompenses</Text><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>01/04/2026 - 30/04/2026</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} /><Text style={{ fontSize: 11, fontWeight: '600', color: '#FFF' }}>Actif</Text></View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
            {[{ pos: '1er', amount: '+100EUR' }, { pos: '2eme', amount: '+70EUR' }, { pos: '3eme', amount: '+30EUR' }].map(r => (
              <View key={r.pos} style={{ alignItems: 'center' }}><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{r.pos}</Text><View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 }}><Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>{r.amount}</Text></View></View>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Votre position actuelle 26eme</Text>
        </TouchableOpacity>
      )}

      {/* Prescription cards */}
      <View>
        {displayedPresc.length > 0 ? displayedPresc.map((p: any) => {
          const isValidated = p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created';
          return Platform.OS === 'web' ? (
            <div key={p.id} onClick={() => { setSelectedPresc(p); }}
              style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 12, cursor: 'pointer', minHeight: 90, boxShadow: '0 8px 24px rgba(0,0,0,.12)', transition: 'transform 0.25s ease' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <img src={isValidated ? BG_GREEN_P : BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />
              <div style={{ position: 'relative', zIndex: 2 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } as any}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{p.beneficiary_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{p.subscription_type === 'teleassistance' ? 'Abonnement teleassistance' : `Abonnement ${p.subscription_type || 'Standard'}`}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 12, padding: '6px 12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.2)' } as any}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>+{p.commission || getCommission(p)}EUR{commLabelG}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{isValidated ? 'Valide' : 'En attente'}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.18)', borderRadius: 999, padding: '8px 16px', border: '1px solid rgba(255,255,255,.2)' } as any}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <TouchableOpacity key={p.id} onPress={() => { setSelectedPresc(p); setShowPrescModal(true); }}>
              <View style={{ borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 12, backgroundColor: isValidated ? '#0a3a2a' : '#5a2a0a' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{p.beneficiary_name}</Text><Text style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{p.subscription_type === 'bracelet_gilet' ? 'Bracelet + Gilet Elder' : 'Bracelet Elio'}</Text></View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>+{p.commission || getCommission(p)}EUR{commLabelG}</Text></View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{isValidated ? 'Valide' : 'En attente'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.18)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 }}>
                    <Icon name="heart-outline" size={16} color="#FFF" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Consulter</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }) : (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Icon name="document-text-outline" size={32} color="#9CA3AF" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12 }}>Aucune prescription</Text>
          </View>
        )}
      </View>

      {/* New prescription button */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity onPress={() => setShowForm(true)} style={{
          backgroundColor: '#111', borderRadius: 999, paddingVertical: 16, flexDirection: 'row',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Nouvelle prescription</Text>
          <Icon name="heart-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      </View>{/* End white rounded container */}

      {/* Prescriber Detail Modal — GLASS DARK */}
      <Modal visible={showPrescModal} transparent animationType="fade" onRequestClose={() => setShowPrescModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', ...(Platform.OS === 'web' ? { backgroundColor: 'rgba(0,0,0,0.5)' } : { backgroundColor: 'rgba(0,0,0,0.6)' }) } as any}>
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%',
            backgroundColor: '#111',
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)', borderTop: '1px solid rgba(255,255,255,0.1)' } : {}),
          } as any}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>Espace Prescripteur</Text>
              <TouchableOpacity onPress={() => setShowPrescModal(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="medical" size={24} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{user.prescriber_structure || 'Structure'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>ACTIF</Text>
                </View>
              </View>

              {/* Details */}
              {[
                { icon: 'business-outline', label: 'Structure', value: user.prescriber_structure || '-' },
                { icon: 'key-outline', label: 'Code', value: user.prescriber_code_used || '-' },
                { icon: 'call-outline', label: 'Telephone', value: user.phone || '-' },
                { icon: 'mail-outline', label: 'Email', value: user.email || '-' },
              ].map(({ icon, label, value }) => value !== '-' ? (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={icon as any} size={14} color="rgba(255,255,255,0.5)" />
                  </View>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 80 }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF', flex: 1 }}>{value}</Text>
                </View>
              ) : null)}

              {/* Desactiver — glass red button */}
              <TouchableOpacity style={{
                marginTop: 24, borderRadius: 999, paddingVertical: 16, alignItems: 'center',
                backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
              } as any}
                onPress={() => { setShowPrescModal(false); confirmAction('Desactiver', 'Confirmer la desactivation ?', async () => {
                  try { await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ is_prescriber: false }) }, token); await refreshUser(); } catch {}
                }); }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FCA5A5' }}>Desactiver mon espace prescripteur</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Prescription Form Modal — GLASS DARK */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', ...(Platform.OS === 'web' ? { backgroundColor: 'rgba(0,0,0,0.5)' } : { backgroundColor: 'rgba(0,0,0,0.6)' }) } as any}>
          <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', backgroundColor: '#111', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)', borderTop: '1px solid rgba(255,255,255,0.1)' } : {}) } as any}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>Nouvelle prescription</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}><Icon name="close" size={20} color="#FFF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Nom du beneficiaire', placeholder: 'Jean Dupont' },
                { key: 'email', label: 'Email', placeholder: 'jean@email.com' },
                { key: 'phone', label: 'Telephone', placeholder: '06 12 34 56 78' },
                { key: 'notes', label: 'Notes', placeholder: 'Informations supplementaires...' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFF' }}
                    placeholder={f.placeholder} placeholderTextColor="#9CA3AF"
                    value={(formData as any)[f.key]} onChangeText={(v: string) => setFormData({ ...formData, [f.key]: v })} />
                </View>
              ))}
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Type d'abonnement</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {[{k:'bracelet', l:'Bracelet Elio', p:'39,90€/mois'}, {k:'bracelet_gilet', l:'Bracelet + Gilet', p:'79,90€/mois'}].map(t => (
                  <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: 'center', borderWidth: 1.5, borderColor: formData.type === t ? '#FFF' : 'rgba(255,255,255,0.1)', backgroundColor: formData.type === t ? 'rgba(255,255,255,0.15)' : 'transparent' }} onPress={() => setFormData({ ...formData, type: t })}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: formData.type === t.k ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{t.l}{'\n'}<Text style={{ fontSize: 10, color: formData.type === t.k ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{t.p}</Text></Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={submitPrescription} disabled={submitting} style={{ backgroundColor: '#111', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Envoyer la prescription</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Native detail */}
      {selectedPresc && Platform.OS !== 'web' && (
        <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
          <View style={{ flex: 1, backgroundColor: selectedPresc.status === 'subscribed' ? '#0a2a1a' : '#2a1a0a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ position: 'absolute', top: 50, left: 20 }}><Icon name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 6 }}>Prescription</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>{selectedPresc.subscription_type || 'Standard'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 16 }}>{selectedPresc.beneficiary_name}</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{selectedPresc.beneficiary_email}</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>{selectedPresc.beneficiary_phone}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Commission</Text>
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFF' }}>+{selectedPresc.commission || getCommission(selectedPresc)}EUR{commLabelG}</Text>
          </View>
        </Modal>
      )}

    </ScrollView>
  );
}

export default PrescriptionManagement;
