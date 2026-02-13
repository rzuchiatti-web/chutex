import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        height: 60,
        paddingBottom: 6,
        paddingTop: 6,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
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
        tabBarIcon: ({ color, size }) => isG
          ? <MaterialCommunityIcons name="map-marker-radius-outline" size={size} color={color} />
          : <Ionicons name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="devices" options={{
        title: isG ? 'Prescriptions' : isTA ? 'Abonnes' : 'Appareils',
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
