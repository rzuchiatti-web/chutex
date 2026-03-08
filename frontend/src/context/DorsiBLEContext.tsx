import React, { createContext, useContext } from 'react';
import { useDorsiBLE } from '../hooks/useDorsiBLE';

const DorsiBLEContext = createContext<ReturnType<typeof useDorsiBLE> | null>(null);

export function DorsiBLEProvider({ children }: { children: React.ReactNode }) {
  const ble = useDorsiBLE();
  return <DorsiBLEContext.Provider value={ble}>{children}</DorsiBLEContext.Provider>;
}

export function useSharedDorsiBLE() {
  const ctx = useContext(DorsiBLEContext);
  if (!ctx) throw new Error('useSharedDorsiBLE must be used within DorsiBLEProvider');
  return ctx;
}
