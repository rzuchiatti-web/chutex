import { useI18n } from '../../context/I18nContext';
import React from 'react';
import { GI, INPUT_STYLE, RegisterForm, UpdateFn, CheckboxGrid, YesNoToggle } from './RegisterUI';

export default function MedicalStep({ form, u, toggleArr }: { form: RegisterForm; u: UpdateFn; toggleArr: (k: string, v: string) => void }) {
  const { t } = useI18n();
  const handleConditionToggle = (c: string) => {
    if (c === t('none_female')) u('medical_conditions', [t('none_female')]);
    else toggleArr('medical_conditions', c);
  };

  const handleAllergyToggle = (a: string) => {
    if (a === t('none_female')) u('allergies', [t('none_female')]);
    else toggleArr('allergies', a);
  };

  const GLASS = { borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 16px', marginBottom: 16 } as any;

  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Dossier medical</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Ces informations sont confidentielles et aident a personnalisér votre suivi</div>
      <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)', marginBottom: 16, marginTop: -16 }}>Tous les champs sont obligatoires. Sélectionnéz "Aucune" si non concerne.</div>

      <div style={GLASS}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Groupe sanguin</div>
        <select value={form.blood_type} onChange={(e: any) => u('blood_type', e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}>
          <option value="" style={{ background: '#0a0f1a' }}>Sélectionner</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Je ne sais pas'].map(bt => <option key={bt} value={bt} style={{ background: '#0a0f1a' }}>{bt}</option>)}
        </select>
      </div>

      <div style={GLASS}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Pathologies / Antecedents medicaux</div>
        <CheckboxGrid
          items={[t('condition_diabetes'), t('condition_hypertension'), t('condition_cholesterol'), t('condition_arthrose'), 'Insuffisance cardiaque', 'AVC', t('condition_asthma'), t('condition_osteoporosis'), t('condition_parkinson'), t('condition_alzheimer'), t('condition_depression'), t('condition_hemophilia'), t('condition_epilepsy'), t('none_female')]}
          selected={form.medical_conditions}
          onToggle={handleConditionToggle}
        />
        <GI label="Autre pathologie (optionnel)" placeholder="Precisez..." value={form.other_condition} onChange={(e: any) => u('other_condition', e.target.value)} />
      </div>

      <div style={GLASS}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Allergies</div>
        <CheckboxGrid
          items={[t('allergy_penicillin'), t('allergy_aspirin'), t('allergy_latex'), 'Arachides', t('allergy_gluten'), t('allergy_lactose'), t('allergy_iodine'), t('none_female')]}
          selected={form.allergies}
          onToggle={handleAllergyToggle}
        />
      </div>

      <div style={GLASS}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Questions medicales</div>
        <YesNoToggle label="Avez-vous déjà fait un AVC ?" value={form.had_avc} onChange={(v) => u('had_avc', v)} />
        <YesNoToggle label="Portez-vous un pacemaker ?" value={form.pacemaker} onChange={(v) => u('pacemaker', v)} />
        <YesNoToggle label="Avez-vous des stents ?" value={form.stents} onChange={(v) => u('stents', v)} />
        <YesNoToggle label="Avez-vous ete diagnostique d'un probleme de thyroide ?" value={form.thyroid} onChange={(v) => u('thyroid', v)} />
      </div>
    </>
  );
}
