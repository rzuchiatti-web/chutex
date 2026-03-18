import React from 'react';

export const ProgramPill = ({ children, color, filled, style }: {
  children: React.ReactNode;
  color: string;
  filled?: boolean;
  style?: React.CSSProperties;
}) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 16px', borderRadius: 999,
    background: filled ? `${color}18` : 'rgba(255,255,255,0.06)',
    border: `1px solid ${filled ? `${color}30` : 'rgba(255,255,255,0.08)'}`,
    fontSize: 12, fontWeight: 700,
    color: filled ? color : 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap', ...style,
  } as any}>{children}</span>
);
