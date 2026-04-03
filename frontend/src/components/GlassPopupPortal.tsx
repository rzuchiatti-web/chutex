import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import ReactDOM from 'react-dom';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function GlassPopupPortal({ visible, onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!visible || Platform.OS !== 'web' || !mounted) return null;

  const overlay = (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 99990,
      backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
      background: 'rgba(0,0,0,0.55)',
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, margin: '0 auto',
        padding: '70px 24px 120px', boxSizing: 'border-box',
      } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
          <div onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 999,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(overlay, document.body);
}
