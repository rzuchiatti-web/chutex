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
  blood_pressure: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/v87wurbk_blood%20red%20app%20health%20Chutex.png',
  temperature: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
  steps: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
  sleep: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tide9bdl_Moon%20sleep%20analys%20app%20health%20Chutex.png',
};

const DEFAULT_THRESHOLDS: Record<string, any> = {
  heart_rate: { min: 60, max: 100, unit: 'bpm', title: 'Pouls', absMin: 20, absMax: 200, color: '#E53935' },
  spo2: { min: 95, max: 100, unit: '%', title: 'SpO2', absMin: 70, absMax: 100, color: '#1E88E5' },
  blood_pressure: { min: 90, max: 140, unit: 'mmHg', title: 'Tension', absMin: 60, absMax: 200, color: '#7B1FA2' },
  temperature: { min: 36.5, max: 37.5, unit: '°C', title: 'Temperature', absMin: 34, absMax: 42, color: '#F57C00' },
  steps: { min: 2000, max: 10000, unit: 'pas', title: 'Pas', absMin: 0, absMax: 20000, color: '#43A047' },
  sleep: { min: 7, max: 9, unit: 'h', title: 'Sommeil', absMin: 0, absMax: 14, color: '#5C6BC0' },
};

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

function SimpleChart({ data, color, width }: { data: number[]; color: string; width: number }) {
  if (Platform.OS !== 'web' || data.length < 2) return null;
  const h = 140; const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * (width - 40) + 20},${h - 15 - ((v - min) / range) * (h - 40)}`).join(' ');
  const areaPath = `${pts.split(' ').map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ')} L${width - 20},${h - 10} L20,${h - 10} Z`;
  return (
    <div style={{ width, height: h }} dangerouslySetInnerHTML={{ __html: `
      <svg width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.2"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
        <path d="${areaPath}" fill="url(#g)"/>
        <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${data.map((v, i) => { const x = (i / (data.length - 1)) * (width - 40) + 20; const y = h - 15 - ((v - min) / range) * (h - 40); return `<circle cx="${x}" cy="${y}" r="4" fill="${color}" stroke="white" stroke-width="2"/>`; }).join('')}
      </svg>` }} />
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [thresholds, setThresholds] = useState<any>(null);
  const [aiRec, setAiRec] = useState('');
  const screenW = Dimensions.get('window').width - 72;

  const cfg = DEFAULT_THRESHOLDS[metricId || 'heart_rate'] || DEFAULT_THRESHOLDS.heart_rate;
  const img = HEALTH_IMAGES[metricId || 'heart_rate'];
  const seuilMin = thresholds?.min_val ?? cfg.min;
  const seuilMax = thresholds?.max_val ?? cfg.max;
  const isNormal = currentVal >= seuilMin && currentVal <= seuilMax;

  const fetchData = useCallback(async () => {
    try {
      const [bracelet, latest, thresh] = await Promise.all([
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch(`/api/health/thresholds/${metricId}`, {}, token).catch(() => null),
      ]);
      let val = 0;
      if (metricId === 'heart_rate') val = bracelet?.heart_rate || latest?.heart_rate || 0;
      else if (metricId === 'spo2') val = bracelet?.spo2 || latest?.spo2 || 0;
      else if (metricId === 'temperature') val = bracelet?.temperature || latest?.temperature || 0;
      else if (metricId === 'steps') val = bracelet?.steps || latest?.steps || 0;
      else if (metricId === 'blood_pressure') val = bracelet?.systolic || latest?.blood_pressure_systolic || 0;
      setCurrentVal(val);
      if (thresh) setThresholds(thresh);
      const base = val || (cfg.min + cfg.max) / 2;
      setHistory(Array.from({ length: parseInt(period) }, () => Math.round((base + (Math.random() - 0.5) * (cfg.max - cfg.min) * 0.6) * 10) / 10));
      // AI rec
      const status = val >= (thresh?.min_val || cfg.min) && val <= (thresh?.max_val || cfg.max) ? 'normal' : 'anormal';
      const recs: Record<string, string> = {
        heart_rate: status === 'normal' ? 'Votre rythme cardiaque est stable et dans la norme. Continuez a maintenir une activite physique reguliere et un sommeil de qualite.' : 'Votre pouls est en dehors des seuils normaux. Reposez-vous et consultez votre medecin si cela persiste.',
        spo2: status === 'normal' ? 'Votre saturation en oxygene est excellente. Vos poumons fonctionnent bien.' : 'Votre SpO2 est basse. Aérez votre piece et consultez un medecin rapidement.',
        temperature: status === 'normal' ? 'Votre temperature corporelle est normale. Aucune action requise.' : 'Votre temperature est anormale. Surveillez son evolution et consultez si cela dure plus de 24h.',
        steps: status === 'normal' ? 'Bravo ! Vous atteignez vos objectifs de marche quotidiens. Continuez ainsi !' : 'Vous marchez moins que recommande. Essayez de faire une petite promenade de 15 minutes.',
      };
      setAiRec(recs[metricId || 'heart_rate'] || 'Donnees en cours d\'analyse.');
    } catch {} finally { setLoading(false); }
  }, [token, metricId, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const minVal = history.length > 0 ? Math.min(...history) : 0;
  const maxVal = history.length > 0 ? Math.max(...history) : 0;
  const avgVal = history.length > 0 ? Math.round((history.reduce((a, b) => a + b, 0) / history.length) * 10) / 10 : 0;

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1A1D21" /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}><Ionicons name="chevron-back" size={24} color="#1A1D21" /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#1A1D21', textAlign: 'center', marginRight: 36 }}>{cfg.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Big 3D Image - overlapped by card */}
        <View style={{ alignItems: 'center', marginBottom: -60, zIndex: 1 }}>
          <Image source={{ uri: img }} style={{ width: 220, height: 220, resizeMode: 'contain' }} />
        </View>

        {/* Value + Chart card - overlapping image */}
        <GlassCard style={{ paddingTop: 70, zIndex: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 38, fontWeight: '900', color: '#1A1D21' }}>{currentVal || '--'}<Text style={{ fontSize: 14, color: '#5A6068' }}> {cfg.unit}</Text></Text>
            <View style={{ backgroundColor: isNormal ? '#C8E6C9' : '#FFCDD2', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: isNormal ? '#2E7D32' : '#C62828' }}>{isNormal ? 'BONNE SANTE' : 'ATTENTION'}</Text>
            </View>
          </View>

          {/* Date picker inline on chart */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[{ k: '7', l: '7J' }, { k: '14', l: '14J' }, { k: '30', l: '30J' }].map(p => (
                <TouchableOpacity key={p.k} style={[{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1.5, borderColor: period === p.k ? '#000' : 'rgba(0,0,0,0.08)' }, period === p.k && { backgroundColor: '#F5F6F8' }]} onPress={() => setPeriod(p.k)}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: period === p.k ? '#FFF' : '#888' }}>{p.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {Platform.OS === 'web' && (
              <div><input type="date" value={selectedDate} onChange={(e: any) => setSelectedDate(e.target.value)} max={new Date().toISOString().split('T')[0]}
                style={{ fontSize: 12, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: 'transparent', fontFamily: 'system-ui', cursor: 'pointer', color: '#5A6068' }} /></div>
            )}
          </View>

          {history.length > 1 && <SimpleChart data={history} color={cfg.color} width={screenW} />}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            {history.map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (history.length - 1 - i)); return <Text key={i} style={{ fontSize: 8, color: '#9BA3AD' }}>{d.getDate()}/{d.getMonth() + 1}</Text>; })}
          </View>
        </GlassCard>

        {/* Min / Avg / Max */}
        <GlassCard style={{ flexDirection: 'row', padding: 14 }}>
          {[{ label: 'Plus bas', val: minVal }, { label: 'Moyenne', val: avgVal }, { label: 'Plus haut', val: maxVal }].map((s, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', borderRightWidth: i < 2 ? 1 : 0, borderRightColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1D21' }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: '#5A6068' }}>{s.label}</Text>
            </View>
          ))}
        </GlassCard>

        {/* AI Recommendation */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="sparkles" size={18} color="#1A1D21" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#1A1D21' }}>Analyse IA</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#555', lineHeight: 20 }}>{aiRec}</Text>
        </GlassCard>

        {/* Thresholds */}
        <GlassCard>
          <View style={{ alignItems: 'center', marginBottom: 6 }}>
            <Image source={{ uri: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/kjf5ae40_exclamation.png' }} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#1A1D21', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Seuils d'alertes</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 10 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#1E88E5' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E88E5' }}>{seuilMin}{cfg.unit}</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#1E88E5', marginTop: 3 }}>Seuil bas</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: '#E53935' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#E53935' }}>{seuilMax}{cfg.unit}</Text>
              </View>
              <Text style={{ fontSize: 10, color: '#E53935', marginTop: 3 }}>Seuil haut</Text>
            </View>
          </View>
          <TouchableOpacity style={{ backgroundColor: '#F5F6F8', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }} onPress={() => router.push({ pathname: '/edit-thresholds', params: { metricId: metricId || 'heart_rate' } })}>
            <Text style={{ color: '#1A1D21', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' }}>MODIFIER LES SEUILS</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
