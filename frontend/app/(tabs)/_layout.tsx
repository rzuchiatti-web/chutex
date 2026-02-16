import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}><ActivityIndicator size="large" color="#111827" /></View>;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';
  const isCompany = r === 'prescriber_company';

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: '#FFFFFF' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#111827',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1, borderTopColor: '#E5E7EB',
        height: Platform.OS === 'web' ? 60 : 70,
        paddingBottom: Platform.OS === 'web' ? 6 : Math.max(12, 6), paddingTop: 6,
        elevation: 0, shadowColor: 'transparent',
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
    }}>
      <Tabs.Screen name="index" options={{ title: (isAdmin || isCompany) ? 'Dashboard' : 'Accueil', tabBarIcon: ({ color, size }) => <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="health" options={{ title: isAdmin ? 'Clients' : isCompany ? 'Agences' : 'Sante', tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />, href: (!isBen && !isAdmin && !isCompany) ? null : undefined }} />
      <Tabs.Screen name="alerts" options={{ title: isCompany ? 'Prescripteurs' : 'Alertes', tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="teleconsult" options={{ title: isAdmin ? 'Intervenants' : isCompany ? 'Interventions' : isTA ? 'Teleassist.' : isG ? 'Interventions' : 'Teleconsult.', tabBarIcon: ({ color, size }) => (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <MCIcon name="map-marker-radius-outline" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="devices" options={{ title: isAdmin ? 'Prescripteurs' : isCompany ? 'Prescriptions' : isG ? 'Prescriptions' : isTA ? 'Abonnes' : 'Appareils', tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="document-text-outline" size={size} color={color} /> : isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="document-text-outline" size={size} color={color} /> : isTA ? <Icon name="people-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
