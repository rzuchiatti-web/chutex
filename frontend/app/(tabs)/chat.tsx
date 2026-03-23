import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import NativePageView from '../../src/components/NativePageView';
import ProgramDailyView from '../../src/components/ProgramDailyView';
import { useRouter } from 'expo-router';
import { BG_IMAGES } from '../../src/components/dashboard/constants';
import FullScreenLoader from '../../src/components/FullScreenLoader';

const portalMount = (node: React.ReactNode) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};
const POP: any = { position: 'fixed', inset: 0, zIndex: 99990, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.55)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' };

const PROG_IMAGES: Record<string, string> = {
  sommeil: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/70f74062050eb73f37e4af1bc825ec64a37ff59e36dbd21dddaad395538ae8c2.png',
  cardiovasculaire: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/d66cc24bb801dd5a49a3b5c1b9c86a9907b695f586fe2fe988aec823410f86d8.png',
  nutrition: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/e4a68ff7d7a65b968fac91bde8737ab89ce4e0a2a9c049a00137f9978bb7b4c3.png',
  mobilite: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/a82a3cb593d5dd34df75877948b00f683eb3753126a74b7a620bff3ac8dff8ae.png',
  stress: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/a82a3cb593d5dd34df75877948b00f683eb3753126a74b7a620bff3ac8dff8ae.png',
};

export default function ProgramsTab() {
  const { token } = useAuth();
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDevices, setHasDevices] = useState<any>({ bracelet: false, scale: false, any: false });
  const [showGuide, setShowGuide] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const [isDark, setIsDark] = useState(() => typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') !== '0' : true);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const iv = setInterval(() => {
      const v = localStorage.getItem('chutex_dark') !== '0';
      setIsDark(prev => prev !== v ? v : prev);
    }, 400);
    return () => clearInterval(iv);
  }, []);

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) { setJoinError('Entrez un code equipe'); return; }
    setJoinLoading(true); setJoinError(''); setJoinSuccess('');
    try {
      const res = await apiFetch('/api/programs/team/join', { method: 'POST', body: JSON.stringify({ invite_code: joinCode.trim() }) }, token);
      setJoinSuccess(res?.message || 'Vous avez rejoint l\'equipe !');
      setTimeout(() => { setShowJoinPopup(false); setJoinCode(''); setJoinSuccess(''); setJoinError(''); loadData(); }, 1500);
    } catch (e: any) {
      setJoinError(e?.message || e?.detail || 'Code invalide ou equipe introuvable');
    } finally { setJoinLoading(false); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prog, cat, dev] = await Promise.all([
        apiFetch('/api/programs/active', {}, token).catch(() => null),
        apiFetch('/api/programs/catalog', {}, token).catch(() => null),
        apiFetch('/api/devices/dashboard-summary', {}, token).catch(() => null),
      ]);
      if (prog) setActiveProgram(prog);
      if (cat?.programs) setCatalog(cat.programs);
      setHasDevices({ bracelet: !!(dev?.bracelet?.paired), scale: !!(dev?.scale?.paired), any: !!(dev?.bracelet?.paired || dev?.scale?.paired) });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  if (Platform.OS !== 'web') return <NativePageView path="/(tabs)/chat" />;

  if (loading) return <FullScreenLoader />;

  const remainingPrograms = catalog.filter((p: any) => !activeProgram?.active || p.id !== activeProgram?.program?.id);
  const singleProgramLock = !!activeProgram?.active;

  const glass = { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };

  const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
  const cardBg = isDark ? 'rgba(70,70,78,0.85)' : '#E8E8EA';
  const textColor = isDark ? '#FFF' : '#1A1A2E';
  const subColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)';
  const contentBg = isDark ? 'linear-gradient(to bottom, #000 0%, #3A3A3C 100%)' : '#FFF';
  const sepColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div data-testid="programs-tab" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>

      <div style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ═══ RED BG HEADER ═══ */}
        <div style={{ position: 'relative', zIndex: 1 } as any}>
          <img src={BG_RED} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '24px 20px 32px' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 } as any}>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Programmes</div>
              </div>
              <div style={{ display: 'flex', gap: 8 } as any}>
                {!activeProgram?.active && (
                  <div data-testid="join-team-btn" onClick={() => { setShowJoinPopup(true); setJoinCode(''); setJoinError(''); setJoinSuccess(''); }}
                    style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', transition: 'transform 0.15s' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    <i className="ri-team-line" style={{ fontSize: 20, color: '#FFF' }} />
                  </div>
                )}
                <div data-testid="programs-guide-btn" onClick={() => setShowGuide(true)}
                  style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', transition: 'transform 0.15s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                  <i className="ri-question-line" style={{ fontSize: 20, color: '#FFF' }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Parcours de prevention personnalises pour ameliorer votre sante au quotidien.</div>
          </div>
        </div>

        {/* ═══ THEMED CONTENT CARD ═══ */}
        <div style={{ padding: '24px 20px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: contentBg, position: 'relative', zIndex: 10, borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)' } as any}>

          {/* PROGRAMME ACTIF */}
          {activeProgram?.active && token && (
            <div style={{ marginBottom: 24 } as any}>
              <ProgramDailyView token={token} onStop={() => { setActiveProgram(null); loadData(); }} />
            </div>
          )}

          {/* CATALOGUE */}
          {(!singleProgramLock || showCatalog) ? (
            <>
              <style dangerouslySetInnerHTML={{ __html: `@keyframes progSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }` }} />
              {showCatalog && singleProgramLock && (
                <div onClick={() => setShowCatalog(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer', padding: '8px 0' } as any}>
                  <i className="ri-arrow-left-line" style={{ fontSize: 16, color: subColor }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: subColor }}>Retour au programme actif</span>
                </div>
              )}

              {remainingPrograms.map((p: any, idx: number) => {
                const img = p.cover_image || PROG_IMAGES[p.category] || PROG_IMAGES.mobilite;
                const cBg = isDark ? '#1a1a1e' : '#E8E8EA';
                const cBorder = isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid rgba(0,0,0,0.06)';
                const gradEnd = isDark ? 'rgba(26,26,30,0.85)' : 'rgba(232,232,234,0.85)';
                const gradFull = isDark ? '#1a1a1e' : '#E8E8EA';
                return (
                  <div key={p.id} data-testid={`catalog-${p.id}`}
                    onClick={() => router.push({ pathname: '/program-detail' as any, params: { id: p.id } })}
                    style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', border: cBorder, background: cBg, transition: 'transform 200ms, box-shadow 200ms', animation: `progSlideUp 400ms ease ${idx * 60}ms both` } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    {/* Image banner */}
                    <div style={{ position: 'relative', height: 120, overflow: 'hidden' } as any}>
                      <img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 30%, ${gradEnd} 80%, ${gradFull} 100%)` } as any} />
                      <div style={{ position: 'absolute', top: 12, left: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, color: p.color || '#A78BFA', textTransform: 'uppercase', letterSpacing: 0.5 } as any}>
                        <i className={p.icon} style={{ fontSize: 11, marginRight: 5 }} />{p.category || 'Sante'}
                      </div>
                      <div style={{ position: 'absolute', top: 12, right: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' } as any}>
                        {p.duration_days}j
                      </div>
                    </div>
                    {/* Content */}
                    <div style={{ padding: '14px 18px 18px' } as any}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: textColor, marginBottom: 4, letterSpacing: -0.3 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: subColor, lineHeight: 1.5, marginBottom: 12 }}>{p.subtitle}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                        {p.difficulty && <span style={{ padding: '4px 10px', borderRadius: 99, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', fontSize: 10, fontWeight: 600, color: subColor }}>{p.difficulty}</span>}
                        {(p.tracked_metrics || []).slice(0, 2).map((m: string, i: number) => (
                          <span key={i} style={{ padding: '4px 8px', borderRadius: 99, background: `${p.color || '#A78BFA'}08`, border: `1px solid ${p.color || '#A78BFA'}18`, fontSize: 9, fontWeight: 600, color: p.color || '#A78BFA' }}>{m.replace(/_/g, ' ')}</span>
                        ))}
                        <i className="ri-arrow-right-s-line" style={{ marginLeft: 'auto', fontSize: 18, color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && remainingPrograms.length === 0 && (
                <div style={{ padding: '28px', borderRadius: 18, background: cardBg, textAlign: 'center' } as any}>
                  <i className="ri-search-line" style={{ fontSize: 24, color: subColor, marginBottom: 8, display: 'block' }} />
                  <div style={{ fontSize: 13, color: subColor }}>Aucun programme disponible.</div>
                </div>
              )}
            </>
          ) : (
            <div onClick={() => setShowCatalog(true)} style={{ padding: '14px 18px', borderRadius: 16, background: cardBg, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'transform 0.2s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <i className="ri-layout-grid-line" style={{ fontSize: 18, color: subColor }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>Voir tous les programmes</div>
                <div style={{ fontSize: 10, color: subColor }}>{catalog.length} programmes disponibles</div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ GUIDE POPUP ═══ */}
      {showGuide && portalMount(
        <div data-testid="programs-guide-popup" style={POP as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div data-testid="programs-guide-close" onClick={() => setShowGuide(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
              </div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } as any}>Guide</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Comment ca marche ?</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 28 }}>Nos programmes de prevention sont conçus pour ameliorer votre sante au quotidien.</div>

            {[
              { icon: 'ri-search-line', color: '#60A5FA', title: '1. Choisissez un programme', desc: 'Parcourez le catalogue et selectionnez le programme adapte a vos besoins.' },
              { icon: 'ri-play-circle-line', color: '#10B981', title: '2. Suivez jour par jour', desc: 'Activites quotidiennes : exercices, conseils, meditations. A votre rythme.' },
              { icon: 'ri-checkbox-circle-line', color: '#F59E0B', title: '3. Check-in quotidien', desc: 'Evaluez votre humeur chaque jour. Nora adapte ses conseils.' },
              { icon: 'ri-trophy-line', color: '#A78BFA', title: '4. Gagnez des badges', desc: 'Completez des etapes pour debloquer des badges et rapports.' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${s.color}12`, border: `1px solid ${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={s.icon} style={{ fontSize: 17, color: s.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 3 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}>
              <div onClick={() => setShowGuide(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>Fermer</div>
              <div data-testid="programs-guide-cta" onClick={() => setShowGuide(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>C'est parti !</div>
            </div>
          </div>
        </div>
      )}
      {/* ═══ JOIN TEAM POPUP ═══ */}
      {showJoinPopup && portalMount(
        <div data-testid="join-team-popup" style={POP as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div data-testid="join-team-close" onClick={() => setShowJoinPopup(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
              </div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 } as any}>Equipe</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Rejoindre une equipe</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 28 }}>Entrez le code equipe partage par un ami pour rejoindre son programme.</div>

            <div style={{ marginBottom: 12 } as any}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Code equipe</div>
              <input
                data-testid="join-team-input"
                type="text"
                value={joinCode}
                onChange={(e: any) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                onKeyDown={(e: any) => { if (e.key === 'Enter') handleJoinTeam(); }}
                placeholder="Ex: A3F8B2C1"
                style={{ width: '100%', fontSize: 18, fontWeight: 800, padding: '14px 16px', borderRadius: 14, border: `1px solid ${joinError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(255,255,255,0.06)', color: '#FFF', textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' } as any}
              />
            </div>

            {joinError && (
              <div data-testid="join-team-error" style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{joinError}</div>
            )}
            {joinSuccess && (
              <div data-testid="join-team-success" style={{ fontSize: 12, color: '#10B981', marginBottom: 12, fontWeight: 700 }}>{joinSuccess}</div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}>
              <div onClick={() => setShowJoinPopup(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div>
              <div data-testid="join-team-submit" onClick={!joinLoading ? handleJoinTeam : undefined}
                style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: joinLoading ? 'default' : 'pointer', opacity: joinLoading ? 0.6 : 1 } as any}>
                {joinLoading ? 'Verification...' : 'Rejoindre'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
