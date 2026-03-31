import React, { useState, useRef, useEffect } from 'react';
import { API } from './constants';
import { REMINDER_IMAGES } from '../constants';

interface ProLibraryProps {
  AC: string;
  exerciseTemplates: any[];
  reminderTemplates: any[];
  mealTemplates: any[];
  router: any;
  filter: string;
  onNewExercise: () => void;
  onNewReminder: () => void;
  onNewHydration: () => void;
  onNewMeal: () => void;
  onDeleteExerciseTemplate: (id: string) => void;
  onDeleteReminderTemplate: (id: string) => void;
  onDeleteMealTemplate: (id: string) => void;
  onEditExerciseTemplate?: (ex: any) => void;
  onEditReminderTemplate?: (r: any) => void;
  onEditMealTemplate?: (m: any) => void;
}

const MEAL_TYPE_LABEL: Record<string, string> = { petit_dejeuner: 'Petit-dej', dejeuner: 'Dejeuner', gouter: 'Gouter', diner: 'Diner', collation: 'Collation' };

export const LIB_FILTERS = [
  { key: 'exercices', label: 'Exercices', icon: 'ri-run-line', color: '#DC2626' },
  { key: 'complements', label: 'Complements', icon: 'ri-capsule-line', color: '#F59E0B' },
  { key: 'hydratation', label: 'Hydratation', icon: 'ri-drop-line', color: '#38BDF8' },
  { key: 'repas', label: 'Repas', icon: 'ri-restaurant-line', color: '#10B981' },
];

/* ── Header Dropdown (glass, matching ben-selector design) ── */
export function LibraryFilterDropdown({ filter, onFilterChange, counts }: {
  filter: string;
  onFilterChange: (key: string) => void;
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = LIB_FILTERS.find(f => f.key === filter) || LIB_FILTERS[0];

  return (
    <div ref={dropRef as any} style={{ position: 'relative', marginTop: 18, width: '100%', maxWidth: 360 } as any}>
      <div data-testid="lib-dropdown-trigger" onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', transition: 'all 0.2s' } as any}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${active.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `2px solid ${active.color}` } as any}>
          <i className={active.icon} style={{ fontSize: 18, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 } as any}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{active.label}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{counts[active.key] || 0} element{(counts[active.key] || 0) !== 1 ? 's' : ''}</div>
        </div>
        <i className={open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
      </div>

      {open && (
        <div style={{ marginTop: 8, width: '100%', borderRadius: 16, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden', zIndex: 100, position: 'relative' } as any}>
          {LIB_FILTERS.map(f => {
            const isActive = filter === f.key;
            return (
              <div key={f.key} data-testid={`lib-filter-${f.key}`}
                onClick={() => { onFilterChange(f.key); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: isActive ? f.color : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={f.icon} style={{ fontSize: 15, color: isActive ? '#FFF' : 'rgba(255,255,255,0.5)' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#FFF' : 'rgba(255,255,255,0.6)' }}>{f.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 999 }}>{counts[f.key] || 0}</span>
                {isActive && <i className="ri-check-line" style={{ fontSize: 16, color: f.color }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Library Content (renders in white content area) ── */
export function ProLibrary(props: ProLibraryProps) {
  const { AC, exerciseTemplates, reminderTemplates, mealTemplates, router, filter } = props;

  return (
    <>
      {/* ── Exercices ── */}
      {filter === 'exercices' && (
        <>
          <SectionTitle icon="ri-run-line" iconColor={AC} title="Exercices" count={exerciseTemplates.length} onAdd={props.onNewExercise} testId="lib-add-new-ex-tpl" />
          {exerciseTemplates.length === 0 && <Empty icon="ri-run-line" text="Aucun exercice dans la bibliotheque" />}
          {exerciseTemplates.map(ex => (
            <Card key={ex.id} testId={`item-card-${ex.title}`}
              onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.id, mode: 'template' } })}
              onEdit={props.onEditExerciseTemplate ? () => props.onEditExerciseTemplate!(ex) : undefined}
              onDelete={() => props.onDeleteExerciseTemplate(ex.id)}
              image={ex.image} iconFallback={ex.icon || 'ri-run-line'} iconColor={AC}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{ex.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{ex.muscle_group || ex.category || ''} {ex.difficulty ? `· ${ex.difficulty}` : ''}</div>
            </Card>
          ))}
        </>
      )}

      {/* ── Complements ── */}
      {filter === 'complements' && (
        <>
          <SectionTitle icon="ri-capsule-line" iconColor="#F59E0B" title="Complements" count={reminderTemplates.filter(r => r.reminder_type !== 'hydration').length} onAdd={props.onNewReminder} testId="lib-add-new-rem" />
          {reminderTemplates.filter(r => r.reminder_type !== 'hydration').length === 0 && <Empty icon="ri-capsule-line" text="Aucun complement" />}
          {reminderTemplates.filter(r => r.reminder_type !== 'hydration').map(r => (
            <Card key={r.id} testId={`item-card-${r.title}`}
              onEdit={props.onEditReminderTemplate ? () => props.onEditReminderTemplate!(r) : undefined}
              onDelete={() => props.onDeleteReminderTemplate(r.id)}
              image={r.image || REMINDER_IMAGES.medication} iconFallback="ri-capsule-line" iconColor="#F59E0B">
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {r.category || 'Complement'}{r.dosage ? ` · ${r.dosage}` : ''}
              </div>
              {r.description && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{r.description}</div>}
            </Card>
          ))}
        </>
      )}

      {/* ── Hydratation ── */}
      {filter === 'hydratation' && (
        <>
          <SectionTitle icon="ri-drop-line" iconColor="#38BDF8" title="Hydratation" count={reminderTemplates.filter(r => r.reminder_type === 'hydration').length} onAdd={props.onNewHydration} testId="lib-add-hydration" />
          {reminderTemplates.filter(r => r.reminder_type === 'hydration').length === 0 && <Empty icon="ri-drop-line" text="Aucun rappel hydratation" />}
          {reminderTemplates.filter(r => r.reminder_type === 'hydration').map(r => (
            <Card key={r.id} testId={`item-card-${r.title}`}
              onEdit={props.onEditReminderTemplate ? () => props.onEditReminderTemplate!(r) : undefined}
              onDelete={() => props.onDeleteReminderTemplate(r.id)}
              image={r.image || REMINDER_IMAGES.hydration} iconFallback="ri-drop-line" iconColor="#38BDF8">
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {r.category || 'Hydratation'}{r.volume ? ` · ${r.volume}` : ''}
              </div>
              {r.description && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{r.description}</div>}
              {Array.isArray(r.ingredients) && r.ingredients.length > 0 && (
                <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 2 }}>{r.ingredients.slice(0, 3).map((i: any) => i.name).join(', ')}{r.ingredients.length > 3 ? '...' : ''}</div>
              )}
            </Card>
          ))}
        </>
      )}

      {/* ── Repas ── */}
      {filter === 'repas' && (
        <>
          <SectionTitle icon="ri-restaurant-line" iconColor="#10B981" title="Repas" count={mealTemplates.length} onAdd={props.onNewMeal} testId="lib-add-new-meal" />
          {mealTemplates.length === 0 && <Empty icon="ri-restaurant-line" text="Aucun repas" />}
          {mealTemplates.map(m => (
            <Card key={m.id} testId={`item-card-${m.title}`}
              onClick={() => router.push({ pathname: '/meal-detail' as any, params: { id: m.id, mode: 'template' } })}
              onEdit={props.onEditMealTemplate ? () => props.onEditMealTemplate!(m) : undefined}
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
      )}
    </>
  );
}

function SectionTitle({ icon, iconColor, title, count, onAdd, testId }: {
  icon: string; iconColor: string; title: string; count: number; onAdd: () => void; testId: string;
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

function Card({ children, testId, onClick, onEdit, onDelete, image, iconFallback, iconColor }: {
  children: React.ReactNode; testId: string; onClick?: () => void; onEdit?: () => void; onDelete?: () => void;
  image?: string; iconFallback: string; iconColor: string;
}) {
  return (
    <div data-testid={testId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: '#F4F4F5', border: '1px solid transparent', marginBottom: 8, transition: 'all 0.15s' } as any}>
      <div onClick={onClick} style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: onClick ? 'pointer' : 'default', background: image ? 'none' : `${iconColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
        {image ? <img src={image.startsWith('/') ? `${API}${image}` : image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
          : <i className={iconFallback} style={{ fontSize: 20, color: iconColor }} />}
      </div>
      <div onClick={onClick || onEdit} style={{ flex: 1, minWidth: 0, cursor: (onClick || onEdit) ? 'pointer' : 'default' } as any}>
        {children}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 } as any}>
        {onEdit && <div data-testid={`edit-${testId}`} onClick={(e: any) => { e.stopPropagation(); onEdit(); }}
          style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
          <i className="ri-pencil-line" style={{ fontSize: 14, color: '#374151' }} />
        </div>}
        {onDelete && <div data-testid={`delete-${testId}`} onClick={(e: any) => { e.stopPropagation(); onDelete(); }}
          style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} />
        </div>}
      </div>
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
