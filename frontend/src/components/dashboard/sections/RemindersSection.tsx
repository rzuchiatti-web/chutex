import React from 'react';
import { useRouter } from 'expo-router';
import { REMINDER_IMAGES } from '../constants';

export function RemindersSection({ reminders, C, glass, isDark, setEditReminder, setShowReminderCRUD }: any) {
  const router = useRouter();

  const getNextReminderTime = (rem: any) => {
    if (!rem.time || !rem.active) return '';
    const now = new Date();
    const [rh, rm] = rem.time.split(':').map(Number);
    const target = new Date(now); target.setHours(rh, rm, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const diff = target.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  return (
    <div data-testid="reminders-section" className="dash-slide-up" style={{ marginBottom: 28 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' } as any}>Mes rappels</div>
        <div style={{ display: 'flex', gap: 0 } as any}>
          {[
            { bg: '#38BDF8', icon: 'ri-drop-fill' },
            { bg: '#F59E0B', icon: 'ri-capsule-fill' },
            { bg: '#EF4444', icon: 'ri-alarm-fill' },
          ].map((a, ai) => (
            <div key={ai} style={{ width: 32, height: 32, borderRadius: 999, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: ai > 0 ? -8 : 0, border: `2.5px solid ${isDark ? '#1a1a24' : '#FFF'}`, zIndex: 3 - ai } as any}>
              <i className={a.icon} style={{ fontSize: 14, color: '#FFF' }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: '1.45' } as any}>Gerez vos rappels quotidiens pour rester en bonne sante et ne rien oublier.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
        {[
          { type: 'hydration', label: 'Hydratation', img: REMINDER_IMAGES.hydration, color: '#38BDF8', desc: 'Pensez a boire regulierement' },
          { type: 'medication', label: 'Traitement', img: REMINDER_IMAGES.medication, color: '#F59E0B', desc: 'Suivi de votre traitement' },
          { type: 'alarm', label: 'Alarmes', img: REMINDER_IMAGES.alarm, color: '#EF4444', desc: 'Vos alarmes personnalisees' },
        ].map((cat) => {
          const catRems = reminders.filter((r: any) => r.reminder_type === cat.type);
          const activeCount = catRems.filter((r: any) => r.active).length;
          const nextTime = activeCount > 0 ? getNextReminderTime(catRems.find((r: any) => r.active)) : '';
          return (
            <div key={cat.type} data-testid={`reminder-cat-${cat.type}`} onClick={() => { setEditReminder({ _type: cat.type }); setShowReminderCRUD(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: C.card, cursor: 'pointer', transition: 'transform 0.15s', ...glass } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <img src={cat.img} alt={cat.label} style={{ width: 46, height: 46, objectFit: 'contain', flexShrink: 0 } as any} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{cat.label}</div>
                <div style={{ fontSize: 12, color: activeCount > 0 ? cat.color : C.sub, fontWeight: 500, marginTop: 2 }}>
                  {activeCount > 0 ? `${activeCount} rappel${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}${nextTime ? ` · dans ${nextTime}` : ''}` : cat.desc}
                </div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: C.arrow }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
