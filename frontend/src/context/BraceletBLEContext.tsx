import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';

interface BraceletBLEState {
  device: any;
  writeChar: any;
  isConnected: boolean;
  braceletModel: 'v8' | 'v6' | '2208a' | null;
  setConnection: (device: any, writeChar: any, model: 'v8' | 'v6' | '2208a' | null) => void;
  disconnect: () => void;
}

const BraceletBLEContext = createContext<BraceletBLEState>({
  device: null,
  writeChar: null,
  isConnected: false,
  braceletModel: null,
  setConnection: () => {},
  disconnect: () => {},
});

export function BraceletBLEProvider({ children }: { children: React.ReactNode }) {
  const [device, setDevice] = useState<any>(null);
  const [writeChar, setWriteChar] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [braceletModel, setBraceletModel] = useState<'v8' | 'v6' | '2208a' | null>(null);

  const setConnection = useCallback((dev: any, wChar: any, model: 'v8' | 'v6' | '2208a' | null) => {
    setDevice(dev);
    setWriteChar(wChar);
    setBraceletModel(model);
    setIsConnected(true);

    // Also store on window for legacy compatibility
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      (window as any).__bleBraceletDevice = dev;
    }

    // Listen for disconnection on web
    if (Platform.OS === 'web' && dev?.addEventListener) {
      const onDisconnect = () => {
        setDevice(null);
        setWriteChar(null);
        setIsConnected(false);
        if (typeof window !== 'undefined') {
          (window as any).__bleBraceletDevice = null;
        }
      };
      try {
        dev.addEventListener('gattserverdisconnected', onDisconnect);
      } catch {}
    }
  }, []);

  const disconnect = useCallback(() => {
    if (Platform.OS === 'web' && device?.gatt?.connected) {
      try { device.gatt.disconnect(); } catch {}
    }
    setDevice(null);
    setWriteChar(null);
    setIsConnected(false);
    setBraceletModel(null);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      (window as any).__bleBraceletDevice = null;
    }
  }, [device]);

  return (
    <BraceletBLEContext.Provider value={{
      device,
      writeChar,
      isConnected,
      braceletModel,
      setConnection,
      disconnect,
    }}>
      {children}
    </BraceletBLEContext.Provider>
  );
}

export function useBraceletBLE() {
  return useContext(BraceletBLEContext);
}
