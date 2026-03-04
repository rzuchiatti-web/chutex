import React from 'react';
import { useRouter } from 'expo-router';
import { DEVICE_META } from './constants';

interface DeviceCardProps {
  deviceType: string;
  device: any;
  subscription: any;
  weighings: any[];
  onStartPairing: (dt: string) => void;
  onSelectDevice: (dt: string) => void;
  onScaleWeighing: () => void;
}

export function DeviceCard({ deviceType: dt, device, subscription, weighings, onStartPairing, onSelectDevice, onScaleWeighing }: DeviceCardProps) {
  const router = useRouter();
  const meta = DEVICE_META[dt];
  const isAssociated = device && (device.connected || device.battery > 0 || device.last_sync);
  const realBattery = device?.battery || 0;
  const realConnected = device?.connected || false;
  const vestActive = dt === 'vest' && device?.last_sync && (Date.now() - new Date(device.last_sync).getTime()) < 30000;
  const needsSub = dt === 'bracelet' && !subscription?.can_use_bracelet;
  const hasWeighings = dt === 'scale' && weighings.length > 0;

  const statusLabel = dt === 'vest'
    ? (vestActive ? 'En marche' : isAssociated ? 'En veille' : '')
    : (realConnected ? 'Connecte' : isAssociated ? 'Appaire' : '');
  const statusActive = dt === 'vest' ? vestActive : realConnected;

  return (
    <div data-testid={`device-card-${dt}`} style={{ borderRadius: 24, marginBottom: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', minHeight: 180, cursor: isAssociated ? 'pointer' : 'default' } as any} onClick={() => isAssociated && onSelectDevice(dt)}>
        <img src={meta.img} alt={meta.name} style={{ height: 150, width: 'auto', maxWidth: '80%', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' } as any} />
        {isAssociated && (
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: statusActive ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)', border: `1px solid ${statusActive ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.25)'}` } as any}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusActive ? '#10B981' : '#F59E0B' } as any} />
            <span style={{ fontSize: 10, fontWeight: 600, color: statusActive ? '#10B981' : '#F59E0B' }}>{statusLabel}</span>
          </div>
        )}
      </div>
      <div style={{ padding: '0 20px 20px' } as any}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{meta.name}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 16 }}>{meta.desc}</div>
        {isAssociated ? (
          <div>
            {realBattery > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}><i className="ri-battery-line" style={{ fontSize: 14, marginRight: 6 }} />Batterie</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: realBattery > 50 ? '#10B981' : realBattery > 20 ? '#F59E0B' : '#EF4444' }}>{realBattery}%</span>
                </div>
                <div style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' } as any}>
                  <div style={{ height: '100%', borderRadius: 7, width: `${Math.max(4, realBattery)}%`, background: realBattery > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : realBattery > 20 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #DC2626, #EF4444)' } as any} />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 } as any}>
              {dt === 'bracelet' && (
                <div data-testid="bracelet-ecg-btn" onClick={() => router.push('/ecg' as any)} style={{ flex: 1, padding: '11px 14px', borderRadius: 999, cursor: 'pointer', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#F97316' } as any}>
                  <i className="ri-pulse-line" style={{ fontSize: 14 }} />ECG
                </div>
              )}
              {dt === 'scale' && (
                <div data-testid="scale-weigh-btn" onClick={onScaleWeighing} style={{ flex: 1, padding: '11px 14px', borderRadius: 999, cursor: 'pointer', background: `${meta.color}18`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: meta.color } as any}>
                  <i className="ri-scales-3-line" style={{ fontSize: 14 }} />Nouvelle pesee
                </div>
              )}
              {dt === 'vest' && (
                <div data-testid="vest-status" style={{ flex: 1, padding: '11px 14px', borderRadius: 999, background: vestActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)', border: `1px solid ${vestActive ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: vestActive ? '#10B981' : '#F59E0B' } as any}>
                  <i className={vestActive ? 'ri-shield-check-line' : 'ri-zzz-line'} style={{ fontSize: 14 }} />{vestActive ? 'Protection active' : 'En veille'}
                </div>
              )}
              <div data-testid={`detail-${dt}-btn`} onClick={() => onSelectDevice(dt)} style={{ padding: '11px 14px', borderRadius: 999, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>
                <i className="ri-information-line" style={{ fontSize: 14 }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 } as any}>
            <div data-testid={`connect-${dt}-btn`} onClick={() => dt === 'scale' ? onScaleWeighing() : onStartPairing(dt)} style={{ flex: 1, padding: '13px 16px', borderRadius: 999, cursor: 'pointer', background: '#FFF', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: needsSub ? 0.5 : 1 } as any}>
              <i className={dt === 'scale' ? 'ri-scales-3-line' : 'ri-bluetooth-line'} style={{ fontSize: 16 }} />{dt === 'scale' ? 'Nouvelle pesee' : 'Associer'}
            </div>
            <div onClick={() => window.open(meta.link, '_blank')} style={{ flex: 1, padding: '13px 16px', borderRadius: 999, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600 } as any}>
              <i className="ri-external-link-line" style={{ fontSize: 14 }} />Decouvrir
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
