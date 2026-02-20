import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

const INPUT_STYLE = { width: '100%', padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any;

function GI({ label, ...props }: any) {
  return (
    <div style={{ marginBottom: 14 } as any}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{label}</div>
      <input {...props} style={{ ...INPUT_STYLE, ...(props.style || {}) }} />
    </div>
  );
}

function Chip({ label, selected, onClick }: any) {
  return (
    <div onClick={onClick} style={{ padding: '10px 16px', borderRadius: 999, background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? '#FFF' : 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 8 } as any}>
      {selected && <i className="ri-check-line" style={{ fontSize: 14 }} />}{label}
    </div>
  );
}

function RadioCard({ icon, label, desc, selected, onClick }: any) {
  return (
    <div onClick={onClick} style={{ padding: '16px 18px', borderRadius: 18, background: selected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 } as any}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
        <i className={icon} style={{ fontSize: 20, color: selected ? '#FFF' : 'rgba(255,255,255,0.25)' }} />
      </div>
      <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{label}</div>{desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{desc}</div>}</div>
      {selected && <i className="ri-check-line" style={{ fontSize: 18, color: '#10B981' }} />}
    </div>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState('');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPrefix, setShowPrefix] = useState(false);
  const [form, setForm] = useState({
    phone: '', prefix: '+33', password: '', confirmPassword: '',
    name: '', firstName: '', date_of_birth: '', gender: '',
    height_cm: '', weight_kg: '', blood_type: '',
    allergies: [] as string[], medical_conditions: [] as string[],
    doctor_name: '', doctor_phone: '', social_security: '',
    devices: '',
    pro_type: '', structure: '',
    acceptTerms: false,
  });
  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k: string, v: string) => setForm(f => {
    const arr = (f as any)[k] as string[];
    return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] };
  });

  const BEN_STEPS = 4;
  const GUARD_STEPS = 3;
  const totalSteps = role === 'beneficiary' ? BEN_STEPS : GUARD_STEPS;

  const canNext = () => {
    if (step === 0) return !!role;
    if (step === 1) return form.phone.trim().length >= 6 && form.password.length >= 6 && form.password === form.confirmPassword;
    if (step === 2 && role === 'beneficiary') return form.name.trim() && form.firstName.trim() && form.gender;
    if (step === 2 && role === 'guardian') return form.name.trim() && form.firstName.trim() && form.pro_type;
    if (step === 3 && role === 'beneficiary') return true;
    if (step === 3 && role === 'guardian') return form.acceptTerms;
    if (step === 4 && role === 'beneficiary') return form.acceptTerms;
    return true;
  };

  const handleRegister = async () => {
    setSubmitting(true); setError('');
    try {
      let ph = form.phone.trim().replace(/\s/g, '');
      if (ph.startsWith('0') && ph.length >= 9) ph = form.prefix + ph.substring(1);
      else if (!ph.startsWith('+')) ph = form.prefix + ph;
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({
        email: ph, password: form.password,
        name: `${form.firstName} ${form.name}`.trim(), phone: ph,
        date_of_birth: form.date_of_birth, gender: form.gender,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        blood_type: form.blood_type, allergies: form.allergies.join(', '),
        medical_conditions: form.medical_conditions.join(', '),
        role: role,
      }) });
      await login(ph, form.password);
      router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Web uniquement</Text></View>;

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px 100px' } as any}>
        <div style={{ width: '100%', maxWidth: 400 } as any}>

          {/* Progress bar (hidden on role select) */}
          {step > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 } as any}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? '#FFF' : 'rgba(255,255,255,0.1)' } as any} />
              ))}
            </div>
          )}

          {/* Back + Step */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } as any}>
            <div onClick={() => { if (step > 1) setStep(step - 1); else if (step === 1) setStep(0); else router.back(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{step === 0 ? 'Connexion' : 'Retour'}</span>
            </div>
            {step > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Etape {step}/{totalSteps}</span>}
          </div>

          {error && <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16, fontSize: 13, color: '#F87171' } as any}>{error}</div>}

          {/* ═══ STEP 0: Role Selection ═══ */}
          {step === 0 && (<>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Bienvenue</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Choisissez votre espace pour commencer</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
              <div onClick={() => { setRole('beneficiary'); setStep(1); }} style={{ padding: '24px 20px', borderRadius: 22, background: role === 'beneficiary' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${role === 'beneficiary' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center' } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(239,68,68,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 } as any}>
                  <i className="ri-heart-pulse-line" style={{ fontSize: 28, color: '#EF4444' }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Je suis beneficiaire</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Je veux suivre ma sante au quotidien</div>
              </div>
              <div onClick={() => { setRole('guardian'); setStep(1); }} style={{ padding: '24px 20px', borderRadius: 22, background: role === 'guardian' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${role === 'guardian' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center' } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(56,189,248,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 } as any}>
                  <i className="ri-shield-user-line" style={{ fontSize: 28, color: '#38BDF8' }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Je suis gardien / professionnel</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Je surveille un proche ou un patient</div>
              </div>
            </div>
          </>)}

          {/* ═══ STEP 1: Email + Password (both roles) ═══ */}
          {step === 1 && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Creez votre compte</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Vos identifiants de connexion</div>
            <GI label="Adresse email" type="email" placeholder="votre@email.com" value={form.email} onChange={(e: any) => u('email', e.target.value)} />
            <GI label="Mot de passe" type="password" placeholder="Minimum 6 caracteres" value={form.password} onChange={(e: any) => u('password', e.target.value)} />
            <GI label="Confirmer le mot de passe" type="password" placeholder="Retapez votre mot de passe" value={form.confirmPassword} onChange={(e: any) => u('confirmPassword', e.target.value)} />
            {form.password && form.confirmPassword && form.password !== form.confirmPassword && <div style={{ fontSize: 12, color: '#F87171', marginTop: -8, marginBottom: 8 }}>Les mots de passe ne correspondent pas</div>}
          </>)}

          {/* ═══ BENEFICIARY STEP 2: Infos perso ═══ */}
          {step === 2 && role === 'beneficiary' && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Informations personnelles</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Pour personnaliser votre suivi sante</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
              <GI label="Prenom" placeholder="Jean" value={form.firstName} onChange={(e: any) => u('firstName', e.target.value)} />
              <GI label="Nom" placeholder="Dupont" value={form.name} onChange={(e: any) => u('name', e.target.value)} />
            </div>
            <GI label="Telephone" type="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={(e: any) => u('phone', e.target.value)} />
            <GI label="Date de naissance" type="date" value={form.date_of_birth} onChange={(e: any) => u('date_of_birth', e.target.value)} style={{ colorScheme: 'dark' }} />
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
              <GI label="Taille (cm)" type="number" placeholder="173" value={form.height_cm} onChange={(e: any) => u('height_cm', e.target.value)} />
              <GI label="Poids (kg)" type="number" placeholder="72" value={form.weight_kg} onChange={(e: any) => u('weight_kg', e.target.value)} />
            </div>
          </>)}

          {/* ═══ BENEFICIARY STEP 3: Medical ═══ */}
          {step === 3 && role === 'beneficiary' && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Dossier medical</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Ces informations sont confidentielles et aident a personnaliser votre suivi</div>

            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Groupe sanguin</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 } as any}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Je ne sais pas'].map(bt => (
                <Chip key={bt} label={bt} selected={form.blood_type === bt} onClick={() => u('blood_type', bt)} />
              ))}
            </div>

            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Pathologies / Antecedents</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 } as any}>
              {['Diabete', 'Hypertension', 'Cholesterol', 'Arthrose', 'Insuffisance cardiaque', 'AVC', 'Asthme', 'Osteoporose', 'Parkinson', 'Alzheimer', 'Depression', 'Aucune'].map(c => (
                <Chip key={c} label={c} selected={form.medical_conditions.includes(c)} onClick={() => { if (c === 'Aucune') u('medical_conditions', ['Aucune']); else toggleArr('medical_conditions', c); }} />
              ))}
            </div>

            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Allergies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 } as any}>
              {['Penicilline', 'Aspirine', 'Latex', 'Arachides', 'Gluten', 'Lactose', 'Iode', 'Aucune'].map(a => (
                <Chip key={a} label={a} selected={form.allergies.includes(a)} onClick={() => { if (a === 'Aucune') u('allergies', ['Aucune']); else toggleArr('allergies', a); }} />
              ))}
            </div>

            <GI label="Traitements en cours" placeholder="Ex: Doliprane, Metformine..." value={form.medications} onChange={(e: any) => u('medications', e.target.value)} />

            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10, marginTop: 8 }}>Contact d'urgence</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
              <GI label="Nom" placeholder="Marie Dupont" value={form.emergency_contact_name} onChange={(e: any) => u('emergency_contact_name', e.target.value)} />
              <GI label="Telephone" type="tel" placeholder="06 98 76 54 32" value={form.emergency_contact_phone} onChange={(e: any) => u('emergency_contact_phone', e.target.value)} />
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10, marginTop: 8 }}>Medecin traitant</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
              <GI label="Nom du medecin" placeholder="Dr. Martin" value={form.doctor_name} onChange={(e: any) => u('doctor_name', e.target.value)} />
              <GI label="Telephone" type="tel" placeholder="01 23 45 67 89" value={form.doctor_phone} onChange={(e: any) => u('doctor_phone', e.target.value)} />
            </div>

            <GI label="Numero de securite sociale (optionnel)" placeholder="1 85 12 75 123 456 78" value={form.social_security} onChange={(e: any) => u('social_security', e.target.value)} />
          </>)}

          {/* ═══ BENEFICIARY STEP 4: Devices + CGU ═══ */}
          {step === 4 && role === 'beneficiary' && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Vos appareils</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Quels appareils allez-vous utiliser ?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 } as any}>
              {[
                { v: 'bracelet', l: 'Bracelet Elio', d: 'Suivi cardiaque, sommeil, activite', ic: 'ri-pulse-line' },
                { v: 'balance', l: 'Balance Vita', d: 'Poids et composition corporelle', ic: 'ri-scales-3-line' },
                { v: 'both', l: 'Les deux', d: 'Suivi complet bracelet + balance', ic: 'ri-heart-pulse-line' },
                { v: 'later', l: 'Plus tard', d: 'Je configurerai mes appareils apres', ic: 'ri-time-line' },
              ].map(d => <RadioCard key={d.v} icon={d.ic} label={d.l} desc={d.d} selected={form.devices === d.v} onClick={() => u('devices', d.v)} />)}
            </div>
            <div onClick={() => u('acceptTerms', !form.acceptTerms)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: form.acceptTerms ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${form.acceptTerms ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
                {form.acceptTerms && <i className="ri-check-line" style={{ fontSize: 14, color: '#FFF' }} />}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>J'accepte les <span style={{ color: '#FFF', fontWeight: 600 }}>conditions d'utilisation</span> et la <span style={{ color: '#FFF', fontWeight: 600 }}>politique de confidentialite</span>.</div>
            </div>
          </>)}

          {/* ═══ GUARDIAN STEP 2: Infos perso + pro ═══ */}
          {step === 2 && role === 'guardian' && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Informations personnelles</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Votre profil de gardien ou professionnel</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
              <GI label="Prenom" placeholder="Claire" value={form.firstName} onChange={(e: any) => u('firstName', e.target.value)} />
              <GI label="Nom" placeholder="Martin" value={form.name} onChange={(e: any) => u('name', e.target.value)} />
            </div>
            <GI label="Telephone" type="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={(e: any) => u('phone', e.target.value)} />

            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10, marginTop: 8 }}>Votre profil</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 } as any}>
              {[
                { v: 'family', l: 'Membre de la famille', d: 'Conjoint, enfant, petit-enfant...', ic: 'ri-heart-line' },
                { v: 'aide_soignant', l: 'Aide-soignant(e)', d: 'Professionnel de soins', ic: 'ri-nurse-line' },
                { v: 'infirmier', l: 'Infirmier(e)', d: 'Infirmier(e) liberal(e) ou hospitalier(e)', ic: 'ri-stethoscope-line' },
                { v: 'auxiliaire', l: 'Auxiliaire de vie', d: 'Aide a domicile', ic: 'ri-hand-heart-line' },
                { v: 'medecin', l: 'Medecin', d: 'Medecin generaliste ou specialiste', ic: 'ri-heart-pulse-line' },
                { v: 'other', l: 'Autre professionnel', d: 'Coach, kine, ergotherapeute...', ic: 'ri-user-line' },
              ].map(p => <RadioCard key={p.v} icon={p.ic} label={p.l} desc={p.d} selected={form.pro_type === p.v} onClick={() => u('pro_type', p.v)} />)}
            </div>

            {form.pro_type && form.pro_type !== 'family' && (
              <GI label="Structure / Employeur" placeholder="Nom de l'etablissement ou SAAD" value={form.structure} onChange={(e: any) => u('structure', e.target.value)} />
            )}
          </>)}

          {/* ═══ GUARDIAN STEP 3: CGU ═══ */}
          {step === 3 && role === 'guardian' && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Finalisation</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Derniere etape avant de commencer</div>

            <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                <i className="ri-shield-check-line" style={{ fontSize: 18, color: '#10B981' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Espace Gardien</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>En tant que gardien, vous pourrez suivre la sante de vos beneficiaires, recevoir des alertes en temps reel et etre notifie en cas d'urgence.</div>
            </div>

            <div onClick={() => u('acceptTerms', !form.acceptTerms)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: form.acceptTerms ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${form.acceptTerms ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
                {form.acceptTerms && <i className="ri-check-line" style={{ fontSize: 14, color: '#FFF' }} />}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>J'accepte les <span style={{ color: '#FFF', fontWeight: 600 }}>conditions d'utilisation</span> et la <span style={{ color: '#FFF', fontWeight: 600 }}>politique de confidentialite</span>.</div>
            </div>
          </>)}

          {/* CTA */}
          {step > 0 && (
            <div style={{ marginTop: 24 } as any}>
              <div onClick={() => { if (!canNext()) return; setError(''); const isLast = (role === 'beneficiary' && step === BEN_STEPS) || (role === 'guardian' && step === GUARD_STEPS); if (isLast) handleRegister(); else setStep(step + 1); }} style={{ padding: '16px', borderRadius: 999, background: canNext() ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${canNext() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: canNext() ? 'pointer' : 'not-allowed', textAlign: 'center', fontSize: 15, fontWeight: 700, color: canNext() ? '#FFF' : 'rgba(255,255,255,0.2)', opacity: submitting ? 0.6 : 1 } as any}>
                {submitting ? 'Creation en cours...' : ((role === 'beneficiary' && step === BEN_STEPS) || (role === 'guardian' && step === GUARD_STEPS)) ? 'Creer mon compte' : 'Continuer'}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
