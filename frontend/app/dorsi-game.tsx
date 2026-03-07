import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useDorsiBLE } from '../src/hooks/useDorsiBLE';

const BG = '#0A0A14';

/* ── Animated HUD ── */
function HUD({ score, timeLeft, bestScore, combo, gameName, gameColor, onBack }: any) {
  const pct = (timeLeft / 60) * 100;
  const urgent = timeLeft < 10;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, padding: '12px 16px', background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)', pointerEvents: 'none' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' } as any}>
        <div onClick={onBack} style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{gameName}</div>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginTop: 4, overflow: 'hidden' } as any}>
            <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: urgent ? '#EF4444' : gameColor, transition: 'width 1s linear' } as any} />
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 50 } as any}>
          <div style={{ fontSize: 24, fontWeight: 900, color: urgent ? '#EF4444' : '#FFF', fontFamily: 'monospace', animation: urgent ? 'pulse 0.5s ease infinite' : 'none' }}>{timeLeft}</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>sec</div>
        </div>
      </div>
      {/* Score bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, gap: 8 } as any}>
        <div style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
          <i className="ri-star-fill" style={{ fontSize: 14, color: gameColor }} />
          <span style={{ fontSize: 16, fontWeight: 900, color: '#FFF', fontFamily: 'monospace' }}>{score}</span>
        </div>
        {combo > 1 && (
          <div style={{ padding: '6px 14px', borderRadius: 999, background: `${gameColor}25`, border: `1px solid ${gameColor}40`, animation: 'bounceIn 0.3s ease' } as any}>
            <span style={{ fontSize: 14, fontWeight: 900, color: gameColor }}>x{combo}</span>
          </div>
        )}
        {bestScore > 0 && (
          <div style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.05)' } as any}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Record: {bestScore}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Start Screen ── */
function StartScreen({ gameName, gameColor, gameIcon, description, onStart, bestScore }: any) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, fontFamily: 'Inter, system-ui, sans-serif' } as any}>
      <div style={{ textAlign: 'center', padding: 32, maxWidth: 380 } as any}>
        <div style={{ width: 100, height: 100, borderRadius: 28, background: `${gameColor}15`, border: `2px solid ${gameColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', animation: 'float 3s ease-in-out infinite' } as any}>
          <i className={gameIcon} style={{ fontSize: 48, color: gameColor }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#FFF', margin: '0 0 8px' }}>{gameName}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 32px' }}>{description}</p>
        {bestScore > 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Meilleur score : <strong style={{ color: gameColor }}>{bestScore}</strong></div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 } as any}>
          <div style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <i className="ri-timer-line" style={{ fontSize: 14 }} />60 secondes
          </div>
          <div style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <i className="ri-gamepad-line" style={{ fontSize: 14 }} />Clavier ou coussin
          </div>
        </div>
        <div onClick={onStart} data-testid="start-game-btn" style={{ padding: '18px 48px', borderRadius: 999, background: gameColor, cursor: 'pointer', color: '#FFF', fontSize: 17, fontWeight: 900, display: 'inline-block', boxShadow: `0 8px 32px ${gameColor}40` } as any}>
          Jouer
        </div>
      </div>
    </div>
  );
}

/* ── End Screen ── */
function EndScreen({ score, bestScore, isNewRecord, gameName, gameColor, onReplay, onBack }: any) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, fontFamily: 'Inter, system-ui, sans-serif' } as any}>
      <div style={{ textAlign: 'center', padding: 32, maxWidth: 380 } as any}>
        {isNewRecord && <div style={{ fontSize: 12, fontWeight: 800, color: gameColor, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, animation: 'bounceIn 0.5s ease' }}>Nouveau record !</div>}
        <div style={{ fontSize: 64, fontWeight: 900, color: '#FFF', lineHeight: 1, marginBottom: 4 }}>{score}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>points</div>
        {bestScore > 0 && !isNewRecord && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Record : {bestScore}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' } as any}>
          <div onClick={onReplay} style={{ padding: '16px 32px', borderRadius: 999, background: gameColor, cursor: 'pointer', color: '#FFF', fontSize: 15, fontWeight: 800, boxShadow: `0 6px 24px ${gameColor}40` } as any}>
            <i className="ri-refresh-line" style={{ marginRight: 8 }} />Rejouer
          </div>
          <div onClick={onBack} style={{ padding: '16px 24px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', cursor: 'pointer', color: '#FFF', fontSize: 15, fontWeight: 700 } as any}>
            Retour
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── D-Pad for touch/mouse ── */
function DPadOverlay({ onNudge }: { onNudge: (dx: number, dy: number) => void }) {
  const B: any = { width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' };
  return (
    <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 15, display: 'grid', gridTemplateColumns: '64px 64px 64px', gridTemplateRows: '64px 64px', gap: 6 } as any}>
      <div /><div onClick={() => onNudge(0, -1)} style={B}><i className="ri-arrow-up-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }} /></div><div />
      <div onClick={() => onNudge(-1, 0)} style={B}><i className="ri-arrow-left-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }} /></div>
      <div onClick={() => onNudge(0, 1)} style={B}><i className="ri-arrow-down-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }} /></div>
      <div onClick={() => onNudge(1, 0)} style={B}><i className="ri-arrow-right-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)' }} /></div>
    </div>
  );
}

/* ── GAME META ── */
const GAMES: Record<string, { name: string; icon: string; color: string; desc: string }> = {
  moutons: { name: 'Jeu des Moutons', icon: 'ri-ghost-smile-line', color: '#22D3EE', desc: 'Deplacez-vous pour attraper tous les moutons. Plus vous etes rapide, plus le combo monte !' },
  bulles: { name: 'Bulles de Savon', icon: 'ri-bubble-chart-line', color: '#A78BFA', desc: 'Eclatez les bulles avant qu\'elles disparaissent. Visez les plus petites pour plus de points.' },
  proprioception: { name: 'Equilibre', icon: 'ri-focus-3-line', color: '#10B981', desc: 'Restez au centre le plus longtemps possible. Chaque seconde dans la zone verte = +3 points.' },
  serpent: { name: 'Serpent', icon: 'ri-route-line', color: '#F59E0B', desc: 'Mangez les fruits pour grandir. Attention a ne pas toucher les bords !' },
  labyrinthe: { name: 'Labyrinthe', icon: 'ri-compass-discover-line', color: '#EC4899', desc: 'Trouvez les cibles cachees dans le labyrinthe en evitant les murs.' },
  slalom: { name: 'Slalom', icon: 'ri-flag-line', color: '#06B6D4', desc: 'Passez entre les portes du slalom. Plus vous avancez, plus c\'est rapide !' },
  etoiles: { name: 'Pluie d\'Etoiles', icon: 'ri-star-line', color: '#F97316', desc: 'Attrapez les etoiles qui tombent du ciel. Les dorees valent plus !' },
  simon: { name: 'Simon', icon: 'ri-flashlight-line', color: '#EF4444', desc: 'Memorisez et reproduisez la sequence de directions. Elle s\'allonge a chaque tour.' },
  cercles: { name: 'Cercles', icon: 'ri-record-circle-line', color: '#8B5CF6', desc: 'Touchez les cercles avant qu\'ils ne disparaissent. Plus ils sont petits, plus ils rapportent.' },
  course: { name: 'Course', icon: 'ri-run-line', color: '#14B8A6', desc: 'Esquivez les obstacles dans cette course infinie. Survivez le plus longtemps possible !' },
};

/* ── Full-screen Canvas Game Engine ── */
function FullScreenGame({ gameId, onFinish, bleAngles, bleConnected }: { gameId: string; onFinish: (score: number) => void; bleAngles: any; bleConnected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const gameOverRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());
  const cursorRef = useRef({ x: 0, y: 0 });
  const baseAngle = useRef({ x: 0, y: 0 });
  const bleRef = useRef(bleAngles);
  const frameRef = useRef(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }[]>([]);
  const meta = GAMES[gameId];

  useEffect(() => { bleRef.current = bleAngles; }, [bleAngles]);

  const addScore = (pts: number) => {
    scoreRef.current += pts;
    comboRef.current++;
    setScore(scoreRef.current);
    setCombo(comboRef.current);
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 1, color, size: 2 + Math.random() * 4 });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const W = () => canvas.width;
    const H = () => canvas.height;
    cursorRef.current = { x: W() / 2, y: H() / 2 };
    baseAngle.current = { x: bleRef.current.x, y: bleRef.current.y };

    const onKey = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    // Game-specific state
    const targets: { x: number; y: number; r: number; caught: boolean; type: string; age: number }[] = [];
    const obstacles: { x: number; y: number; w: number; h: number; speed: number }[] = [];
    let snakeBody: { x: number; y: number }[] = [{ x: 10, y: 10 }];
    let snakeDir = { x: 1, y: 0 };
    let snakeFood = { x: 5, y: 5 };
    let snakeTick = 0;

    // Spawn initial targets
    const spawnTarget = () => {
      targets.push({ x: 40 + Math.random() * (W() - 80), y: 120 + Math.random() * (H() - 240), r: 12 + Math.random() * 8, caught: false, type: Math.random() > 0.8 ? 'gold' : 'normal', age: 0 });
    };
    for (let i = 0; i < 6; i++) spawnTarget();

    const moveCursor = () => {
      const speed = 4;
      if (bleConnected) {
        cursorRef.current.x = W() / 2 + (bleRef.current.x - baseAngle.current.x) * 6;
        cursorRef.current.y = H() / 2 - (bleRef.current.y - baseAngle.current.y) * 6;
      } else {
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) cursorRef.current.x -= speed;
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) cursorRef.current.x += speed;
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) cursorRef.current.y -= speed;
        if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) cursorRef.current.y += speed;
      }
      cursorRef.current.x = Math.max(15, Math.min(W() - 15, cursorRef.current.x));
      cursorRef.current.y = Math.max(100, Math.min(H() - 160, cursorRef.current.y));
    };

    const drawParticles = () => {
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.025; p.vy += 0.1;
        if (p.life <= 0) return false;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });
    };

    const loop = () => {
      if (gameOverRef.current) return;
      const w = W(), h = H();
      frameRef.current++;

      // Background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);
      // Subtle grid
      ctx.strokeStyle = `${meta.color}08`;
      for (let i = 0; i < w; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let i = 0; i < h; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }

      moveCursor();

      // ── GAME LOGIC ──
      if (gameId === 'moutons' || gameId === 'bulles' || gameId === 'etoiles' || gameId === 'cercles' || gameId === 'labyrinthe') {
        // Spawn new targets
        if (frameRef.current % 60 === 0) spawnTarget();
        if (gameId === 'etoiles') { // Falling stars
          targets.forEach(t => { t.y += 1.5; t.age++; });
        } else {
          targets.forEach(t => t.age++);
        }
        // Draw & check targets
        for (let i = targets.length - 1; i >= 0; i--) {
          const t = targets[i];
          if (t.caught) continue;
          if (t.y > h + 20 || t.age > 300) { targets.splice(i, 1); comboRef.current = 0; setCombo(0); continue; }
          // Draw
          const glow = Math.sin(frameRef.current * 0.05 + i) * 0.3 + 0.7;
          const c = t.type === 'gold' ? '#FFD700' : meta.color;
          ctx.fillStyle = `${c}${Math.round(glow * 40).toString(16).padStart(2, '0')}`;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r + 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
          // Highlight
          ctx.fillStyle = `rgba(255,255,255,${glow * 0.4})`;
          ctx.beginPath(); ctx.arc(t.x - t.r * 0.3, t.y - t.r * 0.3, t.r * 0.3, 0, Math.PI * 2); ctx.fill();
          // Check collision
          const dx = cursorRef.current.x - t.x, dy = cursorRef.current.y - t.y;
          if (Math.sqrt(dx * dx + dy * dy) < t.r + 16) {
            t.caught = true;
            const pts = t.type === 'gold' ? 50 : 15 + Math.min(comboRef.current * 2, 20);
            addScore(pts);
            spawnParticles(t.x, t.y, c, 12);
            targets.splice(i, 1);
            spawnTarget();
          }
        }
      }

      if (gameId === 'proprioception') {
        // Center zone scoring
        const cx = w / 2, cy = h / 2;
        [120, 80, 40].forEach((r, i) => { ctx.fillStyle = ['rgba(16,185,129,0.05)', 'rgba(16,185,129,0.1)', 'rgba(16,185,129,0.2)'][i]; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); });
        ctx.strokeStyle = `${meta.color}40`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.stroke();
        // Score
        const d = Math.sqrt((cursorRef.current.x - cx) ** 2 + (cursorRef.current.y - cy) ** 2);
        if (frameRef.current % 8 === 0) {
          if (d < 40) { addScore(3); } else if (d < 80) { addScore(2); } else if (d < 120) { addScore(1); }
        }
      }

      if (gameId === 'slalom' || gameId === 'course') {
        // Falling/scrolling obstacles
        if (frameRef.current % 40 === 0) {
          if (gameId === 'slalom') {
            const gap = 100; const gx = 30 + Math.random() * (w - 60 - gap);
            obstacles.push({ x: gx, y: -10, w: gap, h: 8, speed: 3 });
          } else {
            obstacles.push({ x: w + 10, y: 120 + Math.random() * (h - 280), w: 24, h: 50 + Math.random() * 100, speed: 4 });
          }
        }
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          if (gameId === 'slalom') { o.y += o.speed; } else { o.x -= o.speed; }
          ctx.fillStyle = `${meta.color}30`;
          ctx.fillRect(gameId === 'slalom' ? 0 : o.x, o.y, gameId === 'slalom' ? o.x : o.w, o.h);
          if (gameId === 'slalom') ctx.fillRect(o.x + o.w, o.y, w - o.x - o.w, o.h);
          ctx.strokeStyle = meta.color; ctx.lineWidth = 1;
          if (gameId === 'slalom') { ctx.strokeRect(0, o.y, o.x, o.h); ctx.strokeRect(o.x + o.w, o.y, w - o.x - o.w, o.h); }
          else { ctx.strokeRect(o.x, o.y, o.w, o.h); }
          if (o.y > h + 20 || o.x < -30) { if (gameId === 'slalom') addScore(10); obstacles.splice(i, 1); }
        }
        if (gameId === 'course' && frameRef.current % 4 === 0) addScore(1);
      }

      if (gameId === 'serpent') {
        snakeTick++;
        if (snakeTick % 6 === 0) {
          if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) snakeDir = { x: -1, y: 0 };
          if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) snakeDir = { x: 1, y: 0 };
          if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) snakeDir = { x: 0, y: -1 };
          if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) snakeDir = { x: 0, y: 1 };
          const gs = 20; const cols = Math.floor(w / gs); const rows = Math.floor((h - 200) / gs);
          const head = { x: (snakeBody[0].x + snakeDir.x + cols) % cols, y: (snakeBody[0].y + snakeDir.y + rows) % rows };
          snakeBody.unshift(head);
          if (head.x === snakeFood.x && head.y === snakeFood.y) {
            addScore(20); spawnParticles(snakeFood.x * gs + gs / 2, snakeFood.y * gs + 100 + gs / 2, meta.color, 8);
            snakeFood = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
          } else { snakeBody.pop(); }
          // Draw
          const gs2 = gs;
          ctx.fillStyle = meta.color; ctx.fillRect(snakeFood.x * gs2, snakeFood.y * gs2 + 100, gs2 - 2, gs2 - 2);
          snakeBody.forEach((s, idx) => { ctx.fillStyle = idx === 0 ? '#FFF' : `${meta.color}${Math.max(40, 255 - idx * 15).toString(16)}`; ctx.fillRect(s.x * gs2, s.y * gs2 + 100, gs2 - 2, gs2 - 2); });
        }
      }

      // ── CURSOR ──
      if (gameId !== 'serpent' && gameId !== 'simon') {
        // Glow
        ctx.fillStyle = `${meta.color}15`;
        ctx.beginPath(); ctx.arc(cursorRef.current.x, cursorRef.current.y, 28, 0, Math.PI * 2); ctx.fill();
        // Main
        ctx.fillStyle = meta.color;
        ctx.beginPath(); ctx.arc(cursorRef.current.x, cursorRef.current.y, 14, 0, Math.PI * 2); ctx.fill();
        // Inner
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(cursorRef.current.x - 3, cursorRef.current.y - 3, 4, 0, Math.PI * 2); ctx.fill();
      }

      drawParticles();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [gameId, bleConnected]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { gameOverRef.current = true; setGameOver(true); onFinish(scoreRef.current); clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onFinish]);

  const nudge = (dx: number, dy: number) => { cursorRef.current.x += dx * 30; cursorRef.current.y += dy * 30; };

  return (
    <>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' } as any} />
      {!bleConnected && <DPadOverlay onNudge={nudge} />}
    </>
  );
}

/* ── MAIN PAGE ── */
export default function DorsiGamePage() {
  const { token } = useAuth();
  const router = useRouter();
  const ble = useDorsiBLE();
  const params = useLocalSearchParams();
  const gameId = (params.gameId as string) || 'moutons';
  const programId = params.programId as string;
  const dayNum = parseInt(params.day as string) || 0;
  const sessionNum = parseInt(params.session as string) || 0;
  const [phase, setPhase] = useState<'start' | 'playing' | 'end'>('start');
  const [finalScore, setFinalScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const meta = GAMES[gameId] || GAMES.moutons;

  // Fetch best score
  useEffect(() => {
    if (token) apiFetch('/api/dorsi/score-history', {}, token).then((data: any[]) => {
      const g = data.find((d: any) => d.game_id === gameId);
      if (g) setBestScore(g.best);
    }).catch(() => {});
  }, [token, gameId]);

  const handleFinish = useCallback(async (score: number) => {
    setFinalScore(score);
    setPhase('end');
    // Save score if part of a program
    if (programId && dayNum && sessionNum) {
      try {
        await apiFetch(`/api/dorsi/program/${programId}/session`, {
          method: 'PUT', body: JSON.stringify({ day_num: dayNum, session_num: sessionNum, score }),
        }, token);
      } catch {}
    }
  }, [programId, dayNum, sessionNum, token]);

  const goBack = () => router.back();
  const replay = () => { setPhase('start'); setFinalScore(0); };

  if (Platform.OS !== 'web') return null;

  return (
    <div data-testid="dorsi-game-page" style={{ position: 'absolute', inset: 0, background: BG, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      {phase === 'start' && <StartScreen gameName={meta.name} gameColor={meta.color} gameIcon={meta.icon} description={meta.desc} bestScore={bestScore} onStart={() => setPhase('playing')} />}
      {phase === 'playing' && (
        <>
          <FullScreenGame gameId={gameId} onFinish={handleFinish} bleAngles={ble.angles} bleConnected={ble.connected} />
          <HUD score={finalScore || 0} timeLeft={60} bestScore={bestScore} combo={0} gameName={meta.name} gameColor={meta.color} onBack={goBack} />
        </>
      )}
      {phase === 'end' && <EndScreen score={finalScore} bestScore={bestScore} isNewRecord={finalScore > bestScore} gameName={meta.name} gameColor={meta.color} onReplay={replay} onBack={goBack} />}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      ` }} />
    </div>
  );
}
