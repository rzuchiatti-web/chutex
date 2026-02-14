import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const { width: SW } = Dimensions.get('window');
const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GC = ({ children, style }: any) => <View style={[{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>;

function MiniChart({ data, color, width: chartW, height: chartH }: { data: number[]; color: string; width: number; height: number }) {
  if (!data.length || Platform.OS !== 'web') return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * chartW;
    const y = chartH - ((v - min) / range) * (chartH - 10) - 5;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${chartH} ${pts} ${chartW},${chartH}`;
  return (
    <div style={{ width: chartW, height: chartH } as any}>
      <svg width={chartW} height={chartH} style={{ overflow: 'visible' } as any}>
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill={`url(#grad-${color.replace('#','')})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={(data.length - 1) / (data.length - 1) * chartW} cy={chartH - ((data[data.length-1] - min) / range) * (chartH - 10) - 5} r="4" fill={color} stroke="#FFF" strokeWidth="2" />
      </svg>
    </div>
  );
}

const bodyTypeLabel = (t: number) => ['', 'Maigre', 'Mince', 'Normal', 'Muscle+', 'Athletique', 'Costaud', 'Enrobe', 'Obese', 'Obese+'][Math.min(Math.max(Math.round(t), 1), 9)];

export default function ScaleDetailScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const fetchData = useCallback(async () => {
    try { setHistory(await apiFetch('/api/devices/scale/history', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}><ActivityIndicator size="large" color="#000" /></View>;

  const days = parseInt(period);
  const filtered = history.slice(0, days);
  const latest = filtered[0];
  const prev = filtered[1];
  const chartData = [...filtered].reverse();

  const diff = (key: string) => {
    if (!latest || !prev) return null;
    const d = (latest[key] || 0) - (prev[key] || 0);
    return d;
  };

  const StatCard = ({ label, value, unit, icon, color, trend }: any) => (
    <GC style={{ flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ fontSize: 22, fontWeight: '900', color, marginTop: 4 }}>{value}<Text style={{ fontSize: 11 }}>{unit}</Text></Text>
      <Text style={{ fontSize: 8, color: '#888', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>{label}</Text>
      {trend !== null && trend !== undefined && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
          <Ionicons name={trend > 0 ? 'arrow-up' : trend < 0 ? 'arrow-down' : 'remove'} size={10} color={trend > 0 ? '#E53935' : trend < 0 ? '#4CAF50' : '#888'} />
          <Text style={{ fontSize: 9, color: trend > 0 ? '#E53935' : '#4CAF50', fontWeight: '700' }}>{Math.abs(trend).toFixed(1)}</Text>
        </View>
      )}
    </GC>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#000' }}>Balance Connectee</Text>
        <View style={{ backgroundColor: '#4CAF50' + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#4CAF50' }}>CONNECTEE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>

        {/* Main weight display */}
        {latest && (
          <GC style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 48, fontWeight: '900', color: '#000' }}>{latest.weight}<Text style={{ fontSize: 18 }}> kg</Text></Text>
            <Text style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Derniere pesee : {new Date(latest.timestamp).toLocaleDateString('fr-FR')}</Text>
            {diff('weight') !== null && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Ionicons name={diff('weight') > 0 ? 'trending-up' : diff('weight') < 0 ? 'trending-down' : 'remove'} size={16} color={diff('weight') > 0 ? '#E53935' : '#4CAF50'} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: diff('weight') > 0 ? '#E53935' : '#4CAF50' }}>{diff('weight') > 0 ? '+' : ''}{diff('weight').toFixed(1)} kg</Text>
                <Text style={{ fontSize: 11, color: '#888' }}>vs precedent</Text>
              </View>
            )}
          </GC>
        )}

        {/* Period selector */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          {(['7', '30', '90'] as const).map(p => (
            <TouchableOpacity key={p} style={[{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: period === p ? '#000' : 'rgba(255,255,255,0.7)' }, period === p && { backgroundColor: '#000' }]}
              onPress={() => setPeriod(p)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: period === p ? '#FFF' : '#888' }}>{p}j</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight chart */}
        {chartData.length > 1 && (
          <GC style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 12 }}>Evolution du poids</Text>
            <MiniChart data={chartData.map((d: any) => d.weight)} color="#2196F3" width={SW - 72} height={100} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 9, color: '#AAA' }}>{new Date(chartData[0]?.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</Text>
              <Text style={{ fontSize: 9, color: '#AAA' }}>{new Date(chartData[chartData.length-1]?.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</Text>
            </View>
          </GC>
        )}

        {/* Key metrics */}
        {latest && <>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <StatCard label="IMC" value={latest.bmi} unit="" icon="body-outline" color="#2196F3" trend={diff('bmi')} />
            <StatCard label="Masse grasse" value={latest.body_fat_pct} unit="%" icon="flame-outline" color="#FF9800" trend={diff('body_fat_pct')} />
            <StatCard label="Muscles" value={latest.muscle_mass} unit="kg" icon="fitness-outline" color="#4CAF50" trend={diff('muscle_mass')} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            <StatCard label="Hydratation" value={latest.hydration_pct} unit="%" icon="water-outline" color="#03A9F4" trend={diff('hydration_pct')} />
            <StatCard label="Os" value={latest.bone_mass} unit="kg" icon="skull-outline" color="#795548" trend={null} />
            <StatCard label="Graisse visc." value={latest.visceral_fat} unit="" icon="heart-outline" color="#E91E63" trend={diff('visceral_fat')} />
          </View>

          {/* Body fat chart */}
          {chartData.length > 1 && (
            <GC style={{ padding: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 12 }}>Masse grasse / Muscles</Text>
              <MiniChart data={chartData.map((d: any) => d.body_fat_pct)} color="#FF9800" width={SW - 72} height={80} />
              <View style={{ height: 8 }} />
              <MiniChart data={chartData.map((d: any) => d.muscle_mass)} color="#4CAF50" width={SW - 72} height={80} />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: '#FF9800' }} /><Text style={{ fontSize: 9, color: '#888' }}>Masse grasse %</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: '#4CAF50' }} /><Text style={{ fontSize: 9, color: '#888' }}>Muscles kg</Text></View>
              </View>
            </GC>
          )}

          {/* Detailed metrics */}
          <GC>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 12 }}>Details composition corporelle</Text>
            {[
              { icon: 'heart-outline', label: 'Metabolisme basal', value: `${latest.basal_metabolism} kcal`, color: '#E91E63' },
              { icon: 'person-outline', label: 'Age corporel', value: `${latest.body_age} ans`, color: '#9C27B0' },
              { icon: 'nutrition-outline', label: 'Proteines', value: `${latest.protein_pct}%`, color: '#FF5722' },
              { icon: 'star-outline', label: 'Score sante', value: `${latest.health_score}/100`, color: '#FFB300' },
            ].map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: i < 3 ? 0.5 : 0, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: m.color + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={m.icon as any} size={16} color={m.color} />
                </View>
                <Text style={{ fontSize: 13, color: '#555', flex: 1 }}>{m.label}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#000' }}>{m.value}</Text>
              </View>
            ))}
          </GC>

          {/* History list */}
          <GC>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#000', marginBottom: 12 }}>Historique des pesees</Text>
            {filtered.slice(0, 10).map((r: any, i: number) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < 9 ? 0.5 : 0, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                <Text style={{ fontSize: 12, color: '#888', width: 70 }}>{new Date(r.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#000', flex: 1 }}>{r.weight} kg</Text>
                <Text style={{ fontSize: 11, color: '#FF9800' }}>{r.body_fat_pct}%</Text>
                <Text style={{ fontSize: 11, color: '#4CAF50', marginLeft: 8 }}>{r.muscle_mass}kg</Text>
              </View>
            ))}
          </GC>
        </>}
      </ScrollView>
    </View>
  );
}
