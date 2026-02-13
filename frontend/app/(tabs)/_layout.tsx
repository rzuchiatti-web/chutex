import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { View, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { user } = useAuth();
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';

  const tabConfig: Record<string, { icon: string; label: string; lib: string; hide?: boolean }> = {
    index: { icon: isAdmin ? 'grid-outline' : 'home-outline', label: isAdmin ? 'Dashboard' : 'Accueil', lib: 'ion' },
    health: { icon: 'heart-pulse', label: 'Sante', lib: 'mci', hide: !isBen },
    alerts: { icon: 'notifications-outline', label: 'Alertes', lib: 'ion' },
    teleconsult: {
      icon: isTA ? 'headset-outline' : isG ? 'map-marker-radius-outline' : isAdmin ? 'shield-checkmark-outline' : 'videocam-outline',
      label: isTA ? 'Teleassist.' : isG ? 'Interventions' : isAdmin ? 'Intervenants' : 'Teleconsult.',
      lib: isG ? 'mci' : 'ion',
    },
    devices: {
      icon: isG ? 'document-text-outline' : isTA ? 'people-outline' : isAdmin ? 'document-text-outline' : 'bluetooth-connect',
      label: isG ? 'Prescriptions' : isTA ? 'Abonnes' : isAdmin ? 'Prescripteurs' : 'Appareils',
      lib: isG || isTA || isAdmin ? 'ion' : 'mci',
    },
    profile: { icon: 'person-outline', label: 'Profil', lib: 'ion' },
  };

  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 28,
      flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4,
      marginHorizontal: 10, marginBottom: 8,
      borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
      ...(Platform.OS === 'web' ? {
        backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      } : {
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1, shadowRadius: 16, elevation: 20,
      }),
    }} testID="floating-tab-bar">
      {state.routes.map((route: any, index: number) => {
        const cfg = tabConfig[route.name];
        if (!cfg || cfg.hide) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: isFocused ? '#000' : 'transparent',
              justifyContent: 'center', alignItems: 'center',
            }}>
              {cfg.lib === 'mci' ? (
                <MaterialCommunityIcons name={cfg.icon as any} size={18} color={isFocused ? '#FFF' : '#999'} />
              ) : (
                <Ionicons name={cfg.icon as any} size={18} color={isFocused ? '#FFF' : '#999'} />
              )}
            </View>
            <Text style={{
              fontSize: 8, fontWeight: isFocused ? '800' : '500',
              color: isFocused ? '#000' : '#999', marginTop: 1,
            }} numberOfLines={1}>{cfg.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!user) return null;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="health" />
      <Tabs.Screen name="alerts" />
      <Tabs.Screen name="teleconsult" />
      <Tabs.Screen name="devices" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
