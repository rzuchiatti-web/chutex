import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput, Switch, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';

export default function GeofencingScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('Domicile');
  const [lat, setLat] = useState('48.8566');
  const [lng, setLng] = useState('2.3522');
  const [radius, setRadius] = useState('500');
  const [saving, setSaving] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  const fetchZones = useCallback(async () => {
    try { setZones(await apiFetch('/api/geofence', {}, token)); } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const createZone = async () => {
    if (!name.trim()) return Alert.alert('Erreur', 'Nom requis');
    setSaving(true);
    try {
      const r = await apiFetch('/api/geofence', { method: 'POST', body: JSON.stringify({
        name: name.trim(), latitude: parseFloat(lat), longitude: parseFloat(lng), radius_meters: parseFloat(radius) || 500
      }) }, token);
      setZones([r, ...zones]); setShowModal(false); setName(''); setLat(''); setLng(''); setRadius('500');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const toggleZone = async (gid: string) => {
    try {
      const r = await apiFetch(`/api/geofence/${gid}/toggle`, { method: 'PUT' }, token);
      setZones(zones.map(z => z.id === gid ? { ...z, active: r.active } : z));
    } catch {}
  };

  const deleteZone = (gid: string) => {
    Alert.alert('Supprimer', 'Supprimer cette zone ?', [{ text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await apiFetch(`/api/geofence/${gid}`, { method: 'DELETE' }, token);
        setZones(zones.filter(z => z.id !== gid));
      }}
    ]);
  };

  const checkPosition = async () => {
    try { const r = await apiFetch('/api/geofence/check', { method: 'POST' }, token); setCheckResult(r); }
    catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  if (loading) return <SafeAreaView style={[s.c, { backgroundColor: themeColors.background }]}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  return (
    <SafeAreaView style={[s.c, { backgroundColor: themeColors.background }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
        <Text style={s.headerT}>Zones de sécurité</Text>
        <TouchableOpacity testID="add-zone-btn" style={s.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Info */}
        <View style={s.info}>
          <Ionicons name="location-outline" size={20} color={Colors.primary} />
          <Text style={s.infoText}>Définissez des zones de sécurité. Si votre position sort de ces zones, une alerte sera automatiquement envoyée à vos gardiens.</Text>
        </View>

        {/* Check position button */}
        <TouchableOpacity testID="check-pos-btn" style={s.checkBtn} onPress={checkPosition}>
          <Ionicons name="navigate-circle-outline" size={18} color="#FFF" />
          <Text style={s.checkBtnT}>Vérifier ma position</Text>
        </TouchableOpacity>

        {checkResult && (
          <View style={[s.checkResult, { borderLeftColor: checkResult.in_zone ? Colors.success : Colors.destructive }]}>
            <Ionicons name={checkResult.in_zone ? 'checkmark-circle' : 'alert-circle'} size={18} color={checkResult.in_zone ? Colors.success : Colors.destructive} />
            <Text style={[s.checkResultT, { color: checkResult.in_zone ? Colors.success : Colors.destructive }]}>
              {checkResult.in_zone ? 'Vous êtes dans vos zones de sécurité' : `Hors zone ! ${checkResult.violations?.map((v: any) => `${v.zone_name}: ${v.distance_m}m`).join(', ')}`}
            </Text>
          </View>
        )}

        {/* Zones */}
        <Text style={s.secTitle}>Mes zones ({zones.length})</Text>
        {zones.map(z => (
          <View key={z.id} style={[s.zoneCard, !z.active && { opacity: 0.4 }]}>
            <View style={s.zoneIcon}><Ionicons name="location" size={20} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.zoneName}>{z.name}</Text>
              <Text style={s.zoneMeta}>Rayon: {z.radius_meters}m · {z.latitude.toFixed(4)}, {z.longitude.toFixed(4)}</Text>
            </View>
            <Switch value={z.active} onValueChange={() => toggleZone(z.id)} trackColor={{ true: Colors.primary }} />
            <TouchableOpacity onPress={() => deleteZone(z.id)} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={16} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
        {zones.length === 0 && <View style={s.empty}><Ionicons name="location-outline" size={36} color={Colors.textMuted} /><Text style={s.emptyT}>Aucune zone configurée</Text></View>}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalO}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalO}><TouchableWithoutFeedback><View style={s.modalC}>
              <Text style={s.modalTitle}>Nouvelle zone de sécurité</Text>
              <Text style={s.inputL}>Nom</Text>
              <TextInput style={s.input} placeholder="Ex: Domicile, Parc..." placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
              <Text style={s.inputL}>Latitude</Text>
              <TextInput style={s.input} placeholder="48.8566" placeholderTextColor={Colors.textMuted} value={lat} onChangeText={setLat} keyboardType="numeric" />
              <Text style={s.inputL}>Longitude</Text>
              <TextInput style={s.input} placeholder="2.3522" placeholderTextColor={Colors.textMuted} value={lng} onChangeText={setLng} keyboardType="numeric" />
              <Text style={s.inputL}>Rayon (mètres)</Text>
              <TextInput style={s.input} placeholder="500" placeholderTextColor={Colors.textMuted} value={radius} onChangeText={setRadius} keyboardType="numeric" />
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}><Text style={s.cancelBtnT}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity testID="save-zone-btn" style={s.saveBtn} onPress={createZone} disabled={saving}>
                  {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnT}>Créer</Text>}
                </TouchableOpacity>
              </View>
            </View></TouchableWithoutFeedback></View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border, backgroundColor: Colors.paper },
  backBtn: { padding: 4, marginRight: 12 },
  headerT: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 60 },
  info: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: Colors.subtle, borderRadius: 10, marginBottom: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, padding: 14, borderRadius: 10, marginBottom: 12 },
  checkBtnT: { fontSize: 14, fontWeight: '700', color: '#000' },
  checkResult: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, backgroundColor: Colors.paper, borderLeftWidth: 3, marginBottom: 12 },
  checkResultT: { flex: 1, fontSize: 13, fontWeight: '600' },
  secTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  zoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 10, padding: 14, marginBottom: 6, gap: 10 },
  zoneIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  zoneName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  zoneMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', padding: 30, gap: 8 },
  emptyT: { fontSize: 13, color: Colors.textMuted },
  modalO: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputL: { fontSize: 11, color: Colors.textMuted, marginTop: 8, marginBottom: 2 },
  input: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnT: { fontSize: 15, color: '#000', fontWeight: '600' },
});
