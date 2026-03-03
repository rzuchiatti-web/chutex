import React from 'react';
import { GlassOverlay } from './GlassOverlay';
import { DEVICE_META } from './constants';

interface PairingStepsProps {
  deviceType: string;
  step: number;
  onSetStep: (step: number) => void;
  onClose: () => void;
  onLaunchScan: (dt: string) => void;
  onScaleWeighing: () => void;
}

export function PairingStepsPopup({ deviceType, step, onSetStep, onClose, onLaunchScan, onScaleWeighing }: PairingStepsProps) {
  const meta = DEVICE_META[deviceType];
  const steps = meta.steps;
  const cur = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <GlassOverlay onClose={onClose}>
      <div style={{ textAlign: 'center' } as any}>
        <img src={meta.img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 20px', display: 'block', filter: `drop-shadow(0 8px 24px ${meta.color}30)` } as any} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 } as any}>
          {steps.map((_: any, i: number) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === step ? 24 : 12, background: i === step ? meta.color : i < step ? `${meta.color}66` : 'rgba(255,255,255,0.1)' } as any} />
          ))}
        </div>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${meta.color}15`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
          <i className={cur.icon} style={{ fontSize: 24, color: meta.color }} />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: `${meta.color}80`, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Etape {step + 1}/{steps.length}</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 10 }}>{cur.title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>{cur.desc}</div>
        <div style={{ padding: '14px 18px', borderRadius: 16, background: `${meta.color}08`, border: `1px solid ${meta.color}18`, marginBottom: 28, textAlign: 'left' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
            <i className="ri-information-line" style={{ fontSize: 16, color: meta.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{cur.tip}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 } as any}>
          {step > 0 && (
            <div onClick={() => onSetStep(step - 1)} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Retour</div>
          )}
          <div onClick={() => {
            if (!isLast) { onSetStep(step + 1); return; }
            if (deviceType === 'scale') { onClose(); onScaleWeighing(); }
            else onLaunchScan(deviceType);
          }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: isLast ? `linear-gradient(135deg, ${meta.color}CC, ${meta.color})` : '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: isLast ? '#FFF' : '#111', boxShadow: isLast ? `0 4px 20px ${meta.color}40` : 'none' } as any}>
            {isLast ? "Lancer l'appairage" : 'Suivant'}
          </div>
        </div>
      </div>
    </GlassOverlay>
  );
}

interface BleScanningProps {
  deviceType: string;
  bleError: string;
  onClose: () => void;
}

export function BleScanningPopup({ deviceType, bleError, onClose }: BleScanningProps) {
  const meta = DEVICE_META[deviceType];
  return (
    <GlassOverlay onClose={onClose}>
      <div style={{ textAlign: 'center' } as any}>
        <img src={meta.img} alt="" style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto 20px', display: 'block' } as any} />
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 24px' } as any}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${meta.color}`, opacity: 0.3, animation: 'pulseRing 1.5s ease-out infinite' } as any} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `2px solid ${meta.color}`, opacity: 0.3, animation: 'pulseRing 1.5s ease-out infinite 0.5s' } as any} />
          <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', background: `${meta.color}15`, border: `2px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-bluetooth-connect-line" style={{ fontSize: 22, color: meta.color, animation: 'spin 2s linear infinite' }} />
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Recherche en cours...</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Selectionnez votre {meta.name} dans la popup Bluetooth</div>
        {bleError && <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 16 }}>{bleError}</div>}
        <div onClick={onClose} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Annuler</div>
      </div>
    </GlassOverlay>
  );
}

interface BleConnectedProps {
  deviceType: string;
  bleVitals: any;
  onClose: () => void;
}

export function BleConnectedPopup({ deviceType, bleVitals, onClose }: BleConnectedProps) {
  const meta = DEVICE_META[deviceType];
  return (
    <GlassOverlay onClose={onClose}>
      <div style={{ textAlign: 'center' } as any}>
        <div style={{ width: 80, height: 80, borderRadius: 999, background: `${meta.color}20`, border: `2px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' } as any}>
          <i className="ri-check-line" style={{ fontSize: 40, color: meta.color }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Appareil connecte !</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{bleVitals.name || meta.name}</div>
        {bleVitals.id && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 24, fontFamily: 'monospace' }}>ID: {bleVitals.id.substring(0, 20)}</div>}
        <div onClick={onClose} style={{ padding: '16px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#111' } as any}>Terminer</div>
      </div>
    </GlassOverlay>
  );
}

interface BleErrorProps {
  deviceType: string;
  bleError: string;
  onClose: () => void;
  onRetry: () => void;
}

export function BleErrorPopup({ deviceType, bleError, onClose, onRetry }: BleErrorProps) {
  return (
    <GlassOverlay onClose={onClose}>
      <div style={{ textAlign: 'center' } as any}>
        <div style={{ width: 80, height: 80, borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' } as any}>
          <i className="ri-error-warning-line" style={{ fontSize: 40, color: '#EF4444' }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Erreur de connexion</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{bleError}</div>
        <div style={{ display: 'flex', gap: 10 } as any}>
          <div onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Fermer</div>
          <div onClick={onRetry} style={{ flex: 1, padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111' } as any}>Reessayer</div>
        </div>
      </div>
    </GlassOverlay>
  );
}
