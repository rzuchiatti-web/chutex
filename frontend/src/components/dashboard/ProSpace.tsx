import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const apiFetch = async (url: string, opts: any = {}, token: string) => {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || r.statusText);
  return r.json();
};

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

export default function ProSpace({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const proType = user?.professional_type || '';
  const isCoach = proType === 'coach';
  const isPhysio = proType === 'physio';
  const AC = isCoach ? '#DC2626' : isPhysio ? '#F97316' : '#3B82F6';

  const [bens, setBens] = useState<any[]>([]);
  const [activeBen, setActiveBen] = useState<string>('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [view, setView] = useState<'patients' | 'library'>('patients');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showNewProg, setShowNewProg] = useState(false);
  const [showNewExercise, setShowNewExercise] = useState<string | null>(null);
  const [showNewReminder, setShowNewReminder] = useState(false);
  const [showNewMeal, setShowNewMeal] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState<any>(null);

  // Forms
  const [progForm, setProgForm] = useState({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 8, category: 'general' });
  const [exForm, setExForm] = useState({ title: '', description: '', sets: 3, reps: 12, duration_minutes: 0, video_url: '' });
  const [remForm, setRemForm] = useState({ reminder_type: 'medication', title: '', time: '08:00', days: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'], notes: '', dosage: '' });
  const [mealForm, setMealForm] = useState({ meal_type: 'dejeuner', items: '', calories: 0, proteins: 0, notes: '' });

  const fetchBens = useCallback(async () => {
    try {
      const b = await apiFetch('/api/guardian/beneficiaries', {}, token);
      setBens(Array.isArray(b) ? b : []);
      if (b.length > 0 && !activeBen) setActiveBen(b[0].id);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchBens(); }, [fetchBens]);

  // Fetch all programs for library
  useEffect(() => {
    if (token) apiFetch('/api/pro/all-programs', {}, token).then(p => setAllPrograms(Array.isArray(p) ? p : [])).catch(() => {});
  }, [token, saving]);

  // Fetch data for selected beneficiary
  useEffect(() => {
    if (!activeBen || !token) return;
    Promise.all([
      apiFetch(`/api/pro/programs/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/reminders/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/meals/${activeBen}`, {}, token).catch(() => []),
    ]).then(([p, r, m]) => {
      setPrograms(Array.isArray(p) ? p : []);
      setReminders(Array.isArray(r) ? r : []);
      setMeals(Array.isArray(m) ? m : []);
    });
  }, [activeBen, token, saving]);

  const activeBenData = bens.find(b => b.id === activeBen);

  const createProgram = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/pro/programs/${activeBen}`, { method: 'POST', body: JSON.stringify(progForm) }, token);
      setShowNewProg(false);
      setProgForm({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 8, category: 'general' });
    } catch {} finally { setSaving(false); }
  };

  const addExercise = async (progId: string) => {
    setSaving(true);
    try {
      await apiFetch(`/api/pro/programs/${progId}/sessions`, { method: 'POST', body: JSON.stringify(exForm) }, token);
      setShowNewExercise(null);
      setExForm({ title: '', description: '', sets: 3, reps: 12, duration_minutes: 0, video_url: '' });
    } catch {} finally { setSaving(false); }
  };

  const createReminder = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/pro/reminders/${activeBen}`, { method: 'POST', body: JSON.stringify(remForm) }, token);
      setShowNewReminder(false);
      setRemForm({ reminder_type: 'medication', title: '', time: '08:00', days: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'], notes: '', dosage: '' });
    } catch {} finally { setSaving(false); }
  };

  const createMeal = async () => {
    setSaving(true);
    try {
      const itemsArr = mealForm.items.split(',').map(i => i.trim()).filter(Boolean);
      await apiFetch(`/api/pro/meals/${activeBen}`, { method: 'POST', body: JSON.stringify({ ...mealForm, items: itemsArr }) }, token);
      setShowNewMeal(false);
      setMealForm({ meal_type: 'dejeuner', items: '', calories: 0, proteins: 0, notes: '' });
    } catch {} finally { setSaving(false); }
  };

  const duplicateProgram = async (progId: string, targetBenId: string) => {
    setSaving(true);
    try {
      await apiFetch(`/api/pro/programs/duplicate/${progId}/${targetBenId}`, { method: 'POST' }, token);
      setShowDuplicate(null);
    } catch {} finally { setSaving(false); }
  };

  const deleteProgram = async (id: string) => {
    try { await apiFetch(`/api/pro/programs/edit/${id}`, { method: 'DELETE' }, token); setSaving(s => !s); } catch {}
  };

  const deleteReminder = async (id: string) => {
    try { await apiFetch(`/api/pro/reminders/${id}`, { method: 'DELETE' }, token); setSaving(s => !s); } catch {}
  };

  // Unique programs for library (group by title)
  const uniquePrograms = allPrograms.reduce((acc: any[], p) => {
    if (!acc.find(x => x.title === p.title)) acc.push(p);
    return acc;
  }, []);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF', fontFamily: 'Inter, system-ui, sans-serif' } as any}><i className="ri-loader-4-line ri-spin" style={{ fontSize: 32 }} /></div>;

  const INP: any = { width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const LBL: any = { fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 };
  const BTN = (active: boolean): any => ({ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: active ? 'pointer' : 'default', background: active ? AC : '#E5E7EB', color: active ? '#FFF' : '#9CA3AF', fontSize: 14, fontWeight: 800, opacity: saving ? 0.6 : 1, transition: 'all 0.15s' });

  return (
    <div data-testid="pro-space" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── HEADER ── */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '22px 20px 32px' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className={isPhysio ? 'ri-stethoscope-line' : isCoach ? 'ri-run-line' : 'ri-shield-user-line'} style={{ fontSize: 22, color: '#FFF' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{isPhysio ? 'Espace Kine' : isCoach ? 'Espace Coach' : 'Activite'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{bens.length} patient{bens.length !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* View toggle + Patient pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 } as any}>
              {[{ k: 'patients', icon: 'ri-group-line', l: 'Patients' }, { k: 'library', icon: 'ri-book-2-line', l: 'Bibliotheque' }].map(v => (
                <div key={v.k} data-testid={`view-${v.k}`} onClick={() => setView(v.k as any)}
                  style={{ padding: '7px 14px', borderRadius: 999, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    background: view === v.k ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                    border: `1.5px solid ${view === v.k ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  } as any}>
                  <i className={v.icon} style={{ fontSize: 13, color: '#FFF' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: view === v.k ? '#FFF' : 'rgba(255,255,255,0.7)' }}>{v.l}</span>
                </div>
              ))}
            </div>

            {view === 'patients' && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 } as any}>
                {bens.map(b => {
                  const sel = b.id === activeBen;
                  return (
                    <div key={b.id} data-testid={`ben-${b.id}`} onClick={() => setActiveBen(b.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 999, flexShrink: 0, cursor: 'pointer',
                        background: sel ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                        border: `1.5px solid ${sel ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      } as any}>
                      <div style={{ width: 26, height: 26, borderRadius: 999, background: sel ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#FFF' } as any}>
                        {(b.name || '?')[0]}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? '#FFF' : 'rgba(255,255,255,0.7)' }}>{(b.name || 'Patient').split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── CONTENT CARD ── */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 220px)' } as any}>

          {/* ════ PATIENT VIEW ════ */}
          {view === 'patients' && activeBenData && (
            <>
              {/* Quick action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 } as any}>
                {[
                  { icon: 'ri-file-list-3-line', label: 'Programme', color: '#3B82F6', action: () => setShowNewProg(true) },
                  { icon: 'ri-capsule-line', label: 'Rappel', color: '#10B981', action: () => setShowNewReminder(true) },
                  { icon: 'ri-restaurant-line', label: 'Repas', color: '#F59E0B', action: () => setShowNewMeal(true) },
                ].map((a, i) => (
                  <div key={i} data-testid={`quick-${a.label.toLowerCase()}`} onClick={a.action}
                    style={{ padding: '16px 10px', borderRadius: 16, background: `${a.color}08`, border: `1.5px solid ${a.color}20`, cursor: 'pointer', textAlign: 'center', transition: 'transform 0.1s' } as any}>
                    <i className={a.icon} style={{ fontSize: 22, color: a.color, display: 'block', marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{a.label}</div>
                  </div>
                ))}
              </div>

              {/* ── PROGRAMS SECTION ── */}
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Programmes ({programs.length})</div>
                </div>
                {programs.length === 0 ? (
                  <div style={{ padding: '24px 16px', borderRadius: 16, background: '#F9FAFB', textAlign: 'center' } as any}>
                    <i className="ri-file-list-3-line" style={{ fontSize: 28, color: '#D1D5DB', display: 'block', marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun programme pour {activeBenData.name?.split(' ')[0]}</div>
                    <div data-testid="add-first-prog" onClick={() => setShowNewProg(true)} style={{ fontSize: 12, fontWeight: 700, color: AC, cursor: 'pointer', marginTop: 6 }}>+ Creer un programme</div>
                  </div>
                ) : (
                  programs.map(prog => (
                    <div key={prog.id} data-testid={`prog-${prog.id}`} style={{ borderRadius: 16, border: '1.5px solid #E5E7EB', marginBottom: 10, overflow: 'hidden' } as any}>
                      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{prog.title}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{prog.frequency} - {prog.duration_weeks} sem. - {prog.sessions?.length || 0} exercice{(prog.sessions?.length || 0) !== 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 } as any}>
                          <div data-testid={`dup-prog-${prog.id}`} onClick={() => setShowDuplicate(prog)} title="Dupliquer"
                            style={{ width: 32, height: 32, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                            <i className="ri-file-copy-line" style={{ fontSize: 14, color: '#6B7280' }} />
                          </div>
                          <div data-testid={`add-ex-${prog.id}`} onClick={() => setShowNewExercise(prog.id)} title="Ajouter exercice"
                            style={{ width: 32, height: 32, borderRadius: 10, background: `${AC}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                            <i className="ri-add-line" style={{ fontSize: 16, color: AC }} />
                          </div>
                          <div onClick={() => deleteProgram(prog.id)} title="Supprimer"
                            style={{ width: 32, height: 32, borderRadius: 10, background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                            <i className="ri-delete-bin-line" style={{ fontSize: 14, color: '#EF4444' }} />
                          </div>
                        </div>
                      </div>
                      {prog.sessions?.length > 0 && (
                        <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 16px' } as any}>
                          {prog.sessions.map((s: any, i: number) => (
                            <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < prog.sessions.length - 1 ? '1px solid #F9FAFB' : 'none' } as any}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: s.completed ? '#D1FAE5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                                <i className={s.completed ? 'ri-check-line' : 'ri-run-line'} style={{ fontSize: 13, color: s.completed ? '#10B981' : '#9CA3AF' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{s.title}</div>
                                {(s.sets || s.reps) && <div style={{ fontSize: 10, color: '#9CA3AF' }}>{s.sets} x {s.reps} reps</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* ── REMINDERS SECTION ── */}
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Rappels ({reminders.length})</div>
                </div>
                {reminders.length === 0 ? (
                  <div style={{ padding: '20px 16px', borderRadius: 16, background: '#F9FAFB', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun rappel</div>
                  </div>
                ) : (
                  reminders.map(rem => (
                    <div key={rem.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1.5px solid #E5E7EB', marginBottom: 8 } as any}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: rem.reminder_type === 'hydration' ? '#DBEAFE' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                        <i className={rem.reminder_type === 'hydration' ? 'ri-drop-line' : 'ri-capsule-line'} style={{ fontSize: 16, color: rem.reminder_type === 'hydration' ? '#3B82F6' : '#10B981' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{rem.title}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{rem.time} - {rem.dosage || rem.days?.join(', ')}</div>
                      </div>
                      <div onClick={() => deleteReminder(rem.id)} style={{ cursor: 'pointer', padding: 4 } as any}>
                        <i className="ri-close-line" style={{ fontSize: 16, color: '#D1D5DB' }} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── MEALS SECTION ── */}
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Repas ({meals.length})</div>
                </div>
                {meals.length === 0 ? (
                  <div style={{ padding: '20px 16px', borderRadius: 16, background: '#F9FAFB', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun plan de repas</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 } as any}>
                    {meals.map((m, i) => (
                      <div key={i} style={{ padding: '12px 14px', borderRadius: 14, border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                          <i className="ri-restaurant-line" style={{ fontSize: 16, color: '#F59E0B' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{m.meal_type}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{Array.isArray(m.items) ? m.items.join(', ') : m.items}{m.calories ? ` - ${m.calories} kcal` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ════ LIBRARY VIEW ════ */}
          {view === 'library' && (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 4 }}>Bibliotheque de programmes</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Vos programmes existants. Dupliquez-les en un clic pour un autre patient.</div>
              {uniquePrograms.length === 0 ? (
                <div style={{ padding: '40px 16px', borderRadius: 16, background: '#F9FAFB', textAlign: 'center' } as any}>
                  <i className="ri-book-2-line" style={{ fontSize: 36, color: '#D1D5DB', display: 'block', marginBottom: 10 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>Bibliotheque vide</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Creez un programme pour un patient, il apparaitra ici automatiquement.</div>
                </div>
              ) : (
                uniquePrograms.map(prog => (
                  <div key={prog.id} style={{ borderRadius: 16, border: '1.5px solid #E5E7EB', marginBottom: 10, padding: '14px 16px' } as any}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } as any}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{prog.title}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{prog.frequency} - {prog.duration_weeks} sem. - {prog.sessions?.length || 0} exercices</div>
                        {prog.description && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>{prog.description}</div>}
                        <div style={{ fontSize: 10, color: '#D1D5DB', marginTop: 6 }}>Cree pour {prog.beneficiary_name || 'patient'}</div>
                      </div>
                      <div data-testid={`lib-dup-${prog.id}`} onClick={() => setShowDuplicate(prog)}
                        style={{ padding: '8px 14px', borderRadius: 10, background: `${AC}08`, border: `1.5px solid ${AC}20`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } as any}>
                        <i className="ri-file-copy-line" style={{ fontSize: 13, color: AC }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: AC }}>Attribuer</span>
                      </div>
                    </div>
                    {prog.sessions?.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' } as any}>
                        {prog.sessions.map((s: any, i: number) => (
                          <span key={i} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 999, background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>{s.title}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* No beneficiary state */}
          {view === 'patients' && !activeBenData && bens.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' } as any}>
              <i className="ri-user-add-line" style={{ fontSize: 48, color: '#D1D5DB', display: 'block', marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>Aucun patient</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>Vos patients apparaitront ici lorsqu'ils souscriront a un abonnement {isCoach ? 'Sport' : isPhysio ? 'Physio' : ''} via leur gardien.</div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* New Program */}
      {showNewProg && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowNewProg(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#FFF', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 18 }}>Nouveau programme pour {activeBenData?.name?.split(' ')[0]}</div>
            <div style={{ marginBottom: 12 }}><label style={LBL}>Nom du programme</label><input data-testid="prog-title" value={progForm.title} onChange={e => setProgForm({ ...progForm, title: e.target.value })} placeholder="Ex: Renforcement musculaire" style={INP} /></div>
            <div style={{ marginBottom: 12 }}><label style={LBL}>Description</label><textarea value={progForm.description} onChange={e => setProgForm({ ...progForm, description: e.target.value })} placeholder="Objectifs, consignes..." style={{ ...INP, minHeight: 60, resize: 'vertical' } as any} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Frequence</label><input value={progForm.frequency} onChange={e => setProgForm({ ...progForm, frequency: e.target.value })} placeholder="3x/semaine" style={INP} /></div>
              <div style={{ width: 90 }}><label style={LBL}>Duree (sem.)</label><input type="number" value={progForm.duration_weeks} onChange={e => setProgForm({ ...progForm, duration_weeks: parseInt(e.target.value) || 1 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
            </div>
            <div data-testid="submit-prog" onClick={progForm.title ? createProgram : undefined} style={BTN(!!progForm.title)}>Creer le programme</div>
          </div>
        </div>
      )}

      {/* New Exercise */}
      {showNewExercise && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowNewExercise(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#FFF', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 18 }}>Ajouter un exercice</div>
            <div style={{ marginBottom: 12 }}><label style={LBL}>Nom de l'exercice</label><input data-testid="ex-title" value={exForm.title} onChange={e => setExForm({ ...exForm, title: e.target.value })} placeholder="Ex: Squat" style={INP} /></div>
            <div style={{ marginBottom: 12 }}><label style={LBL}>Instructions</label><textarea value={exForm.description} onChange={e => setExForm({ ...exForm, description: e.target.value })} placeholder="Consignes de realisation..." style={{ ...INP, minHeight: 60, resize: 'vertical' } as any} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={exForm.sets} onChange={e => setExForm({ ...exForm, sets: parseInt(e.target.value) || 0 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repetitions</label><input type="number" value={exForm.reps} onChange={e => setExForm({ ...exForm, reps: parseInt(e.target.value) || 0 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Duree (min)</label><input type="number" value={exForm.duration_minutes} onChange={e => setExForm({ ...exForm, duration_minutes: parseInt(e.target.value) || 0 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
            </div>
            <div data-testid="submit-ex" onClick={exForm.title ? () => addExercise(showNewExercise) : undefined} style={BTN(!!exForm.title)}>Ajouter l'exercice</div>
          </div>
        </div>
      )}

      {/* New Reminder */}
      {showNewReminder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowNewReminder(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#FFF', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 18 }}>Nouveau rappel pour {activeBenData?.name?.split(' ')[0]}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
              {['medication', 'hydration'].map(t => (
                <div key={t} onClick={() => setRemForm({ ...remForm, reminder_type: t })}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                    background: remForm.reminder_type === t ? `${t === 'hydration' ? '#3B82F6' : '#10B981'}10` : '#F9FAFB',
                    border: `1.5px solid ${remForm.reminder_type === t ? (t === 'hydration' ? '#3B82F6' : '#10B981') : '#E5E7EB'}`,
                  } as any}>
                  <i className={t === 'hydration' ? 'ri-drop-line' : 'ri-capsule-line'} style={{ fontSize: 18, color: t === 'hydration' ? '#3B82F6' : '#10B981' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginTop: 4 }}>{t === 'hydration' ? 'Hydratation' : 'Complement'}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}><label style={LBL}>Titre</label><input value={remForm.title} onChange={e => setRemForm({ ...remForm, title: e.target.value })} placeholder="Ex: Vitamine D" style={INP} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Heure</label><input type="time" value={remForm.time} onChange={e => setRemForm({ ...remForm, time: e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Dosage</label><input value={remForm.dosage} onChange={e => setRemForm({ ...remForm, dosage: e.target.value })} placeholder="1 comprimes" style={INP} /></div>
            </div>
            <div data-testid="submit-rem" onClick={remForm.title ? createReminder : undefined} style={BTN(!!remForm.title)}>Ajouter le rappel</div>
          </div>
        </div>
      )}

      {/* New Meal */}
      {showNewMeal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowNewMeal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#FFF', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 18 }}>Plan de repas pour {activeBenData?.name?.split(' ')[0]}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' } as any}>
              {['petit_dejeuner', 'dejeuner', 'gouter', 'diner', 'collation'].map(t => (
                <div key={t} onClick={() => setMealForm({ ...mealForm, meal_type: t })}
                  style={{ padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: mealForm.meal_type === t ? '#FEF3C7' : '#F9FAFB',
                    color: mealForm.meal_type === t ? '#B45309' : '#6B7280',
                    border: `1.5px solid ${mealForm.meal_type === t ? '#F59E0B' : '#E5E7EB'}`,
                  } as any}>{t.replace('_', ' ')}</div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}><label style={LBL}>Aliments (separes par des virgules)</label><textarea value={mealForm.items} onChange={e => setMealForm({ ...mealForm, items: e.target.value })} placeholder="Poulet grille, riz complet, haricots verts" style={{ ...INP, minHeight: 60, resize: 'vertical' } as any} /></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Calories</label><input type="number" value={mealForm.calories || ''} onChange={e => setMealForm({ ...mealForm, calories: parseInt(e.target.value) || 0 })} placeholder="450" style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Proteines (g)</label><input type="number" value={mealForm.proteins || ''} onChange={e => setMealForm({ ...mealForm, proteins: parseInt(e.target.value) || 0 })} placeholder="35" style={INP} /></div>
            </div>
            <div style={{ marginBottom: 18 }}><label style={LBL}>Notes</label><input value={mealForm.notes} onChange={e => setMealForm({ ...mealForm, notes: e.target.value })} placeholder="Eviter les plats trop sales" style={INP} /></div>
            <div data-testid="submit-meal" onClick={mealForm.items ? createMeal : undefined} style={BTN(!!mealForm.items)}>Ajouter le repas</div>
          </div>
        </div>
      )}

      {/* Duplicate/Assign Program */}
      {showDuplicate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowDuplicate(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#FFF', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', marginBottom: 6 }}>Attribuer le programme</div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 18 }}>"{showDuplicate.title}" sera duplique avec tous ses exercices.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
              {bens.filter(b => b.id !== showDuplicate.beneficiary_id).map(b => (
                <div key={b.id} data-testid={`assign-to-${b.id}`} onClick={() => duplicateProgram(showDuplicate.id, b.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: '1.5px solid #E5E7EB', cursor: 'pointer', transition: 'background 0.15s' } as any}
                  onMouseEnter={(e: any) => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={(e: any) => e.currentTarget.style.background = '#FFF'}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${AC}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: AC }}>{(b.name || '?')[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{b.name}</div>
                  </div>
                  <i className="ri-file-copy-line" style={{ fontSize: 16, color: '#9CA3AF' }} />
                </div>
              ))}
              {bens.filter(b => b.id !== showDuplicate.beneficiary_id).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Aucun autre patient disponible</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
