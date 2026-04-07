import { Icon, MCIcon } from '../src/components/WebIcon';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl, Dimensions, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { scanForScales, connectToScale, disconnectScale, stopScaleScan, configureScaleWifi } from '../src/services/ble';
import type { ScaleMeasurement } from '../src/services/ble';

const { width: SW } = Dimensions.get('window');
const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GC = ({ children, style }: any) => <View style={[{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>;

function MiniChart({ data, color, width: chartW, height: chartH }: { data: number[]; color: string; width: number; height: number }) {
  if (!data.length || Platform.OS !== 'web') return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * chartW},${chartH - ((v - min) / range) * (chartH - 10) - 5}`).join(' ');
  const fillPts = `0,${chartH} ${pts} ${chartW},${chartH}`;
  return (
    <div style={{ width: chartW, height: chartH } as any}>
      <svg width={chartW} height={chartH} style={{ overflow: 'visible' } as any}>
        <defs><linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        <polygon points={fillPts} fill={`url(#g-${color.replace('#','')})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const bodyTypeLabel = (t: number) => ['', 'Maigre', 'Mince', 'Normal', 'Muscle+', 'Athletique', 'Costaud', 'Enrobe', 'Obese', 'Obese+'][Math.min(Math.max(Math.round(t), 1), 9)];

export default function ScaleDétailScreen() {
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  // BLE states
  const [bleState, setBleState] = useState<'idle' | 'scanning' | 'found' | 'connecting' | 'connected' | 'weighing' | 'measuring' | 'done'>('idle');
  const [foundDevices, setFoundDevices] = useState<{id: string; name: string; rssi: number}[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string>('');
  const [connectedDeviceId, setConnectedDeviceId] = useState<string>('');
  const [liveMeasurement, setLiveMeasurement] = useState<any>(null);
  const [showBleModal, setShowBleModal] = useState(false);
  const [impedanceCountdown, setImpedanceCountdown] = useState(0);

  // WiFi config states
  const [showWifiSetup, setShowWifiSetup] = useState(false);
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiProgress, setWifiProgress] = useState('');
  const [wifiConfiguring, setWifiConfiguring] = useState(false);

  const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const serverUrl = API_BASE ? `${API_BASE}/api/lefu/wifi/torre/record` : '';

  const handleWifiConfig = async () => {
    if (!wifiSsid || !connectedDevice) return;
    setWifiConfiguring(true);
    const res = await configureScaleWifi(connectedDevice, wifiSsid, wifiPass, serverUrl, setWifiProgress);
    setWifiConfiguring(false);
    if (res.success) {
      setWifiProgress('WiFi configure avec succes !');
      setTimeout(() => setShowWifiSetup(false), 2000);
    } else {
      setWifiProgress(res.error || 'Erreur');
    }
  };

  const fetchData = useCallback(async () => {
    try { setHistory(await apiFetch('/api/devices/scale/history', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // BLE: Scan for scales
  const startScan = async () => {
    setFoundDevices([]);
    setBleState('scanning');
    setShowBleModal(true);
    await scanForScales((device) => {
      setFoundDevices(prev => {
        if (prev.find(d => d.id === device.id)) return prev;
        return [...prev, device];
      });
      setBleState('found');
    }, 15000);
    if (foundDevices.length === 0) setBleState('idle');
  };

  // BLE: Connect to a scale
  const connectDevice = async (deviceId: string, deviceName: string) => {
    setBleState('connecting');
    let stableWeight = 0;
    let bestImpedance = 0;
    let saveTimeout: any = null;
    let saved = false;

    const doSave = (w: number, imp: number) => {
      if (saved) return;
      saved = true;
      if (saveTimeout) clearTimeout(saveTimeout);
      const finalMeasurement = { weight: w, impedance: imp, unit: 'kg', stable: true, deviceId, deviceName, mac: deviceId };
      setLiveMeasurement(finalMeasurement);
      setBleState('done');
      saveMeasurement(finalMeasurement);
    };

    const ok = await connectToScale(deviceId, (measurement) => {
      setLiveMeasurement(measurement);

      // Track best impedance seen across all packets
      if (measurement.impedance > 0) bestImpedance = measurement.impedance;

      if (measurement.stable && measurement.weight >= 20) {
        stableWeight = measurement.weight;
        
        // If we already have impedance, save immediately
        if (bestImpedance > 0) {
          doSave(stableWeight, bestImpedance);
          return;
        }

        // Otherwise enter 'measuring' state and wait for impedance
        setBleState('measuring');
        setImpedanceCountdown(8);

        // Start countdown and save after 8s even without impedance
        if (!saveTimeout) {
          saveTimeout = setTimeout(() => {
            doSave(stableWeight, bestImpedance);
          }, 8000);
        }
      } else if (stableWeight > 0 && measurement.impedance > 0) {
        // Impedance arrived after stable weight!
        bestImpedance = measurement.impedance;
        doSave(stableWeight, bestImpedance);
      } else if (!measurement.stable && measurement.weight >= 20) {
        setBleState('weighing');
      }
    });

    if (ok) {
      setConnectedDevice(deviceName);
      setConnectedDeviceId(deviceId);
      setBleState('connected');
      setShowBleModal(false);
      apiFetch('/api/devices/scale/link', { method: 'POST', body: JSON.stringify({ mac: deviceId, name: deviceName }) }, token).catch(() => {});
    } else {
      setBleState('idle');
      Alert.alert('Erreur', 'Impossible de se connecter a la balance. Vérifiéz qu\'elle est allumee et a proximite.');
    }
  };

  // Save BLE measurement to backend
  const saveMeasurement = async (m: ScaleMeasurement) => {
    try {
      const result = await apiFetch('/api/devices/scale/ble-measurement', {
        method: 'POST',
        body: JSON.stringify({ weight: m.weight, impedance: m.impedance }),
      }, token);
      setLiveMeasurement(result);
      fetchData(); // Refresh history
      // Check for health alerts
      checkHealthAlerts(result);
    } catch (e: any) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la mesure');
    }
  };

  // Check for significant health changes
  const checkHealthAlerts = (measurement: any) => {
    if (history.length === 0) return;
    const prev = history[0];
    const alerts: string[] = [];
    const wDiff = Math.abs(measurement.weight - prev.weight);
    if (wDiff > 3) alerts.push(`Variation de poids importante : ${wDiff > 0 ? '+' : ''}${(measurement.weight - prev.weight).toFixed(1)} kg`);
    const fatDiff = Math.abs((measurement.body_fat_pct || 0) - (prev.body_fat_pct || 0));
    if (fatDiff > 3) alerts.push(`Masse grasse : variation de ${fatDiff.toFixed(1)}%`);
    if (measurement.bmi > 30) alerts.push(`IMC élevé (${measurement.bmi}) - Consultez votre medecin`);
    if (measurement.bmi < 18.5) alerts.push(`IMC faible (${measurement.bmi}) - Consultez votre medecin`);
    if (measurement.visceral_fat > 12) alerts.push(`Graisse viscerale élevée (${measurement.visceral_fat})`);
    if (alerts.length > 0) {
      Alert.alert('Alerte Sante', alerts.join('\n\n'), [{ text: 'Compris', style: 'default' }]);
    }
  };

  // Start weighing (when connected)
  const startWeighing = () => {
    setBleState('weighing');
    setLiveMeasurement(null);
    Alert.alert('Pesee en cours', 'Montez sur la balance et restez immobile jusqu\'a ce que le poids se stabilise.');
  };

  // Disconnect
  const disconnect = () => {
    disconnectScale();
    setBleState('idle');
    setConnectedDevice('');
    setLiveMeasurement(null);
  };

  if (loading) return <FullScreenLoader />;

  const days = parseInt(period);
  const filtered = history.slice(0, days);
  const latest = liveMeasurement && liveMeasurement.weight ? liveMeasurement : filtered[0];
  const prev = liveMeasurement ? filtered[0] : filtered[1];
  const chartData = [...filtered].reverse();

  const diff = (key: string) => {
    if (!latest || !prev) return null;
    return (latest[key] || 0) - (prev[key] || 0);
  };

  const StatCard = ({ label, value, unit, icon, color, trend }: any) => (
    <GC style={{ flex: 1, alignItems: 'center', padding: 14, marginBottom: 0 }}>
      <Icon name={icon} size={20} color={color} />
      <Text style={{ fontSize: 22, fontWeight: '900', color, marginTop: 4 }}>{value}<Text style={{ fontSize: 11 }}>{unit}</Text></Text>
      <Text style={{ fontSize: 8, color: '#6B7280', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>{label}</Text>
      {trend !== null && trend !== undefined && Math.abs(trend) > 0.05 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
          <Icon name={trend > 0 ? 'arrow-up' : 'arrow-down'} size={10} color={trend > 0 ? '#E53935' : '#4CAF50'} />
          <Text style={{ fontSize: 9, color: trend > 0 ? '#E53935' : '#4CAF50', fontWeight: '700' }}>{Math.abs(trend).toFixed(1)}</Text>
        </View>
      )}
    </GC>
  );

  const isConnected = ['connected', 'weighing', 'measuring', 'done'].includes(bleState);
  const isNative = Platform.OS !== 'web';

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}><Icon name="chevron-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#111827' }}>Balance Connectee</Text>
        {isConnected && (
          <View style={{ backgroundColor: '#10B981' + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#10B981' }}>CONNECTEE</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>

        {/* BLE Connection Section */}
        {!isConnected ? (
          <GC style={{ alignItems: 'center', padding: 24, borderWidth: 2, borderColor: '#2196F3', borderStyle: 'dashed' }} data-testid="ble-connect-section">
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Icon name="bluetooth" size={30} color="#2196F3" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 }}>Connecter votre balance</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
              Allumez votre balance Lefu et placez-la a proximite.
            </Text>
            <TouchableOpacity testID="scan-scale-btn" onPress={startScan}
              style={{ backgroundColor: '#2196F3', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {bleState === 'scanning' ? <ActivityIndicator color="#111827" size="small" /> : <Icon name="bluetooth" size={18} color="#111827" />}
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{bleState === 'scanning' ? 'Recherche...' : 'Connecter ma balance'}</Text>
            </TouchableOpacity>
          </GC>
        ) : (
          <GC style={{ padding: 16, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }} data-testid="ble-connected-section">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: '#10B981' + '15', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="bluetooth" size={22} color="#4CAF50" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{connectedDevice || 'Balance Lefu'}</Text>
                <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '600' }}>
                  {bleState === 'weighing' ? 'Pesee en cours...' : bleState === 'measuring' ? 'Mesure composition corporelle...' : bleState === 'done' ? 'Pesee terminee !' : 'Connectee - Prete'}
                </Text>
              </View>
              <TouchableOpacity onPress={disconnect} style={{ padding: 6 }}>
                <Icon name="close-circle" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            {/* Live weight display during weighing or measuring impedance */}
            {(bleState === 'weighing' || bleState === 'measuring') && liveMeasurement && (
              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <Text style={{ fontSize: 42, fontWeight: '900', color: bleState === 'measuring' ? '#10B981' : '#2196F3' }}>{liveMeasurement.weight}<Text style={{ fontSize: 16 }}> kg</Text></Text>
                {bleState === 'weighing' && (
                  <>
                    <Text style={{ fontSize: 11, color: '#6B7280' }}>Stabilisation en cours...</Text>
                    <ActivityIndicator color="#2196F3" style={{ marginTop: 8 }} />
                  </>
                )}
                {bleState === 'measuring' && (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981', marginTop: 6 }}>Poids stable !</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>
                      Restez pieds nus sur la balance...{'\n'}Mesure de la composition corporelle
                    </Text>
                    {liveMeasurement.impedance > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                        <Icon name="checkmark-circle" size={18} color="#10B981" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#10B981' }}>Impedance captee !</Text>
                      </View>
                    ) : (
                      <ActivityIndicator color="#10B981" style={{ marginTop: 8 }} />
                    )}
                  </>
                )}
              </View>
            )}
            {/* Weighing button */}
            {bleState === 'connected' && (
              <TouchableOpacity testID="start-weighing-btn" onPress={startWeighing}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 9999, paddingVertical: 14, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Icon name="scale-outline" size={18} color="#111827" />
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Lancer une pesee</Text>
              </TouchableOpacity>
            )}
            {bleState === 'done' && (
              <TouchableOpacity onPress={() => { setBleState('connected'); setLiveMeasurement(null); }}
                style={{ backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 14, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                <Icon name="refresh" size={18} color="#111827" />
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Nouvelle pesee</Text>
              </TouchableOpacity>
            )}
          </GC>
        )}

        {/* WiFi Configuration Button - always show if scale was ever linked */}
        {(isConnected || history.length > 0) && (
          <GC style={{ padding: 16, borderWidth: 1, borderColor: '#60A5FA' + '30' }} data-testid="wifi-config-section">
            <TouchableOpacity onPress={() => setShowWifiSetup(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#60A5FA' + '15', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="wifi" size={22} color="#60A5FA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>Configurer le WiFi</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  {isConnected ? 'Pesees automatiques sans telephone' : 'Connectez d\'abord la balance en Bluetooth'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </GC>
        )}

        {/* WiFi Setup Modal */}
        <Modal visible={showWifiSetup} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 380, backgroundColor: '#FFF', borderRadius: 24, padding: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111' }}>Configuration WiFi</Text>
                <TouchableOpacity onPress={() => setShowWifiSetup(false)} style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="close" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 18 }}>
                Connectez votre balance au WiFi de votre maison. Elle enverra automatiquement vos pesees au serveur, sans avoir besoin de votre telephone.
              </Text>

              <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Nom du reseau (SSID)</Text>
              <View style={{ backgroundColor: '#F4F4F5', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 }}>
                <TextInput
                  value={wifiSsid} onChangeText={setWifiSsid}
                  placeholder="Ex: Livebox-A1B2" placeholderTextColor="#9CA3AF"
                  style={{ fontSize: 15, fontWeight: '700', color: '#111' }}
                />
              </View>

              <Text style={{ fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Mot de passe WiFi</Text>
              <View style={{ backgroundColor: '#F4F4F5', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20 }}>
                <TextInput
                  value={wifiPass} onChangeText={setWifiPass}
                  placeholder="Mot de passe" placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  style={{ fontSize: 15, fontWeight: '600', color: '#111' }}
                />
              </View>

              {wifiProgress ? (
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#F0F9FF', marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {wifiConfiguring && <ActivityIndicator size="small" color="#60A5FA" />}
                  <Text style={{ fontSize: 13, color: '#60A5FA', fontWeight: '600', flex: 1 }}>{wifiProgress}</Text>
                </View>
              ) : null}

              <View style={{ backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', gap: 8 }}>
                <Icon name="information-circle" size={18} color="#F59E0B" />
                <Text style={{ fontSize: 11, color: '#92400E', flex: 1, lineHeight: 16 }}>
                  Utilisez uniquement un reseau WiFi 2.4 GHz. Les reseaux 5 GHz ne sont pas compatibles avec la balance.
                </Text>
              </View>

              <TouchableOpacity testID="wifi-config-submit" onPress={handleWifiConfig} disabled={wifiConfiguring || !wifiSsid}
                style={{ backgroundColor: wifiSsid ? '#111' : '#D1D5DB', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{wifiConfiguring ? 'Configuration en cours...' : 'Configurer le WiFi'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Main weight display */}
        {latest && (
          <GC style={{ alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 48, fontWeight: '900', color: '#111827' }}>{latest.weight}<Text style={{ fontSize: 18 }}> kg</Text></Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              {liveMeasurement ? 'Pesee du moment' : `Derniere pesee : ${new Date(latest.timestamp).toLocaleDateString('fr-FR')}`}
            </Text>
            {diff('weight') !== null && Math.abs(diff('weight')) > 0.05 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <Icon name={diff('weight') > 0 ? 'trending-up' : 'trending-down'} size={16} color={diff('weight') > 0 ? '#E53935' : '#4CAF50'} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: diff('weight') > 0 ? '#E53935' : '#4CAF50' }}>{diff('weight') > 0 ? '+' : ''}{diff('weight').toFixed(1)} kg</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>vs précédent</Text>
              </View>
            )}
          </GC>
        )}

        {/* Period selector */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          {(['7', '30', '90'] as const).map(p => (
            <TouchableOpacity key={p} style={[{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: period === p ? '#000' : 'rgba(255,255,255,0.10)' }, period === p && { backgroundColor: '#FFFFFF' }]}
              onPress={() => setPeriod(p)}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: period === p ? '#FFF' : '#888' }}>{p}j</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight chart */}
        {chartData.length > 1 && (
          <GC style={{ padding: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Evolution du poids</Text>
            <MiniChart data={chartData.map((d: any) => d.weight)} color="#2196F3" width={SW - 72} height={100} />
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

          {/* Body fat + muscle chart */}
          {chartData.length > 1 && (
            <GC style={{ padding: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Masse grasse / Muscles</Text>
              <MiniChart data={chartData.map((d: any) => d.body_fat_pct)} color="#FF9800" width={SW - 72} height={80} />
              <View style={{ height: 8 }} />
              <MiniChart data={chartData.map((d: any) => d.muscle_mass)} color="#4CAF50" width={SW - 72} height={80} />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: '#FF9800' }} /><Text style={{ fontSize: 9, color: '#6B7280' }}>Masse grasse %</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><View style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: '#10B981' }} /><Text style={{ fontSize: 9, color: '#6B7280' }}>Muscles kg</Text></View>
              </View>
            </GC>
          )}

          {/* Détailed metrics - ALL 30+ displayed always */}
          <GC>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 4 }}>Composition corporelle complete</Text>
            <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 12 }}>{[
              latest.basal_metabolism, latest.body_age, latest.protein_pct, latest.health_score,
              latest.subcutaneous_fat, latest.lean_body_mass, latest.ideal_weight,
              latest.fat_kg, latest.skeletal_muscle_pct, latest.heart_rate,
              latest.body_type, latest.fat_control_kg, latest.muscle_control_kg,
              latest.obesity_level, latest.impedance,
            ].filter(v => v && v !== 0).length + 10} donnees mesurees</Text>
            {[
              { icon: 'body-outline', label: 'Poids', value: latest.weight, unit: 'kg', color: '#111827' },
              { icon: 'analytics-outline', label: 'IMC', value: latest.bmi, unit: '', color: '#2196F3' },
              { icon: 'flame-outline', label: 'Masse grasse', value: latest.body_fat_pct, unit: '%', color: '#FF9800' },
              { icon: 'analytics-outline', label: 'Masse graisseuse', value: latest.fat_kg, unit: 'kg', color: '#FF9800' },
              { icon: 'fitness-outline', label: 'Masse musculaire', value: latest.muscle_mass, unit: 'kg', color: '#10B981' },
              { icon: 'speedometer-outline', label: 'Taux musculaire', value: latest.muscle_rate || (latest.weight > 0 ? Math.round(latest.muscle_mass / latest.weight * 1000) / 10 : null), unit: '%', color: '#00BCD4' },
              { icon: 'resize-outline', label: 'Muscle squelettique', value: latest.skeletal_muscle_pct || latest.skeletal_muscle_kg, unit: latest.skeletal_muscle_pct ? '%' : 'kg', color: '#8BC34A' },
              { icon: 'water-outline', label: 'Hydratation', value: latest.hydration_pct, unit: '%', color: '#03A9F4' },
              { icon: 'skull-outline', label: 'Masse osseuse', value: latest.bone_mass, unit: 'kg', color: '#795548' },
              { icon: 'nutrition-outline', label: 'Proteines', value: latest.protein_pct, unit: '%', color: '#FF5722' },
              { icon: 'heart-outline', label: 'Graisse viscerale', value: latest.visceral_fat, unit: '', color: '#E91E63' },
              { icon: 'layers-outline', label: 'Graisse sous-cutanee', value: latest.subcutaneous_fat, unit: '%', color: '#795548' },
              { icon: 'heart-outline', label: 'Métabolisme basal', value: latest.basal_metabolism, unit: 'kcal', color: '#E91E63' },
              { icon: 'person-outline', label: 'Age corporel', value: latest.body_age, unit: 'ans', color: '#9C27B0' },
              { icon: 'star-outline', label: 'Score sante', value: latest.health_score, unit: '/100', color: '#FFB300' },
              { icon: 'body-outline', label: 'Masse maigre', value: latest.lean_body_mass, unit: 'kg', color: '#009688' },
              { icon: 'trophy-outline', label: 'Poids ideal', value: latest.ideal_weight, unit: 'kg', color: '#10B981' },
              { icon: 'trending-up-outline', label: 'Contrôle graisse', value: latest.fat_control_kg, unit: 'kg', color: '#FF9800' },
              { icon: 'fitness-outline', label: 'Contrôle muscle', value: latest.muscle_control_kg, unit: 'kg', color: '#10B981' },
              { icon: 'options-outline', label: 'Type corporel', value: latest.body_type ? bodyTypeLabel(latest.body_type) : null, unit: '', color: '#607D8B' },
              { icon: 'bar-chart-outline', label: 'Niveau d\'obesite', value: latest.obesity_level, unit: '', color: '#FF5722' },
              { icon: 'pulse-outline', label: 'Frequence cardiaque', value: latest.heart_rate, unit: 'bpm', color: '#E53935' },
              { icon: 'flash-outline', label: 'Impedance', value: latest.impedance, unit: 'ohm', color: '#607D8B' },
            ].map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: m.color + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={m.icon as any} size={16} color={m.color} />
                </View>
                <Text style={{ fontSize: 13, color: '#555', flex: 1 }}>{m.label}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: m.value ? '#000' : '#CCC' }}>
                  {m.value ? `${m.value}` : '--'}{m.value && m.unit ? ` ${m.unit}` : ''}
                </Text>
              </View>
            ))}
          </GC>

          {/* History list */}
          <GC>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 12 }}>Historique des pesees</Text>
            {filtered.slice(0, 10).map((r: any, i: number) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < 9 ? 0.5 : 0, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', width: 70 }}>{new Date(r.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', flex: 1 }}>{r.weight} kg</Text>
                <Text style={{ fontSize: 11, color: '#FF9800' }}>{r.body_fat_pct}%</Text>
                <Text style={{ fontSize: 11, color: '#10B981', marginLeft: 8 }}>{r.muscle_mass}kg</Text>
                {r.source === 'ble' && <Icon name="bluetooth" size={10} color="#2196F3" style={{ marginLeft: 4 }} />}
              </View>
            ))}
          </GC>

          {!history.length && (
            <GC style={{ alignItems: 'center', padding: 32 }}>
              <Icon name="scale-outline" size={40} color="#CCC" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 12 }}>Aucune pesee</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' }}>Connectez votre balance et pesez-vous pour voir vos donnees ici.</Text>
            </GC>
          )}
        </>}
      </ScrollView>

      {/* BLE Scan Modal */}
      <Modal visible={showBleModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' }}>
            <View style={{ alignItems: 'center', paddingBottom: 8 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="bluetooth" size={20} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', flex: 1 }}>Balances detectees</Text>
              <TouchableOpacity onPress={() => { setShowBleModal(false); stopScaleScan(); setBleState('idle'); }}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
            </View>
            {bleState === 'scanning' && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 12 }}>Recherche de balances a proximite...</Text>
              </View>
            )}
            {bleState === 'connecting' && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 12 }}>Connexion en cours...</Text>
              </View>
            )}
            {foundDevices.map(d => (
              <TouchableOpacity key={d.id} testID={`ble-device-${d.id}`} onPress={() => connectDevice(d.id, d.name)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="scale-outline" size={22} color="#2196F3" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{d.name}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>Signal : {Math.min(100, Math.max(0, 100 + d.rssi))}%</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#2196F3" />
              </TouchableOpacity>
            ))}
            {foundDevices.length === 0 && bleState !== 'scanning' && bleState !== 'connecting' && (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Icon name="search-outline" size={36} color="#CCC" />
                <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>Aucune balance trouvee. Vérifiéz qu'elle est allumee.</Text>
                <TouchableOpacity onPress={startScan} style={{ backgroundColor: '#2196F3', borderRadius: 9999, paddingVertical: 10, paddingHorizontal: 24, marginTop: 12 }}>
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>Relancer la recherche</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
