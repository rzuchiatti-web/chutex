import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useI18n } from '../../src/context/I18nContext';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  const { t } = useI18n();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';

  const tabStyle: any = {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 6,
    paddingTop: 8,
    height: 62,
    elevation: 0,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
    } : {}),
  };

  if (r === 'admin') {
    return (
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: tabStyle, tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textMuted }}>
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} /> }} />
        <Tabs.Screen name="alerts" options={{ title: 'Alertes', tabBarIcon: ({ color }) => <Ionicons name="notifications-outline" size={22} color={color} /> }} />
        <Tabs.Screen name="devices" options={{ title: 'Prescripteurs', tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} /> }} />
        <Tabs.Screen name="teleconsult" options={{ title: 'Intervenants', tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark-outline" size={22} color={color} /> }} />
        <Tabs.Screen name="health" options={{ title: 'Analyse', tabBarIcon: ({ color }) => <Ionicons name="analytics-outline" size={22} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} /> }} />
      </Tabs>
    );
  }

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#888',
      tabBarStyle: tabStyle,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Accueil',
        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="health" options={{
        title: 'Sante',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />,
        href: !isBen ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        title: 'Alertes',
        tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        title: isTA ? 'Teleassist.' : isG ? 'Interventions' : 'Teleconsult.',
        tabBarIcon: ({ color, size }) => isTA
          ? <Ionicons name="headset-outline" size={size} color={color} />
          : isG ? <MaterialCommunityIcons name="map-marker-radius-outline" size={size} color={color} />
          : <Ionicons name="videocam-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="devices" options={{
        title: isG ? 'Prescriptions' : (isTA) ? 'Abonnes' : 'Appareils',
        tabBarIcon: ({ color, size }) => isG
          ? <Ionicons name="document-text-outline" size={size} color={color} />
          : isTA ? <Ionicons name="people-outline" size={size} color={color} />
          : <MaterialCommunityIcons name="bluetooth-connect" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
