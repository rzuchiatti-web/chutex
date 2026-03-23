import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NativePageView from '../src/components/NativePageView';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { ProgramPresentation } from '../src/components/programs/ProgramPresentation';
import { ProgramOnboarding } from '../src/components/programs/ProgramOnboarding';
import { ProgramInvite } from '../src/components/programs/ProgramInvite';
import { ProgramReady } from '../src/components/programs/ProgramReady';

export default function ProgramDetailScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const programId = Array.isArray(id) ? id[0] : id;

  const [program, setProgram] = useState<any>(null);
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('solo');
  const [onboarding, setOnboarding] = useState<any>({});
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitePrefix, setInvitePrefix] = useState('+33');

  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/programs/detail/${programId}`, {}, token).catch(() => null),
      apiFetch('/api/programs/active', {}, token).catch(() => null),
    ]).then(([detail, active]) => {
      if (detail) setProgram(detail);
      if (active) setActiveProgram(active);
    }).finally(() => setLoading(false));
  }, [programId, token]);

  if (Platform.OS !== 'web') return <NativePageView path={`/program-detail?id=${id}`} />;
  if (loading || !program) return <FullScreenLoader />;

  const isDark = typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') !== '0' : true;
  const clr = program.color || '#FFF';
  const hasOnboarding = (program.onboarding_fields || []).length > 0;
  const hasActiveConflict = !!activeProgram?.active && activeProgram?.program?.id !== programId;

  const applyOnboarding = async () => {
    try {
      await apiFetch('/api/programs/apply-onboarding', { method: 'POST', body: JSON.stringify({ onboarding, program_id: programId }) }, token);
    } catch {}
  };

  const createTeamAndStart = async () => {
    if (hasActiveConflict) { setError('Vous avez deja un programme actif. Terminez-le avant d en lancer un nouveau.'); return; }
    setStarting(true); setError('');
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const teamRes = await apiFetch(`/api/programs/team/create`, { method: 'POST', body: JSON.stringify({ program_id: programId, start_date: startDate }) }, token);
      setTeamId(teamRes.team_id); setInviteCode(teamRes.invite_code);
      await apiFetch(`/api/programs/start/${programId}`, { method: 'POST', body: JSON.stringify({ mode, onboarding }) }, token);
      await applyOnboarding();
      setStep(2);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const startSolo = async () => {
    if (hasActiveConflict) { setError('Vous avez deja un programme actif. Terminez-le avant d en lancer un nouveau.'); return; }
    setStarting(true); setError('');
    try {
      await apiFetch(`/api/programs/start/${programId}`, { method: 'POST', body: JSON.stringify({ mode: 'solo', onboarding }) }, token);
      await applyOnboarding();
      router.replace('/(tabs)/chat' as any);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setStarting(false); }
  };

  const inviteFriend = async () => {
    if (!invitePhone.trim() || !teamId) return;
    setInviteLoading(true); setInviteMsg('');
    try {
      let phone = invitePhone.trim().replace(/\s/g, '');
      if (phone.startsWith('0') && phone.length >= 9) phone = invitePrefix + phone.substring(1);
      else if (!phone.startsWith('+')) phone = invitePrefix + phone;
      const res = await apiFetch('/api/programs/team/invite-by-phone', { method: 'POST', body: JSON.stringify({ phone, team_id: teamId }) }, token);
      setInviteMsg(res.message || 'Invitation envoyee');
      setInvitedFriends(prev => [...prev, { phone, status: res.status, name: res.invitee_name || phone }]);
      setInvitePhone('');
    } catch (e: any) { setInviteMsg(e.message || 'Erreur'); } finally { setInviteLoading(false); }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: isDark ? '#0a0a0f' : '#FFF' } as any}>
      <style>{`
        @keyframes pd-fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pd-scale-in { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes pd-shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .pd-btn-primary:hover { transform: translateY(-1px) !important; box-shadow: 0 8px 32px ${clr}30 !important; }
        .pd-btn-secondary:hover { background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'} !important; }
        .pd-phase-card:hover { background: ${isDark ? 'rgba(255,255,255,0.06)' : '#EBEBED'} !important; border-color: ${clr}25 !important; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' } as any}>
        {step === 0 && (
          <ProgramPresentation
            program={program} clr={clr} isDark={isDark}
            hasActiveConflict={hasActiveConflict} hasOnboarding={hasOnboarding}
            error={error}
            onStartSolo={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setMode('solo'); setStep(hasOnboarding ? 1 : 3); }}
            onStartTeam={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setMode('duo'); setStep(hasOnboarding ? 1 : 3); }}
            onBack={() => router.back()}
          />
        )}

        {step === 1 && (
          <ProgramOnboarding
            program={program} clr={clr} isDark={isDark}
            onboarding={onboarding} setOnboarding={setOnboarding}
            hasActiveConflict={hasActiveConflict}
            onNext={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } setStep(3); }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <ProgramInvite
            clr={clr} inviteCode={inviteCode}
            invitePhone={invitePhone} setInvitePhone={setInvitePhone}
            invitePrefix={invitePrefix} setInvitePrefix={setInvitePrefix}
            inviteMsg={inviteMsg} inviteLoading={inviteLoading}
            invitedFriends={invitedFriends}
            onInvite={inviteFriend}
            onContinue={() => router.replace('/(tabs)/chat' as any)}
          />
        )}

        {step === 3 && (
          <ProgramReady
            program={program} clr={clr} mode={mode}
            hasOnboarding={hasOnboarding} hasActiveConflict={hasActiveConflict}
            starting={starting} error={error}
            onBack={() => setStep(hasOnboarding ? 1 : 0)}
            onLaunch={() => { if (hasActiveConflict) { setError('Vous avez deja un programme actif.'); return; } mode !== 'solo' ? createTeamAndStart() : startSolo(); }}
          />
        )}
      </div>
    </div>
  );
}
