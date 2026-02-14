import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  value ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <Ionicons name={icon as any} size={16} color={color || '#888'} />
      <Text style={{ fontSize: 12, color: '#888', width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#000', flex: 1 }}>{value}</Text>
    </View>
  ) : null
);
const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
  </View>
);
const statusColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');
const statusLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);

function MapEmbed({ benLat, benLng, ivLat, ivLng, benName }: { benLat: number; benLng: number; ivLat?: number; ivLng?: number; benName: string }) {
  if (Platform.OS !== 'web') return null;
  const markers = ivLat && ivLng
    ? `var benM = L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${benName.charAt(0)}</div>'})}).addTo(map).bindPopup('<b>${benName}</b><br>Beneficiaire');var ivM = L.marker([${ivLat},${ivLng}],{icon:L.divIcon({className:'',html:'<div style="background:#9C27B0;color:#FFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width=\\'14\\' height=\\'14\\' viewBox=\\'0 0 24 24\\' fill=\\'#FFF\\'><path d=\\'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z\\'/></svg></div>'})}).addTo(map).bindPopup('Intervenant en route');L.polyline([[${ivLat},${ivLng}],[${benLat},${benLng}]],{color:'#9C27B0',weight:3,dashArray:'8,8'}).addTo(map);map.fitBounds([[${benLat},${benLng}],[${ivLat},${ivLng}]],{padding:[40,40]});`
    : `L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${benName.charAt(0)}</div>'})}).addTo(map).bindPopup('<b>${benName}</b>');map.setView([${benLat},${benLng}],14);`;
  const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body{margin:0}#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false});L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'CartoDB'}).addTo(map);${markers}</script></body></html>`;
  return (
    <View style={{ height: 220, borderRadius: 18, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
      <iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' } as any} />
    </View>
  );
}

export default function CompanyInterventionDetail() {
  const { interventionId } = useLocalSearchParams<{ interventionId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/interventions/${interventionId}/detail`, {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [interventionId, token]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 10000); return () => clearInterval(t); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!data?.intervention) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><Text style={{ color: '#888' }}>Intervention non trouvee</Text></View>;

  const iv = data.intervention;
  const ben = data.beneficiary || iv.beneficiary_info || {};
  const intervenant = data.intervenant;
  const alert = data.alert;
  const sc = statusColor(iv.status);
  const benLoc = iv.beneficiary_location || {};
  const ivLoc = iv.intervenant_location;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#000' }}>Fiche Intervention</Text>
        <Badge label={statusLabel(iv.status)} color={sc} bg={sc + '15'} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />}>

        {/* Map */}
        {benLoc.latitude && (
          <MapEmbed benLat={benLoc.latitude} benLng={benLoc.longitude} ivLat={ivLoc?.latitude} ivLng={ivLoc?.longitude} benName={iv.beneficiary_name || ''} />
        )}

        {/* Status Banner */}
        <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: sc, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: sc + '15', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={iv.status === 'completed' ? 'checkmark-circle' : iv.status === 'pending_acceptance' ? 'time' : 'navigate'} size={24} color={sc} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: sc }}>{statusLabel(iv.status).toUpperCase()}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{iv.alert_message}</Text>
            </View>
            {iv.distance_km && (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>{iv.distance_km}</Text>
                <Text style={{ fontSize: 9, color: '#888', fontWeight: '700' }}>KM</Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Alert Info */}
        {alert && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="warning" size={18} color="#E53935" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>Alerte</Text>
            </View>
            <InfoRow icon="alert-circle-outline" label="Type" value={alert.alert_type?.toUpperCase()} color="#E53935" />
            <InfoRow icon="text-outline" label="Message" value={alert.message} />
            <InfoRow icon="speedometer-outline" label="Severite" value={alert.severity} color="#E53935" />
            <InfoRow icon="calendar-outline" label="Date" value={alert.created_at ? new Date(alert.created_at).toLocaleString('fr-FR') : ''} />
          </GlassCard>
        )}

        {/* Beneficiary Info */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={18} color="#0288D1" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>Beneficiaire</Text>
          </View>
          <InfoRow icon="person-outline" label="Nom" value={ben.name || iv.beneficiary_name} color="#0288D1" />
          <InfoRow icon="call-outline" label="Telephone" value={ben.phone} />
          <InfoRow icon="location-outline" label="Adresse" value={ben.address || benLoc.address} />
          <InfoRow icon="fitness-outline" label="Pathologies" value={ben.medical_conditions} color="#E53935" />
          <InfoRow icon="warning-outline" label="Allergies" value={ben.allergies} color="#FF9800" />
          <InfoRow icon="water-outline" label="Gr. sanguin" value={ben.blood_type} />
          <InfoRow icon="calendar-outline" label="Naissance" value={ben.date_of_birth} />
          <InfoRow icon="person-circle-outline" label="Medecin" value={ben.doctor_name} />
          <InfoRow icon="call-outline" label="Urgence" value={ben.emergency_contact_name ? `${ben.emergency_contact_name} (${ben.emergency_contact_phone || ''})` : ''} color="#E53935" />
        </GlassCard>

        {/* Intervenant Info */}
        {intervenant ? (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={18} color="#9C27B0" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>Intervenant</Text>
              <Badge label="Assigne" color="#4CAF50" bg="#E8F5E9" />
            </View>
            <InfoRow icon="person-outline" label="Nom" value={intervenant.name} color="#9C27B0" />
            <InfoRow icon="briefcase-outline" label="Profession" value={intervenant.profession} />
            <InfoRow icon="business-outline" label="Structure" value={intervenant.intervention_structure || intervenant.structure_name} />
            <InfoRow icon="call-outline" label="Telephone" value={intervenant.phone} />
            <InfoRow icon="navigate-outline" label="Rayon" value={`${intervenant.intervention_radius_km || 30} km`} />
          </GlassCard>
        ) : (
          <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF9800' }}>En attente d'acceptation par un intervenant</Text>
            </View>
            {(iv.recipients || []).length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{iv.recipients.length} intervenants notifies</Text>
                {iv.recipients.map((r: any) => (
                  <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#9C27B015', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="person" size={14} color="#9C27B0" />
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#000', flex: 1 }}>{r.name}</Text>
                    <Text style={{ fontSize: 10, color: '#888' }}>{r.distance_km}km</Text>
                  </View>
                ))}
              </View>
            )}
          </GlassCard>
        )}

        {/* Timeline */}
        {(iv.timeline || []).length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="time" size={18} color="#000" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>Timeline</Text>
            </View>
            {iv.timeline.map((t: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === iv.timeline.length - 1 ? sc : '#DDD', marginTop: 5 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#000', fontWeight: '600' }}>{t.note || t.status}</Text>
                  <Text style={{ fontSize: 10, color: '#AAA' }}>{t.time ? new Date(t.time).toLocaleString('fr-FR') : ''}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}
