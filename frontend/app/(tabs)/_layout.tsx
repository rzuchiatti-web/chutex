import React from 'react';
import { Tabs } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderTopWidth: 0,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          ...(Platform.OS === 'web' ? {
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
          } : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 15,
          }),
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600' },
        tabBarIconStyle: { marginBottom: -2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <TabIcon name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="health" options={{ title: 'Sante', tabBarIcon: ({ color, size }) => <TabIcon name="heart-pulse" color={color} size={size} mci />, href: (user.active_role || user.role) !== 'beneficiary' ? null : undefined }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alertes', tabBarIcon: ({ color, size }) => <TabIcon name="notifications-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="teleconsult" options={{
        title: (user.active_role || user.role) === 'teleassistance' ? 'Teleassist.' : (user.active_role || user.role) === 'guardian' ? 'Interventions' : 'Teleconsult.',
        tabBarIcon: ({ color, size }) => <TabIcon name={(user.active_role || user.role) === 'guardian' ? 'map-marker-radius-outline' : 'videocam-outline'} color={color} size={size} mci={(user.active_role || user.role) === 'guardian'} />
      }} />
      <Tabs.Screen name="devices" options={{
        title: (user.active_role || user.role) === 'guardian' ? 'Prescriptions' : (user.active_role || user.role) === 'teleassistance' ? 'Abonnes' : 'Appareils',
        tabBarIcon: ({ color, size }) => <TabIcon name={(user.active_role || user.role) === 'guardian' ? 'document-text-outline' : 'bluetooth-connect'} color={color} size={size} mci={(user.active_role || user.role) !== 'guardian' && (user.active_role || user.role) !== 'teleassistance'} />
      }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <TabIcon name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}

function TabIcon({ name, color, size, mci }: { name: string; color: string; size: number; mci?: boolean }) {
  const { Ionicons, MaterialCommunityIcons } = require('@expo/vector-icons');
  if (mci) return <MaterialCommunityIcons name={name} size={size} color={color} />;
  return <Ionicons name={name} size={size} color={color} />;
}
