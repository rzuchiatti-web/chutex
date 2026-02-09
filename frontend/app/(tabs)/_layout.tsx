import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={st.l}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (!user) return null;

  const r = user.role;
  // Admin gets dedicated backoffice tabs
  if (r === 'admin') {
    return (
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: st.tabBar, tabBarItemStyle: st.tabItem, tabBarLabelStyle: st.tabLabel, tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.textMuted }}>
        <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={20} color={color} /> }} />
        <Tabs.Screen name="alerts" options={{ title: 'Alertes', tabBarIcon: ({ color }) => <Ionicons name="notifications-outline" size={20} color={color} /> }} />
        <Tabs.Screen name="devices" options={{ title: 'Prescripteurs', tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={20} color={color} /> }} />
        <Tabs.Screen name="teleconsult" options={{ title: 'Intervenants', tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark-outline" size={20} color={color} /> }} />
        <Tabs.Screen name="health" options={{ title: 'Analyse', tabBarIcon: ({ color }) => <Ionicons name="analytics-outline" size={20} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} /> }} />
      </Tabs>
    );
  }
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAd = r === 'admin';

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: {
        backgroundColor: Colors.paper,
        borderTopWidth: 0.5,
        borderTopColor: Colors.border,
        paddingBottom: 6,
        paddingTop: 6,
        height: 56,
        elevation: 0,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Accueil',
        tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="health" options={{
        title: 'Santé',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />,
        href: !isBen ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        title: 'Alertes',
        tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        title: isTA ? 'Téléassist.' : isG ? 'Interventions' : isAd ? 'Gestion' : 'Téléconsult.',
        tabBarIcon: ({ color, size }) => isTA
          ? <Ionicons name="headset-outline" size={size} color={color} />
          : isG ? <MaterialCommunityIcons name="map-marker-radius-outline" size={size} color={color} />
          : isAd ? <Ionicons name="settings-outline" size={size} color={color} />
          : <Ionicons name="videocam-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="devices" options={{
        title: isG ? 'Prescriptions' : (isTA || isAd) ? 'Abonnés' : 'Appareils',
        tabBarIcon: ({ color, size }) => isG
          ? <Ionicons name="document-text-outline" size={size} color={color} />
          : (isTA || isAd) ? <Ionicons name="people-outline" size={size} color={color} />
          : <MaterialCommunityIcons name="bluetooth-connect" size={size} color={color} />,
        href: isAd ? null : undefined,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  l: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});
