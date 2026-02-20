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
    title: 'Sommeil & Recuperation', color: '#A78BFA',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/xtzgjs5s_sommeil.png',
    metrics: [
      { key: 'sleep_duration', label: 'Duree du sommeil', unit: '', explain: 'Temps total de sommeil. 7 a 9 heures sont recommandees pour un adulte.' },
      { key: 'sleep_quality', label: 'Qualite du sommeil', unit: '%', explain: 'Score base sur la duree, les cycles et les interruptions. Au-dessus de 80% est bon.' },
      { key: 'deep_sleep_min', label: 'Sommeil profond', unit: 'min', explain: 'Phase de recuperation physique. Idealement 1h30 a 2h par nuit.' },
      { key: 'light_sleep_min', label: 'Sommeil leger', unit: 'min', explain: 'Phase de transition. Represente normalement 50-60% du sommeil total.' },
      { key: 'rem_sleep_min', label: 'Sommeil paradoxal (REM)', unit: 'min', explain: 'Phase des reves, essentielle pour la memoire et la regulation emotionnelle.' },
      { key: 'sleep_interruptions', label: 'Interruptions', unit: '', explain: 'Nombre de reveils pendant la nuit. Moins de 3 est normal.' },
      { key: 'stress_level', label: 'Niveau de stress', unit: '/100', explain: 'Mesure par le bracelet via le HRV. En dessous de 40 est un bon niveau.' },
      { key: 'recovery_score', label: 'Score de recuperation', unit: '/100', explain: 'Capacite de votre corps a recuperer. Au-dessus de 70 est favorable.' },
    ],
  },
  activity: {
    title: 'Sante physique & Activite', color: '#10B981',
    img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png',
    metrics: [
      { key: 'steps', label: 'Nombre de pas', unit: 'pas', explain: 'Objectif recommande : 6000 a 10000 pas par jour pour maintenir une bonne sante.' },
      { key: 'calories', label: 'Depense energetique', unit: 'kcal', explain: 'Calories brulees par l\'activite physique aujourd\'hui.' },
      { key: 'distance_km', label: 'Distance parcourue', unit: 'km', explain: 'Distance totale estimee a partir du nombre de pas.' },
      { key: 'vo2_max', label: 'VO2 Max', unit: 'ml/kg/min', explain: 'Capacite aerobique maximale. Un bon indicateur de forme physique globale.' },
      { key: 'basal_metabolism', label: 'Metabolisme de base (BMR)', unit: 'kcal', explain: 'Energie depensee au repos pour maintenir les fonctions vitales.' },
      { key: 'recommended_calories', label: 'Apport calorique recommande', unit: 'kcal', explain: 'Calories a consommer en fonction de votre activite et de vos objectifs.' },
    ],
  },
  hydration: {
    title: 'Hydratation & Equilibre', color: '#38BDF8',
    img: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/7s8stuxi_hydratation.png',
    metrics: [
      { key: 'water_pct', label: 'Taux d\'hydratation', unit: '%', explain: 'Pourcentage d\'eau dans le corps. Normal entre 50% et 65% selon l\'age et le sexe.' },
      { key: 'total_body_water_kg', label: 'Eau corporelle totale', unit: 'kg', explain: 'Masse totale d\'eau dans votre organisme.' },
      { key: 'intracellular_water_kg', label: 'Eau intracellulaire', unit: 'kg', explain: 'Eau contenue a l\'interieur des cellules. Environ 60% de l\'eau totale.' },
      { key: 'extracellular_water_kg', label: 'Eau extracellulaire', unit: 'kg', explain: 'Eau dans le sang, la lymphe et les espaces intercellulaires.' },
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
