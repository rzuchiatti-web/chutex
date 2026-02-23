import React from 'react';
import { useRouter } from 'expo-router';

interface Props { plan: any[]; ai: any; analysisPhase: any; showPopup: boolean; setShowPopup: (v: boolean) => void; }

export default function DailyObjectives({ plan, ai, analysisPhase, showPopup, setShowPopup }: Props) {
  const router = useRouter();
  return (
    <>
      <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 14 } as any}>
        <div style={{ padding: '18px 20px' } as any}>
          {analysisPhase && (
            <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
              <span style={{ display: 'inline-flex', padding: '4px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', fontSize: 10, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 6 }}>En apprentissage</span>
              <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.5)', fontStyle: 'italic' }}>Le score sante IA complet sera disponible apres 7 jours d'analyse.</div>
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>Objectifs journaliers</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
            {plan.map((p: any) => (
              <div key={p.key} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}><i className={p.icon} style={{ fontSize: 14, color: p.color }} /><span style={{ fontSize: 9, fontWeight: 700, color: p.status === 'atteint' ? '#10B981' : p.status === 'priorite' ? '#F59E0B' : 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{p.status}</span></div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{p.value} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{p.unit}</span></div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.label}</div>
                {p.progress != null && <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 6, overflow: 'hidden' } as any}><div style={{ height: 3, borderRadius: 2, width: `${p.progress}%`, background: p.color } as any} /></div>}
              </div>
            ))}
          </div>
          {!analysisPhase && (
            <div onClick={() => setShowPopup(true)} style={{ marginTop: 14, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>
              <i className="ri-calendar-check-line" style={{ fontSize: 15 }} />Voir mon plan du jour
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
          <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => setShowPopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(14,116,144,0.15))', border: '1px solid rgba(34,211,238,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-calendar-check-line" style={{ fontSize: 28, color: '#22D3EE' }} /></div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Mon plan du jour</div>
            </div>
            {ai.priority && (
              <div style={{ padding: '16px 18px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(14,116,144,0.12), rgba(34,211,238,0.06))', border: '1px solid rgba(34,211,238,0.15)', marginBottom: 12 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(34,211,238,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Priorite</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', lineHeight: 1.5 }}>{ai.priority}</div>
              </div>
            )}
            {plan.map((p: any) => (
              <div key={p.key} style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${p.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className={p.icon} style={{ fontSize: 16, color: p.color }} /></div>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{p.label}</div><div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{p.value} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{p.unit}</span></div></div>
                  </div>
                </div>
                {p.detail && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{p.detail}</div>}
              </div>
            ))}
            <div onClick={() => setShowPopup(false)} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
          </div>
        </div>
      )}
    </>
  );
}
