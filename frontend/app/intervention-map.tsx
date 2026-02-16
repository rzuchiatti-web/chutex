import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

export default function InterventionMapScreen() {
  const { colors } = useTheme();
  const { interventionId } = useLocalSearchParams<{ interventionId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [iv, setIv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/intervention/${interventionId}`, {}, token);
      setIv(data);
    } catch {} finally { setLoading(false); }
  }, [interventionId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const openMaps = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!iv) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.50)' }}>Intervention non trouvee</Text></SafeAreaView>;

  const ben = iv.beneficiary_info || {};
  const benLoc = iv.beneficiary_location || {};
  const intLoc = iv.intervener_location || {};
  const statusLabel = iv.status === 'pending_acceptance' ? 'En attente' : iv.status === 'in_progress' ? 'En cours' : iv.status === 'completed' ? 'Terminee' : iv.status;
  const statusColor = iv.status === 'pending_acceptance' ? '#FF9800' : iv.status === 'in_progress' ? '#4CAF50' : '#000';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} testID="intervention-map-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity testID="map-back-btn" onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Suivi intervention</Text>
        <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: statusColor, textTransform: 'uppercase' }}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Map Preview */}
        <GlassCard style={{ padding: 0, overflow: 'hidden', height: 280 }}>
          {Platform.OS === 'web' && benLoc.latitude ? (
            <iframe
              src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${intLoc.latitude || benLoc.latitude + 0.01},${intLoc.longitude || benLoc.longitude + 0.01}&destination=${benLoc.latitude},${benLoc.longitude}&mode=driving`}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 22 } as any}
              allowFullScreen
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' }}>
              <Ionicons name="map-outline" size={60} color="#888" />
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', marginTop: 10 }}>Carte de suivi</Text>
              {benLoc.latitude && (
                <TouchableOpacity
                  testID="open-maps-btn"
                  style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 }}
                  onPress={() => openMaps(benLoc.latitude, benLoc.longitude)}>
                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>OUVRIR DANS MAPS</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </GlassCard>

        {/* ETA Card */}
        <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: statusColor + '20', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="car" size={24} color={statusColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 1 }}>TEMPS ESTIME</Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>{iv.distance_km ? `~${Math.ceil(iv.distance_km * 2)} min` : '--'}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>{iv.distance_km ? `${iv.distance_km} km` : 'Distance inconnue'}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: iv.status === 'in_progress' ? '#4CAF50' : '#FF9800' }} />
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)', marginTop: 4, textTransform: 'uppercase' }}>{iv.status === 'in_progress' ? 'EN ROUTE' : 'EN ATTENTE'}</Text>
          </View>
        </GlassCard>

        {/* Beneficiary */}
        <GlassCard>
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>BENEFICIAIRE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800' }}>{ben.name?.charAt(0) || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>{ben.name || iv.beneficiary_name}</Text>
              {ben.phone && <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>{ben.phone}</Text>}
              {ben.address && <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{ben.address}</Text>}
            </View>
          </View>
          {ben.medical_conditions && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 10, backgroundColor: 'rgba(229,57,53,0.06)', borderRadius: 12 }}>
              <Ionicons name="medkit-outline" size={16} color="#E53935" />
              <Text style={{ fontSize: 12, color: '#555', flex: 1 }}>{ben.medical_conditions}</Text>
            </View>
          )}
          {ben.phone && (
            <TouchableOpacity
              testID="call-beneficiary-btn"
              style={{ backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}
              onPress={() => Linking.openURL(`tel:${ben.phone}`)}>
              <Ionicons name="call" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>APPELER</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Intervener Info */}
        {iv.assigned_name && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>INTERVENANT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.assigned_name?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>{iv.assigned_name}</Text>
                {iv.structure_name && <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>{iv.structure_name}</Text>}
              </View>
            </View>
          </GlassCard>
        )}

        {/* Alert Info */}
        <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#E53935' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#E53935', textTransform: 'uppercase', letterSpacing: 1 }}>ALERTE DECLENCHANTE</Text>
          <Text style={{ fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.92)', marginTop: 6 }}>{iv.alert_message || 'SOS'}</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', marginTop: 4 }}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
        </GlassCard>

        {/* Navigation Button */}
        {benLoc.latitude && (
          <TouchableOpacity
            testID="navigate-btn"
            style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }}
            onPress={() => openMaps(benLoc.latitude, benLoc.longitude)}>
            <Ionicons name="navigate" size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>LANCER LA NAVIGATION</Text>
          </TouchableOpacity>
        )}

        {/* Back to intervention detail */}
        <TouchableOpacity
          testID="back-to-detail-btn"
          style={{ borderRadius: 9999, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, borderWidth: 2, borderColor: '#000' }}
          onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: interventionId } })}>
          <Ionicons name="document-text-outline" size={16} color="#FFF" />
          <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' }}>DETAIL DE L'INTERVENTION</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
