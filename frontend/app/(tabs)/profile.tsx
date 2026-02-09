import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

export default function ProfileScreen() {
  const { user, token, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);

  if (!user || !token) return null;

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleLinkBeneficiary = async () => {
    if (!linkEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un email');
      return;
    }
    setLinking(true);
    try {
      const res = await apiFetch('/api/guardian/link', {
        method: 'POST',
        body: JSON.stringify({ beneficiary_email: linkEmail.trim().toLowerCase() }),
      }, token);
      Alert.alert('Succès', `${res.beneficiary.name} a été lié à votre compte`);
      setLinkEmail('');
      await refreshUser();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLinking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="profile-screen">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mon Profil</Text>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={user.role === 'guardian' ? 'shield-checkmark' : 'heart'}
              size={14}
              color={Colors.primary}
            />
            <Text style={styles.roleText}>
              {user.role === 'guardian' ? 'Gardien' : 'Bénéficiaire'}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={Colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{user.phone || 'Non renseigné'}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Membre depuis</Text>
              <Text style={styles.infoValue}>
                {new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Guardian: Link Beneficiary */}
        {user.role === 'guardian' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lier un Bénéficiaire</Text>
            <Text style={styles.sectionDesc}>
              Entrez l'email d'un bénéficiaire inscrit pour le suivre
            </Text>
            <View style={styles.linkRow}>
              <TextInput
                testID="link-email-input"
                style={styles.linkInput}
                placeholder="email@beneficiaire.com"
                placeholderTextColor={Colors.textMuted}
                value={linkEmail}
                onChangeText={setLinkEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                testID="link-beneficiary-btn"
                style={styles.linkBtn}
                onPress={handleLinkBeneficiary}
                disabled={linking}
              >
                {linking ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Ionicons name="link" size={20} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
            {user.beneficiaries?.length > 0 && (
              <Text style={styles.linkedCount}>
                {user.beneficiaries.length} bénéficiaire(s) lié(s)
              </Text>
            )}
          </View>
        )}

        {/* Beneficiary: Guardians info */}
        {user.role === 'beneficiary' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mes Gardiens</Text>
            <Text style={styles.linkedCount}>
              {user.guardians?.length || 0} gardien(s) vous surveillent
            </Text>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.destructive} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.version}>VitalLink AI v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 16, marginBottom: 20 },

  // User Card
  userCard: {
    backgroundColor: Colors.paper, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFF' },
  userName: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: Colors.primary + '10', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  roleText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Section
  section: {
    backgroundColor: Colors.paper, borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
  sectionDesc: { fontSize: 14, color: Colors.textSecondary, marginBottom: 14, lineHeight: 20 },

  // Info
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.subtle },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },

  // Link Beneficiary
  linkRow: { flexDirection: 'row', gap: 10 },
  linkInput: {
    flex: 1, backgroundColor: Colors.subtle, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  linkBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  linkedCount: { fontSize: 14, color: Colors.textSecondary, marginTop: 12, fontWeight: '500' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 14, backgroundColor: Colors.destructive + '08',
    borderWidth: 1, borderColor: Colors.destructive + '20', marginBottom: 20,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.destructive },

  // Version
  version: { textAlign: 'center', fontSize: 13, color: Colors.textMuted },
});
