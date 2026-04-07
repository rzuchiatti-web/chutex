import React from 'react';

export const ROLES: any = { beneficiary: 'Bénéficiaire', guardian: 'Gardien', admin: 'Admin', téléassistance: 'Téléassistance', prescriber_company: 'SAAD' };
export const RCOL: any = { beneficiary: '#2563EB', guardian: '#059669', admin: '#7C3AED', téléassistance: '#D97706', prescriber_company: '#EA580C' };

export function Card({ children, ...props }: any) {
  return <div {...props} style={{ background: '#FFF', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16, ...props.style }}>{children}</div>;
}

export function Badge({ color, children }: any) {
  return <span style={{ fontSize: 10, fontWeight: 600, color, padding: '2px 8px', borderRadius: 999, background: `${color}12`, border: `1px solid ${color}25` }}>{children}</span>;
}

export function Pill({ active: a, onClick, children, count }: any) {
  return <div onClick={onClick} style={{ padding: '6px 14px', borderRadius: 8, background: a ? '#7C3AED' : '#F9FAFB', border: `1px solid ${a ? '#7C3AED' : '#E5E7EB'}`, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: a ? '#FFF' : '#6B7280', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.15s' } as any}>{children}{count != null && <span style={{ fontSize: 9, opacity: 0.7 }}>({count})</span>}</div>;
}

export function SH({ children }: any) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.3, marginBottom: 12 }}>{children}</div>;
}

export function Table({ headers, rows, mob }: { headers: string[]; rows: any[][]; mob?: boolean }) {
  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #E5E7EB', borderRadius: 10, background: '#FFF' } as any}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: mob ? 11 : 12, minWidth: mob ? 480 : 'auto' } as any}>
        <thead><tr style={{ background: '#F9FAFB' } as any}>{headers.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' } as any}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, ri) => <tr key={ri} style={{ borderBottom: '1px solid #F3F4F6' } as any}>{row.map((cell, ci) => <td key={ci} style={{ padding: '10px 12px', color: '#1F2937', verticalAlign: 'middle' } as any}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function InfoRow({ icon, label, value }: any) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #F3F4F6' } as any}>
      <i className={icon} style={{ fontSize: 14, color: '#9CA3AF' }} />
      <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div><div style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>{String(value)}</div></div>
    </div>
  );
}
