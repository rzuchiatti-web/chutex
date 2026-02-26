import React from 'react';
import { GI, INPUT_STYLE, Chip, RegisterForm, UpdateFn, AcceptTerms, HowFoundGrid } from './RegisterUI';

export default function AntecedentsStep({ form, u, toggleArr }: { form: RegisterForm; u: UpdateFn; toggleArr: (k: string, v: string) => void }) {
  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Antecedents</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Informations complementaires pour votre suivi</div>
      <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.5)', marginBottom: 16, marginTop: -16 }}>Tous les champs sont obligatoires. Repondez a chaque question.</div>

      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Avez-vous deja ete opere ?</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
        {[{ v: 'oui', l: 'Oui' }, { v: 'non', l: 'Non' }].map(t => (
          <div key={t.v} onClick={() => { u('had_surgery', t.v); if (t.v === 'oui' && form.surgeries.length === 0) u('surgeries', [{ zone: '', date: '' }]); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: form.had_surgery === t.v ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.2)', border: `1px solid ${form.had_surgery === t.v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: form.had_surgery === t.v ? '#FFF' : 'rgba(255,255,255,0.5)' } as any}>{t.l}</div>
        ))}
      </div>
      {form.had_surgery === 'oui' && (
        <>
          {form.surgeries.map((s: any, idx: number) => (
            <div key={idx} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Operation {idx + 1}</span>
                {form.surgeries.length > 1 && <div onClick={() => u('surgeries', form.surgeries.filter((_: any, i: number) => i !== idx))} style={{ cursor: 'pointer', fontSize: 11, color: '#EF4444', fontWeight: 700 } as any}>Supprimer</div>}
              </div>
              <GI label="Zone operee" placeholder="Ex: Genou droit, hanche, coeur..." value={s.zone} onChange={(e: any) => { const arr = [...form.surgeries]; arr[idx] = { ...arr[idx], zone: e.target.value }; u('surgeries', arr); }} />
              <div style={{ marginBottom: 14 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Date approximative</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 8 } as any}>
                  <select value={s.date?.split('-')?.[1] || ''} onChange={(e: any) => { const arr = [...form.surgeries]; arr[idx] = { ...arr[idx], date: `${s.date?.split('-')?.[0] || '2024'}-${e.target.value}` }; u('surgeries', arr); }} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
                    <option value="" style={{ background: '#0a0f1a' }}>Mois</option>
                    {['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'].map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')} style={{ background: '#0a0f1a' }}>{m}</option>)}
                  </select>
                  <select value={s.date?.split('-')?.[0] || ''} onChange={(e: any) => { const arr = [...form.surgeries]; arr[idx] = { ...arr[idx], date: `${e.target.value}-${s.date?.split('-')?.[1] || '01'}` }; u('surgeries', arr); }} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
                    <option value="" style={{ background: '#0a0f1a' }}>Annee</option>
                    {Array.from({ length: 50 }, (_, i) => 2026 - i).map(y => <option key={y} value={String(y)} style={{ background: '#0a0f1a' }}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
          <div onClick={() => u('surgeries', [...form.surgeries, { zone: '', date: '' }])} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 } as any}>
            <i className="ri-add-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Ajouter une operation</span>
          </div>
        </>
      )}

      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10, marginTop: 16 }}>Antecedents familiaux</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Des membres de votre famille ont-ils ete touches par :</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>
        {['Diabete', 'Hypertension', 'Maladie cardiaque', 'AVC', 'Cancer', 'Alzheimer', 'Parkinson', 'Osteoporose', 'Thyroide', 'Aucun'].map(f => (
          <Chip key={f} label={f} selected={form.family_history.includes(f)} onClick={() => { if (f === 'Aucun') u('family_history', ['Aucun']); else toggleArr('family_history', f); }} />
        ))}
      </div>

      <HowFoundGrid value={form.how_found} onChange={(v) => u('how_found', v)} />

      <AcceptTerms checked={form.acceptTerms} onToggle={() => u('acceptTerms', !form.acceptTerms)} />
    </>
  );
}
