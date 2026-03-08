import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useI18n } from '../../src/context/I18nContext';
import { Colors } from '../../src/constants/colors';
import { DeviceManagement } from '../../src/components/devices/DeviceManagement';
import PrescriptionManagement from '../../src/components/devices/PrescriptionManagement';
import AdminPrescripteurs from '../../src/components/devices/AdminPrescripteurs';
import CompanyPrescriptionsTab from '../../src/components/devices/CompanyPrescriptionsTab';
import SubscribersList from '../../src/components/devices/SubscribersList';

export default function DevicesScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  if (!user || !token) return null;
  const r = user.active_role || user.role;
  // Guardian: full screen, no wrapper header
  if (r === 'guardian') {
    return <PrescriptionManagement token={token} user={user} />;
  }
  // Beneficiary: full screen devices page (web)
  if (r === 'beneficiary' && Platform.OS === 'web') {
    return <DeviceManagement token={token} />;
  }
  // Admin, Company, Teleassistance: full screen web
  if (Platform.OS === 'web') {
    if (r === 'admin') return <AdminPrescripteurs token={token} />;
    if (r === 'prescriber_company') return <CompanyPrescriptionsTab token={token} user={user} />;
    if (r === 'teleassistance') return <SubscribersList token={token} />;
  }

  return (
    <View key={r} style={[styles.safeArea, { backgroundColor: '#FFFFFF' }]} testID="devices-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#111827' }]}>{r === 'admin' ? t('prescribers') : r === 'prescriber_company' ? t('prescriptions') : r === 'teleassistance' ? t('subscribers') : t('my_devices_tab')}</Text>
      </View>
      {r === 'admin' ? <AdminPrescripteurs token={token} />
        : r === 'prescriber_company' ? <CompanyPrescriptionsTab token={token} user={user} />
        : r === 'teleassistance' ? <SubscribersList token={token} />
        : <DeviceManagement token={token} />}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
});
