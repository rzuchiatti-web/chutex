import React from 'react';
import { API, MEAL_IMGS, toLocalDateStr } from './constants';
import { REMINDER_IMAGES } from '../constants';

interface ProDayViewProps {
  filteredExercises: any[];
  filteredReminders: any[];
  filteredMeals: any[];
  selectedDayFr: string;
  selectedDateStr: string;
  AC: string;
  router: any;
  onAddExercise: () => void;
  onAddReminder: () => void;
  onAddMeal: () => void;
  onAddHydration: () => void;
  onEditExercise: (ex: any) => void;
  onEditReminder: (r: any) => void;
  onEditMeal: (m: any) => void;
  onDeleteExercise: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onDeleteMeal: (id: string) => void;
  benNutrition: any;
  benWeightGoal: any;
  activeBenId: string;
}

export function ProDayView(props: ProDayViewProps) {
  const { filteredExercises, filteredReminders, filteredMeals, selectedDayFr, selectedDateStr, AC, router, benNutrition, benWeightGoal, activeBenId } = props;

  return (
    <>
      {/* Nutrition Card */}
      {benNutrition && benNutrition.daily_calories > 0 && (
        <div data-testid="nutrition-card" style={{ borderRadius: 16, background: '#F4F4F5', padding: '16px 18px', marginBottom: 18 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
            <i className="ri-sparkling-2-line" style={{ fontSize: 14, color: '#7C3AED' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Apport calorique recommande par Nora</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 } as any}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#111', letterSpacing: -1 }}>{benNutrition.daily_calories}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>kcal/jour</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, background: '#FFF', border: '1px solid #E5E7EB' } as any}>
              <i className="ri-drop-fill" style={{ fontSize: 13, color: '#38BDF8' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{benNutrition.water_ml >= 1000 ? `${(benNutrition.water_ml / 1000).toFixed(1)}L` : `${benNutrition.water_ml}ml`}</span>
            </div>
          </div>
          <div style={{ height: 1, background: '#E5E7EB', marginBottom: 12 } as any} />
          <div style={{ display: 'flex', alignItems: 'center' } as any}>
            {[{ label: 'Proteines', val: benNutrition.macros?.proteines_g || 0 }, { label: 'Glucides', val: benNutrition.macros?.glucides_g || 0 }, { label: 'Lipides', val: benNutrition.macros?.lipides_g || 0 }].map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && <div style={{ width: 1, height: 28, background: '#E5E7EB' } as any} />}
                <div style={{ flex: 1, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{m.val}<span style={{ fontSize: 10, color: '#9CA3AF' }}>g</span></div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{m.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Weight Goal Card */}
      {benWeightGoal && benWeightGoal.has_goal && (
        <div data-testid="weight-goal-card" onClick={() => router.push({ pathname: '/minceur' as any, params: { beneficiaryId: activeBenId } })}
          style={{ borderRadius: 16, background: '#F4F4F5', padding: '16px 18px', marginBottom: 18, cursor: 'pointer' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <i className="ri-scales-3-line" style={{ fontSize: 16, color: '#7C3AED' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Objectif poids</span>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#9CA3AF' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 } as any}>
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{benWeightGoal.current_kg}<span style={{ fontSize: 12, color: '#9CA3AF' }}>kg</span></div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Actuel</div>
            </div>
            <div style={{ flex: 1, position: 'relative', height: 8, borderRadius: 4, background: '#E5E7EB' } as any}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 4, background: '#7C3AED', width: `${Math.min(100, benWeightGoal.progress_pct || 0)}%`, transition: 'width 0.3s' } as any} />
            </div>
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#7C3AED' }}>{benWeightGoal.target_kg}<span style={{ fontSize: 12, color: '#9CA3AF' }}>kg</span></div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Objectif</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ fontSize: 11, color: '#6B7280' }}>
              {benWeightGoal.progress_pct > 0 ? `${benWeightGoal.progress_pct}% atteint` : 'En cours'}
              {benWeightGoal.weeks ? ` · ${benWeightGoal.weeks} semaines` : ''}
            </div>
            {benWeightGoal.current_kg > benWeightGoal.target_kg && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>-{(benWeightGoal.current_kg - benWeightGoal.target_kg).toFixed(1)}kg restant</span>
            )}
          </div>
        </div>
      )}

      {/* Exercices du jour */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0 18px' } as any} />
      <SectionHeader icon="ri-calendar-check-line" iconColor={AC} title={`Exercices du ${selectedDayFr}`} count={filteredExercises.length} onAdd={props.onAddExercise} testId="cat-add-exercices" />
      {filteredExercises.length === 0 && <EmptyDay icon="ri-inbox-2-line" text={`Aucun exercice prevu le ${selectedDayFr}`} />}
      {filteredExercises.map(ex => {
        const done = (ex.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        const partial = (ex.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'partial');
        return (
          <div key={ex.id} data-testid={`day-exercise-${ex.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: done ? 'rgba(16,185,129,0.06)' : partial ? 'rgba(245,158,11,0.06)' : '#F4F4F5',
              border: done ? '1px solid rgba(16,185,129,0.2)' : partial ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
              style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', background: ex.image ? 'none' : `${AC}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              {ex.image ? <img src={ex.image.startsWith('/') ? `${API}${ex.image}` : ex.image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                : <i className="ri-run-line" style={{ fontSize: 20, color: AC }} />}
            </div>
            <div onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
              style={{ flex: 1, minWidth: 0, cursor: 'pointer' } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{ex.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{ex.sets}x{ex.repetitions} - {ex.rest_seconds}s repos</div>
            </div>
            <StatusBadge done={done} partial={partial} testPrefix={`exercise-status-${ex.id}`} />
            <ActionButtons onEdit={() => props.onEditExercise(ex)} onDelete={() => props.onDeleteExercise(ex.id)} testPrefix={`exercise-${ex.id}`} />
          </div>
        );
      })}

      {/* Traitements du jour (non-hydratation) */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />
      <SectionHeader icon="ri-capsule-line" iconColor="#F59E0B" title={`Traitements du ${selectedDayFr}`} count={filteredReminders.filter(r => r.reminder_type !== 'hydration').length} onAdd={props.onAddReminder} testId="cat-add-rappels" />
      {filteredReminders.filter(r => r.reminder_type !== 'hydration').length === 0 && <EmptyDay icon="ri-capsule-line" text={`Aucun complement prevu le ${selectedDayFr}`} />}
      {filteredReminders.filter(r => r.reminder_type !== 'hydration').map(r => {
        const remImg = r.image || REMINDER_IMAGES.medication;
        const remDone = (r.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        return (
          <div key={r.id} data-testid={`day-reminder-${r.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: remDone ? 'rgba(16,185,129,0.06)' : '#F4F4F5',
              border: remDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
              <img src={remImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
            </div>
            <div style={{ flex: 1, minWidth: 0 } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{r.dosage} - {r.time}</div>
            </div>
            <StatusBadge done={remDone} testPrefix={`reminder-status-${r.id}`} />
            <ActionButtons onEdit={() => props.onEditReminder(r)} onDelete={() => props.onDeleteReminder(r.id)} testPrefix={`reminder-${r.id}`} />
          </div>
        );
      })}

      {/* Hydratation du jour */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0 } as any}>
            <img src={REMINDER_IMAGES.hydration} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Hydratation du {selectedDayFr}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{filteredReminders.filter(r => r.reminder_type === 'hydration').length}</span>
        </div>
        <div data-testid="cat-add-hydratation" onClick={props.onAddHydration}
          style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
          <i className="ri-add-line" style={{ fontSize: 18, color: '#374151' }} />
        </div>
      </div>
      {filteredReminders.filter(r => r.reminder_type === 'hydration').length === 0 && <EmptyDay icon="ri-drop-line" text={`Aucun rappel hydratation le ${selectedDayFr}`} />}
      {filteredReminders.filter(r => r.reminder_type === 'hydration').map(r => {
        const remImg = r.image || REMINDER_IMAGES.hydration;
        const remDone = (r.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        return (
          <div key={r.id} data-testid={`day-hydration-${r.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: remDone ? 'rgba(16,185,129,0.06)' : '#F4F4F5',
              border: remDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
              <img src={remImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
            </div>
            <div style={{ flex: 1, minWidth: 0 } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{r.dosage} - {r.time}</div>
            </div>
            <StatusBadge done={remDone} />
            <ActionButtons onEdit={() => props.onEditReminder(r)} onDelete={() => props.onDeleteReminder(r.id)} />
          </div>
        );
      })}

      {/* Repas du jour */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />
      <SectionHeader icon="ri-restaurant-line" iconColor="#10B981" title={`Repas du ${selectedDayFr}`} count={filteredMeals.length} onAdd={props.onAddMeal} testId="cat-add-repas" />
      {filteredMeals.length === 0 && <EmptyDay icon="ri-restaurant-line" text={`Aucun repas prevu le ${selectedDayFr}`} />}
      {filteredMeals.map(m => {
        const mealDone = (m.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        const mealImg = m.image || MEAL_IMGS[m.meal_type] || MEAL_IMGS.dejeuner;
        return (
          <div key={m.id} data-testid={`day-meal-${m.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: mealDone ? 'rgba(16,185,129,0.06)' : '#F4F4F5',
              border: mealDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div onClick={() => router.push({ pathname: '/meal-detail' as any, params: { id: m.meal_template_id || m.id, mode: 'assigned', assignmentId: m.id } })}
              style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' } as any}>
              <img src={mealImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
            </div>
            <div onClick={() => router.push({ pathname: '/meal-detail' as any, params: { id: m.meal_template_id || m.id, mode: 'assigned', assignmentId: m.id } })}
              style={{ flex: 1, minWidth: 0, cursor: 'pointer' } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{m.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{m.meal_type?.replace('_', ' ')} {m.calories ? `- ${m.calories} kcal` : ''}</div>
            </div>
            <StatusBadge done={mealDone} testPrefix={`meal-status-${m.id}`} />
            <ActionButtons onEdit={() => props.onEditMeal(m)} onDelete={() => props.onDeleteMeal(m.id)} testPrefix={`meal-${m.id}`} />
          </div>
        );
      })}
    </>
  );
}

/* ── Small helpers ── */

function SectionHeader({ icon, iconColor, title, count, onAdd, testId, style }: { icon: string; iconColor: string; title: string; count: number; onAdd: () => void; testId?: string; style?: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, ...style } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
        <i className={icon} style={{ fontSize: 16, color: iconColor }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{title}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{count}</span>
      </div>
      <div data-testid={testId} onClick={onAdd}
        style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
        <i className="ri-add-line" style={{ fontSize: 18, color: '#374151' }} />
      </div>
    </div>
  );
}

function StatusBadge({ done, partial, testPrefix }: { done: boolean; partial?: boolean; testPrefix?: string }) {
  if (done) return (
    <div data-testid={testPrefix ? `${testPrefix}-done` : undefined} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)' } as any}>
      <i className="ri-checkbox-circle-fill" style={{ fontSize: 16, color: '#10B981' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Fait</span>
    </div>
  );
  if (partial) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.1)' } as any}>
      <i className="ri-indeterminate-circle-line" style={{ fontSize: 16, color: '#F59E0B' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>Partiel</span>
    </div>
  );
  return (
    <div data-testid={testPrefix ? `${testPrefix}-pending` : undefined} style={{ padding: '4px 10px', borderRadius: 999, background: '#E5E7EB' } as any}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>A faire</span>
    </div>
  );
}

function ActionButtons({ onEdit, onDelete, testPrefix }: { onEdit: () => void; onDelete: () => void; testPrefix?: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 } as any}>
      <div data-testid={testPrefix ? `edit-${testPrefix}` : undefined} onClick={(e: any) => { e.stopPropagation(); onEdit(); }}
        style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
        <i className="ri-pencil-line" style={{ fontSize: 14, color: '#374151' }} />
      </div>
      <div onClick={(e: any) => { e.stopPropagation(); onDelete(); }}
        style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
        <i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} />
      </div>
    </div>
  );
}

function EmptyDay({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 16px', color: '#9CA3AF', fontSize: 13, borderRadius: 16, background: '#F4F4F5', marginBottom: 16 } as any}>
      <i className={icon} style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#D1D5DB' }} />
      {text}
    </div>
  );
}
