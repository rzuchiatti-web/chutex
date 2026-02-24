import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import { Card, HeroCard, SectionHeader, PillButton, LanguageFlagButton } from './SharedUI';
import { Icon } from '../WebIcon';
import { CHX, BG_IMAGES } from './constants';

/* ─── REWARDS ADMIN CARD ─── */
function RewardsAdminCard({ token }: { token: string }) {
  const [reward, setReward] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ prize_1: '100', prize_2: '70', prize_3: '30' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch('/api/company/rewards/current', {}, token).then(r => {
      setReward(r);
      setForm({ prize_1: String(r.prize_1 || 100), prize_2: String(r.prize_2 || 70), prize_3: String(r.prize_3 || 30) });
    }).catch(() => {});
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/rewards', { method: 'POST', body: JSON.stringify({ prize_1: parseInt(form.prize_1) || 100, prize_2: parseInt(form.prize_2) || 70, prize_3: parseInt(form.prize_3) || 30 }) }, token);
      setEditing(false);
      setReward({ ...reward, prize_1: parseInt(form.prize_1), prize_2: parseInt(form.prize_2), prize_3: parseInt(form.prize_3) });
    } catch {} finally { setSaving(false); }
  };

  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <Card style={{ borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)', backgroundColor: 'rgba(0,0,0,0.03)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="trophy" size={22} color="#FFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Recompenses {monthLabel}</Text>
          <Text style={{ fontSize: 11, color: '#6B7280' }}>Top 3 prescripteurs</Text>
        </View>
        <TouchableOpacity onPress={() => setEditing(!editing)} style={{ padding: 6 }}>
          <Icon name={editing ? 'close' : 'create-outline'} size={20} color="#111827" />
        </TouchableOpacity>
      </View>
      {!editing ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          {[
            { pos: '1er', prize: reward?.prize_1 || 100, color: '#FFD700' },
            { pos: '2e', prize: reward?.prize_2 || 70, color: '#C0C0C0' },
            { pos: '3e', prize: reward?.prize_3 || 30, color: '#CD7F32' },
          ].map(t => (
            <View key={t.pos} style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: t.color, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                <Icon name="trophy" size={18} color="#FFF" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{t.prize}EUR</Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>{t.pos}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {['prize_1', 'prize_2', 'prize_3'].map((k, i) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', width: 30 }}>{i + 1}e</Text>
              <TextInput value={(form as any)[k]} onChangeText={(v: string) => setForm({ ...form, [k]: v })} keyboardType="numeric" style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, fontSize: 16, fontWeight: '700', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>EUR</Text>
            </View>
          ))}
          <TouchableOpacity onPress={save} style={{ backgroundColor: '#111827', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', marginTop: 4 }}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

/* ─── ADMIN HOME ─── */
export default function AdminHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ranking, setRanking] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [st, al, us, co, rk] = await Promise.all([
        apiFetch('/api/admin/stats', {}, token).catch(() => ({})),
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/admin/users', {}, token).catch(() => []),
        apiFetch('/api/admin/companies', {}, token).catch(() => []),
        apiFetch('/api/company/ranking', {}, token).catch(() => []),
      ]);
      setStats(st); setAlerts(al); setUsers(us); setCompanies(co); setRanking(rk);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <FullScreenLoader />;
  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const BG_DASH = BG_IMAGES.dashboard;
  const BG_RED = BG_IMAGES.red;

  if (Platform.OS === 'web') {
    return (
      <div data-testid="admin-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 46, height: 46, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.15)' } as any}><i className="ri-shield-check-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{user.name}</div><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Administration CARE WATCH</span></div></div>
          </div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>{[{ val: stats.total_users || 0, label: 'Utilisateurs', icon: 'ri-group-line' }, { val: stats.total_alerts || 0, label: 'Alertes', icon: 'ri-alarm-warning-line' }, { val: activeAlerts.length, label: 'Actives', icon: 'ri-pulse-line', color: activeAlerts.length > 0 ? '#EF4444' : undefined }, { val: stats.total_interventions || 0, label: 'Interventions', icon: 'ri-map-pin-range-line' }].map((s: any, i) => (<div key={i} style={{ padding: '12px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' } as any}><i className={s.icon} style={{ fontSize: 16, color: s.color || 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }} /><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{s.val}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div></div>))}</div>
          {/* Quick actions */}
          <div onClick={() => router.push('/backoffice')} data-testid="admin-backoffice-btn" style={{ padding: '14px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-settings-3-line" style={{ fontSize: 18, color: '#FFF' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Back-Office</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Gestion complete du systeme</div></div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} /></div>
          {/* Active alerts */}
          {activeAlerts.map((a: any) => (<div key={a.id} onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 10, cursor: 'pointer', minHeight: 70 } as any}><img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#FFF' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{a.message}</div></div><div style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.25)' } as any}><span style={{ fontSize: 9, fontWeight: 600, color: '#FFF' }}>Active</span></div></div></div>))}
          {/* SAAD Invitation */}
          <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,92,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-mail-send-line" style={{ fontSize: 18, color: '#A78BFA' }} /></div>
              <div><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Inviter un SAAD</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Envoyer un lien d'inscription</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 } as any}>
              <input data-testid="saad-invite-email" placeholder="Email du dirigeant SAAD" style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} id="saad-email" />
              <input data-testid="saad-invite-name" placeholder="Nom du dirigeant" style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} id="saad-name" />
              <input data-testid="saad-invite-structure" placeholder="Nom de la structure SAAD" style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} id="saad-structure" />
            </div>
            <div data-testid="saad-invite-btn" onClick={async () => {
              const email = (document.getElementById('saad-email') as HTMLInputElement)?.value;
              const name = (document.getElementById('saad-name') as HTMLInputElement)?.value;
              const structure = (document.getElementById('saad-structure') as HTMLInputElement)?.value;
              if (!email) return;
              try {
                const res = await apiFetch('/api/admin/saad-invitation', { method: 'POST', body: JSON.stringify({ email, name, structure_name: structure }) }, token);
                alert(`Invitation envoyee a ${email} (Token: ${res.token})`);
                (document.getElementById('saad-email') as HTMLInputElement).value = '';
                (document.getElementById('saad-name') as HTMLInputElement).value = '';
                (document.getElementById('saad-structure') as HTMLInputElement).value = '';
              } catch (e: any) { alert('Erreur: ' + e.message); }
            }} style={{ padding: '12px', borderRadius: 12, background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.25)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#A78BFA' } as any}>Envoyer l'invitation</div>
          </div>
          {/* Rewards */}
          <RewardsAdminCard token={token} />
          {/* Ranking */}
          {ranking.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 8 }}>Classement prescripteurs</div>{ranking.slice(0, 5).map((p: any, i: number) => (<div key={p.id || i} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 6, cursor: 'pointer' } as any}><div style={{ width: 30, height: 30, borderRadius: 10, background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 12, fontWeight: 800, color: i < 3 ? '#FFF' : 'rgba(255,255,255,0.5)' }}>#{i + 1}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{p.prescriptions_count || 0} prescriptions</div></div><i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }} /></div>))}</>)}
        </div>
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      <HeroCard style={{ backgroundColor: '#111827', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #0C0A09 0%, #111827 40%, #44403C 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Administration</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: stats.total_users || 0, label: 'Utilisateurs' },
            { val: stats.total_alerts || 0, label: 'Alertes' },
            { val: stats.active_alerts || 0, label: 'Actives' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      <PillButton label="Back-Office" icon="settings-outline" onPress={() => router.push('/backoffice')} testID="admin-backoffice-btn" />

      <RewardsAdminCard token={token} />

      {ranking.length > 0 && (
        <>
          <SectionHeader title="Classement prescripteurs" />
          {ranking.slice(0, 5).map((p: any, i: number) => (
            <Card key={p.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: i < 3 ? '#FFF' : '#6B7280' }}>#{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.name}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{p.prescriptions_count || 0} prescriptions</Text>
              </View>
            </Card>
          ))}
        </>
      )}

      <SectionHeader title="Entreprises" />
      {companies.slice(0, 5).map((c: any) => (
        <TouchableOpacity key={c.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: c.id } })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="business-outline" size={20} color="#111827" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{c.name || c.company_name}</Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{c.email}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3AF" />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
