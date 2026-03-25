import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const apiFetch = async (url: string, opts: any = {}, token: string) => {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || r.statusText);
  return r.json();
};

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

/* ── Glass Modal wrapper ── */
function GlassModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div data-testid="glass-modal" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(0,0,0,0.65)' } as any}>
      <div onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: 400, maxHeight: '80vh', overflowY: 'auto', borderRadius: 24, background: 'rgba(30,30,40,0.92)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 20px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF' }}>{title}</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

const INP: any = { width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const LBL: any = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 };
const SEL: any = { ...INP, appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' };

export default function ProSpace({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const proType = user?.professional_type || '';
  const isCoach = proType === 'coach';
  const isPhysio = proType === 'physio';
  const AC = isCoach ? '#DC2626' : isPhysio ? '#F97316' : '#3B82F6';
  const patientLabel = isCoach ? 'Eleves' : 'Patients';
  const patientSingle = isCoach ? 'eleve' : 'patient';

  const [bens, setBens] = useState<any[]>([]);
  const [activeBen, setActiveBen] = useState('');
  const [tab, setTab] = useState<'patients' | 'library'>('patients');
  const [programs, setPrograms] = useState<any[]>([]);
  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [allReminders, setAllReminders] = useState<any[]>([]);
  const [allMeals, setAllMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  // Modals
  const [modal, setModal] = useState<string | null>(null);
  const [modalCtx, setModalCtx] = useState<any>(null);

  // Forms
  const [progForm, setProgForm] = useState({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 8 });
  const [exForm, setExForm] = useState({ title: '', description: '', sets: 3, reps: 12, duration_minutes: 0 });
  const [remForm, setRemForm] = useState({ reminder_type: 'medication', title: '', time: '08:00', dosage: '', notes: '' });
  const [mealForm, setMealForm] = useState({ meal_type: 'dejeuner', items: '', calories: 0, proteins: 0, notes: '' });
  const [benDropdown, setBenDropdown] = useState(false);

  const fetchBens = useCallback(async () => {
    try {
      const b = await apiFetch('/api/guardian/beneficiaries', {}, token);
      setBens(Array.isArray(b) ? b : []);
      if (b.length > 0 && !activeBen) setActiveBen(b[0].id);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchBens(); }, [fetchBens]);

  // Fetch library (all)
  useEffect(() => {
    if (!token) return;
    apiFetch('/api/pro/all-programs', {}, token).then(p => setAllPrograms(Array.isArray(p) ? p : [])).catch(() => {});
    // Fetch all reminders/meals across all beneficiaries
    Promise.all(bens.map(b => apiFetch(`/api/pro/reminders/${b.id}`, {}, token).catch(() => []))).then(results => {
      setAllReminders(results.flat().filter(Boolean));
    });
    Promise.all(bens.map(b => apiFetch(`/api/pro/meals/${b.id}`, {}, token).catch(() => ({ meals: [] })))).then(results => {
      const flat = results.flatMap(r => Array.isArray(r) ? r : r?.meals || []);
      setAllMeals(flat);
    });
  }, [token, tick, bens.length]);

  // Fetch per-beneficiary
  useEffect(() => {
    if (!activeBen || !token) return;
    Promise.all([
      apiFetch(`/api/pro/programs/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/reminders/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/meals/${activeBen}`, {}, token).catch(() => ({ meals: [] })),
    ]).then(([p, r, m]) => {
      setPrograms(Array.isArray(p) ? p : []);
      setReminders(Array.isArray(r) ? r : []);
      setMeals(Array.isArray(m) ? m : m?.meals || []);
    });
  }, [activeBen, token, tick]);

  const activeBenData = bens.find(b => b.id === activeBen);

  // CRUD
  const createProgram = async () => { setSaving(true); try { const url = modal === 'new-prog-lib' ? '/api/pro/programs/template' : `/api/pro/programs/${activeBen}`; await apiFetch(url, { method: 'POST', body: JSON.stringify(progForm) }, token); setModal(null); refresh(); } catch {} finally { setSaving(false); } };
  const addExercise = async () => { if (!modalCtx) return; setSaving(true); try { await apiFetch(`/api/pro/programs/${modalCtx}/sessions`, { method: 'POST', body: JSON.stringify(exForm) }, token); setModal(null); refresh(); } catch {} finally { setSaving(false); } };
  const createReminder = async () => { setSaving(true); try { await apiFetch(`/api/pro/reminders/${activeBen}`, { method: 'POST', body: JSON.stringify(remForm) }, token); setModal(null); refresh(); } catch {} finally { setSaving(false); } };
  const createMeal = async () => { setSaving(true); try { const arr = mealForm.items.split(',').map(i => i.trim()).filter(Boolean); await apiFetch(`/api/pro/meals/${activeBen}`, { method: 'POST', body: JSON.stringify({ ...mealForm, items: arr }) }, token); setModal(null); refresh(); } catch {} finally { setSaving(false); } };
  const duplicateProgram = async (progId: string, benId: string) => { setSaving(true); try { await apiFetch(`/api/pro/programs/duplicate/${progId}/${benId}`, { method: 'POST' }, token); setModal(null); refresh(); } catch {} finally { setSaving(false); } };
  const deleteProgram = async (id: string) => { try { await apiFetch(`/api/pro/programs/edit/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };
  const deleteReminder = async (id: string) => { try { await apiFetch(`/api/pro/reminders/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };

  const GBTN = (active: boolean): any => ({ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: active && !saving ? 'pointer' : 'default', background: active ? AC : 'rgba(255,255,255,0.06)', color: active ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 800, opacity: saving ? 0.5 : 1 });

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF', fontFamily: 'Inter, system-ui, sans-serif' } as any}><i className="ri-loader-4-line ri-spin" style={{ fontSize: 32 }} /></div>;

  return (
    <div data-testid="pro-space" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── HEADER ── */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '22px 20px 36px', textAlign: 'center' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className={isPhysio ? 'ri-stethoscope-line' : isCoach ? 'ri-run-line' : 'ri-shield-user-line'} style={{ fontSize: 20, color: '#FFF' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{isPhysio ? 'Espace Kine' : isCoach ? 'Espace Coach' : 'Activite'}</div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>{bens.length} {patientSingle}{bens.length !== 1 ? 's' : ''}</div>

            {/* ── PILL TABS (like profile page) ── */}
            <div data-testid="space-tabs" style={{ display: 'inline-flex', borderRadius: 999, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', padding: 3, gap: 2 } as any}>
              <div data-testid="tab-patients" onClick={() => setTab('patients')}
                style={{ padding: '8px 20px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                  background: tab === 'patients' ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: tab === 'patients' ? '#FFF' : 'rgba(255,255,255,0.5)',
                } as any}>
                {patientLabel}
              </div>
              <div data-testid="tab-library" onClick={() => setTab('library')}
                style={{ padding: '8px 20px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                  background: tab === 'library' ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: tab === 'library' ? '#FFF' : 'rgba(255,255,255,0.5)',
                } as any}>
                Bibliotheque
              </div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 220px)' } as any}>

          {/* ════ PATIENTS TAB ════ */}
          {tab === 'patients' && (
            <>
              {/* Dropdown selector */}
              <div style={{ marginBottom: 20, position: 'relative' } as any}>
                <div data-testid="ben-selector" onClick={() => setBenDropdown(!benDropdown)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, border: '1.5px solid #E5E7EB', cursor: 'pointer', background: '#FFF' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${AC}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: AC }}>{(activeBenData?.name || '?')[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{activeBenData?.name || `Selectionnez un ${patientSingle}`}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{programs.length} programme{programs.length !== 1 ? 's' : ''} - {reminders.length} rappel{reminders.length !== 1 ? 's' : ''} - {meals.length} repas</div>
                    </div>
                  </div>
                  <i className={`ri-arrow-${benDropdown ? 'up' : 'down'}-s-line`} style={{ fontSize: 20, color: '#9CA3AF' }} />
                </div>
                {benDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, borderRadius: 16, background: '#FFF', border: '1.5px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 100, overflow: 'hidden' } as any}>
                    {bens.map(b => (
                      <div key={b.id} data-testid={`ben-option-${b.id}`} onClick={() => { setActiveBen(b.id); setBenDropdown(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: b.id === activeBen ? '#F9FAFB' : '#FFF', borderBottom: '1px solid #F3F4F6' } as any}
                        onMouseEnter={(e: any) => { if (b.id !== activeBen) e.currentTarget.style.background = '#F9FAFB'; }}
                        onMouseLeave={(e: any) => { if (b.id !== activeBen) e.currentTarget.style.background = '#FFF'; }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: b.id === activeBen ? `${AC}15` : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: b.id === activeBen ? AC : '#6B7280' }}>{(b.name || '?')[0]}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: b.id === activeBen ? 700 : 500, color: '#111' }}>{b.name}</div>
                        </div>
                        {b.id === activeBen && <i className="ri-check-line" style={{ fontSize: 16, color: AC }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 } as any}>
                {[
                  { icon: 'ri-file-list-3-line', label: 'Programme', color: '#3B82F6', modal: 'assign-prog' },
                  { icon: 'ri-capsule-line', label: 'Rappel', color: '#10B981', modal: 'new-rem' },
                  { icon: 'ri-restaurant-line', label: 'Repas', color: '#F59E0B', modal: 'new-meal' },
                ].map(a => (
                  <div key={a.label} data-testid={`quick-${a.label.toLowerCase()}`} onClick={() => setModal(a.modal)}
                    style={{ padding: '16px 10px', borderRadius: 16, background: `${a.color}08`, border: `1.5px solid ${a.color}20`, cursor: 'pointer', textAlign: 'center' } as any}>
                    <i className={a.icon} style={{ fontSize: 22, color: a.color, display: 'block', marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>+ {a.label}</div>
                  </div>
                ))}
              </div>

              {activeBenData && (
                <>
                  {/* Programs */}
                  <Section title="Programmes" count={programs.length} icon="ri-file-list-3-line" iconColor="#3B82F6">
                    {programs.map(prog => (
                      <ProgramCard key={prog.id} prog={prog} AC={AC}
                        onAddEx={() => { setModalCtx(prog.id); setModal('new-ex'); }}
                        onDuplicate={() => { setModalCtx(prog); setModal('duplicate'); }}
                        onDelete={() => deleteProgram(prog.id)} />
                    ))}
                  </Section>

                  {/* Reminders */}
                  <Section title="Rappels" count={reminders.length} icon="ri-capsule-line" iconColor="#10B981">
                    {reminders.map(rem => (
                      <div key={rem.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid #F3F4F6', marginBottom: 6 } as any}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: rem.reminder_type === 'hydration' ? '#DBEAFE' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <i className={rem.reminder_type === 'hydration' ? 'ri-drop-line' : 'ri-capsule-line'} style={{ fontSize: 15, color: rem.reminder_type === 'hydration' ? '#3B82F6' : '#10B981' }} />
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{rem.title}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{rem.time} - {rem.dosage || ''}</div></div>
                        <div onClick={() => deleteReminder(rem.id)} style={{ cursor: 'pointer', padding: 4 } as any}><i className="ri-close-line" style={{ fontSize: 15, color: '#D1D5DB' }} /></div>
                      </div>
                    ))}
                  </Section>

                  {/* Meals */}
                  <Section title="Repas" count={meals.length} icon="ri-restaurant-line" iconColor="#F59E0B">
                    {meals.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid #F3F4F6', marginBottom: 6 } as any}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <i className="ri-restaurant-line" style={{ fontSize: 15, color: '#F59E0B' }} />
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{(m.meal_type || m.type || m.label || '').replace('_', ' ')}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{Array.isArray(m.items) ? m.items.join(', ') : (m.items || m.name || '')}{m.calories ? ` - ${m.calories}kcal` : ''}</div></div>
                      </div>
                    ))}
                  </Section>
                </>
              )}
            </>
          )}

          {/* ════ LIBRARY TAB ════ */}
          {tab === 'library' && (
            <>
              {/* Library sub-sections */}
              <LibSection title="Programmes" icon="ri-file-list-3-line" color="#3B82F6" onAdd={() => setModal('new-prog-lib')}>
                {allPrograms.length === 0 ? <EmptyLib label="programme" /> : (
                  allPrograms.reduce((acc: any[], p) => {
                    if (!acc.find(x => x.title === p.title)) acc.push(p);
                    return acc;
                  }, []).map(prog => (
                    <div key={prog.id} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid #F3F4F6', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                      <div><div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{prog.title}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{prog.frequency} - {prog.duration_weeks} sem. - {prog.sessions?.length || 0} ex.</div></div>
                      <div data-testid={`lib-assign-${prog.id}`} onClick={() => { setModalCtx(prog); setModal('duplicate'); }}
                        style={{ padding: '6px 12px', borderRadius: 10, background: `${AC}08`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}>
                        <i className="ri-share-forward-line" style={{ fontSize: 13, color: AC }} /><span style={{ fontSize: 11, fontWeight: 700, color: AC }}>Attribuer</span>
                      </div>
                    </div>
                  ))
                )}
              </LibSection>

              <LibSection title="Rappels" icon="ri-capsule-line" color="#10B981" onAdd={() => setModal('new-rem')}>
                {allReminders.length === 0 ? <EmptyLib label="rappel" /> : (
                  allReminders.reduce((acc: any[], r) => {
                    if (!acc.find(x => x.title === r.title)) acc.push(r);
                    return acc;
                  }, []).map(rem => (
                    <div key={rem.id} style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid #F3F4F6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                      <i className={rem.reminder_type === 'hydration' ? 'ri-drop-line' : 'ri-capsule-line'} style={{ fontSize: 15, color: rem.reminder_type === 'hydration' ? '#3B82F6' : '#10B981' }} />
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{rem.title}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{rem.time} - {rem.dosage}</div></div>
                    </div>
                  ))
                )}
              </LibSection>

              <LibSection title="Repas" icon="ri-restaurant-line" color="#F59E0B" onAdd={() => setModal('new-meal')}>
                {allMeals.length === 0 ? <EmptyLib label="repas" /> : (
                  allMeals.reduce((acc: any[], m, i) => {
                    const key = `${m.meal_type || m.type}-${Array.isArray(m.items) ? m.items.join(',') : (m.items || m.name)}`;
                    if (!acc.find((x: any) => `${x.meal_type || x.type}-${Array.isArray(x.items) ? x.items.join(',') : (x.items || x.name)}` === key)) acc.push(m);
                    return acc;
                  }, []).map((m: any, i: number) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid #F3F4F6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                      <i className="ri-restaurant-line" style={{ fontSize: 15, color: '#F59E0B' }} />
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#111', textTransform: 'capitalize' }}>{(m.meal_type || m.type || m.label || '').replace('_', ' ')}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{Array.isArray(m.items) ? m.items.join(', ') : (m.items || m.name || '')}</div></div>
                    </div>
                  ))
                )}
              </LibSection>
            </>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Assign existing program */}
      <GlassModal open={modal === 'assign-prog'} onClose={() => setModal(null)} title="Ajouter un programme">
        {allPrograms.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Depuis la bibliotheque</div>
            {allPrograms.reduce((acc: any[], p) => { if (!acc.find(x => x.title === p.title)) acc.push(p); return acc; }, []).map(p => (
              <div key={p.id} onClick={() => duplicateProgram(p.id, activeBen)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', marginBottom: 6 } as any}>
                <i className="ri-file-list-3-line" style={{ fontSize: 16, color: '#3B82F6' }} />
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{p.title}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{p.sessions?.length || 0} exercices</div></div>
                <i className="ri-add-circle-line" style={{ fontSize: 16, color: AC }} />
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '14px 0', paddingTop: 14 } as any}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Ou creer un nouveau</div>
            </div>
          </>
        )}
        <div style={{ marginBottom: 12 }}><label style={LBL}>Nom</label><input data-testid="prog-title" value={progForm.title} onChange={e => setProgForm({ ...progForm, title: e.target.value })} placeholder="Ex: Renforcement musculaire" style={INP} /></div>
        <div style={{ marginBottom: 12 }}><label style={LBL}>Description</label><textarea value={progForm.description} onChange={e => setProgForm({ ...progForm, description: e.target.value })} placeholder="Objectifs..." style={{ ...INP, minHeight: 50, resize: 'vertical' } as any} /></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Frequence</label><input value={progForm.frequency} onChange={e => setProgForm({ ...progForm, frequency: e.target.value })} style={INP} /></div>
          <div style={{ width: 80 }}><label style={LBL}>Semaines</label><input type="number" value={progForm.duration_weeks} onChange={e => setProgForm({ ...progForm, duration_weeks: parseInt(e.target.value) || 1 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
        </div>
        <div data-testid="submit-prog" onClick={progForm.title ? createProgram : undefined} style={GBTN(!!progForm.title)}>Creer le programme</div>
      </GlassModal>

      {/* New program for library */}
      <GlassModal open={modal === 'new-prog-lib'} onClose={() => setModal(null)} title="Nouveau programme (bibliotheque)">
        <div style={{ marginBottom: 12 }}><label style={LBL}>Nom</label><input value={progForm.title} onChange={e => setProgForm({ ...progForm, title: e.target.value })} placeholder="Ex: Cardio progressif" style={INP} /></div>
        <div style={{ marginBottom: 12 }}><label style={LBL}>Description</label><textarea value={progForm.description} onChange={e => setProgForm({ ...progForm, description: e.target.value })} placeholder="Objectifs..." style={{ ...INP, minHeight: 50, resize: 'vertical' } as any} /></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Frequence</label><input value={progForm.frequency} onChange={e => setProgForm({ ...progForm, frequency: e.target.value })} style={INP} /></div>
          <div style={{ width: 80 }}><label style={LBL}>Semaines</label><input type="number" value={progForm.duration_weeks} onChange={e => setProgForm({ ...progForm, duration_weeks: parseInt(e.target.value) || 1 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
        </div>
        <div onClick={progForm.title ? createProgram : undefined} style={GBTN(!!progForm.title)}>Creer</div>
      </GlassModal>

      {/* New exercise */}
      <GlassModal open={modal === 'new-ex'} onClose={() => setModal(null)} title="Ajouter un exercice">
        <div style={{ marginBottom: 12 }}><label style={LBL}>Nom</label><input data-testid="ex-title" value={exForm.title} onChange={e => setExForm({ ...exForm, title: e.target.value })} placeholder="Ex: Squat" style={INP} /></div>
        <div style={{ marginBottom: 12 }}><label style={LBL}>Instructions</label><textarea value={exForm.description} onChange={e => setExForm({ ...exForm, description: e.target.value })} placeholder="Consignes..." style={{ ...INP, minHeight: 50, resize: 'vertical' } as any} /></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={exForm.sets} onChange={e => setExForm({ ...exForm, sets: parseInt(e.target.value) || 0 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Reps</label><input type="number" value={exForm.reps} onChange={e => setExForm({ ...exForm, reps: parseInt(e.target.value) || 0 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Min</label><input type="number" value={exForm.duration_minutes} onChange={e => setExForm({ ...exForm, duration_minutes: parseInt(e.target.value) || 0 })} style={{ ...INP, textAlign: 'center' } as any} /></div>
        </div>
        <div data-testid="submit-ex" onClick={exForm.title ? addExercise : undefined} style={GBTN(!!exForm.title)}>Ajouter</div>
      </GlassModal>

      {/* New reminder */}
      <GlassModal open={modal === 'new-rem'} onClose={() => setModal(null)} title="Nouveau rappel">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
          {['medication', 'hydration'].map(t => (
            <div key={t} onClick={() => setRemForm({ ...remForm, reminder_type: t })}
              style={{ flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                background: remForm.reminder_type === t ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${remForm.reminder_type === t ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              } as any}>
              <i className={t === 'hydration' ? 'ri-drop-line' : 'ri-capsule-line'} style={{ fontSize: 18, color: t === 'hydration' ? '#60A5FA' : '#34D399' }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FFF', marginTop: 4 }}>{t === 'hydration' ? 'Hydratation' : 'Complement'}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}><label style={LBL}>Titre</label><input value={remForm.title} onChange={e => setRemForm({ ...remForm, title: e.target.value })} placeholder="Ex: Vitamine D" style={INP} /></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Heure</label><input type="time" value={remForm.time} onChange={e => setRemForm({ ...remForm, time: e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Dosage</label><input value={remForm.dosage} onChange={e => setRemForm({ ...remForm, dosage: e.target.value })} placeholder="1 comp." style={INP} /></div>
        </div>
        <div data-testid="submit-rem" onClick={remForm.title ? createReminder : undefined} style={GBTN(!!remForm.title)}>Ajouter</div>
      </GlassModal>

      {/* New meal */}
      <GlassModal open={modal === 'new-meal'} onClose={() => setModal(null)} title="Plan de repas">
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' } as any}>
          {['petit_dejeuner', 'dejeuner', 'gouter', 'diner', 'collation'].map(t => (
            <div key={t} onClick={() => setMealForm({ ...mealForm, meal_type: t })}
              style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: mealForm.meal_type === t ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                color: mealForm.meal_type === t ? '#FBBF24' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${mealForm.meal_type === t ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
              } as any}>{t.replace('_', ' ')}</div>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}><label style={LBL}>Aliments (virgules)</label><textarea value={mealForm.items} onChange={e => setMealForm({ ...mealForm, items: e.target.value })} placeholder="Poulet, riz, haricots" style={{ ...INP, minHeight: 50, resize: 'vertical' } as any} /></div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Calories</label><input type="number" value={mealForm.calories || ''} onChange={e => setMealForm({ ...mealForm, calories: parseInt(e.target.value) || 0 })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Proteines (g)</label><input type="number" value={mealForm.proteins || ''} onChange={e => setMealForm({ ...mealForm, proteins: parseInt(e.target.value) || 0 })} style={INP} /></div>
        </div>
        <div data-testid="submit-meal" onClick={mealForm.items ? createMeal : undefined} style={GBTN(!!mealForm.items)}>Ajouter</div>
      </GlassModal>

      {/* Duplicate/Assign */}
      <GlassModal open={modal === 'duplicate'} onClose={() => setModal(null)} title={`Attribuer a un ${patientSingle}`}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>"{modalCtx?.title}" sera duplique avec tous ses exercices.</div>
        {bens.filter(b => b.id !== modalCtx?.beneficiary_id).map(b => (
          <div key={b.id} data-testid={`assign-to-${b.id}`} onClick={() => duplicateProgram(modalCtx.id, b.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', marginBottom: 6 } as any}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${AC}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <span style={{ fontSize: 14, fontWeight: 800, color: AC }}>{(b.name || '?')[0]}</span>
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#FFF' }}>{b.name}</div>
            <i className="ri-share-forward-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
          </div>
        ))}
      </GlassModal>
    </div>
  );
}

/* ── Sub-components ── */
function Section({ title, count, icon, iconColor, children }: any) {
  return (
    <div style={{ marginBottom: 24 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
        <i className={icon} style={{ fontSize: 15, color: iconColor }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{title}</span>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>({count})</span>
      </div>
      {count === 0 ? <div style={{ padding: '16px', borderRadius: 14, background: '#F9FAFB', textAlign: 'center', fontSize: 13, color: '#9CA3AF' } as any}>Aucun {title.toLowerCase()}</div> : children}
    </div>
  );
}

function ProgramCard({ prog, AC, onAddEx, onDuplicate, onDelete }: any) {
  return (
    <div data-testid={`prog-${prog.id}`} style={{ borderRadius: 16, border: '1.5px solid #E5E7EB', marginBottom: 10, overflow: 'hidden' } as any}>
      <div style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{prog.title}</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{prog.frequency} - {prog.duration_weeks} sem. - {prog.sessions?.length || 0} ex.</div>
        </div>
        <div style={{ display: 'flex', gap: 4 } as any}>
          <IconBtn icon="ri-add-line" bg={`${AC}10`} color={AC} onClick={onAddEx} testid={`add-ex-${prog.id}`} />
          <IconBtn icon="ri-share-forward-line" bg="#F3F4F6" color="#6B7280" onClick={onDuplicate} />
          <IconBtn icon="ri-delete-bin-line" bg="#FEE2E2" color="#EF4444" onClick={onDelete} />
        </div>
      </div>
      {prog.sessions?.length > 0 && (
        <div style={{ borderTop: '1px solid #F3F4F6', padding: '8px 14px' } as any}>
          {prog.sessions.map((s: any, i: number) => (
            <div key={s.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' } as any}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: s.completed ? '#D1FAE5' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className={s.completed ? 'ri-check-line' : 'ri-run-line'} style={{ fontSize: 11, color: s.completed ? '#10B981' : '#9CA3AF' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', flex: 1 }}>{s.title}</span>
              {(s.sets || s.reps) && <span style={{ fontSize: 10, color: '#9CA3AF' }}>{s.sets}x{s.reps}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({ icon, bg, color, onClick, testid }: any) {
  return (
    <div data-testid={testid} onClick={onClick} style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
      <i className={icon} style={{ fontSize: 13, color }} />
    </div>
  );
}

function LibSection({ title, icon, color, onAdd, children }: any) {
  return (
    <div style={{ marginBottom: 24 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className={icon} style={{ fontSize: 15, color }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{title}</span>
        </div>
        <div onClick={onAdd} style={{ padding: '5px 12px', borderRadius: 999, background: `${color}08`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}>
          <i className="ri-add-line" style={{ fontSize: 13, color }} /><span style={{ fontSize: 11, fontWeight: 700, color }}>Creer</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyLib({ label }: { label: string }) {
  return <div style={{ padding: '20px', borderRadius: 14, background: '#F9FAFB', textAlign: 'center', fontSize: 13, color: '#9CA3AF' } as any}>Aucun {label} dans la bibliotheque</div>;
}
