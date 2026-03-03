import { Icon, MCIcon } from '../src/components/WebIcon';
import FullScreenLoader from '../src/components/FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, TextInput, Switch, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';

export default function GeofencingScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const localParams = useLocalSearchParams<{ beneficiaryId?: string | string[] }>();
  const globalParams = useGlobalSearchParams<{ beneficiaryId?: string | string[] }>();
  const webBeneficiaryId = (() => {
    try {
      if (typeof window !== 'undefined' && window.location?.search) {
        return new URLSearchParams(window.location.search).get('beneficiaryId') || '';
      }
      if (typeof globalThis !== 'undefined' && (globalThis as any)?.location?.search) {
        return new URLSearchParams((globalThis as any).location.search).get('beneficiaryId') || '';
      }
    } catch {
      return '';
    }
    return '';
  })();
  const normalizeBid = (value?: string) => (value || '').split('&')[0].split('#')[0].trim();
  const localBeneficiaryIdRaw = Array.isArray(localParams?.beneficiaryId) ? localParams.beneficiaryId[0] : localParams?.beneficiaryId;
  const globalBeneficiaryIdRaw = Array.isArray(globalParams?.beneficiaryId) ? globalParams.beneficiaryId[0] : globalParams?.beneficiaryId;
  const localBeneficiaryId = normalizeBid(localBeneficiaryIdRaw);
  const globalBeneficiaryId = normalizeBid(globalBeneficiaryIdRaw);
  const managedBeneficiaryId = localBeneficiaryId || globalBeneficiaryId || normalizeBid(webBeneficiaryId) || '';
  const isGuardianMode = !!managedBeneficiaryId;

  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [name, setName] = useState('Domicile');
  const [lat, setLat] = useState('48.8566');
  const [lng, setLng] = useState('2.3522');
  const [radius, setRadius] = useState('500');
  const [saving, setSaving] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  const geofenceBase = isGuardianMode
    ? `/api/guardian/beneficiary/${managedBeneficiaryId}/geofence`
    : '/api/geofence';

  const resetForm = (base?: { latitude?: number; longitude?: number; name?: string; radius_m?: number }) => {
    setName(base?.name || 'Domicile');
    setLat(base?.latitude != null ? String(base.latitude) : '48.8566');
    setLng(base?.longitude != null ? String(base.longitude) : '2.3522');
    setRadius(base?.radius_m != null ? String(base.radius_m) : '500');
  };

  const fetchZones = useCallback(async () => {
    try {
      if (isGuardianMode) {
        const payload = await apiFetch(geofenceBase, {}, token);
        setZones(Array.isArray(payload?.zones) ? payload.zones : []);
        setCurrentLocation(payload?.current_location || null);
      } else {
        const ownZones = await apiFetch('/api/geofence', {}, token);
        setZones(Array.isArray(ownZones) ? ownZones : []);
      }
    } catch {
      setZones([]);
    } finally {
      setLoading(false);
    }
  }, [token, geofenceBase, isGuardianMode]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const openCreateModal = () => {
    setEditingZone(null);
    if (isGuardianMode && currentLocation?.latitude != null && currentLocation?.longitude != null) {
      resetForm({
        name: `Zone ${zones.length + 1}`,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius_m: 500,
      });
    } else {
      resetForm({ name: `Zone ${zones.length + 1}`, radius_m: 500 });
    }
    setShowModal(true);
  };

  const openEditModal = (zone: any) => {
    setEditingZone(zone);
    resetForm({
      name: zone?.name,
      latitude: zone?.latitude,
      longitude: zone?.longitude,
      radius_m: zone?.radius_m ?? zone?.radius_meters ?? 500,
    });
    setShowModal(true);
  };

  const saveZone = async () => {
    if (!name.trim()) return Alert.alert('Erreur', 'Nom requis');
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusValue = parseFloat(radius);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return Alert.alert('Erreur', 'Coordonnees invalides');
    if (Number.isNaN(radiusValue) || radiusValue < 50) return Alert.alert('Erreur', 'Rayon minimum: 50m');

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        latitude,
        longitude,
        radius_m: radiusValue,
      };

      if (editingZone?.id) {
        const endpoint = isGuardianMode
          ? `${geofenceBase}/${editingZone.id}`
          : `/api/geofence/${editingZone.id}`;
        const updated = await apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(payload) }, token);
        setZones(prev => prev.map((z: any) => z.id === editingZone.id ? updated : z));
      } else {
        const created = await apiFetch(geofenceBase, { method: 'POST', body: JSON.stringify(payload) }, token);
        setZones(prev => [created, ...prev]);
      }

      setShowModal(false);
      setEditingZone(null);
      resetForm();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const useBeneficiaryLocation = () => {
    if (currentLocation?.latitude == null || currentLocation?.longitude == null) {
      Alert.alert('Info', 'Position actuelle du beneficiaire indisponible.');
      return;
    }
    setLat(String(currentLocation.latitude));
    setLng(String(currentLocation.longitude));
  };

  const toggleZone = async (gid: string) => {
    try {
      const endpoint = isGuardianMode
        ? `${geofenceBase}/${gid}/toggle`
        : `/api/geofence/${gid}/toggle`;
      const r = await apiFetch(endpoint, { method: 'PUT' }, token);
      setZones(prev => prev.map(z => z.id === gid ? { ...z, active: r?.active ?? !z.active } : z));
    } catch {}
  };

  const deleteZone = (gid: string) => {
    Alert.alert('Supprimer', 'Supprimer cette zone ?', [{ text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        const endpoint = isGuardianMode
          ? `${geofenceBase}/${gid}`
          : `/api/geofence/${gid}`;
        await apiFetch(endpoint, { method: 'DELETE' }, token);
        setZones(prev => prev.filter(z => z.id !== gid));
      }}
    ]);
  };

  const checkPosition = async () => {
    const endpoint = isGuardianMode
      ? `${geofenceBase}/check`
      : '/api/geofence/check';
    try {
      const r = await apiFetch(endpoint, { method: 'POST' }, token);
      setCheckResult(r);
      if (isGuardianMode && r?.location) setCurrentLocation(r.location);
    }
    catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  if (loading) return <FullScreenLoader />;

  const hasCurrentLocation = currentLocation?.latitude != null && currentLocation?.longitude != null;

  return (
    <SafeAreaView style={[s.c, { backgroundColor: themeColors.background }]}>
      <View style={s.header}>
        <TouchableOpacity testID="geofence-back-button" onPress={() => router.back()} style={s.backBtn}><Icon name="arrow-back" size={22} color={Colors.text} /></TouchableOpacity>
        <View style={{ flex: 1 } as any}>
          <Text style={s.headerT}>{isGuardianMode ? 'Safe zones beneficiaire' : 'Zones de securite'}</Text>
          {isGuardianMode && <Text style={s.headerSub} numberOfLines={1}>Gestion gardien · Beneficiaire: {managedBeneficiaryId}</Text>}
        </View>
        <TouchableOpacity testID="add-zone-btn" style={s.addBtn} onPress={openCreateModal}>
          <Icon name="add" size={22} color="#111827" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View testID="geofence-info-card" style={s.info}>
          <Icon name="location-outline" size={20} color={Colors.primary} />
          <Text style={s.infoText}>
            {isGuardianMode
              ? 'En tant que gardien, vous pouvez creer, modifier, activer/desactiver et supprimer les safe zones de ce beneficiaire.'
              : 'Definissez des zones de securite. Si votre position sort de ces zones, une alerte est envoyee a vos gardiens.'}
          </Text>
        </View>

        {isGuardianMode && (
          <View testID="beneficiary-location-card" style={s.locationCard}>
            <View style={{ flex: 1 } as any}>
              <Text style={s.locationTitle}>Localisation beneficiaire</Text>
              {hasCurrentLocation ? (
                <Text style={s.locationMeta}>
                  {Number(currentLocation.latitude).toFixed(5)}, {Number(currentLocation.longitude).toFixed(5)}
                  {currentLocation?.updated_at ? ` · MAJ ${new Date(currentLocation.updated_at).toLocaleString('fr-FR')}` : ''}
                </Text>
              ) : (
                <Text style={s.locationMeta}>Aucune position recente disponible</Text>
              )}
            </View>
            <TouchableOpacity testID="refresh-beneficiary-location-btn" onPress={checkPosition} style={s.refreshLocBtn}>
              <Icon name="refresh" size={16} color="#111827" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity testID="check-pos-btn" style={s.checkBtn} onPress={checkPosition}>
          <Icon name="navigate-circle-outline" size={18} color="#111827" />
          <Text style={s.checkBtnT}>{isGuardianMode ? 'Verifier zone du beneficiaire' : 'Verifier ma position'}</Text>
        </TouchableOpacity>

        {checkResult && (
          <View style={[s.checkResult, { borderLeftColor: checkResult.in_zone ? Colors.success : Colors.destructive }]}>
            <Icon name={checkResult.in_zone ? 'checkmark-circle' : 'alert-circle'} size={18} color={checkResult.in_zone ? Colors.success : Colors.destructive} />
            <Text style={[s.checkResultT, { color: checkResult.in_zone ? Colors.success : Colors.destructive }]}>
              {checkResult.in_zone
                ? (isGuardianMode ? 'Le beneficiaire est dans ses zones de securite' : 'Vous etes dans vos zones de securite')
                : `Hors zone ! ${(checkResult.violations || []).map((v: any) => `${v.zone_name || v.fence_name}: ${v.distance_m}m`).join(', ')}`}
            </Text>
          </View>
        )}

        <Text testID="zones-section-title" style={s.secTitle}>{isGuardianMode ? `Zones beneficiaire (${zones.length})` : `Mes zones (${zones.length})`}</Text>
        {zones.map(z => (
          <View key={z.id} testID={`zone-card-${z.id}`} style={[s.zoneCard, !z.active && { opacity: 0.5 }]}> 
            <View style={s.zoneIcon}><Icon name="location" size={20} color={Colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.zoneName}>{z.name}</Text>
              <Text style={s.zoneMeta}>Rayon: {(z.radius_m ?? z.radius_meters ?? 0)}m · {Number(z.latitude).toFixed(4)}, {Number(z.longitude).toFixed(4)}</Text>
            </View>
            <TouchableOpacity testID={`edit-zone-btn-${z.id}`} onPress={() => openEditModal(z)} style={s.actionBtn}>
              <Icon name="create-outline" size={15} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Switch testID={`toggle-zone-${z.id}`} value={!!z.active} onValueChange={() => toggleZone(z.id)} trackColor={{ true: Colors.primary }} />
            <TouchableOpacity testID={`delete-zone-btn-${z.id}`} onPress={() => deleteZone(z.id)} style={s.actionBtn}>
              <Icon name="trash-outline" size={16} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
        {zones.length === 0 && <View testID="zone-empty-state" style={s.empty}><Icon name="location-outline" size={36} color={Colors.textMuted} /><Text style={s.emptyT}>Aucune zone configuree</Text></View>}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalO}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalO}><TouchableWithoutFeedback><View style={s.modalC}>
              <Text style={s.modalTitle}>{editingZone ? 'Modifier la safe zone' : 'Nouvelle safe zone'}</Text>
              <Text style={s.inputL}>Nom</Text>
              <TextInput testID="zone-name-input" style={s.input} placeholder="Ex: Domicile, Parc..." placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />

              {isGuardianMode && (
                <TouchableOpacity testID="use-beneficiary-location-btn" onPress={useBeneficiaryLocation} style={[s.useLocationBtn, !hasCurrentLocation && { opacity: 0.5 }]}> 
                  <Icon name="locate-outline" size={16} color="#111827" />
                  <Text style={s.useLocationBtnT}>Utiliser la localisation beneficiaire</Text>
                </TouchableOpacity>
              )}

              <Text style={s.inputL}>Latitude</Text>
              <TextInput testID="zone-lat-input" style={s.input} placeholder="48.8566" placeholderTextColor={Colors.textMuted} value={lat} onChangeText={setLat} keyboardType="numeric" />
              <Text style={s.inputL}>Longitude</Text>
              <TextInput testID="zone-lng-input" style={s.input} placeholder="2.3522" placeholderTextColor={Colors.textMuted} value={lng} onChangeText={setLng} keyboardType="numeric" />
              <Text style={s.inputL}>Rayon (mètres)</Text>
              <TextInput testID="zone-radius-input" style={s.input} placeholder="500" placeholderTextColor={Colors.textMuted} value={radius} onChangeText={setRadius} keyboardType="numeric" />

              {Platform.OS === 'web' && !!lat && !!lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng)) && (
                <View style={s.webMapPreview}>
                  <iframe
                    title="zone-preview-map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.01},${Number(lat) - 0.01},${Number(lng) + 0.01},${Number(lat) + 0.01}&layer=mapnik&marker=${Number(lat)},${Number(lng)}`}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 10 } as any}
                  />
                </View>
              )}

              <View style={s.modalBtns}>
                <TouchableOpacity testID="cancel-zone-btn" style={s.cancelBtn} onPress={() => { setShowModal(false); setEditingZone(null); }}><Text style={s.cancelBtnT}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity testID="save-zone-btn" style={s.saveBtn} onPress={saveZone} disabled={saving}>
                  {saving ? <ActivityIndicator color="#111827" /> : <Text style={s.saveBtnT}>{editingZone ? 'Enregistrer' : 'Creer'}</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border, backgroundColor: Colors.paper, gap: 10 },
  backBtn: { padding: 4, marginRight: 12 },
  headerT: { fontSize: 17, fontWeight: '700', color: Colors.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 60 },
  info: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: Colors.subtle, borderRadius: 10, marginBottom: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border, marginBottom: 10 },
  locationTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  locationMeta: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  refreshLocBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  checkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, padding: 14, borderRadius: 10, marginBottom: 12 },
  checkBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  checkResult: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, backgroundColor: Colors.paper, borderLeftWidth: 3, marginBottom: 12 },
  checkResultT: { flex: 1, fontSize: 13, fontWeight: '600' },
  secTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  zoneCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  zoneIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  zoneName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  zoneMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  actionBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.subtle },
  empty: { alignItems: 'center', padding: 30, gap: 8 },
  emptyT: { fontSize: 13, color: Colors.textMuted },
  modalO: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  inputL: { fontSize: 11, color: Colors.textMuted, marginTop: 8, marginBottom: 2 },
  input: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  useLocationBtn: { marginTop: 8, marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10 },
  useLocationBtnT: { fontSize: 12, fontWeight: '700', color: '#111827' },
  webMapPreview: { marginTop: 10, height: 180, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnT: { fontSize: 15, color: '#FFF', fontWeight: '600' },
});
