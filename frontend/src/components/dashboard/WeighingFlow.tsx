import React, { useState } from 'react';

import { useI18n } from '../../context/I18nContext';

interface Props { onClose: () => void; d?: any; weighings?: any[]; }

export default function WeighingFlow({ onClose, d = {}, weighings = [] }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);

  const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, overflow: 'hidden' } as any}>
      <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, width: '100%', height: '100%', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>

        {step === 1 && (
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(167,139,250,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as any}><i className="ri-scales-3-line" style={{ fontSize: 34, color: '#A78BFA' }} /></div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>{t('weighing_title')}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>{t('weighing_subtitle')}</div>
            {[
              { icon: 'ri-layout-bottom-line', text: t('weighing_step1') },
              { icon: 'ri-footprint-line', text: t('weighing_step2') },
              { icon: 'ri-hand-heart-line', text: t('weighing_step3') },
              { icon: 'ri-timer-line', text: t('weighing_step4') },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, textAlign: 'left' } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(167,139,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={s.icon} style={{ fontSize: 18, color: '#A78BFA' }} /></div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s.text}</span>
              </div>
            ))}
            <div onClick={() => setStep(2)} style={{ marginTop: 20, padding: '16px', borderRadius: 999, background: '#FFF', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#111' } as any}>{t('weighing_ready')}</div>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 20 }}>{t('weighing_searching')}</div>
            <div style={{ width: 60, height: 60, borderRadius: 999, border: '3px solid rgba(56,189,248,0.3)', borderTopColor: '#38BDF8', margin: '0 auto 20px', animation: 'spin 1s linear infinite' } as any} />
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Activez le Bluetooth et montez sur la balance</div>
            <div onClick={() => { setStep(3); setTimeout(() => setStep(4), 10000); }} style={{ marginTop: 24, padding: '14px', borderRadius: 999, background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.25)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#38BDF8' } as any}>{t('weighing_simulate')}</div>
          </div>
        )}

        {step === 3 && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
            <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/8h3820je_dna%281%29.webm" />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>{t('weighing_measuring')}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>{t('weighing_stay_still')}</div>
              <div style={{ fontSize: 64, fontWeight: 900, color: '#FFF', marginBottom: 16 }}>10s</div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', width: 200, margin: '0 auto' } as any}>
                <div style={{ height: 4, borderRadius: 2, background: '#FFF', animation: 'fillBar 10s linear forwards' } as any} />
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: '@keyframes fillBar{from{width:0%}to{width:100%}}' }} />
          </div>
        )}

        {step === 4 && (() => {
          const w = d.weight || 72.4;
          return (
            <div style={{ textAlign: 'center' } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}><i className="ri-checkbox-circle-line" style={{ fontSize: 28, color: '#10B981' }} /></div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 16 }}>{t('weighing_done')}</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{w}<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)' }}> kg</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20, marginBottom: 20 } as any}>
                {[{ label: 'Graisse', value: `${d.body_fat_pct || 22.3}%`, color: '#F59E0B' }, { label: 'Muscle', value: `${d.muscle_pct || 33.8}%`, color: '#10B981' }, { label: 'Hydratation', value: `${d.water_pct || 55.2}%`, color: '#38BDF8' }, { label: 'Metabolisme', value: `${d.basal_metabolism || 1550} kcal`, color: '#A78BFA' }].map((m, i) => (
                  <div key={i} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{m.label}</div><div style={{ fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</div></div>
                ))}
              </div>
              <div onClick={onClose} style={{ padding: '16px', borderRadius: 999, background: '#FFF', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#111' } as any}>{t('weighing_report')}</div>
            </div>
          );
        })()}
      </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
