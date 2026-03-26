import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { apiFetch, BG, DAYS_FR, toLocalDateStr } from './pro/constants';
import { HorizontalCalendar } from './pro/ProCalendar';
import { ProDayView } from './pro/ProDayView';
import { ProLibrary } from './pro/ProLibrary';
import { ProModals } from './pro/ProModals';
import FullScreenLoader from '../FullScreenLoader';

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
  const [assignedExercises, setAssignedExercises] = useState<any[]>([]);
  const [assignedReminders, setAssignedReminders] = useState<any[]>([]);
  const [assignedMeals, setAssignedMeals] = useState<any[]>([]);
  const [exerciseTemplates, setExerciseTemplates] = useState<any[]>([]);
  const [reminderTemplates, setReminderTemplates] = useState<any[]>([]);
  const [mealTemplates, setMealTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const [modal, setModal] = useState<string | null>(null);
  const [modalCtx, setModalCtx] = useState<any>(null);
  const [benOpen, setBenOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form states
  const emptyEx = { title: '', description: '', sets: 3, reps: 12, duration_minutes: 0, image: '', days: [] as string[], rest_seconds: 60 };
  const [exForm, setExForm] = useState(emptyEx);
  const [remAssignForm, setRemAssignForm] = useState({ days: [] as string[], time: '08:00', dosage: '', notes: '' });
  const [mealAssignForm, setMealAssignForm] = useState({ days: [] as string[], meal_type: 'dejeuner' });
  const emptyMeal = { meal_type: 'dejeuner', title: '', image: '', ingredients: [{ name: '', quantity: '', unit: 'g' }] as any[], steps: [''] as string[], calories: 0, proteins: 0, glucides: 0, lipides: 0, notes: '' };
  const [mealForm, setMealForm] = useState(emptyMeal);
  const emptyRem = { reminder_type: 'medication', title: '', time: '08:00', dosage: '', notes: '' };
  const [remForm, setRemForm] = useState(emptyRem);
  const emptyExTpl = { title: '', description: '', image: '', video_url: '', category: 'general', difficulty: 'moyen', muscle_group: '', sets: 3, repetitions: 12, duration_min: 0, rest_seconds: 60, steps: [''] as string[], equipment: '', notes: '' };
  const [exTplForm, setExTplForm] = useState(emptyExTpl);
  const [editExForm, setEditExForm] = useState<any>(null);
  const [editRemForm, setEditRemForm] = useState<any>(null);
  const [editMealForm, setEditMealForm] = useState<any>(null);
  const [benNutrition, setBenNutrition] = useState<any>(null);
  const [benWeightGoal, setBenWeightGoal] = useState<any>(null);

  // ── Data fetching ──
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
    apiFetch('/api/pro/exercise-templates', {}, token).then(e => setExerciseTemplates(Array.isArray(e) ? e : [])).catch(() => {});
    apiFetch('/api/pro/reminder-templates', {}, token).then(r => setReminderTemplates(Array.isArray(r) ? r : [])).catch(() => {});
    apiFetch('/api/pro/meal-templates', {}, token).then(m => setMealTemplates(Array.isArray(m) ? m : [])).catch(() => {});
    apiFetch('/api/pro/seed-templates', { method: 'POST' }, token).catch(() => {});
  }, [token, tick]);

  useEffect(() => {
    if (!activeBen || !token) return;
    Promise.all([
      apiFetch(`/api/pro/assigned-exercises/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/assigned-reminders/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/assigned-meals/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/beneficiary-nutrition/${activeBen}`, {}, token).catch(() => null),
      apiFetch(`/api/pro/beneficiary-weight-goal/${activeBen}`, {}, token).catch(() => null),
    ]).then(([a, r, m, nutr, wg]) => {
      setAssignedExercises(Array.isArray(a) ? a : []);
      setAssignedReminders(Array.isArray(r) ? r : []);
      setAssignedMeals(Array.isArray(m) ? m : []);
      setBenNutrition(nutr);
      setBenWeightGoal(wg);
    });
  }, [activeBen, token, tick]);

  const activeBenData = bens.find(b => b.id === activeBen);

  // ── Calendar filtering ──
  const selectedDayFr = useMemo(() => {
    const idx = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
    return DAYS_FR[idx];
  }, [selectedDate]);
  const selectedDateStr = useMemo(() => toLocalDateStr(selectedDate), [selectedDate]);

  const filteredExercises = useMemo(() => assignedExercises.filter(ex => (ex.days || []).includes(selectedDayFr)), [assignedExercises, selectedDayFr]);
  const filteredReminders = useMemo(() => assignedReminders.filter(r => (r.days || []).includes(selectedDayFr)), [assignedReminders, selectedDayFr]);
  const filteredMeals = useMemo(() => assignedMeals.filter(m => (m.days || []).includes(selectedDayFr)), [assignedMeals, selectedDayFr]);

  // ── CRUD ──
  const assignExercise = async (templateId: string, days: string[], reps: number, sets: number, rest: number) => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/assign-exercise', { method: 'POST', body: JSON.stringify({ exercise_template_id: templateId, beneficiary_id: activeBen, days, repetitions: reps, sets, rest_seconds: rest }) }, token);
      setModal(null); setModalCtx(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const assignReminder = async (templateId: string, days: string[], time: string, dosage: string, notes: string) => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/assign-reminder', { method: 'POST', body: JSON.stringify({ reminder_template_id: templateId, beneficiary_id: activeBen, days, time, dosage, notes }) }, token);
      setModal(null); setModalCtx(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const assignMeal = async (templateId: string, days: string[], mealType: string) => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/assign-meal', { method: 'POST', body: JSON.stringify({ meal_template_id: templateId, beneficiary_id: activeBen, days, meal_type: mealType }) }, token);
      setModal(null); setModalCtx(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const deleteAssignedExercise = async (id: string) => { try { await apiFetch(`/api/pro/assigned-exercises/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };
  const deleteAssignedReminder = async (id: string) => { try { await apiFetch(`/api/pro/assigned-reminders/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };
  const deleteAssignedMeal = async (id: string) => { try { await apiFetch(`/api/pro/assigned-meals/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };

  const updateAssignedExercise = async () => {
    if (!editExForm) return; setSaving(true);
    try {
      await apiFetch(`/api/pro/assigned-exercises/${editExForm.id}`, { method: 'PUT', body: JSON.stringify({ days: editExForm.days, repetitions: editExForm.repetitions, sets: editExForm.sets, rest_seconds: editExForm.rest_seconds }) }, token);
      setModal(null); setEditExForm(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const updateAssignedReminder = async () => {
    if (!editRemForm) return; setSaving(true);
    try {
      await apiFetch(`/api/pro/assigned-reminders/${editRemForm.id}`, { method: 'PUT', body: JSON.stringify({ days: editRemForm.days, time: editRemForm.time, dosage: editRemForm.dosage }) }, token);
      setModal(null); setEditRemForm(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const updateAssignedMeal = async () => {
    if (!editMealForm) return; setSaving(true);
    try {
      await apiFetch(`/api/pro/assigned-meals/${editMealForm.id}`, { method: 'PUT', body: JSON.stringify({ days: editMealForm.days, meal_type: editMealForm.meal_type }) }, token);
      setModal(null); setEditMealForm(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const createExerciseTemplate = async () => { setSaving(true); try { await apiFetch('/api/pro/exercise-templates', { method: 'POST', body: JSON.stringify(exTplForm) }, token); setModal(null); setExTplForm(emptyExTpl); refresh(); } catch {} finally { setSaving(false); } };
  const deleteExerciseTemplate = async (id: string) => { try { await apiFetch(`/api/pro/exercise-templates/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };
  const deleteReminderTemplate = async (id: string) => { try { await apiFetch(`/api/pro/reminder-templates/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };
  const deleteMealTemplate = async (id: string) => { try { await apiFetch(`/api/pro/meal-templates/${id}`, { method: 'DELETE' }, token); refresh(); } catch {} };

  const createMealTemplate = async () => {
    setSaving(true);
    try {
      const body = { ...mealForm, items: mealForm.ingredients.filter(i => i.name).map(i => `${i.name} ${i.quantity}${i.unit}`) };
      await apiFetch('/api/pro/meal-templates', { method: 'POST', body: JSON.stringify(body) }, token);
      setModal(null); setMealForm(emptyMeal); refresh();
    } catch {} finally { setSaving(false); }
  };

  const createReminderTemplate = async () => { setSaving(true); try { await apiFetch('/api/pro/reminder-templates', { method: 'POST', body: JSON.stringify(remForm) }, token); setModal(null); setRemForm(emptyRem); refresh(); } catch {} finally { setSaving(false); } };

  // Calendar auto-scroll
  useEffect(() => {
    let settled = false;
    let settledCount = 0;
    const interval = setInterval(() => {
      if (settled) return;
      const todayISO = toLocalDateStr(new Date());
      const el = document.querySelector('[data-testid="cal-day-' + todayISO + '"]');
      if (!el?.parentElement) return;
      let p: HTMLElement | null = el.parentElement as HTMLElement;
      while (p) {
        if (p.scrollWidth > p.clientWidth + 50) {
          const targetPos = Math.max(0, (new Date().getDate() - 1) * 54 - p.clientWidth / 2 + 27);
          if (Math.abs(p.scrollLeft - targetPos) < 30) { settledCount++; if (settledCount >= 5) { settled = true; clearInterval(interval); } }
          else { settledCount = 0; p.scrollTo({ left: targetPos, behavior: 'instant' as ScrollBehavior }); }
          break;
        }
        p = p.parentElement as HTMLElement | null;
      }
    }, 200);
    const cleanup = setTimeout(() => { settled = true; clearInterval(interval); }, 15000);
    return () => { settled = true; clearInterval(interval); clearTimeout(cleanup); };
  }, [activeBen, tab]);

  if (loading) return <FullScreenLoader />;

  return (
    <div data-testid="pro-space" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <i className={isPhysio ? 'ri-stethoscope-line' : isCoach ? 'ri-run-line' : 'ri-shield-user-line'} style={{ fontSize: 22, color: '#FFF' }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 4, letterSpacing: -0.5 }}>
              {isPhysio ? 'Espace Kine' : isCoach ? 'Espace Coach' : 'Activite'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>{bens.length} {patientSingle}{bens.length !== 1 ? 's' : ''}</div>

            {/* PILL TABS */}
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

            {/* BEN SELECTOR */}
            {tab === 'patients' && bens.length > 0 && (
              <div style={{ marginTop: 18, width: '100%', maxWidth: 360 } as any}>
                <div data-testid="ben-selector" onClick={() => setBenOpen(!benOpen)}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.2s' } as any}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${AC}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${AC}` } as any}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{(activeBenData?.name || '?')[0]}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{activeBenData?.name || 'Selectionnez'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{patientLabel} actif</div>
                  </div>
                  <i className={benOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
                </div>
                {benOpen && (
                  <div style={{ marginTop: 8, width: '100%', borderRadius: 16, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
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

            {/* CALENDAR */}
            {tab === 'patients' && activeBen && (
              <HorizontalCalendar selectedDate={selectedDate} onSelect={setSelectedDate} accent={AC} />
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 280px)' } as any}>
          {tab === 'patients' && (
            <ProDayView
              filteredExercises={filteredExercises}
              filteredReminders={filteredReminders}
              filteredMeals={filteredMeals}
              selectedDayFr={selectedDayFr}
              selectedDateStr={selectedDateStr}
              AC={AC}
              router={router}
              benNutrition={benNutrition}
              benWeightGoal={benWeightGoal}
              activeBenId={activeBen}
              onAddExercise={() => { setModal('assign-ex'); setModalCtx(null); }}
              onAddReminder={() => { setModal('assign-rem'); setModalCtx(null); }}
              onAddMeal={() => { setModal('assign-meal'); setModalCtx(null); }}
              onAddHydration={() => { setModal('assign-hydration'); setModalCtx(null); }}
              onEditExercise={(ex) => { setEditExForm({ ...ex }); setModal('edit-assigned'); }}
              onEditReminder={(r) => { setEditRemForm({ ...r }); setModal('edit-rem'); }}
              onEditMeal={(m) => { setEditMealForm({ ...m }); setModal('edit-meal'); }}
              onDeleteExercise={deleteAssignedExercise}
              onDeleteReminder={deleteAssignedReminder}
              onDeleteMeal={deleteAssignedMeal}
            />
          )}
          {tab === 'library' && (
            <ProLibrary
              AC={AC}
              exerciseTemplates={exerciseTemplates}
              reminderTemplates={reminderTemplates}
              mealTemplates={mealTemplates}
              router={router}
              onNewExercise={() => { setExTplForm(emptyExTpl); setModal('new-ex-tpl'); }}
              onNewReminder={() => { setRemForm(emptyRem); setModal('new-rem'); }}
              onNewHydration={() => { setRemForm({ ...emptyRem, reminder_type: 'hydration', title: '', dosage: '' }); setModal('new-rem'); }}
              onNewMeal={() => { setMealForm(emptyMeal); setModal('new-meal'); }}
              onDeleteExerciseTemplate={deleteExerciseTemplate}
              onDeleteReminderTemplate={deleteReminderTemplate}
              onDeleteMealTemplate={deleteMealTemplate}
              onEditExerciseTemplate={(ex) => { setExTplForm({ ...emptyExTpl, ...ex }); setModal('new-ex-tpl'); }}
              onEditReminderTemplate={(r) => { setRemForm({ ...emptyRem, ...r }); setModal('new-rem'); }}
              onEditMealTemplate={(m) => { setMealForm({ ...emptyMeal, ...m, ingredients: m.items ? m.items.map((s: string) => { const parts = s.split(' '); return { name: parts[0] || '', quantity: parts[1] || '', unit: 'g' }; }) : emptyMeal.ingredients }); setModal('new-meal'); }}
            />
          )}
        </div>
      </div>

      {/* MODALS */}
      <ProModals
        modal={modal} modalCtx={modalCtx} saving={saving} token={token} AC={AC}
        activeBenName={activeBenData?.name || ''}
        exerciseTemplates={exerciseTemplates} reminderTemplates={reminderTemplates} mealTemplates={mealTemplates}
        exForm={exForm} setExForm={setExForm}
        remAssignForm={remAssignForm} setRemAssignForm={setRemAssignForm}
        mealAssignForm={mealAssignForm} setMealAssignForm={setMealAssignForm}
        editExForm={editExForm} setEditExForm={setEditExForm}
        editRemForm={editRemForm} setEditRemForm={setEditRemForm}
        editMealForm={editMealForm} setEditMealForm={setEditMealForm}
        mealForm={mealForm} setMealForm={setMealForm}
        remForm={remForm} setRemForm={setRemForm}
        exTplForm={exTplForm} setExTplForm={setExTplForm}
        setModal={setModal} setModalCtx={setModalCtx} setTab={setTab}
        assignExercise={assignExercise} assignReminder={assignReminder} assignMeal={assignMeal}
        updateAssignedExercise={updateAssignedExercise} updateAssignedReminder={updateAssignedReminder} updateAssignedMeal={updateAssignedMeal}
        createExerciseTemplate={createExerciseTemplate} createMealTemplate={createMealTemplate} createReminderTemplate={createReminderTemplate}
        emptyEx={emptyEx}
      />
    </div>
  );
}
