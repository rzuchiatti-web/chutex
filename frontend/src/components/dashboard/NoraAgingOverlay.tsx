import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

export default function NoraAgingOverlay({ token, onClose }: { token: string | null; onClose: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'typing' | 'done'>('intro');
  const [typed, setTyped] = useState('');
  const [analysisText, setAnalysisText] = useState('');

  useEffect(() => {
    if (!token) return;
    document.body.classList.add('nora-active');
    apiFetch('/api/nora/aging-analysis', {}, token)
      .then((r: any) => { if (r?.analysis) setAnalysisText(r.analysis); })
      .catch(() => {});
    const t1 = setTimeout(() => setPhase('typing'), 2800);
    return () => { clearTimeout(t1); document.body.classList.remove('nora-active'); };
  }, [token]);

  useEffect(() => {
    if (phase !== 'typing' || !analysisText) return;
    let i = 0;
    const iv = setInterval(() => {
      if (i <= analysisText.length) { setTyped(analysisText.slice(0, i)); i++; }
      else { clearInterval(iv); setPhase('done'); }
    }, 12);
    return () => clearInterval(iv);
  }, [phase, analysisText]);

  const formatText = (t: string) => {
    const sentences = t.split(/(?<=\.)\s+/);
    const paragraphs: string[][] = [[]];
    sentences.forEach((s, i) => {
      paragraphs[paragraphs.length - 1].push(s);
      if ((i + 1) % 2 === 0 && i < sentences.length - 1) paragraphs.push([]);
    });
    return paragraphs.map(p => p.join(' '));
  };

  return (
    <div data-testid="nora-aging-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 99999, background: '#000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'noraFadeIn 0.4s ease',
    } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes noraFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes noraPulse{0%,100%{transform:scale(1);opacity:0.85}50%{transform:scale(1.08);opacity:1}}
        @keyframes noraTextIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      ` }} />

      <div style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: phase === 'intro' ? '28vh' : 50,
        paddingLeft: 28, paddingRight: 28, paddingBottom: 120,
        transition: 'padding-top 1s cubic-bezier(0.22,0.61,0.36,1)',
      } as any}>

        <video autoPlay loop muted playsInline style={{
          width: phase === 'intro' ? 140 : 90,
          height: phase === 'intro' ? 140 : 90,
          borderRadius: phase === 'intro' ? 50 : 30,
          objectFit: 'contain',
          animation: phase === 'intro' ? 'noraPulse 2.2s ease infinite' : 'none',
          marginBottom: phase === 'intro' ? 20 : 24,
          transition: 'all 1s cubic-bezier(0.22,0.61,0.36,1)',
          boxShadow: '0 0 60px rgba(167,139,250,0.15)',
        } as any} src={NORA_VIDEO} />

        {phase === 'intro' && (
          <div style={{ textAlign: 'center', animation: 'noraTextIn 0.6s ease 0.3s both' } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Nora analyse...</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Age biologique et rythme de vieillissement</div>
          </div>
        )}

        {(phase === 'typing' || phase === 'done') && (
          <div style={{ width: '100%', maxWidth: 380, animation: 'noraTextIn 0.5s ease both' } as any}>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Age biologique</div>
              <div style={{ height: 2, width: 40, borderRadius: 1, background: 'rgba(167,139,250,0.4)', margin: '10px auto 0' } as any} />
            </div>
            {formatText(typed).map((para, i) => (
              <div key={i}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '16px 0' } as any} />}
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.85, textAlign: 'center' }}>{para}</div>
              </div>
            ))}
            {phase === 'typing' && <span style={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.12)', fontSize: 13, marginTop: 4 }}>|</span>}
          </div>
        )}
      </div>

      {phase === 'done' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px 36px', background: 'linear-gradient(0deg, #000 60%, transparent)', zIndex: 100000 } as any}>
          <div data-testid="nora-aging-back-btn" onClick={onClose} style={{
            width: '100%', maxWidth: 380, margin: '0 auto', padding: '16px',
            borderRadius: 999, background: '#FFF', textAlign: 'center',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          } as any}>
            <i className="ri-arrow-left-line" style={{ fontSize: 16, color: '#111' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>Retour</span>
          </div>
        </div>
      )}
    </div>
  );
}
