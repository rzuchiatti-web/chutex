import React, { useState, useEffect, useCallback } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PhoneInputWithPrefix } from '../src/components/PhoneInputWithPrefix';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

const STATUS_COLOR: any = { accepted: '#10B981', pending: '#F59E0B', sms_sent: '#A78BFA', removed: '#6B7280', rejected: '#EF4444' };
const STATUS_LABEL: any = { accepted: 'Rattaché', pending: 'En attente', sms_sent: 'SMS envoyé', removed: 'Retiré', rejected: 'Refusé' };

const GCard = ({ children, style, onClick }: any) => (
  <div onClick={onClick} style={{ padding: '14px 16px', borderRadius: 18, background: '#FFF', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 8, cursor: onClick ? 'pointer' : 'default', ...style } as any}>
    {children}
  </div>
);

export default function CompanyAgencyScreen() {
  const { agencyId } = useLocalSearchParams<{ agencyId?: string }>();
  const { token, user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<'agencies' | 'guardians'>('agencies');
  const [agencies, setAgencies] = useState<any[]>([]);
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);
  const [agForm, setAgForm] = useState({ name: '', address: '' });
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePrefix, setInvitePrefix] = useState('+33');
  const [inviteMsg, setInviteMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ag, iv, gl] = await Promise.all([
        apiFetch('/api/company/agencies', {}, token),
        apiFetch('/api/company/intervenants', {}, token),
        apiFetch('/api/company/guardians', {}, token).catch(() => []),
      ]);
      setAgencies(Array.isArray(ag) ? ag : []);
      setIntervenants(Array.isArray(iv) ? iv : []);
      setGuardianLinks(Array.isArray(gl) ? gl : []);
      if (agencyId) {
        const found = (Array.isArray(ag) ? ag : []).find((a: any) => a.id === agencyId);
        if (found) { setSelectedAgency(found); setTab('agencies'); }
      }
    } catch {} finally { setLoading(false); }
  }, [token, agencyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createAgency = async () => {
    if (!agForm.name.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/company/agencies', { method: 'POST', body: JSON.stringify(agForm) }, token);
      setShowCreate(false); setAgForm({ name: '', address: '' }); fetchData();
    } catch (e: any) { Alert.alert(t('error'), e.message); } finally { setSaving(false); }
  };

  const deleteAgency = async (id: string) => {
    try { await apiFetch(`/api/company/agencies/${id}`, { method: 'DELETE' }, token); fetchData(); setSelectedAgency(null); } catch {}
  };

  const inviteGuardian = async () => {
    if (!invitePhone.trim()) return;
    const phoneClean = invitePhone.trim().replace(/[\s.\-]/g, '');
    if (phoneClean.length < 10) { setInviteMsg('Erreur : Numéro invalide (min 10 chiffres)'); return; }
    setSaving(true); setInviteMsg('');
    try {
      const res = await apiFetch('/api/company/invite-guardian', { method: 'POST', body: JSON.stringify({ phone: invitePhone.trim() }) }, token);
      setInviteMsg(res.message || 'Invitation envoyée !');
      if (res.status !== 'error') { fetchData(); setTimeout(() => { setShowInvite(false); setInvitePhone(''); setInviteMsg(''); }, 2500); }
    } catch (e: any) { setInviteMsg(`Erreur : ${e.message}`); } finally { setSaving(false); }
  };

  const removeGuardian = async (linkId: string) => {
    try { await apiFetch(`/api/company/guardians/${linkId}`, { method: 'DELETE' }, token); fetchData(); } catch {}
  };

  if (loading) return <FullScreenLoader />;
  if (Platform.OS !== 'web') return <NativePageView path="/company-agency" />;

  const pendingGuardians = guardianLinks.filter(g => g.status === 'pending').length;
  const acceptedGuardians = guardianLinks.filter(g => g.status === 'accepted').length;
  const u = user as any;

  /* ─────────── AGENCY DETAIL ─────────── */
  if (selectedAgency) {
    const agIvs = intervenants.filter((iv: any) => iv.agency_id === selectedAgency.id || iv.agency_name === selectedAgency.name);
    const agGuardians = guardianLinks.filter((gl: any) => gl.agency_name === selectedAgency.name);
    const agPrescribers = agGuardians.filter((gl: any) => gl.is_prescriber);
    const unaffiliated = guardianLinks.filter((gl: any) => gl.status === 'accepted' && (!gl.agency_name || gl.agency_name === 'Non assigne'));
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any} onClick={() => setSelectedAgency(null)}>
        <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as any}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{selectedAgency.name}</div>
              {selectedAgency.address && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{selectedAgency.address}</div>}
            </div>
            <div onClick={() => setSelectedAgency(null)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 } as any}>
            {[
              { val: agGuardians.length, label: 'Gardiens', icon: 'ri-shield-user-line', color: '#10B981' },
              { val: agPrescribers.length, label: 'Prescripteurs', icon: 'ri-file-text-line', color: '#F59E0B' },
              { val: agIvs.length, label: 'Intervenants', icon: 'ri-user-star-line', color: '#A78BFA' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '14px 8px', borderRadius: 16, background: '#F4F4F5', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' } as any}>
                <i className={s.icon} style={{ fontSize: 16, color: s.color, display: 'block', marginBottom: 4 }} />
                <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{s.val}</div>
                <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Gardiens affiliés */}
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Gardiens affilies ({agGuardians.length})</div>
          {agGuardians.map((gl: any) => (
            <div key={gl.link_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: 6, cursor: 'pointer' } as any} onClick={() => { setSelectedAgency(null); router.push({ pathname: '/guardian-detail', params: { guardianId: gl.id } }); }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>{gl.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{gl.name}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>{gl.phone}</div></div>
              <div onClick={async (e: any) => { e.stopPropagation(); try { await apiFetch(`/api/company/prescriber/${gl.id}/assign`, { method: 'PUT', body: JSON.stringify({ agency_id: null }) }, token); fetchData(); } catch {} }}
                style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
                <i className="ri-close-line" style={{ fontSize: 12, color: '#EF4444' }} />
              </div>
            </div>
          ))}
          {agGuardians.length === 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '12px 0' }}>Aucun gardien affilie</div>}

          {/* Non affiliés */}
          {unaffiliated.length > 0 && (<>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>Non affilies ({unaffiliated.length})</div>
            {unaffiliated.map((gl: any) => (
              <div key={gl.link_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 6 } as any}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 13, fontWeight: 800, color: '#6B7280' }}>{gl.name?.charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{gl.name}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>{gl.phone}</div></div>
                <div onClick={async () => { try { await apiFetch(`/api/company/prescriber/${gl.id}/assign`, { method: 'PUT', body: JSON.stringify({ agency_id: selectedAgency.id }) }, token); fetchData(); } catch {} }}
                  style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#10B981', flexShrink: 0 } as any}>
                  Affilier
                </div>
              </div>
            ))}
          </>)}

          <div onClick={() => { if (window.confirm(`Supprimer l'agence "${selectedAgency.name}" ?`)) { deleteAgency(selectedAgency.id); setSelectedAgency(null); } }}
            style={{ padding: '13px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 13, fontWeight: 700, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
            <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />Supprimer cette agence
          </div>
        </div>
      </div>
    );
  }

  /* ─────────── PAGE PRINCIPALE ─────────── */
  const isTab = !agencyId;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', background: '#F5F5F7' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER NOIR */}
        <div style={{ position: 'relative', minHeight: 220, overflow: 'hidden', background: '#111' } as any}>
          {!isTab && <div onClick={() => router.back()} style={{ position: 'absolute', left: 20, top: 24, width: 36, height: 36, borderRadius: 999, background: '#F4F4F5', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#111' }} />
          </div>}
          <div style={{ padding: '28px 20px 40px', textAlign: 'center' } as any}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(212,132,90,0.2)', border: '2px solid rgba(212,132,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' } as any}>
              <i className="ri-building-line" style={{ fontSize: 24, color: '#D4845A' }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{u?.structure_name || u?.name || 'Structure'}</div>
            {u?.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{u.address}</div>}
            {u?.siret && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>SIRET : {u.siret}</div>}
            <div style={{ display: 'flex', gap: 8 } as any}>
              {[
                { val: agencies.length, label: 'Agences', color: '#D4845A' },
                { val: intervenants.length, label: 'Intervenants', color: '#A78BFA' },
                { val: acceptedGuardians, label: 'Gardiens', color: '#10B981' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: '10px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENU BLANC ARRONDI */}
        <div style={{ padding: '24px 20px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#F5F5F7', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(0,0,0,0.06)' } as any}>

          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 3, background: '#E5E7EB' } as any}>
              {([
                { k: 'agencies', label: `Agences (${agencies.length})`, icon: 'ri-building-line' },
                { k: 'guardians', label: `Gardiens (${guardianLinks.length})`, icon: 'ri-shield-user-line', badge: pendingGuardians },
              ] as const).map(t => (
                <div key={t.k} onClick={() => setTab(t.k)} style={{ padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 700, background: tab === t.k ? '#FFF' : 'transparent', color: tab === t.k ? '#111' : '#6B7280', transition: 'all 0.2s', position: 'relative', whiteSpace: 'nowrap', boxShadow: tab === t.k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' } as any}>
                  <i className={t.icon} style={{ marginRight: 4 }} />{t.label}
                  {(t as any).badge > 0 && <span style={{ position: 'absolute', top: 1, right: 1, width: 14, height: 14, borderRadius: 999, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#111' } as any}>{(t as any).badge}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Invite gardien */}
          <div onClick={() => setShowInvite(true)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: '#FFF', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 12, cursor: 'pointer' } as any}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-user-add-line" style={{ fontSize: 18, color: '#10B981' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Inviter un gardien</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>Envoyez un SMS d'invitation</div>
            </div>
            <i className="ri-send-plane-fill" style={{ fontSize: 16, color: '#10B981' }} />
          </div>

        {/* ── TAB AGENCES ── */}
        {tab === 'agencies' && (<>
          <div onClick={() => setShowCreate(true)} style={{ padding: '13px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: '#F4F4F5', border: '1px solid rgba(255,255,255,0.12)', color: '#111', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
            <i className="ri-add-circle-line" style={{ fontSize: 16 }} />Créer une agence
          </div>
          {agencies.map((ag: any) => {
            const agIvs = intervenants.filter((iv: any) => iv.agency_id === ag.id || iv.agency_name === ag.name);
            return (
              <GCard key={ag.id} onClick={() => setSelectedAgency(ag)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(212,132,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className="ri-building-line" style={{ fontSize: 22, color: '#D4845A' }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{ag.name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{ag.address || 'Aucune adresse'}</div>
                    {/* Intervenants inline */}
                    {agIvs.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 } as any}>
                        <div style={{ display: 'flex' } as any}>
                          {agIvs.slice(0, 4).map((iv: any, i: number) => (
                            <div key={i} style={{ width: 20, height: 20, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -5 : 0, border: '1.5px solid rgba(0,0,0,0.4)' } as any}>
                              <span style={{ fontSize: 8, fontWeight: 800, color: '#111' }}>{iv.name?.charAt(0)}</span>
                            </div>
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{agIvs.length} intervenant{agIvs.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#D1D5DB' }} />
                  </div>
                </div>
              </GCard>
            );
          })}
          {agencies.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px' } as any}>
              <i className="ri-building-line" style={{ fontSize: 40, color: '#E5E7EB' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 12 }}>Aucune agence</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Créez votre première agence pour organiser vos équipes</div>
            </div>
          )}
        </>)}

        {/* ── TAB INTERVENANTS ── */}
        {tab === 'intervenants' && (<>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
            {intervenants.length} intervenant{intervenants.length > 1 ? 's' : ''} au total
          </div>
          {intervenants.map((iv: any) => (
            <GCard key={iv.id} onClick={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ width: 46, height: 46, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{iv.name?.charAt(0)}</span>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{iv.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{iv.profession || 'Intervenant'}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                    {iv.agency_name && iv.agency_name !== 'Non assigne' ? `${iv.agency_name} · ` : ''}{iv.total_interventions || 0} missions
                    {iv.active_interventions > 0 && <span style={{ color: '#A78BFA', marginLeft: 6, fontWeight: 700 }}>● En mission</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{iv.total_interventions || 0}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase' }}>missions</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#D1D5DB', marginLeft: 6 }} />
              </div>
            </GCard>
          ))}
          {intervenants.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px' } as any}>
              <i className="ri-user-star-line" style={{ fontSize: 40, color: '#E5E7EB' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 12 }}>Aucun intervenant</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Les intervenants sont rattachés via leur code d'activation</div>
            </div>
          )}
        </>)}

        {/* ── TAB GARDIENS ── */}
        {tab === 'guardians' && (<>
          {guardianLinks.map((gl: any) => (
            <GCard key={gl.link_id} onClick={() => gl.id ? setSelectedGuardian(gl) : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ width: 46, height: 46, borderRadius: 999, background: gl.status === 'accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: gl.status === 'accepted' ? '1px solid rgba(16,185,129,0.3)' : 'none' } as any}>
                  {gl.id
                    ? <span style={{ fontSize: 18, fontWeight: 800, color: gl.status === 'accepted' ? '#10B981' : '#FFF' }}>{gl.name?.charAt(0)}</span>
                    : <i className="ri-user-unfollow-line" style={{ fontSize: 18, color: '#9CA3AF' }} />
                  }
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{gl.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{gl.phone}{gl.profession ? ` · ${gl.profession}` : ''}</div>
                  {gl.agency_name && <div style={{ fontSize: 10, color: '#A78BFA', marginTop: 3 }}><i className="ri-building-line" style={{ marginRight: 3 }} />{gl.agency_name}</div>}
                  {gl.professional_beneficiaries > 0 && <div style={{ fontSize: 10, color: '#10B981', marginTop: 3 }}><i className="ri-heart-pulse-line" style={{ marginRight: 3 }} />{gl.professional_beneficiaries} beneficiaire(s)</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 } as any}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: `${STATUS_COLOR[gl.status] || '#6B7280'}20`, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[gl.status] || '#6B7280' } as any}>
                    <span style={{ width: 5, height: 5, borderRadius: 99, background: STATUS_COLOR[gl.status], display: 'inline-block' } as any} />
                    {STATUS_LABEL[gl.status] || gl.status}
                  </div>
                </div>
              </div>
            </GCard>
          ))}
          {guardianLinks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px' } as any}>
              <i className="ri-shield-user-line" style={{ fontSize: 40, color: '#E5E7EB' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginTop: 12 }}>Aucun gardien rattache</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Invitez des gardiens depuis le dashboard</div>
            </div>
          )}
        </>)}
          </div>

      </div>

      {/* ─── POPUP FICHE GARDIEN + AFFILIATION AGENCE ─── */}
      {selectedGuardian && (
        <div onClick={() => setSelectedGuardian(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '90%', maxWidth: 400, padding: '28px 24px', borderRadius: 24, background: 'rgba(20,20,30,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as any}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>Fiche gardien</div>
              <div onClick={() => setSelectedGuardian(null)} style={{ width: 32, height: 32, borderRadius: 999, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /></div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#10B981' }}>{selectedGuardian.name?.charAt(0)}</span>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{selectedGuardian.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{selectedGuardian.phone}</div>
                {selectedGuardian.profession && <div style={{ fontSize: 11, color: '#A78BFA', marginTop: 2 }}>{selectedGuardian.profession}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
              {[
                { icon: 'ri-heart-pulse-line', val: selectedGuardian.professional_beneficiaries || 0, label: 'Bénéficiaires', color: '#10B981' },
                { icon: 'ri-file-text-line', val: selectedGuardian.prescriptions_count || 0, label: 'Prescriptions', color: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' } as any}>
                  <i className={s.icon} style={{ fontSize: 16, color: s.color }} />
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#111', marginTop: 2 }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Affilier a une agence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 } as any}>
              <div onClick={async () => {
                if (selectedGuardian.id) {
                  try { await apiFetch(`/api/company/prescriber/${selectedGuardian.id}/assign`, { method: 'PUT', body: JSON.stringify({ agency_id: null }) }, token); fetchData(); setSelectedGuardian({...selectedGuardian, agency_name: null}); } catch {}
                }
              }} style={{ padding: '10px 14px', borderRadius: 12, background: !selectedGuardian.agency_name ? 'rgba(124,180,255,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${!selectedGuardian.agency_name ? 'rgba(124,180,255,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 13, color: !selectedGuardian.agency_name ? '#7CB4FF' : 'rgba(255,255,255,0.5)' } as any}>
                Non affilie
              </div>
              {agencies.map((ag: any) => (
                <div key={ag.id} onClick={async () => {
                  if (selectedGuardian.id) {
                    try { await apiFetch(`/api/company/prescriber/${selectedGuardian.id}/assign`, { method: 'PUT', body: JSON.stringify({ agency_id: ag.id }) }, token); fetchData(); setSelectedGuardian({...selectedGuardian, agency_name: ag.name}); } catch {}
                  }
                }} style={{ padding: '10px 14px', borderRadius: 12, background: selectedGuardian.agency_name === ag.name ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedGuardian.agency_name === ag.name ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 13, color: selectedGuardian.agency_name === ag.name ? '#A78BFA' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 8 } as any}>
                  <i className="ri-building-line" style={{ fontSize: 14 }} />{ag.name}
                </div>
              ))}
              {agencies.length === 0 && <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: 8 }}>Aucune agence créée. Creez-en une d'abord.</div>}
            </div>

            <div onClick={() => { if (window.confirm(`Retirer ${selectedGuardian.name} de la structure ?`)) { removeGuardian(selectedGuardian.link_id); setSelectedGuardian(null); } }}
              style={{ padding: '12px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}>
              <i className="ri-user-unfollow-line" style={{ fontSize: 14 }} />Retirer ce gardien
            </div>
          </div>
        </div>
      )}

      {/* ─── POPUP CRÉER AGENCE ─── */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => setShowCreate(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Agences</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 20 }}>Nouvelle agence</div>
            {[{ k: 'name', label: 'Nom de l\'agence', ph: 'Agence Lyon Centre' }, { k: 'address', label: 'Adresse', ph: '45 rue de la Part-Dieu, 69003 Lyon' }].map(({ k, label, ph }) => (
              <div key={k} style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                <input value={(agForm as any)[k]} onChange={(e: any) => setAgForm({ ...agForm, [k]: e.target.value })} placeholder={ph} style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: '#F4F4F5', border: '1px solid rgba(255,255,255,0.1)', color: '#111', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}>
              <div onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '13px', borderRadius: 999, textAlign: 'center', background: '#F4F4F5', color: '#6B7280', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
              <div onClick={createAgency} style={{ flex: 1, padding: '13px', borderRadius: 999, textAlign: 'center', background: '#FFF', color: '#111', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Créer'}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── POPUP INVITER GARDIEN ─── */}
      {showInvite && (
        <div onClick={() => { setShowInvite(false); setInvitePhone(''); setInviteMsg(''); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => { setShowInvite(false); setInvitePhone(''); setInviteMsg(''); }} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
              </div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Gardiens rattachés</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 6 }}>Ajouter un gardien</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24, lineHeight: 1.6 }}>
              Entrez le numéro du gardien à rattacher. S'il a un compte, il reçoit une notification. Sinon, un SMS l'invite à s'inscrire sur Chutex.
            </div>
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Numéro de téléphone</div>
              <div style={{ position: 'relative' } as any}>
                <i className="ri-phone-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#9CA3AF', pointerEvents: 'none' } as any} />
                <PhoneInputWithPrefix value={invitePhone} onChangeText={setInvitePhone} prefix={invitePrefix} onPrefixChange={setInvitePrefix} placeholder="6 12 34 56 78" onSubmit={inviteGuardian} />
              </div>
            </div>
            {inviteMsg && (
              <div style={{ padding: '13px 16px', borderRadius: 14, marginBottom: 16, background: inviteMsg.startsWith(t('error')) ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${inviteMsg.startsWith(t('error')) ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` } as any}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' } as any}>
                  <i className={inviteMsg.startsWith(t('error')) ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 17, color: inviteMsg.startsWith(t('error')) ? '#EF4444' : '#10B981', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#111', lineHeight: 1.5 }}>{inviteMsg}</span>
                </div>
              </div>
            )}
            <div onClick={inviteGuardian} style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: invitePhone.trim() && !saving ? 'pointer' : 'not-allowed', background: invitePhone.trim() && !saving ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${invitePhone.trim() ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: invitePhone.trim() ? '#10B981' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              {saving ? <><i className="ri-loader-4-line" style={{ fontSize: 16 }} />Envoi...</> : <><i className="ri-send-plane-line" style={{ fontSize: 16 }} />Envoyer l'invitation</>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
