import React from 'react';
import { GI, INPUT_STYLE, RegisterForm, UpdateFn, CheckboxGrid, YesNoToggle } from './RegisterUI';

export default function MedicalStep({ form, u, toggleArr }: { form: RegisterForm; u: UpdateFn; toggleArr: (k: string, v: string) => void }) {
  const handleConditionToggle = (c: string) => {
    if (c === 'Aucune') u('medical_conditions', ['Aucune']);
    else toggleArr('medical_conditions', c);
  };

  const handleAllergyToggle = (a: string) => {
    if (a === 'Aucune') u('allergies', ['Aucune']);
    else toggleArr('allergies', a);
  };

  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Dossier medical</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Ces informations sont confidentielles et aident a personnaliser votre suivi</div>
      <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.5)', marginBottom: 16, marginTop: -16 }}>Tous les champs sont obligatoires. Selectionnez "Aucune" si non concerne.</div>

      <div style={{ marginBottom: 18 } as any}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Groupe sanguin</div>
        <select value={form.blood_type} onChange={(e: any) => u('blood_type', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
          <option value="" style={{ background: '#0a0f1a' }}>Selectionner</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Je ne sais pas'].map(bt => <option key={bt} value={bt} style={{ background: '#0a0f1a' }}>{bt}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Pathologies / Antecedents medicaux</div>
      <CheckboxGrid
        items={['Diabete', 'Hypertension', 'Cholesterol', 'Arthrose', 'Insuffisance cardiaque', 'AVC', 'Asthme', 'Osteoporose', 'Parkinson', 'Alzheimer', 'Depression', 'Hemophilie', 'Epilepsie', 'Aucune']}
        selected={form.medical_conditions}
        onToggle={handleConditionToggle}
      />
      <GI label="Autre pathologie (optionnel)" placeholder="Precisez..." value={form.other_condition} onChange={(e: any) => u('other_condition', e.target.value)} />

      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Allergies</div>
      <CheckboxGrid
        items={['Penicilline', 'Aspirine', 'Latex', 'Arachides', 'Gluten', 'Lactose', 'Iode', 'Aucune']}
        selected={form.allergies}
        onToggle={handleAllergyToggle}
      />

      <YesNoToggle label="Portez-vous un pacemaker ?" value={form.pacemaker} onChange={(v) => u('pacemaker', v)} />
      <YesNoToggle label="Avez-vous des stents ?" value={form.stents} onChange={(v) => u('stents', v)} />
      <YesNoToggle label="Avez-vous ete diagnostique d'un probleme de thyroide ?" value={form.thyroid} onChange={(v) => u('thyroid', v)} />
    </>
  );
}
