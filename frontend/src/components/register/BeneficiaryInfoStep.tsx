import React from 'react';
import { GI, INPUT_STYLE, RegisterForm, UpdateFn } from './RegisterUI';
import { CountryPicker } from '../GlassPickers';
import { useI18n } from '../../context/I18nContext';

export default function BeneficiaryInfoStep({ form, u }: { form: RegisterForm; u: UpdateFn }) {
  const { t } = useI18n();
  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>{t('step_info')}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{t('personal_info_sub')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        <GI label={t('first_name')} placeholder="Jean" value={form.firstName} onChange={(e: any) => u('firstName', e.target.value)} />
        <GI label={t('last_name')} placeholder="Dupont" value={form.name} onChange={(e: any) => u('name', e.target.value)} />
      </div>
      <div style={{ marginBottom: 14 } as any}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Date de naissance</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 8 } as any}>
          <select value={form.dob_day} onChange={(e: any) => u('dob_day', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
            <option value="" style={{ background: '#0a0f1a' }}>Jour</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)} style={{ background: '#0a0f1a' }}>{d}</option>)}
          </select>
          <select value={form.dob_month} onChange={(e: any) => u('dob_month', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
            <option value="" style={{ background: '#0a0f1a' }}>Mois</option>
            {['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'].map((m, i) => <option key={i} value={String(i + 1)} style={{ background: '#0a0f1a' }}>{m}</option>)}
          </select>
          <select value={form.dob_year} onChange={(e: any) => u('dob_year', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
            <option value="" style={{ background: '#0a0f1a' }}>Annee</option>
            {Array.from({ length: 100 }, (_, i) => 2026 - i).map(y => <option key={y} value={String(y)} style={{ background: '#0a0f1a' }}>{y}</option>)}
          </select>
        </div>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Sexe</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
        {[{ v: 'male', l: 'Homme', ic: 'ri-men-line' }, { v: 'female', l: 'Femme', ic: 'ri-women-line' }].map(g => (
          <div key={g.v} onClick={() => u('gender', g.v)} style={{ flex: 1, padding: '14px', borderRadius: 999, background: form.gender === g.v ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.2)', border: `1px solid ${form.gender === g.v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer', textAlign: 'center' } as any}>
            <i className={g.ic} style={{ fontSize: 22, color: form.gender === g.v ? '#FFF' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: form.gender === g.v ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{g.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        <div style={{ marginBottom: 14 } as any}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Taille</div>
          <select value={form.height_cm} onChange={(e: any) => u('height_cm', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
            <option value="" style={{ background: '#0a0f1a' }}>Selectionner</option>
            {Array.from({ length: 61 }, (_, i) => 140 + i).map(h => <option key={h} value={String(h)} style={{ background: '#0a0f1a' }}>{h} cm</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 } as any}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Poids</div>
          <select value={form.weight_kg} onChange={(e: any) => u('weight_kg', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
            <option value="" style={{ background: '#0a0f1a' }}>Selectionner</option>
            {Array.from({ length: 121 }, (_, i) => 30 + i).map(w => <option key={w} value={String(w)} style={{ background: '#0a0f1a' }}>{w} kg</option>)}
          </select>
        </div>
      </div>
      <GI label="Adresse" placeholder="12 rue de la Paix" value={form.address} onChange={(e: any) => u('address', e.target.value)} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        <GI label="Code postal" placeholder="75002" value={form.postal_code} onChange={(e: any) => u('postal_code', e.target.value)} />
        <GI label="Ville" placeholder="Paris" value={form.city} onChange={(e: any) => u('city', e.target.value)} />
      </div>
      <CountryPicker value={form.country} onChange={(c) => u('country', c)} />
    </>
  );
}
