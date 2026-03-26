import React from 'react';
import { API } from './constants';
import { REMINDER_IMAGES } from '../constants';

interface ProLibraryProps {
  AC: string;
  exerciseTemplates: any[];
  reminderTemplates: any[];
  mealTemplates: any[];
  router: any;
  onNewExercise: () => void;
  onNewReminder: () => void;
  onNewHydration: () => void;
  onNewMeal: () => void;
  onDeleteExerciseTemplate: (id: string) => void;
  onDeleteReminderTemplate: (id: string) => void;
  onDeleteMealTemplate: (id: string) => void;
}

const MEAL_TYPE_LABEL: Record<string, string> = { petit_dejeuner: 'Petit-dej', dejeuner: 'Dejeuner', gouter: 'Gouter', diner: 'Diner', collation: 'Collation' };

export function ProLibrary(props: ProLibraryProps) {
  const { AC, exerciseTemplates, reminderTemplates, mealTemplates, router } = props;

  return (
    <>
      {/* ── Exercices ── */}
      <SectionTitle icon="ri-run-line" iconColor={AC} title="Exercices" count={exerciseTemplates.length} onAdd={props.onNewExercise} addColor={AC} testId="lib-add-new-ex-tpl" />
      {exerciseTemplates.length === 0 && <Empty icon="ri-run-line" text="Aucun exercice dans la bibliotheque" />}
      {exerciseTemplates.map(ex => (
        <Card key={ex.id} testId={`item-card-${ex.title}`}
          onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.id, mode: 'template' } })}
          onDelete={() => props.onDeleteExerciseTemplate(ex.id)}
          image={ex.image} iconFallback="ri-run-line" iconColor={AC}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{ex.title}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{ex.muscle_group || ex.category || ''} {ex.difficulty ? `· ${ex.difficulty}` : ''}</div>
        </Card>
      ))}

      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />

      {/* ── Complements ── */}
      <SectionTitle icon="ri-capsule-line" iconColor="#F59E0B" title="Complements" count={reminderTemplates.filter(r => r.reminder_type !== 'hydration').length} onAdd={props.onNewReminder} addColor="#F59E0B" testId="lib-add-new-rem" />
      {reminderTemplates.filter(r => r.reminder_type !== 'hydration').length === 0 && <Empty icon="ri-capsule-line" text="Aucun complement" />}
      {reminderTemplates.filter(r => r.reminder_type !== 'hydration').map(r => (
        <Card key={r.id} testId={`item-card-${r.title}`}
          onDelete={() => props.onDeleteReminderTemplate(r.id)}
          image={r.image || REMINDER_IMAGES.medication} iconFallback="ri-capsule-line" iconColor="#F59E0B">
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{r.reminder_type === 'medication' ? 'Complement' : r.reminder_type}</div>
        </Card>
      ))}

      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />

      {/* ── Hydratation ── */}
      <SectionTitle icon="ri-drop-line" iconColor="#38BDF8" title="Hydratation" count={reminderTemplates.filter(r => r.reminder_type === 'hydration').length} onAdd={props.onNewHydration} addColor="#38BDF8" testId="lib-add-hydration" />
      {reminderTemplates.filter(r => r.reminder_type === 'hydration').length === 0 && <Empty icon="ri-drop-line" text="Aucun rappel hydratation" />}
      {reminderTemplates.filter(r => r.reminder_type === 'hydration').map(r => (
        <Card key={r.id} testId={`item-card-${r.title}`}
          onDelete={() => props.onDeleteReminderTemplate(r.id)}
          image={r.image || REMINDER_IMAGES.hydration} iconFallback="ri-drop-line" iconColor="#38BDF8">
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>Hydratation</div>
        </Card>
      ))}

      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />

      {/* ── Repas ── */}
      <SectionTitle icon="ri-restaurant-line" iconColor="#10B981" title="Repas" count={mealTemplates.length} onAdd={props.onNewMeal} addColor="#10B981" testId="lib-add-new-meal" />
      {mealTemplates.length === 0 && <Empty icon="ri-restaurant-line" text="Aucun repas" />}
      {mealTemplates.map(m => (
        <Card key={m.id} testId={`item-card-${m.title}`}
          onClick={() => router.push({ pathname: '/meal-detail' as any, params: { id: m.id, mode: 'template' } })}
          onDelete={() => props.onDeleteMealTemplate(m.id)}
          iconFallback="ri-restaurant-line" iconColor="#10B981">
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{m.title}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
            {MEAL_TYPE_LABEL[m.meal_type] || m.meal_type} {m.calories ? `· ${m.calories} kcal` : ''}
            {Array.isArray(m.items) && m.items.length > 0 ? ` · ${m.items.slice(0, 2).join(', ')}` : ''}
          </div>
        </Card>
      ))}
    </>
  );
}

/* ── Section title (same style as ProDayView SectionHeader) ── */
function SectionTitle({ icon, iconColor, title, count, onAdd, addColor, testId }: {
  icon: string; iconColor: string; title: string; count: number; onAdd: () => void; addColor: string; testId: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
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

/* ── Card (exact same style as ProDayView exercise/reminder/meal cards) ── */
function Card({ children, testId, onClick, onDelete, image, iconFallback, iconColor }: {
  children: React.ReactNode; testId: string; onClick?: () => void; onDelete?: () => void;
  image?: string; iconFallback: string; iconColor: string;
}) {
  return (
    <div data-testid={testId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: '#F4F4F5', border: '1px solid transparent', marginBottom: 8, transition: 'all 0.15s' } as any}>
      <div onClick={onClick} style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: onClick ? 'pointer' : 'default', background: image ? 'none' : `${iconColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
        {image ? <img src={image.startsWith('/') ? `${API}${image}` : image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
          : <i className={iconFallback} style={{ fontSize: 20, color: iconColor }} />}
      </div>
      <div onClick={onClick} style={{ flex: 1, minWidth: 0, cursor: onClick ? 'pointer' : 'default' } as any}>
        {children}
      </div>
      {onDelete && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 } as any}>
          {onClick && <div onClick={onClick}
            style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
            <i className="ri-eye-line" style={{ fontSize: 14, color: '#374151' }} />
          </div>}
          <div onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 16px', color: '#9CA3AF', fontSize: 13, borderRadius: 16, background: '#F4F4F5', marginBottom: 8 } as any}>
      <i className={icon} style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#D1D5DB' }} />
      {text}
    </div>
  );
}
