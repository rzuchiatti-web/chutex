import { Icon, MCIcon } from '../WebIcon';
import { PhoneInputWithPrefix } from '../PhoneInputWithPrefix';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Linking, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { PageExplainer } from '../HelpSystem';
import { confirmAction } from './constants';

function RewardsCard({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  useEffect(() => { apiFetch('/api/rewards/ranking', {}, token).then(setData).catch(() => {}); }, [token]);
  if (!data) return null;
  const posColor = data.my_position === 1 ? '#FFD700' : data.my_position === 2 ? '#C0C0C0' : data.my_position === 3 ? '#CD7F32' : '#000';
  const myPrize = data.my_position === 1 ? data.prizes?.['1'] : data.my_position === 2 ? data.prizes?.['2'] : data.my_position === 3 ? data.prizes?.['3'] : 0;
  return (
    <>
      <TouchableOpacity onPress={() => setShowDetail(true)} activeOpacity={0.8}>
        <View style={{ backgroundColor: '#FFF8E1', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#FFD54F', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="trophy" size={24} color="#111827" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>Challenge du mois</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>1er: {data.prizes?.['1']}EUR - 2e: {data.prizes?.['2']}EUR - 3e: {data.prizes?.['3']}EUR</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: posColor }}>{data.my_position}<Text style={{ fontSize: 11 }}>e</Text></Text>
            <Text style={{ fontSize: 9, color: '#6B7280' }}>position</Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#FFB300" />
        </View>
      </TouchableOpacity>
      {data.prescriptions_to_next > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: -8, paddingHorizontal: 4 }}>
          <Icon name="flame" size={14} color="#FF9800" />
          <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '700' }}>Plus que {data.prescriptions_to_next} prescription{data.prescriptions_to_next > 1 ? 's' : ''} pour monter !</Text>
        </View>
      )}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Challenge Prescripteurs</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}><Icon name="close" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: '#FFF8E1', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#F57F17', textAlign: 'center', marginBottom: 12 }}>Recompenses du mois</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {[{pos: '1er', prize: data.prizes?.['1'], color: '#FFD700', icon: 'trophy'}, {pos: '2e', prize: data.prizes?.['2'], color: '#C0C0C0', icon: 'medal'}, {pos: '3e', prize: data.prizes?.['3'], color: '#CD7F32', icon: 'ribbon'}].map(t => (
                    <View key={t.pos} style={{ alignItems: 'center' }}>
                      <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: t.color, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                        <Icon name={t.icon as any} size={22} color="#111827" />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>{t.prize}EUR</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280' }}>{t.pos}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ backgroundColor: posColor + '15', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: posColor }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textAlign: 'center', marginBottom: 4 }}>VOTRE POSITION</Text>
                <Text style={{ fontSize: 36, fontWeight: '900', color: posColor, textAlign: 'center' }}>{data.my_position}<Text style={{ fontSize: 16 }}>e</Text></Text>
                <Text style={{ fontSize: 14, color: '#111827', textAlign: 'center', fontWeight: '600' }}>{data.my_prescriptions} prescription{data.my_prescriptions !== 1 ? 's' : ''} ce mois</Text>
                {myPrize > 0 && <Text style={{ fontSize: 13, color: '#10B981', textAlign: 'center', fontWeight: '800', marginTop: 4 }}>Vous gagnez {myPrize}EUR !</Text>}
                {data.prescriptions_to_next > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                    <Icon name="flame" size={16} color="#FF9800" />
                    <Text style={{ fontSize: 13, color: '#E65100', fontWeight: '700' }}>Plus que {data.prescriptions_to_next} pour monter !</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 10 }}>Classement anonyme</Text>
              {(data.ranking || []).map((r: any) => (
                <View key={r.position} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }, r.is_me && { backgroundColor: '#FFF8E1', borderRadius: 10, paddingHorizontal: 8 }]}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: r.position === 1 ? '#FFD700' : r.position === 2 ? '#C0C0C0' : r.position === 3 ? '#CD7F32' : 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: r.position <= 3 ? '#FFF' : '#888' }}>{r.position}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: r.is_me ? '900' : '600', color: '#111827', flex: 1 }}>{r.is_me ? 'Vous' : `Prescripteur #${r.position}`}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: r.position <= 3 ? '#4CAF50' : '#888' }}>{r.prescriptions} presc.</Text>
                </View>
              ))}
              <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 14, marginTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 6 }}>Regles du programme</Text>
                <Text style={{ fontSize: 12, color: '#555', lineHeight: 18 }}>Les 3 meilleurs prescripteurs du mois recoivent une prime versee debut du mois suivant. Le classement est base sur le nombre de prescriptions validees. Seules les prescriptions du mois en cours comptent.</Text>
              </View>
              {data.history?.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 10 }}>Historique</Text>
                  {data.history.map((h: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 12, color: '#6B7280', width: 60 }}>{h.month}</Text>
                      <Icon name="trophy" size={14} color="#FFD700" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>{h.winner_name || 'Prescripteur #1'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default RewardsCard;
