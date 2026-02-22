import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ProgramDetailScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [program, setProgram] = useState<any>(null);
  const [step, setStep] = useState(0); // 0=presentation, 1=config, 2=ready
  const [mode, setMode] = useState('solo');
  const [onboarding, setOnboarding] = useState<any>({});
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) apiFetch(`/api/programs/detail/${id}`, {}, token).then(setProgram).catch(() => {});
  }, [id]);

  if (Platform.OS !== 'web' || !program) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f1a' }}><Text style={{ color: '#FFF' }}>Chargement...</Text></View>;

  const clr = program.color || '#A78BFA';
  const hasOnboarding = (program.onboarding_fields || []).length > 0;

  const startProgram = async () => {
    setStarting(true); setError('');
    try {
      await apiFetch(`/api/programs/start/${id}`, { method: 'POST', body: JSON.stringify({ mode, onboarding }) }, token);
      router.replace('/(tabs)/health' as any);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", background: '#0a0f1a', overflowY: 'auto' } as any}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 20px 100px' } as any}>
        {/* Back */}
        <div onClick={() => step > 0 ? setStep(step - 1) : router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 20 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
        </div>

        {/* STEP 0: Presentation */}
        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: `${clr}15`, border: `1px solid ${clr}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
                <i className={program.icon} style={{ fontSize: 34, color: clr }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>{program.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{program.subtitle}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 14 } as any}>
                <div style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' } as any}>{program.duration_days} jours</div>
                <div style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' } as any}>{program.effort || '15 min/jour'}</div>
              </div>
            </div>
            {/* Description */}
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 24, textAlign: 'center' } as any}>{program.description}</div>
            {/* Benefits */}
            <div style={{ marginBottom: 24 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Benefices</div>
              {(program.benefits || []).map((b: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${clr}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-check-line" style={{ fontSize: 14, color: clr }} /></div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{b}</span>
                </div>
              ))}
            </div>
            {/* Data used */}
            {(program.data_used || []).length > 0 && (
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Donnees utilisees</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>
                  {program.data_used.map((d: string, i: number) => (
                    <div key={i} style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.5)' } as any}>{d}</div>
                  ))}
                </div>
              </div>
            )}
            {/* Phases */}
            <div style={{ marginBottom: 24 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>3 phases</div>
              {(program.phases || []).map((ph: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ph.color || clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: ph.color || clr } as any}>{i + 1}</div>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ph.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>J{ph.days[0]}-{ph.days[1]} · {ph.description}</div></div>
                </div>
              ))}
            </div>
            {/* Disclaimer */}
            {program.medical_disclaimer && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 24 } as any}><i className="ri-stethoscope-line" style={{ marginRight: 6, color: '#F59E0B' }} />{program.medical_disclaimer}</div>}
            {/* CTA */}
            <div onClick={() => setStep(hasOnboarding ? 1 : 2)} style={{ padding: '16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}30, ${clr}15)`, border: `1px solid ${clr}35`, fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 10 } as any}>Commencer le programme</div>
            <div onClick={() => { setMode('duo'); setStep(hasOnboarding ? 1 : 2); }} style={{ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' } as any}><i className="ri-team-line" style={{ marginRight: 6 }} />Le faire avec un ami</div>
          </>
        )}

        {/* STEP 1: Configuration/Onboarding */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Configuration</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Personnalise ton programme</div>
            </div>
            {/* Mode */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>Mode</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 } as any}>
              {['solo', 'duo', 'groupe'].map(m => (
                <div key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '12px', borderRadius: 14, background: mode === m ? `${clr}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${mode === m ? `${clr}30` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center' } as any}>
                  <i className={m === 'solo' ? 'ri-user-line' : m === 'duo' ? 'ri-group-line' : 'ri-team-line'} style={{ fontSize: 20, color: mode === m ? clr : 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }} />
                  <div style={{ fontSize: 12, fontWeight: mode === m ? 700 : 500, color: mode === m ? '#FFF' : 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{m}</div>
                </div>
              ))}
            </div>
            {/* Onboarding fields */}
            {(program.onboarding_fields || []).map((f: any) => (
              <div key={f.key} style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{f.label}</div>
                {f.type === 'time' && <input type="time" value={onboarding[f.key] || ''} onChange={(e: any) => setOnboarding({ ...onboarding, [f.key]: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} />}
                {f.type === 'choice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                    {(f.options || []).map((o: string) => (
                      <div key={o} onClick={() => setOnboarding({ ...onboarding, [f.key]: o })} style={{ padding: '12px 14px', borderRadius: 12, background: onboarding[f.key] === o ? `${clr}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${onboarding[f.key] === o ? `${clr}25` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 13, color: onboarding[f.key] === o ? '#FFF' : 'rgba(255,255,255,0.4)' } as any}>{o}</div>
                    ))}
                  </div>
                )}
                {f.type === 'yesno' && (
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    {['Oui', 'Non'].map(v => (
                      <div key={v} onClick={() => setOnboarding({ ...onboarding, [f.key]: v.toLowerCase() })} style={{ flex: 1, padding: '12px', borderRadius: 12, background: onboarding[f.key] === v.toLowerCase() ? `${clr}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${onboarding[f.key] === v.toLowerCase() ? `${clr}25` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: onboarding[f.key] === v.toLowerCase() ? '#FFF' : 'rgba(255,255,255,0.3)' } as any}>{v}</div>
                    ))}
                  </div>
                )}
                {f.type === 'rating' && (
                  <div style={{ display: 'flex', gap: 6 } as any}>
                    {Array.from({ length: f.max || 5 }, (_, i) => i + 1).map(n => (
                      <div key={n} onClick={() => setOnboarding({ ...onboarding, [f.key]: n })} style={{ flex: 1, height: 44, borderRadius: 12, background: (onboarding[f.key] || 0) >= n ? `${clr}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${(onboarding[f.key] || 0) >= n ? `${clr}35` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: (onboarding[f.key] || 0) >= n ? clr : 'rgba(255,255,255,0.2)' } as any}>{n}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div onClick={() => setStep(2)} style={{ marginTop: 10, padding: '16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}30, ${clr}15)`, border: `1px solid ${clr}35`, fontSize: 15, fontWeight: 800, color: '#FFF' } as any}>Suivant</div>
          </>
        )}

        {/* STEP 2: Ready */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
                <i className="ri-rocket-2-line" style={{ fontSize: 30, color: clr }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Pret a commencer !</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{program.title} · {program.duration_days} jours · Mode {mode}</div>
            </div>
            {/* What you'll get */}
            <div style={{ marginBottom: 24 } as any}>
              {['1 mission par jour adaptee a tes donnees', 'Ajustements IA quotidiens', 'Bilans hebdomadaires', 'Bilan final avant/apres'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                  <i className="ri-checkbox-circle-fill" style={{ fontSize: 18, color: clr }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                </div>
              ))}
            </div>
            {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#EF4444', marginBottom: 16, textAlign: 'center' } as any}>{error}</div>}
            <div onClick={startProgram} style={{ padding: '16px', borderRadius: 16, textAlign: 'center', cursor: starting ? 'wait' : 'pointer', background: `linear-gradient(135deg, ${clr}35, ${clr}18)`, border: `1px solid ${clr}40`, fontSize: 16, fontWeight: 900, color: '#FFF', boxShadow: `0 4px 20px ${clr}20` } as any}>
              {starting ? 'Lancement...' : 'Lancer le programme'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
