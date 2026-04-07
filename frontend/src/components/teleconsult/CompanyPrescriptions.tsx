import { Icon } from '../WebIcon';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, RefreshControl, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { apiFetch } from '../../services/api';

export function CompanyPrescriptions({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'pending'|'subscribed'>('pending');
  const [selectedPresc, setSelectedPresc] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch('/api/company/dashboard', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <FullScreenLoader />;
  if (!data) return null;

  const allPrescs = data.prescriptions || [];
  const pending = allPrescs.filter((p: any) => p.status === 'pending');
  const subscribed = allPrescs.filter((p: any) => p.status === 'subscribed');
  const displayed = tab === 'pending' ? pending : subscribed;
  const total = displayed.reduce((s: number, p: any) => s + (p.commission || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Prescriptions</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{allPrescs.length} prescriptions au total</Text>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'pending' && { backgroundColor: '#FF9800' }]} onPress={() => setTab('pending')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'pending' ? '#FFF' : '#888' }}>En cours ({pending.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'subscribed' && { backgroundColor: '#10B981' }]} onPress={() => setTab('subscribed')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'subscribed' ? '#FFF' : '#888' }}>Validees ({subscribed.length})</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 }}>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>Total commissions</Text>
        <Text style={{ fontSize: 16, fontWeight: '900', color: tab === 'pending' ? '#FF9800' : '#4CAF50' }}>{total} EUR</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>
        {displayed.map((p: any) => (
          <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => setSelectedPresc(p)}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={p.status === 'subscribed' ? 'checkmark-circle' : 'time'} size={16} color={p.status === 'subscribed' ? '#4CAF50' : '#FF9800'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>Par: {p.guardian_name}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{p.commission}EUR</Text>
                <Icon name="chevron-forward" size={14} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {displayed.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name={tab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Aucune prescription {tab === 'pending' ? 'en cours' : 'validee'}</Text>
          </View>
        )}
      </ScrollView>
      <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
            {selectedPresc && <>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ padding: 4, marginRight: 12 }}>
                  <Icon name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#111827' }}>Fiche Prescription</Text>
                <TouchableOpacity onPress={() => setSelectedPresc(null)}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 24, marginBottom: 12, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {}) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF' }}>{selectedPresc.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>{selectedPresc.beneficiary_name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <View style={{ backgroundColor: selectedPresc.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: selectedPresc.status === 'subscribed' ? '#2E7D32' : '#E65100', textTransform: 'uppercase', letterSpacing: 0.5 }}>{selectedPresc.status === 'subscribed' ? 'Souscrit' : t('pending')}</Text>
                        </View>
                        <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#1565C0', textTransform: 'uppercase' }}>{selectedPresc.subscription_type}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {[
                    { icon: 'mail-outline', label: t('email_label'), value: selectedPresc.beneficiary_email },
                    { icon: 'call-outline', label: t('phone_label'), value: selectedPresc.beneficiary_phone },
                    { icon: 'person-circle-outline', label: t('prescriber'), value: selectedPresc.guardian_name },
                    { icon: 'cash-outline', label: 'Commission', value: `${selectedPresc.commission} EUR` },
                    { icon: 'calendar-outline', label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleDateString('fr-FR') : '' },
                  ].map(({ icon, label, value }) => value ? (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                      <Icon name={icon as any} size={16} color="#888" />
                      <Text style={{ fontSize: 12, color: '#6B7280', width: 100 }}>{label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 }}>{value}</Text>
                    </View>
                  ) : null)}
                </View>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', alignItems: 'center' }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{selectedPresc.commission} EUR</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Commission {selectedPresc.status === 'subscribed' ? 'validee' : 'en attente'}</Text>
                </View>
              </ScrollView>
            </>}
          </View>
        </View>
      </Modal>
    </View>
  );
}
