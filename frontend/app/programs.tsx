import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import NativePageView from '../src/components/NativePageView';

export default function ProgramsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [badges, setBadges] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);
  const [showTeamCreate, setShowTeamCreate] = useState(false);
  const [showTeamJoin, setShowTeamJoin] = useState(false);
  const [teamProgId, setTeamProgId] = useState('');
  const [teamStartDate, setTeamStartDate] = useState('');
  const [teamInviteCode, setTeamInviteCode] = useState('');
  const [teamMsg, setTeamMsg] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [catalog, setCatalog] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prog, bdg, wr, tm, cat] = await Promise.all([
        apiFetch('/api/programs/active', {}, token).catch(() => null),
        apiFetch('/api/programs/badges', {}, token).catch(() => null),
        apiFetch('/api/programs/weekly-report', {}, token).catch(() => null),
        apiFetch('/api/programs/team/active', {}, token).catch(() => null),
        apiFetch('/api/programs/catalog', {}, token).catch(() => null),
      ]);
      if (prog) setActiveProgram(prog);
      if (bdg) setBadges(bdg);
      if (wr) setWeeklyReport(wr);
      if (tm) setTeamData(tm);
      if (cat?.programs) setCatalog(cat.programs);
    } catch {} finally { setLoading(false); }
  };

  if (Platform.OS !== 'web') return <NativePageView path="/programs" />;

  const prog = activeProgram?.program;
  const earnedBadges = badges?.badges?.filter((b: any) => b.unlocked) || [];
  const allBadges = badges?.badges || [];
  const stats = badges?.stats || {};
  const report = weeklyReport?.report;
  const reportStats = weeklyReport?.stats;

  return (
    <div data-testid="programs-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", background: '#0a0f1a', overflowY: 'auto' } as any}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 20px 100px' } as any}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 } as any}>
          <div onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>Mon Programme</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Prevention personnalisee</div>
          </div>
        </div>

        {/* Active program details */}
        {activeProgram?.active && prog && (
          <>
            <div style={{ padding: '20px', borderRadius: 22, background: `${prog.color}08`, border: `1px solid ${prog.color}20`, marginBottom: 16 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${prog.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={prog.icon} style={{ fontSize: 26, color: prog.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{prog.title}</div>
                  <div style={{ fontSize: 12, color: prog.color, fontWeight: 600 }}>Jour {activeProgram.current_day}/{prog.duration_days}</div>
                </div>
              </div>
              {/* Progress */}
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 } as any}>
                <div style={{ height: 8, borderRadius: 4, width: `${activeProgram.progress_pct}%`, background: `linear-gradient(90deg, ${prog.color}80, ${prog.color})` } as any} />
              </div>
              {/* Phases */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 } as any}>
                {(prog.phases || []).map((ph: any, i: number) => {
                  const isCurrent = activeProgram.current_phase?.name === ph.name;
                  const isPast = activeProgram.current_day > ph.days[1];
                  return (
                    <div key={i} style={{ flex: 1, padding: '8px', borderRadius: 10, background: isCurrent ? `${prog.color}15` : isPast ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isCurrent ? `${prog.color}30` : isPast ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)'}`, textAlign: 'center' } as any}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? prog.color : isPast ? '#10B981' : 'rgba(255,255,255,0.2)' }}>{ph.name}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>J{ph.days[0]}-{ph.days[1]}</div>
                    </div>
                  );
                })}
              </div>
              {/* Today's tasks */}
              {activeProgram.today_tasks && (
                <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>{activeProgram.today_tasks.focus}</div>
                  {activeProgram.today_tasks.tasks?.map((task: string, ti: number) => (
                    <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 } as any}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{task}</span>
                    </div>
                  ))}
                  {activeProgram.today_tasks.tip && (
                    <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: `${prog.color}08`, border: `1px solid ${prog.color}15`, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' } as any}>
                      <i className="ri-lightbulb-line" style={{ marginRight: 6, color: prog.color }} />{activeProgram.today_tasks.tip}
                    </div>
                  )}
                </div>
              )}
              {/* Stop button */}
              <div onClick={async () => { try { await apiFetch('/api/programs/stop', { method: 'POST' }, token); loadData(); } catch {} }} style={{ marginTop: 14, padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(239,68,68,0.5)' } as any}>Arreter le programme</div>
            </div>
          </>
        )}

        {/* Streak & stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 } as any}>
          <div style={{ flex: 1, padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B' }}>{stats.max_streak || 0}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Meilleur streak</div>
          </div>
          <div style={{ flex: 1, padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#22D3EE' }}>{stats.total_checkins || 0}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Check-ins</div>
          </div>
          <div style={{ flex: 1, padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>{stats.programs_completed || 0}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Termines</div>
          </div>
        </div>

        {/* Badges */}
        <div style={{ marginBottom: 20 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Badges</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 } as any}>
            {allBadges.map((b: any) => (
              <div key={b.id} data-testid={`badge-${b.id}`} style={{ padding: '14px 8px', borderRadius: 16, background: b.unlocked ? `${b.color}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${b.unlocked ? `${b.color}25` : 'rgba(255,255,255,0.04)'}`, textAlign: 'center', opacity: b.unlocked ? 1 : 0.4 } as any}>
                <i className={b.icon} style={{ fontSize: 24, color: b.unlocked ? b.color : 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 6 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: b.unlocked ? '#FFF' : 'rgba(255,255,255,0.2)' }}>{b.title}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Report */}
        {report && (
          <div style={{ marginBottom: 20 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Bilan hebdomadaire</div>
            <div data-testid="weekly-report" style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>{report.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: 14 }}>{report.summary}</div>
              {/* Stats row */}
              {reportStats && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#22D3EE' }}>{reportStats.checkins_this_week}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Check-ins</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B' }}>{reportStats.avg_mood_this_week}/5</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Humeur moy.</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: reportStats.mood_trend === 'up' ? '#10B981' : reportStats.mood_trend === 'down' ? '#EF4444' : '#A78BFA' }}>
                      <i className={reportStats.mood_trend === 'up' ? 'ri-arrow-up-line' : reportStats.mood_trend === 'down' ? 'ri-arrow-down-line' : 'ri-equal-line'} />
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Tendance</div>
                  </div>
                </div>
              )}
              {/* Wins */}
              {report.wins?.length > 0 && (
                <div style={{ marginBottom: 10 } as any}>
                  {report.wins.map((w: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}>
                      <i className="ri-check-line" style={{ fontSize: 14, color: '#10B981' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{w}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Next week goal */}
              {report.next_week_goal && (
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 } as any}>
                  <i className="ri-focus-3-line" style={{ marginRight: 6, color: '#22D3EE' }} />{report.next_week_goal}
                </div>
              )}
              {report.motivation && (
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>"{report.motivation}"</div>
              )}
            </div>
          </div>
        )}

        {/* ── Share bilan button ── */}
        {weeklyReport?.report && (
          <div style={{ marginBottom: 16 } as any}>
            {shareMsg && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 10, fontSize: 12, color: '#10B981', textAlign: 'center' } as any}>{shareMsg}</div>}
            <div data-testid="share-bilan-btn" onClick={async () => {
              try {
                const res = await apiFetch('/api/programs/share-report', { method: 'POST' }, token);
                const url = window.location.origin + res.share_url;
                if (navigator.clipboard) { await navigator.clipboard.writeText(url); setShareMsg('Lien copie ! Valide 7 jours.'); }
                else setShareMsg(`Lien: ${url}`);
                setTimeout(() => setShareMsg(''), 5000);
              } catch { setShareMsg('Erreur lors du partage'); }
            }} style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 } as any}>
              <i className="ri-share-forward-line" style={{ fontSize: 18, color: '#22D3EE' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Partager mon bilan</span>
            </div>
          </div>
        )}

        {/* ── PROGRAMME CATALOG ── */}
        <div style={{ marginBottom: 20 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>{activeProgram?.active ? 'Autres programmes' : 'Programmes disponibles'}</div>
          {catalog.filter((p: any) => !activeProgram?.active || p.id !== activeProgram?.program?.id).map((p: any) => (
            <div key={p.id} data-testid={`catalog-${p.id}`} onClick={() => router.push({ pathname: '/program-detail' as any, params: { id: p.id } })}
              style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: `1px solid ${p.color}15`, marginBottom: 10, cursor: 'pointer', transition: 'transform 0.15s, background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 } as any}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={p.icon} style={{ fontSize: 24, color: p.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.subtitle}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} />
              </div>
              {/* Meta pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 } as any}>
                <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{p.duration_days} jours</span>
                {p.effort && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{p.effort}</span>}
                {p.difficulty && <span style={{ padding: '4px 10px', borderRadius: 99, background: `${p.color}10`, border: `1px solid ${p.color}20`, fontSize: 10, fontWeight: 600, color: p.color }}>{p.difficulty}</span>}
              </div>
              {/* Benefits preview */}
              {p.benefits && p.benefits.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 } as any}>
                  {p.benefits.slice(0, 2).map((b: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-check-line" style={{ fontSize: 12, color: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>{b}</span>
                    </div>
                  ))}
                  {p.benefits.length > 2 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 18 }}>+{p.benefits.length - 2} autres benefices</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── TEAM PROGRAMS ── */}
        <div style={{ marginBottom: 20 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Programme en equipe</div>

          {/* Active team */}
          {teamData?.has_team ? (
            <div style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 10 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className="ri-team-line" style={{ fontSize: 20, color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{teamData.program?.title}</div>
                  <div style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>
                    {teamData.status === 'waiting' ? `Debut dans ${teamData.days_until_start}j` : `Jour ${teamData.current_day}/${teamData.program?.duration_days}`}
                  </div>
                </div>
              </div>
              {/* Invite code */}
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                <div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Code d'invitation</div><div style={{ fontSize: 18, fontWeight: 900, color: '#A78BFA', letterSpacing: 2 }}>{teamData.invite_code}</div></div>
                <div onClick={() => { navigator.clipboard?.writeText(teamData.invite_code); }} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' } as any}>Copier</div>
              </div>
              {/* Members */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>Membres ({teamData.members?.length || 0})</div>
              {(teamData.members || []).map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: m.is_me ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: m.is_me ? '#22D3EE' : 'rgba(255,255,255,0.4)' }}>{m.name?.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{m.name} {m.is_me ? '(toi)' : ''}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{m.checkins_count} check-ins · Humeur {m.avg_mood}/5</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* No team - create or join */
            <div style={{ display: 'flex', gap: 10 } as any}>
              <div data-testid="create-team-btn" onClick={() => setShowTeamCreate(true)} style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center' } as any}>
                <i className="ri-add-circle-line" style={{ fontSize: 24, color: '#A78BFA', display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Creer une equipe</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Invite un ami beneficiaire</div>
              </div>
              <div data-testid="join-team-btn" onClick={() => setShowTeamJoin(true)} style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center' } as any}>
                <i className="ri-user-add-line" style={{ fontSize: 24, color: '#22D3EE', display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Rejoindre</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Avec un code d'invitation</div>
              </div>
            </div>
          )}
        </div>

        {/* ── CREATE TEAM POPUP ── */}
        {showTeamCreate && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, padding: '28px 24px' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
                <div onClick={() => { setShowTeamCreate(false); setTeamMsg(''); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} /></div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <i className="ri-team-line" style={{ fontSize: 36, color: '#A78BFA', display: 'block', marginBottom: 12 }} />
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Creer un programme en equipe</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Choisis un programme et une date de debut</div>
              </div>
              {/* Program selector */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>Programme</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 } as any}>
                {catalog.map((p: any) => (
                  <div key={p.id} onClick={() => setTeamProgId(p.id)} style={{ padding: '12px 14px', borderRadius: 14, background: teamProgId === p.id ? `${p.color}15` : 'rgba(255,255,255,0.03)', border: `1px solid ${teamProgId === p.id ? `${p.color}30` : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 } as any}>
                    <i className={p.icon} style={{ fontSize: 18, color: teamProgId === p.id ? p.color : 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: 13, fontWeight: teamProgId === p.id ? 700 : 500, color: teamProgId === p.id ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{p.title}</span>
                  </div>
                ))}
              </div>
              {/* Date picker */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8 }}>Date de debut</div>
              <input type="date" value={teamStartDate} onChange={(e: any) => setTeamStartDate(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark', marginBottom: 16 } as any} />
              {teamMsg && <div style={{ padding: '10px', borderRadius: 10, background: teamMsg.includes('Erreur') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${teamMsg.includes('Erreur') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, marginBottom: 12, fontSize: 12, color: '#FFF', textAlign: 'center' } as any}>{teamMsg}</div>}
              <div data-testid="create-team-submit" onClick={async () => {
                if (!teamProgId || !teamStartDate) { setTeamMsg('Choisis un programme et une date'); return; }
                try {
                  const res = await apiFetch('/api/programs/team/create', { method: 'POST', body: JSON.stringify({ program_id: teamProgId, start_date: teamStartDate }) }, token);
                  setTeamMsg(`Equipe creee ! Code: ${res.invite_code}. Partage ce code.`);
                  loadData();
                  setTimeout(() => { setShowTeamCreate(false); setTeamMsg(''); }, 3000);
                } catch (e: any) { setTeamMsg(`Erreur: ${e.message}`); }
              }} style={{ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(167,139,250,0.3)', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>
                Creer l'equipe
              </div>
            </div>
          </div>
        )}

        {/* ── JOIN TEAM POPUP ── */}
        {showTeamJoin && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, padding: '28px 24px' } as any}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
                <div onClick={() => { setShowTeamJoin(false); setTeamMsg(''); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} /></div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <i className="ri-user-add-line" style={{ fontSize: 36, color: '#22D3EE', display: 'block', marginBottom: 12 }} />
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Rejoindre une equipe</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Entre le code d'invitation de ton ami</div>
              </div>
              <input data-testid="join-code-input" value={teamInviteCode} onChange={(e: any) => setTeamInviteCode(e.target.value.toUpperCase())} placeholder="CODE"
                style={{ width: '100%', padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 22, fontWeight: 900, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', textAlign: 'center', letterSpacing: 4, marginBottom: 16 } as any} />
              {teamMsg && <div style={{ padding: '10px', borderRadius: 10, background: teamMsg.includes('Erreur') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${teamMsg.includes('Erreur') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, marginBottom: 12, fontSize: 12, color: '#FFF', textAlign: 'center' } as any}>{teamMsg}</div>}
              <div data-testid="join-team-submit" onClick={async () => {
                if (!teamInviteCode.trim()) return;
                try {
                  const res = await apiFetch('/api/programs/team/join', { method: 'POST', body: JSON.stringify({ invite_code: teamInviteCode.trim() }) }, token);
                  setTeamMsg(`Tu as rejoint l'equipe de ${res.creator_name} ! Programme: ${res.program.title}`);
                  loadData();
                  setTimeout(() => { setShowTeamJoin(false); setTeamMsg(''); setTeamInviteCode(''); }, 3000);
                } catch (e: any) { setTeamMsg(`Erreur: ${e.message}`); }
              }} style={{ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(14,116,144,0.1))', border: '1px solid rgba(34,211,238,0.3)', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>
                Rejoindre
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
