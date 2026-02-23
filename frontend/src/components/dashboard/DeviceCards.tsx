import React from 'react';
import { useRouter } from 'expo-router';

interface Device { name: string; img: string; battery: number; connected: boolean; color: string; route: string; }
interface Props { br: any; sc: any; vs: any; }

const batteryColor = (pct: number) => pct > 50 ? '#10B981' : pct > 25 ? '#F59E0B' : '#EF4444';
const batteryGrad = (pct: number) => pct > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : pct > 25 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #DC2626, #EF4444)';

export default function DeviceCards({ br, sc, vs }: Props) {
  const router = useRouter();
  const devices: Device[] = [
    { name: 'Bracelet Elio', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg', battery: br.battery, connected: br.connected, color: '#22D3EE', route: '/bracelet-connect' },
    { name: 'Balance Lefu', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg', battery: sc.battery, connected: sc.connected, color: '#A78BFA', route: '/scale-detail' },
    { name: 'Gilet Elder S-AIRBAG', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg', battery: vs.battery, connected: vs.connected, color: '#10B981', route: '/vest-connect' },
  ];
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Appareils connectes</div>
      {devices.map((d, i) => (
        <div key={i} data-testid={`device-card-${i}`} onClick={() => router.push(d.route as any)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer', transition: 'transform 0.2s' } as any}
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
    </>
  );
}
