import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { REMINDER_IMAGES } from './constants';

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
const DAYS_FR = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS_FR = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];

/* ── Glass Modal ── */
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

/* ── Image Picker ── */
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

/* ── Days Picker (reusable) ── */
function DaysPicker({ selected, onChange, accent }: { selected: string[]; onChange: (days: string[]) => void; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' } as any}>
      {DAYS_FR.map(d => {
        const sel = selected.includes(d);
        return (
          <div key={d} data-testid={`day-${d}`} onClick={() => onChange(sel ? selected.filter(x => x !== d) : [...selected, d])}
            style={{ padding: '8px 12px', borderRadius: 999,
              background: sel ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.06)',
              backdropFilter: sel ? 'blur(12px)' : 'none', WebkitBackdropFilter: sel ? 'blur(12px)' : 'none',
              border: sel ? '1.5px solid rgba(220,38,38,0.25)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: sel ? '0 2px 10px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: sel ? '#FFF' : 'rgba(255,255,255,0.4)', textTransform: 'capitalize', transition: 'all 0.2s' } as any}>
            {d.slice(0, 3)}
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   HORIZONTAL CALENDAR
   ══════════════════════════════════════════ */
function HorizontalCalendar({ selectedDate, onSelect, accent, completedDates }: { selectedDate: Date; onSelect: (d: Date) => void; accent: string; completedDates?: Set<string> }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const dates = useMemo(() => {
    const arr: Date[] = [];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push(new Date(viewYear, viewMonth, i));
    }
    return arr;
  }, [viewMonth, viewYear]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Auto-scroll to today/selected day on mount + month change
  useEffect(() => {
    const doScroll = () => {
      if (!scrollRef.current) return;
      const today = new Date();
      const targetDay = (viewMonth === today.getMonth() && viewYear === today.getFullYear()) ? today.getDate() : selectedDate.getDate();
      const dayWidth = 54; // minWidth 48 + gap 6
      const containerWidth = scrollRef.current.clientWidth;
      const scrollTo = (targetDay - 1) * dayWidth - containerWidth / 2 + dayWidth / 2;
      scrollRef.current.scrollLeft = Math.max(0, scrollTo);
    };
    // Use multiple attempts to ensure DOM is ready
    doScroll();
    const t1 = requestAnimationFrame(doScroll);
    const t2 = setTimeout(doScroll, 150);
    const t3 = setTimeout(doScroll, 400);
    return () => { cancelAnimationFrame(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [viewMonth, viewYear, selectedDate]);

  const todayStr = new Date().toISOString().split('T')[0];
  const selStr = selectedDate.toISOString().split('T')[0];

  return (
    <div data-testid="horizontal-calendar" style={{ width: '100%', marginTop: 28 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 } as any}>
        <div data-testid="cal-prev-month" onClick={prevMonth}
          style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 16, color: '#FFF' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', textTransform: 'capitalize', letterSpacing: 0.5, minWidth: 140, textAlign: 'center' } as any}>
          {MONTHS_FR[viewMonth]} {viewYear}
        </div>
        <div data-testid="cal-next-month" onClick={nextMonth}
          style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#FFF' }} />
        </div>
      </div>
      <div ref={scrollRef} style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as any}>
        {dates.map(d => {
          const ds = d.toISOString().split('T')[0];
          const isToday = ds === todayStr;
          const isSelected = ds === selStr;
          const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
          return (
            <div key={ds} data-testid={`cal-day-${ds}`} onClick={() => onSelect(d)}
              style={{
                minWidth: 48, padding: '8px 4px 10px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                background: isSelected ? 'rgba(255,255,255,0.18)' : isToday ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                backdropFilter: isSelected ? 'blur(16px)' : 'none',
                WebkitBackdropFilter: isSelected ? 'blur(16px)' : 'none',
                border: isSelected ? '1.5px solid rgba(255,255,255,0.35)' : isToday ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid transparent',
                boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                transition: 'all 0.25s ease', flexShrink: 0,
              } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: isSelected ? '#FFF' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                {DAYS_SHORT[dayIdx]}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: isSelected ? '#FFF' : isToday ? '#FFF' : 'rgba(255,255,255,0.6)', lineHeight: 1 }}>
                {d.getDate()}
              </div>
              {isToday && !isSelected && (
                <div style={{ width: 4, height: 4, borderRadius: 2, background: accent, margin: '4px auto 0' } as any} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
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

  // Exercise form (for assign modal)
  const emptyEx = { title: '', description: '', sets: 3, reps: 12, duration_minutes: 0, image: '', days: [] as string[], rest_seconds: 60 };
  const [exForm, setExForm] = useState(emptyEx);

  // Reminder assign form
  const [remAssignForm, setRemAssignForm] = useState({ days: [] as string[], time: '08:00', dosage: '' });

  // Meal assign form
  const [mealAssignForm, setMealAssignForm] = useState({ days: [] as string[], meal_type: 'dejeuner' });

  // Rich meal form (for library creation)
  const emptyMeal = { meal_type: 'dejeuner', title: '', image: '', ingredients: [{ name: '', quantity: '', unit: 'g' }] as any[], steps: [''] as string[], calories: 0, proteins: 0, glucides: 0, lipides: 0, notes: '' };
  const [mealForm, setMealForm] = useState(emptyMeal);

  // Reminder form (for library creation)
  const emptyRem = { reminder_type: 'medication', title: '', time: '08:00', dosage: '', notes: '' };
  const [remForm, setRemForm] = useState(emptyRem);

  // Exercise template form (for library)
  const emptyExTpl = { title: '', description: '', image: '', video_url: '', category: 'general', difficulty: 'moyen', muscle_group: '', sets: 3, repetitions: 12, duration_min: 0, rest_seconds: 60, steps: [''] as string[], equipment: '', notes: '' };
  const [exTplForm, setExTplForm] = useState(emptyExTpl);

  // Edit assigned exercise form
  const [editExForm, setEditExForm] = useState<any>(null);

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
    // Auto-seed if empty
    apiFetch('/api/pro/seed-templates', { method: 'POST' }, token).catch(() => {});
  }, [token, tick]);

  useEffect(() => {
    if (!activeBen || !token) return;
    Promise.all([
      apiFetch(`/api/pro/assigned-exercises/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/assigned-reminders/${activeBen}`, {}, token).catch(() => []),
      apiFetch(`/api/pro/assigned-meals/${activeBen}`, {}, token).catch(() => []),
    ]).then(([a, r, m]) => {
      setAssignedExercises(Array.isArray(a) ? a : []);
      setAssignedReminders(Array.isArray(r) ? r : []);
      setAssignedMeals(Array.isArray(m) ? m : []);
    });
  }, [activeBen, token, tick]);

  const activeBenData = bens.find(b => b.id === activeBen);

  // ── Calendar filtering ──
  const selectedDayFr = useMemo(() => {
    const idx = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
    return DAYS_FR[idx];
  }, [selectedDate]);

  const selectedDateStr = useMemo(() => selectedDate.toISOString().split('T')[0], [selectedDate]);

  const filteredExercises = useMemo(() => {
    return assignedExercises.filter(ex => (ex.days || []).includes(selectedDayFr));
  }, [assignedExercises, selectedDayFr]);

  const filteredReminders = useMemo(() => {
    return assignedReminders.filter(r => (r.days || []).includes(selectedDayFr));
  }, [assignedReminders, selectedDayFr]);

  const filteredMeals = useMemo(() => {
    return assignedMeals.filter(m => (m.days || []).includes(selectedDayFr));
  }, [assignedMeals, selectedDayFr]);

  // ── CRUD ──

  const assignExercise = async (templateId: string, days: string[], reps: number, sets: number, rest: number) => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/assign-exercise', { method: 'POST', body: JSON.stringify({
        exercise_template_id: templateId, beneficiary_id: activeBen, days, repetitions: reps, sets, rest_seconds: rest
      }) }, token);
      setModal(null); setModalCtx(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const assignReminder = async (templateId: string, days: string[], time: string, dosage: string) => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/assign-reminder', { method: 'POST', body: JSON.stringify({
        reminder_template_id: templateId, beneficiary_id: activeBen, days, time, dosage
      }) }, token);
      setModal(null); setModalCtx(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const assignMeal = async (templateId: string, days: string[], mealType: string) => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/assign-meal', { method: 'POST', body: JSON.stringify({
        meal_template_id: templateId, beneficiary_id: activeBen, days, meal_type: mealType
      }) }, token);
      setModal(null); setModalCtx(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const deleteAssignedExercise = async (id: string) => {
    try { await apiFetch(`/api/pro/assigned-exercises/${id}`, { method: 'DELETE' }, token); refresh(); } catch {}
  };
  const deleteAssignedReminder = async (id: string) => {
    try { await apiFetch(`/api/pro/assigned-reminders/${id}`, { method: 'DELETE' }, token); refresh(); } catch {}
  };
  const deleteAssignedMeal = async (id: string) => {
    try { await apiFetch(`/api/pro/assigned-meals/${id}`, { method: 'DELETE' }, token); refresh(); } catch {}
  };

  const updateAssignedExercise = async () => {
    if (!editExForm) return;
    setSaving(true);
    try {
      await apiFetch(`/api/pro/assigned-exercises/${editExForm.id}`, { method: 'PUT', body: JSON.stringify({
        days: editExForm.days, repetitions: editExForm.repetitions, sets: editExForm.sets, rest_seconds: editExForm.rest_seconds
      }) }, token);
      setModal(null); setEditExForm(null); refresh();
    } catch {} finally { setSaving(false); }
  };

  const createExerciseTemplate = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/pro/exercise-templates', { method: 'POST', body: JSON.stringify(exTplForm) }, token);
      setModal(null); setExTplForm(emptyExTpl); refresh();
    } catch {} finally { setSaving(false); }
  };

  const deleteExerciseTemplate = async (id: string) => {
    try { await apiFetch(`/api/pro/exercise-templates/${id}`, { method: 'DELETE' }, token); refresh(); } catch {}
  };

  const createMealTemplate = async () => {
    setSaving(true);
    try {
      const body = { ...mealForm, items: mealForm.ingredients.filter(i => i.name).map(i => `${i.name} ${i.quantity}${i.unit}`) };
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

  const GBTN = (active: boolean): any => ({
    padding: '16px', borderRadius: 999, textAlign: 'center', cursor: active && !saving ? 'pointer' : 'default',
    background: active ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.06)',
    backdropFilter: active ? 'blur(16px)' : 'none', WebkitBackdropFilter: active ? 'blur(16px)' : 'none',
    border: active ? '1.5px solid rgba(220,38,38,0.3)' : '1px solid rgba(255,255,255,0.08)',
    boxShadow: active ? '0 4px 20px rgba(220,38,38,0.12), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
    color: active ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 800, opacity: saving ? 0.5 : 1,
  });

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9CA3AF', fontFamily: 'Inter, system-ui, sans-serif' } as any}><i className="ri-loader-4-line ri-spin" style={{ fontSize: 32 }} /></div>;

  return (
    <div data-testid="pro-space" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ══ HEADER ══ */}
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

            {/* ── PILL TABS ── */}
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

            {/* ── BEN SELECTOR (full width glass) ── */}
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

            {/* ── HORIZONTAL CALENDAR ── */}
            {tab === 'patients' && activeBen && (
              <HorizontalCalendar selectedDate={selectedDate} onSelect={setSelectedDate} accent={AC} />
            )}
          </div>
        </div>

        {/* ══ CONTENT ══ */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 280px)' } as any}>

          {/* ════ PATIENTS TAB ════ */}
          {tab === 'patients' && (
            <>
              {/* Day exercises header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                  <i className="ri-calendar-check-line" style={{ fontSize: 16, color: AC }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>
                    Exercices du {selectedDayFr}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{filteredExercises.length}</span>
                </div>
                <div data-testid="cat-add-exercices" onClick={() => { setModal('assign-ex'); setModalCtx(null); }}
                  style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
                  <i className="ri-add-line" style={{ fontSize: 18, color: '#374151' }} />
                </div>
              </div>

              {/* Day exercises list with completion status */}
              {filteredExercises.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 16px', color: '#9CA3AF', fontSize: 13, borderRadius: 16, background: '#F4F4F5', marginBottom: 16 } as any}>
                  <i className="ri-inbox-2-line" style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#D1D5DB' }} />
                  Aucun exercice prevu le {selectedDayFr}
                </div>
              )}
              {filteredExercises.map(ex => {
                const done = (ex.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
                const partial = (ex.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'partial');
                return (
                  <div key={ex.id} data-testid={`day-exercise-${ex.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
                      background: done ? 'rgba(16,185,129,0.06)' : partial ? 'rgba(245,158,11,0.06)' : '#F4F4F5',
                      border: done ? '1px solid rgba(16,185,129,0.2)' : partial ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                      marginBottom: 8, transition: 'all 0.15s' } as any}>
                    {ex.image ? (
                      <div onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
                        style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' } as any}>
                        <img src={ex.image.startsWith('/') ? `${API}${ex.image}` : ex.image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                      </div>
                    ) : (
                      <div onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
                        style={{ width: 48, height: 48, borderRadius: 12, background: `${AC}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' } as any}>
                        <i className="ri-run-line" style={{ fontSize: 20, color: AC }} />
                      </div>
                    )}
                    <div onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
                      style={{ flex: 1, minWidth: 0, cursor: 'pointer' } as any}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{ex.title}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{ex.sets}x{ex.repetitions} - {ex.rest_seconds}s repos</div>
                    </div>
                    {/* Status badge */}
                    {done ? (
                      <div data-testid={`exercise-status-done-${ex.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)' } as any}>
                        <i className="ri-checkbox-circle-fill" style={{ fontSize: 16, color: '#10B981' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Fait</span>
                      </div>
                    ) : partial ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.1)' } as any}>
                        <i className="ri-indeterminate-circle-line" style={{ fontSize: 16, color: '#F59E0B' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>Partiel</span>
                      </div>
                    ) : (
                      <div data-testid={`exercise-status-pending-${ex.id}`} style={{ padding: '4px 10px', borderRadius: 999, background: '#E5E7EB' } as any}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>A faire</span>
                      </div>
                    )}
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 } as any}>
                      <div data-testid={`edit-exercise-${ex.id}`} onClick={(e: any) => { e.stopPropagation(); setEditExForm({ ...ex }); setModal('edit-assigned'); }}
                        style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
                        <i className="ri-pencil-line" style={{ fontSize: 14, color: '#374151' }} />
                      </div>
                      <div onClick={(e: any) => { e.stopPropagation(); deleteAssignedExercise(ex.id); }}
                        style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                        <i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* All assigned exercises summary (not filtered) */}
              {assignedExercises.length > 0 && assignedExercises.length !== filteredExercises.length && (
                <div style={{ marginTop: 8, marginBottom: 16 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Tous les exercices ({assignedExercises.length})</div>
                  {assignedExercises.filter(ex => !filteredExercises.find(f => f.id === ex.id)).map(ex => (
                    <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#F9FAFB', marginBottom: 4, opacity: 0.6 } as any}>
                      <i className="ri-run-line" style={{ fontSize: 14, color: '#9CA3AF' }} />
                      <div style={{ flex: 1, minWidth: 0 } as any}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{ex.title}</div>
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{(ex.days || []).map((d: string) => d.slice(0, 3)).join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rappels du jour */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 8 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                  <i className="ri-capsule-line" style={{ fontSize: 16, color: '#F59E0B' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Complements du {selectedDayFr}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{filteredReminders.length}</span>
                </div>
                <div data-testid="cat-add-rappels" onClick={() => { setModal('assign-rem'); setModalCtx(null); }}
                  style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
                  <i className="ri-add-line" style={{ fontSize: 18, color: '#374151' }} />
                </div>
              </div>
              {filteredReminders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 16px', color: '#9CA3AF', fontSize: 13, borderRadius: 16, background: '#F4F4F5', marginBottom: 16 } as any}>
                  <i className="ri-capsule-line" style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#D1D5DB' }} />
                  Aucun complement prevu le {selectedDayFr}
                </div>
              )}
              {filteredReminders.map(r => {
                const remImg = r.image || (r.reminder_type === 'hydration' ? REMINDER_IMAGES.hydration : REMINDER_IMAGES.medication);
                const remDone = (r.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
                return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
                  background: remDone ? 'rgba(16,185,129,0.06)' : '#FEF9C3',
                  border: remDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.15)', marginBottom: 8 } as any}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
                    <img src={remImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{r.dosage} - {r.time}</div>
                  </div>
                  {remDone ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)' } as any}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 16, color: '#10B981' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Fait</span>
                    </div>
                  ) : (
                    <div style={{ padding: '4px 10px', borderRadius: 999, background: '#E5E7EB' } as any}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>A faire</span>
                    </div>
                  )}
                  <div onClick={() => deleteAssignedReminder(r.id)}
                    style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} />
                  </div>
                </div>
                );
              })}

              {/* Repas du jour */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 16 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                  <i className="ri-restaurant-line" style={{ fontSize: 16, color: '#10B981' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Repas du {selectedDayFr}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{filteredMeals.length}</span>
                </div>
                <div data-testid="cat-add-repas" onClick={() => { setModal('assign-meal'); setModalCtx(null); }}
                  style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
                  <i className="ri-add-line" style={{ fontSize: 18, color: '#374151' }} />
                </div>
              </div>
              {filteredMeals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 16px', color: '#9CA3AF', fontSize: 13, borderRadius: 16, background: '#F4F4F5', marginBottom: 16 } as any}>
                  <i className="ri-restaurant-line" style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#D1D5DB' }} />
                  Aucun repas prevu le {selectedDayFr}
                </div>
              )}
              {filteredMeals.map(m => {
                const mealDone = (m.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
                const MEAL_IMGS: Record<string, string> = {
                  petit_dejeuner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png',
                  dejeuner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png',
                  collation: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png',
                  gouter: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png',
                  diner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png',
                };
                const mealImg = m.image || MEAL_IMGS[m.meal_type] || MEAL_IMGS.dejeuner;
                return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
                  background: mealDone ? 'rgba(16,185,129,0.06)' : '#ECFDF5',
                  border: mealDone ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(16,185,129,0.15)', marginBottom: 8 } as any}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
                    <img src={mealImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{m.meal_type?.replace('_', ' ')} {m.calories ? `- ${m.calories} kcal` : ''}</div>
                    {Array.isArray(m.items) && m.items.length > 0 && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{m.items.slice(0, 3).join(', ')}{m.items.length > 3 ? '...' : ''}</div>}
                  </div>
                  {mealDone ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)' } as any}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 16, color: '#10B981' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Fait</span>
                    </div>
                  ) : (
                    <div style={{ padding: '4px 10px', borderRadius: 999, background: '#E5E7EB' } as any}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>A faire</span>
                    </div>
                  )}
                  <div onClick={() => deleteAssignedMeal(m.id)}
                    style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} />
                  </div>
                </div>
                );
              })}
            </>
          )}

          {/* ════ LIBRARY TAB ════ */}
          {tab === 'library' && (
            <>
              {/* Exercices Card */}
              <div style={{ borderRadius: 18, background: '#F3F4F6', padding: 16, marginBottom: 16 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${AC}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className="ri-run-line" style={{ fontSize: 16, color: AC }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>Exercices</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginLeft: 4 }}>({exerciseTemplates.length})</span>
                  </div>
                  <div data-testid="lib-add-new-ex-tpl" onClick={() => { setExTplForm(emptyExTpl); setModal('new-ex-tpl'); }}
                    style={{ width: 32, height: 32, borderRadius: 10, background: AC, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
                  </div>
                </div>
                {exerciseTemplates.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>Aucun exercice dans la bibliotheque</div>}
                {exerciseTemplates.map(ex => (
                  <ItemCard key={ex.id} accent={AC} title={ex.title}
                    subtitle={`${ex.muscle_group || ex.category || ''} - ${ex.difficulty || ''}`}
                    badge={ex.sets > 0 ? `${ex.sets}x${ex.repetitions}` : ''}
                    image={ex.image}
                    onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.id, mode: 'template' } })}
                    onDelete={() => deleteExerciseTemplate(ex.id)} />
                ))}
              </div>

              {/* Rappels Card */}
              <div style={{ borderRadius: 18, background: '#F3F4F6', padding: 16, marginBottom: 16 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className="ri-capsule-line" style={{ fontSize: 16, color: '#F59E0B' }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>Complements</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginLeft: 4 }}>({reminderTemplates.length})</span>
                  </div>
                  <div data-testid="lib-add-new-rem" onClick={() => { setRemForm(emptyRem); setModal('new-rem'); }}
                    style={{ width: 32, height: 32, borderRadius: 10, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
                  </div>
                </div>
                {reminderTemplates.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>Aucun complement</div>}
                {reminderTemplates.map(r => (
                  <ItemCard key={r.id} accent="#F59E0B" title={r.title}
                    subtitle={`${r.dosage || ''} - ${r.time || ''}`}
                    badge={r.reminder_type === 'hydration' ? 'Hydrat.' : 'Suppl.'} />
                ))}
              </div>

              {/* Repas Card */}
              <div style={{ borderRadius: 18, background: '#F3F4F6', padding: 16, marginBottom: 16 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className="ri-restaurant-line" style={{ fontSize: 16, color: '#10B981' }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>Repas</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginLeft: 4 }}>({mealTemplates.length})</span>
                  </div>
                  <div data-testid="lib-add-new-meal" onClick={() => { setMealForm(emptyMeal); setModal('new-meal'); }}
                    style={{ width: 32, height: 32, borderRadius: 10, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
                  </div>
                </div>
                {mealTemplates.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>Aucun repas</div>}
                {mealTemplates.map(m => (
                  <ItemCard key={m.id} accent="#10B981"
                    title={m.title}
                    subtitle={Array.isArray(m.items) ? m.items.slice(0, 3).join(', ') : ''}
                    badge={m.calories ? `${m.calories} kcal` : (m.meal_type || '').replace('_', ' ')} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════ MODALS ══════ */}

      {/* ── Assign Exercise ── */}
      <GlassModal open={modal === 'assign-ex'} onClose={() => { setModal(null); setModalCtx(null); }} title="Ajouter un exercice">
        {exerciseTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: 13 } as any}>
            Aucun exercice dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: AC, cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un exercice</span>
          </div>
        ) : !modalCtx ? (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Choisissez un exercice de la bibliotheque :</div>
            {exerciseTemplates.map(tpl => (
              <div key={tpl.id} onClick={() => { setModalCtx(tpl.id); setExForm({ ...emptyEx, title: tpl.title, days: [], reps: tpl.repetitions || 12, sets: tpl.sets || 3, rest_seconds: tpl.rest_seconds || 60 }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 0.15s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                {tpl.image ? <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as any}><img src={tpl.image.startsWith('/') ? `${API}${tpl.image}` : tpl.image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>
                : <div style={{ width: 40, height: 40, borderRadius: 10, background: `${AC}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-run-line" style={{ fontSize: 18, color: AC }} /></div>}
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tpl.muscle_group || tpl.category} - {tpl.difficulty}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Personnalisez pour {activeBenData?.name} :</div>
            <div style={{ marginBottom: 16 }}>
              <label style={LBL}>Jours de la semaine</label>
              <DaysPicker selected={(exForm as any).days || []} onChange={days => setExForm({ ...exForm, days } as any)} accent={AC} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={exForm.sets} onChange={(e: any) => setExForm({ ...exForm, sets: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repetitions</label><input type="number" value={exForm.reps} onChange={(e: any) => setExForm({ ...exForm, reps: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repos (s)</label><input type="number" value={(exForm as any).rest_seconds || 60} onChange={(e: any) => setExForm({ ...exForm, rest_seconds: +e.target.value } as any)} style={INP} /></div>
            </div>
            <div data-testid="assign-ex-submit" onClick={() => {
              const days = (exForm as any).days || [];
              if (days.length === 0) return;
              assignExercise(modalCtx, days, exForm.reps || 12, exForm.sets || 3, (exForm as any).rest_seconds || 60);
            }} style={GBTN(((exForm as any).days || []).length > 0)}>
              {saving ? 'Assignation...' : `Assigner ${((exForm as any).days || []).length > 0 ? `(${((exForm as any).days || []).length} jours)` : '-- Choisissez des jours'}`}
            </div>
          </>
        )}
      </GlassModal>

      {/* ── Edit Assigned Exercise ── */}
      <GlassModal open={modal === 'edit-assigned' && !!editExForm} onClose={() => { setModal(null); setEditExForm(null); }} title="Modifier l'exercice">
        {editExForm && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 4, textTransform: 'capitalize' }}>{editExForm.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>{editExForm.muscle_group || editExForm.category}</div>
            <div style={{ marginBottom: 16 }}>
              <label style={LBL}>Jours de la semaine</label>
              <DaysPicker selected={editExForm.days || []} onChange={days => setEditExForm({ ...editExForm, days })} accent={AC} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={editExForm.sets} onChange={(e: any) => setEditExForm({ ...editExForm, sets: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repetitions</label><input type="number" value={editExForm.repetitions} onChange={(e: any) => setEditExForm({ ...editExForm, repetitions: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repos (s)</label><input type="number" value={editExForm.rest_seconds} onChange={(e: any) => setEditExForm({ ...editExForm, rest_seconds: +e.target.value })} style={INP} /></div>
            </div>
            <div data-testid="edit-ex-submit" onClick={(editExForm.days || []).length > 0 ? updateAssignedExercise : undefined} style={GBTN((editExForm.days || []).length > 0)}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </div>
          </>
        )}
      </GlassModal>

      {/* ── Assign Reminder ── */}
      <GlassModal open={modal === 'assign-rem'} onClose={() => { setModal(null); setModalCtx(null); }} title="Assigner un complement">
        {reminderTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: 13 } as any}>
            Aucun complement dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: '#F59E0B', cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un complement</span>
          </div>
        ) : !modalCtx ? (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Choisissez un complement :</div>
            {reminderTemplates.map(tpl => (
              <div key={tpl.id} onClick={() => { setModalCtx(tpl.id); setRemAssignForm({ days: [], time: tpl.time || '08:00', dosage: tpl.dosage || '' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-capsule-fill" style={{ fontSize: 18, color: '#F59E0B' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tpl.dosage} - {tpl.time}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Personnalisez pour {activeBenData?.name} :</div>
            <div style={{ marginBottom: 16 }}>
              <label style={LBL}>Jours de la semaine</label>
              <DaysPicker selected={remAssignForm.days} onChange={days => setRemAssignForm({ ...remAssignForm, days })} accent="#F59E0B" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Heure</label><input type="time" value={remAssignForm.time} onChange={(e: any) => setRemAssignForm({ ...remAssignForm, time: e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Dosage</label><input value={remAssignForm.dosage} onChange={(e: any) => setRemAssignForm({ ...remAssignForm, dosage: e.target.value })} style={INP} placeholder="5g/jour" /></div>
            </div>
            <div data-testid="assign-rem-submit" onClick={() => remAssignForm.days.length > 0 ? assignReminder(modalCtx, remAssignForm.days, remAssignForm.time, remAssignForm.dosage) : undefined} style={GBTN(remAssignForm.days.length > 0)}>
              {saving ? 'Assignation...' : `Assigner ${remAssignForm.days.length > 0 ? `(${remAssignForm.days.length} jours)` : '-- Choisissez des jours'}`}
            </div>
          </>
        )}
      </GlassModal>

      {/* ── Assign Meal ── */}
      <GlassModal open={modal === 'assign-meal'} onClose={() => { setModal(null); setModalCtx(null); }} title="Assigner un repas">
        {mealTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.4)', fontSize: 13 } as any}>
            Aucun repas dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: '#10B981', cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un repas</span>
          </div>
        ) : !modalCtx ? (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Choisissez un repas :</div>
            {mealTemplates.map(tpl => (
              <div key={tpl.id} onClick={() => { setModalCtx(tpl.id); setMealAssignForm({ days: [], meal_type: tpl.meal_type || 'dejeuner' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-restaurant-fill" style={{ fontSize: 18, color: '#10B981' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{(tpl.meal_type || '').replace('_', ' ')} {tpl.calories ? `- ${tpl.calories} kcal` : ''}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Personnalisez pour {activeBenData?.name} :</div>
            <div style={{ marginBottom: 16 }}>
              <label style={LBL}>Jours de la semaine</label>
              <DaysPicker selected={mealAssignForm.days} onChange={days => setMealAssignForm({ ...mealAssignForm, days })} accent="#10B981" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Type de repas</label>
              <select value={mealAssignForm.meal_type} onChange={(e: any) => setMealAssignForm({ ...mealAssignForm, meal_type: e.target.value })} style={SEL}>
                <option value="petit_dejeuner">Petit-dejeuner</option><option value="dejeuner">Dejeuner</option><option value="gouter">Gouter</option><option value="diner">Diner</option><option value="collation">Collation</option>
              </select>
            </div>
            <div data-testid="assign-meal-submit" onClick={() => mealAssignForm.days.length > 0 ? assignMeal(modalCtx, mealAssignForm.days, mealAssignForm.meal_type) : undefined} style={GBTN(mealAssignForm.days.length > 0)}>
              {saving ? 'Assignation...' : `Assigner ${mealAssignForm.days.length > 0 ? `(${mealAssignForm.days.length} jours)` : '-- Choisissez des jours'}`}
            </div>
          </>
        )}
      </GlassModal>

      {/* ══ RICH MEAL CREATION ══ */}
      <GlassModal open={modal === 'new-meal'} onClose={() => setModal(null)} title="Nouveau repas">
        <ImagePicker value={mealForm.image} onChange={url => setMealForm({ ...mealForm, image: url })} token={token} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Type</label><select value={mealForm.meal_type} onChange={(e: any) => setMealForm({ ...mealForm, meal_type: e.target.value })} style={SEL}><option value="petit_dejeuner">Petit-dejeuner</option><option value="dejeuner">Dejeuner</option><option value="gouter">Gouter</option><option value="diner">Diner</option><option value="collation">Collation</option></select></div>
          <div style={{ flex: 1 }}><label style={LBL}>Titre</label><input value={mealForm.title} onChange={(e: any) => setMealForm({ ...mealForm, title: e.target.value })} style={INP} placeholder="Ex: Salade proteines" /></div>
        </div>
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

      {/* ══ EXERCISE TEMPLATE CREATION ══ */}
      <GlassModal open={modal === 'new-ex-tpl'} onClose={() => setModal(null)} title="Nouvel exercice">
        <ImagePicker value={exTplForm.image} onChange={url => setExTplForm({ ...exTplForm, image: url })} token={token} />
        <div style={{ marginBottom: 14 }}><label style={LBL}>Titre</label><input data-testid="extpl-title" value={exTplForm.title} onChange={(e: any) => setExTplForm({ ...exTplForm, title: e.target.value })} style={INP} placeholder="Ex: Squat bulgare" /></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Description</label><textarea value={exTplForm.description} onChange={(e: any) => setExTplForm({ ...exTplForm, description: e.target.value })} style={{ ...INP, height: 70, resize: 'none' } as any} placeholder="Instructions detaillees..." /></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Video URL</label><input value={exTplForm.video_url} onChange={(e: any) => setExTplForm({ ...exTplForm, video_url: e.target.value })} style={INP} placeholder="https://youtube.com/..." /></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Categorie</label><select value={exTplForm.category} onChange={(e: any) => setExTplForm({ ...exTplForm, category: e.target.value })} style={SEL}><option value="general">General</option><option value="force">Force</option><option value="cardio">Cardio</option><option value="mobilite">Mobilite</option><option value="equilibre">Equilibre</option><option value="souplesse">Souplesse</option></select></div>
          <div style={{ flex: 1 }}><label style={LBL}>Difficulte</label><select value={exTplForm.difficulty} onChange={(e: any) => setExTplForm({ ...exTplForm, difficulty: e.target.value })} style={SEL}><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option></select></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Groupe musculaire</label><input value={exTplForm.muscle_group} onChange={(e: any) => setExTplForm({ ...exTplForm, muscle_group: e.target.value })} style={INP} placeholder="Quadriceps" /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Materiel</label><input value={exTplForm.equipment} onChange={(e: any) => setExTplForm({ ...exTplForm, equipment: e.target.value })} style={INP} placeholder="Halteres" /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={exTplForm.sets} onChange={(e: any) => setExTplForm({ ...exTplForm, sets: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Reps</label><input type="number" value={exTplForm.repetitions} onChange={(e: any) => setExTplForm({ ...exTplForm, repetitions: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Min.</label><input type="number" value={exTplForm.duration_min} onChange={(e: any) => setExTplForm({ ...exTplForm, duration_min: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Repos (s)</label><input type="number" value={exTplForm.rest_seconds} onChange={(e: any) => setExTplForm({ ...exTplForm, rest_seconds: +e.target.value })} style={INP} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Etapes / Instructions</label>
            <div onClick={() => setExTplForm({ ...exTplForm, steps: [...exTplForm.steps, ''] })}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {exTplForm.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' } as any}>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', width: 20, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
              <input value={s} onChange={(e: any) => { const arr = [...exTplForm.steps]; arr[i] = e.target.value; setExTplForm({ ...exTplForm, steps: arr }); }} style={{ ...INP, flex: 1 }} placeholder={`Etape ${i + 1}`} />
              {exTplForm.steps.length > 1 && <div onClick={() => setExTplForm({ ...exTplForm, steps: exTplForm.steps.filter((_, j) => j !== i) })} style={{ cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          ))}
        </div>
        <div data-testid="extpl-submit" onClick={exTplForm.title ? createExerciseTemplate : undefined} style={GBTN(!!exTplForm.title)}>{saving ? 'Enregistrement...' : 'Enregistrer dans la bibliotheque'}</div>
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

function ItemCard({ title, subtitle, badge, accent, image, onClick, onDelete }: {
  title: string; subtitle: string; badge?: string; accent: string; image?: string;
  onClick?: () => void; onDelete?: () => void;
}) {
  return (
    <div data-testid={`item-card-${title}`} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#FFF', marginBottom: 6, transition: 'all 0.15s', cursor: onClick ? 'pointer' : 'default' } as any}>
      {image && <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as any}><img src={image.startsWith('/') ? `${API}${image}` : image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>}
      <div style={{ flex: 1, minWidth: 0 } as any}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{title}</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{subtitle}</div>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: accent, background: `${accent}10`, padding: '3px 8px', borderRadius: 999, flexShrink: 0 } as any}>{badge}</span>}
      {onDelete && (
        <div onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
          <i className="ri-delete-bin-6-line" style={{ fontSize: 13, color: '#EF4444' }} />
        </div>
      )}
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
