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

function CompanyPrescriptionsTab({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [dashData, setDashData] = useState<any>(null);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPresc, setSelectedPresc] = useState<any>(null);
  const [showPrescriberPopup, setShowPrescriberPopup] = useState(false);
  const [showBenPopup, setShowBenPopup] = useState(false);
  const [prescTab, setPrescTab] = useState<'pending' | 'subscribed'>('pending');
  const [showRewardsDetail, setShowRewardsDetail] = useState(false);
  const [showAllPrescribers, setShowAllPrescribers] = useState(false);
  const [showChallengeExplainer, setShowChallengeExplainer] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [dd, prs, cp] = await Promise.all([
        apiFetch('/api/company/dashboard', {}, token),
        apiFetch('/api/company/prescribers', {}, token).catch(() => []),
        apiFetch('/api/company/prescriptions', {}, token).catch(() => []),
      ]);
      // Merge: use dashboard prescriptions (more complete), enrich with company/prescriptions data
      const dashPrescs = dd?.prescriptions || [];
      const companyPrescs = Array.isArray(cp) ? cp : [];
      // Dashboard has more data — use it, but also include any from company endpoint not in dashboard
      const dashIds = new Set(dashPrescs.map((p: any) => p.id));
      const merged = [...dashPrescs, ...companyPrescs.filter((p: any) => !dashIds.has(p.id))];
      setDashData({ ...dd, prescriptions: merged });
      setPrescribers(Array.isArray(prs) ? prs : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const [searchPresc, setSearchPresc] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });

  if (loading) return <FullScreenLoader />;

  const BG_ORANGE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
  const BG_GREEN_P = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const BG_BLACK = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const isMonthly = user?.commission_type === 'monthly' || !user?.commission_type;
  const commLabel = isMonthly ? '/mois' : '';
  const getCommission = (p: any) => {
    if (isMonthly) return p.subscription_type === 'bracelet_gilet' ? 15 : 8;
    return p.subscription_type === 'bracelet_gilet' ? 200 : 100;
  };
  const allPrescs = dashData?.prescriptions || [];
  const pendingPrescs = allPrescs.filter((p: any) => p.status === 'pending');
  const subscribedPrescs = allPrescs.filter((p: any) => p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created');
  const displayedPrescs = prescTab === 'pending' ? pendingPrescs : subscribedPrescs;
  const prescTotal = displayedPrescs.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0);

  const BG_GOLD = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png';

  /* ─── REWARDS DETAIL: full-screen gold (early return) ─── */
  if (showRewardsDetail && Platform.OS === 'web') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_GOLD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setShowRewardsDetail(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Challenge prescripteurs</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <i className="ri-trophy-line" style={{ fontSize: 40, color: '#FFF', display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>Challenge du mois</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
            <div onClick={() => setShowChallengeExplainer(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', marginTop: 12, cursor: 'pointer' } as any}><i className="ri-information-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Comment ca marche ?</span></div>
          </div>
          {/* Prizes */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
            {[{ pos: '1er', amount: '100 EUR', color: '#FFD700' }, { pos: '2eme', amount: '70 EUR', color: '#C0C0C0' }, { pos: '3eme', amount: '30 EUR', color: '#CD7F32' }].map((p, i) => (
              <div key={i} style={{ flex: 1, padding: '16px 10px', borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: p.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 } as any}><i className="ri-medal-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{p.pos}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.amount}</div>
              </div>
            ))}
          </div>
          {/* Ranking — all Chutex prescribers */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Classement general Chutex</div>
            {prescribers.sort((a: any, b: any) => (b.prescriptions_count || 0) - (a.prescriptions_count || 0)).map((p: any, i: number) => (
              <div key={p.id}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' } as any} />}
                <div onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', cursor: 'pointer' } as any}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>#{i + 1}</span></div>
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{p.structure_name || ''}</div></div>
                  <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{p.prescriptions_count || 0}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>prescriptions</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Challenge explainer glass popup */}
        {showChallengeExplainer && (
          <div onClick={() => setShowChallengeExplainer(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => setShowChallengeExplainer(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                  <i className="ri-trophy-line" style={{ fontSize: 28, color: '#FFD700' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Comment ca marche ?</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, lineHeight: 1.6 }}>Le challenge concerne tous les prescripteurs Chutex, pas seulement ceux de votre structure.</div>
              </div>
              {[
                { icon: 'ri-file-text-line', title: 'Prescrivez', desc: 'Vos gardiens creent des prescriptions. Quand le beneficiaire souscrit, elle est validee.', color: '#D4845A' },
                { icon: 'ri-bar-chart-box-line', title: 'Classement general', desc: 'Chaque prescription validee fait monter le prescripteur au classement. Tous les prescripteurs Chutex participent.', color: '#3B82F6' },
                { icon: 'ri-trophy-line', title: 'Recompenses mensuelles', desc: '1er: 100 EUR, 2eme: 70 EUR, 3eme: 30 EUR. Versement automatique debut du mois suivant.', color: '#FFD700' },
                { icon: 'ri-refresh-line', title: 'Reinitialisation', desc: 'Le classement repart a zero chaque 1er du mois. Chaque mois est une nouvelle chance.', color: '#10B981' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' } as any}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}20`, border: `1px solid ${s.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={s.icon} style={{ fontSize: 20, color: s.color }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ─── ALL PRESCRIBERS ─── */
  if (showAllPrescribers && Platform.OS === 'web') {
    const filtered = search.trim() ? prescribers.filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase())) : prescribers;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => { setShowAllPrescribers(false); setSearch(''); }} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Tous les prescripteurs ({prescribers.length})</div>
        </div>
        <div style={{ position: 'relative', zIndex: 5, padding: '12px 20px 0' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /><input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un prescripteur..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '12px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {filtered.map((p: any) => (
            <div key={p.id} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(212,132,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#D4845A' }}>{p.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.prescriber_structure || p.structure_name || 'Prescripteur'}</div></div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-file-text-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>{search ? 'Aucun resultat' : 'Aucun prescripteur'}</div></div>}
        </div>
      </div>
    );
  }

  /* ─── DETAIL: prescription (early return) ─── */
  if (selectedPresc && Platform.OS === 'web') {
    const isValidated = selectedPresc.status === 'subscribed' || selectedPresc.status === 'validated' || selectedPresc.status === 'contract_created';
    const prescriberProfile = prescribers.find((p: any) => p.id === selectedPresc.guardian_id || p.id === selectedPresc.prescriber_id) || {};
    const pRows = [
      (prescriberProfile.name || selectedPresc.guardian_name) && { icon: 'ri-user-settings-line', label: 'Prescripteur', value: prescriberProfile.name || selectedPresc.guardian_name || selectedPresc.prescriber_name },
      selectedPresc.subscription_type && { icon: 'ri-vip-crown-line', label: 'Abonnement', value: selectedPresc.subscription_type },
      { icon: 'ri-money-euro-circle-line', label: 'Commission', value: `${selectedPresc.commission || getCommission(selectedPresc)} EUR${commLabel}` },
      selectedPresc.created_at && { icon: 'ri-calendar-line', label: 'Date', value: new Date(selectedPresc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
      selectedPresc.beneficiary_phone && { icon: 'ri-phone-line', label: 'Telephone beneficiaire', value: selectedPresc.beneficiary_phone, phone: true },
      selectedPresc.beneficiary_email && { icon: 'ri-mail-line', label: 'Email beneficiaire', value: selectedPresc.beneficiary_email },
      selectedPresc.guardian_contact_name && { icon: 'ri-user-heart-line', label: 'Aidant', value: selectedPresc.guardian_contact_name },
      selectedPresc.guardian_contact_phone && { icon: 'ri-phone-line', label: 'Telephone aidant', value: selectedPresc.guardian_contact_phone, phone: true },
      selectedPresc.beneficiary_address && { icon: 'ri-map-pin-line', label: 'Adresse', value: selectedPresc.beneficiary_address },
      selectedPresc.structure_name && { icon: 'ri-building-line', label: 'Structure', value: selectedPresc.structure_name },
    ].filter(Boolean);
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={isValidated ? BG_GREEN_P : BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 5 } as any}>
          <div onClick={() => setSelectedPresc(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: isValidated ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isValidated ? 'Validee' : 'En attente'}</span></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '3px solid rgba(255,255,255,0.2)' } as any}><span style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>{(selectedPresc.beneficiary_name || '?').charAt(0)}</span></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{selectedPresc.beneficiary_name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Prescription {selectedPresc.subscription_type || 'Standard'}</div>
            {(selectedPresc.commission || getCommission(selectedPresc)) && <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', marginTop: 8, letterSpacing: -1 }}>+{selectedPresc.commission || getCommission(selectedPresc)} EUR{commLabel}</div>}
          </div>
          {/* Details */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Details de la prescription</div>
            {pRows.map((item: any, i: number) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />}<div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.35)' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>{item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} />}</div></div>))}
          </div>
          {/* Prescriber card — clickable with popup */}
          {(prescriberProfile.name || selectedPresc.guardian_name || selectedPresc.prescriber_name) && (
            <div onClick={() => setShowPrescriberPopup(true)} style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, cursor: 'pointer' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Prescripteur</div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(212,132,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#D4845A' }}>{(prescriberProfile.name || selectedPresc.guardian_name || '?').charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{prescriberProfile.name || selectedPresc.guardian_name || selectedPresc.prescriber_name}</div>{(prescriberProfile.profession || prescriberProfile.prescriber_structure || selectedPresc.structure_name) && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{prescriberProfile.profession || prescriberProfile.prescriber_structure || selectedPresc.structure_name}</div>}</div>
              </div>
            </div>
          )}
          {/* Beneficiary card — ONLY for validated prescriptions */}
          {isValidated && (
            <div onClick={() => setShowBenPopup(true)} style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, cursor: 'pointer' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase' }}>Beneficiaire</div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(selectedPresc.beneficiary_name || '?').charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedPresc.beneficiary_name}</div>{selectedPresc.beneficiary_email && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{selectedPresc.beneficiary_email}</div>}</div>
              </div>
            </div>
          )}
        </div>
        {/* PRESCRIBER POPUP — enriched from prescribers list */}
        {showPrescriberPopup && <div onClick={() => setShowPrescriberPopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowPrescriberPopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Fiche prescripteur</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 } as any}><div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(212,132,90,0.2)', border: '1px solid rgba(212,132,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 26, fontWeight: 800, color: '#D4845A' }}>{(prescriberProfile.name || selectedPresc.guardian_name || '?').charAt(0)}</span></div><div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{prescriberProfile.name || selectedPresc.guardian_name || selectedPresc.prescriber_name}</div>{(prescriberProfile.profession || prescriberProfile.prescriber_structure) && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{prescriberProfile.profession || prescriberProfile.prescriber_structure}</div>}</div></div>
          {[prescriberProfile.phone && { icon: 'ri-phone-line', label: 'Telephone', value: prescriberProfile.phone, phone: true }, prescriberProfile.email && { icon: 'ri-mail-line', label: 'Email', value: prescriberProfile.email }, prescriberProfile.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: prescriberProfile.profession }, (prescriberProfile.prescriber_structure || prescriberProfile.structure_name) && { icon: 'ri-building-line', label: 'Structure', value: prescriberProfile.prescriber_structure || prescriberProfile.structure_name }, prescriberProfile.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: prescriberProfile.address }, { icon: 'ri-vip-crown-line', label: 'Type prescription', value: selectedPresc.subscription_type === 'bracelet_gilet' ? 'Bracelet + Gilet Elder' : 'Bracelet Elio' }, { icon: 'ri-money-euro-circle-line', label: 'Commission', value: `${selectedPresc.commission || getCommission(selectedPresc)} EUR${commLabel}` }, selectedPresc.created_at && { icon: 'ri-calendar-line', label: 'Date prescription', value: new Date(selectedPresc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }].filter(Boolean).map((item: any, i: number, arr: any[]) => (<div key={i}><div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}><div style={{ width: 34, height: 34, borderRadius: 10, background: item.phone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.08)', border: `1px solid ${item.phone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div>{i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}</div>))}
        </div></div>}
        {/* BENEFICIARY POPUP */}
        {showBenPopup && <div onClick={() => setShowBenPopup(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowBenPopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Fiche beneficiaire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 } as any}><div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 26, fontWeight: 800, color: '#FFF' }}>{(selectedPresc.beneficiary_name || '?').charAt(0)}</span></div><div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{selectedPresc.beneficiary_name}</div></div></div>
          {[selectedPresc.beneficiary_phone && { icon: 'ri-phone-line', label: 'Telephone', value: selectedPresc.beneficiary_phone, phone: true }, selectedPresc.beneficiary_email && { icon: 'ri-mail-line', label: 'Email', value: selectedPresc.beneficiary_email }, selectedPresc.beneficiary_address && { icon: 'ri-map-pin-line', label: 'Adresse', value: selectedPresc.beneficiary_address }, selectedPresc.guardian_contact_name && { icon: 'ri-user-heart-line', label: 'Aidant', value: selectedPresc.guardian_contact_name }, selectedPresc.guardian_contact_phone && { icon: 'ri-phone-line', label: 'Telephone aidant', value: selectedPresc.guardian_contact_phone, phone: true }, { icon: 'ri-vip-crown-line', label: 'Abonnement', value: selectedPresc.subscription_type || 'Standard' }, selectedPresc.subscribed_at && { icon: 'ri-calendar-check-line', label: 'Souscrit le', value: new Date(selectedPresc.subscribed_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }, { icon: 'ri-check-double-line', label: 'Statut', value: 'Souscription validee' }].filter(Boolean).map((item: any, i: number, arr: any[]) => (<div key={i}><div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '13px 0' } as any}><div style={{ width: 34, height: 34, borderRadius: 10, background: item.phone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.08)', border: `1px solid ${item.phone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 15, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div>{i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' } as any} />}</div>))}
        </div></div>}
      </div>
    );
  }

  /* ─── LIST ─── */
  if (Platform.OS === 'web') {
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextPayDate = `01/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
    const monthPrescs = prescTab === 'subscribed' ? subscribedPrescs.filter((p: any) => p.created_at && p.created_at.startsWith(selectedMonth)) : displayedPrescs;
    const filteredPrescs = searchPresc.trim() ? monthPrescs.filter((p: any) => p.beneficiary_name?.toLowerCase().includes(searchPresc.toLowerCase()) || p.prescriber_name?.toLowerCase().includes(searchPresc.toLowerCase())) : monthPrescs;
    const monthTotal = monthPrescs.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0);
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        {/* Everything scrolls together */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 12 } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Actif</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Prescriptions</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>+{prescTab === 'subscribed' ? monthTotal : pendingPrescs.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0)} EUR{commLabel}</div>
            {prescTab === 'subscribed' && (<>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 } as any}><i className="ri-calendar-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} /><input type="month" value={selectedMonth} onChange={(e: any) => setSelectedMonth(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 600, outline: 'none' } as any} /></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{isMonthly ? `Prochain versement de ${subscribedPrescs.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0)} EUR/mois le ${nextPayDate}` : `${subscribedPrescs.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0)} EUR de commissions uniques validees`}</div>
            </>)}
            {prescTab === 'pending' && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>En cours de validation</div>}
          </div>
          {/* Tabs */}
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div onClick={() => setPrescTab('pending')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'pending' ? '#FFF' : 'transparent', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours ({pendingPrescs.length})</div>
              <div onClick={() => setPrescTab('subscribed')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'subscribed' ? '#FFF' : 'transparent', color: prescTab === 'subscribed' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Validees ({subscribedPrescs.length})</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div onClick={() => setShowAllPrescribers(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
              <div style={{ display: 'flex' } as any}>{prescribers.slice(0, 3).map((p2: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(212,132,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.2)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{p2.name?.charAt(0)}</span></div>))}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Voir les {prescribers.length} prescripteurs</span>
            </div>
          </div>
          {/* Challenge */}
          <div onClick={() => setShowRewardsDetail(true)} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', padding: '12px 16px', cursor: 'pointer', marginBottom: 12 } as any}><img src={BG_GOLD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10 } as any}><i className="ri-trophy-line" style={{ fontSize: 18, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', flex: 1 }}>Challenge prescripteurs</span><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /></div></div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12, transition: 'all 0.3s ease' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} /><input value={searchPresc} onChange={(e: any) => setSearchPresc(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div>
          {/* Cards */}
          {filteredPrescs.map((p: any) => (
            <div key={p.id} onClick={() => { setSelectedPresc(p); setShowPrescriberPopup(false); setShowBenPopup(false); }} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, cursor: 'pointer', minHeight: 90, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } as any}>
                <div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{p.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Par {p.guardian_name || p.prescriber_name}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: (p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created') ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: (p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created') ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{(p.status === 'subscribed' || p.status === 'validated' || p.status === 'contract_created') ? 'Validee' : 'En cours'}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>+{p.commission || getCommission(p)} EUR{commLabel}</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '8px 16px' } as any}><i className="ri-heart-line" style={{ fontSize: 14, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span></div></div>
            </div>
          ))}
          {filteredPrescs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-file-text-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>{searchPresc ? 'Aucun resultat' : `Aucune prescription ${prescTab === 'pending' ? 'en cours' : 'validee'}`}</div></div>}
        </div>
      </div>
    );
  }

  const glass = {};
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Prescriptions</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{allPrescs.length} prescriptions au total</Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'pending' && { backgroundColor: '#FF9800' }]} onPress={() => setPrescTab('pending')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'pending' ? '#FFF' : '#888' }}>En cours ({pendingPrescs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'subscribed' && { backgroundColor: '#10B981' }]} onPress={() => setPrescTab('subscribed')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'subscribed' ? '#FFF' : '#888' }}>Validees ({subscribedPrescs.length})</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>Total commissions</Text>
        <Text style={{ fontSize: 16, fontWeight: '900', color: prescTab === 'pending' ? '#FF9800' : '#4CAF50' }}>{prescTotal} EUR</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>
        {displayedPrescs.map((p: any) => (
          <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => setSelectedPresc(p)}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: p.status === 'subscribed' ? '#4CAF50' : '#FF9800', ...glass }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={p.status === 'subscribed' ? 'checkmark-circle' : 'time'} size={16} color={p.status === 'subscribed' ? '#4CAF50' : '#FF9800'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>Par: {p.guardian_name}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{p.commission || getCommission(p)}EUR{commLabel}</Text>
                <Icon name="chevron-forward" size={14} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {displayedPrescs.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name={prescTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Aucune prescription {prescTab === 'pending' ? 'en cours' : 'validee'}</Text>
          </View>
        )}
      </ScrollView>

      {/* Prescription Detail Modal */}
      <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
            {selectedPresc && <>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ padding: 4, marginRight: 12 }}>
                  <Icon name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#111827' }}>Fiche Prescription</Text>
                <TouchableOpacity onPress={() => setSelectedPresc(null)}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 24, marginBottom: 12, ...glass }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF' }}>{selectedPresc.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>{selectedPresc.beneficiary_name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <View style={{ backgroundColor: selectedPresc.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: selectedPresc.status === 'subscribed' ? '#2E7D32' : '#E65100' }}>{selectedPresc.status === 'subscribed' ? 'SOUSCRIT' : 'EN ATTENTE'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {[
                    { icon: 'mail-outline', label: 'Email', value: selectedPresc.beneficiary_email },
                    { icon: 'call-outline', label: 'Telephone', value: selectedPresc.beneficiary_phone },
                    { icon: 'person-circle-outline', label: 'Prescripteur', value: selectedPresc.guardian_name },
                    { icon: 'cash-outline', label: 'Commission', value: `${selectedPresc.commission || getCommission(selectedPresc)} EUR${commLabel}` },
                    { icon: 'calendar-outline', label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleDateString('fr-FR') : '' },
                  ].map(({ icon, label, value }) => value ? (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                      <Icon name={icon as any} size={16} color="#888" />
                      <Text style={{ fontSize: 12, color: '#6B7280', width: 100 }}>{label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 }}>{value}</Text>
                    </View>
                  ) : null)}
                </View>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderLeftWidth: 4, borderLeftColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', alignItems: 'center', ...glass }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{selectedPresc.commission || getCommission(selectedPresc)} EUR{commLabel}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Commission {selectedPresc.status === 'subscribed' ? 'validee' : 'en attente'}</Text>
                </View>
              </ScrollView>
            </>}
          </View>
        </View>
      </Modal>
    </View>
  );
  // end native
}


export default CompanyPrescriptionsTab;
