import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useDorsiBLE } from '../src/hooks/useDorsiBLE';
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
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, W, H);
      // Grid
      ctx.strokeStyle = 'rgba(34,211,238,0.04)';
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

      // Cursor (hand)
      ctx.fillStyle = '#22D3EE';
      ctx.beginPath(); ctx.arc(cursorPos.current.x, cursorPos.current.y, 12, 0, Math.PI * 2); ctx.fill();
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
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, W, H);

      // Spawn bubbles
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

      // Cursor
      ctx.fillStyle = '#A78BFA';
      ctx.beginPath(); ctx.arc(cursorPos.current.x, cursorPos.current.y, 8, 0, Math.PI * 2); ctx.fill();
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
      ctx.fillStyle = '#0d1117';
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

      // Ball
      ctx.fillStyle = '#10B981';
      ctx.beginPath(); ctx.arc(ballPos.current.x, ballPos.current.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(ballPos.current.x - 3, ballPos.current.y - 3, 3, 0, Math.PI * 2); ctx.fill();

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
  const ble = useDorsiBLE();
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
  const [correlations, setCorrelations] = useState<any>(null);
  const [guidedAudio, setGuidedAudio] = useState<string>('');
  const [guidedInstructions, setGuidedInstructions] = useState<string[]>([]);
  const [guidedIdx, setGuidedIdx] = useState(0);
  const [isGuiding, setIsGuiding] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchProgram = useCallback(async () => {
    try {
      const programs = await apiFetch('/api/dorsi/programs', {}, token);
      const active = programs.find((p: any) => p.status === 'active') || programs[0];
      setProgram(active || null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);

  // Fetch score history + Nora recommendations + new features
  useEffect(() => {
    if (token) {
      apiFetch('/api/dorsi/score-history', {}, token).then(setScoreHistory).catch(() => {});
      apiFetch('/api/dorsi/nora-recommendations', {}, token).then(setNoraRecs).catch(() => {});
      apiFetch('/api/dorsi/index', {}, token).then(setDorsiIndex).catch(() => {});
      apiFetch('/api/dorsi/streaks', {}, token).then(setStreaks).catch(() => {});
      apiFetch('/api/dorsi/comparison', {}, token).then(setComparison).catch(() => {});
      apiFetch('/api/dorsi/correlations', {}, token).then(setCorrelations).catch(() => {});
    }
  }, [token]);

  const startSession = (day: any, session: any) => {
    router.push({ pathname: '/dorsi-game', params: { gameId: session.game.game_id, programId: program?.id, day: String(day.day_num), session: String(session.session_num) } } as any);
  };

  const startFreeGame = (gid: string) => {
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

  const playNora = async (text: string) => {
    try {
      const res = await apiFetch('/api/dorsi/guided-tts', { method: 'POST', body: JSON.stringify({ text }) }, token);
      if (res.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${res.audio}`);
        audioRef.current = audio;
        await audio.play();
      }
    } catch { /* silent */ }
  };

  const startGuidedSession = async (gameId: string) => {
    try {
      const res = await apiFetch(`/api/dorsi/guided-instructions/${gameId}`, {}, token);
      if (res.instructions?.length) {
        setGuidedInstructions(res.instructions);
        setGuidedIdx(0);
        setIsGuiding(true);
        playNora(res.instructions[0]);
      }
    } catch { /* silent */ }
  };

  const nextGuidedInstruction = () => {
    if (guidedIdx < guidedInstructions.length - 1) {
      const next = guidedIdx + 1;
      setGuidedIdx(next);
      playNora(guidedInstructions[next]);
    } else {
      setIsGuiding(false);
    }
  };

  const backToCalendar = () => { setActiveGame(null); setView('calendar'); setIsGuiding(false); if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } };

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
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch', zIndex: 5 } as any}>
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

            {/* ═══ DORSI INDEX™ ═══ */}
            {dorsiIndex && dorsiIndex.index > 0 && (
              <div data-testid="dorsi-index-card" style={{ ...GLASS, padding: 20, marginBottom: 16, position: 'relative', overflow: 'hidden' } as any}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `rgba(255,255,255,${dorsiIndex.index > 70 ? '0.04' : '0.02'})` } as any} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
                  <div style={{ position: 'relative', width: 72, height: 72 } as any}>
                    <svg viewBox="0 0 72 72" style={{ width: 72, height: 72, transform: 'rotate(-90deg)' } as any}>
                      <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle cx="36" cy="36" r="30" fill="none"
                        stroke={dorsiIndex.index >= 70 ? '#10B981' : dorsiIndex.index >= 40 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="6" strokeLinecap="round"
                        strokeDasharray={`${(dorsiIndex.index / 100) * 188.5} 188.5`}
                        style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#FFF' } as any}>{dorsiIndex.index}</div>
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Dorsi Index</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>
                      {dorsiIndex.index >= 70 ? 'Excellent' : dorsiIndex.index >= 50 ? 'Bon' : dorsiIndex.index >= 30 ? 'Modere' : 'A ameliorer'}
                    </div>
                    {comparison && comparison.population_count > 0 && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                        Meilleur que <span style={{ color: '#10B981', fontWeight: 700 }}>{comparison.percentile}%</span> des {comparison.age_group}
                      </div>
                    )}
                  </div>
                </div>
                {/* Score breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 } as any}>
                  {[
                    { label: 'Mobilite', val: dorsiIndex.mobility_score, max: 30, color: '#22D3EE' },
                    { label: 'Douleur', val: dorsiIndex.pain_score, max: 25, color: '#10B981' },
                    { label: 'Regularite', val: dorsiIndex.regularity_score, max: 25, color: '#A78BFA' },
                    { label: 'Progression', val: dorsiIndex.progression_score, max: 20, color: '#F59E0B' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' } as any}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${(s.val / s.max) * 100}%`, background: s.color, transition: 'width 0.8s' } as any} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: s.color, marginTop: 3 }}>{s.val}/{s.max}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ STREAKS & CALENDAR ═══ */}
            {streaks && (
              <div data-testid="streaks-card" style={{ ...GLASS, padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: streaks.current_streak > 0 ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${streaks.current_streak > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className="ri-fire-line" style={{ fontSize: 16, color: streaks.current_streak > 0 ? '#F97316' : 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{streaks.current_streak}j</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>serie</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2, flex: 1 } as any}>
                  {Array.from({ length: 14 }).map((_, i) => {
                    const d = new Date(Date.now() - (13 - i) * 86400000);
                    const key = d.toISOString().split('T')[0];
                    const active = streaks.calendar?.[key];
                    return (
                      <div key={i} style={{
                        width: '100%', paddingTop: '100%', borderRadius: 3,
                        background: active ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.04)',
                        boxShadow: active ? '0 0 4px rgba(249,115,22,0.3)' : 'none',
                      } as any} />
                    );
                  })}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Record</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#F97316' }}>{streaks.best_streak}j</div>
                </div>
              </div>
            )}

            {/* ═══ NORA GUIDED SESSION ═══ */}
            <div data-testid="nora-guided-section" style={{ ...GLASS, padding: 20, marginBottom: 16 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(236,72,153,0.2))', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className="ri-mic-line" style={{ fontSize: 18, color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Seance guidee par Nora</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Nora vous accompagne vocalement</div>
                </div>
              </div>
              {isGuiding ? (
                <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 16 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A78BFA', animation: 'pulse 1.5s infinite' } as any} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Nora parle...</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{guidedIdx + 1}/{guidedInstructions.length}</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#FFF', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 12 }}>{guidedInstructions[guidedIdx]}</div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div onClick={nextGuidedInstruction} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#A78BFA' } as any}>
                      {guidedIdx < guidedInstructions.length - 1 ? 'Suivant' : 'Terminer'}
                    </div>
                    <div onClick={() => { setIsGuiding(false); if (audioRef.current) audioRef.current.pause(); }} style={{ padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>
                      Arreter
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                  {[
                    { id: 'respiration', name: 'Respiration', icon: 'ri-lungs-line', color: '#60A5FA' },
                    { id: 'proprioception', name: 'Equilibre', icon: 'ri-focus-3-line', color: '#10B981' },
                    { id: 'peinture', name: 'Peinture', icon: 'ri-brush-line', color: '#FBBF24' },
                    { id: 'moutons', name: 'Moutons', icon: 'ri-ghost-smile-line', color: '#22D3EE' },
                  ].map(g => (
                    <div key={g.id} data-testid={`guided-${g.id}`} onClick={() => startGuidedSession(g.id)} style={{ padding: '12px', borderRadius: 14, cursor: 'pointer', background: `${g.color}08`, border: `1px solid ${g.color}20`, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                      <i className={g.icon} style={{ fontSize: 18, color: g.color }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Guidee par Nora</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ CORRELATIONS SANTE ═══ */}
            {correlations?.insights?.length > 0 && (
              <div data-testid="correlations-card" style={{ ...GLASS, padding: 20, marginBottom: 16 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                  <i className="ri-bar-chart-grouped-line" style={{ fontSize: 18, color: '#22D3EE' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Correlations sante</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                  {correlations.insights.map((ins: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', borderRadius: 14, background: `${ins.color}08`, border: `1px solid ${ins.color}15` } as any}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ins.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className={ins.icon} style={{ fontSize: 16, color: ins.color }} />
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 } as any}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{ins.title}</span>
                          {ins.impact && <span style={{ fontSize: 10, fontWeight: 800, color: ins.color, background: `${ins.color}15`, padding: '2px 8px', borderRadius: 999 }}>{ins.impact}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{ins.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Free play section - always available */}
            <div data-testid="free-play-section" style={{ ...GLASS, padding: 20, marginBottom: 16 } as any}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{t('dorsi_free_games')}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>15 {t('dorsi_games_available')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8 } as any}>
                {[
                  { id: 'moutons', name: 'Moutons', icon: 'ri-ghost-smile-line', color: '#22D3EE' },
                  { id: 'bulles', name: 'Bulles', icon: 'ri-bubble-chart-line', color: '#A78BFA' },
                  { id: 'proprioception', name: 'Equilibre', icon: 'ri-focus-3-line', color: '#10B981' },
                  { id: 'serpent', name: 'Serpent', icon: 'ri-route-line', color: '#F59E0B' },
                  { id: 'labyrinthe', name: 'Labyrinthe', icon: 'ri-compass-discover-line', color: '#EC4899' },
                  { id: 'slalom', name: 'Slalom', icon: 'ri-flag-line', color: '#06B6D4' },
                  { id: 'etoiles', name: 'Etoiles', icon: 'ri-star-line', color: '#F97316' },
                  { id: 'simon', name: 'Simon', icon: 'ri-flashlight-line', color: '#EF4444' },
                  { id: 'cercles', name: 'Cercles', icon: 'ri-record-circle-line', color: '#8B5CF6' },
                  { id: 'course', name: 'Course', icon: 'ri-run-line', color: '#14B8A6' },
                  { id: 'respiration', name: 'Respir.', icon: 'ri-lungs-line', color: '#60A5FA' },
                  { id: 'pendule', name: 'Pendule', icon: 'ri-timer-flash-line', color: '#F472B6' },
                  { id: 'peinture', name: 'Peinture', icon: 'ri-brush-line', color: '#FBBF24' },
                  { id: 'rebond', name: 'Rebond', icon: 'ri-basketball-line', color: '#FB923C' },
                  { id: 'gravite', name: 'Gravite', icon: 'ri-planet-line', color: '#818CF8' },
                ].map(g => (
                  <div key={g.id} data-testid={`free-play-${g.id}`} onClick={() => startFreeGame(g.id)} style={{ padding: '12px 4px', borderRadius: 14, cursor: 'pointer', background: `${g.color}08`, border: `1px solid ${g.color}20`, textAlign: 'center' } as any}>
                    <i className={g.icon} style={{ fontSize: 20, color: g.color, display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: g.color }}>{g.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Nora Recommendations based on bilan */}
            {noraRecs?.game_recommendations?.length > 0 && (
              <div style={{ ...GLASS, padding: 20, marginBottom: 16 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 10, background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className="ri-robot-2-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#A78BFA' }}>Nora recommande</span>
                </div>
                {noraRecs.summary && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 12, lineHeight: 1.5 }}>{noraRecs.summary}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                  {noraRecs.game_recommendations.map((g: any) => (
                    <div key={g.game} onClick={() => startFreeGame(g.game)} style={{ padding: '12px', borderRadius: 14, background: `${g.color}10`, border: `1px solid ${g.color}20`, cursor: 'pointer' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                        <i className={g.icon} style={{ fontSize: 18, color: g.color }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{g.name}</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{g.reason}</div>
                    </div>
                  ))}
                </div>
                {noraRecs.recommendations?.map((rec: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.06)' } as any}>
                    <i className="ri-arrow-right-circle-line" style={{ fontSize: 12, color: '#A78BFA', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{rec}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Score History */}
            {scoreHistory.length > 0 && (
              <div style={{ ...GLASS, padding: 20, marginBottom: 16 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Meilleurs scores</div>
                  <i className="ri-trophy-line" style={{ fontSize: 18, color: '#F59E0B' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                  {scoreHistory.slice(0, 6).map((h: any) => (
                    <div key={h.game_id} onClick={() => startFreeGame(h.game_id)} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>{h.name}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{h.scores.length} parties</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#F59E0B' }}>{h.best}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bilan reminder */}
            <div onClick={() => router.push('/dorsi-bilan' as any)} style={{ ...GLASS, padding: 16, marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className="ri-bar-chart-box-line" style={{ fontSize: 22, color: '#FFF' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Faire un bilan</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Evaluez votre mobilite et comparez avec les precedents</div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
            </div>

            {/* Program progress */}
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
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}' }} />
    </div>
  );
}
