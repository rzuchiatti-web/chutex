import { Icon } from '../WebIcon';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

export function CompanyIntervenants({ token }: { token: string }) {
  const router = useRouter();
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try { setIntervenants(await apiFetch('/api/company/intervenants', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <FullScreenLoader />;

  const filtered = search.trim()
    ? intervenants.filter((iv: any) => iv.name?.toLowerCase().includes(search.toLowerCase()) || iv.email?.toLowerCase().includes(search.toLowerCase()))
    : intervenants;

  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Intervenants</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{intervenants.length} intervenants Care</Text>
      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
          <Icon name="search-outline" size={16} color="#888" />
          <TextInput style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#111827' }}
            placeholder="Rechercher un intervenant..." placeholderTextColor="#AAA" value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Icon name="close-circle" size={16} color="#AAA" /></TouchableOpacity>}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>
        {filtered.map((iv: any) => (
          <TouchableOpacity key={iv.id} activeOpacity={0.7} data-testid={`intervenant-card-${iv.id}`}
            onPress={() => router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: iv.id } })}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, ...glass }}>
              <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: '#9C27B0', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{iv.name}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.profession || 'Intervenant Care'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Icon name="business-outline" size={11} color="#FF9800" />
                  <Text style={{ fontSize: 10, color: '#FF9800', fontWeight: '600' }}>{iv.agency_name}</Text>
                  <Text style={{ fontSize: 10, color: '#9CA3AF' }}>· {iv.intervention_radius_km}km</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{iv.total_interventions} missions</Text>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                  {iv.active_interventions > 0 && (
                    <View style={{ backgroundColor: '#FF980015', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FF9800' }}>{iv.active_interventions} actives</Text>
                    </View>
                  )}
                  <View style={{ backgroundColor: '#4CAF5015', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>{iv.completed_interventions} term.</Text>
                  </View>
                </View>
              </View>
              <Icon name="chevron-forward" size={16} color="#888" />
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name="medkit-outline" size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>{search ? 'Aucun resultat' : 'Aucun intervenant'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
