import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const SECTIONS: Record<string, { title: string; color: string; img: string; metrics: { key: string; label: string; unit: string; explain: string }[] }> = {
  cardio: {
    title: 'Sante cardiaque', color: '#EF4444',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/8x2d3bbk_hearth%20red%20app%20healthbeat%20Chutex.png',
    metrics: [
      { key: 'heart_rate', label: 'Frequence cardiaque', unit: 'bpm', explain: 'Le nombre de battements par minute au repos. Un pouls entre 60 et 80 bpm est considere comme sain.' },
      { key: 'hrv', label: 'Variabilite cardiaque (HRV)', unit: 'ms', explain: 'Mesure la variation entre les battements. Un HRV eleve indique une bonne capacite d\'adaptation au stress.' },
      { key: 'bp_display', label: 'Tension arterielle', unit: 'mmHg', explain: 'Pression du sang dans les arteres. Une tension normale est autour de 120/80 mmHg.' },
      { key: 'spo2', label: 'Saturation en oxygene (SpO2)', unit: '%', explain: 'Taux d\'oxygene dans le sang. Au-dessus de 95% est normal.' },
      { key: 'vo2_max', label: 'VO2 Max', unit: 'ml/kg/min', explain: 'Capacite maximale d\'utilisation de l\'oxygene a l\'effort. Plus elle est elevee, meilleure est votre condition cardio.' },
      { key: 'temperature', label: 'Temperature corporelle', unit: '°C', explain: 'La temperature normale est entre 36.5 et 37.5°C. Des variations peuvent indiquer une inflammation ou une infection.' },
    ],
  },
  metabolism: {
    title: 'Sante metabolique', color: '#F59E0B',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png',
    metrics: [
      { key: 'glycemia', label: 'Glycemie', unit: 'g/L', explain: 'Taux de sucre dans le sang. A jeun, une glycemie normale est entre 0.7 et 1.1 g/L.' },
      { key: 'bmi', label: 'Indice de masse corporelle (IMC)', unit: '', explain: 'Rapport poids/taille. Normal entre 18.5 et 25. Au-dessus de 25 : surpoids.' },
      { key: 'visceral_fat', label: 'Graisse viscerale', unit: '', explain: 'Graisse autour des organes internes. Un indice inferieur a 10 est sain.' },
      { key: 'waist_hip_ratio', label: 'Ratio taille-hanche', unit: '', explain: 'Indicateur de repartition des graisses. Inferieur a 0.90 (homme) ou 0.85 (femme) est ideal.' },
      { key: 'body_age', label: 'Age corporel', unit: 'ans', explain: 'Age biologique estime par la balance, base sur votre composition corporelle.' },
      { key: 'body_type', label: 'Type corporel', unit: '', explain: 'Classification de votre morphologie basee sur le rapport graisse/muscle.' },
      { key: 'obesity_degree', label: 'Degre d\'obesite', unit: '', explain: 'Evaluation du niveau d\'adiposite par rapport aux normes de sante.' },
      { key: 'recommended_calories', label: 'Apport calorique recommande', unit: 'kcal', explain: 'Nombre de calories a consommer par jour pour maintenir votre poids actuel.' },
      { key: 'ideal_weight', label: 'Poids ideal', unit: 'kg', explain: 'Poids optimal calcule selon votre taille et votre morphologie.' },
      { key: 'weight_control', label: 'Controle du poids', unit: 'kg', explain: 'Ecart entre votre poids actuel et votre poids de reference. Negatif = a perdre, positif = a prendre.' },
    ],
  },
  sleep: {
    title: 'Sommeil', color: '#A78BFA',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/xtzgjs5s_sommeil.png',
    metrics: [],
  },
  activity: {
    title: 'Sante physique & Activite', color: '#10B981',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png',
    metrics: [
      { key: 'steps', label: 'Nombre de pas', unit: 'pas', explain: 'Objectif recommande : 6000 a 10000 pas par jour pour maintenir une bonne sante.' },
      { key: 'calories', label: 'Depense energetique', unit: 'kcal', explain: 'Calories brulees par l\'activite physique aujourd\'hui.' },
      { key: 'distance_km', label: 'Distance parcourue', unit: 'km', explain: 'Distance totale estimee a partir du nombre de pas.' },
      { key: 'vo2_max', label: 'VO2 Max', unit: 'ml/kg/min', explain: 'Capacite aerobique maximale. Un bon indicateur de forme physique globale.' },
      { key: 'stress_level', label: 'Niveau de stress', unit: '/100', explain: 'Mesure par le bracelet via le HRV. En dessous de 40 est un bon niveau.' },
      { key: 'basal_metabolism', label: 'Metabolisme de base (BMR)', unit: 'kcal', explain: 'Energie depensee au repos pour maintenir les fonctions vitales.' },
      { key: 'recommended_calories', label: 'Apport calorique recommande', unit: 'kcal', explain: 'Calories a consommer en fonction de votre activite et de vos objectifs.' },
    ],
  },
  composition: {
    title: 'Composition corporelle', color: '#F97316',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/3yq7hxyr_composition%281%29.png',
    metrics: [
      { key: 'weight', label: 'Poids', unit: 'kg', explain: 'Votre poids total. A interpreter avec la composition corporelle.' },
      { key: 'body_fat_pct', label: 'Pourcentage de graisse', unit: '%', explain: 'Part de graisse dans le corps. Normal : 15-25% homme, 20-30% femme.' },
      { key: 'fat_mass_kg', label: 'Masse grasse', unit: 'kg', explain: 'Poids total de la graisse corporelle.' },
      { key: 'muscle_pct', label: 'Pourcentage musculaire', unit: '%', explain: 'Part de muscle dans le corps. Plus il est eleve, meilleur est le metabolisme.' },
      { key: 'muscle_mass_kg', label: 'Masse musculaire', unit: 'kg', explain: 'Poids total des muscles.' },
      { key: 'protein_pct', label: 'Taux de proteine', unit: '%', explain: 'Pourcentage de proteines. Important pour la reparation musculaire.' },
      { key: 'skeletal_muscle_pct', label: 'Muscle squelettique', unit: '%', explain: 'Muscles attaches aux os, responsables du mouvement.' },
      { key: 'skeletal_muscle_quality', label: 'Qualite musculaire', unit: '/100', explain: 'Indice de qualite des fibres musculaires squelettiques.' },
      { key: 'bone_mass_kg', label: 'Masse osseuse', unit: 'kg', explain: 'Poids des mineraux osseux. Important pour prevenir l\'osteoporose.' },
      { key: 'minerals_kg', label: 'Mineraux', unit: 'kg', explain: 'Masse totale de mineraux dans le corps.' },
      { key: 'water_pct', label: 'Taux d\'hydratation', unit: '%', explain: 'Pourcentage d\'eau dans le corps. Normal entre 50% et 65%.' },
      { key: 'total_body_water_kg', label: 'Eau corporelle totale', unit: 'kg', explain: 'Masse totale d\'eau dans votre organisme.' },
      { key: 'intracellular_water_kg', label: 'Eau intracellulaire', unit: 'kg', explain: 'Eau contenue a l\'interieur des cellules.' },
      { key: 'extracellular_water_kg', label: 'Eau extracellulaire', unit: 'kg', explain: 'Eau dans le sang, la lymphe et les espaces intercellulaires.' },
      { key: 'subcutaneous_fat_pct', label: 'Graisse sous-cutanee', unit: '%', explain: 'Graisse situee juste sous la peau.' },
      { key: 'trunk_fat_kg', label: 'Graisse du tronc', unit: 'kg', explain: 'Graisse accumulee dans la region abdominale.' },
      { key: 'left_arm_fat_pct', label: 'Graisse bras gauche', unit: '%', explain: 'Repartition de la graisse dans le bras gauche.' },
      { key: 'right_arm_fat_pct', label: 'Graisse bras droit', unit: '%', explain: 'Repartition de la graisse dans le bras droit.' },
      { key: 'left_arm_muscle_pct', label: 'Muscle bras gauche', unit: '%', explain: 'Masse musculaire du bras gauche.' },
      { key: 'right_arm_muscle_pct', label: 'Muscle bras droit', unit: '%', explain: 'Masse musculaire du bras droit.' },
      { key: 'left_leg_fat_pct', label: 'Graisse jambe gauche', unit: '%', explain: 'Repartition de la graisse dans la jambe gauche.' },
      { key: 'right_leg_fat_pct', label: 'Graisse jambe droite', unit: '%', explain: 'Repartition de la graisse dans la jambe droite.' },
      { key: 'left_leg_muscle_kg', label: 'Muscle jambe gauche', unit: 'kg', explain: 'Masse musculaire de la jambe gauche.' },
      { key: 'right_leg_muscle_kg', label: 'Muscle jambe droite', unit: 'kg', explain: 'Masse musculaire de la jambe droite.' },
    ],
  },
};

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function HealthDetailScreen() {
  const { metricId } = useLocalSearchParams<{ metricId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try { setReport(await apiFetch('/api/health/daily-report', {}, token)); } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  const sec = SECTIONS[metricId || ''] || SECTIONS.cardio;
  const d = report?.data || {};
  const subs = report?.subscores || {};
  const subScore = subs[metricId || '']?.score;

  const getValue = (key: string) => {
    if (key === 'bp_display') return `${d.blood_pressure?.systolic || '--'}/${d.blood_pressure?.diastolic || '--'}`;
    if (key === 'sleep_duration') { const m = d.sleep_duration_min || 0; return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}min`; }
    const v = d[key];
    if (v === undefined || v === null) return '--';
    if (typeof v === 'number') return v % 1 === 0 ? v.toLocaleString() : v.toFixed(1);
    return String(v);
  };

  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Page disponible sur le web</Text></View>;
  }

  if (loading) return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a' } as any}>
      <div style={{ textAlign: 'center' } as any}><i className="ri-loader-4-line" style={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>Chargement...</div></div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 20 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Retour</span>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <img src={sec.img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' } as any} />
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{sec.title}</div>
          {subScore != null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: `${sec.color}15`, border: `1px solid ${sec.color}30`, marginTop: 10 } as any}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: subScore >= 80 ? '#10B981' : subScore >= 60 ? '#F59E0B' : '#EF4444' } as any} />
              <span style={{ fontSize: 13, fontWeight: 800, color: subScore >= 80 ? '#10B981' : subScore >= 60 ? '#F59E0B' : '#EF4444' }}>{subScore}/100</span>
            </div>
          )}
        </div>

        {/* Sleep section: Hypnogram hero + apnea risk */}
        {metricId === 'sleep' && d.sleep_duration_min && (() => {
          const slD = d.sleep_duration_min || 443;
          const slQ = d.sleep_quality || 82;
          const deep = d.deep_sleep_min || 130;
          const light = d.light_sleep_min || 245;
          const rem = d.rem_sleep_min || 68;
          const inter = d.sleep_interruptions || 2;
          const total = deep + light + rem;
          const apneaRisk = Math.min(100, Math.max(5, inter * 12 + (slQ < 70 ? 20 : 0)));
          const phases: number[] = [];
          for (let i = 0; i < 48; i++) {
            const t = i / 48;
            if (t < 0.03 || t > 0.97) phases.push(0);
            else if (t < 0.08) phases.push(2);
            else if (t < 0.18) phases.push(3);
            else if (t < 0.22) phases.push(2);
            else if (t < 0.28) phases.push(1);
            else if (t < 0.32) phases.push(0);
            else if (t < 0.42) phases.push(3);
            else if (t < 0.50) phases.push(2);
            else if (t < 0.58) phases.push(1);
            else if (t < 0.65) phases.push(2);
            else if (t < 0.72) phases.push(3);
            else if (t < 0.80) phases.push(2);
            else if (t < 0.88) phases.push(1);
            else if (t < 0.93) phases.push(2);
            else phases.push(0);
          }
          const pColors = ['rgba(255,255,255,0.5)', '#7CB3E8', '#4A90D9', '#2D5F8A'];
          const pY = [12, 60, 110, 155];
          return (
            <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14, overflow: 'hidden' } as any}>
              <div style={{ padding: '16px 16px 8px' } as any}>
                <svg width="100%" viewBox="0 0 700 180" style={{ display: 'block' }}>
                  <text x="0" y="16" fill="rgba(255,255,255,0.25)" fontSize="9">Eveil</text>
                  <text x="0" y="64" fill="rgba(255,255,255,0.25)" fontSize="9">REM</text>
                  <text x="0" y="114" fill="rgba(255,255,255,0.25)" fontSize="9">Leger</text>
                  <text x="0" y="159" fill="rgba(255,255,255,0.25)" fontSize="9">Profond</text>
                  {[12, 60, 110, 155].map(y => <line key={y} x1="55" y1={y} x2="690" y2={y} stroke="rgba(255,255,255,0.03)" />)}
                  {phases.map((p, i) => {
                    const x = 55 + (i / phases.length) * 635;
                    const w = 635 / phases.length + 1;
                    const y = pY[p];
                    const ny = i < phases.length - 1 ? pY[phases[i + 1]] : y;
                    return <g key={i}>
                      <rect x={x} y={Math.min(y, ny)} width={w} height={Math.abs(ny - y) || 3} fill={pColors[p]} opacity="0.35" />
                      <rect x={x} y={y - 1.5} width={w} height={3} fill={pColors[p]} />
                    </g>;
                  })}
                  <text x="55" y="175" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="700">22:30</text>
                  <text x="210" y="175" fill="rgba(255,255,255,0.2)" fontSize="9">0h</text>
                  <text x="370" y="175" fill="rgba(255,255,255,0.2)" fontSize="9">2h</text>
                  <text x="530" y="175" fill="rgba(255,255,255,0.2)" fontSize="9">4h</text>
                  <text x="660" y="175" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="700">6:30</text>
                </svg>
              </div>
              {/* Movement */}
              <div style={{ padding: '4px 16px 8px' } as any}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: 3 }}>Mouvements</div>
                <svg width="100%" viewBox="0 0 635 14" style={{ display: 'block' }}>
                  {Array.from({ length: 80 }).map((_, i) => { const h = Math.random() > 0.55 ? 2 + Math.random() * 9 : 1; return <rect key={i} x={i * 7.9} y={7 - h / 2} width={1.5} height={h} rx="0.5" fill="rgba(255,255,255,0.3)" />; })}
                  <line x1="0" y1="7" x2="635" y2="7" stroke="rgba(255,255,255,0.04)" />
                </svg>
              </div>
              {/* Phases legend */}
              <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                {[
                  { l: 'Eveil', v: `${Math.floor((slD - total) / 60)}h${String(Math.max(0, (slD - total) % 60)).padStart(2, '0')}m`, c: 'rgba(255,255,255,0.5)' },
                  { l: 'REM', v: `${Math.floor(rem / 60)}h${String(rem % 60).padStart(2, '0')}m`, pct: `${Math.round(rem / total * 100)}%`, c: '#7CB3E8' },
                  { l: 'Leger', v: `${Math.floor(light / 60)}h${String(light % 60).padStart(2, '0')}m`, pct: `${Math.round(light / total * 100)}%`, c: '#4A90D9' },
                  { l: 'Profond', v: `${Math.floor(deep / 60)}h${String(deep % 60).padStart(2, '0')}m`, pct: `${Math.round(deep / total * 100)}%`, c: '#2D5F8A' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                    <div style={{ width: 28, height: 14, borderRadius: 4, background: s.c, flexShrink: 0 } as any} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', flex: 1 }}>{s.l}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{s.v}</span>
                    {s.pct && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.pct}</span>}
                  </div>
                ))}
              </div>
              {/* Score + Interruptions + Apnea */}
              <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8 } as any}>
                <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: slQ >= 80 ? '#10B981' : '#F59E0B' }}>{slQ}%</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Qualite</div>
                </div>
                <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: inter <= 2 ? '#10B981' : '#F59E0B' }}>{inter}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Interruptions</div>
                </div>
                <div style={{ flex: 2, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 } as any}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Risque apnee</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? '#F59E0B' : '#EF4444' }}>{apneaRisk < 30 ? 'Faible' : apneaRisk < 60 ? 'Modere' : 'Eleve'}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                    <div style={{ height: 6, borderRadius: 3, width: `${apneaRisk}%`, background: apneaRisk < 30 ? '#10B981' : apneaRisk < 60 ? 'linear-gradient(90deg, #10B981, #F59E0B)' : 'linear-gradient(90deg, #F59E0B, #EF4444)' } as any} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* AI Analysis for this section */}
        {report?.ai && (
          <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 18px', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
              <i className="ri-brain-line" style={{ fontSize: 14, color: '#A78BFA' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Analyse IA · {sec.title}</span>
            </div>
            {report.ai.correlations && report.ai.correlations.filter((_: any, i: number) => i < 2).map((c: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                <i className="ri-links-line" style={{ fontSize: 12, color: 'rgba(167,139,250,0.4)', marginTop: 2 }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{c}</span>
              </div>
            ))}
            {report.ai.whats_good && report.ai.whats_good.length > 0 && (
              <div style={{ marginTop: 8 } as any}>
                {report.ai.whats_good.slice(0, 1).map((g: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' } as any}>
                    <i className="ri-checkbox-circle-line" style={{ fontSize: 12, color: '#10B981', marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: 'rgba(16,185,129,0.6)', lineHeight: 1.5 }}>{g}</span>
                  </div>
                ))}
              </div>
            )}
            {report.ai.watch_out && report.ai.watch_out.length > 0 && (
              <div style={{ marginTop: 4 } as any}>
                {report.ai.watch_out.slice(0, 1).map((w: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' } as any}>
                    <i className="ri-error-warning-line" style={{ fontSize: 12, color: '#F59E0B', marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: 'rgba(245,158,11,0.6)', lineHeight: 1.5 }}>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Metrics list */}
        {sec.metrics.map((m) => {
          const val = getValue(m.key);
          const isExpanded = expanded === m.key;
          return (
            <div key={m.key} style={{ borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${isExpanded ? `${sec.color}30` : 'rgba(255,255,255,0.06)'}`, marginBottom: 8, overflow: 'hidden', transition: 'border-color 0.2s' } as any}>
              <div onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: m.key === 'bp_display' ? 'heart_rate' : m.key } })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', cursor: 'pointer' } as any}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{val} <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div>
                </div>
                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)' }} />
              </div>
              {isExpanded && (
                <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                  <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginTop: 10 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}>
                      <i className="ri-information-line" style={{ fontSize: 14, color: sec.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: sec.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>Comprendre</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{m.explain}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
