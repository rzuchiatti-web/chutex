import React, { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../../services/api';
import { HEALTH_IMAGES } from '../constants';

function WheelPicker({ value, items, onChange, accent = '#A78BFA' }: { value: number; items: { val: number; label: string }[]; onChange: (v: number) => void; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const itemH = 44;
  useEffect(() => {
    if (ref.current) {
      const idx = items.findIndex(i => i.val === value);
      ref.current.scrollTop = Math.max(0, idx) * itemH;
    }
  }, []);
  return (
    <div style={{ width: 70, height: 132, overflow: 'hidden', position: 'relative', borderRadius: 14 } as any}>
      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: itemH, marginTop: -itemH / 2, borderTop: `1.5px solid ${accent}40`, borderBottom: `1.5px solid ${accent}40`, zIndex: 1, pointerEvents: 'none', background: `${accent}08` } as any} />
      <div ref={ref as any} style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', position: 'relative', zIndex: 3, paddingTop: itemH, paddingBottom: itemH } as any}
        onScroll={(e: any) => { const idx = Math.round(e.target.scrollTop / itemH); if (idx >= 0 && idx < items.length && items[idx].val !== value) onChange(items[idx].val); }}>
        {items.map((item, i) => {
          const sel = item.val === value;
          return <div key={i} style={{ height: itemH, display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', fontSize: sel ? 30 : 18, fontWeight: sel ? 900 : 400, color: sel ? '#FFF' : 'rgba(255,255,255,0.12)', transition: 'all 0.15s' } as any}>{item.label}</div>;
        })}
      </div>
    </div>
  );
}

export function SleepAlarmSection({ sleepAlarm, alarmTime, setAlarmTime, editingAlarm, setEditingAlarm, setSleepAlarm, token, C, glass, isDark }: any) {
  const [saving, setSaving] = useState(false);
  const s = sleepAlarm || {};
  const adjustments = s.adjustments || [];
  const extraMin = s.extra_minutes || 0;
  const wakeH = parseInt((alarmTime || '07:00').split(':')[0]) || 7;
  const wakeM = parseInt((alarmTime || '07:00').split(':')[1]) || 0;

  const factors = [
    { label: 'Qualite du sommeil', icon: 'ri-moon-clear-fill', color: '#A78BFA', active: adjustments.includes('Sommeil recent insuffisant'), desc: 'Phases profondes et REM' },
    { label: 'Niveau de stress', icon: 'ri-mental-health-line', color: '#F59E0B', active: adjustments.includes('Stress eleve'), desc: 'Cortisol et variabilite cardiaque' },
    { label: 'Recuperation', icon: 'ri-heart-pulse-line', color: '#EF4444', active: adjustments.includes('Recuperation faible'), desc: 'VFC et frequence au repos' },
    { label: 'Activite physique', icon: 'ri-run-line', color: '#10B981', active: adjustments.includes('Activite physique intense'), desc: 'Depense energetique du jour' },
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

  const hours = Array.from({ length: 24 }, (_, i) => ({ val: i, label: String(i).padStart(2, '0') }));
  const minutes = Array.from({ length: 12 }, (_, i) => ({ val: i * 5, label: String(i * 5).padStart(2, '0') }));

  return (
    <>
      {/* Dashboard card */}
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

      {/* ── GLASS POPUP ── */}
      {editingAlarm && (
        <div data-testid="sleep-popup" onClick={() => setEditingAlarm(false)} style={{ position: 'fixed', inset: 0, zIndex: 99990, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.78)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '24px 20px 40px', boxSizing: 'border-box' } as any}>

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 } as any}>
              <div onClick={() => setEditingAlarm(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
              </div>
            </div>

            {/* Moon image */}
            <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
              <img src={HEALTH_IMAGES.sleep} alt="" style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(167,139,250,0.3))' } as any} />
            </div>

            {/* Title — centered */}
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Optimisation du sommeil</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Calculee selon votre physiologie</div>
            </div>

            {/* Bedtime result — big centered */}
            <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 18, padding: '18px 20px', marginBottom: 20, textAlign: 'center' } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Coucher recommande</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#FFF', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.bedtime || '22:00'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                {(s.sleep_need_hours || 7)}h{(s.sleep_need_minutes || 30) > 0 ? `${s.sleep_need_minutes || 30}min` : ''} de sommeil
                {extraMin > 0 && <span style={{ color: '#F59E0B' }}> (+{extraMin}min)</span>}
              </div>
            </div>

            {/* Wake time — wheel picker — centered title */}
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' }}>Heure de reveil</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                <WheelPicker value={wakeH} items={hours} onChange={(v) => setAlarmTime(`${String(v).padStart(2, '0')}:${String(wakeM).padStart(2, '0')}`)} />
                <span style={{ fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.15)' }}>:</span>
                <WheelPicker value={wakeM} items={minutes} onChange={(v) => setAlarmTime(`${String(wakeH).padStart(2, '0')}:${String(v).padStart(2, '0')}`)} />
              </div>
            </div>

            {/* Factors — centered title */}
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, textAlign: 'center' }}>Facteurs d'analyse</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                {factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${f.color}25` } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className={f.icon} style={{ fontSize: 15, color: f.color }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{f.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{f.desc}</div>
                    </div>
                    {f.active && <div style={{ width: 8, height: 8, borderRadius: 4, background: f.color, flexShrink: 0, boxShadow: `0 0 6px ${f.color}60` } as any} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, textAlign: 'center', marginBottom: 24, padding: '0 8px' }}>
              Notre algorithme analyse votre variabilite cardiaque, frequence au repos, stress et qualite des phases de sommeil profond pour determiner votre besoin reel de recuperation.
            </div>

            {/* Save */}
            <div data-testid="save-alarm-btn" onClick={handleSave} style={{ padding: '16px', borderRadius: 999, background: '#FFF', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#111', opacity: saving ? 0.5 : 1, marginBottom: 80 } as any}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
