import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const apiFetch = async (url: string, opts: any = {}, token: string) => {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || r.statusText);
  return r.json();
};

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

/* ── Glass Modal ── */
function GlassModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div data-testid="glass-modal" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.55)' } as any}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '28px 22px 40px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{title}</div>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

const INP: any = { width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const LBL: any = { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.8 };
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

  const [modal, setModal] = useState<string | null>(null);
  const [modalCtx, setModalCtx] = useState<any>(null);
  const [benDropdown, setBenDropdown] = useState(false);

  const [progForm, setProgForm] = useState({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 8 });
  const [exForm, setExForm] = useState({ title: '', description: '', sets: 3, reps: 12, duration_minutes: 0 });
  const [remForm, setRemForm] = useState({ reminder_type: 'medication', title: '', time: '08:00', dosage: '', notes: '' });
  const [mealForm, setMealForm] = useState({ meal_type: 'dejeuner', items: '', calories: 0, proteins: 0, notes: '' });

  const fetchBens = useCallback(async () => {
    try {
      const b = await apiFetch('/api/guardian/beneficiaries', {}, token);
      setBens(Array.isArray(b) ? b : []);
      if (b.length > 0 && !activeBen) setActiveBen(b[0].id);
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchBens(); }, [fetchBens]);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/pro/all-programs', {}, token).then(p => setAllPrograms(Array.isArray(p) ? p : [])).catch(() => {});
    Promise.all(bens.map(b => apiFetch(`/api/pro/reminders/${b.id}`, {}, token).catch(() => []))).then(results => {
      setAllReminders(results.flat().filter(Boolean));
    });
    Promise.all(bens.map(b => apiFetch(`/api/pro/meals/${b.id}`, {}, token).catch(() => ({ meals: [] })))).then(results => {
      const flat = results.flatMap(r => Array.isArray(r) ? r : r?.meals || []);
      setAllMeals(flat);
    });
  }, [token, tick, bens.length]);

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

  const GBTN = (active: boolean): any => ({ padding: '16px', borderRadius: 14, textAlign: 'center', cursor: active && !saving ? 'pointer' : 'default', background: active ? AC : 'rgba(255,255,255,0.06)', color: active ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 800, opacity: saving ? 0.5 : 1 });

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF', fontFamily: 'Inter, system-ui, sans-serif' } as any}><i className="ri-loader-4-line ri-spin" style={{ fontSize: 32 }} /></div>;

  return (
    <div data-testid="pro-space" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ══ HEADER ══ */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <i className={isPhysio ? 'ri-stethoscope-line' : isCoach ? 'ri-run-line' : 'ri-shield-user-line'} style={{ fontSize: 22, color: '#FFF' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 4, letterSpacing: -0.5 }}>{isPhysio ? 'Espace Kine' : isCoach ? 'Espace Coach' : 'Activite'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>{bens.length} {patientSingle}{bens.length !== 1 ? 's' : ''}</div>

            {/* ── PILL TABS ── */}
            <div data-testid="space-tabs" style={{ display: 'inline-flex', borderRadius: 999, background: 'rgba(0,0,0,0.2)', padding: 3, gap: 3 } as any}>
              {(['patients', 'library'] as const).map(t => (
                <div key={t} data-testid={`tab-${t === 'patients' ? 'patients' : 'library'}`} onClick={() => setTab(t)}
                  style={{ padding: '9px 24px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
                    background: tab === t ? '#FFF' : 'transparent',
                    color: tab === t ? '#111' : 'rgba(255,255,255,0.55)',
                    boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  } as any}>
                  {t === 'patients' ? patientLabel : 'Bibliotheque'}
                </div>
              ))}
            </div>

            {/* ── BENEFICIARY SELECTOR IN HEADER ── */}
            {tab === 'patients' && bens.length > 0 && (
              <div style={{ marginTop: 18, width: '100%', maxWidth: 360, position: 'relative' } as any}>
                <div data-testid="ben-selector" onClick={() => setBenDropdown(!benDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', backdropFilter: 'blur(8px)' } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: AC }}>{(activeBenData?.name || '?')[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{activeBenData?.name || `Selectionnez`}</div>
                  </div>
                  <i className={`ri-arrow-${benDropdown ? 'up' : 'down'}-s-line`} style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
                </div>
                {benDropdown && (
                  <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, borderRadius: 18, background: 'rgba(20,20,30,0.9)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', zIndex: 100, overflow: 'hidden', padding: 4 } as any}>
                    {bens.map(b => (
                      <div key={b.id} onClick={() => { setActiveBen(b.id); setBenDropdown(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer', background: b.id === activeBen ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'background 0.15s' } as any}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: b.id === activeBen ? AC : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: b.id === activeBen ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{(b.name || '?')[0]}</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: b.id === activeBen ? 700 : 500, color: b.id === activeBen ? '#FFF' : 'rgba(255,255,255,0.6)' }}>{b.name}</span>
                        {b.id === activeBen && <i className="ri-check-line" style={{ marginLeft: 'auto', fontSize: 16, color: AC }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 280px)' } as any}>

          {/* ════ PATIENTS TAB ════ */}
          {tab === 'patients' && (
            <>
              {/* Quick actions */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 } as any}>
                {[
                  { icon: 'ri-calendar-check-line', label: 'Programme', m: 'new-prog' },
                  { icon: 'ri-alarm-line', label: 'Rappel', m: 'new-rem' },
                  { icon: 'ri-restaurant-line', label: 'Repas', m: 'new-meal' },
                ].map(a => (
                  <div key={a.m} data-testid={`action-${a.m}`} onClick={() => setModal(a.m)}
                    style={{ flex: 1, padding: '14px 8px', borderRadius: 16, background: '#F9FAFB', border: '1.5px solid #F3F4F6', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = AC; e.currentTarget.style.background = `${AC}08`; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = '#F3F4F6'; e.currentTarget.style.background = '#F9FAFB'; }}>
                    <i className={a.icon} style={{ fontSize: 20, color: AC, display: 'block', marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{a.label}</div>
                  </div>
                ))}
              </div>

              {/* Programmes */}
              <SectionBlock title="Programmes" icon="ri-calendar-check-line" count={programs.length} accent={AC}>
                {programs.length === 0 && <EmptyState text="Aucun programme" />}
                {programs.map(p => (
                  <ItemCard key={p.id} accent={AC}
                    title={p.title} subtitle={`${p.frequency || ''} - ${p.duration_weeks || '?'} sem.`}
                    badge={`${(p.sessions || []).length} exercice${(p.sessions || []).length !== 1 ? 's' : ''}`}
                    onAdd={() => { setModal('add-ex'); setModalCtx(p.id); setExForm({ title: '', description: '', sets: 3, reps: 12, duration_minutes: 0 }); }}
                    onDelete={() => deleteProgram(p.id)}
                    onDuplicate={() => { setModal('duplicate'); setModalCtx(p.id); }}
                  />
                ))}
              </SectionBlock>

              {/* Rappels */}
              <SectionBlock title="Rappels" icon="ri-alarm-line" count={reminders.length} accent={AC}>
                {reminders.length === 0 && <EmptyState text="Aucun rappel" />}
                {reminders.map(r => (
                  <ItemCard key={r.id} accent={AC}
                    title={r.title} subtitle={`${r.time || ''} - ${(r.reminder_type || '').replace('_', ' ')}`}
                    badge={r.dosage || ''}
                    onDelete={() => deleteReminder(r.id)}
                  />
                ))}
              </SectionBlock>

              {/* Repas */}
              <SectionBlock title="Repas" icon="ri-restaurant-line" count={meals.length} accent={AC}>
                {meals.length === 0 && <EmptyState text="Aucun repas" />}
                {meals.map((m, i) => (
                  <ItemCard key={i} accent={AC}
                    title={(m.meal_type || m.type || m.label || '').replace('_', ' ')}
                    subtitle={Array.isArray(m.items) ? m.items.join(', ') : (m.items || m.name || '')}
                    badge={m.calories ? `${m.calories} kcal` : ''}
                  />
                ))}
              </SectionBlock>
            </>
          )}

          {/* ════ LIBRARY TAB ════ */}
          {tab === 'library' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
                <div data-testid="lib-add-prog" onClick={() => { setModal('new-prog-lib'); setProgForm({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 8 }); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 999, background: AC, color: '#FFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' } as any}>
                  <i className="ri-add-line" style={{ fontSize: 16 }} /> Nouveau modele
                </div>
              </div>

              <SectionBlock title="Programmes" icon="ri-calendar-check-line" count={allPrograms.length} accent={AC}>
                {allPrograms.length === 0 && <EmptyState text="Aucun programme dans la bibliotheque" />}
                {allPrograms.map(p => (
                  <ItemCard key={p.id} accent={AC}
                    title={p.title} subtitle={`${p.frequency || ''} - ${p.duration_weeks || '?'} sem. ${p.beneficiary_name && p.beneficiary_name !== 'Bibliotheque' ? `| ${p.beneficiary_name}` : ''}`}
                    badge={p.is_template ? 'Modele' : `${(p.sessions || []).length} ex.`}
                    onDuplicate={() => { setModal('duplicate'); setModalCtx(p.id); }}
                    onDelete={() => deleteProgram(p.id)}
                  />
                ))}
              </SectionBlock>

              <SectionBlock title="Rappels" icon="ri-alarm-line" count={allReminders.length} accent={AC}>
                {allReminders.length === 0 && <EmptyState text="Aucun rappel" />}
                {allReminders.map(r => (
                  <ItemCard key={r.id} accent={AC}
                    title={r.title} subtitle={`${r.time || ''} - ${(r.reminder_type || '').replace('_', ' ')}`}
                    badge={r.dosage || ''}
                    onDelete={() => deleteReminder(r.id)}
                  />
                ))}
              </SectionBlock>

              <SectionBlock title="Repas" icon="ri-restaurant-line" count={allMeals.length} accent={AC}>
                {allMeals.length === 0 && <EmptyState text="Aucun repas" />}
                {(() => {
                  const unique: any[] = [];
                  allMeals.forEach(m => {
                    const key = `${m.meal_type || m.type}-${Array.isArray(m.items) ? m.items.join(',') : (m.items || m.name)}`;
                    if (!unique.find((x: any) => `${x.meal_type || x.type}-${Array.isArray(x.items) ? x.items.join(',') : (x.items || x.name)}` === key)) unique.push(m);
                  });
                  return unique.map((m, i) => (
                    <ItemCard key={i} accent={AC}
                      title={(m.meal_type || m.type || m.label || '').replace('_', ' ')}
                      subtitle={Array.isArray(m.items) ? m.items.join(', ') : (m.items || m.name || '')}
                      badge={m.calories ? `${m.calories} kcal` : ''}
                    />
                  ));
                })()}
              </SectionBlock>
            </>
          )}
        </div>
      </div>

      {/* ══════ MODALS ══════ */}

      {/* New Programme */}
      <GlassModal open={modal === 'new-prog' || modal === 'new-prog-lib'} onClose={() => setModal(null)} title={modal === 'new-prog-lib' ? 'Nouveau modele' : 'Nouveau programme'}>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Titre</label><input data-testid="prog-title" value={progForm.title} onChange={(e: any) => setProgForm({ ...progForm, title: e.target.value })} style={INP} placeholder="Ex: Renforcement musculaire" /></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Description</label><input value={progForm.description} onChange={(e: any) => setProgForm({ ...progForm, description: e.target.value })} style={INP} placeholder="Objectif du programme" /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Frequence</label><select value={progForm.frequency} onChange={(e: any) => setProgForm({ ...progForm, frequency: e.target.value })} style={SEL}><option value="1x/semaine">1x / sem</option><option value="2x/semaine">2x / sem</option><option value="3x/semaine">3x / sem</option><option value="4x/semaine">4x / sem</option><option value="5x/semaine">5x / sem</option><option value="quotidien">Quotidien</option></select></div>
          <div style={{ flex: 1 }}><label style={LBL}>Duree (sem.)</label><input type="number" value={progForm.duration_weeks} onChange={(e: any) => setProgForm({ ...progForm, duration_weeks: +e.target.value })} style={INP} /></div>
        </div>
        <div data-testid="prog-submit" onClick={progForm.title ? createProgram : undefined} style={GBTN(!!progForm.title)}>{saving ? 'Enregistrement...' : 'Creer le programme'}</div>
      </GlassModal>

      {/* Add Exercise */}
      <GlassModal open={modal === 'add-ex'} onClose={() => setModal(null)} title="Ajouter un exercice">
        <div style={{ marginBottom: 14 }}><label style={LBL}>Nom de l'exercice</label><input data-testid="ex-title" value={exForm.title} onChange={(e: any) => setExForm({ ...exForm, title: e.target.value })} style={INP} placeholder="Ex: Squats" /></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Description</label><input value={exForm.description} onChange={(e: any) => setExForm({ ...exForm, description: e.target.value })} style={INP} placeholder="Instructions" /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={exForm.sets} onChange={(e: any) => setExForm({ ...exForm, sets: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Repetitions</label><input type="number" value={exForm.reps} onChange={(e: any) => setExForm({ ...exForm, reps: +e.target.value })} style={INP} /></div>
        </div>
        <div data-testid="ex-submit" onClick={exForm.title ? addExercise : undefined} style={GBTN(!!exForm.title)}>{saving ? 'Enregistrement...' : 'Ajouter l\'exercice'}</div>
      </GlassModal>

      {/* New Reminder */}
      <GlassModal open={modal === 'new-rem'} onClose={() => setModal(null)} title="Nouveau rappel">
        <div style={{ marginBottom: 14 }}><label style={LBL}>Type</label><select value={remForm.reminder_type} onChange={(e: any) => setRemForm({ ...remForm, reminder_type: e.target.value })} style={SEL}><option value="medication">Medicament</option><option value="exercise">Exercice</option><option value="hydration">Hydratation</option><option value="appointment">RDV</option><option value="custom">Autre</option></select></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Titre</label><input data-testid="rem-title" value={remForm.title} onChange={(e: any) => setRemForm({ ...remForm, title: e.target.value })} style={INP} placeholder="Ex: Prendre Doliprane" /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Heure</label><input type="time" value={remForm.time} onChange={(e: any) => setRemForm({ ...remForm, time: e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Dosage</label><input value={remForm.dosage} onChange={(e: any) => setRemForm({ ...remForm, dosage: e.target.value })} style={INP} placeholder="1 comprime" /></div>
        </div>
        <div data-testid="rem-submit" onClick={remForm.title ? createReminder : undefined} style={GBTN(!!remForm.title)}>{saving ? 'Enregistrement...' : 'Creer le rappel'}</div>
      </GlassModal>

      {/* New Meal */}
      <GlassModal open={modal === 'new-meal'} onClose={() => setModal(null)} title="Nouveau repas">
        <div style={{ marginBottom: 14 }}><label style={LBL}>Type de repas</label><select value={mealForm.meal_type} onChange={(e: any) => setMealForm({ ...mealForm, meal_type: e.target.value })} style={SEL}><option value="petit_dejeuner">Petit-dejeuner</option><option value="dejeuner">Dejeuner</option><option value="gouter">Gouter</option><option value="diner">Diner</option><option value="collation">Collation</option></select></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Aliments (separes par virgule)</label><input data-testid="meal-items" value={mealForm.items} onChange={(e: any) => setMealForm({ ...mealForm, items: e.target.value })} style={INP} placeholder="Poulet, riz, legumes" /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Calories</label><input type="number" value={mealForm.calories} onChange={(e: any) => setMealForm({ ...mealForm, calories: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Proteines (g)</label><input type="number" value={mealForm.proteins} onChange={(e: any) => setMealForm({ ...mealForm, proteins: +e.target.value })} style={INP} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Notes</label><input value={mealForm.notes} onChange={(e: any) => setMealForm({ ...mealForm, notes: e.target.value })} style={INP} placeholder="Instructions de preparation..." /></div>
        <div data-testid="meal-submit" onClick={mealForm.items ? createMeal : undefined} style={GBTN(!!mealForm.items)}>{saving ? 'Enregistrement...' : 'Ajouter le repas'}</div>
      </GlassModal>

      {/* Duplicate to beneficiary */}
      <GlassModal open={modal === 'duplicate'} onClose={() => setModal(null)} title={`Attribuer a un ${patientSingle}`}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>Choisissez le {patientSingle} a qui attribuer ce programme :</div>
        {bens.map(b => (
          <div key={b.id} data-testid={`dup-ben-${b.id}`} onClick={() => duplicateProgram(modalCtx, b.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, cursor: 'pointer', marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.15s' } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${AC}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <span style={{ fontSize: 16, fontWeight: 800, color: AC }}>{(b.name || '?')[0]}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{b.name}</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>
        ))}
      </GlassModal>
    </div>
  );
}

/* ── Reusable sub-components ── */

function SectionBlock({ title, icon, count, accent, children }: { title: string; icon: string; count: number; accent: string; children: React.ReactNode }) {
  return (
    <div data-testid={`section-${title.toLowerCase()}`} style={{ marginBottom: 24 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className={icon} style={{ fontSize: 16, color: accent }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{title}</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', background: '#F3F4F6', padding: '3px 10px', borderRadius: 999 }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

function ItemCard({ title, subtitle, badge, accent, onAdd, onDelete, onDuplicate }: {
  title: string; subtitle: string; badge?: string; accent: string;
  onAdd?: () => void; onDelete?: () => void; onDuplicate?: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: '#F9FAFB', border: '1px solid #F3F4F6', marginBottom: 8, transition: 'all 0.15s' } as any}>
      <div style={{ flex: 1, minWidth: 0 } as any}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{title}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{subtitle}</div>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: accent, background: `${accent}10`, padding: '3px 10px', borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap' } as any}>{badge}</span>}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 } as any}>
        {onAdd && <ActionBtn icon="ri-add-line" color={accent} onClick={onAdd} testId="item-add" />}
        {onDuplicate && <ActionBtn icon="ri-file-copy-line" color="#6B7280" onClick={onDuplicate} testId="item-dup" />}
        {onDelete && <ActionBtn icon="ri-delete-bin-6-line" color="#EF4444" onClick={onDelete} testId="item-del" />}
      </div>
    </div>
  );
}

function ActionBtn({ icon, color, onClick, testId }: { icon: string; color: string; onClick: () => void; testId: string }) {
  return (
    <div data-testid={testId} onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ width: 30, height: 30, borderRadius: 8, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' } as any}
      onMouseEnter={(e: any) => e.currentTarget.style.background = `${color}20`}
      onMouseLeave={(e: any) => e.currentTarget.style.background = `${color}10`}>
      <i className={icon} style={{ fontSize: 14, color }} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '24px 16px', color: '#9CA3AF', fontSize: 13 } as any}>
      <i className="ri-inbox-2-line" style={{ fontSize: 28, display: 'block', marginBottom: 8, color: '#D1D5DB' }} />
      {text}
    </div>
  );
}
