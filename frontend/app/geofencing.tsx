import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import NativePageView from '../src/components/NativePageView';

export default function GeofencingDeprecatedPage() {
  const router = useRouter();
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId?: string | string[] }>();
  const bid = Array.isArray(beneficiaryId) ? beneficiaryId[0] : beneficiaryId;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (bid) {
      router.replace({ pathname: '/beneficiary-detail' as any, params: { beneficiaryId: bid } });
      return;
    }
    router.replace('/(tabs)/index' as any);
  }, [bid, router]);

  if (Platform.OS !== 'web') return <NativePageView path="/" />;

  return (
    <div data-testid="geofencing-deprecated-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'radial-gradient(circle at 20% 20%, #0B253A, #020617)' } as any}>
      <div style={{ width: '100%', maxWidth: 460, borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(15,23,42,0.74)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', padding: 18, textAlign: 'center' } as any}>
        <div data-testid="geofencing-deprecated-title" style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Gestion Safe Zones deplacee</div>
        <div data-testid="geofencing-deprecated-description" style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 14 }}>
          Cette ancienne page a ete retiree. Utilisez la fiche beneficiaire detaillee pour gerer les zones.
        </div>
        <div data-testid="geofencing-deprecated-back-btn" onClick={() => router.replace('/(tabs)/index' as any)} style={{ display: 'inline-flex', padding: '9px 14px', borderRadius: 999, cursor: 'pointer', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.35)', fontSize: 12, fontWeight: 800, color: '#34D399' } as any}>
          Retour accueil
        </div>
      </div>
    </div>
  );
}
