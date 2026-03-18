import React, { useState } from 'react';
import { apiFetch } from '../../services/api';

const RCOL: any = { beneficiary: '#3B82F6', guardian: '#10B981', admin: '#7C3AED', teleassistance: '#F59E0B', prescriber_company: '#F97316' };
const RLAB: any = { beneficiary: 'Beneficiaire', guardian: 'Gardien', admin: 'Admin', teleassistance: 'Teleassistance', prescriber_company: 'SAAD' };

export default function AdminUsers({ users, token, load, mob }: any) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sel, setSel] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoad, setDetailLoad] = useState(false);

  const filtered = users.filter((u: any) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search) { const s = search.toLowerCase(); return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s); }
    return true;
  });

  const openUser = async (u: any) => {
    setSel(u); setDetailLoad(true);
    try { setDetail(await apiFetch(`/api/backoffice/user/${u.id}`, {}, token)); } catch { setDetail(null); }
    finally { setDetailLoad(false); }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' } as any}>
        <div style={{ flex: 1, minWidth: 200 } as any}>
          <input data-testid="admin-user-search" className="adm-input" value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher par nom, email, telephone..." />
        </div>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>{filtered.length} utilisateur(s)</span>
      </div>

      {/* Role filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 } as any}>
        {[['all', 'Tous', users.length], ...Object.entries(RLAB).map(([k, l]) => [k, l, users.filter((u: any) => u.role === k).length])].map(([k, l, n]: any) => (
          <div key={k} onClick={() => setRoleFilter(k)} style={{
            padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: roleFilter === k ? '#7C3AED' : '#FFF', color: roleFilter === k ? '#FFF' : '#64748B',
            border: `1.5px solid ${roleFilter === k ? '#7C3AED' : '#E2E8F0'}`,
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.15s',
          } as any}>{l} <span style={{ opacity: 0.7, fontSize: 10 }}>({n})</span></div>
        ))}
      </div>

      {/* Table */}
      <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
          <table className="adm-table" style={{ minWidth: mob ? 600 : 'auto' } as any}>
            <thead><tr>
              <th style={{ width: 40 }}></th>
              <th>Nom</th>
              <th>Telephone</th>
              <th>Email</th>
              <th>Role</th>
              <th>Inscription</th>
              <th style={{ width: 80 }}></th>
            </tr></thead>
            <tbody>
              {filtered.slice(0, 50).map((u: any) => (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${RCOL[u.role] || '#64748B'}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: RCOL[u.role] || '#64748B' }}>{u.name?.charAt(0)}</span>
                    </div>
                  </td>
                  <td><span style={{ fontWeight: 600, color: '#1E293B' }}>{u.name}</span></td>
                  <td style={{ color: '#64748B' }}>{u.phone}</td>
                  <td style={{ color: '#94A3B8', fontSize: 12 }}>{u.email || '--'}</td>
                  <td><span className="adm-badge" style={{ background: `${RCOL[u.role]}12`, color: RCOL[u.role] }}>{RLAB[u.role] || u.role}</span></td>
                  <td style={{ fontSize: 11, color: '#94A3B8' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '--'}</td>
                  <td><div data-testid={`user-view-${u.id}`} onClick={() => openUser(u)} className="adm-btn" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '6px 12px', fontSize: 11 }}>Voir</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {sel && (
        <div onClick={() => { setSel(null); setDetail(null); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '40px 16px' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} className="adm-card" style={{ width: '100%', maxWidth: 520, padding: 0, overflow: 'hidden' } as any}>
            {detailLoad ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>Chargement...</div> : (() => {
              const u = detail?.user || sel;
              const guards = detail?.guardians || [];
              const bens = detail?.beneficiaries || [];
              const devs = detail?.devices || [];
              const als = detail?.alerts || [];
              const sub = detail?.subscription;
              const c = RCOL[u.role] || '#7C3AED';
              return (
                <>
                  {/* Header */}
                  <div style={{ padding: '24px 24px 0', background: `linear-gradient(135deg, ${c}08, ${c}04)` } as any}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${c}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${c}30` } as any}>
                          <span style={{ fontSize: 22, fontWeight: 800, color: c }}>{u.name?.charAt(0)}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{u.name}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' } as any}>
                            <span className="adm-badge" style={{ background: `${c}12`, color: c }}>{RLAB[u.role]}</span>
                            {sub && <span className="adm-badge" style={{ background: '#F5F3FF', color: '#7C3AED' }}>Abonne {sub.subscription_type}</span>}
                          </div>
                        </div>
                      </div>
                      <div data-testid="user-detail-close" onClick={() => { setSel(null); setDetail(null); }} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#FFF' } as any}>
                        <i className="ri-close-line" style={{ fontSize: 16, color: '#94A3B8' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '16px 24px 24px' } as any}>
                    {/* Contact */}
                    <Section title="Contact">
                      <Field icon="ri-phone-line" label="Telephone" value={u.phone} />
                      <Field icon="ri-mail-line" label="Email" value={u.email} />
                      <Field icon="ri-map-pin-line" label="Adresse" value={u.address} />
                      <Field icon="ri-calendar-line" label="Naissance" value={u.date_of_birth} />
                      <Field icon="ri-id-card-line" label="ID" value={u.id} mono />
                    </Section>

                    {u.role === 'beneficiary' && (
                      <Section title="Medical">
                        <Field icon="ri-drop-line" label="Sang" value={u.blood_type} />
                        <Field icon="ri-heart-pulse-line" label="Pathologies" value={u.medical_conditions} />
                        <Field icon="ri-alert-line" label="Allergies" value={u.allergies} />
                        <Field icon="ri-stethoscope-line" label="Medecin" value={u.doctor_name} />
                        <Field icon="ri-ruler-line" label="Taille" value={u.height_cm ? `${u.height_cm} cm` : null} />
                        <Field icon="ri-scales-3-line" label="Poids" value={u.weight_kg ? `${u.weight_kg} kg` : null} />
                      </Section>
                    )}

                    {devs.length > 0 && (
                      <Section title={`Appareils (${devs.length})`}>
                        {devs.map((dv: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' } as any}>
                            <i className={dv.device_type === 'bracelet' ? 'ri-heart-pulse-line' : 'ri-scales-3-line'} style={{ fontSize: 15, color: dv.connected ? '#10B981' : '#CBD5E1' }} />
                            <span style={{ flex: 1, fontSize: 13, color: '#334155' }}>{dv.name}</span>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>{dv.battery}%</span>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: dv.connected ? '#10B981' : '#CBD5E1' } as any} />
                          </div>
                        ))}
                      </Section>
                    )}

                    {guards.length > 0 && <Section title={`Gardiens (${guards.length})`}>{guards.map((g: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' } as any}><span style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, flex: 1 }}>{g.name}</span><span style={{ fontSize: 11, color: '#94A3B8' }}>{g.phone}</span></div>)}</Section>}
                    {bens.length > 0 && <Section title={`Beneficiaires (${bens.length})`}>{bens.map((b: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' } as any}><span style={{ fontSize: 13, color: '#1E293B', fontWeight: 600, flex: 1 }}>{b.name}</span><span style={{ fontSize: 11, color: '#94A3B8' }}>{b.phone}</span></div>)}</Section>}

                    {als.length > 0 && (
                      <Section title={`Alertes (${als.length})`}>
                        {als.slice(0, 5).map((a: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' } as any}>
                            <div style={{ width: 8, height: 8, borderRadius: 4, background: a.status === 'active' ? '#EF4444' : '#10B981' } as any} />
                            <span style={{ flex: 1, fontSize: 12, color: '#475569' }}>{a.type}</span>
                            <span className="adm-badge" style={{ background: a.status === 'active' ? '#FEF2F2' : '#F0FDF4', color: a.status === 'active' ? '#EF4444' : '#10B981', fontSize: 10 }}>{a.status}</span>
                          </div>
                        ))}
                      </Section>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 20 } as any}>
                      <div onClick={() => { setSel(null); setDetail(null); }} className="adm-btn" style={{ flex: 1, justifyContent: 'center', background: '#F8FAFC', border: '1.5px solid #E2E8F0', color: '#475569' }}>Fermer</div>
                      <div data-testid="user-delete-btn" onClick={() => { if (window.confirm(`Supprimer ${u.name} ?`)) apiFetch(`/api/admin/user/${u.id}`, { method: 'DELETE' }, token).then(() => { setSel(null); load(); }).catch((e: any) => alert(e.message)); }} className="adm-btn" style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#EF4444' }}>
                        <i className="ri-delete-bin-line" style={{ fontSize: 13 }} />Supprimer
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div style={{ marginBottom: 16 } as any}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #F1F5F9' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ icon, label, value, mono }: any) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' } as any}>
      <i className={icon} style={{ fontSize: 14, color: '#CBD5E1', width: 16, textAlign: 'center' }} />
      <span style={{ fontSize: 10, color: '#94A3B8', width: 70, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 10 : 13 } as any}>{String(value)}</span>
    </div>
  );
}
