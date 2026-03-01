import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NativePageView from '../src/components/NativePageView';

export default function ProgramDetailScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [program, setProgram] = useState<any>(null);
  const [step, setStep] = useState(0); // 0=presentation, 1=onboarding, 2=invite, 3=ready
  const [mode, setMode] = useState('solo');
  const [onboarding, setOnboarding] = useState<any>({});
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  // Team invite state
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<any[]>([]);

  useEffect(() => {
    if (id) apiFetch(`/api/programs/detail/${id}`, {}, token).then(setProgram).catch(() => {});
  }, [id]);

  if (Platform.OS !== 'web') return <NativePageView path={`/program-detail?id=${id}`} />;
  if (!program) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0f1a' }}><Text style={{ color: '#FFF' }}>Chargement...</Text></View>;

  const clr = program.color || '#A78BFA';
  const hasOnboarding = (program.onboarding_fields || []).length > 0;

  const createTeamAndStart = async () => {
    setStarting(true); setError('');
    try {
      // Create team first
      const startDate = new Date().toISOString().split('T')[0];
      const teamRes = await apiFetch(`/api/programs/team/create`, {
        method: 'POST',
        body: JSON.stringify({ program_id: id, start_date: startDate }),
      }, token);
      setTeamId(teamRes.team_id);
      setInviteCode(teamRes.invite_code);
      // Now start the program
      await apiFetch(`/api/programs/start/${id}`, { method: 'POST', body: JSON.stringify({ mode, onboarding }) }, token);
      // Go to invite step
      setStep(2);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const startSolo = async () => {
    setStarting(true); setError('');
    try {
      await apiFetch(`/api/programs/start/${id}`, { method: 'POST', body: JSON.stringify({ mode: 'solo', onboarding }) }, token);
      router.replace('/programs' as any);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const inviteFriend = async () => {
    if (!invitePhone.trim() || !teamId) return;
    setInviteLoading(true); setInviteMsg('');
    try {
      const res = await apiFetch('/api/programs/team/invite-by-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: invitePhone.trim(), team_id: teamId }),
      }, token);
      setInviteMsg(res.message || 'Invitation envoyee');
      setInvitedFriends(prev => [...prev, { phone: invitePhone.trim(), status: res.status, name: res.invitee_name || invitePhone.trim() }]);
      setInvitePhone('');
    } catch (e: any) { setInviteMsg(e.message || 'Erreur'); } finally { setInviteLoading(false); }
  };

  const metricIcons: Record<string, string> = {
    sleep_quality: 'ri-moon-line', sleep_duration_min: 'ri-time-line', deep_sleep_min: 'ri-zzz-line',
    heart_rate: 'ri-heart-pulse-line', hrv: 'ri-pulse-line', stress_level: 'ri-mental-health-line',
    blood_pressure: 'ri-water-flash-line', steps: 'ri-footprint-line', calories: 'ri-fire-line',
    weight: 'ri-scales-3-line', body_fat_pct: 'ri-body-scan-line', muscle_pct: 'ri-boxing-line',
    recovery_score: 'ri-battery-charge-line',
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", background: '#0a0f1a', overflowY: 'auto' } as any}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 20px 100px' } as any}>
        {/* Back */}
        <div onClick={() => step > 0 && step !== 2 ? setStep(step - 1) : step === 2 ? router.replace('/programs' as any) : router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 20 } as any}>
          <i className={step === 2 ? "ri-close-line" : "ri-arrow-left-line"} style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' } as any}>
                <span style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{program.duration_days} jours</span>
                {program.effort && <span style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{program.effort}</span>}
                {program.difficulty && <span style={{ padding: '5px 12px', borderRadius: 99, background: `${clr}10`, border: `1px solid ${clr}20`, fontSize: 11, fontWeight: 600, color: clr }}>{program.difficulty}</span>}
              </div>
            </div>
            {/* Description */}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 } as any}>{program.description}</div>
            {/* Benefits */}
            {(program.benefits || []).length > 0 && (
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: clr, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Benefices prouves</div>
                {program.benefits.map((b: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 } as any}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: `${clr}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}><i className="ri-check-line" style={{ fontSize: 13, color: clr }} /></div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Tracked metrics */}
            {(program.tracked_metrics || []).length > 0 && (
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Metriques suivies par Nora</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>
                  {program.tracked_metrics.map((m: string, i: number) => (
                    <div key={i} style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 } as any}>
                      <i className={metricIcons[m] || 'ri-bar-chart-line'} style={{ fontSize: 12, color: clr }} />
                      {(program.data_used || [])[i] || m.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Phases */}
            <div style={{ marginBottom: 24 } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{program.phases?.length || 3} phases progressives</div>
              {(program.phases || []).map((ph: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ph.color || clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: ph.color || clr, flexShrink: 0 } as any}>{i + 1}</div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ph.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>J{ph.days[0]}-{ph.days[1]} · {ph.description}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Disclaimer */}
            {program.medical_disclaimer && <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 24 } as any}><i className="ri-stethoscope-line" style={{ marginRight: 6, color: '#F59E0B' }} />{program.medical_disclaimer}</div>}
            {/* CTA */}
            <div onClick={() => setStep(hasOnboarding ? 1 : 3)} data-testid="start-solo-btn" style={{ padding: '16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}30, ${clr}15)`, border: `1px solid ${clr}35`, fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 10 } as any}>Commencer seul</div>
            <div onClick={() => { setMode('duo'); setStep(hasOnboarding ? 1 : 3); }} data-testid="start-team-btn" style={{ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', fontSize: 13, fontWeight: 700, color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              <i className="ri-team-line" style={{ fontSize: 18 }} />Le faire avec un ami
            </div>
          </>
        )}

        {/* STEP 1: Configuration/Onboarding */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Personnalisation</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nora adaptera le programme a vos reponses</div>
            </div>
            {/* Onboarding fields */}
            {(program.onboarding_fields || []).map((f: any) => (
              <div key={f.key} style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{f.label}</div>
                {f.type === 'time' && <input type="time" value={onboarding[f.key] || ''} onChange={(e: any) => setOnboarding({ ...onboarding, [f.key]: e.target.value })} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} />}
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
            <div onClick={() => setStep(3)} style={{ marginTop: 10, padding: '16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}30, ${clr}15)`, border: `1px solid ${clr}35`, fontSize: 15, fontWeight: 800, color: '#FFF' } as any}>Suivant</div>
          </>
        )}

        {/* STEP 2: Invite friends (after team creation) */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' } as any}>
                <i className="ri-team-line" style={{ fontSize: 30, color: '#A78BFA' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Invitez vos amis</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Le programme a commence ! Invitez des amis par telephone.</div>
            </div>

            {/* Invite code display */}
            <div style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 16, textAlign: 'center' } as any}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Code d'equipe</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#A78BFA', letterSpacing: 4 }}>{inviteCode}</div>
              <div onClick={() => navigator.clipboard?.writeText(inviteCode)} style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.35)', cursor: 'pointer' } as any}><i className="ri-file-copy-line" style={{ marginRight: 4 }} />Copier le code</div>
            </div>

            {/* Phone invite */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Inviter par telephone</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
              <input
                data-testid="invite-phone-input"
                value={invitePhone}
                onChange={(e: any) => setInvitePhone(e.target.value)}
                placeholder="06 12 34 56 78"
                style={{ flex: 1, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any}
              />
              <div data-testid="invite-send-btn" onClick={inviteFriend} style={{ padding: '14px 18px', borderRadius: 14, background: invitePhone.trim() ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${invitePhone.trim() ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: invitePhone.trim() && !inviteLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                {inviteLoading ? <i className="ri-loader-4-line" style={{ fontSize: 18, color: '#A78BFA' }} /> : <i className="ri-send-plane-2-line" style={{ fontSize: 18, color: invitePhone.trim() ? '#A78BFA' : 'rgba(255,255,255,0.2)' }} />}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14 }}>Si votre ami a deja un compte Chutex, il recevra une notification. Sinon, un SMS sera envoye.</div>

            {/* Invite status message */}
            {inviteMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: inviteMsg.includes('Erreur') || inviteMsg.includes('Impossible') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${inviteMsg.includes('Erreur') || inviteMsg.includes('Impossible') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, marginBottom: 14, fontSize: 12, color: '#FFF', textAlign: 'center' } as any}>{inviteMsg}</div>
            )}

            {/* Invited friends list */}
            {invitedFriends.length > 0 && (
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>Invitations envoyees</div>
                {invitedFriends.map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: f.status === 'notification_sent' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className={f.status === 'notification_sent' ? 'ri-notification-line' : 'ri-message-2-line'} style={{ fontSize: 14, color: f.status === 'notification_sent' ? '#10B981' : '#3B82F6' }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{f.status === 'notification_sent' ? 'Notification in-app envoyee' : f.status === 'sms_sent' ? 'SMS envoye' : f.status === 'already_member' ? 'Deja membre' : 'En attente'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Continue button */}
            <div onClick={() => router.replace('/programs' as any)} style={{ padding: '16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${clr}30, ${clr}15)`, border: `1px solid ${clr}35`, fontSize: 15, fontWeight: 800, color: '#FFF', marginTop: 10 } as any}>
              {invitedFriends.length > 0 ? 'Commencer le programme' : 'Continuer sans inviter'}
            </div>
          </>
        )}

        {/* STEP 3: Ready to start */}
        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
                <i className="ri-rocket-2-line" style={{ fontSize: 30, color: clr }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Pret a commencer !</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{program.title} · {program.duration_days} jours · Mode {mode === 'solo' ? 'solo' : 'equipe'}</div>
            </div>
            {/* What you'll get */}
            <div style={{ marginBottom: 24 } as any}>
              {[
                { icon: 'ri-calendar-check-line', text: '1 mission par jour basee sur la science' },
                { icon: 'ri-robot-2-line', text: 'Analyse IA Nora personnalisee chaque jour' },
                { icon: 'ri-bar-chart-box-line', text: 'Bilans hebdomadaires et bilan final avant/apres' },
                { icon: 'ri-heart-pulse-line', text: 'Comparaison de vos donnees de sante debut vs fin' },
                ...(mode !== 'solo' ? [{ icon: 'ri-team-line', text: 'Progression visible avec vos amis' }] : []),
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${clr}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={item.icon} style={{ fontSize: 14, color: clr }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{item.text}</span>
                </div>
              ))}
            </div>
            {error && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 12, color: '#EF4444', marginBottom: 16, textAlign: 'center' } as any}>{error}</div>}
            <div data-testid="launch-program-btn" onClick={mode !== 'solo' ? createTeamAndStart : startSolo} style={{ padding: '16px', borderRadius: 16, textAlign: 'center', cursor: starting ? 'wait' : 'pointer', background: `linear-gradient(135deg, ${clr}35, ${clr}18)`, border: `1px solid ${clr}40`, fontSize: 16, fontWeight: 900, color: '#FFF', boxShadow: `0 4px 20px ${clr}20` } as any}>
              {starting ? 'Lancement...' : mode !== 'solo' ? 'Creer l\'equipe et commencer' : 'Lancer le programme'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
