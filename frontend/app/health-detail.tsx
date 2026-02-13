import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';

const HEALTH_IMAGES: Record<string, string> = {
  heart_rate: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/u3ch46l8_hearth%20red%20app%20healthbeat%20Chutex.png',
  spo2: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/v87wurbk_blood%20red%20app%20health%20Chutex.png',
  blood_pressure_systolic: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/v87wurbk_blood%20red%20app%20health%20Chutex.png',
  sleep: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tide9bdl_Moon%20sleep%20analys%20app%20health%20Chutex.png',
  temperature: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
  steps: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
};

const METRIC_CONFIG: Record<string, any> = {
  heart_rate: { title: 'Pouls', unit: 'bpm', min: 40, max: 120, normalMin: 60, normalMax: 100, color: '#E53935' },
  spo2: { title: 'SpO2 du sang', unit: '%', min: 85, max: 100, normalMin: 95, normalMax: 100, color: '#1E88E5' },
  blood_pressure_systolic: { title: 'Tension', unit: 'mmHg', min: 80, max: 180, normalMin: 90, normalMax: 140, color: '#7B1FA2' },
  temperature: { title: 'Temperature', unit: '°C', min: 35, max: 40, normalMin: 36.5, normalMax: 37.5, color: '#F57C00' },
  steps: { title: 'Pas', unit: 'pas', min: 0, max: 10000, normalMin: 2000, normalMax: 10000, color: '#43A047' },
  sleep: { title: 'Sommeil', unit: 'h', min: 0, max: 12, normalMin: 7, normalMax: 9, color: '#5C6BC0' },
};

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

// Simple SVG line chart for web
function SimpleChart({ data, color, width }: { data: number[]; color: string; width: number }) {
  if (Platform.OS !== 'web' || data.length < 2) return null;
  const h = 120;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * (width - 40) + 20},${h - 10 - ((v - min) / range) * (h - 30)}`).join(' ');

  return (
    <div style={{ width, height: h, marginVertical: 8 }} dangerouslySetInnerHTML={{ __html: `
      <svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${data.map((v, i) => {
          const x = (i / (data.length - 1)) * (width - 40) + 20;
          const y = h - 10 - ((v - min) / range) * (h - 30);
          return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="white" stroke-width="2"/>`;
        }).join('')}
      </svg>
    ` }} />
  );
}

export default function HealthDetailScreen() {
  const { colors } = useTheme();
  const { metricId } = useLocalSearchParams<{ metricId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentVal, setCurrentVal] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [period, setPeriod] = useState('7');
  const [editingThresholds, setEditingThresholds] = useState(false);
  const [newSeuilBas, setNewSeuilBas] = useState('');
  const [newSeuilHaut, setNewSeuilHaut] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const screenW = Dimensions.get('window').width - 72;

  const config = METRIC_CONFIG[metricId || 'heart_rate'] || METRIC_CONFIG.heart_rate;
  const img = HEALTH_IMAGES[metricId || 'heart_rate'];

  const fetchData = useCallback(async () => {
    try {
      const bracelet = await apiFetch('/api/bracelet/status', {}, token).catch(() => null);
      const latest = await apiFetch('/api/devices/latest', {}, token).catch(() => ({}));
      let val = 0;
      if (metricId === 'heart_rate') val = bracelet?.heart_rate || latest?.heart_rate || 0;
      else if (metricId === 'spo2') val = bracelet?.spo2 || latest?.spo2 || 0;
      else if (metricId === 'temperature') val = bracelet?.temperature || latest?.temperature || 0;
      else if (metricId === 'steps') val = bracelet?.steps || latest?.steps || 0;
      else if (metricId === 'blood_pressure_systolic') val = bracelet?.systolic || latest?.blood_pressure_systolic || 0;
      setCurrentVal(val);
      // Generate simulated 7-day history
      const base = val || config.normalMin + (config.normalMax - config.normalMin) / 2;
      const hist = Array.from({ length: parseInt(period) }, (_, i) => {
        const variation = (Math.random() - 0.5) * (config.normalMax - config.normalMin) * 0.6;
        return Math.round((base + variation) * 10) / 10;
      });
      setHistory(hist);
    } catch {} finally { setLoading(false); }
  }, [token, metricId, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const minVal = history.length > 0 ? Math.min(...history) : 0;
  const maxVal = history.length > 0 ? Math.max(...history) : 0;
  const avgVal = history.length > 0 ? Math.round((history.reduce((a, b) => a + b, 0) / history.length) * 10) / 10 : 0;
  const isNormal = currentVal >= config.normalMin && currentVal <= config.normalMax;

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000', textAlign: 'center', marginRight: 36 }}>{config.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* 3D Illustration */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image source={{ uri: img }} style={{ width: 120, height: 120, resizeMode: 'contain' }} />
        </View>

        {/* Current Value + Badge */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 42, fontWeight: '900', color: '#000' }}>{currentVal || '--'}<Text style={{ fontSize: 16, fontWeight: '600', color: '#888' }}> {config.unit}</Text></Text>
            </View>
            <View style={{ backgroundColor: isNormal ? '#C8E6C9' : '#FFCDD2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: isNormal ? '#2E7D32' : '#C62828', textTransform: 'uppercase' }}>{isNormal ? 'BONNE SANTE' : 'ATTENTION'}</Text>
            </View>
          </View>

          {/* Chart */}
          {history.length > 1 && (
            <View style={{ marginTop: 16 }}>
              <SimpleChart data={history} color={config.color} width={screenW} />
              {/* Date labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                {history.map((_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - (history.length - 1 - i));
                  return <Text key={i} style={{ fontSize: 9, color: '#888' }}>{d.getDate().toString().padStart(2, '0')}/{(d.getMonth() + 1).toString().padStart(2, '0')}</Text>;
                })}
              </View>
            </View>
          )}
        </GlassCard>

        {/* Min / Avg / Max */}
        <GlassCard style={{ flexDirection: 'row' }}>
          {[
            { label: 'Plus bas', val: minVal },
            { label: 'Moyenne', val: avgVal },
            { label: 'Plus haut', val: maxVal },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(0,0,0,0.08)' }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>{s.val}<Text style={{ fontSize: 11, color: '#888' }}>{config.unit}</Text></Text>
              <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Period selector */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ k: '7', l: '7 JOURS' }, { k: '14', l: '14 JOURS' }, { k: '30', l: '30 JOURS' }].map(p => (
              <TouchableOpacity key={p.k} style={[{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 9999, borderWidth: 1.5, borderColor: period === p.k ? '#000' : 'rgba(0,0,0,0.1)' }, period === p.k && { backgroundColor: '#000' }]} onPress={() => setPeriod(p.k)}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: period === p.k ? '#FFF' : '#888' }}>{p.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calendar Date Picker */}
        <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="calendar-outline" size={22} color="#000" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>DATE SELECTIONNEE</Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginTop: 2 }}>{new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
          {Platform.OS === 'web' && (
            <div><input type="date" value={selectedDate} onChange={(e: any) => setSelectedDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
              style={{ fontSize: 14, padding: '8px 12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', cursor: 'pointer' }} /></div>
          )}
        </GlassCard>

        {/* Alert Thresholds */}
        <GlassCard>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Image source={{ uri: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/kjf5ae40_exclamation.png' }} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '900', color: '#000', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>SEUILS D'ALERTES ACTUELS</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#1E88E5' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1E88E5' }}>{config.normalMin}{config.unit}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#1E88E5', marginTop: 4, fontWeight: '600' }}>Seuil bas</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E53935' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#E53935' }}>{config.normalMax}{config.unit}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#E53935', marginTop: 4, fontWeight: '600' }}>Seuil haut</Text>
            </View>
          </View>
          {/* Threshold bar */}
          <View style={{ height: 28, backgroundColor: '#EEEEEE', borderRadius: 14, overflow: 'hidden', position: 'relative', marginBottom: 14 }}>
            <View style={{ position: 'absolute', left: `${((config.normalMin - config.min) / (config.max - config.min)) * 100}%`, right: `${100 - ((config.normalMax - config.min) / (config.max - config.min)) * 100}%`, top: 0, bottom: 0, borderRadius: 14 }}>
              <View style={{ flex: 1, flexDirection: 'row', borderRadius: 14, overflow: 'hidden' }}>
                <View style={{ flex: 1, backgroundColor: '#42A5F5' }} />
                <View style={{ flex: 1, backgroundColor: '#EF5350' }} />
              </View>
            </View>
            {currentVal > 0 && (
              <View style={{ position: 'absolute', left: `${Math.min(95, Math.max(5, ((currentVal - config.min) / (config.max - config.min)) * 100))}%`, top: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: isNormal ? '#4CAF50' : '#E53935', justifyContent: 'center', alignItems: 'center', marginLeft: -12 }}>
                <Text style={{ fontSize: 7, fontWeight: '800', color: '#FFF' }}>{currentVal}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }} onPress={() => { setNewSeuilBas(String(config.normalMin)); setNewSeuilHaut(String(config.normalMax)); setEditingThresholds(true); }}>
            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>MODIFIER LES SEUILS</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Edit Thresholds Form */}
        {editingThresholds && (
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#000', textAlign: 'center', textTransform: 'uppercase', marginBottom: 14 }}>NOUVEAUX SEUILS</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#1E88E5', textTransform: 'uppercase', marginBottom: 6 }}>SEUIL BAS</Text>
                {Platform.OS === 'web' ? (
                  <div><input type="number" value={newSeuilBas} onChange={(e: any) => setNewSeuilBas(e.target.value)}
                    style={{ width: '100%', fontSize: 20, fontWeight: '800', padding: '10px', borderRadius: 12, border: '2px solid #1E88E5', textAlign: 'center', color: '#1E88E5', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
                ) : null}
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#E53935', textTransform: 'uppercase', marginBottom: 6 }}>SEUIL HAUT</Text>
                {Platform.OS === 'web' ? (
                  <div><input type="number" value={newSeuilHaut} onChange={(e: any) => setNewSeuilHaut(e.target.value)}
                    style={{ width: '100%', fontSize: 20, fontWeight: '800', padding: '10px', borderRadius: 12, border: '2px solid #E53935', textAlign: 'center', color: '#E53935', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
                ) : null}
              </View>
            </View>
            {/* Preview bar */}
            <View style={{ height: 24, backgroundColor: '#EEEEEE', borderRadius: 12, overflow: 'hidden', position: 'relative', marginBottom: 4 }}>
              <View style={{ position: 'absolute', left: `${Math.max(0, ((parseFloat(newSeuilBas) || config.min) - config.min) / (config.max - config.min) * 100)}%`, right: `${Math.max(0, 100 - ((parseFloat(newSeuilHaut) || config.max) - config.min) / (config.max - config.min) * 100)}%`, top: 0, bottom: 0, borderRadius: 12 }}>
                <View style={{ flex: 1, flexDirection: 'row', borderRadius: 12, overflow: 'hidden' }}>
                  <View style={{ flex: 1, backgroundColor: '#42A5F5' }} />
                  <View style={{ flex: 1, backgroundColor: '#EF5350' }} />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E88E5' }}>{config.min}{config.unit}</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#E53935' }}>{config.max}{config.unit}</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 14, alignItems: 'center' }} onPress={async () => {
              try {
                await apiFetch('/api/health/thresholds', { method: 'PUT', body: JSON.stringify({ metric_id: metricId, min_val: parseFloat(newSeuilBas), max_val: parseFloat(newSeuilHaut) }) }, token);
                setEditingThresholds(false);
              } catch {}
            }}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>CONFIRMER LES NOUVEAUX SEUILS</Text>
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
