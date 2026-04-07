import React from 'react';
import { useRouter } from 'expo-router';
import { GlassOverlay } from './GlassOverlay';

interface NoSubscriptionPopupProps {
  onClose: () => void;
}

export function NoSubscriptionPopup({ onClose }: NoSubscriptionPopupProps) {
  const router = useRouter();

  return (
    <GlassOverlay onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
          <i className="ri-watch-line" style={{ fontSize: 36, color: '#F59E0B' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Abonnement requis</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Pour associer votre bracelet Elio, choisissez votre formule.</div>
      </div>

      {/* Bracelet Elio option */}
      <div onClick={() => { onClose(); window.open('https://chutex-innovation.com/products/elio-smart-health-bracelet', '_blank'); }} style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 14, cursor: 'pointer' } as any}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' } as any}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
            <i className="ri-watch-line" style={{ fontSize: 26, color: '#3B82F6' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 3 }}>Bracelet Elio</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>24,90 EUR/mois</div>
          </div>
        </div>
      </div>

      {/* Chutex Care option */}
      <div onClick={() => { onClose(); router.push('/subscription' as any); }} style={{ padding: '20px', borderRadius: 20, background: 'linear-gradient(135deg,rgba(124,92,255,0.1),rgba(167,139,250,0.04))', border: '1px solid rgba(124,92,255,0.25)', marginBottom: 14, cursor: 'pointer', position: 'relative' } as any}>
        <div style={{ position: 'absolute', top: 10, right: 12, padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' } as any}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>Recommandé</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' } as any}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
            <i className="ri-shield-star-line" style={{ fontSize: 26, color: '#A78BFA' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 3 }}>Chutex Care</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>39,90 EUR/mois</div>
          </div>
        </div>
      </div>
    </GlassOverlay>
  );
}
