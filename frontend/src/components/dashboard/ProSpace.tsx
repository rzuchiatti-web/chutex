import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const apiFetch = async (url: string, opts: any = {}, token: string) => {
  const r = await fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || r.statusText);
  return r.json();
};
const uploadImage = async (file: File, token: string) => {
  const fd = new FormData(); fd.append('file', file);
  const r = await fetch(`${API}/api/pro/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  if (!r.ok) throw new Error('Upload echoue');
  return (await r.json()).url;
};

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

/* ── Glass Modal — Centré vertical + horizontal ── */
function GlassModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div data-testid="glass-modal" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.55)', padding: '20px 16px 100px' } as any}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: '70vh', overflowY: 'auto', padding: '28px 22px 32px', WebkitOverflowScrolling: 'touch' } as any}>
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

/* ── Image Picker component ── */
function ImagePicker({ value, onChange, token }: { value: string; onChange: (url: string) => void; token: string }) {
  const [uploading, setUploading] = useState(false);
  const pick = async () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      setUploading(true);
      try { const url = await uploadImage(f, token); onChange(url); } catch {} finally { setUploading(false); }
    };
    input.click();
  };
  return (
    <div onClick={pick} style={{ width: '100%', height: 140, borderRadius: 16, border: '2px dashed rgba(255,255,255,0.15)', background: value ? 'none' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 14 } as any}>
      {value ? <img src={value.startsWith('/') ? `${API}${value}` : value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /> : (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' } as any}>
          <i className={uploading ? 'ri-loader-4-line ri-spin' : 'ri-image-add-line'} style={{ fontSize: 28, display: 'block', marginBottom: 6 }} />
          <div style={{ fontSize: 12, fontWeight: 600 }}>{uploading ? 'Upload...' : 'Ajouter une image'}</div>
        </div>
      )}
      {value && <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-pencil-line" style={{ fontSize: 14, color: '#FFF' }} /></div>}
    </div>
  );
}

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
  const [benOpen, setBenOpen] = useState(false);

  // Rich programme form
  const emptyProg = { title: '', description: '', frequency: '3x/semaine', duration_weeks: 8, category: 'force', image: '', sessions: [] as any[] };
  const [progForm, setProgForm] = useState(emptyProg);
  const emptyEx = { title: '', description: '', sets: 3, reps: 12, duration_minutes: 0, image: '' };

  // Rich meal form
  const emptyMeal = { meal_type: 'dejeuner', title: '', image: '', ingredients: [{ name: '', quantity: '', unit: 'g' }] as any[], steps: [''] as string[], calories: 0, proteins: 0, glucides: 0, lipides: 0, notes: '' };
  const [mealForm, setMealForm] = useState(emptyMeal);

  // Reminder form
  const emptyRem = { reminder_type: 'medication', title: '', time: '08:00', dosage: '', notes: '' };
  const [remForm, setRemForm] = useState(emptyRem);

  // Exercise form for adding to existing program
  const [exForm, setExForm] = useState(emptyEx);

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
    Promise.all(bens.map(b => apiFetch(`/api/pro/reminders/${b.id}`, {}, token).catch(() => []))).then(r => setAllReminders(r.flat().filter(Boolean)));
    Promise.all(bens.map(b => apiFetch(`/api/pro/meals/${b.id}`, {}, token).catch(() => ({ meals: [] })))).then(r => setAllMeals(r.flatMap((x: any) => Array.isArray(x) ? x : x?.meals || [])));
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
  const createProgram = async () => {
    setSaving(true);
    try {
      const url = '/api/pro/programs/template';
      const body: any = { title: progForm.title, description: progForm.description, frequency: progForm.frequency, duration_weeks: progForm.duration_weeks, category: progForm.category };
      const created = await apiFetch(url, { method: 'POST', body: JSON.stringify(body) }, token);
      // Add exercises to the created program
      for (const ex of progForm.sessions) {
        if (ex.title) await apiFetch(`/api/pro/programs/${created.id}/sessions`, { method: 'POST', body: JSON.stringify(ex) }, token);
      }
      // Update image if provided
      if (progForm.image) {
        await apiFetch(`/api/pro/programs/edit/${created.id}`, { method: 'PUT', body: JSON.stringify({ image: progForm.image }) }, token).catch(() => {});
      }
      setModal(null); setProgForm(emptyProg); refresh();
    } catch {} finally { setSaving(false); }
  };

  const createMealTemplate = async () => {
    setSaving(true);
    try {
      // For meals, we store as a template in pro_meal_templates collection
      const body = {
        ...mealForm,
        items: mealForm.ingredients.filter(i => i.name).map(i => `${i.name} ${i.quantity}${i.unit}`),
      };
      // Store via a dedicated endpoint or use existing
      await apiFetch('/api/pro/meal-templates', { method: 'POST', body: JSON.stringify(body) }, token);
      setModal(null); setMealForm(emptyMeal); refresh();
    } catch {} finally { setSaving(false); }
  };

  const createReminderTemplate = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/reminder-templates', { method: 'POST', body: JSON.stringify(remForm) }, token);
      setModal(null); setRemForm(emptyRem); refresh();
    } catch {} finally { setSaving(false); }
  };

  const addExercise = async () => {
    if (!modalCtx) return; setSaving(true);
    try { await apiFetch(`/api/pro/programs/${modalCtx}/sessions`, { method: 'POST', body: JSON.stringify(exForm) }, token); setModal(null); refresh(); } catch {} finally { setSaving(false); }
  };

  const duplicateProgram = async (progId: string, benId: string) => { setSaving(true); try { await apiFetch(`/api/pro/programs/duplicate/${progId}/${benId}`, { method: 'POST' }, token); setModal(null); refresh(); } catch {} finally { setSaving(false); }; };
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
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <i className={isPhysio ? 'ri-stethoscope-line' : isCoach ? 'ri-run-line' : 'ri-shield-user-line'} style={{ fontSize: 22, color: '#FFF' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 4, letterSpacing: -0.5 }}>{isPhysio ? 'Espace Kine' : isCoach ? 'Espace Coach' : 'Activite'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>{bens.length} {patientSingle}{bens.length !== 1 ? 's' : ''}</div>

            {/* ── PILL TABS (glass style from profile page) ── */}
            <div data-testid="space-tabs" style={{ display: 'inline-flex', borderRadius: 999, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', padding: 3, gap: 2 } as any}>
              {(['patients', 'library'] as const).map(t => (
                <div key={t} data-testid={`tab-${t}`} onClick={() => setTab(t)}
                  style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.25s ease',
                    background: tab === t ? '#FFF' : 'transparent',
                    boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                    color: tab === t ? '#111' : 'rgba(255,255,255,0.5)',
                  } as any}>
                  {t === 'patients' ? patientLabel : 'Bibliotheque'}
                </div>
              ))}
            </div>

            {/* ── ROUND BEN SELECTOR ── */}
            {tab === 'patients' && bens.length > 0 && (
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 360 } as any}>
                <div data-testid="ben-selector" onClick={() => setBenOpen(!benOpen)}
                  style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', border: `2px solid ${AC}`, transition: 'all 0.2s' } as any}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{(activeBenData?.name || '?')[0]}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginTop: 8 }}>{activeBenData?.name || 'Selectionnez'}</div>

                {benOpen && (
                  <div style={{ marginTop: 12, width: '100%', borderRadius: 16, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
                    {bens.map(b => (
                      <div key={b.id} onClick={() => { setActiveBen(b.id); setBenOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', background: b.id === activeBen ? 'rgba(255,255,255,0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
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

          {/* ════ PATIENTS TAB — 3 Gray Cards ════ */}
          {tab === 'patients' && (
            <>
              <CategoryCard title="Programmes" icon="ri-calendar-check-line" accent={AC} count={programs.length}
                onAdd={() => { setModal('pick-prog'); }}>
                {programs.length === 0 && <EmptyState text="Aucun programme assigne" />}
                {programs.map(p => (
                  <ItemCard key={p.id} accent={AC} title={p.title}
                    subtitle={`${p.frequency || ''} - ${p.duration_weeks || '?'} sem.`}
                    badge={`${(p.sessions || []).length} ex.`}
                    image={p.image}
                    onClick={() => router.push({ pathname: '/pro-program-detail' as any, params: { id: p.id } })}
                    onAdd={() => { setModal('add-ex'); setModalCtx(p.id); setExForm(emptyEx); }}
                    onDelete={() => deleteProgram(p.id)} />
                ))}
              </CategoryCard>

              <CategoryCard title="Rappels" icon="ri-alarm-line" accent={AC} count={reminders.length}
                onAdd={() => { setModal('pick-rem'); }}>
                {reminders.length === 0 && <EmptyState text="Aucun rappel assigne" />}
                {reminders.map(r => (
                  <ItemCard key={r.id} accent={AC} title={r.title}
                    subtitle={`${r.time || ''} - ${(r.reminder_type || '').replace('_', ' ')}`}
                    badge={r.dosage || ''} onDelete={() => deleteReminder(r.id)} />
                ))}
              </CategoryCard>

              <CategoryCard title="Repas" icon="ri-restaurant-line" accent={AC} count={meals.length}
                onAdd={() => { setModal('pick-meal'); }}>
                {meals.length === 0 && <EmptyState text="Aucun repas assigne" />}
                {meals.map((m, i) => (
                  <ItemCard key={i} accent={AC}
                    title={(m.meal_type || m.type || m.label || '').replace('_', ' ')}
                    subtitle={Array.isArray(m.items) ? m.items.join(', ') : (m.items || m.name || '')}
                    badge={m.calories ? `${m.calories} kcal` : ''} image={m.image} />
                ))}
              </CategoryCard>
            </>
          )}

          {/* ════ LIBRARY TAB ════ */}
          {tab === 'library' && (
            <>
              {/* Creation buttons */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 } as any}>
                {[
                  { icon: 'ri-calendar-check-line', label: 'Programme', m: 'new-prog' },
                  { icon: 'ri-alarm-line', label: 'Rappel', m: 'new-rem' },
                  { icon: 'ri-restaurant-line', label: 'Repas', m: 'new-meal' },
                ].map(a => (
                  <div key={a.m} data-testid={`lib-add-${a.m}`} onClick={() => {
                    if (a.m === 'new-prog') { setProgForm(emptyProg); }
                    if (a.m === 'new-meal') { setMealForm(emptyMeal); }
                    if (a.m === 'new-rem') { setRemForm(emptyRem); }
                    setModal(a.m);
                  }}
                    style={{ flex: 1, padding: '16px 8px', borderRadius: 16, background: '#F9FAFB', border: '1.5px solid #F3F4F6', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = AC; e.currentTarget.style.background = `${AC}08`; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = '#F3F4F6'; e.currentTarget.style.background = '#F9FAFB'; }}>
                    <i className={a.icon} style={{ fontSize: 22, color: AC, display: 'block', marginBottom: 6 }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{a.label}</div>
                  </div>
                ))}
              </div>

              <SectionBlock title="Programmes" icon="ri-calendar-check-line" count={allPrograms.length} accent={AC}>
                {allPrograms.length === 0 && <EmptyState text="Aucun programme" />}
                {allPrograms.map(p => (
                  <ItemCard key={p.id} accent={AC} title={p.title}
                    subtitle={`${p.frequency || ''} - ${p.duration_weeks || '?'} sem. ${p.beneficiary_name && p.beneficiary_name !== 'Bibliotheque' ? `| ${p.beneficiary_name}` : ''}`}
                    badge={p.is_template ? 'Modele' : `${(p.sessions || []).length} ex.`}
                    image={p.image}
                    onClick={() => router.push({ pathname: '/pro-program-detail' as any, params: { id: p.id } })}
                    onDuplicate={() => { setModal('duplicate'); setModalCtx(p.id); }}
                    onDelete={() => deleteProgram(p.id)} />
                ))}
              </SectionBlock>

              <SectionBlock title="Rappels" icon="ri-alarm-line" count={allReminders.length} accent={AC}>
                {allReminders.length === 0 && <EmptyState text="Aucun rappel" />}
                {allReminders.map(r => (
                  <ItemCard key={r.id} accent={AC} title={r.title}
                    subtitle={`${r.time || ''} - ${(r.reminder_type || '').replace('_', ' ')}`}
                    badge={r.dosage || ''} onDelete={() => deleteReminder(r.id)} />
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
                      badge={m.calories ? `${m.calories} kcal` : ''} image={m.image} />
                  ));
                })()}
              </SectionBlock>
            </>
          )}
        </div>
      </div>

      {/* ══════ MODALS ══════ */}

      {/* ── Pick from library (Programmes) ── */}
      <GlassModal open={modal === 'pick-prog'} onClose={() => setModal(null)} title="Ajouter un programme">
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Choisissez un programme dans votre bibliotheque :</div>
        {allPrograms.filter(p => p.is_template).length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: 13 } as any}>
            Aucun modele dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: AC, cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un modele →</span>
          </div>
        )}
        {allPrograms.filter(p => p.is_template || true).map(p => (
          <div key={p.id} onClick={() => duplicateProgram(p.id, activeBen)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, cursor: 'pointer', marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 0.15s' } as any}
            onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${AC}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } as any}>
              {p.image ? <img src={p.image.startsWith('/') ? `${API}${p.image}` : p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /> : <i className="ri-calendar-check-line" style={{ fontSize: 18, color: AC }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.frequency} - {(p.sessions || []).length} ex.</div>
            </div>
            <i className="ri-add-circle-line" style={{ fontSize: 20, color: AC }} />
          </div>
        ))}
      </GlassModal>

      {/* ── Pick from library (Rappels) ── */}
      <GlassModal open={modal === 'pick-rem'} onClose={() => setModal(null)} title="Ajouter un rappel">
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Choisissez un rappel ou creez-en un depuis la bibliotheque :</div>
        {allReminders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: 13 } as any}>
            Aucun rappel disponible.<br/><span onClick={() => { setModal(null); setTab('library'); }} style={{ color: AC, cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer dans la bibliotheque →</span>
          </div>
        )}
        {allReminders.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
            <i className="ri-alarm-line" style={{ fontSize: 18, color: AC }} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{r.title}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.time} - {r.reminder_type}</div></div>
          </div>
        ))}
      </GlassModal>

      {/* ── Pick from library (Repas) ── */}
      <GlassModal open={modal === 'pick-meal'} onClose={() => setModal(null)} title="Ajouter un repas">
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Choisissez un repas ou creez-en un depuis la bibliotheque :</div>
        {allMeals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: 13 } as any}>
            Aucun repas disponible.<br/><span onClick={() => { setModal(null); setTab('library'); }} style={{ color: AC, cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer dans la bibliotheque →</span>
          </div>
        )}
      </GlassModal>

      {/* ══ RICH PROGRAMME CREATION ══ */}
      <GlassModal open={modal === 'new-prog'} onClose={() => setModal(null)} title="Nouveau programme">
        <ImagePicker value={progForm.image} onChange={url => setProgForm({ ...progForm, image: url })} token={token} />
        <div style={{ marginBottom: 14 }}><label style={LBL}>Titre</label><input data-testid="prog-title" value={progForm.title} onChange={(e: any) => setProgForm({ ...progForm, title: e.target.value })} style={INP} placeholder="Ex: Renforcement musculaire" /></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Description</label><textarea value={progForm.description} onChange={(e: any) => setProgForm({ ...progForm, description: e.target.value })} style={{ ...INP, height: 70, resize: 'none' } as any} placeholder="Objectif et details du programme..." /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Categorie</label><select value={progForm.category} onChange={(e: any) => setProgForm({ ...progForm, category: e.target.value })} style={SEL}><option value="force">Force</option><option value="mobilite">Mobilite</option><option value="cardio">Cardio</option><option value="equilibre">Equilibre</option><option value="souplesse">Souplesse</option><option value="reeducation">Reeducation</option></select></div>
          <div style={{ flex: 1 }}><label style={LBL}>Frequence</label><select value={progForm.frequency} onChange={(e: any) => setProgForm({ ...progForm, frequency: e.target.value })} style={SEL}><option value="1x/semaine">1x / sem</option><option value="2x/semaine">2x / sem</option><option value="3x/semaine">3x / sem</option><option value="4x/semaine">4x / sem</option><option value="quotidien">Quotidien</option></select></div>
        </div>
        <div style={{ marginBottom: 18 }}><label style={LBL}>Duree (semaines)</label><input type="number" value={progForm.duration_weeks} onChange={(e: any) => setProgForm({ ...progForm, duration_weeks: +e.target.value })} style={INP} /></div>

        {/* Exercises / Steps */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Exercices / Etapes</label>
            <div onClick={() => setProgForm({ ...progForm, sessions: [...progForm.sessions, { ...emptyEx }] })}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}>
              <i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter
            </div>
          </div>
          {progForm.sessions.map((ex, i) => (
            <div key={i} style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>ETAPE {i + 1}</span>
                <div onClick={() => setProgForm({ ...progForm, sessions: progForm.sessions.filter((_, j) => j !== i) })} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} /></div>
              </div>
              <input value={ex.title} onChange={(e: any) => { const s = [...progForm.sessions]; s[i] = { ...s[i], title: e.target.value }; setProgForm({ ...progForm, sessions: s }); }} style={{ ...INP, marginBottom: 8 }} placeholder="Nom de l'exercice" />
              <textarea value={ex.description} onChange={(e: any) => { const s = [...progForm.sessions]; s[i] = { ...s[i], description: e.target.value }; setProgForm({ ...progForm, sessions: s }); }} style={{ ...INP, height: 50, resize: 'none', marginBottom: 8 } as any} placeholder="Instructions..." />
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div style={{ flex: 1 }}><label style={{ ...LBL, fontSize: 9 }}>Series</label><input type="number" value={ex.sets} onChange={(e: any) => { const s = [...progForm.sessions]; s[i] = { ...s[i], sets: +e.target.value }; setProgForm({ ...progForm, sessions: s }); }} style={INP} /></div>
                <div style={{ flex: 1 }}><label style={{ ...LBL, fontSize: 9 }}>Reps</label><input type="number" value={ex.reps} onChange={(e: any) => { const s = [...progForm.sessions]; s[i] = { ...s[i], reps: +e.target.value }; setProgForm({ ...progForm, sessions: s }); }} style={INP} /></div>
                <div style={{ flex: 1 }}><label style={{ ...LBL, fontSize: 9 }}>Min.</label><input type="number" value={ex.duration_minutes} onChange={(e: any) => { const s = [...progForm.sessions]; s[i] = { ...s[i], duration_minutes: +e.target.value }; setProgForm({ ...progForm, sessions: s }); }} style={INP} /></div>
              </div>
            </div>
          ))}
        </div>
        <div data-testid="prog-submit" onClick={progForm.title ? createProgram : undefined} style={GBTN(!!progForm.title)}>{saving ? 'Enregistrement...' : 'Enregistrer dans la bibliotheque'}</div>
      </GlassModal>

      {/* ══ RICH MEAL CREATION ══ */}
      <GlassModal open={modal === 'new-meal'} onClose={() => setModal(null)} title="Nouveau repas">
        <ImagePicker value={mealForm.image} onChange={url => setMealForm({ ...mealForm, image: url })} token={token} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Type</label><select value={mealForm.meal_type} onChange={(e: any) => setMealForm({ ...mealForm, meal_type: e.target.value })} style={SEL}><option value="petit_dejeuner">Petit-dejeuner</option><option value="dejeuner">Dejeuner</option><option value="gouter">Gouter</option><option value="diner">Diner</option><option value="collation">Collation</option></select></div>
          <div style={{ flex: 1 }}><label style={LBL}>Titre</label><input value={mealForm.title} onChange={(e: any) => setMealForm({ ...mealForm, title: e.target.value })} style={INP} placeholder="Ex: Salade proteines" /></div>
        </div>

        {/* Ingredients */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Ingredients</label>
            <div onClick={() => setMealForm({ ...mealForm, ingredients: [...mealForm.ingredients, { name: '', quantity: '', unit: 'g' }] })}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {mealForm.ingredients.map((ing, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' } as any}>
              <input value={ing.name} onChange={(e: any) => { const arr = [...mealForm.ingredients]; arr[i] = { ...arr[i], name: e.target.value }; setMealForm({ ...mealForm, ingredients: arr }); }} style={{ ...INP, flex: 2 }} placeholder="Ingredient" />
              <input value={ing.quantity} onChange={(e: any) => { const arr = [...mealForm.ingredients]; arr[i] = { ...arr[i], quantity: e.target.value }; setMealForm({ ...mealForm, ingredients: arr }); }} style={{ ...INP, flex: 1 }} placeholder="Qte" />
              <select value={ing.unit} onChange={(e: any) => { const arr = [...mealForm.ingredients]; arr[i] = { ...arr[i], unit: e.target.value }; setMealForm({ ...mealForm, ingredients: arr }); }} style={{ ...SEL, flex: 1 }}><option value="g">g</option><option value="ml">ml</option><option value="pc">pc</option><option value="cs">c.s.</option><option value="cc">c.c.</option></select>
              {mealForm.ingredients.length > 1 && <div onClick={() => setMealForm({ ...mealForm, ingredients: mealForm.ingredients.filter((_, j) => j !== i) })} style={{ cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          ))}
        </div>

        {/* Preparation steps */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Etapes de preparation</label>
            <div onClick={() => setMealForm({ ...mealForm, steps: [...mealForm.steps, ''] })}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {mealForm.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' } as any}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', width: 20, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
              <input value={s} onChange={(e: any) => { const arr = [...mealForm.steps]; arr[i] = e.target.value; setMealForm({ ...mealForm, steps: arr }); }} style={{ ...INP, flex: 1 }} placeholder={`Etape ${i + 1}`} />
              {mealForm.steps.length > 1 && <div onClick={() => setMealForm({ ...mealForm, steps: mealForm.steps.filter((_, j) => j !== i) })} style={{ cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          ))}
        </div>

        {/* Macros */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Calories</label><input type="number" value={mealForm.calories} onChange={(e: any) => setMealForm({ ...mealForm, calories: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Prot. (g)</label><input type="number" value={mealForm.proteins} onChange={(e: any) => setMealForm({ ...mealForm, proteins: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Gluc. (g)</label><input type="number" value={mealForm.glucides} onChange={(e: any) => setMealForm({ ...mealForm, glucides: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Lip. (g)</label><input type="number" value={mealForm.lipides} onChange={(e: any) => setMealForm({ ...mealForm, lipides: +e.target.value })} style={INP} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Notes</label><input value={mealForm.notes} onChange={(e: any) => setMealForm({ ...mealForm, notes: e.target.value })} style={INP} placeholder="Conseils, variantes..." /></div>
        <div data-testid="meal-submit" onClick={mealForm.title || mealForm.ingredients.some(i => i.name) ? createMealTemplate : undefined} style={GBTN(!!mealForm.title || mealForm.ingredients.some(i => !!i.name))}>{saving ? 'Enregistrement...' : 'Enregistrer dans la bibliotheque'}</div>
      </GlassModal>

      {/* ── New Reminder ── */}
      <GlassModal open={modal === 'new-rem'} onClose={() => setModal(null)} title="Nouveau rappel">
        <div style={{ marginBottom: 14 }}><label style={LBL}>Type</label><select value={remForm.reminder_type} onChange={(e: any) => setRemForm({ ...remForm, reminder_type: e.target.value })} style={SEL}><option value="medication">Medicament</option><option value="exercise">Exercice</option><option value="hydration">Hydratation</option><option value="appointment">RDV</option><option value="custom">Autre</option></select></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Titre</label><input data-testid="rem-title" value={remForm.title} onChange={(e: any) => setRemForm({ ...remForm, title: e.target.value })} style={INP} placeholder="Ex: Prendre Doliprane" /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Heure</label><input type="time" value={remForm.time} onChange={(e: any) => setRemForm({ ...remForm, time: e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Dosage</label><input value={remForm.dosage} onChange={(e: any) => setRemForm({ ...remForm, dosage: e.target.value })} style={INP} placeholder="1 comprime" /></div>
        </div>
        <div data-testid="rem-submit" onClick={remForm.title ? createReminderTemplate : undefined} style={GBTN(!!remForm.title)}>{saving ? 'Enregistrement...' : 'Enregistrer dans la bibliotheque'}</div>
      </GlassModal>

      {/* ── Add Exercise to existing program ── */}
      <GlassModal open={modal === 'add-ex'} onClose={() => setModal(null)} title="Ajouter un exercice">
        <div style={{ marginBottom: 14 }}><label style={LBL}>Nom</label><input data-testid="ex-title" value={exForm.title} onChange={(e: any) => setExForm({ ...exForm, title: e.target.value })} style={INP} placeholder="Ex: Squats" /></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Description</label><textarea value={exForm.description} onChange={(e: any) => setExForm({ ...exForm, description: e.target.value })} style={{ ...INP, height: 60, resize: 'none' } as any} placeholder="Instructions..." /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={exForm.sets} onChange={(e: any) => setExForm({ ...exForm, sets: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Reps</label><input type="number" value={exForm.reps} onChange={(e: any) => setExForm({ ...exForm, reps: +e.target.value })} style={INP} /></div>
        </div>
        <div data-testid="ex-submit" onClick={exForm.title ? addExercise : undefined} style={GBTN(!!exForm.title)}>{saving ? 'Enregistrement...' : 'Ajouter'}</div>
      </GlassModal>

      {/* ── Duplicate to beneficiary ── */}
      <GlassModal open={modal === 'duplicate'} onClose={() => setModal(null)} title={`Attribuer a un ${patientSingle}`}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>Choisissez le {patientSingle} :</div>
        {bens.map(b => (
          <div key={b.id} onClick={() => duplicateProgram(modalCtx, b.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, cursor: 'pointer', marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 0.15s' } as any}
            onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${AC}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <span style={{ fontSize: 16, fontWeight: 800, color: AC }}>{(b.name || '?')[0]}</span>
            </div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{b.name}</div></div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>
        ))}
      </GlassModal>
    </div>
  );
}

/* ── Sub-components ── */

function CategoryCard({ title, icon, accent, count, onAdd, children }: { title: string; icon: string; accent: string; count: number; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div data-testid={`cat-${title.toLowerCase()}`} style={{ marginBottom: 16, borderRadius: 20, background: '#F4F4F5', padding: '16px', overflow: 'hidden' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className={icon} style={{ fontSize: 16, color: accent }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{title}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{count}</span>
        </div>
        <div data-testid={`cat-add-${title.toLowerCase()}`} onClick={onAdd}
          style={{ width: 32, height: 32, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 2px 8px ${accent}30` } as any}>
          <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionBlock({ title, icon, count, accent, children }: { title: string; icon: string; count: number; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 } as any}>
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

function ItemCard({ title, subtitle, badge, accent, image, onClick, onAdd, onDelete, onDuplicate }: {
  title: string; subtitle: string; badge?: string; accent: string; image?: string;
  onClick?: () => void; onAdd?: () => void; onDelete?: () => void; onDuplicate?: () => void;
}) {
  return (
    <div data-testid={`item-card-${title}`} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#FFF', marginBottom: 6, transition: 'all 0.15s', cursor: onClick ? 'pointer' : 'default' } as any}>
      {image && <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as any}><img src={image.startsWith('/') ? `${process.env.EXPO_PUBLIC_BACKEND_URL}${image}` : image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>}
      <div style={{ flex: 1, minWidth: 0 } as any}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{title}</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{subtitle}</div>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: accent, background: `${accent}10`, padding: '3px 8px', borderRadius: 999, flexShrink: 0 } as any}>{badge}</span>}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 } as any}>
        {onAdd && <ABt icon="ri-add-line" color={accent} onClick={onAdd} />}
        {onDuplicate && <ABt icon="ri-file-copy-line" color="#6B7280" onClick={onDuplicate} />}
        {onDelete && <ABt icon="ri-delete-bin-6-line" color="#EF4444" onClick={onDelete} />}
      </div>
    </div>
  );
}

function ABt({ icon, color, onClick }: { icon: string; color: string; onClick: () => void }) {
  return (
    <div onClick={e => { e.stopPropagation(); onClick(); }}
      style={{ width: 28, height: 28, borderRadius: 8, background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
      <i className={icon} style={{ fontSize: 13, color }} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 16px', color: '#9CA3AF', fontSize: 13 } as any}>
      <i className="ri-inbox-2-line" style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#D1D5DB' }} />
      {text}
    </div>
  );
}
