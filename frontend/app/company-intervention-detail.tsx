import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const { height: SCREEN_H } = Dimensions.get('window');
const MAP_H = SCREEN_H * 0.55;

const statusColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');
const statusLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);

function FullMap({ benLat, benLng, ivLat, ivLng, benName, ivName }: any) {
  if (Platform.OS !== 'web' || !benLat) return <View style={{ flex: 1, backgroundColor: '#E8E8E8', justifyContent: 'center', alignItems: 'center' }}><Ionicons name="map-outline" size={40} color="#CCC" /><Text style={{ color: '#AAA', marginTop: 8 }}>Carte non disponible</Text></View>;
  const benInit = (benName || 'B').charAt(0);
  const ivInit = (ivName || 'I').charAt(0);
  const markers = ivLat && ivLng
    ? `var benM=L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;border:3px solid #FFF;box-shadow:0 4px 12px rgba(0,0,0,0.3)">${benInit}</div>'})}).addTo(map);var ivM=L.marker([${ivLat},${ivLng}],{icon:L.divIcon({className:'',html:'<div style="background:#009688;color:#FFF;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;border:3px solid #FFF;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:pulse 2s infinite"><style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}</style>${ivInit}</div>'})}).addTo(map);L.polyline([[${ivLat},${ivLng}],[${benLat},${benLng}]],{color:'#009688',weight:4,dashArray:'12,8',opacity:0.8}).addTo(map);var mid=[(${benLat}+${ivLat})/2,(${benLng}+${ivLng})/2];map.fitBounds([[${benLat},${benLng}],[${ivLat},${ivLng}]],{padding:[60,60]});`
    : `L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;border:3px solid #FFF;box-shadow:0 4px 12px rgba(0,0,0,0.3)">${benInit}</div>'})}).addTo(map);map.setView([${benLat},${benLng}],15);`;
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}.leaflet-control-attribution{display:none!important}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false});L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);${markers}</script></body></html>`;
  return <iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' } as any} />;
}

export default function CompanyInterventionDetail() {
  const { interventionId } = useLocalSearchParams<{ interventionId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const d = await apiFetch(`/api/interventions/${interventionId}/detail`, {}, token);
      setData(d);
    } catch {} finally { setLoading(false); }
  }, [interventionId, token]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  if (!data?.intervention) return <View style={{ flex: 1, backgroundColor: '#F5F0EB', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#888' }}>Intervention non trouvee</Text></View>;

  const iv = data.intervention;
  const ben = data.beneficiary || iv.beneficiary_info || {};
  const intervenant = data.intervenant;
  const alert = data.alert;
  const sc = statusColor(iv.status);
  const benLoc = iv.beneficiary_location || {};
  const ivLoc = iv.intervenant_location;
  const iAmIntervenant = iv.assigned_to === user?.id;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      {/* MAP - full top half */}
      <View style={{ height: MAP_H, position: 'relative' }}>
        <FullMap benLat={benLoc.latitude} benLng={benLoc.longitude} ivLat={ivLoc?.latitude} ivLng={ivLoc?.longitude} benName={ben.name || iv.beneficiary_name} ivName={iv.assigned_name} />

        {/* Back button overlay */}
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.15)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 }) }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* Status pill overlay */}
        <View style={{ position: 'absolute', top: 50, right: 16, backgroundColor: sc, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.2)' } : {}) }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>{statusLabel(iv.status).toUpperCase()}</Text>
        </View>

        {/* ETA overlay at bottom of map */}
        {iv.distance_km && (
          <View style={{ position: 'absolute', bottom: 16, left: '50%', transform: [{ translateX: -60 }], backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.3)', left: 'calc(50% - 60px)', transform: 'none' as any } : {}) }}>
            <Ionicons name="navigate" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>{iv.distance_km} km</Text>
          </View>
        )}
      </View>

      {/* SLIDE-UP CARD */}
      <View style={{ flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...(Platform.OS === 'web' ? { boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 }) }}>
        {/* Handle bar */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Intervenant or waiting status */}
          {iv.assigned_name ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: iAmIntervenant ? '#4CAF50' : '#009688', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFF' }}>{iv.assigned_name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#000' }}>{iAmIntervenant ? 'Vous intervenez' : iv.assigned_name}</Text>
                <Text style={{ fontSize: 13, color: '#888' }}>{iAmIntervenant ? 'Les gardiens suivent votre position' : `${statusLabel(iv.status)} - ${iv.structure_name || ''}`}</Text>
              </View>
              {!iAmIntervenant && iv.distance_km && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: sc }}>{iv.distance_km}</Text>
                  <Text style={{ fontSize: 9, color: '#888', fontWeight: '700' }}>KM</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, backgroundColor: '#FFF3E0', borderRadius: 16, padding: 14 }}>
              <Ionicons name="time" size={24} color="#FF9800" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#E65100' }}>En attente d'un intervenant</Text>
                <Text style={{ fontSize: 12, color: '#888' }}>{(iv.recipients || []).length} intervenants notifies</Text>
              </View>
            </View>
          )}

          {/* Alert type banner */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFEBEE', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <Ionicons name={alert?.alert_type === 'fall' ? 'trending-down' : 'alert-circle'} size={22} color="#E53935" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#E53935' }}>{alert?.alert_type === 'sos' ? 'SOS - Urgence' : alert?.alert_type === 'fall' ? 'Chute detectee' : 'Alerte'}</Text>
              <Text style={{ fontSize: 12, color: '#C62828' }}>{iv.alert_message || alert?.message}</Text>
            </View>
            <Text style={{ fontSize: 10, color: '#888' }}>{iv.created_at ? new Date(iv.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
          </View>

          {/* Patient info card */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Patient</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#0288D1' }}>{(ben.name || iv.beneficiary_name || '?').charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#000' }}>{ben.name || iv.beneficiary_name}</Text>
                {ben.phone && <Text style={{ fontSize: 13, color: '#555' }}>{ben.phone}</Text>}
              </View>
            </View>

            {ben.address && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <Ionicons name="location" size={16} color="#E53935" style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 13, color: '#000', fontWeight: '600', flex: 1 }}>{ben.address}</Text>
              </View>
            )}

            {/* Medical info - compact grid */}
            {(ben.medical_conditions || ben.allergies || ben.blood_type) && (
              <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, gap: 6 }}>
                {ben.medical_conditions && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Ionicons name="medkit" size={14} color="#E53935" />
                    <Text style={{ fontSize: 12, color: '#333', flex: 1 }}><Text style={{ fontWeight: '700' }}>Pathologies:</Text> {ben.medical_conditions}</Text>
                  </View>
                )}
                {ben.allergies && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Ionicons name="warning" size={14} color="#FF9800" />
                    <Text style={{ fontSize: 12, color: '#333', flex: 1 }}><Text style={{ fontWeight: '700' }}>Allergies:</Text> {ben.allergies}</Text>
                  </View>
                )}
                {ben.blood_type && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Ionicons name="water" size={14} color="#E53935" />
                    <Text style={{ fontSize: 12, color: '#333', flex: 1 }}><Text style={{ fontWeight: '700' }}>Groupe:</Text> {ben.blood_type}</Text>
                  </View>
                )}
                {ben.doctor_name && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Ionicons name="person" size={14} color="#2196F3" />
                    <Text style={{ fontSize: 12, color: '#333', flex: 1 }}><Text style={{ fontWeight: '700' }}>Medecin:</Text> {ben.doctor_name}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Emergency contact */}
            {ben.emergency_contact_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10 }}>
                <Ionicons name="call" size={16} color="#E53935" />
                <Text style={{ fontSize: 12, color: '#C62828', fontWeight: '700', flex: 1 }}>{ben.emergency_contact_name} {ben.emergency_contact_phone ? `(${ben.emergency_contact_phone})` : ''}</Text>
              </View>
            )}
          </View>

          {/* Intervenant details if assigned */}
          {intervenant && !iAmIntervenant && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Intervenant</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Ionicons name="shield-checkmark" size={16} color="#009688" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#000' }}>{intervenant.name}</Text>
              </View>
              {intervenant.profession && <Text style={{ fontSize: 12, color: '#888', marginLeft: 26 }}>{intervenant.profession} - {intervenant.intervention_structure || intervenant.structure_name}</Text>}
              {intervenant.phone && <Text style={{ fontSize: 12, color: '#888', marginLeft: 26 }}>{intervenant.phone}</Text>}
            </View>
          )}

          {/* Timeline */}
          {(iv.timeline || []).length > 0 && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Chronologie</Text>
              {iv.timeline.map((t: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === iv.timeline.length - 1 ? sc : '#DDD', marginTop: 5 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#333', fontWeight: i === iv.timeline.length - 1 ? '700' : '400' }}>{t.note || t.status}</Text>
                    <Text style={{ fontSize: 10, color: '#AAA' }}>{t.time ? new Date(t.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
