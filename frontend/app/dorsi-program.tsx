import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const ACCENT = '#F97316';
const BG = 'linear-gradient(135deg, #0A0A0F 0%, #141420 50%, #0A0A0F 100%)';

/* ────────────────────────────────────────
   MINI-GAME 1: Esquive Lombaire (Dodge)
   ──────────────────────────────────────── */
function DodgeGame({ difficulty, onFinish }: { difficulty: number; onFinish: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const playerX = useRef(180);
  const obstacles = useRef<{ x: number; y: number; speed: number; w: number }[]>([]);
  const animRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const gameOverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 360, H = 500;
    canvas.width = W; canvas.height = H;
    const playerW = 40, playerH = 40;
    playerX.current = W / 2 - playerW / 2;
    obstacles.current = [];
    let frame = 0;
    const spawnRate = Math.max(15, 40 - Math.round(difficulty * 25));

    const onKey = (e: KeyboardEvent) => { keysRef.current.add(e.key); };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    const loop = () => {
      if (gameOverRef.current) return;
      ctx.clearRect(0, 0, W, H);
      // BG
      ctx.fillStyle = '#0A0A14';
      ctx.fillRect(0, 0, W, H);
      // Grid lines
      ctx.strokeStyle = 'rgba(249,115,22,0.06)';
      for (let i = 0; i < W; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = 0; i < H; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // Move player
      const speed = 5;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) playerX.current = Math.max(0, playerX.current - speed);
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) playerX.current = Math.min(W - playerW, playerX.current + speed);

      // Spawn obstacles
      frame++;
      if (frame % spawnRate === 0) {
        const w = 20 + Math.random() * 30;
        obstacles.current.push({ x: Math.random() * (W - w), y: -30, speed: 2 + difficulty * 3 + Math.random() * 2, w });
      }

      // Update & draw obstacles
      obstacles.current = obstacles.current.filter(o => {
        o.y += o.speed;
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + 15, o.w / 2, 0, Math.PI * 2);
        ctx.fill();
        // Collision check
        if (o.y + 30 > H - playerH - 10 && o.y < H - 10 &&
          o.x + o.w > playerX.current && o.x < playerX.current + playerW) {
          gameOverRef.current = true;
          setGameOver(true);
          onFinish(scoreRef.current);
          return false;
        }
        if (o.y > H) {
          scoreRef.current += 10;
          setScore(scoreRef.current);
          return false;
        }
        return true;
      });

      // Player
      ctx.fillStyle = ACCENT;
      const px = playerX.current, py = H - playerH - 10;
      ctx.beginPath();
      ctx.roundRect(px, py, playerW, playerH, 8);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('\u2022', px + playerW / 2, py + playerH / 2 + 5);

      // Score
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [difficulty, onFinish]);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          gameOverRef.current = true;
          setGameOver(true);
          onFinish(scoreRef.current);
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onFinish]);

  const movePlayer = (dir: 'left' | 'right') => {
    const step = 25;
    if (dir === 'left') playerX.current = Math.max(0, playerX.current - step);
    else playerX.current = Math.min(320, playerX.current + step);
  };

  return (
    <div data-testid="dodge-game" style={{ textAlign: 'center' } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' } as any}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Score: {score}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>{timeLeft}s</span>
      </div>
      <canvas ref={canvasRef} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 360, height: 'auto', aspectRatio: '360/500' } as any} />
      {!gameOver && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 } as any}>
          <div data-testid="dodge-left" onClick={() => movePlayer('left')} style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-line" style={{ fontSize: 24, color: '#FFF' }} />
          </div>
          <div data-testid="dodge-right" onClick={() => movePlayer('right')} style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-right-line" style={{ fontSize: 24, color: '#FFF' }} />
          </div>
        </div>
      )}
      {gameOver && (
        <div style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Partie terminee !</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: ACCENT }}>{score} pts</div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────
   MINI-GAME 2: Equilibre Dorsal (Balance)
   ──────────────────────────────────────── */
function BalanceGame({ difficulty, onFinish }: { difficulty: number; onFinish: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const ballPos = useRef({ x: 180, y: 250 });
  const ballVel = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 180, y: 250 });
  const animRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const gameOverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 360, H = 360;
    canvas.width = W; canvas.height = H;
    ballPos.current = { x: W / 2, y: H / 2 };
    targetPos.current = { x: 80 + Math.random() * 200, y: 80 + Math.random() * 200 };
    let frame = 0;
    const drift = 0.1 + difficulty * 0.15;

    const onKey = (e: KeyboardEvent) => { keysRef.current.add(e.key); };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    const loop = () => {
      if (gameOverRef.current) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0A0A14';
      ctx.fillRect(0, 0, W, H);

      // Circular arena
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 160, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(167,139,250,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 80, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(167,139,250,0.1)';
      ctx.stroke();

      // Input
      const accel = 0.4;
      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) ballVel.current.x -= accel;
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) ballVel.current.x += accel;
      if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) ballVel.current.y -= accel;
      if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) ballVel.current.y += accel;

      // Random drift
      ballVel.current.x += (Math.random() - 0.5) * drift;
      ballVel.current.y += (Math.random() - 0.5) * drift;

      // Friction
      ballVel.current.x *= 0.96;
      ballVel.current.y *= 0.96;

      ballPos.current.x += ballVel.current.x;
      ballPos.current.y += ballVel.current.y;

      // Bounds
      const dist = Math.sqrt((ballPos.current.x - W / 2) ** 2 + (ballPos.current.y - H / 2) ** 2);
      if (dist > 150) {
        const angle = Math.atan2(ballPos.current.y - H / 2, ballPos.current.x - W / 2);
        ballPos.current.x = W / 2 + Math.cos(angle) * 150;
        ballPos.current.y = H / 2 + Math.sin(angle) * 150;
        ballVel.current.x *= -0.5;
        ballVel.current.y *= -0.5;
      }

      // Target
      ctx.fillStyle = 'rgba(16,185,129,0.2)';
      ctx.beginPath();
      ctx.arc(targetPos.current.x, targetPos.current.y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(targetPos.current.x, targetPos.current.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Check target hit
      const dx = ballPos.current.x - targetPos.current.x;
      const dy = ballPos.current.y - targetPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < 30) {
        scoreRef.current += 25;
        setScore(scoreRef.current);
        targetPos.current = { x: 60 + Math.random() * 240, y: 60 + Math.random() * 240 };
      }

      // Ball
      ctx.fillStyle = '#A78BFA';
      ctx.beginPath();
      ctx.arc(ballPos.current.x, ballPos.current.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(ballPos.current.x - 3, ballPos.current.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();

      // Score
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);

      frame++;
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [difficulty, onFinish]);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          gameOverRef.current = true;
          setGameOver(true);
          onFinish(scoreRef.current);
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onFinish]);

  const nudge = (dx: number, dy: number) => {
    ballVel.current.x += dx * 2;
    ballVel.current.y += dy * 2;
  };

  return (
    <div data-testid="balance-game" style={{ textAlign: 'center' } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' } as any}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Score: {score}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>{timeLeft}s</span>
      </div>
      <canvas ref={canvasRef} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 360, height: 'auto', aspectRatio: '1' } as any} />
      {!gameOver && (
        <div style={{ display: 'grid', gridTemplateColumns: '60px 60px 60px', gridTemplateRows: '60px 60px', gap: 8, justifyContent: 'center', marginTop: 12 } as any}>
          <div />
          <div data-testid="balance-up" onClick={() => nudge(0, -1)} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-up-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
          <div />
          <div data-testid="balance-left" onClick={() => nudge(-1, 0)} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
          <div data-testid="balance-down" onClick={() => nudge(0, 1)} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-down-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
          <div data-testid="balance-right" onClick={() => nudge(1, 0)} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-right-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
        </div>
      )}
      {gameOver && (
        <div style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Bien joue !</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#A78BFA' }}>{score} pts</div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────
   MINI-GAME 3: Cible Posturale (Target)
   ──────────────────────────────────────── */
function TargetGame({ difficulty, onFinish }: { difficulty: number; onFinish: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [target, setTarget] = useState<{ dir: string; label: string } | null>(null);
  const [feedback, setFeedback] = useState('');
  const scoreRef = useRef(0);
  const timerRef = useRef<any>(null);
  const gameOverRef = useRef(false);

  const dirs = [
    { dir: 'up', label: 'Avant', icon: 'ri-arrow-up-line' },
    { dir: 'down', label: 'Arriere', icon: 'ri-arrow-down-line' },
    { dir: 'left', label: 'Gauche', icon: 'ri-arrow-left-line' },
    { dir: 'right', label: 'Droite', icon: 'ri-arrow-right-line' },
  ];

  const spawnTarget = useCallback(() => {
    if (gameOverRef.current) return;
    const d = dirs[Math.floor(Math.random() * dirs.length)];
    setTarget(d);
    setFeedback('');
  }, []);

  useEffect(() => { spawnTarget(); }, [spawnTarget]);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          gameOverRef.current = true;
          setGameOver(true);
          onFinish(scoreRef.current);
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onFinish]);

  useEffect(() => {
    if (gameOver) return;
    const onKey = (e: KeyboardEvent) => {
      if (!target || gameOverRef.current) return;
      const keyMap: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      const pressed = keyMap[e.key];
      if (!pressed) return;
      handleInput(pressed);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, gameOver]);

  const handleInput = (dir: string) => {
    if (!target || gameOverRef.current) return;
    if (dir === target.dir) {
      scoreRef.current += 20;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(spawnTarget, 400);
  };

  const colors: Record<string, string> = { up: '#22D3EE', down: '#F97316', left: '#A78BFA', right: '#10B981' };

  return (
    <div data-testid="target-game" style={{ textAlign: 'center' } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' } as any}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Score: {score}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>{timeLeft}s</span>
      </div>

      {!gameOver && target && (
        <div style={{ marginBottom: 20 } as any}>
          <div style={{ width: 160, height: 160, borderRadius: '50%', background: `${colors[target.dir]}15`, border: `3px solid ${colors[target.dir]}50`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transition: 'all 0.3s', transform: feedback === 'correct' ? 'scale(1.1)' : feedback === 'wrong' ? 'scale(0.95)' : 'scale(1)' } as any}>
            <i className={dirs.find(d => d.dir === target.dir)?.icon || ''} style={{ fontSize: 48, color: colors[target.dir], marginBottom: 4 }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: colors[target.dir] }}>{target.label}</div>
          </div>
          {feedback === 'correct' && <div style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>+20 pts</div>}
          {feedback === 'wrong' && <div style={{ fontSize: 14, fontWeight: 800, color: '#EF4444' }}>Mauvaise direction !</div>}
        </div>
      )}

      {!gameOver && (
        <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 70px', gridTemplateRows: '70px 70px', gap: 10, justifyContent: 'center' } as any}>
          <div />
          <div data-testid="target-up" onClick={() => handleInput('up')} style={{ borderRadius: 16, background: `${colors.up}15`, border: `1px solid ${colors.up}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-up-line" style={{ fontSize: 26, color: colors.up }} /></div>
          <div />
          <div data-testid="target-left" onClick={() => handleInput('left')} style={{ borderRadius: 16, background: `${colors.left}15`, border: `1px solid ${colors.left}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 26, color: colors.left }} /></div>
          <div data-testid="target-down" onClick={() => handleInput('down')} style={{ borderRadius: 16, background: `${colors.down}15`, border: `1px solid ${colors.down}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-down-line" style={{ fontSize: 26, color: colors.down }} /></div>
          <div data-testid="target-right" onClick={() => handleInput('right')} style={{ borderRadius: 16, background: `${colors.right}15`, border: `1px solid ${colors.right}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-right-line" style={{ fontSize: 26, color: colors.right }} /></div>
        </div>
      )}

      {gameOver && (
        <div style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Bravo !</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>{score} pts</div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────
   MAIN PROGRAM PAGE
   ──────────────────────────────────────── */
export default function DorsiProgramPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<{ day: number; session: number; game: any; difficulty: number } | null>(null);
  const [view, setView] = useState<'calendar' | 'game'>('calendar');

  const fetchProgram = useCallback(async () => {
    try {
      const programs = await apiFetch('/api/dorsi/programs', {}, token);
      const active = programs.find((p: any) => p.status === 'active') || programs[0];
      setProgram(active || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  const startSession = (day: any, session: any) => {
    setActiveGame({
      day: day.day_num,
      session: session.session_num,
      game: session.game,
      difficulty: session.difficulty,
    });
    setView('game');
  };

  const handleGameFinish = async (score: number) => {
    if (!program || !activeGame) return;
    try {
      await apiFetch(`/api/dorsi/program/${program.id}/session`, {
        method: 'PUT',
        body: JSON.stringify({
          day_num: activeGame.day,
          session_num: activeGame.session,
          score,
        }),
      }, token);
      await fetchProgram();
    } catch (e: any) {
      console.error(e);
    }
  };

  const backToCalendar = () => {
    setActiveGame(null);
    setView('calendar');
  };

  if (Platform.OS !== 'web') return null;

  const GameComponent = activeGame?.game?.game_id === 'dodge' ? DodgeGame
    : activeGame?.game?.game_id === 'balance' ? BalanceGame
    : activeGame?.game?.game_id === 'target' ? TargetGame
    : null;

  // Calculate progress
  const totalSessions = program?.days?.reduce((acc: number, d: any) => acc + d.sessions.length, 0) || 0;
  const completedSessions = program?.days?.reduce((acc: number, d: any) => acc + d.sessions.filter((s: any) => s.completed).length, 0) || 0;
  const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div data-testid="dorsi-program-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: BG, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0 16px', gap: 12 } as any}>
          <div data-testid="back-btn" onClick={() => view === 'game' ? backToCalendar() : router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>
              {view === 'game' ? activeGame?.game?.name : 'Programme Dorsi'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {view === 'game' ? `Jour ${activeGame?.day} - Session ${activeGame?.session}` : 'Reeducation lombaire 10 jours'}
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' } as any}>
            <i className="ri-loader-4-line" style={{ fontSize: 32, animation: 'spin 1s linear infinite', display: 'block', marginBottom: 12 }} />
            Chargement...
          </div>
        )}

        {!loading && !program && (
          <div style={{ textAlign: 'center', padding: 60 } as any}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(249,115,22,0.12)', border: `1px solid ${ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' } as any}>
              <i className="ri-calendar-todo-line" style={{ fontSize: 36, color: ACCENT }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Aucun programme actif</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Effectuez d'abord un bilan lombaire pour generer votre programme personalise.</div>
            <div data-testid="go-bilan-btn" onClick={() => router.push('/dorsi-bilan' as any)} style={{ padding: '14px 28px', borderRadius: 999, background: ACCENT, cursor: 'pointer', color: '#FFF', fontSize: 14, fontWeight: 700, display: 'inline-block' } as any}>
              Faire un bilan
            </div>
          </div>
        )}

        {/* GAME VIEW */}
        {view === 'game' && activeGame && GameComponent && (
          <div style={{ maxWidth: 420, margin: '0 auto' } as any}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, marginBottom: 16 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeGame.game.color}15`, border: `1px solid ${activeGame.game.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={activeGame.game.icon} style={{ fontSize: 20, color: activeGame.game.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{activeGame.game.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{activeGame.game.description}</div>
                </div>
              </div>
              <GameComponent difficulty={activeGame.difficulty} onFinish={handleGameFinish} />
            </div>
            <div data-testid="back-to-calendar" onClick={backToCalendar} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>
              Retour au programme
            </div>
          </div>
        )}

        {/* CALENDAR VIEW */}
        {view === 'calendar' && program && (
          <div style={{ maxWidth: 480, margin: '0 auto' } as any}>
            {/* Progress bar */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, marginBottom: 16 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Progression</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: ACCENT }}>{progressPct}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                <div style={{ height: '100%', borderRadius: 5, width: `${Math.max(2, progressPct)}%`, background: `linear-gradient(90deg, ${ACCENT}, #F59E0B)`, transition: 'width 0.5s' } as any} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
                {completedSessions}/{totalSessions} sessions completees — Jour {program.current_day}/10
              </div>
            </div>

            {/* Day cards */}
            {program.days?.map((day: any) => {
              const isCurrentDay = day.day_num === program.current_day;
              const allDone = day.sessions.every((s: any) => s.completed);
              const isLocked = day.day_num > program.current_day;

              return (
                <div key={day.day_num} data-testid={`day-${day.day_num}`} style={{
                  background: isCurrentDay ? 'rgba(249,115,22,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCurrentDay ? `${ACCENT}30` : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 18, padding: 16, marginBottom: 10, opacity: isLocked ? 0.4 : 1,
                  transition: 'all 0.3s'
                } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: allDone ? 'rgba(16,185,129,0.15)' : isCurrentDay ? `${ACCENT}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${allDone ? 'rgba(16,185,129,0.3)' : isCurrentDay ? `${ACCENT}30` : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: allDone ? '#10B981' : isCurrentDay ? ACCENT : 'rgba(255,255,255,0.3)' } as any}>
                        {allDone ? <i className="ri-check-line" /> : day.day_num}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Jour {day.day_num}</div>
                        {day.is_reassessment && <div style={{ fontSize: 10, fontWeight: 600, color: '#22D3EE', marginTop: 2 }}>Reevaluation</div>}
                      </div>
                    </div>
                    {isCurrentDay && !allDone && <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, background: `${ACCENT}15`, padding: '3px 10px', borderRadius: 999 }}>Aujourd'hui</span>}
                  </div>

                  {/* Sessions */}
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    {day.sessions.map((s: any) => (
                      <div key={s.session_num} data-testid={`session-${day.day_num}-${s.session_num}`}
                        onClick={() => !isLocked && !s.completed && startSession(day, s)}
                        style={{
                          flex: 1, padding: '12px 10px', borderRadius: 14, cursor: isLocked || s.completed ? 'default' : 'pointer',
                          background: s.completed ? 'rgba(16,185,129,0.08)' : `${s.game.color}08`,
                          border: `1px solid ${s.completed ? 'rgba(16,185,129,0.2)' : `${s.game.color}20`}`,
                        } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}>
                          <i className={s.completed ? 'ri-check-circle-fill' : s.game.icon} style={{ fontSize: 14, color: s.completed ? '#10B981' : s.game.color }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: s.completed ? '#10B981' : s.game.color }}>Session {s.session_num}</span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#FFF', marginBottom: 2 }}>{s.game.name}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          {s.completed ? `${s.score} pts` : `${s.duration_minutes} min`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
