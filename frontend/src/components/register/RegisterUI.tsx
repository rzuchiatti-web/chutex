import React from 'react';

export const PREFIXES = [
  { code: '+33', flag: '\u{1F1EB}\u{1F1F7}', label: 'France' },
  { code: '+32', flag: '\u{1F1E7}\u{1F1EA}', label: 'Belgique' },
  { code: '+41', flag: '\u{1F1E8}\u{1F1ED}', label: 'Suisse' },
  { code: '+352', flag: '\u{1F1F1}\u{1F1FA}', label: 'Luxembourg' },
  { code: '+49', flag: '\u{1F1E9}\u{1F1EA}', label: 'Allemagne' },
  { code: '+39', flag: '\u{1F1EE}\u{1F1F9}', label: 'Italie' },
  { code: '+34', flag: '\u{1F1EA}\u{1F1F8}', label: 'Espagne' },
  { code: '+351', flag: '\u{1F1F5}\u{1F1F9}', label: 'Portugal' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', label: 'Royaume-Uni' },
  { code: '+353', flag: '\u{1F1EE}\u{1F1EA}', label: 'Irlande' },
  { code: '+31', flag: '\u{1F1F3}\u{1F1F1}', label: 'Pays-Bas' },
  { code: '+43', flag: '\u{1F1E6}\u{1F1F9}', label: 'Autriche' },
  { code: '+48', flag: '\u{1F1F5}\u{1F1F1}', label: 'Pologne' },
  { code: '+420', flag: '\u{1F1E8}\u{1F1FF}', label: 'Tchequie' },
  { code: '+421', flag: '\u{1F1F8}\u{1F1F0}', label: 'Slovaquie' },
  { code: '+36', flag: '\u{1F1ED}\u{1F1FA}', label: 'Hongrie' },
  { code: '+40', flag: '\u{1F1F7}\u{1F1F4}', label: 'Roumanie' },
  { code: '+359', flag: '\u{1F1E7}\u{1F1EC}', label: 'Bulgarie' },
  { code: '+385', flag: '\u{1F1ED}\u{1F1F7}', label: 'Croatie' },
  { code: '+386', flag: '\u{1F1F8}\u{1F1EE}', label: 'Slovenie' },
  { code: '+30', flag: '\u{1F1EC}\u{1F1F7}', label: 'Grece' },
  { code: '+45', flag: '\u{1F1E9}\u{1F1F0}', label: 'Danemark' },
  { code: '+46', flag: '\u{1F1F8}\u{1F1EA}', label: 'Suede' },
  { code: '+47', flag: '\u{1F1F3}\u{1F1F4}', label: 'Norvege' },
  { code: '+358', flag: '\u{1F1EB}\u{1F1EE}', label: 'Finlande' },
  { code: '+354', flag: '\u{1F1EE}\u{1F1F8}', label: 'Islande' },
  { code: '+372', flag: '\u{1F1EA}\u{1F1EA}', label: 'Estonie' },
  { code: '+371', flag: '\u{1F1F1}\u{1F1FB}', label: 'Lettonie' },
  { code: '+370', flag: '\u{1F1F1}\u{1F1F9}', label: 'Lituanie' },
  { code: '+356', flag: '\u{1F1F2}\u{1F1F9}', label: 'Malte' },
  { code: '+357', flag: '\u{1F1E8}\u{1F1FE}', label: 'Chypre' },
  { code: '+377', flag: '\u{1F1F2}\u{1F1E8}', label: 'Monaco' },
  { code: '+376', flag: '\u{1F1E6}\u{1F1E9}', label: 'Andorre' },
  { code: '+381', flag: '\u{1F1F7}\u{1F1F8}', label: 'Serbie' },
  { code: '+382', flag: '\u{1F1F2}\u{1F1EA}', label: 'Montenegro' },
  { code: '+355', flag: '\u{1F1E6}\u{1F1F1}', label: 'Albanie' },
  { code: '+389', flag: '\u{1F1F2}\u{1F1F0}', label: 'Macedoine du Nord' },
  { code: '+387', flag: '\u{1F1E7}\u{1F1E6}', label: 'Bosnie-Herzegovine' },
  { code: '+380', flag: '\u{1F1FA}\u{1F1E6}', label: 'Ukraine' },
  { code: '+373', flag: '\u{1F1F2}\u{1F1E9}', label: 'Moldavie' },
  { code: '+90', flag: '\u{1F1F9}\u{1F1F7}', label: 'Turquie' },
  { code: '+212', flag: '\u{1F1F2}\u{1F1E6}', label: 'Maroc' },
  { code: '+216', flag: '\u{1F1F9}\u{1F1F3}', label: 'Tunisie' },
  { code: '+213', flag: '\u{1F1E9}\u{1F1FF}', label: 'Algerie' },
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', label: 'USA / Canada' },
];

export const INPUT_STYLE = { width: '100%', padding: '13px 16px', borderRadius: 999, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any;

export interface RegisterForm {
  phone: string; prefix: string; password: string; confirmPassword: string;
  name: string; firstName: string; dob_day: string; dob_month: string; dob_year: string; gender: string; address: string; postal_code: string; city: string; country: string;
  height_cm: string; weight_kg: string; blood_type: string; thyroid: string;
  pacemaker: string; stents: string;
  allergies: string[]; medical_conditions: string[]; other_condition: string;
  doctor_name: string; doctor_phone: string; social_security: string;
  devices: string;
  had_surgery: string; surgeries: { zone: string; date: string }[];
  family_history: string[]; how_found: string;
  pro_type: string; structure: string; alert_sms: boolean; alert_email: boolean;
  acceptTerms: boolean;
  structure_name: string; siret: string; saad_address: string; saad_postal_code: string; saad_city: string; saad_country: string; saad_director_name: string; saad_director_phone: string; saad_email: string; invite_token: string;
}

export type UpdateFn = (k: string, v: any) => void;
export type ToggleArrFn = (k: string, v: string) => void;

export function GI({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: 14 } as any}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{label}</div>
      <input {...props} style={{ ...INPUT_STYLE, ...(props.style || {}) }} />
    </div>
  );
}

export function Chip({ label, selected, onClick }: any) {
  return (
    <div onClick={onClick} style={{ padding: '10px 16px', borderRadius: 999, background: selected ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)', border: `1px solid ${selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer', fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? '#FFF' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 8 } as any}>
      {selected && <i className="ri-check-line" style={{ fontSize: 14 }} />}{label}
    </div>
  );
}

export function YesNoToggle({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
        {[{ v: 'oui', l: 'Oui' }, { v: 'non', l: 'Non' }].map(t => (
          <div key={t.v} onClick={() => onChange(t.v)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: value === t.v ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${value === t.v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: value === t.v ? '#FFF' : 'rgba(255,255,255,0.35)' } as any}>{t.l}</div>
        ))}
      </div>
    </>
  );
}

export function CheckboxGrid({ items, selected, onToggle }: { items: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 } as any}>
      {items.map(c => (
        <div key={c} onClick={() => onToggle(c)} style={{ padding: '12px 14px', borderRadius: 14, background: selected.includes(c) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected.includes(c) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 } as any}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: selected.includes(c) ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${selected.includes(c) ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
            {selected.includes(c) && <i className="ri-check-line" style={{ fontSize: 12, color: '#FFF' }} />}
          </div>
          <span style={{ fontSize: 13, fontWeight: selected.includes(c) ? 700 : 500, color: selected.includes(c) ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{c}</span>
        </div>
      ))}
    </div>
  );
}

export function AcceptTerms({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: checked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${checked ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' } as any}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: checked ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${checked ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
        {checked && <i className="ri-check-line" style={{ fontSize: 14, color: '#FFF' }} />}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>J'accepte les <span style={{ color: '#FFF', fontWeight: 600 }}>conditions d'utilisation</span> et la <span style={{ color: '#FFF', fontWeight: 600 }}>politique de confidentialite</span>.</div>
    </div>
  );
}

export function HowFoundGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 8, marginTop: 8 }}>Comment avez-vous connu Chutex ?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 } as any}>
        {['Professionnel de sante', 'SAAD / Structure', 'Famille / Proche', 'Recherche internet', 'Reseaux sociaux', 'Autre'].map(h => (
          <div key={h} onClick={() => onChange(h)} style={{ padding: '12px 14px', borderRadius: 14, background: value === h ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${value === h ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: value === h ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${value === h ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              {value === h && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#FFF' } as any} />}
            </div>
            <span style={{ fontSize: 12, color: value === h ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{h}</span>
          </div>
        ))}
      </div>
    </>
  );
}
