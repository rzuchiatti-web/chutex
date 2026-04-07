import React from 'react';
import { PrefixPicker } from '../GlassPickers';

interface ProgramInviteProps {
  clr: string;
  isDark?: boolean;
  inviteCode: string;
  invitePhone: string;
  setInvitePhone: (v: string) => void;
  invitePrefix: string;
  setInvitePrefix: (v: string) => void;
  inviteMsg: string;
  inviteLoading: boolean;
  invitedFriends: any[];
  onInvite: () => void;
  onContinue: () => void;
}

export const ProgramInvite = ({
  clr, isDark = true, inviteCode, invitePhone, setInvitePhone, invitePrefix, setInvitePrefix,
  inviteMsg, inviteLoading, invitedFriends, onInvite, onContinue,
}: ProgramInviteProps) => {
  const T = isDark ? '#FFF' : '#1A1A2E';
  const S = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)';
  const S2 = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const S3 = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const inputDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
  <div style={{ maxWidth: 480, margin: '0 auto', padding: '70px 20px 120px', animation: 'pd-fade-up 400ms ease both' } as any}>
    <div onClick={onContinue} style={{
      width: 42, height: 42, borderRadius: 999, background: cardBg,
      border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', marginBottom: 24,
    } as any}>
      <i className="ri-close-line" style={{ fontSize: 18, color: S }} />
    </div>

    <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
      <div style={{
        width: 56, height: 56, borderRadius: 18, background: 'rgba(167,139,250,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      } as any}>
        <i className="ri-team-line" style={{ fontSize: 28, color: '#A78BFA' }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: T, marginBottom: 8 }}>Invitez vos amis</div>
      <div style={{ fontSize: 13, color: S }}>Le programme est lance ! Invitez des amis.</div>
    </div>

    {/* Team code */}
    <div style={{
      padding: '20px', borderRadius: 20,
      background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)',
      marginBottom: 24, textAlign: 'center',
    } as any}>
      <div style={{ fontSize: 9, color: S2, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Code d equipe</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: T, letterSpacing: 6 }}>{inviteCode}</div>
      <div onClick={() => navigator.clipboard?.writeText(inviteCode)} style={{ marginTop: 8, fontSize: 11, color: S2, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 } as any}>
        <i className="ri-file-copy-line" />Copier
      </div>
    </div>

    <div style={{ fontSize: 12, fontWeight: 700, color: S, marginBottom: 10 }}>Inviter par telephone</div>
    <div style={{ display: 'flex', gap: 8, marginBottom: 14, width: '100%', boxSizing: 'border-box' } as any}>
      <div style={{
        display: 'flex', alignItems: 'center', flex: 1, minWidth: 0,
        borderRadius: 999, background: inputBg, border: `1px solid ${inputBorder}`,
        overflow: 'hidden',
      } as any}>
        <div style={{ borderRight: `1px solid ${inputDivider}`, flexShrink: 0 } as any}>
          <PrefixPicker value={invitePrefix} onChange={setInvitePrefix} />
        </div>
        <input data-testid="invite-phone-input" value={invitePhone} onChange={(e: any) => setInvitePhone(e.target.value)} placeholder="06 12 34 56 78"
          style={{ flex: 1, minWidth: 0, padding: '13px 16px', background: 'transparent', border: 'none', color: T, fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
      </div>
      <div data-testid="invite-send-btn" onClick={onInvite} style={{
        width: 48, height: 48, borderRadius: 999,
        background: invitePhone.trim() ? 'rgba(167,139,250,0.15)' : cardBg,
        border: `1px solid ${invitePhone.trim() ? 'rgba(167,139,250,0.3)' : cardBorder}`,
        cursor: invitePhone.trim() && !inviteLoading ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      } as any}>
        <i className={inviteLoading ? "ri-loader-4-line" : "ri-send-plane-2-line"} style={{ fontSize: 18, color: invitePhone.trim() ? '#A78BFA' : S3 }} />
      </div>
    </div>

    {inviteMsg && (
      <div style={{ padding: '12px 16px', borderRadius: 999, background: inviteMsg.includes(t('error')) ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${inviteMsg.includes(t('error')) ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)'}`, marginBottom: 16, fontSize: 12, color: T, textAlign: 'center' } as any}>{inviteMsg}</div>
    )}

    {invitedFriends.length > 0 && (
      <div style={{ marginBottom: 20 } as any}>
        <div style={{ fontSize: 9, fontWeight: 800, color: S3, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Invitations envoyees</div>
        {invitedFriends.map((f: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i > 0 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` : 'none' } as any}>
            <div style={{ width: 30, height: 30, borderRadius: 999, background: f.status === 'notification_sent' ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className={f.status === 'notification_sent' ? 'ri-notification-line' : 'ri-message-2-line'} style={{ fontSize: 14, color: f.status === 'notification_sent' ? '#10B981' : '#3B82F6' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T }}>{f.name}</div>
              <div style={{ fontSize: 10, color: S2 }}>{f.status === 'notification_sent' ? 'Notification in-app' : f.status === 'sms_sent' ? 'SMS envoye' : f.status === 'already_member' ? 'Deja membre' : t('pending')}</div>
            </div>
          </div>
        ))}
      </div>
    )}

    <div onClick={onContinue} className="pd-btn-primary" style={{
      padding: '18px', borderRadius: 999, textAlign: 'center', cursor: 'pointer',
      background: clr, fontSize: 15, fontWeight: 900, color: '#FFF',
      marginTop: 12, boxShadow: `0 4px 24px ${clr}35`, transition: 'all 200ms ease',
    } as any}>
      {invitedFriends.length > 0 ? 'Commencer le programme' : 'Continuer sans inviter'}
    </div>
  </div>
  );
};
