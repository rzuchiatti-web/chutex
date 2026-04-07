import React from 'react';
import { GI, RegisterForm, UpdateFn, AcceptTerms, HowFoundGrid } from './RegisterUI';
import { CountryPicker } from '../GlassPickers';

export default function GuardianInfoStep({ form, u }: { form: RegisterForm; u: UpdateFn }) {
  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Vos informations</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Pour personnalisér votre espace gardien</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        <GI label="Prenom" placeholder="Claire" value={form.firstName} onChange={(e: any) => u('firstName', e.target.value)} />
        <GI label="Nom" placeholder="Martin" value={form.name} onChange={(e: any) => u('name', e.target.value)} />
      </div>
      <GI label="Adresse" placeholder="12 rue de la Paix" value={form.address} onChange={(e: any) => u('address', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        <GI label="Code postal" placeholder="75002" value={form.postal_code} onChange={(e: any) => u('postal_code', e.target.value)} />
        <GI label="Ville" placeholder="Paris" value={form.city} onChange={(e: any) => u('city', e.target.value)} />
      </div>
      <CountryPicker value={form.country} onChange={(c) => u('country', c)} />

      <HowFoundGrid value={form.how_found} onChange={(v) => u('how_found', v)} />

      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 10 }}>Recevoir les alertes par :</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 } as any}>
        {[
          { key: 'alert_sms', label: 'SMS', desc: 'Recevez un SMS pour chaque alerte critique' },
          { key: 'alert_email', label: t('email_label'), desc: 'Recevez un email pour les rapports et alertes' },
        ].map(opt => (
          <div key={opt.key} onClick={() => u(opt.key, !(form as any)[opt.key])} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: (form as any)[opt.key] ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(form as any)[opt.key] ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' } as any}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: (form as any)[opt.key] ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${(form as any)[opt.key] ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              {(form as any)[opt.key] && <i className="ri-check-line" style={{ fontSize: 14, color: '#FFF' }} />}
            </div>
            <div><div style={{ fontSize: 14, fontWeight: 600, color: (form as any)[opt.key] ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{opt.label}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{opt.desc}</div></div>
          </div>
        ))}
      </div>

      <AcceptTerms checked={form.acceptTerms} onToggle={() => u('acceptTerms', !form.acceptTerms)} />
    </>
  );
}
