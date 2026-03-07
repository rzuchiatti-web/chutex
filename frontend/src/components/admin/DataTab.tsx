import React from 'react';
import { Table, Badge, Pill, SH } from './AdminUI';
import { apiFetch } from '../../services/api';
import { useI18n } from '../../context/I18nContext';

export default function DataTab({ dataSub, setDataSub, subs, prescs, invites, rgpd, emails, token, load, mob }: any) {
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 } as any}>
        {([['subscriptions', 'Abonnements', subs.length], ['prescriptions', 'Prescriptions', prescs.length], ['saad', 'Invitations SAAD', invites.length], ['rgpd', 'RGPD', rgpd.length], ['emails', 'Emails', emails.length]] as any).map(([k, l, n]: any) => <Pill key={k} active={dataSub === k} onClick={() => setDataSub(k)} count={n}>{l}</Pill>)}
      </div>
      {dataSub === 'subscriptions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
            <SH>Abonnements ({subs.length})</SH>
            <div onClick={() => { const ph = prompt('Telephone beneficiaire'); if (ph) apiFetch('/api/admin/subscriptions', { method: 'POST', body: JSON.stringify({ beneficiary_phone: ph, subscription_type: 'care', source: 'admin' }) }, token).then(() => { alert('Cree'); load(); }).catch((e: any) => alert(e.message)); }} style={{ padding: '6px 14px', borderRadius: 6, background: '#059669', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#FFF' } as any}>+ Creer</div>
          </div>
          <Table mob={mob} headers={['Telephone', 'Type', 'Source', 'Statut', '']} rows={subs.map((s: any) => [s.beneficiary_phone, s.subscription_type, s.source, <Badge color={s.status === 'active' ? '#059669' : '#DC2626'}>{s.status}</Badge>, <div onClick={() => { if (window.confirm('Supprimer ?')) apiFetch(`/api/admin/subscriptions/${s.id}`, { method: 'DELETE' }, token).then(() => load()); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14, color: '#DC2626' }} /></div>])} />
        </>
      )}
      {dataSub === 'prescriptions' && <Table mob={mob} headers={['Beneficiaire', 'Prescripteur', 'Statut', 'Date']} rows={prescs.slice(0, 20).map((p: any) => [p.beneficiary_name || p.beneficiary_phone, p.guardian_name || 'Prescripteur', <Badge color={p.status === 'active' ? '#059669' : '#D97706'}>{p.status}</Badge>, p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''])} />}
      {dataSub === 'saad' && <Table mob={mob} headers={['Nom', 'Email', 'Structure', 'Statut', 'Date']} rows={invites.map((inv: any) => [inv.name || '--', inv.email, inv.structure_name, <Badge color={inv.status === 'pending' ? '#D97706' : '#059669'}>{inv.status}</Badge>, inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : ''])} />}
      {dataSub === 'rgpd' && <Table mob={mob} headers={['Utilisateur', 'Email', 'Droit', 'Message', 'Statut', 'Date']} rows={rgpd.map((r: any) => [r.user_name, <span style={{ fontSize: 10 }}>{r.user_email}</span>, r.right_label, <span style={{ fontSize: 10, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' } as any}>{r.message || '--'}</span>, <Badge color={r.status === 'pending' ? '#D97706' : '#059669'}>{r.status}</Badge>, r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''])} />}
      {dataSub === 'emails' && <Table mob={mob} headers={['Destinataire', 'Objet', 'Date']} rows={emails.slice(0, 20).map((e: any) => [e.to, <span style={{ fontSize: 11 }}>{e.subject?.substring(0, 45)}</span>, e.sent_at ? new Date(e.sent_at).toLocaleDateString('fr-FR') : ''])} />}
    </>
  );
}
