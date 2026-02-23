import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Props { br: any; sc: any; vs: any; onStartWeighing?: () => void; weighings?: any[]; onRefresh?: () => void; }

const batteryColor = (pct: number) => pct > 50 ? '#10B981' : pct > 25 ? '#F59E0B' : '#EF4444';
const batteryGrad = (pct: number) => pct > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : pct > 25 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #DC2626, #EF4444)';

export default function DeviceCards({ br, sc, vs, onStartWeighing, weighings = [], onRefresh }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  const devices = [
    { id: 'bracelet', name: 'Bracelet Elio', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg', battery: br.battery, connected: br.connected, color: '#22D3EE' },
    { id: 'scale', name: 'Balance Lefu', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg', battery: sc.battery, connected: sc.connected, color: '#A78BFA' },
    { id: 'vest', name: 'Elder', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg', battery: vs.battery, connected: vs.connected, color: '#10B981' },
  ];

  const lastSync = (ts: string) => ts ? new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--';

  const removeDevice = async (deviceType: string) => {
    setRemoving(true);
    try {
      await apiFetch('/api/devices/remove-by-type', { method: 'POST', body: JSON.stringify({ device_type: deviceType }) }, token);
      setSelected(null);
      onRefresh?.();
    } catch {} finally { setRemoving(false); }
  };

  const InfoRow = ({ label, val }: { label: string; val: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{val}</span>
    </div>
  );

  const BatteryBar = ({ pct }: { pct: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' } as any}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
        <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: batteryGrad(pct) } as any} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 900, color: batteryColor(pct), minWidth: 40, textAlign: 'right' }}>{pct}%</span>
    </div>
  );

  const StatusPill = ({ connected }: { connected: boolean }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: connected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` } as any}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: connected ? '#10B981' : '#EF4444' } as any} />
      <span style={{ fontSize: 12, fontWeight: 700, color: connected ? '#10B981' : '#EF4444' }}>{connected ? 'Actif' : 'Inactif'}</span>
    </div>
  );

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Appareils connectes</div>
      {devices.map((d) => (
        <div key={d.id} data-testid={`device-card-${d.id}`} onClick={() => setSelected(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, cursor: 'pointer', transition: 'transform 0.2s', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}
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

      {/* BRACELET */}
      {selected === 'bracelet' && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}><div onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <img src={devices[0].img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block' } as any} />
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Bracelet Elio</div>
              <StatusPill connected={br.connected} />
            </div>
            <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
              <InfoRow label="ID appareil" val={br.device_id || 'ELIO-8A3F'} />
              <InfoRow label="Nom" val="Bracelet Elio" />
              <InfoRow label="Derniere connexion" val={lastSync(br.last_sync)} />
            </div>
            <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 0 4px' }}>Batterie</div>
              <BatteryBar pct={br.battery} />
            </div>
            {br.connected ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 } as any}>
                  <div onClick={() => { setSelected(null); router.push('/bracelet-connect' as any); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#22D3EE' } as any}><i className="ri-refresh-line" style={{ marginRight: 6 }} />Synchroniser</div>
                  <div onClick={() => { setSelected(null); router.push('/ecg' as any); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#F97316' } as any}><i className="ri-pulse-line" style={{ marginRight: 6 }} />ECG</div>
                </div>
                <div onClick={() => removeDevice('bracelet')} style={{ padding: '12px', borderRadius: 999, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.5)' } as any}>{removing ? 'Suppression...' : 'Supprimer l\'appareil'}</div>
              </>
            ) : (
              <div onClick={() => { setSelected(null); router.push('/bracelet-connect' as any); }} style={{ padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111' } as any}><i className="ri-bluetooth-connect-line" style={{ marginRight: 6 }} />Rechercher et associer</div>
            )}
          </div>
        </div>
      )}

      {/* GILET */}
      {selected === 'vest' && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}><div onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <img src={devices[2].img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block' } as any} />
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Elder</div>
              <StatusPill connected={vs.connected} />
            </div>
            <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
              <InfoRow label="ID appareil" val={vs.device_id || 'ELDER-5B2C'} />
              <InfoRow label="Nom" val="Elder" />
              <InfoRow label="Derniere connexion" val={lastSync(vs.last_sync)} />
            </div>
            <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 0 4px' }}>Batterie</div>
              <BatteryBar pct={vs.battery} />
            </div>
            {vs.connected ? (
              <div onClick={() => removeDevice('vest')} style={{ padding: '12px', borderRadius: 999, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.5)' } as any}>{removing ? 'Suppression...' : 'Supprimer l\'appareil'}</div>
            ) : (
              <div onClick={() => { setSelected(null); router.push('/vest-connect' as any); }} style={{ padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111' } as any}><i className="ri-bluetooth-connect-line" style={{ marginRight: 6 }} />Rechercher et associer</div>
            )}
          </div>
        </div>
      )}

      {/* BALANCE */}
      {selected === 'scale' && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}><div onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <img src={devices[1].img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block' } as any} />
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Balance Lefu</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Balance 8 electrodes — composition corporelle complete</div>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Dernieres pesees</div>
            {weighings.length > 0 ? weighings.slice(0, 5).map((w: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 } as any}>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{w.weight} kg</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 999, background: w.status === 'Bonne' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', fontSize: 10, fontWeight: 700, color: w.status === 'Bonne' ? '#10B981' : '#F59E0B' }}>{w.status}</span>
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)' } as any}>Aucune pesee enregistree</div>
            )}
            <div onClick={() => { setSelected(null); setTimeout(() => onStartWeighing?.(), 100); }} style={{ marginTop: 12, padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111' } as any}>
              <i className="ri-scales-3-line" style={{ marginRight: 6 }} />Nouvelle pesee
            </div>
          </div>
        </div>
      )}
    </>
  );
}
