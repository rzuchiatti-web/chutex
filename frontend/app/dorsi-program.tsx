import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useSharedDorsiBLE } from '../src/context/DorsiBLEContext';
import { useI18n } from '../src/context/I18nContext';
import { SerpentGame, LabyrintheGame, SlalomGame, EtoilesGame, SimonGame, CerclesGame, CourseGame } from '../src/components/dorsi/ExtraGames';

const ACCENT = '#FFF';
const BG_IMG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
const GLASS: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

/* ────────────────────────────────────────
   JEU 1: Jeu des Moutons (Mobilite)
   Le patient incline le bassin pour attraper
   des moutons places dans ses zones faibles
   ──────────────────────────────────────── */
function MoutonsGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const cursorPos = useRef({ x: 180, y: 200 });
  const targets = useRef<{ x: number; y: number; caught: boolean }[]>([]);
  const animRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const gameOverRef = useRef(false);
  const bleRef = useRef(bleAngles);
  const baseAngle = useRef({ x: 0, y: 0 });

  useEffect(() => { bleRef.current = bleAngles; }, [bleAngles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 360, H = 400;
    canvas.width = W; canvas.height = H;
    cursorPos.current = { x: W / 2, y: H / 2 };
    baseAngle.current = { x: bleRef.current.x, y: bleRef.current.y };

    // Spawn sheep in random positions
    targets.current = [];
    for (let i = 0; i < 8 + Math.round(difficulty * 5); i++) {
      targets.current.push({ x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60), caught: false });
    }

    const onKey = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    const loop = () => {
      if (gameOverRef.current) return;
      ctx.clearRect(0, 0, W, H);
      // Gradient background
      const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
      bgGrad.addColorStop(0, '#0f1923');
      bgGrad.addColorStop(1, '#060a0f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
      // Subtle grid with glow
      ctx.strokeStyle = 'rgba(34,211,238,0.03)';
      for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
      for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      // Move cursor via BLE or keyboard
      const speed = 3;
      if (bleConnected) {
        const dx = (bleRef.current.x - baseAngle.current.x) * 4;
        const dy = -(bleRef.current.y - baseAngle.current.y) * 4;
        cursorPos.current.x = W / 2 + dx;
        cursorPos.current.y = H / 2 + dy;
      } else {
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) cursorPos.current.x -= speed;
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) cursorPos.current.x += speed;
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) cursorPos.current.y -= speed;
        if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) cursorPos.current.y += speed;
      }
      cursorPos.current.x = Math.max(15, Math.min(W - 15, cursorPos.current.x));
      cursorPos.current.y = Math.max(15, Math.min(H - 15, cursorPos.current.y));

      // Draw and check sheep
      let remaining = 0;
      targets.current.forEach(t => {
        if (t.caught) return;
        remaining++;
        // Sheep body
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.arc(t.x, t.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(t.x - 4, t.y - 4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(t.x + 4, t.y - 4, 3, 0, Math.PI * 2); ctx.fill();
        // Check catch
        const dx = cursorPos.current.x - t.x, dy = cursorPos.current.y - t.y;
        if (Math.sqrt(dx * dx + dy * dy) < 24) {
          t.caught = true;
          scoreRef.current += 25;
          setScore(scoreRef.current);
        }
      });

      // All caught?
      if (remaining === 0) {
        // Spawn new batch
        for (let i = 0; i < 5 + Math.round(difficulty * 3); i++) {
          targets.current.push({ x: 30 + Math.random() * (W - 60), y: 30 + Math.random() * (H - 60), caught: false });
        }
      }

      // Cursor (hand) with glow
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#22D3EE';
      ctx.beginPath(); ctx.arc(cursorPos.current.x, cursorPos.current.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Outer ring
      ctx.strokeStyle = 'rgba(34,211,238,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cursorPos.current.x, cursorPos.current.y, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('+', cursorPos.current.x, cursorPos.current.y + 5);

      // Score
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, [difficulty, bleConnected]);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => { setTimeLeft(p => { if (p <= 1) { gameOverRef.current = true; setGameOver(true); onFinish(scoreRef.current); clearInterval(t); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onFinish]);

  const nudge = (dx: number, dy: number) => { cursorPos.current.x += dx * 20; cursorPos.current.y += dy * 20; };

  return (
    <div data-testid="moutons-game" style={{ textAlign: 'center' } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 } as any}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Score: {score}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>{timeLeft}s</span>
      </div>
      <canvas ref={canvasRef} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 360, aspectRatio: '360/400' } as any} />
      {!gameOver && !bleConnected && (
        <div style={{ display: 'grid', gridTemplateColumns: '56px 56px 56px', gridTemplateRows: '56px 56px', gap: 6, justifyContent: 'center', marginTop: 10 } as any}>
          <div /><div onClick={() => nudge(0, -1)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-up-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div />
          <div onClick={() => nudge(-1, 0)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div onClick={() => nudge(0, 1)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-down-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div onClick={() => nudge(1, 0)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-right-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        </div>
      )}
      {gameOver && <div style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Bien joue !</div><div style={{ fontSize: 28, fontWeight: 900, color: '#22D3EE' }}>{score} pts</div></div>}
    </div>
  );
}

/* ────────────────────────────────────────
   JEU 2: Bulles de Savon (Endurance)
   Eclater des bulles qui apparaissent aux
   limites de la mobilite maximale du patient
   ──────────────────────────────────────── */
function BullesGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const cursorPos = useRef({ x: 180, y: 200 });
  const bubbles = useRef<{ x: number; y: number; r: number; popping: boolean; alpha: number }[]>([]);
  const animRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const gameOverRef = useRef(false);
  const bleRef = useRef(bleAngles);
  const baseAngle = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);

  useEffect(() => { bleRef.current = bleAngles; }, [bleAngles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 360, H = 400;
    canvas.width = W; canvas.height = H;
    cursorPos.current = { x: W / 2, y: H / 2 };
    baseAngle.current = { x: bleRef.current.x, y: bleRef.current.y };
    bubbles.current = [];

    const onKey = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    const spawnBubble = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 60;
      bubbles.current.push({
        x: W / 2 + Math.cos(angle) * dist,
        y: H / 2 + Math.sin(angle) * dist,
        r: 16 + Math.random() * 12,
        popping: false, alpha: 1,
      });
    };

    const loop = () => {
      if (gameOverRef.current) return;
      ctx.clearRect(0, 0, W, H);
      // Deep space gradient background
      const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
      bgGrad.addColorStop(0, '#130f25');
      bgGrad.addColorStop(1, '#060410');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
      frameRef.current++;
      const spawnRate = Math.max(20, 50 - Math.round(difficulty * 30));
      if (frameRef.current % spawnRate === 0) spawnBubble();

      // Move cursor
      const speed = 3;
      if (bleConnected) {
        const dx = (bleRef.current.x - baseAngle.current.x) * 4;
        const dy = -(bleRef.current.y - baseAngle.current.y) * 4;
        cursorPos.current.x = W / 2 + dx;
        cursorPos.current.y = H / 2 + dy;
      } else {
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) cursorPos.current.x -= speed;
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) cursorPos.current.x += speed;
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) cursorPos.current.y -= speed;
        if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) cursorPos.current.y += speed;
      }
      cursorPos.current.x = Math.max(10, Math.min(W - 10, cursorPos.current.x));
      cursorPos.current.y = Math.max(10, Math.min(H - 10, cursorPos.current.y));

      // Draw bubbles
      bubbles.current = bubbles.current.filter(b => {
        if (b.popping) {
          b.alpha -= 0.08;
          b.r += 1.5;
          if (b.alpha <= 0) return false;
        }
        ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = '#A78BFA';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
        // Highlight
        ctx.fillStyle = 'rgba(167,139,250,0.08)';
        ctx.fill();
        ctx.globalAlpha = 1;

        // Check pop
        if (!b.popping) {
          const dx = cursorPos.current.x - b.x, dy = cursorPos.current.y - b.y;
          if (Math.sqrt(dx * dx + dy * dy) < b.r + 8) {
            b.popping = true;
            scoreRef.current += 15;
            setScore(scoreRef.current);
          }
        }
        return true;
      });

      // Cursor with glow
      ctx.shadowColor = '#A78BFA';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#A78BFA';
      ctx.beginPath(); ctx.arc(cursorPos.current.x, cursorPos.current.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(167,139,250,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cursorPos.current.x, cursorPos.current.y, 16, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, [difficulty, bleConnected]);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => { setTimeLeft(p => { if (p <= 1) { gameOverRef.current = true; setGameOver(true); onFinish(scoreRef.current); clearInterval(t); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onFinish]);

  const nudge = (dx: number, dy: number) => { cursorPos.current.x += dx * 20; cursorPos.current.y += dy * 20; };

  return (
    <div data-testid="bulles-game" style={{ textAlign: 'center' } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 } as any}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Score: {score}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>{timeLeft}s</span>
      </div>
      <canvas ref={canvasRef} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 360, aspectRatio: '360/400' } as any} />
      {!gameOver && !bleConnected && (
        <div style={{ display: 'grid', gridTemplateColumns: '56px 56px 56px', gridTemplateRows: '56px 56px', gap: 6, justifyContent: 'center', marginTop: 10 } as any}>
          <div /><div onClick={() => nudge(0, -1)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-up-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div />
          <div onClick={() => nudge(-1, 0)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div onClick={() => nudge(0, 1)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-down-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div onClick={() => nudge(1, 0)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-right-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        </div>
      )}
      {gameOver && <div style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Bravo !</div><div style={{ fontSize: 28, fontWeight: 900, color: '#A78BFA' }}>{score} pts</div></div>}
    </div>
  );
}

/* ────────────────────────────────────────
   JEU 3: Proprioception (Equilibre)
   Maintenir une cible au centre en
   stabilisant le bassin
   ──────────────────────────────────────── */
function ProprioceptionGame({ difficulty, onFinish, bleAngles, bleConnected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const ballPos = useRef({ x: 180, y: 200 });
  const animRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const gameOverRef = useRef(false);
  const bleRef = useRef(bleAngles);
  const baseAngle = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);

  useEffect(() => { bleRef.current = bleAngles; }, [bleAngles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 360, H = 360;
    canvas.width = W; canvas.height = H;
    ballPos.current = { x: W / 2, y: H / 2 };
    baseAngle.current = { x: bleRef.current.x, y: bleRef.current.y };

    const onKey = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);

    const loop = () => {
      if (gameOverRef.current) return;
      ctx.clearRect(0, 0, W, H);
      // Radial gradient background
      const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.6);
      bgGrad.addColorStop(0, '#0a1a15');
      bgGrad.addColorStop(1, '#060a0f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
      frameRef.current++;

      // Target zones
      const zones = [
        { r: 30, color: 'rgba(16,185,129,0.2)', points: 3 },
        { r: 60, color: 'rgba(16,185,129,0.1)', points: 2 },
        { r: 100, color: 'rgba(16,185,129,0.05)', points: 1 },
        { r: 160, color: 'rgba(255,255,255,0.02)', points: 0 },
      ];
      zones.forEach(z => { ctx.fillStyle = z.color; ctx.beginPath(); ctx.arc(W / 2, H / 2, z.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = 'rgba(16,185,129,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 30, 0, Math.PI * 2); ctx.stroke();

      // Crosshair
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

      // Ball position from BLE or keyboard
      if (bleConnected) {
        const dx = (bleRef.current.x - baseAngle.current.x) * 3;
        const dy = -(bleRef.current.y - baseAngle.current.y) * 3;
        ballPos.current.x = W / 2 + dx;
        ballPos.current.y = H / 2 + dy;
      } else {
        const accel = 0.3;
        const drift = 0.05 + difficulty * 0.1;
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) ballPos.current.x -= accel * 10;
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) ballPos.current.x += accel * 10;
        if (keysRef.current.has('ArrowUp') || keysRef.current.has('w')) ballPos.current.y -= accel * 10;
        if (keysRef.current.has('ArrowDown') || keysRef.current.has('s')) ballPos.current.y += accel * 10;
        // Random drift to make it harder
        ballPos.current.x += (Math.random() - 0.5) * drift * 3;
        ballPos.current.y += (Math.random() - 0.5) * drift * 3;
      }

      // Clamp to arena
      const dist = Math.sqrt((ballPos.current.x - W / 2) ** 2 + (ballPos.current.y - H / 2) ** 2);
      if (dist > 160) {
        const a = Math.atan2(ballPos.current.y - H / 2, ballPos.current.x - W / 2);
        ballPos.current.x = W / 2 + Math.cos(a) * 160;
        ballPos.current.y = H / 2 + Math.sin(a) * 160;
      }

      // Score based on proximity to center
      if (frameRef.current % 10 === 0) {
        const d = Math.sqrt((ballPos.current.x - W / 2) ** 2 + (ballPos.current.y - H / 2) ** 2);
        if (d < 30) { scoreRef.current += 3; setScore(scoreRef.current); }
        else if (d < 60) { scoreRef.current += 2; setScore(scoreRef.current); }
        else if (d < 100) { scoreRef.current += 1; setScore(scoreRef.current); }
      }

      // Ball with glow
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#10B981';
      ctx.beginPath(); ctx.arc(ballPos.current.x, ballPos.current.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      // Inner shine
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(ballPos.current.x - 3, ballPos.current.y - 3, 3, 0, Math.PI * 2); ctx.fill();
      // Outer pulse ring
      const pulseR = 20 + Math.sin(frameRef.current * 0.05) * 4;
      ctx.strokeStyle = `rgba(16,185,129,${0.15 + Math.sin(frameRef.current * 0.05) * 0.1})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ballPos.current.x, ballPos.current.y, pulseR, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, [difficulty, bleConnected]);

  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => { setTimeLeft(p => { if (p <= 1) { gameOverRef.current = true; setGameOver(true); onFinish(scoreRef.current); clearInterval(t); return 0; } return p - 1; }); }, 1000);
    return () => clearInterval(t);
  }, [gameOver, onFinish]);

  const nudge = (dx: number, dy: number) => { ballPos.current.x += dx * 15; ballPos.current.y += dy * 15; };

  return (
    <div data-testid="proprioception-game" style={{ textAlign: 'center' } as any}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 } as any}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Score: {score}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft < 10 ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>{timeLeft}s</span>
      </div>
      <canvas ref={canvasRef} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 360, aspectRatio: '1' } as any} />
      {!gameOver && !bleConnected && (
        <div style={{ display: 'grid', gridTemplateColumns: '56px 56px 56px', gridTemplateRows: '56px 56px', gap: 6, justifyContent: 'center', marginTop: 10 } as any}>
          <div /><div onClick={() => nudge(0, -1)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-up-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div />
          <div onClick={() => nudge(-1, 0)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div onClick={() => nudge(0, 1)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-down-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div onClick={() => nudge(1, 0)} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-right-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        </div>
      )}
      {gameOver && <div style={{ marginTop: 16, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Excellent !</div><div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>{score} pts</div></div>}
    </div>
  );
}

/* ────────────────────────────────────────
   PAGE PROGRAMME
   ──────────────────────────────────────── */
export default function DorsiProgramPage() {
  const { token } = useAuth();
  const router = useRouter();
  const ble = useSharedDorsiBLE();
  const { t } = useI18n();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<{ day: number; session: number; game: any; difficulty: number } | null>(null);
  const [view, setView] = useState<'calendar' | 'game'>('calendar');
  const [freePlay, setFreePlay] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [noraRecs, setNoraRecs] = useState<any>(null);
  const [dorsiIndex, setDorsiIndex] = useState<any>(null);
  const [streaks, setStreaks] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [showInfo, setShowInfo] = useState('');
  const [bilanHistory, setBilanHistory] = useState<any[]>([]);

  const fetchProgram = useCallback(async () => {
    try {
      const [programs, bilans] = await Promise.all([
        apiFetch('/api/dorsi/programs', {}, token),
        apiFetch('/api/dorsi/bilans', {}, token).catch(() => []),
      ]);
      const active = programs.find((p: any) => p.status === 'active') || programs[0];
      setProgram(active || null);
      if (Array.isArray(bilans) && bilans.length > 0) setBilanHistory(bilans);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  // Fetch score history + new features
  useEffect(() => {
    if (token) {
      apiFetch('/api/dorsi/score-history', {}, token).then(setScoreHistory).catch(() => {});
      apiFetch('/api/dorsi/nora-recommendations', {}, token).then(setNoraRecs).catch(() => {});
      apiFetch('/api/dorsi/index', {}, token).then(setDorsiIndex).catch(() => {});
      apiFetch('/api/dorsi/streaks', {}, token).then(setStreaks).catch(() => {});
      apiFetch('/api/dorsi/comparison', {}, token).then(setComparison).catch(() => {});
      apiFetch('/api/dorsi/bilans', {}, token).then(b => { if (Array.isArray(b)) setBilanHistory(b); }).catch(() => {});
    }
  }, [token]);

  const startSession = (day: any, session: any) => {
    if (!ble.connected) {
      alert('Connectez votre coussin Dorsi pour commencer la session.');
      return;
    }
    router.push({ pathname: '/dorsi-game', params: { gameId: session.game.game_id, programId: program?.id, day: String(day.day_num), session: String(session.session_num) } } as any);
  };

  const startFreeGame = (gid: string) => {
    if (!ble.connected) {
      alert('Connectez votre coussin Dorsi pour jouer.');
      return;
    }
    router.push({ pathname: '/dorsi-game', params: { gameId: gid } } as any);
  };

  const handleGameFinish = async (score: number) => {
    if (!program || !activeGame || freePlay) return;
    try {
      await apiFetch(`/api/dorsi/program/${program.id}/session`, {
        method: 'PUT',
        body: JSON.stringify({ day_num: activeGame.day, session_num: activeGame.session, score }),
      }, token);
      await fetchProgram();
    } catch (e: any) { console.error(e); }
  };

  const backToCalendar = () => { setActiveGame(null); setView('calendar'); };

  if (Platform.OS !== 'web') return null;

  const GameComponent = activeGame?.game?.game_id === 'moutons' ? MoutonsGame
    : activeGame?.game?.game_id === 'bulles' ? BullesGame
    : activeGame?.game?.game_id === 'proprioception' ? ProprioceptionGame
    : activeGame?.game?.game_id === 'serpent' ? SerpentGame
    : activeGame?.game?.game_id === 'labyrinthe' ? LabyrintheGame
    : activeGame?.game?.game_id === 'slalom' ? SlalomGame
    : activeGame?.game?.game_id === 'etoiles' ? EtoilesGame
    : activeGame?.game?.game_id === 'simon' ? SimonGame
    : activeGame?.game?.game_id === 'cercles' ? CerclesGame
    : activeGame?.game?.game_id === 'course' ? CourseGame
    : null;

  const totalSessions = program?.days?.reduce((a: number, d: any) => a + d.sessions.length, 0) || 0;
  const completedSessions = program?.days?.reduce((a: number, d: any) => a + d.sessions.filter((s: any) => s.completed).length, 0) || 0;
  const progressPct = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div data-testid="dorsi-program-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '70px 20px 120px', WebkitOverflowScrolling: 'touch', zIndex: 5 } as any}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0 16px', gap: 12 } as any}>
          <div data-testid="back-btn" onClick={() => view === 'game' ? backToCalendar() : router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>
              {view === 'game' ? activeGame?.game?.name : 'Programme Dorsi'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {view === 'game' ? (freePlay ? 'Jeu libre' : `Jour ${activeGame?.day} — Session ${activeGame?.session}`) : 'Reeducation lombaire'}
            </div>
          </div>
          {/* BLE status indicator */}
          {!ble.connected ? (
            <div data-testid="ble-connect-game" onClick={ble.connect} style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
              <i className="ri-bluetooth-line" style={{ fontSize: 14 }} />Connecter
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' } as any} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>{ble.deviceName}</span>
            </div>
          )}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' } as any}><i className="ri-loader-4-line" style={{ fontSize: 32, animation: 'spin 1s linear infinite', display: 'block', marginBottom: 12 }} />Chargement...</div>}

        {/* GAME VIEW */}
        {view === 'game' && activeGame && GameComponent && (
          <div style={{ maxWidth: 420, margin: '0 auto' } as any}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 20, marginBottom: 16 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${activeGame.game.color}15`, border: `1px solid ${activeGame.game.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={activeGame.game.icon} style={{ fontSize: 20, color: activeGame.game.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{activeGame.game.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{ble.connected ? 'Controle par coussin HeloKine' : 'Controle clavier / boutons'}</div>
                </div>
              </div>
              <GameComponent difficulty={activeGame.difficulty} onFinish={handleGameFinish} bleAngles={ble.angles} bleConnected={ble.connected} />
            </div>
            <div data-testid="back-to-calendar" onClick={backToCalendar} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>
              Retour
            </div>
          </div>
        )}

        {/* CALENDAR VIEW */}
        {view === 'calendar' && !loading && (
          <div style={{ maxWidth: 480, margin: '0 auto' } as any}>

            {/* ═══ INFO POPUP ═══ */}
            {showInfo && (
              <div onClick={() => setShowInfo('')} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'glassIn 0.3s ease' } as any}>
                <div onClick={(e: any) => e.stopPropagation()} style={{ ...GLASS, padding: 24, maxWidth: 360, width: '100%' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>
                      {showInfo === 'index' ? 'Dorsi Index' : showInfo === 'streak' ? 'Serie d\'exercices' : 'Bilan lombaire'}
                    </span>
                    <div onClick={() => setShowInfo('')} style={{ width: 28, height: 28, borderRadius: 99, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                      <i className="ri-close-line" style={{ fontSize: 14, color: '#FFF' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                    {showInfo === 'index' && 'Votre Dorsi Index est un score de 0 a 100 qui mesure votre sante lombaire. Il combine votre mobilite (30pts), votre niveau de douleur (25pts), la regularite de vos exercices (25pts) et votre progression (20pts). Plus il est eleve, mieux c\'est !'}
                    {showInfo === 'streak' && 'Votre serie represente le nombre de jours consecutifs ou vous avez fait au moins un exercice Dorsi. Essayez de maintenir la serie ! Chaque jour compte pour ameliorer votre Dorsi Index.'}
                    {showInfo === 'bilan' && 'Le bilan mesure votre mobilite lombaire dans 4 directions (avant, arriere, gauche, droite) et votre niveau de douleur. Faites-le regulierement pour suivre votre evolution et adapter votre programme.'}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ DORSI INDEX + BILAN CTA (fusionnes) ═══ */}
            <div data-testid="dorsi-hero-card" style={{ ...GLASS, padding: 20, marginBottom: 16, position: 'relative', overflow: 'hidden' } as any}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' } as any} />

              {dorsiIndex && dorsiIndex.index > 0 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 } as any}>
                    <div style={{ position: 'relative', width: 68, height: 68 } as any}>
                      <svg viewBox="0 0 72 72" style={{ width: 68, height: 68, transform: 'rotate(-90deg)' } as any}>
                        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                        <circle cx="36" cy="36" r="30" fill="none"
                          stroke={dorsiIndex.index >= 70 ? '#10B981' : dorsiIndex.index >= 40 ? '#F59E0B' : '#EF4444'}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${(dorsiIndex.index / 100) * 188.5} 188.5`} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#FFF' } as any}>{dorsiIndex.index}</div>
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>Dorsi Index</span>
                        <div onClick={() => setShowInfo('index')} style={{ width: 18, height: 18, borderRadius: 99, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                          <i className="ri-question-line" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginTop: 2 }}>
                        {dorsiIndex.index >= 70 ? 'Excellent' : dorsiIndex.index >= 50 ? 'Bon' : dorsiIndex.index >= 30 ? 'Modere' : 'A ameliorer'}
                      </div>
                      {comparison && comparison.population_count > 0 && (
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          Top <span style={{ color: '#10B981', fontWeight: 700 }}>{comparison.percentile}%</span> des {comparison.age_group}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Mini bars */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 5, marginBottom: 14 } as any}>
                    {[
                      { label: 'Mobilite', val: dorsiIndex.mobility_score, max: 30, color: '#22D3EE' },
                      { label: 'Douleur', val: dorsiIndex.pain_score, max: 25, color: '#10B981' },
                      { label: 'Regularite', val: dorsiIndex.regularity_score, max: 25, color: '#A78BFA' },
                      { label: 'Progres', val: dorsiIndex.progression_score, max: 20, color: '#F59E0B' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' } as any}>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${(s.val / s.max) * 100}%`, background: s.color } as any} />
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
                  <i className="ri-bar-chart-box-line" style={{ fontSize: 32, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>Evaluez votre dos</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Faites un bilan pour calculer votre Dorsi Index</div>
                </div>
              )}
              <div onClick={() => router.push('/dorsi-bilan' as any)} data-testid="bilan-cta" style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className="ri-bar-chart-box-line" style={{ fontSize: 18, color: '#FFF' }} />
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{dorsiIndex?.index > 0 ? 'Nouveau bilan' : 'Commencer le bilan'}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Mesurez votre mobilite en 4 directions</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>

            {/* ═══ STREAKS ═══ */}
            {streaks && (
              <div data-testid="streaks-card" style={{ ...GLASS, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } as any}>
                  <i className="ri-fire-line" style={{ fontSize: 18, color: streaks.current_streak > 0 ? '#F97316' : 'rgba(255,255,255,0.2)' }} />
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{streaks.current_streak}j</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2, flex: 1 } as any}>
                  {Array.from({ length: 14 }).map((_, i) => {
                    const d = new Date(Date.now() - (13 - i) * 86400000);
                    const key = d.toISOString().split('T')[0];
                    const active = streaks.calendar?.[key];
                    return (<div key={i} style={{ width: '100%', paddingTop: '100%', borderRadius: 2, background: active ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.04)' } as any} />);
                  })}
                </div>
                <div onClick={() => setShowInfo('streak')} style={{ width: 20, height: 20, borderRadius: 99, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
                  <i className="ri-question-line" style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            )}

            {/* ═══ JEUX LIBRES — CARROUSEL SWIPABLE ═══ */}
            <div data-testid="free-play-section" style={{ marginBottom: 16 } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' } as any}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{t('dorsi_free_games')}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>15 {t('dorsi_games_available')}</div>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', padding: '4px 0 12px', scrollbarWidth: 'none' } as any}
                ref={(el: any) => { if (el) el.style.cssText += '::-webkit-scrollbar{display:none}'; }}>
                {[
                  { id: 'moutons', name: 'Moutons', icon: 'ri-ghost-smile-line', color: '#22D3EE', desc: 'Attrapez les moutons' },
                  { id: 'bulles', name: 'Bulles', icon: 'ri-bubble-chart-line', color: '#A78BFA', desc: 'Eclatez les bulles' },
                  { id: 'proprioception', name: 'Equilibre', icon: 'ri-focus-3-line', color: '#10B981', desc: 'Restez stable' },
                  { id: 'serpent', name: 'Serpent', icon: 'ri-route-line', color: '#F59E0B', desc: 'Guidez le serpent' },
                  { id: 'labyrinthe', name: 'Labyrinthe', icon: 'ri-compass-discover-line', color: '#EC4899', desc: 'Trouvez la sortie' },
                  { id: 'slalom', name: 'Slalom', icon: 'ri-flag-line', color: '#06B6D4', desc: 'Passez les portes' },
                  { id: 'etoiles', name: 'Etoiles', icon: 'ri-star-line', color: '#F97316', desc: 'Attrapez les etoiles' },
                  { id: 'simon', name: 'Simon', icon: 'ri-flashlight-line', color: '#EF4444', desc: 'Memorisez la sequence' },
                  { id: 'cercles', name: 'Cercles', icon: 'ri-record-circle-line', color: '#8B5CF6', desc: 'Touchez les cibles' },
                  { id: 'course', name: 'Course', icon: 'ri-run-line', color: '#14B8A6', desc: 'Esquivez les obstacles' },
                  { id: 'respiration', name: 'Respiration', icon: 'ri-lungs-line', color: '#60A5FA', desc: 'Respirez en rythme' },
                  { id: 'pendule', name: 'Pendule', icon: 'ri-timer-flash-line', color: '#F472B6', desc: 'Timing parfait' },
                  { id: 'peinture', name: 'Peinture', icon: 'ri-brush-line', color: '#FBBF24', desc: 'Peignez librement' },
                  { id: 'rebond', name: 'Rebond', icon: 'ri-basketball-line', color: '#FB923C', desc: 'Cassez les blocs' },
                  { id: 'gravite', name: 'Gravite', icon: 'ri-planet-line', color: '#818CF8', desc: 'Evitez les planetes' },
                ].map((g, i) => {
                  const best = scoreHistory.find((h: any) => h.game_id === g.id);
                  return (
                    <div key={g.id} data-testid={`free-play-${g.id}`} onClick={() => startFreeGame(g.id)} style={{
                      minWidth: 140, scrollSnapAlign: 'start', borderRadius: 20, cursor: 'pointer',
                      background: `linear-gradient(135deg, ${g.color}18, ${g.color}08)`,
                      border: `1px solid ${g.color}30`, padding: '18px 16px', position: 'relative', overflow: 'hidden',
                      transition: 'transform 0.2s', flexShrink: 0,
                    } as any}
                      onMouseEnter={(e: any) => e.currentTarget.style.transform = 'scale(1.04)'}
                      onMouseLeave={(e: any) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, borderRadius: '50%', background: `${g.color}10` } as any} />
                      <i className={g.icon} style={{ fontSize: 28, color: g.color, display: 'block', marginBottom: 10 }} />
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 3 }}>{g.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8, lineHeight: 1.3 }}>{g.desc}</div>
                      {best && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 } as any}>
                          <i className="ri-trophy-fill" style={{ fontSize: 10, color: '#F59E0B' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#F59E0B' }}>{best.best} pts</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score History */}
            {scoreHistory.length > 0 && (
              <div style={{ ...GLASS, padding: '14px 16px', marginBottom: 16 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Meilleurs scores</span>
                  <i className="ri-trophy-line" style={{ fontSize: 16, color: '#F59E0B' }} />
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '2px 0' } as any}>
                  {scoreHistory.slice(0, 8).map((h: any) => (
                    <div key={h.game_id} onClick={() => startFreeGame(h.game_id)} style={{ minWidth: 90, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'center', flexShrink: 0 } as any}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B' }}>{h.best}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{h.name}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>{h.scores.length} parties</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Program progress */}

            {/* ═══ BILAN HISTORY with evolution bars ═══ */}
            {bilanHistory.length > 0 && (
              <div data-testid="bilan-history-section" style={{ ...GLASS, padding: 20, marginBottom: 16 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Historique des bilans</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{bilanHistory.length} bilan{bilanHistory.length > 1 ? 's' : ''}</span>
                </div>
                {bilanHistory.slice(0, 5).map((bilan: any, bi: number) => {
                  const m = bilan.measurements || {};
                  const dirs = [
                    { key: 'forward', label: 'Avant', color: '#F97316' },
                    { key: 'backward', label: 'Arriere', color: '#22D3EE' },
                    { key: 'left', label: 'Gauche', color: '#A78BFA' },
                    { key: 'right', label: 'Droite', color: '#10B981' },
                  ];
                  const avgMobility = dirs.reduce((s, d) => s + (m[d.key]?.mobility || 0), 0) / 4;
                  const prevBilan = bilanHistory[bi + 1];
                  const prevAvg = prevBilan ? ['forward','backward','left','right'].reduce((s, k) => s + (prevBilan.measurements?.[k]?.mobility || 0), 0) / 4 : 0;
                  const diff = prevBilan ? Math.round(avgMobility - prevAvg) : 0;
                  const dateStr = bilan.created_at ? new Date(bilan.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
                  return (
                    <div key={bilan.id || bi} style={{ padding: '12px 0', borderTop: bi > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{dateStr}</span>
                          {bi === 0 && <span style={{ fontSize: 8, fontWeight: 700, color: '#F97316', background: 'rgba(249,115,22,0.15)', padding: '2px 8px', borderRadius: 99 }}>Dernier</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 } as any}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{Math.round(avgMobility)}%</span>
                          {diff !== 0 && <span style={{ fontSize: 10, fontWeight: 700, color: diff > 0 ? '#10B981' : '#EF4444' }}>{diff > 0 ? '+' : ''}{diff}%</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 } as any}>
                        {dirs.map(d => (
                          <div key={d.key} style={{ flex: 1 } as any}>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                              <div style={{ height: '100%', borderRadius: 3, background: d.color, width: `${m[d.key]?.mobility || 0}%`, transition: 'width 0.5s' } as any} />
                            </div>
                            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.25)', marginTop: 2, textAlign: 'center' }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {program && (
              <>
                <div style={{ ...GLASS, padding: 20, marginBottom: 16 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{t('dorsi_progression')}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#FFF' }}>{progressPct}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' } as any}>
                    <div style={{ height: '100%', borderRadius: 5, width: `${Math.max(2, progressPct)}%`, background: '#FFF', transition: 'width 0.5s' } as any} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{completedSessions}/{totalSessions} {t('dorsi_sessions')} — {t('dorsi_day')} {program.current_day}/10</div>
                </div>

                {program.days?.map((day: any) => {
                  const isCurrentDay = day.day_num === program.current_day;
                  const allDone = day.sessions.every((s: any) => s.completed);
                  const isLocked = day.day_num > program.current_day;
                  return (
                    <div key={day.day_num} data-testid={`day-${day.day_num}`} style={{ ...GLASS, padding: 16, marginBottom: 10, opacity: isLocked ? 0.4 : 1 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: allDone ? 'rgba(16,185,129,0.15)' : isCurrentDay ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${allDone ? 'rgba(16,185,129,0.3)' : isCurrentDay ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: allDone ? '#10B981' : '#FFF' } as any}>
                            {allDone ? <i className="ri-check-line" /> : day.day_num}
                          </div>
                          <div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{t('dorsi_day')} {day.day_num}</div>
                            {day.is_reassessment && <div style={{ fontSize: 10, fontWeight: 600, color: '#22D3EE', marginTop: 2 }}>{t('dorsi_reevaluation')}</div>}
                          </div>
                        </div>
                        {isCurrentDay && !allDone && <span style={{ fontSize: 10, fontWeight: 700, color: '#FFF', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 999 }}>{t('dorsi_today')}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 } as any}>
                        {day.sessions.map((s: any) => (
                          <div key={s.session_num} data-testid={`session-${day.day_num}-${s.session_num}`} onClick={() => !isLocked && !s.completed && startSession(day, s)} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, cursor: isLocked || s.completed ? 'default' : 'pointer', background: s.completed ? 'rgba(16,185,129,0.08)' : `${s.game.color}08`, border: `1px solid ${s.completed ? 'rgba(16,185,129,0.2)' : `${s.game.color}20`}` } as any}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}>
                              <i className={s.completed ? 'ri-check-circle-fill' : s.game.icon} style={{ fontSize: 14, color: s.completed ? '#10B981' : s.game.color }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: s.completed ? '#10B981' : s.game.color }}>Session {s.session_num}</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#FFF', marginBottom: 2 }}>{s.game.name}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.completed ? `${s.score} pts` : `${s.duration_minutes} min`}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {!program && !loading && (
              <div style={{ textAlign: 'center', padding: 40 } as any}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Aucun programme actif</div>
                <div data-testid="go-bilan-btn" onClick={() => router.push('/dorsi-bilan' as any)} style={{ padding: '14px 28px', borderRadius: 999, background: ACCENT, cursor: 'pointer', color: '#FFF', fontSize: 14, fontWeight: 700, display: 'inline-block' } as any}>
                  Faire un bilan
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}@keyframes glassIn{from{opacity:0}to{opacity:1}}' }} />
    </div>
  );
}
