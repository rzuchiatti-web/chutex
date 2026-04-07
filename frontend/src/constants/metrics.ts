export interface HealthMetric {
  id: string;
  name: string;
  unit: string;
  category: string;
  device: 'bracelet' | 'scale' | 'vest';
  icon: string;
  iconLib: 'Ionicons' | 'MaterialCommunityIcons';
  color: string;
  description: string;
  normalRange: { min: number; max: number };
  isKey?: boolean;
}

export const BRACELET_METRICS: HealthMetric[] = [
  { id: 'heart_rate', name: 'Fréquence cardiaque', unit: 'bpm', category: 'Cardiovasculaire', device: 'bracelet', icon: 'heart', iconLib: 'Ionicons', color: '#DC2626', description: 'Nombre de battements du cœur par minute. Un rythme cardiaque au repos entre 60-100 bpm est considéré normal pour un adulte.', normalRange: { min: 60, max: 100 }, isKey: true },
  { id: 'hrv', name: 'Variabilité cardiaque', unit: 'ms', category: 'Cardiovasculaire', device: 'bracelet', icon: 'pulse', iconLib: 'Ionicons', color: '#E11D48', description: 'Variation de temps entre chaque battement de cœur. Un HRV élevé indique une bonne capacité d\'adaptation du système nerveux.', normalRange: { min: 20, max: 120 } },
  { id: 'stress', name: 'Niveau de stress', unit: 'score', category: 'Bien-être', device: 'bracelet', icon: 'flash', iconLib: 'Ionicons', color: '#F59E0B', description: 'Score de stress basé sur la variabilité cardiaque et les paramètres physiologiques. Un score bas indique un état de relaxation.', normalRange: { min: 0, max: 50 }, isKey: true },
  { id: 'vo2max', name: 'VO2 Max', unit: 'ml/kg/min', category: 'Performance', device: 'bracelet', icon: 'speedometer', iconLib: 'Ionicons', color: '#0EA5E9', description: 'Capacité maximale d\'oxygène que votre corps peut utiliser pendant l\'exercice. Indicateur clé de la condition physique.', normalRange: { min: 20, max: 60 } },
  { id: 'spo2', name: 'SpO2', unit: '%', category: 'Cardiovasculaire', device: 'bracelet', icon: 'water', iconLib: 'Ionicons', color: '#4A7C59', description: 'Saturation en oxygène du sang. Un taux normal se situe entre 95-100%. En dessous de 90%, consulter un médecin.', normalRange: { min: 95, max: 100 }, isKey: true },
  { id: 'blood_pressure_systolic', name: 'Tension systolique', unit: 'mmHg', category: 'Cardiovasculaire', device: 'bracelet', icon: 'pulse', iconLib: 'Ionicons', color: '#7C3AED', description: 'Pression artérielle systolique (pression maximale lors de la contraction du cœur). Normale: 90-140 mmHg.', normalRange: { min: 90, max: 140 }, isKey: true },
  { id: 'blood_pressure_diastolic', name: 'Tension diastolique', unit: 'mmHg', category: 'Cardiovasculaire', device: 'bracelet', icon: 'pulse', iconLib: 'Ionicons', color: '#6D28D9', description: 'Pression artérielle diastolique (pression minimale entre les battements). Normale: 60-90 mmHg.', normalRange: { min: 60, max: 90 } },
  { id: 'blood_glucose', name: 'Glycémie', unit: 'mg/dL', category: 'Métabolique', device: 'bracelet', icon: 'analytics', iconLib: 'Ionicons', color: '#EA580C', description: 'Taux de sucre dans le sang. À jeun: 70-100 mg/dL. Après repas: jusqu\'à 140 mg/dL.', normalRange: { min: 70, max: 140 } },
  { id: 'sleep_duration', name: 'Durée du sommeil', unit: 'h', category: 'Sommeil', device: 'bracelet', icon: 'moon', iconLib: 'Ionicons', color: '#1E40AF', description: 'Durée totale du sommeil. Les adultes ont besoin de 7-9 heures de sommeil par nuit.', normalRange: { min: 7, max: 9 }, isKey: true },
  { id: 'sleep_quality', name: 'Qualité du sommeil', unit: 'score', category: 'Sommeil', device: 'bracelet', icon: 'star', iconLib: 'Ionicons', color: '#3B82F6', description: 'Score global de la qualité du sommeil basé sur la durée, les cycles et les interruptions.', normalRange: { min: 70, max: 100 } },
  { id: 'sleep_cycles', name: 'Cycles de sommeil', unit: 'cycles', category: 'Sommeil', device: 'bracelet', icon: 'repeat', iconLib: 'Ionicons', color: '#6366F1', description: 'Nombre de cycles complets de sommeil (léger, profond, REM). 4-6 cycles par nuit est optimal.', normalRange: { min: 4, max: 6 } },
  { id: 'sleep_interruptions', name: 'Interruptions', unit: 'fois', category: 'Sommeil', device: 'bracelet', icon: 'alert-circle', iconLib: 'Ionicons', color: '#EF4444', description: 'Nombre de réveils pendant la nuit. Moins de 2 interruptions indique un sommeil de qualité.', normalRange: { min: 0, max: 2 } },
  { id: 'temperature', name: 'Température', unit: '°C', category: 'Vital', device: 'bracelet', icon: 'thermometer', iconLib: 'Ionicons', color: '#F97316', description: 'Température corporelle. Normale: 36.1-37.2°C. Au-dessus de 38°C peut indiquer de la fièvre.', normalRange: { min: 36.1, max: 37.2 }, isKey: true },
  { id: 'calories', name: 'Dépenses énergétiques', unit: 'kcal', category: 'Activité', device: 'bracelet', icon: 'flame', iconLib: 'Ionicons', color: '#DC2626', description: 'Calories brûlées dans la journée incluant le métabolisme de base et l\'activité physique.', normalRange: { min: 1500, max: 3000 } },
  { id: 'steps', name: 'Pas', unit: 'pas', category: 'Activité', device: 'bracelet', icon: 'footsteps', iconLib: 'Ionicons', color: '#22C55E', description: 'Nombre de pas effectués. L\'OMS recommandé 8000-10000 pas par jour pour un adulte.', normalRange: { min: 5000, max: 10000 }, isKey: true },
];

export const SCALE_METRICS: HealthMetric[] = [
  // Composition corporelle de base
  { id: 'weight', name: 'Poids', unit: 'kg', category: 'Composition de base', device: 'scale', icon: 'scale-bathroom', iconLib: 'MaterialCommunityIcons', color: '#4A7C59', description: 'Poids corporel total mesuré par la balance connectée.', normalRange: { min: 50, max: 90 }, isKey: true },
  { id: 'bmi', name: 'IMC', unit: '', category: 'Composition de base', device: 'scale', icon: 'human', iconLib: 'MaterialCommunityIcons', color: '#0EA5E9', description: 'Indice de Masse Corporelle. Normal: 18.5-24.9. Surpoids: 25-29.9. Obèse: 30+.', normalRange: { min: 18.5, max: 25 }, isKey: true },
  { id: 'body_fat_pct', name: 'Pourcentage de graisse', unit: '%', category: 'Composition de base', device: 'scale', icon: 'percent', iconLib: 'MaterialCommunityIcons', color: '#F59E0B', description: 'Pourcentage de masse grasse par rapport au poids total.', normalRange: { min: 10, max: 30 }, isKey: true },
  { id: 'fat_mass', name: 'Masse grasse', unit: 'kg', category: 'Composition de base', device: 'scale', icon: 'weight', iconLib: 'MaterialCommunityIcons', color: '#EF4444', description: 'Poids total de la graisse corporelle.', normalRange: { min: 5, max: 25 } },
  { id: 'visceral_fat', name: 'Graisse viscérale', unit: 'niveau', category: 'Composition de base', device: 'scale', icon: 'stomach', iconLib: 'MaterialCommunityIcons', color: '#DC2626', description: 'Graisse autour des organes internes. Un niveau inférieur à 12 est sain.', normalRange: { min: 1, max: 12 } },
  { id: 'bone_mass', name: 'Masse osseuse', unit: 'kg', category: 'Composition de base', device: 'scale', icon: 'bone', iconLib: 'MaterialCommunityIcons', color: '#A8A29E', description: 'Poids total des os. Important pour détecter l\'ostéoporose.', normalRange: { min: 2, max: 4 } },
  { id: 'subcutaneous_fat_pct', name: 'Graisse sous-cutanée', unit: '%', category: 'Composition de base', device: 'scale', icon: 'layers', iconLib: 'MaterialCommunityIcons', color: '#FB923C', description: 'Pourcentage de graisse stockée juste sous la peau.', normalRange: { min: 10, max: 25 } },
  { id: 'subcutaneous_fat_mass', name: 'Masse graisse sous-cutanée', unit: 'kg', category: 'Composition de base', device: 'scale', icon: 'layers-outline', iconLib: 'MaterialCommunityIcons', color: '#F97316', description: 'Poids de la graisse sous-cutanée en kilogrammes.', normalRange: { min: 5, max: 20 } },
  // Muscles
  { id: 'muscle_pct', name: 'Pourcentage musculaire', unit: '%', category: 'Muscles', device: 'scale', icon: 'arm-flex', iconLib: 'MaterialCommunityIcons', color: '#7C3AED', description: 'Pourcentage de masse musculaire par rapport au poids total.', normalRange: { min: 30, max: 50 }, isKey: true },
  { id: 'muscle_mass', name: 'Masse musculaire', unit: 'kg', category: 'Muscles', device: 'scale', icon: 'arm-flex-outline', iconLib: 'MaterialCommunityIcons', color: '#8B5CF6', description: 'Poids total de la masse musculaire.', normalRange: { min: 20, max: 45 } },
  { id: 'skeletal_muscle_mass', name: 'Masse musc. squelettique', unit: 'kg', category: 'Muscles', device: 'scale', icon: 'human-handsup', iconLib: 'MaterialCommunityIcons', color: '#6D28D9', description: 'Masse des muscles attachés au squelette, impliqués dans le mouvement.', normalRange: { min: 15, max: 40 } },
  { id: 'skeletal_mass', name: 'Masse squelettique', unit: 'kg', category: 'Muscles', device: 'scale', icon: 'human', iconLib: 'MaterialCommunityIcons', color: '#5B21B6', description: 'Poids total du système squelettique.', normalRange: { min: 2, max: 5 } },
  { id: 'skeletal_muscle_quality', name: 'Qualité musc. squelettique', unit: 'score', category: 'Muscles', device: 'scale', icon: 'star-four-points', iconLib: 'MaterialCommunityIcons', color: '#4C1D95', description: 'Indice de qualité des muscles squelettiques basé sur la densité et la force.', normalRange: { min: 60, max: 100 } },
  // Hydratation
  { id: 'hydration_pct', name: 'Taux d\'hydratation', unit: '%', category: 'Hydratation', device: 'scale', icon: 'water-percent', iconLib: 'MaterialCommunityIcons', color: '#0EA5E9', description: 'Pourcentage d\'eau dans le corps. Un bon taux se situe entre 50-65%.', normalRange: { min: 50, max: 65 }, isKey: true },
  { id: 'total_body_water', name: 'Eau corporelle totale', unit: 'L', category: 'Hydratation', device: 'scale', icon: 'water', iconLib: 'MaterialCommunityIcons', color: '#38BDF8', description: 'Volume total d\'eau dans le corps en litres.', normalRange: { min: 30, max: 50 } },
  { id: 'intracellular_water', name: 'Eau intracellulaire', unit: 'L', category: 'Hydratation', device: 'scale', icon: 'water-outline', iconLib: 'MaterialCommunityIcons', color: '#0284C7', description: 'Volume d\'eau à l\'intérieur des cellules.', normalRange: { min: 18, max: 30 } },
  { id: 'extracellular_water', name: 'Eau extracellulaire', unit: 'L', category: 'Hydratation', device: 'scale', icon: 'water-off', iconLib: 'MaterialCommunityIcons', color: '#0369A1', description: 'Volume d\'eau en dehors des cellules (plasma, fluide interstitiel).', normalRange: { min: 12, max: 20 } },
  // Protéines
  { id: 'protein_pct', name: 'Taux de protéine', unit: '%', category: 'Protéines', device: 'scale', icon: 'food-steak', iconLib: 'MaterialCommunityIcons', color: '#B45309', description: 'Pourcentage de protéines dans le corps. Important pour la récupération musculaire.', normalRange: { min: 15, max: 20 } },
  { id: 'protein_mass', name: 'Masse protéine', unit: 'kg', category: 'Protéines', device: 'scale', icon: 'food-drumstick', iconLib: 'MaterialCommunityIcons', color: '#92400E', description: 'Poids total des protéines corporelles.', normalRange: { min: 8, max: 15 } },
  // Métabolisme
  { id: 'basal_metabolism', name: 'Métabolisme de base', unit: 'kcal', category: 'Métabolisme', device: 'scale', icon: 'fire', iconLib: 'MaterialCommunityIcons', color: '#DC2626', description: 'Calories brûlées au repos pour maintenir les fonctions vitales.', normalRange: { min: 1200, max: 2200 } },
  { id: 'recommended_calories', name: 'Apport calorique recommandé', unit: 'kcal', category: 'Métabolisme', device: 'scale', icon: 'silverware-fork-knife', iconLib: 'MaterialCommunityIcons', color: '#EA580C', description: 'Nombre de calories recommandé par jour selon votre profil.', normalRange: { min: 1500, max: 2500 } },
  // Segmentation bras
  { id: 'right_arm_fat_ratio', name: 'Graisse bras droit', unit: '%', category: 'Segmentation bras', device: 'scale', icon: 'hand-back-right', iconLib: 'MaterialCommunityIcons', color: '#F59E0B', description: 'Rapport de graisse du bras droit.', normalRange: { min: 10, max: 30 } },
  { id: 'left_arm_fat_ratio', name: 'Graisse bras gauche', unit: '%', category: 'Segmentation bras', device: 'scale', icon: 'hand-back-left', iconLib: 'MaterialCommunityIcons', color: '#F59E0B', description: 'Rapport de graisse du bras gauche.', normalRange: { min: 10, max: 30 } },
  { id: 'right_arm_muscle_rate', name: 'Muscle bras droit', unit: '%', category: 'Segmentation bras', device: 'scale', icon: 'hand-back-right-outline', iconLib: 'MaterialCommunityIcons', color: '#7C3AED', description: 'Taux musculaire du bras droit.', normalRange: { min: 25, max: 45 } },
  { id: 'left_arm_muscle_rate', name: 'Muscle bras gauche', unit: '%', category: 'Segmentation bras', device: 'scale', icon: 'hand-back-left-outline', iconLib: 'MaterialCommunityIcons', color: '#7C3AED', description: 'Taux musculaire du bras gauche.', normalRange: { min: 25, max: 45 } },
  { id: 'right_arm_muscle_mass', name: 'Masse musc. bras droit', unit: 'kg', category: 'Segmentation bras', device: 'scale', icon: 'arm-flex', iconLib: 'MaterialCommunityIcons', color: '#8B5CF6', description: 'Masse musculaire du bras droit.', normalRange: { min: 1.5, max: 4 } },
  { id: 'left_arm_muscle_mass', name: 'Masse musc. bras gauche', unit: 'kg', category: 'Segmentation bras', device: 'scale', icon: 'arm-flex', iconLib: 'MaterialCommunityIcons', color: '#8B5CF6', description: 'Masse musculaire du bras gauche.', normalRange: { min: 1.5, max: 4 } },
  // Segmentation jambes
  { id: 'right_leg_fat_ratio', name: 'Graisse jambe droite', unit: '%', category: 'Segmentation jambes', device: 'scale', icon: 'human-male', iconLib: 'MaterialCommunityIcons', color: '#F59E0B', description: 'Rapport de graisse de la jambe droite.', normalRange: { min: 15, max: 35 } },
  { id: 'left_leg_fat_ratio', name: 'Graisse jambe gauche', unit: '%', category: 'Segmentation jambes', device: 'scale', icon: 'human-male', iconLib: 'MaterialCommunityIcons', color: '#F59E0B', description: 'Rapport de graisse de la jambe gauche.', normalRange: { min: 15, max: 35 } },
  { id: 'right_leg_fat_mass', name: 'Masse grasse jambe droite', unit: 'kg', category: 'Segmentation jambes', device: 'scale', icon: 'human-male', iconLib: 'MaterialCommunityIcons', color: '#EF4444', description: 'Masse grasse de la jambe droite.', normalRange: { min: 2, max: 8 } },
  { id: 'left_leg_fat_mass', name: 'Masse grasse jambe gauche', unit: 'kg', category: 'Segmentation jambes', device: 'scale', icon: 'human-male', iconLib: 'MaterialCommunityIcons', color: '#EF4444', description: 'Masse grasse de la jambe gauche.', normalRange: { min: 2, max: 8 } },
  { id: 'right_foot_muscle_rate', name: 'Muscle pied droit', unit: '%', category: 'Segmentation jambes', device: 'scale', icon: 'shoe-print', iconLib: 'MaterialCommunityIcons', color: '#7C3AED', description: 'Taux musculaire du pied droit.', normalRange: { min: 30, max: 50 } },
  { id: 'left_foot_muscle_rate', name: 'Muscle pied gauche', unit: '%', category: 'Segmentation jambes', device: 'scale', icon: 'shoe-print', iconLib: 'MaterialCommunityIcons', color: '#7C3AED', description: 'Taux musculaire du pied gauche.', normalRange: { min: 30, max: 50 } },
  // Tronc
  { id: 'trunk_fat_mass', name: 'Masse grasse tronc', unit: 'kg', category: 'Tronc', device: 'scale', icon: 'human-male', iconLib: 'MaterialCommunityIcons', color: '#EF4444', description: 'Masse grasse localisée au niveau du tronc.', normalRange: { min: 3, max: 12 } },
  { id: 'trunk_muscle_rate', name: 'Taux musculaire torse', unit: '%', category: 'Tronc', device: 'scale', icon: 'human-handsup', iconLib: 'MaterialCommunityIcons', color: '#7C3AED', description: 'Pourcentage de muscles au niveau du torse.', normalRange: { min: 25, max: 45 } },
  { id: 'trunk_muscle_mass', name: 'Masse musculaire tronc', unit: 'kg', category: 'Tronc', device: 'scale', icon: 'human-handsup', iconLib: 'MaterialCommunityIcons', color: '#8B5CF6', description: 'Poids des muscles du tronc.', normalRange: { min: 10, max: 25 } },
  // Évaluation
  { id: 'body_type', name: 'Type corporel', unit: 'score', category: 'Évaluation', device: 'scale', icon: 'account-details', iconLib: 'MaterialCommunityIcons', color: '#0EA5E9', description: 'Classification du type corporel (ectomorphe, mésomorphe, endomorphe).', normalRange: { min: 1, max: 9 } },
  { id: 'body_age', name: 'Âge corporel', unit: 'ans', category: 'Évaluation', device: 'scale', icon: 'calendar-heart', iconLib: 'MaterialCommunityIcons', color: '#22C55E', description: 'Âge métabolique estimé basé sur votre composition corporelle.', normalRange: { min: 20, max: 80 } },
  { id: 'health_score', name: 'Score de santé', unit: 'score', category: 'Évaluation', device: 'scale', icon: 'heart-pulse', iconLib: 'MaterialCommunityIcons', color: '#4A7C59', description: 'Score global de santé basé sur l\'ensemble des mesures corporelles.', normalRange: { min: 70, max: 100 }, isKey: true },
  { id: 'obesity_degree', name: 'Degré d\'obésité', unit: '%', category: 'Évaluation', device: 'scale', icon: 'gauge', iconLib: 'MaterialCommunityIcons', color: '#DC2626', description: 'Indice du degré d\'obésité basé sur la composition corporelle.', normalRange: { min: 0, max: 20 } },
  { id: 'adiposity_level', name: 'Niveau d\'adiposité', unit: 'niveau', category: 'Évaluation', device: 'scale', icon: 'chart-bar', iconLib: 'MaterialCommunityIcons', color: '#F59E0B', description: 'Niveau d\'adiposité corporelle.', normalRange: { min: 1, max: 5 } },
  // Contrôle
  { id: 'fat_control', name: 'Contrôle graisseux', unit: 'kg', category: 'Contrôle', device: 'scale', icon: 'arrow-collapse-down', iconLib: 'MaterialCommunityIcons', color: '#EF4444', description: 'Quantité de graisse à perdre (négatif) ou acceptable (positif) pour atteindre un poids santé.', normalRange: { min: -5, max: 5 } },
  { id: 'muscle_control', name: 'Contrôle musculaire', unit: 'kg', category: 'Contrôle', device: 'scale', icon: 'arrow-expand-up', iconLib: 'MaterialCommunityIcons', color: '#22C55E', description: 'Quantité de muscle à gagner pour atteindre un profil optimal.', normalRange: { min: 0, max: 10 } },
  { id: 'weight_control', name: 'Contrôle du poids', unit: 'kg', category: 'Contrôle', device: 'scale', icon: 'swap-vertical', iconLib: 'MaterialCommunityIcons', color: '#0EA5E9', description: 'Différence entre votre poids actuel et votre poids idéal.', normalRange: { min: -10, max: 10 } },
  { id: 'normal_weight', name: 'Poids normal', unit: 'kg', category: 'Contrôle', device: 'scale', icon: 'check-circle', iconLib: 'MaterialCommunityIcons', color: '#22C55E', description: 'Fourchette de poids normal pour votre taille.', normalRange: { min: 55, max: 80 } },
  { id: 'ideal_weight', name: 'Poids idéal', unit: 'kg', category: 'Contrôle', device: 'scale', icon: 'target', iconLib: 'MaterialCommunityIcons', color: '#4A7C59', description: 'Poids idéal calculé selon votre profil.', normalRange: { min: 55, max: 75 } },
  // Autres
  { id: 'body_cell_mass', name: 'Masse cellulaire corporelle', unit: 'kg', category: 'Autres', device: 'scale', icon: 'blur-radial', iconLib: 'MaterialCommunityIcons', color: '#8B5CF6', description: 'Masse totale des cellules actives du corps.', normalRange: { min: 20, max: 40 } },
  { id: 'minerals', name: 'Minéraux', unit: 'kg', category: 'Autres', device: 'scale', icon: 'diamond-stone', iconLib: 'MaterialCommunityIcons', color: '#A8A29E', description: 'Contenu minéral total du corps (calcium, phosphore, etc.).', normalRange: { min: 2.5, max: 4.5 } },
  { id: 'waist_hip_ratio', name: 'Ratio taille-hanche', unit: '', category: 'Autres', device: 'scale', icon: 'ruler', iconLib: 'MaterialCommunityIcons', color: '#F97316', description: 'Rapport entre le tour de taille et le tour de hanche. Femmes < 0.85, Hommes < 0.90.', normalRange: { min: 0.7, max: 0.9 } },
  { id: 'body_fat_overall', name: '% graisse corporelle', unit: '%', category: 'Autres', device: 'scale', icon: 'percent-circle', iconLib: 'MaterialCommunityIcons', color: '#EF4444', description: 'Pourcentage global de graisse corporelle.', normalRange: { min: 10, max: 30 } },
];

export const ALL_METRICS = [...BRACELET_METRICS, ...SCALE_METRICS];

export const getMetricById = (id: string) => ALL_METRICS.find(m => m.id === id);

export const getMetricsByDevice = (device: 'bracelet' | 'scale') =>
  ALL_METRICS.filter(m => m.device === device);

export const getKeyMetrics = () => ALL_METRICS.filter(m => m.isKey);

export const getMetricCatégories = (device: 'bracelet' | 'scale') => {
  const metrics = getMetricsByDevice(device);
  const catégories: { [key: string]: HealthMetric[] } = {};
  metrics.forEach(m => {
    if (!catégories[m.category]) catégories[m.category] = [];
    catégories[m.category].push(m);
  });
  return catégories;
};
