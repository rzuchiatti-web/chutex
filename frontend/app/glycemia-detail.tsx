import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const P = '#A78BFA', G = '#10B981', A = '#F59E0B', R = '#EF4444', B = '#60A5FA';
const GL: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };

export default function GlycemiaDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calibValue, setCalibValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch('/api/glycemia/estimate', {}, token),
      apiFetch('/api/glycemia/calibrations', {}, token),
    ]).then(([est, cal]) => { setData(est); setCalibrations(cal?.calibrations || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const saveCalibration = async () => {
    const v = parseFloat(calibValue.replace(',', '.'));
    if (!v || v <= 0 || v > 5) return;
    setSaving(true);
    try {
      await apiFetch('/api/glycemia/calibrate', { method: 'POST', body: JSON.stringify({ glycemia_value: v }) }, token);
      setCalibValue('');
      const [est, cal] = await Promise.all([
        apiFetch('/api/glycemia/estimate', {}, token),
        apiFetch('/api/glycemia/calibrations', {}, token),
      ]);
      setData(est); setCalibrations(cal?.calibrations || []);
    } catch {} finally { setSaving(false); }
  };

  if (Platform.OS !== 'web') return null;
  const zoneColors: Record<string, string> = { normal: G, vigilance: A, alert: R };
  const col = data ? (zoneColors[data.zone] || A) : A;
  const fade = (d: number) => mounted ? { opacity: 1, transform: 'translateY(0)', transition: `opacity 0.5s ${d}s ease, transform 0.5s ${d}s ease` } : { opacity: 0, transform: 'translateY(12px)' };

  return (
    <div data-testid="glycemia-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, ...fade(0) } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: -0.3 }}>Glycemie Estimee</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Estimation non-invasive par algorithme</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(96,165,250,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-drop-fill" style={{ fontSize: 20, color: P }} />
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: P, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && data && (
            <>
              {/* Zone Hero */}
              <div style={{ ...GL, padding: '24px 20px', marginBottom: 14, textAlign: 'center', ...fade(0.1) } as any}>
                <div style={{ width: 80, height: 80, borderRadius: 999, background: `${col}15`, border: `2px solid ${col}30`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                  <i className={data.zone === 'normal' ? 'ri-checkbox-circle-fill' : data.zone === 'alert' ? 'ri-alarm-warning-fill' : 'ri-error-warning-fill'} style={{ fontSize: 36, color: col }} />
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: col, marginBottom: 4 }}>{data.zone_label}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Plage estimee : {data.estimated_range}</div>
                {/* 3-zone gauge */}
                <div style={{ display: 'flex', gap: 4, margin: '16px auto 0', maxWidth: 280, height: 8, borderRadius: 4, overflow: 'hidden' } as any}>
                  <div style={{ flex: 1, background: G, opacity: data.zone === 'normal' ? 1 : 0.15, borderRadius: '4px 0 0 4px', transition: 'opacity 0.5s' } as any} />
                  <div style={{ flex: 1, background: A, opacity: data.zone === 'vigilance' ? 1 : 0.15, transition: 'opacity 0.5s' } as any} />
                  <div style={{ flex: 1, background: R, opacity: data.zone === 'alert' ? 1 : 0.15, borderRadius: '0 4px 4px 0', transition: 'opacity 0.5s' } as any} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 280, margin: '4px auto 0' } as any}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Normal</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Vigilance</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Alerte</span>
                </div>
              </div>

              {/* Message */}
              <div style={{ ...GL, padding: 16, marginBottom: 14, ...fade(0.15) } as any}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{data.message}</div>
              </div>

              {/* Factors */}
              {data.factors?.length > 0 && (
                <div style={{ ...GL, padding: 16, marginBottom: 14, ...fade(0.2) } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Facteurs analyses</div>
                  {data.factors.map((f: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{f.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{f.value}</span>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: f.impact === 'high' ? R : G } as any} />
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '8px 0 0', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Confiance de l'estimation</span>
                    <span style={{ fontSize: 12, fontWeight: 900, color: P }}>{data.confidence_pct}%</span>
                  </div>
                </div>
              )}

              {/* Calibration History Chart */}
              <div style={{ ...GL, padding: 16, marginBottom: 14, ...fade(0.25) } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Historique des calibrations</div>
                  <span style={{ fontSize: 10, color: P, fontWeight: 700 }}>{calibrations.length} mesure{calibrations.length !== 1 ? 's' : ''}</span>
                </div>
                {calibrations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px 0' } as any}>
                    <i className="ri-drop-line" style={{ fontSize: 28, color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: 8 }} />
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Aucune calibration</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', marginTop: 4 }}>Saisissez votre premiere glycemie pour ameliorer la precision</div>
                  </div>
                ) : (
                  <>
                    {/* Simple chart */}
                    <svg viewBox="0 0 400 100" style={{ width: '100%', height: 80, display: 'block', marginBottom: 8 }}>
                      {/* Reference lines */}
                      <line x1="0" x2="400" y1="50" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4" />
                      <text x="396" y="48" textAnchor="end" fill="rgba(255,255,255,0.1)" fontSize="8">1.0</text>
                      <line x1="0" x2="400" y1="20" y2="20" stroke="rgba(239,68,68,0.08)" strokeWidth="1" strokeDasharray="4" />
                      <text x="396" y="18" textAnchor="end" fill="rgba(239,68,68,0.15)" fontSize="8">1.26</text>
                      {/* Data points */}
                      {calibrations.slice(0, 12).reverse().map((c: any, i: number, arr: any[]) => {
                        const x = arr.length > 1 ? 20 + (i / (arr.length - 1)) * 360 : 200;
                        const val = c.glycemia_value || 1;
                        const y = Math.max(5, Math.min(95, 90 - ((val - 0.5) / 1.5) * 80));
                        const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill={ptCol} opacity="0.8" />
                            <text x={x} y={y - 8} textAnchor="middle" fill={ptCol} fontSize="8" fontWeight="800">{val}</text>
                          </g>
                        );
                      })}
                    </svg>
                    {/* History list */}
                    {calibrations.slice(0, 5).map((c: any, i: number) => {
                      const val = c.glycemia_value || 0;
                      const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.03)' } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: ptCol } as any} />
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: ptCol }}>{val} g/L</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Calibration Input */}
              <div style={{ ...GL, padding: 16, marginBottom: 14, ...fade(0.3) } as any}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Nouvelle calibration</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 12 }}>Saisissez votre glycemie capillaire (piqure au bout du doigt) pour ameliorer la precision de l'estimation.</div>
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <input data-testid="glycemia-input" type="number" step="0.01" placeholder="Ex: 1.05 g/L" value={calibValue} onChange={(e: any) => setCalibValue(e.target.value)} style={{ flex: 1, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', outline: 'none' } as any} />
                  <div data-testid="save-calibration" onClick={saveCalibration} style={{ padding: '12px 20px', borderRadius: 14, background: saving ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${P}, ${B})`, cursor: saving ? 'wait' : 'pointer', fontSize: 13, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 16px ${P}30` } as any}>
                    <i className="ri-check-line" style={{ fontSize: 16 }} />{saving ? '...' : 'Enregistrer'}
                  </div>
                </div>
              </div>

              {/* Info section */}
              <div style={{ ...GL, padding: 16, marginBottom: 14, ...fade(0.35) } as any}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Comprendre votre glycemie</div>
                {[
                  { zone: 'Normal', range: '0.70 - 1.00 g/L', color: G, desc: 'Votre metabolisme glucidique est dans la norme. Continuez vos bonnes habitudes.' },
                  { zone: 'Vigilance', range: '1.00 - 1.26 g/L', color: A, desc: 'Zone de pre-diabete. Parlez-en a votre medecin lors de votre prochain rendez-vous.' },
                  { zone: 'Alerte', range: '> 1.26 g/L', color: R, desc: 'Risque eleve. Un bilan sanguin complet est recommande rapidement.' },
                ].map((z, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 4, borderRadius: 2, background: z.color, flexShrink: 0 } as any} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 } as any}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: z.color }}>{z.zone}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{z.range}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{z.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 14, ...fade(0.4) } as any}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 } as any}>
                  <i className="ri-shield-check-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)', marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
                    Cette estimation est basee sur un algorithme analysant vos donnees de sante (composition corporelle, activite cardiaque, profil medical). Elle ne constitue pas un diagnostic medical et ne remplace pas un bilan sanguin. Consultez votre medecin pour toute question relative a votre glycemie.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}` }} />
    </div>
  );
}
