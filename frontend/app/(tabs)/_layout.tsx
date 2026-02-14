import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, loading } = useAuth();

  // Inject CSS on web to force floating tab bar
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        /* Force floating tab bar on ALL screens */
        [role="tablist"] {
          position: fixed !important;
          bottom: 12px !important;
          left: 12px !important;
          right: 12px !important;
          border-radius: 24px !important;
          background: rgba(255,255,255,0.97) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12) !important;
          border: 1px solid rgba(0,0,0,0.06) !important;
          z-index: 99999 !important;
          height: 60px !important;
          padding-bottom: 4px !important;
          border-top: none !important;
        }
        /* Add bottom padding to all tab content so it doesn't hide behind the floating bar */
        [role="tablist"] ~ div,
        [role="tabpanel"] {
          padding-bottom: 80px !important;
        }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';
  const isCompany = r === 'prescriber_company';

  // Safe bottom padding for devices with navigation bars
  const bottomPad = Platform.OS === 'web' ? 6 : Math.max(12, 6);

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: '#F5F0EB' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        height: Platform.OS === 'web' ? 60 : 70,
        paddingBottom: bottomPad,
        paddingTop: 6,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
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
