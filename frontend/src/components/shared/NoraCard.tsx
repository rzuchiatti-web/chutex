import React, { useState, useEffect, useRef } from 'react';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

/* Reusable Nora card — fond noir, video recette premium, typewriter text */
export default function NoraCard({ title, text, items }: { title?: string; text: string; items?: { icon: string; text: string }[] }) {
  const [entered, setEntered] = useState(false);
  const [showText, setShowText] = useState(false);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    setTimeout(() => setEntered(true), 50);
    setTimeout(() => setShowText(true), 2200);
  }, []);

  useEffect(() => {
    if (!showText) return;
    let i = 0;
    const iv = setInterval(() => {
      if (i <= text.length) { setTyped(text.slice(0, i)); i++; }
      else { clearInterval(iv); }
    }, 12);
    return () => clearInterval(iv);
  }, [showText, text]);

  return (
    <div style={{ borderRadius: 20, background: '#000', padding: '20px', marginBottom: 14, position: 'relative', overflow: 'hidden', minHeight: 90 } as any}>
      <video autoPlay loop muted playsInline style={{
        position: 'absolute',
        left: showText ? '14px' : '50%',
        top: showText ? '14px' : '50%',
        transform: showText ? 'translate(0,0)' : 'translate(-50%,-50%)',
        width: showText ? 30 : 70, height: showText ? 30 : 70,
        objectFit: 'contain', borderRadius: showText ? 10 : 35,
        opacity: entered ? (showText ? 0.6 : 1) : 0,
        filter: entered ? 'none' : 'blur(16px)',
        zIndex: 1,
        transition: 'left 1.2s cubic-bezier(0.22,0.61,0.36,1), top 1.2s cubic-bezier(0.22,0.61,0.36,1), width 1.2s ease, height 1.2s ease, transform 1.2s ease, border-radius 1.2s ease, opacity 1.4s ease 0.1s, filter 1.4s ease 0.1s',
      } as any} src={NORA_VIDEO} />
      {showText && (
        <div style={{ position: 'relative', zIndex: 2 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 40 } as any}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{title || 'Analyse de Nora'}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
            {typed}<span style={{ opacity: typed.length < text.length ? 1 : 0, color: 'rgba(255,255,255,0.2)', transition: 'opacity 0.3s' } as any}>|</span>
          </div>
          {items && typed.length >= text.length && items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', animation: 'noraItemIn 0.4s ease both', animationDelay: `${i * 0.15}s` } as any}>
              <i className={item.icon} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{item.text}</span>
            </div>
          ))}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes noraItemIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' }} />
    </div>
  );
}
