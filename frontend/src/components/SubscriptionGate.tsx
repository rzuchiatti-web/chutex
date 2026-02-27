import React from 'react';
import { Platform } from 'react-native';

interface Props {
  subscription: any;
  children: React.ReactNode;
  feature?: string;
}

export function SubscriptionGate({ subscription, children, feature }: Props) {
  const hasAccess = subscription?.can_use_bracelet || subscription?.has_subscription;

  if (hasAccess) return <>{children}</>;

  if (Platform.OS === 'web') {
    return (
      <div style={{ position: 'relative' } as any}>
        <div style={{ filter: 'blur(6px)', opacity: 0.3, pointerEvents: 'none' } as any}>{children}</div>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 } as any}>
          <div style={{ padding: '24px 28px', borderRadius: 22, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', maxWidth: 300 } as any}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,58,237,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 } as any}>
              <i className="ri-lock-line" style={{ fontSize: 22, color: '#7C3AED' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Abonnement requis</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 14 }}>
              {feature === 'vitals' && 'Souscrivez un abonnement bracelet pour acceder a vos donnees de sante en temps reel.'}
              {feature === 'sync' && 'Un abonnement actif est necessaire pour synchroniser votre bracelet.'}
              {feature === 'health' && 'Activez votre abonnement pour consulter vos rapports de sante detailles.'}
              {!feature && 'Un abonnement Standard ou Care est necessaire pour utiliser les fonctionnalites du bracelet.'}
            </div>
            <a href="/subscription" style={{ display: 'block', padding: '12px 20px', borderRadius: 999, background: '#7C3AED', color: '#FFF', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' } as any}>
              Souscrire un abonnement
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Native fallback
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <View style={{ position: 'relative' }}>
      <View style={{ opacity: 0.15 }} pointerEvents="none">{children}</View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
        <View style={{ padding: 24, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', maxWidth: 280 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF', marginBottom: 6 }}>Abonnement requis</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18, marginBottom: 14 }}>
            Un abonnement Standard ou Care est necessaire pour utiliser les fonctionnalites du bracelet.
          </Text>
        </View>
      </View>
    </View>
  );
}

export function SubscriptionBanner({ subscription, onSubscribe }: { subscription: any; onSubscribe?: () => void }) {
  const has = subscription?.can_use_bracelet || subscription?.has_subscription;
  if (has) return null;

  if (Platform.OS === 'web') {
    return (
      <div data-testid="subscription-banner" style={{ padding: '14px 18px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.06))', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, cursor: 'pointer' } as any} onClick={() => { if (onSubscribe) onSubscribe(); else window.location.href = '/subscription'; }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <i className="ri-shield-star-line" style={{ fontSize: 18, color: '#7C3AED' }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Activez votre bracelet</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Souscrivez un abonnement pour utiliser toutes les fonctionnalites.</div>
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: '#7C3AED', fontSize: 11, fontWeight: 700, color: '#FFF', flexShrink: 0 } as any}>Souscrire</div>
      </div>
    );
  }

  return null;
}
