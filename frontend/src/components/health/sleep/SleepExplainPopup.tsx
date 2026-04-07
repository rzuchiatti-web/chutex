import { useI18n } from '../../../context/I18nContext';
import React from 'react';

const SLEEP_EXPLANATIONS: Record<string, { icon: string; color: string; title: string; desc: string; ranges: { label: string; value: string; color: string }[]; tip: string }> = {
  hypnogram: { icon: 'ri-bar-chart-horizontal-line', color: '#A78BFA', title: 'Cycles du sommeil', desc: "Votre sommeil alterne entre phases légères, profondes et paradoxales (REM). Chaque cycle dure environ 90 minutes. Le sommeil profond regenere le corps, le REM consolide la memoire.", ranges: [{ label: 'Profond ideal', value: '15-25%', color: '#3A4099' }, { label: 'Leger normal', value: '45-55%', color: '#6B7BD9' }, { label: 'REM ideal', value: '20-25%', color: '#A8B4F0' }], tip: 'Un bon ratio de sommeil profond (>20%) est essentiel pour la recuperation physique. Le REM est crucial pour la memoire et la regulation emotionnelle.' },
  quality: { icon: 'ri-star-line', color: '#A78BFA', title: 'Qualité du sommeil', desc: "La qualite est calculee a partir de la durée, la proportion de sommeil profond et REM, et le nombre d'interruptions. Un score élevé indique un sommeil reparateur.", ranges: [{ label: 'Excellent', value: '> 80%', color: '#10B981' }, { label: 'Bon', value: '60-80%', color: '#22D3EE' }, { label: 'Moyen', value: '40-60%', color: '#F59E0B' }, { label: 'Mauvais', value: '< 40%', color: '#EF4444' }], tip: 'Evitez les ecrans 1h avant le coucher, maintenez une temperature fraiche (18-20C) et couchez-vous a heures regulieres.' },
  interruptions: { icon: 'ri-alarm-line', color: '#F59E0B', title: 'Interruptions', desc: "Le nombre de fois ou vous vous etes réveille pendant la nuit. Des réveils frequents fragmentent le sommeil et reduisent sa qualite reparatrice.", ranges: [{ label: 'Excellent', value: '0-1', color: '#10B981' }, { label: 'Bon', value: '2', color: '#22D3EE' }, { label: 'Modéré', value: '3-4', color: '#F59E0B' }, { label: 'Élevé', value: '> 4', color: '#EF4444' }], tip: "Limitez la cafeine après 14h, evitez l'alcool le soir, et assurez-vous que votre chambre est sombre et silencieuse." },
  apnea: { icon: 'ri-lungs-line', color: '#EF4444', title: "Risque d'apnée", desc: "Estimation du risque d'apnée du sommeil basée sur les interruptions, la qualité du sommeil et les mouvements détectés. L'apnée provoque des micro-réveils répétitifs.", ranges: [{ label: 'Faible', value: '< 30%', color: '#10B981' }, { label: 'Modéré', value: '30-60%', color: '#F59E0B' }, { label: 'Élevé', value: '> 60%', color: '#EF4444' }], tip: "Si le risque est élevé de manière récurrente, consultez un médecin. L'apnée du sommeil non traitée augmente les risques cardiovasculaires." },
  debt: { icon: 'ri-moon-line', color: '#A78BFA', title: 'Dette de sommeil', desc: "La dette de sommeil represente le cumul du manque de sommeil par rapport a votre besoin physiologique. Elle s'accumule jour après jour et impacte la concentration, l'humeur et l'immunite.", ranges: [{ label: 'Aucune dette', value: '< 1h', color: '#10B981' }, { label: 'Legere', value: '1-3h', color: '#F59E0B' }, { label: 'Importante', value: '> 3h', color: '#EF4444' }], tip: "Pour rembourser votre dette, couchez-vous 30 minutes plus tot pendant plusieurs jours. Evitez les grasses matinees qui decalent votre rythme circadien." },
  regularity: { icon: 'ri-time-line', color: '#6366F1', title: 'Regularite du sommeil', desc: "La régularité mesure la constance de vos heures de coucher et de réveil. Un rythme regulier synchronise votre horloge biologique et ameliore la qualité du sommeil profond.", ranges: [{ label: 'Tres regulier', value: '+/- 30 min', color: '#10B981' }, { label: 'Regulier', value: '+/- 1h', color: '#22D3EE' }, { label: 'Irregulier', value: '+/- 2h+', color: '#EF4444' }], tip: "Essayez de vous coucher et vous lever a la meme heure tous les jours, y compris le week-end. La lumiere du matin aide a caler votre horloge interne." },
};

interface Props {
  explainKey: string;
  onClose: () => void;
}

export default function SleepExplainPopup({ explainKey, onClose }: Props) {
  const e = SLEEP_EXPLANATIONS[explainKey] || SLEEP_EXPLANATIONS.quality;
  return (
    <div data-testid="sleep-explain-popup" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.82)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes popIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}` }} />
      <div onClick={(ev: any) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '50px 28px 120px', boxSizing: 'border-box' } as any}>
        <div onClick={onClose} style={{ position: 'absolute', top: 70, right: 20, width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
          <i className={e.icon} style={{ fontSize: 44, color: e.color }} />
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginTop: 14 }}>{e.title}</div>
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: 32, animation: 'slideUp 0.4s ease 0.2s both' } as any}>{e.desc}</div>
        <div style={{ marginBottom: 32, animation: 'slideUp 0.4s ease 0.3s both' } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Valeurs de reference</div>
          {e.ranges.map((r, ri) => (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: ri < e.ranges.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
              <span style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{r.label}</span>
              <span style={{ fontSize: 14, color: r.color, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'slideUp 0.4s ease 0.4s both' } as any}>
          <i className="ri-lightbulb-line" style={{ fontSize: 20, color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{e.tip}</div>
        </div>
      </div>
    </div>
  );
}
