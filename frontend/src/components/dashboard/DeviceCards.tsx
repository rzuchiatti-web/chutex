import React, { useState } from 'react';

interface Props { br: any; sc: any; vs: any; onStartWeighing?: () => void; }

const batteryColor = (pct: number) => pct > 50 ? '#10B981' : pct > 25 ? '#F59E0B' : '#EF4444';
const batteryGrad = (pct: number) => pct > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : pct > 25 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #DC2626, #EF4444)';

export default function DeviceCards({ br, sc, vs, onStartWeighing }: Props) {
  const [selected, setSelected] = useState<any>(null);

  const devices = [
    { id: 'bracelet', name: 'Bracelet Elio', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg', battery: br.battery, connected: br.connected, color: '#22D3EE', desc: 'Suivi cardiaque continu, SpO2, temperature, activite physique et qualite du sommeil.', model: 'Elio Care Watch', firmware: 'v3.2.1', lastSync: br.last_sync ? new Date(br.last_sync).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '--', isScale: false,
      infos: [{ label: 'FC', val: `${br.heart_rate} bpm`, color: '#EF4444' }, { label: 'SpO2', val: `${br.spo2}%`, color: '#38BDF8' }, { label: 'Pas', val: br.steps?.toLocaleString(), color: '#10B981' }, { label: 'Temp', val: `${br.temperature}°C`, color: '#F59E0B' }] },
    { id: 'scale', name: 'Balance Lefu', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg', battery: sc.battery, connected: sc.connected, color: '#A78BFA', desc: 'Balance 8 electrodes. Poids, composition corporelle complete, age metabolique et masse osseuse.', model: 'Vita 8E', firmware: 'v2.1.0', lastSync: sc.last_sync ? new Date(sc.last_sync).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '--', isScale: true,
      infos: [{ label: 'Poids', val: `${sc.weight} kg`, color: '#A78BFA' }, { label: 'IMC', val: `${sc.bmi}`, color: '#F59E0B' }, { label: 'Graisse', val: `${sc.body_fat}%`, color: '#EF4444' }, { label: 'Muscle', val: `${sc.muscle_mass}%`, color: '#10B981' }] },
    { id: 'vest', name: 'Gilet Elder S-AIRBAG', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg', battery: vs.battery, connected: vs.connected, color: '#10B981', desc: 'Protection anti-chute par airbag. Detection de posture, suivi du port et alertes automatiques.', model: 'Elder S-AIRBAG', firmware: 'v1.8.3', lastSync: vs.last_sync ? new Date(vs.last_sync).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : '--', isScale: false,
      infos: [{ label: 'Posture', val: `${vs.posture_score}%`, color: '#38BDF8' }, { label: 'Porte', val: `${vs.wearing_hours_today}h`, color: '#F59E0B' }, { label: 'Chute', val: vs.fall_detected ? 'Oui' : 'Non', color: vs.fall_detected ? '#EF4444' : '#10B981' }, { label: 'Alertes', val: `${vs.alerts_today}`, color: '#EF4444' }] },
  ];

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Appareils connectes</div>
      {devices.map((d) => (
        <div key={d.id} data-testid={`device-card-${d.id}`} onClick={() => setSelected(d)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer', transition: 'transform 0.2s' } as any}
          onMouseEnter={(e: any) => e.currentTarget.style.transform='translateY(-1px)'}
          onMouseLeave={(e: any) => e.currentTarget.style.transform=''}>
          <img src={d.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 } as any} />
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 3 }}>{d.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: d.connected ? '#10B981' : '#EF4444' } as any} />
              <span style={{ fontSize: 10, fontWeight: 600, color: d.connected ? '#10B981' : '#EF4444' }}>{d.connected ? 'Connecte' : 'Deconnecte'}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 6 } as any}><div style={{ height: 4, borderRadius: 2, width: `${d.battery}%`, background: batteryGrad(d.battery) } as any} /></div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: batteryColor(d.battery), flexShrink: 0 }}>{d.battery}%</div>
        </div>
      ))}

      {/* Device detail popup */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
              <div onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
            </div>

            {/* Hero image */}
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <img src={selected.img} alt="" style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 16px', display: 'block' } as any} />
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{selected.model} · {selected.firmware}</div>
              {/* Status pill — not for scale */}
              {!selected.isScale && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: selected.connected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${selected.connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, marginTop: 12 } as any}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: selected.connected ? '#10B981' : '#EF4444' } as any} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: selected.connected ? '#10B981' : '#EF4444' }}>{selected.connected ? 'Actif' : 'Inactif'}</span>
                </div>
              )}
              {selected.isScale && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12, fontStyle: 'italic' }}>Se connecte automatiquement au demarrage d'une pesee</div>
              )}
            </div>

            {/* Description */}
            <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{selected.desc}</div>
            </div>

            {/* Data grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
              {selected.infos.map((info: any, i: number) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>{info.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: info.color }}>{info.val}</div>
                </div>
              ))}
            </div>

            {/* Battery + last sync */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
              <div style={{ flex: 1, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Batterie</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: batteryColor(selected.battery) }}>{selected.battery}%</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 6 } as any}><div style={{ height: 4, borderRadius: 2, width: `${selected.battery}%`, background: batteryGrad(selected.battery) } as any} /></div>
              </div>
              <div style={{ flex: 1, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Derniere synchro</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{selected.lastSync}</div>
              </div>
            </div>

            {/* Actions */}
            {selected.connected && !selected.isScale && (
              <div onClick={() => setSelected(null)} style={{ padding: '14px', borderRadius: 999, background: `${selected.color}15`, border: `1px solid ${selected.color}25`, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: selected.color, marginBottom: 8 } as any}>
                <i className="ri-refresh-line" style={{ marginRight: 6 }} />Synchroniser
              </div>
            )}
            {!selected.connected && !selected.isScale && (
              <div onClick={() => setSelected(null)} style={{ padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 } as any}>
                <i className="ri-bluetooth-connect-line" style={{ marginRight: 6 }} />Associer l'appareil
              </div>
            )}
            {selected.isScale && (
              <div onClick={() => { setSelected(null); onStartWeighing?.(); }} style={{ padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 8 } as any}>
                <i className="ri-scales-3-line" style={{ marginRight: 6 }} />Demarrer une pesee
              </div>
            )}
            {selected.connected && !selected.isScale && (
              <div onClick={() => setSelected(null)} style={{ padding: '12px', borderRadius: 999, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.5)' } as any}>
                Dissocier l'appareil
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
