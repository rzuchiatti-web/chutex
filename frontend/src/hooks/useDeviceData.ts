import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/api';

export function useDeviceData(token: string) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [weighings, setWeighings] = useState<any[]>([]);
  const [dashData, setDashData] = useState<any>(null);
  const [removing, setRemoving] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const [devs, sub, w, dd] = await Promise.all([
        apiFetch('/api/devices', {}, token),
        apiFetch('/api/subscriptions/my', {}, token).catch(() => null),
        apiFetch('/api/devices/scale/history', {}, token).catch(() => []),
        apiFetch('/api/devices/dashboard-summary', {}, token).catch(() => null),
      ]);
      setDevices(devs);
      setSubscription(sub);
      setWeighings(Array.isArray(w) ? w : []);
      setDashData(dd);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // Auto-refresh devices every 10s to reflect BLE connection state changes
  useEffect(() => {
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const removeDevice = async (deviceId?: string, deviceType?: string) => {
    setRemoving(true);
    try {
      if (deviceId) {
        await apiFetch(`/api/devices/${deviceId}/remove`, { method: 'DELETE' }, token);
      } else if (deviceType) {
        await apiFetch('/api/devices/remove-by-type', { method: 'POST', body: JSON.stringify({ device_type: deviceType }) }, token);
      }
      fetchDevices();
    } catch {} finally {
      setRemoving(false);
    }
  };

  const syncDevice = async (deviceType: string) => {
    try {
      await apiFetch('/api/devices/sync', {
        method: 'POST',
        body: JSON.stringify({ device_type: deviceType, data: {} }),
      }, token);
      fetchDevices();
      window.alert('Synchronise !');
    } catch (e: any) {
      window.alert(e.message || 'Erreur');
    }
  };

  const deviceMap: Record<string, any> = {};
  devices.forEach(d => { deviceMap[d.device_type] = d; });

  return {
    devices, deviceMap, loading, subscription, weighings, dashData, removing,
    fetchDevices, removeDevice, syncDevice,
  };
}
