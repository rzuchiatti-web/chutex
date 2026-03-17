import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import FullScreenLoader from '../FullScreenLoader';
import AnimatedDarkBg from '../AnimatedDarkBg';
import { Icon, MCIcon } from '../WebIcon';
import WeighingFlow from '../dashboard/WeighingFlow';
import { Colors } from '../../constants/colors';
import { useDeviceData } from '../../hooks/useDeviceData';
import { useBleConnection } from '../../hooks/useBleConnection';
import { BG_BLACK, ALL_DEVICE_TYPES, DEVICE_META } from './constants';
import { DeviceCard } from './DeviceCard';
import { PairingStepsPopup, BleScanningPopup, BleConnectedPopup, BleErrorPopup } from './PairingOverlays';
import { DeviceDetailPopup } from './DeviceDetailPopup';
import { NoSubscriptionPopup } from './NoSubscriptionPopup';

export function DeviceManagement({ token }: { token: string }) {
  const router = useRouter();
  const { deviceMap, loading, subscription, weighings, dashData, removing, fetchDevices, removeDevice } = useDeviceData(token);
  const ble = useBleConnection(token, fetchDevices);

  const [showNoSubPopup, setShowNoSubPopup] = useState(false);
  const [showWeighing, setShowWeighing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const handleStartPairing = (dt: string) => {
    if (dt === 'bracelet' && !subscription?.can_use_bracelet) {
      setShowNoSubPopup(true);
      return;
    }
    ble.startPairing(dt);
  };

  const openWeighingFlow = () => {
    setShowWeighing(true);
  };

  const handleScaleWeighingFromPairing = () => {
    setShowWeighing(false);
    ble.launchScaleWeighing();
  };

  const handleRemoveDevice = async (deviceId: string | undefined, deviceType: string) => {
    await removeDevice(deviceId, deviceType);
    setSelectedDevice(null);
  };

  if (loading) return <FullScreenLoader />;

  /* ── Web rendering ── */
  if (Platform.OS === 'web') {
    return (
      <div data-testid="devices-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <AnimatedDarkBg />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          <div style={{ padding: '28px 0 16px', textAlign: 'center' } as any}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Dispositifs connectes</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Gerez vos dispositifs de sante Chutex</div>
          </div>

          {ALL_DEVICE_TYPES.map(dt => (
            <DeviceCard
              key={dt}
              deviceType={dt}
              device={deviceMap[dt]}
              subscription={subscription}
              weighings={weighings}
              onStartPairing={handleStartPairing}
              onSelectDevice={setSelectedDevice}
              onScaleWeighing={openWeighingFlow}
            />
          ))}
        </div>

        {/* Pairing Steps Popup */}
        {ble.pairingDevice && ble.bleStatus === 'idle' && (
          <PairingStepsPopup
            deviceType={ble.pairingDevice}
            step={ble.pairingStep}
            onSetStep={ble.setPairingStep}
            onClose={ble.closePairing}
            onLaunchScan={ble.launchBleScan}
            onScaleWeighing={() => { ble.closePairing(); handleScaleWeighingFromPairing(); }}
            targetMac={ble.targetMac}
            onSetTargetMac={ble.setTargetMac}
          />
        )}

        {/* BLE Scanning */}
        {ble.pairingDevice && ble.bleStatus === 'scanning' && (
          <BleScanningPopup
            deviceType={ble.pairingDevice}
            bleError={ble.bleError}
            onClose={ble.closePairing}
          />
        )}

        {/* BLE Connected */}
        {ble.pairingDevice && ble.bleStatus === 'connected' && (
          <BleConnectedPopup
            deviceType={ble.pairingDevice}
            bleVitals={ble.bleVitals}
            onClose={ble.closePairing}
          />
        )}

        {/* BLE Error */}
        {ble.pairingDevice && ble.bleStatus === 'error' && (
          <BleErrorPopup
            deviceType={ble.pairingDevice}
            bleError={ble.bleError}
            onClose={ble.closePairing}
            onRetry={() => ble.launchBleScan(ble.pairingDevice!)}
          />
        )}

        {/* Device Detail Popup */}
        {selectedDevice && deviceMap[selectedDevice] && (
          <DeviceDetailPopup
            deviceType={selectedDevice}
            device={deviceMap[selectedDevice]}
            weighings={weighings}
            removing={removing}
            onClose={() => setSelectedDevice(null)}
            onRemove={handleRemoveDevice}
            onLaunchScan={ble.launchBleScan}
            onScaleWeighing={openWeighingFlow}
          />
        )}

        {/* No Subscription Popup */}
        {showNoSubPopup && <NoSubscriptionPopup onClose={() => setShowNoSubPopup(false)} />}

        {/* WeighingFlow (balance) */}
        {showWeighing && (
          <WeighingFlow
            onClose={() => { setShowWeighing(false); fetchDevices(); }}
            d={dashData?.scale || {}}
            weighings={weighings}
          />
        )}
      </div>
    );
  }

  /* ── Native rendering ── */
  return (
    <ScrollView style={styles.sv} contentContainerStyle={styles.sc} showsVerticalScrollIndicator={false}>
      {ALL_DEVICE_TYPES.map(dt => {
        const meta = DEVICE_META[dt];
        const device = deviceMap[dt];
        const isA = device && (device.connected || device.battery > 0);
        return (
          <View key={dt} style={styles.deviceCard} testID={`device-card-${dt}`}>
            <View style={styles.deviceHeader}>
              <View style={styles.deviceIconBg}>
                <MCIcon name={(dt === 'bracelet' ? 'watch' : dt === 'scale' ? 'scale-bathroom' : 'tshirt-crew') as any} size={24} color={Colors.textPrimary} />
              </View>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{meta.name}</Text>
              </View>
              {isA && <Text style={styles.batteryT}>{device?.battery || 0}%</Text>}
            </View>
            <TouchableOpacity style={styles.syncBtn} onPress={() => handleStartPairing(dt)}>
              <Icon name="bluetooth" size={16} color={isA ? Colors.success : Colors.primary} />
              <Text style={styles.syncBtnText}>{isA ? (dt === 'scale' ? 'Nouvelle pesee' : 'Connexion') : (dt === 'scale' ? 'Nouvelle pesee' : 'Associer')}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sv: { flex: 1 },
  sc: { paddingHorizontal: 20, paddingBottom: 24 },
  deviceCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 10 },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  deviceIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  batteryT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.paper },
  syncBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
