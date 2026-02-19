import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG_BLACK = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

function TabBar({ tabs, active, onChange }: any) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 } as any}>
      {tabs.map((tab: any) => (
        <div key={tab.id} onClick={() => onChange(tab.id)} style={{
          flex: 1, padding: '10px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
          background: active === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
          fontSize: 13, fontWeight: active === tab.id ? 700 : 500,
          color: active === tab.id ? '#FFF' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.2s',
        } as any}>
          <i className={tab.icon} style={{ marginRight: 6 }} />{tab.label}
          {tab.count > 0 && <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 99, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{tab.count}</span>}
        </div>
      ))}
    </div>
  );
}

export default function CompanyAgencyScreen() {
  const { agencyId } = useLocalSearchParams<{ agencyId?: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'agencies' | 'guardians'>('agencies');
  const [agencies, setAgencies] = useState<any[]>([]);
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [form, setForm] = useState({ name: '', address: '' });
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianMsg, setGuardianMsg] = useState('');
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
      if (agencyId) setSelectedAgency((Array.isArray(ag) ? ag : []).find((a: any) => a.id === agencyId) || null);
    } catch {} finally { setLoading(false); }
  }, [token, agencyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createAgency = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await apiFetch('/api/company/agencies', { method: 'POST', body: JSON.stringify(form) }, token);
      setShowCreate(false); setForm({ name: '', address: '' }); fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const deleteAgency = async (id: string) => {
    try {
      await apiFetch(`/api/company/agencies/${id}`, { method: 'DELETE' }, token);
      fetchData(); setSelectedAgency(null);
    } catch {}
  };

  const inviteGuardian = async () => {
    if (!guardianPhone.trim()) return;
    setSaving(true); setGuardianMsg('');
    try {
      const res = await apiFetch('/api/company/invite-guardian', {
        method: 'POST', body: JSON.stringify({ phone: guardianPhone.trim() }),
      }, token);
      setGuardianMsg(res.message || 'Invitation envoyee !');
      if (res.status !== 'error') { fetchData(); setTimeout(() => { setShowAddGuardian(false); setGuardianPhone(''); setGuardianMsg(''); }, 2500); }
    } catch (e: any) { setGuardianMsg(`Erreur : ${e.message}`); } finally { setSaving(false); }
  };

  const removeGuardian = async (linkId: string) => {
    try {
      await apiFetch(`/api/company/guardians/${linkId}`, { method: 'DELETE' }, token);
      fetchData();
    } catch {}
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (Platform.OS !== 'web') return <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>Agences</Text></SafeAreaView>;

  const STATUS_COLOR: any = { accepted: '#10B981', pending: '#F59E0B', sms_sent: '#A78BFA', removed: '#6B7280', rejected: '#EF4444' };
  const STATUS_LABEL: any = { accepted: 'Rattache', pending: 'En attente', sms_sent: 'SMS envoye', removed: 'Retire', rejected: 'Refuse' };

  // Detail page for a specific agency
  if (selectedAgency) {
    const agIntervenants = intervenants.filter((iv: any) => iv.agency_id === selectedAgency.id || iv.agency_name === selectedAgency.name);
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_BLACK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setSelectedAgency(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{selectedAgency.name}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Informations</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' } as any}><i className="ri-map-pin-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} /><div style={{ fontSize: 13, color: '#FFF' }}>{selectedAgency.address || 'Pas d\'adresse'}</div></div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' } as any} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' } as any}><i className="ri-group-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} /><div style={{ fontSize: 13, color: '#FFF' }}>{agIntervenants.length} intervenant{agIntervenants.length > 1 ? 's' : ''}</div></div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Intervenants ({agIntervenants.length})</div>
          {agIntervenants.map((iv: any) => (
            <div key={iv.id} onClick={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{iv.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{iv.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{iv.profession || 'Intervenant'}</div></div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{iv.total_interventions || 0} missions</div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
            </div>
          ))}
          {agIntervenants.length === 0 && <div style={{ textAlign: 'center', padding: '30px 20px' } as any}><i className="ri-group-line" style={{ fontSize: 32, color: 'rgba(255,255,255,0.1)' }} /><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Aucun intervenant</div></div>}
          <div onClick={() => { if (window.confirm(`Supprimer l'agence "${selectedAgency.name}" ?`)) deleteAgency(selectedAgency.id); }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 13, fontWeight: 700, marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14 }} />Supprimer cette agence</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_BLACK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
      {/* Header */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
        <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Structure</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        {/* Tab bar */}
        <TabBar
          tabs={[
            { id: 'agencies', label: 'Agences', icon: 'ri-building-line', count: 0 },
            { id: 'guardians', label: 'Gardiens', icon: 'ri-shield-user-line', count: guardianLinks.filter(g => g.status === 'pending').length },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* ─── TAB AGENCES ─── */}
        {activeTab === 'agencies' && (
          <>
            <div onClick={() => setShowCreate(true)} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-add-circle-line" style={{ fontSize: 16 }} />Creer une agence</div>
            {agencies.map((ag: any) => {
              const agIvs = intervenants.filter((iv: any) => iv.agency_id === ag.id || iv.agency_name === ag.name);
              return (
                <div key={ag.id} onClick={() => setSelectedAgency(ag)} style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(212,132,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 20, color: '#D4845A' }} /></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{ag.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ag.address}</div></div>
                    <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{agIvs.length}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Intervenants</div></div>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
                  </div>
                </div>
              );
            })}
            {agencies.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-building-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>Aucune agence</div></div>}
          </>
        )}

        {/* ─── TAB GARDIENS ─── */}
        {activeTab === 'guardians' && (
          <>
            <div onClick={() => setShowAddGuardian(true)} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-shield-user-add-line" style={{ fontSize: 16 }} />Ajouter un gardien</div>
            {guardianLinks.map((gl: any) => (
              <div key={gl.link_id} style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    {gl.id ? <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{gl.name?.charAt(0)}</span> : <i className="ri-user-unfollow-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />}
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{gl.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{gl.phone} {gl.profession ? `· ${gl.profession}` : ''}</div>
                    {gl.professional_beneficiaries > 0 && <div style={{ fontSize: 11, color: '#10B981', marginTop: 2 }}>{gl.professional_beneficiaries} beneficiaire(s) professionnel(s)</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: `${STATUS_COLOR[gl.status] || '#6B7280'}18`, fontSize: 10, fontWeight: 700, color: STATUS_COLOR[gl.status] || '#6B7280' } as any}>
                      <span style={{ width: 5, height: 5, borderRadius: 99, background: STATUS_COLOR[gl.status] || '#6B7280', display: 'inline-block' } as any} />
                      {STATUS_LABEL[gl.status] || gl.status}
                    </div>
                  </div>
                  {gl.status !== 'removed' && (
                    <div onClick={() => { if (window.confirm(`Retirer ${gl.name} de votre structure ?`)) removeGuardian(gl.link_id); }} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
                      <i className="ri-close-line" style={{ fontSize: 14, color: '#EF4444' }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {guardianLinks.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-shield-user-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>Aucun gardien rattache</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Invitez des gardiens professionnels pour suivre vos beneficiaires</div></div>}
          </>
        )}
      </div>

      {/* ─── MODAL CREER AGENCE ─── */}
      {showCreate && (
        <div onClick={() => setShowCreate(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 100px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowCreate(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Agences</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>Nouvelle agence</div>
            <div style={{ marginBottom: 10 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Nom</div><input value={form.name} onChange={(e: any) => setForm({...form, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, boxSizing: 'border-box', outline: 'none' } as any} /></div>
            <div style={{ marginBottom: 20 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Adresse</div><input value={form.address} onChange={(e: any) => setForm({...form, address: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, boxSizing: 'border-box', outline: 'none' } as any} /></div>
            <div style={{ display: 'flex', gap: 10 } as any}><div onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div><div onClick={createAgency} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: '#FFF', color: '#111', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Creer'}</div></div>
          </div>
        </div>
      )}

      {/* ─── MODAL AJOUTER GARDIEN ─── */}
      {showAddGuardian && (
        <div onClick={() => { setShowAddGuardian(false); setGuardianPhone(''); setGuardianMsg(''); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => { setShowAddGuardian(false); setGuardianPhone(''); setGuardianMsg(''); }} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Gardiens rattaches</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Ajouter un gardien</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
              Entrez le numero de telephone du gardien a rattacher a votre structure.<br/>
              S'il a deja un compte, il recevra une notification pour accepter. Sinon, un SMS l'invitera a s'inscrire sur Chutex.
            </div>

            {/* Phone field */}
            <div style={{ marginBottom: 24 } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Numero de telephone du gardien</div>
              <div style={{ position: 'relative' } as any}>
                <i className="ri-phone-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' } as any} />
                <input value={guardianPhone} onChange={(e: any) => setGuardianPhone(e.target.value)} placeholder="06 12 34 56 78" type="tel" onKeyDown={(e: any) => { if (e.key === 'Enter') inviteGuardian(); }} style={{ width: '100%', padding: '15px 16px 15px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
            </div>

            {/* Message */}
            {guardianMsg && (
              <div style={{ padding: '14px 16px', borderRadius: 14, marginBottom: 16, background: guardianMsg.startsWith('Erreur') ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${guardianMsg.startsWith('Erreur') ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` } as any}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 } as any}>
                  <i className={guardianMsg.startsWith('Erreur') ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 18, color: guardianMsg.startsWith('Erreur') ? '#EF4444' : '#10B981', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{guardianMsg}</span>
                </div>
              </div>
            )}

            {/* Send button */}
            <div onClick={inviteGuardian} style={{ padding: '17px', borderRadius: 999, textAlign: 'center', cursor: guardianPhone.trim() && !saving ? 'pointer' : 'not-allowed', background: guardianPhone.trim() && !saving ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${guardianPhone.trim() ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: guardianPhone.trim() ? '#10B981' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              {saving ? <><i className="ri-loader-4-line" style={{ fontSize: 16 }} /><span>Envoi...</span></> : <><i className="ri-send-plane-line" style={{ fontSize: 16 }} /><span>Envoyer l'invitation</span></>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
