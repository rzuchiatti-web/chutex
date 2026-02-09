import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const rd = useRef(false);

  useEffect(() => { if (!loading && !user && !rd.current) { rd.current = true; router.replace('/'); } }, [user, loading]);

  if (loading || !user) return <View style={st.l}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const r = user.role;
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAd = r === 'admin';

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: Colors.primary, tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: { backgroundColor: Colors.paper, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: 6, paddingTop: 6, height: 60 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="health" options={{ title: 'Santé', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />,
        href: (isG || isTA || isAd) ? null : undefined }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alertes', tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} /> }} />
      <Tabs.Screen name="teleconsult" options={{
        title: isTA ? 'Téléassist.' : isG ? 'Suivi' : isAd ? 'Gestion' : 'Téléconsult',
        tabBarIcon: ({ color, size }) => isTA ? <Ionicons name="headset" size={size} color={color} /> : isG ? <MaterialCommunityIcons name="map-marker-radius" size={size} color={color} /> : isAd ? <Ionicons name="settings" size={size} color={color} /> : <Ionicons name="videocam" size={size} color={color} /> }} />
      <Tabs.Screen name="devices" options={{
        title: isG ? 'Prescrip.' : (isTA || isAd) ? 'Tous' : 'Appareils',
        tabBarIcon: ({ color, size }) => isG ? <Ionicons name="document-text" size={size} color={color} /> : (isTA || isAd) ? <Ionicons name="people" size={size} color={color} /> : <MaterialCommunityIcons name="bluetooth-connect" size={size} color={color} />,
        href: isAd ? null : undefined }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}

const st = StyleSheet.create({ l: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background } });
