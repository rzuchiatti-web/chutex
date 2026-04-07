import React, { useState } from 'react';
import { apiFetch } from '../../services/api';

export default function AdminSubscriptions({ subs, prescs, invites, rgpd, emails, token, load, mob }: any) {
  const [tab, setTab] = useState<'subs' | 'prescs' | 'saad' | 'rgpd' | 'emails'>('subs');

  const tabs = [
    { key: 'subs', label: 'Abonnements', count: subs.length, icon: 'ri-vip-crown-line' },
    { key: 'prescs', label: 'Prescriptions', count: prescs.length, icon: 'ri-file-list-3-line' },
    { key: 'saad', label: 'SAAD', count: invites.length, icon: 'ri-building-line' },
    { key: 'rgpd', label: 'RGPD', count: rgpd.length, icon: 'ri-shield-line' },
    { key: 'emails', label: 'Emails', count: emails.length, icon: 'ri-mail-line' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as any}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key as any)} style={{
            padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: tab === t.key ? '#7C3AED' : '#FFF', color: tab === t.key ? '#FFF' : '#64748B',
            border: `1.5px solid ${tab === t.key ? '#7C3AED' : '#E2E8F0'}`, transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          } as any}>
            <i className={t.icon} style={{ fontSize: 14 }} />{t.label} <span style={{ opacity: 0.7, fontSize: 10 }}>({t.count})</span>
          </div>
        ))}
      </div>

      {/* Subscriptions */}
      {tab === 'subs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Abonnements ({subs.length})</span>
            <div onClick={() => { const ph = prompt('Telephone bénéficiaire'); if (ph) apiFetch('/api/admin/subscriptions', { method: 'POST', body: JSON.stringify({ beneficiary_phone: ph, subscription_type: 'care', source: 'admin' }) }, token).then(() => { alert('Cree'); load(); }).catch((e: any) => alert(e.message)); }} className="adm-btn" style={{ background: '#7C3AED', color: '#FFF' }}>
              <i className="ri-add-line" style={{ fontSize: 14 }} />Créer
            </div>
          </div>
          <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' } as any}>
              <table className="adm-table" style={{ minWidth: mob ? 500 : 'auto' } as any}>
                <thead><tr><th>Telephone</th><th>Type</th><th>Source</th><th>Statut</th><th></th></tr></thead>
                <tbody>
                  {subs.map((s: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{s.beneficiary_phone}</td>
                      <td><span className="adm-badge" style={{ background: '#F5F3FF', color: '#7C3AED' }}>{s.subscription_type}</span></td>
                      <td style={{ color: '#64748B' }}>{s.source}</td>
                      <td><span className="adm-badge" style={{ background: s.status === 'active' ? '#F0FDF4' : '#FEF2F2', color: s.status === 'active' ? '#10B981' : '#EF4444' }}>{s.status}</span></td>
                      <td><i onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/subscriptions/${s.id}`, { method: 'DELETE' }, token).then(() => load()); }} className="ri-delete-bin-line" style={{ fontSize: 15, color: '#EF4444', cursor: 'pointer' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Prescriptions */}
      {tab === 'prescs' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 500 : 'auto' } as any}>
              <thead><tr><th>Bénéficiaire</th><th>Prescripteur</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {prescs.slice(0, 30).map((p: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.beneficiary_name || p.beneficiary_phone}</td>
                    <td style={{ color: '#64748B' }}>{p.guardian_name || 'Prescripteur'}</td>
                    <td><span className="adm-badge" style={{ background: p.status === 'active' || p.status === 'subscribed' ? '#F0FDF4' : '#FFFBEB', color: p.status === 'active' || p.status === 'subscribed' ? '#10B981' : '#F59E0B' }}>{p.status}</span></td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SAAD */}
      {tab === 'saad' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 500 : 'auto' } as any}>
              <thead><tr><th>Nom</th><th>Email</th><th>Structure</th><th>Statut</th><th>Date</th></tr></thead>
              <tbody>
                {invites.map((inv: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{inv.name || '--'}</td>
                    <td style={{ color: '#64748B' }}>{inv.email}</td>
                    <td>{inv.structure_name}</td>
                    <td><span className="adm-badge" style={{ background: inv.status === 'pending' ? '#FFFBEB' : '#F0FDF4', color: inv.status === 'pending' ? '#F59E0B' : '#10B981' }}>{inv.status}</span></td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>{inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RGPD */}
      {tab === 'rgpd' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 600 : 'auto' } as any}>
              <thead><tr><th>Utilisateur</th><th>Email</th><th>Droit</th><th>Message</th><th>Statut</th></tr></thead>
              <tbody>
                {rgpd.map((r: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{r.user_name}</td>
                    <td style={{ fontSize: 11, color: '#64748B' }}>{r.user_email}</td>
                    <td>{r.right_label}</td>
                    <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{r.message || '--'}</td>
                    <td><span className="adm-badge" style={{ background: r.status === 'pending' ? '#FFFBEB' : '#F0FDF4', color: r.status === 'pending' ? '#F59E0B' : '#10B981' }}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emails */}
      {tab === 'emails' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' } as any}>
            <table className="adm-table" style={{ minWidth: mob ? 500 : 'auto' } as any}>
              <thead><tr><th>Destinataire</th><th>Objet</th><th>Date</th></tr></thead>
              <tbody>
                {emails.slice(0, 30).map((e: any, i: number) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{e.to}</td>
                    <td style={{ color: '#64748B' }}>{e.subject}</td>
                    <td style={{ fontSize: 12, color: '#94A3B8' }}>{e.sent_at ? new Date(e.sent_at).toLocaleDateString('fr-FR') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
