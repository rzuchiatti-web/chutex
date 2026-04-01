import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../../services/api';

export function SleepAlarmSection({ sleepAlarm, alarmTime, setAlarmTime, editingAlarm, setEditingAlarm, setSleepAlarm, token, C, glass, isDark }: any) {
  const router = useRouter();
  return (
    <>
      <div data-testid="sleep-alarm-card" className="dash-slide-up" onClick={() => router.push({ pathname: '/health-detail' as any, params: { tab: 'sleep' } })} style={{ borderRadius: 18, background: C.card, padding: '16px 20px', marginBottom: 20, cursor: 'pointer', ...glass } as any}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Sommeil de ce soir</div>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: C.arrow }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' } as any}>
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' } as any}>
              <i className="ri-moon-clear-fill" style={{ fontSize: 16, color: '#A78BFA' }} />
              <span style={{ fontSize: 26, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' } as any}>{sleepAlarm?.bedtime || '22:00'}</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>Coucher recommande</div>
          </div>
          <div style={{ width: 36, height: 0, borderTop: `2px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` } as any} />
          <div style={{ textAlign: 'center' } as any}>
            <span style={{ fontSize: 26, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' } as any}>{sleepAlarm?.wake_time || alarmTime}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 3 } as any}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: '#10B981' } as any} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Alarme activee</span>
            </div>
          </div>
        </div>
        <div data-testid="modify-alarm-btn" onClick={(e: any) => { e.stopPropagation(); setEditingAlarm(true); }} style={{ marginTop: 12, padding: '10px', borderRadius: 999, background: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
          <i className="ri-edit-line" style={{ fontSize: 14, color: C.sub }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Modifier l'alarme</span>
        </div>
      </div>
      {editingAlarm && (
        <div onClick={() => setEditingAlarm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ background: isDark ? '#1A1A22' : '#FFF', borderRadius: 24, padding: '28px 24px', width: '90%', maxWidth: 340 } as any}>
            <div style={{ fontSize: 18, fontWeight: 900, color: isDark ? '#FFF' : '#111', textAlign: 'center', marginBottom: 20 }}>Heure de reveil</div>
            <input type="time" value={alarmTime} onChange={(e: any) => setAlarmTime(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`, color: isDark ? '#FFF' : '#111', fontSize: 24, fontWeight: 900, textAlign: 'center', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as any} />
            <div onClick={async () => { const res = await apiFetch('/api/health/sleep-alarm', { method: 'PUT', body: JSON.stringify({ wake_time: alarmTime, enabled: true }) }, token); if (res) setSleepAlarm(res); setEditingAlarm(false); }} style={{ marginTop: 16, padding: '14px', borderRadius: 999, background: isDark ? '#FFF' : '#111', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: isDark ? '#111' : '#FFF' } as any}>Enregistrer</div>
            <div onClick={() => setEditingAlarm(false)} style={{ marginTop: 10, padding: '12px', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF' } as any}>Annuler</div>
          </div>
        </div>
      )}
    </>
  );
}
