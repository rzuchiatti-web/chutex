import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';

const SHARING_ITEMS = [
  { key: 'share_heart_rate', label: 'Fréquence cardiaque', icon: 'heart-outline' },
  { key: 'share_blood_pressure', label: 'Tension artérielle', icon: 'fitness-outline' },
  { key: 'share_spo2', label: 'Saturation O2', icon: 'water-outline' },
  { key: 'share_temperature', label: 'Température', icon: 'thermometer-outline' },
  { key: 'share_steps', label: 'Pas / Activité', icon: 'footsteps-outline' },
  { key: 'share_weight', label: 'Poids', icon: 'scale-outline' },
  { key: 'share_stress', label: 'Niveau de stress', icon: 'pulse-outline' },
  { key: 'share_sleep', label: 'Sommeil', icon: 'moon-outline' },
  { key: 'share_location', label: 'Localisation', icon: 'location-outline' },
  { key: 'share_alerts', label: 'Alertes', icon: 'notifications-outline' },
];

export default function DataSharingScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { setPrefs(await apiFetch('/api/settings/data-sharing', {}, token)); }
      catch {} finally { setLoading(false); }
    })();
  }, [token]);

  const toggle = (key: string) => {
    setPrefs((p: any) => ({ ...p, [key]: !p[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/settings/data-sharing', { method: 'PUT', body: JSON.stringify(prefs) }, token);
      Alert.alert('Enregistré', 'Vos préférences de partage ont été mises à jour.');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={[s.c, { backgroundColor: themeColors.background }]}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  const allOn = SHARING_ITEMS.every(i => prefs[i.key] !== false);
  const toggleAll = () => {
    const newVal = !allOn;
    const updated: any = {};
    SHARING_ITEMS.forEach(i => { updated[i.key] = newVal; });
    setPrefs(updated);
  };

  return (
    <SafeAreaView style={[s.c, { backgroundColor: themeColors.background }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerT}>Partage de données</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.info}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
          <Text style={s.infoText}>Choisissez les données que vos gardiens peuvent consulter. Vous pouvez modifier ces réglages à tout moment.</Text>
        </View>

        <TouchableOpacity style={s.allRow} onPress={toggleAll}>
          <Text style={s.allText}>{allOn ? 'Tout désactiver' : 'Tout activer'}</Text>
          <Switch value={allOn} onValueChange={toggleAll} trackColor={{ true: Colors.primary }} />
        </TouchableOpacity>

        {SHARING_ITEMS.map(item => (
          <View key={item.key} style={s.row}>
            <Ionicons name={item.icon as any} size={20} color={prefs[item.key] !== false ? Colors.primary : Colors.textMuted} />
            <Text style={[s.rowLabel, prefs[item.key] === false && { color: Colors.textMuted }]}>{item.label}</Text>
            <Switch
              value={prefs[item.key] !== false}
              onValueChange={() => toggle(item.key)}
              trackColor={{ true: Colors.primary }}
            />
          </View>
        ))}

        <TouchableOpacity data-testid="save-sharing-btn" style={s.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#1A1D21" /> : <Text style={s.saveBtnT}>Enregistrer</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border, backgroundColor: Colors.paper },
  backBtn: { padding: 4, marginRight: 12 },
  headerT: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  scroll: { flex: 1 },
  info: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: Colors.subtle, margin: 12, borderRadius: 10, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  allRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.paper, marginHorizontal: 12, marginBottom: 8, borderRadius: 10 },
  allText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.paper, marginHorizontal: 12, marginBottom: 1, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  rowLabel: { flex: 1, fontSize: 15, color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, marginHorizontal: 12, marginTop: 20, padding: 16, borderRadius: 10, alignItems: 'center' },
  saveBtnT: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
