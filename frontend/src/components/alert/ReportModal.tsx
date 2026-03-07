import React, { useState } from 'react';
import { Alert } from 'react-native';
import { apiFetch } from '../../services/api';
import { useI18n } from '../../context/I18nContext';

export default function ReportModal({ alertId, user, token, onClose, onReload }: { alertId: string; user: any; token: string; onClose: () => void; onReload: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [text, setText] = useState('');

  const isBen = user?.role === 'beneficiary' || user?.active_role === 'beneficiary';
  const questions = isBen ? [
    { id: 'reason', label: 'Pourquoi cloturez-vous cette alerte ?', options: ['Fausse alerte / Erreur de manipulation', 'Je vais bien, pas besoin d\'aide', 'L\'aide est deja arrivee', 'Autre raison'] },
  ] : [
    { id: 'situation', label: 'La situation est-elle maitrisee ?', options: ['Oui, situation resolue', 'Partiellement, surveillance necessaire', 'Non, necessite un suivi'] },
    { id: 'actions', label: 'Actions realisees', options: ['Levee de doute telephonique', 'Intervention physique au domicile', 'Contact avec les secours (SAMU/Pompiers)', 'Contact avec le medecin traitant', 'Aucune action necessaire'] },
    { id: 'condition', label: 'Etat du beneficiaire', options: ['Stable - pas de blessure', 'Blessure legere - soins apportes', 'Necessitant un suivi medical', 'Hospitalisation necessaire'] },
  ];
  const allAnswered = questions.every(q => answers[q.id]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto', display: 'flex', justifyContent: 'center' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '32px auto', padding: '0 16px 60px', boxSizing: 'border-box' } as any}>
        <div style={{ borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: '24px 20px' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{isBen ? 'Cloturer l\'alerte' : 'Rapport de cloture'}</div>
            <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div>
          </div>
          {questions.map((q, qi) => (
            <div key={q.id} style={{ marginBottom: 16 } as any}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>{qi + 1}. {q.label} <span style={{ color: '#EF4444' }}>*</span></div>
              {q.options.map((opt, oi) => (
                <div key={oi} onClick={() => setAnswers({ ...answers, [q.id]: opt })} style={{ padding: '11px 14px', borderRadius: 12, marginBottom: 5, cursor: 'pointer', background: answers[q.id] === opt ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${answers[q.id] === opt ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${answers[q.id] === opt ? '#FFF' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>{answers[q.id] === opt && <div style={{ width: 9, height: 9, borderRadius: 999, background: '#FFF' }} />}</div>
                  <span style={{ fontSize: 13, color: '#FFF' }}>{opt}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ marginBottom: 16 } as any}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 6 }}>{isBen ? 'Un commentaire ?' : 'Notes supplementaires'}</div>
            <textarea value={text} onChange={(e: any) => setText(e.target.value)} placeholder="Optionnel..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' } as any} />
          </div>
          <div data-testid="report-confirm-btn" onClick={async () => {
            if (!allAnswered) return;
            try {
              await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT', body: JSON.stringify({ answers: { ...answers, notes: text, closed_by: user?.name, closed_at: new Date().toISOString() }, notes: text }) }, token);
              onClose(); onReload();
            } catch (e: any) { Alert.alert('Erreur', e.message); }
          }} style={{ padding: '14px', borderRadius: 999, cursor: allAnswered ? 'pointer' : 'not-allowed', background: allAnswered ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${allAnswered ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center', fontSize: 14, fontWeight: 700, color: allAnswered ? '#10B981' : 'rgba(255,255,255,0.2)' } as any}>
            {allAnswered ? 'Confirmer la cloture' : 'Repondez aux questions'}
          </div>
        </div>
      </div>
    </div>
  );
}
