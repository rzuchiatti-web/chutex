import { Icon } from '../WebIcon';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { apiFetch } from '../../services/api';
import { s, getCleanLabel, BG_VIOLET, BG_GREEN, LOGO_URL } from './teleconsultStyles';

export function GuardianInterventions({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [ivs, setIvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ivCode, setIvCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [showCareModal, setShowCareModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saadLink, setSaadLink] = useState<any>(null);
  const [ivTab, setIvTab] = useState<'active'|'done'>('active');
  const [slideActivated, setSlideActivated] = useState(false);
  const [careError, setCareError] = useState('');
  const [selectedIv, setSelectedIv] = useState<any>(null);
  const [showIntervenantPopup, setShowIntervenantPopup] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showStructurePopup, setShowStructurePopup] = useState(false);

  const fetchIvs = async () => {
    try {
      const [ivsData, sl] = await Promise.all([
        apiFetch('/api/interventions', {}, token).catch(() => []),
        apiFetch('/api/guardian/saad-link', {}, token).catch(() => null),
      ]);
      setIvs(Array.isArray(ivsData) ? ivsData : []);
      setSaadLink(sl);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetchIvs(); const t = setInterval(fetchIvs, 15000); return () => clearInterval(t); }, []);

  const ivSpaceDeactivated = saadLink && saadLink.intervenant_active === false;

  const BG_RED = BG_GREEN;
  const BG_HEADER = BG_VIOLET;

  if (loading) return <FullScreenLoader />;

  const activateCare = async () => {
    if (!ivCode.trim()) { setCareError('Entrez un code intervenant'); return; }
    setActivating(true); setCareError('');
    try {
      await apiFetch('/api/guardian/activate-intervention-provider', { method: 'POST', body: JSON.stringify({ code: ivCode.trim().toUpperCase() }) }, token);
      Alert.alert('Active', 'Vous etes maintenant intervenant Care.');
      setIvCode(''); await refreshUser();
    } catch (e: any) { setCareError(e.message || 'Code invalide'); } finally { setActivating(false); }
  };

  const deactivateCare = async () => {
    try {
      await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ is_intervention_provider: false }) }, token);
      await refreshUser();
      setShowCareModal(false);
    } catch {}
  };

  const selectIntervention = (iv: any) => {
    setSelectedIv(iv);
  };

  const statusLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);
  const statusColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');

  const activeIvs = ivs.filter(iv => ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status));
  const doneIvs = ivs.filter(iv => ['completed', 'cancelled'].includes(iv.status));
  const displayedIvs = ivTab === 'active' ? activeIvs : doneIvs;

  /* ─── ESPACE DÉSACTIVÉ PAR LA SAAD ─── */
  if (ivSpaceDeactivated && user?.is_intervention_provider && Platform.OS === 'web') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', zIndex: 5 } as any}>
        <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 28px', width: '100%', maxWidth: 400, textAlign: 'center' } as any}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as any}>
            <i className="ri-forbid-line" style={{ fontSize: 36, color: '#EF4444' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Espace désactivé</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 24 }}>
            Votre espace Intervenant Care a été temporairement désactivé par {saadLink?.company_name || 'votre structure SAAD'}.
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', padding: '14px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
            <i className="ri-information-line" style={{ marginRight: 6, color: '#A78BFA' }} />
            Contactez {saadLink?.company_name || 'votre administrateur SAAD'} pour réactiver votre accès.
          </div>
        </div>
      </div>
    );
  }

  /* ─── INACTIF: écran plein avec fond violet + slide ─── */
  if (!user?.is_intervention_provider && Platform.OS === 'web') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', zIndex: 5 } as any}>
        <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 28px', width: '100%', maxWidth: 400 } as any}>
          {!slideActivated ? (
            <>
              <img src={LOGO_URL} alt="Chutex" className="anim-up" style={{ height: 60, marginTop: -30, marginBottom: 24, filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.15))' } as any} />
              <div className="anim-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, backdropFilter: 'blur(8px)' } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Inactif</span>
              </div>
              <h2 className="anim-up d2" style={{ fontSize: 28, fontWeight: 800, color: '#FFF', margin: '0 0 12px', textAlign: 'center' } as any}>Intervention Care</h2>
              <p className="anim-up d3" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 40px' } as any}>
                Activer votre espace d'intervenant pour etre missionne par la teleassistance Chutex Care.
              </p>
              <div className="anim-up d4" style={{ width: '100%' } as any}>
                <div style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' } as any}
                  onMouseDown={(e: any) => { const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - e.clientX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { thumb.style.transform = `translateX(${maxX}px)`; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); setSlideActivated(true); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                  onTouchStart={(e: any) => { const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); setSlideActivated(true); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: true }); bar.addEventListener('touchend', onUp); }}>
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
              {careError && (
                <div className="anim-up" style={{ width: '100%', padding: '12px 18px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 20, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#FCA5A5' } as any} onClick={() => setCareError('')}>
                  {careError}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32 } as any}>
                {[0,1,2,3,4,5].map(i => (
                  <input key={i} id={`pin-${i}`} type="text" inputMode="numeric" maxLength={1}
                    value={ivCode[i] || ''}
                    onChange={(e: any) => { const v = e.target.value.replace(/[^0-9]/g, ''); const arr = ivCode.split(''); arr[i] = v; const newCode = arr.join('').slice(0, 6); setIvCode(newCode); if (v && i < 5) { const next = document.getElementById(`pin-${i+1}`); if (next) (next as HTMLInputElement).focus(); } }}
                    onKeyDown={(e: any) => { if (e.key === 'Backspace' && !ivCode[i] && i > 0) { const prev = document.getElementById(`pin-${i-1}`); if (prev) (prev as HTMLInputElement).focus(); } }}
                    style={{ width: 48, height: 48, borderRadius: '50%', textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#FFF', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', outline: 'none', caretColor: '#FFF', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' } as any}
                    onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = '0 0 12px rgba(255,255,255,0.15)'; }}
                    onBlur={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>
              <button onClick={() => activateCare()} disabled={activating || ivCode.length < 6}
                style={{ width: '100%', padding: '16px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#FFF', color: '#111', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', opacity: (activating || ivCode.length < 6) ? 0.5 : 1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'all 0.25s ease' } as any}>
                {activating ? 'Activation...' : 'Confirmer le code'}
              </button>
              <button onClick={() => setSlideActivated(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16, padding: 8 } as any}>Retour</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─── INACTIF NATIVE ─── */
  if (!user?.is_intervention_provider) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1a0a2e' }}>
        <Icon name="shield-checkmark-outline" size={36} color="#9C27B0" />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 12 }}>Intervention Care</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8, marginBottom: 24 }}>Activez votre espace pour etre missionne.</Text>
        <TextInput testID="care-code-input" style={{ fontSize: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', textAlign: 'center', letterSpacing: 4, marginBottom: 16 }}
          placeholder="CODE INTERVENANT" placeholderTextColor="rgba(255,255,255,0.3)" value={ivCode} onChangeText={setIvCode} autoCapitalize="characters" />
        <TouchableOpacity testID="care-activate-btn" style={{ backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }} onPress={activateCare} disabled={activating}>
          {activating ? <ActivityIndicator color="#111" /> : <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>Activer</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ─── DETAIL PAGE: intervention ─── */
  if (selectedIv && Platform.OS === 'web') {
    const isDone = ['completed', 'resolved'].includes(selectedIv.status);
    const b = selectedIv.beneficiary_info || {};
    const isCare = !!selectedIv.structure_name;
    const benRows = [
      b.date_of_birth && { icon: 'ri-calendar-line', label: 'Date de naissance', value: b.date_of_birth },
      b.gender && { icon: 'ri-user-line', label: 'Genre', value: b.gender },
      b.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: b.blood_type, color: '#EF4444' },
      (b.height_cm || b.weight_kg) && { icon: 'ri-ruler-line', label: 'Morphologie', value: [b.height_cm && `${b.height_cm} cm`, b.weight_kg && `${b.weight_kg} kg`].filter(Boolean).join(' - ') },
      b.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: b.medical_conditions, color: '#F59E0B', highlight: true },
      b.allergies && { icon: 'ri-alarm-warning-line', label: 'Allergies', value: b.allergies, color: '#EF4444', highlight: true },
      b.doctor_name && { icon: 'ri-stethoscope-line', label: 'Medecin traitant', value: b.doctor_name + (b.doctor_phone ? ` — ${b.doctor_phone}` : ''), phone: b.doctor_phone },
      b.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact d\'urgence', value: b.emergency_contact_name + (b.emergency_contact_phone ? ` — ${b.emergency_contact_phone}` : ''), phone: b.emergency_contact_phone },
      b.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: b.address },
    ].filter(Boolean);

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={isDone ? BG_GREEN : BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setSelectedIv(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isDone ? 'Terminee' : 'En cours'}</span></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{getCleanLabel(selectedIv.alert_type, selectedIv.alert_message)}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{new Date(selectedIv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Fiche beneficiaire</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(b.name || selectedIv.beneficiary_name || '?').charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{b.name || selectedIv.beneficiary_name}</div>{b.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{b.phone}</div>}{b.email && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{b.email}</div>}</div>
            </div>
            {benRows.map((item: any, i: number) => (<div key={i}><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />{item.highlight ? (<div style={{ padding: '10px 12px', borderRadius: 12, background: `${item.color}12`, border: `1px solid ${item.color}25` } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color }} /><div style={{ fontSize: 9, fontWeight: 600, color: item.color, textTransform: 'uppercase' }}>{item.label}</div></div><div style={{ fontSize: 13, color: '#FFF', marginTop: 4, lineHeight: 1.4 }}>{item.value}</div></div>) : (<div onClick={() => item.phone && (window.location.href = `tel:${item.phone}`)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color || 'rgba(255,255,255,0.35)', marginTop: 2, flexShrink: 0 }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 13, color: '#FFF' }}>{item.value}</div></div>{item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981', marginTop: 2 }} />}</div>)}</div>))}
            {b.phone && (<><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} /><div onClick={() => window.location.href = `tel:${b.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Appeler {(b.name || selectedIv.beneficiary_name)?.split(' ')[0]}</span></div></>)}
          </div>
          {selectedIv.assigned_name && (
            <div onClick={() => setShowIntervenantPopup(true)} style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, cursor: 'pointer' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Fiche intervenant</div><div style={{ display: 'flex', gap: 6 } as any}>{isCare && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}<i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /></div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedIv.assigned_name}</div>{selectedIv.structure_name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedIv.structure_name}</div>}<div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{selectedIv.status === 'completed' ? 'Terminee' : 'En cours'}{selectedIv.distance_km ? ` · ${selectedIv.distance_km} km` : ''}</div></div></div>
            </div>
          )}
          {!isDone && selectedIv.id && (() => {
            const iAmThisIntervenant = selectedIv.assigned_to === user?.id;
            const slideLabel = iAmThisIntervenant ? 'Lancer la navigation' : 'Suivre l\'intervention';
            const slideIcon = iAmThisIntervenant ? 'ri-navigation-line' : 'ri-heart-line';
            const thumbBg = iAmThisIntervenant ? '#FFF' : 'rgba(255,255,255,0.15)';
            const thumbBorder = iAmThisIntervenant ? 'none' : '1px solid rgba(255,255,255,0.2)';
            const iconColor = iAmThisIntervenant ? '#111' : '#FFF';
            return (<>
              <div style={{ width: '100%', height: 52, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 10, touchAction: 'none' } as any}
                onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: selectedIv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 46, height: 46, borderRadius: 999, background: thumbBg, border: thumbBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: iAmThisIntervenant ? '0 2px 8px rgba(0,0,0,0.15)' : 'none', willChange: 'transform', touchAction: 'none' } as any}><i className={slideIcon} style={{ fontSize: 20, color: iconColor }} /></div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 700, pointerEvents: 'none', paddingLeft: 32 } as any}>{slideLabel}</div>
              </div>
              {iAmThisIntervenant && ['in_progress', 'en_route'].includes(selectedIv.status) && (
                <div style={{ width: '100%', height: 52, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 10, touchAction: 'none' } as any}
                  onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-close]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); apiFetch(`/api/interventions/${selectedIv.id}/complete`, { method: 'POST', body: JSON.stringify({ notes: '' }) }, token).then(() => { fetchIvs(); setSelectedIv(null); }).catch(() => {}); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                  onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-close]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 48; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); apiFetch(`/api/interventions/${selectedIv.id}/complete`, { method: 'POST', body: JSON.stringify({ notes: '' }) }, token).then(() => { fetchIvs(); setSelectedIv(null); }).catch(() => {}); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                  <div data-close style={{ position: 'absolute', top: 3, left: 3, width: 46, height: 46, borderRadius: 999, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-check-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontSize: 15, fontWeight: 700, pointerEvents: 'none', paddingLeft: 32 } as any}>Clôturer l'intervention</div>
                </div>
              )}
            </>);
          })()}
          {selectedIv.report && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Rapport d'intervention</div>
              {[selectedIv.report.description && { label: 'Description', value: selectedIv.report.description }, selectedIv.report.actions_taken && { label: 'Actions realisees', value: selectedIv.report.actions_taken }, selectedIv.report.patient_condition && { label: 'Etat du patient', value: selectedIv.report.patient_condition === 'stable' ? 'Stable' : selectedIv.report.patient_condition }, selectedIv.report.follow_up_notes && { label: 'Suivi necessaire', value: selectedIv.report.follow_up_notes, warn: true }].filter(Boolean).map((e: any, i: number, arr: any[]) => (<div key={i}>{e.warn ? (<div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', margin: '6px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.4 }}>{e.value}</div></div>) : (<div style={{ padding: '10px 0' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{e.label}</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{e.value}</div></div>)}{i < arr.length - 1 && !e.warn && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}</div>))}
              {selectedIv.report.completed_by && <><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} /><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Redige par {selectedIv.report.completed_by}</div></>}
            </div>
          )}
          {selectedIv.timeline && selectedIv.timeline.length > 0 && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Chronologie</div>
              {selectedIv.timeline.map((t: any, i: number) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} />}<div style={{ display: 'flex', gap: 10 } as any}><div style={{ width: 8, height: 8, borderRadius: 4, background: i === selectedIv.timeline.length - 1 ? '#10B981' : 'rgba(255,255,255,0.25)', marginTop: 5, flexShrink: 0 } as any} /><div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{t.note}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{new Date(t.time).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div></div></div>))}
            </div>
          )}
        </div>
        {showIntervenantPopup && selectedIv.assigned_name && (
          <div onClick={() => setShowIntervenantPopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as any}><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>Fiche intervenant</div><div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>{isCare && <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>}<div onClick={() => setShowIntervenantPopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 } as any}><div style={{ width: 64, height: 64, borderRadius: 20, background: isCare ? 'rgba(124,92,255,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isCare ? 'rgba(124,92,255,0.3)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 26, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name.charAt(0)}</span></div><div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{selectedIv.assigned_name}</div>{selectedIv.intervener_profession && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{selectedIv.intervener_profession}</div>}{!selectedIv.intervener_profession && selectedIv.structure_name && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{selectedIv.structure_name}</div>}</div></div>
              {[selectedIv.intervener_phone && { icon: 'ri-phone-line', label: 'Telephone', value: selectedIv.intervener_phone, phone: true }, selectedIv.intervener_email && { icon: 'ri-mail-line', label: 'Email', value: selectedIv.intervener_email }, selectedIv.intervener_profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: selectedIv.intervener_profession }, selectedIv.structure_name && { icon: 'ri-building-line', label: 'Structure', value: selectedIv.structure_name }, selectedIv.intervener_address && { icon: 'ri-map-pin-line', label: 'Adresse', value: selectedIv.intervener_address }, selectedIv.intervener_radius_km && { icon: 'ri-map-pin-range-line', label: 'Rayon', value: `${selectedIv.intervener_radius_km} km` }, selectedIv.distance_km && { icon: 'ri-route-line', label: 'Distance', value: `${selectedIv.distance_km} km` }, selectedIv.accepted_at && { icon: 'ri-time-line', label: 'Accepte a', value: new Date(selectedIv.accepted_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) }, selectedIv.completed_at && { icon: 'ri-check-double-line', label: 'Termine a', value: new Date(selectedIv.completed_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) }].filter(Boolean).map((item: any, i: number, arr: any[]) => (<div key={i}><div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}><div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div>{i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}</div>))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── ACTIF: page interventions plein ecran (web) ─── */
  if (Platform.OS === 'web') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div onClick={() => setShowStructurePopup(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', marginBottom: 10 } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Actif - {user.intervention_structure || user.structure_name || 'Structure'}</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Intervention Care</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div onClick={() => setIvTab('active')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'active' ? '#FFF' : 'transparent', color: ivTab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours</div>
              <div onClick={() => setIvTab('done')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: ivTab === 'done' ? '#FFF' : 'transparent', color: ivTab === 'done' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Cloturees</div>
            </div>
          </div>
          {user?.is_intervention_provider && (displayedIvs.length > 0 ? displayedIvs.map(iv => {
            const isActive = ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status);
            const hasAssigned = !!iv.assigned_to;
            const iAmAssigned = iv.assigned_to === user?.id;
            const isPending = iv.status === 'pending_acceptance';
            return (
              <div key={iv.id} data-testid={`iv-${iv.id}`} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, minHeight: 110, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any} data-glass-card>
                <div onClick={() => selectIntervention(iv)} style={{ cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}><div><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.beneficiary_name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Le {new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isActive ? 'rgba(124,92,255,0.25)' : 'rgba(16,185,129,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: isActive ? '#A78BFA' : '#10B981' } as any} data-pulse-dot /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{isActive ? 'En cours' : 'Terminee'}</span></div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? 12 : 0 } as any}><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{getCleanLabel(iv.alert_type, iv.alert_message)}</div>{iv.distance_km && <div style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{iv.distance_km} Km</span></div>}</div>
                </div>
                {isActive && iAmAssigned && (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                    onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-navigation-line" style={{ fontSize: 18, color: '#111' }} /></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Lancer la navigation</div>
                  </div>
                )}
                {isActive && hasAssigned && !iAmAssigned && (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                    onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-heart-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Suivre l'intervention</div>
                  </div>
                )}
                {isActive && isPending && !hasAssigned && (
                  ivSpaceDeactivated ? (
                    <div onClick={() => window.alert(`Votre espace intervenant est désactivé par ${saadLink?.company_name || 'votre SAAD'}. Contactez votre administrateur pour le réactiver.`)} style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed' } as any}>
                      <i className="ri-forbid-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)', marginRight: 8 }} />
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700 }}>Intervenir (espace désactivé)</span>
                    </div>
                  ) : (
                  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none' } as any}
                    onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); apiFetch(`/api/interventions/${iv.id}/accept`, { method: 'POST' }, token).then(() => { fetchIvs(); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); }).catch(() => {}); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
                    onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); apiFetch(`/api/interventions/${iv.id}/accept`, { method: 'POST' }, token).then(() => { fetchIvs(); router.push({ pathname: '/intervention-map', params: { interventionId: iv.id } }); }).catch(() => {}); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
                    <div data-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', willChange: 'transform', touchAction: 'none' } as any}><i className="ri-shield-check-line" style={{ fontSize: 18, color: '#111' }} /></div>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>Intervenir</div>
                  </div>
                  )
                )}
              </div>
            );
          }) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-map-pin-range-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Aucune intervention {ivTab === 'active' ? 'en cours' : 'terminee'}</div></div>
          ))}
        </div>
        {showStructurePopup && (
          <div onClick={() => setShowStructurePopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowStructurePopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Structure d'intervention</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 } as any}><div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 28, color: '#A78BFA' }} /></div><div><div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', letterSpacing: -0.5 }}>{user.intervention_structure || user.structure_name || 'Structure'}</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Intervenant actif</span></div></div></div>
              {[user.intervention_structure && { icon: 'ri-building-line', label: 'Structure', value: user.intervention_structure }, user.intervention_radius_km && { icon: 'ri-map-pin-range-line', label: 'Rayon d\'intervention', value: `${user.intervention_radius_km} km` }, user.phone && { icon: 'ri-phone-line', label: 'Telephone', value: user.phone, phone: true }, user.email && { icon: 'ri-mail-line', label: 'Email', value: user.email }, user.name && { icon: 'ri-user-line', label: 'Intervenant', value: user.name }].filter(Boolean).map((item: any, i: number, arr: any[]) => (<div key={i}><div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}><div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div>{i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}</div>))}
              <div onClick={() => { deactivateCare(); setShowStructurePopup(false); }} style={{ padding: '15px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 14, fontWeight: 700, marginTop: 20, transition: 'all 0.2s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>Desactiver mon espace Care</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#111' }} contentContainerStyle={{ paddingBottom: 80, padding: 16 }}>
      {user?.is_intervention_provider && (displayedIvs.length > 0 ? displayedIvs.map(iv => {
        const isActive = ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status);
        return (
          <TouchableOpacity key={iv.id} testID={`iv-${iv.id}`} onPress={() => selectIntervention(iv)}>
            <View style={{ borderRadius: 20, overflow: 'hidden', padding: 18, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.beneficiary_name}</Text></View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{iv.alert_message || 'Intervention'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      }) : (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#888' }}>Aucune intervention</Text>
        </View>
      ))}
    </ScrollView>
  );
}
