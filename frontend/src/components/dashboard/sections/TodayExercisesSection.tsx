import React from 'react';
import { useRouter } from 'expo-router';

export function TodayExercisesSection({ todayExercises, C, glass }: any) {
  const router = useRouter();
  const exDoneCount = todayExercises.filter((e: any) => e.completed_today).length;
  const exAllDone = exDoneCount >= todayExercises.length;
  const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  return (
    <div data-testid="today-exercises-dashboard" className="dash-slide-up" style={{ marginBottom: 28 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' } as any}>Mes exercices</div>
        <span style={{ fontSize: 13, fontWeight: 800, color: exAllDone ? '#10B981' : C.text, background: exAllDone ? 'rgba(16,185,129,0.12)' : C.card, padding: '4px 12px', borderRadius: 999 }}>{exDoneCount}/{todayExercises.length}</span>
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: '1.45' } as any}>Vos exercices a realiser aujourd'hui.</div>
      {todayExercises.map((ex: any, i: number) => {
        const done = ex.completed_today;
        const todayStr = new Date().toISOString().split('T')[0];
        const lastCompletion = (ex.completions || []).filter((c: any) => c.date?.startsWith(todayStr) && c.status === 'done').slice(-1)[0];
        const exImg = ex.image ? (ex.image.startsWith('/') ? `${API}${ex.image}` : ex.image) : null;
        const painLvl = lastCompletion?.pain_level || 0;
        const painColor = painLvl <= 3 ? '#10B981' : painLvl <= 6 ? '#F59E0B' : '#EF4444';
        return (
          <div key={ex.id || i} data-testid={`dash-exercise-${i}`}
            onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
            style={{ borderRadius: 14, background: done ? 'rgba(16,185,129,0.08)' : C.card, overflow: 'hidden', cursor: 'pointer', marginBottom: 8, opacity: done ? 0.85 : 1 } as any}>
            <div style={{ display: 'flex', minHeight: 72 } as any}>
              <div style={{ width: 80, flexShrink: 0, position: 'relative', overflow: 'hidden' } as any}>
                {exImg ? <img src={exImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} /> :
                <div style={{ position: 'absolute', inset: 0, background: done ? 'rgba(16,185,129,0.15)' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className={ex.icon || 'ri-run-line'} style={{ fontSize: 24, color: done ? '#10B981' : '#EF4444' }} /></div>}
              </div>
              <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 }}>{ex.category || 'Exercice'}</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: done ? '#10B981' : C.text, marginTop: 2 }}>{ex.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 } as any}>
                  <span style={{ fontSize: 11, color: done ? 'rgba(16,185,129,0.6)' : '#6B7280' }}>{ex.sets}x{ex.repetitions} reps</span>
                  {ex.rest_seconds > 0 && <span style={{ fontSize: 10, color: '#9CA3AF' }}>{ex.rest_seconds}s repos</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, paddingRight: 10 } as any}>
                {done && <i className="ri-checkbox-circle-fill" style={{ fontSize: 18, color: '#10B981' }} />}
                {!done && <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#9CA3AF' }} />}
              </div>
            </div>
            {done && lastCompletion && (painLvl > 0 || lastCompletion.patient_notes) && (
              <div style={{ padding: '8px 12px 10px', borderTop: '1px solid rgba(16,185,129,0.12)' } as any}>
                {painLvl > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: lastCompletion.patient_notes ? 6 : 0 } as any}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', flexShrink: 0 }}>Douleur</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' } as any}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${painLvl * 10}%`, background: painColor } as any} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: painColor, flexShrink: 0 }}>{painLvl}/10</span>
                  </div>
                )}
                {lastCompletion.patient_notes && (
                  <div style={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as any}>"{lastCompletion.patient_notes}"</div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div onClick={() => router.push('/activity-detail' as any)} data-testid="view-activity-btn" style={{ marginTop: 12, padding: '14px', borderRadius: 999, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#FFF', transition: 'opacity 0.15s' } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1'; }}>
        Voir mon activite
      </div>
    </div>
  );
}
