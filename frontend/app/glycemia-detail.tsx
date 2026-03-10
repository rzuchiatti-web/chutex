import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const P = '#A78BFA', G = '#10B981', A = '#F59E0B', R = '#EF4444', B = '#60A5FA';
const GL: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const META_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png';
const BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';

export default function GlycemiaDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calibValue, setCalibValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
  const zc: Record<string, string> = { normal: G, vigilance: A, alert: R };
  const col = data ? (zc[data.zone] || A) : A;

  return (
    <div data-testid="glycemia-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Back button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: P, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && data && (
            <>
              {/* ══ HERO: Big centered image (same as health-detail) ══ */}
              <div style={{ textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 2 } as any}>
                <img src={META_IMG} alt="Glycemie" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -50 } as any} />
              </div>

              {/* ══ CARTE 1: Zone + Graph + Explication + Nora + Disclaimer ══ */}
              <div style={{ ...GL, padding: '60px 20px 20px', marginBottom: 14, position: 'relative', zIndex: 1 } as any}>
                {/* Zone title */}
                <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Glycemie Estimee</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: `${col}15`, border: `1px solid ${col}25` } as any}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: col, boxShadow: `0 0 8px ${col}60` } as any} />
                    <span style={{ fontSize: 16, fontWeight: 900, color: col }}>{data.zone_label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{data.estimated_range}</div>
                </div>

                {/* Full-width gauge graph */}
                <div style={{ margin: '0 -20px 16px', padding: '0 20px' } as any}>
                  <svg viewBox="0 0 400 50" style={{ width: '100%', height: 50, display: 'block' }}>
                    {/* 3-zone background bars */}
                    <rect x="0" y="16" width="130" height="18" rx="4" fill={G} opacity={data.zone === 'normal' ? 0.6 : 0.08} />
                    <rect x="135" y="16" width="130" height="18" rx="4" fill={A} opacity={data.zone === 'vigilance' ? 0.6 : 0.08} />
                    <rect x="270" y="16" width="130" height="18" rx="4" fill={R} opacity={data.zone === 'alert' ? 0.6 : 0.08} />
                    {/* Labels */}
                    <text x="65" y="44" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">Normal</text>
                    <text x="200" y="44" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">Vigilance</text>
                    <text x="335" y="44" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="8">Alerte</text>
                    {/* Zone labels */}
                    <text x="65" y="12" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="7">0.70 - 1.00</text>
                    <text x="200" y="12" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="7">1.00 - 1.26</text>
                    <text x="335" y="12" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="7">{'>'}1.26 g/L</text>
                    {/* Indicator dot */}
                    {(() => {
                      const cx = data.zone === 'normal' ? 65 : data.zone === 'vigilance' ? 200 : 335;
                      return <><circle cx={cx} cy="25" r="8" fill={col} opacity="0.2"><animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" /></circle><circle cx={cx} cy="25" r="5" fill={col} stroke="#111" strokeWidth="2" /></>;
                    })()}
                  </svg>
                </div>

                {/* Explication des zones */}
                <div style={{ marginBottom: 16 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Comprendre les zones</div>
                  {[
                    { zone: 'Normal', range: '0.70 - 1.00 g/L', color: G, desc: 'Metabolisme glucidique sain. Aucune action requise.' },
                    { zone: 'Vigilance', range: '1.00 - 1.26 g/L', color: A, desc: 'Pre-diabete potentiel. Un controle medical est conseille.' },
                    { zone: 'Alerte', range: '> 1.26 g/L', color: R, desc: 'Risque diabetique. Bilan sanguin complet recommande.' },
                  ].map((z, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' } as any}>
                      <div style={{ width: 3, borderRadius: 2, background: z.color, flexShrink: 0 } as any} />
                      <div style={{ flex: 1 } as any}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: z.color }}>{z.zone}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', marginLeft: 6 }}>{z.range}</span>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{z.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 0 14px' } as any} />

                {/* Nora mini analysis */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 900, color: P }}>N</span></div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{data.message}</div>
                    {data.factors?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 } as any}>
                        {data.factors.map((f: any, i: number) => (
                          <span key={i} style={{ padding: '2px 7px', borderRadius: 6, background: f.impact === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${f.impact === 'high' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)'}`, fontSize: 9, color: f.impact === 'high' ? '#FCA5A5' : 'rgba(255,255,255,0.25)' } as any}>{f.name}: {f.value}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Disclaimer + precision */}
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } as any}>
                    <i className="ri-flask-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>Estimation en evolution</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                    Cette analyse n'est pas un dispositif medical. Les estimations glycemiques sont en constante evolution et s'ameliorent de maniere permanente grace a vos calibrations et aux donnees de vos capteurs.
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 } as any}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)' }}>Precision actuelle :</span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: P }}>{data.confidence_pct}%</span>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}>
                      <div style={{ height: '100%', borderRadius: 2, background: P, width: `${data.confidence_pct}%`, opacity: 0.6 } as any} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ CARTE 2: Calibrations manuelles ══ */}
              <div style={{ ...GL, padding: 20, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    <i className="ri-drop-fill" style={{ fontSize: 16, color: P }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>Mesures manuelles</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{calibrations.length} calibration{calibrations.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Mini chart of calibrations */}
                {calibrations.length > 0 && (
                  <div style={{ margin: '0 -20px 14px', padding: '0 20px' } as any}>
                    <svg viewBox="0 0 400 80" style={{ width: '100%', height: 70, display: 'block' }}>
                      <line x1="0" x2="400" y1="40" y2="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="3" />
                      <text x="396" y="38" textAnchor="end" fill="rgba(255,255,255,0.1)" fontSize="8">1.0</text>
                      <line x1="0" x2="400" y1="18" y2="18" stroke="rgba(239,68,68,0.06)" strokeWidth="1" strokeDasharray="3" />
                      <text x="396" y="16" textAnchor="end" fill="rgba(239,68,68,0.12)" fontSize="8">1.26</text>
                      {calibrations.slice(0, 12).reverse().map((c: any, i: number, arr: any[]) => {
                        const x = arr.length > 1 ? 16 + (i / (arr.length - 1)) * 368 : 200;
                        const val = c.glycemia_value || 1;
                        const y = Math.max(5, Math.min(72, 68 - ((val - 0.5) / 1.5) * 60));
                        const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                        return (
                          <g key={i}>
                            {i > 0 && (() => { const prev = arr[i-1]; const px = 16+((i-1)/(arr.length-1))*368; const pv = prev.glycemia_value||1; const py = Math.max(5,Math.min(72,68-((pv-0.5)/1.5)*60)); return <line x1={px} y1={py} x2={x} y2={y} stroke={`${P}40`} strokeWidth="1.5" />; })()}
                            <circle cx={x} cy={y} r="4.5" fill={ptCol} opacity="0.85" />
                            <text x={x} y={y - 8} textAnchor="middle" fill={ptCol} fontSize="8" fontWeight="800">{val}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}
                {calibrations.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '12px 0 14px', fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Aucune mesure manuelle enregistree</div>
                )}

                {/* Input */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
                  <input data-testid="glycemia-input" type="number" step="0.01" placeholder="Glycemie en g/L (ex: 1.05)" value={calibValue} onChange={(e: any) => setCalibValue(e.target.value)} style={{ flex: 1, padding: '11px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none' } as any} />
                  <div data-testid="save-calibration" onClick={saveCalibration} style={{ padding: '11px 16px', borderRadius: 12, background: saving ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${P}, ${B})`, cursor: saving ? 'wait' : 'pointer', fontSize: 12, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 5 } as any}>
                    <i className="ri-add-line" style={{ fontSize: 14 }} />{saving ? '...' : 'Ajouter'}
                  </div>
                </div>

                {/* History button */}
                {calibrations.length > 0 && (
                  <div data-testid="show-history" onClick={() => setShowHistory(true)} style={{ textAlign: 'center', padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: P } as any}>
                    <i className="ri-history-line" style={{ fontSize: 13, marginRight: 6 }} />Voir l'historique detaille
                  </div>
                )}
              </div>
            </>
          )}

          {/* ══ POPUP HISTORIQUE (glass, profile-style) ══ */}
          {showHistory && (
            <div data-testid="history-popup" onClick={() => setShowHistory(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowHistory(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-drop-fill" style={{ fontSize: 26, color: P }} /></div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Historique glycemie</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{calibrations.length} mesure{calibrations.length > 1 ? 's' : ''} enregistree{calibrations.length > 1 ? 's' : ''}</div>
                </div>
                <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '12px 16px' } as any}>
                  {calibrations.map((c: any, i: number) => {
                    const val = c.glycemia_value || 0;
                    const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                    const d = new Date(c.date);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                          <span style={{ width: 8, height: 8, borderRadius: 4, background: ptCol } as any} />
                          <div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 17, fontWeight: 900, color: ptCol }}>{val} <span style={{ fontSize: 10, fontWeight: 600 }}>g/L</span></span>
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
