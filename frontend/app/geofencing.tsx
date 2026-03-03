import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function GeofencingDeprecatedPage() {
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId?: string | string[] }>();
  const bid = Array.isArray(beneficiaryId) ? beneficiaryId[0] : beneficiaryId;

  if (bid) return <Redirect href={{ pathname: '/beneficiary-detail' as any, params: { beneficiaryId: bid } }} />;
  return <Redirect href={'/(tabs)/index' as any} />;
}
