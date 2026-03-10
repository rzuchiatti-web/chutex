import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const P = '#A78BFA', G = '#10B981', A = '#F59E0B', R = '#EF4444', B = '#60A5FA';
const GL: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };
const META_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png';

export default function GlycemiaDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calibValue, setCalibValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const fetchAll = () => {
    if (!token) return;
    Promise.all([
      apiFetch('/api/glycemia/estimate', {}, token),
      apiFetch('/api/glycemia/calibrations', {}, token),
    ]).then(([est, cal]) => { setData(est); setCalibrations(cal?.calibrations || []); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(fetchAll, [token]);

  const saveCalibration = async () => {
    const v = parseFloat(calibValue.replace(',', '.'));
    if (!v || v <= 0 || v > 5) return;
    setSaving(true);
    try {
      await apiFetch('/api/glycemia/calibrate', { method: 'POST', body: JSON.stringify({ glycemia_value: v }) }, token);
      setCalibValue('');
      fetchAll();
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
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Estimation non-invasive</div>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: P, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && data && (
            <>
              {/* === CARTE PRINCIPALE UNIFIEE === */}
              <div style={{ ...GL, padding: 0, marginBottom: 14, overflow: 'hidden', ...fade(0.1) } as any}>
                {/* Hero with image */}
                <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 16 } as any}>
                  <img src={META_IMG} alt="Glycemie" style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 } as any} />
                  <div style={{ flex: 1 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: col, boxShadow: `0 0 10px ${col}60` } as any} />
                      <span style={{ fontSize: 22, fontWeight: 900, color: col }}>{data.zone_label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Plage estimee : {data.estimated_range}</div>
                  </div>
                </div>

                {/* Gauge bar */}
                <div style={{ padding: '0 20px 12px' } as any}>
                  <div style={{ display: 'flex', gap: 3, height: 8, borderRadius: 4, overflow: 'hidden' } as any}>
                    <div style={{ flex: 1, background: G, opacity: data.zone === 'normal' ? 1 : 0.12, borderRadius: '4px 0 0 4px', transition: 'opacity 0.5s' } as any} />
                    <div style={{ flex: 1, background: A, opacity: data.zone === 'vigilance' ? 1 : 0.12, transition: 'opacity 0.5s' } as any} />
                    <div style={{ flex: 1, background: R, opacity: data.zone === 'alert' ? 1 : 0.12, borderRadius: '0 4px 4px 0', transition: 'opacity 0.5s' } as any} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 } as any}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Normal (0.70-1.00)</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Vigilance (1.00-1.26)</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>Alerte ({'>'}1.26)</span>
                  </div>
                </div>

                {/* Message */}
                <div style={{ padding: '0 20px 14px' } as any}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{data.message}</div>
                </div>

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 20px' } as any} />

                {/* Factors */}
                {data.factors?.length > 0 && (
                  <div style={{ padding: '14px 20px' } as any}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Facteurs analyses</div>
                    {data.factors.map((f: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' } as any}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{f.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{f.value}</span>
                          <span style={{ width: 7, height: 7, borderRadius: 4, background: f.impact === 'high' ? R : G } as any} />
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px 0 0', borderTop: '1px solid rgba(255,255,255,0.03)' } as any}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Confiance</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: P }}>{data.confidence_pct}%</span>
                    </div>
                  </div>
                )}

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 20px' } as any} />

                {/* Comprendre les zones */}
                <div style={{ padding: '14px 20px' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Comprendre votre glycemie</div>
                  {[
                    { zone: 'Normal', range: '0.70 - 1.00 g/L', color: G, desc: 'Metabolisme glucidique dans la norme.' },
                    { zone: 'Vigilance', range: '1.00 - 1.26 g/L', color: A, desc: 'Zone de pre-diabete. Consultez votre medecin.' },
                    { zone: 'Alerte', range: '> 1.26 g/L', color: R, desc: 'Risque eleve. Bilan sanguin recommande.' },
                  ].map((z, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' } as any}>
                      <div style={{ width: 3, borderRadius: 2, background: z.color, flexShrink: 0 } as any} />
                      <div style={{ flex: 1 } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: z.color }}>{z.zone}</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>{z.range}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{z.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 20px' } as any} />

                {/* Calibration input */}
                <div style={{ padding: '14px 20px 16px' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Calibrer manuellement</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginBottom: 10 }}>Glycemie capillaire (piqure au doigt) pour ameliorer la precision.</div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <input data-testid="glycemia-input" type="number" step="0.01" placeholder="Ex: 1.05 g/L" value={calibValue} onChange={(e: any) => setCalibValue(e.target.value)} style={{ flex: 1, padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none' } as any} />
                    <div data-testid="save-calibration" onClick={saveCalibration} style={{ padding: '11px 18px', borderRadius: 12, background: saving ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${P}, ${B})`, cursor: saving ? 'wait' : 'pointer', fontSize: 12, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 5 } as any}>
                      <i className="ri-check-line" style={{ fontSize: 14 }} />{saving ? '...' : 'Enregistrer'}
                    </div>
                  </div>
                  {calibrations.length > 0 && (
                    <div data-testid="show-history" onClick={() => setShowHistory(true)} style={{ textAlign: 'center', marginTop: 10, fontSize: 10, fontWeight: 700, color: P, cursor: 'pointer', padding: '6px 0' } as any}>
                      <i className="ri-history-line" style={{ fontSize: 12, marginRight: 4 }} />Voir l'historique ({calibrations.length} mesure{calibrations.length > 1 ? 's' : ''})
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 14, ...fade(0.2) } as any}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 } as any}>
                  <i className="ri-shield-check-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.12)', marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                    Estimation algorithmique basee sur vos donnees de sante. Ne constitue pas un diagnostic medical. Consultez votre medecin.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === HISTORY POPUP (glass, profile-style) === */}
          {showHistory && (
            <div data-testid="history-popup" onClick={() => setShowHistory(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowHistory(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                  <img src={META_IMG} alt="" style={{ width: 48, height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 12px' } as any} />
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Historique glycemie</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{calibrations.length} calibration{calibrations.length > 1 ? 's' : ''} enregistree{calibrations.length > 1 ? 's' : ''}</div>
                </div>
                {/* Chart */}
                {calibrations.length > 0 && (
                  <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 16px', marginBottom: 16 } as any}>
                    <svg viewBox="0 0 380 120" style={{ width: '100%', height: 100, display: 'block' }}>
                      <line x1="0" x2="380" y1="60" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4" />
                      <text x="376" y="58" textAnchor="end" fill="rgba(255,255,255,0.12)" fontSize="9">1.0 g/L</text>
                      <line x1="0" x2="380" y1="28" y2="28" stroke="rgba(239,68,68,0.1)" strokeWidth="1" strokeDasharray="4" />
                      <text x="376" y="26" textAnchor="end" fill="rgba(239,68,68,0.2)" fontSize="9">1.26 g/L</text>
                      {calibrations.slice(0, 12).reverse().map((c: any, i: number, arr: any[]) => {
                        const x = arr.length > 1 ? 20 + (i / (arr.length - 1)) * 340 : 190;
                        const val = c.glycemia_value || 1;
                        const y = Math.max(8, Math.min(110, 100 - ((val - 0.5) / 1.5) * 90));
                        const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                        return (
                          <g key={i}>
                            {i > 0 && (() => {
                              const prev = arr[i - 1];
                              const px = 20 + ((i - 1) / (arr.length - 1)) * 340;
                              const pv = prev.glycemia_value || 1;
                              const py = Math.max(8, Math.min(110, 100 - ((pv - 0.5) / 1.5) * 90));
                              return <line x1={px} y1={py} x2={x} y2={y} stroke="rgba(167,139,250,0.3)" strokeWidth="1.5" />;
                            })()}
                            <circle cx={x} cy={y} r="5" fill={ptCol} opacity="0.9" />
                            <text x={x} y={y - 10} textAnchor="middle" fill={ptCol} fontSize="9" fontWeight="800">{val}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
                {/* List */}
                <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '12px 16px' } as any}>
                  {calibrations.map((c: any, i: number) => {
                    const val = c.glycemia_value || 0;
                    const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                          <span style={{ width: 8, height: 8, borderRadius: 4, background: ptCol } as any} />
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 900, color: ptCol }}>{val} g/L</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
