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

const TABS = [
  { key: 'programs', icon: 'ri-file-list-3-line', label: 'Programmes' },
  { key: 'reminders', icon: 'ri-capsule-line', label: 'Rappels' },
  { key: 'meals', icon: 'ri-restaurant-line', label: 'Repas' },
  { key: 'messages', icon: 'ri-chat-3-line', label: 'Messages' },
  { key: 'bilans', icon: 'ri-bar-chart-box-line', label: 'Bilans' },
];

function SL({ children, icon, color }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px' } as any}>
      {icon && <i className={icon} style={{ fontSize: 14, color: color || C.muted }} />}
      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 } as any}>{children}</span>
    </div>
  );
}

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

/* ── Reminders Tab Content ── */
function RemindersTab({ token, activeBen, activeBenData }: any) {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ reminder_type: 'medication', title: '', time: '08:00', dosage: '', notes: '', days: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] });

  const fetchReminders = useCallback(async () => {
    if (!activeBen) return;
    try {
      const rems = await apiFetch(`/api/pro/reminders/${activeBen}`, {}, token);
      setReminders(rems);
    } catch { setReminders([]); }
    finally { setLoading(false); }
  }, [token, activeBen]);

  useEffect(() => { setLoading(true); fetchReminders(); }, [fetchReminders]);

  const createReminder = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await apiFetch(`/api/pro/reminders/${activeBen}`, { method: 'POST', body: JSON.stringify(form) }, token);
      setShowAdd(false);
      setForm({ reminder_type: 'medication', title: '', time: '08:00', dosage: '', notes: '', days: ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'] });
      fetchReminders();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setSaving(false); }
  };

  const deleteReminder = async (id: string) => {
    try {
      await apiFetch(`/api/pro/reminders/${id}`, { method: 'DELETE' }, token);
      fetchReminders();
    } catch {}
  };

  const TYPES = [
    { key: 'medication', icon: 'ri-capsule-line', label: 'Complement / Traitement', color: C.amber },
    { key: 'hydration', icon: 'ri-drop-line', label: 'Hydratation', color: '#38BDF8' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 40 } as any}><div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
        <SL icon="ri-capsule-line" color={C.amber}>Rappels prescrits</SL>
        <div data-testid="add-reminder-btn" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', cursor: 'pointer' } as any}>
          <i className="ri-add-line" style={{ fontSize: 14, color: C.amber }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.amber }}>Prescrire</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color: C.sub, marginBottom: 12, lineHeight: 1.5 }}>
        Les rappels prescrits apparaissent directement dans l'espace "Mes rappels" de {activeBenData?.name || 'votre patient'}.
      </div>

      {reminders.length === 0 && (
        <div style={{ ...GL, padding: '32px 20px', textAlign: 'center' } as any}>
          <i className="ri-capsule-line" style={{ fontSize: 28, color: C.muted, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Aucun rappel prescrit</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Prescrivez des complements ou rappels d'hydratation</div>
        </div>
      )}

      {reminders.map((rem) => {
        const t = TYPES.find(tt => tt.key === rem.reminder_type) || TYPES[0];
        return (
          <div key={rem.id} data-testid={`pro-reminder-${rem.id}`} style={{ ...GL, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${t.color}12`, border: `1px solid ${t.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className={t.icon} style={{ fontSize: 20, color: t.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{rem.title}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                {rem.time} {rem.dosage ? `· ${rem.dosage}` : ''} {rem.notes ? `· ${rem.notes}` : ''}
              </div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                {rem.days?.join(', ')}
              </div>
            </div>
            <div onClick={() => deleteReminder(rem.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
              <i className="ri-delete-bin-line" style={{ fontSize: 13, color: C.red }} />
            </div>
          </div>
        );
      })}

      {/* Add reminder modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#12121E', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 18 }}>Prescrire un rappel</div>

            {/* Type selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
              {TYPES.map((t) => {
                const sel = form.reminder_type === t.key;
                return (
                  <div key={t.key} onClick={() => setForm({ ...form, reminder_type: t.key })}
                    style={{ flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                      background: sel ? `${t.color}12` : C.faint, border: `1.5px solid ${sel ? t.color : 'transparent'}`,
                    } as any}>
                    <i className={t.icon} style={{ fontSize: 18, color: sel ? t.color : C.muted, display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: sel ? t.color : C.muted }}>{t.label}</div>
                  </div>
                );
              })}
            </div>

            <input data-testid="reminder-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={form.reminder_type === 'medication' ? "Nom du complement / traitement" : "Rappel hydratation"}
              style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10 } as any} />

            {form.reminder_type === 'medication' && (
              <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                placeholder="Dosage (ex: 1 gelule)"
                style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10 } as any} />
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 } as any}>Heure</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none' } as any} />
              </div>
            </div>

            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes (optionnel)"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', minHeight: 50, resize: 'vertical', marginBottom: 14 } as any} />

            {/* Days selector */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18 } as any}>
              {['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map((d) => {
                const sel = form.days.includes(d);
                return (
                  <div key={d} onClick={() => setForm({ ...form, days: sel ? form.days.filter(dd => dd !== d) : [...form.days, d] })}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                      background: sel ? 'rgba(59,130,246,0.12)' : C.faint, border: `1.5px solid ${sel ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                      color: sel ? C.accent : C.muted,
                    } as any}>
                    {d.charAt(0).toUpperCase() + d.slice(1, 3)}
                  </div>
                );
              })}
            </div>

            <div data-testid="submit-reminder" onClick={saving ? undefined : createReminder}
              style={{ padding: '15px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: form.title ? C.amber : C.faint, color: form.title ? '#FFF' : C.muted, fontSize: 14, fontWeight: 800, opacity: saving ? 0.5 : 1 } as any}>
              {saving ? 'Prescription...' : 'Prescrire le rappel'}
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}

/* ── Meals Tab Content ── */
function MealsTab({ token, activeBen, activeBenData }: any) {
  const [meals, setMeals] = useState<any[]>([]);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'lunch', label: 'Dejeuner', name: '', description: '', calories: 0, time: '12:30', prep_time: '', proteines_g: 0, glucides_g: 0, lipides_g: 0 });

  const MEAL_TYPES = [
    { type: 'breakfast', label: 'Petit-dej', icon: 'ri-sun-line', color: C.amber },
    { type: 'lunch', label: 'Dejeuner', icon: 'ri-restaurant-line', color: C.green },
    { type: 'snack', label: 'Collation', icon: 'ri-cup-line', color: C.purple },
    { type: 'dinner', label: 'Diner', icon: 'ri-moon-line', color: C.accent },
  ];

  const fetchMeals = useCallback(async () => {
    if (!activeBen) return;
    try {
      const data = await apiFetch(`/api/pro/meals/${activeBen}`, {}, token);
      setMeals(data.meals || []);
      setSource(data.source || 'none');
    } catch { setMeals([]); }
    finally { setLoading(false); }
  }, [token, activeBen]);

  useEffect(() => { setLoading(true); fetchMeals(); }, [fetchMeals]);

  const addMeal = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await apiFetch(`/api/pro/meals/${activeBen}`, { method: 'POST', body: JSON.stringify(form) }, token);
      setShowAdd(false);
      setForm({ type: 'lunch', label: 'Dejeuner', name: '', description: '', calories: 0, time: '12:30', prep_time: '', proteines_g: 0, glucides_g: 0, lipides_g: 0 });
      fetchMeals();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setSaving(false); }
  };

  const deleteMeal = async (idx: number) => {
    try {
      await apiFetch(`/api/pro/meals/${activeBen}/${idx}`, { method: 'DELETE' }, token);
      fetchMeals();
    } catch {}
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 } as any}><div style={{ width: 30, height: 30, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: C.green, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
        <SL icon="ri-restaurant-line" color={C.green}>Plan repas du jour</SL>
        <div data-testid="add-meal-btn" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}>
          <i className="ri-add-line" style={{ fontSize: 14, color: C.green }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>Repas</span>
        </div>
      </div>

      {source && (
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>
          {source === 'pro' ? 'Plan personnalise par vous' : source === 'minceur' ? 'Plan genere par Nora (modifiable)' : 'Aucun plan disponible'}
        </div>
      )}

      {meals.length === 0 && (
        <div style={{ ...GL, padding: '32px 20px', textAlign: 'center' } as any}>
          <i className="ri-restaurant-line" style={{ fontSize: 28, color: C.muted, display: 'block', marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Aucun repas pour aujourd'hui</div>
        </div>
      )}

      {meals.map((meal: any, idx: number) => {
        const mt = MEAL_TYPES.find(m => m.type === meal.type) || MEAL_TYPES[1];
        return (
          <div key={idx} data-testid={`meal-${idx}`} style={{ ...GL, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${mt.color}12`, border: `1px solid ${mt.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className={mt.icon} style={{ fontSize: 20, color: mt.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{meal.name}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                {meal.label || mt.label} {meal.time ? `· ${meal.time}` : ''} {meal.calories ? `· ${meal.calories} kcal` : ''}
              </div>
              {meal.description && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{meal.description}</div>}
              {meal.created_by_pro && <span style={{ fontSize: 9, color: C.accent, fontWeight: 700 }}>Prescrit par vous</span>}
            </div>
            <div onClick={() => deleteMeal(idx)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
              <i className="ri-delete-bin-line" style={{ fontSize: 13, color: C.red }} />
            </div>
          </div>
        );
      })}

      {/* Add meal modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end' } as any} onClick={() => setShowAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', background: '#12121E', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', maxHeight: '80vh', overflowY: 'auto' } as any}>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 18 }}>Ajouter un repas</div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 } as any}>
              {MEAL_TYPES.map((mt) => {
                const sel = form.type === mt.type;
                return (
                  <div key={mt.type} onClick={() => setForm({ ...form, type: mt.type, label: mt.label })}
                    style={{ flex: 1, padding: '10px 6px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                      background: sel ? `${mt.color}12` : C.faint, border: `1.5px solid ${sel ? mt.color : 'transparent'}`,
                    } as any}>
                    <i className={mt.icon} style={{ fontSize: 16, color: sel ? mt.color : C.muted, display: 'block', marginBottom: 2 }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: sel ? mt.color : C.muted }}>{mt.label}</div>
                  </div>
                );
              })}
            </div>

            <input data-testid="meal-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nom du repas"
              style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', marginBottom: 10 } as any} />

            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description / ingredients..."
              style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', minHeight: 60, resize: 'vertical', marginBottom: 10 } as any} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 } as any}>
              <div>
                <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 } as any}>Calories</label>
                <input type="number" value={form.calories || ''} onChange={(e) => setForm({ ...form, calories: parseInt(e.target.value) || 0 })}
                  placeholder="0" style={{ width: '100%', padding: '11px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none', textAlign: 'center' } as any} />
              </div>
              <div>
                <label style={{ fontSize: 10, color: C.muted, fontWeight: 600, display: 'block', marginBottom: 4 } as any}>Heure</label>
                <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none' } as any} />
              </div>
            </div>

            <div data-testid="submit-meal" onClick={saving ? undefined : addMeal}
              style={{ padding: '15px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: form.name ? C.green : C.faint, color: form.name ? '#FFF' : C.muted, fontSize: 14, fontWeight: 800, opacity: saving ? 0.5 : 1 } as any}>
              {saving ? 'Ajout...' : 'Ajouter le repas'}
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}

/* ── Bilans Tab Content ── */
function BilansTab({ token, activeBen, activeBenData }: any) {
  const [bilan, setBilan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('week');

  const generateBilan = async () => {
    if (!activeBen) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/pro/bilan/${activeBen}?period=${period}`, {}, token);
      setBilan(data);
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <SL icon="ri-bar-chart-box-line" color={C.purple}>Bilans Nora</SL>
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>
        Generez un bilan de sante complet pour {activeBenData?.name || 'votre patient'} par l'IA Nora.
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
        {[
          { key: 'week', label: 'Hebdomadaire', icon: 'ri-calendar-line' },
          { key: 'month', label: 'Mensuel', icon: 'ri-calendar-2-line' },
        ].map((p) => {
          const sel = period === p.key;
          return (
            <div key={p.key} onClick={() => setPeriod(p.key)}
              style={{ flex: 1, padding: '12px 10px', borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                background: sel ? 'rgba(167,139,250,0.12)' : C.faint, border: `1.5px solid ${sel ? C.purple : 'transparent'}`,
              } as any}>
              <i className={p.icon} style={{ fontSize: 16, color: sel ? C.purple : C.muted, display: 'block', marginBottom: 4 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: sel ? C.purple : C.muted }}>{p.label}</div>
            </div>
          );
        })}
      </div>

      <div data-testid="generate-bilan-btn" onClick={loading ? undefined : generateBilan}
        style={{ ...GL, padding: '16px', textAlign: 'center', cursor: 'pointer', marginBottom: 16, opacity: loading ? 0.5 : 1 } as any}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: C.purple, animation: 'spin 0.8s linear infinite' } as any} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>Nora analyse les donnees...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
            <i className="ri-sparkling-line" style={{ fontSize: 18, color: C.purple }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>Generer le bilan {period === 'week' ? 'hebdomadaire' : 'mensuel'}</span>
          </div>
        )}
      </div>

      {bilan && (
        <div data-testid="bilan-result" style={{ ...GL, padding: '20px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.12)', border: `1px solid ${C.purple}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-sparkling-fill" style={{ fontSize: 18, color: C.purple }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Bilan {bilan.period === 'week' ? 'hebdomadaire' : 'mensuel'}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{bilan.beneficiary_name} · {new Date(bilan.generated_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          {/* Vitals summary */}
          {bilan.vitals && Object.keys(bilan.vitals).length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' } as any}>
              {bilan.vitals.avg_heart_rate && <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', fontSize: 11, color: C.red, fontWeight: 600 }}><i className="ri-heart-pulse-line" style={{ fontSize: 10, marginRight: 3 }} />{bilan.vitals.avg_heart_rate} bpm</div>}
              {bilan.vitals.avg_spo2 && <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', fontSize: 11, color: C.accent, fontWeight: 600 }}><i className="ri-drop-line" style={{ fontSize: 10, marginRight: 3 }} />{bilan.vitals.avg_spo2}%</div>}
              {bilan.vitals.avg_steps && <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', fontSize: 11, color: C.green, fontWeight: 600 }}><i className="ri-footprint-line" style={{ fontSize: 10, marginRight: 3 }} />{bilan.vitals.avg_steps} pas/j</div>}
            </div>
          )}

          {/* Bilan text */}
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{bilan.bilan_text}</div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}

/* ── Subscription Tab Content ── */
function SubscriptionTab({ token, activeBen, activeBenData }: any) {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState(false);
  const [subType, setSubType] = useState('sport');
  const [desc, setDesc] = useState('');
  const gold = '#D4AF37';

  const fetchSub = useCallback(async () => {
    if (!activeBen) return;
    try {
      const data = await apiFetch(`/api/pro/subscriptions/${activeBen}`, {}, token);
      setSub(data && data.id ? data : null);
    } catch { setSub(null); }
    finally { setLoading(false); }
  }, [token, activeBen]);

  useEffect(() => { setLoading(true); fetchSub(); }, [fetchSub]);

  const propose = async () => {
    setProposing(true);
    try {
      await apiFetch(`/api/pro/subscriptions/${activeBen}`, { method: 'POST', body: JSON.stringify({ type: subType, description: desc }) }, token);
      setDesc('');
      fetchSub();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setProposing(false); }
  };

  const cancel = async () => {
    if (!sub) return;
    try {
      await apiFetch(`/api/pro/subscriptions/${sub.id}/cancel`, { method: 'POST' }, token);
      fetchSub();
    } catch {}
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 } as any}><div style={{ width: 30, height: 30, borderRadius: '50%', border: `3px solid rgba(255,255,255,0.06)`, borderTopColor: gold, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>;

  return (
    <div>
      <SL icon="ri-vip-crown-line" color={gold}>Abonnement</SL>

      {sub ? (
        <div data-testid="active-subscription" style={{ ...GL, padding: '20px', marginBottom: 12 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${gold}12`, border: `1px solid ${gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-vip-crown-fill" style={{ fontSize: 24, color: gold }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Abonnement {sub.type === 'sport' ? 'Sport' : 'Physio'}</div>
              <div style={{ fontSize: 11, color: C.sub }}>{sub.price_ttc}€/mois TTC</div>
            </div>
            <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 999, background: sub.status === 'active' ? `${C.green}15` : sub.status === 'pending' ? `${C.amber}15` : `${C.red}15`, border: `1px solid ${sub.status === 'active' ? `${C.green}30` : sub.status === 'pending' ? `${C.amber}30` : `${C.red}30`}` } as any}>
              <span style={{ fontSize: 10, fontWeight: 700, color: sub.status === 'active' ? C.green : sub.status === 'pending' ? C.amber : C.red }}>
                {sub.status === 'active' ? 'Actif' : sub.status === 'pending' ? 'En attente' : sub.status === 'payment_pending' ? 'Paiement' : 'Annule'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5, marginBottom: 12 }}>
            {sub.description || `Programme ${sub.type} pour ${activeBenData?.name || 'votre patient'}`}
          </div>
          {sub.start_date && <div style={{ fontSize: 10, color: C.muted }}>Depuis le {new Date(sub.start_date).toLocaleDateString('fr-FR')}</div>}
          {(sub.status === 'active' || sub.status === 'pending') && (
            <div onClick={cancel} data-testid="cancel-sub-btn" style={{ marginTop: 12, padding: '10px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.06)', border: `1px solid rgba(239,68,68,0.15)`, fontSize: 12, fontWeight: 600, color: C.red } as any}>Annuler l'abonnement</div>
          )}
        </div>
      ) : (
        <div style={{ ...GL, padding: '20px', marginBottom: 12 } as any}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>Proposer un abonnement</div>
          <div style={{ fontSize: 11, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>
            Proposez un abonnement mensuel a 89€ TTC a {activeBenData?.name || 'votre patient'}. Les exercices seront geres exclusivement par vous.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
            {[{ k: 'sport', l: 'Sport', i: 'ri-run-line', c: C.accent }, { k: 'physio', l: 'Physio', i: 'ri-stethoscope-line', c: C.green }].map(t => {
              const sel = subType === t.k;
              return (
                <div key={t.k} onClick={() => setSubType(t.k)} style={{ flex: 1, padding: '12px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: sel ? `${t.c}12` : C.faint, border: `1.5px solid ${sel ? t.c : 'transparent'}` } as any}>
                  <i className={t.i} style={{ fontSize: 18, color: sel ? t.c : C.muted, display: 'block', marginBottom: 4 }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: sel ? t.c : C.muted }}>{t.l}</div>
                </div>
              );
            })}
          </div>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description du programme (optionnel)" style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 13, outline: 'none', minHeight: 50, resize: 'vertical', marginBottom: 12 } as any} />
          <div data-testid="propose-sub-btn" onClick={proposing ? undefined : propose} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: `${gold}15`, border: `1px solid ${gold}30`, fontSize: 14, fontWeight: 800, color: gold, opacity: proposing ? 0.5 : 1 } as any}>
            {proposing ? 'Envoi...' : 'Proposer l\'abonnement · 89€/mois'}
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}

/* ── Messages Tab Content ── */
function MessagesTab({ token, activeBen, activeBenData }: any) {
  const [convo, setConvo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const msgEndRef = React.useRef<HTMLDivElement>(null);

  const fetchConvo = useCallback(async () => {
    if (!activeBen) return;
    try {
      const c = await apiFetch(`/api/pro/conversations/${activeBen}`, {}, token);
      setConvo(c);
      if (c?.id) {
        const msgs = await apiFetch(`/api/pro/messages/${c.id}`, {}, token);
        setMessages(msgs);
      }
    } catch { }
    finally { setLoading(false); }
  }, [token, activeBen]);

  useEffect(() => { setLoading(true); fetchConvo(); }, [fetchConvo]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!convo?.id) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await apiFetch(`/api/pro/messages/${convo.id}`, {}, token);
        setMessages(msgs);
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [convo?.id, token]);

  const send = async () => {
    if (!newMsg.trim() || !convo?.id) return;
    setSending(true);
    try {
      const msg = await apiFetch(`/api/pro/messages/${convo.id}`, { method: 'POST', body: JSON.stringify({ content: newMsg }) }, token);
      setMessages(prev => [...prev, msg]);
      setNewMsg('');
    } catch {}
    finally { setSending(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 } as any}><div style={{ width: 30, height: 30, borderRadius: '50%', border: `3px solid rgba(255,255,255,0.06)`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>;

  return (
    <div data-testid="messages-tab" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 320px)' } as any}>
      <SL icon="ri-chat-3-line" color={C.accent}>Conversation avec {activeBenData?.name || 'patient'}</SL>

      {/* Messages list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', minHeight: 200 } as any}>
        {messages.length === 0 && (
          <div style={{ ...GL, padding: '32px 20px', textAlign: 'center' } as any}>
            <i className="ri-chat-3-line" style={{ fontSize: 28, color: C.muted, display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>Aucun message</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Commencez la conversation</div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id !== activeBen;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6 } as any}>
              <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isMe ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'}` } as any}>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{msg.content}</div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 4, textAlign: 'right' } as any}>{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          );
        })}
        <div ref={msgEndRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 0', flexShrink: 0 } as any}>
        <input data-testid="msg-input" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Votre message..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: 999, background: C.faint, border: '1px solid rgba(255,255,255,0.06)', color: C.text, fontSize: 14, outline: 'none' } as any} />
        <div data-testid="send-msg-btn" onClick={sending ? undefined : send}
          style={{ width: 44, height: 44, borderRadius: 999, background: newMsg.trim() ? C.accent : C.faint, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.5 : 1 } as any}>
          <i className="ri-send-plane-fill" style={{ fontSize: 18, color: newMsg.trim() ? '#FFF' : C.muted }} />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/* ── Main ProSpace Component ── */
/* ══════════════════════════════════════════════════════ */
export default function ProSpace({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [activeBen, setActiveBen] = useState<string>('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('programs');
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
  const [showNewProgram, setShowNewProgram] = useState(false);
  const [saving, setSaving] = useState(false);

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
    try { await apiFetch(`/api/pro/sessions/${programId}/${sessionId}`, { method: 'DELETE' }, token); fetchPrograms(); } catch {}
  };

  const deleteProgram = async (programId: string) => {
    try { await apiFetch(`/api/pro/programs/edit/${programId}`, { method: 'DELETE' }, token); fetchPrograms(); } catch {}
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
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Espace professionnel</div>
      </div>

      {/* Patient selector */}
      <div style={{ padding: '12px 20px 0', flexShrink: 0 } as any}>
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

      {/* Tab bar */}
      <div style={{ padding: '10px 20px 0', flexShrink: 0 } as any}>
        <div style={{ display: 'flex', gap: 2, background: C.faint, borderRadius: 14, padding: 3 } as any}>
          {TABS.map((tab) => {
            const sel = activeTab === tab.key;
            return (
              <div key={tab.key} data-testid={`tab-${tab.key}`} onClick={() => setActiveTab(tab.key)}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                  background: sel ? 'rgba(255,255,255,0.08)' : 'transparent', transition: 'all 0.15s',
                } as any}>
                <i className={tab.icon} style={{ fontSize: 14, color: sel ? C.text : C.muted, display: 'block', marginBottom: 2 }} />
                <div style={{ fontSize: 9, fontWeight: 700, color: sel ? C.text : C.muted }}>{tab.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Quick vitals */}
        {activeBenData && (
          <div style={{ ...GL, padding: '14px 16px', marginTop: 12, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
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

        {/* ═══ PROGRAMS TAB ═══ */}
        {activeTab === 'programs' && (
          <div>
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
                  <div style={{ paddingLeft: 4, marginTop: 6 }}>
                    {sessions.map((ex: any) => (
                      <ExerciseCard key={ex.id} ex={ex} onDelete={() => deleteExercise(prog.id, ex.id)} />
                    ))}
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
        )}

        {/* ═══ REMINDERS TAB ═══ */}
        {activeTab === 'reminders' && <RemindersTab token={token} activeBen={activeBen} activeBenData={activeBenData} />}

        {/* ═══ MEALS TAB ═══ */}
        {activeTab === 'meals' && <MealsTab token={token} activeBen={activeBen} activeBenData={activeBenData} />}

        {/* ═══ BILANS TAB ═══ */}
        {activeTab === 'bilans' && <BilansTab token={token} activeBen={activeBen} activeBenData={activeBenData} />}

        {/* ═══ MESSAGES TAB ═══ */}
        {activeTab === 'messages' && <MessagesTab token={token} activeBen={activeBen} activeBenData={activeBenData} />}
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
