import React from 'react';

const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function BeneficiaryCard({ ben }: { ben: any }) {
  const infoItems = [
    ben.phone && { icon: 'ri-phone-line', label: 'Telephone', value: ben.phone },
    ben.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: ben.address },
    ben.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: ben.blood_type },
    ben.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: ben.medical_conditions },
    ben.allergies && { icon: 'ri-alert-line', label: 'Allergies', value: ben.allergies },
    ben.emergency_contact_name && { icon: 'ri-phone-line', label: 'Contact urgence', value: `${ben.emergency_contact_name} (${ben.emergency_contact_phone})` },
  ].filter(Boolean);

  return (
    <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Beneficiaire</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#38BDF8' }}>{ben.name?.charAt(0)}</span></div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{ben.name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{ben.date_of_birth} - {ben.gender}</div>
        </div>
        {ben.phone && <a href={`tel:${ben.phone}`} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 18, color: '#10B981' }} /></a>}
      </div>
      {infoItems.map((item: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
          <i className={item.icon} style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }} />
          <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{item.label}</div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 500 }}>{item.value}</div></div>
        </div>
      ))}
    </div>
  );
}
