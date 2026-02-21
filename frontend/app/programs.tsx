import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';

export default function ProgramsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [badges, setBadges] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prog, bdg, wr] = await Promise.all([
        apiFetch('/api/programs/active', {}, token).catch(() => null),
        apiFetch('/api/programs/badges', {}, token).catch(() => null),
        apiFetch('/api/programs/weekly-report', {}, token).catch(() => null),
      ]);
      if (prog) setActiveProgram(prog);
      if (bdg) setBadges(bdg);
      if (wr) setWeeklyReport(wr);
    } catch {} finally { setLoading(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f16' }}><Text style={{ color: '#FFF' }}>Programmes</Text></View>;

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
      </div>
    </div>
  );
}
