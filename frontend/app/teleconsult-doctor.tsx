import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { BeneficiaryTeleconsult } from '../src/components/teleconsult/BeneficiaryTeleconsult';
import FullScreenLoader from '../src/components/FullScreenLoader';

export default function TeleconsultDoctorPage() {
  const { token, user, loading } = useAuth();
  const router = useRouter();
  if (loading) return <FullScreenLoader />;
  if (!token || !user) return null;
  if (Platform.OS !== 'web') return null;
  return (
    <div style={{ position: 'absolute', inset: 0 } as any}>
      <div data-testid="teleconsult-back-btn" onClick={() => router.back()} style={{ position: 'fixed', top: 70, left: 16, zIndex: 9999, width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)' } as any}>
        <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#111' }} />
      </div>
      <BeneficiaryTeleconsult token={token} />
    </div>
  );
}
