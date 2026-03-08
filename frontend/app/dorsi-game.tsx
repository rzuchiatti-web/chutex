import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useSharedDorsiBLE } from '../src/context/DorsiBLEContext';
import { useI18n } from '../src/context/I18nContext';

const BG = '#0A0A14';
const GAMES: Record<string, { name: string; icon: string; color: string; desc: string; objective: string; howto: string[] }> = {
  moutons: { name: 'Jeu des Moutons', icon: 'ri-ghost-smile-line', color: '#22D3EE', desc: 'Attrapez tous les moutons le plus vite possible !', objective: 'Touchez chaque mouton pour le capturer', howto: ['Deplacez-vous avec les fleches ou le coussin', 'Touchez les moutons (ronds cyan) pour les capturer', 'Les moutons dores valent 3x plus de points', 'Enchainez sans en rater pour monter le combo'] },
  bulles: { name: 'Bulles de Savon', icon: 'ri-bubble-chart-line', color: '#A78BFA', desc: 'Eclatez les bulles avant qu\'elles disparaissent.', objective: 'Touchez les bulles pour les eclater', howto: ['Les bulles apparaissent aleatoirement', 'Deplacez votre curseur pour les toucher', 'Elles disparaissent si non eclatees a temps', 'Les dorees valent beaucoup plus'] },
  proprioception: { name: 'Equilibre', icon: 'ri-focus-3-line', color: '#10B981', desc: 'Restez dans la zone verte le plus longtemps possible.', objective: 'Gardez le curseur au centre', howto: ['Le cercle vert central est la zone cible', 'Zone verte = +3 pts, moyenne = +2, externe = +1', 'Restez stable et centre', 'La cle : des mouvements lents et precis'] },
  serpent: { name: 'Serpent', icon: 'ri-route-line', color: '#F59E0B', desc: 'Mangez les fruits pour grandir !', objective: 'Mangez les fruits jaunes', howto: ['Changez de direction avec les fleches', 'Mangez les fruits pour grandir et scorer', 'Le serpent traverse les bords', 'Chaque fruit = +25 points'] },
  labyrinthe: { name: 'Labyrinthe', icon: 'ri-compass-discover-line', color: '#EC4899', desc: 'Trouvez toutes les cibles dans le labyrinthe.', objective: 'Atteignez les cibles vertes', howto: ['Deplacez-vous dans le labyrinthe', 'Touchez les cibles vertes', 'Evitez les murs roses', 'Chaque cible = +30 pts'] },
  slalom: { name: 'Slalom', icon: 'ri-flag-line', color: '#06B6D4', desc: 'Passez entre les portes du slalom.', objective: 'Passez dans les ouvertures', howto: ['Des barrieres descendent du haut', 'Passez dans l\'ouverture entre les murs', 'Deplacez-vous a gauche/droite', 'Chaque porte = +12 points'] },
  etoiles: { name: 'Pluie d\'Etoiles', icon: 'ri-star-line', color: '#F97316', desc: 'Attrapez les etoiles qui tombent du ciel.', objective: 'Touchez les etoiles avant qu\'elles tombent', howto: ['Des etoiles tombent du haut', 'Deplacez-vous pour les attraper', 'Les dorees valent plus', 'Gardez le combo en n\'en ratant aucune'] },
  simon: { name: 'Simon', icon: 'ri-flashlight-line', color: '#EF4444', desc: 'Memorisez et reproduisez la sequence.', objective: 'Reproduisez la sequence affichee', howto: ['Nora montre une sequence de directions', 'Les boutons s\'allument un par un', 'Reproduisez dans le meme ordre (fleches ou clic)', 'La sequence s\'allonge a chaque tour reussi'] },
  cercles: { name: 'Cercles', icon: 'ri-record-circle-line', color: '#8B5CF6', desc: 'Touchez les cercles avant qu\'ils disparaissent.', objective: 'Touchez les cercles qui grandissent', howto: ['Des cercles apparaissent et grandissent', 'Touchez-les avant qu\'ils soient trop grands', 'Plus ils sont petits = plus de points', 'Soyez rapide et precis'] },
  course: { name: 'Course', icon: 'ri-run-line', color: '#14B8A6', desc: 'Esquivez les obstacles !', objective: 'Survivez le plus longtemps', howto: ['Des obstacles arrivent de la droite', 'Montez/descendez pour les eviter', 'Score automatique en survivant', 'Concentration et reflexes !'] },
  respiration: { name: 'Respiration', icon: 'ri-lungs-line', color: '#60A5FA', desc: 'Suivez le rythme respiratoire.', objective: 'Synchronisez-vous avec le cercle guide', howto: ['Un cercle pulse au rythme de la respiration', 'Eloignez le curseur quand il grandit (inspirez)', 'Rapprochez-le quand il retrecit (expirez)', 'Plus vous etes synchronise = plus de points'] },
  pendule: { name: 'Pendule', icon: 'ri-timer-flash-line', color: '#F472B6', desc: 'Arretez le pendule au bon moment.', objective: 'Appuyez sur Espace au centre', howto: ['Un pendule oscille de gauche a droite', 'Appuyez sur Espace quand il passe au centre', 'Timing precis = +25 points', 'Observez le rythme avant d\'appuyer'] },
  peinture: { name: 'Peinture', icon: 'ri-brush-line', color: '#FBBF24', desc: 'Peignez en bougeant librement.', objective: 'Deplacez-vous pour peindre la toile', howto: ['Votre curseur laisse une trainee coloree', 'Les couleurs changent en arc-en-ciel', 'Plus vous bougez = plus de points', 'Exercice libre de mobilite'] },
  rebond: { name: 'Rebond', icon: 'ri-basketball-line', color: '#FB923C', desc: 'Cassez les blocs avec la balle.', objective: 'Renvoyez la balle et cassez les blocs', howto: ['Une balle rebondit sur l\'ecran', 'Deplacez la raquette en bas pour la renvoyer', 'Cassez les blocs en haut (+15 pts chacun)', 'Ne laissez pas la balle tomber'] },
  gravite: { name: 'Gravite', icon: 'ri-planet-line', color: '#818CF8', desc: 'Evitez les planetes dans l\'espace.', objective: 'Esquivez les planetes qui descendent', howto: ['Des planetes avec des anneaux descendent', 'Deplacez-vous pour les eviter', 'Score automatique en survivant', 'Les collisions cassent votre combo'] },
};

/* ── HUD ── */
function HUD({ score, timeLeft, combo, bestScore, gameName, gameColor, onBack }: any) {
  const pct = (timeLeft / 60) * 100;
  const urg = timeLeft < 10;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '16px 20px 0', pointerEvents: 'none' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'auto' } as any}>
        <div onClick={onBack} style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{gameName}</span>
            <span style={{ fontSize: 28, fontWeight: 900, color: urg ? '#EF4444' : '#FFF', fontFamily: 'monospace', animation: urg ? 'pulse 0.5s infinite' : 'none' }}>{timeLeft}s</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 6, overflow: 'hidden' } as any}>
            <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: urg ? '#EF4444' : gameColor, transition: 'width 0.9s linear' } as any} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' } as any}>
        <div style={{ padding: '8px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className="ri-star-fill" style={{ fontSize: 16, color: gameColor }} />
          <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{score}</span>
        </div>
        {bestScore > 0 && (
          <div style={{ padding: '8px 16px', borderRadius: 999, background: score > bestScore ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.1)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <i className="ri-trophy-fill" style={{ fontSize: 14, color: score > bestScore ? '#10B981' : '#F59E0B' }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: score > bestScore ? '#10B981' : '#F59E0B' }}>{score > bestScore ? 'NOUVEAU RECORD !' : `Record: ${bestScore}`}</span>
          </div>
        )}
        {combo > 1 && (
          <div style={{ padding: '8px 16px', borderRadius: 999, background: `${gameColor}15`, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6, animation: 'pulse 0.5s' } as any}>
            <i className="ri-fire-fill" style={{ fontSize: 14, color: gameColor }} />
            <span style={{ fontSize: 14, fontWeight: 900, color: gameColor }}>x{combo}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Start/End Screens ── */
function StartScreen({ meta, bestScore, onStart, ble, scoreHistory }: any) {
  const gameScores = scoreHistory?.find((h: any) => h.game_id === meta.name.toLowerCase().replace(/[^a-z]/g, '')) || scoreHistory?.find((h: any) => meta.name.includes(h.name));
  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, overflowY: 'auto' } as any}>
      <div style={{ textAlign: 'center', padding: '32px 24px', maxWidth: 400 } as any}>
        <div style={{ width: 90, height: 90, borderRadius: 28, background: `${meta.color}12`, border: `2px solid ${meta.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'float 3s ease-in-out infinite' } as any}>
          <i className={meta.icon} style={{ fontSize: 44, color: meta.color }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFF', margin: '0 0 6px' }}>{meta.name}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, margin: '0 0 16px' }}>{meta.desc}</p>

        {/* Objective */}
        <div style={{ padding: '10px 16px', borderRadius: 14, background: `${meta.color}10`, border: `1px solid ${meta.color}20`, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 } as any}>
          <i className="ri-crosshair-2-line" style={{ fontSize: 18, color: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{meta.objective}</span>
        </div>

        {/* How to play */}
        <div style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Comment jouer</div>
          {meta.howto.map((step: string, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
                <span style={{ fontSize: 10, fontWeight: 900, color: meta.color }}>{i + 1}</span>
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>

        {/* Score History */}
        {bestScore > 0 && (
          <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, textAlign: 'left' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Historique</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 } as any}>
                <i className="ri-trophy-fill" style={{ fontSize: 14, color: '#F59E0B' }} />
                <span style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B' }}>{bestScore} pts</span>
              </div>
            </div>
            {gameScores?.scores?.slice(-5).reverse().map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{s.date ? new Date(s.date).toLocaleDateString() : `Partie ${i + 1}`}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.score >= bestScore ? '#F59E0B' : '#FFF' }}>{s.score} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* BLE Connection */}
        <div style={{ padding: '12px 16px', borderRadius: 14, background: ble?.connected ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${ble?.connected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 16 } as any}>
          {ble?.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' } as any} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Coussin {ble.deviceName} connecte</span>
            </div>
          ) : (
            <div onClick={ble?.connect} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' } as any}>
              <i className="ri-bluetooth-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{ble?.connecting ? 'Connexion...' : 'Connecter le coussin Dorsi'}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Ou jouez avec les touches du clavier</div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 } as any}>
          {[{ icon: 'ri-timer-line', text: '60s' }, { icon: ble?.connected ? 'ri-bluetooth-connect-line' : 'ri-keyboard-box-line', text: ble?.connected ? 'Coussin Dorsi' : 'Fleches / WASD' }].map((b, i) => (
            <div key={i} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 } as any}><i className={b.icon} style={{ fontSize: 14 }} />{b.text}</div>
          ))}
        </div>
        <div onClick={onStart} data-testid="start-game-btn" style={{ padding: '18px 56px', borderRadius: 999, background: meta.color, cursor: 'pointer', color: '#FFF', fontSize: 18, fontWeight: 900, display: 'inline-block', boxShadow: `0 8px 40px ${meta.color}50` } as any}>Jouer</div>
      </div>
    </div>
  );
}

function EndScreen({ score, bestScore, isNew, meta, onReplay, onBack }: any) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30 } as any}>
      <div style={{ textAlign: 'center', padding: 32 } as any}>
        {isNew && <div style={{ fontSize: 13, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16, animation: 'bounceIn 0.5s' }}>Nouveau record !</div>}
        <div style={{ fontSize: 72, fontWeight: 900, color: '#FFF', lineHeight: 1, marginBottom: 4 }}>{score}</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)', marginBottom: 32 }}>points</div>
        {bestScore > 0 && !isNew && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 32 }}>Record : {bestScore}</div>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' } as any}>
          <div onClick={onReplay} style={{ padding: '16px 36px', borderRadius: 999, background: meta.color, cursor: 'pointer', color: '#FFF', fontSize: 16, fontWeight: 800, boxShadow: `0 6px 24px ${meta.color}40` } as any}><i className="ri-refresh-line" style={{ marginRight: 8 }} />Rejouer</div>
          <div onClick={onBack} style={{ padding: '16px 28px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 700 } as any}>Retour</div>
        </div>
      </div>
    </div>
  );
}

/* ── D-Pad ── */
function DPad({ onNudge }: { onNudge: (dx: number, dy: number) => void }) {
  const B: any = { width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
  return (
    <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 15, display: 'grid', gridTemplateColumns: '60px 60px 60px', gridTemplateRows: '60px 60px', gap: 6 } as any}>
      <div /><div onClick={() => onNudge(0, -1)} style={B}><i className="ri-arrow-up-line" style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }} /></div><div />
      <div onClick={() => onNudge(-1, 0)} style={B}><i className="ri-arrow-left-line" style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }} /></div>
      <div onClick={() => onNudge(0, 1)} style={B}><i className="ri-arrow-down-line" style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }} /></div>
      <div onClick={() => onNudge(1, 0)} style={B}><i className="ri-arrow-right-line" style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }} /></div>
    </div>
  );
}

/* ── Simon Game (special — no canvas) ── */
function SimonFullScreen({ onScoreUpdate, onTimeUpdate, onFinish }: any) {
  const [seq, setSeq] = useState<string[]>([]);
  const [pIdx, setPIdx] = useState(0);
  const [showing, setShowing] = useState(true);
  const [active, setActive] = useState('');
  const [fb, setFb] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const dirs = ['up', 'down', 'left', 'right'];
  const C: Record<string, string> = { up: '#22D3EE', down: '#F97316', left: '#A78BFA', right: '#10B981' };
  const I: Record<string, string> = { up: 'ri-arrow-up-line', down: 'ri-arrow-down-line', left: 'ri-arrow-left-line', right: 'ri-arrow-right-line' };

  const addRound = useCallback(() => {
    const next = [...seq, dirs[Math.floor(Math.random() * 4)]];
    setSeq(next); setPIdx(0); setShowing(true);
    next.forEach((d, i) => { setTimeout(() => setActive(d), i * 500 + 200); setTimeout(() => setActive(''), i * 500 + 400); });
    setTimeout(() => { setShowing(false); setActive(''); }, next.length * 500 + 300);
  }, [seq]);

  useEffect(() => { addRound(); }, []);

  useEffect(() => {
    if (gameOverRef.current) return;
    const t = setInterval(() => { setTimeLeft(p => { onTimeUpdate(p - 1); if (p <= 1) { gameOverRef.current = true; onFinish(scoreRef.current); clearInterval(t); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const m: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      if (m[e.key] && !showing && !gameOverRef.current) handleInput(m[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleInput = (dir: string) => {
    if (showing || gameOverRef.current) return;
    if (dir === seq[pIdx]) {
      setFb('ok'); setTimeout(() => setFb(''), 200);
      if (pIdx + 1 >= seq.length) { scoreRef.current += seq.length * 10; onScoreUpdate(scoreRef.current); setTimeout(() => addRound(), 400); }
      else setPIdx(pIdx + 1);
    } else { setFb('fail'); setSeq([]); setTimeout(() => { setFb(''); addRound(); }, 600); }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
      <div style={{ textAlign: 'center' } as any}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>{showing ? `Memorisez... (${seq.length})` : `${pIdx + 1}/${seq.length}`}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 100px 100px', gridTemplateRows: '100px 100px', gap: 14, justifyContent: 'center' } as any}>
          {['', 'up', '', 'left', 'down', 'right'].map((d, i) => d ? (
            <div key={d} onClick={() => handleInput(d)} style={{ borderRadius: 20, background: active === d ? `${C[d]}50` : `${C[d]}10`, border: `2px solid ${active === d ? C[d] : `${C[d]}25`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', transform: active === d ? 'scale(1.1)' : 'scale(1)', boxShadow: active === d ? `0 0 40px ${C[d]}40` : 'none' } as any}>
              <i className={I[d]} style={{ fontSize: 36, color: active === d ? '#FFF' : C[d] }} />
            </div>
          ) : <div key={i} />)}
        </div>
        {fb === 'ok' && <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800, color: '#10B981', animation: 'bounceIn 0.3s' }}>+{seq.length * 10}</div>}
        {fb === 'fail' && <div style={{ marginTop: 16, fontSize: 18, fontWeight: 800, color: '#EF4444' }}>Faux !</div>}
      </div>
    </div>
  );
}

/* ── Canvas Game Engine ── */
function CanvasGame({ gameId, meta, onScoreUpdate, onComboUpdate, onTimeUpdate, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const gameOverRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const cursorRef = useRef({ x: 0, y: 0 });
  const baseAngle = useRef({ x: 0, y: 0 });
  const bleRef = useRef(bleAngles);
  const frameRef = useRef(0);
  const particles = useRef<any[]>([]);
  const timeRef = useRef(60);

  useEffect(() => { bleRef.current = bleAngles; }, [bleAngles]);

  const addPts = (pts: number, x?: number, y?: number) => { scoreRef.current += pts; comboRef.current++; onScoreUpdate(scoreRef.current); onComboUpdate(comboRef.current); if (x && y) for (let i = 0; i < 8; i++) particles.current.push({ x, y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 2, life: 1, color: meta.color, size: 2 + Math.random() * 4 }); };

  // Timer
  useEffect(() => {
    const t = setInterval(() => { timeRef.current--; onTimeUpdate(timeRef.current); if (timeRef.current <= 0) { gameOverRef.current = true; onFinish(scoreRef.current); clearInterval(t); } }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const W = () => c.width, H = () => c.height;
    cursorRef.current = { x: W() / 2, y: H() / 2 };
    baseAngle.current = { x: bleRef.current.x, y: bleRef.current.y };

    const kd = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const ku = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    const targets: any[] = [];
    const obstacles: any[] = [];
    const snakeBody: any[] = [{ x: 10, y: 10 }];
    let snakeDir = { x: 1, y: 0 };
    let snakeFood = { x: 5, y: 5 };
    let snakeTick = 0;

    const spawnTarget = () => targets.push({ x: 30 + Math.random() * (W() - 60), y: 100 + Math.random() * (H() - 250), r: 10 + Math.random() * 10, gold: Math.random() > 0.8, age: 0 });
    for (let i = 0; i < 5; i++) spawnTarget();

    const move = () => {
      const s = 4.5;
      if (bleConnected) { cursorRef.current.x = W() / 2 + (bleRef.current.x - baseAngle.current.x) * 12; cursorRef.current.y = H() / 2 - (bleRef.current.y - baseAngle.current.y) * 12; }
      else { if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) cursorRef.current.x -= s; if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) cursorRef.current.x += s; if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) cursorRef.current.y -= s; if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) cursorRef.current.y += s; }
      cursorRef.current.x = Math.max(10, Math.min(W() - 10, cursorRef.current.x));
      cursorRef.current.y = Math.max(90, Math.min(H() - 170, cursorRef.current.y));
    };

    const loop = () => {
      if (gameOverRef.current) return;
      const w = W(), h = H(); frameRef.current++;
      const f = frameRef.current;

      // ═══ ANIMATED BACKGROUND ═══
      const bgHue = (f * 0.3) % 360;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      if (gameId === 'moutons') { grad.addColorStop(0, '#1a3a2a'); grad.addColorStop(1, '#0d2818'); }
      else if (gameId === 'bulles') { grad.addColorStop(0, '#0a1628'); grad.addColorStop(1, '#061230'); }
      else if (gameId === 'proprioception') { grad.addColorStop(0, '#0a0a20'); grad.addColorStop(1, '#15082a'); }
      else if (gameId === 'respiration') { grad.addColorStop(0, '#0a1520'); grad.addColorStop(1, '#081018'); }
      else if (gameId === 'peinture') { grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#16213e'); }
      else { grad.addColorStop(0, '#0A0A14'); grad.addColorStop(1, '#0d0d1c'); }
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

      // Floating stars/particles background
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 137.5 + f * 0.2) % w);
        const sy = ((i * 97.3 + f * (0.1 + i * 0.01)) % (h - 100)) + 80;
        const ss = 1 + Math.sin(f * 0.03 + i) * 0.8;
        ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.sin(f * 0.02 + i * 0.5) * 0.04})`;
        ctx.beginPath(); ctx.arc(sx, sy, ss, 0, Math.PI * 2); ctx.fill();
      }

      move();

      // ═══ MOUTONS / BULLES / ETOILES / CERCLES ═══
      if (['moutons', 'bulles', 'etoiles', 'cercles', 'labyrinthe'].includes(gameId)) {
        if (f % 50 === 0) spawnTarget();
        if (gameId === 'etoiles') targets.forEach(t => { t.y += 1.5 + Math.sin(t.age * 0.02) * 0.5; });
        if (gameId === 'cercles') targets.forEach(t => { t.r += 0.3; });
        targets.forEach(t => t.age++);

        // Moutons: draw grass at bottom
        if (gameId === 'moutons') {
          for (let i = 0; i < w; i += 8) {
            const gh = 15 + Math.sin(f * 0.05 + i * 0.1) * 5;
            ctx.fillStyle = `rgba(34,180,80,${0.15 + Math.sin(f * 0.02 + i * 0.05) * 0.05})`;
            ctx.fillRect(i, h - 160 - gh, 6, gh);
          }
        }

        for (let i = targets.length - 1; i >= 0; i--) {
          const t = targets[i];
          if (t.y > h + 20 || t.age > 280 || (gameId === 'cercles' && t.r > 60)) { targets.splice(i, 1); comboRef.current = 0; onComboUpdate(0); continue; }
          const glow = Math.sin(f * 0.06 + i) * 0.3 + 0.7;
          const col = t.gold ? '#FFD700' : meta.color;
          const wobble = Math.sin(f * 0.08 + i * 2) * 3;

          if (gameId === 'moutons') {
            // Cartoon sheep body
            ctx.fillStyle = t.gold ? '#FFF8DC' : '#F5F5F5';
            ctx.beginPath(); ctx.ellipse(t.x + wobble, t.y, t.r + 6, t.r + 2, 0, 0, Math.PI * 2); ctx.fill();
            // Woolly bumps
            for (let b = 0; b < 5; b++) {
              const ba = (b / 5) * Math.PI * 2 + f * 0.02;
              ctx.fillStyle = t.gold ? '#FFFACD' : '#E8E8E8';
              ctx.beginPath(); ctx.arc(t.x + wobble + Math.cos(ba) * (t.r), t.y + Math.sin(ba) * (t.r - 2), 5, 0, Math.PI * 2); ctx.fill();
            }
            // Face
            ctx.fillStyle = '#333'; ctx.beginPath(); ctx.ellipse(t.x + wobble + t.r * 0.7, t.y, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
            // Eyes
            ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(t.x + wobble + t.r * 0.7 - 2, t.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(t.x + wobble + t.r * 0.7 - 1, t.y - 2, 1.2, 0, Math.PI * 2); ctx.fill();
            // Legs
            ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(t.x + wobble - 4, t.y + t.r); ctx.lineTo(t.x + wobble - 4, t.y + t.r + 8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(t.x + wobble + 4, t.y + t.r); ctx.lineTo(t.x + wobble + 4, t.y + t.r + 8); ctx.stroke();
            if (t.gold) { ctx.fillStyle = 'rgba(255,215,0,0.2)'; ctx.beginPath(); ctx.arc(t.x + wobble, t.y, t.r + 16, 0, Math.PI * 2); ctx.fill(); }
          } else if (gameId === 'bulles') {
            // Rainbow bubble
            const rGrad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r + 8);
            const hue1 = (f * 2 + i * 40) % 360;
            rGrad.addColorStop(0, `hsla(${hue1}, 80%, 70%, 0.3)`);
            rGrad.addColorStop(0.7, `hsla(${hue1 + 60}, 80%, 60%, 0.15)`);
            rGrad.addColorStop(1, `hsla(${hue1 + 120}, 80%, 50%, 0.05)`);
            ctx.fillStyle = rGrad; ctx.beginPath(); ctx.arc(t.x, t.y + wobble, t.r + 8, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `hsla(${hue1}, 90%, 80%, 0.4)`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(t.x, t.y + wobble, t.r + 4, 0, Math.PI * 2); ctx.stroke();
            // Shine
            ctx.fillStyle = `rgba(255,255,255,${glow * 0.6})`;
            ctx.beginPath(); ctx.ellipse(t.x - t.r * 0.3, t.y + wobble - t.r * 0.3, t.r * 0.35, t.r * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
            if (t.gold) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 20; ctx.fillStyle = 'rgba(255,215,0,0.3)'; ctx.beginPath(); ctx.arc(t.x, t.y + wobble, t.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
          } else {
            // Default: glowing orbs
            ctx.fillStyle = `${col}${Math.round(glow * 30).toString(16).padStart(2, '0')}`;
            ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = col; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = `rgba(255,255,255,${glow * 0.5})`; ctx.beginPath(); ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.25, 0, Math.PI * 2); ctx.fill();
          }

          const dx = cursorRef.current.x - t.x, dy = cursorRef.current.y - t.y;
          if (Math.sqrt(dx * dx + dy * dy) < t.r + 15) { addPts(t.gold ? 50 : 15 + Math.min(comboRef.current * 2, 20), t.x, t.y); targets.splice(i, 1); spawnTarget(); }
        }
      }

      if (gameId === 'proprioception') {
        const cx = w / 2, cy = h / 2;
        // Pulsating space rings
        const pulse = Math.sin(f * 0.03) * 10;
        [140 + pulse, 90, 45].forEach((r, i) => {
          const rGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          rGrad.addColorStop(0, `${meta.color}00`);
          rGrad.addColorStop(0.8, [`${meta.color}06`, `${meta.color}12`, `${meta.color}22`][i]);
          rGrad.addColorStop(1, `${meta.color}00`);
          ctx.fillStyle = rGrad; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        });
        // Rotating ring
        ctx.strokeStyle = `${meta.color}40`; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.arc(cx, cy, 90, f * 0.01, f * 0.01 + Math.PI * 1.5); ctx.stroke();
        ctx.setLineDash([]);
        // Target zone
        ctx.strokeStyle = `${meta.color}80`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI * 2); ctx.stroke();
        const d = Math.sqrt((cursorRef.current.x - cx) ** 2 + (cursorRef.current.y - cy) ** 2);
        if (f % 8 === 0) { if (d < 45) addPts(3); else if (d < 90) addPts(2); else if (d < 140) addPts(1); }
      }

      if (gameId === 'slalom' || gameId === 'course') {
        if (f % 35 === 0) {
          if (gameId === 'slalom') { const gap = 120; obstacles.push({ x: 20 + Math.random() * (w - 40 - gap), y: -10, w: gap, h: 6, speed: 3.5 }); }
          else { obstacles.push({ x: w + 10, y: 100 + Math.random() * (h - 280), w: 20, h: 50 + Math.random() * 120, speed: 4.5 }); }
        }
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          if (gameId === 'slalom') o.y += o.speed; else o.x -= o.speed;
          const oGrad = ctx.createLinearGradient(0, o.y, 0, o.y + (o.h || 20));
          oGrad.addColorStop(0, `${meta.color}35`); oGrad.addColorStop(1, `${meta.color}15`);
          ctx.fillStyle = oGrad;
          if (gameId === 'slalom') { ctx.fillRect(0, o.y, o.x, o.h + 4); ctx.fillRect(o.x + o.w, o.y, w, o.h + 4); } else { ctx.beginPath(); ctx.roundRect(o.x, o.y, o.w, o.h, 8); ctx.fill(); }
          // Collision check for course
          if (gameId === 'course') {
            const cx = cursorRef.current.x, cy = cursorRef.current.y;
            if (cx > o.x - 12 && cx < o.x + o.w + 12 && cy > o.y - 12 && cy < o.y + o.h + 12) {
              gameOverRef.current = true; onFinish(scoreRef.current); return;
            }
          }
          // Collision check for slalom (hit the walls)
          if (gameId === 'slalom') {
            const cy = cursorRef.current.y, cx = cursorRef.current.x;
            if (Math.abs(cy - o.y) < 12 && (cx < o.x || cx > o.x + o.w)) {
              comboRef.current = 0; onComboUpdate(0);
            }
          }
          if (o.y > h + 20 || o.x < -40) { if (gameId === 'slalom') addPts(12); obstacles.splice(i, 1); }
        }
        if (gameId === 'course' && f % 4 === 0) { scoreRef.current++; onScoreUpdate(scoreRef.current); }
      }

      if (gameId === 'serpent') {
        const gs = 18; const cols = Math.floor(w / gs); const rows = Math.floor((h - 200) / gs);
        snakeTick++;
        if (snakeTick % 5 === 0) {
          if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) snakeDir = { x: -1, y: 0 };
          if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) snakeDir = { x: 1, y: 0 };
          if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) snakeDir = { x: 0, y: -1 };
          if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) snakeDir = { x: 0, y: 1 };
          const head = { x: (snakeBody[0].x + snakeDir.x + cols) % cols, y: (snakeBody[0].y + snakeDir.y + rows) % rows };
          // GAME OVER: self-bite check
          if (snakeBody.some((s, i) => i > 0 && s.x === head.x && s.y === head.y)) {
            gameOverRef.current = true; onFinish(scoreRef.current); return;
          }
          snakeBody.unshift(head);
          if (head.x === snakeFood.x && head.y === snakeFood.y) { addPts(25, snakeFood.x * gs + gs / 2, snakeFood.y * gs + 100); snakeFood = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; }
          else snakeBody.pop();
        }
        // Glowing food
        ctx.shadowColor = meta.color; ctx.shadowBlur = 20;
        ctx.fillStyle = meta.color; ctx.beginPath(); ctx.arc(snakeFood.x * gs + gs / 2, snakeFood.y * gs + 100 + gs / 2, gs / 2 + Math.sin(f * 0.1) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Cartoon snake with gradient
        snakeBody.forEach((s, idx) => {
          const hue = (120 + idx * 8) % 360;
          ctx.fillStyle = idx === 0 ? '#FFF' : `hsl(${hue}, 70%, 55%)`;
          ctx.beginPath(); ctx.arc(s.x * gs + gs / 2, s.y * gs + 100 + gs / 2, gs / 2, 0, Math.PI * 2); ctx.fill();
          if (idx === 0) { // Eyes on head
            ctx.fillStyle = '#000';
            const ex = snakeDir.x * 3, ey = snakeDir.y * 3;
            ctx.beginPath(); ctx.arc(s.x * gs + gs / 2 + ex - 3, s.y * gs + 100 + gs / 2 + ey - 2, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(s.x * gs + gs / 2 + ex + 3, s.y * gs + 100 + gs / 2 + ey - 2, 2, 0, Math.PI * 2); ctx.fill();
          }
        });
      }

      // === RESPIRATION ===
      if (gameId === 'respiration') {
        const cx = w / 2, cy = h / 2;
        const breathCycle = Math.sin(f * 0.025) * 0.5 + 0.5;
        const targetR = 40 + breathCycle * 100;
        // Zen waves background
        for (let i = 0; i < 5; i++) {
          ctx.strokeStyle = `rgba(96,165,250,${0.03 + i * 0.01})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let x = 0; x < w; x += 5) { ctx.lineTo(x, cy + Math.sin(f * 0.015 + x * 0.01 + i * 0.5) * (30 + i * 20)); }
          ctx.stroke();
        }
        // Organic target circle
        const tGrad = ctx.createRadialGradient(cx, cy, targetR * 0.5, cx, cy, targetR);
        tGrad.addColorStop(0, `${meta.color}15`); tGrad.addColorStop(1, `${meta.color}03`);
        ctx.fillStyle = tGrad; ctx.beginPath(); ctx.arc(cx, cy, targetR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `${meta.color}50`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, targetR, 0, Math.PI * 2); ctx.stroke();
        // User circle
        const d = Math.sqrt((cursorRef.current.x - cx) ** 2 + (cursorRef.current.y - cy) ** 2);
        const userR = Math.min(150, Math.max(20, d));
        const sync = 1 - Math.abs(userR - targetR) / 80;
        ctx.strokeStyle = sync > 0.7 ? '#10B981' : sync > 0.4 ? meta.color : '#EF4444'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(cx, cy, userR, 0, Math.PI * 2); ctx.stroke();
        if (f % 6 === 0) { if (sync > 0.7) addPts(3); else if (sync > 0.4) addPts(1); }
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '18px Inter'; ctx.textAlign = 'center';
        ctx.fillText(breathCycle > 0.5 ? 'Inspirez...' : 'Expirez...', cx, cy + targetR + 50);
      }

      if (gameId === 'pendule') {
        const cx = w / 2, cy = 120;
        const angle = Math.sin(f * 0.03) * 1.2;
        const pendL = h * 0.45;
        const bx = cx + Math.sin(angle) * pendL, by = cy + Math.cos(angle) * pendL;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
        ctx.shadowColor = meta.color; ctx.shadowBlur = 20;
        ctx.fillStyle = meta.color; ctx.beginPath(); ctx.arc(bx, by, 22, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Cute face on ball
        ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(bx - 5, by - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + 5, by - 3, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(bx - 5, by - 3, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bx + 5, by - 3, 1.5, 0, Math.PI * 2); ctx.fill();
        // Smile
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by + 1, 5, 0.1, Math.PI - 0.1); ctx.stroke();
        // Target zone
        ctx.fillStyle = 'rgba(16,185,129,0.12)'; ctx.fillRect(w / 2 - 50, h - 180, 100, 24);
        ctx.strokeStyle = '#10B981'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(w / 2 - 50, h - 180, 100, 24, 12); ctx.stroke();
        if (Math.abs(angle) < 0.15 && keysRef.current.has(' ')) { addPts(25, bx, by); keysRef.current.delete(' '); }
      }

      if (gameId === 'peinture') {
        // Rainbow paint trail with splashes
        if (f % 2 === 0) {
          const hue = (f * 3) % 360;
          const size = 10 + Math.sin(f * 0.1) * 5;
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.7)`;
          ctx.beginPath(); ctx.arc(cursorRef.current.x, cursorRef.current.y, size, 0, Math.PI * 2); ctx.fill();
          // Splash particles
          if (f % 8 === 0) {
            for (let s = 0; s < 3; s++) {
              const sx = cursorRef.current.x + (Math.random() - 0.5) * 30;
              const sy = cursorRef.current.y + (Math.random() - 0.5) * 30;
              ctx.fillStyle = `hsla(${(hue + s * 30) % 360}, 80%, 60%, 0.4)`;
              ctx.beginPath(); ctx.arc(sx, sy, 3 + Math.random() * 4, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
        if (f % 20 === 0) { scoreRef.current += 2; onScoreUpdate(scoreRef.current); }
      }

      if (gameId === 'rebond') {
        const paddleW = 120, paddleH = 14;
        const paddleX = cursorRef.current.x - paddleW / 2;
        const paddleY = h - 180;
        if (!('bx' in (window as any))) { (window as any).bx = w / 2; (window as any).by = paddleY - 20; (window as any).bvx = 3; (window as any).bvy = -4; }
        const ball = window as any;
        ball.bx += ball.bvx; ball.by += ball.bvy;
        if (ball.bx < 10 || ball.bx > w - 10) ball.bvx *= -1;
        if (ball.by < 80) ball.bvy *= -1;
        if (ball.by > paddleY - 10 && ball.by < paddleY + paddleH && ball.bx > paddleX && ball.bx < paddleX + paddleW) { ball.bvy = -Math.abs(ball.bvy); addPts(5, ball.bx, ball.by); }
        if (ball.by > h) { ball.by = paddleY - 20; ball.bx = w / 2; ball.bvy = -4; }
        // Neon paddle
        ctx.shadowColor = meta.color; ctx.shadowBlur = 15;
        ctx.fillStyle = meta.color; ctx.beginPath(); ctx.roundRect(paddleX, paddleY, paddleW, paddleH, 7); ctx.fill();
        ctx.shadowBlur = 0;
        // Glowing ball
        ctx.shadowColor = '#FFF'; ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(ball.bx, ball.by, 9, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Colorful blocks
        if (!(window as any).blocks) { (window as any).blocks = []; for (let r = 0; r < 4; r++) for (let c = 0; c < Math.floor(w / 55); c++) (window as any).blocks.push({ x: 10 + c * 55, y: 100 + r * 25, alive: true, hue: (r * 50 + c * 20) % 360 }); }
        (window as any).blocks.forEach((b: any) => { if (!b.alive) return;
          ctx.fillStyle = `hsl(${b.hue}, 70%, 50%)`; ctx.beginPath(); ctx.roundRect(b.x, b.y, 50, 20, 4); ctx.fill();
          ctx.fillStyle = `hsl(${b.hue}, 70%, 70%)`; ctx.fillRect(b.x + 2, b.y + 2, 46, 6);
          if (ball.bx > b.x && ball.bx < b.x + 50 && ball.by > b.y && ball.by < b.y + 20) { b.alive = false; ball.bvy *= -1; addPts(15, b.x + 25, b.y + 10); } });
      }

      if (gameId === 'gravite') {
        // Space background with nebula
        if (f % 80 === 0) { obstacles.push({ x: Math.random() * w, y: -40, w: 20 + Math.random() * 30, h: 0, speed: 1 + Math.random() * 2, hue: Math.random() * 360 }); }
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const p = obstacles[i] as any;
          p.y += p.speed;
          // Colorful planet
          const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.w);
          pGrad.addColorStop(0, `hsl(${p.hue || 200}, 60%, 50%)`); pGrad.addColorStop(1, `hsl(${(p.hue || 200) + 30}, 60%, 30%)`);
          ctx.fillStyle = pGrad; ctx.beginPath(); ctx.arc(p.x, p.y, p.w, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = `hsl(${p.hue || 200}, 70%, 60%)`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.w + 12, 5, 0.3, 0, Math.PI * 2); ctx.stroke();
          const dx = cursorRef.current.x - p.x, dy = cursorRef.current.y - p.y;
          if (Math.sqrt(dx * dx + dy * dy) < p.w + 14) { gameOverRef.current = true; onFinish(scoreRef.current); return; }
          if (p.y > h + 40) { obstacles.splice(i, 1); }
        }
        if (f % 5 === 0) { scoreRef.current++; onScoreUpdate(scoreRef.current); }
      }

      // ═══ CARTOON CURSOR CHARACTER ═══
      if (!['serpent', 'peinture', 'pendule', 'rebond'].includes(gameId)) {
        const cx = cursorRef.current.x, cy = cursorRef.current.y;
        // Outer glow
        ctx.shadowColor = meta.color; ctx.shadowBlur = 25;
        ctx.fillStyle = `${meta.color}20`; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Body
        ctx.fillStyle = meta.color; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
        // Eyes (white)
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(cx - 5, cy - 3, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 5, cy - 3, 4.5, 0, Math.PI * 2); ctx.fill();
        // Pupils (follow movement direction)
        const pdx = keysRef.current.has('ArrowRight') ? 1.5 : keysRef.current.has('ArrowLeft') ? -1.5 : 0;
        const pdy = keysRef.current.has('ArrowDown') ? 1.5 : keysRef.current.has('ArrowUp') ? -1.5 : 0;
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(cx - 5 + pdx, cy - 3 + pdy, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 5 + pdx, cy - 3 + pdy, 2, 0, Math.PI * 2); ctx.fill();
        // Blush
        ctx.fillStyle = `rgba(255,150,150,0.3)`;
        ctx.beginPath(); ctx.ellipse(cx - 9, cy + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 9, cy + 3, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        // Smile
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy + 2, 5, 0.2, Math.PI - 0.2); ctx.stroke();
      }

      // ═══ CONFETTI PARTICLES ═══
      particles.current = particles.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.025; p.vy += 0.06;
        if (p.life <= 0) return false;
        ctx.globalAlpha = p.life;
        // Colorful confetti shapes
        const hue = (parseInt(p.color?.slice(1) || '0', 16) + frameRef.current) % 360;
        ctx.fillStyle = p.color || `hsl(${hue}, 80%, 60%)`;
        if (Math.random() > 0.5) { ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * p.life, p.size * p.life); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
        return true;
      });

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, [gameId, bleConnected]);

  const nudge = (dx: number, dy: number) => {
    if (gameId === 'serpent') { if (dx !== 0) { keysRef.current.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); setTimeout(() => keysRef.current.delete(dx > 0 ? 'ArrowRight' : 'ArrowLeft'), 200); } if (dy !== 0) { keysRef.current.add(dy > 0 ? 'ArrowDown' : 'ArrowUp'); setTimeout(() => keysRef.current.delete(dy > 0 ? 'ArrowDown' : 'ArrowUp'), 200); } }
    else { cursorRef.current.x += dx * 35; cursorRef.current.y += dy * 35; }
  };

  return (<><canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' } as any} />{!bleConnected && <DPad onNudge={nudge} />}</>);
}

/* ── MAIN PAGE ── */
export default function DorsiGamePage() {
  const { token } = useAuth();
  const router = useRouter();
  const ble = useSharedDorsiBLE();
  const params = useLocalSearchParams();
  const gameId = (params.gameId as string) || 'moutons';
  const programId = params.programId as string;
  const dayNum = parseInt(params.day as string) || 0;
  const sessionNum = parseInt(params.session as string) || 0;
  const [phase, setPhase] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [allScoreHistory, setAllScoreHistory] = useState<any[]>([]);
  const meta = GAMES[gameId] || GAMES.moutons;

  useEffect(() => { if (token) apiFetch('/api/dorsi/score-history', {}, token).then((d: any[]) => { setAllScoreHistory(d); const g = d.find((x: any) => x.game_id === gameId); if (g) setBestScore(g.best); }).catch(() => {}); }, [token, gameId]);

  const handleFinish = useCallback(async (s: number) => { setFinalScore(s); setPhase('end'); if (programId && dayNum && sessionNum) { try { await apiFetch(`/api/dorsi/program/${programId}/session`, { method: 'PUT', body: JSON.stringify({ day_num: dayNum, session_num: sessionNum, score: s }) }, token); } catch {} } }, [programId, dayNum, sessionNum, token]);
  const goBack = () => router.back();
  const replay = () => { setPhase('start'); setScore(0); setTimeLeft(60); setCombo(0); setFinalScore(0); };

  if (Platform.OS !== 'web') return null;

  const isSimon = gameId === 'simon';

  return (
    <div data-testid="dorsi-game-page" style={{ position: 'absolute', inset: 0, background: BG, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      {phase === 'start' && <StartScreen meta={meta} bestScore={bestScore} onStart={() => setPhase('playing')} ble={ble} scoreHistory={allScoreHistory} />}
      {phase === 'playing' && (
        <>
          {isSimon ? <SimonFullScreen onScoreUpdate={setScore} onTimeUpdate={setTimeLeft} onFinish={handleFinish} />
            : <CanvasGame gameId={gameId} meta={meta} onScoreUpdate={setScore} onComboUpdate={setCombo} onTimeUpdate={setTimeLeft} onFinish={handleFinish} bleAngles={ble.angles} bleConnected={ble.connected} />}
          <HUD score={score} timeLeft={timeLeft} combo={combo} bestScore={bestScore} gameName={meta.name} gameColor={meta.color} onBack={goBack} />
        </>
      )}
      {phase === 'end' && <EndScreen score={finalScore} bestScore={bestScore} isNew={finalScore > bestScore} meta={meta} onReplay={replay} onBack={goBack} />}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}} @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}' }} />
    </div>
  );
}
