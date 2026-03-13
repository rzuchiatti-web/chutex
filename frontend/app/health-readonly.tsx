import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';

const BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
const glass: any = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {};

export default function HealthReadonlyScreen() {
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const bens = await apiFetch('/api/guardian/beneficiaries', {}, token);
        const ben = (bens || []).find((b: any) => b.id === beneficiaryId) || bens?.[0];
        setData(ben || null);
      } catch {} finally { setLoading(false); }
    })();
  }, [beneficiaryId, token]);

  if (loading) return <FullScreenLoader />;
  if (!data) return <View style={{ flex: 1, backgroundColor: '#050510', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Donnees non disponibles</Text></View>;
  if (Platform.OS !== 'web') return null;

  const v = data.latest_vitals || {};
  const age = data.date_of_birth ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / 31557600000) : null;
  const firstName = (data.name || '').split(' ')[0] || data.name;

  const Card = ({ children, style }: any) => (
    <div style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12, ...glass, ...style } as any}>{children}</div>
  );

  const Section = ({ icon, label, color }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: 2 } as any}>
      <i className={icon} style={{ fontSize: 15, color }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' } as any} />
      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: 1, textTransform: 'uppercase' }}>Lecture seule</span>
    </div>
  );

  const metrics = [
    { label: 'Freq. cardiaque', val: v.heart_rate, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444' },
    { label: 'SpO2', val: v.spo2, unit: '%', icon: 'ri-drop-line', color: '#60A5FA' },
    { label: 'Tension', val: v.systolic ? `${v.systolic}/${v.diastolic}` : null, unit: 'mmHg', icon: 'ri-pulse-line', color: '#C084FC' },
    { label: 'Temperature', val: v.temperature && v.temperature > 30 ? v.temperature : null, unit: '°C', icon: 'ri-temp-hot-line', color: '#FB923C' },
    { label: 'Pas', val: v.steps, unit: 'pas', icon: 'ri-footprint-line', color: '#10B981' },
    { label: 'Calories', val: v.calories, unit: 'kcal', icon: 'ri-fire-line', color: '#F59E0B' },
    { label: 'HRV', val: v.hrv, unit: 'ms', icon: 'ri-rhythm-line', color: '#818CF8' },
    { label: 'Sommeil', val: v.sleep_quality, unit: '%', icon: 'ri-moon-line', color: '#A78BFA' },
  ].filter(m => m.val && m.val !== 0);

  // Simulated bio age & glycemia (same as beneficiary page)
  const bioAge = age ? Math.round(age * 0.92 + (v.hrv ? (50 - v.hrv) * 0.1 : 0)) : null;
  const glycemia = v.heart_rate && v.steps ? Math.round(0.85 + (v.heart_rate - 70) * 0.005 + Math.max(0, 5000 - v.steps) * 0.00002) : null;
  const glycLabel = !glycemia ? null : glycemia < 1.0 ? 'Normal' : glycemia < 1.1 ? 'Normal haut' : glycemia < 1.26 ? 'Vigilance' : 'Alerte';
  const glycColor = !glycemia ? '#10B981' : glycemia < 1.0 ? '#10B981' : glycemia < 1.1 ? '#84CC16' : glycemia < 1.26 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch', maxWidth: 600, margin: '0 auto', width: '100%' } as any}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 } as any}>
          <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>Sante de {firstName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{age ? `${age} ans` : ''} · Consultation gardien</div>
          </div>
          <div style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' } as any}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B' }}>LECTURE SEULE</span>
          </div>
        </div>

        {/* Age biologique */}
        {bioAge && (
          <Card style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Age biologique estime</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{bioAge} <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>ans</span></div>
            {age && <div style={{ fontSize: 11, color: bioAge < age ? '#10B981' : '#F59E0B', marginTop: 8, fontWeight: 700 }}>{bioAge < age ? `${age - bioAge} ans de moins que l'age civil` : `${bioAge - age} ans de plus que l'age civil`}</div>}
          </Card>
        )}

        {/* Constantes vitales */}
        <Section icon="ri-heart-pulse-line" label="Constantes vitales" color="#EF4444" />
        <Card>
          {metrics.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 } as any}>
              {metrics.map((m, i) => (
                <div key={i} style={{ padding: '12px 10px', borderRadius: 16, background: `${m.color}08`, border: `1px solid ${m.color}18` } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 } as any}>
                    <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
                    <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 600 }}>{m.unit}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Aucune constante disponible</div>
          )}
        </Card>

        {/* Glycemie estimee */}
        {glycemia && (
          <>
            <Section icon="ri-test-tube-line" label="Glycemie estimee" color="#F59E0B" />
            <Card style={{ background: `${glycColor}08`, border: `1px solid ${glycColor}18` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                <div style={{ textAlign: 'center' } as any}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: glycColor, lineHeight: 1 }}>{glycemia.toFixed(2)}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 4 }}>g/L</div>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 999, background: `${glycColor}15`, marginBottom: 6 } as any}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: glycColor }}>{glycLabel}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Estimation basee sur les donnees du bracelet Elio. Non substitutive a une prise de sang.</div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Sommeil */}
        {v.sleep_quality && (
          <>
            <Section icon="ri-moon-line" label="Sommeil" color="#A78BFA" />
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                <div style={{ width: 60, height: 60, borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '2px solid rgba(167,139,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#A78BFA' }}>{v.sleep_quality}%</span>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Qualite du sommeil</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{v.sleep_quality >= 80 ? 'Sommeil de bonne qualite' : v.sleep_quality >= 60 ? 'Sommeil moyen, a surveiller' : 'Sommeil insuffisant'}</div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Poids */}
        {data.weight_kg && (
          <>
            <Section icon="ri-scales-3-line" label="Composition corporelle" color="#3B82F6" />
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#3B82F6', lineHeight: 1 }}>{data.weight_kg}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: 2 }}>kg</div>
                </div>
                {data.height_cm && (
                  <div style={{ flex: 1, display: 'flex', gap: 8 } as any}>
                    <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', flex: 1 } as any}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>Taille</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{data.height_cm} cm</div>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', flex: 1 } as any}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>IMC</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{(data.weight_kg / Math.pow(data.height_cm / 100, 2)).toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* Pathologies */}
        {data.medical_conditions && (
          <>
            <Section icon="ri-stethoscope-line" label="Dossier medical" color="#F59E0B" />
            <Card style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 6 }}>Pathologies connues</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{data.medical_conditions}</div>
              {data.allergies && data.allergies !== 'Aucune' && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: 4 }}>Allergies</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{data.allergies}</div>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Last sync info */}
        {data.last_sync && (
          <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 10 }}>
            Derniere synchronisation : {new Date(data.last_sync).toLocaleString('fr-FR')}
          </div>
        )}
      </div>
    </div>
  );
}
