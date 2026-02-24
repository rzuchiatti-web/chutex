import React, { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import { BG_IMAGES } from './constants';

const BG = BG_IMAGES.dashboard;
const BG_RED = BG_IMAGES.red;
const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

/* ── Full User Detail Popup (fetches all linked data) ── */
function UserDetailPopup({ user: u, token, onClose, roleLabels, roleColors, G: Gstyle }: any) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/backoffice/user/${u.id}`, {}, token)
      .then(d => setDetail(d))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [u.id, token]);

  const d = detail?.user || u;
  const guards = detail?.guardians || [];
  const bens = detail?.beneficiaries || [];
  const devices = detail?.devices || [];
  const alertsH = detail?.alerts || [];
  const ivsH = detail?.interventions || [];
  const sub = detail?.subscription;
  const color = roleColors[d.role] || '#A78BFA';

  const InfoRow = ({ icon, label, value }: any) => value ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
      <i className={icon} style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
      <div style={{ flex: 1 } as any}><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 600 }}>{value}</div></div>
    </div>
  ) : null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.3)', overflowY: 'auto' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '32px 20px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 } as any}>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Chargement...</div> : (
          <>
            {/* Avatar + Name */}
            <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: `${color}25`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8, border: `2px solid ${color}50` } as any}><span style={{ fontSize: 22, fontWeight: 800, color }}>{d.name?.charAt(0)}</span></div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{d.name}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 6 } as any}>
                <span style={{ fontSize: 10, fontWeight: 700, color, padding: '2px 10px', borderRadius: 999, background: `${color}15` }}>{roleLabels[d.role] || d.role}</span>
                {sub && <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', padding: '2px 10px', borderRadius: 999, background: 'rgba(167,139,250,0.12)' }}>Abonne {sub.subscription_type}</span>}
              </div>
            </div>

            {/* Identity */}
            <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Identite</div>
              <InfoRow icon="ri-phone-line" label="Telephone" value={d.phone} />
              <InfoRow icon="ri-mail-line" label="Email" value={d.email} />
              <InfoRow icon="ri-map-pin-line" label="Adresse" value={d.address} />
              <InfoRow icon="ri-calendar-line" label="Naissance" value={d.date_of_birth} />
              <InfoRow icon="ri-user-line" label="Genre" value={d.gender} />
              <InfoRow icon="ri-time-line" label="Inscription" value={d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              <InfoRow icon="ri-id-card-line" label="ID" value={d.id} />
            </div>

            {/* Medical (beneficiary) */}
            {d.role === 'beneficiary' && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Dossier medical</div>
                <InfoRow icon="ri-drop-line" label="Groupe sanguin" value={d.blood_type} />
                <InfoRow icon="ri-heart-pulse-line" label="Pathologies" value={d.medical_conditions} />
                <InfoRow icon="ri-alert-line" label="Allergies" value={d.allergies} />
                <InfoRow icon="ri-stethoscope-line" label="Medecin traitant" value={d.doctor_name} />
                <InfoRow icon="ri-ruler-line" label="Taille" value={d.height_cm ? `${d.height_cm} cm` : null} />
                <InfoRow icon="ri-scales-3-line" label="Poids" value={d.weight_kg ? `${d.weight_kg} kg` : null} />
                <InfoRow icon="ri-phone-line" label="Contact urgence" value={d.emergency_contact_name ? `${d.emergency_contact_name} (${d.emergency_contact_phone})` : null} />
              </div>
            )}

            {/* Guardian/Pro info */}
            {(d.role === 'guardian' || d.role === 'prescriber_company') && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Informations {d.role === 'guardian' ? 'gardien' : 'structure'}</div>
                <InfoRow icon="ri-shield-line" label="Type" value={d.guardian_type === 'professional' ? 'Professionnel' : d.guardian_type === 'particular' ? 'Particulier' : d.guardian_type} />
                <InfoRow icon="ri-heart-line" label="Lien" value={d.relationship} />
                <InfoRow icon="ri-stethoscope-line" label="Profession" value={d.profession} />
                <InfoRow icon="ri-building-line" label="Structure" value={d.structure_name} />
                <InfoRow icon="ri-barcode-line" label="SIRET" value={d.siret} />
                <InfoRow icon="ri-run-line" label="Intervenant" value={d.is_intervention_provider ? `Oui (rayon ${d.intervention_radius_km} km)` : null} />
                <InfoRow icon="ri-key-line" label="Code prescripteur" value={d.prescriber_code_used} />
              </div>
            )}

            {/* Devices */}
            {devices.length > 0 && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Appareils ({devices.length})</div>
                {devices.map((dev: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <i className={dev.device_type === 'bracelet' ? 'ri-heart-pulse-line' : dev.device_type === 'scale' ? 'ri-scales-3-line' : 'ri-t-shirt-line'} style={{ fontSize: 14, color: dev.connected ? '#10B981' : 'rgba(255,255,255,0.2)' }} />
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{dev.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{dev.connected ? 'Connecte' : 'Deconnecte'} - Batterie {dev.battery}%</div></div>
                  </div>
                ))}
              </div>
            )}

            {/* Linked Guardians */}
            {guards.length > 0 && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Gardiens lies ({guards.length})</div>
                {guards.map((g: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 800, color: '#10B981' }}>{g.name?.charAt(0)}</span></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{g.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.relationship || g.guardian_type} - {g.phone}</div></div>
                  </div>
                ))}
              </div>
            )}

            {/* Linked Beneficiaries */}
            {bens.length > 0 && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Beneficiaires lies ({bens.length})</div>
                {bens.map((b: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 800, color: '#38BDF8' }}>{b.name?.charAt(0)}</span></div>
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{b.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{b.phone} {b.has_subscription ? '- Abonne' : ''}</div></div>
                  </div>
                ))}
              </div>
            )}

            {/* Alerts History */}
            {alertsH.length > 0 && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Historique alertes ({alertsH.length})</div>
                {alertsH.slice(0, 5).map((a: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: a.status === 'active' ? '#EF4444' : '#10B981', flexShrink: 0 } as any} />
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 11, color: '#FFF' }}>{a.type} - {a.message?.substring(0, 40)}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</div></div>
                    <span style={{ fontSize: 8, fontWeight: 700, color: a.status === 'active' ? '#EF4444' : '#10B981' }}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Interventions */}
            {ivsH.length > 0 && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Interventions ({ivsH.length})</div>
                {ivsH.slice(0, 5).map((iv: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <i className="ri-map-pin-range-line" style={{ fontSize: 12, color: '#F59E0B' }} />
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 11, color: '#FFF' }}>{iv.status} - {iv.intervenant_name || 'Intervenant'}</div></div>
                  </div>
                ))}
              </div>
            )}

            {/* Subscription detail */}
            {sub && (
              <div style={{ ...Gstyle, padding: '12px 14px', marginBottom: 10 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Abonnement</div>
                <InfoRow icon="ri-vip-crown-line" label="Type" value={sub.subscription_type} />
                <InfoRow icon="ri-checkbox-circle-line" label="Statut" value={sub.status} />
                <InfoRow icon="ri-store-line" label="Source" value={sub.source} />
                <InfoRow icon="ri-time-line" label="Cree le" value={sub.created_at ? new Date(sub.created_at).toLocaleDateString('fr-FR') : null} />
              </div>
            )}

            <div onClick={onClose} style={{ padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF', marginTop: 6 } as any}>Fermer</div>
          </>
        )}
      </div>
    </div>
  );
}

type Tab = 'dashboard' | 'users' | 'alerts' | 'analytics' | 'settings';

export default function AdminHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [actCodes, setActCodes] = useState<any[]>([]);
  const [ivCodes, setIvCodes] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [st, us, al, iv, ac, ic, sub, inv, k] = await Promise.all([
        apiFetch('/api/backoffice/stats', {}, token).catch(() => ({})),
        apiFetch('/api/backoffice/users', {}, token).catch(() => []),
        apiFetch('/api/backoffice/alerts', {}, token).catch(() => []),
        apiFetch('/api/backoffice/interventions', {}, token).catch(() => []),
        apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
        apiFetch('/api/admin/intervention-codes', {}, token).catch(() => []),
        apiFetch('/api/admin/subscriptions', {}, token).catch(() => []),
        apiFetch('/api/admin/saad-invitations', {}, token).catch(() => []),
        apiFetch('/api/backoffice/kpi', {}, token).catch(() => ({})),
      ]);
      setStats(st); setUsers(Array.isArray(us) ? us : []); setAlerts(Array.isArray(al) ? al : []);
      setInterventions(Array.isArray(iv) ? iv : []); setActCodes(Array.isArray(ac) ? ac : []);
      setIvCodes(Array.isArray(ic) ? ic : []); setSubscriptions(Array.isArray(sub) ? sub : []);
      setInvitations(Array.isArray(inv) ? inv : []); setKpi(k);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (Platform.OS !== 'web') return null;
  if (loading) return <FullScreenLoader />;

  const activeAlerts = alerts.filter((a: any) => a.status === 'active');
  const filteredUsers = users.filter((u: any) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name?.toLowerCase().includes(search.toLowerCase()) && !u.email?.toLowerCase().includes(search.toLowerCase()) && !u.phone?.includes(search)) return false;
    return true;
  });
  const roleLabels: any = { beneficiary: 'Beneficiaire', guardian: 'Gardien', admin: 'Admin', teleassistance: 'Teleassistance', prescriber_company: 'SAAD' };
  const roleColors: any = { beneficiary: '#38BDF8', guardian: '#10B981', admin: '#A78BFA', teleassistance: '#F59E0B', prescriber_company: '#F97316' };

  const tabs: { key: Tab; icon: string; label: string }[] = [
    { key: 'dashboard', icon: 'ri-dashboard-line', label: 'Dashboard' },
    { key: 'users', icon: 'ri-group-line', label: 'Utilisateurs' },
    { key: 'alerts', icon: 'ri-alarm-warning-line', label: 'Alertes' },
    { key: 'analytics', icon: 'ri-bar-chart-box-line', label: 'Analytique' },
    { key: 'settings', icon: 'ri-settings-3-line', label: 'Parametres' },
  ];

  return (
    <div data-testid="admin-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 16px 90px', WebkitOverflowScrolling: 'touch' } as any}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 42, height: 42, borderRadius: 999, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(167,139,250,0.3)' } as any}>
              <i className="ri-shield-check-line" style={{ fontSize: 20, color: '#A78BFA' }} />
            </div>
            <div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{user.name}</div><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Administration CARE WATCH</span></div>
          </div>
          <div onClick={fetchAll} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-refresh-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>

        {/* ═══════ TAB: DASHBOARD ═══════ */}
        {tab === 'dashboard' && (
          <>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
              {[
                { val: stats.total_users || users.length, label: 'Utilisateurs', icon: 'ri-group-line', color: '#38BDF8' },
                { val: activeAlerts.length, label: 'Alertes actives', icon: 'ri-alarm-warning-line', color: activeAlerts.length > 0 ? '#EF4444' : '#10B981' },
                { val: interventions.length, label: 'Interventions', icon: 'ri-map-pin-range-line', color: '#F59E0B' },
                { val: subscriptions.length, label: 'Abonnements', icon: 'ri-vip-crown-line', color: '#A78BFA' },
              ].map((s, i) => (
                <div key={i} style={{ ...G, padding: '12px 8px', textAlign: 'center' } as any}>
                  <i className={s.icon} style={{ fontSize: 16, color: s.color, display: 'block', marginBottom: 4 }} />
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div style={{ marginBottom: 14 } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Alertes actives</div>
                {activeAlerts.slice(0, 3).map((a: any) => (
                  <div key={a.id} onClick={() => router.push({ pathname: '/alert-detail' as any, params: { alertId: a.id } })} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', padding: '14px 16px', marginBottom: 8, cursor: 'pointer', minHeight: 60 } as any}>
                    <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 } as any}>
                      <i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#FFF' }} />
                      <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{a.message?.substring(0, 50)}</div></div>
                      <div style={{ padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 9, fontWeight: 700, color: '#FFF' }}>Active</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Users by role */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Repartition par role</div>
              {Object.entries(roleLabels).map(([role, label]: any) => {
                const count = users.filter((u: any) => u.role === role).length;
                return (
                  <div key={role} onClick={() => { setRoleFilter(role); setTab('users'); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' } as any}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: roleColors[role] } as any} />
                    <span style={{ flex: 1, fontSize: 13, color: '#FFF', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{count}</span>
                    <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                );
              })}
            </div>

            {/* SAAD Invitation */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
                <i className="ri-mail-send-line" style={{ fontSize: 16, color: '#A78BFA' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Inviter un SAAD</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 } as any}>
                <input id="saad-email" placeholder="Email du dirigeant" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} />
                <input id="saad-name" placeholder="Nom" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} />
                <input id="saad-structure" placeholder="Structure SAAD" style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', width: '100%' } as any} />
              </div>
              <div onClick={async () => {
                const email = (document.getElementById('saad-email') as HTMLInputElement)?.value;
                const name = (document.getElementById('saad-name') as HTMLInputElement)?.value;
                const structure = (document.getElementById('saad-structure') as HTMLInputElement)?.value;
                if (!email) return;
                try { const r = await apiFetch('/api/admin/saad-invitation', { method: 'POST', body: JSON.stringify({ email, name, structure_name: structure }) }, token); alert(`Invitation envoyee (${r.token})`); fetchAll(); } catch (e: any) { alert(e.message); }
              }} style={{ padding: '10px', borderRadius: 10, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#A78BFA' } as any}>Envoyer l'invitation</div>
            </div>

            {/* Recent users */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Derniers inscrits</div>
              {users.slice(0, 5).map((u: any, i: number) => (
                <div key={u.id || i} onClick={() => setSelectedUser(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer' } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: `${roleColors[u.role] || '#666'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 12, fontWeight: 800, color: roleColors[u.role] || '#FFF' }}>{u.name?.charAt(0)}</span></div>
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{u.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{u.phone || u.email}</div></div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: roleColors[u.role], padding: '2px 8px', borderRadius: 999, background: `${roleColors[u.role]}15` }}>{roleLabels[u.role] || u.role}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════ TAB: USERS ═══════ */}
        {tab === 'users' && (
          <>
            <input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher par nom, email ou telephone..." style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 12 } as any} />
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' } as any}>
              {[{ k: 'all', l: 'Tous' }, ...Object.entries(roleLabels).map(([k, l]) => ({ k, l: l as string }))].map(r => (
                <div key={r.k} onClick={() => setRoleFilter(r.k)} style={{ padding: '6px 14px', borderRadius: 999, background: roleFilter === r.k ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${roleFilter === r.k ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: roleFilter === r.k ? '#FFF' : 'rgba(255,255,255,0.3)' } as any}>{r.l} ({r.k === 'all' ? users.length : users.filter((u: any) => u.role === r.k).length})</div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 10 }}>{filteredUsers.length} utilisateur(s)</div>
            {filteredUsers.map((u: any, i: number) => (
              <div key={u.id || i} onClick={() => setSelectedUser(u)} style={{ ...G, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 999, background: `${roleColors[u.role] || '#666'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 16, fontWeight: 800, color: roleColors[u.role] || '#FFF' }}>{u.name?.charAt(0)}</span></div>
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.phone} {u.email ? `- ${u.email}` : ''}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: roleColors[u.role], padding: '3px 8px', borderRadius: 999, background: `${roleColors[u.role]}15`, display: 'inline-block', marginBottom: 2 }}>{roleLabels[u.role] || u.role}</span>
                  {u.has_subscription && <div style={{ fontSize: 8, color: '#A78BFA' }}>Abonne</div>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ═══════ TAB: ALERTS ═══════ */}
        {tab === 'alerts' && (
          <>
            {activeAlerts.length > 0 && (
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Alertes actives ({activeAlerts.length})</div>
                {activeAlerts.map((a: any) => (
                  <div key={a.id} onClick={() => router.push({ pathname: '/alert-detail' as any, params: { alertId: a.id } })} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', padding: '14px 16px', marginBottom: 8, cursor: 'pointer' } as any}>
                    <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 } as any}>
                      <i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#FFF' }} />
                      <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{a.type} - {a.message?.substring(0, 60)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Historique ({alerts.length})</div>
            {alerts.slice(0, 20).map((a: any, i: number) => (
              <div key={a.id || i} style={{ ...G, padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: a.status === 'active' ? '#EF4444' : a.status === 'resolved' ? '#10B981' : '#F59E0B', flexShrink: 0 } as any} />
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{a.type} - {new Date(a.created_at).toLocaleDateString('fr-FR')}</div></div>
                <span style={{ fontSize: 9, fontWeight: 700, color: a.status === 'active' ? '#EF4444' : '#10B981', padding: '2px 8px', borderRadius: 999, background: a.status === 'active' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' }}>{a.status}</span>
              </div>
            ))}
            {/* Interventions */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 10 }}>Interventions ({interventions.length})</div>
            {interventions.slice(0, 10).map((iv: any, i: number) => (
              <div key={iv.id || i} style={{ ...G, padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className="ri-map-pin-range-line" style={{ fontSize: 14, color: '#F59E0B' }} />
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{iv.intervenant_name || 'Intervenant'}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{iv.status} - {iv.beneficiary_name}</div></div>
              </div>
            ))}
          </>
        )}

        {/* ═══════ TAB: ANALYTICS ═══════ */}
        {tab === 'analytics' && (
          <>
            {/* KPI summary */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Indicateurs cles</div>
              {[
                { label: 'Beneficiaires actifs', value: users.filter((u: any) => u.role === 'beneficiary').length, color: '#38BDF8' },
                { label: 'Taux d\'abonnement', value: `${subscriptions.length > 0 ? Math.round(subscriptions.filter((s: any) => s.status === 'active').length / Math.max(1, users.filter((u: any) => u.role === 'beneficiary').length) * 100) : 0}%`, color: '#A78BFA' },
                { label: 'Alertes resolues', value: alerts.filter((a: any) => a.status === 'resolved').length, color: '#10B981' },
                { label: 'Temps moyen resolution', value: kpi.avg_resolution_time || '< 15 min', color: '#F59E0B' },
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{k.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: k.color }}>{k.value}</span>
                </div>
              ))}
            </div>

            {/* Subscriptions */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Abonnements ({subscriptions.length})</div>
              {subscriptions.slice(0, 8).map((s: any, i: number) => (
                <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <i className="ri-vip-crown-line" style={{ fontSize: 14, color: s.status === 'active' ? '#A78BFA' : 'rgba(255,255,255,0.2)' }} />
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{s.beneficiary_phone}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.subscription_type} - {s.source}</div></div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: s.status === 'active' ? '#10B981' : '#EF4444' }}>{s.status}</span>
                </div>
              ))}
            </div>

            {/* SAAD Invitations */}
            {invitations.length > 0 && (
              <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Invitations SAAD ({invitations.length})</div>
                {invitations.map((inv: any, i: number) => (
                  <div key={inv.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <i className="ri-mail-check-line" style={{ fontSize: 14, color: inv.status === 'pending' ? '#F59E0B' : '#10B981' }} />
                    <div style={{ flex: 1 } as any}><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{inv.name || inv.email}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{inv.structure_name} - {inv.email}</div></div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: inv.status === 'pending' ? '#F59E0B' : '#10B981' }}>{inv.status}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══════ TAB: SETTINGS ═══════ */}
        {tab === 'settings' && (
          <>
            {/* Activation Codes */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Codes d'activation ({actCodes.length})</div>
                <div onClick={() => {
                  const code = prompt('Code (ex: PRESC-XXX-01)');
                  const structure = prompt('Nom de la structure');
                  if (code && structure) apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ code, structure_name: structure, max_uses: 50 }) }, token).then(() => fetchAll()).catch((e: any) => alert(e.message));
                }} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#10B981' } as any}>+ Ajouter</div>
              </div>
              {actCodes.map((c: any, i: number) => (
                <div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: c.active ? '#10B981' : '#EF4444' } as any} />
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', fontFamily: 'monospace' }}>{c.code}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.structure_name} - {c.uses_count || 0}/{c.max_uses} utilisations</div></div>
                  <div onClick={() => apiFetch(`/api/admin/activation-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => fetchAll())} style={{ padding: '4px 10px', borderRadius: 8, background: c.active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: c.active ? '#EF4444' : '#10B981' } as any}>{c.active ? 'Desactiver' : 'Activer'}</div>
                  <div onClick={() => { if (window.confirm(`Supprimer le code ${c.code} ?`)) apiFetch(`/api/admin/activation-codes/${c.id}`, { method: 'DELETE' }, token).then(() => fetchAll()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14, color: 'rgba(239,68,68,0.5)' }} /></div>
                </div>
              ))}
            </div>

            {/* Intervention Codes */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Codes intervention ({ivCodes.length})</div>
                <div onClick={() => {
                  const code = prompt('Code (ex: CARE-XXX-01)');
                  const structure = prompt('Nom de la structure');
                  if (code && structure) apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ code, structure_name: structure, default_radius_km: 30 }) }, token).then(() => fetchAll()).catch((e: any) => alert(e.message));
                }} style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#F59E0B' } as any}>+ Ajouter</div>
              </div>
              {ivCodes.map((c: any, i: number) => (
                <div key={c.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: c.active ? '#F59E0B' : '#EF4444' } as any} />
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', fontFamily: 'monospace' }}>{c.code}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.structure_name} - Rayon {c.default_radius_km}km</div></div>
                  <div onClick={() => apiFetch(`/api/admin/intervention-codes/${c.id}/toggle`, { method: 'PUT' }, token).then(() => fetchAll())} style={{ padding: '4px 10px', borderRadius: 8, background: c.active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', cursor: 'pointer', fontSize: 9, fontWeight: 700, color: c.active ? '#EF4444' : '#10B981' } as any}>{c.active ? 'Desactiver' : 'Activer'}</div>
                </div>
              ))}
            </div>

            {/* System Info */}
            <div style={{ ...G, padding: '16px', marginBottom: 14 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Systeme</div>
              {[
                { label: 'Version', value: 'CARE WATCH v3.0' },
                { label: 'Editeur', value: 'Chutex Innovation SAS' },
                { label: 'Contact DPO', value: 'contact@chutex-innovation.com' },
                { label: 'API', value: 'FastAPI + MongoDB' },
                { label: 'IA', value: 'GPT-4.1 via Emergent' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════ USER DETAIL POPUP ═══════ */}
        {selectedUser && (
          <UserDetailPopup user={selectedUser} token={token} onClose={() => setSelectedUser(null)} roleLabels={roleLabels} roleColors={roleColors} G={G} />
        )}
      </div>

      {/* ═══════ TAB BAR ═══════ */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '8px 12px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8) 30%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-around', maxWidth: 420, margin: '0 auto' } as any}>
          {tabs.map(t => (
            <div key={t.key} data-testid={`admin-tab-${t.key}`} onClick={() => setTab(t.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '6px 0', opacity: tab === t.key ? 1 : 0.4, transition: 'opacity 0.2s' } as any}>
              <i className={t.icon} style={{ fontSize: 20, color: tab === t.key ? '#A78BFA' : '#FFF' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: tab === t.key ? '#A78BFA' : '#FFF' }}>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
