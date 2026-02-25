import React from 'react';
import { Card, Badge, ROLES, RCOL, InfoRow } from './AdminUI';
import { apiFetch } from '../../services/api';

export default function UserDetailModal({ sel, detail, detailLoad, token, load, onClose, mob }: any) {
  if (!sel) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', overflowY: 'auto', display: 'flex', justifyContent: 'center' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, margin: '32px auto', padding: mob ? 12 : 20, boxSizing: 'border-box' } as any}>
        <Card style={{ padding: mob ? 16 : 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Fiche utilisateur</span>
            <div data-testid="user-detail-close" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#6B7280' }} /></div>
          </div>
          {detailLoad ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Chargement...</div> : (() => {
            const u = detail?.user || sel;
            const guards = detail?.guardians || [];
            const bens = detail?.beneficiaries || [];
            const devs = detail?.devices || [];
            const als = detail?.alerts || [];
            const sub = detail?.subscription;
            const c = RCOL[u.role] || '#7C3AED';
            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #E5E7EB', marginBottom: 14 } as any}>
                  <div style={{ width: 48, height: 48, borderRadius: 999, background: `${c}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${c}30` } as any}><span style={{ fontSize: 20, fontWeight: 800, color: c }}>{u.name?.charAt(0)}</span></div>
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{u.name}</div><div style={{ display: 'flex', gap: 6, marginTop: 4 } as any}><Badge color={c}>{ROLES[u.role] || u.role}</Badge>{sub && <Badge color="#7C3AED">Abonne {sub.subscription_type}</Badge>}</div></div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>Identite</div>
                <InfoRow icon="ri-phone-line" label="Telephone" value={u.phone} />
                <InfoRow icon="ri-mail-line" label="Email" value={u.email} />
                <InfoRow icon="ri-map-pin-line" label="Adresse" value={u.address} />
                <InfoRow icon="ri-calendar-line" label="Naissance" value={u.date_of_birth} />
                <InfoRow icon="ri-user-line" label="Genre" value={u.gender} />
                <InfoRow icon="ri-id-card-line" label="ID" value={u.id} />
                <InfoRow icon="ri-time-line" label="Inscription" value={u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
                {u.role === 'beneficiary' && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Medical</div>
                    <InfoRow icon="ri-drop-line" label="Sang" value={u.blood_type} />
                    <InfoRow icon="ri-heart-pulse-line" label="Pathologies" value={u.medical_conditions} />
                    <InfoRow icon="ri-alert-line" label="Allergies" value={u.allergies} />
                    <InfoRow icon="ri-stethoscope-line" label="Medecin" value={u.doctor_name} />
                    <InfoRow icon="ri-ruler-line" label="Taille" value={u.height_cm ? `${u.height_cm} cm` : null} />
                    <InfoRow icon="ri-scales-3-line" label="Poids" value={u.weight_kg ? `${u.weight_kg} kg` : null} />
                    <InfoRow icon="ri-phone-line" label="Urgence" value={u.emergency_contact_name ? `${u.emergency_contact_name} (${u.emergency_contact_phone})` : null} />
                  </>
                )}
                {(u.role === 'guardian' || u.role === 'prescriber_company') && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>{u.role === 'guardian' ? 'Gardien' : 'SAAD'}</div>
                    <InfoRow icon="ri-shield-line" label="Type" value={u.guardian_type} />
                    <InfoRow icon="ri-heart-line" label="Lien" value={u.relationship} />
                    <InfoRow icon="ri-building-line" label="Structure" value={u.structure_name} />
                    <InfoRow icon="ri-barcode-line" label="SIRET" value={u.siret} />
                    <InfoRow icon="ri-key-line" label="Code" value={u.prescriber_code_used} />
                  </>
                )}
                {devs.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Appareils ({devs.length})</div>
                    {devs.map((dv: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><i className={dv.device_type === 'bracelet' ? 'ri-heart-pulse-line' : dv.device_type === 'scale' ? 'ri-scales-3-line' : 'ri-t-shirt-line'} style={{ fontSize: 14, color: dv.connected ? '#059669' : '#D1D5DB' }} /><span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{dv.name}</span><span style={{ fontSize: 10, color: '#9CA3AF' }}>{dv.battery}%</span></div>)}
                  </>
                )}
                {guards.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Gardiens ({guards.length})</div>
                    {guards.map((g: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><span style={{ fontSize: 12, color: '#111827', flex: 1, fontWeight: 600 }}>{g.name}</span><span style={{ fontSize: 10, color: '#9CA3AF' }}>{g.phone}</span></div>)}
                  </>
                )}
                {bens.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Beneficiaires ({bens.length})</div>
                    {bens.map((b: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}><span style={{ fontSize: 12, color: '#111827', flex: 1, fontWeight: 600 }}>{b.name}</span><span style={{ fontSize: 10, color: '#9CA3AF' }}>{b.phone}</span></div>)}
                  </>
                )}
                {als.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 14, marginBottom: 6 }}>Alertes ({als.length})</div>
                    {als.slice(0, 5).map((a: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' } as any}><div style={{ width: 6, height: 6, borderRadius: 3, background: a.status === 'active' ? '#DC2626' : '#059669' } as any} /><span style={{ fontSize: 11, color: '#374151', flex: 1 }}>{a.type}</span><span style={{ fontSize: 9, color: '#9CA3AF' }}>{a.status}</span></div>)}
                  </>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 } as any}>
                  <div onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#374151' } as any}>Fermer</div>
                  <div data-testid="user-delete-btn" onClick={() => { if (window.confirm(`Supprimer ${u.name} ?`)) apiFetch(`/api/admin/user/${u.id}`, { method: 'DELETE' }, token).then(() => { onClose(); load(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '10px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-delete-bin-line" style={{ fontSize: 12 }} />Supprimer</div>
                </div>
              </>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}
