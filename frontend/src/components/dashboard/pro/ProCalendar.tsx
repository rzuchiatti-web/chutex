import React, { useState, useMemo, useEffect } from 'react';
import { DAYS_SHORT, MONTHS_FR, toLocalDateStr } from './constants';

export function HorizontalCalendar({ selectedDate, onSelect, accent }: { selectedDate: Date; onSelect: (d: Date) => void; accent: string }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const dates = useMemo(() => {
    const arr: Date[] = [];
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) arr.push(new Date(viewYear, viewMonth, i));
    return arr;
  }, [viewMonth, viewYear]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const todayStr = toLocalDateStr(new Date());
  const selStr = toLocalDateStr(selectedDate);

  // Auto-scroll to selected day (centered)
  useEffect(() => {
    const scroll = () => {
      try {
        const el = document.querySelector(`[data-testid="cal-day-${selStr}"]`) as HTMLElement;
        if (!el?.parentElement) return;
        const container = el.parentElement as HTMLElement;
        if (container.scrollWidth > container.clientWidth + 50) {
          const scrollLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
          container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'instant' as ScrollBehavior });
        }
      } catch {}
    };
    scroll();
    const t1 = setTimeout(scroll, 100);
    const t2 = setTimeout(scroll, 400);
    const t3 = setTimeout(scroll, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [selStr, viewMonth, viewYear]);

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
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as any}>
        {dates.map(d => {
          const ds = toLocalDateStr(d);
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
