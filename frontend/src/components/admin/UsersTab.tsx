import React from 'react';
import { Table, Badge, Pill, ROLES, RCOL } from './AdminUI';

export default function UsersTab({ users, filtered, search, setSearch, roleFilter, setRoleFilter, openUser, mob }: any) {
  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: mob ? 'wrap' : 'nowrap' } as any}>
        <input data-testid="admin-user-search" value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." style={{ flex: 1, minWidth: 180, padding: '10px 14px', borderRadius: 8, background: '#FFF', border: '1px solid #E5E7EB', color: '#111827', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any} />
        <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' } as any}>{filtered.length} resultat(s)</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', paddingBottom: 2 } as any}>
        <Pill active={roleFilter === 'all'} onClick={() => setRoleFilter('all')} count={users.length}>Tous</Pill>
        {Object.entries(ROLES).map(([k, l]: any) => <Pill key={k} active={roleFilter === k} onClick={() => setRoleFilter(k)} count={users.filter((u: any) => u.role === k).length}>{l}</Pill>)}
      </div>
      <Table mob={mob} headers={['', 'Nom', 'Telephone', 'Email', 'Role', '']} rows={filtered.map((u: any) => [
        <div style={{ width: 30, height: 30, borderRadius: 999, background: `${RCOL[u.role] || '#6B7280'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 11, fontWeight: 700, color: RCOL[u.role] }}>{u.name?.charAt(0)}</span></div>,
        <span style={{ fontWeight: 600, color: '#111827' }}>{u.name}</span>,
        <span style={{ color: '#6B7280' }}>{u.phone}</span>,
        <span style={{ color: '#9CA3AF', fontSize: 11 }}>{u.email || '--'}</span>,
        <Badge color={RCOL[u.role]}>{ROLES[u.role] || u.role}</Badge>,
        <div data-testid={`user-view-${u.id}`} onClick={() => openUser(u)} style={{ padding: '5px 12px', borderRadius: 6, background: '#F3F4F6', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#374151' } as any}>Voir</div>,
      ])} />
    </>
  );
}
