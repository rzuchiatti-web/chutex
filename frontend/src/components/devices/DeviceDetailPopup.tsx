import { useI18n } from '../../context/I18nContext';
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

export function DeviceDétailPopup({ deviceType, device, weighings, removing, onClose, onRemove, onLaunchScan, onScaleWeighing }: DeviceDetailPopupProps) {
  const { t } = useI18n();
  const router = useRouter();
  const meta = DEVICE_META[deviceType];
  const isVest = deviceType === 'vest';
  const isBracelet = deviceType === 'bracelet';
  const vestAct = isVest && device.last_sync && (Date.now() - new Date(device.last_sync).getTime()) < 30000;
  const detailConnected = isVest ? vestAct : device.connected;
  const detailLabel = isVest ? (vestAct ? 'En marche' : 'En veille') : (device.connected ? 'Connecté' : 'Hors ligne');
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

      {/* Info rows — ID aligned left */}
      <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
        {[
          [t('last_name'), meta.name],
          ...(device.mac_address || device.ble_device_id ? [['ID', device.mac_address || device.ble_device_id]] : []),
          ['Dernière sync.', device.last_sync ? new Date(device.last_sync).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'],
        ].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', justifyContent: l === 'ID' ? 'flex-start' : 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: 10 } as any}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', fontFamily: l === 'ID' ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{v}</span>
          </div>
        ))}
      </div>

      {/* Battery */}
      {device.battery > 0 && (
        <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 0 4px' }}>Batterie</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 12px' } as any}>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ height: 8, borderRadius: 4, width: `${device.battery}%`, background: device.battery > 50 ? 'linear-gradient(90deg,#059669,#10B981)' : device.battery > 25 ? 'linear-gradient(90deg,#D97706,#F59E0B)' : 'linear-gradient(90deg,#DC2626,#EF4444)' } as any} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: device.battery > 50 ? '#10B981' : device.battery > 25 ? '#F59E0B' : '#EF4444', minWidth: 40, textAlign: 'right' }}>{device.battery}%</span>
          </div>
        </div>
      )}

      {/* Bracelet vitals data */}
      {isBracelet && (
        <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 0 4px' }}>Données captées</div>
          {[
            { icon: 'ri-heart-pulse-line', label: 'Fréquence cardiaque', value: device.last_heart_rate, unit: 'bpm', color: '#EF4444' },
            { icon: 'ri-drop-line', label: 'SpO2', value: device.last_spo2, unit: '%', color: '#3B82F6' },
            { icon: 'ri-temp-hot-line', label: 'Température', value: device.last_temperature, unit: '°C', color: '#F97316' },
            { icon: 'ri-footprint-line', label: 'Pas', value: device.last_steps, unit: '', color: '#10B981' },
            { icon: 'ri-fire-line', label: 'Calories', value: device.last_calories, unit: 'kcal', color: '#F59E0B' },
          ].map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <i className={m.icon} style={{ fontSize: 14, color: m.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flex: 1 }}>{m.label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: m.value && m.value > 0 ? '#FFF' : 'rgba(255,255,255,0.15)' }}>{m.value && m.value > 0 ? `${typeof m.value === 'number' && m.unit === '°C' ? m.value.toFixed(1) : m.value} ${m.unit}` : '--'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Weighings history */}
      {deviceType === 'scale' && weighings.length > 0 && (
        <div style={{ marginBottom: 12 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Dernières pesées</div>
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
        {deviceType === 'scale' && (
          <div onClick={() => { onClose(); onScaleWeighing(); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: meta.color } as any}>
            <i className="ri-scales-3-line" style={{ marginRight: 6 }} />Nouvelle pesée
          </div>
        )}
        {deviceType === 'vest' && (
          <div onClick={() => { onClose(); onLaunchScan('vest'); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: meta.color } as any}>
            <i className="ri-refresh-line" style={{ marginRight: 6 }} />Synchroniser
          </div>
        )}
      </div>

      {/* Remove button — at the very bottom */}
      <div onClick={() => onRemove(device.id, deviceType)} style={{ padding: '14px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#EF4444', marginTop: 8 } as any}>
        {removing ? 'Suppression...' : "Supprimer l'appareil"}
      </div>
    </GlassOverlay>
  );
}
