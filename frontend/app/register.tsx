import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', name: '', firstName: '',
    phone: '', date_of_birth: '', gender: '', height_cm: '', weight_kg: '',
    objectives: [] as string[], activity_level: '', conditions: [] as string[],
    devices: '', acceptTerms: false,
  });
  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k: string, v: string) => setForm(f => {
    const arr = (f as any)[k] as string[];
    return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] };
  });

  const STEPS = 4;
  const canNext = () => {
    if (step === 1) return form.email.includes('@') && form.password.length >= 6 && form.password === form.confirmPassword;
    if (step === 2) return form.name.trim() && form.firstName.trim() && form.gender;
    if (step === 3) return form.objectives.length > 0 && form.activity_level;
    return form.acceptTerms;
  };

  const handleRegister = async () => {
    setSubmitting(true); setError('');
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({
        email: form.email.trim().toLowerCase(), password: form.password,
        name: `${form.firstName} ${form.name}`.trim(), phone: form.phone,
        date_of_birth: form.date_of_birth, gender: form.gender,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        role: 'beneficiary',
      }) });
      await login(form.email.trim().toLowerCase(), form.password);
      router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Web uniquement</Text></View>;

  const GI = ({ label, ...props }: any) => (
    <div style={{ marginBottom: 14 } as any}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{label}</div>
      <input {...props} style={{ width: '100%', padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', ...(props.style || {}) } as any}
        onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; }}
        onBlur={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }} />
    </div>
  );

  const Chip = ({ label, selected, onClick }: any) => (
    <div onClick={onClick} style={{ padding: '10px 16px', borderRadius: 999, background: selected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 13, fontWeight: selected ? 700 : 500, color: selected ? '#FFF' : 'rgba(255,255,255,0.35)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 } as any}>
      {selected && <i className="ri-check-line" style={{ fontSize: 14 }} />}{label}
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px 100px' } as any}>
        <div style={{ width: '100%', maxWidth: 400 } as any}>

          {/* Progress */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 } as any}>
            {Array.from({ length: STEPS }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? '#FFF' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' } as any} />
            ))}
          </div>

          {/* Back + Step label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } as any}>
            <div onClick={() => step > 1 ? setStep(step - 1) : router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{step > 1 ? 'Retour' : 'Connexion'}</span>
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Etape {step}/{STEPS}</span>
          </div>

          {error && <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16, fontSize: 13, color: '#F87171' } as any}>{error}</div>}

          {/* ═══ STEP 1: Compte ═══ */}
          {step === 1 && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Creez votre compte</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Vos identifiants de connexion securises</div>
            <GI label="Adresse email" type="email" placeholder="votre@email.com" value={form.email} onChange={(e: any) => u('email', e.target.value)} />
            <GI label="Mot de passe" type="password" placeholder="Minimum 6 caracteres" value={form.password} onChange={(e: any) => u('password', e.target.value)} />
            <GI label="Confirmer le mot de passe" type="password" placeholder="Retapez votre mot de passe" value={form.confirmPassword} onChange={(e: any) => u('confirmPassword', e.target.value)} />
            {form.password && form.confirmPassword && form.password !== form.confirmPassword && <div style={{ fontSize: 12, color: '#F87171', marginTop: -8, marginBottom: 8 }}>Les mots de passe ne correspondent pas</div>}
          </>)}

          {/* ═══ STEP 2: Infos perso ═══ */}
          {step === 2 && (<>
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

          {/* ═══ STEP 3: Profil sante ═══ */}
          {step === 3 && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Votre profil sante</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Aidez-nous a personnaliser vos recommandations</div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Vos objectifs</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 } as any}>
              {['Perdre du poids', 'Gagner en muscle', 'Ameliorer le sommeil', 'Reduire le stress', 'Suivi general', 'Prevenir les chutes', 'Ameliorer l\'endurance'].map(o => (
                <Chip key={o} label={o} selected={form.objectives.includes(o)} onClick={() => toggleArr('objectives', o)} />
              ))}
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Niveau d'activite</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 } as any}>
              {[
                { v: 'sedentary', l: 'Sedentaire', d: 'Peu ou pas d\'activite physique' },
                { v: 'light', l: 'Legerement actif', d: '1-2 jours d\'exercice par semaine' },
                { v: 'active', l: 'Actif', d: '3-5 jours d\'exercice par semaine' },
                { v: 'very_active', l: 'Tres actif', d: 'Exercice quotidien ou travail physique' },
              ].map(a => (
                <div key={a.v} onClick={() => u('activity_level', a.v)} style={{ padding: '14px 16px', borderRadius: 14, background: form.activity_level === a.v ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.activity_level === a.v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                  <div><div style={{ fontSize: 14, fontWeight: 700, color: form.activity_level === a.v ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{a.l}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{a.d}</div></div>
                  {form.activity_level === a.v && <i className="ri-check-line" style={{ fontSize: 18, color: '#10B981' }} />}
                </div>
              ))}
            </div>

            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Pathologies connues</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 } as any}>
              {['Diabete', 'Hypertension', 'Cholesterol', 'Arthrose', 'Insuffisance cardiaque', 'Aucune'].map(c => (
                <Chip key={c} label={c} selected={form.conditions.includes(c)} onClick={() => { if (c === 'Aucune') u('conditions', ['Aucune']); else toggleArr('conditions', c); }} />
              ))}
            </div>
          </>)}

          {/* ═══ STEP 4: Appareils + CGU ═══ */}
          {step === 4 && (<>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Vos appareils</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>Quels appareils allez-vous utiliser ?</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 } as any}>
              {[
                { v: 'bracelet', l: 'Bracelet Elio', d: 'Suivi cardiaque, sommeil, activite', ic: 'ri-pulse-line' },
                { v: 'balance', l: 'Balance Vita', d: 'Poids et composition corporelle', ic: 'ri-scales-3-line' },
                { v: 'both', l: 'Les deux', d: 'Suivi complet bracelet + balance', ic: 'ri-heart-pulse-line' },
                { v: 'later', l: 'Plus tard', d: 'Je configurerai mes appareils apres', ic: 'ri-time-line' },
              ].map(d => (
                <div key={d.v} onClick={() => u('devices', d.v)} style={{ padding: '16px 18px', borderRadius: 18, background: form.devices === d.v ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.devices === d.v ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 } as any}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: form.devices === d.v ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={d.ic} style={{ fontSize: 20, color: form.devices === d.v ? '#FFF' : 'rgba(255,255,255,0.25)' }} />
                  </div>
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: form.devices === d.v ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{d.l}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{d.d}</div></div>
                  {form.devices === d.v && <i className="ri-check-line" style={{ fontSize: 18, color: '#10B981' }} />}
                </div>
              ))}
            </div>

            {/* CGU */}
            <div onClick={() => u('acceptTerms', !form.acceptTerms)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: form.acceptTerms ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${form.acceptTerms ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
                {form.acceptTerms && <i className="ri-check-line" style={{ fontSize: 14, color: '#FFF' }} />}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>J'accepte les <span style={{ color: '#FFF', fontWeight: 600 }}>conditions d'utilisation</span> et la <span style={{ color: '#FFF', fontWeight: 600 }}>politique de confidentialite</span>. Mes donnees de sante seront traitees de maniere securisee.</div>
            </div>
          </>)}

          {/* CTA */}
          <div style={{ marginTop: 24 } as any}>
            <div onClick={() => { if (!canNext()) return; if (step < STEPS) setStep(step + 1); else handleRegister(); }} style={{ padding: '16px', borderRadius: 999, background: canNext() ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${canNext() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: canNext() ? 'pointer' : 'not-allowed', textAlign: 'center', fontSize: 15, fontWeight: 700, color: canNext() ? '#FFF' : 'rgba(255,255,255,0.2)', opacity: submitting ? 0.6 : 1 } as any}>
              {submitting ? 'Creation en cours...' : step < STEPS ? 'Continuer' : 'Creer mon compte'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
