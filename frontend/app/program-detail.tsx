import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NativePageView from '../src/components/NativePageView';
import AnimatedDarkBg from '../src/components/AnimatedDarkBg';
import Loader from '../src/components/Loader';
import NoraCard from '../src/components/shared/NoraCard';

export default function ProgramDetailScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const programId = Array.isArray(id) ? id[0] : id;
  const [program, setProgram] = useState<any>(null);
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('solo');
  const [onboarding, setOnboarding] = useState<any>({});
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<any[]>([]);
  const [showDeviceSetup, setShowDeviceSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/programs/detail/${programId}`, {}, token).catch(() => null),
      apiFetch('/api/programs/active', {}, token).catch(() => null),
    ]).then(([detail, active]) => {
      if (detail) setProgram(detail);
      if (active) setActiveProgram(active);
    }).finally(() => setLoading(false));
  }, [programId, token]);

  if (Platform.OS !== 'web') return <NativePageView path={`/program-detail?id=${id}`} />;
  if (loading || !program) return <Loader />;

  const clr = program.color || '#FFF';
  const hasOnboarding = (program.onboarding_fields || []).length > 0;
  const hasActiveConflict = !!activeProgram?.active && activeProgram?.program?.id !== programId;

  const metricIcons: Record<string, string> = {
    sleep_quality: 'ri-moon-line', sleep_duration_min: 'ri-time-line', deep_sleep_min: 'ri-zzz-line',
    heart_rate: 'ri-heart-pulse-line', hrv: 'ri-pulse-line', stress_level: 'ri-mental-health-line',
    blood_pressure: 'ri-water-flash-line', steps: 'ri-footprint-line', calories: 'ri-fire-line',
    weight: 'ri-scales-3-line', body_fat_pct: 'ri-body-scan-line', muscle_pct: 'ri-boxing-line',
    recovery_score: 'ri-battery-charge-line',
  };

  const metricLabels: Record<string, string> = {
    sleep_quality: 'Qualite du sommeil', sleep_duration_min: 'Duree de sommeil', deep_sleep_min: 'Sommeil profond',
    heart_rate: 'Frequence cardiaque', hrv: 'HRV', stress_level: 'Stress',
    blood_pressure: 'Tension arterielle', steps: 'Pas quotidiens', calories: 'Depense calorique',
    weight: 'Poids', body_fat_pct: 'Masse grasse', muscle_pct: 'Masse musculaire', recovery_score: 'Recuperation',
  };

  const createTeamAndStart = async () => {
    if (hasActiveConflict) { setError('Vous avez deja un programme actif. Terminez-le avant d en lancer un nouveau.'); return; }
    setStarting(true); setError('');
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const teamRes = await apiFetch(`/api/programs/team/create`, { method: 'POST', body: JSON.stringify({ program_id: programId, start_date: startDate }) }, token);
      setTeamId(teamRes.team_id); setInviteCode(teamRes.invite_code);
      await apiFetch(`/api/programs/start/${programId}`, { method: 'POST', body: JSON.stringify({ mode, onboarding }) }, token);
      setStep(2);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const startSolo = async () => {
    if (hasActiveConflict) { setError('Vous avez deja un programme actif. Terminez-le avant d en lancer un nouveau.'); return; }
    setStarting(true); setError('');
    try {
      await apiFetch(`/api/programs/start/${programId}`, { method: 'POST', body: JSON.stringify({ mode: 'solo', onboarding }) }, token);
      router.replace('/(tabs)/chat' as any);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const inviteFriend = async () => {
    if (!invitePhone.trim() || !teamId) return;
    setInviteLoading(true); setInviteMsg('');
    try {
      const res = await apiFetch('/api/programs/team/invite-by-phone', { method: 'POST', body: JSON.stringify({ phone: invitePhone.trim(), team_id: teamId }) }, token);
      setInviteMsg(res.message || 'Invitation envoyee');
      setInvitedFriends(prev => [...prev, { phone: invitePhone.trim(), status: res.status, name: res.invitee_name || invitePhone.trim() }]);
      setInvitePhone('');
    } catch (e: any) { setInviteMsg(e.message || 'Erreur'); } finally { setInviteLoading(false); }
  };

  const GlassBox = ({ children, style }: any) => (
    <div style={{ padding: '16px', borderRadius: 20, background: '#1a1a1e', border: '1.5px solid rgba(255,255,255,0.12)', ...style } as any}>{children}</div>
  );

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <AnimatedDarkBg />
      <div style={{ position: 'absolute', top: -100, right: -60, width: 260, height: 260, borderRadius: 999, background: `radial-gradient(circle, ${clr}25, transparent 70%)`, zIndex: 2 } as any} />
      <style>{`
        @keyframes detail-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 100px' } as any}>

        {/* Back */}
        <div data-testid="program-detail-back-button" onClick={() => step > 0 && step !== 2 ? setStep(step - 1) : step === 2 ? router.replace('/programs' as any) : router.back()} style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 20 } as any}>
          <i className={step === 2 ? "ri-close-line" : "ri-arrow-left-line"} style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
        </div>

        {/* STEP 0: Presentation */}
        {step === 0 && (
          <div style={{ animation: 'detail-fade-in 350ms ease both' } as any}>
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: `${clr}15`, border: `2px solid ${clr}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: `0 8px 32px ${clr}20` } as any}>
                <i className={program.icon} style={{ fontSize: 38, color: clr }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 6, letterSpacing: -0.5 }}>{program.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, maxWidth: 320, margin: '0 auto' }}>{program.subtitle}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' } as any}>
                <span style={{ padding: '6px 14px', borderRadius: 99, background: `${clr}12`, border: `1px solid ${clr}25`, fontSize: 11, fontWeight: 700, color: clr }}>{program.duration_days} jours</span>
                {program.effort && <span style={{ padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{program.effort}</span>}
                {program.difficulty && <span style={{ padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{program.difficulty}</span>}
              </div>
            </div>

            {hasActiveConflict && (
              <div data-testid="program-active-conflict-warning" style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                <i className="ri-error-warning-line" style={{ fontSize: 18, color: '#EF4444', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#FCA5A5', marginBottom: 3 }}>Programme actif en cours</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>Terminez ou arretez le programme en cours pour lancer celui-ci.</div>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 } as any}>
              <GlassBox>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Duree</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{program.duration_days}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}> jours</span></div>
              </GlassBox>
              <GlassBox>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Phases</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{program.phases?.length || 3}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}> etapes</span></div>
              </GlassBox>
            </div>

            {/* Description */}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>{program.description}</div>

            {/* Science highlight */}
            {program.benefits?.[0] && (
              <GlassBox style={{ background: `${clr}08`, border: `1px solid ${clr}18`, marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                  <i className="ri-flask-line" style={{ fontSize: 13, color: clr }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: clr, textTransform: 'uppercase', letterSpacing: 0.5 }}>Science en bref</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{program.benefits[0]}</div>
              </GlassBox>
            )}

            {/* Benefits */}
            {(program.benefits || []).length > 1 && (
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Benefices prouves</div>
                {program.benefits.slice(1).map((b: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 } as any}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: `${clr}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}>
                      <i className="ri-check-line" style={{ fontSize: 12, color: clr }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tracked metrics */}
            {(program.tracked_metrics || []).length > 0 && (
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Suivi par Nora</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>
                  {program.tracked_metrics.map((m: string, i: number) => (
                    <div key={i} style={{ padding: '7px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 5 , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                      <i className={metricIcons[m] || 'ri-bar-chart-line'} style={{ fontSize: 12, color: clr }} />
                      {metricLabels[m] || m.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phases */}
            {(program.phases || []).length > 0 && (
              <div style={{ marginBottom: 28 } as any}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Phases du programme</div>
                {program.phases.map((ph: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6, animation: `detail-fade-in 300ms ease ${i * 80}ms both` } as any}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: `${ph.color || clr}12`, border: `1px solid ${ph.color || clr}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: ph.color || clr, flexShrink: 0 } as any}>{i + 1}</div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ph.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>Jours {ph.days[0]}-{ph.days[1]} · {ph.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            {program.medical_disclaimer && (
              <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 28, display: 'flex', alignItems: 'flex-start', gap: 8 , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                <i className="ri-stethoscope-line" style={{ fontSize: 14, color: '#F59E0B', marginTop: 1, flexShrink: 0 }} />
                <span>{program.medical_disclaimer}</span>
              </div>
            )}

            {/* CTA Buttons */}
            <div onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setMode('solo'); setStep(hasOnboarding ? 1 : 3); }}
              data-testid="start-solo-btn"
              style={{ padding: '16px', borderRadius: 18, textAlign: 'center', cursor: hasActiveConflict ? 'not-allowed' : 'pointer', background: `linear-gradient(135deg, ${clr}35, ${clr}15)`, border: `1px solid ${clr}40`, fontSize: 15, fontWeight: 900, color: '#FFF', marginBottom: 10, opacity: hasActiveConflict ? 0.4 : 1, boxShadow: `0 4px 20px ${clr}18`, transition: 'transform 150ms' } as any}
              onMouseEnter={(e: any) => { if (!hasActiveConflict) e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >Commencer seul</div>

            <div onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setMode('duo'); setStep(hasOnboarding ? 1 : 3); }}
              data-testid="start-team-btn"
              style={{ padding: '14px', borderRadius: 16, textAlign: 'center', cursor: hasActiveConflict ? 'not-allowed' : 'pointer', background: '#000', border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: hasActiveConflict ? 0.4 : 1 } as any}>
              <i className="ri-team-line" style={{ fontSize: 16 }} />Le faire avec un ami
            </div>

            {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#FCA5A5', marginTop: 12, textAlign: 'center' , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>{error}</div>}
          </div>
        )}

        {/* STEP 1: Onboarding/Configuration */}
        {step === 1 && (
          <div style={{ animation: 'detail-fade-in 350ms ease both' } as any}>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: `${clr}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' } as any}>
                <i className="ri-settings-4-line" style={{ fontSize: 26, color: clr }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Personnalisation</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nora adaptera le programme a vos reponses</div>
            </div>

            {(program.onboarding_fields || []).map((f: any) => (
              <div key={f.key} style={{ marginBottom: 18 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{f.label}</div>
                {f.type === 'time' && <input type="time" value={onboarding[f.key] || ''} onChange={(e: any) => setOnboarding({ ...onboarding, [f.key]: e.target.value })} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any} />}
                {f.type === 'choice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                    {(f.options || []).map((o: string) => (
                      <div key={o} onClick={() => setOnboarding({ ...onboarding, [f.key]: o })} style={{ padding: '12px 14px', borderRadius: 14, background: onboarding[f.key] === o ? `${clr}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${onboarding[f.key] === o ? `${clr}25` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 13, color: onboarding[f.key] === o ? '#FFF' : 'rgba(255,255,255,0.4)' } as any}>{o}</div>
                    ))}
                  </div>
                )}
                {f.type === 'yesno' && (
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    {['Oui', 'Non'].map(v => (
                      <div key={v} onClick={() => setOnboarding({ ...onboarding, [f.key]: v.toLowerCase() })} style={{ flex: 1, padding: '12px', borderRadius: 14, background: onboarding[f.key] === v.toLowerCase() ? `${clr}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${onboarding[f.key] === v.toLowerCase() ? `${clr}25` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: onboarding[f.key] === v.toLowerCase() ? '#FFF' : 'rgba(255,255,255,0.3)' } as any}>{v}</div>
                    ))}
                  </div>
                )}
                {f.type === 'rating' && (
                  <div style={{ display: 'flex', gap: 6 } as any}>
                    {Array.from({ length: f.max || 5 }, (_, i) => i + 1).map(n => (
                      <div key={n} onClick={() => setOnboarding({ ...onboarding, [f.key]: n })} style={{ flex: 1, height: 44, borderRadius: 12, background: (onboarding[f.key] || 0) >= n ? `${clr}18` : 'rgba(255,255,255,0.03)', border: `1px solid ${(onboarding[f.key] || 0) >= n ? `${clr}35` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: (onboarding[f.key] || 0) >= n ? clr : 'rgba(255,255,255,0.2)' } as any}>{n}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setStep(3); }}
              style={{ marginTop: 12, padding: '16px', borderRadius: 18, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}35, ${clr}15)`, border: `1px solid ${clr}40`, fontSize: 15, fontWeight: 900, color: '#FFF', opacity: hasActiveConflict ? 0.4 : 1 } as any}>Suivant</div>
          </div>
        )}

        {/* STEP 2: Invite friends */}
        {step === 2 && (
          <div style={{ animation: 'detail-fade-in 350ms ease both' } as any}>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                <i className="ri-team-line" style={{ fontSize: 28, color: '#FFF' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Invitez vos amis</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Le programme est lance ! Invitez des amis.</div>
            </div>

            <GlassBox style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', marginBottom: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Code d equipe</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: 4 }}>{inviteCode}</div>
              <div onClick={() => navigator.clipboard?.writeText(inviteCode)} style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.3)', cursor: 'pointer' } as any}><i className="ri-file-copy-line" style={{ marginRight: 4 }} />Copier</div>
            </GlassBox>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Inviter par telephone</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
              <input data-testid="invite-phone-input" value={invitePhone} onChange={(e: any) => setInvitePhone(e.target.value)} placeholder="06 12 34 56 78"
                style={{ flex: 1, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any} />
              <div data-testid="invite-send-btn" onClick={inviteFriend} style={{ padding: '14px 18px', borderRadius: 14, background: invitePhone.trim() ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${invitePhone.trim() ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: invitePhone.trim() && !inviteLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' } as any}>
                <i className={inviteLoading ? "ri-loader-4-line" : "ri-send-plane-2-line"} style={{ fontSize: 18, color: invitePhone.trim() ? '#A78BFA' : 'rgba(255,255,255,0.2)' }} />
              </div>
            </div>

            {inviteMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: inviteMsg.includes('Erreur') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${inviteMsg.includes('Erreur') ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)'}`, marginBottom: 14, fontSize: 12, color: '#FFF', textAlign: 'center' } as any}>{inviteMsg}</div>
            )}

            {invitedFriends.length > 0 && (
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Invitations envoyees</div>
                {invitedFriends.map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: f.status === 'notification_sent' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className={f.status === 'notification_sent' ? 'ri-notification-line' : 'ri-message-2-line'} style={{ fontSize: 14, color: f.status === 'notification_sent' ? '#10B981' : '#3B82F6' }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{f.status === 'notification_sent' ? 'Notification in-app' : f.status === 'sms_sent' ? 'SMS envoye' : f.status === 'already_member' ? 'Deja membre' : 'En attente'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div onClick={() => router.replace('/programs' as any)} style={{ padding: '16px', borderRadius: 18, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}35, ${clr}15)`, border: `1px solid ${clr}40`, fontSize: 15, fontWeight: 900, color: '#FFF', marginTop: 10 } as any}>
              {invitedFriends.length > 0 ? 'Commencer le programme' : 'Continuer sans inviter'}
            </div>
          </div>
        )}

        {/* STEP 3: Ready to start */}
        {step === 3 && (
          <div style={{ animation: 'detail-fade-in 350ms ease both' } as any}>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: `${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 6px 24px ${clr}20` } as any}>
                <i className="ri-rocket-2-line" style={{ fontSize: 30, color: clr }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Pret a commencer !</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{program.title} · {program.duration_days} jours · Mode {mode === 'solo' ? 'solo' : 'equipe'}</div>
            </div>

            <div style={{ marginBottom: 28 } as any}>
              {[
                { icon: 'ri-calendar-check-line', text: '1 mission par jour basee sur la science' },
                { icon: 'ri-robot-2-line', text: 'Analyse IA Nora personnalisee chaque jour' },
                { icon: 'ri-bar-chart-box-line', text: 'Bilans hebdomadaires et bilan final avant/apres' },
                { icon: 'ri-heart-pulse-line', text: 'Comparaison de vos donnees de sante debut vs fin' },
                ...(mode !== 'solo' ? [{ icon: 'ri-team-line', text: 'Progression visible avec vos amis' }] : []),
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${clr}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={item.icon} style={{ fontSize: 15, color: clr }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.text}</span>
                </div>
              ))}
            </div>

            {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#FCA5A5', marginBottom: 16, textAlign: 'center' , backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>{error}</div>}

            <div data-testid="launch-program-btn" onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } mode !== 'solo' ? createTeamAndStart() : startSolo(); }}
              style={{ padding: '16px', borderRadius: 18, textAlign: 'center', cursor: starting || hasActiveConflict ? 'not-allowed' : 'pointer', background: `linear-gradient(135deg, ${clr}35, ${clr}18)`, border: `1px solid ${clr}45`, fontSize: 16, fontWeight: 900, color: '#FFF', boxShadow: `0 4px 24px ${clr}22`, opacity: hasActiveConflict ? 0.4 : 1 } as any}>
              {starting ? 'Lancement...' : mode !== 'solo' ? 'Creer l\'equipe et commencer' : 'Lancer le programme'}
            </div>
          </div>
        )}

      </div>
      </div>

      {/* Device Setup Popup */}
      {showDeviceSetup && (
        <div onClick={() => setShowDeviceSetup(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, borderRadius: 24, background: '#1a1a1e', border: '1.5px solid rgba(255,255,255,0.15)', padding: 28, animation: 'detail-fade-in 300ms ease' } as any}>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: `${clr}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' } as any}>
                <i className="ri-bluetooth-connect-line" style={{ fontSize: 26, color: clr }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Appareils requis</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Ce programme necessite des appareils connectes pour suivre vos metriques. Configurez-les depuis la page Dispositifs.</div>
            </div>
            {(program.required_devices || ['bracelet']).map((d: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 } as any}>
                <i className={d === 'scale' ? 'ri-scales-3-line' : 'ri-device-line'} style={{ fontSize: 20, color: clr }} />
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{d === 'scale' ? 'Balance connectee' : 'Bracelet Elio'}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Non configure</div>
                </div>
                <i className="ri-error-warning-line" style={{ fontSize: 16, color: '#F59E0B' }} />
              </div>
            ))}
            <div onClick={() => { setShowDeviceSetup(false); router.push('/(tabs)/devices' as any); }}
              style={{ padding: '14px', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}35, ${clr}15)`, border: `1px solid ${clr}40`, fontSize: 14, fontWeight: 800, color: '#FFF', marginTop: 16, marginBottom: 8 } as any}>
              <i className="ri-bluetooth-connect-line" style={{ marginRight: 8 }} />Configurer mes appareils
            </div>
            <div onClick={() => setShowDeviceSetup(false)}
              style={{ padding: '12px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.35)' } as any}>
              Plus tard
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
