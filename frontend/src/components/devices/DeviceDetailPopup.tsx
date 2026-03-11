import React from 'react';
import { useRouter } from 'expo-router';
import { GlassOverlay } from './GlassOverlay';
import { DEVICE_META } from './constants';

interface DeviceDetailPopupProps {
  deviceType: string;
  device: any;
  weighings: any[];
  removing: boolean;
  onClose: () => void;
  onRemove: (deviceId: string | undefined, deviceType: string) => void;
  onLaunchScan: (dt: string) => void;
  onScaleWeighing: () => void;
}

export function DeviceDetailPopup({ deviceType, device, weighings, removing, onClose, onRemove, onLaunchScan, onScaleWeighing }: DeviceDetailPopupProps) {
  const router = useRouter();
  const meta = DEVICE_META[deviceType];
  const isVest = deviceType === 'vest';
  const vestAct = isVest && device.last_sync && (Date.now() - new Date(device.last_sync).getTime()) < 30000;
  const detailConnected = isVest ? vestAct : device.connected;
  const detailLabel = isVest ? (vestAct ? 'En marche' : 'En veille') : (device.connected ? 'Connecte' : 'Hors ligne');
  const detailColor = isVest ? (vestAct ? '#10B981' : '#F59E0B') : (device.connected ? '#10B981' : '#EF4444');

  return (
    <GlassOverlay onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
        <img src={meta.img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block' } as any} />
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>{meta.name}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: `${detailColor}18`, border: `1px solid ${detailColor}30` } as any}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: detailColor } as any} />
          <span style={{ fontSize: 12, fontWeight: 700, color: detailColor }}>{detailLabel}</span>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
        {[
          ['Nom', meta.name],
          ...(device.mac_address || device.ble_device_id ? [['ID', device.mac_address || device.ble_device_id]] : []),
          ['Derniere sync.', device.last_sync ? new Date(device.last_sync).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', fontFamily: l === 'ID' ? 'monospace' : 'inherit' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Battery */}
      {device.battery > 0 && (
        <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 0 4px' }}>Batterie</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' } as any}>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ height: 8, borderRadius: 4, width: `${device.battery}%`, background: device.battery > 50 ? 'linear-gradient(90deg,#059669,#10B981)' : device.battery > 25 ? 'linear-gradient(90deg,#D97706,#F59E0B)' : 'linear-gradient(90deg,#DC2626,#EF4444)' } as any} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: device.battery > 50 ? '#10B981' : device.battery > 25 ? '#F59E0B' : '#EF4444', minWidth: 40, textAlign: 'right' }}>{device.battery}%</span>
          </div>
        </div>
      )}

      {/* Weighings history */}
      {deviceType === 'scale' && weighings.length > 0 && (
        <div style={{ marginBottom: 16 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Dernieres pesees</div>
          {weighings.slice(0, 5).map((w: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 } as any}>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{w.weight} kg</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{new Date(w.timestamp || w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {w.bmi > 0 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>IMC {w.bmi}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
        {deviceType === 'bracelet' && (
          <>
            <div onClick={() => { onClose(); router.push('/ecg' as any); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#F97316' } as any}>
              <i className="ri-pulse-line" style={{ marginRight: 6 }} />ECG
            </div>
            <div onClick={() => { onClose(); onLaunchScan('bracelet'); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: meta.color } as any}>
              <i className="ri-refresh-line" style={{ marginRight: 6 }} />Synchroniser
            </div>
          </>
        )}
        {deviceType === 'scale' && (
          <div onClick={() => { onClose(); onScaleWeighing(); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: meta.color } as any}>
            <i className="ri-scales-3-line" style={{ marginRight: 6 }} />Nouvelle pesee
          </div>
        )}
        {deviceType === 'vest' && (
          <div onClick={() => { onClose(); onLaunchScan('vest'); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: meta.color } as any}>
            <i className="ri-refresh-line" style={{ marginRight: 6 }} />Synchroniser
          </div>
        )}
      </div>

      {/* Remove button */}
      <div onClick={() => onRemove(device.id, deviceType)} style={{ padding: '12px', borderRadius: 999, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.5)' } as any}>
        {removing ? 'Suppression...' : "Supprimer l'appareil"}
      </div>
    </GlassOverlay>
  );
}
