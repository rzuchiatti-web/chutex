import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';

const HEALTH_IMAGES: Record<string, string> = {
  heart_rate: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/u3ch46l8_hearth%20red%20app%20healthbeat%20Chutex.png',
  spo2: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/v87wurbk_blood%20red%20app%20health%20Chutex.png',
  temperature: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
};

const METRIC_CONFIG: Record<string, any> = {
  heart_rate: { title: 'Pouls', unit: 'bpm', min: 20, max: 200, color: '#E53935' },
  spo2: { title: 'SpO2', unit: '%', min: 70, max: 100, color: '#1E88E5' },
  temperature: { title: 'Temperature', unit: '°C', min: 34, max: 42, color: '#F57C00' },
};

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};

export default function EditThresholdsScreen() {
  const { colors } = useTheme();
  const { metricId } = useLocalSearchParams<{ metricId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [seuilBas, setSeuilBas] = useState('');
  const [seuilHaut, setSeuilHaut] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const config = METRIC_CONFIG[metricId || 'heart_rate'] || METRIC_CONFIG.heart_rate;
  const img = HEALTH_IMAGES[metricId || 'heart_rate'];

  useEffect(() => {
    (async () => {
      try {
        const t = await apiFetch(`/api/health/thresholds/${metricId}`, {}, token).catch(() => null);
        if (t) { setSeuilBas(String(t.min_val)); setSeuilHaut(String(t.max_val)); }
        else { setSeuilBas(metricId === 'heart_rate' ? '60' : metricId === 'spo2' ? '95' : '36.5'); setSeuilHaut(metricId === 'heart_rate' ? '100' : metricId === 'spo2' ? '100' : '37.5'); }
      } catch { setSeuilBas('60'); setSeuilHaut('100'); }
      setLoaded(true);
    })();
  }, [metricId, token]);

  const save = async () => {
    const min = parseFloat(seuilBas); const max = parseFloat(seuilHaut);
    if (isNaN(min) || isNaN(max)) return Alert.alert('Erreur', 'Valeurs invalides');
    if (min >= max) return Alert.alert('Erreur', 'Le seuil bas doit etre inferieur au seuil haut');
    setSaving(true);
    try {
      await apiFetch('/api/health/thresholds', { method: 'PUT', body: JSON.stringify({ metric_id: metricId, min_val: min, max_val: max }) }, token);
      Alert.alert('Seuils mis a jour', `${config.title}: ${min}${config.unit} - ${max}${config.unit}`);
      router.back();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  if (!loaded) return <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;

  const basVal = parseFloat(seuilBas) || config.min;
  const hautVal = parseFloat(seuilHaut) || config.max;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}><Ionicons name="chevron-back" size={24} color="#000" /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000' }}>Modifier les seuils</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, alignItems: 'center' }}>
        {/* Big illustration */}
        {img && <Image source={{ uri: img }} style={{ width: 140, height: 140, resizeMode: 'contain', marginBottom: 16 }} />}
        <Text style={{ fontSize: 20, fontWeight: '900', color: '#000', textAlign: 'center', textTransform: 'uppercase', marginBottom: 24 }}>{config.title}</Text>

        {/* Seuil inputs */}
        <View style={[{ width: '100%', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 24, marginBottom: 16, ...glass }]}>
          <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E88E5', textTransform: 'uppercase', marginBottom: 8 }}>SEUIL BAS</Text>
              {Platform.OS === 'web' ? (
                <div><input type="number" value={seuilBas} onChange={(e: any) => setSeuilBas(e.target.value)} step={metricId === 'temperature' ? '0.1' : '1'}
                  style={{ width: '100%', fontSize: 28, fontWeight: '900', padding: '12px', borderRadius: 16, border: '2.5px solid #1E88E5', textAlign: 'center', color: '#1E88E5', background: 'rgba(30,136,229,0.06)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
              ) : null}
              <Text style={{ fontSize: 13, color: '#1E88E5', marginTop: 4 }}>{config.unit}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#E53935', textTransform: 'uppercase', marginBottom: 8 }}>SEUIL HAUT</Text>
              {Platform.OS === 'web' ? (
                <div><input type="number" value={seuilHaut} onChange={(e: any) => setSeuilHaut(e.target.value)} step={metricId === 'temperature' ? '0.1' : '1'}
                  style={{ width: '100%', fontSize: 28, fontWeight: '900', padding: '12px', borderRadius: 16, border: '2.5px solid #E53935', textAlign: 'center', color: '#E53935', background: 'rgba(229,57,53,0.06)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
              ) : null}
              <Text style={{ fontSize: 13, color: '#E53935', marginTop: 4 }}>{config.unit}</Text>
            </View>
          </View>

          {/* Preview bar */}
          <View style={{ height: 28, backgroundColor: '#EEEEEE', borderRadius: 14, overflow: 'hidden', position: 'relative', marginBottom: 6 }}>
            <View style={{ position: 'absolute', left: `${Math.max(0, (basVal - config.min) / (config.max - config.min) * 100)}%`, right: `${Math.max(0, 100 - (hautVal - config.min) / (config.max - config.min) * 100)}%`, top: 0, bottom: 0, borderRadius: 14, overflow: 'hidden', flexDirection: 'row' }}>
              <View style={{ flex: 1, backgroundColor: '#42A5F5' }} />
              <View style={{ flex: 1, backgroundColor: '#EF5350' }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888' }}>{config.min}{config.unit}</Text>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888' }}>{config.max}{config.unit}</Text>
          </View>
        </View>

        {/* Confirm */}
        <TouchableOpacity style={{ width: '100%', backgroundColor: '#000', borderRadius: 9999, paddingVertical: 18, alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>CONFIRMER LES NOUVEAUX SEUILS</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
