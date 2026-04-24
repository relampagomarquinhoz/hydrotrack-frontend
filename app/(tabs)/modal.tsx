import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera, Droplets, Bell, LogOut,
  ChevronRight, Trophy, User, Calculator, X,
} from 'lucide-react-native';
import { router } from 'expo-router';

const achievements = [
  { id: '1', emoji: '💧', title: 'Hidratado!',       desc: '7 Dias Seguidos',          color: '#1565C0', bg: '#E3F2FD', unlocked: true  },
  { id: '2', emoji: '🏆', title: 'Meta Batida!',     desc: '5 Dias Cumprindo a Meta',  color: '#F57F17', bg: '#FFF8E1', unlocked: true  },
  { id: '3', emoji: '🔥', title: 'Em Chamas!',       desc: '3 Dias de Sequência',      color: '#C62828', bg: '#FFEBEE', unlocked: true  },
  { id: '4', emoji: '⭐', title: 'Estrela da Semana', desc: 'Meta todos os dias',       color: '#6A1B9A', bg: '#F3E5F5', unlocked: false },
];

export default function ProfileScreen() {
  const [alerts, setAlerts]           = useState(true);
  const [calcVisible, setCalcVisible] = useState(false);

  // Calculadora
  const [calcWeight, setCalcWeight] = useState('');
  const [calcAge,    setCalcAge]    = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const isDark = false;
  const bg     = isDark ? '#0D1B2A' : '#F0F7FF';
  const cardBg = isDark ? '#1A2D42' : '#fff';
  const text    = isDark ? '#E3F2FD' : '#1A237E';
  const textSub = isDark ? '#90CAF9' : '#546E7A';
  const border  = isDark ? '#1E88E5' : '#BBDEFB';

  const handleCalc = () => {
    const w = parseFloat(calcWeight);
    const a = parseInt(calcAge);
    if (!w || !a) { Alert.alert('Atenção', 'Preencha peso e idade'); return; }
    // Fórmula: 35ml por kg até 17 anos, 35ml dos 18-55, 30ml acima de 55
    let mlPerKg = a < 18 ? 40 : a <= 55 ? 35 : 30;
    setCalcResult(Math.round(w * mlPerKg));
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja realmente sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => router.replace('/login') },
    ]);
  };

  const handlePhoto = () => {
    Alert.alert('Foto de perfil', 'Escolha uma opção', [
      { text: 'Câmera'        },
      { text: 'Galeria'       },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1565C0', '#1E88E5', '#42A5F5']} style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <User color="#1565C0" size={38} />
          </View>
          <TouchableOpacity style={styles.cameraBtn} onPress={handlePhoto} activeOpacity={0.8}>
            <Camera color="#fff" size={14} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerName}>Pedro Silva</Text>
        <Text style={styles.headerEmail}>pedro@email.com</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Conquistas ── */}
        <View style={styles.sectionRow}>
          <Trophy color="#1565C0" size={16} />
          <Text style={[styles.sectionTitle, { color: text }]}>Conquistas</Text>
        </View>
        <View style={styles.badgeGrid}>
          {achievements.map((a) => (
            <View key={a.id} style={[styles.badgeCard, { backgroundColor: cardBg, borderColor: a.unlocked ? a.color : border, opacity: a.unlocked ? 1 : 0.45 }]}>
              <View style={[styles.emojiCircle, { backgroundColor: a.bg }]}>
                <Text style={styles.emojiText}>{a.emoji}</Text>
              </View>
              <Text style={[styles.badgeTitle, { color: a.color }]}>{a.title}</Text>
              <Text style={[styles.badgeDesc, { color: textSub }]}>{a.desc}</Text>
              {!a.unlocked && <Text style={styles.locked}>🔒 Bloqueado</Text>}
            </View>
          ))}
        </View>

        {/* ── Configurações ── */}
        <View style={styles.sectionRow}>
          <User color="#1565C0" size={16} />
          <Text style={[styles.sectionTitle, { color: text }]}>Configurações</Text>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: cardBg, borderColor: border }]}>

          {/* Foto de perfil */}
          <TouchableOpacity style={styles.settingRow} onPress={handlePhoto} activeOpacity={0.7}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#E3F2FD' }]}>
              <Camera color="#1565C0" size={18} />
            </View>
            <Text style={[styles.settingLabel, { color: text }]}>Alterar foto de perfil</Text>
            <ChevronRight color={textSub} size={16} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: border }]} />

          {/* Calculadora de hidratação */}
          <TouchableOpacity style={styles.settingRow} onPress={() => setCalcVisible(true)} activeOpacity={0.7}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#E8F5E9' }]}>
              <Calculator color="#2E7D32" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: text }]}>Calcular meta de água</Text>
              <Text style={[styles.settingHint, { color: textSub }]}>Baseado no seu peso e idade</Text>
            </View>
            <ChevronRight color={textSub} size={16} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: border }]} />

          {/* Alertas */}
          <View style={styles.settingRow}>
            <View style={[styles.settingIconWrap, { backgroundColor: alerts ? '#FFF8E1' : '#F5F5F5' }]}>
              <Bell color={alerts ? '#F57F17' : textSub} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: text }]}>Alertas de hidratação</Text>
              <Text style={[styles.settingHint, { color: textSub }]}>
                {alerts ? 'Lembretes ativados' : 'Lembretes desativados'}
              </Text>
            </View>
            <Switch
              value={alerts}
              onValueChange={setAlerts}
              trackColor={{ false: '#BBDEFB', true: '#F57F17' }}
              thumbColor="#fff"
            />
          </View>

        </View>

        {/* ── Botão sair ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut color="#C62828" size={18} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Modal calculadora ── */}
      <Modal visible={calcVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: cardBg }]}>

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Droplets color="#1565C0" size={20} />
                <Text style={[styles.modalTitle, { color: text }]}>Calcular meta de água</Text>
              </View>
              <TouchableOpacity onPress={() => { setCalcVisible(false); setCalcResult(null); setCalcWeight(''); setCalcAge(''); }}>
                <X color={textSub} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHint, { color: textSub }]}>
              A fórmula leva em conta seu peso e idade para estimar a ingestão diária ideal.
            </Text>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Peso (kg)</Text>
              <TextInput
                style={[styles.calcInputField, { color: text }]}
                placeholder="Ex: 70"
                placeholderTextColor={textSub}
                value={calcWeight}
                onChangeText={setCalcWeight}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.calcInput, { borderColor: border }]}>
              <Text style={[styles.calcInputLabel, { color: textSub }]}>Idade</Text>
              <TextInput
                style={[styles.calcInputField, { color: text }]}
                placeholder="Ex: 25"
                placeholderTextColor={textSub}
                value={calcAge}
                onChangeText={setCalcAge}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity onPress={handleCalc} activeOpacity={0.85}>
              <LinearGradient colors={['#1565C0', '#0D47A1']} style={styles.calcBtn}>
                <Text style={styles.calcBtnText}>Calcular</Text>
              </LinearGradient>
            </TouchableOpacity>

            {calcResult !== null && (
              <View style={styles.resultBox}>
                <Text style={[styles.resultLabel, { color: textSub }]}>Sua meta diária sugerida</Text>
                <View style={styles.resultValueRow}>
                  <Droplets color="#1565C0" size={22} />
                  <Text style={styles.resultValue}>{calcResult.toLocaleString()} ml</Text>
                </View>
                <Text style={[styles.resultSub, { color: textSub }]}>
                  ≈ {Math.round(calcResult / 250)} copos de 250 ml por dia
                </Text>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: 56, paddingBottom: 28,
    alignItems: 'center', gap: 6,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  headerName:  { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerEmail: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  body: { padding: 20, gap: 12, paddingBottom: 40 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '47%', borderRadius: 16, borderWidth: 2,
    padding: 14, alignItems: 'center', gap: 5,
    elevation: 3, shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  emojiCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  emojiText:   { fontSize: 26 },
  badgeTitle:  { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  badgeDesc:   { fontSize: 10, textAlign: 'center' },
  locked:      { fontSize: 9, color: '#aaa', marginTop: 2 },

  settingsCard: {
    borderRadius: 20, borderWidth: 1,
    overflow: 'hidden',
    elevation: 3, shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel:    { flex: 1, fontSize: 14, fontWeight: '600' },
  settingHint:     { fontSize: 11, marginTop: 1 },
  divider:         { height: 0.5, marginHorizontal: 16 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5', marginTop: 4,
  },
  logoutText: { color: '#C62828', fontSize: 15, fontWeight: '700' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 14,
    elevation: 20,
  },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle:    { fontSize: 17, fontWeight: '800' },
  modalHint:     { fontSize: 13, lineHeight: 18 },

  calcInput: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  calcInputLabel: { fontSize: 13, fontWeight: '600' },
  calcInputField: { fontSize: 15, fontWeight: '700', textAlign: 'right', flex: 1 },

  calcBtn:     { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  calcBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  resultBox: {
    backgroundColor: '#E3F2FD', borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#BBDEFB',
  },
  resultLabel:    { fontSize: 12, color: '#546E7A' },
  resultValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultValue:    { fontSize: 32, fontWeight: '900', color: '#1565C0' },
  resultSub:      { fontSize: 12 },
});