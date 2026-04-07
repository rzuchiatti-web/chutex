import { useI18n } from '../../context/I18nContext';
import React, { useState, useEffect, useRef } from 'react';

const GAME_CANVAS: any = { borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 360, aspectRatio: '360/400' };
const DPAD_BTN: any = { borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

function useGameTimer(onFinish: (s: number) => void, scoreRef: React.MutableRefObject<number>, gameOverRef: React.MutableRefObject<boolean>) {
  const { t } = useI18n();
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => { setTimeLeft(p => { if (p <= 1) { gameOverRef.current = true; setGameOver(true); onFinish(scoreRef.current); clearInterval(t); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(t);
  }, [gameOver]);
  return { timeLeft, gameOver, setGameOver };
}

function DPad({ onNudge, bleConnected }: { onNudge: (dx: number, dy: number) => void; bleConnected: boolean }) {
  if (bleConnected) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '56px 56px 56px', gridTemplateRows: '56px 56px', gap: 6, justifyContent: 'center', marginTop: 10 } as any}>
      <div /><div onClick={() => onNudge(0, -1)} style={DPAD_BTN}><i className="ri-arrow-up-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div />
      <div onClick={() => onNudge(-1, 0)} style={DPAD_BTN}><i className="ri-arrow-left-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
      <div onClick={() => onNudge(0, 1)} style={DPAD_BTN}><i className="ri-arrow-down-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
      <div onClick={() => onNudge(1, 0)} style={DPAD_BTN}><i className="ri-arrow-right-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
    </div>
  );
}

function ScoreBar({ score, timeLeft, color }: { score: number; timeLeft: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 } as any}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Score: {score}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>{timeLeft}s</span>
    </div>
  );
}

function EndScreen({ score, color }: { score: number; color: string }) {
  return <div style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Bravo !</div><div style={{ fontSize: 28, fontWeight: 900, color }}>{score} pts</div></div>;
}

function useKeys() {
  const keys = useRef<Set<string>>(new Set());
  useEffect(() => {
    const d = (e: KeyboardEvent) => keys.current.add(e.key);
    const u = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', d); window.addEventListener('keyup', u);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); };
  }, []);
  return keys;
}

function useCursor(W: number, H: number, bleAngles: any, bleConnected: boolean, keys: any) {
  const pos = useRef({ x: W / 2, y: H / 2 });
  const base = useRef({ x: 0, y: 0 });
  const init = useRef(false);
  return {
    pos, base, move: () => {
      if (!init.current) { base.current = { x: bleAngles.x, y: bleAngles.y }; init.current = true; }
      if (bleConnected) {
        pos.current.x = W / 2 + (bleAngles.x - base.current.x) * 4;
        pos.current.y = H / 2 - (bleAngles.y - base.current.y) * 4;
      } else {
        const s = 3;
        if (keys.current.has('ArrowLeft') || keys.current.has('a')) pos.current.x -= s;
        if (keys.current.has('ArrowRight') || keys.current.has('d')) pos.current.x += s;
        if (keys.current.has('ArrowUp') || keys.current.has('w')) pos.current.y -= s;
        if (keys.current.has('ArrowDown') || keys.current.has('s')) pos.current.y += s;
      }
      pos.current.x = Math.max(10, Math.min(W - 10, pos.current.x));
      pos.current.y = Math.max(10, Math.min(H - 10, pos.current.y));
    },
    nudge: (dx: number, dy: number) => { pos.current.x += dx * 20; pos.current.y += dy * 20; },
  };
}

/* ── JEU 4: Serpent Lombaire ── */
export function SerpentGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const { timeLeft, gameOver } = useGameTimer(onFinish, scoreRef, gameOverRef);
  const keys = useKeys();
  const snake = useRef([{ x: 180, y: 200 }]);
  const dir = useRef({ x: 1, y: 0 });
  const food = useRef({ x: 100, y: 100 });
  const base = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; const W = 360, H = 400; c.width = W; c.height = H;
    base.current = { x: bleAngles.x, y: bleAngles.y };
    const gs = 20;
    snake.current = [{ x: 9, y: 10 }];
    food.current = { x: Math.floor(Math.random() * (W / gs)), y: Math.floor(Math.random() * (H / gs)) };
    const loop = setInterval(() => {
      if (gameOverRef.current) { clearInterval(loop); return; }
      if (bleConnected) {
        const dx = bleAngles.x - base.current.x, dy = -(bleAngles.y - base.current.y);
        if (Math.abs(dx) > Math.abs(dy)) dir.current = { x: dx > 0 ? 1 : -1, y: 0 };
        else if (Math.abs(dy) > 0.5) dir.current = { x: 0, y: dy > 0 ? 1 : -1 };
      } else {
        if (keys.current.has('ArrowLeft') || keys.current.has('a')) dir.current = { x: -1, y: 0 };
        if (keys.current.has('ArrowRight') || keys.current.has('d')) dir.current = { x: 1, y: 0 };
        if (keys.current.has('ArrowUp') || keys.current.has('w')) dir.current = { x: 0, y: -1 };
        if (keys.current.has('ArrowDown') || keys.current.has('s')) dir.current = { x: 0, y: 1 };
      }
      const head = { x: snake.current[0].x + dir.current.x, y: snake.current[0].y + dir.current.y };
      if (head.x < 0) head.x = W / gs - 1; if (head.x >= W / gs) head.x = 0;
      if (head.y < 0) head.y = H / gs - 1; if (head.y >= H / gs) head.y = 0;
      snake.current.unshift(head);
      if (head.x === food.current.x && head.y === food.current.y) {
        scoreRef.current += 20; setScore(scoreRef.current);
        food.current = { x: Math.floor(Math.random() * (W / gs)), y: Math.floor(Math.random() * (H / gs)) };
      } else { snake.current.pop(); }
      ctx.fillStyle = '#060a10'; ctx.fillRect(0, 0, W, H);
      // Neon grid
      ctx.strokeStyle = 'rgba(249,115,22,0.03)';
      for (let gx = 0; gx < W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      // Food with glow
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath(); ctx.arc(food.current.x * gs + gs/2, food.current.y * gs + gs/2, gs/2 - 2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Snake with glow trail
      snake.current.forEach((s, i) => {
        const alpha = 1 - (i / Math.max(snake.current.length, 1)) * 0.6;
        ctx.fillStyle = i === 0 ? '#10B981' : `rgba(5,150,105,${alpha})`;
        ctx.beginPath(); ctx.arc(s.x * gs + gs/2, s.y * gs + gs/2, gs/2 - 1, 0, Math.PI * 2); ctx.fill();
        if (i === 0) { ctx.shadowColor = '#10B981'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; }
      });
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);
    }, Math.max(80, 150 - difficulty * 70));
    return () => clearInterval(loop);
  }, [difficulty, bleConnected]);
  const nudge = (dx: number, dy: number) => { dir.current = { x: dx, y: dy }; };
  return (<div data-testid="serpent-game" style={{ textAlign: 'center' } as any}><ScoreBar score={score} timeLeft={timeLeft} color="#F59E0B" /><canvas ref={canvasRef} style={GAME_CANVAS} />{!gameOver && <DPad onNudge={nudge} bleConnected={bleConnected} />}{gameOver && <EndScreen score={score} color="#F59E0B" />}</div>);
}

/* ── JEU 5: Labyrinthe ── */
export function LabyrintheGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const { timeLeft, gameOver } = useGameTimer(onFinish, scoreRef, gameOverRef);
  const keys = useKeys();
  const cursor = useCursor(360, 400, bleAngles, bleConnected, keys);
  const walls = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const goal = useRef({ x: 320, y: 360 });

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; const W = 360, H = 400; c.width = W; c.height = H;
    cursor.pos.current = { x: 30, y: 30 };
    // Generate simple maze walls
    walls.current = [];
    for (let i = 0; i < 6 + Math.round(difficulty * 4); i++) {
      const horiz = Math.random() > 0.5;
      walls.current.push({ x: Math.random() * (W - 80) + 20, y: Math.random() * (H - 80) + 40, w: horiz ? 80 + Math.random() * 60 : 12, h: horiz ? 12 : 80 + Math.random() * 60 });
    }
    const anim = () => {
      if (gameOverRef.current) return;
      ctx.fillStyle = '#080612'; ctx.fillRect(0, 0, W, H);
      // Subtle grid
      ctx.strokeStyle = 'rgba(236,72,153,0.02)';
      for (let gx = 0; gx < W; gx += 30) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 30) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      cursor.move();
      // Walls with neon glow
      walls.current.forEach(w => {
        ctx.shadowColor = '#EC4899';
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(236,72,153,0.2)';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(236,72,153,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(w.x, w.y, w.w, w.h);
      });
      // Goal with pulse
      const goalPulse = 18 + Math.sin(Date.now() * 0.004) * 4;
      ctx.shadowColor = '#10B981'; ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(16,185,129,0.15)'; ctx.beginPath(); ctx.arc(goal.current.x, goal.current.y, goalPulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10B981'; ctx.beginPath(); ctx.arc(goal.current.x, goal.current.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Check goal
      const dx = cursor.pos.current.x - goal.current.x, dy = cursor.pos.current.y - goal.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < 22) {
        scoreRef.current += 30; setScore(scoreRef.current);
        goal.current = { x: 30 + Math.random() * 300, y: 30 + Math.random() * 340 };
        cursor.pos.current = { x: 30, y: 30 };
      }
      // Cursor
      ctx.fillStyle = '#EC4899'; ctx.beginPath(); ctx.arc(cursor.pos.current.x, cursor.pos.current.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [difficulty, bleConnected]);
  return (<div data-testid="labyrinthe-game" style={{ textAlign: 'center' } as any}><ScoreBar score={score} timeLeft={timeLeft} color="#EC4899" /><canvas ref={canvasRef} style={GAME_CANVAS} />{!gameOver && <DPad onNudge={cursor.nudge} bleConnected={bleConnected} />}{gameOver && <EndScreen score={score} color="#EC4899" />}</div>);
}

/* ── JEU 6: Slalom Postural ── */
export function SlalomGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const { timeLeft, gameOver } = useGameTimer(onFinish, scoreRef, gameOverRef);
  const keys = useKeys();
  const playerX = useRef(180);
  const gates = useRef<{ x: number; y: number; gap: number; passed: boolean }[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; const W = 360, H = 400; c.width = W; c.height = H;
    gates.current = [];
    const base = { x: bleAngles.x };
    const anim = () => {
      if (gameOverRef.current) return;
      ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
      frame.current++;
      // Move player
      if (bleConnected) { playerX.current = W / 2 + (bleAngles.x - base.x) * 5; }
      else {
        if (keys.current.has('ArrowLeft') || keys.current.has('a')) playerX.current -= 4;
        if (keys.current.has('ArrowRight') || keys.current.has('d')) playerX.current += 4;
      }
      playerX.current = Math.max(15, Math.min(W - 15, playerX.current));
      // Spawn gates
      if (frame.current % Math.max(30, 60 - Math.round(difficulty * 30)) === 0) {
        const gap = Math.max(60, 100 - difficulty * 30);
        gates.current.push({ x: 30 + Math.random() * (W - 60 - gap), y: -20, gap, passed: false });
      }
      // Draw gates
      gates.current = gates.current.filter(g => {
        g.y += 2 + difficulty * 2;
        ctx.fillStyle = '#06B6D4'; ctx.fillRect(0, g.y, g.x, 8); ctx.fillRect(g.x + g.gap, g.y, W - g.x - g.gap, 8);
        // Check pass
        if (!g.passed && g.y > H - 40) {
          if (playerX.current > g.x && playerX.current < g.x + g.gap) { g.passed = true; scoreRef.current += 15; setScore(scoreRef.current); }
        }
        return g.y < H + 20;
      });
      // Player
      ctx.fillStyle = '#06B6D4'; ctx.beginPath(); ctx.moveTo(playerX.current, H - 20); ctx.lineTo(playerX.current - 12, H - 5); ctx.lineTo(playerX.current + 12, H - 5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [difficulty, bleConnected]);
  const nudge = (dx: number) => { playerX.current += dx * 25; };
  return (<div data-testid="slalom-game" style={{ textAlign: 'center' } as any}><ScoreBar score={score} timeLeft={timeLeft} color="#06B6D4" /><canvas ref={canvasRef} style={GAME_CANVAS} />{!gameOver && !bleConnected && (<div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10 } as any}><div onClick={() => nudge(-1)} style={{ ...DPAD_BTN, width: 60, height: 60 } as any}><i className="ri-arrow-left-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div onClick={() => nudge(1)} style={{ ...DPAD_BTN, width: 60, height: 60 } as any}><i className="ri-arrow-right-line" style={{ fontSize: 20, color: '#FFF' }} /></div></div>)}{gameOver && <EndScreen score={score} color="#06B6D4" />}</div>);
}

/* ── JEU 7: Pluie d'Etoiles ── */
export function EtoilesGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const { timeLeft, gameOver } = useGameTimer(onFinish, scoreRef, gameOverRef);
  const keys = useKeys();
  const cursor = useCursor(360, 400, bleAngles, bleConnected, keys);
  const stars = useRef<{ x: number; y: number; caught: boolean; speed: number }[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; const W = 360, H = 400; c.width = W; c.height = H;
    const anim = () => {
      if (gameOverRef.current) return;
      ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
      cursor.move();
      frame.current++;
      if (frame.current % Math.max(10, 30 - Math.round(difficulty * 15)) === 0) {
        stars.current.push({ x: Math.random() * (W - 20) + 10, y: -10, caught: false, speed: 1.5 + Math.random() * 2 });
      }
      stars.current = stars.current.filter(s => {
        if (s.caught) return false;
        s.y += s.speed;
        // Draw star
        ctx.fillStyle = '#F97316'; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(frame.current * 0.02);
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(2, -3); ctx.lineTo(8, -3); ctx.lineTo(3, 1); ctx.lineTo(5, 7); ctx.lineTo(0, 3); ctx.lineTo(-5, 7); ctx.lineTo(-3, 1); ctx.lineTo(-8, -3); ctx.lineTo(-2, -3); ctx.closePath(); ctx.fill(); }
        ctx.restore();
        const dx = cursor.pos.current.x - s.x, dy = cursor.pos.current.y - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) { s.caught = true; scoreRef.current += 10; setScore(scoreRef.current); return false; }
        return s.y < H + 10;
      });
      ctx.fillStyle = '#F97316'; ctx.beginPath(); ctx.arc(cursor.pos.current.x, cursor.pos.current.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [difficulty, bleConnected]);
  return (<div data-testid="etoiles-game" style={{ textAlign: 'center' } as any}><ScoreBar score={score} timeLeft={timeLeft} color="#F97316" /><canvas ref={canvasRef} style={GAME_CANVAS} />{!gameOver && <DPad onNudge={cursor.nudge} bleConnected={bleConnected} />}{gameOver && <EndScreen score={score} color="#F97316" />}</div>);
}

/* ── JEU 8: Simon Postural ── */
export function SimonGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const [score, setScore] = useState(0);
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [showing, setShowing] = useState(true);
  const [activeDir, setActiveDir] = useState('');
  const [feedback, setFeedback] = useState('');
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const { timeLeft, gameOver, setGameOver } = useGameTimer(onFinish, scoreRef, gameOverRef);
  const dirs = ['up', 'down', 'left', 'right'];
  const colors: Record<string, string> = { up: '#22D3EE', down: '#F97316', left: '#A78BFA', right: '#10B981' };
  const icons: Record<string, string> = { up: 'ri-arrow-up-line', down: 'ri-arrow-down-line', left: 'ri-arrow-left-line', right: 'ri-arrow-right-line' };

  const addToSequence = useCallback(() => {
    const next = [...sequence, dirs[Math.floor(Math.random() * 4)]];
    setSequence(next);
    setPlayerIdx(0);
    setShowing(true);
    // Show sequence
    next.forEach((d, i) => {
      setTimeout(() => setActiveDir(d), i * 600 + 200);
      setTimeout(() => setActiveDir(''), i * 600 + 500);
    });
    setTimeout(() => { setShowing(false); setActiveDir(''); }, next.length * 600 + 300);
  }, [sequence]);

  useEffect(() => { if (!gameOver) addToSequence(); }, []);

  const handleInput = (dir: string) => {
    if (showing || gameOver) return;
    if (dir === sequence[playerIdx]) {
      setFeedback('ok');
      setTimeout(() => setFeedback(''), 200);
      if (playerIdx + 1 >= sequence.length) {
        scoreRef.current += sequence.length * 10;
        setScore(scoreRef.current);
        setTimeout(() => addToSequence(), 500);
      } else { setPlayerIdx(playerIdx + 1); }
    } else {
      setFeedback('fail');
      setTimeout(() => { setFeedback(''); addToSequence(); }, 800);
      setSequence([]);
    }
  };

  useEffect(() => {
    if (gameOver) return;
    const onKey = (e: KeyboardEvent) => {
      const m: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (m[e.key]) handleInput(m[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showing, playerIdx, sequence, gameOver]);

  return (
    <div data-testid="simon-game" style={{ textAlign: 'center' } as any}>
      <ScoreBar score={score} timeLeft={timeLeft} color="#EF4444" />
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>{showing ? `Memorisez... (${sequence.length} directions)` : `Votre tour (${playerIdx + 1}/${sequence.length})`}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 80px', gridTemplateRows: '80px 80px', gap: 10, justifyContent: 'center' } as any}>
        {['', 'up', '', 'left', 'down', 'right'].map((d, i) => d ? (
          <div key={d} onClick={() => handleInput(d)} style={{ borderRadius: 16, background: activeDir === d ? `${colors[d]}40` : `${colors[d]}10`, border: `2px solid ${activeDir === d ? colors[d] : `${colors[d]}30`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', transform: activeDir === d ? 'scale(1.1)' : 'scale(1)' } as any}>
            <i className={icons[d]} style={{ fontSize: 28, color: colors[d] }} />
          </div>
        ) : <div key={i} />)}
      </div>
      {feedback === 'ok' && <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: '#10B981' }}>Correct !</div>}
      {feedback === 'fail' && <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Faux ! On recommence...</div>}
      {gameOver && <EndScreen score={score} color="#EF4444" />}
    </div>
  );
}

/* ── JEU 9: Cercles Concentriques ── */
export function CerclesGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const { timeLeft, gameOver } = useGameTimer(onFinish, scoreRef, gameOverRef);
  const keys = useKeys();
  const cursor = useCursor(360, 360, bleAngles, bleConnected, keys);
  const circles = useRef<{ x: number; y: number; r: number; maxR: number; growing: boolean }[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; const W = 360, H = 360; c.width = W; c.height = H;
    const anim = () => {
      if (gameOverRef.current) return;
      ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
      cursor.move();
      frame.current++;
      if (frame.current % Math.max(20, 50 - Math.round(difficulty * 25)) === 0) {
        circles.current.push({ x: 40 + Math.random() * 280, y: 40 + Math.random() * 280, r: 5, maxR: 30 + Math.random() * 20, growing: true });
      }
      circles.current = circles.current.filter(ci => {
        ci.r += 0.5; if (ci.r > ci.maxR) return false;
        const alpha = 1 - ci.r / ci.maxR;
        ctx.strokeStyle = `rgba(139,92,246,${alpha})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ci.x, ci.y, ci.r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(139,92,246,${alpha * 0.1})`; ctx.fill();
        const dx = cursor.pos.current.x - ci.x, dy = cursor.pos.current.y - ci.y;
        if (Math.sqrt(dx * dx + dy * dy) < ci.r + 10) {
          scoreRef.current += Math.round(20 * alpha); setScore(scoreRef.current); return false;
        }
        return true;
      });
      ctx.fillStyle = '#8B5CF6'; ctx.beginPath(); ctx.arc(cursor.pos.current.x, cursor.pos.current.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [difficulty, bleConnected]);
  return (<div data-testid="cercles-game" style={{ textAlign: 'center' } as any}><ScoreBar score={score} timeLeft={timeLeft} color="#8B5CF6" /><canvas ref={canvasRef} style={{ ...GAME_CANVAS, aspectRatio: '1' }} />{!gameOver && <DPad onNudge={cursor.nudge} bleConnected={bleConnected} />}{gameOver && <EndScreen score={score} color="#8B5CF6" />}</div>);
}

/* ── JEU 10: Course d'Obstacles ── */
export function CourseGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const { timeLeft, gameOver } = useGameTimer(onFinish, scoreRef, gameOverRef);
  const keys = useKeys();
  const playerY = useRef(200);
  const obstacles = useRef<{ x: number; y: number; h: number }[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext('2d')!; const W = 360, H = 400; c.width = W; c.height = H;
    const base = { y: bleAngles.y };
    const anim = () => {
      if (gameOverRef.current) return;
      ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
      frame.current++;
      // Ground lines
      for (let i = 0; i < W; i += 40) { const x = (i - frame.current * 2) % W; if (x > 0) { ctx.strokeStyle = 'rgba(20,184,166,0.06)'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } }
      // Move player
      if (bleConnected) { playerY.current = H / 2 - (bleAngles.y - base.y) * 5; }
      else {
        if (keys.current.has('ArrowUp') || keys.current.has('w')) playerY.current -= 3;
        if (keys.current.has('ArrowDown') || keys.current.has('s')) playerY.current += 3;
      }
      playerY.current = Math.max(20, Math.min(H - 20, playerY.current));
      // Spawn obstacles
      if (frame.current % Math.max(20, 45 - Math.round(difficulty * 20)) === 0) {
        const h = 40 + Math.random() * 80;
        obstacles.current.push({ x: W + 10, y: Math.random() * (H - h), h });
      }
      // Score per frame survived
      if (frame.current % 5 === 0) { scoreRef.current++; setScore(scoreRef.current); }
      // Draw obstacles
      obstacles.current = obstacles.current.filter(o => {
        o.x -= 3 + difficulty * 2;
        ctx.fillStyle = 'rgba(20,184,166,0.3)'; ctx.fillRect(o.x, o.y, 20, o.h);
        ctx.strokeStyle = '#14B8A6'; ctx.lineWidth = 1; ctx.strokeRect(o.x, o.y, 20, o.h);
        // Collision
        if (o.x < 50 && o.x + 20 > 30 && playerY.current > o.y && playerY.current < o.y + o.h) {
          gameOverRef.current = true; onFinish(scoreRef.current);
        }
        return o.x > -30;
      });
      // Player
      ctx.fillStyle = '#14B8A6';
      ctx.beginPath(); ctx.moveTo(50, playerY.current); ctx.lineTo(30, playerY.current - 10); ctx.lineTo(30, playerY.current + 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, [difficulty, bleConnected]);
  const nudge = (dy: number) => { playerY.current += dy * 25; };
  return (<div data-testid="course-game" style={{ textAlign: 'center' } as any}><ScoreBar score={score} timeLeft={timeLeft} color="#14B8A6" /><canvas ref={canvasRef} style={GAME_CANVAS} />{!gameOver && !bleConnected && (<div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10, flexDirection: 'column', alignItems: 'center' } as any}><div onClick={() => nudge(-1)} style={{ ...DPAD_BTN, width: 60, height: 60 } as any}><i className="ri-arrow-up-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div onClick={() => nudge(1)} style={{ ...DPAD_BTN, width: 60, height: 60 } as any}><i className="ri-arrow-down-line" style={{ fontSize: 20, color: '#FFF' }} /></div></div>)}{gameOver && <EndScreen score={score} color="#14B8A6" />}</div>);
}
