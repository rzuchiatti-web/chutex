import React from 'react';
import { GI, INPUT_STYLE, RegisterForm, UpdateFn } from './RegisterUI';

export default function BeneficiaryInfoStep({ form, u }: { form: RegisterForm; u: UpdateFn }) {
  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Informations personnelles</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Pour personnaliser votre suivi sante</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        <GI label="Prenom" placeholder="Jean" value={form.firstName} onChange={(e: any) => u('firstName', e.target.value)} />
        <GI label="Nom" placeholder="Dupont" value={form.name} onChange={(e: any) => u('name', e.target.value)} />
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
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Sexe</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
        {[{ v: 'male', l: 'Homme', ic: 'ri-men-line' }, { v: 'female', l: 'Femme', ic: 'ri-women-line' }].map(g => (
          <div key={g.v} onClick={() => u('gender', g.v)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: form.gender === g.v ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.gender === g.v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center' } as any}>
            <i className={g.ic} style={{ fontSize: 22, color: form.gender === g.v ? '#FFF' : 'rgba(255,255,255,0.25)', display: 'block', marginBottom: 6 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: form.gender === g.v ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{g.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        <div style={{ marginBottom: 14 } as any}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Taille</div>
          <select value={form.height_cm} onChange={(e: any) => u('height_cm', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
            <option value="" style={{ background: '#0a0f1a' }}>Selectionner</option>
            {Array.from({ length: 61 }, (_, i) => 140 + i).map(h => <option key={h} value={String(h)} style={{ background: '#0a0f1a' }}>{h} cm</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 } as any}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Poids</div>
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
      <GI label="Pays" placeholder="France" value={form.country} onChange={(e: any) => u('country', e.target.value)} />
    </>
  );
}
