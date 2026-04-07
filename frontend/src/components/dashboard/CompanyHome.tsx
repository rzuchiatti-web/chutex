import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import { Card, HeroCard, QuickAction, SectionHeader, LanguageFlagButton } from './SharedUI';
import { Icon } from '../WebIcon';
import { BG_IMAGES } from './constants';

export default function CompanyHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStripeSetup, setShowStripeSetup] = useState(false);
  const [showStripeManage, setShowStripeManage] = useState(false);
  const [commissionChoice, setCommissionChoice] = useState(user?.commission_type || 'monthly');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);

  const fetchData = useCallback(async () => {
    try {
      const [st, iv, pr, intr, pres, al, rk, rw, ag, prescs] = await Promise.all([
        apiFetch('/api/company/stats', {}, token).catch(() => ({})),
        apiFetch('/api/company/intervenants', {}, token).catch(() => []),
        apiFetch('/api/company/prescribers', {}, token).catch(() => []),
        apiFetch('/api/company/interventions', {}, token).catch(() => []),
        apiFetch('/api/company/dashboard', {}, token).catch(() => ({})),
        apiFetch('/api/company/alerts', {}, token).catch(() => []),
        apiFetch('/api/company/ranking', {}, token).catch(() => []),
        apiFetch('/api/company/rewards/current', {}, token).catch(() => null),
        apiFetch('/api/company/agencies', {}, token).catch(() => []),
        apiFetch('/api/company/prescriptions', {}, token).catch(() => []),
      ]);
      const dashPrescs = Array.isArray(prescs) ? prescs : (pres?.prescriptions || []);
      setStats(st); setIntervenants(iv); setPrescribers(pr); setInterventions(intr); setPrescriptions(dashPrescs); setAlerts(al); setRanking(rk); setReward(rw); setAgencies(Array.isArray(ag) ? ag : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (!loading && !user.onboarding_completed && !user.commission_type) setShowStripeSetup(true); }, [loading, user.onboarding_completed, user.commission_type]);

  if (loading) return <FullScreenLoader />;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const activeIvs = interventions.filter((iv: any) => ['in_progress', 'en_route', 'pending_acceptance'].includes(iv.status));
  const BG_DASH = BG_IMAGES.red;
  const BG_RED = BG_IMAGES.red;
  const BG_VIOLET = BG_IMAGES.violet;
  const BG_ORANGE = BG_IMAGES.orange;

  if (Platform.OS === 'web') {
    return (
      <div data-testid="company-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', background: '#F5F5F7' } as any}>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* ═══ HEADER WITH IMAGE ═══ */}
          <div style={{ position: 'relative', minHeight: 320, overflow: 'hidden' } as any}>
            <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 5, padding: '70px 20px 40px' } as any}>
              {/* Structure info */}
              <div onClick={() => router.push('/company-agency' as any)} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, cursor: 'pointer' } as any}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}><i className="ri-building-line" style={{ fontSize: 24, color: '#FFF' }} /></div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{user.structure_name || user.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{user.address || 'Espace SAAD'}</div>
                  {user.siret && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>SIRET: {user.siret}</div>}
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
              </div>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 8 } as any}>
                {[
                  { val: agencies.length, label: 'Agences', color: '#D4845A' },
                  { val: intervenants.length, label: 'Intervenants', color: '#A78BFA' },
                  { val: stats.total_prescribers || 0, label: 'Prescripteurs', color: '#F59E0B' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, padding: '10px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.12)', textAlign: 'center', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' } as any}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Codes glass blur dans le header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 } as any}>
                <div onClick={() => { navigator.clipboard?.writeText(user.activation_code || ''); if (typeof window !== 'undefined') window.alert('Code prescripteur copie !'); }} style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-key-2-line" style={{ fontSize: 12, color: '#F59E0B' }} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Code Prescripteur</span>
                    </div>
                    <i className="ri-file-copy-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', fontFamily: 'monospace', letterSpacing: 2 }}>{user.activation_code || '--'}</div>
                </div>
                <div onClick={() => { navigator.clipboard?.writeText(user.intervention_code || ''); if (typeof window !== 'undefined') window.alert('Code intervention copie !'); }} style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-map-pin-line" style={{ fontSize: 12, color: '#A78BFA' }} />
                      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Code Intervention</span>
                    </div>
                    <i className="ri-file-copy-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', fontFamily: 'monospace', letterSpacing: 2 }}>{user.intervention_code || '--'}</div>
                </div>
              </div>
              {/* Alerte banner — style Coach */}
              <div data-testid="saad-alert-card" style={{ borderRadius: 16, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', marginTop: 10 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{activeAlerts.length}</div>
                  <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)', flexShrink: 0 } as any} />
                  <div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alerte{activeAlerts.length !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{activeAlerts.length > 0 ? `${activeAlerts.length} en cours` : 'Aucune alerte'}</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                  {activeAlerts.length > 0 ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div> : <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#10B981' }}>OK</span></div>}
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px 20px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#F5F5F7', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(0,0,0,0.06)' } as any}>

          {/* Revenue card — green image like Coach/Physio */}
          <div data-testid="saad-revenue-card" onClick={() => router.push('/pro-revenue' as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, cursor: 'pointer', transition: 'transform 0.15s', marginBottom: 16, position: 'relative', overflow: 'hidden' } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
            <img src="https://customer-assets.emergentagent.com/job_6e5f29d8-07a7-4d8a-88cc-8e0eebe2b466/artifacts/jgg2zwgt_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
            <div style={{ width: 50, height: 50, borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 2, border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>€</span>
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 2 } as any}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Mes revenus</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Commissions SAAD par prescription</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', position: 'relative', zIndex: 2 }} />
          </div>

          {/* Onboarding SAAD — 2-step glass popup */}
          {showStripeSetup && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 } as any}>
                  {[1, 2].map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                      <div style={{ width: 28, height: 28, borderRadius: 999, background: onboardingStep >= s ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)', border: `1.5px solid ${onboardingStep >= s ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: onboardingStep >= s ? '#A78BFA' : 'rgba(255,255,255,0.3)' }}>{s}</span>
                      </div>
                      {s < 2 && <div style={{ width: 40, height: 2, borderRadius: 1, background: onboardingStep > 1 ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)' } as any} />}
                    </div>
                  ))}
                </div>

                {/* ─── STEP 1: Commission choice ─── */}
                {onboardingStep === 1 && (<>
                  <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
                      <i className="ri-hand-coin-line" style={{ fontSize: 32, color: '#A78BFA' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Bienvenue sur Chutex</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Choisissez comment vous souhaitez recevoir vos commissions sur les prescriptions de vos gardiens.</div>
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Mode de commissionnement</div>

                  {[
                    { k: 'oneshot', title: 'Commission unique', sub: '100 EUR par bracelet prescrit, 200 EUR bracelet + gilet', detail: 'Versement unique a la validation de la souscription', icon: 'ri-coin-line', color: '#F59E0B' },
                    { k: 'monthly', title: 'Commission mensuelle', sub: '8 EUR/mois par bracelet, 15 EUR/mois bracelet + gilet', detail: 'Versement récurrent chaque mois tant que le bénéficiaire est abonne', icon: 'ri-loop-right-line', color: '#A78BFA' },
                  ].map(o => (
                    <div key={o.k} onClick={() => setCommissionChoice(o.k)} data-testid={`commission-${o.k}`} style={{ padding: '16px 18px', borderRadius: 20, background: commissionChoice === o.k ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${commissionChoice === o.k ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', marginBottom: 10, transition: 'all 0.2s' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: commissionChoice === o.k ? `${o.color}20` : 'rgba(255,255,255,0.06)', border: `1px solid ${commissionChoice === o.k ? `${o.color}40` : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <i className={o.icon} style={{ fontSize: 22, color: commissionChoice === o.k ? o.color : 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <div style={{ flex: 1 } as any}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{o.title}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{o.sub}</div>
                        </div>
                        {commissionChoice === o.k && <i className="ri-checkbox-circle-fill" style={{ fontSize: 22, color: '#7C3AED', flexShrink: 0 }} />}
                      </div>
                      {commissionChoice === o.k && (
                        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                            <i className="ri-information-line" style={{ fontSize: 14, color: 'rgba(124,58,237,0.6)', flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{o.detail}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Simulation */}
                  <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginTop: 16, marginBottom: 24 } as any}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Simulation pour 10 prescriptions bracelet</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
                      <div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{commissionChoice === 'oneshot' ? 'Gain unique' : 'Gain mensuel récurrent'}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>{commissionChoice === 'oneshot' ? '1 000' : '80'} EUR</div>
                      </div>
                      <div style={{ textAlign: 'right' } as any}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Sur 12 mois</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: commissionChoice === 'monthly' ? '#10B981' : '#F59E0B' }}>{commissionChoice === 'oneshot' ? '1 000' : '960'} EUR</div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 14 } as any} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                      <div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Sur 24 mois</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: commissionChoice === 'monthly' ? '#10B981' : '#F59E0B' }}>{commissionChoice === 'oneshot' ? '1 000' : '1 920'} EUR</div>
                      </div>
                      {commissionChoice === 'monthly' && (
                        <div style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' } as any}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>+920 EUR vs unique</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div data-testid="onboarding-next-btn" onClick={async () => {
                    try {
                      await apiFetch('/api/company/commission-type', { method: 'PUT', body: JSON.stringify({ commission_type: commissionChoice }) }, token);
                      setOnboardingStep(2);
                    } catch (e: any) { alert(e.message || 'Erreur'); }
                  }} style={{ padding: '17px', borderRadius: 999, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' } as any}>
                    Confirmer et continuer
                  </div>
                </>)}

                {/* ─── STEP 2: Stripe Connect ─── */}
                {onboardingStep === 2 && (<>
                  <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
                      <i className="ri-bank-card-line" style={{ fontSize: 32, color: '#10B981' }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Recevez vos paiements</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Connectez votre compte bancaire via Stripe pour recevoir vos commissions automatiquement.</div>
                  </div>

                  {/* Recap commission choice */}
                  <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 } as any}>
                    <i className={commissionChoice === 'oneshot' ? 'ri-coin-line' : 'ri-loop-right-line'} style={{ fontSize: 20, color: '#A78BFA' }} />
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{commissionChoice === 'oneshot' ? 'Commission unique' : 'Commission mensuelle'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{commissionChoice === 'oneshot' ? '100/200 EUR par prescription' : '8/15 EUR par mois'}</div>
                    </div>
                    <div onClick={() => setOnboardingStep(1)} style={{ padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)' } as any}>Modifier</div>
                  </div>

                  {/* Benefits */}
                  <div style={{ marginBottom: 24 } as any}>
                    {[
                      { icon: 'ri-shield-check-line', text: 'Paiements sécurisés par Stripe', color: '#10B981' },
                      { icon: 'ri-time-line', text: 'Versements automatiques chaque mois', color: '#3B82F6' },
                      { icon: 'ri-eye-line', text: 'Suivi des commissions en temps reel', color: '#A78BFA' },
                    ].map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <i className={b.icon} style={{ fontSize: 16, color: b.color }} />
                        </div>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{b.text}</span>
                      </div>
                    ))}
                  </div>

                  <div data-testid="stripe-connect-btn" onClick={async () => {
                    setStripeLoading(true);
                    try {
                      const res = await apiFetch('/api/saad/stripe-onboarding', { method: 'POST', body: JSON.stringify({ saad_id: user.id, company_name: user.structure_name || user.name, email: user.email, commission_type: commissionChoice, refresh_url: window.location.href, return_url: window.location.href }) }, token);
                      if (res.onboarding_url) window.open(res.onboarding_url, '_blank');
                      setShowStripeSetup(false);
                    } catch (e: any) { alert(e.message || 'Erreur'); }
                    setStripeLoading(false);
                  }} style={{ padding: '17px', borderRadius: 999, background: stripeLoading ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10B981, #059669)', color: '#FFF', cursor: stripeLoading ? 'wait' : 'pointer', textAlign: 'center', fontSize: 16, fontWeight: 800, opacity: stripeLoading ? 0.5 : 1, boxShadow: '0 4px 16px rgba(16,185,129,0.3)', marginBottom: 12 } as any}>
                    {stripeLoading ? 'Création en cours...' : 'Connecter mon compte bancaire'}
                  </div>
                  <div onClick={() => setShowStripeSetup(false)} style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 8 } as any}>Je le ferai plus tard</div>
                </>)}
              </div>
            </div>
          )}


          {/* Stripe Manage Popup — READ ONLY (commission locked once chosen) */}
          {showStripeManage && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowStripeManage(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-hand-coin-line" style={{ fontSize: 28, color: '#A78BFA' }} /></div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Paiements & Commissions</div>
                </div>

                {/* Current commission — fixed display */}
                <div style={{ padding: '18px 20px', borderRadius: 20, background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.4)', marginBottom: 16 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className="ri-loop-right-line" style={{ fontSize: 24, color: '#A78BFA' }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Commission fixe</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>50 EUR HT par souscription + 5 EUR HT/mois</div>
                    </div>
                  </div>
                </div>

                {/* Simulation */}
                <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Simulation pour 10 prescriptions</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>A la souscription</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>500 EUR</div>
                    </div>
                    <div style={{ textAlign: 'right' } as any}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Recurrent /mois</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981' }}>50 EUR</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 14 } as any} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Sur 12 mois</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>1 100 EUR</div>
                    </div>
                    <div style={{ textAlign: 'right' } as any}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Sur 24 mois</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>1 700 EUR</div>
                    </div>
                  </div>
                </div>

                {/* IBAN status */}
                {user.saad_registered && <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 12 } as any}><i className="ri-shield-check-line" style={{ fontSize: 18, color: '#10B981' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Compte bancaire enregistré</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Vos commissions sont versees automatiquement via Mollie</div></div></div>}
                {!user.saad_registered && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '12px 0' } as any}>Configurez votre IBAN dans l'onglet Profil pour recevoir vos commissions</div>}
              </div>
            </div>
          )}




          {/* Intervention Care */}
          {(() => {
            const completedIvs = interventions.filter((iv: any) => iv.status === 'completed').length;
            const inMission = intervenants.filter((iv: any) => (iv.active_interventions || 0) > 0).length;
            const available = intervenants.length - inMission;
            const ivMax = Math.max(intervenants.length, 1);
            return (
              <div onClick={() => router.push('/(tabs)/teleconsult' as any)} style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', padding: '20px', marginBottom: 12, cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>Intervention Care</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
                    {[{ val: activeIvs.length, label: 'En cours' }, { val: completedIvs, label: 'Terminees' }, { val: intervenants.length, label: 'Intervenants' }].map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                        <div style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', marginTop: 4 } as any}><span style={{ fontSize: 9, fontWeight: 700, color: '#FFF' }}>{s.label}</span></div>
                      </div>
                    ))}
                  </div>
                  {intervenants.length > 0 && (<>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 14 } as any} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Disponibilite des intervenants</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
                      {[
                        { val: available, label: 'Disponibles', barColor: '#10B981', pct: (available / ivMax) * 100 },
                        { val: inMission, label: 'En intervention', barColor: '#A78BFA', pct: (inMission / ivMax) * 100 },
                      ].map((s, i) => (
                        <div key={i} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', textAlign: 'center' } as any}>
                          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 2 }}>{s.val}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
                          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' } as any}>
                            <div style={{ height: '100%', borderRadius: 99, background: s.barColor, width: `${s.pct}%` } as any} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>)}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                    <div style={{ display: 'flex' } as any}>{intervenants.slice(0, 3).map((iv: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.3)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{iv.name?.charAt(0)}</span></div>))}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Voir les {intervenants.length} intervenants</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Prescriptions */}
          {(() => {
            const getCommission = (p: any) => {
              if (user.commission_type === 'oneshot') return p.subscription_type === 'bracelet_gilet' ? 200 : 100;
              return p.subscription_type === 'bracelet_gilet' ? 15 : 8;
            };
            const validatedP = prescriptions.filter((p: any) => p.status === 'validated' || p.status === 'subscribed');
            const pendingP = prescriptions.filter((p: any) => p.status === 'pending');
            const now2 = new Date();
            const currentMonthValidated = validatedP.filter((p: any) => {
              const d = new Date(p.created_at || p.date || '');
              return d.getMonth() === now2.getMonth() && d.getFullYear() === now2.getFullYear();
            });
            const currentMonthAmount = currentMonthValidated.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0);
            const allTimeValidated = validatedP.reduce((s: number, p: any) => s + (p.commission || getCommission(p)), 0);
            const convRate = prescriptions.length > 0 ? Math.round((validatedP.length / prescriptions.length) * 100) : 0;
            const nextM = new Date(); nextM.setMonth(nextM.getMonth() + 1);
            const nextPay = `01/${String(nextM.getMonth() + 1).padStart(2, '0')}/${nextM.getFullYear()}`;
            const topP = [...ranking].slice(0, 3);
            const maxP = Math.max(topP[0]?.prescriptions_count || 1, 1);
            return (
              <div onClick={() => router.push('/(tabs)/devices' as any)} style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', padding: '20px', marginBottom: 12, cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                <img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Prescriptions</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>+{currentMonthAmount} EUR{user.commission_type === 'monthly' ? '/mois' : ''}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2, marginBottom: 2 }}>{user.commission_type === 'oneshot' ? 'Commissions uniques ce mois' : 'Souscriptions validees ce mois'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>{allTimeValidated} EUR{user.commission_type === 'monthly' ? '/mois' : ''} valides au total {user.commission_type === 'monthly' ? `- Versement le ${nextPay}` : ''}</div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
                    {[{ val: validatedP.length, label: 'Validees' }, { val: pendingP.length, label: 'En attente' }, { val: prescribers.length, label: 'Prescripteurs' }].map((s, i) => (
                      <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                        <div style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', marginTop: 4 } as any}><span style={{ fontSize: 9, fontWeight: 700, color: '#FFF' }}>{s.label}</span></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 12 } as any} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Taux de conversion</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{convRate}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginBottom: topP.length > 0 ? 20 : 10 } as any}>
                    <div style={{ height: '100%', borderRadius: 99, background: '#FFF', width: `${convRate}%` } as any} />
                  </div>
                  {topP.length > 0 && (<>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 14 } as any} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, textAlign: 'left' }}>Top prescripteurs</div>
                    {topP.map((p: any, i: number) => (
                      <div key={p.id || i} style={{ marginBottom: i < topP.length - 1 ? 10 : 0, textAlign: 'left' } as any}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                            <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>#{i+1}</span></div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{p.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{p.prescriptions_count || 0} presc.</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' } as any}>
                          <div style={{ height: '100%', borderRadius: 99, background: 'rgba(255,255,255,0.7)', width: `${Math.round(((p.prescriptions_count || 0) / maxP) * 100)}%` } as any} />
                        </div>
                      </div>
                    ))}
                  </>)}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px 0' } as any} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                    <div style={{ display: 'flex' } as any}>{prescribers.slice(0, 3).map((p: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.2)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{p.name?.charAt(0)}</span></div>))}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Voir les {prescribers.length} prescripteurs</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Classement prescripteurs de la structure */}
          {ranking.length > 0 && (
          <div style={{ padding: '18px 20px', borderRadius: 22, background: '#FFF', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className="ri-bar-chart-box-line" style={{ fontSize: 18, color: '#F59E0B' }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Meilleurs prescripteurs</div>
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{new Date().toLocaleString('fr-FR', { month: 'short' })}</div>
            </div>
            {ranking.slice(0, 5).map((p: any, i: number) => (
              <div key={p.id || i} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ cursor: 'pointer' } as any}>
                {i > 0 && <div style={{ height: 1, background: '#E5E7EB', margin: '6px 0' } as any} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 11, fontWeight: 800, color: i < 3 ? '#FFF' : '#6B7280' }}>#{i + 1}</span></div>
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{p.name}</div></div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{p.prescriptions_count || 0}</div>
                  <div style={{ fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase' }}>presc.</div>
                </div>
              </div>
            ))}
          </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      <HeroCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{user.company_name || 'Entreprise'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: stats.total_intervenants || intervenants.length, label: 'Intervenants' },
            { val: stats.total_prescribers || prescribers.length, label: 'Prescripteurs' },
            { val: activeAlerts.length, label: 'Alertes' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <QuickAction icon="people-outline" label="Intervenants" onPress={() => router.push('/(tabs)/teleconsult')} />
        <QuickAction icon="document-text-outline" label="Prescriptions" onPress={() => router.push('/(tabs)/devices')} />
        <QuickAction icon="notifications-outline" label="Alertes" onPress={() => router.push('/(tabs)/alerts')} />
      </View>

      {ranking.length > 0 && (
        <>
          <SectionHeader title="Classement prescripteurs" />
          {ranking.slice(0, 5).map((p: any, i: number) => (
            <TouchableOpacity key={p.id || i} onPress={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: i < 3 ? '#FFF' : '#6B7280' }}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.name}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{p.prescriptions_count || 0} prescriptions</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#9CA3AF" />
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}

      {interventions.length > 0 && (
        <>
          <SectionHeader title="Interventions recentes" action="Voir tout" onAction={() => router.push('/(tabs)/teleconsult')} />
          {interventions.slice(0, 3).map((iv: any) => (
            <TouchableOpacity key={iv.id} onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId: iv.id } })}>
              <Card style={{ borderLeftWidth: 3, borderLeftColor: iv.status === 'completed' ? '#10B981' : iv.status === 'in_progress' ? '#111827' : '#F59E0B' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{iv.beneficiary_name || 'Intervention'}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{iv.status === 'completed' ? 'Terminee' : iv.status === 'in_progress' ? 'En cours' : 'En attente'}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}
