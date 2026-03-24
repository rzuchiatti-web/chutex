import React, { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';

const GL: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };
const C = { text: '#FFF', sub: 'rgba(255,255,255,0.5)', muted: 'rgba(255,255,255,0.25)', faint: 'rgba(255,255,255,0.08)', accent: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#EF4444', purple: '#A78BFA' };

const CATEGORIES: Record<string, { icon: string; label: string; color: string }> = {
  cardio: { icon: 'ri-heart-pulse-line', label: 'Cardio', color: C.red },
  renforcement: { icon: 'ri-boxing-line', label: 'Renforcement', color: C.amber },
  souplesse: { icon: 'ri-body-scan-line', label: 'Souplesse', color: C.purple },
  equilibre: { icon: 'ri-walk-line', label: 'Equilibre', color: C.accent },
  reeducation: { icon: 'ri-heart-add-line', label: 'Reeducation', color: C.green },
};

/* ── Section Label ── */
function SL({ children, icon, color }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' } as any}>
      {icon && <i className={icon} style={{ fontSize: 14, color: color || C.muted }} />}
      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 } as any}>{children}</span>
    </div>
  );
}

/* ── Exercise Card ── */
function ExerciseCard({ ex, onDelete }: any) {
  const cat = CATEGORIES[ex.category] || CATEGORIES.renforcement;
  const completions = ex.completions || [];
  const lastDone = completions.length > 0 ? completions[completions.length - 1] : null;
  return (
    <div data-testid={`exercise-${ex.id}`} style={{ ...GL, padding: '16px', marginBottom: 8, position: 'relative' } as any}>
      <div style={{ display: 'flex', gap: 12 } as any}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cat.color}15`, border: `1px solid ${cat.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <i className={cat.icon} style={{ fontSize: 22, color: cat.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{ex.title}</div>
          {ex.description && <div style={{ fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{ex.description}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 } as any}>
            {ex.sets > 0 && <span style={{ fontSize: 10, color: C.muted, background: C.faint, padding: '3px 8px', borderRadius: 6 }}>{ex.sets} series</span>}
            {ex.repetitions > 0 && <span style={{ fontSize: 10, color: C.muted, background: C.faint, padding: '3px 8px', borderRadius: 6 }}>{ex.repetitions} reps</span>}
            {ex.duration_min > 0 && <span style={{ fontSize: 10, color: C.muted, background: C.faint, padding: '3px 8px', borderRadius: 6 }}>{ex.duration_min} min</span>}
            {ex.rest_sec > 0 && <span style={{ fontSize: 10, color: C.muted, background: C.faint, padding: '3px 8px', borderRadius: 6 }}>{ex.rest_sec}s repos</span>}
          </div>
        </div>
        {/* Status + delete */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 } as any}>
          {lastDone ? (
            <div style={{ padding: '3px 8px', borderRadius: 8, background: lastDone.status === 'done' ? `${C.green}15` : `${C.amber}15`, border: `1px solid ${lastDone.status === 'done' ? `${C.green}30` : `${C.amber}30`}` }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: lastDone.status === 'done' ? C.green : C.amber }}>{lastDone.status === 'done' ? 'Fait' : lastDone.status === 'partial' ? 'Partiel' : 'Passe'}</span>
            </div>
          ) : (
            <div style={{ padding: '3px 8px', borderRadius: 8, background: C.faint }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.muted }}>En attente</span>
            </div>
          )}
          <div onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-delete-bin-line" style={{ fontSize: 12, color: C.red }} />
          </div>
        </div>
      </div>
      {/* Pain level for physio */}
      {lastDone && lastDone.pain_level != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 10, background: C.faint } as any}>
          <i className="ri-emotion-sad-line" style={{ fontSize: 12, color: C.amber }} />
          <span style={{ fontSize: 10, color: C.sub }}>Douleur: {lastDone.pain_level}/10</span>
          {lastDone.patient_notes && <span style={{ fontSize: 10, color: C.muted, marginLeft: 8 }}>"{lastDone.patient_notes}"</span>}
        </div>
      )}
    </div>
  );
}

export default function ProSpace({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [activeBen, setActiveBen] = useState<string>('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null); // program_id
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [progForm, setProgForm] = useState({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 4, category: 'renforcement' });
  const [exForm, setExForm] = useState({ title: '', description: '', category: 'renforcement', duration_min: 0, repetitions: 0, sets: 0, rest_sec: 0, media_url: '', media_type: '' });

  const proType = user?.professional_type || 'coach';
  const isPhysio = proType === 'physio';

  const fetchBens = useCallback(async () => {
    try {
      const bens = await apiFetch('/api/pro/beneficiaries', {}, token);
      setBeneficiaries(bens);
      if (bens.length > 0 && !activeBen) setActiveBen(bens[0].id);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  const fetchPrograms = useCallback(async () => {
    if (!activeBen) return;
    try {
      const progs = await apiFetch(`/api/pro/programs/${activeBen}`, {}, token);
      setPrograms(progs);
    } catch { setPrograms([]); }
  }, [token, activeBen]);

  useEffect(() => { fetchBens(); }, [fetchBens]);
  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);

  const createProgram = async () => {
    if (!progForm.title || !activeBen) return;
    setSaving(true);
    try {
      await apiFetch(`/api/pro/programs/${activeBen}`, { method: 'POST', body: JSON.stringify(progForm) }, token);
      setShowNewProgram(false);
      setProgForm({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 4, category: 'renforcement' });
      fetchPrograms();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const addExercise = async (programId: string) => {
    if (!exForm.title) return;
    setSaving(true);
    try {
      await apiFetch(`/api/pro/programs/${programId}/sessions`, { method: 'POST', body: JSON.stringify(exForm) }, token);
      setShowAddExercise(null);
      setExForm({ title: '', description: '', category: 'renforcement', duration_min: 0, repetitions: 0, sets: 0, rest_sec: 0, media_url: '', media_type: '' });
      fetchPrograms();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const deleteExercise = async (programId: string, sessionId: string) => {
    try {
      await apiFetch(`/api/pro/sessions/${programId}/${sessionId}`, { method: 'DELETE' }, token);
      fetchPrograms();
    } catch {}
  };

  const deleteProgram = async (programId: string) => {
    try {
      await apiFetch(`/api/pro/programs/edit/${programId}`, { method: 'DELETE' }, token);
      fetchPrograms();
    } catch {}
  };

  if (loading) return <FullScreenLoader />;
  if (Platform.OS !== 'web') return null;

  const activeBenData = beneficiaries.find(b => b.id === activeBen);
  const v = activeBenData?.latest_vitals || {};

  return (
    <div data-testid="pro-space" style={{ position: 'absolute', inset: 0, background: '#0A0A12', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' } as any}>

      {/* Header */}
      <div style={{ padding: '16px 20px 0', flexShrink: 0 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } as any}>
          <i className={isPhysio ? 'ri-stethoscope-line' : 'ri-run-line'} style={{ fontSize: 13, color: C.accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: 1 } as any}>{isPhysio ? 'Espace Kine' : 'Espace Coach'}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Programmes</div>
      </div>

      {/* Patient selector */}
      <div style={{ padding: '12px 20px', flexShrink: 0 } as any}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 } as any}>
          {beneficiaries.map((b) => {
            const sel = b.id === activeBen;
            return (
              <div key={b.id} data-testid={`patient-pill-${b.id}`} onClick={() => setActiveBen(b.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, flexShrink: 0, cursor: 'pointer',
                  background: sel ? 'rgba(59,130,246,0.12)' : C.faint, border: `1.5px solid ${sel ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                  transition: 'all 0.15s',
                } as any}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: sel ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: sel ? C.accent : C.muted } as any}>
                  {(b.name || '?')[0]}
                </div>
                <span style={{ fontSize: 13, fontWeight: sel ? 700 : 500, color: sel ? C.text : C.sub }}>{(b.name || 'Patient').split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Quick vitals of selected patient */}
        {activeBenData && (
          <div style={{ ...GL, padding: '14px 16px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
            <div style={{ display: 'flex', gap: 16 } as any}>
              {v.heart_rate && <div style={{ textAlign: 'center' } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 14, color: C.red }} /><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{v.heart_rate}</div><div style={{ fontSize: 9, color: C.muted }}>BPM</div></div>}
              {v.spo2 && <div style={{ textAlign: 'center' } as any}><i className="ri-drop-line" style={{ fontSize: 14, color: C.accent }} /><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{v.spo2}%</div><div style={{ fontSize: 9, color: C.muted }}>SpO2</div></div>}
              {v.temperature > 30 && <div style={{ textAlign: 'center' } as any}><i className="ri-temp-hot-line" style={{ fontSize: 14, color: C.amber }} /><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{v.temperature}</div><div style={{ fontSize: 9, color: C.muted }}>Temp</div></div>}
              {v.steps > 0 && <div style={{ textAlign: 'center' } as any}><i className="ri-footprint-line" style={{ fontSize: 14, color: C.green }} /><div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{v.steps}</div><div style={{ fontSize: 9, color: C.muted }}>Pas</div></div>}
            </div>
            <div onClick={() => router.push({ pathname: '/beneficiary-detail' as any, params: { id: activeBen } })} style={{ padding: '8px 14px', borderRadius: 999, background: C.faint, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>Fiche</span>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: C.muted }} />
            </div>
          </div>
        )}

        {/* Programs list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
          <SL icon="ri-file-list-3-line" color={C.accent}>Programmes actifs</SL>
          <div data-testid="new-program-btn" onClick={() => setShowNewProgram(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer' } as any}>
            <i className="ri-add-line" style={{ fontSize: 14, color: C.accent }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent }}>Programme</span>
          </div>
        </div>

        {programs.length === 0 && (
          <div style={{ ...GL, padding: '40px 20px', textAlign: 'center', marginTop: 8 } as any}>
            <i className="ri-file-add-line" style={{ fontSize: 32, color: C.muted, marginBottom: 8, display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Aucun programme pour ce patient</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Creez un programme avec des exercices adaptes</div>
          </div>
        )}

        {programs.map((prog) => {
          const sessions = prog.sessions || [];
          const cat = CATEGORIES[prog.category] || CATEGORIES.renforcement;
          const doneCount = sessions.filter((s: any) => (s.completions || []).some((c: any) => c.status === 'done')).length;
          return (
            <div key={prog.id} data-testid={`program-${prog.id}`} style={{ marginBottom: 16 }}>
              {/* Program header */}
              <div style={{ ...GL, padding: '16px', marginTop: 8 } as any}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' } as any}>
                  <div style={{ display: 'flex', gap: 10, flex: 1 } as any}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${cat.color}12`, border: `1px solid ${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className={cat.icon} style={{ fontSize: 18, color: cat.color }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{prog.title}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{prog.frequency} — {prog.duration_weeks} semaines</div>
                      {prog.description && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{prog.description}</div>}
                    </div>
                  </div>
                  <div onClick={() => deleteProgram(prog.id)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
                    <i className="ri-delete-bin-line" style={{ fontSize: 14, color: C.red }} />
                  </div>
                </div>
                {/* Progress bar */}
                {sessions.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 } as any}>
                      <span style={{ fontSize: 10, color: C.muted }}>{doneCount}/{sessions.length} exercices valides</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sessions.length > 0 ? C.green : C.muted }}>{sessions.length > 0 ? Math.round(doneCount / sessions.length * 100) : 0}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: C.faint, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: C.green, width: `${sessions.length > 0 ? (doneCount / sessions.length * 100) : 0}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Sessions/Exercises */}
              <div style={{ paddingLeft: 4, marginTop: 6 }}>
                {sessions.map((ex: any) => (
                  <ExerciseCard key={ex.id} ex={ex} onDelete={() => deleteExercise(prog.id, ex.id)} />
                ))}
                {/* Add exercise button */}
                <div data-testid={`add-exercise-${prog.id}`} onClick={() => { setShowAddExercise(prog.id); setExForm({ ...exForm, category: prog.category }); }}
                  style={{ ...GL, padding: '12px 16px', marginBottom: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.6, transition: 'opacity 0.15s' } as any}
                  onMouseEnter={(e: any) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e: any) => e.currentTarget.style.opacity = '0.6'}>
                  <i className="ri-add-circle-line" style={{ fontSize: 16, color: C.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>Ajouter un exercice</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal: New Program ── */}
      {showNewProgram && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowNewProgram(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#12121E', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 18 }}>Nouveau programme</div>
            <input data-testid="prog-title" value={progForm.title} onChange={(e) => setProgForm({ ...progForm, title: e.target.value })} placeholder="Nom du programme" style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10 } as any} />
            <textarea value={progForm.description} onChange={(e) => setProgForm({ ...progForm, description: e.target.value })} placeholder="Description / objectif..." style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', minHeight: 60, resize: 'vertical', marginBottom: 10 } as any} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 } as any}>
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const sel = progForm.category === key;
                return <div key={key} onClick={() => setProgForm({ ...progForm, category: key })} style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 600, background: sel ? `${cat.color}15` : C.faint, border: `1px solid ${sel ? `${cat.color}30` : 'transparent'}`, color: sel ? cat.color : C.muted } as any}><i className={cat.icon} style={{ fontSize: 11, marginRight: 4 }} />{cat.label}</div>;
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
              <input value={progForm.frequency} onChange={(e) => setProgForm({ ...progForm, frequency: e.target.value })} placeholder="Frequence" style={{ flex: 1, padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none' } as any} />
              <input type="number" value={progForm.duration_weeks} onChange={(e) => setProgForm({ ...progForm, duration_weeks: parseInt(e.target.value) || 1 })} style={{ width: 80, padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', textAlign: 'center' } as any} />
              <span style={{ alignSelf: 'center', fontSize: 12, color: C.muted }}>sem.</span>
            </div>
            <div data-testid="submit-program" onClick={saving ? undefined : createProgram} style={{ padding: '15px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: progForm.title ? C.accent : C.faint, color: progForm.title ? '#FFF' : C.muted, fontSize: 14, fontWeight: 800, opacity: saving ? 0.5 : 1 } as any}>{saving ? 'Creation...' : 'Creer le programme'}</div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Exercise ── */}
      {showAddExercise && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowAddExercise(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#12121E', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 18 }}>Ajouter un exercice</div>
            <input data-testid="ex-title" value={exForm.title} onChange={(e) => setExForm({ ...exForm, title: e.target.value })} placeholder="Nom de l'exercice" style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10 } as any} />
            <textarea value={exForm.description} onChange={(e) => setExForm({ ...exForm, description: e.target.value })} placeholder="Instructions, consignes..." style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', minHeight: 60, resize: 'vertical', marginBottom: 10 } as any} />
            <input value={exForm.media_url} onChange={(e) => setExForm({ ...exForm, media_url: e.target.value, media_type: 'video' })} placeholder="URL video/image (optionnel)" style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10 } as any} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 } as any}>
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const sel = exForm.category === key;
                return <div key={key} onClick={() => setExForm({ ...exForm, category: key })} style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 600, background: sel ? `${cat.color}15` : C.faint, border: `1px solid ${sel ? `${cat.color}30` : 'transparent'}`, color: sel ? cat.color : C.muted } as any}><i className={cat.icon} style={{ fontSize: 11, marginRight: 4 }} />{cat.label}</div>;
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 } as any}>
              <div>
                <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 } as any}>Series</label>
                <input type="number" value={exForm.sets || ''} onChange={(e) => setExForm({ ...exForm, sets: parseInt(e.target.value) || 0 })} placeholder="0" style={{ width: '100%', padding: '11px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', textAlign: 'center' } as any} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 } as any}>Repetitions</label>
                <input type="number" value={exForm.repetitions || ''} onChange={(e) => setExForm({ ...exForm, repetitions: parseInt(e.target.value) || 0 })} placeholder="0" style={{ width: '100%', padding: '11px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', textAlign: 'center' } as any} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 } as any}>Duree (min)</label>
                <input type="number" value={exForm.duration_min || ''} onChange={(e) => setExForm({ ...exForm, duration_min: parseInt(e.target.value) || 0 })} placeholder="0" style={{ width: '100%', padding: '11px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', textAlign: 'center' } as any} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 } as any}>Repos (sec)</label>
                <input type="number" value={exForm.rest_sec || ''} onChange={(e) => setExForm({ ...exForm, rest_sec: parseInt(e.target.value) || 0 })} placeholder="0" style={{ width: '100%', padding: '11px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', textAlign: 'center' } as any} />
              </div>
            </div>
            <div data-testid="submit-exercise" onClick={saving ? undefined : () => addExercise(showAddExercise)} style={{ padding: '15px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: exForm.title ? C.green : C.faint, color: exForm.title ? '#FFF' : C.muted, fontSize: 14, fontWeight: 800, opacity: saving ? 0.5 : 1 } as any}>{saving ? 'Ajout...' : 'Ajouter l\'exercice'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
