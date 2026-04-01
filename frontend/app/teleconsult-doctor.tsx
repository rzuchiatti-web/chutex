import React from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { BeneficiaryTeleconsult } from '../src/components/teleconsult/BeneficiaryTeleconsult';
import FullScreenLoader from '../src/components/FullScreenLoader';

export default function TeleconsultDoctorPage() {
  const { token, user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!token || !user) return null;
  if (Platform.OS !== 'web') return null;
  return <BeneficiaryTeleconsult token={token} />;
}
