import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f16' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';
  const isCompany = r === 'prescriber_company';

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: 'transparent' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        height: Platform.OS === 'web' ? 58 : 70,
        paddingBottom: Platform.OS === 'web' ? 0 : Math.max(12, 6),
        elevation: 0, shadowColor: 'transparent',
        position: Platform.OS === 'web' ? 'absolute' as any : undefined,
      },
    }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color, size }) => <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'tab-home'} size={size} color={color} /> }} />
      <Tabs.Screen name="health" options={{ tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />, href: (!isBen && !isAdmin && !isCompany) ? null : undefined }} />
      <Tabs.Screen name="alerts" options={{ tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="teleconsult" options={{ tabBarIcon: ({ color, size }) => (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="devices" options={{ tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="document-text-outline" size={size} color={color} /> : isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="tab-subscription" size={size} color={color} /> : isTA ? <Icon name="people-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
