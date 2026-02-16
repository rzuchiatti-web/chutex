import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import { Palette } from '../../src/constants/colors';

export default function TabLayout() {
  const { user, loading } = useAuth();

  // Inject CSS for dark floating tab bar
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.id = 'clinic-tabbar';
      style.textContent = `
        [role="tablist"] {
          position: fixed !important;
          bottom: 12px !important;
          left: 12px !important;
          right: 12px !important;
          border-radius: 22px !important;
          background: rgba(10,10,10,0.88) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08) !important;
          border: none !important;
          z-index: 99999 !important;
          height: 60px !important;
          padding-bottom: 4px !important;
          border-top: none !important;
        }
        [role="tablist"] ~ div,
        [role="tabpanel"] {
          padding-bottom: 80px !important;
        }
      `;
      document.head.appendChild(style);
      return () => { document.getElementById('clinic-tabbar')?.remove(); };
    }
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';
  const isCompany = r === 'prescriber_company';

  const bottomPad = Platform.OS === 'web' ? 6 : Math.max(12, 6);

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: '#000' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
      tabBarStyle: {
        backgroundColor: 'rgba(10,10,10,0.88)',
        borderTopWidth: 0,
        height: Platform.OS === 'web' ? 60 : 70,
        paddingBottom: bottomPad,
        paddingTop: 6,
        elevation: 0,
        shadowColor: 'transparent',
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    }}>
      <Tabs.Screen name="index" options={{
        title: (isAdmin || isCompany) ? 'Dashboard' : 'Accueil',
        tabBarIcon: ({ color, size }) => <Ionicons name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="health" options={{
        title: isAdmin ? 'Clients' : isCompany ? 'Agences' : 'Sante',
        tabBarIcon: ({ color, size }) => isAdmin
          ? <Ionicons name="people-outline" size={size} color={color} />
          : isCompany ? <Ionicons name="business-outline" size={size} color={color} />
          : <MaterialCommunityIcons name="heart-pulse" size={size} color={color} />,
        href: (!isBen && !isAdmin && !isCompany) ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        title: isCompany ? 'Prescripteurs' : 'Alertes',
        tabBarIcon: ({ color, size }) => <Ionicons name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        title: isAdmin ? 'Intervenants' : isCompany ? 'Interventions' : isTA ? 'Teleassist.' : isG ? 'Interventions' : 'Teleconsult.',
        tabBarIcon: ({ color, size }) => (isAdmin || isCompany)
          ? <Ionicons name="medkit-outline" size={size} color={color} />
          : isG ? <MaterialCommunityIcons name="map-marker-radius-outline" size={size} color={color} />
          : <Ionicons name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="devices" options={{
        title: isAdmin ? 'Prescripteurs' : isCompany ? 'Prescriptions' : isG ? 'Prescriptions' : isTA ? 'Abonnes' : 'Appareils',
        tabBarIcon: ({ color, size }) => isAdmin
          ? <Ionicons name="document-text-outline" size={size} color={color} />
          : isCompany ? <Ionicons name="document-text-outline" size={size} color={color} />
          : isG ? <Ionicons name="document-text-outline" size={size} color={color} />
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
