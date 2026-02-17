import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

export default function InterventionMapScreen() {
  const { interventionId, alertId } = useLocalSearchParams<{ interventionId?: string; alertId?: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [iv, setIv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      if (interventionId) {
        const data = await apiFetch(`/api/interventions/${interventionId}`, {}, token);
        setIv(data);
      } else if (alertId) {
        const alerts = await apiFetch('/api/alerts/active-with-interventions', {}, token);
        const alert = (alerts || []).find((a: any) => a.id === alertId);
        if (alert?.intervention?.id) {
          const data = await apiFetch(`/api/interventions/${alert.intervention.id}`, {}, token);
          setIv(data);
        }
      }
    } catch {} finally { setLoading(false); }
  }, [interventionId, alertId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setInterval(fetchData, 8000); return () => clearInterval(t); }, [fetchData]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!iv) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Intervention non trouvee</Text></SafeAreaView>;

  const ben = iv.beneficiary_info || {};
  const alertInfo = iv.alert_info || {};
  const intervener = iv.intervener_full || {};
  const benLoc = iv.beneficiary_location || {};
  const intLoc = iv.intervener_location || {};
  const isCare = intervener.role === 'care_provider' || iv.intervener_type === 'care';
  const isGuardian = iv.intervener_type === 'guardian' || intervener.role === 'guardian';
  const distKm = iv.distance_km || (benLoc.latitude && intLoc.latitude ? Math.round(Math.sqrt(Math.pow((benLoc.latitude - intLoc.latitude) * 111, 2) + Math.pow((benLoc.longitude - intLoc.longitude) * 85, 2)) * 10) / 10 : null);
  const etaMin = distKm ? Math.ceil(distKm * 2.5) : null;
  const etaTime = etaMin ? new Date(Date.now() + etaMin * 60000) : null;

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFF', fontSize: 16 }}>Suivi intervention</Text>
      </SafeAreaView>
    );
  }

  return (
    <div data-testid="intervention-map-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>

      {/* MAP SECTION — top half */}
      <div style={{ position: 'relative', height: '45%', minHeight: 280, flexShrink: 0 } as any}>
        {benLoc.latitude ? (
          <iframe
            src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${intLoc.latitude || benLoc.latitude + 0.008},${intLoc.longitude || benLoc.longitude + 0.008}&destination=${benLoc.latitude},${benLoc.longitude}&mode=driving`}
            style={{ width: '100%', height: '100%', border: 'none' } as any}
            allowFullScreen
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-map-2-line" style={{ fontSize: 48, color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}
        {/* Back button overlay */}
        <div onClick={() => router.back()} data-testid="map-back-btn" style={{ position: 'absolute', top: 16, left: 16, width: 44, height: 44, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 22, color: '#111' }} />
        </div>
      </div>

      {/* BOTTOM SHEET — intervention info with red background */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24 } as any}>
        <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />

        {/* Drag handle */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', padding: '10px 0 6px' } as any}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)' } as any} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 40px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Status pill + ETA */}
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 18px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', marginBottom: 14 } as any}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Intervention en cours</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Heure d'arrivee</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>{etaTime ? `${etaTime.getHours()}h${String(etaTime.getMinutes()).padStart(2, '0')}` : '--:--'}</div>
            {distKm && (
              <div style={{ display: 'inline-flex', padding: '5px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginTop: 8 } as any}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{distKm} km restant</span>
              </div>
            )}
          </div>

          {/* ─── FICHE ALERTE ─── */}
          <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, textTransform: 'uppercase' }}>Fiche alerte</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' } as any}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444' }}>{alertInfo.status === 'resolved' ? 'Resolue' : 'Active'}</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
              {[
                { label: 'Type', value: alertInfo.alert_type === 'fall' ? 'Chute detectee' : alertInfo.alert_type === 'sos' ? 'SOS' : alertInfo.alert_type || '-' },
                { label: 'Severite', value: alertInfo.severity === 'critical' ? 'Critique' : alertInfo.severity || '-' },
                { label: 'Appareil', value: alertInfo.device_type || '-' },
                { label: 'Heure', value: alertInfo.created_at ? new Date(alertInfo.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {alertInfo.message && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8, lineHeight: 1.4 }}>{alertInfo.message}</div>}
          </div>

          {/* ─── FICHE BENEFICIAIRE ─── */}
          <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>Fiche beneficiaire</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 } as any}>
              <div style={{ width: 48, height: 48, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{(ben.name || iv.beneficiary_name || '?').charAt(0)}</span>
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF' }}>{ben.name || iv.beneficiary_name}</div>
                {ben.date_of_birth && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Ne(e) le {ben.date_of_birth}</div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 } as any}>
              {[
                ben.blood_type && { label: 'Groupe sanguin', value: ben.blood_type },
                ben.gender && { label: 'Genre', value: ben.gender },
                ben.height_cm && { label: 'Taille', value: `${ben.height_cm} cm` },
                ben.weight_kg && { label: 'Poids', value: `${ben.weight_kg} kg` },
              ].filter(Boolean).map((item: any, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{item.value}</div>
                </div>
              ))}
            </div>
            {ben.medical_conditions && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 8 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#EF4444', textTransform: 'uppercase', marginBottom: 2 }}>Pathologies</div>
                <div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.4 }}>{ben.medical_conditions}</div>
              </div>
            )}
            {ben.allergies && (
              <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 8 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 2 }}>Allergies</div>
                <div style={{ fontSize: 12, color: '#FFF' }}>{ben.allergies}</div>
              </div>
            )}
            {ben.address && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}><i className="ri-map-pin-line" style={{ fontSize: 12, marginRight: 6 }} />{ben.address}</div>}
            {ben.phone && (
              <div onClick={() => window.location.href = `tel:${ben.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer', marginTop: 8 } as any}>
                <i className="ri-phone-line" style={{ fontSize: 16, color: '#10B981' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>Appeler {ben.name?.split(' ')[0]}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{ben.phone}</span>
              </div>
            )}
          </div>

          {/* ─── FICHE INTERVENANT ─── */}
          {iv.assigned_name && (
            <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.2, textTransform: 'uppercase' }}>Fiche intervenant</div>
                {isCare && (
                  <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.35)' } as any}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 } as any}>
                <div style={{ width: 48, height: 48, borderRadius: 999, background: isCare ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{iv.assigned_name.charAt(0)}</span>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF' }}>{iv.assigned_name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{intervener.structure_name || intervener.profession || (isGuardian ? 'Gardien' : 'Intervenant')}</div>
                </div>
              </div>
              {intervener.phone && (
                <div onClick={() => window.location.href = `tel:${intervener.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' } as any}>
                  <i className="ri-phone-line" style={{ fontSize: 16, color: '#FFF' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>Appeler l'intervenant</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>{intervener.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Navigate button */}
          {benLoc.latitude && (
            <div onClick={() => {
              const url = `https://www.google.com/maps/dir/?api=1&destination=${benLoc.latitude},${benLoc.longitude}`;
              window.open(url, '_blank');
            }} data-testid="navigate-btn" style={{
              padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer',
              background: '#FFF', color: '#111', fontSize: 16, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)', marginTop: 6,
            } as any}>
              <i className="ri-navigation-line" style={{ fontSize: 18 }} />
              Lancer la navigation
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
