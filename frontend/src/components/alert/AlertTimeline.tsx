import React from 'react';

const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function AlertTimeline({ timeline }: { timeline: any[] }) {
  return (
    <div style={{ ...G, padding: '18px', marginBottom: 12 } as any}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 } as any}>
        <i className="ri-time-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />Chronologie
      </div>
      {timeline.map((ev: any, i: number) => {
        const evIcon = ev.icon || 'ri-checkbox-blank-circle-line';
        const evColor = ev.color || 'rgba(255,255,255,0.3)';
        const time = ev.time ? new Date(ev.time) : null;
        return (
          <div key={i} style={{ display: 'flex', gap: 14 } as any}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 } as any}>
              <div style={{ width: 28, height: 28, borderRadius: 10, background: `${evColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={evIcon} style={{ fontSize: 13, color: evColor }} />
              </div>
              {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0', borderRadius: 1 } as any} />}
            </div>
            <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? 16 : 0 } as any}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', lineHeight: 1.4 }}>{ev.detail}</div>
              {time && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} a {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
