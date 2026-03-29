import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NoraOverlay, { NoraButton } from '../src/components/dashboard/NoraOverlay';

const P = '#A78BFA', G = '#10B981', GL_H = '#84CC16', A = '#F59E0B', O = '#F97316', R = '#EF4444', B = '#60A5FA';
const META_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png';
const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';

const ZONES_V2 = [
  { zone: 'Normal', range: '0.70 - 0.99 g/L', color: G, desc: 'Metabolisme glucidique sain.' },
  { zone: 'Normal haut', range: '0.90 - 1.05 g/L', color: GL_H, desc: 'Partie superieure de la norme. Surveillance recommandee.' },
  { zone: 'Vigilance', range: '1.00 - 1.25 g/L', color: A, desc: 'Pre-diabete potentiel. Controle medical conseille.' },
  { zone: 'Pre-alerte', range: '1.20 - 1.40 g/L', color: O, desc: 'Risque eleve. Bilan sanguin recommande rapidement.' },
  { zone: 'Alerte', range: '> 1.26 g/L', color: R, desc: 'Risque important. Bilan sanguin urgent.' },
];

const GLYCEMIA_EXPLANATIONS: Record<string, { icon: string; color: string; title: string; desc: string; ranges: { label: string; value: string; color: string }[]; tip: string }> = {
  estimation: {
    icon: 'ri-pulse-line', color: '#A78BFA',
    title: 'Glycemie estimee',
    desc: "Votre glycemie est estimee en combinant les donnees de votre bracelet (frequence cardiaque, variabilite, temperature, activite) avec un modele d'intelligence artificielle entraine sur des milliers de profils metaboliques. Le resultat est une approximation indicative, pas un diagnostic medical.",
    ranges: [
      { label: 'Normal', value: '0.70 - 0.99 g/L', color: G },
      { label: 'Normal haut', value: '0.90 - 1.05 g/L', color: GL_H },
      { label: 'Vigilance', value: '1.00 - 1.25 g/L', color: A },
      { label: 'Pre-alerte', value: '1.20 - 1.40 g/L', color: O },
      { label: 'Alerte', value: '> 1.26 g/L', color: R },
    ],
    tip: "Pour obtenir une valeur exacte, faites un bilan sanguin (glycemie a jeun) prescrit par votre medecin. Notre estimation s'affine avec chaque calibration capillaire.",
  },
  fiabilite: {
    icon: 'ri-line-chart-line', color: '#60A5FA',
    title: 'Fiabilite de l\'estimation',
    desc: "Le score de fiabilite reflète la precision de l'estimation glycemique. Il augmente avec : le nombre de donnees captees par le bracelet, le nombre de calibrations capillaires realisees, et la regularite du port du bracelet. Sans calibration, l'estimation reste tres approximative.",
    ranges: [
      { label: 'Insuffisante', value: '< 15%', color: R },
      { label: 'Initiale', value: '15 - 29%', color: A },
      { label: 'En amelioration', value: '30 - 44%', color: GL_H },
      { label: 'Fiable', value: '45%+', color: G },
    ],
    tip: "Portez votre bracelet en continu et realisez une calibration capillaire (piqure au doigt) une fois par mois. Chaque calibration ameliore significativement la precision du modele.",
  },
  calibration: {
    icon: 'ri-drop-fill', color: '#EF4444',
    title: 'Calibration capillaire',
    desc: "La calibration consiste a mesurer votre glycemie reelle via une goutte de sang au bout du doigt (lecteur de glycemie). En comparant cette valeur reelle aux donnees estimees par le bracelet, notre algorithme s'ajuste et affine ses predictions pour votre profil unique.",
    ranges: [
      { label: 'Idealement a jeun', value: 'Le matin', color: P },
      { label: 'Apres repas', value: '2h apres', color: A },
      { label: 'Frequence', value: '1x / mois', color: G },
    ],
    tip: "Privilegiez les mesures a jeun le matin pour des valeurs de reference. Indiquez toujours le contexte (a jeun, apres repas) pour une meilleure calibration. Nettoyez votre doigt avant la piqure.",
  },
};

export default function GlycemiaDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calibValue, setCalibValue] = useState('');
  const [showNoraGlycemia, setShowNoraGlycemia] = useState(false);
  const [calibContext, setCalibContext] = useState('random');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [explainKey, setExplainKey] = useState<string | null>(null);

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
      await apiFetch('/api/glycemia/calibrate', { method: 'POST', body: JSON.stringify({ glycemia_value: v, context: calibContext }) }, token);
      setCalibValue('');
      fetchAll();
    } catch {} finally { setSaving(false); }
  };

  if (Platform.OS !== 'web') return null;
  const zc: Record<string, string> = { normal: G, normal_high: GL_H, vigilance: A, pre_alert: O, alert: R };
  const col = data ? (zc[data.zone] || A) : A;

  return (
    <div data-testid="glycemia-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER with BG image */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 220 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 70px', maxWidth: 480, margin: '0 auto' } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
            <div style={{ textAlign: 'center', marginTop: 12 } as any}>
              <img src={META_IMG} alt="" style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))' } as any} />
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginTop: 8 }}>Glycemie</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Estimation et suivi glycemique</div>
            </div>
          </div>
        </div>

        {/* WHITE CONTENT CARD */}
        <div style={{ padding: '24px 16px 120px', marginTop: -24, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-24px auto 0', width: '100%' } as any}>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: P, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && data && (
            <>
              {/* Nora Glycemia Analysis */}
              <NoraButton label="Analyse glycemique" sublabel="Analyse par Nora de votre glycemie" onClick={() => setShowNoraGlycemia(true)} />

              {/* CARD 1: Zone + Estimated Value + Graph */}
              <div data-testid="glycemia-estimation-card" style={{ padding: '20px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
                <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 } as any}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Glycemie Estimee</div>
                    <div data-testid="explain-estimation-btn" onClick={() => setExplainKey('estimation')} style={{ width: 26, height: 26, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as any}>
                      <i className="ri-information-line" style={{ fontSize: 13, color: P }} />
                    </div>
                  </div>
                  {data.estimated_glycemia && (
                    <div style={{ fontSize: 42, fontWeight: 900, color: '#111', lineHeight: 1, marginBottom: 6 }}>{data.estimated_glycemia} <span style={{ fontSize: 16, fontWeight: 600, color: '#9CA3AF' }}>g/L</span></div>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: `${col}18`, border: `1px solid ${col}30` } as any}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: col, boxShadow: `0 0 8px ${col}60` } as any} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: col }}>{data.zone_label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>{data.estimated_range}</div>
                </div>

                {/* 5-zone gradient gauge */}
                <div style={{ margin: '0 -20px 16px', padding: '0 20px' } as any}>
                  <svg viewBox="0 0 400 80" style={{ width: '100%', height: 72, display: 'block' }}>
                    <defs>
                      <linearGradient id="glycGrad5" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={G} stopOpacity="0.25" />
                        <stop offset="25%" stopColor={GL_H} stopOpacity="0.2" />
                        <stop offset="45%" stopColor={A} stopOpacity="0.2" />
                        <stop offset="70%" stopColor={O} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={R} stopOpacity="0.25" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="18" width="400" height="32" rx="6" fill="url(#glycGrad5)" />
                    {[100, 180, 260, 320].map((x, i) => <line key={i} x1={x} y1="18" x2={x} y2="50" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3" />)}
                    <text x="50" y="12" textAnchor="middle" fill={G} fontSize="8" fontWeight="700">Normal</text>
                    <text x="140" y="12" textAnchor="middle" fill={GL_H} fontSize="8" fontWeight="700">Normal+</text>
                    <text x="220" y="12" textAnchor="middle" fill={A} fontSize="8" fontWeight="700">Vigilance</text>
                    <text x="290" y="12" textAnchor="middle" fill={O} fontSize="8" fontWeight="700">Pre-alerte</text>
                    <text x="360" y="12" textAnchor="middle" fill={R} fontSize="8" fontWeight="700">Alerte</text>
                    <text x="0" y="68" fill="#9CA3AF" fontSize="8">0.70</text>
                    <text x="100" y="68" textAnchor="middle" fill="#9CA3AF" fontSize="8">1.00</text>
                    <text x="180" y="68" textAnchor="middle" fill="#9CA3AF" fontSize="8">1.10</text>
                    <text x="260" y="68" textAnchor="middle" fill="#9CA3AF" fontSize="8">1.26</text>
                    <text x="400" y="68" textAnchor="end" fill="#9CA3AF" fontSize="8">1.80+</text>
                    {(() => {
                      const score = data.risk_score || 50;
                      const cx = Math.max(12, Math.min(388, (score / 100) * 400));
                      return <>
                        <circle cx={cx} cy="34" r="8" fill={col} opacity="0.15"><animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" /></circle>
                        <circle cx={cx} cy="34" r="5.5" fill={col} stroke="#FFF" strokeWidth="2" />
                      </>;
                    })()}
                  </svg>
                </div>

                {/* 5 Zones explanation */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les 5 zones glycemiques</div>
                  {ZONES_V2.map((z, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' } as any}>
                      <div style={{ width: 3, borderRadius: 2, background: z.color, flexShrink: 0 } as any} />
                      <div style={{ flex: 1 } as any}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: z.color }}>{z.zone}</span>
                        <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 6 }}>{z.range}</span>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{z.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 2: Fiabilite */}
              <div data-testid="glycemia-fiabilite-card" style={{ padding: '16px 20px', borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                  <i className="ri-line-chart-line" style={{ fontSize: 14, color: '#111' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#111' }}>Fiabilite de l'estimation</span>
                  <div data-testid="explain-fiabilite-btn" onClick={() => setExplainKey('fiabilite')} style={{ width: 26, height: 26, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as any}>
                    <i className="ri-information-line" style={{ fontSize: 13, color: B }} />
                  </div>
                </div>
                {(() => {
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
                  const vCol = viability < 15 ? R : viability < 30 ? A : viability < 45 ? GL_H : G;
                  return <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: vCol }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{viability}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden', marginBottom: 10 } as any}>
                      <div style={{ height: 8, borderRadius: 4, width: `${viability}%`, background: `linear-gradient(90deg, ${vCol}80, ${vCol})`, transition: 'width 0.5s' } as any} />
                    </div>
                  </>;
                })()}
                <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
                  Plus vous portez votre bracelet et realisez des calibrations capillaires, plus l'estimation se rapproche de la realite. Ceci n'est pas un dispositif medical.
                </div>
              </div>

              {/* CARD 3: Calibration */}
              <div data-testid="glycemia-calibration-card" style={{ padding: 20, borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } as any}>
                  <i className="ri-drop-fill" style={{ fontSize: 18, color: R }} />
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Calibration capillaire</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{calibrations.length} mesure{calibrations.length !== 1 ? 's' : ''}</div>
                  </div>
                  <div data-testid="explain-calibration-btn" onClick={() => setExplainKey('calibration')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as any}>
                    <i className="ri-information-line" style={{ fontSize: 14, color: R }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.7, marginBottom: 14, padding: '10px 12px', borderRadius: 12, background: `${P}08`, border: `1px solid ${P}15` } as any}>
                  <i className="ri-information-line" style={{ fontSize: 13, color: P, marginRight: 6 }} />
                  Saisissez votre glycemie capillaire (piqure au doigt) <strong style={{ color: '#111' }}>1 fois par mois</strong> pour ameliorer la precision de l'estimation.
                </div>

                {/* Calibration graph */}
                {calibrations.length > 0 && (
                  <div style={{ marginBottom: 14, padding: '12px', borderRadius: 14, background: '#FFF' } as any}>
                    <svg viewBox="0 0 400 90" style={{ width: '100%', height: 80, display: 'block' }}>
                      <line x1="0" x2="400" y1="45" y2="45" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="4" />
                      <text x="396" y="43" textAnchor="end" fill="#9CA3AF" fontSize="8" fontWeight="600">1.0 g/L</text>
                      <line x1="0" x2="400" y1="22" y2="22" stroke="rgba(239,68,68,0.12)" strokeWidth="1" strokeDasharray="4" />
                      <text x="396" y="20" textAnchor="end" fill="rgba(239,68,68,0.3)" fontSize="8" fontWeight="600">1.26</text>
                      {calibrations.slice(0, 12).reverse().map((c: any, i: number, arr: any[]) => {
                        const x = arr.length > 1 ? 20 + (i / (arr.length - 1)) * 360 : 200;
                        const val = c.glycemia_value || 1;
                        const y = Math.max(6, Math.min(78, 72 - ((val - 0.5) / 1.5) * 64));
                        const ptCol = val < 1.0 ? G : val < 1.26 ? A : R;
                        return (
                          <g key={i}>
                            {i > 0 && (() => { const prev = arr[i-1]; const px = 20+((i-1)/(arr.length-1))*360; const pv = prev.glycemia_value||1; const py = Math.max(6,Math.min(78,72-((pv-0.5)/1.5)*64)); return <line x1={px} y1={py} x2={x} y2={y} stroke={`${P}50`} strokeWidth="2" />; })()}
                            <circle cx={x} cy={y} r="5" fill={ptCol} stroke="#FFF" strokeWidth="1.5" />
                            <text x={x} y={y - 9} textAnchor="middle" fill="#111" fontSize="9" fontWeight="800">{val}</text>
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
                    <div key={ctx.key} onClick={() => setCalibContext(ctx.key)} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: calibContext === ctx.key ? `${P}12` : '#FFF', border: `1px solid ${calibContext === ctx.key ? `${P}25` : '#E5E7EB'}`, textAlign: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: calibContext === ctx.key ? P : '#9CA3AF' } as any}>{ctx.label}</div>
                  ))}
                </div>

                {/* Input + button */}
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <input data-testid="glycemia-input" type="number" step="0.01" placeholder="Ex: 1.05 g/L" value={calibValue} onChange={(e: any) => setCalibValue(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '12px 14px', borderRadius: 12, background: '#FFF', border: '1px solid #E5E7EB', color: '#111', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any} />
                  <div data-testid="save-calibration" onClick={saveCalibration} style={{ padding: '12px 18px', borderRadius: 999, background: saving ? '#E5E7EB' : '#111', cursor: saving ? 'wait' : 'pointer', fontSize: 13, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, whiteSpace: 'nowrap' } as any}>
                    <i className="ri-add-line" style={{ fontSize: 15 }} />{saving ? '...' : 'Ajouter'}
                  </div>
                </div>

                {/* History link */}
                {calibrations.length > 0 && (
                  <div data-testid="show-history" onClick={() => setShowHistory(true)} style={{ textAlign: 'center', padding: '10px', marginTop: 10, borderRadius: 999, background: '#FFF', border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: P } as any}>
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
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes popIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes pulseGlow{0%,100%{box-shadow:0 0 8px rgba(167,139,250,0.2)}50%{box-shadow:0 0 24px rgba(167,139,250,0.4)}}` }} />

      {/* Glycemia Explain Popup — dark glass overlay */}
      {explainKey && (() => {
        const e = GLYCEMIA_EXPLANATIONS[explainKey];
        if (!e) return null;
        return (
          <div data-testid="glycemia-explain-popup" onClick={() => setExplainKey(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.82)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
            <div onClick={(ev: any) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
              <div onClick={() => setExplainKey(null)} style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} />
              </div>
              {/* Icon + Title */}
              <div style={{ textAlign: 'center', marginBottom: 32, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
                <div style={{ width: 72, height: 72, borderRadius: 22, background: `${e.color}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', animation: 'pulseGlow 3s ease-in-out infinite' } as any}>
                  <i className={e.icon} style={{ fontSize: 32, color: e.color }} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginTop: 18, letterSpacing: -0.5 }}>{e.title}</div>
              </div>
              {/* Description */}
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: 32, animation: 'slideUp 0.4s ease 0.2s both' } as any}>{e.desc}</div>
              {/* Reference values */}
              <div style={{ marginBottom: 32, animation: 'slideUp 0.4s ease 0.3s both' } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Valeurs de reference</div>
                {e.ranges.map((r, ri) => (
                  <div key={ri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: ri < e.ranges.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color, boxShadow: `0 0 8px ${r.color}60` } as any} />
                      <span style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{r.label}</span>
                    </div>
                    <span style={{ fontSize: 14, color: r.color, fontWeight: 800 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {/* Tip */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', animation: 'slideUp 0.4s ease 0.4s both' } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-lightbulb-line" style={{ fontSize: 18, color: '#F59E0B' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Conseil</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{e.tip}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showNoraGlycemia && <NoraOverlay token={token} endpoint="/api/nora/page-analysis?context=glycemia" title="Analyse glycemique" subtitle="Analyse par Nora de votre glycemie" onClose={() => setShowNoraGlycemia(false)} />}
    </div>
  );
}
