import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import QRCode from 'react-native-qrcode-svg';

export default function LinkScreen() {
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'choose'|'generate'|'enter'>('choose');
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/beneficiary/generate-link-code', { method: 'POST' }, token);
      setGeneratedCode(r.code); setMode('generate');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setLoading(false); }
  };

  const linkWithCode = async () => {
    if (!code.trim()) return Alert.alert('Erreur', 'Entrez un code');
    setLoading(true);
    try {
      const r = await apiFetch('/api/guardian/link-with-code', { method: 'POST', body: JSON.stringify({ link_code: code.trim().toUpperCase() }) }, token);
      Alert.alert('Succès', `${r.beneficiary.name} lié à votre compte !`);
      await refreshUser();
      router.back();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setLoading(false); }
  };

  const shareCode = async () => {
    try {
      await Share.share({ message: `Mon code VitalLink pour me lier comme gardien : ${generatedCode}\nOuvrez l'app VitalLink et entrez ce code.` });
    } catch {}
  };

  const isBen = user?.role === 'beneficiary';
  const isGuardian = user?.role === 'guardian';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>{isBen ? 'Partager mon profil' : 'Ajouter un bénéficiaire'}</Text>
        <View style={{width:36}} />
      </View>

      <View style={s.content}>
        {mode === 'choose' && (
          <>
            <Text style={s.desc}>
              {isBen ? 'Partagez un code unique ou un QR code avec votre gardien pour qu\'il puisse se connecter à votre profil.' :
               'Scannez le QR code du bénéficiaire ou entrez son code unique pour vous connecter.'}
            </Text>

            {isBen && (
              <TouchableOpacity testID="generate-code-btn" style={s.actionBtn} onPress={generateCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : (
                  <><Ionicons name="qr-code-outline" size={20} color="#FFF" /><Text style={s.actionBtnT}>Générer mon code / QR</Text></>)}
              </TouchableOpacity>
            )}

            {isGuardian && (
              <TouchableOpacity testID="enter-code-btn" style={s.actionBtn} onPress={() => setMode('enter')}>
                <Ionicons name="keypad-outline" size={20} color="#FFF" />
                <Text style={s.actionBtnT}>Entrer un code</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {mode === 'generate' && generatedCode && (
          <>
            <Text style={s.codeLabel}>Votre code unique</Text>
            <Text style={s.codeValue}>{generatedCode}</Text>
            <View style={s.qrContainer}>
              <QRCode value={`vitallink://link/${generatedCode}`} size={180} backgroundColor="white" color="black" />
            </View>
            <Text style={s.qrHint}>Montrez ce QR code à votre gardien ou partagez le code</Text>
            <Text style={s.expiry}>Expire dans 24h</Text>

            <TouchableOpacity style={s.shareBtn} onPress={shareCode}>
              <Ionicons name="share-outline" size={16} color={Colors.primary} />
              <Text style={s.shareBtnT}>Partager le code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.newCodeBtn} onPress={generateCode} disabled={loading}>
              <Text style={s.newCodeBtnT}>Générer un nouveau code</Text>
            </TouchableOpacity>
          </>
        )}

        {mode === 'enter' && (
          <>
            <Text style={s.codeLabel}>Code du bénéficiaire</Text>
            <TextInput testID="link-code-input" style={s.codeInput} placeholder="Ex: ABCD1234" placeholderTextColor={Colors.textMuted}
              value={code} onChangeText={setCode} autoCapitalize="characters" blurOnSubmit={false} />

            <TouchableOpacity testID="link-submit-btn" style={s.actionBtn} onPress={linkWithCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <><Ionicons name="link" size={16} color="#FFF" /><Text style={s.actionBtnT}>Se connecter au bénéficiaire</Text></>)}
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setMode('choose')}>
              <Text style={s.cancelBtnT}>Retour</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.background},
  topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:10,gap:8},
  backBtn:{width:36,height:36,borderRadius:10,backgroundColor:Colors.subtle,justifyContent:'center',alignItems:'center'},
  topTitle:{flex:1,fontSize:18,fontWeight:'700',color:Colors.textPrimary,textAlign:'center'},
  content:{flex:1,paddingHorizontal:24,paddingTop:20,alignItems:'center'},
  desc:{fontSize:14,color:Colors.textSecondary,textAlign:'center',lineHeight:20,marginBottom:24},
  actionBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:Colors.primary,paddingVertical:16,paddingHorizontal:24,borderRadius:14,width:'100%',marginBottom:12},
  actionBtnT:{color:'#FFF',fontSize:15,fontWeight:'600'},
  codeLabel:{fontSize:12,fontWeight:'600',color:Colors.textMuted,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8},
  codeValue:{fontSize:36,fontWeight:'900',color:Colors.textPrimary,letterSpacing:4,marginBottom:20,fontFamily:Platform.OS==='ios'?'Menlo':'monospace'},
  qrContainer:{backgroundColor:'#FFF',padding:20,borderRadius:20,borderWidth:1,borderColor:Colors.border,marginBottom:16},
  qrHint:{fontSize:12,color:Colors.textMuted,textAlign:'center',marginBottom:4},
  expiry:{fontSize:11,color:Colors.textMuted,marginBottom:20},
  shareBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:12,paddingHorizontal:20,borderRadius:10,borderWidth:1,borderColor:Colors.border,width:'100%',marginBottom:10},
  shareBtnT:{fontSize:14,fontWeight:'600',color:Colors.primary},
  newCodeBtn:{paddingVertical:10},
  newCodeBtnT:{fontSize:13,color:Colors.textMuted},
  codeInput:{width:'100%',backgroundColor:Colors.subtle,borderRadius:14,paddingHorizontal:20,paddingVertical:16,fontSize:24,fontWeight:'800',color:Colors.textPrimary,textAlign:'center',borderWidth:1,borderColor:Colors.border,letterSpacing:4,marginBottom:20,fontFamily:Platform.OS==='ios'?'Menlo':'monospace'},
  cancelBtn:{paddingVertical:10,marginTop:10},
  cancelBtnT:{fontSize:13,color:Colors.textMuted},
});
