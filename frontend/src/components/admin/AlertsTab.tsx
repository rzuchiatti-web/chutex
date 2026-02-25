import React from 'react';
import { Table, Badge } from './AdminUI';

export default function AlertsTab({ alerts, active, ivs, mob }: any) {
  return (
    <>
      {active.length > 0 && (
        <div style={{ marginBottom: 16 } as any}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>Alertes actives ({active.length})</div>
          <Table mob={mob} headers={['Beneficiaire', 'Type', 'Message', 'Date', 'Statut']} rows={active.map((a: any) => [<span style={{ fontWeight: 600 }}>{a.beneficiary_name}</span>, a.type, <span style={{ fontSize: 11 }}>{a.message?.substring(0, 40)}</span>, a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '', <Badge color="#DC2626">Active</Badge>])} />
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Historique ({alerts.length})</div>
      <Table mob={mob} headers={['Beneficiaire', 'Type', 'Date', 'Statut']} rows={alerts.slice(0, 20).map((a: any) => [a.beneficiary_name, a.type, a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '', <Badge color={a.status === 'active' ? '#DC2626' : '#059669'}>{a.status}</Badge>])} />
      <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginTop: 16, marginBottom: 8 }}>Interventions ({ivs.length})</div>
      <Table mob={mob} headers={['Intervenant', 'Beneficiaire', 'Statut']} rows={ivs.slice(0, 15).map((iv: any) => [iv.intervenant_name || 'Intervenant', iv.beneficiary_name || '--', <Badge color="#D97706">{iv.status}</Badge>])} />
    </>
  );
}
