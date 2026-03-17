import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NativePageView from '../src/components/NativePageView';
import Loader from '../src/components/Loader';
import { PrefixPicker } from '../src/components/GlassPickers';
import { PREFIXES } from '../src/components/register/RegisterUI';

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
  const [loading, setLoading] = useState(true);
  const [invitePrefix, setInvitePrefix] = useState('+33');

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
  const coverImage = program.cover_image || '';

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

  const applyOnboarding = async () => {
    try {
      await apiFetch('/api/programs/apply-onboarding', { method: 'POST', body: JSON.stringify({ onboarding, program_id: programId }) }, token);
    } catch {}
  };

  const createTeamAndStart = async () => {
    if (hasActiveConflict) { setError('Vous avez deja un programme actif. Terminez-le avant d en lancer un nouveau.'); return; }
    setStarting(true); setError('');
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const teamRes = await apiFetch(`/api/programs/team/create`, { method: 'POST', body: JSON.stringify({ program_id: programId, start_date: startDate }) }, token);
      setTeamId(teamRes.team_id); setInviteCode(teamRes.invite_code);
      await apiFetch(`/api/programs/start/${programId}`, { method: 'POST', body: JSON.stringify({ mode, onboarding }) }, token);
      await applyOnboarding();
      setStep(2);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const startSolo = async () => {
    if (hasActiveConflict) { setError('Vous avez deja un programme actif. Terminez-le avant d en lancer un nouveau.'); return; }
    setStarting(true); setError('');
    try {
      await apiFetch(`/api/programs/start/${programId}`, { method: 'POST', body: JSON.stringify({ mode: 'solo', onboarding }) }, token);
      await applyOnboarding();
      router.replace('/(tabs)/chat' as any);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const inviteFriend = async () => {
    if (!invitePhone.trim() || !teamId) return;
    setInviteLoading(true); setInviteMsg('');
    try {
      let phone = invitePhone.trim().replace(/\s/g, '');
      if (phone.startsWith('0') && phone.length >= 9) phone = invitePrefix + phone.substring(1);
      else if (!phone.startsWith('+')) phone = invitePrefix + phone;
      const res = await apiFetch('/api/programs/team/invite-by-phone', { method: 'POST', body: JSON.stringify({ phone, team_id: teamId }) }, token);
      setInviteMsg(res.message || 'Invitation envoyee');
      setInvitedFriends(prev => [...prev, { phone, status: res.status, name: res.invitee_name || phone }]);
      setInvitePhone('');
    } catch (e: any) { setInviteMsg(e.message || 'Erreur'); } finally { setInviteLoading(false); }
  };

  const Pill = ({ children, color, filled, style }: any) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '7px 16px', borderRadius: 999,
      background: filled ? `${color || clr}18` : 'rgba(255,255,255,0.06)',
      border: `1px solid ${filled ? `${color || clr}30` : 'rgba(255,255,255,0.08)'}`,
      fontSize: 12, fontWeight: 700,
      color: filled ? (color || clr) : 'rgba(255,255,255,0.5)',
      whiteSpace: 'nowrap', ...style,
    } as any}>{children}</span>
  );

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: '#0a0a0f' } as any}>
      <style>{`
        @keyframes pd-fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pd-scale-in { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes pd-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .pd-btn-primary:hover { transform: translateY(-1px) !important; box-shadow: 0 8px 32px ${clr}30 !important; }
        .pd-btn-secondary:hover { background: rgba(255,255,255,0.08) !important; }
        .pd-phase-card:hover { background: rgba(255,255,255,0.06) !important; border-color: ${clr}25 !important; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' } as any}>

        {/* STEP 0: Presentation */}
        {step === 0 && (
          <div data-testid="program-detail-step-0" style={{ animation: 'pd-fade-up 500ms ease both' } as any}>
            {/* Hero Section with Image */}
            <div style={{ position: 'relative', width: '100%', height: 340, overflow: 'hidden' } as any}>
              {coverImage && (
                <img src={coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                background: coverImage
                  ? `linear-gradient(180deg, rgba(10,10,15,0) 0%, rgba(10,10,15,0.35) 40%, rgba(10,10,15,0.85) 75%, rgba(10,10,15,1) 100%)`
                  : `linear-gradient(135deg, ${clr}25 0%, rgba(10,10,15,1) 100%)`,
              } as any} />

              {/* Back button */}
              <div data-testid="program-detail-back-button" onClick={() => router.back()} style={{
                position: 'absolute', top: 'calc(env(safe-area-inset-top, 44px) + 10px)', left: 20, zIndex: 10,
                width: 42, height: 42, borderRadius: 999, background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              } as any}>
                <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
              </div>

              {/* Hero Content */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 28px', zIndex: 5 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 18,
                    background: `${clr}20`, border: `1.5px solid ${clr}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  } as any}>
                    <i className={program.icon} style={{ fontSize: 28, color: clr }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, lineHeight: 1.2 }}>{program.title}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 } as any}>
                  <Pill filled>{program.duration_days} jours</Pill>
                  {program.effort && <Pill>{program.effort}</Pill>}
                  {program.difficulty && <Pill>{program.difficulty}</Pill>}
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 120px' } as any}>
              {/* Subtitle */}
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '20px 0 24px', animation: 'pd-fade-up 500ms ease 100ms both' } as any}>
                {program.subtitle}
              </div>

              {hasActiveConflict && (
                <div data-testid="program-active-conflict-warning" style={{
                  padding: '14px 16px', borderRadius: 16,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
                } as any}>
                  <i className="ri-error-warning-line" style={{ fontSize: 18, color: '#EF4444', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#FCA5A5', marginBottom: 3 }}>Programme actif en cours</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>Terminez ou arretez le programme en cours pour lancer celui-ci.</div>
                  </div>
                </div>
              )}

              {/* Quick Stats Row */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, animation: 'pd-fade-up 500ms ease 150ms both' } as any}>
                <div style={{
                  flex: 1, padding: '16px', borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                } as any}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Duree</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{program.duration_days}<span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>jours</span></div>
                </div>
                <div style={{
                  flex: 1, padding: '16px', borderRadius: 18,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                } as any}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Phases</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{program.phases?.length || 3}<span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>etapes</span></div>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, marginBottom: 28, animation: 'pd-fade-up 500ms ease 200ms both' } as any}>
                {program.description}
              </div>

              {/* Science box */}
              {program.benefits?.[0] && (
                <div style={{
                  padding: '18px 20px', borderRadius: 20,
                  background: `${clr}06`, border: `1px solid ${clr}15`,
                  marginBottom: 28, animation: 'pd-fade-up 500ms ease 250ms both',
                } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9,
                      background: `${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    } as any}>
                      <i className="ri-flask-line" style={{ fontSize: 14, color: clr }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: clr, textTransform: 'uppercase', letterSpacing: 1 }}>Science en bref</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{program.benefits[0]}</div>
                </div>
              )}

              {/* Benefits */}
              {(program.benefits || []).length > 1 && (
                <div style={{ marginBottom: 28, animation: 'pd-fade-up 500ms ease 300ms both' } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Benefices prouves</div>
                  {program.benefits.slice(1).map((b: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 } as any}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 999, flexShrink: 0, marginTop: 1,
                        background: `${clr}12`, border: `1px solid ${clr}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      } as any}>
                        <i className="ri-check-line" style={{ fontSize: 12, color: clr }} />
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tracked Metrics as Pills */}
              {(program.tracked_metrics || []).length > 0 && (
                <div style={{ marginBottom: 28, animation: 'pd-fade-up 500ms ease 350ms both' } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Suivi par Nora</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 } as any}>
                    {program.tracked_metrics.map((m: string, i: number) => (
                      <Pill key={i} filled>
                        <i className={metricIcons[m] || 'ri-bar-chart-line'} style={{ fontSize: 13 }} />
                        {metricLabels[m] || m.replace(/_/g, ' ')}
                      </Pill>
                    ))}
                  </div>
                </div>
              )}

              {/* Phases */}
              {(program.phases || []).length > 0 && (
                <div style={{ marginBottom: 32, animation: 'pd-fade-up 500ms ease 400ms both' } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Phases du programme</div>
                  {program.phases.map((ph: any, i: number) => (
                    <div key={i} className="pd-phase-card" style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                      borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: 8, transition: 'all 200ms ease', cursor: 'default',
                      animation: `pd-fade-up 400ms ease ${450 + i * 80}ms both`,
                    } as any}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 13,
                        background: `${ph.color || clr}12`, border: `1.5px solid ${ph.color || clr}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 900, color: ph.color || clr, flexShrink: 0,
                      } as any}>{i + 1}</div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 3 }}>{ph.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>Jours {ph.days[0]}-{ph.days[1]} · {ph.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Medical Disclaimer */}
              {program.medical_disclaimer && (
                <div style={{
                  padding: '14px 16px', borderRadius: 16,
                  background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)',
                  fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 32,
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  animation: 'pd-fade-up 500ms ease 600ms both',
                } as any}>
                  <i className="ri-stethoscope-line" style={{ fontSize: 15, color: '#F59E0B', marginTop: 1, flexShrink: 0 }} />
                  <span>{program.medical_disclaimer}</span>
                </div>
              )}

              {/* CTA Buttons */}
              <div style={{ animation: 'pd-fade-up 500ms ease 650ms both' } as any}>
                <div data-testid="start-solo-btn" className="pd-btn-primary"
                  onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setMode('solo'); setStep(hasOnboarding ? 1 : 3); }}
                  style={{
                    padding: '18px', borderRadius: 999, textAlign: 'center',
                    cursor: hasActiveConflict ? 'not-allowed' : 'pointer',
                    background: clr, fontSize: 15, fontWeight: 900, color: '#FFF',
                    marginBottom: 12, opacity: hasActiveConflict ? 0.4 : 1,
                    boxShadow: `0 4px 24px ${clr}35`,
                    transition: 'all 200ms ease', letterSpacing: 0.3,
                  } as any}>
                  Commencer seul
                </div>

                <div data-testid="start-team-btn" className="pd-btn-secondary"
                  onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setMode('duo'); setStep(hasOnboarding ? 1 : 3); }}
                  style={{
                    padding: '16px', borderRadius: 999, textAlign: 'center',
                    cursor: hasActiveConflict ? 'not-allowed' : 'pointer',
                    background: 'transparent', border: '1.5px solid rgba(255,255,255,0.15)',
                    fontSize: 14, fontWeight: 700, color: '#FFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: hasActiveConflict ? 0.4 : 1, transition: 'all 200ms ease',
                  } as any}>
                  <i className="ri-team-line" style={{ fontSize: 17 }} />Le faire avec un ami
                </div>

                {error && <div style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#FCA5A5', marginTop: 14, textAlign: 'center' } as any}>{error}</div>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Onboarding/Configuration */}
        {step === 1 && (
          <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px', animation: 'pd-fade-up 400ms ease both' } as any}>
            <div data-testid="program-detail-back-button" onClick={() => setStep(0)} style={{
              width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: 24,
            } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, background: `${clr}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              } as any}>
                <i className="ri-settings-4-line" style={{ fontSize: 26, color: clr }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Personnalisation</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nora adaptera le programme a vos reponses</div>
            </div>

            {(program.onboarding_fields || []).map((f: any) => (
              <div key={f.key} style={{ marginBottom: 20 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{f.label}</div>
                {f.type === 'time' && (
                  <input type="time" value={onboarding[f.key] || ''} onChange={(e: any) => setOnboarding({ ...onboarding, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} />
                )}
                {f.type === 'choice' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                    {(f.options || []).map((o: string) => (
                      <div key={o} onClick={() => setOnboarding({ ...onboarding, [f.key]: o })} style={{
                        padding: '14px 18px', borderRadius: 999,
                        background: onboarding[f.key] === o ? `${clr}12` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${onboarding[f.key] === o ? `${clr}30` : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        color: onboarding[f.key] === o ? '#FFF' : 'rgba(255,255,255,0.4)',
                        transition: 'all 200ms ease',
                      } as any}>{o}</div>
                    ))}
                  </div>
                )}
                {f.type === 'yesno' && (
                  <div style={{ display: 'flex', gap: 10 } as any}>
                    {['Oui', 'Non'].map(v => (
                      <div key={v} onClick={() => setOnboarding({ ...onboarding, [f.key]: v.toLowerCase() })} style={{
                        flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center',
                        background: onboarding[f.key] === v.toLowerCase() ? `${clr}12` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${onboarding[f.key] === v.toLowerCase() ? `${clr}30` : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer', fontSize: 14, fontWeight: 700,
                        color: onboarding[f.key] === v.toLowerCase() ? '#FFF' : 'rgba(255,255,255,0.3)',
                        transition: 'all 200ms ease',
                      } as any}>{v}</div>
                    ))}
                  </div>
                )}
                {f.type === 'rating' && (
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    {Array.from({ length: f.max || 5 }, (_, i) => i + 1).map(n => (
                      <div key={n} onClick={() => setOnboarding({ ...onboarding, [f.key]: n })} style={{
                        flex: 1, height: 48, borderRadius: 999,
                        background: (onboarding[f.key] || 0) >= n ? `${clr}18` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${(onboarding[f.key] || 0) >= n ? `${clr}35` : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 800, color: (onboarding[f.key] || 0) >= n ? clr : 'rgba(255,255,255,0.2)',
                        transition: 'all 200ms ease',
                      } as any}>{n}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setStep(3); }}
              className="pd-btn-primary"
              style={{
                marginTop: 16, padding: '18px', borderRadius: 999, textAlign: 'center',
                cursor: 'pointer', background: clr, fontSize: 15, fontWeight: 900, color: '#FFF',
                boxShadow: `0 4px 24px ${clr}35`, transition: 'all 200ms ease',
                opacity: hasActiveConflict ? 0.4 : 1,
              } as any}>Suivant</div>
          </div>
        )}

        {/* STEP 2: Invite friends */}
        {step === 2 && (
          <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px', animation: 'pd-fade-up 400ms ease both' } as any}>
            <div onClick={() => router.replace('/(tabs)/chat' as any)} style={{
              width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: 24,
            } as any}>
              <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, background: 'rgba(167,139,250,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              } as any}>
                <i className="ri-team-line" style={{ fontSize: 28, color: '#FFF' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Invitez vos amis</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Le programme est lance ! Invitez des amis.</div>
            </div>

            {/* Team code */}
            <div style={{
              padding: '20px', borderRadius: 20,
              background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)',
              marginBottom: 24, textAlign: 'center',
            } as any}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Code d equipe</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', letterSpacing: 6 }}>{inviteCode}</div>
              <div onClick={() => navigator.clipboard?.writeText(inviteCode)} style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 } as any}>
                <i className="ri-file-copy-line" />Copier
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Inviter par telephone</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, width: '100%', boxSizing: 'border-box' } as any}>
              <div style={{
                display: 'flex', alignItems: 'center', flex: 1, minWidth: 0,
                borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
              } as any}>
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 } as any}>
                  <PrefixPicker value={invitePrefix} onChange={setInvitePrefix} />
                </div>
                <input data-testid="invite-phone-input" value={invitePhone} onChange={(e: any) => setInvitePhone(e.target.value)} placeholder="06 12 34 56 78"
                  style={{ flex: 1, minWidth: 0, padding: '13px 16px', background: 'transparent', border: 'none', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
              <div data-testid="invite-send-btn" onClick={inviteFriend} style={{
                width: 48, height: 48, borderRadius: 999,
                background: invitePhone.trim() ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${invitePhone.trim() ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`,
                cursor: invitePhone.trim() && !inviteLoading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              } as any}>
                <i className={inviteLoading ? "ri-loader-4-line" : "ri-send-plane-2-line"} style={{ fontSize: 18, color: invitePhone.trim() ? '#A78BFA' : 'rgba(255,255,255,0.2)' }} />
              </div>
            </div>

            {inviteMsg && (
              <div style={{ padding: '12px 16px', borderRadius: 999, background: inviteMsg.includes('Erreur') ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${inviteMsg.includes('Erreur') ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)'}`, marginBottom: 16, fontSize: 12, color: '#FFF', textAlign: 'center' } as any}>{inviteMsg}</div>
            )}

            {invitedFriends.length > 0 && (
              <div style={{ marginBottom: 20 } as any}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Invitations envoyees</div>
                {invitedFriends.map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 30, height: 30, borderRadius: 999, background: f.status === 'notification_sent' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
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

            <div onClick={() => router.replace('/(tabs)/chat' as any)} className="pd-btn-primary" style={{
              padding: '18px', borderRadius: 999, textAlign: 'center', cursor: 'pointer',
              background: clr, fontSize: 15, fontWeight: 900, color: '#FFF',
              marginTop: 12, boxShadow: `0 4px 24px ${clr}35`, transition: 'all 200ms ease',
            } as any}>
              {invitedFriends.length > 0 ? 'Commencer le programme' : 'Continuer sans inviter'}
            </div>
          </div>
        )}

        {/* STEP 3: Ready to start */}
        {step === 3 && (
          <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px', animation: 'pd-fade-up 400ms ease both' } as any}>
            <div onClick={() => step > 0 ? setStep(hasOnboarding ? 1 : 0) : router.back()} style={{
              width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: 24,
            } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, background: `${clr}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 18px', boxShadow: `0 8px 32px ${clr}20`,
              } as any}>
                <i className="ri-rocket-2-line" style={{ fontSize: 30, color: clr }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Pret a commencer !</div>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 } as any}>
                <Pill filled>{program.title}</Pill>
                <Pill>Mode {mode === 'solo' ? 'solo' : 'equipe'}</Pill>
              </div>
            </div>

            <div style={{ marginBottom: 32 } as any}>
              {[
                { icon: 'ri-calendar-check-line', text: '1 mission par jour basee sur la science' },
                { icon: 'ri-robot-2-line', text: 'Analyse IA Nora personnalisee chaque jour' },
                { icon: 'ri-bar-chart-box-line', text: 'Bilans hebdomadaires et bilan final avant/apres' },
                { icon: 'ri-heart-pulse-line', text: 'Comparaison de vos donnees de sante debut vs fin' },
                ...(mode !== 'solo' ? [{ icon: 'ri-team-line', text: 'Progression visible avec vos amis' }] : []),
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
                  animation: `pd-fade-up 400ms ease ${i * 80}ms both`,
                } as any}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 999,
                    background: `${clr}10`, border: `1px solid ${clr}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  } as any}>
                    <i className={item.icon} style={{ fontSize: 16, color: clr }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{item.text}</span>
                </div>
              ))}
            </div>

            {error && <div style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#FCA5A5', marginBottom: 16, textAlign: 'center' } as any}>{error}</div>}

            <div data-testid="launch-program-btn" className="pd-btn-primary" onClick={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } mode !== 'solo' ? createTeamAndStart() : startSolo(); }}
              style={{
                padding: '18px', borderRadius: 999, textAlign: 'center',
                cursor: starting || hasActiveConflict ? 'not-allowed' : 'pointer',
                background: clr, fontSize: 16, fontWeight: 900, color: '#FFF',
                boxShadow: `0 6px 28px ${clr}35`, transition: 'all 200ms ease',
                opacity: hasActiveConflict ? 0.4 : 1,
              } as any}>
              {starting ? 'Lancement...' : mode !== 'solo' ? 'Creer l\'equipe et commencer' : 'Lancer le programme'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
