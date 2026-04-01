import React, { useState } from 'react';
import { apiFetch } from '../../../services/api';

export function SleepAlarmSection({ sleepAlarm, alarmTime, setAlarmTime, editingAlarm, setEditingAlarm, setSleepAlarm, token, C, glass, isDark }: any) {
  const [saving, setSaving] = useState(false);
  const s = sleepAlarm || {};
  const adjustments = s.adjustments || [];
  const extraMin = s.extra_minutes || 0;

  // Sleep science factors
  const factors = [
    { label: 'Qualite du sommeil', icon: 'ri-moon-clear-fill', color: '#A78BFA', active: adjustments.includes('Sommeil recent insuffisant'), desc: 'Phases profondes et REM insuffisantes' },
    { label: 'Niveau de stress', icon: 'ri-mental-health-line', color: '#F59E0B', active: adjustments.includes('Stress eleve'), desc: 'Cortisol eleve detecte' },
    { label: 'Recuperation', icon: 'ri-heart-pulse-line', color: '#EF4444', active: adjustments.includes('Recuperation faible'), desc: 'VFC et frequence cardiaque au repos' },
    { label: 'Activite physique', icon: 'ri-run-line', color: '#10B981', active: adjustments.includes('Activite physique intense'), desc: 'Depense energetique elevee' },
  ];

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/health/sleep-alarm', { method: 'PUT', body: JSON.stringify({ wake_time: alarmTime, enabled: true }) }, token);
      if (res) setSleepAlarm(res);
      setEditingAlarm(false);
    } catch {} finally { setSaving(false); }
  };

  return (
    <>
      <div data-testid="sleep-alarm-card" className="dash-slide-up" onClick={() => setEditingAlarm(true)} style={{ borderRadius: 18, background: C.card, padding: '16px 20px', marginBottom: 20, cursor: 'pointer', transition: 'transform 0.15s', ...glass } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Sommeil de ce soir</div>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: C.arrow }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' } as any}>
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' } as any}>
              <i className="ri-moon-clear-fill" style={{ fontSize: 16, color: '#A78BFA' }} />
              <span style={{ fontSize: 26, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' } as any}>{s.bedtime || '22:00'}</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>Coucher recommande</div>
          </div>
          <div style={{ width: 36, height: 0, borderTop: `2px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` } as any} />
          <div style={{ textAlign: 'center' } as any}>
            <span style={{ fontSize: 26, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' } as any}>{s.wake_time || alarmTime}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 3 } as any}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: '#10B981' } as any} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Alarme activee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glass Popup */}
      {editingAlarm && (
        <div data-testid="sleep-popup" onClick={() => setEditingAlarm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ background: isDark ? 'rgba(26,26,34,0.95)' : 'rgba(255,255,255,0.97)', borderRadius: 28, padding: '28px 22px', width: '100%', maxWidth: 380, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, boxShadow: '0 24px 80px rgba(0,0,0,0.4)' } as any}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 } as any}>
                <i className="ri-moon-clear-fill" style={{ fontSize: 24, color: '#A78BFA' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: isDark ? '#FFF' : '#111' }}>Optimisation du sommeil</div>
              <div style={{ fontSize: 12, color: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF', marginTop: 4, lineHeight: 1.5 }}>
                Votre heure de coucher est calculee selon votre physiologie
              </div>
            </div>

            {/* Wake time input */}
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Heure de reveil</div>
              <input data-testid="wake-time-input" type="time" value={alarmTime} onChange={(e: any) => setAlarmTime(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.04)' : '#F4F4F5', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'}`, color: isDark ? '#FFF' : '#111', fontSize: 28, fontWeight: 900, textAlign: 'center', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as any} />
            </div>

            {/* Computed bedtime */}
            <div style={{ background: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.04)', border: `1px solid ${isDark ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.1)'}`, borderRadius: 16, padding: '14px 16px', marginBottom: 20, textAlign: 'center' } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Coucher recommande</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: isDark ? '#FFF' : '#111', fontVariantNumeric: 'tabular-nums' }}>{s.bedtime || '22:00'}</div>
              <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.35)' : '#6B7280', marginTop: 4 }}>
                {(s.sleep_need_hours || 7)}h{(s.sleep_need_minutes || 30) > 0 ? `${s.sleep_need_minutes || 30}min` : ''} de sommeil recommandees
                {extraMin > 0 && <span style={{ color: '#F59E0B' }}> (+{extraMin}min ajustement)</span>}
              </div>
            </div>

            {/* Science factors */}
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Facteurs d'analyse</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                {factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: f.active ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)') : 'transparent', border: f.active ? `1px solid ${f.color}20` : `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` } as any}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${f.color}${f.active ? '15' : '08'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className={f.icon} style={{ fontSize: 14, color: f.active ? f.color : (isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB') }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 } as any}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: f.active ? (isDark ? '#FFF' : '#111') : (isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF') }}>{f.label}</div>
                      <div style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.25)' : '#9CA3AF', marginTop: 1 }}>{f.desc}</div>
                    </div>
                    {f.active && <div style={{ width: 8, height: 8, borderRadius: 4, background: f.color, flexShrink: 0 } as any} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.25)' : '#9CA3AF', lineHeight: 1.6, textAlign: 'center', marginBottom: 20, padding: '0 8px' }}>
              Notre algorithme analyse en continu votre variabilite cardiaque (VFC), votre frequence cardiaque au repos, votre niveau de stress et la qualite de vos phases de sommeil profond pour determiner votre besoin reel de recuperation.
            </div>

            {/* Save button */}
            <div data-testid="save-alarm-btn" onClick={handleSave} style={{ padding: '16px', borderRadius: 999, background: isDark ? '#FFF' : '#111', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: isDark ? '#111' : '#FFF', opacity: saving ? 0.5 : 1, transition: 'opacity 0.15s' } as any}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </div>
            <div onClick={() => setEditingAlarm(false)} style={{ marginTop: 10, padding: '12px', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF' } as any}>Fermer</div>
          </div>
        </div>
      )}
    </>
  );
}
