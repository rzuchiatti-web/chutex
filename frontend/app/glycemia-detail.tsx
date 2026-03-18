import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const P = '#A78BFA', G = '#10B981', GL_H = '#84CC16', A = '#F59E0B', O = '#F97316', R = '#EF4444', B = '#60A5FA';
const GL: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const META_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png';
const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

const ZONES_V2 = [
  { zone: 'Normal', range: '0.70 - 0.99 g/L', color: G, desc: 'Metabolisme glucidique sain.' },
  { zone: 'Normal haut', range: '0.90 - 1.05 g/L', color: GL_H, desc: 'Partie superieure de la norme. Surveillance recommandee.' },
  { zone: 'Vigilance', range: '1.00 - 1.25 g/L', color: A, desc: 'Pre-diabete potentiel. Controle medical conseille.' },
  { zone: 'Pre-alerte', range: '1.20 - 1.40 g/L', color: O, desc: 'Risque eleve. Bilan sanguin recommande rapidement.' },
  { zone: 'Alerte', range: '> 1.26 g/L', color: R, desc: 'Risque important. Bilan sanguin urgent.' },
];

export default function GlycemiaDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calibValue, setCalibValue] = useState('');
  const [calibContext, setCalibContext] = useState('random');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mlStatus, setMlStatus] = useState<any>(null);

  const fetchAll = () => {
    if (!token) return;
    Promise.all([
      apiFetch('/api/glycemia/estimate', {}, token),
      apiFetch('/api/glycemia/calibrations', {}, token),
    ]).then(([est, cal]) => { setData(est); setCalibrations(cal?.calibrations || []); })
      .catch(() => {}).finally(() => setLoading(false));
    apiFetch('/api/glycemia/ml-status', {}, token).then(ml => setMlStatus(ml)).catch(() => {});
  };
  useEffect(fetchAll, [token]);

  const saveCalibration = async () => {
    const v = parseFloat(calibValue.replace(',', '.'));
    if (!v || v <= 0 || v > 5) return;
    setSaving(true);
    try {
      await apiFetch('/api/glycemia/calibrate', { method: 'POST', body: JSON.stringify({ glycemia_value: v, context: calibContext }) }, token);
      setCalibValue('');
      fetchAll();
    } catch {} finally { setSaving(false); }
  };

  if (Platform.OS !== 'web') return null;
  const zc: Record<string, string> = { normal: G, normal_high: GL_H, vigilance: A, pre_alert: O, alert: R };
  const col = data ? (zc[data.zone] || A) : A;

  return (
    <div data-testid="glycemia-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Back */}
          <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 8 } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: P, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && data && (
            <>
              {/* Hero image */}
              <div style={{ textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 2 } as any}>
                <img src={META_IMG} alt="" style={{ width: 180, height: 180, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -45 } as any} />
              </div>

              {/* CARD 1: Zone + Estimated Value + Graph */}
              <div style={{ ...GL, padding: '56px 20px 20px', marginBottom: 14, position: 'relative', zIndex: 1 } as any}>
                {/* Zone + value */}
                <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Glycemie Estimee</div>
                  {data.estimated_glycemia && (
                    <div style={{ fontSize: 42, fontWeight: 900, color: '#FFF', lineHeight: 1, marginBottom: 6 }}>{data.estimated_glycemia} <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>g/L</span></div>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: `${col}18`, border: `1px solid ${col}30` } as any}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: col, boxShadow: `0 0 8px ${col}60` } as any} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: col }}>{data.zone_label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{data.estimated_range}</div>
                </div>

                {/* 5-zone gradient gauge */}
                <div style={{ margin: '0 -20px 16px', padding: '0 20px' } as any}>
                  <svg viewBox="0 0 400 80" style={{ width: '100%', height: 72, display: 'block' }}>
                    <defs>
                      <linearGradient id="glycGrad5" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={G} stopOpacity="0.3" />
                        <stop offset="25%" stopColor={GL_H} stopOpacity="0.25" />
                        <stop offset="45%" stopColor={A} stopOpacity="0.25" />
                        <stop offset="70%" stopColor={O} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={R} stopOpacity="0.3" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="18" width="400" height="32" rx="6" fill="url(#glycGrad5)" />
                    {/* 5 zone separators */}
                    {[100, 180, 260, 320].map((x, i) => <line key={i} x1={x} y1="18" x2={x} y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3" />)}
                    {/* Zone labels */}
                    <text x="50" y="12" textAnchor="middle" fill={G} fontSize="8" fontWeight="700" opacity="0.8">Normal</text>
                    <text x="140" y="12" textAnchor="middle" fill={GL_H} fontSize="8" fontWeight="700" opacity="0.8">Normal+</text>
                    <text x="220" y="12" textAnchor="middle" fill={A} fontSize="8" fontWeight="700" opacity="0.8">Vigilance</text>
                    <text x="290" y="12" textAnchor="middle" fill={O} fontSize="8" fontWeight="700" opacity="0.8">Pre-alerte</text>
                    <text x="360" y="12" textAnchor="middle" fill={R} fontSize="8" fontWeight="700" opacity="0.8">Alerte</text>
                    {/* Value labels */}
                    <text x="0" y="68" fill="rgba(255,255,255,0.2)" fontSize="8">0.70</text>
                    <text x="100" y="68" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8">1.00</text>
                    <text x="180" y="68" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8">1.10</text>
                    <text x="260" y="68" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="8">1.26</text>
                    <text x="400" y="68" textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8">1.80+</text>
                    {/* Indicator dot */}
                    {(() => {
                      const score = data.risk_score || 50;
                      const cx = Math.max(12, Math.min(388, (score / 100) * 400));
                      return <>
                        <circle cx={cx} cy="34" r="8" fill={col} opacity="0.15"><animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" /></circle>
                        <circle cx={cx} cy="34" r="5.5" fill={col} stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
                      </>;
                    })()}
                  </svg>
                </div>

                {/* 5 Zones explanation */}
                <div style={{ marginBottom: 0 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les 5 zones glycemiques</div>
                  {ZONES_V2.map((z, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                      <div style={{ width: 3, borderRadius: 2, background: z.color, flexShrink: 0 } as any} />
                      <div style={{ flex: 1 } as any}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: z.color }}>{z.zone}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>{z.range}</span>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{z.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 2: Viabilite de l'estimation (simple bar) */}
              <div style={{ ...GL, padding: '16px 20px', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                  <i className="ri-line-chart-line" style={{ fontSize: 14, color: '#FFF' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>Fiabilite de l'estimation</span>
                </div>
                {(() => {
                  // Honest viability: max 65% without collaborative ML
                  const calCount = data.calibration?.count || 0;
                  const dataPoints = data.data_points_used || 0;
                  let viability = 0;
                  if (dataPoints >= 3) viability = 15;
                  if (dataPoints >= 5) viability = 22;
                  if (dataPoints >= 8) viability = 28;
                  if (calCount >= 1) viability += 8;
                  if (calCount >= 3) viability += 10;
                  if (calCount >= 5) viability += 12;
                  viability = Math.min(65, viability);
                  const label = viability < 15 ? 'Insuffisante' : viability < 30 ? 'Initiale' : viability < 45 ? 'En amelioration' : 'Fiable';
                  const col = viability < 15 ? '#EF4444' : viability < 30 ? '#F59E0B' : viability < 45 ? '#84CC16' : '#10B981';
                  return <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>{viability}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 } as any}>
                      <div style={{ height: 8, borderRadius: 4, width: `${viability}%`, background: `linear-gradient(90deg, ${col}80, ${col})`, transition: 'width 0.5s' } as any} />
                    </div>
                  </>;
                })()}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  Plus vous portez votre bracelet et realisez des calibrations capillaires, plus l'estimation se rapproche de la realite. Ceci n'est pas un dispositif medical.
                </div>
              </div>

              {/* CARD 3: Que faire? (simple, no factors) */}
              <div style={{ ...GL, padding: '16px 20px', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 11, fontWeight: 900, color: P }}>N</span></div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Que faire ?</div>
                </div>
                <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.7, opacity: 0.85 }}>
                  {data.zone === 'normal' ? 'Tout va bien. Continuez votre mode de vie actuel et faites une calibration capillaire dans un mois pour confirmer.' :
                   data.zone === 'normal_high' ? 'Vos indicateurs sont dans la norme haute. Privilegiez les aliments a index glycemique bas et marchez 30 minutes par jour.' :
                   data.zone === 'vigilance' ? 'Consultez votre medecin pour un bilan sanguin (glycemie a jeun + HbA1c). Reduisez les sucres rapides.' :
                   data.zone === 'pre_alert' ? 'Un bilan sanguin est recommande rapidement. Contactez votre medecin traitant cette semaine.' :
                   'Consultez votre medecin des que possible pour un bilan complet (glycemie + HbA1c + bilan lipidique).'}
                </div>
              </div>

              {/* CARD 2: Calibration */}
              <div style={{ ...GL, padding: 20, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } as any}>
                  <i className="ri-drop-fill" style={{ fontSize: 18, color: R }} />
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Calibration capillaire</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{calibrations.length} mesure{calibrations.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 14, padding: '10px 12px', borderRadius: 12, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.1)' } as any}>
                  <i className="ri-information-line" style={{ fontSize: 13, color: P, marginRight: 6 }} />
                  Saisissez votre glycemie capillaire (piqure au doigt) <strong style={{ color: '#FFF' }}>1 fois par mois</strong> pour ameliorer la precision de l'estimation. Plus vous calibrez, plus Nora est precise.
                </div>

                {/* Calibration graph */}
                {calibrations.length > 0 && (
                  <div style={{ marginBottom: 14, padding: '12px', borderRadius: 14, background: 'rgba(0,0,0,0.15)' } as any}>
                    <svg viewBox="0 0 400 90" style={{ width: '100%', height: 80, display: 'block' }}>
                      <line x1="0" x2="400" y1="45" y2="45" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4" />
                      <text x="396" y="43" textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="8" fontWeight="600">1.0 g/L</text>
                      <line x1="0" x2="400" y1="22" y2="22" stroke="rgba(239,68,68,0.08)" strokeWidth="1" strokeDasharray="4" />
                      <text x="396" y="20" textAnchor="end" fill="rgba(239,68,68,0.15)" fontSize="8" fontWeight="600">1.26</text>
                      {calibrations.slice(0, 12).reverse().map((c: any, i: number, arr: any[]) => {
                        const x = arr.length > 1 ? 20 + (i / (arr.length - 1)) * 360 : 200;
                        const val = c.glycemia_value || 1;
                        const y = Math.max(6, Math.min(78, 72 - ((val - 0.5) / 1.5) * 64));
                        const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                        return (
                          <g key={i}>
                            {i > 0 && (() => { const prev = arr[i-1]; const px = 20+((i-1)/(arr.length-1))*360; const pv = prev.glycemia_value||1; const py = Math.max(6,Math.min(78,72-((pv-0.5)/1.5)*64)); return <line x1={px} y1={py} x2={x} y2={y} stroke={`${P}50`} strokeWidth="2" />; })()}
                            <circle cx={x} cy={y} r="5" fill={ptCol} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
                            <text x={x} y={y - 9} textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="800">{val}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}

                {/* Context selector */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 } as any}>
                  {[
                    { key: 'fasting', label: 'A jeun' },
                    { key: 'postprandial', label: 'Apres repas' },
                    { key: 'random', label: 'Aleatoire' },
                  ].map(ctx => (
                    <div key={ctx.key} onClick={() => setCalibContext(ctx.key)} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: calibContext === ctx.key ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${calibContext === ctx.key ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: calibContext === ctx.key ? P : 'rgba(255,255,255,0.35)' } as any}>{ctx.label}</div>
                  ))}
                </div>

                {/* Input + button — responsive */}
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <input data-testid="glycemia-input" type="number" step="0.01" placeholder="Ex: 1.05 g/L" value={calibValue} onChange={(e: any) => setCalibValue(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any} />
                  <div data-testid="save-calibration" onClick={saveCalibration} style={{ padding: '12px 18px', borderRadius: 12, background: saving ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: saving ? 'wait' : 'pointer', fontSize: 13, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, whiteSpace: 'nowrap' } as any}>
                    <i className="ri-add-line" style={{ fontSize: 15 }} />{saving ? '...' : 'Ajouter'}
                  </div>
                </div>

                {/* History */}
                {calibrations.length > 0 && (
                  <div data-testid="show-history" onClick={() => setShowHistory(true)} style={{ textAlign: 'center', padding: '10px', marginTop: 10, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: P } as any}>
                    <i className="ri-history-line" style={{ fontSize: 13, marginRight: 6 }} />Voir l'historique
                  </div>
                )}
              </div>
            </>
          )}

          {/* History popup */}
          {showHistory && (
            <div data-testid="history-popup" onClick={() => setShowHistory(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowHistory(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Historique glycemie</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{calibrations.length} mesure{calibrations.length > 1 ? 's' : ''}</div>
                </div>
                <div style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '12px 16px' } as any}>
                  {calibrations.map((c: any, i: number) => {
                    const val = c.glycemia_value || 0;
                    const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                    const d = new Date(c.date);
                    const ctxLabels: Record<string, string> = { fasting: 'A jeun', postprandial: 'Apres repas', random: '' };
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                          <span style={{ width: 8, height: 8, borderRadius: 4, background: ptCol } as any} />
                          <div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
                            {c.context && ctxLabels[c.context] && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{ctxLabels[c.context]}</div>}
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

          {/* ═══════ ML DASHBOARD ═══════ */}
          {mlStatus && (
            <div data-testid="ml-dashboard" style={{ padding: '28px 20px 120px' } as any}>
              <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 12 } as any}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: P } as any} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: P }}>Machine Learning</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Moteur d'estimation IA</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{mlStatus.architecture}</div>
              </div>

              {/* Model Status */}
              <div data-testid="ml-model-status" style={{ ...GL, padding: '18px', marginBottom: 12 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className="ri-brain-line" style={{ fontSize: 20, color: P }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Modele {mlStatus.population_model?.version}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Entraine sur {mlStatus.population_model?.training_samples?.toLocaleString()} echantillons</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: mlStatus.population_model?.trained ? G : R, boxShadow: mlStatus.population_model?.trained ? `0 0 8px ${G}60` : 'none' } as any} />
                </div>

                {/* 3 Levels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                  {mlStatus.levels?.map((level: any, i: number) => {
                    const isActive = level.status === 'active';
                    const levelColors = [P, B, G];
                    const lc = levelColors[i] || P;
                    return (
                      <div key={i} data-testid={`ml-level-${level.level}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: isActive ? `${lc}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? `${lc}20` : 'rgba(255,255,255,0.04)'}`, transition: 'all 0.3s' } as any}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: isActive ? `${lc}15` : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: isActive ? lc : 'rgba(255,255,255,0.2)' }}>{level.level}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 } as any}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#FFF' : 'rgba(255,255,255,0.3)' }}>{level.name}</div>
                          <div style={{ fontSize: 10, color: isActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as any}>{level.description}</div>
                        </div>
                        <div style={{ padding: '3px 10px', borderRadius: 999, background: isActive ? `${lc}15` : 'rgba(255,255,255,0.04)', border: `1px solid ${isActive ? `${lc}25` : 'rgba(255,255,255,0.06)'}`, flexShrink: 0 } as any}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? lc : 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{level.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feature Importances */}
              {mlStatus.feature_importances?.length > 0 && (
                <div data-testid="ml-feature-importances" style={{ ...GL, padding: '18px', marginBottom: 12 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Importance des facteurs</div>
                  {mlStatus.feature_importances.map((f: any, i: number) => {
                    const LABELS: Record<string, string> = {
                      hrv_norm: 'HRV normalise', has_diabetes_risk: 'Risque diabete', visceral_fat: 'Graisse viscerale',
                      muscle_fat_ratio: 'Ratio muscle/graisse', stress_level: 'Stress', bmi: 'IMC',
                      spo2: 'SpO2', hour_of_day: 'Heure', sleep_quality: 'Sommeil', heart_rate: 'Freq. cardiaque',
                      hrv: 'HRV', body_fat_pct: 'Masse grasse', muscle_pct: 'Masse musculaire',
                      water_pct: 'Hydratation', temperature: 'Temperature', activity_level: 'Activite',
                    };
                    const barColors = [P, '#818CF8', '#6366F1', '#4F46E5', '#4338CA', '#3730A3', '#312E81', '#1E1B4B', '#A78BFA', '#C4B5FD'];
                    const bc = barColors[i] || P;
                    const maxImportance = mlStatus.feature_importances[0]?.importance || 30;
                    const pct = Math.max(4, (f.importance / maxImportance) * 100);
                    return (
                      <div key={f.feature} style={{ marginBottom: i < mlStatus.feature_importances.length - 1 ? 10 : 0 } as any}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 } as any}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{LABELS[f.feature] || f.feature}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: bc }}>{f.importance}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}>
                          <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg, ${bc}, ${bc}80)`, transition: 'width 0.8s ease', boxShadow: `0 0 8px ${bc}30` } as any} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Personal Model Status */}
              <div data-testid="ml-personal-status" style={{ ...GL, padding: '18px', marginBottom: 12 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: mlStatus.personal_model?.available ? 'rgba(16,185,129,0.12)' : 'rgba(96,165,250,0.12)', border: `1px solid ${mlStatus.personal_model?.available ? 'rgba(16,185,129,0.2)' : 'rgba(96,165,250,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={mlStatus.personal_model?.available ? 'ri-user-star-line' : 'ri-user-add-line'} style={{ fontSize: 18, color: mlStatus.personal_model?.available ? G : B }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Modele personnel</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {mlStatus.personal_model?.available
                        ? 'Actif — adapte a votre profil'
                        : mlStatus.personal_model?.calibrations_needed > 0
                          ? `${mlStatus.personal_model.calibrations_needed} calibration${mlStatus.personal_model.calibrations_needed > 1 ? 's' : ''} restante${mlStatus.personal_model.calibrations_needed > 1 ? 's' : ''} pour activer`
                          : 'Pret a etre entraine'}
                    </div>
                  </div>
                </div>
                {/* Calibration progress */}
                <div style={{ marginBottom: 8 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 } as any}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Calibrations</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{mlStatus.personal_model?.calibrations_count || 0} / 5 minimum</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(100, ((mlStatus.personal_model?.calibrations_count || 0) / 5) * 100)}%`, background: mlStatus.personal_model?.available ? `linear-gradient(90deg, ${G}, ${G}80)` : `linear-gradient(90deg, ${B}, ${B}80)`, transition: 'width 0.8s ease' } as any} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
                  Le modele personnel s'adapte a votre metabolisme unique. Plus vous calibrez, plus l'estimation est precise.
                  {!mlStatus.personal_model?.available && ' Les calibrations capillaires (piqure au doigt) sont optionnelles mais ameliorent la precision.'}
                </div>
              </div>

              {/* Data quality indicator */}
              {data && (
                <div data-testid="ml-data-quality" style={{ ...GL, padding: '18px' } as any}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Qualite des donnees</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 } as any}>
                    {[
                      { label: 'Capteurs', value: `${data.data_points_used || 0}/12`, pct: ((data.data_points_used || 0) / 12) * 100, color: data.data_points_used >= 10 ? G : data.data_points_used >= 6 ? A : R },
                      { label: 'Confiance', value: `${data.confidence_pct || 0}%`, pct: data.confidence_pct || 0, color: (data.confidence_pct || 0) >= 70 ? G : (data.confidence_pct || 0) >= 50 ? A : R },
                      { label: 'Precision', value: data.prediction_interval ? `${((data.prediction_interval.upper - data.prediction_interval.lower) * 1000).toFixed(0)} mg` : '--', pct: data.prediction_interval ? Math.max(0, 100 - (data.prediction_interval.upper - data.prediction_interval.lower) * 500) : 0, color: data.prediction_interval && (data.prediction_interval.upper - data.prediction_interval.lower) < 0.15 ? G : A },
                    ].map((q, i) => (
                      <div key={i} style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: q.color, marginBottom: 4 }}>{q.value}</div>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 4 } as any}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, q.pct)}%`, background: q.color, transition: 'width 0.8s ease' } as any} />
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{q.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
