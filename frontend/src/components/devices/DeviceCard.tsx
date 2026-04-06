import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { DEVICE_META } from './constants';
import { apiFetch, clearApiCache } from '../../services/api';

interface DeviceCardProps {
  deviceType: string;
  device: any;
  subscription: any;
  weighings: any[];
  token?: string;
  onStartPairing: (dt: string) => void;
  onSelectDevice: (dt: string) => void;
  onScaleWeighing: () => void;
  onRefresh?: () => void;
}

export function DeviceCard({ deviceType: dt, device, subscription, weighings, token, onStartPairing, onSelectDevice, onScaleWeighing, onRefresh }: DeviceCardProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const meta = DEVICE_META[dt];
  const isAssociated = device && (device.connected || device.battery > 0 || device.last_sync);
  const showActions = isAssociated || dt === 'dorsi';
  const realBattery = device?.battery || 0;
  const realConnected = device?.connected || false;
  const vestActive = dt === 'vest' && device?.last_sync && (Date.now() - new Date(device.last_sync).getTime()) < 30000;
  const needsSub = dt === 'bracelet' && !subscription?.can_use_bracelet;

  const statusLabel = dt === 'vest'
    ? (vestActive ? 'En marche' : isAssociated ? 'En veille' : '')
    : (realConnected ? 'Connecte' : isAssociated ? 'En veille' : '');
  const statusActive = dt === 'vest' ? vestActive : realConnected;

  return (
    <div data-testid={`device-card-${dt}`} style={{ borderRadius: 20, marginBottom: 14, overflow: 'hidden', background: '#F4F4F5', padding: '20px' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
      {/* Device image — inside grey card */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', minHeight: 130, cursor: isAssociated ? 'pointer' : 'default' } as any} onClick={() => isAssociated && onSelectDevice(dt)}>
        <img src={meta.img} alt={meta.name} style={{ height: 120, width: 'auto', maxWidth: '70%', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.08))' } as any} />
        {isAssociated && (
          <div style={{ position: 'absolute', top: 8, right: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: statusActive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)', border: `1px solid ${statusActive ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)'}` } as any}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusActive ? '#10B981' : '#F59E0B' } as any} />
            <span style={{ fontSize: 10, fontWeight: 600, color: statusActive ? '#10B981' : '#F59E0B' }}>{statusLabel}</span>
          </div>
        )}
      </div>

      {/* Name + description */}
      <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4, textAlign: 'center' }}>{meta.name}</div>
      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, marginBottom: 16, textAlign: 'center' }}>{meta.desc}</div>

      {/* Actions */}
      {showActions ? (
        <div>
          {isAssociated && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}><i className="ri-battery-line" style={{ fontSize: 14, marginRight: 6 }} />Batterie</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: realBattery > 50 ? '#10B981' : realBattery > 20 ? '#F59E0B' : realBattery > 0 ? '#EF4444' : '#9CA3AF' }}>{realBattery > 0 ? `${realBattery}%` : '--'}</span>
              </div>
              {realBattery > 0 && (
                <div style={{ height: 10, borderRadius: 5, background: '#E5E7EB', overflow: 'hidden', marginBottom: 4 } as any}>
                  <div style={{ height: '100%', borderRadius: 5, width: `${Math.max(4, realBattery)}%`, background: realBattery > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : realBattery > 20 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #DC2626, #EF4444)' } as any} />
                </div>
              )}
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 } as any}>
            {dt === 'bracelet' && (
              <div data-testid="bracelet-sync-btn" onClick={(e) => {
                e.stopPropagation();
                onStartPairing(dt);
              }} style={{ flex: 1, padding: '12px 14px', borderRadius: 999, cursor: 'pointer', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>
                <i className="ri-bluetooth-connect-line" style={{ fontSize: 14 }} />
                {realConnected ? 'Synchroniser' : 'Connecter & Sync'}
              </div>
            )}
            {dt === 'scale' && (
              <div data-testid="scale-weigh-btn" onClick={onScaleWeighing} style={{ flex: 1, padding: '12px 14px', borderRadius: 999, cursor: 'pointer', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>
                Nouvelle pesee
              </div>
            )}
            {dt === 'vest' && (
              <div data-testid="vest-status" style={{ flex: 1, padding: '12px 14px', borderRadius: 999, background: vestActive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)', border: `1px solid ${vestActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: vestActive ? '#10B981' : '#F59E0B' } as any}>
                <i className={vestActive ? 'ri-shield-check-line' : 'ri-zzz-line'} style={{ fontSize: 14 }} />{vestActive ? 'Protection active' : 'En veille'}
              </div>
            )}
            {dt === 'dorsi' && (
              <div data-testid="dorsi-bilan-btn" onClick={() => router.push('/dorsi-bilan' as any)} style={{ flex: 1, padding: '12px 14px', borderRadius: 999, cursor: 'pointer', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>
                Bilan lombaire
              </div>
            )}
            <div data-testid={`detail-${dt}-btn`} onClick={() => onSelectDevice(dt)} style={{ padding: '12px 14px', borderRadius: 999, cursor: 'pointer', background: '#FFF', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#111' } as any}>
              <i className="ri-information-line" style={{ fontSize: 14 }} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 } as any}>
          <div data-testid={`connect-${dt}-btn`} onClick={() => dt === 'scale' ? onScaleWeighing() : onStartPairing(dt)} style={{ flex: 1, padding: '13px 16px', borderRadius: 999, cursor: 'pointer', background: '#111', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, opacity: needsSub ? 0.5 : 1 } as any}>
            {dt !== 'scale' && <i className="ri-bluetooth-line" style={{ fontSize: 16 }} />}
            {dt === 'scale' ? 'Nouvelle pesee' : 'Associer'}
          </div>
          <div onClick={() => window.open(meta.link, '_blank')} style={{ flex: 1, padding: '13px 16px', borderRadius: 999, cursor: 'pointer', background: '#FFF', border: '1px solid #E5E7EB', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600 } as any}>
            <i className="ri-external-link-line" style={{ fontSize: 14 }} />Decouvrir
          </div>
        </div>
      )}
    </div>
  );
}
