import React from 'react';

export const ProgramPill = ({ children, color, filled, isDark = true, style }: {
  children: React.ReactNode;
  color: string;
  filled?: boolean;
  isDark?: boolean;
  style?: React.CSSProperties;
}) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 16px', borderRadius: 999,
    background: filled ? `${color}18` : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
    border: `1px solid ${filled ? `${color}30` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
    fontSize: 12, fontWeight: 700,
    color: filled ? color : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
    whiteSpace: 'nowrap', ...style,
  } as any}>{children}</span>
);
